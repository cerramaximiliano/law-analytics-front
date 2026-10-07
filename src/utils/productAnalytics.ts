import axios, { AxiosInstance } from "axios";
import Cookies from "js-cookie";

import authTokenService from "services/authTokenService";
import { pushGTMEvent, GTMEvents } from "utils/gtm";

// ----------------------------------------------------------------------
// Analítica de producto (uso interior de la app).
//
// Contrato con el hub (law-analytics-server):
//   POST /api/activity/track  { events: [{ event, path, ts, sid, meta }] }  (<= 25, responde 204)
//   POST /api/activity/ping   { path, sid }                                  (responde 204)
//
// Reglas de privacidad: `path` siempre es un patrón de ruta (`/apps/folders/details/:id`),
// sin query ni hash; `meta` solo admite claves de la lista blanca y valores primitivos
// cortos. NUNCA se envían carátulas, nombres, números de expediente, correos ni texto libre.
//
// Todo falla en silencio: la analítica nunca debe romper la UI.
// ----------------------------------------------------------------------

export type ActivityEventName =
	| "screen_view"
	| "folder_create_start"
	| "folder_create_complete"
	| "causa_link_start"
	| "causa_link_success"
	| "causa_link_error"
	| "folder_detail_view"
	| "movement_open"
	| "calendar_event_create"
	| "google_calendar_sync"
	| "task_create"
	| "contact_create"
	| "calculator_run"
	| "postal_tracking_add"
	| "subscription_checkout_start"
	| "subscription_success"
	| "web_vitals"
	| "api_timing"
	| "api_error"
	| "frontend_error";

export type ActivityMeta = Partial<{
	jurisdiction: string;
	type: string;
	mode: string;
	source: string;
	plan: string;
	tab: string;
	status: string | number;
	error_code: string | number;
	endpoint_template: string;
	component: string;
	metric: string;
	value: number;
	duration_ms: number;
	count: number;
	step: string | number;
	message_trunc: string;
}>;

const ALLOWED_META_KEYS = new Set([
	"jurisdiction",
	"type",
	"mode",
	"source",
	"plan",
	"tab",
	"status",
	"error_code",
	"endpoint_template",
	"component",
	"metric",
	"value",
	"duration_ms",
	"count",
	"step",
	"message_trunc",
]);

const MAX_META_STRING = 80;
const MAX_BATCH = 25;
const FLUSH_SIZE = 20;
const FLUSH_INTERVAL_MS = 5000;
const MAX_QUEUE = 100;
const PING_INTERVAL_MS = 5 * 60 * 1000;

// Eventos de activación que además se empujan a GTM/GA4.
const GTM_ACTIVATION_EVENTS = new Set<ActivityEventName>([
	"folder_create_start",
	"folder_create_complete",
	"causa_link_start",
	"causa_link_success",
	"causa_link_error",
	"folder_detail_view",
	"movement_open",
	"calendar_event_create",
	"google_calendar_sync",
	"task_create",
	"contact_create",
	"calculator_run",
	"postal_tracking_add",
	"subscription_checkout_start",
	"subscription_success",
]);

// ----------------------------------------------------------------------
// Sanitizado
// ----------------------------------------------------------------------

const OBJECT_ID_RE = /^[a-f0-9]{24}$/i;
const UUID_RE = /^[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}$/i;
const LONG_TOKEN_RE = /^[A-Za-z0-9_-]{20,}$/;

/** Un segmento de ruta "parece un id" si es ObjectId, UUID, token largo o tiene >= 5 dígitos. */
export const isIdLikeSegment = (segment: string): boolean => {
	if (!segment) return false;
	if (OBJECT_ID_RE.test(segment) || UUID_RE.test(segment)) return true;
	if (LONG_TOKEN_RE.test(segment)) return true;
	const digits = segment.replace(/\D/g, "").length;
	if (digits >= 5) return true;
	if (segment.includes("@")) return true;
	return false;
};

/**
 * Reemplaza ids por `:id`, descarta query y hash y asegura que siempre empiece con "/".
 * Sirve tanto para rutas del front como para paths de endpoints de la API.
 */
export const normalizePath = (input: string | undefined | null): string => {
	if (!input) return "/";
	let p = String(input);
	// Si viene con origen (http://host/...), nos quedamos con el pathname.
	const proto = p.match(/^[a-z][a-z0-9+.-]*:\/\/[^/]+/i);
	if (proto) p = p.slice(proto[0].length);
	p = p.split("#")[0].split("?")[0];
	if (!p.startsWith("/")) p = `/${p}`;
	const segments = p.split("/").map((seg) => {
		if (!seg) return seg;
		let decoded = seg;
		try {
			decoded = decodeURIComponent(seg);
		} catch {
			/* segmento mal codificado: se usa tal cual */
		}
		return isIdLikeSegment(decoded) ? ":id" : seg;
	});
	const out = segments.join("/").replace(/\/{2,}/g, "/");
	return out.length > 1 ? out.replace(/\/$/, "") : out || "/";
};

/** Quita datos que puedan identificar a una persona o causa de un texto corto. */
export const scrubText = (text: string): string =>
	text
		.replace(/[\w.+-]+@[\w-]+\.[\w.-]+/g, ":email")
		.replace(/\b[a-f0-9]{24}\b/gi, ":id")
		.replace(/\b[0-9a-f]{8}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{4}-[0-9a-f]{12}\b/gi, ":id")
		.replace(/\b[A-Za-z0-9_-]{24,}\b/g, ":token")
		.replace(/\d{5,}/g, ":n")
		// eslint-disable-next-line no-control-regex
		.replace(/[\u0000-\u001f\u007f]/g, " ")
		.replace(/\s+/g, " ")
		.trim();

/** Deja solo claves permitidas con valores string (<= 80) / number / boolean. */
export const sanitizeMeta = (meta: Record<string, unknown> | undefined | null): Record<string, string | number | boolean> => {
	const out: Record<string, string | number | boolean> = {};
	if (!meta || typeof meta !== "object") return out;
	for (const key of Object.keys(meta)) {
		if (!ALLOWED_META_KEYS.has(key)) continue;
		const value = meta[key];
		if (typeof value === "string") {
			const clean = (key === "message_trunc" ? scrubText(value) : value.replace(/\s+/g, " ").trim()).slice(0, MAX_META_STRING);
			if (clean) out[key] = clean;
		} else if (typeof value === "number") {
			if (Number.isFinite(value)) out[key] = value;
		} else if (typeof value === "boolean") {
			out[key] = value;
		}
	}
	return out;
};

// ----------------------------------------------------------------------
// Sesión de pestaña
// ----------------------------------------------------------------------

let memorySid: string | null = null;

const randomId = (): string => {
	try {
		if (typeof crypto !== "undefined" && typeof crypto.randomUUID === "function") return crypto.randomUUID().replace(/-/g, "");
		if (typeof crypto !== "undefined" && crypto.getRandomValues) {
			const arr = new Uint8Array(16);
			crypto.getRandomValues(arr);
			return Array.from(arr, (b) => b.toString(16).padStart(2, "0")).join("");
		}
	} catch {
		/* cae al fallback */
	}
	return `${Date.now().toString(16)}${Math.random().toString(16).slice(2, 14)}`;
};

/** Id de sesión de pestaña (aleatorio, no derivado del usuario). */
export const getSessionId = (): string => {
	if (memorySid) return memorySid;
	try {
		const stored = sessionStorage.getItem("la_sid");
		if (stored) {
			memorySid = stored;
			return stored;
		}
		memorySid = randomId();
		sessionStorage.setItem("la_sid", memorySid);
	} catch {
		memorySid = memorySid || randomId();
	}
	return memorySid;
};

// ----------------------------------------------------------------------
// Cola y envío
// ----------------------------------------------------------------------

interface QueuedEvent {
	event: ActivityEventName;
	path: string;
	ts: number;
	sid: string;
	meta: Record<string, string | number | boolean>;
	retried?: boolean;
}

type AuthState = "unknown" | "on" | "off";

let authState: AuthState = "unknown";
let queue: QueuedEvent[] = [];
let flushTimer: ReturnType<typeof setTimeout> | null = null;
let listenersInstalled = false;
let pingTimer: ReturnType<typeof setInterval> | null = null;
let lastPingAt = 0;

const getBaseURL = (): string => (import.meta.env.VITE_BASE_URL as string | undefined) || "";

// Cliente propio: sin los interceptores globales (refresh de token / modal de sesión),
// una falla de telemetría no debe disparar nada en la UI.
let client: AxiosInstance | null = null;
const getClient = (): AxiosInstance => {
	if (!client) {
		client = axios.create({ baseURL: getBaseURL(), timeout: 10000, withCredentials: true });
		client.interceptors.request.use((config) => {
			let token: string | null | undefined;
			try {
				token = Cookies.get("auth_token") || authTokenService.getToken();
			} catch {
				token = null;
			}
			if (token && config.headers) config.headers.Authorization = `Bearer ${token}`;
			return config;
		});
	}
	return client;
};

const currentPath = (): string => {
	try {
		return normalizePath(window.location.pathname);
	} catch {
		return "/";
	}
};

const scheduleFlush = () => {
	if (flushTimer || authState !== "on") return;
	flushTimer = setTimeout(() => {
		flushTimer = null;
		flushActivityQueue();
	}, FLUSH_INTERVAL_MS);
};

const send = (batch: QueuedEvent[], useBeacon: boolean) => {
	const payload = {
		events: batch.map(({ event, path, ts, sid, meta }) => ({ event, path, ts, sid, meta })),
	};
	if (useBeacon && typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
		try {
			const ok = navigator.sendBeacon(`${getBaseURL()}/api/activity/track`, new Blob([JSON.stringify(payload)], { type: "text/plain" }));
			if (ok) return;
		} catch {
			/* cae al POST normal */
		}
	}
	getClient()
		.post("/api/activity/track", payload)
		.catch(() => {
			// Un solo reintento por evento, con la cola acotada.
			const retry = batch.filter((e) => !e.retried).map((e) => ({ ...e, retried: true }));
			if (retry.length && authState === "on") {
				queue = [...retry, ...queue].slice(-MAX_QUEUE);
				scheduleFlush();
			}
		});
};

/** Envía lo pendiente. `useBeacon` se usa al ocultar/cerrar la pestaña. */
export const flushActivityQueue = (useBeacon = false): void => {
	try {
		if (authState !== "on" || queue.length === 0) return;
		if (flushTimer) {
			clearTimeout(flushTimer);
			flushTimer = null;
		}
		while (queue.length) {
			send(queue.splice(0, MAX_BATCH), useBeacon);
		}
	} catch {
		/* silencio */
	}
};

const installListeners = () => {
	if (listenersInstalled || typeof window === "undefined") return;
	listenersInstalled = true;
	document.addEventListener("visibilitychange", () => {
		if (document.visibilityState === "hidden") {
			flushActivityQueue(true);
		} else if (authState === "on" && Date.now() - lastPingAt >= PING_INTERVAL_MS) {
			sendPing();
		}
	});
	window.addEventListener("pagehide", () => flushActivityQueue(true));
};

// ----------------------------------------------------------------------
// Ping de actividad
// ----------------------------------------------------------------------

const sendPing = () => {
	try {
		if (authState !== "on") return;
		lastPingAt = Date.now();
		getClient()
			.post("/api/activity/ping", { path: currentPath(), sid: getSessionId() })
			.catch(() => {});
	} catch {
		/* silencio */
	}
};

const startPing = () => {
	if (pingTimer) return;
	if (typeof document === "undefined" || document.visibilityState === "visible") sendPing();
	pingTimer = setInterval(() => {
		if (typeof document !== "undefined" && document.visibilityState !== "visible") return;
		sendPing();
	}, PING_INTERVAL_MS);
};

const stopPing = () => {
	if (pingTimer) clearInterval(pingTimer);
	pingTimer = null;
};

/**
 * Lo llama el AuthProvider: "on" cuando hay usuario autenticado, "off" cuando se
 * inicializó sin sesión (o tras logout). Mientras es "unknown" los eventos se retienen.
 */
export const setProductAnalyticsAuth = (isLoggedIn: boolean): void => {
	try {
		installListeners();
		const next: AuthState = isLoggedIn ? "on" : "off";
		if (next === authState) return;
		authState = next;
		if (next === "on") {
			startPing();
			if (queue.length) scheduleFlush();
		} else {
			queue = [];
			if (flushTimer) clearTimeout(flushTimer);
			flushTimer = null;
			stopPing();
		}
	} catch {
		/* silencio */
	}
};

// ----------------------------------------------------------------------
// API pública
// ----------------------------------------------------------------------

interface TrackOptions {
	/** Empuja también al dataLayer (GTM/GA4). Por defecto, solo los eventos de activación. */
	gtm?: boolean;
	/** Fuerza el path (ya en patrón) en lugar del de la URL actual. */
	path?: string;
	/** Si es true, no se envía al hub (solo dataLayer). */
	gtmOnly?: boolean;
}

/** Registra un evento de producto. Nunca lanza. */
export const trackActivity = (event: ActivityEventName, meta?: ActivityMeta, options: TrackOptions = {}): void => {
	try {
		const cleanMeta = sanitizeMeta(meta as Record<string, unknown> | undefined);
		const path = options.path ?? currentPath();

		if (options.gtm ?? GTM_ACTIVATION_EVENTS.has(event)) {
			const gtmEvent = (GTMEvents as Record<string, string>)[event.toUpperCase()] ?? event;
			pushGTMEvent(gtmEvent, { ...cleanMeta, path_template: path });
		}

		if (options.gtmOnly || authState === "off" || typeof window === "undefined") return;
		installListeners();

		queue.push({ event, path, ts: Date.now(), sid: getSessionId(), meta: cleanMeta });
		if (queue.length > MAX_QUEUE) queue = queue.slice(-MAX_QUEUE);

		if (authState === "on") {
			if (queue.length >= FLUSH_SIZE) flushActivityQueue();
			else scheduleFlush();
		}
	} catch {
		/* silencio */
	}
};

// ----------------------------------------------------------------------
// screen_view
// ----------------------------------------------------------------------

let lastScreenPath: string | null = null;

/** Un screen_view por cambio de ruta (patrón, sin query ni hash). También va al dataLayer. */
export const trackScreenView = (pathname: string): void => {
	const path = normalizePath(pathname);
	if (path === lastScreenPath) return;
	lastScreenPath = path;
	trackActivity("screen_view", undefined, { path, gtm: true });
};

// ----------------------------------------------------------------------
// Web Vitals
// ----------------------------------------------------------------------

const reportedVitals = new Set<string>();

interface VitalMetric {
	name: string;
	value: number;
	navigationType?: string;
}

/** Una vez por métrica y página. En rutas públicas solo llega al dataLayer (el hub exige sesión). */
export const reportVital = (metric: VitalMetric): void => {
	try {
		const path = currentPath();
		const key = `${metric.name}:${path}`;
		if (reportedVitals.has(key)) return;
		reportedVitals.add(key);
		const isMobile = typeof window !== "undefined" && window.innerWidth < 768;
		const value = metric.name === "CLS" ? Math.round(metric.value * 1000) / 1000 : Math.round(metric.value);
		trackActivity(
			"web_vitals",
			{ metric: metric.name, value, type: isMobile ? "mobile" : "desktop", mode: metric.navigationType },
			{ gtm: true, path },
		);
	} catch {
		/* silencio */
	}
};

// ----------------------------------------------------------------------
// Tiempos y errores de API
// ----------------------------------------------------------------------

const SLOW_MS = 3000;
const instrumented = new WeakSet<object>();

const errorCodeFrom = (error: any): string => {
	const data = error?.response?.data;
	const raw = data?.error?.code ?? data?.code ?? data?.errorCode ?? error?.code;
	if (typeof raw === "string" || typeof raw === "number") return String(raw).slice(0, MAX_META_STRING);
	return error?.response?.status ? `http_${error.response.status}` : "unknown";
};

/** Instala interceptores (solo lectura) que miden duración y errores de la instancia. Idempotente. */
export const installApiMetrics = (instance: AxiosInstance): void => {
	try {
		if (!instance || instrumented.has(instance)) return;
		instrumented.add(instance);

		instance.interceptors.request.use((config) => {
			(config as any).__t0 = typeof performance !== "undefined" ? performance.now() : Date.now();
			return config;
		});

		const template = (config: any): string => {
			const raw = String(config?.url || "");
			return normalizePath(raw).slice(0, MAX_META_STRING);
		};
		const elapsed = (config: any): number | null => {
			const t0 = config?.__t0;
			if (typeof t0 !== "number") return null;
			const now = typeof performance !== "undefined" ? performance.now() : Date.now();
			return Math.round(now - t0);
		};
		const isOwnTelemetry = (config: any) => String(config?.url || "").includes("/activity/");

		instance.interceptors.response.use(
			(response) => {
				try {
					const duration = elapsed(response.config);
					if (duration !== null && duration > SLOW_MS && !isOwnTelemetry(response.config)) {
						trackActivity("api_timing", {
							endpoint_template: template(response.config),
							status: response.status,
							duration_ms: duration,
						});
					}
				} catch {
					/* silencio */
				}
				return response;
			},
			(error) => {
				try {
					const config = error?.config;
					const status: number = error?.response?.status ?? 0;
					const canceled = error?.code === "ERR_CANCELED" || axios.isCancel?.(error);
					if (config && !isOwnTelemetry(config) && status !== 401 && !canceled && (status >= 400 || status === 0)) {
						const endpoint_template = template(config);
						const duration = elapsed(config);
						if (status >= 400 && duration !== null) {
							trackActivity("api_timing", { endpoint_template, status, duration_ms: duration });
						}
						trackActivity("api_error", { endpoint_template, status, error_code: errorCodeFrom(error) });
					}
				} catch {
					/* silencio */
				}
				return Promise.reject(error);
			},
		);
	} catch {
		/* silencio */
	}
};

// ----------------------------------------------------------------------
// Errores de front
// ----------------------------------------------------------------------

const ERROR_DEDUP_MS = 60 * 1000;
const MAX_ERRORS_PER_SESSION = 10;
const recentErrors = new Map<string, number>();
let errorsSent = 0;

/** frontend_error con deduplicación (misma firma 1/min) y tope por sesión. */
export const reportFrontendError = (component: string, message: string, errorCode?: string): void => {
	try {
		if (errorsSent >= MAX_ERRORS_PER_SESSION) return;
		const msg = scrubText(String(message || "")).slice(0, MAX_META_STRING);
		const signature = `${component}|${errorCode ?? ""}|${msg}`;
		const now = Date.now();
		const last = recentErrors.get(signature);
		if (last !== undefined && now - last < ERROR_DEDUP_MS) return;
		recentErrors.set(signature, now);
		errorsSent += 1;
		trackActivity("frontend_error", { component, message_trunc: msg, error_code: errorCode });
	} catch {
		/* silencio */
	}
};

let globalErrorHandlersInstalled = false;

export const installGlobalErrorHandlers = (): void => {
	if (globalErrorHandlersInstalled || typeof window === "undefined") return;
	globalErrorHandlersInstalled = true;
	window.addEventListener("error", (e: ErrorEvent) => {
		// Errores de carga de recursos (img/script) llegan sin message de error: se ignoran.
		if (!e.message) return;
		reportFrontendError("window.onerror", e.message, e.error?.name || "Error");
	});
	window.addEventListener("unhandledrejection", (e: PromiseRejectionEvent) => {
		const reason: any = e.reason;
		// Las respuestas HTTP fallidas ya se miden como api_error.
		if (reason?.isAxiosError) return;
		const message = typeof reason === "string" ? reason : reason?.message || "unhandled_rejection";
		reportFrontendError("unhandledrejection", message, reason?.name || "UnhandledRejection");
	});
};

/** Solo para tests. */
export const __resetProductAnalyticsForTests = (): void => {
	authState = "unknown";
	queue = [];
	lastScreenPath = null;
	reportedVitals.clear();
	recentErrors.clear();
	errorsSent = 0;
	if (flushTimer) clearTimeout(flushTimer);
	flushTimer = null;
	stopPing();
};

export const __getQueueForTests = (): readonly QueuedEvent[] => queue;

/** Origen aproximado (sección de la app) de una acción, a partir de la ruta actual. */
export const inferSource = (): string => {
	const p = currentPath();
	if (p.startsWith("/apps/calendar")) return "calendar";
	if (p.startsWith("/apps/folders/details")) return "folder_detail";
	if (p.startsWith("/apps/folders")) return "folders";
	if (p.startsWith("/dashboard")) return "dashboard";
	if (p.startsWith("/tasks")) return "tasks";
	if (p.startsWith("/apps/customer") || p.startsWith("/apps/contacts")) return "contacts";
	return "other";
};

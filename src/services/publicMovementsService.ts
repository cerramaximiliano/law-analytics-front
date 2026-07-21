// Service de la vista pública de documentos de movimientos (/m/:token).
//
// Wrappea el endpoint PÚBLICO (sin auth) de law-analytics-server:
//   GET /api/public/movimientos/:token
//
// A diferencia de pjnMovementsService, NO usa withCredentials — el token
// firmado es la única credencial y la página puede verse sin sesión.

import axios from "axios";
import type { PublicMovementDocResponse } from "types/publicMovement";

function getBaseUrl(): string {
	// Mismo patrón que pjnMovementsService.ts / judicialMovementsService.ts
	if (process.env.NODE_ENV === "production" && typeof window !== "undefined" && window.location.hostname === "lawanalytics.app") {
		return "https://server.lawanalytics.app";
	}
	return "";
}

// Pide la metadata + presigned URL del documento de un movimiento por token.
// Los errores esperados (401 token expirado/inválido, 404 no encontrado) traen
// el body con `reason`/`fallbackUrl` — se devuelven en vez de lanzar.
//
// `silent` = refresco de la presigned URL en una pestaña ya abierta. Viaja con
// ?refresh=1 para que el server NO lo cuente como una apertura nueva (si no,
// una pestaña abierta horas generaría una apertura falsa cada 4 min).
export async function getPublicMovementDoc(token: string, silent = false): Promise<PublicMovementDocResponse> {
	const refreshParam = silent ? "?refresh=1" : "";
	const url = `${getBaseUrl()}/api/public/movimientos/${encodeURIComponent(token)}${refreshParam}`;
	try {
		const response = await axios.get<PublicMovementDocResponse>(url);
		return response.data;
	} catch (err: any) {
		if (axios.isAxiosError(err) && err.response?.data && [400, 401, 404].includes(err.response.status)) {
			return err.response.data as PublicMovementDocResponse;
		}
		throw err;
	}
}

export type PublicMovementBeaconEvent = "view_confirmed" | "cta_click" | "download" | "fallback_click" | "login_continue" | "promo_click";

// Sub-acción opcional de un cta_click (botones de acción rápida de la vista).
export type PublicMovementBeaconAction = "vencimiento" | "nota" | "tarea";

// Beacon de interacciones de la vista pública. Atribución server-side (el token
// trae userId/causaId) que GA4 anónimo no puede dar. Fire-and-forget: usa
// navigator.sendBeacon (sobrevive al unload, ej. click en CTA que navega) y cae
// a fetch keepalive si no está disponible. Nunca lanza.
export function sendPublicMovementEvent(
	token: string,
	event: PublicMovementBeaconEvent,
	source?: string,
	action?: PublicMovementBeaconAction,
): void {
	try {
		const sourceParam = source ? `?source=${encodeURIComponent(source)}` : "";
		const url = `${getBaseUrl()}/api/public/movimientos/${encodeURIComponent(token)}/event${sourceParam}`;
		const body = JSON.stringify(action ? { event, action } : { event });
		if (typeof navigator !== "undefined" && typeof navigator.sendBeacon === "function") {
			const blob = new Blob([body], { type: "application/json" });
			navigator.sendBeacon(url, blob);
			return;
		}
		void fetch(url, { method: "POST", headers: { "Content-Type": "application/json" }, body, keepalive: true }).catch(() => {});
	} catch {
		// Tracking best-effort: nunca romper la UX por un beacon.
	}
}

// ---------------------------------------------------------------------------
// login_continue — cierra el funnel "¿hizo login para seguir trabajando?".
//
// El click en el CTA de /m/:token deja un flag en sessionStorage (sobrevive al
// redirect de login porque es la misma pestaña/SPA). Cuando el usuario llega
// AUTENTICADO a cualquier ruta protegida, AuthGuard hace flush: emite el beacon
// `login_continue` con el mismo token (la credencial de atribución) y limpia.
// Si abandona el login y vuelve otro día, la pestaña nueva no tiene el flag y
// el TTL descarta sesiones viejas de la misma pestaña.
// ---------------------------------------------------------------------------

const LOGIN_CONTINUE_KEY = "la.movementLoginContinue";
const LOGIN_CONTINUE_TTL_MS = 60 * 60 * 1000; // 1 hora: "siguió trabajando" es acción inmediata al email.

export function markPendingLoginContinue(token: string, source?: string): void {
	try {
		sessionStorage.setItem(LOGIN_CONTINUE_KEY, JSON.stringify({ token, source: source || null, ts: Date.now() }));
	} catch {
		// sessionStorage puede no estar disponible (Safari private, etc.) — best-effort.
	}
}

export function flushPendingLoginContinue(): void {
	try {
		const raw = sessionStorage.getItem(LOGIN_CONTINUE_KEY);
		if (!raw) return;
		// Limpiar ANTES de emitir: el evento es de una sola vez por click de CTA.
		sessionStorage.removeItem(LOGIN_CONTINUE_KEY);
		const pending = JSON.parse(raw) as { token?: string; source?: string | null; ts?: number };
		if (!pending?.token || typeof pending.ts !== "number") return;
		if (Date.now() - pending.ts > LOGIN_CONTINUE_TTL_MS) return;
		sendPublicMovementEvent(pending.token, "login_continue", pending.source || undefined);
	} catch {
		// Best-effort.
	}
}

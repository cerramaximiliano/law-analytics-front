// Attribution capture utility
//
// Stores acquisition data in localStorage so it survives navigation between
// landing → /register. Two slots:
//   - first_touch: never overwritten (set once per browser)
//   - last_touch:  overwritten whenever the URL carries new attribution params
//
// Captured fields: UTM params, gclid, fbclid, referrer, landing path.
// The payload is sent to the backend on register / google login.

const FIRST_TOUCH_KEY = "la_attr_first_touch";
const LAST_TOUCH_KEY = "la_attr_last_touch";

export interface AttributionTouch {
	source: string | null;
	medium: string | null;
	campaign: string | null;
	content: string | null;
	term: string | null;
	gclid: string | null;
	fbclid: string | null;
	referrer: string | null;
	landingPath: string | null;
	capturedAt: string; // ISO date
}

export interface AttributionPayload {
	firstTouch: AttributionTouch | null;
	lastTouch: AttributionTouch | null;
	internalSource: string | null;
	internalFeature: string | null;
}

const safeStorage = {
	get: (key: string): string | null => {
		try {
			return typeof window !== "undefined" ? window.localStorage.getItem(key) : null;
		} catch {
			return null;
		}
	},
	set: (key: string, value: string): void => {
		try {
			if (typeof window !== "undefined") window.localStorage.setItem(key, value);
		} catch {
			/* localStorage disabled (private mode, quota, etc.) */
		}
	},
	remove: (key: string): void => {
		try {
			if (typeof window !== "undefined") window.localStorage.removeItem(key);
		} catch {
			/* noop */
		}
	},
};

const readTouch = (key: string): AttributionTouch | null => {
	const raw = safeStorage.get(key);
	if (!raw) return null;
	try {
		return JSON.parse(raw) as AttributionTouch;
	} catch {
		return null;
	}
};

const buildTouchFromURL = (): AttributionTouch | null => {
	if (typeof window === "undefined") return null;
	const params = new URLSearchParams(window.location.search);

	const utmSource = params.get("utm_source");
	const utmMedium = params.get("utm_medium");
	const utmCampaign = params.get("utm_campaign");
	const utmContent = params.get("utm_content");
	const utmTerm = params.get("utm_term");
	const gclid = params.get("gclid");
	const fbclid = params.get("fbclid");

	// Si no hay NINGUNA señal de atribución en la URL, no creamos touch nuevo.
	// (Evita sobrescribir last_touch con un navegamiento interno cualquiera.)
	const hasSignal = utmSource || utmMedium || utmCampaign || gclid || fbclid;
	if (!hasSignal) return null;

	// Filtramos referrers del mismo dominio (navegación interna no es adquisición).
	let referrer: string | null = null;
	try {
		if (document.referrer) {
			const refHost = new URL(document.referrer).hostname;
			if (refHost && refHost !== window.location.hostname) {
				referrer = document.referrer;
			}
		}
	} catch {
		referrer = document.referrer || null;
	}

	return {
		source: utmSource,
		medium: utmMedium,
		campaign: utmCampaign,
		content: utmContent,
		term: utmTerm,
		gclid,
		fbclid,
		referrer,
		landingPath: window.location.pathname + window.location.search,
		capturedAt: new Date().toISOString(),
	};
};

/**
 * Captura UTMs/gclid/fbclid/referrer al ingreso. Idempotente: llamar en cada
 * pageview es seguro. Solo escribe si la URL tiene señales nuevas.
 */
export const captureAttribution = (): void => {
	const touch = buildTouchFromURL();
	if (!touch) return;

	const serialized = JSON.stringify(touch);

	// first_touch: solo si no existe.
	if (!safeStorage.get(FIRST_TOUCH_KEY)) {
		safeStorage.set(FIRST_TOUCH_KEY, serialized);
	}

	// last_touch: siempre que haya señal nueva.
	safeStorage.set(LAST_TOUCH_KEY, serialized);
};

/**
 * Devuelve el payload que mandamos al backend al registrar/loguear.
 * Los internal source/feature vienen de los CTAs internos (?source=hero&feature=causas).
 */
export const getAttributionPayload = (internalSource?: string | null, internalFeature?: string | null): AttributionPayload => {
	return {
		firstTouch: readTouch(FIRST_TOUCH_KEY),
		lastTouch: readTouch(LAST_TOUCH_KEY),
		internalSource: internalSource ?? null,
		internalFeature: internalFeature ?? null,
	};
};

/**
 * Limpia los touches almacenados. Útil para tests / debug.
 */
export const clearAttribution = (): void => {
	safeStorage.remove(FIRST_TOUCH_KEY);
	safeStorage.remove(LAST_TOUCH_KEY);
};

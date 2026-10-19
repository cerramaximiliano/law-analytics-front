/**
 * Traspaso de sesión desde la app móvil (ruta pública /handoff).
 *
 * La app abre `https://lawanalytics.app/handoff#t=<token>&next=<ruta>`: el token va en el
 * fragmento, que nunca viaja al servidor ni queda en logs ni en el Referer. La página lo
 * canjea UNA vez en `POST /api/auth/handoff/redeem` (el hub setea las cookies de sesión) y
 * recarga en `next`. Lógica pura acá para testearla sin DOM.
 */
import { APP_DEFAULT_PATH } from "config";

/** Mismo criterio que GuestGuard: solo rutas internas (anti open-redirect). */
export const sanitizeInternalPath = (raw?: string | null): string | null => {
	if (!raw) return null;
	if (!raw.startsWith("/") || raw.startsWith("//") || raw.startsWith("/\\")) return null;
	if (raw === "/login" || raw === "/register" || raw.startsWith("/handoff")) return null;
	return raw;
};

export interface HandoffParams {
	token: string | null;
	next: string;
}

const TOKEN_PATTERN = /^[A-Za-z0-9_-]{40,64}$/;

/** `#t=...&next=...` → { token, next }. `next` inválido o ausente cae al panel. */
export function parseHandoffHash(hash: string): HandoffParams {
	const params = new URLSearchParams(hash.replace(/^#/, ""));
	const t = params.get("t");
	return {
		token: t && TOKEN_PATTERN.test(t) ? t : null,
		next: sanitizeInternalPath(params.get("next")) ?? APP_DEFAULT_PATH,
	};
}

/** A dónde mandar si el canje falla: el login con el destino, para no perder adónde iba. */
export const loginFallbackPath = (next: string) => `/login?redirect=${encodeURIComponent(next)}`;

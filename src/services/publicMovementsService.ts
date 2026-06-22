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

export type PublicMovementBeaconEvent = "view_confirmed" | "cta_click" | "download" | "fallback_click";

// Beacon de interacciones de la vista pública. Atribución server-side (el token
// trae userId/causaId) que GA4 anónimo no puede dar. Fire-and-forget: usa
// navigator.sendBeacon (sobrevive al unload, ej. click en CTA que navega) y cae
// a fetch keepalive si no está disponible. Nunca lanza.
export function sendPublicMovementEvent(token: string, event: PublicMovementBeaconEvent, source?: string): void {
	try {
		const sourceParam = source ? `?source=${encodeURIComponent(source)}` : "";
		const url = `${getBaseUrl()}/api/public/movimientos/${encodeURIComponent(token)}/event${sourceParam}`;
		const body = JSON.stringify({ event });
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

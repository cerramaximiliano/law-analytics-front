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
export async function getPublicMovementDoc(token: string): Promise<PublicMovementDocResponse> {
	const url = `${getBaseUrl()}/api/public/movimientos/${encodeURIComponent(token)}`;
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

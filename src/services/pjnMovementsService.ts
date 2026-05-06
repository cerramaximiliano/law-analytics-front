// Service del viewer de movimientos PJN (Fase 7a).
//
// Wrappea los 2 endpoints de law-analytics-server:
//   GET /api/folders/:folderId/movimientos                 (listado paginado)
//   GET /api/folders/:folderId/movimientos/:movementId/pdf-url  (presigned URL)
//
// Coexiste con getMovementsByFolderId (action Redux) que sigue usando el
// endpoint viejo para la vista clásica del expediente.

import axios from "axios";
import type {
	PjnMovementsListParams,
	PjnMovementsListResponse,
	PjnMovementPdfUrlResponse,
} from "types/pjnMovement";

function getBaseUrl(): string {
	// Mismo patrón que judicialMovementsService.ts
	if (
		process.env.NODE_ENV === "production" &&
		typeof window !== "undefined" &&
		window.location.hostname === "lawanalytics.app"
	) {
		return "https://server.lawanalytics.app";
	}
	return "";
}

function buildQueryString(params?: PjnMovementsListParams): string {
	if (!params) return "";
	const sp = new URLSearchParams();
	if (params.page !== undefined) sp.append("page", String(params.page));
	if (params.limit !== undefined) sp.append("limit", String(params.limit));
	if (params.sort) sp.append("sort", params.sort);
	if (params.search) sp.append("search", params.search);
	if (params.pdfStatus) sp.append("filter[pdfStatus]", params.pdfStatus);
	if (params.hasUrl !== undefined) sp.append("filter[hasUrl]", String(params.hasUrl));
	if (params.dateFrom) sp.append("filter[dateFrom]", params.dateFrom);
	if (params.dateTo) sp.append("filter[dateTo]", params.dateTo);
	const s = sp.toString();
	return s ? `?${s}` : "";
}

// Lista paginada de movimientos del folder leídos desde pjn-movements.
export async function getPjnMovementsByFolder(
	folderId: string,
	params?: PjnMovementsListParams,
): Promise<PjnMovementsListResponse> {
	const url = `${getBaseUrl()}/api/folders/${folderId}/movimientos${buildQueryString(params)}`;
	const response = await axios.get<PjnMovementsListResponse>(url, {
		withCredentials: true,
	});
	return response.data;
}

// Presigned URL del PDF (5 min). Devuelve null en pdfUrl si no hay PDF disponible
// (en ese caso fallbackUrl puede traer el link original al PJN).
export async function getPjnMovementPdfUrl(
	folderId: string,
	movementId: string,
): Promise<PjnMovementPdfUrlResponse> {
	// movementId tiene formato "{causaId}:{sourceId}" — necesita encoding por los ":"
	const encoded = encodeURIComponent(movementId);
	const url = `${getBaseUrl()}/api/folders/${folderId}/movimientos/${encoded}/pdf-url`;
	try {
		const response = await axios.get<PjnMovementPdfUrlResponse>(url, {
			withCredentials: true,
		});
		return response.data;
	} catch (err: any) {
		// 404 con fallbackUrl es un caso esperado, no un error real
		if (axios.isAxiosError(err) && err.response?.status === 404 && err.response.data) {
			return err.response.data as PjnMovementPdfUrlResponse;
		}
		throw err;
	}
}

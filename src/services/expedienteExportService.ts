// Service de la exportación del expediente PJN completo a PDF.
//
// Wrappea los 2 endpoints de law-analytics-server:
//   GET  /api/folders/:folderId/expediente-export   (estimación + job vigente)
//   POST /api/folders/:folderId/expediente-export   (encola la generación)

import axios from "axios";
import type { ExpedienteExportOrder, ExpedienteExportResponse } from "types/expedienteExport";

function getBaseUrl(): string {
	// Mismo patrón que pjnMovementsService.ts
	if (process.env.NODE_ENV === "production" && typeof window !== "undefined" && window.location.hostname === "lawanalytics.app") {
		return "https://server.lawanalytics.app";
	}
	return "";
}

export async function getExpedienteExport(folderId: string): Promise<ExpedienteExportResponse> {
	const response = await axios.get<ExpedienteExportResponse>(`${getBaseUrl()}/api/folders/${folderId}/expediente-export`, {
		withCredentials: true,
	});
	return response.data;
}

export async function createExpedienteExport(folderId: string, order: ExpedienteExportOrder): Promise<ExpedienteExportResponse> {
	try {
		const response = await axios.post<ExpedienteExportResponse>(
			`${getBaseUrl()}/api/folders/${folderId}/expediente-export`,
			{ order },
			{ withCredentials: true },
		);
		return response.data;
	} catch (err: any) {
		// 403 de plan: el body trae requiresUpgrade, no es un error real.
		if (axios.isAxiosError(err) && err.response?.status === 403 && err.response.data?.requiresUpgrade) {
			return err.response.data as ExpedienteExportResponse;
		}
		throw err;
	}
}

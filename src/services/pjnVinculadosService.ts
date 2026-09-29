import axios from "axios";
import type { PjnVinculadosResponse } from "types/pjnVinculados";

function getBaseUrl(): string {
	// Mismo patrón que pjnMovementsService.ts
	if (process.env.NODE_ENV === "production" && typeof window !== "undefined" && window.location.hostname === "lawanalytics.app") {
		return "https://server.lawanalytics.app";
	}
	return "";
}

// Incidentes del principal (pestaña Vinculados del portal) con estado por fila.
export async function getPjnVinculadosByFolder(folderId: string): Promise<PjnVinculadosResponse> {
	const response = await axios.get<PjnVinculadosResponse>(`${getBaseUrl()}/api/folders/${folderId}/vinculados`, {
		withCredentials: true,
	});
	return response.data;
}

import axios from "axios";

function getBaseUrl(): string {
	// Mismo patrón que pjnVinculadosService.ts
	if (process.env.NODE_ENV === "production" && typeof window !== "undefined" && window.location.hostname === "lawanalytics.app") {
		return "https://server.lawanalytics.app";
	}
	return "";
}

export interface CarpetaRef {
	folderId: string;
	archived: boolean;
}
export interface RelacionesData {
	acumulacion: null | {
		rol: "acumulada" | null;
		fecha: string | null;
		tipo: string | null;
		detalle: string | null;
		otra: null | { number: number; year: number; carpeta: CarpetaRef | null };
		resync: null | { at: string; retirados: number; incorporados: number };
	};
	acumuladas: Array<{
		number: number;
		year: number;
		incidente: string | null;
		fecha: string | null;
		rol: string | null;
		carpeta: CarpetaRef | null;
	}>;
	principal: null | { number: number; year: number; fuero: string; incidente: string; carpeta: CarpetaRef | null };
}

// Acumulación, acumuladas a ésta y principal (pestaña "Expedientes relacionados").
export async function getRelacionesByFolder(folderId: string): Promise<RelacionesData> {
	const r = await axios.get<{ success: boolean; data: RelacionesData }>(`${getBaseUrl()}/api/folders/${folderId}/relaciones`, {
		withCredentials: true,
	});
	return r.data.data;
}

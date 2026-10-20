import axios from "utils/axios";

// Plazos automáticos (beta, 2026-10): sugerencias de vencimiento a partir de las cédulas de las
// causas del PJN. Backend: law-analytics-server /api/plazos-automaticos.

export interface PlazosAutomaticosConfig {
	activo: boolean;
	cuit: string | null;
	activadoEn: string | null;
}

export const getPlazosAutomaticosConfig = async (): Promise<PlazosAutomaticosConfig> => {
	const { data } = await axios.get("/api/plazos-automaticos/config");
	return data.data;
};

export const savePlazosAutomaticosConfig = async (cambios: {
	activo?: boolean;
	cuit?: string | null;
}): Promise<PlazosAutomaticosConfig> => {
	const { data } = await axios.put("/api/plazos-automaticos/config", cambios);
	return data.data;
};

export const enviarFeedbackPlazo = async (body: {
	eventId?: string;
	notificationId?: string;
	correcto: boolean;
	comentario?: string;
}): Promise<{ ok: boolean; eventoArchivado: boolean }> => {
	const { data } = await axios.post("/api/plazos-automaticos/feedback", body);
	return data.data;
};

// Parte que el usuario representa en la carpeta (P15): las cédulas dirigidas a esa parte o a sus
// letrados se proponen como propias. Sin elección, se detecta sola (sus CUIT entre los letrados).
export interface PlazosParteOpcion {
	intervinienteId: string;
	nombre: string;
	tipo: string | null;
	letrados: number;
	sugerida: boolean;
	elegida: boolean;
}

export interface PlazosParteVista {
	soportada: boolean;
	activo: boolean;
	fuente: "usuario" | "auto" | null;
	ninguna: boolean;
	partes: PlazosParteOpcion[];
	reevaluacion?: { revisados: number; actualizados: number } | null;
}

export const getPlazosParte = async (folderId: string): Promise<PlazosParteVista> => {
	const { data } = await axios.get(`/api/plazos-automaticos/carpetas/${folderId}/parte`);
	return data.data;
};

export const savePlazosParte = async (folderId: string, body: { partes: string[] } | { auto: true }): Promise<PlazosParteVista> => {
	const { data } = await axios.put(`/api/plazos-automaticos/carpetas/${folderId}/parte`, body);
	return data.data;
};

// ── Tipo de proceso de la causa (P21/P22) ─────────────────────────────────────
// Lo detecta el pipeline de plazos; el usuario puede indicarlo desde la carpeta (gana sobre lo detectado).
export type TipoProceso = "ordinario" | "sumario" | "especial";

export interface TipoProcesoVista {
	aplica: boolean;
	fuero?: string;
	tipo?: TipoProceso | null;
	fuente?: string | null;
	indicadoPorMi?: TipoProceso | null;
	sugerencia?: TipoProceso | null;
	reencoladas?: number;
}

export const getTipoProceso = async (folderId: string): Promise<TipoProcesoVista> => {
	const { data } = await axios.get(`/api/plazos-automaticos/carpetas/${folderId}/tipo-proceso`);
	return data.data;
};

export const saveTipoProceso = async (folderId: string, tipo: TipoProceso | null): Promise<TipoProcesoVista> => {
	const { data } = await axios.put(`/api/plazos-automaticos/carpetas/${folderId}/tipo-proceso`, { tipo });
	return data.data;
};

// Dígito verificador de CUIT/CUIL (módulo 11), igual que el backend.
export const cuitValido = (cuit: string): boolean => {
	const c = String(cuit || "").replace(/\D/g, "");
	if (c.length !== 11) return false;
	const pesos = [5, 4, 3, 2, 7, 6, 5, 4, 3, 2];
	const suma = pesos.reduce((acc, p, i) => acc + p * Number(c[i]), 0);
	let dv = 11 - (suma % 11);
	if (dv === 11) dv = 0;
	if (dv === 10) return false;
	return dv === Number(c[10]);
};

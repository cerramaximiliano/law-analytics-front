// Service de la sección pública de jurisprudencia (/jurisprudencia).
//
// Wrappea los endpoints PÚBLICOS (sin auth) de law-analytics-server:
//   GET /api/public/sentencias?page=&limit=&fuero=&search=
//   GET /api/public/sentencias/:id
//
// Mismo patrón que publicMovementsService: axios crudo sin withCredentials —
// es contenido abierto, sin sesión.

import axios from "axios";
import type { PublicSentenciasListResponse, PublicSentenciaDetailResponse } from "types/publicSentencia";

function getBaseUrl(): string {
	if (process.env.NODE_ENV === "production" && typeof window !== "undefined" && window.location.hostname === "lawanalytics.app") {
		return "https://server.lawanalytics.app";
	}
	return "";
}

export interface PublicSentenciasListParams {
	page?: number;
	limit?: number;
	fuero?: string;
	jurisdiccion?: string;
	search?: string;
}

export async function getPublicSentencias(params: PublicSentenciasListParams = {}): Promise<PublicSentenciasListResponse> {
	const query = new URLSearchParams();
	if (params.page) query.set("page", String(params.page));
	if (params.limit) query.set("limit", String(params.limit));
	if (params.fuero) query.set("fuero", params.fuero);
	if (params.jurisdiccion) query.set("jurisdiccion", params.jurisdiccion);
	if (params.search) query.set("search", params.search);
	const qs = query.toString();
	const url = `${getBaseUrl()}/api/public/sentencias${qs ? `?${qs}` : ""}`;
	const response = await axios.get<PublicSentenciasListResponse>(url);
	return response.data;
}

export async function getPublicSentencia(id: string): Promise<PublicSentenciaDetailResponse> {
	const url = `${getBaseUrl()}/api/public/sentencias/${encodeURIComponent(id)}`;
	try {
		const response = await axios.get<PublicSentenciaDetailResponse>(url);
		return response.data;
	} catch (err: any) {
		if (axios.isAxiosError(err) && err.response?.data && [400, 404].includes(err.response.status)) {
			return err.response.data as PublicSentenciaDetailResponse;
		}
		throw err;
	}
}

// URL de descarga del PDF del fallo, servido proxeado desde nuestro backend.
export function getPublicSentenciaPdfUrl(id: string): string {
	return `${getBaseUrl()}/api/public/sentencias/${encodeURIComponent(id)}/pdf`;
}

// Etiquetas de fueros conocidos (códigos PJN/SAIJ). Los no mapeados muestran el código.
export const FUERO_LABELS: Record<string, string> = {
	CIV: "Civil",
	COM: "Comercial",
	CNT: "Trabajo",
	CSS: "Seguridad Social",
	CCC: "Criminal y Correccional",
	CSJ: "Corte Suprema",
	CNE: "Electoral",
	CAF: "Cont. Adm. Federal",
	CCF: "Civil y Com. Federal",
	CPE: "Penal Económico",
	CFP: "Criminal y Corr. Federal",
};

export function fueroLabel(fuero: string | null | undefined): string {
	if (!fuero) return "";
	return FUERO_LABELS[fuero] || fuero;
}

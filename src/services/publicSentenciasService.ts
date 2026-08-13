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


// ── Atribución de origen ───────────────────────────────────────────────────
// La API vive en otro origen (server.lawanalytics.app), así que el navegador
// NO envía el path ni el query del referer (política strict-origin-when-cross-
// origin) y los utm_* de la landing tampoco viajan solos. Sin esto, el backend
// vería todas las visitas como "interno".
//
// Se resuelve una vez por sesión: los utm_* de la URL de entrada se guardan en
// sessionStorage y se reenvían en cada llamada, para que una navegación interna
// posterior siga atribuyéndose al canal por el que la persona llegó.
const ATTR_KEY = "la_juris_attr";

type Attr = { utm_source?: string; utm_medium?: string; utm_campaign?: string; utm_content?: string; ref?: string };

function resolveAttribution(): Attr {
	if (typeof window === "undefined") return {};
	try {
		const qs = new URLSearchParams(window.location.search);
		const fromUrl: Attr = {};
		(["utm_source", "utm_medium", "utm_campaign", "utm_content"] as const).forEach((k) => {
			const v = qs.get(k);
			if (v) fromUrl[k] = v.slice(0, 120);
		});

		if (Object.keys(fromUrl).length > 0) {
			sessionStorage.setItem(ATTR_KEY, JSON.stringify(fromUrl));
			return fromUrl;
		}

		const guardado = sessionStorage.getItem(ATTR_KEY);
		if (guardado) return JSON.parse(guardado) as Attr;

		// Sin UTMs: al menos el referer externo, que el header no va a llevar.
		const ref = document.referrer || "";
		if (ref && !ref.includes("lawanalytics.app")) {
			const attr = { ref: ref.slice(0, 300) };
			sessionStorage.setItem(ATTR_KEY, JSON.stringify(attr));
			return attr;
		}
	} catch {
		// sessionStorage puede fallar en modo privado: la atribución es best-effort
	}
	return {};
}

function withAttribution(query: URLSearchParams): URLSearchParams {
	const attr = resolveAttribution();
	Object.entries(attr).forEach(([k, v]) => {
		if (v) query.set(k, v);
	});
	return query;
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
	const qs = withAttribution(query).toString();
	const url = `${getBaseUrl()}/api/public/sentencias${qs ? `?${qs}` : ""}`;
	const response = await axios.get<PublicSentenciasListResponse>(url);
	return response.data;
}

export async function getPublicSentencia(id: string): Promise<PublicSentenciaDetailResponse> {
	const attrQs = withAttribution(new URLSearchParams()).toString();
	const url = `${getBaseUrl()}/api/public/sentencias/${encodeURIComponent(id)}${attrQs ? `?${attrQs}` : ""}`;
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

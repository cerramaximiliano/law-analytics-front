// Service de la sección pública del blog educativo (/educativo).
//
// Wrappea los endpoints PÚBLICOS (sin auth) de law-analytics-server:
//   GET /api/public/educativo?page=&limit=&search=&categoria=
//   GET /api/public/educativo/titulos
//   GET /api/public/educativo/:slug
//
// Mismo patrón que publicSentenciasService: axios crudo sin withCredentials —
// es contenido abierto, sin sesión.

import axios from "axios";
import type { PublicEducativoListResponse, PublicEducativoDetailResponse, PublicEducativoTitulosResponse } from "types/publicEducativo";

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
const ATTR_KEY = "la_edu_attr";

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

export interface PublicEducativoListParams {
	page?: number;
	limit?: number;
	search?: string;
	categoria?: string;
}

export async function getPublicEducativoArticulos(params: PublicEducativoListParams = {}): Promise<PublicEducativoListResponse> {
	const query = new URLSearchParams();
	if (params.page) query.set("page", String(params.page));
	if (params.limit) query.set("limit", String(params.limit));
	if (params.search) query.set("search", params.search);
	if (params.categoria) query.set("categoria", params.categoria);
	const qs = withAttribution(query).toString();
	const url = `${getBaseUrl()}/api/public/educativo${qs ? `?${qs}` : ""}`;
	const response = await axios.get<PublicEducativoListResponse>(url);
	return response.data;
}

// Glosario: todos los títulos publicados ordenados por categoría y título.
export async function getPublicEducativoTitulos(): Promise<PublicEducativoTitulosResponse> {
	const attrQs = withAttribution(new URLSearchParams()).toString();
	const url = `${getBaseUrl()}/api/public/educativo/titulos${attrQs ? `?${attrQs}` : ""}`;
	const response = await axios.get<PublicEducativoTitulosResponse>(url);
	return response.data;
}

export async function getPublicEducativoArticulo(slug: string): Promise<PublicEducativoDetailResponse> {
	const attrQs = withAttribution(new URLSearchParams()).toString();
	const url = `${getBaseUrl()}/api/public/educativo/${encodeURIComponent(slug)}${attrQs ? `?${attrQs}` : ""}`;
	try {
		const response = await axios.get<PublicEducativoDetailResponse>(url);
		return response.data;
	} catch (err: any) {
		if (axios.isAxiosError(err) && err.response?.data && [400, 404].includes(err.response.status)) {
			return err.response.data as PublicEducativoDetailResponse;
		}
		throw err;
	}
}

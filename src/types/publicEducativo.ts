// Tipos de la sección pública del blog educativo (/educativo).
// Backend: law-analytics-server GET /api/public/educativo[/:slug]

export interface PublicEducativoListItem {
	slug: string;
	titulo: string;
	resumen: string;
	publicadoEn: string | null;
	fueros: string[];
	categoria: string | null;
}

export interface PublicEducativoCategoriaCount {
	categoria: string;
	total: number;
}

export interface PublicEducativoJurisprudenciaItem {
	sentenciaId?: string | null;
	caratula: string;
	tribunal: string | null;
	fuero: string | null;
	fecha: string | null;
	comentario: string | null;
	enlazable: boolean;
}

export interface PublicEducativoSeo {
	title: string;
	description: string;
	keywords: string[];
}

export interface PublicEducativoDetail {
	slug: string;
	titulo: string;
	resumen: string;
	cuerpo: string;
	jurisprudencia: PublicEducativoJurisprudenciaItem[];
	seo: PublicEducativoSeo | null;
	publicadoEn: string | null;
	actualizadoEn: string | null;
}

export interface PublicEducativoListResponse {
	success: boolean;
	data: {
		items: PublicEducativoListItem[];
		total: number;
		page: number;
		pages: number;
		// Facet de categorías: calculado sin el filtro de categoría (con la búsqueda aplicada)
		categorias: PublicEducativoCategoriaCount[];
	};
}

// GET /api/public/educativo/titulos — todos los títulos publicados (glosario),
// ordenados por categoría y título.
export interface PublicEducativoTituloItem {
	slug: string;
	titulo: string;
	categoria: string | null;
}

export interface PublicEducativoTitulosResponse {
	success: boolean;
	data: PublicEducativoTituloItem[];
}

export interface PublicEducativoDetailResponse {
	success: boolean;
	message?: string;
	data?: PublicEducativoDetail;
}

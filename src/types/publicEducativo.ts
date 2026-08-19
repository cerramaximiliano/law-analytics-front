// Tipos de la sección pública del blog educativo (/educativo).
// Backend: law-analytics-server GET /api/public/educativo[/:slug]

export interface PublicEducativoListItem {
	slug: string;
	titulo: string;
	resumen: string;
	publicadoEn: string | null;
	fueros: string[];
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
	};
}

export interface PublicEducativoDetailResponse {
	success: boolean;
	message?: string;
	data?: PublicEducativoDetail;
}

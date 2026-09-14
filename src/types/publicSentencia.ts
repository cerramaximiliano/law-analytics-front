// Tipos de la sección pública de jurisprudencia (/jurisprudencia).
// Backend: law-analytics-server GET /api/public/sentencias[/:id]

export interface PublicSentenciaSaij {
	titulo: string | null;
	tribunal: string | null;
	jurisdiccion: string | null;
	numeroFallo: string | null;
	tipoFallo: string | null;
	actor: string | null;
	demandado: string | null;
	sobre: string | null;
	descriptores: string[];
}

export interface PublicSentenciaListItem {
	id: string;
	caratula: string;
	fuero: string | null;
	jurisdiccion?: string;
	fecha: string | null;
	resumen: string;
	saij: PublicSentenciaSaij | null;
}

export interface PublicSentenciaDetail extends PublicSentenciaListItem {
	resumenGeneradoAt: string | null;
	texto: string;
	paginas: number | null;
	pdfDisponible: boolean;
}

export interface PublicSentenciasFueroCount {
	fuero: string;
	total: number;
}

export interface PublicSentenciasJurisdiccionCount {
	jurisdiccion: string;
	total: number;
}

export interface PublicSentenciasListResponse {
	success: boolean;
	data: {
		items: PublicSentenciaListItem[];
		total: number;
		page: number;
		limit: number;
		byFuero: PublicSentenciasFueroCount[];
		byJurisdiccion: PublicSentenciasJurisdiccionCount[];
	};
}

export interface PublicSentenciaDetailResponse {
	success: boolean;
	message?: string;
	data?: PublicSentenciaDetail;
}

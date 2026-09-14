// Types de la búsqueda semántica de jurisprudencia (pjn-rag-api /rag/sentencias)

export interface JurisprudenciaFilters {
	fuero?: string;
	year?: number;
	sentenciaTipo?: string;
	dateFrom?: string;
	dateTo?: string;
}

export interface MatchedChunk {
	index: number;
	sectionType: string; // encabezado | vistos | considerando | voto | resolucion
	text: string;
	score: number;
}

export interface SentenciaResumen {
	_id: string;
	causaId?: string;
	number?: number;
	year?: number;
	fuero?: string;
	caratula?: string;
	juzgado?: number;
	sala?: number;
	organizacion?: string;
	movimientoFecha?: string;
	movimientoTipo?: string;
	sentenciaTipo?: string;
	category?: string;
	aiSummary?: { content?: string; status?: string };
}

export interface JurisprudenciaHit {
	sentencia: SentenciaResumen;
	score: number;
	matchedChunks: MatchedChunk[];
}

export interface JurisprudenciaSearchResponse {
	success: boolean;
	results: JurisprudenciaHit[];
	total: number;
	latencyMs?: { embedding: number; pinecone: number; enrichment: number; total: number };
	// Solo /ask
	plannerUsed?: boolean;
	plan?: Record<string, unknown>;
	filters?: JurisprudenciaFilters;
	// Agregado por el service desde el header X-Search-Quota-Remaining (plan free)
	quotaRemaining?: number | null;
}

export interface JurisprudenciaQuotaError {
	limit: number;
	used: number;
	period: string;
	plan: string;
}

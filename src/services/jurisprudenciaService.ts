// Búsqueda semántica de jurisprudencia — consume pjn-rag-api (ia.lawanalytics.app)
// vía ragAxios (Bearer + refresh automático).
//
// El corpus habilitado (solo SAIJ curado vs todo el corpus embebido) lo decide
// el BACKEND según la config administrable `configuracion-semantic-worker
// .searchCorpus.app` — el cliente no manda `source`: el server lo fuerza
// cuando corresponde y aplica el gate editorial del corpus público.
import ragAxios from "utils/ragAxios";
import { JurisprudenciaFilters, JurisprudenciaSearchResponse } from "types/jurisprudencia";

interface SearchOptions {
	topK?: number;
	filters?: JurisprudenciaFilters;
}

const jurisprudenciaService = {
	// Búsqueda en lenguaje natural con query planner LLM (deriva filtros del prompt).
	// Los filtros explícitos del cliente pisan los del planner.
	ask: async (prompt: string, options: SearchOptions = {}): Promise<JurisprudenciaSearchResponse> => {
		const body: Record<string, unknown> = {
			prompt,
			options: { topK: options.topK ?? 10 },
			...(options.filters && Object.keys(options.filters).length > 0 ? { filters: options.filters } : {}),
		};
		const response = await ragAxios.post("/rag/sentencias/ask", body);
		// Cuota mensual restante (solo plan free) — el backend la manda por header
		const remainingHeader = response.headers?.["x-search-quota-remaining"];
		const quotaRemaining = remainingHeader !== undefined ? parseInt(remainingHeader, 10) : null;
		return { ...response.data, quotaRemaining: isNaN(quotaRemaining as number) ? null : quotaRemaining };
	},

	// Sentencias similares a una dada ("más como esta") — mismo corpus que ask
	similares: async (sentenciaId: string, topK: number = 5): Promise<JurisprudenciaSearchResponse> => {
		const response = await ragAxios.post("/rag/sentencias/buscar/similar", {
			sentenciaId,
			options: { topK },
		});
		return response.data;
	},

	// Texto completo de la sentencia
	getTexto: async (sentenciaId: string): Promise<string> => {
		const response = await ragAxios.get(`/rag/sentencias/${sentenciaId}/texto`);
		return response.data?.text || "";
	},
};

export default jurisprudenciaService;

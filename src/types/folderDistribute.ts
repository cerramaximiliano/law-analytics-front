// Reparto de carpetas por criterios dentro de un equipo (Equipos, fase 3, 6/11/2026).
// Contrato de POST /api/folders/responsables/distribute y GET /api/folders/group/:id/radicacion-summary.

export type DistributeArchivedScope = "active" | "archived" | "all";
export type DistributeCriteriaType = "juzgado" | "fuero" | "equal" | "quantities" | "random";
export type DistributeOrder = "juzgado" | "ultimoMovimiento" | "caratula";
export type DistributeMode = "replace" | "add";

export interface DistributeScope {
	archived: DistributeArchivedScope;
	onlyUnassigned: boolean;
	filters?: {
		fuero?: string[];
		jurisdiccion?: string[];
		/** Números de juzgado de origen; "" = sin juzgado. */
		juzgado?: string[];
		folderIds?: string[];
	};
}

export interface DistributeCriteria {
	type: DistributeCriteriaType;
	/** juzgado y fuero: clave → responsables. */
	map?: Record<string, string[]>;
	/** equal y random. */
	assignees?: string[];
	/** quantities: id → cantidad; `rest` → id que recibe el resto. */
	quantities?: Record<string, number | string>;
	order?: DistributeOrder;
	seed?: number;
}

export interface DistributeRequest {
	scope: DistributeScope;
	criteria: DistributeCriteria;
	mode: DistributeMode;
	dryRun: boolean;
}

export interface DistributePreviewRow {
	id: string;
	cantidad: number;
	/** Número de juzgado (o «Sin juzgado») → cantidad. */
	porJuzgado: Record<string, number>;
}

export interface DistributePreview {
	total: number;
	asignadas: number;
	sinAsignar: number;
	archivadasIncluidas: number;
	restrictedByVisibility: boolean;
	porResponsable: DistributePreviewRow[];
}

export interface DistributeResult {
	success: true;
	dryRun: boolean;
	modified?: number;
	preview: DistributePreview;
}

export interface RadicacionCounts {
	activas: number;
	archivadas: number;
	sinResponsable: number;
}

export interface RadicacionSummary {
	total: number;
	juzgados: ({ fuero: string; juzgado: string } & RadicacionCounts)[];
	fueros: ({ fuero: string } & RadicacionCounts)[];
	jurisdicciones: ({ jurisdiccion: string } & RadicacionCounts)[];
	ubicaciones: ({ ubicacion: string } & RadicacionCounts)[];
}

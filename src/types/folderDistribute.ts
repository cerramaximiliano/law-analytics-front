// Reparto de carpetas por criterios dentro de un equipo (Equipos, fase 3, 6/11/2026).
// Contrato de POST /api/folders/responsables/distribute y GET /api/folders/group/:id/radicacion-summary.

export type DistributeArchivedScope = "active" | "archived" | "all";
// 14/11/2026 (pedido de Silvia): «ubicacion» (dónde está hoy: Juzgado, Cámara, Corte…; dato del PJN, el resto cae en
// «no-pjn»). La sala de Cámara quedó solo como filtro del alcance: repartir por ella no tiene sentido salvo en instancia originaria.
export type DistributeCriteriaType = "juzgado" | "fuero" | "ubicacion" | "equal" | "quantities" | "random";
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
		/** Salas de Cámara de la radicación: «<fuero>|<sala>» o la sala sola; "" = sin sala. */
		sala?: string[];
		/** Ubicación actual: juzgado | camara | corte | tribunal-oral | archivo | otro | no-pjn (otras jurisdicciones). */
		ubicacion?: string[];
		folderIds?: string[];
	};
}

export interface DistributeCriteria {
	type: DistributeCriteriaType;
	/** juzgado, fuero y ubicacion: clave → responsables. */
	map?: Record<string, string[]>;
	/** Ídem: «las demás» (sin clave en `map`: sin sala, sin dato, clave no elegida) van a estos responsables. */
	rest?: string[];
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
	/** Etiqueta de ubicación actual («2ª instancia (Cámara)», «Corte Suprema»…) → cantidad. */
	porUbicacion?: Record<string, number>;
}

export interface DistributePreview {
	total: number;
	asignadas: number;
	sinAsignar: number;
	archivadasIncluidas: number;
	/** Carpetas del alcance que quedaron afuera solo por «solo sin responsable» (para explicar una vista previa vacía). */
	excluidasConResponsable?: number;
	restrictedByVisibility: boolean;
	porResponsable: DistributePreviewRow[];
}

/** Lo que siguió al nuevo responsable al reasignar (hub services/responsablesMigracion.js, 14/11/2026). */
export interface ResponsablesMigracion {
	carpetas: number;
	tareas: number;
	alertas: number;
}

/** «Además, 3 tareas pendientes y 2 alertas sin leer pasaron a los nuevos responsables.» ("" si no hubo nada). */
export const migracionTexto = (m?: ResponsablesMigracion | null): string => {
	if (!m || (!m.tareas && !m.alertas)) return "";
	const partes = [
		m.tareas ? `${m.tareas} ${m.tareas === 1 ? "tarea pendiente" : "tareas pendientes"}` : "",
		m.alertas ? `${m.alertas} ${m.alertas === 1 ? "alerta sin leer" : "alertas sin leer"}` : "",
	].filter(Boolean);
	const n = m.tareas + m.alertas;
	return `${partes.join(" y ")} ${n === 1 ? "pasó" : "pasaron"} a los nuevos responsables.`;
};

export interface DistributeResult {
	success: true;
	dryRun: boolean;
	modified?: number;
	migracion?: ResponsablesMigracion;
	preview: DistributePreview;
}

export interface RadicacionCounts {
	activas: number;
	archivadas: number;
	sinResponsable: number;
}

export interface RadicacionSummary {
	total: number;
	/** Con alcance «solo sin responsable»: cuántas carpetas del alcance ya tienen responsable y quedan afuera. */
	conResponsable?: number;
	juzgados: ({ fuero: string; juzgado: string } & RadicacionCounts)[];
	fueros: ({ fuero: string } & RadicacionCounts)[];
	jurisdicciones: ({ jurisdiccion: string } & RadicacionCounts)[];
	/** Salas de Cámara de la radicación (la que intervino, aunque la causa haya vuelto al juzgado). */
	salas: ({ fuero: string; sala: string } & RadicacionCounts)[];
	/** Ubicación actual: `key` = kind del hub (juzgado | camara | corte | …), `ubicacion` = etiqueta. */
	ubicaciones: ({ key: string; ubicacion: string } & RadicacionCounts)[];
}

// Cédulas de una carpeta PJN (12/11/2026): GET /api/folders/:folderId/cedulas.
// Une los movimientos CEDULA del espejo con la bandeja de notificaciones del portal.

export type PjnCedulaClase = "cedula" | "parte" | "tribunal" | "incorporada" | "retorno";

export interface PjnCedula {
	/** Movimiento: "{causaId}:{sourceId}". Bandeja sin movimiento: "bandeja:{sourceId}". */
	id: string;
	fuente: "movimiento" | "bandeja";
	clase: PjnCedulaClase;
	fecha: string | null;
	tipo: string | null;
	detalle: string | null;
	numeroCedula: string | null;
	/** ISO exacto si viene de la bandeja; YYYY-MM-DD si se leyó del PDF. */
	notificadaEl: string | null;
	notificadaFuente: "bandeja" | "documento" | null;
	destinatarios: string[];
	/** YYYY-MM-DD calculado por plazos automáticos, si existe. */
	vencimiento: string | null;
	plazoEstado: string | null;
	hasPdf: boolean;
	url: string | null;
	respaldo?: boolean;
	vinculo?: string | null;
}

export interface PjnCedulasResponse {
	success: boolean;
	count: number;
	data: PjnCedula[];
	message?: string;
	requiresUpgrade?: boolean;
	ocultas?: number;
	accessCutoffAt?: string;
}

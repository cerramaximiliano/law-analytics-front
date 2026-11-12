// Notificaciones de la bandeja del PJN de una carpeta (12/11/2026): GET /api/folders/:folderId/cedulas.
// Fuente única: pjn-notifications (bandeja RECIBIDAS de notif.pjn.gov.ar, sincronizada por credencial).

export interface PjnCedula {
	/** "bandeja:{sourceId}" */
	id: string;
	sourceId: number;
	/** ISO exacto: fecha y hora de la notificación en el portal. */
	fecha: string | null;
	numeroCedula: string | null;
	oficina: string | null;
	autor: string | null;
	destinatarios: string[];
	expediente: { numero: number | null; anio: number | null; numeracion: string | null; caratula: string | null };
	/** vinculada | sin_movimiento | sin_causa | fuero_desconocido | datos_incompletos */
	vinculo: string | null;
	/** Movimiento CEDULA del espejo ya vinculado ("{causaId}:{sourceId}"), si lo hay. */
	movementId: string | null;
	movimientoTipo: string | null;
	hasPdf: boolean;
	/** YYYY-MM-DD calculado por plazos automáticos, si existe. */
	vencimiento: string | null;
	plazoEstado: string | null;
}

export interface PjnCedulasResponse {
	success: boolean;
	count: number;
	data: PjnCedula[];
	message?: string;
}

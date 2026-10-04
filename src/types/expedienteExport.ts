// Tipos de la exportación del expediente PJN completo a PDF (feature paga
// "expediente_export"). El hub encola un job y un worker arma los tomos; el
// front consulta el estado por polling.

export type ExpedienteExportOrder = "asc" | "desc";
export type ExpedienteExportStatus = "queued" | "processing" | "completed" | "failed" | "expired";

export interface ExpedienteExportEstimate {
	movimientos: number;
	documentos: number;
	bytes: number;
	tomos: number;
}

export interface ExpedienteExportTomo {
	n: number;
	bytes?: number;
	pages?: number;
	desde?: number;
	hasta?: number;
	filename: string;
	url: string; // presigned, vence a los 15 min: se refresca en cada consulta
}

export interface ExpedienteExportJob {
	_id: string;
	status: ExpedienteExportStatus;
	order: ExpedienteExportOrder;
	progress: { done: number; total: number };
	omitidos: number;
	error?: string;
	createdAt: string;
	completedAt: string | null;
	expiresAt: string | null;
	tomos: ExpedienteExportTomo[];
}

export interface ExpedienteExportResponse {
	success: boolean;
	estimate?: ExpedienteExportEstimate;
	job?: ExpedienteExportJob | null;
	message?: string;
	// Gate de plan
	requiresUpgrade?: boolean;
	currentPlan?: string | null;
	requiredPlans?: string[];
	// Corte de acceso por caída de credencial: la exportación llega hasta esa fecha.
	accessCutoffAt?: string | null;
}

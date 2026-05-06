// Tipos para el dominio "PjnMovement" — el listado paginado y el viewer
// del PDF leen desde la nueva colección pjn-movements (Fase 7a).
//
// Convive con el tipo Movement existente (de la colección movements del usuario).
// PjnMovement representa un movimiento del expediente PJN, NO una agenda/recordatorio.

export type PjnMovementPdfStatus =
	| "downloaded"
	| "pending"
	| "expired"
	| "failed"
	| "not_applicable";

export interface PjnMovement {
	_id: string; // formato: "{causaId}:{sourceId}"
	fecha: string | null;
	tipo: string | null;
	detalle: string | null;
	url: string | null; // URL original PJN (puede haber expirado)
	pdfStatus: PjnMovementPdfStatus;
	pdfBytes?: number;
	hasPdf: boolean; // shortcut: pdfStatus === 'downloaded'
}

export interface PjnMovementsPagination {
	currentPage: number;
	totalPages: number;
	limit: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
}

export interface PjnMovementsListResponse {
	success: boolean;
	count: number;
	pagination: PjnMovementsPagination;
	causa?: {
		id: string;
		causaType: string;
	};
	data: PjnMovement[];
	message?: string;
}

export interface PjnMovementsListParams {
	page?: number;
	limit?: number;
	sort?: string; // ej "-fecha" (default), "fecha", "-tipo"
	search?: string;
	pdfStatus?: PjnMovementPdfStatus;
	hasUrl?: boolean;
	dateFrom?: string; // YYYY-MM-DD
	dateTo?: string; // YYYY-MM-DD
}

export interface PjnMovementPdfUrlResponse {
	success: boolean;
	pdfUrl?: string;
	expiresIn?: number; // segundos
	bytes?: number;
	mimeType?: string;
	// Si success=false:
	message?: string;
	pdfStatus?: PjnMovementPdfStatus;
	fallbackUrl?: string | null;
}

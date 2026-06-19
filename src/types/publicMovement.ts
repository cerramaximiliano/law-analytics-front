// Tipos de la vista pública de documentos de movimientos (/m/:token).
// Respuesta del endpoint público GET /api/public/movimientos/:token de
// law-analytics-server (controllers/publicMovementsController.js).

export interface PublicMovementExpediente {
	number: number | null;
	year: number | null;
	fuero: string | null;
	caratula: string | null;
}

export interface PublicMovementInfo {
	fecha: string | null;
	tipo: string | null;
	detalle: string | null;
}

export interface PublicMovementDocResponse {
	success: boolean;
	// Presente solo en error (401/404/500): por qué falló.
	reason?: "expired" | "invalid" | "not_found" | "error";
	message?: string;
	// URL pre-firmada de S3 (300s) o null si el PDF no está en nuestra plataforma.
	pdfUrl: string | null;
	expiresIn?: number;
	// Link original del portal PJN, usado cuando no hay PDF nuestro.
	fallbackUrl: string | null;
	pdfStatus?: string | null;
	movimiento?: PublicMovementInfo;
	expediente?: PublicMovementExpediente;
	// _id del movimiento ("{causaId}:{sourceId}"). Usado para el deep-link
	// ?movement=<id> que resalta el movimiento en el detalle del folder.
	movimientoId?: string | null;
	// Folder del usuario para el CTA "gestionar" (null si no se pudo resolver).
	folderId?: string | null;
}

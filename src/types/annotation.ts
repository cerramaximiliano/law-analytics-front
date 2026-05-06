// Tipos para anotaciones de movimientos PJN (Item 6).
// Espejo de Folder.movementAnnotations[] del backend.

export interface MovementAnnotation {
	movementId: string; // formato "{causaId}:{sourceId}"
	isRead: boolean;
	isImportant: boolean;
	notes: string;
	tags: string[];
	customDueDate?: string | null; // ISO date
	createdAt: string;
	updatedAt: string;
}

// Payload para PUT (campos opcionales — merge parcial)
export interface AnnotationUpdate {
	isRead?: boolean;
	isImportant?: boolean;
	notes?: string;
	tags?: string[];
	customDueDate?: string | null;
}

export interface AnnotationsListResponse {
	success: boolean;
	count: number;
	data: MovementAnnotation[];
}

export interface AnnotationResponse {
	success: boolean;
	created?: boolean;
	data: MovementAnnotation;
}

export interface MarkReadResponse {
	success: boolean;
	updated: number;
	created: number;
}

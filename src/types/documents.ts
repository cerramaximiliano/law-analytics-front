// Tipos base para el sistema de documentos

export interface DocumentVariable {
	id: string;
	name: string;
	label: string;
	type: 'text' | 'date' | 'number' | 'select' | 'folder_field';
	value?: string | number | Date;
	options?: string[]; // Para tipo 'select'
	required?: boolean;
	defaultValue?: string | number | Date;
	folderField?: string; // Para mapear campos del folder
}

export interface DocumentTemplate {
	id: string;
	name: string;
	description: string;
	category: DocumentCategory;
	content: string; // HTML content with variables
	variables: DocumentVariable[];
	isPublic: boolean;
	createdBy: string;
	createdAt: Date;
	updatedAt: Date;
	tags?: string[];
}

export interface Document {
	id: string;
	title: string;
	type: DocumentType;
	status: DocumentStatus;
	content: string; // HTML content
	folderId?: string; // Relación con folder/carpeta
	templateId?: string; // Si se creó desde plantilla
	variables?: Record<string, any>; // Variables resueltas
	version: number;
	createdBy: string;
	lastModifiedBy: string;
	createdAt: Date;
	updatedAt: Date;
	tags?: string[];
	metadata?: {
		court?: string;
		caseNumber?: string;
		parties?: string[];
		[key: string]: any;
	};
}

export interface DocumentVersion {
	id: string;
	documentId: string;
	version: number;
	content: string;
	changes?: string; // Descripción de cambios
	createdBy: string;
	createdAt: Date;
}

export type DocumentType = 
	| 'demanda'
	| 'contestacion'
	| 'escrito'
	| 'notificacion'
	| 'contrato'
	| 'poder'
	| 'recurso'
	| 'otros';

export type DocumentStatus = 
	| 'draft'
	| 'final'
	| 'archived';

export type DocumentCategory = 
	| 'civil'
	| 'laboral'
	| 'comercial'
	| 'familia'
	| 'penal'
	| 'administrativo'
	| 'general';

// Estado Redux
export interface DocumentsState {
	documents: Document[];
	templates: DocumentTemplate[];
	currentDocument: Document | null;
	currentTemplate: DocumentTemplate | null;
	isLoading: boolean;
	error: string | null;
	filters: {
		type?: DocumentType;
		status?: DocumentStatus;
		category?: DocumentCategory;
		searchTerm?: string;
	};
	pagination: {
		page: number;
		limit: number;
		total: number;
	};
}

// Payload types para acciones
export interface CreateDocumentPayload {
	title: string;
	type: DocumentType;
	content?: string;
	folderId?: string;
	templateId?: string;
	variables?: Record<string, any>;
}

export interface UpdateDocumentPayload {
	id: string;
	title?: string;
	content?: string;
	status?: DocumentStatus;
	variables?: Record<string, any>;
}

export interface CreateTemplatePayload {
	name: string;
	description: string;
	category: DocumentCategory;
	content: string;
	variables: Omit<DocumentVariable, 'id'>[];
	isPublic?: boolean;
	tags?: string[];
}

// Export types para API responses
export interface DocumentResponse {
	data: Document;
	message?: string;
}

export interface DocumentsListResponse {
	data: Document[];
	pagination: {
		page: number;
		limit: number;
		total: number;
		totalPages: number;
	};
}

export interface TemplatesListResponse {
	data: DocumentTemplate[];
	total: number;
}
import { Dispatch, SetStateAction } from "react";

export type Movement = {
	_id?: string;
	userId: string;
	groupId?: string;
	folderId: string;
	time: string;
	dateExpiration?: string;
	movement: string;
	title: string;
	description?: string;
	link?: string;
	texto?: string; // Contenido de texto del escrito (MEV únicamente)
	source?: "pjn" | "mev" | "scba" | "eje"; // Origen del movimiento sincronizado
	completed?: boolean; // Nueva propiedad para indicar si el movimiento está completado
	attachments?: Array<{
		// Arreglo de adjuntos del movimiento (MEV/SCBA: múltiples, PJN: típicamente 1).
		// Resolución al hacer click:
		//   - Si tiene s3Key → endpoint proxy /api/movements/:movId/attachments/:idx/download
		//     (presigned URL S3, 5 min, controlado por nosotros).
		//   - Si no, `url` legacy (puede requerir login del portal de origen).
		name: string;
		url?: string;
		s3Bucket?: string;
		s3Key?: string;
		type?: string;
		size?: number;
	}>;
	// Cómo renderizar el "Documento" del movimiento.
	//   - 'pdf': PDFViewer (link directo embedable, caso PJN).
	//   - 'text': MovementTextViewer (texto extraído + lista de adjuntos,
	//     caso SCBA/MEV donde no hay PDF público accesible sin login).
	documentType?: "pdf" | "text";
};

// Tipos para paginación
export interface PaginationInfo {
	total: number;
	page: number;
	limit: number;
	pages: number;
	hasNext: boolean;
	hasPrev: boolean;
	totalAvailable?: number; // Total de movimientos sin filtros
}

export interface PjnAccess {
	hasAccess: boolean;
	message: string;
	requiresUpgrade: boolean;
	currentPlan: string;
	requiredPlans: string[];
	availableMovements?: number;
	totalMovements?: number; // Total de movimientos en la causa
	previewCount?: number; // Cantidad de movimientos de preview mostrados (para usuarios free)
}

// Mismo shape que PjnAccess — el server devuelve idéntico contrato para SCBA.
export interface ScbaAccess {
	hasAccess: boolean;
	message: string | null;
	requiresUpgrade: boolean;
	currentPlan?: string;
	requiredPlans?: string[];
	availableMovements?: number;
	totalMovements?: number;
	previewCount?: number;
}

// EJE no aplica feature-gating ni plan upgrades — solo hasAccess flag.
// Los movimientos vienen del subdoc causas-eje.movimientos[] y nunca
// tienen link/url/attachments (el parser EJE solo captura tieneAdjuntos
// como boolean, no la URL).
export interface EjeAccess {
	hasAccess: boolean;
}

export interface ScrapingProgress {
	status: string;
	isComplete: boolean;
	totalExpected: number;
	totalProcessed: number;
	startedAt?: string;
}

export interface PaginatedMovementsResponse {
	movements: Movement[];
	pagination: PaginationInfo;
	totalWithLinks?: number;
	documentsBeforeThisPage?: number;
	documentsInThisPage?: number;
	pjnAccess?: PjnAccess;
	scbaAccess?: ScbaAccess;
	ejeAccess?: EjeAccess;
	scrapingProgress?: ScrapingProgress;
}

export interface MovementState {
	movements: Movement[];
	pagination?: PaginationInfo; // Información de paginación
	totalWithLinks?: number;
	documentsBeforeThisPage?: number;
	documentsInThisPage?: number;
	pjnAccess?: PjnAccess;
	scbaAccess?: ScbaAccess;
	ejeAccess?: EjeAccess;
	scrapingProgress?: ScrapingProgress;
	causaLastSyncDate?: string | null;
	isLoading: boolean;
	error?: string;
}

export interface Contact {
	_id: string;
	name: string;
	lastName?: string;
	email: string;
	phone: string;
	address?: string;
}

export type MembersModalType = {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	handlerAddress: (address: Contact) => void;
	folderId: string;
	membersData: Contact[];
};

export interface MovementsModalType {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	folderId: any;
	folderName: string;
	editMode?: boolean;
	movementData?: Movement | null;
	onSuccess?: () => void;
	dialogSx?: Record<string, any>;
}

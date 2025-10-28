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
	source?: "pjn" | "mev"; // Campo para identificar movimientos sincronizados (PJN o MEV)
	completed?: boolean; // Nueva propiedad para indicar si el movimiento está completado
	attachments?: Array<{
		// Arreglo de adjuntos para movimientos de MEV
		name: string;
		url: string;
		type?: string;
		size?: number;
	}>;
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
}

export interface ScrapingProgress {
	status: string;
	isComplete: boolean;
	totalExpected: number;
	totalProcessed: number;
}

export interface PaginatedMovementsResponse {
	movements: Movement[];
	pagination: PaginationInfo;
	totalWithLinks?: number;
	documentsBeforeThisPage?: number;
	documentsInThisPage?: number;
	pjnAccess?: PjnAccess;
	scrapingProgress?: ScrapingProgress;
}

export interface MovementState {
	movements: Movement[];
	pagination?: PaginationInfo; // Información de paginación
	totalWithLinks?: number;
	documentsBeforeThisPage?: number;
	documentsInThisPage?: number;
	pjnAccess?: PjnAccess;
	scrapingProgress?: ScrapingProgress;
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
}

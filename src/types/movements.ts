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
	source?: "pjn"; // Campo para identificar movimientos de PJN
};

// Tipos para paginación
export interface PaginationInfo {
	total: number;
	page: number;
	limit: number;
	pages: number;
	hasNext: boolean;
	hasPrev: boolean;
}

export interface PjnAccess {
	hasAccess: boolean;
	message: string;
	requiresUpgrade: boolean;
	currentPlan: string;
	requiredPlans: string[];
	availableMovements?: number;
}

export interface PaginatedMovementsResponse {
	movements: Movement[];
	pagination: PaginationInfo;
	totalWithLinks?: number;
	documentsBeforeThisPage?: number;
	documentsInThisPage?: number;
	pjnAccess?: PjnAccess;
}

export interface MovementState {
	movements: Movement[];
	pagination?: PaginationInfo; // Información de paginación
	totalWithLinks?: number;
	documentsBeforeThisPage?: number;
	documentsInThisPage?: number;
	pjnAccess?: PjnAccess;
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

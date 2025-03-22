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
};

export interface MovementState {
	movements: Movement[];
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

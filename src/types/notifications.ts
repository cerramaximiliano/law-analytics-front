import { Dispatch, SetStateAction } from "react";

export type NotificationType = {
	userId?: string;
	_id?: string;
	folderId: string;
	time: string;
	dateExpiration?: string;
	title: string;
	notification: string;
	code?: string;
	idCode?: string;
	user: string;
	description?: string;
	isLoader?: boolean;
	error?: string | null;
};

export interface NotificationsState {
	notifications: NotificationType[];
	isLoader: boolean;
	error: string | null;
}

export interface Action {
	type: string; // Tipo de la acción
	payload?: any; // Datos adicionales que acompañan la acción
}

export interface FormValues {
	date: string;
	title: string;
	notification: string;
	user: string;
	code: string;
	idCode: string;
	description: string;
	dateExpiration: string;
}

// Tipo para los datos de la notificación
export interface NotificationData {
	_id?: string;
	folderId: string;
	time: string;
	title: string;
	dateExpiration: string;
	notification: string;
	userId: string;
	description: string;
	user: string;
	code: string;
	idCode: string;
}

export interface ModalNotificationsProps {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	folderId?: string;
	editMode?: boolean;
	notificationData?: NotificationType | null;
	folderName?: string;
}
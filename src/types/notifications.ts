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

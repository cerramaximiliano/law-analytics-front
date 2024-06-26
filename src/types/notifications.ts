export type NotificationsType = {
	userId?: string;
	_id?: string;
	folderId?: string;
	time: string;
	dateExpiration?: string;
	title: string;
	notification: string;
	user: string;
	description: string;
	isLoader?: boolean;
	error?: string | null;
};

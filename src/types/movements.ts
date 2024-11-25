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
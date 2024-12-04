export interface TaskType {
	_id: string;
	name: string;
	progress?: number;
	done?: number;
	checked: boolean;
	date: string;
	folderId?: string;
	userId?: string;
	groupId?: string;
}

export interface TaskState {
	tasks: TaskType[];
	isLoader: boolean;
	error: string | null;
}

import { Dispatch, SetStateAction } from "react";

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

export type TaskDataType = {
	name: string;
	_id: string;
	progress?: number;
	done?: number;
	checked: boolean;
	date: string;
};

export type TaskCompletionType = {
	[key: string]: boolean;
};

export type TaskListProps = {
	title: string;
	folderName: string;
};

export type TaskModalType = {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	handlerAddress?: (task: any) => void;
	folderId: string;
	folderName: string;
};

export type TaskFormValues = {
	date: string;
	name: string;
	description: string;
	checked: boolean;
	folderId: string;
	userId?: string;
};

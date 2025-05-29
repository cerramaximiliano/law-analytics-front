import { Dispatch, SetStateAction } from "react";

export interface TaskType {
	_id: string;
	name: string;
	progress?: number;
	done?: number;
	checked: boolean;
	date?: string; // Ahora opcional ya que usamos dueDate
	dueDate: Date | string; // Fecha de vencimiento (puede ser string al recibir de API)
	priority?: "baja" | "media" | "alta"; // Valores enumerados para prioridad
	status?: "pendiente" | "en_progreso" | "revision" | "completada" | "cancelada"; // Estados posibles
	attachments?: Array<{
		name: string;
		url: string;
		type: string;
	}>;
	comments?: Array<{
		text: string;
		author: string;
		date: Date | string;
		_id?: string; // MongoDB puede asignar IDs a los elementos de arrays
	}>;
	folderId?: string;
	userId?: string;
	groupId?: string;
	description?: string;
	assignedTo?: string[];
	reminders?: Array<{
		date: Date | string;
		sent: boolean;
		_id?: string;
	}>;
	subtasks?: Array<{
		name: string;
		completed: boolean;
		_id?: string;
	}>;
	archived?: boolean; // Campo para tareas archivadas
	createdAt?: Date | string; // De timestamps
	updatedAt?: Date | string; // De timestamps
}

export interface TaskState {
	tasks: TaskType[];
	selectedTasks: TaskType[]; // Tareas filtradas
	task: TaskType | null; // Single task for detail view
	taskDetails: { [key: string]: TaskType }; // Task details by ID
	taskDetailsLoading: { [key: string]: boolean }; // Loading state for each task detail
	isLoader: boolean;
	error: string | null;
	upcomingTasks: TaskType[];
	isInitialized: boolean;
	lastFetchedUserId?: string;
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
	editMode?: boolean;
	taskToEdit?: TaskType | null;
	onClose?: () => void;
};

export type TaskFormValues = {
	dueDate: string;
	name: string;
	description: string;
	checked: boolean;
	folderId: string;
	userId?: string;
};

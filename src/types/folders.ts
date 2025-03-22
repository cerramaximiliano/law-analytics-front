import { Column } from "react-table";
import { FC } from "react";

// Estado de la pre carpeta (preFolder)
interface PreFolder {
	initialDatePreFolder?: string; // Fecha inicial de la pre carpeta
	finalDatePreFolder?: string; // Fecha final de la pre carpeta
	memberPreFolder?: string; // Miembro asociado a la pre carpeta
	amountPreFolder?: number; // Monto de la pre carpeta
	statusPreFolder?: string; // Estado de la pre carpeta
	descriptionPreFolder?: string; // Descripción de la pre carpeta
}

// Estado del juicio (judFolder)
interface JudFolder {
	initialDateJudFolder?: string; // Fecha inicial del juicio
	finalDateJudFolder?: string; // Fecha final del juicio
	numberJudFolder?: string; // Número del juicio
	statusJudFolder?: string; // Estado del juicio
	descriptionJudFolder?: string; // Descripción del juicio
}

// Tipos principales de la carpeta (folder)
export interface Folder {
	_id: string; // ID de la carpeta generado por MongoDB
	folderId?: string; // ID adicional de la carpeta (opcional)
	folderName: string; // Nombre de la carpeta
	materia: string; // Materia del caso
	orderStatus: string; // Estado del pedido
	status: FolderStatus; // Estado de la carpeta
	description?: string; // Descripción de la carpeta (opcional)
	initialDateFolder?: string; // Fecha inicial de la carpeta (opcional)
	finalDateFolder?: string; // Fecha final de la carpeta (opcional)
	amount?: number; // Monto relacionado con la carpeta (opcional)
	folderJuris?: {
		item: string; // Jurisdicción de la carpeta
		label: string; // Etiqueta de la jurisdicción
	} | null; // Información de la jurisdicción (opcional)
	folderFuero?: string | null; // Fuero de la carpeta (opcional)
	preFolder?: PreFolder; // Información de la pre carpeta (opcional)
	judFolder?: JudFolder; // Información del juicio (opcional)
	userId: string; // ID del usuario asociado
	groupId?: string; // ID del grupo asociado (opcional)
}
// Tipos del estado de la carpeta
export type FolderStatus = "Nueva" | "En Progreso" | "Cerrada" | "Pendiente"; // Diferentes estados de una carpeta

// Estado extendido del folder (usado como estado inicial)
export interface FolderState {
	folders: Folder[]; // Lista de folders
	selectedFolders: Folder[];
	isLoader: boolean; // Si hay un loader en curso
	error?: string; // Posibles errores
}

// Tipos de acción para los folders (para usar en el reducer)
export interface Action {
	type: string; // Tipo de la acción
	payload?: any; // Datos adicionales que acompañan la acción
}

export interface Props {
	columns: Column[];
	data: Folder[];
	handleAdd: () => void;
	renderRowSubComponent: FC<any>;
	isLoading: boolean;
}
export interface PropsAlert {
	title: string;
	open: boolean;
	handleClose: (status: boolean) => void;
	id?: string;
	onDelete?: () => Promise<void>;
}

export interface PropsAddFolder {
	folder?: any;
	onCancel: () => void;
	onAddFolder: (folder: any) => void;
	open: boolean;
	mode: "add" | "edit";
}

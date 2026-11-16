export interface Note {
	_id: string;
	title: string;
	content?: string;
	userId: string;
	groupId?: string;
	folderId?: string;
	movementRef?: string;
	movementSource?: "pjn" | "mev" | "scba" | "eje" | "pjsalta" | "pjcatamarca" | "pjmendoza" | "manual" | null;
	/** "anotacion" = registro rápido cargado desde el Historial de la carpeta. */
	kind?: "nota" | "anotacion";
	/** Fecha del hecho anotado, si no es la del día en que se cargó. */
	occurredAt?: string;
	createdAt: string;
	updatedAt: string;
}

export interface NoteFormValues {
	title: string;
	content?: string;
	userId?: string;
	folderId?: string;
	groupId?: string;
	movementRef?: string;
	movementSource?: "pjn" | "mev" | "scba" | "eje" | "pjsalta" | "pjcatamarca" | "pjmendoza" | "manual" | null;
	kind?: "nota" | "anotacion";
	occurredAt?: string | null;
	/** Tipo de la anotación (uno de los que define el estudio en Seguimiento). */
	tipoId?: string | null;
}

export interface NoteModalType {
	open: boolean;
	setOpen: (open: boolean) => void;
	handlerAddress?: (note: Note) => void;
	folderId: string;
	folderName?: string;
	note?: Note | null;
	initialValues?: Partial<NoteFormValues>;
	dialogSx?: Record<string, any>;
}

export interface NoteState {
	notes: Note[];
	selectedNotes: Note[]; // Notas filtradas por folder
	note: Note | null; // Single note for detail view
	isLoader: boolean;
	error: string | null;
	isInitialized: boolean;
	lastFetchedFolderId?: string;
}

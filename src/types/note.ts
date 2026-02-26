export interface Note {
	_id: string;
	title: string;
	content?: string;
	userId: string;
	groupId?: string;
	folderId?: string;
	movementRef?: string;
	movementSource?: "pjn" | "mev" | null;
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
	movementSource?: "pjn" | "mev" | null;
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

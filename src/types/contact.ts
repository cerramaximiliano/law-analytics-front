// Parte representada por un letrado (o por sí mismo en caso de auto-representación)
export type ParteRepresentada = {
	intervinienteId?: string;
	contactId?: string;              // Puede ser el mismo contact (auto-referencia)
	tipo: string;                    // ACTOR, DEMANDADO, TERCERO, etc.
	nombre: string;
	causaId?: string;
	role?: string;                   // Rol del letrado en esta causa (LETRADO APODERADO, etc.)
	isSelfRepresented?: boolean;     // True cuando se representa a sí mismo
};

// Referencia a interviniente (para contactos importados de PJN)
export type IntervinienteRef = {
	causaIds?: string[];
	causaTypes?: string[];
	intervinienteIds?: string[];
	// tipoInterviniente ahora puede ser un array cuando la persona es PARTE y LETRADO a la vez
	tipoInterviniente?: "PARTE" | "LETRADO" | ("PARTE" | "LETRADO")[];
	tipoParte?: string;              // ACTOR, DEMANDADO, TERCERO, PERITO, etc.
	tipoLetrado?: string;            // LETRADO APODERADO, LETRADO PATROCINANTE, etc.
	matricula?: string;
	estadoIej?: string;
	iej?: string;
	tomoFolio?: string;
	nombreNormalizado?: string;
	partesRepresentadas?: ParteRepresentada[];
	importedAt?: string;
	lastUpdatedAt?: string;
};

export type Contact = {
	_id: string;
	avatar?: string;
	name: string;
	lastName: string;
	role: string | string[];  // Puede ser string o array de roles
	type?: "Humana" | "Jurídica" | "";
	address: string;
	state: string;
	city: string;
	zipCode: string;
	email: string;
	phone: string;
	nationality: string;
	document: string;
	cuit: string;
	status: string;
	activity: string;
	company: string;
	fiscal: string;
	userId: string;
	groupId?: string;
	folderIds?: string[] | null;
	// Campos para contactos importados de intervinientes
	importSource?: "manual" | "interviniente";
	intervinienteRef?: IntervinienteRef;
};

export type ContactPaginationInfo = {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
};

export type ContactState = {
	contacts: Contact[];
	archivedContacts: Contact[];
	archivedPagination: ContactPaginationInfo;
	selectedContacts: Contact[];
	isLoader: boolean;
	error: string | null;
	isInitialized: boolean;
	lastFetchedUserId?: string;
	archivedByFolderCount?: number;
};

export type Action = {
	type: string;
	payload?: any;
};

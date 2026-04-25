// types/folder.ts

export type JurisdictionData = {
	item: string;
	label: string;
};

export type JuzgadoData = {
	_id: string;
	organismo: string;
	jurisdiccion?: string;
	codigo?: number;
	ciudad?: string;
	[key: string]: any;
};

export type PreFolderData = {
	initialDatePreFolder: string;
	finalDatePreFolder: string;
	memberPreFolder: string;
	amountPreFolder: number;
	statusPreFolder: string;
	descriptionPreFolder: string;
};

export type JudFolderData = {
	initialDateJudFolder: string;
	finalDateJudFolder: string;
	numberJudFolder: string;
	statusJudFolder: string;
	amountJudFolder: string;
	/* "En letra" | "En despacho"; */
	descriptionJudFolder: string;
	courtNumber?: string;
	secretaryNumber?: string;
};

export type FolderData = {
	_id: string;
	folderId: string;
	folderName: string;
	materia: string;
	orderStatus: string;
	/* | "Actor"
		| "Demandado"
		| "Requirente"
		| "Requerido"
		| "Acreedor"
		| "Deudor"
		| "Denunciante"
		| "Denunciado"
		| "Beneficiario"
		| "Concursado"
		| "Síndico"
		| "Querellante"
		| "Pres. Fallido"
		| "Part. Damnificado"
		| "Imputado"
		| "Incidentista"
		| "Heredero/os"; */
	status: string;
	//"Nueva" | "En Proceso" | "Cerrada" | "Pendiente";
	description: string;
	initialDateFolder: string;
	finalDateFolder: string;
	amount: number;
	folderJuris: string | JurisdictionData;
	folderFuero: string;
	juzgado?: JuzgadoData | null;
	/* 		| "Civil"
		| "Laboral"
		| "Previsional"
		| "Comercial"
		| "Aduanero"
		| "Tributario"
		| "Comercial"
		| "Penal"
		| "Administrativo"
		| "Constitucional"
		| "Ambiental"
		| "Familia"; */
	preFolder: PreFolderData;
	judFolder: JudFolderData;
	isLoader?: boolean;
	error?: string | null;
	source?: string; // Fuente de los datos (manual o auto)
	pjn?: boolean; // Indica si los datos provienen del Poder Judicial de la Nación
	mev?: boolean; // Indica si los datos provienen del MEV (Buenos Aires)
	causaId?: string; // ID de la causa vinculada
	causaType?: string; // Tipo de causa (CausasCivil, CausasTrabajo, CausasSegSocial)
	causaVerified?: boolean; // Indica si la causa ha sido verificada
	causaIsValid?: boolean; // Indica si la causa es válida
	causaUpdateEnabled?: boolean; // Indica si las actualizaciones están habilitadas
	causaAssociationStatus?: string; // Estado de asociación (success, pending, pending_selection, failed)
	/** @deprecated usar listRemoved + listRemovedSource='pjn'. Se mantiene temporalmente por compat. */
	pjnNotFound?: boolean;
	/** La causa ya no aparece en el listado del portal origen. Generalizado para PJN/SCBA/MEV/EJE. */
	listRemoved?: boolean;
	listRemovedAt?: string;
	listRemovedSource?: "pjn" | "scba" | "mev" | "eje";
	causaLastSyncDate?: string; // Fecha de última sincronización
	lastMovementDate?: string; // Fecha del último movimiento
	// Campos para selección múltiple de causas (EJE/MEV)
	pendingCausaIds?: string[]; // IDs de causas pendientes de selección
	pendingCausaType?: string; // Tipo de causas pendientes ('CausasEje' | 'MEV')
	searchTerm?: string; // Término de búsqueda original
	eje?: boolean; // Indica si es una causa EJE (CABA)
	scba?: boolean; // Indica si es una causa SCBA (Provincia de Buenos Aires)
	/**
	 * Para causas PJN agregadas individualmente (source !== 'pjn-login'):
	 * la causa fue marcada como privada/reservada por el privacy-checker
	 * tras N fallos consecutivos al consultarla públicamente. Las causas
	 * pjn-login tienen otra ruta de acceso (Mis Causas autenticado) y NO
	 * usan este flag — el frontend lo ignora cuando source==='pjn-login'.
	 */
	causaIsPrivate?: boolean;
	causaPrivateDetectedAt?: string;
};

// Interfaz para una causa pendiente de selección
export interface PendingCausa {
	_id: string;
	cuij?: string;
	numero: number;
	anio: number;
	caratula?: string;
	estado?: string;
	isPrivate?: boolean;
	fechaInicio?: string;
}

export type PaginationInfo = {
	total: number;
	page: number;
	limit: number;
	totalPages: number;
};

export type FolderState = {
	folders: FolderData[];
	archivedFolders: FolderData[];
	archivedPagination: PaginationInfo;
	selectedFolders: FolderData[];
	folder: FolderData | null;
	isLoader: boolean;
	error?: string;
	isInitialized: boolean;
	lastFetchedUserId?: string;
	sortBy?: string;
	sortDesc?: boolean;
};

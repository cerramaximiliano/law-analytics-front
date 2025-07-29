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
	causaId?: string; // ID de la causa vinculada
	causaType?: string; // Tipo de causa (CausasCivil, CausasTrabajo, CausasSegSocial)
	causaVerified?: boolean; // Indica si la causa ha sido verificada
	causaIsValid?: boolean; // Indica si la causa es válida
	causaUpdateEnabled?: boolean; // Indica si las actualizaciones están habilitadas
	causaAssociationStatus?: string; // Estado de asociación (success, pending, failed)
	causaLastSyncDate?: string; // Fecha de última sincronización
};

export type FolderState = {
	folders: FolderData[];
	archivedFolders: FolderData[];
	selectedFolders: FolderData[];
	folder: FolderData | null;
	isLoader: boolean;
	error?: string;
	isInitialized: boolean;
	lastFetchedUserId?: string;
};

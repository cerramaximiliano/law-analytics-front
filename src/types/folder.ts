// types/folder.ts

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
	//"Nueva" | "En Proceso" | "Finalizada";
	description: string;
	initialDateFolder: string;
	finalDateFolder: string;
	amount: number;
	folderJuris: string;
	folderFuero: string;
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
};

export type FolderState = {
	folders: FolderData[];
	archivedFolders: FolderData[];
	folder: FolderData | null;
	isLoader: boolean;
	error?: string;
};

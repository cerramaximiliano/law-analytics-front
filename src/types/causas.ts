export interface UserUpdate {
	userId: string;
	enabled: boolean;
}

export interface VerifiedCausa {
	_id: string;
	date: string;
	year: number;
	number: number;
	caratula: string;
	info: string;
	fuero: "CNT" | "CSS" | "CIV";
	objeto: string;
	juzgado: number;
	secretaria: number;
	movimiento: any[];
	movimientosCount: number;
	fechaUltimoMovimiento: string | null;
	userCausaIds: string[];
	folderIds: string[];
	source: "scraping" | "manual";
	verified: boolean;
	isValid: boolean;
	update: boolean;
	userUpdatesEnabled: UserUpdate[];
	lastUpdate: string;
	createdAt: string;
	updatedAt: string;
}

export interface CausasBreakdown {
	civil: number;
	seguridad_social: number;
	trabajo: number;
}

export interface VerifiedCausasResponse {
	success: boolean;
	message: string;
	count: number;
	breakdown: CausasBreakdown;
	data: VerifiedCausa[];
	error?: string;
}

export interface CausasState {
	verifiedCausas: VerifiedCausa[];
	breakdown: CausasBreakdown;
	count: number;
	loading: boolean;
	error: string | null;
	message: string | null;
}

export interface Movimiento {
	fecha: string;
	descripcion: string;
	observacion?: string;
	tipo?: string;
	[key: string]: any;
}

export interface PaginationInfo {
	currentPage: number;
	totalPages: number;
	limit: number;
	hasNextPage: boolean;
	hasPrevPage: boolean;
}

export interface CausaDetails {
	id: string;
	number: number;
	year: number;
	caratula: string;
	movimientosCount: number;
	userUpdatesEnabled: UserUpdate[];
	folderIds: string[];
	userCausaIds: string[];
}

export interface CausaMovimientosResponse {
	success: boolean;
	message: string;
	count: number;
	pagination: PaginationInfo;
	causa: CausaDetails;
	data: Movimiento[];
}

export interface DeleteCausaResponse {
	success: boolean;
	message: string;
	data: {
		id: string;
		number: number;
		year: number;
		caratula: string;
		fuero: string;
	} | null;
}

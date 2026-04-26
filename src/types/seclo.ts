/**
 * Tipos del módulo SECLO (Audiencias del Ministerio de Trabajo).
 * Espejo de los tipos del backend law-analytics-server.
 */

export type SecloStatus = "pending" | "processing" | "submitted" | "completed" | "error" | "dry_run_completed";
export type SecloTipoTramite = "obligatoria" | "espontanea";
export type SecloIniciadoPor = "trabajador" | "empleador";
export type SecloCaracter = "apoderado" | "patrocinante" | "rep_gremial" | "rep_empresarial";
export type SecloDocTipo = "dni" | "credencial" | "poder" | "formulario" | "otros";

export const OBJETO_RECLAMO_OPTIONS = [
	"Accidentes – Trabajador No Registrado y Empleador sin ART",
	"Acoso Laboral",
	"Cobro de salarios",
	"Consignación",
	"Daño Moral",
	"Desalojo",
	"Despido",
	"Diferencia de salarios",
	"Indemnización fallecimiento del empleador (art. 249 LCT)",
	"Indemnización fallecimiento del trabajador (art. 248 LCT)",
	"Indemnización por enfermedad (art. 212 LCT)",
	"Jubilación Artículo 252",
	"Ley 22250 (construcción)",
	"Modificación de Cond Laborales",
	"Multas de ley – varias",
	"Multas ley 24013",
	"Período de Prueba Artículo 92 bis",
	"Reclamo certificado de trabajo (art. 80 LCT)",
	"Salarios por suspensión",
	"Seguro de Vida",
] as const;

export interface SecloCredential {
	_id: string;
	enabled: boolean;
	cuil: string | null;
	syncStatus: string;
	credentialsValidated: boolean;
	credentialsValidatedAt: string | null;
	credentialInvalid: boolean;
	credentialInvalidAt: string | null;
	credentialInvalidReason: string | null;
	consecutiveErrors: number;
	lastSync: string | null;
	createdAt: string;
	updatedAt: string;
}

export interface SecloDatosLaborales {
	fechaNacimiento?: string | null;
	fechaIngreso?: string | null;
	fechaEgreso?: string | null;
	remuneracion?: number | null;
	importeReclamo?: number | null;
	cct?: string;
	categoria?: string;
	estadoTrabajador?: "regular" | "irregular" | "no_registrado" | null;
	sexo?: "M" | "F" | null;
}

export interface SecloDocumento {
	tipo: SecloDocTipo;
	s3Key: string;
	fileName?: string;
}

export interface SecloDatosAbogado {
	caracter: SecloCaracter;
	tomo: string;
	folio: string;
	domicilio?: { cpa?: string };
}

export interface SecloAudiencia {
	fecha?: string | null;
	hora?: string | null;
	lugar?: string | null;
	constanciaKey?: string | null;
	conciliador?: { nombre?: string; telefono?: string; email?: string; sala?: string } | null;
	eventId?: string;
}

export interface SecloContactRef {
	_id: string;
	name: string;
	lastName?: string;
	cuit?: string;
	company?: string;
}

export interface SecloSolicitud {
	_id: string;
	credentialId?: string | { _id: string; enabled: boolean; credentialsValidated?: boolean; credentialInvalid?: boolean };
	folderId?: { _id: string; folderName: string; folderId?: string; materia?: string } | string | null;
	requirentes: Array<{
		contactId: SecloContactRef | string;
		datosLaborales?: SecloDatosLaborales;
		snapshot?: { name?: string; lastName?: string; cuit?: string };
	}>;
	requeridos: Array<{
		contactId: SecloContactRef | string;
		snapshot?: { name?: string; lastName?: string; company?: string; cuit?: string };
	}>;
	documentos: SecloDocumento[];
	tipoTramite: SecloTipoTramite;
	iniciadoPor: SecloIniciadoPor;
	objetoReclamo: string[];
	comentarioReclamo?: string;
	datosAbogado?: SecloDatosAbogado;
	status: SecloStatus;
	submittedAt?: string | null;
	completedAt?: string | null;
	resultado?: {
		numeroExpediente?: string;
		numeroTramite?: string;
		audiencias?: SecloAudiencia[];
		textoPdf?: string;
	} | null;
	errorInfo?: { message: string; code: string; timestamp: string } | null;
	retryCount: number;
	createdAt: string;
	updatedAt: string;
}

export interface SecloSolicitudStatus {
	status: SecloStatus;
	submittedAt: string | null;
	completedAt: string | null;
	numeroExpediente: string | null;
	numeroTramite: string | null;
	audiencia: SecloAudiencia | null;
	error: { message: string; code: string } | null;
}

export interface SecloPresignResult {
	uploadUrl: string;
	s3Key: string;
}

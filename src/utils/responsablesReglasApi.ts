// utils/responsablesReglasApi.ts
// Reglas automáticas de responsables del equipo (14/11/2026, hub `docs/REPARTO_POR_UBICACION_DINAMICO.md`):
//  - Responsables por ubicación actual: «lo que está en Cámara lo sigue X», solo carpetas PJN activas.
//  - Regla de alta: las carpetas nuevas sin responsable siguen el reparto estático guardado (radicación o fuero).
// Las aplica el cron del hub `responsables-reglas-apply` (cada hora) o «Aplicar ahora».
import axios from "axios";

export type UbicacionKind = "juzgado" | "camara" | "corte" | "tribunal-oral" | "archivo" | "otro";

export interface UbicacionRule {
	enabled: boolean;
	map: Partial<Record<UbicacionKind, string[]>>;
	mode: "replace" | "add";
	alVolver: "restaurar" | "regla";
	soloSinResponsable: boolean;
	/** Causas nuevas (nunca tuvieron responsable): apagado = quedan sin responsable; prendido = se asignan según `map`. */
	incluirNuevas: boolean;
	updatedAt?: string | null;
	updatedBy?: string | null;
	lastRun?: { at: string; source: "cron" | "manual"; candidatas: number; modified: number } | null;
}

export interface UbicacionRuleResponse {
	rule: UbicacionRule;
	coverage: { activas: number; pjn: number; asignadasPorRegla: number; nuevasSinAsignar?: Partial<Record<UbicacionKind, number>> };
	kinds: { key: UbicacionKind; label: string }[];
	canEdit: boolean;
}

export interface UbicacionApplyResult {
	dryRun: boolean;
	candidatas: number;
	cambios: number;
	sinCambio: number;
	omitidas: number;
	porUbicacion: Partial<Record<UbicacionKind, number>>;
	porResponsable: { id: string; entra: number; sale: number }[];
	muestra: { folderId: string; folderName: string; de: string | null; a: UbicacionKind; antes: string[]; despues: string[] }[];
}

export interface ReglaDeAlta {
	enabled: boolean;
	criterio: "juzgado" | "fuero" | null;
	map: Record<string, string[]>;
	rest: string[];
	soloPjn: boolean;
	desde?: string | null;
	updatedAt?: string | null;
	updatedBy?: string | null;
	lastRun?: { at: string; source: "cron" | "manual"; candidatas: number; asignadas: number; sinClave: number } | null;
}

export interface ReglaDeAltaResponse {
	rule: ReglaDeAlta;
	coverage: { asignadasPorRegla: number };
	canEdit: boolean;
}

export interface ReglaDeAltaApplyResult {
	dryRun: boolean;
	candidatas: number;
	asignadas: number;
	modified: number;
	sinClave: number;
	porClave: Record<string, number>;
	porResponsable: { id: string; cantidad: number }[];
	muestra: { folderId: string; folderName: string; clave: string; responsables: string[] }[];
}

const base = (groupId: string) => `${import.meta.env.VITE_BASE_URL}/api/groups/${groupId}`;
const headers = (groupId: string) => ({ headers: { "X-Group-Id": groupId } });

export const apiError = (error: unknown, fallback: string): string =>
	axios.isAxiosError(error) ? error.response?.data?.message || error.response?.data?.error || fallback : fallback;

export async function getUbicacionRule(groupId: string): Promise<UbicacionRuleResponse> {
	const { data } = await axios.get(`${base(groupId)}/responsables-ubicacion`, headers(groupId));
	return data;
}

export async function saveUbicacionRule(groupId: string, rule: Partial<UbicacionRule>): Promise<UbicacionRuleResponse> {
	const { data } = await axios.put(`${base(groupId)}/responsables-ubicacion`, rule, headers(groupId));
	return data;
}

/** `draft`: regla sin guardar para la vista previa (solo con dryRun). */
export async function applyUbicacionRule(groupId: string, dryRun: boolean, draft?: Partial<UbicacionRule>): Promise<UbicacionApplyResult> {
	const { data } = await axios.post(
		`${base(groupId)}/responsables-ubicacion/apply?dryRun=${dryRun}`,
		dryRun ? draft || {} : {},
		headers(groupId),
	);
	return data;
}

export async function getReglaDeAlta(groupId: string): Promise<ReglaDeAltaResponse> {
	const { data } = await axios.get(`${base(groupId)}/regla-de-alta`, headers(groupId));
	return data;
}

export async function saveReglaDeAlta(groupId: string, rule: Partial<ReglaDeAlta>): Promise<ReglaDeAltaResponse> {
	const { data } = await axios.put(`${base(groupId)}/regla-de-alta`, rule, headers(groupId));
	return data;
}

export async function applyReglaDeAlta(groupId: string, dryRun: boolean, draft?: Partial<ReglaDeAlta>): Promise<ReglaDeAltaApplyResult> {
	const { data } = await axios.post(`${base(groupId)}/regla-de-alta/apply?dryRun=${dryRun}`, dryRun ? draft || {} : {}, headers(groupId));
	return data;
}

// Registro por carpeta de las dos reglas (hub §8.4, colección responsablesreglaslogs).
export type ReglaLogTipo = "alta" | "cambio" | "restauracion" | "omitida" | "reasignacion";
/** «manual»: reasignación hecha por una persona (carpeta, selección o asistente), 14/11/2026. */
export type ReglaLogRegla = "alta" | "ubicacion" | "manual";

export interface ReglaLogItem {
	_id: string;
	folderId: string;
	folderName: string;
	regla: ReglaLogRegla;
	tipo: ReglaLogTipo;
	motivo: "con_responsable" | "nueva" | null;
	clave: string | null;
	de: UbicacionKind | null;
	a: UbicacionKind | null;
	antes: string[];
	despues: string[];
	entran: string[];
	salen: string[];
	corridaId: string | null;
	origen: "cron" | "manual" | "asistente";
	at: string;
}

export interface ReglaLogQuery {
	regla?: ReglaLogRegla | "";
	tipo?: ReglaLogTipo | "";
	responsable?: string;
	desde?: string;
	hasta?: string;
	q?: string;
	page?: number;
	limit?: number;
}

export interface ReglaLogResponse {
	items: ReglaLogItem[];
	total: number;
	page: number;
	limit: number;
	summary: Record<"alta" | "ubicacion", Partial<Record<ReglaLogTipo, number>>> & { manual?: Partial<Record<ReglaLogTipo, number>> };
}

export async function getReglasLog(groupId: string, query: ReglaLogQuery): Promise<ReglaLogResponse> {
	const params = Object.fromEntries(Object.entries(query).filter(([, v]) => v !== undefined && v !== ""));
	const { data } = await axios.get(`${base(groupId)}/responsables-reglas/log`, { ...headers(groupId), params });
	return data;
}

// Último cambio de responsables de una carpeta (panel de equipo del detalle, 14/11/2026).
export type UltimoCambioResponsables = Pick<
	ReglaLogItem,
	"regla" | "tipo" | "origen" | "clave" | "de" | "a" | "antes" | "despues" | "entran" | "salen" | "at"
>;

export async function getUltimoCambioResponsables(
	folderId: string,
	requestHeaders: Record<string, string>,
): Promise<UltimoCambioResponsables | null> {
	const { data } = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/folders/${folderId}/responsables/ultimo-cambio`, {
		headers: requestHeaders,
	});
	return data?.cambio || null;
}

const UBICACION_CORTA: Record<string, string> = {
	juzgado: "1ª instancia",
	camara: "Cámara",
	corte: "Corte Suprema",
	"tribunal-oral": "Tribunal Oral",
	archivo: "Archivo General",
	otro: "otra dependencia",
};
const ubic = (k: string | null) => (k ? UBICACION_CORTA[k] || k : "");

/** Por qué cambiaron los responsables, en pocas palabras: «por la regla de ubicación actual (1ª instancia → Cámara)». */
export function ultimoCambioMotivo(c: UltimoCambioResponsables): string {
	if (c.regla === "alta") return "por la regla para las causas nuevas";
	if (c.regla === "manual") return c.origen === "asistente" ? "a mano, desde el asistente de reparto" : "a mano";
	if (c.tipo === "restauracion") return `por la regla de ubicación actual (volvió a ${ubic(c.a)})`;
	return `por la regla de ubicación actual (${c.de ? `${ubic(c.de)} → ${ubic(c.a)}` : `en ${ubic(c.a)}`})`;
}

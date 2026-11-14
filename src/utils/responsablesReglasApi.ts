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
	updatedAt?: string | null;
	updatedBy?: string | null;
	lastRun?: { at: string; source: "cron" | "manual"; candidatas: number; modified: number } | null;
}

export interface UbicacionRuleResponse {
	rule: UbicacionRule;
	coverage: { activas: number; pjn: number; asignadasPorRegla: number };
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

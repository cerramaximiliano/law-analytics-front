import {
	DistributeArchivedScope,
	DistributeCriteria,
	DistributeCriteriaType,
	DistributeMode,
	DistributeOrder,
	DistributePreview,
	DistributeRequest,
	RadicacionCounts,
	RadicacionSummary,
} from "types/folderDistribute";
import { TeamAssignee } from "./teamAssignees";

// Lógica pura del asistente «Repartir carpetas» (Equipos, fase 3, 6/11/2026): filas de
// juzgados y fueros a partir del resumen de radicación, pre-llenado en partes iguales,
// armado y validación del pedido, y vista previa con nombres.

export const SIN_JUZGADO = "";
export const MAX_DISTRIBUTE_FOLDERS = 10000;

export interface CriteriaRow {
	/** Clave que espera el hub: número de juzgado ("" = sin juzgado) o nombre del fuero. */
	key: string;
	label: string;
	/** Fueros donde aparece ese número de juzgado (solo filas de juzgado). */
	fueros: string[];
	/** Carpetas en el alcance elegido (activas / archivadas / todas). */
	count: number;
	/** De esas, cuántas no tienen responsable (activas y archivadas juntas). */
	sinResponsable: number;
}

// «Juz. 7»; cuando el «número» es un nombre (MEV/SCBA, Corte) va tal cual, como en la columna Radicación (14/11/2026).
export const juzgadoLabel = (key: string): string => (!key ? "Sin juzgado" : /^\d+$/.test(key) ? `Juz. ${key}` : key);

export const countForScope = (c: RadicacionCounts, archived: DistributeArchivedScope): number =>
	archived === "active" ? c.activas : archived === "archived" ? c.archivadas : c.activas + c.archivadas;

const numOrInf = (s: string) => (s && /^\d+$/.test(s) ? parseInt(s, 10) : Number.POSITIVE_INFINITY);

/** Filas de juzgado (una por número, con los fueros donde aparece), acotadas por fuero si se pide. */
export function juzgadoRows(summary: RadicacionSummary | null, archived: DistributeArchivedScope, fueros: string[] = []): CriteriaRow[] {
	if (!summary) return [];
	const byKey = new Map<string, CriteriaRow>();
	for (const r of summary.juzgados) {
		if (fueros.length && !fueros.includes(r.fuero)) continue;
		const key = String(r.juzgado || "").trim();
		const row = byKey.get(key) || { key, label: juzgadoLabel(key), fueros: [], count: 0, sinResponsable: 0 };
		if (r.fuero && !row.fueros.includes(r.fuero)) row.fueros.push(r.fuero);
		row.count += countForScope(r, archived);
		row.sinResponsable += r.sinResponsable;
		byKey.set(key, row);
	}
	return [...byKey.values()].filter((r) => r.count > 0).sort((a, b) => numOrInf(a.key) - numOrInf(b.key) || a.key.localeCompare(b.key));
}

/** Filas de Sala de Cámara (radicación): una por sala, con los fueros donde aparece. Numéricas primero, después las de letra. */
export function salaRows(summary: RadicacionSummary | null, archived: DistributeArchivedScope, fueros: string[] = []): CriteriaRow[] {
	if (!summary) return [];
	const byKey = new Map<string, CriteriaRow>();
	for (const r of summary.salas || []) {
		if (fueros.length && !fueros.includes(r.fuero)) continue;
		const key = String(r.sala || "").trim();
		if (!key) continue;
		const row = byKey.get(key) || { key, label: `Sala ${key}`, fueros: [], count: 0, sinResponsable: 0 };
		if (r.fuero && !row.fueros.includes(r.fuero)) row.fueros.push(r.fuero);
		row.count += countForScope(r, archived);
		row.sinResponsable += r.sinResponsable;
		byKey.set(key, row);
	}
	return [...byKey.values()]
		.filter((r) => r.count > 0)
		.sort((a, b) => numOrInf(a.key) - numOrInf(b.key) || a.key.localeCompare(b.key, "es"));
}

const UBICACION_ORDER = ["juzgado", "camara", "corte", "tribunal-oral", "archivo", "otro", ""];

/** Filas de ubicación actual (dónde está hoy el expediente): 1ª instancia, Cámara, Corte, Tribunal oral, Archivo, otra. */
export function ubicacionRows(summary: RadicacionSummary | null, archived: DistributeArchivedScope): CriteriaRow[] {
	if (!summary) return [];
	return (summary.ubicaciones || [])
		.map((r) => ({
			key: r.key ?? "",
			label: r.ubicacion || "Sin dato",
			fueros: [],
			count: countForScope(r, archived),
			sinResponsable: r.sinResponsable,
		}))
		.filter((r) => r.count > 0)
		.sort((a, b) => UBICACION_ORDER.indexOf(a.key) - UBICACION_ORDER.indexOf(b.key));
}

/** Criterios que asignan por tabla «clave → responsables». */
export const MAP_CRITERIA: DistributeCriteriaType[] = ["juzgado", "fuero", "sala", "ubicacion"];
export const isMapCriteria = (t: DistributeCriteriaType): boolean => MAP_CRITERIA.includes(t);

/** Palabras de cada criterio por tabla, para encabezados, avisos y errores. */
export const MAP_LABELS: Record<string, { column: string; plural: string; error: string }> = {
	juzgado: { column: "Juzgado", plural: "juzgados", error: "Elegí un responsable para al menos un juzgado" },
	fuero: { column: "Fuero", plural: "fueros", error: "Elegí un responsable para al menos un fuero" },
	sala: { column: "Sala de Cámara", plural: "salas de Cámara", error: "Elegí un responsable para al menos una sala" },
	ubicacion: { column: "Ubicación actual", plural: "ubicaciones", error: "Elegí un responsable para al menos una ubicación" },
};

export interface RadicacionFilterOption {
	/** `j:<número>` (juzgado de origen, "" = sin juzgado) o `s:<sala>` (Sala de Cámara). */
	value: string;
	label: string;
	group: "Juzgado de origen" | "Sala de Cámara";
	count: number;
}

/**
 * Opciones del filtro «Radicación» del alcance (14/11/2026, como el modal de archivadas): juzgados de origen y
 * salas de Cámara por las que pasó la causa, con el conteo del alcance.
 */
export function radicacionFilterOptions(
	summary: RadicacionSummary | null,
	archived: DistributeArchivedScope,
	fueros: string[] = [],
): RadicacionFilterOption[] {
	const js = juzgadoRows(summary, archived, fueros).map((r) => ({
		value: `j:${r.key}`,
		label: `${r.label}${r.fueros.length === 1 ? ` · ${r.fueros[0]}` : ""}`,
		group: "Juzgado de origen" as const,
		count: r.count,
	}));
	const ss = salaRows(summary, archived, fueros).map((r) => ({
		value: `s:${r.key}`,
		label: `${r.label}${r.fueros.length === 1 ? ` · ${r.fueros[0]}` : ""}`,
		group: "Sala de Cámara" as const,
		count: r.count,
	}));
	return [...js, ...ss];
}

/** Valores del filtro «Radicación» → claves del hub. Juzgado y sala se combinan (una causa del Juzgado 29 que pasó por la Sala D). */
export const splitRadicacion = (values: string[]): { juzgados: string[]; salas: string[] } => ({
	juzgados: values.filter((v) => v.startsWith("j:")).map((v) => v.slice(2)),
	salas: values.filter((v) => v.startsWith("s:")).map((v) => v.slice(2)),
});
export const joinRadicacion = (juzgados: string[], salas: string[]): string[] => [
	...juzgados.map((k) => `j:${k}`),
	...salas.map((k) => `s:${k}`),
];

/** Filas de fuero. */
export function fueroRows(summary: RadicacionSummary | null, archived: DistributeArchivedScope): CriteriaRow[] {
	if (!summary) return [];
	return summary.fueros
		.map((r) => ({
			key: r.fuero,
			label: r.fuero || "Sin fuero",
			fueros: [],
			count: countForScope(r, archived),
			sinResponsable: r.sinResponsable,
		}))
		.filter((r) => r.count > 0)
		.sort((a, b) => b.count - a.count || a.label.localeCompare(b.label, "es"));
}

/**
 * Reparte claves enteras (juzgados o fueros) entre responsables equilibrando la cantidad de
 * carpetas: de la clave más grande a la más chica, cada una va al que menos acumula
 * (empate: el primero de la lista). Determinista.
 */
export function splitKeysEqually(rows: { key: string; count: number }[], assigneeIds: string[]): Record<string, string[]> {
	const ids = [...new Set(assigneeIds.filter(Boolean))];
	const out: Record<string, string[]> = {};
	if (!ids.length) return out;
	const load = new Map(ids.map((id) => [id, 0]));
	const sorted = [...rows].sort((a, b) => b.count - a.count || a.key.localeCompare(b.key));
	for (const r of sorted) {
		let best = ids[0];
		for (const id of ids) if ((load.get(id) as number) < (load.get(best) as number)) best = id;
		out[r.key] = [best];
		load.set(best, (load.get(best) as number) + r.count);
	}
	return out;
}

export interface DistributeWizardState {
	archived: DistributeArchivedScope;
	onlyUnassigned: boolean;
	fueros: string[];
	juzgados: string[];
	/** Salas de Cámara (radicación) y ubicación actual del alcance (14/11/2026). */
	salas: string[];
	ubicaciones: string[];
	folderIds: string[];
	type: DistributeCriteriaType;
	map: Record<string, string[]>;
	assignees: string[];
	quantities: Record<string, number>;
	rest: string | null;
	order: DistributeOrder;
	seed: number;
	mode: DistributeMode;
}

export const newSeed = (): number => Math.floor(Math.random() * 1_000_000) + 1;

export function initialWizardState(folderIds: string[] = []): DistributeWizardState {
	return {
		archived: folderIds.length ? "all" : "active",
		onlyUnassigned: true,
		fueros: [],
		juzgados: [],
		salas: [],
		ubicaciones: [],
		folderIds,
		type: "juzgado",
		map: {},
		assignees: [],
		quantities: {},
		rest: null,
		order: "juzgado",
		seed: newSeed(),
		mode: "replace",
	};
}

export type BuildResult = { ok: true; request: DistributeRequest } | { ok: false; error: string };

/** Arma el pedido al hub y valida lo mínimo para no mandar un criterio vacío. */
export function buildDistributeRequest(s: DistributeWizardState, dryRun: boolean): BuildResult {
	const filters: NonNullable<DistributeRequest["scope"]["filters"]> = {};
	if (s.fueros.length) filters.fuero = s.fueros;
	if (s.juzgados.length) filters.juzgado = s.juzgados;
	if (s.salas.length) filters.sala = s.salas;
	if (s.ubicaciones.length) filters.ubicacion = s.ubicaciones;
	if (s.folderIds.length) filters.folderIds = s.folderIds;
	const scope: DistributeRequest["scope"] = { archived: s.archived, onlyUnassigned: s.onlyUnassigned, filters };

	let criteria: DistributeCriteria;
	if (isMapCriteria(s.type)) {
		const map: Record<string, string[]> = {};
		for (const [k, ids] of Object.entries(s.map)) if (Array.isArray(ids) && ids.length) map[k] = [...new Set(ids)];
		if (!Object.keys(map).length) return { ok: false, error: MAP_LABELS[s.type].error };
		criteria = { type: s.type, map };
	} else if (s.type === "quantities") {
		const quantities: Record<string, number | string> = {};
		for (const [id, n] of Object.entries(s.quantities)) if (Number.isFinite(n) && n > 0) quantities[id] = Math.floor(n);
		if (s.rest) quantities.rest = s.rest;
		if (!Object.keys(quantities).length)
			return { ok: false, error: "Indicá una cantidad para al menos un responsable, o quién recibe el resto" };
		criteria = { type: "quantities", quantities, order: s.order };
	} else {
		const assignees = [...new Set(s.assignees.filter(Boolean))];
		if (!assignees.length) return { ok: false, error: "Elegí entre quiénes repartir" };
		criteria = s.type === "equal" ? { type: "equal", assignees, order: s.order } : { type: "random", assignees, seed: s.seed };
	}
	return { ok: true, request: { scope, criteria, mode: s.mode, dryRun } };
}

export interface PreviewRowWithName {
	id: string;
	name: string;
	initials: string;
	avatar?: string;
	tag: string;
	cantidad: number;
	/** «Juz. 7 (120) · Juz. 2 (40)», los más grandes primero, hasta `max`. */
	juzgados: string;
	juzgadosTotal: number;
	/** «2ª instancia (Cámara) (12) · Corte Suprema (3)», si el hub lo informa. */
	ubicaciones: string;
}

export function previewRows(
	preview: DistributePreview | null,
	assignees: TeamAssignee[],
	tagOf: (a: TeamAssignee) => string,
	max = 6,
): PreviewRowWithName[] {
	if (!preview) return [];
	const byId = new Map(assignees.map((a) => [a.id, a]));
	return preview.porResponsable.map((r) => {
		const a = byId.get(r.id);
		const entries = Object.entries(r.porJuzgado || {}).sort((x, y) => y[1] - x[1] || numOrInf(x[0]) - numOrInf(y[0]));
		const shown = entries.slice(0, max).map(([k, n]) => `${k === "Sin juzgado" ? k : `Juz. ${k}`} (${n})`);
		const ubic = Object.entries(r.porUbicacion || {}).sort((x, y) => y[1] - x[1] || x[0].localeCompare(y[0], "es"));
		return {
			id: r.id,
			name: a?.name || "Integrante",
			initials: a?.initials || "?",
			avatar: a?.avatar,
			tag: a ? tagOf(a) : "",
			cantidad: r.cantidad,
			juzgados: shown.join(" · ") + (entries.length > max ? ` · y ${entries.length - max} más` : ""),
			juzgadosTotal: entries.length,
			ubicaciones:
				ubic
					.slice(0, max)
					.map(([k, n]) => `${k} (${n})`)
					.join(" · ") + (ubic.length > max ? ` · y ${ubic.length - max} más` : ""),
		};
	});
}

export const CRITERIA_OPTIONS: { value: DistributeCriteriaType; label: string; help: string }[] = [
	{
		value: "juzgado",
		label: "Por juzgado",
		help: "Cada juzgado de origen va a los responsables que elijas. Podés pre-llenar en partes iguales.",
	},
	{ value: "fuero", label: "Por fuero", help: "Cada fuero va a los responsables que elijas." },
	{
		value: "sala",
		label: "Por sala de Cámara",
		help: "Cada Sala de la Cámara por la que pasó la causa va a los responsables que elijas (es la radicación: se conserva aunque la causa haya vuelto al juzgado).",
	},
	{
		value: "ubicacion",
		label: "Por ubicación actual",
		help: "Según dónde está hoy el expediente: 1ª instancia, Cámara, Corte Suprema, Tribunal oral o Archivo. Las que están en Cámara o en la Corte pueden ir a quien las siga.",
	},
	{
		value: "equal",
		label: "Partes iguales",
		help: "La misma cantidad para cada uno (±1). Con orden por juzgado, cada uno recibe juzgados enteros cuando se puede.",
	},
	{ value: "quantities", label: "Por cantidades", help: "Una cantidad fija para cada uno, en orden; el resto a quien indiques." },
	{ value: "random", label: "Al azar", help: "Reparto aleatorio y parejo. Con el mismo número de sorteo se repite igual." },
];

export const ORDER_OPTIONS: { value: DistributeOrder; label: string }[] = [
	{ value: "juzgado", label: "Por juzgado (tramos enteros)" },
	{ value: "ultimoMovimiento", label: "Por último movimiento (alternando)" },
	{ value: "caratula", label: "Por carátula (alternando)" },
];

export const ARCHIVED_OPTIONS: { value: DistributeArchivedScope; label: string }[] = [
	{ value: "active", label: "Activas" },
	{ value: "archived", label: "Archivadas" },
	{ value: "all", label: "Todas" },
];

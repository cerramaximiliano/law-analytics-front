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

export const juzgadoLabel = (key: string): string => (key ? `Juz. ${key}` : "Sin juzgado");

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
	if (s.folderIds.length) filters.folderIds = s.folderIds;
	const scope: DistributeRequest["scope"] = { archived: s.archived, onlyUnassigned: s.onlyUnassigned, filters };

	let criteria: DistributeCriteria;
	if (s.type === "juzgado" || s.type === "fuero") {
		const map: Record<string, string[]> = {};
		for (const [k, ids] of Object.entries(s.map)) if (Array.isArray(ids) && ids.length) map[k] = [...new Set(ids)];
		if (!Object.keys(map).length) {
			return {
				ok: false,
				error: s.type === "juzgado" ? "Elegí un responsable para al menos un juzgado" : "Elegí un responsable para al menos un fuero",
			};
		}
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
		return {
			id: r.id,
			name: a?.name || "Integrante",
			initials: a?.initials || "?",
			avatar: a?.avatar,
			tag: a ? tagOf(a) : "",
			cantidad: r.cantidad,
			juzgados: shown.join(" · ") + (entries.length > max ? ` · y ${entries.length - max} más` : ""),
			juzgadosTotal: entries.length,
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

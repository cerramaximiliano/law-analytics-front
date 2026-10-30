import dayjs from "utils/dayjs-config";
import { TeamAssignee } from "utils/teamAssignees";

// Equipos: agrupado por responsable, armado de CSV e impresión de listados
// (distribución de carpetas, tareas y eventos). Las funciones de armado son puras;
// `printHtml` y `downloadCsv` son las únicas que tocan el DOM.

/** Clave del grupo de lo que no tiene responsable. */
export const SIN_RESPONSABLE = "__sin_responsable__";

export interface ResponsableGroup<T> {
	key: string; // id del integrante o SIN_RESPONSABLE
	label: string;
	email?: string;
	isOwner?: boolean;
	items: T[];
}

export interface GroupByResponsableOptions {
	/** Solo el grupo de ese integrante (o SIN_RESPONSABLE). */
	onlyKey?: string | null;
	/** Texto del grupo sin responsable (default «Sin responsable»). */
	emptyLabel?: string;
	/** Incluye integrantes sin ítems (y el grupo sin responsable vacío). */
	includeEmptyGroups?: boolean;
}

/**
 * Agrupa los ítems por responsable: un grupo por integrante (owner primero, en el orden del
 * equipo), después ids que ya no están en el equipo («Ex integrante») y al final los que no
 * tienen responsable. Un ítem con varios responsables aparece en cada grupo.
 */
export function groupByResponsable<T>(
	items: T[],
	getIds: (item: T) => string[] | undefined | null,
	assignees: TeamAssignee[],
	options: GroupByResponsableOptions = {},
): ResponsableGroup<T>[] {
	const { onlyKey, emptyLabel = "Sin responsable", includeEmptyGroups = false } = options;

	const groups = new Map<string, ResponsableGroup<T>>();
	for (const a of assignees) {
		groups.set(a.id, { key: a.id, label: a.name, email: a.email, isOwner: a.isOwner, items: [] });
	}
	const unknown = new Map<string, ResponsableGroup<T>>();
	const sinResponsable: ResponsableGroup<T> = { key: SIN_RESPONSABLE, label: emptyLabel, items: [] };

	for (const item of items) {
		const ids = [...new Set((getIds(item) || []).map(String).filter(Boolean))];
		if (ids.length === 0) {
			sinResponsable.items.push(item);
			continue;
		}
		for (const id of ids) {
			const known = groups.get(id);
			if (known) {
				known.items.push(item);
				continue;
			}
			let group = unknown.get(id);
			if (!group) {
				group = { key: id, label: "Ex integrante", items: [] };
				unknown.set(id, group);
			}
			group.items.push(item);
		}
	}

	let result = [...groups.values(), ...unknown.values(), sinResponsable];
	if (onlyKey) result = result.filter((g) => g.key === onlyKey);
	if (!includeEmptyGroups) result = result.filter((g) => g.items.length > 0);
	return result;
}

// ==============================|| CSV ||============================== //

type Cell = string | number | null | undefined;

export function csvCell(value: Cell): string {
	const text = value === null || value === undefined ? "" : String(value);
	return /[",\n\r;]/.test(text) ? `"${text.replace(/"/g, '""')}"` : text;
}

export function buildCsv(headers: string[], rows: Cell[][]): string {
	return [headers, ...rows].map((row) => row.map(csvCell).join(",")).join("\r\n");
}

/** Descarga un CSV (con BOM para que Excel respete los acentos). */
export function downloadCsv(csv: string, filename: string): void {
	const blob = new Blob(["﻿" + csv], { type: "text/csv;charset=utf-8;" });
	const url = URL.createObjectURL(blob);
	const link = document.createElement("a");
	link.href = url;
	link.download = filename;
	link.style.display = "none";
	document.body.appendChild(link);
	link.click();
	document.body.removeChild(link);
	setTimeout(() => URL.revokeObjectURL(url), 1000);
}

// ==============================|| CARPETAS ||============================== //

export interface DistributionFolder {
	_id: string;
	folderName?: string;
	folderJuris?: string | { item?: string; label?: string } | null;
	folderFuero?: string | null;
	judFolder?: { numberJudFolder?: string } | null;
	responsables?: string[];
}

export function folderJurisLabel(juris: DistributionFolder["folderJuris"]): string {
	if (!juris) return "";
	if (typeof juris === "string") return juris;
	return juris.label || juris.item || "";
}

export function folderExpediente(folder: DistributionFolder): string {
	return folder.judFolder?.numberJudFolder?.trim() || "";
}

export const DISTRIBUTION_CSV_HEADERS = ["Responsable", "Email", "Carátula", "Jurisdicción", "Fuero", "Expediente"];

export function buildDistributionCsv(groups: ResponsableGroup<DistributionFolder>[]): string {
	const rows: Cell[][] = [];
	for (const g of groups) {
		for (const f of g.items) {
			rows.push([
				g.label,
				g.key === SIN_RESPONSABLE ? "" : g.email || "",
				f.folderName || "",
				folderJurisLabel(f.folderJuris),
				f.folderFuero || "",
				folderExpediente(f),
			]);
		}
	}
	return buildCsv(DISTRIBUTION_CSV_HEADERS, rows);
}

// ==============================|| IMPRESIÓN ||============================== //

export interface PrintSection {
	heading: string;
	subheading?: string;
	columns: string[];
	rows: Cell[][];
	emptyText?: string;
}

export interface PrintDocument {
	title: string;
	subtitle?: string;
	sections: PrintSection[];
	emptyText?: string;
}

export function escapeHtml(value: Cell): string {
	const text = value === null || value === undefined ? "" : String(value);
	return text.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;").replace(/"/g, "&quot;").replace(/'/g, "&#39;");
}

export function todayLabel(date: Date = new Date()): string {
	return dayjs(date).format("DD/MM/YYYY");
}

const PRINT_CSS = `
  * { box-sizing: border-box; }
  body { font-family: Arial, Helvetica, sans-serif; font-size: 10.5pt; color: #000; margin: 0; }
  h1 { font-size: 15pt; margin: 0 0 2pt; }
  .subtitle { font-size: 9.5pt; color: #333; margin: 0 0 14pt; }
  section { margin: 0 0 14pt; }
  h2 { font-size: 11.5pt; margin: 0 0 4pt; padding-bottom: 2pt; border-bottom: 1.5px solid #000; }
  h2 .meta { font-weight: normal; font-size: 9.5pt; color: #333; }
  table { width: 100%; border-collapse: collapse; }
  th { text-align: left; font-size: 8.5pt; text-transform: uppercase; letter-spacing: 0.04em; border-bottom: 1px solid #000; padding: 3pt 4pt; }
  td { padding: 3pt 4pt; border-bottom: 1px solid #bbb; vertical-align: top; }
  tr { page-break-inside: avoid; }
  .empty { font-style: italic; color: #333; }
  @page { size: A4; margin: 15mm; }
`;

export function buildPrintHtml(doc: PrintDocument): string {
	const sections = doc.sections
		.map((s) => {
			const head = `<h2>${escapeHtml(s.heading)}${s.subheading ? ` <span class="meta">· ${escapeHtml(s.subheading)}</span>` : ""}</h2>`;
			if (s.rows.length === 0) {
				return `<section>${head}<p class="empty">${escapeHtml(s.emptyText || "Sin elementos")}</p></section>`;
			}
			const thead = `<tr>${s.columns.map((c) => `<th>${escapeHtml(c)}</th>`).join("")}</tr>`;
			const tbody = s.rows.map((r) => `<tr>${r.map((c) => `<td>${escapeHtml(c)}</td>`).join("")}</tr>`).join("");
			return `<section>${head}<table><thead>${thead}</thead><tbody>${tbody}</tbody></table></section>`;
		})
		.join("");
	const body = sections || `<p class="empty">${escapeHtml(doc.emptyText || "No hay elementos para imprimir.")}</p>`;
	return (
		`<!DOCTYPE html><html lang="es"><head><meta charset="utf-8"/><title>${escapeHtml(doc.title)}</title>` +
		`<style>${PRINT_CSS}</style></head><body><h1>${escapeHtml(doc.title)}</h1>` +
		(doc.subtitle ? `<p class="subtitle">${escapeHtml(doc.subtitle)}</p>` : "") +
		`${body}</body></html>`
	);
}

/** Imprime el HTML desde un iframe oculto (mismo mecanismo que printRichTextDocument). */
export function printHtml(html: string): void {
	const IFRAME_ID = "__team-report-print__";
	const existing = document.getElementById(IFRAME_ID);
	if (existing) existing.remove();

	const iframe = document.createElement("iframe");
	iframe.id = IFRAME_ID;
	iframe.style.cssText = "position:fixed;right:0;bottom:0;width:0;height:0;border:0;visibility:hidden";
	document.body.appendChild(iframe);

	const win = iframe.contentWindow;
	if (!win) return;
	win.document.open();
	win.document.write(html);
	win.document.close();
	setTimeout(() => {
		win.focus();
		win.print();
	}, 300);
}

/** Texto del grupo para el encabezado impreso: «Nombre · email» y cantidad. */
export function groupSubheading(group: ResponsableGroup<unknown>, singular: string, plural: string): string {
	const count = `${group.items.length} ${group.items.length === 1 ? singular : plural}`;
	return group.email && group.email !== group.label ? `${group.email} · ${count}` : count;
}

/** Nombre de archivo seguro con fecha: «distribucion-responsables-<equipo>-30-10-2026.csv». */
export function reportFilename(base: string, teamName: string | undefined, ext: string, date: Date = new Date()): string {
	const slug = (teamName || "")
		.normalize("NFD")
		.replace(/[̀-ͯ]/g, "")
		.toLowerCase()
		.replace(/[^a-z0-9]+/g, "-")
		.replace(/^-+|-+$/g, "");
	return `${[base, slug, dayjs(date).format("DD-MM-YYYY")].filter(Boolean).join("-")}.${ext}`;
}

// ==============================|| TAREAS ||============================== //

export interface PrintableTask {
	_id: string;
	name: string;
	dueDate?: Date | string | null;
	priority?: string;
	status?: string;
	folderId?: string;
	assignedTo?: string[];
}

const TASK_PRIORITY_LABELS: Record<string, string> = { alta: "Alta", media: "Media", baja: "Baja" };
const TASK_STATUS_LABELS: Record<string, string> = {
	pendiente: "Pendiente",
	en_progreso: "En progreso",
	revision: "Revisión",
	completada: "Completada",
	cancelada: "Cancelada",
};

const timeOf = (value: Date | string | null | undefined) => {
	const t = value ? new Date(value).getTime() : NaN;
	return Number.isNaN(t) ? Number.POSITIVE_INFINITY : t;
};

/** Tareas agrupadas por responsable («Sin asignar» al final), ordenadas por vencimiento. */
export function buildTasksPrintDocument(params: {
	teamName?: string;
	tasks: PrintableTask[];
	assignees: TeamAssignee[];
	folderNames: Record<string, string>;
	onlyKey?: string | null;
	date?: Date;
}): PrintDocument {
	const { teamName, tasks, assignees, folderNames, onlyKey, date = new Date() } = params;
	const sorted = [...tasks].sort((a, b) => timeOf(a.dueDate) - timeOf(b.dueDate));
	const groups = groupByResponsable(sorted, (t) => t.assignedTo, assignees, { onlyKey, emptyLabel: "Sin asignar" });
	const onlyLabel = onlyKey ? groups[0]?.label || assignees.find((a) => a.id === onlyKey)?.name : null;
	return {
		title: `${teamName || "Equipo"} · Tareas por responsable`,
		subtitle: [onlyLabel ? `Responsable: ${onlyLabel}` : null, `Impreso el ${todayLabel(date)}`].filter(Boolean).join(" · "),
		emptyText: "No hay tareas para imprimir.",
		sections: groups.map((g) => ({
			heading: g.label,
			subheading: groupSubheading(g, "tarea", "tareas"),
			columns: ["Tarea", "Vencimiento", "Prioridad", "Estado", "Carpeta"],
			rows: g.items.map((t) => [
				t.name,
				t.dueDate ? dayjs(t.dueDate).format("DD/MM/YYYY") : "",
				t.priority ? TASK_PRIORITY_LABELS[t.priority] || t.priority : "",
				TASK_STATUS_LABELS[t.status || "pendiente"] || t.status || "",
				t.folderId ? folderNames[t.folderId] || "" : "",
			]),
		})),
	};
}

// ==============================|| EVENTOS ||============================== //

export interface PrintableEvent {
	_id?: string;
	title: string;
	start: Date | string;
	allDay?: boolean;
	folderName?: string;
	responsables?: string[];
}

/** Filtro del calendario: undefined/«todos» no filtra; SIN_RESPONSABLE, sin responsables; si no, ese integrante. */
export function eventMatchesResponsable(event: PrintableEvent, filter: string | null | undefined): boolean {
	if (!filter || filter === "todos") return true;
	const ids = (event.responsables || []).map(String);
	if (filter === SIN_RESPONSABLE) return ids.length === 0;
	return ids.includes(filter);
}

/** Eventos agrupados por responsable («Sin responsable» al final), ordenados por fecha. */
export function buildEventsPrintDocument(params: {
	teamName?: string;
	events: PrintableEvent[];
	assignees: TeamAssignee[];
	periodLabel?: string;
	onlyKey?: string | null;
	date?: Date;
}): PrintDocument {
	const { teamName, events, assignees, periodLabel, onlyKey, date = new Date() } = params;
	const sorted = [...events].sort((a, b) => timeOf(a.start) - timeOf(b.start));
	const groups = groupByResponsable(sorted, (e) => e.responsables, assignees, { onlyKey });
	const onlyLabel = onlyKey ? groups[0]?.label || assignees.find((a) => a.id === onlyKey)?.name : null;
	return {
		title: `${teamName || "Equipo"} · Eventos por responsable`,
		subtitle: [periodLabel, onlyLabel ? `Responsable: ${onlyLabel}` : null, `Impreso el ${todayLabel(date)}`].filter(Boolean).join(" · "),
		emptyText: "No hay eventos para imprimir en este período.",
		sections: groups.map((g) => ({
			heading: g.label,
			subheading: groupSubheading(g, "evento", "eventos"),
			columns: ["Fecha", "Título", "Carpeta"],
			rows: g.items.map((e) => [dayjs(e.start).format(e.allDay ? "DD/MM/YYYY" : "DD/MM/YYYY HH:mm"), e.title, e.folderName || ""]),
		})),
	};
}

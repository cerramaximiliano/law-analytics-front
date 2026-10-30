/**
 * Tests para utils/teamReports.ts: agrupado por responsable, CSV de distribución,
 * HTML de impresión y documentos de tareas/eventos.
 */

import { describe, it, expect } from "vitest";
import { TeamAssignee } from "utils/teamAssignees";
import {
	SIN_RESPONSABLE,
	buildCsv,
	buildDistributionCsv,
	buildEventsPrintDocument,
	buildPrintHtml,
	buildTasksPrintDocument,
	csvCell,
	escapeHtml,
	eventMatchesResponsable,
	folderJurisLabel,
	groupByResponsable,
	reportFilename,
	DistributionFolder,
} from "utils/teamReports";

const owner: TeamAssignee = { id: "o1", name: "Ana Owner", email: "ana@x.com", initials: "AO", isOwner: true };
const m1: TeamAssignee = { id: "m1", name: "Beto Miembro", email: "beto@x.com", initials: "BM", isOwner: false };
const m2: TeamAssignee = { id: "m2", name: "Caro Miembro", email: "caro@x.com", initials: "CM", isOwner: false };
const assignees = [owner, m1, m2];

type Item = { id: string; ids?: string[] };

describe("groupByResponsable", () => {
	const items: Item[] = [
		{ id: "a", ids: ["m1"] },
		{ id: "b", ids: ["o1", "m1"] },
		{ id: "c", ids: [] },
		{ id: "d" },
		{ id: "e", ids: ["gone"] },
	];

	it("agrupa en el orden del equipo, ex integrantes después y sin responsable al final", () => {
		const groups = groupByResponsable(items, (i) => i.ids, assignees);
		expect(groups.map((g) => g.key)).toEqual(["o1", "m1", "gone", SIN_RESPONSABLE]);
		expect(groups.find((g) => g.key === "m1")?.items.map((i) => i.id)).toEqual(["a", "b"]);
		expect(groups.find((g) => g.key === "gone")?.label).toBe("Ex integrante");
		expect(groups[groups.length - 1].items.map((i) => i.id)).toEqual(["c", "d"]);
	});

	it("un ítem con varios responsables aparece en cada grupo", () => {
		const groups = groupByResponsable(items, (i) => i.ids, assignees);
		expect(groups.find((g) => g.key === "o1")?.items.map((i) => i.id)).toEqual(["b"]);
		expect(groups.find((g) => g.key === "m1")?.items.some((i) => i.id === "b")).toBe(true);
	});

	it("no duplica si el mismo id viene repetido", () => {
		const groups = groupByResponsable([{ id: "x", ids: ["m1", "m1"] }], (i) => i.ids, assignees);
		expect(groups[0].items).toHaveLength(1);
	});

	it("includeEmptyGroups muestra a todos los integrantes, aunque no tengan ítems", () => {
		const groups = groupByResponsable([], (i: Item) => i.ids, assignees, { includeEmptyGroups: true });
		expect(groups.map((g) => g.key)).toEqual(["o1", "m1", "m2", SIN_RESPONSABLE]);
		expect(groups.every((g) => g.items.length === 0)).toBe(true);
	});

	it("onlyKey deja solo ese grupo (también el de sin responsable)", () => {
		expect(groupByResponsable(items, (i) => i.ids, assignees, { onlyKey: "m1" }).map((g) => g.key)).toEqual(["m1"]);
		expect(groupByResponsable(items, (i) => i.ids, assignees, { onlyKey: SIN_RESPONSABLE }).map((g) => g.key)).toEqual([SIN_RESPONSABLE]);
	});

	it("respeta emptyLabel", () => {
		const groups = groupByResponsable([{ id: "z" }], (i: Item) => i.ids, assignees, { emptyLabel: "Sin asignar" });
		expect(groups[0].label).toBe("Sin asignar");
	});
});

describe("CSV", () => {
	it("escapa comillas, comas y saltos de línea", () => {
		expect(csvCell('Pérez, Juan c/ "X"')).toBe('"Pérez, Juan c/ ""X"""');
		expect(csvCell("simple")).toBe("simple");
		expect(csvCell(null)).toBe("");
		expect(buildCsv(["A", "B"], [["1", "2,3"]])).toBe('A,B\r\n1,"2,3"');
	});

	it("arma la distribución con una fila por carpeta y responsable", () => {
		const folders: DistributionFolder[] = [
			{
				_id: "f1",
				folderName: "Gómez c/ Pérez",
				folderJuris: { item: "caba", label: "CABA" },
				folderFuero: "Civil",
				judFolder: { numberJudFolder: "1234/2025" },
				responsables: ["o1", "m1"],
			},
			{ _id: "f2", folderName: "Sin dueño", folderJuris: "Salta", responsables: [] },
		];
		const groups = groupByResponsable(folders, (f) => f.responsables, assignees);
		const lines = buildDistributionCsv(groups).split("\r\n");
		expect(lines[0]).toBe("Responsable,Email,Carátula,Jurisdicción,Fuero,Expediente");
		expect(lines[1]).toBe("Ana Owner,ana@x.com,Gómez c/ Pérez,CABA,Civil,1234/2025");
		expect(lines[2]).toBe("Beto Miembro,beto@x.com,Gómez c/ Pérez,CABA,Civil,1234/2025");
		expect(lines[3]).toBe("Sin responsable,,Sin dueño,Salta,,");
		expect(lines).toHaveLength(4);
	});

	it("folderJurisLabel acepta string u objeto", () => {
		expect(folderJurisLabel("Mendoza")).toBe("Mendoza");
		expect(folderJurisLabel({ item: "x", label: "Catamarca" })).toBe("Catamarca");
		expect(folderJurisLabel(undefined)).toBe("");
	});

	it("reportFilename normaliza el nombre del equipo", () => {
		expect(reportFilename("distribucion", "Estudio Núñez & Asoc.", "csv", new Date(2026, 9, 30))).toBe(
			"distribucion-estudio-nunez-asoc-30-10-2026.csv",
		);
	});
});

describe("impresión", () => {
	it("escapa HTML en títulos y celdas", () => {
		expect(escapeHtml('<b>"x"</b> & y')).toBe("&lt;b&gt;&quot;x&quot;&lt;/b&gt; &amp; y");
		const html = buildPrintHtml({
			title: "Equipo <script>",
			sections: [{ heading: "Ana", columns: ["Tarea"], rows: [["<img onerror=1>"]] }],
		});
		expect(html).not.toContain("<script>");
		expect(html).not.toContain("<img");
		expect(html).toContain("&lt;img onerror=1&gt;");
	});

	it("sin secciones muestra el texto vacío", () => {
		const html = buildPrintHtml({ title: "T", sections: [], emptyText: "Nada para imprimir" });
		expect(html).toContain("Nada para imprimir");
	});

	it("tareas: agrupa por responsable, ordena por vencimiento y deja «Sin asignar» al final", () => {
		const doc = buildTasksPrintDocument({
			teamName: "Estudio",
			tasks: [
				{ _id: "t1", name: "Contestar", dueDate: "2026-11-10T12:00:00Z", priority: "alta", status: "pendiente", assignedTo: ["m1"] },
				{ _id: "t2", name: "Alegato", dueDate: "2026-11-02T12:00:00Z", status: "en_progreso", folderId: "f1", assignedTo: ["m1"] },
				{ _id: "t3", name: "Huérfana", dueDate: "2026-11-01T12:00:00Z", assignedTo: [] },
			],
			assignees,
			folderNames: { f1: "Gómez c/ Pérez" },
			date: new Date(2026, 9, 30),
		});
		expect(doc.title).toBe("Estudio · Tareas por responsable");
		expect(doc.sections.map((s) => s.heading)).toEqual(["Beto Miembro", "Sin asignar"]);
		expect(doc.sections[0].rows[0]).toEqual(["Alegato", "02/11/2026", "", "En progreso", "Gómez c/ Pérez"]);
		expect(doc.sections[0].rows[1]).toEqual(["Contestar", "10/11/2026", "Alta", "Pendiente", ""]);
	});

	it("tareas: con un responsable elegido, solo su grupo y lo nombra en el subtítulo", () => {
		const doc = buildTasksPrintDocument({
			tasks: [{ _id: "t1", name: "X", assignedTo: ["m1", "o1"] }],
			assignees,
			folderNames: {},
			onlyKey: "m1",
		});
		expect(doc.sections).toHaveLength(1);
		expect(doc.subtitle).toContain("Responsable: Beto Miembro");
	});

	it("eventos: filtro por responsable", () => {
		const ev = { title: "Audiencia", start: "2026-11-05", responsables: ["m2"] };
		expect(eventMatchesResponsable(ev, "todos")).toBe(true);
		expect(eventMatchesResponsable(ev, "m2")).toBe(true);
		expect(eventMatchesResponsable(ev, "m1")).toBe(false);
		expect(eventMatchesResponsable(ev, SIN_RESPONSABLE)).toBe(false);
		expect(eventMatchesResponsable({ title: "Libre", start: "2026-11-05", responsables: [] }, SIN_RESPONSABLE)).toBe(true);
	});

	it("eventos: un evento con varios responsables aparece en cada grupo", () => {
		const doc = buildEventsPrintDocument({
			teamName: "Estudio",
			events: [
				{ title: "Audiencia", start: "2026-11-05T13:00:00", folderName: "Gómez", responsables: ["o1", "m2"] },
				{ title: "Vencimiento", start: "2026-11-03T00:00:00", allDay: true, responsables: [] },
			],
			assignees,
			periodLabel: "noviembre de 2026",
		});
		expect(doc.sections.map((s) => s.heading)).toEqual(["Ana Owner", "Caro Miembro", "Sin responsable"]);
		expect(doc.sections[0].rows[0]).toEqual(["05/11/2026 13:00", "Audiencia", "Gómez"]);
		expect(doc.sections[2].rows[0]).toEqual(["03/11/2026", "Vencimiento", ""]);
		expect(doc.subtitle).toContain("noviembre de 2026");
	});
});

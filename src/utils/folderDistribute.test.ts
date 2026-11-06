import { describe, expect, it } from "vitest";
import { buildDistributeRequest, fueroRows, initialWizardState, juzgadoRows, previewRows, splitKeysEqually } from "./folderDistribute";
import { RadicacionSummary } from "types/folderDistribute";

// Asistente «Repartir carpetas» (Equipos, fase 3, 6/11/2026).
const summary: RadicacionSummary = {
	total: 100,
	juzgados: [
		{ fuero: "Seguridad Social", juzgado: "7", activas: 40, archivadas: 10, sinResponsable: 45 },
		{ fuero: "Seguridad Social", juzgado: "2", activas: 20, archivadas: 0, sinResponsable: 5 },
		{ fuero: "Civil", juzgado: "7", activas: 5, archivadas: 0, sinResponsable: 5 },
		{ fuero: "Civil", juzgado: "10", activas: 0, archivadas: 3, sinResponsable: 3 },
		{ fuero: "Trabajo", juzgado: "", activas: 2, archivadas: 0, sinResponsable: 2 },
	],
	fueros: [
		{ fuero: "Seguridad Social", activas: 60, archivadas: 10, sinResponsable: 50 },
		{ fuero: "Civil", activas: 5, archivadas: 3, sinResponsable: 8 },
		{ fuero: "Trabajo", activas: 2, archivadas: 0, sinResponsable: 2 },
	],
	jurisdicciones: [],
	ubicaciones: [],
};

describe("juzgadoRows / fueroRows", () => {
	it("une el mismo número de juzgado entre fueros, respeta el alcance y ordena por número", () => {
		const rows = juzgadoRows(summary, "active");
		expect(rows.map((r) => [r.key, r.count])).toEqual([
			["2", 20],
			["7", 45],
			["", 2],
		]);
		expect(rows[1].fueros).toEqual(["Seguridad Social", "Civil"]);
		expect(rows[2].label).toBe("Sin juzgado");
		expect(juzgadoRows(summary, "archived").map((r) => [r.key, r.count])).toEqual([
			["7", 10],
			["10", 3],
		]);
		expect(juzgadoRows(summary, "all", ["Civil"]).map((r) => [r.key, r.count])).toEqual([
			["7", 5],
			["10", 3],
		]);
	});

	it("fueros de mayor a menor con el alcance", () => {
		expect(fueroRows(summary, "all").map((r) => [r.key, r.count])).toEqual([
			["Seguridad Social", 70],
			["Civil", 8],
			["Trabajo", 2],
		]);
	});
});

describe("splitKeysEqually", () => {
	it("manda cada clave al que menos acumula, de la más grande a la más chica", () => {
		const map = splitKeysEqually(
			[
				{ key: "7", count: 45 },
				{ key: "2", count: 20 },
				{ key: "3", count: 15 },
				{ key: "4", count: 10 },
			],
			["a", "b"],
		);
		expect(map).toEqual({ 7: ["a"], 2: ["b"], 3: ["b"], 4: ["b"] });
	});
	it("sin responsables devuelve vacío; ids repetidos cuentan una vez", () => {
		expect(splitKeysEqually([{ key: "1", count: 1 }], [])).toEqual({});
		expect(splitKeysEqually([{ key: "1", count: 1 }], ["a", "a"])).toEqual({ 1: ["a"] });
	});
});

describe("buildDistributeRequest", () => {
	it("por juzgado: filtra claves vacías y arma scope con filtros", () => {
		const s = { ...initialWizardState(), fueros: ["Civil"], juzgados: ["7", ""], map: { 7: ["a", "a"], 2: [] } };
		const r = buildDistributeRequest(s, true);
		expect(r.ok).toBe(true);
		if (r.ok) {
			expect(r.request.scope).toEqual({ archived: "active", onlyUnassigned: true, filters: { fuero: ["Civil"], juzgado: ["7", ""] } });
			expect(r.request.criteria).toEqual({ type: "juzgado", map: { 7: ["a"] } });
			expect(r.request.dryRun).toBe(true);
			expect(r.request.mode).toBe("replace");
		}
		expect(buildDistributeRequest({ ...initialWizardState(), map: {} }, true)).toMatchObject({ ok: false });
	});

	it("selección del listado: alcance todas y folderIds", () => {
		const s = { ...initialWizardState(["x", "y"]), type: "equal" as const, assignees: ["a"] };
		const r = buildDistributeRequest(s, false);
		expect(r.ok && r.request.scope.archived).toBe("all");
		expect(r.ok && r.request.scope.filters?.folderIds).toEqual(["x", "y"]);
		expect(r.ok && r.request.criteria).toEqual({ type: "equal", assignees: ["a"], order: "juzgado" });
	});

	it("cantidades: solo positivas, resto opcional; al azar con semilla", () => {
		const s = { ...initialWizardState(), type: "quantities" as const, quantities: { a: 7.9, b: 0, c: -1 }, rest: "d" };
		const r = buildDistributeRequest(s, true);
		expect(r.ok && r.request.criteria).toEqual({ type: "quantities", quantities: { a: 7, rest: "d" }, order: "juzgado" });
		expect(buildDistributeRequest({ ...initialWizardState(), type: "quantities", quantities: { a: 0 }, rest: null }, true)).toMatchObject({
			ok: false,
		});
		const rnd = buildDistributeRequest({ ...initialWizardState(), type: "random", assignees: ["a", "b"], seed: 42 }, true);
		expect(rnd.ok && rnd.request.criteria).toEqual({ type: "random", assignees: ["a", "b"], seed: 42 });
		expect(buildDistributeRequest({ ...initialWizardState(), type: "random", assignees: [] }, true)).toMatchObject({ ok: false });
	});
});

describe("previewRows", () => {
	it("resuelve nombres y resume juzgados de mayor a menor", () => {
		const rows = previewRows(
			{
				total: 10,
				asignadas: 9,
				sinAsignar: 1,
				archivadasIncluidas: 0,
				restrictedByVisibility: false,
				porResponsable: [{ id: "a", cantidad: 9, porJuzgado: { 2: 3, 7: 5, "Sin juzgado": 1 } }],
			},
			[{ id: "a", name: "Ana", initials: "AN", isOwner: false, kind: "invitation", invitationStatus: "draft" }],
			() => "previsto",
			2,
		);
		expect(rows[0]).toMatchObject({
			name: "Ana",
			tag: "previsto",
			cantidad: 9,
			juzgados: "Juz. 7 (5) · Juz. 2 (3) · y 1 más",
			juzgadosTotal: 3,
		});
		expect(previewRows(null, [], () => "")).toEqual([]);
	});
});

import dayjs from "dayjs";
import { describe, expect, it } from "vitest";
import {
	diasDesdeUltimoMovimiento,
	enPeriodo,
	INACTIVIDAD_FILTROS,
	isInactividadFiltro,
	isIsoDay,
	sinMovimientoHace,
	situacionKey,
	situacionLabel,
	situacionOptions,
} from "./controlCarpetas";
import { juzgadoCounts, juzgadoOptions } from "./radicacion";

// Controles del estudio (6/11/2026).
describe("situación", () => {
	it("etiqueta legible y clave normalizada", () => {
		expect(situacionLabel("EN LETRA")).toBe("En letra");
		expect(situacionLabel(" en  despacho ")).toBe("En despacho");
		expect(situacionLabel("")).toBe("Sin dato");
		expect(situacionLabel(undefined)).toBe("Sin dato");
		expect(situacionKey(" en  letra ")).toBe("EN LETRA");
		expect(situacionKey(null)).toBe("");
	});

	it("opciones con conteo, las más frecuentes primero y «Sin dato» al final", () => {
		const opts = situacionOptions([
			{ situacion: "EN LETRA" },
			{ situacion: "EN DESPACHO" },
			{ situacion: "EN LETRA" },
			{},
			{ situacion: "" },
		]);
		expect(opts).toEqual([
			{ value: "EN LETRA", label: "En letra", count: 2 },
			{ value: "EN DESPACHO", label: "En despacho", count: 1 },
			{ value: "", label: "Sin dato", count: 2 },
		]);
	});
});

describe("sin movimiento hace más de N días", () => {
	const today = dayjs("2026-11-06").startOf("day");
	it("compara contra hoy y descarta carpetas sin fecha", () => {
		expect(sinMovimientoHace({ lastMovementDate: "2026-07-01" }, 90, today)).toBe(true);
		expect(sinMovimientoHace({ lastMovementDate: "2026-10-20" }, 90, today)).toBe(false);
		expect(sinMovimientoHace({ lastMovementDate: "2026-08-08" }, 90, today)).toBe(false); // exactamente 90 días: no supera
		expect(sinMovimientoHace({ lastMovementDate: "2026-08-07" }, 90, today)).toBe(true);
		expect(sinMovimientoHace({}, 30, today)).toBe(false);
		expect(sinMovimientoHace({ lastMovementDate: "no es fecha" }, 30, today)).toBe(false);
	});
	it("cuenta por día UTC: el movimiento de hoy es «hoy» aunque en Argentina la medianoche UTC sea ayer", () => {
		expect(diasDesdeUltimoMovimiento({ lastMovementDate: "2026-11-06T00:00:00.000Z" }, today)).toBe(0);
		expect(diasDesdeUltimoMovimiento({ lastMovementDate: "2026-11-05T00:00:00.000Z" }, today)).toBe(1);
		expect(diasDesdeUltimoMovimiento({ lastMovementDate: "2026-10-07T00:00:00.000Z" }, today)).toBe(30);
		expect(diasDesdeUltimoMovimiento({}, today)).toBeNull();
		expect(diasDesdeUltimoMovimiento({ lastMovementDate: "zzz" }, today)).toBeNull();
	});
	it("valores del filtro", () => {
		expect(isInactividadFiltro("inactive90")).toBe(true);
		expect(isInactividadFiltro("month")).toBe(false);
		expect(INACTIVIDAD_FILTROS.inactive365.days).toBe(365);
	});
});

describe("opciones de juzgado", () => {
	it("desde conteos del hub: etiqueta, orden por fuero y número, sin vacíos", () => {
		const opts = juzgadoOptions([
			{ fuero: "Seguridad Social", court: "10", count: 309 },
			{ fuero: "Seguridad Social", court: "7", count: 261 },
			{ fuero: "Civil", court: "31", count: 2 },
			{ fuero: "", court: "", count: 9 },
			{ fuero: "", court: "4", count: 1 },
		]);
		expect(opts).toEqual([
			{ value: "|4", label: "Juzgado 4", count: 1 },
			{ value: "Civil|31", label: "31 · Civil", count: 2 },
			{ value: "Seguridad Social|7", label: "7 · Seguridad Social", count: 261 },
			{ value: "Seguridad Social|10", label: "10 · Seguridad Social", count: 309 },
		]);
	});
	it("desde carpetas en memoria", () => {
		const f = (court: string, fuero = "Seguridad Social") => ({ judFolder: { courtNumber: court }, folderFuero: fuero });
		expect(juzgadoOptions(juzgadoCounts([f("7"), f("7"), f("2"), f(""), {}]))).toEqual([
			{ value: "Seguridad Social|2", label: "2 · Seguridad Social", count: 1 },
			{ value: "Seguridad Social|7", label: "7 · Seguridad Social", count: 2 },
		]);
	});
});

describe("período de movimientos", () => {
	it("extremos inclusive por día; un extremo vacío no limita; sin fecha no entra", () => {
		const f = (d?: string) => (d ? { lastMovementDate: `${d}T00:00:00.000Z` } : {});
		const p = { desde: "2026-09-01", hasta: "2026-09-30" };
		expect(enPeriodo(f("2026-09-01"), p)).toBe(true);
		expect(enPeriodo(f("2026-09-30"), p)).toBe(true);
		expect(enPeriodo(f("2026-08-31"), p)).toBe(false);
		expect(enPeriodo(f("2026-10-01"), p)).toBe(false);
		expect(enPeriodo(f("2026-12-01"), { desde: "2026-09-01", hasta: "" })).toBe(true);
		expect(enPeriodo(f("2026-01-01"), { desde: "", hasta: "2026-09-30" })).toBe(true);
		expect(enPeriodo(f("2026-05-05"), { desde: "", hasta: "" })).toBe(true);
		expect(enPeriodo(f(), p)).toBe(false);
		expect(enPeriodo(f("2026-09-10"), { desde: "no", hasta: "2026-09-30" })).toBe(true);
	});
	it("isIsoDay", () => {
		expect(isIsoDay("2026-11-06")).toBe(true);
		expect(isIsoDay("06/11/2026")).toBe(false);
		expect(isIsoDay(null)).toBe(false);
	});
});

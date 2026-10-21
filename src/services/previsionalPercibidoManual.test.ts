import { describe, expect, it, vi } from "vitest";

import { armarInputRetroactivo, descripcionPercibidoManual, mesesDelPeriodo, mesesSinPercibido } from "services/previsionalService";
import { leerImporte, leerPegado, leerPeriodo } from "sections/forms/wizard/calc-previsional/retroactivo/components/PercibidosMensuales";
import { puedeMantenerActualizado } from "utils/previsionalKeepUpdated";

vi.mock("utils/axios", () => ({ default: { post: vi.fn() } }));

const periodo = { fechaDesdeReclamado: "15/03/2024", fechaHastaReclamado: "30/06/2024", fechaCierre: "18/10/2026" };

describe("percibidos cargados mes a mes", () => {
	it("los meses del período van del inicio al fin del reclamo (o al cierre si es anterior)", () => {
		expect(mesesDelPeriodo(periodo)).toEqual(["2024-03", "2024-04", "2024-05", "2024-06"]);
		expect(mesesDelPeriodo({ ...periodo, fechaHastaReclamado: "", fechaCierre: "10/05/2024" })).toEqual(["2024-03", "2024-04", "2024-05"]);
		expect(mesesDelPeriodo({ fechaDesdeReclamado: "" })).toEqual([]);
	});

	it("completitud: cada mes reclamado necesita un percibido mayor a 0", () => {
		const v = {
			...periodo,
			percibidosMensuales: [
				{ periodo: "2024-03", importe: 100 },
				{ periodo: "2024-04", importe: 0 },
				{ periodo: "2024-06", importe: 100 },
				{ periodo: "2025-01", importe: 100 },
			],
		};
		expect(mesesSinPercibido(v)).toEqual(["2024-04", "2024-05"]);
	});

	it("el input al motor manda modo manual solo con los meses del período, en orden", () => {
		const input = armarInputRetroactivo({
			...periodo,
			haberPagadoAnses: 1000,
			haberPagadoAl: "01/01/2024",
			tieneReajuste: true,
			fechaAltaReajuste: "01/04/2024",
			importeReajuste: 5000,
			pisoPercibido: "minimo",
			percibidoManual: true,
			percibidosMensuales: [
				{ periodo: "2024-06", importe: 4 },
				{ periodo: "2023-12", importe: 9 },
				{ periodo: "2024-03", importe: 1 },
				{ periodo: "2024-04", importe: 2 },
				{ periodo: "2024-05", importe: 3 },
			],
			criteriosMovilidad: [],
		});
		expect(input.percibido).toEqual({
			importe: 1000,
			fecha: "2024-01-01",
			modo: "manual",
			manual: [
				{ periodo: "2024-03", importe: 1 },
				{ periodo: "2024-04", importe: 2 },
				{ periodo: "2024-05", importe: 3 },
				{ periodo: "2024-06", importe: 4 },
			],
		});
		expect(descripcionPercibidoManual(input.percibido)).toBe(
			"Cargado por el usuario mes a mes (4 meses, 03/2024 a 06/2024), sin movilidad",
		);
	});

	it("sin modo manual el percibido sigue como antes", () => {
		const input = armarInputRetroactivo({
			...periodo,
			haberPagadoAnses: 1000,
			haberPagadoAl: "01/01/2024",
			percibidosMensuales: [{ periodo: "2024-03", importe: 1 }],
		});
		expect(input.percibido.modo).toBeUndefined();
		expect(input.percibido.manual).toBeUndefined();
		expect(descripcionPercibidoManual(input.percibido)).toBeNull();
	});

	it("un guardado con percibidos a mano no se puede mantener actualizado", () => {
		expect(puedeMantenerActualizado({ variables: { input: { percibido: { modo: "manual" } } } })).toBe(false);
		expect(puedeMantenerActualizado({ variables: { input: { percibido: { importe: 1 } } } })).toBe(true);
	});
});

describe("lectura de lo que escribe o pega el usuario", () => {
	it("importes en formato argentino o con punto decimal", () => {
		expect(leerImporte("1.234,56")).toBe(1234.56);
		expect(leerImporte("$ 1.234.567")).toBe(1234567);
		expect(leerImporte("1234,5")).toBe(1234.5);
		expect(leerImporte("1234.56")).toBe(1234.56);
		expect(leerImporte("1,234.56")).toBe(1234.56);
		expect(leerImporte("")).toBeNaN();
	});

	it("meses en varios formatos", () => {
		expect(leerPeriodo("03/2024")).toBe("2024-03");
		expect(leerPeriodo("3/2024")).toBe("2024-03");
		expect(leerPeriodo("2024-03")).toBe("2024-03");
		expect(leerPeriodo("15/03/2024")).toBe("2024-03");
		expect(leerPeriodo("13/2024")).toBeNull();
		expect(leerPeriodo("marzo")).toBeNull();
	});

	it("pegado de dos columnas desde Excel (tab) y líneas que no se pueden leer", () => {
		const r = leerPegado("03/2024\t1.234,56\n04/2024\t$ 1.300,00\ntotal\t2.534,56\n", []);
		expect(r.valores).toEqual([
			{ periodo: "2024-03", importe: 1234.56 },
			{ periodo: "2024-04", importe: 1300 },
		]);
		expect(r.ignoradas).toBe(1);
	});

	it("pegado de una sola columna de importes: se asignan en orden a los meses del período", () => {
		const r = leerPegado("1.000,00\n1.100,00\n1.210,00", ["2024-03", "2024-04", "2024-05", "2024-06"]);
		expect(r.valores).toEqual([
			{ periodo: "2024-03", importe: 1000 },
			{ periodo: "2024-04", importe: 1100 },
			{ periodo: "2024-05", importe: 1210 },
		]);
	});
});

describe("piso del haber mínimo", () => {
	const base = { ...periodo, haberPagadoAnses: 1000, haberPagadoAl: "01/01/2024", haberReclamado: 2000, criteriosMovilidad: [] };
	it('se aplica solo: sin elección (o con el "no" de los guardados) va "minimo" en el percibido y el reclamado', () => {
		for (const piso of [undefined, "no"]) {
			const input = armarInputRetroactivo({ ...base, pisoPercibido: piso, pisoReclamado: piso });
			expect(input.percibido.piso).toBe("minimo");
			expect(input.reclamado.piso).toBe("minimo");
		}
	});
	it("respeta 82 % SMVM y sin garantía", () => {
		const input = armarInputRetroactivo({ ...base, pisoPercibido: "minimo82", pisoReclamado: "sinGarantia" });
		expect(input.percibido.piso).toBe("minimo82");
		expect(input.reclamado.piso).toBe("sinGarantia");
	});
});

import { describe, expect, it, vi } from "vitest";
import { leerFilasPegadas, leerImporte, normalizarPeriodo } from "./haberCajaService";

// vitest sube los vi.mock por encima de los imports: el servicio no llega a cargar el axios real
vi.mock("utils/axios", () => ({ default: { post: vi.fn() } }));

describe("haber de caja: utilidades de carga", () => {
	it("normaliza los períodos a AAAA-MM", () => {
		expect(normalizarPeriodo("2015-03")).toBe("2015-03");
		expect(normalizarPeriodo("2015/3")).toBe("2015-03");
		expect(normalizarPeriodo("03/2015")).toBe("2015-03");
		expect(normalizarPeriodo("3-2015")).toBe("2015-03");
		expect(normalizarPeriodo("01/03/2015")).toBe("2015-03");
		expect(normalizarPeriodo("2015-03-01")).toBe("2015-03");
		expect(normalizarPeriodo("13/2015")).toBeNull();
		expect(normalizarPeriodo("marzo")).toBeNull();
		expect(normalizarPeriodo("")).toBeNull();
	});

	it("lee importes con coma o con punto decimal", () => {
		expect(leerImporte("1.234,56")).toBe(1234.56);
		expect(leerImporte("$ 1.234,56")).toBe(1234.56);
		expect(leerImporte("1234.56")).toBe(1234.56);
		expect(leerImporte("1.234.567")).toBe(1234567);
		expect(leerImporte("850")).toBe(850);
		expect(leerImporte("")).toBeNull();
		expect(leerImporte("abc")).toBeNull();
	});

	it("lee las filas pegadas desde una planilla y descarta lo que no entiende", () => {
		const texto = [
			"Período\tImporte",
			"01/2015\t12.500,00",
			"2015-02\tEmpleador inventado\t13000.5",
			"",
			"sin datos",
			"03/2015;14.000",
		].join("\n");
		expect(leerFilasPegadas(texto)).toEqual({
			filas: [
				{ periodo: "2015-01", importe: "12500" },
				{ periodo: "2015-02", importe: "13000,5" },
				{ periodo: "2015-03", importe: "14000" },
			],
			descartadas: 2,
		});
	});
});

import { describe, expect, it, vi } from "vitest";
import {
	avisoDeCategoria,
	bloqueoDeCategoria,
	categoriasOfrecidas,
	equiparacionDeCategoria,
	leerFilasPegadas,
	leerImporte,
	monedaDelPeriodo,
	normalizarPeriodo,
	obtenerCatalogoHaberCaja,
} from "./haberCajaService";
import { CATALOGO_PRUEBA } from "sections/forms/wizard/calc-previsional/haber-caja/formModel/catalogoPrueba";

// vitest sube los vi.mock por encima de los imports: el servicio no llega a cargar el axios real
const { get } = vi.hoisted(() => ({ get: vi.fn() }));
vi.mock("utils/axios", () => ({ default: { post: vi.fn(), get } }));

describe("haber de caja: catálogo del hub", () => {
	it("pide el catálogo y rechaza una respuesta sin tramos o monedas", async () => {
		get.mockResolvedValueOnce({ data: { success: true, ...CATALOGO_PRUEBA } });
		expect((await obtenerCatalogoHaberCaja()).tramos).toHaveLength(CATALOGO_PRUEBA.tramos.length);
		expect(get).toHaveBeenCalledWith("/api/previsional/haber-caja/catalogo");
		get.mockResolvedValueOnce({ data: { success: true, monedas: [] } });
		await expect(obtenerCatalogoHaberCaja()).rejects.toThrow(/catálogo/);
	});

	it("la moneda sale del período, con los cortes que manda el hub", () => {
		const clave = (p: string) => monedaDelPeriodo(CATALOGO_PRUEBA, p)?.clave;
		expect(clave("1969-12")).toBe("pesosMonedaNacional");
		expect(clave("1970-01")).toBe("pesosLey");
		expect(clave("1983-05")).toBe("pesosLey");
		expect(clave("1983-06")).toBe("pesosArgentinos");
		expect(clave("1985-06")).toBe("australes");
		expect(clave("1991-12")).toBe("australes");
		expect(clave("1992-01")).toBe("pesos");
		expect(monedaDelPeriodo(null, "1992-01")).toBeNull();
		expect(monedaDelPeriodo(CATALOGO_PRUEBA, null)).toBeNull();
	});

	it("ofrece las categorías de la época del período; si cruza épocas, las comunes", () => {
		const codigos = (d: string, h: string) => categoriasOfrecidas(CATALOGO_PRUEBA, d, h).map((c) => c.codigo);
		expect(codigos("1965-01", "1966-12")).toEqual(["IND"]);
		expect(codigos("1975-01", "1976-12")).toEqual(["A", "B", "C", "D", "E", "F", "G", "H", "I", "J", "M"]);
		expect(codigos("1990-01", "1990-12")).toContain("J");
		expect(codigos("2010-01", "2012-12")).toEqual(["Cat.I", "Cat.II", "MONOTRI"]);
		// 1985 a 1990 cruza el 6/1988: H, I y J no valen en todo el período
		expect(codigos("1985-01", "1990-12")).toEqual(["A", "B", "C", "D", "E", "F", "G"]);
		// 1965 a 1975 no tiene ninguna categoría común: hay que partirlo
		expect(codigos("1965-01", "1975-12")).toEqual([]);
		expect(categoriasOfrecidas(null, "1975-01", "1976-12")).toEqual([]);
	});

	it("bloqueos, avisos y equiparación de una categoría en un período", () => {
		// de 1/1969 a 6/1980 las letras H a N existen (el motor las convierte por el Dec. 1361/80)
		expect(bloqueoDeCategoria(CATALOGO_PRUEBA, "H", "1975-01", "1976-12")).toBeNull();
		expect(bloqueoDeCategoria(CATALOGO_PRUEBA, "M", "1975-01", "1980-06")).toBeNull();
		expect(bloqueoDeCategoria(CATALOGO_PRUEBA, "M", "1985-01", "1985-12")).toMatch(/categoría M vale hasta 6\/1980/);
		expect(bloqueoDeCategoria(CATALOGO_PRUEBA, "H", "1975-01", "1981-12")).toMatch(/desde 6\/1988/);
		expect(bloqueoDeCategoria(CATALOGO_PRUEBA, "H", "1987-01", "1989-12")).toMatch(/desde 6\/1988/);
		expect(bloqueoDeCategoria(CATALOGO_PRUEBA, "H", "1988-06", "1989-12")).toBeNull();
		expect(bloqueoDeCategoria(CATALOGO_PRUEBA, "IND", "1968-01", "1969-03")).toMatch(/hasta 12\/1968/);
		expect(bloqueoDeCategoria(CATALOGO_PRUEBA, "A", "1975-01", "1976-12")).toBeNull();
		// «otra» categoría fuera de su época: no impide calcular, avisa cómo la toma el cálculo
		expect(avisoDeCategoria(CATALOGO_PRUEBA, "A", "1975-01", "1976-12")).toBeNull();
		expect(avisoDeCategoria(CATALOGO_PRUEBA, "B", "2010-01", "2010-12")).toMatch(/la toma como Monotributo social/);
		expect(avisoDeCategoria(CATALOGO_PRUEBA, "A", "1965-01", "1966-12")).toMatch(/la toma como Categoría A/);
		expect(equiparacionDeCategoria(CATALOGO_PRUEBA, "C", "1975-01", "1976-12")).toBe("C → A por el Dec. 1361/80");
		expect(equiparacionDeCategoria(CATALOGO_PRUEBA, "G", "1975-01", "1985-12")).toBe("G → B por el Dec. 1361/80");
		expect(equiparacionDeCategoria(CATALOGO_PRUEBA, "M", "1975-01", "1976-12")).toBe("M → F por el Dec. 1361/80");
		expect(equiparacionDeCategoria(CATALOGO_PRUEBA, "C", "1985-01", "1986-12")).toBeNull();
	});
});

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

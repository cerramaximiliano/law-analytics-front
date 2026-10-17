import { describe, expect, it } from "vitest";
import {
	expandYear,
	isValidExpedienteNumber,
	isValidExpedienteYear,
	parseExpedienteInput,
	suggestExpedienteSplits,
} from "./expedienteInput";

describe("parseExpedienteInput", () => {
	it("tipeo normal: deja los dígitos tal cual", () => {
		expect(parseExpedienteInput("23593")).toEqual({ number: "23593", year: null, split: false, altered: false });
	});
	it('pegado "69520/15" → número 69520 y año 2015 (caso real del 14/10)', () => {
		expect(parseExpedienteInput("69520/15")).toEqual({ number: "69520", year: "2015", split: true, altered: true });
	});
	it('pegado con texto "CNT 40791/2026" → 40791 / 2026 (antes quedaba 407914998)', () => {
		expect(parseExpedienteInput("CNT 40791/2026")).toEqual({ number: "40791", year: "2026", split: true, altered: true });
	});
	it('pegado "Expte. 959839/26 - JUZGADO 3" con tope 8 (IOL) → 959839 / 2026', () => {
		expect(parseExpedienteInput("Expte. 959839/26 - JUZGADO 3", 8)).toEqual({ number: "959839", year: "2026", split: true, altered: true });
	});
	it("guion como separador y espacios", () => {
		expect(parseExpedienteInput(" 47054 - 2010 ")).toMatchObject({ number: "47054", year: "2010", split: true });
	});
	it("tipeo de la barra carácter a carácter: al llegar la barra no inventa año", () => {
		expect(parseExpedienteInput("23593/")).toMatchObject({ number: "23593", year: null, split: false });
	});
	it("sin separador NO recorta: el número largo queda entero para que falle la validación", () => {
		// Casos reales del 14 y 15/10: "6952015" recortado a "695201" pasaba y creaba una causa equivocada.
		expect(parseExpedienteInput("6952015")).toEqual({ number: "6952015", year: null, split: false, altered: false });
		expect(parseExpedienteInput("407914998")).toEqual({ number: "407914998", year: null, split: false, altered: false });
		expect(parseExpedienteInput("123456789012", 8)).toEqual({ number: "123456789012", year: null, split: false, altered: false });
		expect(isValidExpedienteNumber(parseExpedienteInput("6952015").number)).toBe(false);
	});
	it("con separador sí recorta el número al tope", () => {
		expect(parseExpedienteInput("123456789/2020")).toMatchObject({ number: "123456", year: "2020", split: true, altered: true });
	});
	it("descarta letras y espacios sin barra", () => {
		expect(parseExpedienteInput("CNT 23593")).toEqual({ number: "23593", year: null, split: false, altered: true });
	});
});

describe("expandYear", () => {
	const now = 2026;
	it.each([
		["15", "2015"],
		["26", "2026"],
		["27", "1927"],
		["98", "1998"],
		["2026", "2026"],
		["202", null],
		["", null],
	])("%s → %s", (raw, expected) => {
		expect(expandYear(raw, now)).toBe(expected);
	});
});

describe("validadores", () => {
	it("número: 1 a 6 dígitos para PJN, hasta 8 para otros (ancho del bloque del CUIJ)", () => {
		expect(isValidExpedienteNumber("1")).toBe(true);
		expect(isValidExpedienteNumber("123456")).toBe(true);
		expect(isValidExpedienteNumber("1234567")).toBe(false);
		expect(isValidExpedienteNumber("1234567", 8)).toBe(true);
		expect(isValidExpedienteNumber("123456789", 8)).toBe(false);
		expect(isValidExpedienteNumber("6952015")).toBe(false);
		expect(isValidExpedienteNumber("")).toBe(false);
		expect(isValidExpedienteNumber("12a")).toBe(false);
	});
	it("año: 4 cifras entre 1980 y hoy", () => {
		expect(isValidExpedienteYear("1980", 2026)).toBe(true);
		expect(isValidExpedienteYear("2026", 2026)).toBe(true);
		expect(isValidExpedienteYear("1979", 2026)).toBe(false);
		expect(isValidExpedienteYear("2027", 2026)).toBe(false);
		expect(isValidExpedienteYear("15", 2026)).toBe(false);
	});
});

describe("suggestExpedienteSplits", () => {
	const now = 2026;
	it('"6952015" → 695/2015 y 69520/2015 (caso real del 14/10)', () => {
		expect(suggestExpedienteSplits("6952015", 6, now)).toEqual([
			{ number: "695", year: "2015" },
			{ number: "69520", year: "2015" },
		]);
	});
	it('"407912026" → solo 40791/2026 (con 2 cifras el resto supera el tope)', () => {
		expect(suggestExpedienteSplits("407912026", 6, now)).toEqual([{ number: "40791", year: "2026" }]);
	});
	it('"407914998" → nada (4998 no es año y "4079149" tiene 7 cifras)', () => {
		expect(suggestExpedienteSplits("407914998", 6, now)).toEqual([]);
	});
	it("no supera el tope → nada", () => {
		expect(suggestExpedienteSplits("123456", 6, now)).toEqual([]);
		expect(suggestExpedienteSplits("1", 6, now)).toEqual([]);
	});
	it("solo acepta dígitos", () => {
		expect(suggestExpedienteSplits("6952015a", 6, now)).toEqual([]);
		expect(suggestExpedienteSplits("", 6, now)).toEqual([]);
	});
	it("descarta la lectura cuyo resto empieza con cero", () => {
		// "0520/15" no es un número de expediente razonable; "05/2015" tampoco.
		expect(suggestExpedienteSplits("052015", 4, now)).toEqual([]);
	});
	it("sin duplicados cuando ambas lecturas coinciden", () => {
		// "1232020": (a) 123/2020, (b) 12320/2020 → distintas; "12020" con tope 4: (a) 1/2020, (b) 120/2020.
		expect(suggestExpedienteSplits("12020", 4, now)).toEqual([
			{ number: "1", year: "2020" },
			{ number: "120", year: "2020" },
		]);
	});
	it("tope 8 (IOL): ambas lecturas entran", () => {
		expect(suggestExpedienteSplits("9598392026", 8, now)).toEqual([
			{ number: "959839", year: "2026" },
			{ number: "95983920", year: "2026" },
		]);
	});
});

import { describe, expect, it } from "vitest";
import { expandYear, isValidExpedienteNumber, isValidExpedienteYear, parseExpedienteInput } from "./expedienteInput";

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
	it("recorta al tope de dígitos y marca altered", () => {
		expect(parseExpedienteInput("123456789012")).toEqual({ number: "123456", year: null, split: false, altered: true });
		expect(parseExpedienteInput("123456789012", 8).number).toBe("12345678");
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

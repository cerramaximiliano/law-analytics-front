import { describe, expect, it } from "vitest";
import { juzgadoKey, radicacionOrigen, ubicacionActual, ubicacionDetalle } from "./radicacion";

// Radicación en el listado de carpetas (5/11/2026).
const f = (judFolder: any, folderFuero = "Seguridad Social") => ({ judFolder, folderFuero });

describe("radicación", () => {
	it("juzgado de origen con y sin secretaría", () => {
		expect(radicacionOrigen(f({ courtNumber: "7", secretaryNumber: "1" }))).toBe("Juz. 7 · Sec. 1");
		expect(radicacionOrigen(f({ courtNumber: "7" }))).toBe("Juz. 7");
		// MEV/SCBA: el «número» es el nombre del juzgado → sin prefijo «Juz.»
		expect(radicacionOrigen(f({ courtNumber: "Juzgado Civil y Comercial N° 5 - Lomas de Zamora" }))).toBe(
			"Juzgado Civil y Comercial N° 5 - Lomas de Zamora",
		);
		expect(radicacionOrigen(f({ courtNumber: "" }))).toBe("");
		expect(radicacionOrigen({})).toBe("");
	});

	it("ubicación actual por el texto de la dependencia", () => {
		expect(ubicacionActual(f({ currentLocation: { text: "JUZGADO FEDERAL DE LA SEGURIDAD SOCIAL 7 - SECRETARIA Nº 1" } }))).toBe("Juzgado");
		expect(ubicacionActual(f({ currentLocation: { text: "CAMARA FEDERAL DE LA SEGURIDAD SOCIAL - SALA 2" }, salaNumber: "2" }))).toBe(
			"Cámara",
		);
		expect(ubicacionActual(f({ descriptionJudFolder: "CORTE SUPREMA DE JUSTICIA DE LA NACIÓN - MESA DE ENTRADAS" }))).toBe("Corte");
		expect(ubicacionActual(f({ descriptionJudFolder: "OFICINA DE PERITOS DE LA CÁMARA" }))).toBe("Otro");
		expect(ubicacionActual(f({}))).toBe("");
	});

	it("detalle secundario solo cuando no está en el juzgado", () => {
		expect(ubicacionDetalle(f({ currentLocation: { text: "JUZGADO FEDERAL 7" } }))).toBe("");
		expect(ubicacionDetalle(f({ currentLocation: { text: "CAMARA FEDERAL - SALA 2" }, salaNumber: "2" }))).toBe("Cámara · Sala 2");
		expect(ubicacionDetalle(f({ currentLocation: { text: "CAMARA FEDERAL - MESA RECEPTORA" } }))).toBe("Cámara");
		expect(ubicacionDetalle(f({ descriptionJudFolder: "CORTE SUPREMA DE JUSTICIA DE LA NACIÓN" }))).toBe("Corte Suprema");
		const largo = "OFICINA DE PERITOS DE LA CÁMARA FEDERAL DE LA SEGURIDAD SOCIAL";
		expect(ubicacionDetalle(f({ descriptionJudFolder: largo }))).toBe(`${largo.slice(0, 40)}…`);
	});

	it("clave de filtro por juzgado: fuero + número; vacía sin número", () => {
		expect(juzgadoKey(f({ courtNumber: "10" }, "Civil"))).toBe("Civil|10");
		expect(juzgadoKey(f({ courtNumber: "10" }))).toBe("Seguridad Social|10");
		expect(juzgadoKey(f({}))).toBe("");
	});
});

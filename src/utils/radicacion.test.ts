import { describe, expect, it } from "vitest";
import { juzgadoKey, radicacionOrigen, ubicacionActual, ubicacionDetalle, ubicacionOptions } from "./radicacion";

// Radicación en el listado de carpetas (5/11/2026).
const f = (judFolder: any, folderFuero = "Seguridad Social") => ({ judFolder, folderFuero });

describe("opciones del filtro por instancia (archivadas, 11/11/2026)", () => {
	it("ordena Cámara por sala numérica, luego Corte, Juzgado y otra; sin tocar los conteos", () => {
		const opts = ubicacionOptions([
			{ kind: "juzgado", sala: "", count: 40 },
			{ kind: "camara", sala: "10", count: 1 },
			{ kind: "otro", sala: "", count: 2 },
			{ kind: "corte", sala: "", count: 3 },
			{ kind: "camara", sala: "2", count: 8 },
			{ kind: "camara", sala: "", count: 4 },
			{ kind: "camara", sala: "1", count: 12 },
			{ kind: "", sala: "", count: 99 },
		]);
		expect(opts).toEqual([
			{ value: "camara:1", label: "Cámara · Sala 1", count: 12 },
			{ value: "camara:2", label: "Cámara · Sala 2", count: 8 },
			{ value: "camara:10", label: "Cámara · Sala 10", count: 1 },
			{ value: "camara", label: "Cámara", count: 4 },
			{ value: "corte", label: "Corte Suprema", count: 3 },
			{ value: "juzgado", label: "Juzgado", count: 40 },
			{ value: "otro", label: "Otra dependencia", count: 2 },
		]);
	});
});

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
		// Empieza con el nombre de la cámara y es de primera instancia
		expect(ubicacionActual(f({ currentLocation: { text: "CAMARA CIVIL - MESA DE ENTRADAS DE 1RA. INSTANCIA" } }))).toBe("Juzgado");
		expect(ubicacionActual(f({ currentLocation: { text: "Cámara Federal de Córdoba - Mesa única de entradas primera instancia" } }))).toBe(
			"Juzgado",
		);
		expect(
			ubicacionActual(
				f({
					currentLocation: { text: "CAMARA FEDERAL DE SAN MARTIN - JUZGADO FEDERAL EN LO CRIM. Y CORR. DE SAN ISIDRO 1 - SECTOR ARCHIVO" },
				}),
			),
		).toBe("Juzgado");
		expect(ubicacionActual(f({ currentLocation: { text: "CAMARA CIVIL - MESA DE ENTRADAS DE 2DA. INSTANCIA" } }))).toBe("Cámara");
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

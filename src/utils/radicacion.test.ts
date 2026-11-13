import { describe, expect, it } from "vitest";
import {
	juzgadoKey,
	radicacionOrigen,
	radicacionSegunda,
	ubicacionActual,
	ubicacionInstancia,
	ubicacionOptions,
	radicacionOptions,
	radicacionParams,
	ubicacionTexto,
} from "./radicacion";

// Radicación en el listado de carpetas (5/11/2026).
const f = (judFolder: any, folderFuero = "Seguridad Social") => ({ judFolder, folderFuero });

describe("opciones del filtro «Ubicación actual» (archivadas, 13/11/2026)", () => {
	it("una opción por instancia, en el orden de la columna; suma salas si el hub viejo las manda", () => {
		const opts = ubicacionOptions([
			{ kind: "juzgado", sala: "", count: 40 },
			{ kind: "camara", sala: "10", count: 1 },
			{ kind: "otro", sala: "", count: 2 },
			{ kind: "corte", sala: "", count: 3 },
			{ kind: "camara", sala: "", count: 4 },
			{ kind: "", sala: "", count: 99 },
		]);
		expect(opts).toEqual([
			{ value: "juzgado", label: "1ª instancia (Juzgado)", count: 40 },
			{ value: "camara", label: "2ª instancia (Cámara)", count: 5 },
			{ value: "corte", label: "Corte Suprema", count: 3 },
			{ value: "otro", label: "Otra dependencia", count: 2 },
		]);
	});
});

describe("opciones del filtro «Radicación» (archivadas, 13/11/2026)", () => {
	it("juzgados y salas por las que pasó la causa, con fuero; salas numéricas antes que las de letra", () => {
		const opts = radicacionOptions(
			[
				{ fuero: "Civil", court: "29", count: 2 },
				{ fuero: "Civil", court: "27", count: 1 },
			],
			[
				{ fuero: "Civil", sala: "D", count: 1 },
				{ fuero: "Seguridad Social", sala: "2", count: 3 },
				{ fuero: "Seguridad Social", sala: "10", count: 1 },
			],
		);
		expect(opts).toEqual([
			{ value: "j:Civil|27", label: "Juzgado 27 · Civil", count: 1, grupo: "juzgado" },
			{ value: "j:Civil|29", label: "Juzgado 29 · Civil", count: 2, grupo: "juzgado" },
			{ value: "s:Civil|D", label: "Sala D · Civil", count: 1, grupo: "sala" },
			{ value: "s:Seguridad Social|2", label: "Sala 2 · Seguridad Social", count: 3, grupo: "sala" },
			{ value: "s:Seguridad Social|10", label: "Sala 10 · Seguridad Social", count: 1, grupo: "sala" },
		]);
		expect(radicacionParams("s:Civil|D")).toEqual({ juzgado: "", sala: "Civil|D" });
		expect(radicacionParams("j:Civil|29")).toEqual({ juzgado: "Civil|29", sala: "" });
		expect(radicacionParams("")).toEqual({ juzgado: "", sala: "" });
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

	it("radicación: Sala de la Cámara debajo del juzgado aunque haya vuelto; sola si no hay juzgado; nunca la Corte", () => {
		// Abad (CSS 44176/2009): hoy en el juzgado, la Sala 2 tuvo la apelación
		const abad = f({
			courtNumber: "7",
			secretaryNumber: "2",
			salaNumber: "2",
			currentLocation: { text: "JUZGADO FEDERAL 7", instancia: "juzgado" },
		});
		expect(radicacionOrigen(abad)).toBe("Juz. 7 · Sec. 2");
		expect(radicacionSegunda(abad)).toBe("Cámara · Sala 2");
		// Adam (CSS 10469/1998): hoy en el Archivo General → la radicación no cambia
		const adam = f({
			courtNumber: "7",
			salaNumber: "2",
			currentLocation: { text: "CORTE SUPREMA DE JUSTICIA DE LA NACIÓN - ARCHIVO GENERAL" },
		});
		expect(radicacionSegunda(adam)).toBe("Cámara · Sala 2");
		// Recurso directo: sin juzgado, la Sala ocupa la primera línea
		const rd = f({
			salaNumber: "2",
			currentLocation: { text: "CAMARA FEDERAL - SALA 2", instancia: "camara", grado: "primera", recursoDirecto: true },
		});
		expect(radicacionOrigen(rd)).toBe("Cámara · Sala 2");
		expect(radicacionSegunda(rd)).toBe("");
		expect(radicacionSegunda(f({ courtNumber: "7" }))).toBe("");
	});

	it("ubicación actual: manda la instancia del worker; el texto, si falta", () => {
		expect(ubicacionActual(f({ currentLocation: { text: "TRIBUNAL ORAL FEDERAL DE SALTA N° 1", instancia: "tribunal-oral" } }))).toBe(
			"Tribunal oral",
		);
		expect(ubicacionActual(f({ currentLocation: { text: "TRIBUNAL ORAL EN LO CRIMINAL 20" } }))).toBe("Tribunal oral");
		expect(ubicacionActual(f({ currentLocation: { text: "CORTE SUPREMA DE JUSTICIA DE LA NACIÓN - ARCHIVO GENERAL" } }))).toBe("Archivo");
		expect(ubicacionActual(f({ currentLocation: { text: "CORTE SUPREMA DE JUSTICIA DE LA NACIÓN - UJIERÍA" } }))).toBe("Otro");
		expect(ubicacionActual(f({ currentLocation: { text: "CORTE SUPREMA DE JUSTICIA DE LA NACIÓN - SECRETARÍA JUDICIAL Nº 2" } }))).toBe(
			"Corte",
		);
		// la instancia guardada gana sobre el texto
		expect(ubicacionActual(f({ currentLocation: { text: "CAMARA X", instancia: "juzgado" } }))).toBe("Juzgado");
	});

	it("primera línea de ubicación actual: la instancia procesal", () => {
		const cl = (x: any) => f({ currentLocation: x });
		expect(ubicacionInstancia(cl({ text: "JUZGADO FEDERAL 7", instancia: "juzgado", grado: "primera" }))).toBe("1ª instancia");
		expect(ubicacionInstancia(cl({ text: "CAMARA FEDERAL - SALA 3", instancia: "camara", grado: "segunda" }))).toBe("2ª instancia");
		expect(ubicacionInstancia(cl({ text: "CAMARA FEDERAL - SALA 2", instancia: "camara", grado: "primera", recursoDirecto: true }))).toBe(
			"Recurso directo · 1ª instancia",
		);
		expect(ubicacionInstancia(cl({ text: "CAMARA FEDERAL - SALA 2", instancia: "camara", grado: "sin-determinar" }))).toBe("Cámara");
		expect(ubicacionInstancia(cl({ text: "CORTE SUPREMA DE JUSTICIA DE LA NACIÓN - SECRETARÍA JUDICIAL Nº 2", instancia: "corte" }))).toBe(
			"Corte Suprema",
		);
		expect(ubicacionInstancia(cl({ text: "CORTE SUPREMA DE JUSTICIA DE LA NACIÓN - ARCHIVO GENERAL", instancia: "archivo" }))).toBe(
			"Archivo General",
		);
		expect(ubicacionInstancia(cl({ text: "OFICINA JUDICIAL DE SALTA", instancia: "otro" }))).toBe("Otra dependencia");
		// sin instancia ni grado (otras jurisdicciones): el tipo de dependencia
		expect(ubicacionInstancia(f({ descriptionJudFolder: "JUZGADO CIVIL 3 - LA PLATA" }))).toBe("Juzgado");
		expect(ubicacionInstancia(f({}))).toBe("");
		expect(ubicacionTexto(f({ descriptionJudFolder: "JUZGADO CIVIL 3" }))).toBe("JUZGADO CIVIL 3");
	});

	it("clave de filtro por juzgado: fuero + número; vacía sin número", () => {
		expect(juzgadoKey(f({ courtNumber: "10" }, "Civil"))).toBe("Civil|10");
		expect(juzgadoKey(f({ courtNumber: "10" }))).toBe("Seguridad Social|10");
		expect(juzgadoKey(f({}))).toBe("");
	});
});

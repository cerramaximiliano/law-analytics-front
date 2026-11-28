/**
 * Formulario del haber de caja: validación (Yup), armado de la entrada del motor, reapertura de un guardado y
 * precarga del retroactivo. Datos inventados.
 */
import { describe, expect, it, vi } from "vitest";
import {
	aniosPBUCalculados,
	armarEntradaHaberCaja,
	HaberCajaValues,
	nuevaFilaAutonomo,
	nuevaFilaRemuneracion,
	valoresIniciales,
} from "./haberCajaFormModel";
import {
	aniosDeServicios,
	excedentesDe30,
	monedaPorDefectoDelPeriodo,
	monedaSegunCriterio,
	primerMesEnPesos,
	SerieMensualHaberCaja,
} from "services/haberCajaService";
import crearValidationSchema from "./validationSchema";
import {
	precargaRetroactivoDesdeHaberCaja,
	sePuedeReabrirHaberCaja,
	valoresDesdeCalculadora,
	valoresDesdeInput,
} from "./valoresDesdeGuardado";
import { CATALOGO_PRUEBA } from "./catalogoPrueba";

vi.mock("utils/axios", () => ({ default: { post: vi.fn(), get: vi.fn() } }));

const completos = (cambios: Partial<HaberCajaValues> = {}): HaberCajaValues => {
	const v = valoresIniciales();
	return {
		...v,
		reclamante: "Caso de prueba",
		fad: "2019-02-28",
		cese: "2019-02-28",
		solicitud: "2019-03-11",
		alta: "2019-06-01",
		servicios: { ...v.servicios, n: { antes: { a: "8", m: "4", d: "" }, despues: { a: "24", m: "", d: "" } } },
		remuneraciones: [nuevaFilaRemuneracion("02/2019", "41.001,00"), nuevaFilaRemuneracion("2019-01", "40000"), nuevaFilaRemuneracion()],
		...cambios,
	};
};
const esquema = crearValidationSchema(CATALOGO_PRUEBA);
// errores de Yup por ruta, como los ve Formik
async function errores(values: HaberCajaValues): Promise<Record<string, string>> {
	try {
		await esquema.validate(values, { abortEarly: false });
		return {};
	} catch (e: any) {
		return Object.fromEntries((e.inner || []).map((x: any) => [x.path, x.message]));
	}
}

describe("haber de caja: validación del formulario", () => {
	it("el formulario completo pasa; el vacío marca lo que falta", async () => {
		expect(await errores(completos())).toEqual({});
		const e = await errores(valoresIniciales());
		expect(e.reclamante).toBe("Ingrese un nombre o seleccione una carpeta");
		expect(e.fad).toBe("Ingrese la fecha de adquisición del derecho");
		expect(e.cese).toBe("Ingrese la fecha de cese");
		expect(e.solicitud).toBe("Ingrese la fecha de solicitud");
		expect(e.alta).toBe("Ingrese la fecha de alta");
		expect(e.servicios).toBe("Cargue los años de servicios");
		expect(e.remuneraciones).toBe("Cargue al menos una remuneración o un período de autónomos");
	});

	it("FAD anterior a la Ley 24.241, cese opcional en la pensión y acuerdo obligatorio para actualizar a ese mes", async () => {
		expect((await errores(completos({ fad: "1994-06-30" }))).fad).toMatch(/7\/1994/);
		expect(await errores(completos({ prestacion: "pension", cese: "" }))).toEqual({});
		expect((await errores(completos({ mesActualizacion: "acuerdo" }))).acuerdo).toMatch(/fecha de acuerdo/);
		expect(await errores(completos({ mesActualizacion: "acuerdo", acuerdo: "2019-08-10" }))).toEqual({});
	});

	it("remuneraciones: período, importe y renglón de varios meses, por fila", async () => {
		const e = await errores(
			completos({
				remuneraciones: [
					nuevaFilaRemuneracion("13/2019", "100"),
					nuevaFilaRemuneracion("01/2019", "abc"),
					nuevaFilaRemuneracion("06/1975", "5000", "05/1975"),
					nuevaFilaRemuneracion("01/1975", "60000", "12/1975"),
				],
			}),
		);
		expect(e["remuneraciones[0].periodo"]).toMatch(/Período inválido/);
		expect(e["remuneraciones[1].importe"]).toBe("Importe inválido");
		expect(e["remuneraciones[2].hasta"]).toBe("El hasta es anterior al período");
		expect(e["remuneraciones[3].hasta"]).toBeUndefined();
	});

	it("servicios y porcentajes fuera de rango", async () => {
		const v = completos();
		v.servicios.m.antes = { a: "3", m: "14", d: "" };
		expect((await errores(v))["servicios.m.antes"]).toMatch(/meses \(0 a 11\)/);
		expect((await errores(completos({ reciprocidad: 120 }))).reciprocidad).toBe("Entre 0 y 100");
		expect((await errores(completos({ prestacion: "pension", porcentajePension: 0 }))).porcentajePension).toBe("Entre 0 y 100");
		expect((await errores(completos({ promedioDesde: "03/2009" }))).promedioHasta).toMatch(/Complete el hasta/);
		expect((await errores(completos({ promedioDesde: "03/2019", promedioHasta: "02/2009" }))).promedioHasta).toBe(
			"El hasta es anterior al desde",
		);
	});

	it("autónomos: la categoría es obligatoria y las combinaciones que el motor resuelve mal no se dejan cargar", async () => {
		const con = (...filas: [string, string, string][]) => completos({ autonomos: filas.map((f) => nuevaFilaAutonomo(...f)) });
		expect(await errores(con(["01/1975", "06/1980", "C"], ["07/1980", "12/1985", "C"]))).toEqual({});
		expect((await errores(con(["01/1975", "12/1976", ""])))["autonomos[0].categoria"]).toMatch(
			/Elegí la categoría del período 1\/1975 a 12\/1976/,
		);
		// de 1/1969 a 6/1980 las letras H a N se cargan (el motor las convierte); después, H, I y J no existen hasta 6/1988
		expect(await errores(con(["01/1975", "12/1976", "H"], ["01/1977", "06/1980", "M"]))).toEqual({});
		expect((await errores(con(["01/1982", "12/1983", "H"])))["autonomos[0].categoria"]).toMatch(/H, I y J vuelven a existir desde 6\/1988/);
		expect((await errores(con(["01/1987", "12/1988", "J"])))["autonomos[0].categoria"]).toMatch(/desde 6\/1988/);
		expect((await errores(con(["01/1990", "12/1990", "M"])))["autonomos[0].categoria"]).toMatch(/categoría M vale hasta 6\/1980/);
		expect(await errores(con(["06/1988", "12/1988", "J"]))).toEqual({});
		expect((await errores(con(["01/1970", "12/1970", "IND"])))["autonomos[0].categoria"]).toMatch(/hasta 12\/1968/);
		expect((await errores(con(["01/1996", "12/1996", "MONOTRI"])))["autonomos[0].categoria"]).toMatch(/desde 10\/1998/);
		expect((await errores(con(["12/1990", "01/1990", "A"])))["autonomos[0].hasta"]).toBe("El hasta es anterior al desde");
		expect((await errores(con(["01/1990", "12/1992", "A"], ["06/1992", "12/1993", "B"])))["autonomos[1].desde"]).toMatch(/se superpone/);
		// solo autónomos, sin remuneraciones: se puede calcular
		expect(await errores({ ...con(["01/1990", "12/1993", "A"]), remuneraciones: [nuevaFilaRemuneracion()] })).toEqual({});
	});
});

describe("haber de caja: entrada del motor", () => {
	it("arma lo cargado, ordena las filas y le pone a cada una la moneda de su período", () => {
		const input = armarEntradaHaberCaja(completos(), CATALOGO_PRUEBA);
		expect(input).toEqual({
			programa: "ansesPrpa",
			prestacion: "jubilacion",
			fechas: { fad: "2019-02-28", cese: "2019-02-28", solicitud: "2019-03-11", alta: "2019-06-01" },
			servicios: { n: { antes: { a: 8, m: 4, d: 0 }, despues: { a: 24, m: 0, d: 0 } } },
			remuneraciones: [
				{ periodo: "2019-01", importe: 40000, moneda: "pesos" },
				{ periodo: "2019-02", importe: 41001, moneda: "pesos" },
			],
		});
	});

	it("moneda automática por período (convención de BlueCorp), moneda corregida y renglones de varios meses", () => {
		const input = armarEntradaHaberCaja(
			completos({
				remuneraciones: [
					nuevaFilaRemuneracion("12/1969", "50000"),
					nuevaFilaRemuneracion("01/1975", "60000", "12/1975"),
					nuevaFilaRemuneracion("06/1984", "9000"),
					nuevaFilaRemuneracion("06/1988", "4500"),
					// la constancia ya trae el importe convertido: el usuario la corrigió a pesos
					nuevaFilaRemuneracion("07/1988", "0,45", "", "pesos"),
				],
			}),
			CATALOGO_PRUEBA,
		);
		expect(input.remuneraciones).toEqual([
			// la moneda automática es la convención de BlueCorp que publica el catálogo: pesos argentinos antes de 1985
			{ periodo: "1969-12", importe: 50000, moneda: "pesosArgentinos" },
			{ periodo: "1975-01", importe: 60000, moneda: "pesosArgentinos", hasta: "1975-12" },
			{ periodo: "1984-06", importe: 9000, moneda: "pesosArgentinos" },
			{ periodo: "1988-06", importe: 4500, moneda: "australes" },
			{ periodo: "1988-07", importe: 0.45, moneda: "pesos" },
		]);
		// sin catálogo las filas automáticas van sin moneda: la pone el hub
		expect(armarEntradaHaberCaja(completos(), null).remuneraciones[0]).toEqual({ periodo: "2019-01", importe: 40000 });
	});

	it("autónomos, simultáneos, prestaciones y opciones", () => {
		const v = completos({
			prestacion: "edadAvanzada",
			anticipada: true,
			anticipadaPorcentaje: 50,
			acuerdo: "2019-08-10",
			promedioDesde: "03/2009",
			promedioHasta: "02/2019",
			zonaAustral: true,
			reciprocidad: 81.67,
			reciprocidadAlcance: "todas",
			excedente35: "autonomos",
			autonomos: [nuevaFilaAutonomo("07/1980", "12/1985", "C"), nuevaFilaAutonomo("01/1975", "06/1980", "C"), nuevaFilaAutonomo()],
			sinEquiparacion: true,
			mesActualizacion: "acuerdo",
			topeArt9: false,
			topeArt14: false,
			divisorW: "120",
			aplicarMaximo: false,
			aplicarMinimo: true,
		});
		v.servicios.m.antes = { a: "10", m: "", d: "15" };
		v.servicios.p.despues = { a: "", m: "6", d: "" };
		expect(armarEntradaHaberCaja(v, CATALOGO_PRUEBA)).toMatchObject({
			prestacion: "edadAvanzada",
			fechas: { acuerdo: "2019-08-10" },
			periodoPromedio: { desde: "2009-03", hasta: "2019-02" },
			servicios: {
				m: { antes: { a: 10, m: 0, d: 15 }, despues: { a: 0, m: 0, d: 0 } },
				p: { antes: { a: 0, m: 0, d: 0 }, despues: { a: 0, m: 6, d: 0 } },
			},
			autonomo: {
				equivalencia: false,
				periodos: [
					{ desde: "1975-01", hasta: "1980-06", categoria: "C" },
					{ desde: "1980-07", hasta: "1985-12", categoria: "C" },
				],
			},
			zonaAustral: true,
			prorrataReciprocidad: 81.67,
			reciprocidadAlcance: "todas",
			excedente35: "autonomos",
			mesActualizacion: "acuerdo",
			topeArt9: false,
			topeArt14: false,
			divisorW: 120,
			aplicarMaximo: false,
			aplicarMinimo: true,
		});
		// pensión: porcentaje sí, anticipada no; la fecha inicial de pago nunca viaja
		const pension = armarEntradaHaberCaja(
			completos({ prestacion: "pension", porcentajePension: 70, anticipada: true, inicioPago: "2019-07-01" }),
			CATALOGO_PRUEBA,
		);
		expect(pension).toMatchObject({ prestacion: "pension", porcentajePension: 70 });
		expect(pension).not.toHaveProperty("anticipada");
		expect(JSON.stringify(pension)).not.toContain("2019-07-01");
	});
});

describe("haber de caja: guardados y encadenado con el retroactivo", () => {
	const resultado: any = { mesValuacion: "2019-02", haber: 24795.5, PBU: 4500.25, PC: 5125.06, PAP: 15170.19, avisos: [] };
	const guardado = (extra: object = {}) => ({
		_id: "calc1",
		classType: "previsional",
		subClassType: "haberCaja",
		user: "Caso de prueba",
		variables: { input: armarEntradaHaberCaja(completos(), CATALOGO_PRUEBA), resultado, formulario: completos() },
		...extra,
	});

	it("reabre con el formulario guardado y la carpeta del documento manda", () => {
		expect(sePuedeReabrirHaberCaja(guardado())).toBe(true);
		expect(sePuedeReabrirHaberCaja({ ...guardado(), subClassType: "retroactivo" })).toBe(false);
		expect(valoresDesdeCalculadora({ ...guardado(), variables: {} })).toBeNull();
		const v = valoresDesdeCalculadora(guardado())!;
		expect(v).toMatchObject({ reclamante: "Caso de prueba", fad: "2019-02-28", folderId: "" });
		expect(v.remuneraciones.map((f) => [f.periodo, f.importe])).toEqual([
			["02/2019", "41.001,00"],
			["2019-01", "40000"],
			["", ""],
		]);
		expect(valoresDesdeCalculadora(guardado({ folderId: "f1", folderName: "Carpeta de prueba" }))).toMatchObject({
			reclamante: "__CAUSA_VINCULADA__f1",
			folderId: "f1",
			folderName: "Carpeta de prueba",
		});
	});

	it("sin formulario guardado, arma los valores desde la entrada del motor (ida y vuelta)", () => {
		const input = armarEntradaHaberCaja(
			completos({
				autonomos: [nuevaFilaAutonomo("01/1990", "12/1993", "A")],
				sinEquiparacion: true,
				zonaAustral: true,
				reciprocidad: 81.67,
				divisorW: "meses",
			}),
			CATALOGO_PRUEBA,
		);
		// el hub devuelve la entrada con la marca de moneda automática
		const delHub = { ...input, remuneraciones: input.remuneraciones.map((r) => ({ ...r, monedaAutomatica: true })) };
		const v = valoresDesdeInput(delHub, { reclamante: "Caso de prueba" });
		expect(v.remuneraciones.every((f) => f.moneda === "")).toBe(true);
		expect(armarEntradaHaberCaja(v, CATALOGO_PRUEBA)).toEqual(input);
	});

	it("precarga del retroactivo: el haber de caja entra como haber pagado por ANSES, con su origen", () => {
		const p = precargaRetroactivoDesdeHaberCaja(resultado, completos({ zonaAustral: true }), "calc1");
		expect(p.origen).toEqual({
			etapa: "haberCaja",
			calculatorId: "calc1",
			mes: "2019-02",
			haber: 24795.5,
			componentes: { PBU: 4500.25, PC: 5125.06, PAP: 15170.19 },
			prestacion: "jubilacion",
			serie: null,
		});
		expect(p.valores).toEqual({
			reclamante: "Caso de prueba",
			folderId: "",
			folderName: "",
			prestacion: "jubilacion_ordinaria",
			fechaAdquisicion: "28/02/2019",
			fechaAlta: "06/2019",
			haberPagadoAnses: 24795.5,
			haberPagadoAl: "01/02/2019",
			monedaHaberPagado: "ARS",
			zonaAustral: true,
		});
	});

	it("con fecha de acuerdo toma el mensual de ese mes; sin guardar no hay vínculo; la carpeta viaja", () => {
		const conAcuerdo = { ...resultado, alAcuerdo: { mes: "2019-08", PBU: 5000, PC: 5600, PAP: 16500, haberPuro: 27100, haber: 27100 } };
		const p = precargaRetroactivoDesdeHaberCaja(
			conAcuerdo,
			completos({ prestacion: "pension", folderId: "f1", folderName: "Carpeta de prueba", reclamante: "__CAUSA_VINCULADA__f1" }),
			null,
		);
		expect(p.origen).toMatchObject({ calculatorId: null, mes: "2019-08", haber: 27100, componentes: { PBU: 5000, PC: 5600, PAP: 16500 } });
		expect(p.valores).toMatchObject({
			haberPagadoAnses: 27100,
			haberPagadoAl: "01/08/2019",
			prestacion: "pension_directa",
			reclamante: "__CAUSA_VINCULADA__f1",
			folderId: "f1",
			folderName: "Carpeta de prueba",
		});
	});

	const serie: SerieMensualHaberCaja = {
		desde: "2019-02",
		hasta: "2019-05",
		mesParametros: "2019-02",
		filas: [
			["2019-02", 24795.5],
			["2019-03", 27728.81],
			["2019-04", 27728.81],
			["2019-05", 27728.81],
		].map(([mes, haberAlPago]) => ({
			mes: mes as string,
			PBU: 1,
			PC: 1,
			PAP: 1,
			suplemento: 0,
			sumaFija: 0,
			haberPuro: haberAlPago as number,
			descuentoMaximo: 0,
			complementoMinimo: 0,
			haberAlPago: haberAlPago as number,
		})),
		avisos: [],
	};

	it("con la serie mensual, los percibidos del retroactivo son los mensuales del haber de caja", () => {
		const p = precargaRetroactivoDesdeHaberCaja(resultado, completos(), "calc1", serie);
		expect(p.origen.serie).toEqual({ desde: "2019-02", hasta: "2019-05" });
		expect(p.valores.percibidoManual).toBe(true);
		expect(p.valores.percibidosMensuales).toEqual([
			{ periodo: "2019-02", importe: 24795.5 },
			{ periodo: "2019-03", importe: 27728.81 },
			{ periodo: "2019-04", importe: 27728.81 },
			{ periodo: "2019-05", importe: 27728.81 },
		]);
		// el haber de caja sigue entrando como haber pagado: de ahí arranca el reclamado y es el respaldo si se desvincula
		expect(p.valores).toMatchObject({ haberPagadoAnses: 24795.5, haberPagadoAl: "01/02/2019" });
		// sin serie (o vacía) el retroactivo queda en el modo de siempre
		const sin = precargaRetroactivoDesdeHaberCaja(resultado, completos(), "calc1", { ...serie, filas: [] });
		expect(sin.origen.serie).toBeNull();
		expect(sin.valores).not.toHaveProperty("percibidoManual");
	});

	it("todas las prestaciones habilitadas llegan al retroactivo con su prestación; la derivada, con fecha y porcentaje", () => {
		const de = (cambios: Partial<HaberCajaValues>, r: any = resultado) =>
			precargaRetroactivoDesdeHaberCaja(r, completos(cambios), null).valores;
		expect(de({ prestacion: "jubilacion" }).prestacion).toBe("jubilacion_ordinaria");
		expect(de({ prestacion: "pension" }).prestacion).toBe("pension_directa");
		expect(de({ prestacion: "retiroInvalidez" }).prestacion).toBe("retiro_invalidez");
		expect(de({ prestacion: "edadAvanzada" }).prestacion).toBe("edad_avanzada");
		expect(de({ prestacion: "anticipada" }).prestacion).toBe("prestacion_anticipada");
		// guardados anteriores: la anticipada era una casilla sobre la jubilación
		expect(de({ prestacion: "jubilacion", anticipada: true }).prestacion).toBe("prestacion_anticipada");
		const derivada = de(
			{ prestacion: "jubilacion", pensionDerivada: true, pensionDerivadaPorcentaje: 70, pensionDerivadaFallecimiento: "2022-05-10" },
			{ ...resultado, pensionDerivada: { mes: "2022-05", porcentaje: 70, PBU: 1, PC: 1, PAP: 1, haber: 3, haberConMinimo: 3 } },
		);
		expect(derivada).toMatchObject({ prestacion: "pension_derivada", pensionFecha: "10/05/2022", pensionPorcentaje: 70 });
	});
});

describe("haber de caja: prestaciones del selector, excedentes de 30 y monedas anteriores a 1992", () => {
	it("la anticipada viaja como jubilación con reducción; el retiro por invalidez, con el tipo de aportante", () => {
		const anticipada = armarEntradaHaberCaja(completos({ prestacion: "anticipada" }), CATALOGO_PRUEBA);
		expect(anticipada).toMatchObject({ prestacion: "jubilacion", anticipada: true });
		expect(armarEntradaHaberCaja(completos({ prestacion: "anticipada", anticipadaPorcentaje: 80 }), CATALOGO_PRUEBA).anticipada).toEqual({
			porcentaje: 80,
		});
		// ida y vuelta: la entrada del motor vuelve a ser la anticipada del selector
		expect(valoresDesdeInput(anticipada).prestacion).toBe("anticipada");
		expect(
			valoresDesdeCalculadora({
				classType: "previsional",
				subClassType: "haberCaja",
				variables: { formulario: completos({ anticipada: true }) },
			}),
		).toMatchObject({
			prestacion: "anticipada",
			anticipada: false,
		});

		const invalidez = armarEntradaHaberCaja(
			completos({ prestacion: "retiroInvalidez", tipoAfiliado: "irregular", excedentesPBU: "4" }),
			CATALOGO_PRUEBA,
		);
		expect(invalidez).toMatchObject({ prestacion: "retiroInvalidez", tipoAfiliado: "irregular" });
		expect(invalidez).not.toHaveProperty("aniosPBU");
		expect(armarEntradaHaberCaja(completos({ prestacion: "retiroInvalidez" }), CATALOGO_PRUEBA)).not.toHaveProperty("tipoAfiliado");
		expect(valoresDesdeInput(invalidez)).toMatchObject({ prestacion: "retiroInvalidez", tipoAfiliado: "irregular" });
	});

	it("pensión derivada: porcentaje y fallecimiento sobre la prestación del causante", async () => {
		const v = completos({ pensionDerivada: true, pensionDerivadaPorcentaje: 70, pensionDerivadaFallecimiento: "2022-05-10" });
		const entrada = armarEntradaHaberCaja(v, CATALOGO_PRUEBA);
		expect(entrada.pensionDerivada).toEqual({ fallecimiento: "2022-05-10", porcentaje: 70 });
		expect(valoresDesdeInput(entrada)).toMatchObject({
			pensionDerivada: true,
			pensionDerivadaPorcentaje: 70,
			pensionDerivadaFallecimiento: "2022-05-10",
		});
		// no se pregunta sobre la pensión directa ni sobre el retiro por invalidez
		expect(armarEntradaHaberCaja({ ...v, prestacion: "pension" }, CATALOGO_PRUEBA)).not.toHaveProperty("pensionDerivada");
		expect(armarEntradaHaberCaja({ ...v, prestacion: "retiroInvalidez" }, CATALOGO_PRUEBA)).not.toHaveProperty("pensionDerivada");
		expect(await errores(v)).toEqual({});
		const e = await errores(completos({ pensionDerivada: true }));
		expect(e.pensionDerivadaPorcentaje).toMatch(/porcentaje de la pensión derivada/);
		expect(e.pensionDerivadaFallecimiento).toMatch(/fallecimiento del causante/);
		expect((await errores({ ...v, pensionDerivadaFallecimiento: "2018-01-10" })).pensionDerivadaFallecimiento).toMatch(
			/anterior a la adquisición/,
		);
	});

	it("las prestaciones que el motor no calcula no pasan la validación; el retiro por invalidez no pide servicios ni cese", async () => {
		for (const prestacion of ["baseJubilatoria", "rentaVitalicia", "retiroProgramado"] as const)
			expect((await errores(completos({ prestacion }))).prestacion).toMatch(/todavía no se calcula/);
		const v = valoresIniciales();
		const invalidez = completos({ prestacion: "retiroInvalidez", cese: "", servicios: v.servicios });
		expect(await errores(invalidez)).toEqual({});
		expect((await errores(completos({ servicios: v.servicios }))).servicios).toBe("Cargue los años de servicios");
	});

	it("servicios excedentes: años sobre 30 que calcula el motor de los servicios, corregibles a mano (aniosPBU = 30 + excedentes)", async () => {
		// misma regla que `anios` del motor: la fracción de más de 6 meses cuenta un año
		expect(aniosDeServicios([{ a: 22, m: 7 }, { a: 11 }])).toBe(34);
		expect(aniosDeServicios([{ a: 33, m: 6 }])).toBe(33);
		expect(aniosDeServicios([{ a: 33, m: 6, d: 1 }])).toBe(34);
		expect(aniosDeServicios([{ a: 20 }, null, undefined])).toBe(20);
		expect([29, 30, 34, 50].map(excedentesDe30)).toEqual([0, 0, 4, 15]);
		const v = completos();
		v.servicios.n = { antes: { a: "22", m: "7", d: "" }, despues: { a: "11", m: "", d: "" } };
		expect(aniosPBUCalculados(v.servicios)).toBe(34);
		v.servicios.n.antes.m = "14";
		expect(aniosPBUCalculados(v.servicios)).toBeNull();

		// vacío: no viaja y el motor calcula; con valor: 30 + excedentes
		expect(armarEntradaHaberCaja(completos(), CATALOGO_PRUEBA)).not.toHaveProperty("aniosPBU");
		expect(armarEntradaHaberCaja(completos({ excedentesPBU: "8" }), CATALOGO_PRUEBA).aniosPBU).toBe(38);
		expect(armarEntradaHaberCaja(completos({ excedentesPBU: "0" }), CATALOGO_PRUEBA).aniosPBU).toBe(30);
		expect(valoresDesdeInput(armarEntradaHaberCaja(completos({ excedentesPBU: "8" }), CATALOGO_PRUEBA)).excedentesPBU).toBe("8");
		expect((await errores(completos({ excedentesPBU: "16" }))).excedentesPBU).toMatch(/entre 0 y 15/);
		expect(await errores(completos({ excedentesPBU: "15" }))).toEqual({});
		// la opción de los 35 años de la PC es otra cosa y viaja aparte
		expect(armarEntradaHaberCaja(completos({ excedentesPBU: "8", excedente35: "ninguno" }), CATALOGO_PRUEBA)).toMatchObject({
			aniosPBU: 38,
			excedente35: "ninguno",
		});
	});

	it("importes anteriores al peso: como BlueCorp (automática), ya en pesos o en la moneda de la época; los negativos se aceptan", async () => {
		const periodos = ["1968-05", "1975-03", "1984-12", "1985-03", "1990-01"];
		const con = (c: "epoca" | "pesos" | "bluecorp") => periodos.map((p) => monedaSegunCriterio(c, p, CATALOGO_PRUEBA));
		// BlueCorp es la automática: la fila va sin moneda y recibe la del catálogo (`monedasPorDefecto`)
		expect(con("bluecorp")).toEqual(["", "", "", "", ""]);
		expect(periodos.map((p) => monedaPorDefectoDelPeriodo(CATALOGO_PRUEBA, p)?.clave)).toEqual([
			"pesosArgentinos",
			"pesosArgentinos",
			"pesosArgentinos",
			"australes",
			"australes",
		]);
		expect(con("pesos")).toEqual(["pesos", "pesos", "pesos", "pesos", "pesos"]);
		// la moneda de la época es la de curso legal (`monedas` del catálogo)
		expect(con("epoca")).toEqual(["pesosMonedaNacional", "pesosLey", "pesosArgentinos", "pesosArgentinos", "australes"]);
		// desde el peso no cambia nada; el corte sale del catálogo y sin catálogo no se toca ninguna fila
		expect(primerMesEnPesos(CATALOGO_PRUEBA)).toBe("1992-01");
		for (const c of ["epoca", "pesos", "bluecorp"] as const) expect(monedaSegunCriterio(c, "1992-01", CATALOGO_PRUEBA)).toBe("");
		expect(monedaSegunCriterio("pesos", "1975-03", null)).toBe("");
		// la entrada lleva la moneda por defecto en las filas automáticas
		const viejas = completos({ remuneraciones: [nuevaFilaRemuneracion("03/1975", "120000"), nuevaFilaRemuneracion("03/1988", "5000")] });
		expect(armarEntradaHaberCaja(viejas, CATALOGO_PRUEBA).remuneraciones.map((r) => r.moneda)).toEqual(["pesosArgentinos", "australes"]);
		expect(valoresIniciales().monedasViejas).toBe("bluecorp");
		// la constancia de ANSES trae ajustes negativos y el motor los suma
		const v = completos({ remuneraciones: [nuevaFilaRemuneracion("01/2019", "40000"), nuevaFilaRemuneracion("01/2019", "-500,00")] });
		expect(await errores(v)).toEqual({});
		expect(armarEntradaHaberCaja(v, CATALOGO_PRUEBA).remuneraciones.map((r) => r.importe)).toEqual([40000, -500]);
	});
});

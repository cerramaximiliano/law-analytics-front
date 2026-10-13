import { describe, expect, it } from "vitest";
import {
	avisosMultas,
	baseIndemnizaciones,
	calcularMultas,
	integracionArt233,
	mesesEnteros,
	multaArt10Ley24013,
	multaArt1Ley25323,
	multaArt2Ley25323,
	multaArt8Ley24013,
	multaArt9Ley24013,
	multaArt15Ley24013,
	preavisoArt232,
} from "../sections/forms/wizard/calc-laboral/despido/multas";

// Cuadros de condena reales (sentencias del fuero del trabajo, anonimizadas: solo montos).
// la-ads/analysis/2026-10-13-multas-despido-validacion.md
const SENTENCIAS = [
	{ art245: 40000, preavisoConSAC: 43333.33, integracionConSAC: 37555.54, art2: 60444.43, art15: 120888.87 },
	{ art245: 380730, preavisoConSAC: 140833.33, integracionConSAC: 35208.33, art2: 278385.83, art15: 556771.67 },
	{ art245: 3077570.2, preavisoConSAC: 333402.41, integracionConSAC: 22226.83, art2: 1716599.72, art15: 3433199.44 },
	{ art245: 132704.8, preavisoConSAC: 71881.77, integracionConSAC: 27825.2, art2: 116205.88, art15: 232411.77 },
	{ art245: 89976, preavisoConSAC: 48737, integracionConSAC: 41660.13, art2: 90186.57, art15: 180373.13 },
	{ art245: 332565, preavisoConSAC: 360278.75, integracionConSAC: 264204.42, art2: 478524.08, art15: 957048.17 },
	{ art245: 540000, preavisoConSAC: 130000, integracionConSAC: 2349, art2: 336174, art15: 672349 },
	{ art245: 833140, preavisoConSAC: 164103.33, integracionConSAC: 8791.25, art2: 503017.25, art15: 1006034.5 },
];
// El SAC ya viene sumado en preaviso e integración: se carga como rubro sin SAC aparte
const base = (c: (typeof SENTENCIAS)[number]) =>
	baseIndemnizaciones({
		art245: c.art245,
		preaviso: c.preavisoConSAC,
		sacPreaviso: 0,
		integracion: c.integracionConSAC,
		sacIntegracion: 0,
	});

describe("multas de la Ley 25.323 y art. 15 de la Ley 24.013 contra sentencias", () => {
	// tolerancia de $ 1: las sentencias redondean cada rubro (y alguna, la multa al peso)
	it.each(SENTENCIAS)("art. 2 = 50 % de (245 + 232 + 233 con SAC) y art. 15 = el doble ($art2)", (c) => {
		expect(Math.abs(multaArt2Ley25323(base(c)) - c.art2)).toBeLessThanOrEqual(1);
		expect(Math.abs(multaArt15Ley24013(base(c)) - c.art15)).toBeLessThanOrEqual(1);
	});
	it("art. 1 = el art. 245 (lo duplica)", () => {
		expect(multaArt1Ley25323(380730)).toBe(380730);
	});
	it("el SAC se puede excluir de la base y el art. 2 se puede reducir", () => {
		const b = { art245: 1000, preaviso: 1200, sacPreaviso: 100, integracion: 600, sacIntegracion: 50 };
		expect(baseIndemnizaciones(b)).toBe(2950);
		expect(baseIndemnizaciones(b, true)).toBe(2800);
		expect(multaArt2Ley25323(2950, 25)).toBe(737.5);
	});
});

describe("arts. 8, 9 y 10 de la Ley 24.013", () => {
	it("meses enteros y nunca negativos", () => {
		expect(mesesEnteros("15/01/2020", "14/07/2020")).toBe(5);
		expect(mesesEnteros("15/07/2020", "15/01/2020")).toBe(0);
	});
	it("art. 8: 25 % × meses con piso de 3 remuneraciones", () => {
		expect(multaArt8Ley24013("01/01/2020", "01/01/2022", 1000)).toBe(6000); // 24 meses
		expect(multaArt8Ley24013("01/01/2020", "01/06/2020", 1000)).toBe(3000); // 5 meses → piso
	});
	it("art. 9: del ingreso real a la fecha registrada (posterior)", () => {
		expect(multaArt9Ley24013("01/01/2020", "01/01/2021", 1000)).toBe(3000);
	});
	it("art. 10: 25 % de la diferencia desde que se registró el salario menor", () => {
		expect(multaArt10Ley24013("01/01/2021", "01/01/2022", 1000, 600)).toBe(1200);
		expect(multaArt10Ley24013("01/01/2021", "01/01/2022", 1000, 1000)).toBe(0);
	});
});

describe("preaviso e integración sin el tope del art. 245", () => {
	it("preaviso según antigüedad sobre la remuneración que se le pasa", () => {
		expect(preavisoArt232("01/01/2015", "01/01/2022", 1000)).toBe(2000);
		expect(preavisoArt232("01/01/2020", "01/01/2022", 1000)).toBe(1000);
		expect(preavisoArt232("01/12/2021", "01/01/2022", 1000)).toBeCloseTo(500, 6);
	});
	it("integración: días que faltan del mes", () => {
		expect(integracionArt233("10/04/2022", 3000)).toBe(2000);
	});
});

describe("calcularMultas y avisos", () => {
	const values = {
		isMultas: true,
		multas: ["multaArt2", "multaArt15"],
		multaLE: 0,
		fechaIngreso: "01/01/2020",
		fechaEgreso: "10/04/2022",
	};
	it("arma la base con preaviso, integración y SAC aunque no estén tildados", () => {
		const { rubros } = calcularMultas(values, { indemnizacion: 3000, remuneracion: 1000 });
		const b = 3000 + 1000 + 1000 / 12 + (20 * 1000) / 30 + (20 * 1000) / 30 / 12;
		expect(rubros["Multa Art. 2º Ley 25.323"]).toBeCloseTo(b / 2, 2);
		expect(rubros["Multa Art. 15 Ley 24.013"]).toBeCloseTo(b, 2);
	});
	it("sin multas habilitadas no calcula nada", () => {
		expect(calcularMultas({ ...values, isMultas: false }, { indemnizacion: 3000, remuneracion: 1000 }).rubros).toEqual({});
	});
	it("avisa la derogación por la Ley 27.742 con egreso desde el 9/7/2024", () => {
		expect(avisosMultas({ fechaEgreso: "08/07/2024", multas: ["multaArt2"] })).toEqual([]);
		const a = avisosMultas({ fechaEgreso: "09/07/2024", multas: ["multaArt2", "multaArt80"], multaLE: 1 });
		expect(a[0]).toMatch(/Ley 27\.742 derogó.*art\. 2 Ley 25\.323.*art\. 8 Ley 24\.013/);
		expect(a[1]).toMatch(/art\. 80 LCT/);
	});
	it("avisa que el art. 1 no se acumula con los de la Ley 24.013", () => {
		expect(avisosMultas({ fechaEgreso: "01/01/2023", multas: ["multaArt1", "multaArt15"] })[0]).toMatch(/no es acumulable/);
	});
});

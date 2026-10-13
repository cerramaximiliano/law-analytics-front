import dayjs from "utils/dayjs-config";

// Multas laborales de la calculadora de despido. Fórmulas validadas contra los cuadros de condena de 4.672 sentencias del
// fuero del trabajo (2018–2026), que son el capital del que parte la liquidación del art. 132 LO
// (la-ads/analysis/2026-10-13-multas-despido-validacion.md):
//   - Art. 1 Ley 25.323: doble del art. 245 → +100 % del art. 245 (88 % de los casos).
//   - Art. 2 Ley 25.323: 50 % de (245 + 232 + SAC + 233 + SAC) (79 %; el 84 % incluye el SAC).
//   - Art. 15 Ley 24.013: el doble de las indemnizaciones del despido → +100 % de la misma base (= 2 × art. 2 en el 90 %).
//   - Art. 80 LCT: 3 remuneraciones (96 %).
//   - Art. 8 Ley 24.013: 25 % de la remuneración × meses enteros, nunca menos de 3 remuneraciones.
// Vigencia: la Ley 27.742 (BO 8/7/2024) derogó los arts. 8 a 17 de la Ley 24.013 (art. 99), la Ley 25.323 entera (art. 100) y
// el art. 45 de la Ley 25.345, que agregó la indemnización del art. 80 LCT. La CNAT las aplica a hechos anteriores.

export const DEROGACION_LEY_27742 = "2024-07-09";

export interface BaseIndemnizatoria {
	/** Indemnización por antigüedad (art. 245, ya con tope) */
	art245: number;
	/** Preaviso (art. 232), sobre la remuneración sin tope */
	preaviso: number;
	sacPreaviso: number;
	/** Integración del mes de despido (art. 233) */
	integracion: number;
	sacIntegracion: number;
}

const fecha = (s: string | null | undefined) => (s ? dayjs(s, "DD/MM/YYYY") : null);
const red = (n: number) => Math.round(n * 100) / 100;
/** Importe cargado en el formulario (número o texto con separador de miles). */
export const importe = (v: unknown): number => {
	if (typeof v === "number") return v;
	const n = Number(String(v ?? "").replace(/,/g, ""));
	return Number.isFinite(n) ? n : 0;
};

/** Meses enteros entre dos fechas DD/MM/AAAA (0 si alguna falta, es inválida o el período es negativo). */
export function mesesEnteros(desde: string | null | undefined, hasta: string | null | undefined): number {
	const d = fecha(desde);
	const h = fecha(hasta);
	if (!d || !h || !d.isValid() || !h.isValid()) return 0;
	return Math.max(0, h.diff(d, "months"));
}

/** Base de los arts. 2 (Ley 25.323) y 15 (Ley 24.013): 245 + 232 + 233, con el SAC sobre preaviso e integración salvo que se excluya. */
export function baseIndemnizaciones(b: BaseIndemnizatoria, sinSAC = false): number {
	return b.art245 + b.preaviso + b.integracion + (sinSAC ? 0 : b.sacPreaviso + b.sacIntegracion);
}

export const multaArt1Ley25323 = (art245: number) => red(art245);
/** `porcentaje`: 50 por ley; el juez puede reducirlo (art. 2, párrafo 2). */
export const multaArt2Ley25323 = (base: number, porcentaje = 50) => red((base * porcentaje) / 100);
export const multaArt15Ley24013 = (base: number) => red(base);
export const multaArt80LCT = (remuneracion: number) => red(remuneracion * 3);

/** Art. 8: 25 % de las remuneraciones devengadas (meses enteros del período no registrado), con piso de 3 remuneraciones. */
export function multaArt8Ley24013(fechaIngreso: string, fechaEgreso: string, remuneracion: number): number {
	return red(Math.max(0.25 * remuneracion * mesesEnteros(fechaIngreso, fechaEgreso), 3 * remuneracion));
}

/** Art. 9: 25 % de las remuneraciones entre el ingreso real y la fecha de ingreso registrada (posterior). */
export function multaArt9Ley24013(fechaIngresoReal: string, fechaIngresoRegistrada: string, remuneracion: number): number {
	return red(0.25 * remuneracion * mesesEnteros(fechaIngresoReal, fechaIngresoRegistrada));
}

/** Art. 10: 25 % de la diferencia mensual no registrada, desde que se registró un salario menor hasta el egreso. */
export function multaArt10Ley24013(
	fechaDesde: string,
	fechaEgreso: string,
	remuneracionReal: number,
	remuneracionRegistrada: number,
): number {
	const diferencia = remuneracionReal - remuneracionRegistrada;
	if (!(diferencia > 0)) return 0;
	return red(0.25 * diferencia * mesesEnteros(fechaDesde, fechaEgreso));
}

const LEY_24013: Record<number, string> = { 1: "Art. 8", 2: "Art. 9", 3: "Art. 10" };

/** Avisos de vigencia y de concurrencia para las multas elegidas. */
export function avisosMultas(p: { fechaEgreso?: string | null; multas?: string[]; multaLE?: number }): string[] {
	const multas = p.multas || [];
	const le = LEY_24013[p.multaLE || 0];
	const avisos: string[] = [];
	const egreso = fecha(p.fechaEgreso);
	if (egreso && egreso.isValid() && !egreso.isBefore(dayjs(DEROGACION_LEY_27742))) {
		const derogadas = [
			multas.includes("multaArt1") && "art. 1 Ley 25.323",
			multas.includes("multaArt2") && "art. 2 Ley 25.323",
			multas.includes("multaArt15") && "art. 15 Ley 24.013",
			le && `${le.toLowerCase()} Ley 24.013`,
		].filter(Boolean);
		if (derogadas.length) {
			avisos.push(
				`La Ley 27.742 derogó estas multas desde el 9/7/2024 (${derogadas.join(
					", ",
				)}). Con egreso desde esa fecha solo proceden si se plantea y prospera la inconstitucionalidad de la derogación.`,
			);
		}
		if (multas.includes("multaArt80")) {
			avisos.push(
				"La Ley 27.742 derogó el art. 45 de la Ley 25.345, que agregó la indemnización del art. 80 LCT. Para extinciones desde el 9/7/2024 su procedencia es discutida.",
			);
		}
	}
	if (multas.includes("multaArt1") && (le || multas.includes("multaArt15"))) {
		const otras = [le, multas.includes("multaArt15") && "art. 15"].filter(Boolean).join(" y ");
		avisos.push(`El art. 1 de la Ley 25.323 no es acumulable con los arts. 8, 9, 10 y 15 de la Ley 24.013 (se eligió también ${otras}).`);
	}
	return avisos;
}

/** Preaviso (art. 232 LCT) sobre la remuneración sin tope: el tope del art. 245 no alcanza a los arts. 232 y 233. */
export function preavisoArt232(fechaIngreso: string | null, fechaEgreso: string | null, remuneracion: number): number {
	const inicio = fecha(fechaIngreso);
	const fin = fecha(fechaEgreso);
	if (!inicio || !fin || !inicio.isValid() || !fin.isValid()) return 0;
	const meses = fin.diff(inicio, "months");
	if (meses < 3) return (remuneracion / 30) * 15;
	if (fin.diff(inicio, "years") < 5) return remuneracion;
	return remuneracion * 2;
}

/** Integración del mes de despido (art. 233 LCT): días que faltan para terminar el mes. */
export function integracionArt233(fechaEgreso: string | null, remuneracion: number): number {
	const fin = fecha(fechaEgreso);
	if (!fin || !fin.isValid()) return 0;
	const dias = fin.daysInMonth();
	return (dias - fin.date()) * (remuneracion / dias);
}

/**
 * Multas elegidas en el formulario, con las claves que muestran los resultados. La base de los arts. 2 y 15 se arma siempre
 * con preaviso, integración y sus SAC, estén o no tildados en la liquidación final: la multa recae sobre las indemnizaciones
 * que corresponden al despido.
 * @param p.indemnizacion art. 245 ya calculado (con tope)
 * @param p.remuneracion mejor remuneración mensual, sin tope
 */
export function calcularMultas(
	values: any,
	p: { indemnizacion: number; remuneracion: number },
): { rubros: Record<string, number>; avisos: string[] } {
	const rubros: Record<string, number> = {};
	if (!values?.isMultas) return { rubros, avisos: [] };
	const multas: string[] = Array.isArray(values.multas) ? values.multas : [];
	const multaLE = Number(values.multaLE) || 0;
	const preaviso = preavisoArt232(values.fechaIngreso, values.fechaEgreso, p.remuneracion);
	const integracion = integracionArt233(values.fechaEgreso, p.remuneracion);
	const base = baseIndemnizaciones(
		{ art245: p.indemnizacion, preaviso, sacPreaviso: preaviso / 12, integracion, sacIntegracion: integracion / 12 },
		!!values.multasSinSAC,
	);

	if (multas.includes("multaArt1")) rubros["Multa Art. 1º Ley 25.323"] = multaArt1Ley25323(p.indemnizacion);
	if (multas.includes("multaArt2")) {
		const pct = values.multaArt2Porcentaje === "" || values.multaArt2Porcentaje == null ? 50 : Number(values.multaArt2Porcentaje);
		rubros["Multa Art. 2º Ley 25.323"] = multaArt2Ley25323(base, Number.isFinite(pct) ? Math.min(Math.max(pct, 0), 50) : 50);
	}
	if (multas.includes("multaArt80")) rubros["Multa Art. 80 LCT"] = multaArt80LCT(p.remuneracion);
	if (multas.includes("multaArt15")) rubros["Multa Art. 15 Ley 24.013"] = multaArt15Ley24013(base);
	if (multas.includes("multaArt245bis")) {
		const porcentaje = Number(values.multa245bisPorcentaje) || 50;
		rubros[`Multa Art. 245 bis Ley 27.742 (${porcentaje}%)`] = red(p.indemnizacion * (porcentaje / 100));
	}
	if (multaLE === 1) {
		rubros["Multa Art. 8 Ley 24.013"] = multaArt8Ley24013(values.fechaIngreso, values.fechaEgreso, p.remuneracion);
	} else if (multaLE === 2 && values.fechaFalsa) {
		rubros["Multa Art. 9 Ley 24.013"] = multaArt9Ley24013(values.fechaIngreso, values.fechaFalsa, p.remuneracion);
	} else if (multaLE === 3) {
		rubros["Multa Art. 10 Ley 24.013"] = multaArt10Ley24013(
			values.fechaDeficiente || values.fechaIngreso,
			values.fechaEgreso,
			p.remuneracion,
			importe(values.salarioFalso),
		);
	}
	return { rubros, avisos: avisosMultas({ fechaEgreso: values.fechaEgreso, multas, multaLE }) };
}

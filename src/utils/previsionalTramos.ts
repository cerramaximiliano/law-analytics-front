import { FilaRetroactivo, RetroactivoResultado, TIPO_PAGO_LABELS, TipoPago, TramoRetroactivo } from "services/previsionalService";

// Arma la presentación "por tramos" del retroactivo previsional con pagos a cuenta, como la hacen los
// liquidadores (formato BlueCorp): la tabla mensual se corta en el mes de cada pago y debajo de cada tramo
// va un cuadro "Detalle" (Capital · Intereses · Total) cuyo último "Saldo al <cierre>" ES el resultado final.
// Lo comparten la vista del resultado, el detalle de los guardados y el PDF. Sin pagos no hay tramos.

export interface FilaDetalleTramo {
	label: string;
	/** `null` = la celda va vacía ("—"). */
	capital: number | null;
	intereses: number;
	total: number;
	negativo?: boolean;
	negrita?: boolean;
}

export interface PagoBloque {
	/** YYYY-MM-DD */
	fecha: string;
	tipo: TipoPago | null;
	/** Texto legible del tipo ("Pago administrativo (ANSES)"); "Pago a cuenta" si no se conoce. */
	label: string;
	importe: number;
	imputadoInteres: number;
	imputadoCapital: number;
	/** saldoCapital + saldoInteres que quedó después del pago. */
	saldoLuego: number;
}

export interface TramoBloque {
	/** 0-based */
	indice: number;
	/** YYYY-MM del primer mes del tramo */
	desde: string;
	/** YYYY-MM-DD: fin de mes del pago o la fecha de cierre */
	hasta: string;
	filas: FilaRetroactivo[];
	corte: { pago?: PagoBloque };
	detalle: FilaDetalleTramo[];
}

export interface RemanenteBloque {
	saldoLuego: number;
	interesesPosteriores: number;
	actualizado: number;
	/** YYYY-MM-DD de la fecha de cierre */
	hasta: string;
}

export interface BloquesTramos {
	tramos: TramoBloque[];
	pagos: PagoBloque[];
	remanente?: RemanenteBloque;
}

export const PAGO_LABEL_GENERICO = "Pago a cuenta";

/** ISO (YYYY-MM-DD) → DD/MM/AAAA. */
export const fechaCorta = (f?: string | null) =>
	f && /^\d{4}-\d{2}-\d{2}/.test(f) ? `${f.slice(8, 10)}/${f.slice(5, 7)}/${f.slice(0, 4)}` : f || "—";
/** YYYY-MM → MM/AAAA. */
export const mesCorto = (p?: string | null) => (p && /^\d{4}-\d{2}/.test(p) ? `${p.slice(5, 7)}/${p.slice(0, 4)}` : p || "—");

const red = (n: number) => Math.round(n * 100) / 100;
const n0 = (v: number | null | undefined) => (typeof v === "number" && Number.isFinite(v) ? v : 0);

export const labelTipoPago = (tipo?: TipoPago | string | null) =>
	tipo && tipo in TIPO_PAGO_LABELS ? TIPO_PAGO_LABELS[tipo as TipoPago] : PAGO_LABEL_GENERICO;

/** Pago que corta el tramo `k`: fecha/tipo del tramo si el hub los mandó; si no, el pago `k` por índice. */
function pagoDeTramo(t: TramoRetroactivo, k: number, pagos: RetroactivoResultado["pagos"]): PagoBloque | undefined {
	if (!t.pago) return undefined;
	const p = pagos[k];
	const fecha = t.pagoFecha || p?.fecha || t.hasta;
	const tipo = (t.pagoTipo || p?.tipo || null) as TipoPago | null;
	return {
		fecha,
		tipo,
		label: labelTipoPago(tipo),
		importe: t.pago,
		imputadoInteres: n0(t.imputadoInteres),
		imputadoCapital: n0(t.imputadoCapital),
		saldoLuego: red(n0(t.saldoCapital) + n0(t.saldoInteres)),
	};
}

/**
 * Bloques por tramo a partir del resultado del motor. Devuelve `tramos: []` si el cálculo no tiene pagos.
 * Un último tramo vacío (pago en el mes del cierre: sin meses, sin capital ni intereses) se omite porque el
 * cuadro del tramo anterior ya es el saldo final.
 */
export function armarBloquesTramos(
	resultado: Pick<RetroactivoResultado, "filas" | "pagos" | "tramos" | "consolidacion" | "capitalizarInteresImpago">,
): BloquesTramos {
	const tramosMotor = resultado.tramos || [];
	const pagosMotor = resultado.pagos || [];
	if (!tramosMotor.length || !pagosMotor.length) return { tramos: [], pagos: [] };

	const filasPorTramo = new Map<number, FilaRetroactivo[]>();
	for (const f of resultado.filas || []) {
		const k = n0(f.tramo);
		if (!filasPorTramo.has(k)) filasPorTramo.set(k, []);
		filasPorTramo.get(k)!.push(f);
	}

	const tramos: TramoBloque[] = [];
	const pagos: PagoBloque[] = [];
	let saldoCapitalAnterior = 0;
	let saldoInteresAnterior = 0;
	let corteAnterior: string | null = null;

	tramosMotor.forEach((t, i) => {
		const filas = filasPorTramo.get(i) || [];
		const pago = pagoDeTramo(t, pagos.length, pagosMotor);
		const esUltimo = i === tramosMotor.length - 1;
		const capitalTramo = n0(t.capitalTramo);
		const interesTramo = n0(t.interesTramo);
		const interesSobreSaldo = n0(t.interesSobreSaldo);

		if (esUltimo && !pago && !filas.length && !capitalTramo && !interesTramo && !interesSobreSaldo) return;

		const detalle: FilaDetalleTramo[] = [
			{ label: "Adeudado del período", capital: capitalTramo, intereses: interesTramo, total: red(capitalTramo + interesTramo) },
		];
		if (corteAnterior) {
			detalle.push({
				label: `Saldo al ${fechaCorta(corteAnterior)}`,
				capital: saldoCapitalAnterior,
				intereses: saldoInteresAnterior,
				total: red(saldoCapitalAnterior + saldoInteresAnterior),
			});
			detalle.push({
				label: `Intereses sobre el saldo${resultado.capitalizarInteresImpago === false ? " de capital" : ""} del ${fechaCorta(
					corteAnterior,
				)} al ${fechaCorta(t.hasta)}`,
				capital: null,
				intereses: interesSobreSaldo,
				total: interesSobreSaldo,
			});
		}

		let saldoCapital: number;
		let saldoInteres: number;
		if (pago) {
			detalle.push({
				label: `Pago del ${fechaCorta(pago.fecha)} · ${pago.label}`,
				capital: -pago.imputadoCapital,
				intereses: -pago.imputadoInteres,
				total: -pago.importe,
				negativo: true,
			});
			saldoCapital = n0(t.saldoCapital);
			saldoInteres = n0(t.saldoInteres);
			pagos.push(pago);
		} else {
			saldoCapital = red(saldoCapitalAnterior + capitalTramo);
			saldoInteres = red(saldoInteresAnterior + interesTramo + interesSobreSaldo);
		}
		detalle.push({
			label: `Saldo al ${fechaCorta(t.hasta)}`,
			capital: saldoCapital,
			intereses: saldoInteres,
			total: red(saldoCapital + saldoInteres),
			negrita: true,
		});

		tramos.push({
			indice: i,
			desde: filas.length ? filas[0].periodo : (corteAnterior || t.hasta).slice(0, 7),
			hasta: t.hasta,
			filas,
			corte: pago ? { pago } : {},
			detalle,
		});

		saldoCapitalAnterior = saldoCapital;
		saldoInteresAnterior = saldoInteres;
		corteAnterior = t.hasta;
	});

	// Remanente del último pago: su saldo siguió devengando (como capital) en los tramos posteriores
	const ultimoConPago = tramos.map((t) => !!t.corte.pago).lastIndexOf(true);
	let remanente: RemanenteBloque | undefined;
	if (ultimoConPago >= 0 && ultimoConPago < tramos.length - 1) {
		const saldoLuego = tramos[ultimoConPago].corte.pago!.saldoLuego;
		const interesesPosteriores = red(
			tramosMotor.slice(tramos[ultimoConPago].indice + 1).reduce((acc, t) => acc + n0(t.interesSobreSaldo), 0),
		);
		remanente = {
			saldoLuego,
			interesesPosteriores,
			actualizado: red(saldoLuego + interesesPosteriores),
			hasta: tramos[tramos.length - 1].hasta || resultado.consolidacion,
		};
	}

	return { tramos, pagos, remanente };
}

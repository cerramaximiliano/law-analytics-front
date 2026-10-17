import axios from "utils/axios";
import dayjs from "dayjs";
import customParseFormat from "dayjs/plugin/customParseFormat";

dayjs.extend(customParseFormat);

// Cliente del retroactivo previsional del hub (POST /api/previsional/retroactivo/calcular,
// law-analytics-server/services/previsionalService.js).

export interface CriterioMovilidad {
	indiceMovilidad: string;
	fechaDesde: string;
}

/** Tipo descriptivo del pago a cuenta: no cambia la imputación, sólo cómo se muestra en el resultado y el PDF. */
export type TipoPago = "administrativo" | "embargo" | "deposito_judicial" | "otro";

export const TIPO_PAGO_LABELS: Record<TipoPago, string> = {
	administrativo: "Pago administrativo (ANSES)",
	embargo: "Transferencia por embargo",
	deposito_judicial: "Depósito judicial",
	otro: "Otro pago",
};

export const TIPOS_PAGO: { value: TipoPago; label: string }[] = (Object.keys(TIPO_PAGO_LABELS) as TipoPago[]).map((value) => ({
	value,
	label: TIPO_PAGO_LABELS[value],
}));

export interface PagoACuenta {
	fecha: string;
	importe: number | string;
	tipo?: TipoPago;
}

export type PisoPercibido = "no" | "minimo" | "minimo82";
export type TipoTope = "no" | "si" | "actis_caporale_menor_15" | "actis_caporale_menor_15_sino_descuenta";

export const PISOS_PERCIBIDO: { value: PisoPercibido; label: string }[] = [
	{ value: "no", label: "No: cobra el haber informado con sus aumentos" },
	{ value: "minimo", label: "Cobra al menos el haber mínimo" },
	{ value: "minimo82", label: "Cobra al menos el haber mínimo y el suplemento al 82 % del SMVM (ley 27.426, 30 años de aportes)" },
];

export type OpcionBono = "no" | "percibido" | "reclamado" | "ambos";
export type TratamientoBono = "decreto" | "integrado";

export const OPCIONES_BONO: { value: OpcionBono; label: string }[] = [
	{ value: "no", label: "No contabilizar" },
	{ value: "percibido", label: "Sobre el haber percibido" },
	{ value: "ambos", label: "Sobre el percibido y el reclamado" },
	{ value: "reclamado", label: "Sobre el haber reclamado" },
];

export const TRATAMIENTOS_BONO: { value: TratamientoBono; label: string }[] = [
	{ value: "decreto", label: "Aparte, sin SAC ni obra social (como dicen los decretos)" },
	{ value: "integrado", label: "Integrado a la diferencia, con SAC y obra social" },
];

export interface RetroactivoInput {
	desde: string;
	/** Por defecto true: el interés impago tras un pago devenga intereses (art. 770 inc. c CCyC). */
	capitalizarInteresImpago?: boolean;
	hasta?: string;
	consolidacion: string;
	percibido: {
		importe: number;
		fecha: string;
		reajuste?: { fecha: string; importe: number } | null;
		reajustes?: { fecha: string; importe: number; descuentoPct?: number }[];
		piso?: PisoPercibido;
	};
	reclamado: {
		importe: number;
		fecha: string;
		criterios: CriterioMovilidad[];
		pension?: { fecha: string; porcentaje: number } | null;
	};
	zonaAustral?: boolean;
	tope?: { tipo: TipoTope; evaluacion?: "cadaPeriodo" | "haberActual"; porcentaje?: number | null; desde?: string; hasta?: string };
	sac?: boolean;
	obraSocialPct?: number;
	tasa?: string;
	pagos?: { fecha: string; importe: number; tipo?: TipoPago }[];
	bono?: "no" | { percibido: boolean; reclamado: boolean; tratamiento: TratamientoBono };
}

export interface FilaRetroactivo {
	periodo: string;
	percibido: number;
	reclamado: number;
	diferencia: number;
	haberMaximo: number | null;
	quitaTope: number;
	diferenciaMenosTope: number;
	sac: number;
	obraSocial: number;
	capital: number;
	interes: number;
	tramo: number;
	coefPercibido?: number;
	coefReclamado?: number;
	bonoPercibido?: number;
	bonoReclamado?: number;
	diferenciaBono?: number;
}

/** Tramo de la liquidación (se corta en el mes de cada pago). El último no tiene pago ni saldos. */
export interface TramoRetroactivo {
	hasta: string;
	capitalTramo: number;
	interesTramo: number;
	interesSobreSaldo: number;
	pago?: number;
	/** Fecha y tipo del pago que corta el tramo (el hub los manda desde 10/2026; los guardados viejos no los traen). */
	pagoFecha?: string;
	pagoTipo?: TipoPago | null;
	imputadoInteres?: number;
	imputadoCapital?: number;
	saldoCapital?: number;
	saldoInteres?: number;
}

export interface RetroactivoResultado {
	success: boolean;
	capitalizarInteresImpago?: boolean;
	desde: string;
	consolidacion: string;
	tasa: { tipo: string; descripcion?: string; metodo: string };
	bono?: { percibido: boolean; reclamado: boolean; tratamiento: TratamientoBono };
	filas: FilaRetroactivo[];
	pagos: { fecha: string; importe: number; tipo?: TipoPago; detalle?: string }[];
	tramos: TramoRetroactivo[];
	totales: { capital: number; intereses: number; total: number; pagado: number; saldo: number };
	haberReajustado: { periodo: string; reclamado: number; percibido: number };
	avisos: string[];
}

/** DD/MM/YYYY (o MM/YYYY) → YYYY-MM-DD; deja pasar fechas ya ISO. */
export function aISO(fecha?: string | null): string {
	if (!fecha) return "";
	if (/^\d{4}-\d{2}-\d{2}/.test(fecha)) return fecha.slice(0, 10);
	const d = dayjs(fecha, ["DD/MM/YYYY", "MM/YYYY"], true);
	return d.isValid() ? d.format("YYYY-MM-DD") : "";
}

const numero = (v: unknown) => (v === "" || v === null || v === undefined ? NaN : Number(v));

/** Reajustes administrativos del percibido: el primero del formulario y los adicionales, por fecha. */
function reajustesDe(values: any) {
	const pct = (v: unknown) => (Number.isFinite(numero(v)) && numero(v) > 0 ? numero(v) : 0);
	return [
		{ fecha: values.fechaAltaReajuste, importe: values.importeReajuste, descuentoPct: values.descuentoReajuste },
		...(values.reajustesAdicionales || []),
	]
		.filter((r: any) => r && r.fecha && Number(r.importe) > 0)
		.map((r: any) => ({ fecha: aISO(r.fecha), importe: Number(r.importe), descuentoPct: pct(r.descuentoPct) }))
		.sort((a, b) => (a.fecha < b.fecha ? -1 : 1));
}

/** Arma el input del motor a partir de los valores del wizard. */
export function armarInputRetroactivo(values: any): RetroactivoInput {
	const fechaPercibido = aISO(values.haberPagadoAl);
	const pct = numero(values.pensionPorcentaje);
	const topePct = numero(values.topePorcentaje);
	return {
		desde: aISO(values.fechaDesdeReclamado),
		hasta: aISO(values.fechaHastaReclamado) || undefined,
		consolidacion: aISO(values.fechaCierre || values.fechaHastaReclamado),
		percibido: {
			importe: Number(values.haberPagadoAnses),
			fecha: fechaPercibido,
			reajustes: values.tieneReajuste ? reajustesDe(values) : [],
			piso: values.pisoPercibido || "no",
		},
		reclamado: {
			importe: Number(values.haberReclamado),
			fecha: aISO(values.haberReclamadoAl) || fechaPercibido,
			criterios: (values.criteriosMovilidad || [])
				.filter((c: CriterioMovilidad) => c && c.indiceMovilidad && c.fechaDesde)
				.map((c: CriterioMovilidad) => ({ indiceMovilidad: c.indiceMovilidad, fechaDesde: aISO(c.fechaDesde) })),
			pension: values.pensionFecha && pct > 0 ? { fecha: aISO(values.pensionFecha), porcentaje: pct } : null,
		},
		zonaAustral: !!values.zonaAustral,
		tope: {
			tipo: values.tipoTope || "no",
			evaluacion: values.topeEvaluacion || "cadaPeriodo",
			porcentaje: Number.isFinite(topePct) && topePct > 0 ? topePct : null,
			desde: aISO(values.topeDesde) || undefined,
			hasta: aISO(values.topeHasta) || undefined,
		},
		sac: values.sac !== false,
		obraSocialPct: values.obraSocial === "inssjyp_pami" ? 6 : 0,
		tasa: values.tasaInteresSentencia || "tasaPasivaBCRA",
		pagos: (values.pagosACuenta || [])
			.filter((p: PagoACuenta) => p && p.fecha && Number(p.importe) > 0)
			.map((p: PagoACuenta) => ({ fecha: aISO(p.fecha), importe: Number(p.importe), tipo: p.tipo || "administrativo" })),
		capitalizarInteresImpago: values.capitalizarInteresImpago !== false,
		bono:
			values.bono && values.bono !== "no"
				? {
						percibido: values.bono === "percibido" || values.bono === "ambos",
						reclamado: values.bono === "reclamado" || values.bono === "ambos",
						tratamiento: values.bonoTratamiento === "integrado" ? "integrado" : "decreto",
				  }
				: "no",
	};
}

export async function calcularRetroactivo(input: RetroactivoInput): Promise<RetroactivoResultado> {
	const { data } = await axios.post("/api/previsional/retroactivo/calcular", input);
	return data;
}

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

export interface PagoACuenta {
	fecha: string;
	importe: number | string;
}

export type PisoPercibido = "no" | "minimo" | "minimo82";
export type TipoTope = "no" | "si" | "actis_caporale_menor_15" | "actis_caporale_menor_15_sino_descuenta";

export const PISOS_PERCIBIDO: { value: PisoPercibido; label: string }[] = [
	{ value: "no", label: "No: cobra el haber informado con sus aumentos" },
	{ value: "minimo", label: "Cobra al menos el haber mínimo" },
	{ value: "minimo82", label: "Cobra al menos el haber mínimo y el suplemento al 82 % del SMVM (ley 27.426, 30 años de aportes)" },
];

export interface RetroactivoInput {
	desde: string;
	hasta?: string;
	consolidacion: string;
	percibido: {
		importe: number;
		fecha: string;
		reajuste?: { fecha: string; importe: number } | null;
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
	pagos?: { fecha: string; importe: number }[];
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
}

export interface RetroactivoResultado {
	success: boolean;
	desde: string;
	consolidacion: string;
	tasa: { tipo: string; descripcion?: string; metodo: string };
	filas: FilaRetroactivo[];
	pagos: { fecha: string; importe: number }[];
	tramos: {
		hasta: string;
		capitalTramo: number;
		interesTramo: number;
		interesSobreSaldo: number;
		pago?: number;
		imputadoInteres?: number;
		imputadoCapital?: number;
		saldoCapital?: number;
		saldoInteres?: number;
	}[];
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
			reajuste:
				values.tieneReajuste && values.fechaAltaReajuste
					? { fecha: aISO(values.fechaAltaReajuste), importe: Number(values.importeReajuste) }
					: null,
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
			.map((p: PagoACuenta) => ({ fecha: aISO(p.fecha), importe: Number(p.importe) })),
	};
}

export async function calcularRetroactivo(input: RetroactivoInput): Promise<RetroactivoResultado> {
	const { data } = await axios.post("/api/previsional/retroactivo/calcular", input);
	return data;
}

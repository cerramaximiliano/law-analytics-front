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

/** Piso del haber mínimo (percibido y reclamado). "no" solo aparece en guardados anteriores al 20/10/2026: vale como "minimo". */
export type PisoPercibido = "no" | "minimo" | "minimo82" | "sinGarantia";
export type TipoTope = "no" | "si" | "actis_caporale_menor_15" | "actis_caporale_menor_15_sino_descuenta";

export const PISOS_PERCIBIDO: { value: PisoPercibido; label: string }[] = [
	{ value: "minimo", label: "Cobra al menos el haber mínimo" },
	{ value: "minimo82", label: "Cobra al menos el haber mínimo y el suplemento al 82 % del SMVM (ley 27.426, 30 años de aportes)" },
	{ value: "sinGarantia", label: "Sin garantía del mínimo: el haber informado con sus aumentos, aunque quede por debajo" },
];

/** Igual que pisoDe() del motor: el piso del mínimo se aplica solo salvo "minimo82" o "sinGarantia". */
export const pisoNormalizado = (piso?: string): PisoPercibido => (piso === "minimo82" || piso === "sinGarantia" ? piso : "minimo");

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

/** Moneda del haber inicial (el motor la pasa a pesos con los divisores del haber de caja). "ARS" = pesos. */
export const MONEDAS_HABER = [
	{ value: "ARS", label: "Pesos (desde 1/1992)" },
	{ value: "australes", label: "Australes (6/1985 a 12/1991)" },
	{ value: "pesosArgentinos", label: "Pesos argentinos (6/1983 a 5/1985)" },
	{ value: "pesosLey", label: "Pesos ley 18.188 (1/1970 a 5/1983)" },
];
const monedaMotor = (m?: string) => (m && m !== "ARS" ? m : undefined);
const NOMBRE_MONEDA: Record<string, string> = { australes: "australes", pesosArgentinos: "pesos argentinos", pesosLey: "pesos ley" };
/** Importe del haber inicial con su moneda: "$ 1.000,00" o "4.880.140,21 australes". */
export function importeHaber(h: { importe: number; moneda?: string }, money: (n: number) => string): string {
	const nombre = h.moneda && NOMBRE_MONEDA[h.moneda];
	return nombre
		? `${new Intl.NumberFormat("es-AR", { minimumFractionDigits: 2, maximumFractionDigits: 2 }).format(h.importe)} ${nombre}`
		: money(h.importe);
}

/** Haber percibido cargado a mano para un mes (periodo "YYYY-MM"). */
export interface PercibidoMensual {
	periodo: string;
	importe: number;
}

export const AVISO_PERCIBIDO_MANUAL_SIN_ACTUALIZACION =
	"Los haberes percibidos se cargaron a mano: la actualización automática no está disponible porque no hay percibidos para los meses nuevos.";

/** Meses ("YYYY-MM") del período de diferencias: desde el inicio hasta el fin del reclamo (o el cierre, si es anterior). */
export function mesesDelPeriodo(values: any): string[] {
	const desde = dayjs(values.fechaDesdeReclamado, "DD/MM/YYYY", true);
	const fin = [values.fechaHastaReclamado, values.fechaCierre]
		.map((v) => dayjs(v, "DD/MM/YYYY", true))
		.filter((d) => d.isValid())
		.sort((a, b) => a.valueOf() - b.valueOf())[0];
	if (!desde.isValid() || !fin || fin.isBefore(desde, "month")) return [];
	const out: string[] = [];
	for (let m = desde.startOf("month"); !m.isAfter(fin, "month") && out.length < 1200; m = m.add(1, "month")) out.push(m.format("YYYY-MM"));
	return out;
}

/** Meses del período sin un percibido mayor a 0 cargado. */
export function mesesSinPercibido(values: any): string[] {
	const cargados = new Set(
		(values.percibidosMensuales || []).filter((x: any) => x && Number(x.importe) > 0).map((x: PercibidoMensual) => x.periodo),
	);
	return mesesDelPeriodo(values).filter((p) => !cargados.has(p));
}

/** Descripción del percibido cargado a mano para el resultado y el PDF; null si no es manual. */
export function descripcionPercibidoManual(percibido: RetroactivoInput["percibido"] | undefined): string | null {
	if (!percibido || percibido.modo !== "manual") return null;
	const l = percibido.manual || [];
	const mes = (p?: string) => (p ? `${p.slice(5)}/${p.slice(0, 4)}` : "");
	return `Cargado por el usuario mes a mes (${l.length} ${l.length === 1 ? "mes" : "meses"}${
		l.length ? `, ${mes(l[0].periodo)} a ${mes(l[l.length - 1].periodo)}` : ""
	}), sin movilidad`;
}

export interface RetroactivoInput {
	desde: string;
	/** Por defecto true: el interés impago tras un pago devenga intereses (art. 770 inc. c CCyC). */
	capitalizarInteresImpago?: boolean;
	hasta?: string;
	consolidacion: string;
	percibido: {
		importe: number;
		fecha: string;
		moneda?: string;
		reajuste?: { fecha: string; importe: number } | null;
		reajustes?: { fecha: string; importe: number; descuentoPct?: number }[];
		piso?: PisoPercibido;
		/** "manual": el percibido es exactamente `manual` (un importe por mes de todo el período). */
		modo?: "manual";
		manual?: PercibidoMensual[];
	};
	reclamado: {
		importe: number;
		fecha: string;
		moneda?: string;
		criterios: CriterioMovilidad[];
		pension?: { fecha: string; porcentaje: number } | null;
		piso?: PisoPercibido;
	};
	zonaAustral?: boolean;
	tope?: {
		tipo: TipoTope;
		evaluacion?: "cadaPeriodo" | "haberActual";
		porcentaje?: number | null;
		desde?: string;
		hasta?: string;
		/** Haber máximo movido con Badaro (ISAL hasta 12/2006 y después el porcentaje de la movilidad) desde esa fecha. */
		maximoBadaro?: { desde: string } | null;
	};
	sac?: boolean;
	obraSocialPct?: number;
	tasa?: string;
	pagos?: { fecha: string; importe: number; tipo?: TipoPago }[];
	bono?: "no" | { percibido: boolean; reclamado: boolean; tratamiento: TratamientoBono };
	/** Tope con el salario del activo (CSJN "Villanustre"): el haber computado no supera el porcentaje del salario. */
	villanustre?: VillanustreInput | null;
}

export interface VillanustreInput {
	porcentaje: number;
	/** Cada salario rige desde su mes hasta el siguiente. */
	salarios: { fecha: string; importe: number }[];
	/** Circular 70/14: los meses sin salario cargado mueven el último con la variación del SMVM. */
	pautaSalarial?: boolean;
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
	salarioActividad?: number;
	limiteVillanustre?: number;
	quitaVillanustre?: number;
	pautaSalarial?: boolean;
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
	villanustre?: VillanustreInput | null;
	filas: FilaRetroactivo[];
	pagos: { fecha: string; importe: number; tipo?: TipoPago; detalle?: string }[];
	tramos: TramoRetroactivo[];
	totales: { capital: number; intereses: number; total: number; pagado: number; saldo: number };
	haberReajustado: { periodo: string; reclamado: number; percibido: number };
	/** El percibido salió de la grilla cargada a mano (sin movilidad). */
	percibidoManual?: boolean;
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

/** Solo los meses del período, en orden: lo cargado fuera del período no se manda. */
function percibidosDelPeriodo(values: any): PercibidoMensual[] {
	const m = new Map<string, number>(
		(values.percibidosMensuales || [])
			.filter((x: any) => x && x.periodo && Number(x.importe) > 0)
			.map((x: any) => [x.periodo, Number(x.importe)] as [string, number]),
	);
	return mesesDelPeriodo(values)
		.filter((p) => m.has(p))
		.map((periodo) => ({ periodo, importe: m.get(periodo) as number }));
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
		percibido: values.percibidoManual
			? {
					importe: Number(values.haberPagadoAnses),
					fecha: fechaPercibido,
					modo: "manual",
					manual: percibidosDelPeriodo(values),
			  }
			: {
					importe: Number(values.haberPagadoAnses),
					fecha: fechaPercibido,
					moneda: monedaMotor(values.monedaHaberPagado),
					reajustes: values.tieneReajuste ? reajustesDe(values) : [],
					piso: pisoNormalizado(values.pisoPercibido),
			  },
		reclamado: {
			importe: Number(values.haberReclamado),
			fecha: aISO(values.haberReclamadoAl) || fechaPercibido,
			moneda: monedaMotor(values.monedaReclamado),
			criterios: (values.criteriosMovilidad || [])
				.filter((c: CriterioMovilidad) => c && c.indiceMovilidad && c.fechaDesde)
				.map((c: CriterioMovilidad) => ({ indiceMovilidad: c.indiceMovilidad, fechaDesde: aISO(c.fechaDesde) })),
			pension: values.pensionFecha && pct > 0 ? { fecha: aISO(values.pensionFecha), porcentaje: pct } : null,
			piso: pisoNormalizado(values.pisoReclamado),
		},
		zonaAustral: !!values.zonaAustral,
		tope: {
			tipo: values.tipoTope || "no",
			evaluacion: values.topeEvaluacion || "cadaPeriodo",
			porcentaje: Number.isFinite(topePct) && topePct > 0 ? topePct : null,
			desde: aISO(values.topeDesde) || undefined,
			hasta: aISO(values.topeHasta) || undefined,
			maximoBadaro:
				values.tipoTope && values.tipoTope !== "no" && values.topeMaximoBadaro
					? { desde: aISO(values.topeMaximoBadaroDesde) || "2002-01-01" }
					: null,
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
		villanustre: villanustreDe(values),
	};
}

function villanustreDe(values: any): VillanustreInput | null {
	if (!values.villanustre) return null;
	const salarios = (values.villanustreSalarios || [])
		.filter((x: any) => x && x.fecha && Number(x.importe) > 0)
		.map((x: any) => ({ fecha: aISO(x.fecha), importe: Number(x.importe) }));
	if (!salarios.length) return null;
	const pct = numero(values.villanustrePorcentaje);
	return { porcentaje: Number.isFinite(pct) && pct > 0 ? pct : 70, salarios, pautaSalarial: !!values.villanustrePauta };
}

/**
 * Grilla sugerida para cargar los percibidos a mano: el haber percibido que calcula el motor (aumentos generales,
 * reajustes y piso) para cada mes del período de diferencias.
 */
export async function seriePercibidoSugerida(values: any): Promise<PercibidoMensual[]> {
	const input = armarInputRetroactivo({ ...values, percibidoManual: false });
	const { data } = await axios.post("/api/previsional/retroactivo/serie-percibido", {
		desde: input.desde,
		hasta: input.hasta,
		consolidacion: input.consolidacion,
		zonaAustral: input.zonaAustral,
		percibido: input.percibido,
		pension: input.reclamado.pension,
	});
	return data.serie || [];
}

export async function calcularRetroactivo(input: RetroactivoInput): Promise<RetroactivoResultado> {
	const { data } = await axios.post("/api/previsional/retroactivo/calcular", input);
	return data;
}

/**
 * Registra en el hub que el usuario chocó con el aviso de plan del retroactivo (alimenta
 * `customFields.retroactivoBloqueadoAt/Count` del contacto de marketing). Falla en silencio:
 * la medición nunca debe romper la UI.
 */
export async function registrarRetroactivoBloqueado(): Promise<void> {
	try {
		await axios.post("/api/previsional/retroactivo/bloqueado");
	} catch {
		// sin efecto en la UI
	}
}

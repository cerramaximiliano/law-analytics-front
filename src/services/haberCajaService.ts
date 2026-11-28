// Haber de caja (haber inicial de la Ley 24.241: PBU + PC + PAP). El cálculo lo hace el hub
// (law-analytics-server/services/haberCajaService.js, `calcularHaberCaja`); acá van los tipos de la
// entrada y la salida que usa la pantalla, la llamada a la ruta de usuario y las utilidades de carga.
import axios from "utils/axios";

/** Tiempo de servicios en años, meses y días. */
export interface TiempoAMD {
	a?: number;
	m?: number;
	d?: number;
}

/** Servicios de una clase, antes y después de 7/1994. */
export interface TramoServicios {
	antes?: TiempoAMD;
	despues?: TiempoAMD;
}

/** Prestaciones que recibe el motor. */
export type PrestacionHaberCaja = "jubilacion" | "pension" | "edadAvanzada" | "retiroInvalidez";
/**
 * Prestaciones del selector de la pantalla (la lista del cálculo de haber de BlueCorp). «anticipada» viaja al motor como
 * jubilación con la reducción de la anticipada; las tres últimas se muestran deshabilitadas.
 */
export type PrestacionSelector = PrestacionHaberCaja | "anticipada" | "baseJubilatoria" | "rentaVitalicia" | "retiroProgramado";

export interface PrestacionCatalogo {
	clave: PrestacionSelector;
	etiqueta: string;
	habilitada: boolean;
	/** Texto corto: por qué está deshabilitada o cómo se calcula. */
	leyenda?: string;
	/** Admite la pregunta «¿Es pensión derivada?» sobre esta prestación (la del causante). */
	pensionDerivada?: boolean;
}

/** Respaldo del selector si el catálogo no trae la lista (hub anterior): la misma que publica el hub. */
export const PRESTACIONES_SELECTOR: PrestacionCatalogo[] = [
	{ clave: "jubilacion", etiqueta: "Jubilación ordinaria (PBU, PC y PAP)", habilitada: true, pensionDerivada: true },
	{ clave: "pension", etiqueta: "Pensión por fallecimiento del afiliado (directa)", habilitada: true },
	{ clave: "retiroInvalidez", etiqueta: "Retiro por invalidez", habilitada: true },
	{ clave: "edadAvanzada", etiqueta: "Edad avanzada", habilitada: true, pensionDerivada: true },
	{ clave: "anticipada", etiqueta: "Prestación anticipada por desempleo", habilitada: true, pensionDerivada: true },
	{ clave: "baseJubilatoria", etiqueta: "Base jubilatoria", habilitada: false, leyenda: "Todavía no disponible" },
	{
		clave: "rentaVitalicia",
		etiqueta: "Renta vitalicia previsional",
		habilitada: false,
		leyenda: "Régimen de capitalización: todavía no se calcula",
	},
	{
		clave: "retiroProgramado",
		etiqueta: "Retiro programado",
		habilitada: false,
		leyenda: "Régimen de capitalización: todavía no se calcula",
	},
];

/** Lista del selector: la del catálogo del hub o el respaldo. */
export const prestacionesDelCatalogo = (catalogo?: { prestacionesCatalogo?: PrestacionCatalogo[] } | null): PrestacionCatalogo[] =>
	catalogo?.prestacionesCatalogo?.length ? catalogo.prestacionesCatalogo : PRESTACIONES_SELECTOR;

/** Nombre legible de la prestación del selector (o de la que recibe el motor). */
export const etiquetaPrestacion = (clave?: string | null, catalogo?: { prestacionesCatalogo?: PrestacionCatalogo[] } | null): string =>
	prestacionesDelCatalogo(catalogo).find((p) => p.clave === clave)?.etiqueta || clave || "-";

/** Perfiles de convenciones que acepta la ruta de usuario (cualquier otro cae en `ansesPrpa`). */
export type ProgramaHaberCaja = "ansesPrpa" | "bluecorp";

export interface RemuneracionEntrada {
	/** AAAA-MM */
	periodo: string;
	importe: number;
	/** Clave de moneda del motor. Sin moneda, el hub le pone la de curso legal del período. */
	moneda?: string;
	/** Último mes de un renglón de varios meses (AAAA-MM): el importe es el total del renglón. */
	hasta?: string;
	/** La puso el hub por el período (no la eligió el usuario). */
	monedaAutomatica?: boolean;
}

export interface PeriodoAutonomo {
	/** AAAA-MM */
	desde: string;
	hasta: string;
	/** Código de categoría del catálogo (A, B', Cat.I, MONOTRI, código AFIP…). */
	categoria: string;
}

/** Criterio para quitar los meses que exceden los 35 años de la PC (Dec. 679/95 regl. art. 24 ap. 5.d). */
export type Excedente35 = "menosFavorable" | "autonomos" | "dependencia" | "ninguno";

/** Entrada de `calcularHaberCaja` (los campos que carga la pantalla; ver el JSDoc del motor en el hub). */
export interface HaberCajaInput {
	programa?: ProgramaHaberCaja;
	prestacion: PrestacionHaberCaja;
	porcentajePension?: number;
	/** Prestación anticipada: true (porcentaje según la fecha) o el porcentaje. */
	anticipada?: boolean | { porcentaje: number };
	/** Pensión derivada sobre la prestación del causante: mes del fallecimiento (AAAA-MM-DD) y porcentaje. */
	pensionDerivada?: { fallecimiento: string; porcentaje: number };
	/** Retiro por invalidez: aportante regular (70 % del ingreso base) o irregular con derecho (50 %). */
	tipoAfiliado?: "regular" | "irregular";
	/** Años de servicios para la bonificación de la PBU (30 más los excedentes, hasta 45). Sin el campo, los calcula el motor. */
	aniosPBU?: number;
	/** Fechas en AAAA-MM-DD. */
	fechas: { fad: string; cese?: string; solicitud?: string; alta?: string; acuerdo?: string };
	/** «Período Dde/Hasta» del promedio: solo esas remuneraciones entran en la sumatoria. */
	periodoPromedio?: { desde: string; hasta: string };
	/** n = relación de dependencia, m = autónomos, p = simultáneos. */
	servicios: { n?: TramoServicios; m?: TramoServicios; p?: TramoServicios };
	remuneraciones: RemuneracionEntrada[];
	/** `equivalencia: false` = computar la categoría efectivamente aportada, sin la equiparación del Dec. 1361/80. */
	autonomo?: { periodos: PeriodoAutonomo[]; equivalencia?: boolean };
	zonaAustral?: boolean;
	/** Porcentaje a cargo de ANSES por convenio de reciprocidad. */
	prorrataReciprocidad?: number;
	reciprocidadAlcance?: "pbu" | "todas";
	excedente35?: Excedente35;
	mesActualizacion?: "cesacion" | "acuerdo";
	/** false = sin el tope del art. 9 sobre la remuneración del mes. */
	topeArt9?: boolean;
	/** false = sin el tope del máximo a la cesación sobre la remuneración actualizada. */
	topeArt14?: boolean;
	divisorW?: 120 | "meses";
	aplicarMaximo?: boolean;
	aplicarMinimo?: boolean;
}

export interface FilaRemuneracion {
	periodo: string;
	importe: number;
	/** Importe topeado por el máximo imponible del mes (art. 9), si se superó. */
	topeArt9: number | null;
	actualizada: number;
	/** Remuneración actualizada topeada al cese (art. 14), si se superó. */
	topeArt14: number | null;
	topeSimultaneo: number | null;
}

export interface FilaRenta {
	desde: string;
	hasta: string;
	categoria: string;
	/** Clave de la renta con que el motor computó la categoría. */
	categoriaComputable: string | null;
	meses: number;
	renta: number;
	mesesReducidos?: number;
}

/** Salida de `calcularHaberCaja` (los campos que muestra la pantalla; el motor devuelve más). */
export interface HaberCajaResultado {
	programa: string;
	regimen: { codigo: string; descripcion: string };
	/** Mes al que se actualizan las remuneraciones (AAAA-MM). */
	ancla: string;
	mesParametros?: string;
	mesValuacion: string;
	/** Promedio de remuneraciones actualizadas. */
	W: number;
	/** Promedio de rentas de autónomos. */
	R: number;
	rentas?: { mesTabla: string; filas: FilaRenta[]; meses: number; R: number } | null;
	PBU: number;
	pbuDetalle?: string;
	PC: number;
	PCsinTope?: number;
	topeAplicado?: boolean;
	PAP: number;
	porcentajes?: { pc: number; pap: number };
	anios?: { pbu: number; N1: number; N1computados?: number; N2: number };
	/** Retiro por invalidez (art. 97): ingreso base, porcentaje de referencia y haber. Sin PBU, PC ni PAP. */
	retiroInvalidez?: {
		norma: string;
		ingresoBase: number;
		pctReferencia: number;
		prestacionReferencia: number;
		participacionEstatal: number;
		haberRetiro: number;
	} | null;
	/** Pensión derivada en el mes del fallecimiento del causante. */
	pensionDerivada?: {
		norma: string;
		fallecimiento: string;
		mes: string;
		porcentaje: number;
		PBU: number;
		PC: number;
		PAP: number;
		suplemento?: number;
		sumaFija?: number;
		haber: number;
		haberMinimo?: number | null;
		complementoMinimo?: number;
		haberConMinimo: number;
	} | null;
	meses?: { antes: { n: number; m: number; p: number; excedente35?: number } };
	anticipada?: { porcentaje: number; norma: string } | null;
	edadAvanzada?: { pbuPct: number; norma: string } | null;
	prorrataReciprocidad?: number;
	haberPuro: number;
	suplemento?: number;
	zonaAustral?: number;
	haber: number;
	haberMinimo?: number | null;
	haberMaximo?: number | null;
	descuentoMaximo?: number;
	complementoMinimo?: number;
	haberConMinimo?: number;
	/** PBU, PC y PAP del mensual de la fecha de acuerdo (lo que imprime la constancia de ANSES). */
	alAcuerdo?: { mes: string; PBU: number; PC: number; PAP: number; haberPuro: number; suplemento?: number; haber: number } | null;
	remuneraciones?: {
		filas: FilaRemuneracion[];
		suma: number;
		divisor: number | string;
		meses: number;
	} | null;
	avisos: string[];
}

/** Respuesta de POST /api/previsional/haber-caja/calcular. */
export interface HaberCajaRespuesta {
	success: boolean;
	/** Hash de la tabla de datos previsionales con la que corrió el cálculo. */
	datosVersion: string;
	programa: ProgramaHaberCaja;
	/** La entrada que recibió el motor: con la moneda de cada fila y los períodos de autónomos partidos por época. */
	entrada?: HaberCajaInput;
	resultado: HaberCajaResultado;
}

export async function calcularHaberCaja(input: HaberCajaInput): Promise<HaberCajaRespuesta> {
	const { data } = await axios.post("/api/previsional/haber-caja/calcular", input);
	return data;
}

// ---- serie mensual: el haber de caja evolucionado mes a mes (lo que el retroactivo toma como percibido) ----

/** Una fila por mes, como el anexo «Movilidad del haber mensual» de BlueCorp. */
export interface FilaSerieMensual {
	/** AAAA-MM */
	mes: string;
	PBU: number;
	PC: number;
	PAP: number;
	/** Haber único de las prestaciones sin PBU, PC ni PAP (retiro por invalidez). */
	haberBase?: number;
	suplemento: number;
	/** Suma fija del DNU 163/20 (3/2020 a 2/2021). */
	sumaFija: number;
	haberPuro: number;
	zonaAustral?: number;
	haberMaximo?: number | null;
	descuentoMaximo: number;
	haberMinimo?: number | null;
	complementoMinimo: number;
	/** Haber bruto del mes, con el máximo y el mínimo aplicados: es el percibido de ese mes. */
	haberAlPago: number;
	/** Desde el fallecimiento del causante la fila es la pensión derivada. */
	pensionDerivada?: boolean;
	/** Qué cambió respecto del mes anterior (movilidad, integración de la suma fija…). */
	cambio?: string;
}
export interface SerieMensualHaberCaja {
	desde: string;
	hasta: string;
	/** Mes del primer haber. */
	mesParametros: string;
	/** La serie garantiza el 82 % del salario mínimo (Ley 27.426): 30 años de servicios o más. */
	minimo82?: boolean;
	pensionDerivada?: { fallecimiento: string; porcentaje: number };
	filas: FilaSerieMensual[];
	avisos: string[];
}
/** Rango de la serie en AAAA-MM. Sin `desde`: el mes del primer haber; sin `hasta`: el último mes con datos. */
export interface RangoSerie {
	desde?: string;
	hasta?: string;
}

const serieDe = (data: any): SerieMensualHaberCaja => {
	if (!data?.success || !Array.isArray(data?.serie?.filas)) throw new Error("El servidor no devolvió la serie mensual del haber de caja");
	return data.serie;
};

/** Serie mensual a partir de la entrada del cálculo. */
export async function serieMensualHaberCaja(input: HaberCajaInput, rango: RangoSerie = {}): Promise<SerieMensualHaberCaja> {
	const { data } = await axios.post("/api/previsional/haber-caja/serie-mensual", { ...input, serie: rango });
	return serieDe(data);
}

/** Serie mensual de un haber de caja guardado (el hub la recalcula con la entrada guardada). */
export async function serieMensualHaberCajaGuardado(calculatorId: string, rango: RangoSerie = {}): Promise<SerieMensualHaberCaja> {
	const { data } = await axios.post(`/api/previsional/haber-caja/guardados/${calculatorId}/serie-mensual`, rango);
	return serieDe(data);
}

/**
 * Años de servicios que el motor computa para la PBU a partir de los tiempos cargados (misma regla que `anios` del motor:
 * la fracción de más de 6 meses cuenta un año). Sirve para mostrar los excedentes de 30 antes de calcular; el resultado
 * trae el valor del motor en `anios.pbu`.
 */
export function aniosDeServicios(tiempos: (TiempoAMD | null | undefined)[]): number {
	let meses = 0;
	let dias = 0;
	for (const t of tiempos) {
		if (!t) continue;
		meses += (Number(t.a) || 0) * 12 + (Number(t.m) || 0);
		dias += Number(t.d) || 0;
	}
	const total = meses + (dias > 0 ? dias / 30 : 0);
	const enteros = Math.floor(total / 12);
	return total - enteros * 12 > 6 ? enteros + 1 : enteros;
}
/** Años excedentes de 30 que bonifican la PBU (Ley 24.241 art. 20): hasta 15. */
export const excedentesDe30 = (anios: number): number => Math.min(Math.max(anios - 30, 0), 15);

// ---- catálogo (GET /api/previsional/haber-caja/catalogo): categorías por época y moneda por período ----

/** Rango de meses AAAA-MM; `desde: null` = sin límite hacia atrás, `hasta: null` = sigue vigente. */
export interface RangoMeses {
	desde: string | null;
	hasta: string | null;
}
export interface MonedaCatalogo extends RangoMeses {
	clave: string;
	etiqueta: string;
	simbolo: string;
}
export interface CategoriaCatalogo {
	codigo: string;
	etiqueta: string;
	tipo: "autonomo" | "monotributo" | "afip";
	/** Clave de la renta con que el motor computa la categoría en cada rango. */
	computo: (RangoMeses & { computable: string | null })[];
}
export interface TramoCatalogo extends RangoMeses {
	/** `equivalencia`: el motor la computa con la renta de otra categoría (`computable`) por la norma que cita `norma`. */
	categorias: { codigo: string; computable: string | null; equivalencia: boolean; norma?: string | null }[];
}
export interface BloqueoCatalogo extends RangoMeses {
	codigos: string[];
	mensaje: string;
}
export interface CatalogoHaberCaja {
	datosVersion: string;
	/** Moneda de curso legal por período (la «moneda de la época»). */
	monedas: MonedaCatalogo[];
	/** Moneda que recibe la fila sin moneda, por período: la convención de BlueCorp. */
	monedasPorDefecto?: MonedaCatalogo[];
	/** Categorías que se ofrecen en cada época del período de aportes. */
	tramos: TramoCatalogo[];
	/** Lista completa, para elegir «otra». */
	categorias: CategoriaCatalogo[];
	/** Combinaciones de categoría y época que no se dejan cargar. */
	bloqueos: BloqueoCatalogo[];
	/** Lista del selector de prestaciones, con las que el motor todavía no calcula deshabilitadas. */
	prestacionesCatalogo?: PrestacionCatalogo[];
	limites: { remuneraciones: number; periodosAutonomo: number; mesesRenglon: number };
}

export async function obtenerCatalogoHaberCaja(): Promise<CatalogoHaberCaja> {
	const { data } = await axios.get("/api/previsional/haber-caja/catalogo");
	if (!data?.success || !Array.isArray(data.monedas) || !Array.isArray(data.tramos) || !Array.isArray(data.categorias)) {
		throw new Error("El servidor no devolvió el catálogo del haber de caja");
	}
	return { ...data, bloqueos: Array.isArray(data.bloqueos) ? data.bloqueos : [] };
}

const dentro = (r: RangoMeses, p: string) => (!r.desde || r.desde <= p) && (!r.hasta || p <= r.hasta);
const seSolapan = (r: RangoMeses, desde: string, hasta: string) => (!r.desde || r.desde <= hasta) && (!r.hasta || desde <= r.hasta);

/** Moneda de curso legal del período según el catálogo del hub; null si no hay catálogo o el período no es válido. */
export function monedaDelPeriodo(
	catalogo: CatalogoHaberCaja | null | undefined,
	periodo: string | null | undefined,
): MonedaCatalogo | null {
	if (!catalogo || !periodo) return null;
	return catalogo.monedas.find((m) => dentro(m, periodo)) || null;
}

/** Tramos del catálogo que toca el período. */
export function tramosDelPeriodo(catalogo: CatalogoHaberCaja | null | undefined, desde: string, hasta: string): TramoCatalogo[] {
	if (!catalogo) return [];
	return catalogo.tramos.filter((t) => seSolapan(t, desde, hasta || desde));
}

/**
 * Categorías que se ofrecen para un período: las de su época. Si el período cruza épocas, las que valen en todas
 * (puede no quedar ninguna: hay que partir el período).
 */
export function categoriasOfrecidas(catalogo: CatalogoHaberCaja | null | undefined, desde: string, hasta: string): CategoriaCatalogo[] {
	const tramos = tramosDelPeriodo(catalogo, desde, hasta);
	if (!catalogo || !tramos.length) return [];
	const codigos = tramos[0].categorias.map((c) => c.codigo).filter((c) => tramos.every((t) => t.categorias.some((k) => k.codigo === c)));
	return codigos.map((c) => catalogo.categorias.find((k) => k.codigo === c)).filter((k): k is CategoriaCatalogo => !!k);
}

/** Mensaje si la categoría no se puede cargar en ese período (combinaciones que el motor hoy resuelve mal); null si se puede. */
export function bloqueoDeCategoria(
	catalogo: CatalogoHaberCaja | null | undefined,
	codigo: string,
	desde: string,
	hasta: string,
): string | null {
	if (!catalogo || !codigo) return null;
	const b = catalogo.bloqueos.find((x) => x.codigos.includes(codigo) && seSolapan(x, desde, hasta || desde));
	return b ? b.mensaje : null;
}

const etiquetaComputable = (catalogo: CatalogoHaberCaja, clave: string | null) =>
	(clave && catalogo.categorias.find((k) => k.codigo === clave)?.etiqueta) || clave || "sin renta";

/**
 * Aviso (no impide calcular) cuando la categoría elegida no es de la época del período: dice cómo la computa el motor.
 * null si la categoría es de las ofrecidas.
 */
export function avisoDeCategoria(
	catalogo: CatalogoHaberCaja | null | undefined,
	codigo: string,
	desde: string,
	hasta: string,
): string | null {
	if (!catalogo || !codigo) return null;
	const cat = catalogo.categorias.find((k) => k.codigo === codigo);
	if (!cat) return "Categoría fuera del catálogo.";
	const tramos = tramosDelPeriodo(catalogo, desde, hasta);
	const fuera = tramos.filter((t) => !t.categorias.some((k) => k.codigo === codigo));
	if (!fuera.length) return null;
	const p = fuera[0].desde && fuera[0].desde > desde ? fuera[0].desde : desde;
	const computable = cat.computo.find((r) => dentro(r, p))?.computable || null;
	return `No es una categoría de la época del período: el cálculo la toma como ${etiquetaComputable(catalogo, computable)}.`;
}

/** Equiparación que aplica el motor a la categoría en ese período, con su norma (p. ej. «G → B por el Dec. 1361/80»); null si no hay. */
export function equiparacionDeCategoria(
	catalogo: CatalogoHaberCaja | null | undefined,
	codigo: string,
	desde: string,
	hasta: string,
): string | null {
	if (!catalogo || !codigo) return null;
	const partes = tramosDelPeriodo(catalogo, desde, hasta)
		.map((t) => t.categorias.find((k) => k.codigo === codigo))
		.filter((k) => k && k.equivalencia)
		.map((k) => `${codigo} → ${k!.computable}${k!.norma ? ` por el ${k!.norma}` : ""}`);
	return partes.length ? [...new Set(partes)].join("; ") : null;
}

// ---- importes anteriores al peso: en qué moneda están cargados ----

/**
 * Cómo están expresados los importes anteriores al peso. La moneda automática (fila sin moneda) es la convención de
 * BlueCorp, que publica el catálogo en `monedasPorDefecto` (decisión del dueño): pesos argentinos y, después, australes.
 * Las otras dos formas: la moneda de curso legal de cada período («epoca», `monedas` del catálogo) y los importes ya
 * convertidos a pesos, como los trae la constancia de ANSES. Pasar de una a otra es correr la coma.
 * Las fechas de corte salen todas del catálogo del hub.
 */
export type CriterioMonedasViejas = "bluecorp" | "epoca" | "pesos";
export const CRITERIO_MONEDAS_POR_DEFECTO: CriterioMonedasViejas = "bluecorp";

/** Moneda que recibe la fila sin moneda en ese período (convención de BlueCorp); null si el catálogo no la trae. */
export function monedaPorDefectoDelPeriodo(
	catalogo: CatalogoHaberCaja | null | undefined,
	periodo: string | null | undefined,
): MonedaCatalogo | null {
	if (!catalogo?.monedasPorDefecto || !periodo) return null;
	return catalogo.monedasPorDefecto.find((m) => dentro(m, periodo)) || null;
}

/** Primer mes en que la moneda por defecto ya es el peso (los importes anteriores son los «viejos»); null sin catálogo. */
export function primerMesEnPesos(catalogo: CatalogoHaberCaja | null | undefined): string | null {
	return catalogo?.monedasPorDefecto?.find((m) => m.clave === "pesos")?.desde || null;
}

/** ¿El período es anterior al peso? (sin catálogo no se sabe: false) */
export function esPeriodoAnteriorAlPeso(catalogo: CatalogoHaberCaja | null | undefined, periodo: string | null | undefined): boolean {
	const corte = primerMesEnPesos(catalogo);
	return !!corte && !!periodo && periodo < corte;
}

/** Opciones del control, con los nombres de las monedas que trae el catálogo. */
export function criteriosMonedasViejas(
	catalogo: CatalogoHaberCaja | null | undefined,
): { clave: CriterioMonedasViejas; etiqueta: string }[] {
	const deBlueCorp = (catalogo?.monedasPorDefecto || []).filter((m) => m.clave !== "pesos").map((m) => m.etiqueta.toLowerCase());
	return [
		{ clave: "bluecorp", etiqueta: `Como los carga BlueCorp${deBlueCorp.length ? `: en ${deBlueCorp.join(" y en ")}` : ""}` },
		{ clave: "pesos", etiqueta: "Ya convertidos a pesos (como la constancia de ANSES)" },
		{ clave: "epoca", etiqueta: "En la moneda que regía en cada período" },
	];
}

/**
 * Moneda de la fila según el criterio; "" = automática (la convención de BlueCorp, que pone el hub). Solo cambia los
 * períodos anteriores al peso.
 */
export function monedaSegunCriterio(
	criterio: CriterioMonedasViejas,
	periodo: string,
	catalogo: CatalogoHaberCaja | null | undefined,
): string {
	if (!esPeriodoAnteriorAlPeso(catalogo, periodo) || criterio === "bluecorp") return "";
	if (criterio === "pesos") return "pesos";
	return monedaDelPeriodo(catalogo, periodo)?.clave || "";
}

// ---- utilidades de carga (formulario y pegado desde planilla) ----

/** Normaliza un período escrito como AAAA-MM, AAAA/MM, MM/AAAA, MM-AAAA o M/AAAA a AAAA-MM; null si no es válido. */
export function normalizarPeriodo(texto: string): string | null {
	const t = String(texto || "").trim();
	let anio: number;
	let mes: number;
	let m = t.match(/^(\d{4})[-/.](\d{1,2})(?:[-/.]\d{1,2})?$/);
	if (m) {
		anio = Number(m[1]);
		mes = Number(m[2]);
	} else {
		// MM/AAAA o DD/MM/AAAA
		m = t.match(/^(?:\d{1,2}[-/.])?(\d{1,2})[-/.](\d{4})$/);
		if (!m) return null;
		mes = Number(m[1]);
		anio = Number(m[2]);
	}
	if (mes < 1 || mes > 12 || anio < 1900 || anio > 2100) return null;
	return `${anio}-${String(mes).padStart(2, "0")}`;
}

/**
 * Lee un importe escrito a la argentina ("1.234,56", "$ 1.234,56") o con punto decimal ("1234.56").
 * Devuelve null si no es un número.
 */
export function leerImporte(texto: string | number | null | undefined): number | null {
	if (typeof texto === "number") return Number.isFinite(texto) ? texto : null;
	let t = String(texto ?? "")
		.replace(/[$\s ]/g, "")
		.trim();
	if (!t) return null;
	if (t.includes(",")) {
		// coma decimal: los puntos son separadores de miles
		t = t.replace(/\./g, "").replace(",", ".");
	} else if (/^-?\d{1,3}(\.\d{3})+$/.test(t)) {
		// solo puntos de miles ("1.234.567")
		t = t.replace(/\./g, "");
	}
	if (!/^-?\d+(\.\d+)?$/.test(t)) return null;
	const n = Number(t);
	return Number.isFinite(n) ? n : null;
}

export interface FilaPegada {
	periodo: string;
	importe: string;
}

/**
 * Convierte el texto pegado desde una planilla (una fila por línea; columnas separadas por tabulación o punto y coma:
 * período e importe) en filas de la grilla. Se saltean los encabezados y las líneas que no se pueden leer.
 */
export function leerFilasPegadas(texto: string): { filas: FilaPegada[]; descartadas: number } {
	const filas: FilaPegada[] = [];
	let descartadas = 0;
	for (const linea of String(texto || "").split(/\r?\n/)) {
		if (!linea.trim()) continue;
		const celdas = linea
			.split(/\t|;/)
			.map((c) => c.trim())
			.filter((c) => c !== "");
		const periodo = celdas.length >= 2 ? normalizarPeriodo(celdas[0]) : null;
		// el importe es la última columna con un número (permite columnas intermedias, p. ej. el empleador)
		const importe = periodo
			? celdas
					.slice(1)
					.reverse()
					.map((c) => leerImporte(c))
					.find((n) => n !== null && n !== undefined)
			: null;
		if (!periodo || importe === null || importe === undefined) {
			descartadas++;
			continue;
		}
		filas.push({ periodo, importe: String(importe).replace(".", ",") });
	}
	return { filas, descartadas };
}

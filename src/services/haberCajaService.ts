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

export type PrestacionHaberCaja = "jubilacion" | "pension" | "edadAvanzada";

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
	monedas: MonedaCatalogo[];
	/** Categorías que se ofrecen en cada época del período de aportes. */
	tramos: TramoCatalogo[];
	/** Lista completa, para elegir «otra». */
	categorias: CategoriaCatalogo[];
	/** Combinaciones de categoría y época que no se dejan cargar. */
	bloqueos: BloqueoCatalogo[];
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

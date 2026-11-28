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

export type PrestacionHaberCaja = "jubilacion" | "pension";

/** Perfiles de convenciones que acepta la ruta de usuario (cualquier otro cae en `ansesPrpa`). */
export type ProgramaHaberCaja = "ansesPrpa" | "bluecorp";

export interface RemuneracionEntrada {
	/** AAAA-MM */
	periodo: string;
	importe: number;
	moneda?: string;
}

/** Entrada de `calcularHaberCaja` (solo los campos que carga la pantalla). */
export interface HaberCajaInput {
	programa?: ProgramaHaberCaja;
	prestacion: PrestacionHaberCaja;
	porcentajePension?: number;
	/** Fechas en AAAA-MM-DD. */
	fechas: { fad: string; cese?: string; solicitud?: string; alta?: string; acuerdo?: string };
	/** n = relación de dependencia, m = autónomos, p = simultáneos. */
	servicios: { n?: TramoServicios; m?: TramoServicios; p?: TramoServicios };
	remuneraciones: RemuneracionEntrada[];
	/** Pendiente en la pantalla: aportes autónomos por categoría. */
	autonomo?: { periodos?: { desde: string; hasta: string; categoria: string }[] };
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
	PBU: number;
	pbuDetalle?: string;
	PC: number;
	PCsinTope?: number;
	topeAplicado?: boolean;
	PAP: number;
	porcentajes?: { pc: number; pap: number };
	anios?: { pbu: number; N1: number; N1computados?: number; N2: number };
	haberPuro: number;
	suplemento?: number;
	haber: number;
	haberMinimo?: number | null;
	haberMaximo?: number | null;
	descuentoMaximo?: number;
	complementoMinimo?: number;
	haberConMinimo?: number;
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
	resultado: HaberCajaResultado;
}

export async function calcularHaberCaja(input: HaberCajaInput): Promise<HaberCajaRespuesta> {
	const { data } = await axios.post("/api/previsional/haber-caja/calcular", input);
	return data;
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

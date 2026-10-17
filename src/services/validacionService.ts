import axios from "utils/axios";
import type { RetroactivoInput, RetroactivoResultado, TipoPago } from "services/previsionalService";

// Códigos de validación de documentos emitidos (law-analytics-server):
// - POST /api/previsional/validaciones (autenticado): registra los totales del PDF y devuelve el código.
// - GET /api/public/validaciones/:codigo (público): lo que ve quien escanea el QR del papel.

export interface EmitirValidacionParams {
	input: RetroactivoInput;
	totales: RetroactivoResultado["totales"];
	calculatorId?: string | null;
	datos: { titular: string | null; expedienteAdmin: string | null; prestacion: string | null };
}

export interface ValidacionEmitida {
	success: true;
	codigo: string;
	url: string;
	huella: string;
	emitidoEn: string;
}

export interface DocumentoValidado {
	codigo: string;
	tipo: "previsional_retroactivo" | string;
	emitidoEn: string;
	huellaCorta: string;
	titular: string | null;
	expediente: string | null;
	prestacion: string | null;
	desde: string;
	cierre: string;
	tasa: string | null;
	totales: { capital: number; intereses: number; total: number; pagado: number; saldo: number };
	pagos: { fecha: string; importe: number; tipo?: TipoPago | string | null }[];
	haberReajustado: { periodo: string; reclamado: number } | null;
}

export type ResultadoConsulta =
	| { estado: "valido"; documento: DocumentoValidado }
	| { estado: "no_encontrado" }
	| { estado: "demasiadas_consultas" }
	| { estado: "error" };

export async function emitirValidacion({ input, totales, calculatorId, datos }: EmitirValidacionParams): Promise<ValidacionEmitida> {
	const { data } = await axios.post(
		"/api/previsional/validaciones",
		{
			input,
			totales,
			...(calculatorId ? { calculatorId } : {}),
			datos,
		},
		// Corto: si el hub tarda, el PDF sale igual sin el bloque de validación.
		{ timeout: 10000 },
	);
	if (!data?.codigo || !data?.url) throw new Error("Respuesta de validación incompleta");
	return data as ValidacionEmitida;
}

/** Nunca lanza: traduce 404/429/otros a un estado para la página pública. */
export async function consultarValidacion(codigo: string): Promise<ResultadoConsulta> {
	try {
		const { data } = await axios.get(`/api/public/validaciones/${encodeURIComponent(codigo)}`);
		if (data?.valido && data.documento) return { estado: "valido", documento: data.documento };
		return { estado: "no_encontrado" };
	} catch (e: any) {
		const status = e?.response?.status;
		if (status === 404) return { estado: "no_encontrado" };
		if (status === 429) return { estado: "demasiadas_consultas" };
		return { estado: "error" };
	}
}

/** Largo del código sin guiones: tres grupos de cuatro (7K4M-2QXT-9ZD3). */
const LARGO_CODIGO = 12;

/**
 * Normaliza lo que escribe la persona: mayúsculas, sin espacios ni signos, con un guion cada cuatro caracteres.
 * Sirve también para ir formateando mientras escribe ("7k4m2" → "7K4M-2").
 */
export function normalizarCodigo(texto: string): string {
	const limpio = (texto || "")
		.toUpperCase()
		.replace(/[^A-Z0-9]/g, "")
		.slice(0, LARGO_CODIGO);
	return (limpio.match(/.{1,4}/g) || []).join("-");
}

export const codigoCompleto = (codigo: string) => /^[A-Z0-9]{4}-[A-Z0-9]{4}-[A-Z0-9]{4}$/.test(codigo);

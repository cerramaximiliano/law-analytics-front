import axios from "utils/axios";
import type { TramoTasaRequest } from "services/tasasCalculoService";

// Cliente de la liquidación encadenada del hub (POST /api/liquidaciones/calcular,
// law-analytics-server/services/liquidacionService.js).

export type RolHonorarios = "patrocinante" | "apoderadoSinPatrocinio" | "procurador" | "auxiliar";

export interface HonorarioInput {
	profesional?: string;
	rol: RolHonorarios;
	tipoProceso?: "conocimiento" | "ejecutivo" | "mediacion";
	etapas?: number;
	allanamientoAntesDePrueba?: boolean;
	ejecucion?: "" | "sentencia" | "sentenciaSinExcepciones";
	posicion?: "minimo" | "medio" | "maximo";
	porcentaje?: number;
	base?: "liquidacion" | "saldo" | "manual";
	baseManual?: number;
	fechaRegulacion?: string;
	iva?: boolean;
}

export interface LiquidacionInput {
	fechaCorte: string;
	capital: number;
	tramos: TramoTasaRequest[];
	capitalizarEntreTramos?: boolean;
	pagos?: { fecha: string; monto: number; concepto?: string }[];
	imputacionPagos?: "interesesPrimero" | "capitalPrimero";
	honorarios?: HonorarioInput[];
	ivaAlicuota?: number;
	tasaJusticia?: {
		aplicar: boolean;
		alicuota?: number;
		base?: "liquidacion" | "capital" | "manual";
		baseManual?: number;
		yaAbonada?: number;
	};
	otros?: { concepto: string; monto: number }[];
}

export interface LiquidacionResultado {
	success: boolean;
	fechaCorte: string;
	credito: {
		tramos: any[];
		pagos: {
			fecha: string;
			monto: number;
			concepto?: string;
			aIntereses: number;
			aCapital: number;
			capitalLuego: number;
			interesesLuego: number;
		}[];
		capitalOriginal: number;
		interesesDevengados: number;
		totalPagado: number;
		capitalSaldo: number;
		interesesSaldo: number;
		saldo: number;
		montoLiquidacion: number;
	};
	honorarios: (Omit<HonorarioInput, "base" | "iva" | "porcentaje"> & {
		base: number;
		tipoBase: string;
		honorario: number;
		unidades: number;
		unidad: string;
		valorUnidad: number;
		porcentaje: number;
		tramo: { indice: number; hastaUMA: number | null; minimo: number; maximo: number } | null;
		piso: { aplicado: boolean; monto: number } | null;
		minimo: { aplicado: boolean; unidades: number; monto: number } | null;
		ajustes: { motivo: string; factor: number }[];
		iva: number;
		ivaAlicuota: number;
		total: number;
		norma: string;
		unidadNorma?: string;
	})[];
	tasaJusticia: {
		categoria: "tributo";
		concepto: string;
		norma: string;
		alicuota: number;
		tipoBase: string;
		base: number;
		bruto: number;
		yaAbonada: number;
		monto: number;
	} | null;
	otros: { concepto: string; monto: number }[];
	totales: {
		capital: number;
		intereses: number;
		credito: number;
		honorarios: number;
		iva: number;
		tasaJusticia: number;
		otros: number;
		general: number;
	};
	avisos: string[];
}

export async function calcularLiquidacion(input: LiquidacionInput): Promise<LiquidacionResultado> {
	const { data } = await axios.post("/api/liquidaciones/calcular", input);
	return data;
}

/** Componentes para guardar en Calculator (classType 'liquidacion'), en orden. */
export function componentesDeLiquidacion(r: LiquidacionResultado) {
	const c: any[] = [];
	let orden = 0;
	c.push({ tipo: "capital", label: "Capital", orden: orden++, monto: r.credito.capitalOriginal });
	c.push({ tipo: "intereses", label: "Intereses", orden: orden++, monto: r.credito.interesesDevengados });
	for (const p of r.credito.pagos) {
		c.push({
			tipo: "pagoACuenta",
			label: p.concepto || "Pago a cuenta",
			orden: orden++,
			monto: -(p.aIntereses + p.aCapital),
			fecha: p.fecha,
		});
	}
	for (const h of r.honorarios) {
		const rotulo = h.profesional ? `Honorarios ${h.profesional}` : "Honorarios";
		c.push({
			tipo: "honorarios",
			label: rotulo,
			orden: orden++,
			base: h.base,
			porcentaje: h.porcentaje,
			unidades: h.unidades,
			valorUnidad: h.valorUnidad,
			monto: h.honorario,
		});
		if (h.iva)
			c.push({
				tipo: "iva",
				label: `IVA ${h.ivaAlicuota} % ${rotulo.toLowerCase()}`,
				orden: orden++,
				porcentaje: h.ivaAlicuota,
				monto: h.iva,
			});
	}
	if (r.tasaJusticia) {
		c.push({
			tipo: "tasaJusticia",
			label: `Tasa de justicia (${r.tasaJusticia.norma})`,
			orden: orden++,
			base: r.tasaJusticia.base,
			porcentaje: r.tasaJusticia.alicuota,
			monto: r.tasaJusticia.monto,
			meta: { categoria: "tributo", yaAbonada: r.tasaJusticia.yaAbonada },
		});
	}
	for (const o of r.otros) c.push({ tipo: "otro", label: o.concepto, orden: orden++, monto: o.monto });
	return c;
}

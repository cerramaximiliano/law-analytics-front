import axios from "utils/axios";

// Cliente de la indemnización por riesgos del trabajo del hub (POST /api/riesgos-trabajo/calcular,
// law-analytics-server/services/artService.js).

export type ContingenciaART = "incapacidad" | "granInvalidez" | "muerte";
export type CriterioActualizacionART = "ripte" | "tasaActiva" | "ipc3" | "ripte6";

export const CRITERIOS_ACTUALIZACION_ART: { value: CriterioActualizacionART; label: string }[] = [
	{ value: "ripte", label: "RIPTE (DNU 669/19) — criterio mayoritario CNAT y TSJ CABA" },
	{ value: "tasaActiva", label: "Tasa activa BNA a 30 días (texto de la ley 27.348)" },
	{ value: "ipc3", label: "IPC INDEC + 3 % anual simple" },
	{ value: "ripte6", label: "RIPTE + 6 % anual puro" },
];

export interface RemuneracionART {
	periodo: string; // YYYY-MM
	monto: number;
	sac?: boolean;
}

export interface ARTInput {
	fechaPMI: string;
	edad?: number;
	fechaNacimiento?: string;
	porcentaje: number;
	contingencia: ContingenciaART;
	inItinere: boolean;
	remuneraciones: RemuneracionART[];
	fechaLiquidacion?: string;
	criterioActualizacion?: CriterioActualizacionART;
}

export interface ARTResultado {
	success: boolean;
	regimen: string;
	fechaPMI: string;
	edad: number;
	porcentaje: number;
	contingencia: ContingenciaART;
	inItinere: boolean;
	ingresoBase: {
		metodo: "ley27348" | "anterior";
		valor: number;
		meses?: number;
		dias?: number;
		total: number;
		periodoDestino?: string;
		ripteDestino?: number;
		detalle: { periodo: string; sac: boolean; monto: number; ripte?: number; coeficiente?: number; actualizado?: number }[];
	};
	articulo: string;
	coefEdad: number;
	formula: number;
	piso: number | null;
	pisoAplicado: boolean;
	indemnizacion: number;
	compensacion: { inciso: "a" | "b" | "c"; monto: number } | null;
	adicional: { procede: boolean; monto: number; pisoAplicado: boolean; piso?: number };
	capital: number;
	montosNorma: { norma: string; fuente?: string; vigenciaDesde: string; vigenciaHasta: string } | null;
	actualizacion: {
		criterio: CriterioActualizacionART;
		descripcion: string;
		desde: string;
		hasta: string;
		dias: number;
		factor: number;
		monto: number;
	} | null;
	total: number;
	avisos: string[];
}

export async function calcularART(input: ARTInput): Promise<ARTResultado> {
	const { data } = await axios.post("/api/riesgos-trabajo/calcular", input);
	return data;
}

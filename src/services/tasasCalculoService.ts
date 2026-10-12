import axios from "utils/axios";

// Cliente del motor único de intereses del hub (POST /api/tasas/calcular,
// law-analytics-server/services/tasasCalculoService.js).

export type CapitalizacionTramo = "none" | "monthly" | "quarterly" | "semiannual" | "annual";

export type TramoTasaRequest =
	| {
			desde: string;
			hasta: string;
			tasa: string;
			capitalizacion?: CapitalizacionTramo;
			primeraCapitalizacion?: string;
			comparativaCER?: boolean;
	  }
	| {
			desde: string;
			hasta: string;
			tipo: "simple";
			tasaFija: number;
			periodoTasa?: "daily" | "monthly" | "annual";
			capitalizacion?: CapitalizacionTramo;
	  };

export interface TramoTasaResultado {
	tasa?: string;
	tipoIndice?: string;
	tipo?: "simple";
	desde: string;
	hasta: string;
	capital: number;
	interes: number;
	interesEfectivo: number;
	coeficiente: number;
	capitalizacion?: CapitalizacionTramo;
	periodos?: { desde: string; hasta: string; capital: number; interes: number; dias?: number; factor?: number }[];
	comparativaCER?: any;
	avisos: string[];
}

export interface CalculoTramosResultado {
	success: boolean;
	capital: number;
	capitalizarEntreTramos: boolean;
	tramos: TramoTasaResultado[];
	interesTotal: number;
	montoFinal: number;
	avisos: string[];
}

export async function calcularTramos(params: {
	capital: number;
	tramos: TramoTasaRequest[];
	capitalizarEntreTramos?: boolean;
}): Promise<CalculoTramosResultado> {
	const { data } = await axios.post("/api/tasas/calcular", params);
	return data;
}

import axios from "utils/axios";

// Valores arancelarios (UMA, JUS, IUS) por jurisdicción. Solo lectura, servidos
// por el server principal (endpoint público autenticado). La gestión vive en el
// panel admin; acá el usuario solo consulta.

export interface ValorVigente {
	valor: number;
	periodo: string;
	norma?: string;
	vigenciaDesde: string;
}

export interface ResumenJurisdiccion {
	unidad: string;
	ambito: string;
	descripcion?: string;
	leyMarco?: string;
	fuente?: string;
	total: number;
	vigente: ValorVigente | null;
}

export interface ValorHistorico {
	_id: string;
	valor: number;
	periodo: string;
	vigenciaDesde: string;
	norma?: string;
	fechaPublicacion?: string;
	leyMarco?: string;
	descripcion?: string;
}

/** Una fila por jurisdicción con su valor vigente. */
export const getResumenArancelario = async (): Promise<ResumenJurisdiccion[]> => {
	const res = await axios.get("/api/valores-arancelarios/resumen");
	return res.data.data;
};

/** Serie histórica de una unidad/ámbito, del más nuevo al más viejo. */
export const getSerieArancelaria = async (unidad: string, ambito: string): Promise<ValorHistorico[]> => {
	const res = await axios.get(`/api/valores-arancelarios/${unidad}/${ambito}`);
	return res.data.data;
};

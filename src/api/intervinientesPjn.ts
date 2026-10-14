import axios from "utils/axios";

// Intervinientes PJN de la carpeta (partes y letrados del expediente), visibles aunque no estén
// sincronizados como contactos. Backend: law-analytics-server /api/folders/:folderId/intervinientes-pjn.

export type EstadoContacto = "en_carpeta" | "en_contactos" | null;

export interface LetradoPjn {
	id: string;
	nombre: string;
	tipo: string | null;
	matricula: string | null;
	estado: EstadoContacto;
	contactId: string | null;
}

export interface PartePjn {
	id: string;
	nombre: string;
	tipo: string | null;
	estado: EstadoContacto;
	contactId: string | null;
	letrados: LetradoPjn[];
}

export interface IntervinientesPjnVista {
	soportada: boolean;
	estado?: "disponible" | "pendiente" | "sin_intervinientes";
	partes?: PartePjn[];
	letradosSinParte?: LetradoPjn[];
	total?: number;
	enCarpeta?: number;
}

export interface ImportacionResultado {
	creados: number;
	archivados: number;
	vinculados: number;
	sinCambios: number;
	omitidos: number;
	limiteAlcanzado: boolean;
	errores: number;
}

export const getIntervinientesPjn = async (folderId: string): Promise<IntervinientesPjnVista> => {
	const { data } = await axios.get(`/api/folders/${folderId}/intervinientes-pjn`);
	return data.data;
};

export const agregarIntervinientesPjn = async (
	folderId: string,
	body: { ids: string[] } | { todos: true },
): Promise<{ resultado: ImportacionResultado; data: IntervinientesPjnVista }> => {
	const { data } = await axios.post(`/api/folders/${folderId}/intervinientes-pjn/contactos`, body);
	return { resultado: data.resultado, data: data.data };
};

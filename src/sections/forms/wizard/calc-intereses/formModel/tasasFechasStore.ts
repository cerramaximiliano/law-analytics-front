// tasasFechasStore.ts
interface RangoFechas {
	fechaInicio: Date;
	fechaUltima: Date;
}

// Mapa para almacenar los rangos de fechas por tipo de tasa
const tasasFechasRangoMap = new Map<string, RangoFechas>();

// Función para actualizar los rangos de fechas disponibles para una tasa
export const actualizarRangoFechasTasa = (tipoTasa: string, fechaInicio: Date, fechaUltima: Date) => {
	tasasFechasRangoMap.set(tipoTasa, { fechaInicio, fechaUltima });
};

export const obtenerRangoFechasTasa = (tipoTasa: string): RangoFechas | undefined => {
	const rango = tasasFechasRangoMap.get(tipoTasa);
	return rango;
};

export const hayRangosFechas = (): boolean => {
	const size = tasasFechasRangoMap.size;
	return size > 0;
};

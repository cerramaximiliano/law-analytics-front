// tasasFechasStore.ts
interface RangoFechas {
	fechaInicio: Date;
	fechaUltima: Date;
}

// Mapa para almacenar los rangos de fechas por tipo de tasa
const tasasFechasRangoMap = new Map<string, RangoFechas>();

// Función para actualizar los rangos de fechas disponibles para una tasa
export const actualizarRangoFechasTasa = (tipoTasa: string, fechaInicio: Date, fechaUltima: Date) => {
	console.log(`Actualizando rango para tasa ${tipoTasa}:`, { fechaInicio, fechaUltima });
	tasasFechasRangoMap.set(tipoTasa, { fechaInicio, fechaUltima });
	console.log(`Mapa actualizado, ahora hay ${tasasFechasRangoMap.size} rangos`);
};

export const obtenerRangoFechasTasa = (tipoTasa: string): RangoFechas | undefined => {
	const rango = tasasFechasRangoMap.get(tipoTasa);
	console.log(`Obteniendo rango para tasa ${tipoTasa}:`, rango);
	return rango;
};

export const hayRangosFechas = (): boolean => {
	const size = tasasFechasRangoMap.size;
	console.log(`Número de rangos de fechas disponibles: ${size}`);
	return size > 0;
};

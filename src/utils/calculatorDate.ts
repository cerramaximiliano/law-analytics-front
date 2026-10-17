import dayjs from "utils/dayjs-config";

/**
 * Fecha de un cálculo guardado (`Calculator.date`).
 *
 * El front la manda como "YYYY-MM-DD" (sin hora) y Mongo la guarda a la medianoche UTC, así que
 * formatearla en hora local (UTC-3) la corría un día para atrás: un cálculo del 17/10 se veía
 * como del 16/10. Si el valor es exactamente medianoche UTC se toma como fecha de calendario; si
 * trae hora (p. ej. `default: Date.now` del hub) se muestra en hora local.
 */
export const fechaCalculo = (value: string | Date | null | undefined, formato = "DD/MM/YYYY"): string => {
	if (!value) return "-";
	const utc = dayjs.utc(value);
	if (!utc.isValid()) return "-";
	const esMedianocheUtc = utc.hour() === 0 && utc.minute() === 0 && utc.second() === 0;
	return (esMedianocheUtc ? utc : dayjs(value)).format(formato);
};

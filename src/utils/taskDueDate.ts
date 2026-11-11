import dayjs from "utils/dayjs-config";

type Dayjs = ReturnType<typeof dayjs>;

/**
 * Fecha de vencimiento de una tarea para mandar al hub (11/11/2026, reporte de Silvia).
 *
 * La tarea vence un DÍA, no un instante. El formulario de la carpeta mandaba «25/11/2026» como
 * texto y el hub (en UTC) lo guardaba como la medianoche UTC del 25: en Argentina eso es el 24 a
 * las 21 h, y el listado mostraba el 24. Cada edición volvía a correr la fecha un día.
 *
 * Se guarda el mediodía LOCAL del día elegido: cae en el mismo día calendario en cualquier huso
 * entre UTC-11 y UTC+11, incluido el del hub.
 */
export const DUE_DATE_INPUT_FORMAT = "DD/MM/YYYY";

export function dueDateToIso(value: string | Date | Dayjs | null | undefined): string | undefined {
	if (value === null || value === undefined || value === "") return undefined;
	const parsed = typeof value === "string" ? parseDueDateText(value) : dayjs(value);
	if (!parsed || !parsed.isValid()) return undefined;
	return parsed.startOf("day").hour(12).toISOString();
}

function parseDueDateText(text: string): Dayjs | null {
	const trimmed = text.trim();
	if (/^\d{1,2}\/\d{1,2}\/\d{4}$/.test(trimmed)) {
		const [d, m, y] = trimmed.split("/").map(Number);
		const parsed = dayjs(new Date(y, m - 1, d));
		return parsed.isValid() && parsed.date() === d && parsed.month() === m - 1 ? parsed : null;
	}
	const parsed = dayjs(trimmed);
	return parsed.isValid() ? parsed : null;
}

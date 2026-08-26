import dayjs from "utils/dayjs-config";

/**
 * Fechas de carpeta: lectura y escritura sin corrimiento de día.
 *
 * `initialDateFolder` / `finalDateFolder` son fechas SIN hora: se guardan como
 * medianoche UTC (`2025-12-01T00:00:00.000Z`). Mostrarlas con
 * `dayjs(iso).format("DD/MM/YYYY")` las renderiza en hora local — en Argentina
 * (UTC-3) esa medianoche cae el día anterior, así que el formulario mostraba
 * 30/11 y al guardar escribía 2025-11-30. Cada edición corría la fecha un día
 * hacia atrás, de forma acumulativa. Detectado el 2026-08-26.
 */

/** ISO (o Date) → "DD/MM/YYYY" leyendo los componentes en UTC. */
export const fechaFolderAInput = (valor: string | Date | null | undefined): string => {
	if (!valor) return "";
	return dayjs.utc(valor).format("DD/MM/YYYY");
};

/** "DD/MM/YYYY" → "YYYY-MM-DD" (el hub lo interpreta como fecha sin hora). */
export const inputAFechaFolder = (valor: string | null | undefined): string => {
	if (!valor) return valor || "";
	const d = dayjs.utc(valor, "DD/MM/YYYY");
	return d.isValid() ? d.format("YYYY-MM-DD") : valor;
};

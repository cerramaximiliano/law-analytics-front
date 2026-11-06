import dayjs, { Dayjs } from "dayjs";

// Controles del estudio sobre el listado (6/11/2026, pedido de Estudio FS Abogados): situación
// procesal del expediente PJN (la trae el hub desde la causa: EN LETRA, EN DESPACHO, GIRO…) y
// carpetas sin movimiento hace más de N días.

/** «EN LETRA» → «En letra»; vacío → «Sin dato». */
export const situacionLabel = (raw: string | undefined | null): string => {
	const s = String(raw || "")
		.trim()
		.replace(/\s+/g, " ");
	if (!s) return "Sin dato";
	const lower = s.toLocaleLowerCase("es");
	return lower.charAt(0).toLocaleUpperCase("es") + lower.slice(1);
};

/** Valor normalizado para comparar y agrupar: mayúsculas, sin espacios dobles; '' si no hay. */
export const situacionKey = (raw: string | undefined | null): string =>
	String(raw || "")
		.trim()
		.replace(/\s+/g, " ")
		.toUpperCase();

export interface SituacionOption {
	value: string;
	label: string;
	count: number;
}

/** Opciones del filtro «Situación» con conteo; «Sin dato» al final. */
export const situacionOptions = (folders: any[]): SituacionOption[] => {
	const map = new Map<string, number>();
	folders.forEach((f) => {
		const k = situacionKey(f?.situacion);
		map.set(k, (map.get(k) || 0) + 1);
	});
	return Array.from(map.entries())
		.map(([value, count]) => ({ value, label: situacionLabel(value), count }))
		.sort((a, b) => (a.value === "" ? 1 : b.value === "" ? -1 : b.count - a.count || a.label.localeCompare(b.label, "es")));
};

/** Días de inactividad que ofrece el filtro «Sin movimiento hace más de…». */
export const INACTIVIDAD_FILTROS = {
	inactive30: { days: 30, label: "Sin movimiento hace más de 1 mes" },
	inactive90: { days: 90, label: "Sin movimiento hace más de 3 meses" },
	inactive180: { days: 180, label: "Sin movimiento hace más de 6 meses" },
	inactive365: { days: 365, label: "Sin movimiento hace más de 1 año" },
} as const;
export type InactividadFiltro = keyof typeof INACTIVIDAD_FILTROS;

export const isInactividadFiltro = (v: string | null | undefined): v is InactividadFiltro =>
	Object.prototype.hasOwnProperty.call(INACTIVIDAD_FILTROS, v || "");

/**
 * Carpeta con último movimiento conocido y anterior a `today - days`. Sin fecha de movimiento no
 * cuenta: eso ya lo cubre «Sin movimientos».
 */
export const sinMovimientoHace = (folder: any, days: number, today: Dayjs = dayjs().startOf("day")): boolean => {
	if (!folder?.lastMovementDate) return false;
	const last = dayjs(folder.lastMovementDate);
	if (!last.isValid()) return false;
	return last.isBefore(today.subtract(days, "day"));
};

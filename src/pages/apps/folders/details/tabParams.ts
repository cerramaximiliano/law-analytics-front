// Pestaña del detalle de carpeta ↔ ?tab= de la URL.
// Sin param = Información General (0). Los índices son los de tabItems en details.tsx.
export const TAB_PARAM_BY_INDEX: Record<number, string> = {
	1: "activity",
	2: "gestion",
	3: "recursos",
	4: "historial",
	5: "relaciones",
	6: "chat",
};

const INDEX_BY_TAB_PARAM: Record<string, number> = Object.fromEntries(
	Object.entries(TAB_PARAM_BY_INDEX).map(([index, param]) => [param, Number(index)]),
);

/** Índice de pestaña para un ?tab=, o null si no hay/no es válido. Chat IA solo con acceso. */
export const tabIndexFromParam = (param: string | null, chatAllowed: boolean): number | null => {
	if (!param) return null;
	const index = INDEX_BY_TAB_PARAM[param];
	if (index === undefined) return null;
	if (index === 6 && !chatAllowed) return null;
	return index;
};

/** Sufijo de query para ir a otra carpeta conservando la pestaña (vacío en Información General). */
export const tabQuery = (tabParam?: string | null): string => (tabParam ? `?tab=${encodeURIComponent(tabParam)}` : "");

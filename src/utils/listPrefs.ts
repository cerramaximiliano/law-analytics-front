// Preferencias del listado de carpetas que sobreviven a entrar en una causa y volver (6/11/2026,
// pedido de Silvia): tamaño de página, orden y filtros. Viven en sessionStorage (por pestaña):
// no pisan nada entre usuarios ni entre días, y no hace falta borrarlas al salir.

export const FOLDERS_LIST_PREFS_KEY = "la.folders.list.v1";

export function readListPrefs<T extends object = Record<string, unknown>>(key: string): Partial<T> {
	try {
		const raw = typeof sessionStorage !== "undefined" ? sessionStorage.getItem(key) : null;
		if (!raw) return {};
		const parsed = JSON.parse(raw);
		return parsed && typeof parsed === "object" ? (parsed as Partial<T>) : {};
	} catch {
		return {};
	}
}

/** Mezcla `patch` sobre lo guardado (primer nivel). Silencioso si el navegador no permite guardar. */
export function writeListPrefs(key: string, patch: Record<string, unknown>): void {
	try {
		if (typeof sessionStorage === "undefined") return;
		const current = readListPrefs(key);
		sessionStorage.setItem(key, JSON.stringify({ ...current, ...patch }));
	} catch {
		/* sin almacenamiento: el listado sigue funcionando sin memoria */
	}
}

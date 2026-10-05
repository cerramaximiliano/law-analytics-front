// Seguimiento de las descargas de expediente en curso, para avisar cuando
// terminan aunque el usuario haya cerrado el modal o cambiado de pantalla.
//
// El modal (ExpedienteExportDialog) registra el job mientras está activo y lo
// quita al verlo terminar; GlobalExpedienteExportListener consulta los que
// quedan registrados y muestra el aviso. Vive en localStorage para sobrevivir
// a una recarga. Todo es por carpeta: hay a lo sumo un job activo por carpeta.

const STORAGE_KEY = "la_expediente_exports";
const OPEN_EVENT = "expedienteExport:open";
// Un job que no terminó en este tiempo se deja de seguir.
const MAX_AGE_MS = 6 * 60 * 60 * 1000;

export interface TrackedExport {
	folderId: string;
	folderName: string;
	jobId: string;
	at: number;
}

function read(): TrackedExport[] {
	try {
		const raw = window.localStorage.getItem(STORAGE_KEY);
		const list = raw ? JSON.parse(raw) : [];
		if (!Array.isArray(list)) return [];
		return list.filter((e) => e && e.folderId && e.jobId && Date.now() - (e.at || 0) < MAX_AGE_MS);
	} catch (_err) {
		return [];
	}
}

function write(list: TrackedExport[]): void {
	try {
		window.localStorage.setItem(STORAGE_KEY, JSON.stringify(list));
	} catch (_err) {
		// sin storage no hay aviso diferido; el modal sigue funcionando
	}
}

export function listTrackedExports(): TrackedExport[] {
	return read();
}

export function trackExport(folderId: string, folderName: string, jobId: string): void {
	const list = read().filter((e) => e.folderId !== folderId);
	list.push({ folderId, folderName, jobId, at: Date.now() });
	write(list);
}

export function untrackExport(folderId: string): void {
	write(read().filter((e) => e.folderId !== folderId));
}

// Carpetas con el modal abierto: ahí el progreso ya está a la vista y el
// listener global no consulta ni avisa.
const openFolders = new Set<string>();
export function markExportDialogOpen(folderId: string): void {
	openFolders.add(folderId);
}
export function markExportDialogClosed(folderId: string): void {
	openFolders.delete(folderId);
}
export function isExportDialogOpen(folderId: string): boolean {
	return openFolders.has(folderId);
}

// Abre el modal de descarga desde cualquier vista (lo monta el listener global).
export function openExpedienteExport(folderId: string, folderName?: string): void {
	window.dispatchEvent(new CustomEvent(OPEN_EVENT, { detail: { folderId, folderName: folderName || "" } }));
}

export function onOpenExpedienteExport(handler: (folder: { id: string; name: string }) => void): () => void {
	const listener = (e: Event) => {
		const detail = (e as CustomEvent).detail;
		if (detail?.folderId) handler({ id: detail.folderId, name: detail.folderName || "" });
	};
	window.addEventListener(OPEN_EVENT, listener);
	return () => window.removeEventListener(OPEN_EVENT, listener);
}

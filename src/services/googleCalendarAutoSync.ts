import axios from "utils/axios";

// ----------------------------------------------------------------------
// Sincronización automática de Google Calendar (server-side).
//
// A diferencia de googleCalendarService — que corre en el navegador con un
// access token de una hora —, esto habla con el hub, que guarda un refresh
// token y trae los eventos por cron aunque el usuario no abra la app.
// ----------------------------------------------------------------------

export interface AutoSyncStatus {
	syncEnabled: boolean;
	googleEmail?: string | null;
	lastSyncAt?: string | null;
	lastSyncStatus?: "success" | "error" | "never";
	lastSyncError?: string | null;
	lastSyncStats?: { imported: number; updated: number; cancelled: number };
	consecutiveFailures?: number;
}

const BASE = "/api/google-calendar";

/** Estado actual. Devuelve null si el usuario nunca autorizó el acceso offline. */
export async function getAutoSyncStatus(): Promise<AutoSyncStatus | null> {
	const { data } = await axios.get(`${BASE}/sync/status`, { withCredentials: true });
	return data?.autoSync ?? null;
}

/** URL de consentimiento de Google a la que hay que redirigir al usuario. */
export async function getAutoSyncAuthUrl(returnTo?: string): Promise<string> {
	const { data } = await axios.get(`${BASE}/oauth/url`, {
		params: returnTo ? { returnTo } : undefined,
		withCredentials: true,
	});
	if (!data?.url) throw new Error("El servidor no devolvió una URL de autorización");
	return data.url;
}

/** Enciende o apaga el cron sin perder el consentimiento. */
export async function setAutoSyncEnabled(syncEnabled: boolean): Promise<AutoSyncStatus> {
	const { data } = await axios.put(`${BASE}/sync/settings`, { syncEnabled }, { withCredentials: true });
	return data.autoSync;
}

/** Fuerza una sincronización inmediata del lado del servidor. */
export async function runAutoSyncNow(): Promise<{ imported: number; updated: number; cancelled: number }> {
	const { data } = await axios.post(`${BASE}/sync/run`, {}, { withCredentials: true });
	return data.stats;
}

/** Revoca la autorización offline (no borra los eventos ya importados). */
export async function revokeAutoSync(): Promise<void> {
	await axios.delete(`${BASE}/oauth`, { withCredentials: true });
}

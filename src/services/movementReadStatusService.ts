// Read-status per-usuario de movimientos sincronizados (MEV/SCBA/EJE).
// Mismo modelo de presencia que PJN (MovementReadStatus del server): los ids
// son _id de subdocumento (MEV/SCBA) o actId (EJE). Los sintéticos
// posicionales ("scba-*/eje-*") no se persisten.
import axios from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export async function getMovementsReadSet(movementIds: string[]): Promise<Set<string>> {
	if (!movementIds.length) return new Set();
	const res = await axios.post(`${BASE_URL}/api/movements/read-status/batch`, { movementIds });
	return new Set<string>(res.data?.readIds ?? []);
}

export async function setMovementReadStatus(movementId: string, folderId: string, read: boolean): Promise<boolean> {
	const res = await axios.put(`${BASE_URL}/api/movements/read-status/${encodeURIComponent(movementId)}`, { read, folderId });
	return Boolean(res.data?.success);
}

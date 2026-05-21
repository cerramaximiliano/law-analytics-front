import axios, { AxiosResponse } from "axios";

let pendingRefreshPromise: Promise<AxiosResponse> | null = null;

/**
 * Refresca el access token contra la API principal, deduplicando llamadas concurrentes.
 *
 * El dashboard suele disparar varios endpoints en paralelo al cargar; cuando todos
 * reciben 401, cada interceptor históricamente disparaba su propio POST refresh-token.
 * Con el wrapper, todos comparten la misma promesa en vuelo y el backend recibe
 * una sola llamada hasta que esa promesa se resuelve (o rechaza).
 */
export function refreshAccessToken(): Promise<AxiosResponse> {
	if (!pendingRefreshPromise) {
		pendingRefreshPromise = axios
			.post(`${import.meta.env.VITE_BASE_URL}/api/auth/refresh-token`, {}, { withCredentials: true })
			.finally(() => {
				pendingRefreshPromise = null;
			});
	}
	return pendingRefreshPromise;
}

import axios, { AxiosResponse } from "axios";
import secureStorage from "services/secureStorage";

let pendingRefreshPromise: Promise<AxiosResponse> | null = null;
let lastSuccessResponse: AxiosResponse | null = null;
let lastSuccessAt = 0;

// Ventana de cache post-éxito. Si llegan más requests al refresh dentro de
// este tiempo desde que el último refresh resolvió con éxito, reusan el
// resultado en lugar de pegarle al backend de nuevo.
//
// Motivo: cuando el dashboard tira 18 endpoints en paralelo y todos vuelven
// 401, cada interceptor llama a refreshAccessToken(). Si la primera resuelve
// rápido y libera el promise antes de que la segunda lo pida, se genera una
// segunda request al backend (y una tercera, cuarta, ...). Con cache corta
// el grupo entero comparte un solo refresh real.
const POST_SUCCESS_CACHE_MS = 3000;

/**
 * Refresca el access token contra la API principal, deduplicando llamadas concurrentes.
 *
 * El dashboard suele disparar varios endpoints en paralelo al cargar; cuando todos
 * reciben 401, cada interceptor históricamente disparaba su propio POST refresh-token.
 * Con el wrapper, todos comparten la misma promesa en vuelo y el backend recibe
 * una sola llamada hasta que esa promesa se resuelve (o rechaza).
 *
 * Fallback X-Refresh-Token: si secureStorage tiene un refresh token guardado
 * (login dev cross-origin donde la cookie httpOnly no llegó al browser), lo
 * enviamos también como header. El backend acepta ambos métodos.
 */
export function refreshAccessToken(): Promise<AxiosResponse> {
	// Cache corta: si el último refresh fue exitoso hace menos de N ms,
	// devolver ese resultado sin pegarle al backend.
	if (lastSuccessResponse && Date.now() - lastSuccessAt < POST_SUCCESS_CACHE_MS) {
		return Promise.resolve(lastSuccessResponse);
	}

	if (!pendingRefreshPromise) {
		const fallbackRefreshToken = secureStorage.getRefreshToken();
		const headers: Record<string, string> = {};
		if (fallbackRefreshToken) {
			headers["X-Refresh-Token"] = fallbackRefreshToken;
		}

		pendingRefreshPromise = axios
			.post(`${import.meta.env.VITE_BASE_URL}/api/auth/refresh-token`, {}, { withCredentials: true, headers })
			.then((response) => {
				lastSuccessResponse = response;
				lastSuccessAt = Date.now();
				return response;
			})
			.finally(() => {
				pendingRefreshPromise = null;
			});
	}
	return pendingRefreshPromise;
}

/**
 * Invalida el cache de refresh. Llamar desde logout o cuando el backend
 * indique que la sesión ya no es válida (ej. revoke).
 */
export function invalidateRefreshCache(): void {
	lastSuccessResponse = null;
	lastSuccessAt = 0;
	pendingRefreshPromise = null;
}

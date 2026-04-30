import axios from "axios";
import secureStorage from "services/secureStorage";

/**
 * Axios instance dedicada a la RAG API (ia.lawanalytics.app).
 *
 * - Agrega automáticamente el Bearer token de secureStorage en cada request.
 * - En caso de 401 intenta refrescar el token vía la API principal y reintenta
 *   una vez, replicando el comportamiento del interceptor de ServerContext para
 *   la API principal.
 */
const ragAxios = axios.create({
	baseURL: import.meta.env.VITE_RAG_URL,
	withCredentials: true,
	headers: { "Content-Type": "application/json" },
});

ragAxios.interceptors.request.use((config) => {
	const token = secureStorage.getAuthToken();
	if (token) config.headers.Authorization = `Bearer ${token}`;
	return config;
});

ragAxios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config as any;
		const status = error.response?.status;
		const responseData = error.response?.data as any;

		// Manejar 429 (límite mensual IA) y 403 (feature no disponible) con upgradeRequired
		if ((status === 429 || status === 403) && (responseData?.upgradeRequired || responseData?.upgrade)) {
			window.dispatchEvent(
				new CustomEvent("ragPlanLimitReached", {
					detail: {
						message: responseData.message || responseData.error || "Límite de consultas IA alcanzado",
						limitInfo: responseData.limitInfo ?? null,
						featureInfo: responseData.featureInfo ?? null,
						upgradeRequired: true,
					},
				}),
			);
			return Promise.reject(error);
		}

		if (status !== 401 || originalRequest?._retried) {
			return Promise.reject(error);
		}

		originalRequest._retried = true;

		try {
			// Refresca el token vía la API principal; el interceptor de ServerContext
			// actualiza secureStorage con el nuevo JWT al completarse.
			await axios.post(`${import.meta.env.VITE_BASE_URL}/api/auth/refresh-token`);

			// Actualizar el header con el token recién obtenido y reintentar
			const freshToken = secureStorage.getAuthToken();
			if (freshToken) originalRequest.headers.Authorization = `Bearer ${freshToken}`;
			return ragAxios(originalRequest);
		} catch {
			return Promise.reject(error);
		}
	},
);

export default ragAxios;

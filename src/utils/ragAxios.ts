import axios from "axios";
import secureStorage from "services/secureStorage";
import { refreshAccessToken } from "utils/refreshToken";

/**
 * Axios instance dedicada a la RAG API (ia.lawanalytics.app).
 *
 * - Agrega automáticamente el Bearer token de secureStorage en cada request.
 * - En caso de 401 intenta refrescar el token vía la API principal y reintenta
 *   una vez, replicando el comportamiento del interceptor de ServerContext para
 *   la API principal.
 */
const ragAxios = axios.create({
	// Fallback defensivo: si VITE_RAG_URL falta en el env del build (pasó en
	// prod 2026-08-20 — las requests salían relativas a lawanalytics.app y
	// nginx devolvía 405), apuntar directo a la RAG API de producción.
	baseURL: import.meta.env.VITE_RAG_URL || "https://ia.lawanalytics.app",
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

		// Manejar 429 (límite mensual IA) y 403 (feature no disponible) con upgradeRequired.
		// Los requests que manejan el límite por su cuenta (p.ej. la vista de
		// jurisprudencia, que abre su propio LimitErrorModal con featureInfo)
		// pasan `skipPlanLimitEvent: true` en el config para que no se abra
		// TAMBIÉN el modal global de ServerContext (doble modal).
		if (
			(status === 429 || status === 403) &&
			(responseData?.upgradeRequired || responseData?.upgrade) &&
			!originalRequest?.skipPlanLimitEvent
		) {
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
			// Dedup compartida con el resto de interceptors (utils/refreshToken.ts).
			await refreshAccessToken();

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

import axios, { AxiosError, AxiosInstance } from "axios";
import authTokenService from "services/authTokenService";
import Cookies from "js-cookie";
import { refreshAccessToken } from "utils/refreshToken";

// Subdominio prod: pjmendoza.lawanalytics.app.
const PJMENDOZA_BASE_URL = import.meta.env.VITE_PJMENDOZA_URL || "https://pjmendoza.lawanalytics.app";

// Instancia propia de axios contra pjmendoza-api (mismo patrón que EJE y MEV:
// el hub no proxea estas lecturas).
const pjmendozaAxios: AxiosInstance = axios.create({
	baseURL: PJMENDOZA_BASE_URL,
	timeout: 30000,
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
	},
});

pjmendozaAxios.interceptors.request.use(
	(config) => {
		const sources = {
			authService: authTokenService.getToken(),
			serviceToken: localStorage.getItem("serviceToken"),
			token: localStorage.getItem("token"),
			cookie: Cookies.get("auth_token"),
		};

		const token = sources.cookie || sources.authService || sources.serviceToken || sources.token;

		if (token && config.headers) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		return config;
	},
	(error) => Promise.reject(error),
);

pjmendozaAxios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				// El refresh se hace contra la API principal (dedup compartida).
				const mainRefreshResponse = await refreshAccessToken();

				if (mainRefreshResponse.status === 200) {
					const sources = {
						authService: authTokenService.getToken(),
						serviceToken: localStorage.getItem("serviceToken"),
						token: localStorage.getItem("token"),
						cookie: Cookies.get("auth_token"),
					};
					const newToken = sources.cookie || sources.authService || sources.serviceToken || sources.token;

					if (newToken && originalRequest.headers) {
						originalRequest.headers.Authorization = `Bearer ${newToken}`;
					}

					return pjmendozaAxios(originalRequest);
				}
			} catch (refreshError) {
				console.error("PJ Salta API - No se pudo refrescar el token", refreshError);
			}
		}

		return Promise.reject(error);
	},
);

export interface PjMendozaCausaResponse {
	success: boolean;
	message?: string;
	data?: any;
}

class PjMendozaWorkersService {
	/**
	 * Busca una causa ya cargada en el sistema por CUIJ.
	 *
	 * Sirve como preview antes de crear la carpeta, pero NO es el camino de
	 * alta: eso lo hace `POST /api/folders` del hub con `pjmendoza: true`, que
	 * además dispara la verificación por el worker.
	 *
	 * Un CUIJ puede tener varios incidentes (EXP / PPA / XL2) y este endpoint
	 * devuelve el primero que no sea pivote; si hay más de uno la elección
	 * real la resuelve el flujo de pivotes.
	 */
	async searchCausaByCuij(cuij: string): Promise<PjMendozaCausaResponse> {
		try {
			const response = await pjmendozaAxios.get(`/api/causas/cuij/${encodeURIComponent(cuij)}`);
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<any>;

			if (axiosError.response?.status === 401) {
				throw new Error("Sesión expirada. Iniciá sesión de nuevo.");
			}
			if (axiosError.response?.status === 404) {
				// No es un error: la causa todavía no está en el sistema.
				return { success: false, message: "La causa no está cargada todavía" };
			}
			throw new Error(axiosError.response?.data?.message || "Error al buscar la causa en PJ Salta");
		}
	}

	/**
	 * Valida el formato del CUIJ de Salta: XX-XXXXXXXX-X (ej. 17-00959839-0).
	 *
	 * A diferencia de EJE, acá el formato es estricto y conocido, así que se
	 * valida de verdad en lugar de aceptar cualquier cosa alfanumérica.
	 */
	validateCuij(cuij: string): { valid: boolean; error?: string } {
		if (!cuij || cuij.trim() === "") {
			return { valid: false, error: "El CUIJ es requerido" };
		}

		const normalized = cuij.trim();

		if (!/^\d{2}-\d{8}-\d$/.test(normalized)) {
			return { valid: false, error: "El CUIJ debe tener el formato 13-08172120-8" };
		}

		return { valid: true };
	}

	/**
	 * Valida número y año de expediente.
	 *
	 * El portal muestra el año con 2 o 4 dígitos ("959839/26", "651645/2018")
	 * y acepta ambos, así que la UI también.
	 */
	validateExpediente(numero: string, anio: string): { valid: boolean; errors: { numero?: string; anio?: string } } {
		const errors: { numero?: string; anio?: string } = {};

		if (!numero || numero.trim() === "") {
			errors.numero = "El número de expediente es requerido";
		} else if (!/^\d+$/.test(numero.trim())) {
			errors.numero = "El número debe ser sólo dígitos";
		}

		if (!anio || anio.trim() === "") {
			errors.anio = "El año es requerido";
		} else {
			const raw = anio.trim();
			const currentYear = new Date().getFullYear();

			if (!/^\d{2}$|^\d{4}$/.test(raw)) {
				errors.anio = "El año debe tener 2 o 4 dígitos (ej. 26 o 2026)";
			} else {
				const anioNumber = raw.length === 2 ? 2000 + parseInt(raw, 10) : parseInt(raw, 10);
				if (anioNumber < 1990 || anioNumber > currentYear) {
					errors.anio = `El año debe estar entre 1990 y ${currentYear}`;
				}
			}
		}

		return {
			valid: Object.keys(errors).length === 0,
			errors,
		};
	}
}

export default new PjMendozaWorkersService();

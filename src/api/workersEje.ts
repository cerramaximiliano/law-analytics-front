import axios, { AxiosError, AxiosInstance } from "axios";
import authTokenService from "services/authTokenService";
import Cookies from "js-cookie";

const EJE_BASE_URL = import.meta.env.VITE_EJE_URL || "https://eje.lawanalytics.app";

// Crear una instancia separada de axios para EJE
const ejeAxios: AxiosInstance = axios.create({
	baseURL: EJE_BASE_URL,
	timeout: 30000,
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
	},
});

// Interceptor para agregar el token a todas las peticiones
ejeAxios.interceptors.request.use(
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
	(error) => {
		return Promise.reject(error);
	},
);

// Interceptor para manejar errores de respuesta
ejeAxios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				// Intentar refrescar el token en la API principal
				const mainRefreshResponse = await axios.post(
					`${import.meta.env.VITE_BASE_URL}/api/auth/refresh-token`,
					{},
					{ withCredentials: true },
				);

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

					return ejeAxios(originalRequest);
				}
			} catch (refreshError) {
				console.error("EJE API Authentication error - Unable to refresh token", refreshError);
			}
		}

		return Promise.reject(error);
	},
);

// Tipos para EJE
export interface EjeCausaResponse {
	success: boolean;
	message?: string;
	data?: {
		causa?: any;
		causas?: any[];
		isPivot?: boolean;
	};
}

export interface CreateFolderEjeRequest {
	userId: string;
	groupId?: string;
	searchType: "cuij" | "expediente";
	cuij?: string;
	numero?: string;
	anio?: string;
}

export interface CreateFolderEjeResponse {
	success: boolean;
	message?: string;
	folder?: any;
	causa?: any;
}

class EJEWorkersService {
	/**
	 * Busca una causa EJE por CUIJ o número/año
	 */
	async searchCausa(params: {
		searchType: "cuij" | "expediente";
		cuij?: string;
		numero?: string;
		anio?: string;
	}): Promise<EjeCausaResponse> {
		try {
			const response = await ejeAxios.get("/api/causas-eje/search", {
				params: {
					searchType: params.searchType,
					...(params.searchType === "cuij" ? { cuij: params.cuij } : { numero: params.numero, anio: params.anio }),
				},
			});
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<any>;

			if (axiosError.response?.status === 401) {
				throw new Error("Error de autenticación. Por favor, inicie sesión nuevamente.");
			}

			if (axiosError.response?.status === 404) {
				throw new Error("No se encontró la causa solicitada.");
			}

			throw new Error(axiosError.response?.data?.message || "Error al buscar la causa EJE");
		}
	}

	/**
	 * Valida el formato de un CUIJ
	 */
	validateCuij(cuij: string): { valid: boolean; error?: string } {
		if (!cuij || cuij.trim() === "") {
			return { valid: false, error: "El CUIJ es requerido" };
		}

		// Formato CUIJ: J-01-00053687-9/2020-0 o similar
		// Patrón flexible para diferentes formatos de CUIJ
		const cuijPattern = /^[A-Z]-\d{2}-\d{8}-\d\/\d{4}-\d$/i;
		const simplifiedPattern = /^[A-Z0-9\/-]+$/i;

		if (!simplifiedPattern.test(cuij.trim())) {
			return { valid: false, error: "El formato del CUIJ no es válido" };
		}

		return { valid: true };
	}

	/**
	 * Valida número y año de expediente
	 */
	validateExpediente(numero: string, anio: string): { valid: boolean; errors: { numero?: string; anio?: string } } {
		const errors: { numero?: string; anio?: string } = {};

		if (!numero || numero.trim() === "") {
			errors.numero = "El número de expediente es requerido";
		}

		if (!anio || anio.trim() === "") {
			errors.anio = "El año es requerido";
		} else {
			const currentYear = new Date().getFullYear();
			const anioNumber = parseInt(anio);

			if (anio.length !== 4) {
				errors.anio = "El año debe tener 4 dígitos";
			} else if (anioNumber < 2000 || anioNumber > currentYear) {
				errors.anio = `El año debe estar entre 2000 y ${currentYear}`;
			}
		}

		return {
			valid: Object.keys(errors).length === 0,
			errors,
		};
	}
}

export default new EJEWorkersService();

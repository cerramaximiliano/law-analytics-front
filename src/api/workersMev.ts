import axios, { AxiosError, AxiosInstance } from "axios";
import authTokenService from "services/authTokenService";
import Cookies from "js-cookie";

const MEV_BASE_URL = import.meta.env.VITE_MEV_URL || "https://mev.lawanalytics.app";

// Crear una instancia separada de axios para MEV que no use los interceptores globales
const mevAxios: AxiosInstance = axios.create({
	baseURL: MEV_BASE_URL,
	timeout: 30000,
	withCredentials: true,
	headers: {
		"Content-Type": "application/json",
		Accept: "application/json",
	},
});

// Interceptor para agregar el token a todas las peticiones
mevAxios.interceptors.request.use(
	(config) => {
		// Buscar el token en todos los lugares posibles
		const sources = {
			authService: authTokenService.getToken(),
			serviceToken: localStorage.getItem("serviceToken"),
			token: localStorage.getItem("token"),
			cookie: Cookies.get("auth_token"),
		};

		// Prioridad: cookie > authService > localStorage
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

// Función para refrescar el token
const refreshToken = async () => {
	try {
		// Buscar el refresh token en localStorage
		const storedRefreshToken = localStorage.getItem("refreshToken") || localStorage.getItem("refresh_token");

		if (!storedRefreshToken) {
			throw new Error("No refresh token available");
		}

		const response = await axios.post(
			`${MEV_BASE_URL}/api/auth/refresh-token`,
			{ refreshToken: storedRefreshToken },
			{
				headers: {
					"Content-Type": "application/json",
				},
			},
		);

		if (response.data?.token) {
			// Actualizar el token en localStorage y cookies
			const newToken = response.data.token;
			localStorage.setItem("serviceToken", newToken);
			localStorage.setItem("token", newToken);
			authTokenService.setToken(newToken);

			// Si viene un nuevo refresh token, actualizarlo también
			if (response.data.refreshToken) {
				localStorage.setItem("refreshToken", response.data.refreshToken);
			}

			return newToken;
		}

		throw new Error("Failed to refresh token");
	} catch (error) {
		console.error("Error refreshing token:", error);
		throw error;
	}
};

// Interceptor para manejar errores de respuesta y needRefresh
mevAxios.interceptors.response.use(
	async (response) => {
		// Verificar si la respuesta tiene needRefresh: true
		if (response.data?.needRefresh === true) {
			try {
				// Primero intentar refrescar el token en la API principal
				console.log("MEV API indicates needRefresh, triggering main API token refresh...");
				const mainRefreshResponse = await axios.post(
					`${import.meta.env.VITE_BASE_URL}/api/auth/refresh-token`,
					{},
					{ withCredentials: true },
				);

				if (mainRefreshResponse.status === 200) {
					// Token principal refrescado exitosamente
					// NO intentar refrescar MEV por separado, solo usar el token actualizado
					console.log("Main API token refreshed successfully");

					// Reintentar la petición original con el nuevo token
					const originalRequest = response.config;

					// Obtener el nuevo token (que ya debería estar actualizado por el interceptor de la API principal)
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

					// Reintentar la petición
					return mevAxios(originalRequest);
				}
			} catch (error) {
				console.error("Failed to refresh main API token:", error);
				// Si falla el refresh, continuar con la respuesta original
				return response;
			}
		}

		return response;
	},
	async (error) => {
		const originalRequest = error.config;

		// Si es error 401 y no hemos intentado refrescar aún
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			// Verificar si MEV indica que necesita refresh
			const needsRefresh = error.response?.data?.needRefresh === true;

			if (needsRefresh) {
				try {
					// Primero refrescar el token en la API principal
					console.log("MEV API 401 with needRefresh, triggering main API token refresh...");
					const mainRefreshResponse = await axios.post(
						`${import.meta.env.VITE_BASE_URL}/api/auth/refresh-token`,
						{},
						{ withCredentials: true },
					);

					if (mainRefreshResponse.status === 200) {
						// Token principal refrescado exitosamente
						// NO intentar refrescar MEV por separado, solo usar el token actualizado
						console.log("Main API token refreshed successfully");

						// Obtener el nuevo token (que ya debería estar actualizado por el interceptor de la API principal)
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

						// Reintentar la petición con el token actualizado
						return mevAxios(originalRequest);
					}
				} catch (refreshError) {
					console.error("MEV API Authentication error - Unable to refresh main API token", refreshError);
				}
			}

			// Si no es needRefresh o falló el refresh principal, intentar solo con MEV
			try {
				await refreshToken();

				// Obtener el nuevo token
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

				// Reintentar la petición
				return mevAxios(originalRequest);
			} catch (refreshError) {
				console.error("MEV API Authentication error - Unable to refresh token");
				// Si falla el refresh, rechazar con el error original
				return Promise.reject(error);
			}
		}

		return Promise.reject(error);
	},
);

export interface NavigationCode {
	_id: string;
	code: string;
	jurisdiccion: {
		codigo: string;
		nombre: string;
	};
	organismo: {
		codigo: string;
		nombre: string;
	};
	tipo: string;
	descripcion: string;
	navegacion: {
		requiresRadio: boolean;
		radioValue: string | null;
		jurisdiccionValue: string;
		organismoValue: string;
	};
	activo: boolean;
	fechaCreacion?: string;
	fechaActualizacion?: string;
	stats?: {
		vecesUsado: number;
		ultimoUso: string;
		exitosos: number;
		fallidos: number;
	};
}

export interface NavigationCodesResponse {
	success: boolean;
	data: {
		codes: NavigationCode[];
		pagination: {
			total: number;
			page: number;
			limit: number;
			pages: number;
		};
	};
}

class MEVWorkersService {
	async getNavigationCodes(): Promise<NavigationCodesResponse> {
		try {
			// Los interceptores ya manejan la autenticación automáticamente
			const response = await mevAxios.get("/api/navigation-codes/", {
				params: {
					limit: 1000, // Obtener todos los códigos disponibles
				},
			});
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<any>;

			if (axiosError.response?.status === 401) {
				throw new Error("Error de autenticación. Por favor, inicie sesión nuevamente.");
			}

			if (axiosError.response?.status === 404) {
				throw new Error("El servicio de códigos de navegación no está disponible.");
			}

			throw new Error(axiosError.response?.data?.message || "Error al obtener códigos de navegación");
		}
	}
}

export default new MEVWorkersService();

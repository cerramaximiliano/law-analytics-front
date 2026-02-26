import axios from "axios";

// Configuración base de axios
const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

// Crear instancia de axios con configuración por defecto
const axiosInstance = axios.create({
	baseURL,
	timeout: 30000,
	withCredentials: true, // Send cookies with requests
	headers: {
		"Content-Type": "application/json",
	},
});

// Interceptor para agregar token si existe
axiosInstance.interceptors.request.use(
	(config) => {
		const token = localStorage.getItem("token");
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
		}
		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// Rutas que no deben redirigir a login en caso de 401
const publicRoutes = [
	"/teams/invitation",
	"/auth/",
	"/login",
	"/register",
];

// Endpoints que no deben causar redirección a login
const silentAuthEndpoints = [
	"/api/auth/me",
	"/api/groups/invitations/verify",
	"/api/groups/invitations/accept",
	"/api/groups/invitations/decline",
];

// Interceptor para manejar errores
axiosInstance.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			const currentPath = window.location.pathname;
			const requestUrl = error.config?.url || "";

			// No redirigir si estamos en una ruta pública
			const isPublicRoute = publicRoutes.some((route) => currentPath.startsWith(route));

			// No redirigir si el endpoint es de verificación silenciosa
			const isSilentEndpoint = silentAuthEndpoints.some((endpoint) => requestUrl.includes(endpoint));

			if (!isPublicRoute && !isSilentEndpoint) {
				// Token expirado o inválido - redirigir a login
				localStorage.removeItem("token");
				window.location.href = "/login";
			}
		}
		return Promise.reject(error);
	},
);

export default axiosInstance;

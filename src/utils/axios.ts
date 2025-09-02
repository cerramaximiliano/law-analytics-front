import axios from "axios";

// Configuración base de axios
const baseURL = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

// Crear instancia de axios con configuración por defecto
const axiosInstance = axios.create({
	baseURL,
	timeout: 30000,
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

// Interceptor para manejar errores
axiosInstance.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401) {
			// Token expirado o inválido
			localStorage.removeItem("token");
			window.location.href = "/login";
		}
		return Promise.reject(error);
	},
);

export default axiosInstance;

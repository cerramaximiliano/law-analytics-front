import axios from "axios";

// Creamos una instancia de axios específica para el servicio de usuarios
const userApi = axios.create({
	baseURL: process.env.REACT_APP_BASE_URL || "http://localhost:3010/",
	withCredentials: true, // Importante: enviar cookies con cada petición
});

// Añadimos interceptores para manejar errores
userApi.interceptors.response.use(
	(response) => response,
	(error) => {
		// Redirigir al login si el token ha expirado
		if (error.response?.status === 401 && !window.location.href.includes("/login")) {
			window.location.pathname = "/login";
		}
		return Promise.reject((error.response && error.response.data) || "Error en el servicio de usuarios");
	},
);

export default userApi;

import axios from "axios";

// Creamos una instancia de axios específica para el servicio de usuarios
const userApi = axios.create({
	baseURL: import.meta.env.VITE_BASE_URL || "http://localhost:3010/",
	withCredentials: true, // Importante: enviar cookies con cada petición
});

// Rutas públicas que no deben redirigir a login
const publicRoutes = ["/teams/invitation", "/auth/", "/login", "/register"];

// Añadimos interceptores para manejar errores
userApi.interceptors.response.use(
	(response) => response,
	(error) => {
		// Redirigir al login si el token ha expirado (excepto en rutas públicas)
		if (error.response?.status === 401) {
			const currentPath = window.location.pathname;
			const isPublicRoute = publicRoutes.some((route) => currentPath.startsWith(route));

			if (!isPublicRoute && !window.location.href.includes("/login")) {
				window.location.pathname = "/login";
			}
		}
		return Promise.reject((error.response && error.response.data) || "Error en el servicio de usuarios");
	},
);

export default userApi;

import axios from "axios";
import { dispatch } from "store"; // Importa el store si usas Redux
//import { logoutUser } from "store/reducers/auth";
import { openSnackbar } from "store/reducers/snackbar";

const apiClient = axios.create({
	baseURL: process.env.REACT_APP_BASE_URL,
	headers: {
		"Content-Type": "application/json",
	},
});

// Interceptor para manejar respuestas
apiClient.interceptors.response.use(
	(response) => response,
	(error) => {
		console.log(error);
		if (error.response?.status === 401) {
			console.log(error.response.status);
			// Token expirado o sesión no válida
			//store.dispatch(logoutUser());
			dispatch(
				openSnackbar({
					open: true,
					message: "Tu sesión ha expirado. Por favor, vuelve a iniciar sesión.",
					variant: "alert",
					alert: { color: "warning" },
					close: true,
				}),
			);
		}
		return Promise.reject(error);
	},
);

export default apiClient;

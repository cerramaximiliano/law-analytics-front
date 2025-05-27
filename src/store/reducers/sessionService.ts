// services/sessionService.ts
import axios from "axios";

const API_URL = process.env.REACT_APP_BASE_URL || "http://localhost:5000";

// Definiciones de tipos
export interface SessionData {
	deviceId: string;
	deviceName: string;
	deviceType: string;
	browser: string;
	os: string;
	lastActivity: Date | string;
	location?: string;
	isCurrentSession: boolean;
	ip?: string;
}

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	message?: string;
	requireLogin?: boolean;
}

// Define la estructura de los datos de error de la API
interface ApiErrorResponse {
	message?: string;
	success?: boolean;
	requireLogin?: boolean;
	accountDeactivated?: boolean; // Añadida esta propiedad
}

interface UpdateSessionData {
	location?: string;
	lastActivity?: Date;
	[key: string]: any;
}

interface DeactivateAccountRequest {
	password: string;
	reason?: string;
}

// Interfaz para la petición de reactivación de cuenta
interface ReactivateAccountRequest {
	email: string;
	password: string;
}

/**
 * Servicio para gestionar las sesiones activas
 */
class SessionService {
	/**
	 * Obtiene todas las sesiones activas del usuario
	 */
	async getActiveSessions(): Promise<ApiResponse<SessionData[]>> {
		try {
			const response = await axios.get<ApiResponse<SessionData[]>>(`${API_URL}/api/sessions`, {
				withCredentials: true,
			});
			return response.data;
		} catch (error: unknown) {
			const errorMessage = this.getErrorMessage(error, "Error al obtener las sesiones");
			throw new Error(errorMessage);
		}
	}

	/**
	 * Termina una sesión específica por su ID de dispositivo
	 * @param deviceId - ID del dispositivo a terminar
	 */
	async terminateSession(deviceId: string): Promise<ApiResponse> {
		try {
			const response = await axios.delete<ApiResponse>(`${API_URL}/api/sessions/${deviceId}`, {
				withCredentials: true,
			});
			return response.data;
		} catch (error: unknown) {
			const errorMessage = this.getErrorMessage(error, "Error al terminar la sesión");
			throw new Error(errorMessage);
		}
	}

	/**
	 * Termina todas las sesiones excepto la actual
	 */
	async terminateAllOtherSessions(): Promise<ApiResponse> {
		try {
			const response = await axios.delete<ApiResponse>(`${API_URL}/api/sessions`, {
				withCredentials: true,
			});
			return response.data;
		} catch (error: unknown) {
			const errorMessage = this.getErrorMessage(error, "Error al terminar las sesiones");
			throw new Error(errorMessage);
		}
	}

	/**
	 * Actualiza la información de la sesión actual
	 * @param data - Datos para actualizar (como ubicación)
	 */
	async updateCurrentSession(data: UpdateSessionData): Promise<ApiResponse> {
		try {
			const response = await axios.patch<ApiResponse>(`${API_URL}/api/sessions/current`, data, {
				withCredentials: true,
			});
			return response.data;
		} catch (error: unknown) {
			const errorMessage = this.getErrorMessage(error, "Error al actualizar la sesión");
			throw new Error(errorMessage);
		}
	}

	/**
	 * Desactiva la cuenta del usuario actual (soft delete)
	 * @param data - Datos para la desactivación, incluida la contraseña para confirmación
	 */
	async deactivateAccount(data: DeactivateAccountRequest): Promise<ApiResponse> {
		try {
			const response = await axios.post<ApiResponse>(`${API_URL}/api/auth/deactivate-account`, data, {
				withCredentials: true,
			});
			return response.data;
		} catch (error: unknown) {
			const errorMessage = this.getErrorMessage(error, "Error al desactivar la cuenta");
			throw new Error(errorMessage);
		}
	}

	/**
	 * Reactiva una cuenta previamente desactivada
	 * @param data - Credenciales para reactivar la cuenta
	 */
	async reactivateAccount(data: ReactivateAccountRequest): Promise<ApiResponse> {
		try {
			const response = await axios.post<ApiResponse>(`${API_URL}/api/auth/reactivate-account`, data);
			return response.data;
		} catch (error: unknown) {
			const errorMessage = this.getErrorMessage(error, "Error al reactivar la cuenta");
			throw new Error(errorMessage);
		}
	}

	/**
	 * Detecta y envía la ubicación aproximada del usuario
	 * Nota: Depende del navegador y los permisos del usuario
	 */
	async sendLocationInfo(): Promise<void> {
		if (!navigator.geolocation) {
			return;
		}

		try {
			navigator.geolocation.getCurrentPosition(async (position) => {
				const { latitude, longitude } = position.coords;

				// Opcional: convertir coordenadas a nombre de ubicación usando un servicio de geocodificación
				// Aquí simplemente enviamos las coordenadas
				await this.updateCurrentSession({
					location: `${latitude.toFixed(2)}, ${longitude.toFixed(2)}`,
				});
			});
		} catch (error) {}
	}

	/**
	 * Comprueba si una respuesta de error indica que la cuenta está desactivada
	 * @param error - El error a comprobar
	 */
	isAccountDeactivatedError(error: unknown): boolean {
		if (axios.isAxiosError(error)) {
			const errorData = error.response?.data as ApiErrorResponse | undefined;
			return errorData?.accountDeactivated === true;
		}
		return false;
	}

	/**
	 * Obtiene el mensaje de error de una respuesta de Axios
	 * @param error - El error capturado
	 * @param defaultMessage - Mensaje por defecto si no se puede determinar el error
	 */
	private getErrorMessage(error: unknown, defaultMessage: string): string {
		if (axios.isAxiosError(error)) {
			// Especificamos el tipo de data para evitar errores de TypeScript
			const errorData = error.response?.data as ApiErrorResponse | undefined;
			return errorData?.message || defaultMessage;
		}
		return defaultMessage;
	}
}

const sessionService = new SessionService();
export default sessionService;

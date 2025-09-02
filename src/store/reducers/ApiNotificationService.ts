import axios from "axios";

const API_BASE_URL = import.meta.env.VITE_BASE_URL; // Ajusta esto según tu configuración

// Definiciones de tipos
export interface NotificationPreferences {
	enabled: boolean;
	channels?: {
		email: boolean;
		browser: boolean;
		mobile: boolean;
	};
	user: {
		enabled: boolean;
		calendar: boolean;
		expiration: boolean;
		inactivity: boolean;
	};
	system: {
		enabled: boolean;
		alerts: boolean;
		news: boolean;
		userActivity: boolean;
	};
	otherCommunications?: boolean;
	loginAlerts?: boolean;
}

export interface ApiResponse<T = any> {
	success: boolean;
	data?: T;
	message?: string;
}

// Clase de servicio de notificaciones
class NotificationServiceClass {
	/**
	 * Obtiene las preferencias de notificaciones del usuario
	 */
	static async getNotificationPreferences(): Promise<ApiResponse<NotificationPreferences>> {
		try {
			const response = await axios.get(`${API_BASE_URL}/api/notifications/preferences`, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw error;
		}
	}

	/**
	 * Actualiza las preferencias de notificaciones del usuario
	 * @param preferences - Las nuevas preferencias de notificaciones
	 */
	static async updateNotificationPreferences(preferences: Partial<NotificationPreferences>): Promise<ApiResponse<NotificationPreferences>> {
		try {
			const response = await axios.put(`${API_BASE_URL}/api/notifications/preferences`, preferences, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw error;
		}
	}

	/**
	 * Recupera el conteo de notificaciones no leídas
	 */
	static async getUnreadNotificationCount(): Promise<ApiResponse<{ count: number }>> {
		try {
			const response = await axios.get(`${API_BASE_URL}/api/notifications/unread/count`, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			throw error;
		}
	}

	/**
	 * Marca una notificación como leída
	 * @param notificationId - ID de la notificación a marcar como leída
	 */
	static async markNotificationAsRead(notificationId: string): Promise<ApiResponse<void>> {
		try {
			const response = await axios.patch(
				`${API_BASE_URL}/api/notifications/${notificationId}/read`,
				{},
				{
					withCredentials: true,
				},
			);
			return response.data;
		} catch (error) {
			throw error;
		}
	}

	/**
	 * Marca todas las notificaciones del usuario como leídas
	 */
	static async markAllNotificationsAsRead(): Promise<ApiResponse<void>> {
		try {
			const response = await axios.patch(
				`${API_BASE_URL}/api/notifications/read-all`,
				{},
				{
					withCredentials: true,
				},
			);
			return response.data;
		} catch (error) {
			throw error;
		}
	}
}

export default NotificationServiceClass;

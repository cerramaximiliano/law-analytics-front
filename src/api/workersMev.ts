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
		'Content-Type': 'application/json',
		'Accept': 'application/json'
	}
});


export interface MEVWorkerConfig {
	_id: string;
	worker_id: string;
	jurisdiccion: string;
	tipo_organismo: string;
	verification_mode: string;
	last_check?: string;
	documents_verified?: number;
	documents_valid?: number;
	documents_invalid?: number;
	documents_not_found?: number;
	enabled: boolean;
	batch_size: number;
	delay_between_searches: number;
	max_retries: number;
	login?: {
		username: string;
		password: string;
		lastPasswordChange?: string;
		passwordExpiryWarningShown?: boolean;
	};
	statistics?: {
		total_searches?: number;
		successful_searches?: number;
		failed_searches?: number;
		last_error?: string;
		last_error_date?: string;
		consecutive_failures?: number;
		uptime_hours?: number;
		last_success_date?: string;
	};
	settings?: {
		headless?: boolean;
		timeout_seconds?: number;
		navigation_timeout?: number;
		page_load_timeout?: number;
		use_stealth?: boolean;
		viewport_width?: number;
		viewport_height?: number;
	};
	notification?: {
		email?: string;
		send_on_error?: boolean;
		send_daily_report?: boolean;
		send_password_expiry_alert?: boolean;
		error_threshold?: number;
	};
	schedule?: {
		cron_pattern?: string;
		timezone?: string;
		active_hours?: {
			start: number;
			end: number;
		};
		skip_weekends?: boolean;
	};
	createdAt?: string;
	updatedAt?: string;
}

export interface MEVWorkersResponse {
	success: boolean;
	data: MEVWorkerConfig[];
}

export interface SystemConfig {
	_id: string;
	userId: string;
	key: string;
	value: any;
	dataType: 'string' | 'number' | 'boolean' | 'date' | 'json';
	description: string;
	category: string;
	isEncrypted: boolean;
	metadata?: {
		createdBy?: string;
		updatedBy?: string;
		lastModifiedReason?: string;
	};
	createdAt?: string;
	updatedAt?: string;
}

export interface SystemConfigResponse {
	success: boolean;
	data: SystemConfig[];
}

class MEVWorkersService {
	private getAuthHeaders() {
		// Buscar el token en todos los lugares posibles
		const sources = {
			authService: authTokenService.getToken(),
			serviceToken: localStorage.getItem("serviceToken"),
			token: localStorage.getItem("token"),
			cookie: Cookies.get("auth_token")
		};

		// Prioridad: cookie > authService > localStorage
		const token = sources.cookie || sources.authService || sources.serviceToken || sources.token;

		if (!token) {
			// Devolver headers vacíos, la cookie auth_token se enviará automáticamente con withCredentials
			return {
				"Content-Type": "application/json",
			};
		}

		return {
			Authorization: `Bearer ${token}`,
			"Content-Type": "application/json",
		};
	}

	async getVerificationConfigs(): Promise<MEVWorkersResponse> {
		try {
			const headers = this.getAuthHeaders();
			const response = await mevAxios.get("/api/config/verification", {
				headers
			});
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<any>;
			// Si es error 401, dar mensaje más claro
			if (axiosError.response?.status === 401) {
				throw new Error("Error de autenticación. Por favor, inicie sesión nuevamente.");
			}

			throw new Error(axiosError.response?.data?.message || "Error al obtener configuraciones de verificación");
		}
	}

	async updateVerificationConfig(workerId: string, data: Partial<MEVWorkerConfig>): Promise<any> {
		try {
			const response = await mevAxios.put(`/api/config/verification/${workerId}`, data, {
				headers: this.getAuthHeaders()
			});
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<any>;
			throw new Error(axiosError.response?.data?.message || "Error al actualizar configuración");
		}
	}

	async toggleVerificationConfig(workerId: string): Promise<any> {
		try {
			const response = await mevAxios.patch(`/api/config/verification/${workerId}/toggle`, {}, {
				headers: this.getAuthHeaders()
			});
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<any>;
			throw new Error(axiosError.response?.data?.message || "Error al cambiar estado del worker");
		}
	}

	async getSystemConfigs(userId?: string): Promise<SystemConfigResponse> {
		try {
			const headers = this.getAuthHeaders();
			const params = userId ? { userId } : {};
			const response = await mevAxios.get("/api/config/system", {
				headers,
				params
			});
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<any>;
			// Si es error 401, dar mensaje más claro
			if (axiosError.response?.status === 401) {
				throw new Error("Error de autenticación. Por favor, inicie sesión nuevamente.");
			}
			throw new Error(axiosError.response?.data?.message || "Error al obtener configuraciones del sistema");
		}
	}

	async updateSystemConfig(configId: string, data: Partial<SystemConfig>): Promise<any> {
		try {
			const response = await mevAxios.put(`/api/config/system/${configId}`, data, {
				headers: this.getAuthHeaders()
			});
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<any>;
			throw new Error(axiosError.response?.data?.message || "Error al actualizar configuración del sistema");
		}
	}
}

export default new MEVWorkersService();
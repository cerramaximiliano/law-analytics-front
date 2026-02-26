/**
 * API Service para credenciales SCBA
 *
 * Permite vincular credenciales del Portal del Poder Judicial de la Provincia
 * de Buenos Aires (SCBA) para sincronizar automáticamente las causas del usuario.
 */

import axios, { AxiosError } from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

// Interfaces
export interface ScbaSyncProgress {
	startedAt: string;
	currentPage: number;
	totalPages: number;
	causasFound: number;
	causasProcessed: number;
	causasCreated: number;
	progress: number;
	lastUpdate: string;
}

export interface ScbaCredentialStats {
	totalCausasFound: number;
	causasCreated: number;
	causasLinked: number;
	causasSkipped: number;
	errors: number;
}

export interface ScbaSyncHistoryEntry {
	date: string;
	totalCausas: number;
	causasCreated: number;
	causasLinked: number;
	durationSeconds: number;
	pagesProcessed: number;
}

export interface ScbaCredentialsData {
	id: string;
	enabled: boolean;
	verified: boolean;
	verifiedAt: string | null;
	lastUsed: string | null;
	isExpired: boolean;
	consecutiveErrors: number;
	lastError: { message: string; date: string; code: string } | null;
	syncStatus: "never_synced" | "pending" | "in_progress" | "completed" | "error";
	lastSync: string | null;
	lastSyncAttempt: string | null;
	currentSyncProgress: ScbaSyncProgress | null;
	stats: ScbaCredentialStats;
	syncHistory: ScbaSyncHistoryEntry[];
	description: string;
	createdAt: string;
	updatedAt: string;
}

export interface GetScbaCredentialsStatusResponse {
	success: boolean;
	hasCredentials: boolean;
	serviceAvailable: boolean;
	serviceMessage?: string | null;
	data: ScbaCredentialsData | null;
	error?: string;
}

export interface LinkScbaCredentialsResponse {
	success: boolean;
	message?: string;
	data?: {
		id: string;
		causaId: string | null;
		enabled: boolean;
		verified: boolean;
		syncStatus: string;
		isGlobal: boolean;
		createdAt?: string;
		updatedAt?: string;
	};
	error?: string;
}

export interface GenericScbaResponse {
	success: boolean;
	message?: string;
	error?: string;
	data?: any;
}

class ScbaCredentialsService {
	/**
	 * Vincula credenciales SCBA a la cuenta del usuario
	 */
	async linkCredentials(username: string, password: string, causaId?: string): Promise<LinkScbaCredentialsResponse> {
		try {
			const response = await axios.post(
				`${BASE_URL}/api/scba-credentials`,
				{ username, password, causaId: causaId || null },
				{ withCredentials: true },
			);
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<any>;

			if (axiosError.response?.status === 400) {
				return { success: false, error: axiosError.response.data?.error || "Error de validación" };
			}
			if (axiosError.response?.status === 401) {
				return { success: false, error: "Sesión expirada. Por favor, inicie sesión nuevamente." };
			}
			if (axiosError.response?.status === 409) {
				return { success: false, error: axiosError.response.data?.error || "Ya existen credenciales vinculadas" };
			}

			return { success: false, error: axiosError.response?.data?.error || "Error al vincular credenciales SCBA" };
		}
	}

	/**
	 * Obtiene el estado de las credenciales SCBA del usuario
	 * Incluye serviceAvailable y syncProgress
	 */
	async getCredentialsStatus(): Promise<GetScbaCredentialsStatusResponse> {
		try {
			const response = await axios.get(`${BASE_URL}/api/scba-credentials`, {
				withCredentials: true,
			});
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<any>;
			return {
				success: false,
				hasCredentials: false,
				serviceAvailable: true,
				error: axiosError.response?.data?.error || "Error al obtener estado de credenciales SCBA",
				data: null,
			};
		}
	}

	/**
	 * Solicita una nueva sincronización de causas
	 */
	async requestSync(): Promise<GenericScbaResponse> {
		try {
			const response = await axios.post(`${BASE_URL}/api/scba-credentials/sync`, {}, { withCredentials: true });
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<any>;

			if (axiosError.response?.status === 400) {
				return {
					success: false,
					error: axiosError.response.data?.error || "No se puede iniciar sincronización",
					data: axiosError.response.data?.currentProgress,
				};
			}

			return { success: false, error: axiosError.response?.data?.error || "Error al solicitar sincronización" };
		}
	}

	/**
	 * Elimina credenciales SCBA
	 */
	async unlinkCredentials(id: string): Promise<GenericScbaResponse> {
		try {
			const response = await axios.delete(`${BASE_URL}/api/scba-credentials/${id}`, { withCredentials: true });
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<any>;
			return { success: false, error: axiosError.response?.data?.error || "Error al desvincular credenciales SCBA" };
		}
	}

	/**
	 * Habilita o deshabilita las credenciales
	 */
	async toggleCredentials(id: string): Promise<GenericScbaResponse> {
		try {
			const response = await axios.patch(`${BASE_URL}/api/scba-credentials/${id}/toggle`, {}, { withCredentials: true });
			return response.data;
		} catch (error) {
			const axiosError = error as AxiosError<any>;
			return { success: false, error: axiosError.response?.data?.error || "Error al cambiar estado de credenciales SCBA" };
		}
	}

	/**
	 * Polling del estado de sincronización
	 * @returns Función para detener el polling
	 */
	pollSyncStatus(
		intervalMs: number = 3000,
		onProgress: (status: ScbaCredentialsData) => void,
		onComplete: (status: ScbaCredentialsData) => void,
		onError: (error: string) => void,
	): () => void {
		let isPolling = true;

		const poll = async () => {
			if (!isPolling) return;

			try {
				const response = await this.getCredentialsStatus();

				if (!response.success || !response.data) {
					onError(response.error || "Error obteniendo estado");
					return;
				}

				const status = response.data;

				if (status.syncStatus === "completed") {
					onComplete(status);
					isPolling = false;
					return;
				}

				if (status.syncStatus === "error") {
					onError(status.lastError?.message || "Error en sincronización");
					isPolling = false;
					return;
				}

				// Notificar progreso
				onProgress(status);

				// Continuar polling si sigue en progreso o pendiente
				if (status.syncStatus === "in_progress" || status.syncStatus === "pending") {
					setTimeout(poll, intervalMs);
				}
			} catch {
				onError("Error de conexión");
				isPolling = false;
			}
		};

		poll();

		return () => {
			isPolling = false;
		};
	}
}

export default new ScbaCredentialsService();

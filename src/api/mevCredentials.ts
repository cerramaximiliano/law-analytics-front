/**
 * API Service para credenciales MEV (Mesa de Entradas Virtual — Buenos Aires).
 *
 * El scraping de causas MEV usa la cuenta del usuario en el portal MEV
 * (mev.scba.gov.ar). Una credencial GLOBAL (causaId=null) cubre todas las causas
 * MEV del usuario; también se pueden cargar credenciales por causa.
 */

import axios, { AxiosError } from "axios";

const BASE_URL = import.meta.env.VITE_BASE_URL;

export interface MevCredentialData {
	id: string;
	causaId?: string | null;
	enabled: boolean;
	verified: boolean;
	verifiedAt: string | null;
	lastUsed: string | null;
	isExpired: boolean;
	expiredAt: string | null;
	consecutiveErrors: number;
	lastError: { message: string; date: string; code: string } | null;
	description?: string;
	createdAt: string;
	updatedAt: string;
}

export interface GetMevCredentialsResponse {
	success: boolean;
	data?: {
		hasCredentials: boolean;
		global: MevCredentialData | null;
		perCausa: MevCredentialData[];
		total?: number;
	};
	error?: string;
}

export interface SaveMevCredentialsResponse {
	success: boolean;
	message?: string;
	data?: {
		id: string;
		isGlobal: boolean;
		verified: boolean;
		description?: string;
		createdAt?: string;
	};
	error?: string;
}

export interface GenericMevCredResponse {
	success: boolean;
	message?: string;
	error?: string;
}

class MevCredentialsService {
	/** Estado de las credenciales MEV del usuario (global + por causa). */
	async getCredentialsStatus(): Promise<GetMevCredentialsResponse> {
		try {
			const response = await axios.get(`${BASE_URL}/api/mev-credentials`, { withCredentials: true });
			return response.data;
		} catch (error) {
			const e = error as AxiosError<any>;
			return { success: false, error: e.response?.data?.error || "Error al obtener credenciales MEV" };
		}
	}

	/** Credencial específica de una causa. */
	async getCredentialsForCausa(causaId: string): Promise<GetMevCredentialsResponse> {
		try {
			const response = await axios.get(`${BASE_URL}/api/mev-credentials/causa/${causaId}`, { withCredentials: true });
			return response.data;
		} catch (error) {
			const e = error as AxiosError<any>;
			return { success: false, error: e.response?.data?.error || "Error al obtener la credencial de la causa" };
		}
	}

	/**
	 * Guarda/actualiza credenciales MEV. Sin causaId → credencial GLOBAL (cubre
	 * todas las causas del usuario). Con causaId → credencial específica.
	 */
	async saveCredentials(username: string, password: string, causaId?: string | null): Promise<SaveMevCredentialsResponse> {
		try {
			const response = await axios.post(
				`${BASE_URL}/api/mev-credentials`,
				{ username, password, causaId: causaId || null },
				{ withCredentials: true },
			);
			return response.data;
		} catch (error) {
			const e = error as AxiosError<any>;
			if (e.response?.status === 401) return { success: false, error: "Sesión expirada. Iniciá sesión de nuevo." };
			if (e.response?.status === 409) return { success: false, error: e.response.data?.error || "Ya existen credenciales para esa causa" };
			return { success: false, error: e.response?.data?.error || "Error al guardar las credenciales MEV" };
		}
	}

	/** Elimina una credencial por id. */
	async deleteCredentials(id: string): Promise<GenericMevCredResponse> {
		try {
			const response = await axios.delete(`${BASE_URL}/api/mev-credentials/${id}`, { withCredentials: true });
			return response.data;
		} catch (error) {
			const e = error as AxiosError<any>;
			return { success: false, error: e.response?.data?.error || "Error al eliminar las credenciales MEV" };
		}
	}

	/** Habilita/deshabilita una credencial (toggle). */
	async toggleCredentials(id: string): Promise<GenericMevCredResponse> {
		try {
			const response = await axios.patch(`${BASE_URL}/api/mev-credentials/${id}/toggle`, {}, { withCredentials: true });
			return response.data;
		} catch (error) {
			const e = error as AxiosError<any>;
			return { success: false, error: e.response?.data?.error || "Error al cambiar el estado de las credenciales MEV" };
		}
	}
}

const mevCredentialsService = new MevCredentialsService();
export default mevCredentialsService;

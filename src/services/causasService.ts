import causasAxios from "../utils/causasAxios";
import { VerifiedCausasResponse, CausaMovimientosResponse, DeleteCausaResponse } from "../types/causas";

class CausasService {
	async getVerifiedCausas(): Promise<VerifiedCausasResponse> {
		try {
			const response = await causasAxios.get<VerifiedCausasResponse>("/api/causas/verified");
			return response.data;
		} catch (error: any) {
			console.error("Error fetching verified causas:", error);
			throw error;
		}
	}

	async getMovimientosByCausaId(fuero: string, causaId: string, page: number = 1, limit: number = 20): Promise<CausaMovimientosResponse> {
		try {
			const response = await causasAxios.get<CausaMovimientosResponse>(`/api/causas/${fuero}/${causaId}/movimientos`, {
				params: {
					page,
					limit,
				},
			});
			return response.data;
		} catch (error: any) {
			console.error("Error fetching causa movimientos:", error);
			throw error;
		}
	}

	async deleteCausa(fuero: string, causaId: string): Promise<DeleteCausaResponse> {
		try {
			const response = await causasAxios.delete<DeleteCausaResponse>(`/api/causas/${fuero}/${causaId}`);
			return response.data;
		} catch (error: any) {
			console.error("Error deleting causa:", error);
			throw error;
		}
	}
}

export default new CausasService();

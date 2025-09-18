import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "axios";
import { dispatch } from "store";
import { UnifiedStatsState, UnifiedStatsData, UnifiedStatsResponse } from "types/unified-stats";

// Estado inicial
const initialState: UnifiedStatsState = {
	isInitialized: false,
	lastFetchedUserId: null,
	lastFetchTime: null,
	isLoading: false,
	error: null,
	data: null,
	lastUpdated: null,
	descriptions: null,
	cacheInfo: null,
};

// Tiempo de caché en milisegundos (24 horas)
const CACHE_TIME = 24 * 60 * 60 * 1000;

const slice = createSlice({
	name: "unifiedStats",
	initialState,
	reducers: {
		// START LOADING
		startLoading(state) {
			state.isLoading = true;
			state.error = null;
		},

		// HAS ERROR
		hasError(state, action: PayloadAction<string>) {
			state.isLoading = false;
			state.error = action.payload;
		},

		// SET STATS DATA
		setStatsSuccess(state, action: PayloadAction<{ data: UnifiedStatsData; userId: string; lastUpdated?: string; descriptions?: any; cacheInfo?: any }>) {
			state.isLoading = false;
			state.error = null;
			state.data = action.payload.data;
			state.lastFetchedUserId = action.payload.userId;
			state.lastFetchTime = Date.now();
			state.isInitialized = true;
			state.lastUpdated = action.payload.lastUpdated || null;
			state.descriptions = action.payload.descriptions || null;
			state.cacheInfo = action.payload.cacheInfo || null;
		},

		// UPDATE PARTIAL DATA
		updatePartialData(state, action: PayloadAction<Partial<UnifiedStatsData>>) {
			if (state.data) {
				state.data = {
					...state.data,
					...action.payload,
				};
			}
		},

		// RESET STATE
		resetStats(state) {
			state.isInitialized = false;
			state.lastFetchedUserId = null;
			state.lastFetchTime = null;
			state.isLoading = false;
			state.error = null;
			state.data = null;
			state.lastUpdated = null;
			state.descriptions = null;
			state.cacheInfo = null;
		},
	},
});

// Reducer
export default slice.reducer;

// Actions
export const { startLoading, hasError, setStatsSuccess, updatePartialData, resetStats } = slice.actions;

// ----------------------------------------------------------------------

/**
 * Obtiene las estadísticas unificadas del usuario
 * @param userId - ID del usuario
 * @param sections - Secciones específicas a obtener (por defecto: 'all')
 * @param forceRefresh - Forzar actualización ignorando el caché
 */
export function getUnifiedStats(userId: string, sections: string = "all", forceRefresh: boolean = false) {
	return async (dispatch: any, getState: any) => {
		const state = getState().unifiedStats;

		// Verificar si necesitamos hacer la petición
		if (
			!forceRefresh &&
			state.isInitialized &&
			state.lastFetchedUserId === userId &&
			state.lastFetchTime &&
			Date.now() - state.lastFetchTime < CACHE_TIME
		) {
			// Los datos están en caché y son recientes
			return;
		}

		dispatch(slice.actions.startLoading());

		try {
			const baseURL = import.meta.env.VITE_BASE_URL || "";
			const url = `${baseURL}/api/stats/unified/${userId}`;

			// Log para debugging
			console.log("🔍 [UnifiedStats] Fetching stats:", {
				environment: import.meta.env.MODE,
				baseURL,
				fullURL: url,
				userId,
				sections
			});

			const response = await axios.get<UnifiedStatsResponse>(url, {
				params: { sections },
				withCredentials: true,
			});

			// Log de respuesta
			console.log("✅ [UnifiedStats] Response received:", {
				environment: import.meta.env.MODE,
				success: response.data.success,
				resolutionTime: response.data.data?.folders?.resolutionTimes?.overall,
				activefolders: response.data.data?.dashboard?.folders?.active,
				closedFolders: response.data.data?.dashboard?.folders?.closed,
				lastUpdated: response.data.lastUpdated
			});

			if (response.data.success && response.data.data) {
				dispatch(
					slice.actions.setStatsSuccess({
						data: response.data.data,
						userId: userId,
						lastUpdated: response.data.lastUpdated,
						descriptions: response.data.descriptions,
						cacheInfo: response.data.cacheInfo,
					}),
				);
			} else {
				throw new Error("Formato de respuesta inválido");
			}
		} catch (error) {
			let errorMessage = "Error al cargar las estadísticas";

			if (axios.isAxiosError(error)) {
				if (error.response?.status === 401) {
					errorMessage = "No autorizado. Por favor inicia sesión nuevamente";
				} else if (error.response?.status === 403) {
					errorMessage = "No tienes permisos para ver esta información";
				} else if (error.response?.status === 404) {
					errorMessage = "No se encontraron estadísticas para este usuario";
				} else if (error.response?.data?.message) {
					errorMessage = error.response.data.message;
				} else if (error.message) {
					// Evitar mostrar "Wrong Services"
					errorMessage = error.message === "Wrong Services" ? "Error de conexión con el servidor" : error.message;
				}
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}

			dispatch(slice.actions.hasError(errorMessage));
			// No lanzar el error para evitar el mensaje en consola
			console.error("Error en getUnifiedStats:", errorMessage);
		}
	};
}

/**
 * Actualiza secciones específicas de las estadísticas
 * @param userId - ID del usuario
 * @param sections - Secciones específicas a actualizar
 */
export function updateStatsSections(userId: string, sections: string[]) {
	return async () => {
		try {
			const sectionsParam = sections.join(",");
			const baseURL = import.meta.env.VITE_BASE_URL || "";
			const response = await axios.get<UnifiedStatsResponse>(`${baseURL}/api/stats/unified/${userId}`, {
				params: { sections: sectionsParam },
				withCredentials: true,
			});

			if (response.data.success && response.data.data) {
				dispatch(slice.actions.updatePartialData(response.data.data));
			}
		} catch (error) {
			// En caso de error, no actualizamos el estado de error principal
			// para no afectar la UI si ya hay datos cargados
			console.error("Error actualizando secciones de estadísticas:", error);
		}
	};
}

/**
 * Limpia las estadísticas del store (útil al cerrar sesión)
 */
export function clearUnifiedStats() {
	return () => {
		dispatch(slice.actions.resetStats());
	};
}

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
	dataQuality: null,
	lastUpdated: null,
	descriptions: null,
	cacheInfo: null,
	history: [],
	historyLoading: false,
	selectedHistoryId: null,
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
		// Mergea la respuesta con el state existente cuando es del MISMO userId. Un
		// fetch parcial (ej. sections=dashboard) no debe borrar secciones cargadas
		// previamente (ej. folders). Si cambia el userId — owner del equipo, switch
		// de user — reemplaza completamente.
		setStatsSuccess(
			state,
			action: PayloadAction<{
				data: UnifiedStatsData;
				userId: string;
				dataQuality?: number;
				lastUpdated?: string;
				descriptions?: any;
				cacheInfo?: any;
			}>,
		) {
			console.log("📊 [Redux] Setting dataQuality in state:", action.payload.dataQuality);
			state.isLoading = false;
			state.error = null;
			const sameUser = state.lastFetchedUserId === action.payload.userId;
			state.data = sameUser && state.data ? ({ ...state.data, ...action.payload.data } as UnifiedStatsData) : action.payload.data;
			state.dataQuality = action.payload.dataQuality || null;
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
			state.dataQuality = null;
			state.lastUpdated = null;
			state.descriptions = null;
			state.cacheInfo = null;
			state.history = [];
			state.historyLoading = false;
			state.selectedHistoryId = null;
		},

		// HISTORY LOADING
		startHistoryLoading(state) {
			state.historyLoading = true;
		},

		// SET HISTORY
		setHistorySuccess(state, action: PayloadAction<any[]>) {
			state.historyLoading = false;
			state.history = action.payload;
		},

		// SET SELECTED HISTORY
		setSelectedHistory(state, action: PayloadAction<string | null>) {
			state.selectedHistoryId = action.payload;
		},
	},
});

// Reducer
export default slice.reducer;

// Actions
export const {
	startLoading,
	hasError,
	setStatsSuccess,
	updatePartialData,
	resetStats,
	startHistoryLoading,
	setHistorySuccess,
	setSelectedHistory,
} = slice.actions;

// ----------------------------------------------------------------------

// Dedup de requests en vuelo: varios widgets pueden dispatchear getUnifiedStats
// en el mismo tick (dashboard + folder widgets + task widget). Sin este map, cada
// uno dispara un HTTP y vacía el bucket del rate-limiter del server.
const inFlightRequests = new Map<string, Promise<void>>();

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

		// Dedup: si ya hay un request en vuelo para este userId+sections, reutilizarlo.
		// forceRefresh skipea la dedup para que el retry siempre dispare un fetch real.
		const flightKey = `${userId}|${sections}`;
		if (!forceRefresh) {
			const existing = inFlightRequests.get(flightKey);
			if (existing) return existing;
		}

		const flight = (async () => {
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
					sections,
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
					dataQuality: response.data.dataQuality,
					matters: response.data.data?.matters,
					foldersbyMatter: response.data.data?.folders?.byMatter,
					lastUpdated: response.data.lastUpdated,
					fullData: response.data.data,
				});

				if (response.data.success && response.data.data) {
					dispatch(
						slice.actions.setStatsSuccess({
							data: response.data.data,
							userId: userId,
							dataQuality: response.data.dataQuality,
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
		})();

		inFlightRequests.set(flightKey, flight);
		flight.finally(() => {
			if (inFlightRequests.get(flightKey) === flight) {
				inFlightRequests.delete(flightKey);
			}
		});

		return flight;
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

/**
 * Obtiene el histórico de analíticas del usuario
 * @param userId - ID del usuario
 * @param limit - Cantidad máxima de documentos (default: 50)
 */
export function getAnalyticsHistory(userId: string, limit: number = 50) {
	return async (dispatch: any) => {
		dispatch(slice.actions.startHistoryLoading());

		try {
			const baseURL = import.meta.env.VITE_BASE_URL || "";
			const url = `${baseURL}/api/stats/history/${userId}/list`;

			console.log("📜 [UnifiedStats] Fetching analytics history:", { userId, limit });

			const response = await axios.get(url, {
				params: { limit },
				withCredentials: true,
			});

			if (response.data.success && response.data.documents) {
				dispatch(slice.actions.setHistorySuccess(response.data.documents));
				console.log(`✅ [UnifiedStats] History loaded: ${response.data.count} documents`);
			} else {
				throw new Error("Formato de respuesta inválido");
			}
		} catch (error) {
			let errorMessage = "Error al cargar el histórico";

			if (axios.isAxiosError(error)) {
				if (error.response?.data?.message) {
					errorMessage = error.response.data.message;
				}
			}

			dispatch(slice.actions.hasError(errorMessage));
			console.error("Error en getAnalyticsHistory:", errorMessage);
		}
	};
}

/**
 * Obtiene las estadísticas de una fecha específica del histórico
 * @param userId - ID del usuario
 * @param documentId - ID del documento histórico
 */
export function getHistoricalStats(userId: string, documentId: string) {
	return async (dispatch: any) => {
		dispatch(slice.actions.startLoading());
		dispatch(slice.actions.setSelectedHistory(documentId));

		try {
			const baseURL = import.meta.env.VITE_BASE_URL || "";
			const url = `${baseURL}/api/stats/history/${userId}/document/${documentId}`;

			console.log("📊 [UnifiedStats] Fetching historical stats:", { userId, documentId });

			const response = await axios.get(url, {
				withCredentials: true,
			});

			if (response.data.success && response.data.analytics) {
				// Transformar la estructura del documento histórico al formato esperado
				const transformedData = transformAnalyticsToUnifiedStats(response.data.analytics);

				dispatch(
					slice.actions.setStatsSuccess({
						data: transformedData,
						userId: userId,
						dataQuality: response.data.analytics?.dataQuality || 0,
						lastUpdated: response.data.documentInfo.lastUpdated,
						descriptions: null, // Los históricos pueden no tener descripciones
						cacheInfo: {
							generatedAt: response.data.documentInfo.createdAt,
							hoursAgo: response.data.documentInfo.hoursAgo,
							isFromCache: true,
							nextUpdate: "", // No aplica para históricos
							message: `Datos históricos del ${new Date(response.data.documentInfo.createdAt).toLocaleDateString("es-AR")}`,
						},
					}),
				);
				console.log("✅ [UnifiedStats] Historical stats loaded for:", documentId);
			} else {
				throw new Error("Formato de respuesta inválido");
			}
		} catch (error) {
			let errorMessage = "Error al cargar las estadísticas históricas";

			if (axios.isAxiosError(error)) {
				if (error.response?.status === 404) {
					errorMessage = "No se encontró el documento histórico";
				} else if (error.response?.data?.message) {
					errorMessage = error.response.data.message;
				}
			}

			dispatch(slice.actions.hasError(errorMessage));
			console.error("Error en getHistoricalStats:", errorMessage);
		}
	};
}

/**
 * Transforma los datos de analíticas históricas al formato UnifiedStatsData
 */
function transformAnalyticsToUnifiedStats(analytics: any): any {
	// Mapear la estructura del documento histórico al formato esperado por la UI
	return {
		dashboard: {
			folders: {
				active:
					(analytics.folderStatusDistribution?.nueva || 0) +
					(analytics.folderStatusDistribution?.enProceso || 0) +
					(analytics.folderStatusDistribution?.pendiente || 0),
				closed: analytics.folderStatusDistribution?.cerrada || 0,
				total:
					(analytics.folderStatusDistribution?.nueva || 0) +
					(analytics.folderStatusDistribution?.enProceso || 0) +
					(analytics.folderStatusDistribution?.cerrada || 0) +
					(analytics.folderStatusDistribution?.pendiente || 0),
			},
			financial: {
				activeAmount: analytics.financialMetrics?.totalActiveAmount || 0,
			},
			deadlines: {
				nextWeek: analytics.deadlineMetrics?.next7Days || 0,
				next15Days: analytics.deadlineMetrics?.next15Days || 0,
				next30Days: analytics.deadlineMetrics?.next30Days || 0,
			},
			tasks: {
				pending: analytics.taskMetrics?.pendingTasks || 0,
				completed: analytics.taskMetrics?.completedTasks || 0,
				overdue: analytics.taskMetrics?.overdueTasks || 0,
			},
			notifications: {
				unread: analytics.notificationMetrics?.unreadCount || 0,
			},
			trends: {
				newFolders: analytics.trends?.newFolders || [],
				closedFolders: analytics.trends?.closedFolders || [],
				movements: analytics.trends?.movements || [],
				calculators: analytics.trends?.calculators || [],
			},
		},
		folders: {
			distribution: analytics.folderStatusDistribution || {
				nueva: 0,
				enProceso: 0,
				cerrada: 0,
				pendiente: 0,
			},
			resolutionTimes: {
				overall: analytics.resolutionMetrics?.averageResolutionTime || 0,
				byStatus: analytics.resolutionMetrics?.byStatus || {
					nueva: 0,
					enProceso: 0,
					pendiente: 0,
				},
			},
			upcomingDeadlines: {
				next7Days: analytics.deadlineMetrics?.next7Days || analytics.upcomingDeadlines?.next7Days || 0,
				next15Days: analytics.deadlineMetrics?.next15Days || analytics.upcomingDeadlines?.next15Days || 0,
				next30Days: analytics.deadlineMetrics?.next30Days || analytics.upcomingDeadlines?.next30Days || 0,
			},
			byMatter: {
				distribution: analytics.matterDistribution || {},
				averageAmount: {},
				resolutionTime: {},
			},
		},
		tasks: {
			metrics: {
				completionRate: analytics.taskMetrics?.completionRate || 0,
				pendingTasks: analytics.taskMetrics?.pendingTasks || 0,
				completedTasks: analytics.taskMetrics?.completedTasks || 0,
				overdueTasks: analytics.taskMetrics?.overdueTasks || 0,
			},
			completionRate: analytics.taskMetrics?.completionRate || 0,
		},
		financial: {
			amountByStatus: analytics.financialMetrics?.amountByStatus || {},
			calculatorsByType: analytics.financialMetrics?.calculatorsByType || {},
			calculatorsAmountByType: analytics.financialMetrics?.calculatorsAmountByType || {},
			totalActiveAmount: analytics.financialMetrics?.totalActiveAmount || 0,
			averageAmountPerFolder: analytics.financialMetrics?.averageAmountPerFolder || 0,
		},
		activity: {
			metrics: {
				dailyAverage: analytics.activityMetrics?.dailyAverage || 0,
				weeklyAverage: analytics.activityMetrics?.weeklyAverage || 0,
				monthlyAverage: analytics.activityMetrics?.monthlyAverage || 0,
				mostActiveDay: analytics.activityMetrics?.mostActiveDay || "N/A",
			},
			trends: {
				newFolders: analytics.trends?.newFolders || [],
				closedFolders: analytics.trends?.closedFolders || [],
				movements: analytics.trends?.movements || [],
				calculators: analytics.trends?.calculators || [],
			},
		},
		notifications: {
			unreadCount: analytics.notificationMetrics?.unreadCount || 0,
			averageReadTime: analytics.notificationMetrics?.averageReadTime || 0,
			responseRate: analytics.notificationMetrics?.responseRate || 0,
		},
		matters: {
			distribution: analytics.matterDistribution || {},
			averageAmount: {},
			resolutionTime: {},
		},
		dataQuality: analytics.dataQuality || 0,
	};
}

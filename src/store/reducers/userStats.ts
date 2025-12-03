// store/reducers/userStats.js
import axios from "axios";
import { Dispatch } from "redux";
import { openSnackbar } from "store/reducers/snackbar";
import { extractErrorMessage } from "utils/errorMessages";

// Tipos de acciones
import {
	FETCH_USER_STATS_REQUEST,
	FETCH_USER_STATS_SUCCESS,
	FETCH_USER_STATS_FAILURE,
	INCREMENT_USER_STAT,
	UPDATE_USER_STORAGE,
} from "./actions";

// Configuración centralizada de tamaños (sincronizada con el backend)
import {
	STORAGE_CONFIG,
	StorageDocumentType as ConfigStorageDocumentType,
	FolderLinkInfo,
	isFolderLinkedToCausa,
	getDocumentSize,
	getFolderSize,
} from "config/storageConfig";

// Re-exportar tipos y funciones útiles
export type StorageDocumentType = ConfigStorageDocumentType;
export type { FolderLinkInfo };
export { isFolderLinkedToCausa, getDocumentSize, getFolderSize };

// Interfaz para la configuración de tamaños de documentos
export interface StorageConfigData {
	documentSizes: {
		contact: number;
		folder: number;
		folderLinked: number;
		calculator: number;
		file: number;
	};
	source: "database" | "fallback";
	version: number | null;
}

// Interfaz para el estado de UserStats
export interface UserStatsState {
	loading: boolean;
	error: string | null;
	data: {
		counts: {
			calculators: number;
			folders: number;
			movements: number;
			notifications: number;
			events: number;
			contacts: number;
			alerts: number;
			foldersTotal?: number;
			contactsTotal?: number;
			calculatorsTotal?: number;
		};
		storage?: {
			total: number;
			folders: number;
			contacts: number;
			calculators: number;
			files: number;
			fileCount: number;
			limit: number; // Límite de almacenamiento en bytes
			limitMB?: number; // Límite en MB
			usedPercentage?: number; // Porcentaje usado
		};
		storageConfig?: StorageConfigData; // Configuración de tamaños del servidor
		planInfo?: {
			planId: string;
			planName: string;
			limits: {
				folders: number;
				contacts: number;
				calculators: number;
				storage: number; // En MB
			};
		};
		lastUpdated: string | null;
	};
}

// Estado inicial
const initialState: UserStatsState = {
	loading: false,
	error: null,
	data: {
		counts: {
			calculators: 0,
			folders: 0,
			movements: 0,
			notifications: 0,
			events: 0,
			contacts: 0,
			alerts: 0,
		},
		lastUpdated: null,
	},
};

// Interfaces para las acciones
interface FetchUserStatsRequestAction {
	type: typeof FETCH_USER_STATS_REQUEST;
}

interface FetchUserStatsSuccessAction {
	type: typeof FETCH_USER_STATS_SUCCESS;
	payload: any;
}

interface FetchUserStatsFailureAction {
	type: typeof FETCH_USER_STATS_FAILURE;
	payload: string;
}

interface IncrementUserStatAction {
	type: typeof INCREMENT_USER_STAT;
	payload: {
		counterType: string;
		value: number;
	};
}

interface UpdateUserStorageAction {
	type: typeof UPDATE_USER_STORAGE;
	payload: {
		documentType: StorageDocumentType;
		count: number; // positivo para agregar, negativo para quitar
	};
}

type UserStatsActionTypes =
	| FetchUserStatsRequestAction
	| FetchUserStatsSuccessAction
	| FetchUserStatsFailureAction
	| IncrementUserStatAction
	| UpdateUserStorageAction;

// Reducer
const userStatsReducer = (state = initialState, action: UserStatsActionTypes): UserStatsState => {
	switch (action.type) {
		case FETCH_USER_STATS_REQUEST:
			return {
				...state,
				loading: true,
				error: null,
			};
		case FETCH_USER_STATS_SUCCESS:
			return {
				...state,
				loading: false,
				data: {
					...state.data,
					counts: action.payload.counts,
					storage: action.payload.storage,
					storageConfig: action.payload.storageConfig, // Configuración de tamaños del servidor
					planInfo: action.payload.planInfo,
					lastUpdated: action.payload.lastUpdated,
				},
			};
		case FETCH_USER_STATS_FAILURE:
			return {
				...state,
				loading: false,
				error: action.payload,
			};
		case INCREMENT_USER_STAT:
			const currentCount = state.data.counts?.[action.payload.counterType as keyof typeof state.data.counts] || 0;
			return {
				...state,
				data: {
					...state.data,
					counts: {
						...state.data.counts,
						[action.payload.counterType]: currentCount + action.payload.value,
					},
				},
			};
		case UPDATE_USER_STORAGE:
			// Usar configuración del servidor si está disponible, sino fallback local
			const serverConfig = state.data.storageConfig?.documentSizes;
			const configToUse = serverConfig || STORAGE_CONFIG.documentSizes;

			// Obtener el tamaño del documento según la configuración
			const documentSize = configToUse[action.payload.documentType] || 0;
			const bytesChange = documentSize * action.payload.count;

			const currentStorage = state.data.storage || {
				total: 0,
				folders: 0,
				contacts: 0,
				calculators: 0,
				files: 0,
				fileCount: 0,
				limit: STORAGE_CONFIG.defaultLimits.storage,
			};

			// Mapear tipo de documento a campo de storage
			// folder y folderLinked ambos van al campo "folders"
			const storageFieldMap: Record<StorageDocumentType, "contacts" | "folders" | "calculators"> = {
				contact: "contacts",
				folder: "folders",
				folderLinked: "folders",
				calculator: "calculators",
			};
			const storageField = storageFieldMap[action.payload.documentType];

			// Calcular nuevos valores (asegurar que no sean negativos)
			const newFieldValue = Math.max(0, (currentStorage[storageField] || 0) + bytesChange);
			const newTotal = Math.max(0, currentStorage.total + bytesChange);
			const newPercentage = currentStorage.limit > 0 ? Math.min(100, Math.round((newTotal / currentStorage.limit) * 100)) : 0;

			return {
				...state,
				data: {
					...state.data,
					storage: {
						...currentStorage,
						[storageField]: newFieldValue,
						total: newTotal,
						usedPercentage: newPercentage,
					},
				},
			};
		default:
			return state;
	}
};

export default userStatsReducer;

// Acciones

/**
 * Incrementa o decrementa un contador de estadísticas del usuario localmente
 * @param counterType - Tipo de contador: 'folders', 'contacts', 'calculators', etc.
 * @param value - Valor a incrementar (positivo) o decrementar (negativo)
 */
export const incrementUserStat = (counterType: string, value: number = 1) => ({
	type: INCREMENT_USER_STAT,
	payload: { counterType, value },
});

/**
 * Actualiza el storage del usuario localmente (actualización optimista)
 * Solo se debe llamar en operaciones de archivo/desarchivo, ya que el storage
 * solo cuenta elementos archivados.
 *
 * @param documentType - Tipo de documento: 'folder', 'folderLinked', 'contact', 'calculator'
 * @param count - Cantidad de elementos (positivo para archivar, negativo para desarchivar/eliminar archivado)
 */
export const updateUserStorage = (documentType: StorageDocumentType, count: number) => ({
	type: UPDATE_USER_STORAGE,
	payload: { documentType, count },
});

/**
 * Actualiza el storage para un folder, determinando automáticamente si está vinculado a una causa.
 * Usa el tamaño de folderLinked (50KB) si está vinculado, o folder (10KB) si no lo está.
 *
 * @param folder - Datos del folder con información de vinculación
 * @param count - Cantidad de elementos (positivo para archivar, negativo para desarchivar)
 */
export const updateFolderStorage = (folder: FolderLinkInfo | null | undefined, count: number) => {
	const isLinked = isFolderLinkedToCausa(folder);
	const documentType: StorageDocumentType = isLinked ? "folderLinked" : "folder";
	return updateUserStorage(documentType, count);
};

/**
 * Refresca las estadísticas del usuario en segundo plano (sin mostrar loading ni errores)
 * Útil para actualizar el storage después de operaciones CRUD
 * @param delay - Tiempo de espera en ms antes de refrescar (default: 1000ms para dar tiempo al backend)
 */
export const refreshUserStatsInBackground =
	(delay: number = 1000) =>
	async (dispatch: Dispatch) => {
		try {
			// Esperar un momento para que el backend procese los cambios
			if (delay > 0) {
				await new Promise((resolve) => setTimeout(resolve, delay));
			}

			const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/user-stats/user`, {
				withCredentials: true,
			});

			if (response.data && response.data.success) {
				dispatch({
					type: FETCH_USER_STATS_SUCCESS,
					payload: response.data.data,
				});
			}
		} catch (_error) {
			// Silenciar errores en refresh en segundo plano
		}
	};

export const fetchUserStats = () => async (dispatch: Dispatch) => {
	dispatch({ type: FETCH_USER_STATS_REQUEST });

	try {
		const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/user-stats/user`, {
			withCredentials: true,
		});

		if (response.data && response.data.success) {
			dispatch({
				type: FETCH_USER_STATS_SUCCESS,
				payload: response.data.data,
			});
		} else {
			throw new Error(response.data.message || "Error al obtener estadísticas");
		}
	} catch (error: any) {
		const errorMessage = extractErrorMessage(error);
		dispatch({
			type: FETCH_USER_STATS_FAILURE,
			payload: errorMessage,
		});

		dispatch(
			openSnackbar({
				open: true,
				message: errorMessage,
				variant: "alert",
				alert: {
					color: "error",
				},
				close: false,
			}),
		);
	}
};

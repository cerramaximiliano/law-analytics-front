// reducers/folder.ts

import axios from "axios";
import { Dispatch } from "redux";
import { FolderData, FolderState } from "types/folder";

// Action types
const SET_FOLDER_LOADING = "SET_FOLDER_LOADING";
const ADD_FOLDER = "ADD_FOLDER";
const GET_FOLDERS_BY_USER = "GET_FOLDERS_BY_USER";
const GET_FOLDERS_BY_GROUP = "GET_FOLDERS_BY_GROUP";
const GET_FOLDER_BY_ID = "GET_FOLDER_BY_ID";
const DELETE_FOLDER = "DELETE_FOLDER";
const UPDATE_FOLDER = "UPDATE_FOLDER";
const SET_FOLDER_ERROR = "SET_FOLDER_ERROR";
const ARCHIVE_FOLDERS = "ARCHIVE_FOLDERS";
const UNARCHIVE_FOLDERS = "UNARCHIVE_FOLDERS";
const GET_ARCHIVED_FOLDERS = "GET_ARCHIVED_FOLDERS";
const GET_FOLDERS_BY_IDS = "GET_FOLDERS_BY_IDS";
const RESET_FOLDERS_STATE = "RESET_FOLDERS_STATE";
const SET_SELECTED_FOLDERS = "SET_SELECTED_FOLDERS";

// Initial state
const initialFolderState: FolderState = {
	folders: [],
	archivedFolders: [],
	selectedFolders: [],
	folder: null,
	isLoader: false,
	error: undefined,
	isInitialized: false,
	lastFetchedUserId: undefined,
};

// Reducer
// Reducer
const folder = (state = initialFolderState, action: any) => {
	switch (action.type) {
		case SET_FOLDER_LOADING:
			return { ...state, isLoader: true, error: null };
		case ADD_FOLDER:
			return {
				...state,
				folders: [...state.folders, action.payload],
				isLoader: false,
			};
		case GET_FOLDERS_BY_USER:
			return {
				...state,
				folders: action.payload,
				isLoader: false,
				isInitialized: true,
				lastFetchedUserId: action.userId,
			};
		case GET_FOLDERS_BY_GROUP:
			return {
				...state,
				folders: action.payload,
				isLoader: false,
			};
		case GET_ARCHIVED_FOLDERS:
			return {
				...state,
				archivedFolders: action.payload,
				isLoader: false,
			};
		case GET_FOLDER_BY_ID:
			return {
				...state,
				folder: action.payload,
				// También actualizar el folder en la lista si existe
				folders: state.folders.map((folder: FolderData) => (folder._id === action.payload._id ? action.payload : folder)),
				isLoader: false,
			};
		case DELETE_FOLDER:
			return {
				...state,
				folders: state.folders.filter((folder: FolderData) => folder._id !== action.payload),
				isLoader: false,
			};
		case ARCHIVE_FOLDERS:
			// Los IDs de las carpetas a archivar
			const folderIdsToArchive = action.payload;

			// Encontrar las carpetas completas que se van a archivar
			const foldersToArchive = state.folders.filter((folder: FolderData) => folderIdsToArchive.includes(folder._id));

			return {
				...state,
				// Remover de las carpetas activas
				folders: state.folders.filter((folder: FolderData) => !folderIdsToArchive.includes(folder._id)),
				// Añadir a las carpetas archivadas
				archivedFolders: [...state.archivedFolders, ...foldersToArchive],
				isLoader: false,
			};
		case UNARCHIVE_FOLDERS:
			// Los IDs o folders parciales a desarchivar
			const folderIdsToUnarchive = action.payload.map((f: any) => (typeof f === "string" ? f : f._id));

			// Buscar las carpetas completas en archivedFolders
			const foldersToUnarchive = state.archivedFolders.filter((folder: FolderData) => folderIdsToUnarchive.includes(folder._id));

			return {
				...state,
				// Añadir las carpetas desarchivadas a la lista de carpetas activas
				// Si encontramos la carpeta completa en archivedFolders, la usamos, sino usamos la versión parcial
				folders: [...state.folders, ...(foldersToUnarchive.length > 0 ? foldersToUnarchive : action.payload)],
				// Remover las carpetas desarchivadas de la lista de archivados
				archivedFolders: state.archivedFolders.filter((folder: FolderData) => !folderIdsToUnarchive.includes(folder._id)),
				isLoader: false,
			};
		case UPDATE_FOLDER:
			return {
				...state,
				folder: action.payload,
				folders: state.folders.map((folder: FolderData) => (folder._id === action.payload._id ? action.payload : folder)),
				isLoader: false,
			};
		case SET_FOLDER_ERROR:
			return {
				...state,
				error: action.payload,
				isLoader: false,
			};
		case GET_FOLDERS_BY_IDS:
			return {
				...state,
				selectedFolders: action.payload,
				isLoader: false,
			};
		case SET_SELECTED_FOLDERS:
			return {
				...state,
				selectedFolders: action.payload,
				isLoader: false,
			};
		case "folders/SET_FOLDER_ERROR":
			// Handle namespaced action for manual reset
			return {
				...state,
				error: action.payload,
				isLoader: false,
			};
		case RESET_FOLDERS_STATE:
			return initialFolderState;
		default:
			return state;
	}
};

// Action creators

export const addFolder = (folderData: FolderData) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_FOLDER_LOADING });
		const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/folders`, folderData);
		if (response.data.success) {
			dispatch({
				type: ADD_FOLDER,
				payload: response.data.folder,
			});
			return { success: true, folder: response.data.folder };
		}
		return { success: false, message: response.data.message || "Error al crear folder" };
	} catch (error) {
		const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al crear folder" : "Error desconocido";
		dispatch({
			type: SET_FOLDER_ERROR,
			payload: errorMessage,
		});
		return { success: false, message: errorMessage };
	}
};

export const getFoldersByUserId =
	(userId: string, forceRefresh: boolean = false) =>
	async (dispatch: Dispatch, getState: any) => {
		try {
			const state = getState();
			const { isInitialized, lastFetchedUserId } = state.folder;

			// Si ya está inicializado para este usuario y no se está forzando la recarga, retornar los datos actuales
			if (isInitialized && lastFetchedUserId === userId && !forceRefresh) {
				return { success: true, folders: state.folder.folders };
			}

			dispatch({ type: SET_FOLDER_LOADING });
			// Campos optimizados para listas y vistas resumidas, incluyendo campos de verificación
			const fields =
				"_id,folderName,status,materia,orderStatus,initialDateFolder,finalDateFolder,folderJuris,folderFuero,description,customerName,pjn,causaVerified,causaIsValid,causaAssociationStatus,mev,judFolder";
			const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/folders/user/${userId}`, {
				params: { fields },
			});
			if (response.data.success) {
				dispatch({
					type: GET_FOLDERS_BY_USER,
					payload: response.data.folders,
					userId: userId,
				});
				return { success: true, folders: response.data.folders };
			}
			return { success: false, folders: [] };
		} catch (error) {
			dispatch({
				type: SET_FOLDER_ERROR,
				payload: axios.isAxiosError(error) ? error.response?.data?.message || "Error al obtener folders por usuario" : "Error desconocido",
			});
			return { success: false, folders: [] };
		}
	};

export const getFoldersByGroupId = (groupId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_FOLDER_LOADING });
		// Campos optimizados para listas y vistas resumidas, incluyendo campos de verificación
		const fields =
			"_id,folderName,status,materia,orderStatus,initialDateFolder,finalDateFolder,folderJuris,folderFuero,description,customerName,pjn,causaVerified,causaIsValid,causaAssociationStatus,mev,judFolder";
		const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/folders/group/${groupId}`, {
			params: { fields },
		});
		if (response.data.success) {
			dispatch({
				type: GET_FOLDERS_BY_GROUP,
				payload: response.data.folders,
			});
		}
	} catch (error) {
		dispatch({
			type: SET_FOLDER_ERROR,
			payload: axios.isAxiosError(error) ? error.response?.data?.message || "Error al obtener folders por grupo" : "Error desconocido",
		});
	}
};

export const getFolderById =
	(folderId: string, forceRefresh: boolean = false) =>
	async (dispatch: Dispatch, getState: any) => {
		try {
			// Obtener el estado actual del store
			const state = getState();
			const currentFolder = state.folder.folder;

			// Si el folder actual tiene el mismo ID y no se está forzando la actualización, no hacer la petición
			if (!forceRefresh && currentFolder && currentFolder._id === folderId) {
				return { success: true, folder: currentFolder };
			}

			// Si es diferente o no hay folder, hacer la petición
			dispatch({ type: SET_FOLDER_LOADING });
			const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/folders/${folderId}`);
			if (response.data.success) {
				dispatch({
					type: GET_FOLDER_BY_ID,
					payload: response.data.folder,
				});
				return { success: true, folder: response.data.folder };
			}
			return { success: false, message: "No se pudo obtener el folder" };
		} catch (error) {
			const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al obtener folder" : "Error desconocido";
			dispatch({
				type: SET_FOLDER_ERROR,
				payload: errorMessage,
			});
			return { success: false, message: errorMessage };
		}
	};

export const deleteFolderById = (folderId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_FOLDER_LOADING });
		const response = await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/folders/${folderId}`);
		if (response.data.success) {
			dispatch({
				type: DELETE_FOLDER,
				payload: folderId,
			});
			return { success: true };
		}
		// Traducir mensaje del servidor si es necesario
		const message = response.data.message === "Folder no encontrado" ? "Carpeta no encontrada" : response.data.message || "Error al eliminar carpeta";
		return { success: false, message };
	} catch (error) {
		let errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al eliminar carpeta" : "Error desconocido";
		// Traducir mensaje del servidor si es necesario
		if (errorMessage === "Folder no encontrado") {
			errorMessage = "Carpeta no encontrada";
		}
		dispatch({
			type: SET_FOLDER_ERROR,
			payload: errorMessage,
		});
		return { success: false, message: errorMessage };
	}
};

export const updateFolderById = (folderId: string, updatedData: Partial<FolderData>) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_FOLDER_LOADING });
		const response = await axios.put(`${import.meta.env.VITE_BASE_URL}/api/folders/${folderId}`, updatedData);
		if (response.data.success) {
			dispatch({
				type: UPDATE_FOLDER,
				payload: response.data.folder,
			});
			return { success: true, folder: response.data.folder };
		} else {
			return { success: false, message: "No se pudo actualizar el folder." };
		}
	} catch (error) {
		const errorMessage = axios.isAxiosError(error) ? error.response?.data?.message || "Error al actualizar folder." : "Error desconocido.";
		dispatch({
			type: SET_FOLDER_ERROR,
			payload: errorMessage,
		});
		return { success: false, message: errorMessage };
	}
};

export const archiveFolders = (userId: string, folderIds: string[]) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_FOLDER_LOADING });
		const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/subscriptions/archive-items?userId=${userId}`, {
			resourceType: "folders",
			itemIds: folderIds,
		});

		if (response.data.success) {
			dispatch({
				type: ARCHIVE_FOLDERS,
				payload: folderIds,
			});
			return { success: true, message: "Causas archivadas exitosamente" };
		} else {
			return { success: false, message: response.data.message || "No se pudieron archivar las causas." };
		}
	} catch (error) {
		const errorMessage = axios.isAxiosError(error)
			? error.response?.data?.message || "Error al archivar causas."
			: "Error desconocido al archivar causas.";

		dispatch({
			type: SET_FOLDER_ERROR,
			payload: errorMessage,
		});
		return { success: false, message: errorMessage };
	}
};

export const getArchivedFoldersByUserId = (userId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_FOLDER_LOADING });
		// Campos optimizados para listas y vistas resumidas, incluyendo campos de verificación
		const fields =
			"_id,folderName,status,materia,orderStatus,initialDateFolder,finalDateFolder,folderJuris,folderFuero,description,customerName,pjn,causaVerified,causaIsValid,causaAssociationStatus,mev,judFolder";
		const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/folders/user/${userId}`, {
			params: {
				archived: true,
				fields,
			},
		});
		if (response.data.success) {
			dispatch({
				type: GET_ARCHIVED_FOLDERS,
				payload: response.data.folders,
			});
		}
	} catch (error) {
		dispatch({
			type: SET_FOLDER_ERROR,
			payload: axios.isAxiosError(error) ? error.response?.data?.message || "Error al obtener folders archivados" : "Error desconocido",
		});
	}
};

export const unarchiveFolders = (userId: string, folderIds: string[]) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_FOLDER_LOADING });
		const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/subscriptions/unarchive-items?userId=${userId}`, {
			resourceType: "folders",
			itemIds: folderIds,
		});

		if (response.data.success) {
			// Obtener los IDs de las carpetas que realmente fueron desarchivadas
			const unarchivedIds = response.data.unarchiveResult?.unarchivedIds || [];

			if (unarchivedIds.length > 0) {
				// Enviar solo los IDs al reducer - el reducer buscará los datos completos en archivedFolders
				dispatch({
					type: UNARCHIVE_FOLDERS,
					payload: unarchivedIds,
				});

				return {
					success: true,
					message: `${unarchivedIds.length} causas desarchivadas exitosamente`,
				};
			} else {
				// Ninguna carpeta fue desarchivada (posiblemente por límites)
				// Importante: Despachar SET_FOLDER_ERROR para resetear isLoader
				dispatch({
					type: SET_FOLDER_ERROR,
					payload: response.data.unarchiveResult?.message || "No se pudieron desarchivar las causas debido a los límites del plan.",
				});
				return {
					success: false,
					message: response.data.unarchiveResult?.message || "No se pudieron desarchivar las causas debido a los límites del plan.",
				};
			}
		} else {
			// Importante: Despachar SET_FOLDER_ERROR para resetear isLoader
			dispatch({
				type: SET_FOLDER_ERROR,
				payload: response.data.message || "No se pudieron desarchivar las causas.",
			});
			return {
				success: false,
				message: response.data.message || "No se pudieron desarchivar las causas.",
			};
		}
	} catch (error) {
		const errorMessage = axios.isAxiosError(error)
			? error.response?.data?.message || "Error al desarchivar causas."
			: "Error desconocido al desarchivar causas.";

		dispatch({
			type: SET_FOLDER_ERROR,
			payload: errorMessage,
		});
		return { success: false, message: errorMessage };
	}
};

export interface GetFoldersByIdsResponse {
	success: boolean;
	folders: FolderData[];
	error?: string;
}

export const getFoldersByIds =
	(folderIds: string[]) =>
	async (dispatch: Dispatch): Promise<GetFoldersByIdsResponse> => {
		dispatch({ type: SET_FOLDER_LOADING });
		try {
			if (!folderIds || folderIds.length === 0) {
				dispatch({
					type: GET_FOLDERS_BY_IDS,
					payload: [],
				});
				return {
					success: true,
					folders: [],
				};
			}

			// Campos optimizados para vistas resumidas (usado en CustomerView)
			const fields = "_id,folderName,status";

			// Add timeout to the axios request
			const response = await axios.post(
				`${import.meta.env.VITE_BASE_URL}/api/folders/batch`,
				{
					folderIds,
					fields,
				},
				{
					timeout: 30000, // 30 seconds timeout
					withCredentials: true,
				},
			);

			if (Array.isArray(response.data.folders)) {
				dispatch({
					type: GET_FOLDERS_BY_IDS,
					payload: response.data.folders,
				});
				return { success: true, folders: response.data.folders };
			}

			// Invalid response format
			dispatch({
				type: SET_FOLDER_ERROR,
				payload: "Formato de respuesta inválido",
			});
			return {
				success: false,
				folders: [],
				error: "Formato de respuesta inválido",
			};
		} catch (error) {
			let errorMessage = "Error al obtener los folders";

			if (axios.isAxiosError(error)) {
				if (error.code === "ECONNABORTED") {
					errorMessage = "Tiempo de espera agotado al obtener las carpetas";
				} else if (error.response) {
					errorMessage = error.response.data?.message || errorMessage;
				}
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}

			// Always dispatch error to ensure isLoader is set to false
			dispatch({
				type: SET_FOLDER_ERROR,
				payload: errorMessage,
			});

			return {
				success: false,
				folders: [],
				error: errorMessage,
			};
		}
	};

// Filtrar folders por criterios
interface FilterFoldersParams {
	status?: string;
	materia?: string;
	folderJuris?: string;
	folderFuero?: string;
	orderStatus?: string;
}

export const filterFolders = (filters: FilterFoldersParams) => async (dispatch: Dispatch, getState: any) => {
	try {
		const state = getState();
		const { folders, isInitialized } = state.folder;
		const auth = state.auth;
		const userId = auth.user?._id;

		// Si tenemos userId y no hay datos en cache, descargar todos primero
		if (userId && !isInitialized) {
			// Descargar todos los folders del usuario
			const result = await dispatch(getFoldersByUserId(userId) as any);
			if (!result.success) {
				return result;
			}
		}

		// Ahora filtrar localmente (ya sea de los datos existentes o recién descargados)
		const currentFolders = isInitialized ? folders : getState().folder.folders;

		// Verifica que currentFolders existe y es un array
		if (!Array.isArray(currentFolders)) {
			return { success: false, error: "No hay carpetas disponibles" };
		}

		// Filtrar folders según los criterios proporcionados
		let filteredFolders = currentFolders;

		if (filters.status) {
			filteredFolders = filteredFolders.filter((folder) => folder.status === filters.status);
		}
		if (filters.materia) {
			filteredFolders = filteredFolders.filter((folder) => folder.materia === filters.materia);
		}
		if (filters.folderJuris) {
			filteredFolders = filteredFolders.filter((folder) => folder.folderJuris === filters.folderJuris);
		}
		if (filters.folderFuero) {
			filteredFolders = filteredFolders.filter((folder) => folder.folderFuero === filters.folderFuero);
		}
		if (filters.orderStatus) {
			filteredFolders = filteredFolders.filter((folder) => folder.orderStatus === filters.orderStatus);
		}

		// Despachar la acción con los folders filtrados
		dispatch({
			type: SET_SELECTED_FOLDERS,
			payload: filteredFolders,
		});

		return { success: true, folders: filteredFolders };
	} catch (error) {
		const errorMessage = error instanceof Error ? error.message : "Error al filtrar carpetas";
		dispatch({
			type: SET_FOLDER_ERROR,
			payload: errorMessage,
		});
		return { success: false, error: errorMessage };
	}
};

// Action para resetear el estado (útil para logout)
export const resetFoldersState = () => ({
	type: RESET_FOLDERS_STATE,
});

// Vincular carpeta con causa judicial
export const linkFolderToCausa =
	(folderId: string, linkData: { pjnCode: string; number: string; year: string; overwrite?: boolean; pjn?: boolean }) =>
	async (dispatch: Dispatch) => {
		try {
			dispatch({ type: SET_FOLDER_LOADING });
			const response = await axios.put(`${import.meta.env.VITE_BASE_URL}/api/folders/link-causa/${folderId}`, linkData);

			if (response.data.success) {
				// Actualizar el folder en el store con los nuevos datos
				dispatch({
					type: UPDATE_FOLDER,
					payload: response.data.folder,
				});

				return {
					success: true,
					message: response.data.message,
					folder: response.data.folder,
					causaInfo: response.data.causaInfo,
				};
			} else {
				return {
					success: false,
					message: response.data.message || "No se pudo vincular la causa.",
				};
			}
		} catch (error) {
			const errorMessage = axios.isAxiosError(error)
				? error.response?.data?.message || "Error al vincular la causa."
				: "Error desconocido al vincular la causa.";

			dispatch({
				type: SET_FOLDER_ERROR,
				payload: errorMessage,
			});

			return { success: false, message: errorMessage };
		}
	};

// Vincular carpeta con Poder Judicial de Buenos Aires (MEV)
export const linkFolderToPJBA =
	(folderId: string, linkData: { number: string; year: string; navigationCode: string; overwrite?: boolean }) =>
	async (dispatch: Dispatch) => {
		try {
			dispatch({ type: SET_FOLDER_LOADING });

			// Preparar el body con mev: true
			const requestBody = {
				...linkData,
				mev: true, // Indicador de que es una causa MEV
			};

			// Usar el endpoint correcto: /api/folders/link-causa/{folderId}
			const response = await axios.put(`${import.meta.env.VITE_BASE_URL}/api/folders/link-causa/${folderId}`, requestBody);

			if (response.data.success) {
				// Actualizar el folder en el store con los nuevos datos
				dispatch({
					type: UPDATE_FOLDER,
					payload: response.data.folder,
				});

				return {
					success: true,
					message: response.data.message,
					folder: response.data.folder,
					causaInfo: response.data.causaInfo,
					mev: response.data.mev,
				};
			} else {
				return {
					success: false,
					message: response.data.message || "No se pudo vincular la causa.",
				};
			}
		} catch (error) {
			const errorMessage = axios.isAxiosError(error)
				? error.response?.data?.message || "Error al vincular la causa."
				: "Error desconocido al vincular la causa.";

			dispatch({
				type: SET_FOLDER_ERROR,
				payload: errorMessage,
			});

			return { success: false, message: errorMessage };
		}
	};

export default folder;

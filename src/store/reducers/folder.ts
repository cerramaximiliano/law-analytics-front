// reducers/folder.ts

import axios from "axios";
import { Dispatch } from "redux";
import { FolderData, FolderState } from "types/folder";

// Action types
const SET_LOADING = "SET_LOADING";
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

// Initial state
const initialFolderState: FolderState = {
	folders: [],
	archivedFolders: [],
	folder: null,
	isLoader: false,
	error: undefined,
};

// Reducer
// Reducer
const folder = (state = initialFolderState, action: any) => {
	switch (action.type) {
		case SET_LOADING:
			return { ...state, isLoader: true, error: null };
		case ADD_FOLDER:
			return {
				...state,
				folders: [...state.folders, action.payload],
				isLoader: false,
			};
		case GET_FOLDERS_BY_USER:
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
			const foldersToArchive = state.folders.filter((folder: FolderData) => 
				folderIdsToArchive.includes(folder._id)
			);
			
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
			const folderIdsToUnarchive = action.payload.map((f: any) => 
				typeof f === 'string' ? f : f._id
			);
			
			// Buscar las carpetas completas en archivedFolders
			const foldersToUnarchive = state.archivedFolders.filter((folder: FolderData) => 
				folderIdsToUnarchive.includes(folder._id)
			);
			
			return {
				...state,
				// Añadir las carpetas desarchivadas a la lista de carpetas activas
				// Si encontramos la carpeta completa en archivedFolders, la usamos, sino usamos la versión parcial
				folders: [
					...state.folders, 
					...foldersToUnarchive.length > 0 
						? foldersToUnarchive 
						: action.payload
				],
				// Remover las carpetas desarchivadas de la lista de archivados
				archivedFolders: state.archivedFolders.filter(
					(folder: FolderData) => !folderIdsToUnarchive.includes(folder._id)
				),
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
		default:
			return state;
	}
};

// Action creators

export const addFolder = (folderData: FolderData) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/folders`, folderData);
		if (response.data.success) {
			dispatch({
				type: ADD_FOLDER,
				payload: response.data.folder,
			});
		}
	} catch (error) {
		dispatch({
			type: SET_FOLDER_ERROR,
			payload: axios.isAxiosError(error) ? error.response?.data?.message || "Error al crear folder" : "Error desconocido",
		});
	}
};

export const getFoldersByUserId = (userId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/folders/user/${userId}`);
		if (response.data.success) {
			dispatch({
				type: GET_FOLDERS_BY_USER,
				payload: response.data.folders,
			});
		}
	} catch (error) {
		dispatch({
			type: SET_FOLDER_ERROR,
			payload: axios.isAxiosError(error) ? error.response?.data?.message || "Error al obtener folders por usuario" : "Error desconocido",
		});
	}
};

export const getFoldersByGroupId = (groupId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/folders/group/${groupId}`);
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

export const getFolderById = (folderId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/folders/${folderId}`);
		if (response.data.success) {
			dispatch({
				type: GET_FOLDER_BY_ID,
				payload: response.data.folder,
			});
		}
	} catch (error) {
		dispatch({
			type: SET_FOLDER_ERROR,
			payload: axios.isAxiosError(error) ? error.response?.data?.message || "Error al obtener folder" : "Error desconocido",
		});
	}
};

export const deleteFolderById = (folderId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/folders/${folderId}`);
		if (response.data.success) {
			dispatch({
				type: DELETE_FOLDER,
				payload: folderId,
			});
		}
	} catch (error) {
		dispatch({
			type: SET_FOLDER_ERROR,
			payload: axios.isAxiosError(error) ? error.response?.data?.message || "Error al eliminar folder" : "Error desconocido",
		});
	}
};

export const updateFolderById = (folderId: string, updatedData: Partial<FolderData>) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/folders/${folderId}`, updatedData);
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
		dispatch({ type: SET_LOADING });
		const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/subscriptions/archive-items?userId=${userId}`, {
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
		dispatch({ type: SET_LOADING });
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/folders/user/${userId}?archived=true`);
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
		dispatch({ type: SET_LOADING });
		const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/subscriptions/unarchive-items?userId=${userId}`, {
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
					message: `${unarchivedIds.length} causas desarchivadas exitosamente` 
				};
			} else {
				// Ninguna carpeta fue desarchivada (posiblemente por límites)
				return { 
					success: false, 
					message: response.data.unarchiveResult?.message || "No se pudieron desarchivar las causas debido a los límites del plan." 
				};
			}
		} else {
			return { 
				success: false, 
				message: response.data.message || "No se pudieron desarchivar las causas." 
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

export default folder;

import axios from "axios";
import { Dispatch } from "redux";
import { FolderData } from "types/folder";

// Action types
const ADD_FOLDER = "ADD_FOLDER";
const GET_FOLDERS_BY_USER = "GET_FOLDERS_BY_USER";
const GET_FOLDERS_BY_GROUP = "GET_FOLDERS_BY_GROUP";
const GET_FOLDER_BY_ID = "GET_FOLDER_BY_ID";
const DELETE_FOLDER = "DELETE_FOLDER";
const UPDATE_FOLDER = "UPDATE_FOLDER";
const SET_FOLDER_ERROR = "SET_FOLDER_ERROR";

// Initial state
const initialFolderState = {
	folders: [],
	folder: null,
	isLoader: false,
	error: undefined,
};

// Reducer
const folder = (state = initialFolderState, action: any) => {
	switch (action.type) {
		case ADD_FOLDER:
			return {
				...state,
				folders: [...state.folders, action.payload],
			};
		case GET_FOLDERS_BY_USER:
		case GET_FOLDERS_BY_GROUP:
			return {
				...state,
				folders: action.payload,
			};
		case GET_FOLDER_BY_ID:
			return {
				...state,
				folder: action.payload,
			};
		case DELETE_FOLDER:
			return {
				...state,
				folders: state.folders.filter((folder: FolderData) => folder._id !== action.payload),
			};
		case UPDATE_FOLDER:
			return {
				...state,
				folder: action.payload,
				folders: state.folders.map((folder: FolderData) => (folder._id === action.payload._id ? action.payload : folder)),
			};
		case SET_FOLDER_ERROR:
			return {
				...state,
				error: action.payload,
			};
		default:
			return state;
	}
};

// Action creators

export const addFolder = (folderData: FolderData) => async (dispatch: Dispatch) => {
	try {
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
		const errorMessage = axios.isAxiosError(error)
			? error.response?.data?.message || "Error al actualizar folder."
			: "Error desconocido.";
		dispatch({
			type: SET_FOLDER_ERROR,
			payload: errorMessage,
		});
		return { success: false, message: errorMessage };
	}
};


export default folder;

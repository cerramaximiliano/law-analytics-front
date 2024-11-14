import axios from "axios";
import { Dispatch } from "redux";
// Types for the actions and state
import { Folder, FolderState, Action } from "types/folders";

// action types
const ADD_FOLDER = "ADD_FOLDER";
const GET_FOLDERS_BY_USER = "GET_FOLDERS_BY_USER";
const GET_FOLDERS_BY_GROUP = "GET_FOLDERS_BY_GROUP";
const DELETE_FOLDER = "DELETE_FOLDER";
const UPDATE_FOLDER = "UPDATE_FOLDER";
const SET_FOLDER_ERROR = "SET_FOLDER_ERROR";

// initial state
const initialFolderState: FolderState = {
	folders: [], // Array vacío para almacenar los folders
	isLoader: false, // Estado inicial del loader
	error: undefined, // No hay error inicialmente
};

// ==============================|| FOLDER REDUCER & ACTIONS ||============================== //

// Reducer para manejar el estado de los folders
const folderReducer = (state = initialFolderState, action: Action): FolderState => {
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
		case DELETE_FOLDER:
			return {
				...state,
				folders: state.folders.filter((folder) => folder._id !== action.payload),
			};
		case UPDATE_FOLDER:
			return {
				...state,
				folders: state.folders.map((folder) => (folder._id === action.payload._id ? action.payload : folder)),
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

// Agregar un nuevo folder
export const addFolder = (folderData: Folder) => async (dispatch: Dispatch) => {
	try {
		const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/folders`, folderData);

		if (response.data && response.data.folder) {
			dispatch({
				type: ADD_FOLDER,
				payload: response.data.folder,
			});
			return { success: true, folder: response.data.folder };
		} else {
			return { success: false };
		}
	} catch (error) {
		let errorMessage = "Error al agregar folder";
		if (axios.isAxiosError(error) && error.response) {
			errorMessage = error.response.data?.message || errorMessage;
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		dispatch({
			type: SET_FOLDER_ERROR,
			payload: errorMessage,
		});
		return { success: false, error };
	}
};

// Actualizar un folder existente
export const updateFolder = (folderId: string, updateData: Partial<Folder>) => async (dispatch: Dispatch) => {
	try {
		const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/folders/${folderId}`, updateData);

		if (response.data && response.data.folder) {
			dispatch({
				type: UPDATE_FOLDER,
				payload: response.data.folder,
			});
			return { success: true, folder: response.data.folder };
		} else {
			return { success: false };
		}
	} catch (error) {
		let errorMessage = "Error al actualizar folder";
		if (axios.isAxiosError(error) && error.response) {
			errorMessage = error.response.data?.message || errorMessage;
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		dispatch({
			type: SET_FOLDER_ERROR,
			payload: errorMessage,
		});
		return { success: false, error };
	}
};

// Obtener folders por userId
export const getFoldersByUserId = (userId: string) => async (dispatch: Dispatch) => {
	try {
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/folders/user/${userId}`);

		// Add data validation before dispatching
		if (Array.isArray(response.data)) {
			dispatch({
				type: GET_FOLDERS_BY_USER,
				payload: response.data,
			});
		} else {
			dispatch({
				type: SET_FOLDER_ERROR,
				payload: "Invalid data format received from server",
			});
		}
	} catch (error) {
		dispatch({
			type: SET_FOLDER_ERROR,
			payload: (error as any).response?.data?.message || "Error al obtener folders del usuario",
		});
	}
};

// Obtener folders por groupId
export const getFoldersByGroupId = (groupId: string) => async (dispatch: Dispatch) => {
	try {
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/folders/group/${groupId}`);
		dispatch({
			type: GET_FOLDERS_BY_GROUP,
			payload: response.data,
		});
	} catch (error) {
		dispatch({
			type: SET_FOLDER_ERROR,
			payload: (error as any).response?.data?.message || "Error al obtener folders del grupo",
		});
	}
};

// Eliminar folder por _id
export const deleteFolder = (folderId: string) => async (dispatch: Dispatch) => {
	try {
		await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/folders/${folderId}`);
		dispatch({
			type: DELETE_FOLDER,
			payload: folderId,
		});
	} catch (error) {
		dispatch({
			type: SET_FOLDER_ERROR,
			payload: (error as any).response?.data?.message || "Error al eliminar folder",
		});
	}
};

export default folderReducer;

import axios, { AxiosError } from "axios";
import { Dispatch } from "redux";

import { NotificationType, NotificationsState, Action } from "types/notifications";

const initialState: NotificationsState = {
	notifications: [],
	isLoader: false,
	error: null,
};

const SET_LOADING = "notifications/SET_LOADING";
const SET_ERROR = "notifications/SET_ERROR";
const ADD_NOTIFICATION = "notifications/ADD_NOTIFICATION";
const SET_NOTIFICATIONS = "notifications/SET_NOTIFICATIONS";
const UPDATE_NOTIFICATION = "notifications/UPDATE_NOTIFICATION";
const DELETE_NOTIFICATION = "notifications/DELETE_NOTIFICATION";

const notificationsReducer = (state = initialState, action: Action): NotificationsState => {
	switch (action.type) {
		case SET_LOADING:
			return { ...state, isLoader: true, error: null };
		case SET_ERROR:
			return { ...state, isLoader: false, error: action.payload };
		case ADD_NOTIFICATION:
			return {
				...state,
				notifications: [...state.notifications, action.payload],
				isLoader: false,
			};
		case SET_NOTIFICATIONS:
			return {
				...state,
				notifications: action.payload,
				isLoader: false,
			};
		case UPDATE_NOTIFICATION:
			return {
				...state,
				notifications: state.notifications.map((notif) => (notif._id === action.payload._id ? action.payload : notif)),
				isLoader: false,
			};
		case DELETE_NOTIFICATION:
			return {
				...state,
				notifications: state.notifications.filter((notif) => notif._id !== action.payload),
				isLoader: false,
			};
		default:
			return state;
	}
};

const handleError = (error: unknown): string => {
	if (error instanceof AxiosError) {
		return error.response?.data?.message || "Error en la operación";
	}
	return "Error en la operación";
};

export const addNotification = (data: Omit<NotificationType, "_id">) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/folder-notifications`, data);
		dispatch({
			type: ADD_NOTIFICATION,
			payload: response.data.notification,
		});
		return { success: true, notification: response.data.notification };
	} catch (error: unknown) {
		const errorMessage = handleError(error);
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export const getNotificationsByUserId = (userId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		// Campos optimizados para listas y vistas
		const fields = "_id,title,time,dateExpiration,notification,user,description,folderId";
		const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/folder-notifications/user/${userId}`, {
			params: { fields },
		});
		dispatch({
			type: SET_NOTIFICATIONS,
			payload: response.data.notifications,
		});
		return { success: true };
	} catch (error: unknown) {
		const errorMessage = handleError(error);
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export const getNotificationsByGroupId = (groupId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		// Campos optimizados para listas y vistas
		const fields = "_id,title,time,dateExpiration,notification,user,description,folderId";
		const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/folder-notifications/group/${groupId}`, {
			params: { fields },
		});
		dispatch({
			type: SET_NOTIFICATIONS,
			payload: response.data.notifications,
		});
		return { success: true };
	} catch (error: unknown) {
		const errorMessage = handleError(error);
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export const getNotificationsByFolderId = (folderId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		// Campos optimizados para listas y vistas
		const fields = "_id,title,time,dateExpiration,notification,user,description,folderId";
		const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/folder-notifications/folder/${folderId}`, {
			params: { fields },
		});
		dispatch({
			type: SET_NOTIFICATIONS,
			payload: response.data.notifications,
		});
		return { success: true };
	} catch (error: unknown) {
		const errorMessage = handleError(error);
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export const updateNotification = (id: string, data: Partial<NotificationType>) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.put(`${import.meta.env.VITE_BASE_URL}/api/folder-notifications/${id}`, data);
		dispatch({
			type: UPDATE_NOTIFICATION,
			payload: response.data.notification,
		});
		return { success: true };
	} catch (error: unknown) {
		const errorMessage = handleError(error);
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export const deleteNotification = (id: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/folder-notifications/${id}`);
		dispatch({
			type: DELETE_NOTIFICATION,
			payload: id,
		});
		return { success: true };
	} catch (error: unknown) {
		const errorMessage = handleError(error);
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export default notificationsReducer;

import axios, { AxiosError } from "axios";
import { Dispatch } from "redux";

import { NotificationType, NotificationsState, Action } from "types/notifications";

const initialState: NotificationsState = {
	notifications: [],
	isLoader: false,
	error: null,
};

const SET_LOADING = "SET_LOADING";
const SET_ERROR = "SET_ERROR";
const ADD_NOTIFICATION = "ADD_NOTIFICATION";
const SET_NOTIFICATIONS = "SET_NOTIFICATIONS";
const UPDATE_NOTIFICATION = "UPDATE_NOTIFICATION";
const DELETE_NOTIFICATION = "DELETE_NOTIFICATION";

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
		const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/notifications`, data);
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
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/notifications/user/${userId}`);
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
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/notifications/group/${groupId}`);
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
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/notifications/folder/${folderId}`);
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
		const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/notifications/${id}`, data);
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
		await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/notifications/${id}`);
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

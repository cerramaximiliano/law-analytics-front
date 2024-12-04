import axios, { AxiosError } from "axios";
import { Dispatch } from "redux";
import { TaskType, TaskState } from "types/task";

const SET_LOADING = "tasks/SET_LOADING";
const SET_ERROR = "tasks/SET_ERROR";
const ADD_TASK = "tasks/ADD_TASK";
const SET_TASKS = "tasks/SET_TASKS";
const UPDATE_TASK = "tasks/UPDATE_TASK";
const DELETE_TASK = "tasks/DELETE_TASK";

const initialState: TaskState = {
	tasks: [],
	isLoader: false,
	error: null,
};

const tasksReducer = (state = initialState, action: any) => {
	switch (action.type) {
		case SET_LOADING:
			return { ...state, isLoader: true, error: null };
		case SET_ERROR:
			return { ...state, isLoader: false, error: action.payload };
		case ADD_TASK:
			return {
				...state,
				tasks: [...state.tasks, action.payload],
				isLoader: false,
			};
		case SET_TASKS:
			return {
				...state,
				tasks: action.payload,
				isLoader: false,
			};
		case UPDATE_TASK:
			return {
				...state,
				tasks: state.tasks.map((task) => (task._id === action.payload._id ? action.payload : task)),
				isLoader: false,
			};
		case DELETE_TASK:
			return {
				...state,
				tasks: state.tasks.filter((task) => task._id !== action.payload),
				isLoader: false,
			};
		default:
			return state;
	}
};

// Actions
export const addTask = (data: Omit<TaskType, "_id">) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/tasks`, data);
		console.log(response);
		dispatch({
			type: ADD_TASK,
			payload: response.data,
		});
		return { success: true, task: response.data };
	} catch (error: unknown) {
		console.log(error);
		const errorMessage =
			error instanceof AxiosError ? error.response?.data?.message || "Error al crear la tarea" : "Error al crear la tarea";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export const getTasksByUserId = (userId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tasks/user/${userId}`);
		dispatch({
			type: SET_TASKS,
			payload: response.data,
		});
		return { success: true };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof AxiosError ? error.response?.data?.message || "Error al obtener las tareas" : "Error al obtener las tareas";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export const getTasksByGroupId = (groupId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tasks/group/${groupId}`);
		dispatch({
			type: SET_TASKS,
			payload: response.data,
		});
		return { success: true };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof AxiosError ? error.response?.data?.message || "Error al obtener las tareas" : "Error al obtener las tareas";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export const getTasksByFolderId = (folderId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tasks/folder/${folderId}`);
		dispatch({
			type: SET_TASKS,
			payload: response.data,
		});
		return { success: true };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof AxiosError ? error.response?.data?.message || "Error al obtener las tareas" : "Error al obtener las tareas";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export const updateTask = (id: string, data: Partial<TaskType>) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/tasks/${id}`, data);
		dispatch({
			type: UPDATE_TASK,
			payload: response.data,
		});
		return { success: true };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof AxiosError ? error.response?.data?.message || "Error al actualizar la tarea" : "Error al actualizar la tarea";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export const toggleTaskStatus = (id: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/tasks/${id}/toggle`);
		dispatch({
			type: UPDATE_TASK,
			payload: response.data,
		});
		return { success: true };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof AxiosError
				? error.response?.data?.message || "Error al actualizar el estado de la tarea"
				: "Error al actualizar el estado de la tarea";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export const deleteTask = (id: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/tasks/${id}`);
		dispatch({
			type: DELETE_TASK,
			payload: id,
		});
		return { success: true };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof AxiosError ? error.response?.data?.message || "Error al eliminar la tarea" : "Error al eliminar la tarea";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export default tasksReducer;

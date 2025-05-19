import axios, { AxiosError } from "axios";
import { Dispatch } from "redux";
import { TaskType, TaskState } from "types/task";

// Action types
const SET_LOADING = "tasks/SET_LOADING";
const SET_ERROR = "tasks/SET_ERROR";
const ADD_TASK = "tasks/ADD_TASK";
const SET_TASKS = "tasks/SET_TASKS";
const UPDATE_TASK = "tasks/UPDATE_TASK";
const DELETE_TASK = "tasks/DELETE_TASK";
const ADD_COMMENT = "tasks/ADD_COMMENT";
const UPDATE_SUBTASK = "tasks/UPDATE_SUBTASK";
const SET_UPCOMING_TASKS = "tasks/SET_UPCOMING_TASKS";
const UPDATE_TASK_ASSIGNMENTS = "tasks/UPDATE_TASK_ASSIGNMENTS";
const SET_TASK_DETAIL = "tasks/SET_TASK_DETAIL";
const SET_TASK_DETAIL_LOADING = "tasks/SET_TASK_DETAIL_LOADING";

const initialState: TaskState = {
	tasks: [],
	upcomingTasks: [], // Nueva propiedad para tareas próximas
	task: null, // Single task for detail view
	taskDetails: {}, // Task details by ID
	taskDetailsLoading: {}, // Loading state for each task detail
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
		case ADD_COMMENT:
			return {
				...state,
				tasks: state.tasks.map((task) => (task._id === action.payload._id ? action.payload : task)),
				isLoader: false,
			};
		case UPDATE_SUBTASK:
			return {
				...state,
				tasks: state.tasks.map((task) => (task._id === action.payload._id ? action.payload : task)),
				isLoader: false,
			};
		case SET_UPCOMING_TASKS:
			return {
				...state,
				upcomingTasks: action.payload,
				isLoader: false,
			};
		case UPDATE_TASK_ASSIGNMENTS:
			return {
				...state,
				tasks: state.tasks.map((task) => (task._id === action.payload._id ? action.payload : task)),
				isLoader: false,
			};
		case SET_TASK_DETAIL:
			return {
				...state,
				taskDetails: {
					...state.taskDetails,
					[action.payload.id]: action.payload.data,
				},
			};
		case SET_TASK_DETAIL_LOADING:
			return {
				...state,
				taskDetailsLoading: {
					...state.taskDetailsLoading,
					[action.payload.id]: action.payload.loading,
				},
			};
		default:
			return state;
	}
};

// Acciones existentes
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

export const getTaskDetail = (id: string) => async (dispatch: Dispatch) => {
	try {
		// Set loading state for this specific task
		dispatch({
			type: SET_TASK_DETAIL_LOADING,
			payload: { id, loading: true },
		});

		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tasks/${id}`);

		dispatch({
			type: SET_TASK_DETAIL,
			payload: { id, data: response.data },
		});

		dispatch({
			type: SET_TASK_DETAIL_LOADING,
			payload: { id, loading: false },
		});

		return { success: true, data: response.data };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof AxiosError ? error.response?.data?.message || "Error al obtener la tarea" : "Error al obtener la tarea";

		dispatch({
			type: SET_TASK_DETAIL_LOADING,
			payload: { id, loading: false },
		});

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

// Nuevas acciones

/**
 * Añade un comentario a una tarea
 */
export const addComment = (id: string, commentData: { text: string; author: string }) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/tasks/${id}/comments`, commentData);
		dispatch({
			type: ADD_COMMENT,
			payload: response.data,
		});
		return { success: true };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof AxiosError ? error.response?.data?.message || "Error al añadir el comentario" : "Error al añadir el comentario";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

/**
 * Añade una nueva subtarea
 */
export const addSubtask = (id: string, subtaskData: { name: string; completed?: boolean }) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/tasks/${id}/subtasks`, subtaskData);
		dispatch({
			type: UPDATE_SUBTASK,
			payload: response.data,
		});
		return { success: true };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof AxiosError ? error.response?.data?.message || "Error al añadir la subtarea" : "Error al añadir la subtarea";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

/**
 * Actualiza una subtarea existente
 */
export const updateSubtask =
	(id: string, subtaskData: { subtaskId: string; name?: string; completed?: boolean }) => async (dispatch: Dispatch) => {
		try {
			dispatch({ type: SET_LOADING });
			const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/tasks/${id}/subtasks`, subtaskData);
			dispatch({
				type: UPDATE_SUBTASK,
				payload: response.data,
			});
			return { success: true };
		} catch (error: unknown) {
			const errorMessage =
				error instanceof AxiosError
					? error.response?.data?.message || "Error al actualizar la subtarea"
					: "Error al actualizar la subtarea";
			dispatch({ type: SET_ERROR, payload: errorMessage });
			return { success: false, error: errorMessage };
		}
	};

/**
 * Obtiene tareas próximas a vencer
 */
export const getUpcomingTasks =
	(userId: string, days: number = 7) =>
	async (dispatch: Dispatch) => {
		try {
			dispatch({ type: SET_LOADING });
			const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tasks/upcoming/${userId}?days=${days}`);
			dispatch({
				type: SET_UPCOMING_TASKS,
				payload: response.data,
			});
			return { success: true };
		} catch (error: unknown) {
			const errorMessage =
				error instanceof AxiosError
					? error.response?.data?.message || "Error al obtener las tareas próximas"
					: "Error al obtener las tareas próximas";
			dispatch({ type: SET_ERROR, payload: errorMessage });
			return { success: false, error: errorMessage };
		}
	};

/**
 * Asigna una tarea a uno o más usuarios
 */
export const assignTask = (id: string, userIds: string[]) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/tasks/${id}/assign`, { userIds });
		dispatch({
			type: UPDATE_TASK_ASSIGNMENTS,
			payload: response.data,
		});
		return { success: true };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof AxiosError ? error.response?.data?.message || "Error al asignar la tarea" : "Error al asignar la tarea";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export default tasksReducer;

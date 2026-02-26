import axios from "axios";
import { Dispatch } from "redux";
import { ActivityLogState, ActivityLogResponse, ActivityLogQueryParams } from "types/activityLog";

// Action types
export const GET_FOLDER_ACTIVITY = "activityLog/GET_FOLDER_ACTIVITY";
export const GET_GROUP_ACTIVITY = "activityLog/GET_GROUP_ACTIVITY";
export const GET_MY_ACTIVITY = "activityLog/GET_MY_ACTIVITY";
export const GET_ACTIVITY_STATS = "activityLog/GET_ACTIVITY_STATS";
export const SET_ACTIVITY_LOADING = "activityLog/SET_LOADING";
export const SET_ACTIVITY_ERROR = "activityLog/SET_ERROR";
export const CLEAR_ACTIVITY_LOG = "activityLog/CLEAR";

const initialState: ActivityLogState = {
	logs: [],
	pagination: undefined,
	stats: undefined,
	isLoading: false,
	error: undefined,
	// Cache tracking fields
	lastFetchedFolderId: undefined,
	lastFetchParams: undefined,
};

const activityLogReducer = (state = initialState, action: any): ActivityLogState => {
	switch (action.type) {
		case SET_ACTIVITY_LOADING:
			return {
				...state,
				isLoading: true,
				error: undefined,
			};

		case GET_FOLDER_ACTIVITY:
			return {
				...state,
				logs: action.payload.activity || [],
				pagination: action.payload.pagination,
				isLoading: false,
				error: undefined,
				lastFetchedFolderId: action.folderId,
				lastFetchParams: action.paramsKey,
			};

		case GET_GROUP_ACTIVITY:
		case GET_MY_ACTIVITY:
			return {
				...state,
				logs: action.payload.activity || [],
				pagination: action.payload.pagination,
				isLoading: false,
				error: undefined,
				// Clear folder-specific cache for non-folder queries
				lastFetchedFolderId: undefined,
				lastFetchParams: undefined,
			};

		case GET_ACTIVITY_STATS:
			return {
				...state,
				stats: action.payload.stats,
				isLoading: false,
			};

		case SET_ACTIVITY_ERROR:
			return {
				...state,
				error: action.payload,
				isLoading: false,
			};

		case CLEAR_ACTIVITY_LOG:
			return initialState;

		default:
			return state;
	}
};

// Build query params from ActivityLogQueryParams
const buildQueryParams = (params?: ActivityLogQueryParams): Record<string, any> => {
	const queryParams: Record<string, any> = {};

	if (params) {
		if (params.page !== undefined) queryParams.page = params.page;
		if (params.limit !== undefined) queryParams.limit = params.limit;
		if (params.resourceType) queryParams.resourceType = params.resourceType;
		if (params.action) queryParams.action = params.action;
		if (params.startDate) queryParams.startDate = params.startDate;
		if (params.endDate) queryParams.endDate = params.endDate;
	}

	return queryParams;
};

// Get folder activity log
export const getFolderActivityLog = (folderId: string, params?: ActivityLogQueryParams, forceRefresh: boolean = false) => async (dispatch: Dispatch, getState: any) => {
	try {
		// Build params key for cache comparison
		const paramsKey = JSON.stringify(params || {});

		// Cache validation: if we already have data for this folder with same params, return from cache
		const state = getState();
		const { lastFetchedFolderId, lastFetchParams, logs, pagination } = state.activityLog;

		if (!forceRefresh && lastFetchedFolderId === folderId && lastFetchParams === paramsKey && logs.length >= 0) {
			return {
				success: true,
				activity: logs,
				pagination,
				fromCache: true,
			};
		}

		dispatch({ type: SET_ACTIVITY_LOADING });

		const queryParams = buildQueryParams(params);

		const response = await axios.get<ActivityLogResponse>(`${import.meta.env.VITE_BASE_URL}/api/activity-log/folder/${folderId}`, {
			params: queryParams,
		});

		if (response.data.success) {
			dispatch({
				type: GET_FOLDER_ACTIVITY,
				payload: {
					activity: response.data.activity || [],
					pagination: response.data.pagination,
				},
				folderId,
				paramsKey,
			});

			return {
				success: true,
				activity: response.data.activity,
				pagination: response.data.pagination,
			};
		}

		throw new Error(response.data.message || "Error al obtener historial de actividad");
	} catch (error) {
		let errorMessage = "Error al obtener historial de actividad";

		if (axios.isAxiosError(error) && error.response?.data) {
			errorMessage = error.response.data.message || errorMessage;
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		dispatch({
			type: SET_ACTIVITY_ERROR,
			payload: errorMessage,
		});

		return {
			success: false,
			error: errorMessage,
		};
	}
};

// Get group activity log
export const getGroupActivityLog = (groupId: string, params?: ActivityLogQueryParams) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_ACTIVITY_LOADING });

		const queryParams = buildQueryParams(params);

		const response = await axios.get<ActivityLogResponse>(`${import.meta.env.VITE_BASE_URL}/api/activity-log/group/${groupId}`, {
			params: queryParams,
		});

		if (response.data.success) {
			dispatch({
				type: GET_GROUP_ACTIVITY,
				payload: {
					activity: response.data.activity || [],
					pagination: response.data.pagination,
				},
			});

			return {
				success: true,
				activity: response.data.activity,
				pagination: response.data.pagination,
			};
		}

		throw new Error(response.data.message || "Error al obtener actividad del equipo");
	} catch (error) {
		let errorMessage = "Error al obtener actividad del equipo";

		if (axios.isAxiosError(error) && error.response?.data) {
			errorMessage = error.response.data.message || errorMessage;
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		dispatch({
			type: SET_ACTIVITY_ERROR,
			payload: errorMessage,
		});

		return {
			success: false,
			error: errorMessage,
		};
	}
};

// Get my activity log
export const getMyActivityLog = (params?: ActivityLogQueryParams) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_ACTIVITY_LOADING });

		const queryParams = buildQueryParams(params);

		const response = await axios.get<ActivityLogResponse>(`${import.meta.env.VITE_BASE_URL}/api/activity-log/me`, {
			params: queryParams,
		});

		if (response.data.success) {
			dispatch({
				type: GET_MY_ACTIVITY,
				payload: {
					activity: response.data.activity || [],
					pagination: response.data.pagination,
				},
			});

			return {
				success: true,
				activity: response.data.activity,
				pagination: response.data.pagination,
			};
		}

		throw new Error(response.data.message || "Error al obtener mi actividad");
	} catch (error) {
		let errorMessage = "Error al obtener mi actividad";

		if (axios.isAxiosError(error) && error.response?.data) {
			errorMessage = error.response.data.message || errorMessage;
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		dispatch({
			type: SET_ACTIVITY_ERROR,
			payload: errorMessage,
		});

		return {
			success: false,
			error: errorMessage,
		};
	}
};

// Get activity stats
export const getActivityStats = (ownerId?: string, groupId?: string) => async (dispatch: Dispatch) => {
	try {
		const queryParams: Record<string, any> = {};
		if (ownerId) queryParams.ownerId = ownerId;
		if (groupId) queryParams.groupId = groupId;

		const response = await axios.get<{ success: boolean; stats?: any }>(`${import.meta.env.VITE_BASE_URL}/api/activity-log/stats`, {
			params: queryParams,
		});

		if (response.data.success) {
			dispatch({
				type: GET_ACTIVITY_STATS,
				payload: {
					stats: response.data.stats,
				},
			});

			return {
				success: true,
				stats: response.data.stats,
			};
		}

		return { success: false };
	} catch (error) {
		return { success: false };
	}
};

// Clear activity log
export const clearActivityLog = () => (dispatch: Dispatch) => {
	dispatch({ type: CLEAR_ACTIVITY_LOG });
};

export default activityLogReducer;

import axios from "axios";
import { Dispatch } from "redux";
import { CombinedActivitiesState, CombinedActivitiesResponse, ActivityQueryParams } from "types/activities";

export const GET_COMBINED_ACTIVITIES = "activities/GET_COMBINED_ACTIVITIES";
export const SET_LOADING = "activities/SET_LOADING";
export const SET_ERROR = "activities/SET_ERROR";
export const SET_PAGINATION = "activities/SET_PAGINATION";
export const CLEAR_ACTIVITIES = "activities/CLEAR_ACTIVITIES";

const initialState: CombinedActivitiesState = {
	activities: [],
	pagination: undefined,
	stats: undefined,
	documentsInfo: undefined,
	isLoading: false,
	error: undefined,
};

const activitiesReducer = (state = initialState, action: any): CombinedActivitiesState => {
	switch (action.type) {
		case SET_LOADING:
			return {
				...state,
				isLoading: true,
				error: undefined,
			};

		case GET_COMBINED_ACTIVITIES:
			return {
				...state,
				activities: action.payload.activities || [],
				pagination: action.payload.pagination,
				stats: action.payload.stats,
				documentsInfo: action.payload.documentsInfo,
				pjnAccess: action.payload.pjnAccess,
				isLoading: false,
				error: undefined,
			};

		case SET_PAGINATION:
			return {
				...state,
				pagination: action.payload,
			};

		case SET_ERROR:
			return {
				...state,
				error: action.payload,
				isLoading: false,
			};

		case CLEAR_ACTIVITIES:
			return initialState;

		default:
			return state;
	}
};

// Actions
export const getCombinedActivities = (folderId: string, params?: ActivityQueryParams) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });

		// Construir parámetros de consulta
		const queryParams: any = {};

		if (params) {
			if (params.page !== undefined) queryParams.page = params.page;
			if (params.limit !== undefined) queryParams.limit = params.limit;
			if (params.search) queryParams.search = params.search;
			if (params.sort) queryParams.sort = params.sort;

			// Manejar filtros
			if (params.filter) {
				// Tipos de actividad
				if (params.filter.types && params.filter.types.length > 0) {
					params.filter.types.forEach((type, index) => {
						queryParams[`filter[types][${index}]`] = type;
					});
				}

				// Rango de fechas
				if (params.filter.dateRange) {
					queryParams["filter[dateRange]"] = params.filter.dateRange;
				}

				// Filtros booleanos
				if (params.filter.hasExpiration !== undefined) {
					queryParams["filter[hasExpiration]"] = params.filter.hasExpiration;
				}
				if (params.filter.hasLink !== undefined) {
					queryParams["filter[hasLink]"] = params.filter.hasLink;
				}

				// Arrays de filtros específicos
				if (params.filter.sources && params.filter.sources.length > 0) {
					params.filter.sources.forEach((source, index) => {
						queryParams[`filter[sources][${index}]`] = source;
					});
				}
				if (params.filter.movements && params.filter.movements.length > 0) {
					params.filter.movements.forEach((movement, index) => {
						queryParams[`filter[movements][${index}]`] = movement;
					});
				}
				if (params.filter.notifications && params.filter.notifications.length > 0) {
					params.filter.notifications.forEach((notification, index) => {
						queryParams[`filter[notifications][${index}]`] = notification;
					});
				}
				if (params.filter.eventTypes && params.filter.eventTypes.length > 0) {
					params.filter.eventTypes.forEach((eventType, index) => {
						queryParams[`filter[eventTypes][${index}]`] = eventType;
					});
				}
			}
		}

		const response = await axios.get<CombinedActivitiesResponse>(
			`${process.env.REACT_APP_BASE_URL}/api/folders/${folderId}/activities/combined`,
			{ params: queryParams },
		);

		if (response.data.success && response.data.data) {
			dispatch({
				type: GET_COMBINED_ACTIVITIES,
				payload: response.data.data,
			});

			return {
				success: true,
				...response.data.data,
			};
		}

		throw new Error(response.data.message || "Error al obtener actividades combinadas");
	} catch (error) {
		let errorMessage = "Error al obtener actividades combinadas";

		if (axios.isAxiosError(error) && error.response?.data) {
			errorMessage = error.response.data.message || errorMessage;
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		dispatch({
			type: SET_ERROR,
			payload: errorMessage,
		});

		return {
			success: false,
			error: errorMessage,
		};
	}
};

export const clearActivities = () => (dispatch: Dispatch) => {
	dispatch({ type: CLEAR_ACTIVITIES });
};

export default activitiesReducer;

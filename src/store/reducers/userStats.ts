// store/reducers/userStats.js
import axios from "axios";
import { Dispatch } from "redux";
import { openSnackbar } from "store/reducers/snackbar";

// Tipos de acciones
import { FETCH_USER_STATS_REQUEST, FETCH_USER_STATS_SUCCESS, FETCH_USER_STATS_FAILURE, INCREMENT_USER_STAT } from "./actions";

// Interfaz para el estado de UserStats
export interface UserStatsState {
	loading: boolean;
	error: string | null;
	data: {
		counts: {
			calculators: number;
			folders: number;
			movements: number;
			notifications: number;
			events: number;
			contacts: number;
			alerts: number;
		};
		lastUpdated: string | null;
	};
}

// Estado inicial
const initialState: UserStatsState = {
	loading: false,
	error: null,
	data: {
		counts: {
			calculators: 0,
			folders: 0,
			movements: 0,
			notifications: 0,
			events: 0,
			contacts: 0,
			alerts: 0,
		},
		lastUpdated: null,
	},
};

// Interfaces para las acciones
interface FetchUserStatsRequestAction {
	type: typeof FETCH_USER_STATS_REQUEST;
}

interface FetchUserStatsSuccessAction {
	type: typeof FETCH_USER_STATS_SUCCESS;
	payload: any;
}

interface FetchUserStatsFailureAction {
	type: typeof FETCH_USER_STATS_FAILURE;
	payload: string;
}

interface IncrementUserStatAction {
	type: typeof INCREMENT_USER_STAT;
	payload: {
		counterType: string;
		value: number;
	};
}

type UserStatsActionTypes =
	| FetchUserStatsRequestAction
	| FetchUserStatsSuccessAction
	| FetchUserStatsFailureAction
	| IncrementUserStatAction;

// Reducer
const userStatsReducer = (state = initialState, action: UserStatsActionTypes): UserStatsState => {
	switch (action.type) {
		case FETCH_USER_STATS_REQUEST:
			return {
				...state,
				loading: true,
				error: null,
			};
		case FETCH_USER_STATS_SUCCESS:
			return {
				...state,
				loading: false,
				data: {
					...state.data,
					counts: action.payload.counts,
					lastUpdated: action.payload.lastUpdated,
				},
			};
		case FETCH_USER_STATS_FAILURE:
			return {
				...state,
				loading: false,
				error: action.payload,
			};
		case INCREMENT_USER_STAT:
			return {
				...state,
				data: {
					...state.data,
					counts: {
						...state.data.counts,
						[action.payload.counterType]:
							state.data.counts[action.payload.counterType as keyof typeof state.data.counts] + action.payload.value,
					},
				},
			};
		default:
			return state;
	}
};

export default userStatsReducer;

// Acciones
export const fetchUserStats = () => async (dispatch: Dispatch) => {
	dispatch({ type: FETCH_USER_STATS_REQUEST });

	try {
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/user-stats/user`, {
			withCredentials: true,
		});

		if (response.data && response.data.success) {
			dispatch({
				type: FETCH_USER_STATS_SUCCESS,
				payload: response.data.data,
			});
		} else {
			throw new Error(response.data.message || "Error al obtener estadísticas");
		}
	} catch (error: any) {
		dispatch({
			type: FETCH_USER_STATS_FAILURE,
			payload: error.response?.data?.message || error.message || "Error al obtener estadísticas",
		});

		dispatch(
			openSnackbar({
				open: true,
				message: error.response?.data?.message || error.message || "Error al obtener estadísticas",
				variant: "alert",
				alert: {
					color: "error",
				},
				close: false,
			}),
		);
	}
};

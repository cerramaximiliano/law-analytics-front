import axios from "axios";
import { Dispatch } from "redux";
import { Movement, MovementState } from "types/movements";

export const GET_MOVEMENTS_BY_FOLDER = "GET_MOVEMENTS_BY_FOLDER";
export const GET_MOVEMENTS = "GET_MOVEMENTS";
export const UPDATE_MOVEMENT = "UPDATE_MOVEMENT";
export const DELETE_MOVEMENT = "DELETE_MOVEMENT";
export const SET_MOVEMENT_ERROR = "SET_MOVEMENT_ERROR";
export const SET_LOADING = "SET_LOADING";
export const ADD_MOVEMENT = "ADD_MOVEMENT";

const initialMovementState: MovementState = {
	movements: [],
	isLoading: false,
	error: undefined,
};

const movementReducer = (state = initialMovementState, action: any): MovementState => {
	switch (action.type) {
		case ADD_MOVEMENT:
			return {
				...state,
				movements: [...state.movements, action.payload],
				isLoading: false,
			};
		case GET_MOVEMENTS:
			return {
				...state,
				movements: action.payload,
				isLoading: false,
			};
		case GET_MOVEMENTS_BY_FOLDER:
			return {
				...state,
				movements: action.payload,
				isLoading: false,
			};
		case UPDATE_MOVEMENT:
			return {
				...state,
				movements: state.movements.map((movement) => (movement._id === action.payload._id ? action.payload : movement)),
				isLoading: false,
			};
		case DELETE_MOVEMENT:
			return {
				...state,
				movements: state.movements.filter((movement) => movement._id !== action.payload),
				isLoading: false,
			};
		case SET_MOVEMENT_ERROR:
			return {
				...state,
				error: action.payload,
				isLoading: false,
			};
		case SET_LOADING:
			return {
				...state,
				isLoading: true,
			};
		default:
			return state;
	}
};

// Actions
export const getMovementsByUserId = (userId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });

		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/movements/user/${userId}`);

		if (Array.isArray(response.data)) {
			dispatch({
				type: GET_MOVEMENTS,
				payload: response.data,
			});
			return { success: true, movements: response.data };
		}

		throw new Error("Formato de respuesta inválido");
	} catch (error) {
		let errorMessage = "Error al obtener los movimientos";
		if (axios.isAxiosError(error) && error.response) {
			errorMessage = error.response.data?.message || errorMessage;
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		dispatch({
			type: SET_MOVEMENT_ERROR,
			payload: errorMessage,
		});

		return { success: false, error: errorMessage };
	}
};

export const updateMovement = (movementId: string, updateData: Partial<Movement>) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });

		const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/movements/${movementId}`, updateData);

		if (response.data.success && response.data.movement) {
			dispatch({
				type: UPDATE_MOVEMENT,
				payload: response.data.movement,
			});
			return { success: true, movement: response.data.movement };
		}

		throw new Error(response.data.message || "Error al actualizar el movimiento");
	} catch (error) {
		let errorMessage = "Error al actualizar el movimiento";
		if (axios.isAxiosError(error) && error.response) {
			errorMessage = error.response.data?.message || errorMessage;
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		dispatch({
			type: SET_MOVEMENT_ERROR,
			payload: errorMessage,
		});

		return { success: false, error: errorMessage };
	}
};

export const deleteMovement = (movementId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });

		const response = await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/movements/${movementId}`);

		if (response.data.success) {
			dispatch({
				type: DELETE_MOVEMENT,
				payload: movementId,
			});
			return { success: true };
		}

		throw new Error(response.data.message || "Error al eliminar el movimiento");
	} catch (error) {
		let errorMessage = "Error al eliminar el movimiento";
		if (axios.isAxiosError(error) && error.response) {
			errorMessage = error.response.data?.message || errorMessage;
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		dispatch({
			type: SET_MOVEMENT_ERROR,
			payload: errorMessage,
		});

		return { success: false, error: errorMessage };
	}
};

export const addMovement = (movementData: Omit<Movement, "_id">) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });

		const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/movements`, movementData);

		if (response.data.success && response.data.movement) {
			dispatch({
				type: ADD_MOVEMENT,
				payload: response.data.movement,
			});

			return {
				success: true,
				movement: response.data.movement,
			};
		}

		throw new Error(response.data.message || "Error al crear el movimiento");
	} catch (error) {
		let errorMessage = "Error al crear el movimiento";

		if (axios.isAxiosError(error) && error.response) {
			errorMessage = error.response.data?.message || errorMessage;
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		dispatch({
			type: SET_MOVEMENT_ERROR,
			payload: errorMessage,
		});

		return {
			success: false,
			error: errorMessage,
		};
	}
};

interface SuccessResponse {
	success: true;
	movements: Movement[];
	count: number;
}

interface ErrorResponse {
	success: false;
	message: string;
}

type MovementsResponse = SuccessResponse | ErrorResponse;

export const getMovementsByFolderId = (folderId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });

		const response = await axios.get<MovementsResponse>(`${process.env.REACT_APP_BASE_URL}/api/movements/folder/${folderId}`);

		if (response.data.success) {
			dispatch({
				type: GET_MOVEMENTS_BY_FOLDER,
				payload: response.data.movements,
			});

			return {
				success: true,
				movements: response.data.movements,
				count: response.data.count,
			};
		}

		// Si no hay éxito, ya sabemos que response.data es ErrorResponse
		return {
			success: false,
			movements: [],
			error: response.data.message,
		};
	} catch (error) {
		let errorMessage = "Error al obtener los movimientos del folder";

		if (axios.isAxiosError(error) && error.response?.data) {
			errorMessage = error.response.data.message || errorMessage;
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		dispatch({
			type: SET_MOVEMENT_ERROR,
			payload: errorMessage,
		});

		return {
			success: false,
			movements: [],
			error: errorMessage,
		};
	}
};

export default movementReducer;

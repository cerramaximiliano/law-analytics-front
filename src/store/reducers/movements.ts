import axios from "axios";
import { Dispatch } from "redux";
import { Movement, MovementState, PaginationInfo, PjnAccess } from "types/movements";

export const GET_MOVEMENTS_BY_FOLDER = "movements/GET_MOVEMENTS_BY_FOLDER";
export const GET_MOVEMENTS = "movements/GET_MOVEMENTS";
export const UPDATE_MOVEMENT = "movements/UPDATE_MOVEMENT";
export const DELETE_MOVEMENT = "movements/DELETE_MOVEMENT";
export const SET_MOVEMENT_ERROR = "movements/SET_MOVEMENT_ERROR";
export const SET_LOADING = "movements/SET_LOADING";
export const ADD_MOVEMENT = "movements/ADD_MOVEMENT";
export const SET_PAGINATION = "movements/SET_PAGINATION";
export const TOGGLE_MOVEMENT_COMPLETE = "movements/TOGGLE_MOVEMENT_COMPLETE";

const initialMovementState: MovementState = {
	movements: [],
	pagination: undefined,
	totalWithLinks: undefined,
	documentsBeforeThisPage: undefined,
	documentsInThisPage: undefined,
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
				movements: action.payload.movements || action.payload,
				pagination: action.payload.pagination || undefined,
				totalWithLinks: action.payload.totalWithLinks || undefined,
				documentsBeforeThisPage: action.payload.documentsBeforeThisPage || undefined,
				documentsInThisPage: action.payload.documentsInThisPage || undefined,
				pjnAccess: action.payload.pjnAccess || undefined,
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
		case SET_PAGINATION:
			return {
				...state,
				pagination: action.payload,
			};
		case TOGGLE_MOVEMENT_COMPLETE:
			return {
				...state,
				movements: state.movements.map((movement) =>
					movement._id === action.payload._id ? { ...movement, completed: action.payload.completed } : movement,
				),
				isLoading: false,
			};
		default:
			return state;
	}
};

// Actions
export const getMovementsByUserId = (userId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });

		// Campos optimizados para listas y vistas
		const fields = "_id,title,time,movement,description,dateExpiration,link,folderId,userId,completed";
		const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/movements/user/${userId}`, {
			params: { fields },
		});

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

		const response = await axios.put(`${import.meta.env.VITE_BASE_URL}/api/movements/${movementId}`, updateData);

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

		const response = await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/movements/${movementId}`);

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

		const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/movements`, movementData);

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

interface PaginatedSuccessResponse {
	success: true;
	data: {
		movements: Movement[];
		pagination: PaginationInfo;
		totalWithLinks?: number;
		documentsBeforeThisPage?: number;
		documentsInThisPage?: number;
		pjnAccess?: PjnAccess;
	};
}

interface ErrorResponse {
	success: false;
	message: string;
}

type MovementsResponse = SuccessResponse | ErrorResponse;
type PaginatedMovementsResponse = PaginatedSuccessResponse | ErrorResponse;

// Parámetros de paginación y filtros
export interface MovementQueryParams {
	page?: number;
	limit?: number;
	search?: string;
	sort?: string; // Agregado para ordenamiento
	filter?: {
		movement?: string;
		dateRange?: string;
		hasLink?: boolean; // Agregado para filtrar movimientos con documento
	};
}

export const getMovementsByFolderId = (folderId: string, params?: MovementQueryParams) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });

		// Campos optimizados para listas y vistas
		const fields = "_id,title,time,movement,description,dateExpiration,link,folderId,userId,source,completed";

		// Construir parámetros de consulta
		const queryParams: any = { fields };

		if (params) {
			if (params.page !== undefined) queryParams.page = params.page;
			if (params.limit !== undefined) queryParams.limit = params.limit;
			if (params.search) queryParams.search = params.search;
			if (params.sort) queryParams.sort = params.sort;
			if (params.filter) {
				if (params.filter.movement) queryParams["filter[movement]"] = params.filter.movement;
				if (params.filter.dateRange) queryParams["filter[dateRange]"] = params.filter.dateRange;
				if (params.filter.hasLink !== undefined) queryParams["filter[hasLink]"] = params.filter.hasLink;
			}
		}

		// Determinar el tipo de respuesta basado en si se usa paginación
		const isPaginated = params?.page !== undefined || params?.limit !== undefined;

		const response = await axios.get<MovementsResponse | PaginatedMovementsResponse>(
			`${import.meta.env.VITE_BASE_URL}/api/movements/folder/${folderId}`,
			{ params: queryParams },
		);

		if (response.data.success) {
			// Manejar respuesta paginada
			if (isPaginated && "data" in response.data) {
				const paginatedData = response.data as PaginatedSuccessResponse;
				dispatch({
					type: GET_MOVEMENTS_BY_FOLDER,
					payload: {
						movements: paginatedData.data.movements,
						pagination: paginatedData.data.pagination,
						totalWithLinks: paginatedData.data.totalWithLinks,
						documentsBeforeThisPage: paginatedData.data.documentsBeforeThisPage,
						documentsInThisPage: paginatedData.data.documentsInThisPage,
						pjnAccess: paginatedData.data.pjnAccess,
					},
				});

				return {
					success: true,
					movements: paginatedData.data.movements,
					pagination: paginatedData.data.pagination,
					totalWithLinks: paginatedData.data.totalWithLinks,
					documentsBeforeThisPage: paginatedData.data.documentsBeforeThisPage,
					documentsInThisPage: paginatedData.data.documentsInThisPage,
				};
			} else {
				// Manejar respuesta no paginada (retrocompatibilidad)
				const nonPaginatedData = response.data as SuccessResponse;
				dispatch({
					type: GET_MOVEMENTS_BY_FOLDER,
					payload: nonPaginatedData.movements,
				});

				return {
					success: true,
					movements: nonPaginatedData.movements,
					count: nonPaginatedData.count,
				};
			}
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

export const toggleMovementComplete = (movementId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });

		const response = await axios.patch(`${import.meta.env.VITE_BASE_URL}/api/movements/${movementId}/complete`);

		if (response.data.success && response.data.movement) {
			dispatch({
				type: TOGGLE_MOVEMENT_COMPLETE,
				payload: {
					_id: movementId,
					completed: response.data.movement.completed,
				},
			});
			return {
				success: true,
				movement: response.data.movement,
				message: response.data.message,
			};
		}

		throw new Error(response.data.message || "Error al cambiar el estado del movimiento");
	} catch (error) {
		let errorMessage = "Error al cambiar el estado del movimiento";
		let statusCode = 500;

		if (axios.isAxiosError(error) && error.response) {
			errorMessage = error.response.data?.message || errorMessage;
			statusCode = error.response.status;
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
			statusCode,
		};
	}
};

export default movementReducer;

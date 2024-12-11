import axios, { AxiosError } from "axios";
import { Dispatch } from "redux";

import { CalculatorType, CalculatorState, FilterParams } from "types/calculator";

const SET_LOADING = "calculators/SET_LOADING";
const SET_ERROR = "calculators/SET_ERROR";
const ADD_CALCULATOR = "calculators/ADD_CALCULATOR";
const SET_CALCULATORS = "calculators/SET_CALCULATORS";
const SET_SELECTED_CALCULATORS = "calculators/SET_SELECTED_CALCULATORS";
const UPDATE_CALCULATOR = "calculators/UPDATE_CALCULATOR";
const DELETE_CALCULATOR = "calculators/DELETE_CALCULATOR";

const initialState: CalculatorState = {
	calculators: [],
	selectedCalculators: [],
	isLoader: false,
	error: null,
};

const calculatorsReducer = (state = initialState, action: any) => {
	switch (action.type) {
		case SET_LOADING:
			return { ...state, isLoader: true, error: null };
		case SET_ERROR:
			return { ...state, isLoader: false, error: action.payload };
		case ADD_CALCULATOR:
			return {
				...state,
				calculators: [...state.calculators, action.payload],
				isLoader: false,
			};
		case SET_CALCULATORS:
			return {
				...state,
				calculators: action.payload,
				isLoader: false,
			};
		case SET_SELECTED_CALCULATORS:
			return {
				...state,
				selectedCalculators: action.payload,
				isLoader: false,
			};
		case UPDATE_CALCULATOR:
			return {
				...state,
				calculators: state.calculators.map((calc) => (calc._id === action.payload._id ? action.payload : calc)),
				selectedCalculators: state.selectedCalculators.map((calc) => (calc._id === action.payload._id ? action.payload : calc)),
				isLoader: false,
			};
		case DELETE_CALCULATOR:
			return {
				...state,
				calculators: state.calculators.filter((calc) => calc._id !== action.payload),
				isLoader: false,
			};
		default:
			return state;
	}
};

// Actions
export const addCalculator = (data: Omit<CalculatorType, "_id" | "isLoader" | "error">) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/calculators`, data);
		dispatch({
			type: ADD_CALCULATOR,
			payload: response.data.calculator,
		});
		return { success: true, calculator: response.data.calculator };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof AxiosError ? error.response?.data?.message || "Error al crear el cálculo" : "Error al crear el cálculo";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export const getCalculatorsByUserId = (userId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/calculators/user/${userId}`);
		dispatch({
			type: SET_CALCULATORS,
			payload: response.data.calculators,
		});
		return { success: true };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof AxiosError ? error.response?.data?.message || "Error al obtener los cálculos" : "Error al obtener los cálculos";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export const getCalculatorsByGroupId = (groupId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/calculators/group/${groupId}`);
		dispatch({
			type: SET_CALCULATORS,
			payload: response.data.calculators,
		});
		return { success: true };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof AxiosError ? error.response?.data?.message || "Error al obtener los cálculos" : "Error al obtener los cálculos";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export const getCalculatorsByFolderId = (folderId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/calculators/folder/${folderId}`);
		dispatch({
			type: SET_CALCULATORS,
			payload: response.data.calculators,
		});
		return { success: true };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof AxiosError ? error.response?.data?.message || "Error al obtener los cálculos" : "Error al obtener los cálculos";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export const getCalculatorsByFilter = (params: FilterParams) => async (dispatch: Dispatch) => {
	try {
		const { userId = "", groupId = "", folderId = "", type = "", classType = "" } = params;
		if (!folderId && !userId && !groupId) {
			const errorMessage = "Debe proporcionar al menos uno de los siguientes filtros: folderId, userId o groupId.";
			dispatch({ type: SET_ERROR, payload: errorMessage });
			return { success: false, error: errorMessage };
		}

		dispatch({ type: SET_LOADING });

		const queryParams = new URLSearchParams({
			...(folderId && { folderId }),
			...(type && { type }),
			...(classType && { classType }),
			...(groupId && { groupId }),
			...(userId && { userId }),
		}).toString();

		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/calculators/filter?${queryParams}`);

		// Si hay tipo y classType específicos, actualizar selectedCalculators
		if (type || classType) {
			const filteredCalculators = response.data.calculators.filter(
				(calc: CalculatorType) => (!type || calc.type === type) && (!classType || calc.classType === classType),
			);
			dispatch({
				type: SET_SELECTED_CALCULATORS,
				payload: filteredCalculators,
			});
		}

		return { success: true };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof AxiosError ? error.response?.data?.message || "Error al obtener los cálculos" : "Error al obtener los cálculos";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export const updateCalculator =
	(_id: string, data: Partial<Omit<CalculatorType, "_id" | "isLoader" | "error">>) => async (dispatch: Dispatch) => {
		try {
			dispatch({ type: SET_LOADING });
			const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/calculators/${_id}`, data);
			dispatch({
				type: UPDATE_CALCULATOR,
				payload: response.data.calculator,
			});
			return { success: true };
		} catch (error: unknown) {
			const errorMessage =
				error instanceof AxiosError ? error.response?.data?.message || "Error al actualizar el cálculo" : "Error al actualizar el cálculo";
			dispatch({ type: SET_ERROR, payload: errorMessage });
			return { success: false, error: errorMessage };
		}
	};

export const deleteCalculator = (id: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/calculators/${id}`);
		dispatch({
			type: DELETE_CALCULATOR,
			payload: id,
		});
		return { success: true };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof AxiosError ? error.response?.data?.message || "Error al eliminar el cálculo" : "Error al eliminar el cálculo";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export default calculatorsReducer;

import axios, { AxiosError } from "axios";
import { Dispatch } from "redux";

import { CalculatorType, CalculatorState, FilterParams } from "types/calculator";
import { incrementUserStat, updateUserStorage } from "./userStats";

const SET_LOADING = "calculators/SET_LOADING";
const SET_ERROR = "calculators/SET_ERROR";
const ADD_CALCULATOR = "calculators/ADD_CALCULATOR";
const SET_CALCULATORS = "calculators/SET_CALCULATORS";
const SET_SELECTED_CALCULATORS = "calculators/SET_SELECTED_CALCULATORS";
const SET_ARCHIVED_CALCULATORS = "calculators/SET_ARCHIVED_CALCULATORS";
const UPDATE_CALCULATOR = "calculators/UPDATE_CALCULATOR";
const DELETE_CALCULATOR = "calculators/DELETE_CALCULATOR";
const ARCHIVE_CALCULATORS = "calculators/ARCHIVE_CALCULATORS";
const UNARCHIVE_CALCULATORS = "calculators/UNARCHIVE_CALCULATORS";
const RESET_CALCULATORS_STATE = "calculators/RESET_CALCULATORS_STATE";
const CLEAR_SELECTED_CALCULATORS = "calculators/CLEAR_SELECTED_CALCULATORS";

const initialState: CalculatorState = {
	calculators: [],
	selectedCalculators: [],
	archivedCalculators: [],
	isLoader: false,
	error: null,
	isInitialized: false,
	lastFetchedUserId: undefined,
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
				// Solo actualizar isInitialized y lastFetchedUserId si se proporciona userId
				...(action.userId && {
					isInitialized: true,
					lastFetchedUserId: action.userId,
				}),
			};
		case SET_SELECTED_CALCULATORS:
			return {
				...state,
				selectedCalculators: action.payload,
				isLoader: false,
			};
		case SET_ARCHIVED_CALCULATORS:
			return {
				...state,
				archivedCalculators: action.payload,
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
				selectedCalculators: state.selectedCalculators.filter((calc) => calc._id !== action.payload),
				isLoader: false,
			};
		case ARCHIVE_CALCULATORS:
			// Los IDs de los calculadores a archivar
			const calculatorIdsToArchive = action.payload;

			// Encontrar los calculadores completos que se van a archivar
			const calculatorsToArchive = state.calculators.filter((calc) => calculatorIdsToArchive.includes(calc._id));

			return {
				...state,
				// Remover de los calculadores activos
				calculators: state.calculators.filter((calc) => !calculatorIdsToArchive.includes(calc._id)),
				// Añadir a los calculadores archivados
				archivedCalculators: [...state.archivedCalculators, ...calculatorsToArchive],
				isLoader: false,
			};
		case UNARCHIVE_CALCULATORS:
			// Los IDs o calculadores parciales a desarchivar
			const calculatorIdsToUnarchive = action.payload.map((c: any) => (typeof c === "string" ? c : c._id));

			// Buscar los calculadores completos en archivedCalculators
			const calculatorsToUnarchive = state.archivedCalculators.filter((calc) => calculatorIdsToUnarchive.includes(calc._id));

			return {
				...state,
				// Añadir los calculadores desarchivados a la lista de calculadores activos
				calculators: [...state.calculators, ...(calculatorsToUnarchive.length > 0 ? calculatorsToUnarchive : action.payload)],
				// Remover los calculadores desarchivados de la lista de archivados
				archivedCalculators: state.archivedCalculators.filter((calc) => !calculatorIdsToUnarchive.includes(calc._id)),
				isLoader: false,
			};
		case RESET_CALCULATORS_STATE:
			return initialState;
		case CLEAR_SELECTED_CALCULATORS:
			return {
				...state,
				selectedCalculators: [],
			};
		default:
			return state;
	}
};

// Actions
export const addCalculator = (data: Omit<CalculatorType, "_id" | "isLoader" | "error">) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });

		// 🔍 LOG: Data que se está enviando
		console.log("🔵 [addCalculator] Enviando datos al backend:", {
			url: `${import.meta.env.VITE_BASE_URL}/api/calculators`,
			method: "POST",
			data: data,
		});

		const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/calculators`, data);

		// 🔍 LOG: Respuesta exitosa del backend
		console.log("✅ [addCalculator] Respuesta exitosa del backend:", {
			status: response.status,
			data: response.data,
		});

		dispatch({
			type: ADD_CALCULATOR,
			payload: response.data.calculator,
		});
		// Incrementar contador de calculators en userStats
		dispatch(incrementUserStat("calculators", 1));
		return { success: true, calculator: response.data.calculator };
	} catch (error: unknown) {
		// 🔍 LOG: Error del backend
		if (error instanceof AxiosError) {
			console.error("❌ [addCalculator] Error del backend:", {
				status: error.response?.status,
				statusText: error.response?.statusText,
				data: error.response?.data,
				headers: error.response?.headers,
				message: error.message,
			});
		} else {
			console.error("❌ [addCalculator] Error desconocido:", error);
		}

		const errorMessage =
			error instanceof AxiosError ? error.response?.data?.message || "Error al crear el cálculo" : "Error al crear el cálculo";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export const getCalculatorsByUserId =
	(userId: string, forceRefresh: boolean = false) =>
	async (dispatch: Dispatch, getState: any) => {
		try {
			const state = getState();
			const { isInitialized, lastFetchedUserId } = state.calculator;
			// Si ya tenemos los datos en cache para este usuario y no forzamos actualización, no hacer la petición
			if (isInitialized && lastFetchedUserId === userId && !forceRefresh) {
				return { success: true, calculators: state.calculator.calculators };
			}

			dispatch({ type: SET_LOADING });
			// Campos optimizados para listas
			const fields = "_id,date,folderId,folderName,type,classType,subClassType,capital,interest,amount,variables,result,description,user";
			const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/calculators/user/${userId}`, {
				params: { fields },
			});
			dispatch({
				type: SET_CALCULATORS,
				payload: response.data.calculators,
				userId: userId,
			});
			return { success: true, calculators: response.data.calculators };
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
		// Campos optimizados para listas
		const fields = "_id,date,folderId,folderName,type,classType,subClassType,capital,interest,amount,variables,result,description,user";
		const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/calculators/group/${groupId}`, {
			params: { fields },
		});
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

export const getCalculatorsByFolderId = (folderId: string) => async (dispatch: Dispatch, getState: any) => {
	try {
		const state = getState();
		const { calculators, isInitialized } = state.calculator;
		const auth = state.auth;
		const userId = auth.user?._id;

		// Si tenemos userId y no hay datos en cache, descargar todos primero
		if (userId && !isInitialized) {
			// Descargar todos los calculadores del usuario
			const result = await dispatch(getCalculatorsByUserId(userId) as any);
			if (!result.success) {
				return result;
			}
		}

		// Ahora filtrar localmente (ya sea de los datos existentes o recién descargados)
		const currentCalculators = isInitialized ? calculators : getState().calculator.calculators;
		const filteredCalculators = currentCalculators.filter((calc: CalculatorType) => calc.folderId === folderId);

		dispatch({
			type: SET_SELECTED_CALCULATORS,
			payload: filteredCalculators,
		});

		return { success: true, calculators: filteredCalculators };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof AxiosError ? error.response?.data?.message || "Error al obtener los cálculos" : "Error al obtener los cálculos";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export const getCalculatorsByFilter = (params: FilterParams) => async (dispatch: Dispatch, getState: any) => {
	try {
		const { userId = "", groupId = "", folderId = "", type = "", classType = "" } = params;
		if (!folderId && !userId && !groupId) {
			const errorMessage = "Debe proporcionar al menos uno de los siguientes filtros: folderId, userId o groupId.";
			dispatch({ type: SET_ERROR, payload: errorMessage });
			return { success: false, error: errorMessage };
		}

		const state = getState();
		const { calculators, isInitialized, lastFetchedUserId } = state.calculator;

		// Si estamos filtrando por userId
		if (userId) {
			// Caso 1: No tenemos datos en cache o es un usuario diferente - descargar todos
			if (!isInitialized || lastFetchedUserId !== userId) {
				dispatch({ type: SET_LOADING });

				// Descargar TODOS los calculadores del usuario
				const fields = "_id,date,folderId,folderName,type,classType,subClassType,capital,interest,amount,variables,result,description,user";
				const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/calculators/user/${userId}`, {
					params: { fields },
				});

				// Guardar todos los calculadores en el estado principal
				dispatch({
					type: SET_CALCULATORS,
					payload: response.data.calculators,
					userId: userId,
				});

				// Ahora filtrar localmente los datos recién descargados
				let filteredCalculators = response.data.calculators;

				if (folderId) {
					filteredCalculators = filteredCalculators.filter((calc: CalculatorType) => calc.folderId === folderId);
				}
				if (type) {
					filteredCalculators = filteredCalculators.filter((calc: CalculatorType) => calc.type === type);
				}
				if (classType) {
					filteredCalculators = filteredCalculators.filter((calc: CalculatorType) => calc.classType === classType);
				}

				// Guardar los filtrados en selectedCalculators
				dispatch({
					type: SET_SELECTED_CALCULATORS,
					payload: filteredCalculators,
				});

				return { success: true, calculators: filteredCalculators };
			}

			// Caso 2: Ya tenemos los datos en cache - solo filtrar localmente
			let filteredCalculators = calculators;

			if (folderId) {
				filteredCalculators = filteredCalculators.filter((calc: CalculatorType) => calc.folderId === folderId);
			}
			if (type) {
				filteredCalculators = filteredCalculators.filter((calc: CalculatorType) => calc.type === type);
			}
			if (classType) {
				filteredCalculators = filteredCalculators.filter((calc: CalculatorType) => calc.classType === classType);
			}

			// Actualizar selectedCalculators con los resultados filtrados localmente
			dispatch({
				type: SET_SELECTED_CALCULATORS,
				payload: filteredCalculators,
			});

			return { success: true, calculators: filteredCalculators };
		}

		// Si no es por userId (groupId u otros casos), hacer petición específica al servidor
		dispatch({ type: SET_LOADING });

		const fields = "_id,date,folderId,folderName,type,classType,subClassType,capital,interest,amount,variables,result,description,user";
		const queryParams = new URLSearchParams({
			...(folderId && { folderId }),
			...(type && { type }),
			...(classType && { classType }),
			...(groupId && { groupId }),
			fields,
		}).toString();

		const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/calculators/filter?${queryParams}`);

		dispatch({
			type: SET_SELECTED_CALCULATORS,
			payload: response.data.calculators,
		});

		return { success: true, calculators: response.data.calculators };
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
			const response = await axios.put(`${import.meta.env.VITE_BASE_URL}/api/calculators/${_id}`, data);
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
		await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/calculators/${id}`);
		dispatch({
			type: DELETE_CALCULATOR,
			payload: id,
		});
		// Decrementar contador de calculators en userStats
		dispatch(incrementUserStat("calculators", -1));
		return { success: true };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof AxiosError ? error.response?.data?.message || "Error al eliminar el cálculo" : "Error al eliminar el cálculo";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export const archiveCalculators = (userId: string, calculatorIds: string[]) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/subscriptions/archive-items?userId=${userId}`, {
			resourceType: "calculators",
			itemIds: calculatorIds,
		});

		if (response.data.success) {
			dispatch({
				type: ARCHIVE_CALCULATORS,
				payload: calculatorIds,
			});
			// Decrementar contador de calculators en userStats (archivados no cuentan como activos)
			dispatch(incrementUserStat("calculators", -calculatorIds.length));
			// Incrementar storage (los cálculos archivados sí cuentan en el storage)
			dispatch(updateUserStorage("calculator", calculatorIds.length));
			return { success: true, message: "Cálculos archivados exitosamente" };
		} else {
			return { success: false, message: response.data.message || "No se pudieron archivar los cálculos." };
		}
	} catch (error) {
		const errorMessage = axios.isAxiosError(error)
			? error.response?.data?.message || "Error al archivar cálculos."
			: "Error desconocido al archivar cálculos.";

		dispatch({
			type: SET_ERROR,
			payload: errorMessage,
		});
		return { success: false, message: errorMessage };
	}
};

export const unarchiveCalculators = (userId: string, calculatorIds: string[]) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/subscriptions/unarchive-items?userId=${userId}`, {
			resourceType: "calculators",
			itemIds: calculatorIds,
		});

		if (response.data.success) {
			// Obtener los IDs de los calculadores que realmente fueron desarchivados
			const unarchivedIds = response.data.unarchiveResult?.unarchivedIds || [];

			if (unarchivedIds.length > 0) {
				// Enviar solo los IDs al reducer - el reducer buscará los datos completos en archivedCalculators
				dispatch({
					type: UNARCHIVE_CALCULATORS,
					payload: unarchivedIds,
				});
				// Incrementar contador de calculators en userStats
				dispatch(incrementUserStat("calculators", unarchivedIds.length));
				// Decrementar storage (los cálculos desarchivados ya no cuentan en el storage)
				dispatch(updateUserStorage("calculator", -unarchivedIds.length));

				return {
					success: true,
					message: `${unarchivedIds.length} cálculos desarchivados exitosamente`,
				};
			} else {
				// Ningún cálculo fue desarchivado (posiblemente por límites)
				// Importante: Despachar SET_ERROR para resetear isLoader
				dispatch({
					type: SET_ERROR,
					payload: response.data.unarchiveResult?.message || "No se pudieron desarchivar los cálculos debido a los límites del plan.",
				});
				return {
					success: false,
					message: response.data.unarchiveResult?.message || "No se pudieron desarchivar los cálculos debido a los límites del plan.",
				};
			}
		} else {
			// Importante: Despachar SET_ERROR para resetear isLoader
			dispatch({
				type: SET_ERROR,
				payload: response.data.message || "No se pudieron desarchivar los cálculos.",
			});
			return {
				success: false,
				message: response.data.message || "No se pudieron desarchivar los cálculos.",
			};
		}
	} catch (error) {
		const errorMessage = axios.isAxiosError(error)
			? error.response?.data?.message || "Error al desarchivar cálculos."
			: "Error desconocido al desarchivar cálculos.";

		dispatch({
			type: SET_ERROR,
			payload: errorMessage,
		});
		return { success: false, message: errorMessage };
	}
};

export const getArchivedCalculatorsByUserId = (userId: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		// Campos optimizados para listas
		const fields = "_id,date,folderId,folderName,type,classType,subClassType,capital,interest,amount,variables,result,description,user";
		const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/calculators/user/${userId}`, {
			params: {
				archived: true,
				fields,
			},
		});

		dispatch({
			type: SET_ARCHIVED_CALCULATORS,
			payload: response.data.calculators,
		});

		return { success: true };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof AxiosError
				? error.response?.data?.message || "Error al obtener los cálculos archivados"
				: "Error al obtener los cálculos archivados";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

// Action to reset calculators state
export const resetCalculatorsState = () => ({
	type: RESET_CALCULATORS_STATE,
});

// Action to clear selected calculators
export const clearSelectedCalculators = () => ({
	type: CLEAR_SELECTED_CALCULATORS,
});

export default calculatorsReducer;

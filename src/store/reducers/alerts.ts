// action - state management
import axios from "axios";
import { Dispatch } from "redux";
import { Alert } from "types/alert";

// ==============================|| ACTIONS TYPES ||============================== //

export const ALERTS_LOADING = "ALERTS_LOADING";
export const ALERTS_ERROR = "ALERTS_ERROR";
export const SET_ALERT_DATA = "SET_ALERT_DATA";
export const ADD_ALERT = "ADD_ALERT";
export const ADD_MULTIPLE_ALERTS = "ADD_MULTIPLE_ALERTS";
export const DELETE_ALERT = "DELETE_ALERT";
export const UPDATE_ALERT_FIELD = "UPDATE_ALERT_FIELD";
export const RESET_ALERTS = "RESET_ALERTS";
export const UPDATE_ALERT_READ_STATUS = "UPDATE_ALERT_READ_STATUS";
export const MARK_ALL_ALERTS_READ = "MARK_ALL_ALERTS_READ";

// types
interface AlertsState {
	alerts: Alert[];
	isLoader: boolean;
	error?: string;
}

export interface AlertActionProps {
	type: string;
	payload?: any;
}

// initial state
export const initialState: AlertsState = {
	alerts: [],
	isLoader: false,
	error: undefined,
};

// ==============================|| ALERTS REDUCER ||============================== //

const alerts = (state = initialState, action: AlertActionProps) => {
	switch (action.type) {
		case ALERTS_LOADING:
			return {
				...state,
				isLoader: true,
			};
		case ALERTS_ERROR:
			return {
				...state,
				isLoader: false,
				error: action.payload,
			};
		case SET_ALERT_DATA:
			return {
				...state,
				isLoader: false,
				alerts: action.payload,
			};

		case UPDATE_ALERT_READ_STATUS:
			return {
				...state,
				isLoader: false,
				alerts: state.alerts.map((alert) => (alert._id === action.payload.alertId ? { ...alert, read: true } : alert)),
			};
		case MARK_ALL_ALERTS_READ:
			return {
				...state,
				isLoader: false,
				// Filtramos según el payload
				alerts:
					action.payload.alertIds && Array.isArray(action.payload.alertIds)
						? state.alerts.filter((alert) => !action.payload.alertIds.includes(alert._id))
						: state.alerts.filter((alert) => alert.userId !== action.payload.userId),
			};
		case ADD_MULTIPLE_ALERTS:
			if (Array.isArray(action.payload)) {
				console.log(`[Reducer] Procesando ${action.payload.length} alertas para añadir`);

				// Filtrar alertas válidas
				const validAlerts = action.payload.filter((alert) => alert && typeof alert === "object" && typeof alert._id === "string");

				console.log(`[Reducer] Alertas válidas: ${validAlerts.length}`);

				// Actualizar o añadir alertas
				const existingIds = new Set(state.alerts.map((alert) => alert._id));
				console.log(`[Reducer] IDs existentes: ${Array.from(existingIds).join(", ")}`);

				const newAlerts = validAlerts.filter((alert) => !existingIds.has(alert._id));
				console.log(`[Reducer] Alertas nuevas a añadir: ${newAlerts.length}`);

				// Imprimir los IDs de las nuevas alertas
				if (newAlerts.length > 0) {
					console.log(`[Reducer] IDs de nuevas alertas: ${newAlerts.map((a) => a._id).join(", ")}`);
				}

				const updatedState = {
					...state,
					isLoader: false,
					alerts: [...state.alerts, ...newAlerts],
				};

				console.log(`[Reducer] Estado actualizado, total alertas: ${updatedState.alerts.length}`);
				return updatedState;
			} else {
				console.error("[Reducer] ADD_MULTIPLE_ALERTS recibió un payload que no es un array:", action.payload);
				return state;
			}
		case DELETE_ALERT:
			return {
				...state,
				isLoader: false,
				alerts: state.alerts.filter((alert) => alert._id !== action.payload.alertId),
			};
		default:
			return state;
	}
};

export default alerts;

// ==============================|| ACTIONS ||============================== //

// Acción para cargar las alertas
export const fetchUserAlerts = (userId: string) => {
	return async (dispatch: Dispatch) => {
		dispatch({ type: ALERTS_LOADING });
		try {
			const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/alert/useralerts/${userId}`);
			if (response.data && response.data.success) {
				dispatch({
					type: SET_ALERT_DATA,
					payload: response.data.alerts,
				});
			} else {
				dispatch({
					type: ALERTS_ERROR,
					payload: response.data?.message || "No alerts found",
				});
			}
		} catch (error) {
			dispatch({
				type: ALERTS_ERROR,
				payload: error instanceof Error ? error.message : "An unknown error occurred",
			});
		}
	};
};

export const markAlertAsRead = (alertId: string) => {
	return async (dispatch: Dispatch) => {
		try {
			dispatch({ type: ALERTS_LOADING });

			// Enviar solicitud al servidor
			const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/alert/markAsRead/${alertId}`);

			// Comprobar si la operación fue exitosa
			if (response.data && response.data.success) {
				// Actualizar el estado en Redux
				console.log("ALERT ID BORRADO", alertId);
				dispatch({
					type: UPDATE_ALERT_READ_STATUS,
					payload: {
						alertId,
						read: true,
					},
				});

				return {
					success: true,
					message: "Alerta marcada como leída",
				};
			} else {
				dispatch({
					type: ALERTS_ERROR,
					payload: response.data?.message || "Error al marcar la alerta como leída",
				});

				return {
					success: false,
					message: response.data?.message || "Error al marcar la alerta como leída",
				};
			}
		} catch (error) {
			dispatch({
				type: ALERTS_ERROR,
				payload: error instanceof Error ? error.message : "Error desconocido",
			});

			return {
				success: false,
				message: error instanceof Error ? error.message : "Error desconocido",
			};
		}
	};
};

// Acción para añadir múltiples alertas (como las recibidas por WebSocket)
export const addMultipleAlerts = (alerts: Alert[]) => {
	if (!Array.isArray(alerts) || alerts.length === 0) {
		console.warn("No hay alertas para añadir o el formato es inválido");
		return {
			type: "NO_ACTION",
		};
	}

	// Registramos claramente para depuración
	console.log("addMultipleAlerts - Ejecutando acción con alertas:", alerts);

	return {
		type: ADD_MULTIPLE_ALERTS,
		payload: alerts,
	};
};

export const deleteAlert = (alertId: string) => {
	return async (dispatch: Dispatch) => {
		try {
			dispatch({ type: ALERTS_LOADING });

			// Enviar solicitud al servidor para eliminar la alerta
			const response = await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/alert/alerts/${alertId}`);

			// Comprobar si la operación fue exitosa
			if (response.data && response.data.success) {
				// Actualizar el estado en Redux eliminando la alerta
				console.log("ALERT ID ELIMINADO", alertId);
				dispatch({
					type: DELETE_ALERT,
					payload: {
						alertId,
					},
				});

				return {
					success: true,
					message: "Alerta eliminada permanentemente",
				};
			} else {
				dispatch({
					type: ALERTS_ERROR,
					payload: response.data?.message || "Error al eliminar la alerta",
				});

				return {
					success: false,
					message: response.data?.message || "Error al eliminar la alerta",
				};
			}
		} catch (error) {
			dispatch({
				type: ALERTS_ERROR,
				payload: error instanceof Error ? error.message : "Error desconocido",
			});

			return {
				success: false,
				message: error instanceof Error ? error.message : "Error desconocido",
			};
		}
	};
};

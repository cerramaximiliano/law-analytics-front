import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { dispatch } from "store";
import axios from "axios";
import { Alert } from "types/alert";

interface AlertsState {
	alerts: Alert[];
	isLoader: boolean;
	error?: string;
}

const initialState: AlertsState = {
	alerts: [],
	isLoader: false,
	error: undefined,
};

const alerts = createSlice({
	name: "alerts",
	initialState,
	reducers: {
		loading(state) {
			state.isLoader = true;
		},
		hasError(state, action: PayloadAction<string>) {
			state.isLoader = false;
			state.error = action.payload;
		},
		setAlertData(state, action: PayloadAction<Alert[]>) {
			state.isLoader = false;
			state.alerts = action.payload;
		},
		addAlert(state, action: PayloadAction<Alert>) {
			state.alerts.push(action.payload);
			state.isLoader = false;
		},
		deleteAlert(state, action: PayloadAction<string>) {
			state.alerts = state.alerts.filter((alert) => alert._id !== action.payload);
			state.isLoader = false;
		},
		updateAlertField(state, action: PayloadAction<{ field: keyof Alert; value: any }>) {
			const { field, value } = action.payload;
			state.alerts = state.alerts.map((alert) => ({ ...alert, [field]: value }));
		},
		resetAlerts(state) {
			Object.assign(state, initialState);
		},
	},
});

export default alerts.reducer;

export const { loading, hasError, setAlertData, updateAlertField, resetAlerts, addAlert, deleteAlert } = alerts.actions;

// Async actions
export function fetchUserAlerts(userId: string) {
	return async () => {
		dispatch(loading());
		try {
			const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/alert/useralerts/${userId}`);
			if (response.data) {
				dispatch(setAlertData(response.data));
			} else {
				dispatch(hasError("No alerts found"));
			}
		} catch (error) {
			dispatch(hasError(error instanceof Error ? error.message : "An unknown error occurred"));
		}
	};
}

export function addNewAlert(newAlert: Alert) {
	return async () => {
		if (!newAlert.primaryText || !newAlert.primaryVariant || !newAlert.secondaryText || !newAlert.actionText) {
			throw new Error("Missing required fields in newAlert");
		}
		dispatch(loading());
		try {
			const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/alert`, newAlert);
			if (response.data) {
				dispatch(addAlert(response.data));
			} else {
				dispatch(hasError("Failed to add new alert"));
			}
		} catch (error) {
			dispatch(hasError(error instanceof Error ? error.message : "An unknown error occurred"));
		}
	};
}

export function deleteUserAlert(userId: string, alertId: string) {
	return async () => {
		dispatch(loading());
		try {
			const url = `${process.env.REACT_APP_BASE_URL}/alert/delete-alert/?alertId=${alertId}&userId=${userId}`;
			const response = await axios.delete(url);
			if (response.status === 200 || response.status === 204) {
				dispatch(deleteAlert(alertId));
			} else {
				dispatch(hasError("Failed to delete alert"));
			}
		} catch (error) {
			console.error("Error in axios request:", error);
			dispatch(hasError(error instanceof Error ? error.message : "An unknown error occurred"));
		}
	};
}

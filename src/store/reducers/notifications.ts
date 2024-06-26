import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { dispatch } from "store";
import data from "data/notifications.json";
import { NotificationsType } from "types/notifications";
import moment from "moment";

interface NotificationsState {
	notifications: NotificationsType[];
	isLoader: boolean;
	error?: string;
}

const initialState: NotificationsState = {
	notifications: [],
	isLoader: false,
	error: undefined,
};
const notifications = createSlice({
	name: "notifications",
	initialState,
	reducers: {
		loading(state) {
			state.isLoader = true;
		},
		hasError(state, action: PayloadAction<string>) {
			state.isLoader = false;
			state.error = action.payload;
		},
		setNotificationData(state, action: PayloadAction<NotificationsType[]>) {
			state.isLoader = false;
			Object.assign(state, { ...state, notifications: action.payload });
		},
		addNotifications(state, action: PayloadAction<NotificationsType>) {
			const newNotification = action.payload;
			const newDate = moment(newNotification.time, "DD/MM/YYYY");
			const index = state.notifications.findIndex((notification) => {
				const existingDate = moment(notification.time, "DD/MM/YYYY");
				return newDate.isAfter(existingDate);
			});
			if (index === -1) {
				state.notifications.push(newNotification);
			} else {
				state.notifications.splice(index, 0, newNotification);
			}
			state.isLoader = false;
		},
		updateFolderField(state, action: PayloadAction<{ field: keyof NotificationsType; value: any }>) {
			const { field, value } = action.payload;
			if (field in state) {
				(state as any)[field] = value;
			}
		},
		resetFolder(state) {
			Object.assign(state, initialState);
		},
	},
});

export default notifications.reducer;

export const { loading, hasError, setNotificationData, updateFolderField, resetFolder, addNotifications } = notifications.actions;

// Async actions

export function fetchNotificationsData(folderId: string) {
	return async () => {
		// Tipado correcto de dispatch
		dispatch(loading());
		try {
			const response = await new Promise<{ data: NotificationsType[] }>((resolve) => {
				setTimeout(() => {
					const notifications = data.filter((ele) => ele.folderId === folderId);
					console.log(notifications);
					resolve({ data: notifications });
				}, 5000);
			});
			if (response.data) {
				dispatch(setNotificationData(response.data));
			} else {
				dispatch(hasError("No data found"));
			}
		} catch (error) {
			if (error instanceof Error) {
				dispatch(hasError(error.toString()));
			} else {
				dispatch(hasError("An unknown error occurred"));
			}
		}
	};
}

export function addNewNotification(newMovement: NotificationsType) {
	return async () => {
		if (!newMovement.folderId || !newMovement.time || !newMovement.title) {
			throw new Error("Missing required fields in newMovement");
		}
		dispatch(loading());
		try {
			const response = await new Promise<{ fetchData: NotificationsType }>((resolve) => {
				setTimeout(() => {
					console.log(newMovement);
					resolve({ fetchData: newMovement });
				}, 5000);
			});
			if (response.fetchData) {
				dispatch(addNotifications(response.fetchData));
			} else {
				dispatch(hasError("No data found"));
			}
		} catch (error) {
			if (error instanceof Error) {
				dispatch(hasError(error.toString()));
			} else {
				dispatch(hasError("An unknown error occurred"));
			}
		}
	};
}

/* export function saveFolderData(calculatorData: FolderData) {
	return async () => {
		dispatch(loading());
		try {
			const response = await axios.post("/api/folder/save", folderData);
			dispatch(setFolderData(response.data.calculator));
		} catch (error) {
			if (error instanceof Error) {
				dispatch(hasError(error.toString()));
			} else {
				dispatch(hasError("An unknown error occurred"));
			}
		}
	};
} */

/* export function updateFolderAsync(folderId: string, newData: Partial<FolderData>) {
	return async () => {
		dispatch(calculator.actions.loading());
		try {
			const response = await new Promise<{ data: FolderData | undefined }>((resolve) => {
				setTimeout(() => {
					const updatedData = data.map((folder) => {
						if (folder.folderId === folderId) {
							return { ...folder, ...newData }; // Actualizamos el folder con los nuevos datos
						}
						return folder;
					});
					return resolve({ data: updatedData.find((folder) => folder.folderId === folderId) });
				}, 1000);
			});
			dispatch(calculator.actions.setFolderData(response.data));
		} catch (error) {
			if (error instanceof Error) {
				dispatch(calculator.actions.hasError(error.toString()));
			} else {
				dispatch(calculator.actions.hasError("An unknown error occurred"));
			}
		}
	};
}
 */

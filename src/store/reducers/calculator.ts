import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { dispatch } from "store";
import data from "data/calculator.json";

import { CalculatorType } from "types/calculator";

interface CalculatorState {
	calculator: CalculatorType[];
	isLoader: boolean;
	error?: string;
}

const initialState: CalculatorState = {
	calculator: [],
	isLoader: false,
	error: undefined,
};
const calculator = createSlice({
	name: "calculator",
	initialState,
	reducers: {
		loading(state) {
			state.isLoader = true;
		},
		hasError(state, action: PayloadAction<string>) {
			state.isLoader = false;
			state.error = action.payload;
		},
		setFolderData(state, action: PayloadAction<CalculatorType[]>) {
			state.isLoader = false;

			Object.assign(state, { ...state, calculator: action.payload });
		},
		updateFolderField(state, action: PayloadAction<{ field: keyof CalculatorType; value: any }>) {
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

export default calculator.reducer;

export const { loading, hasError, setFolderData, updateFolderField, resetFolder } = calculator.actions;

// Async actions

export function fetchCalculatorData(userId: string, category: string) {
	return async () => {
		// Tipado correcto de dispatch
		dispatch(loading());
		try {
			const response = await new Promise<{ data: CalculatorType[] }>((resolve) => {
				setTimeout(() => {
					const calculators = data.filter((ele) => ele.userId === userId && ele.category === category);
					console.log(calculators);
					resolve({ data: calculators });
				}, 1000);
			});
			if (response.data) {
				dispatch(setFolderData(response.data));
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

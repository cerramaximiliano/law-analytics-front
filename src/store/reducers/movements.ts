import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { dispatch } from "store";
import data from "data/movements.json";
import { MovementsType } from "types/movements";
import moment from "moment";

interface MovementsState {
	movements: MovementsType[];
	isLoader: boolean;
	error?: string;
}

const initialState: MovementsState = {
	movements: [],
	isLoader: false,
	error: undefined,
};
const movements = createSlice({
	name: "movements",
	initialState,
	reducers: {
		loading(state) {
			state.isLoader = true;
		},
		hasError(state, action: PayloadAction<string>) {
			state.isLoader = false;
			state.error = action.payload;
		},
		setFolderData(state, action: PayloadAction<MovementsType[]>) {
			state.isLoader = false;
			Object.assign(state, { ...state, movements: action.payload });
		},
		addMovement(state, action: PayloadAction<MovementsType>) {
			const newMovement = action.payload;
			const newDate = moment(newMovement.time, "DD/MM/YYYY");
			const index = state.movements.findIndex((movement) => {
				const existingDate = moment(movement.time, "DD/MM/YYYY");
				return newDate.isAfter(existingDate);
			});
			if (index === -1) {
				state.movements.push(newMovement);
			} else {
				state.movements.splice(index, 0, newMovement);
			}
			state.isLoader = false;
		},
	},
});

export default movements.reducer;

export const { loading, hasError, setFolderData, addMovement } = movements.actions;

// Async actions

export function fetchMovementsData(folderId: string) {
	return async () => {
		dispatch(loading());
		try {
			const response = await new Promise<{ data: MovementsType[] }>((resolve) => {
				setTimeout(() => {
					const movements = data.filter((ele) => ele.folderId === folderId);
					const orderMovements = movements.sort((a, b) => {
						const dateA = moment(a.time, "DD/MM/YYYY");
						const dateB = moment(b.time, "DD/MM/YYYY");
						if (dateA.isBefore(dateB)) {
							return 1;
						} else if (dateA.isAfter(dateB)) {
							return -1;
						} else {
							return 0;
						}
					});
					resolve({ data: orderMovements });
				}, 5000);
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

export function addNewMovement(newMovement: MovementsType) {
	return async () => {
		if (!newMovement.userId || !newMovement.folderId || !newMovement.time || !newMovement.movement || !newMovement.title) {
			throw new Error("Missing required fields in newMovement");
		}
		dispatch(loading());
		try {
			const response = await new Promise<{ fetchData: MovementsType }>((resolve) => {
				setTimeout(() => {
					console.log(newMovement);
					//data.push(newMovement);
					resolve({ fetchData: newMovement });
				}, 5000);
			});
			if (response.fetchData) {
				dispatch(addMovement(response.fetchData));
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

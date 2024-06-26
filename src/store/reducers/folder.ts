import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import axios from "utils/axios";
import { dispatch } from "store";
import { FolderData } from "types/folder";
import data from "data/foldersData.json";

const initialState: FolderData & { isLoader: boolean; error?: string } = {
	folderId: "1",
	folderName: "Caso García vs Pérez",
	materia: "Contratos",
	orderStatus: "Actor",
	status: "Nueva",
	description: "Demanda por incumplimiento de contrato",
	initialDateFolder: "2023-05-10",
	finalDateFolder: "2024-05-10",
	amount: 50000,
	folderJuris: "Juzgado N° 5",
	folderFuero: "Civil",
	preFolder: {
		initialDatePreFolder: "04/01/2023",
		finalDatePreFolder: "30/04/2023",
		memberPreFolder: "Juan Pérez",
		amountPreFolder: 1000,
		statusPreFolder: "Pendiente",
		descriptionPreFolder: "Revisión inicial del caso y recopilación de documentación",
	},
	judFolder: {
		initialDateJudFolder: "01/06/2023",
		finalDateJudFolder: "01/12/2023",
		numberJudFolder: "12345-6789",
		statusJudFolder: "En letra",
		descriptionJudFolder: "Procedimientos judiciales en curso",
	},
	isLoader: false,
	error: undefined,
};

// ==============================|| SLICE - FOLDER ||============================== //

const folder = createSlice({
	name: "folder",
	initialState,
	reducers: {
		loading(state) {
			state.isLoader = true;
		},
		hasError(state, action) {
			state.isLoader = false;
			state.error = action.payload;
		},
		setFolderData(state, action) {
			state.isLoader = false;
			Object.assign(state, action.payload);
		},
		updateFolderField(state, action: PayloadAction<{ field: keyof FolderData; value: any }>) {
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

export default folder.reducer;

export const { loading, hasError, setFolderData, updateFolderField, resetFolder } = folder.actions;

// Async actions

export function fetchFolderData(id: string) {
	return async () => {
		dispatch(folder.actions.loading());
		try {
			const response = await new Promise<{ data: FolderData | undefined }>((resolve) => {
				setTimeout(() => {
					const folder = data.find((ele) => ele.folderId === id);
					return resolve({ data: folder });
				}, 5000);
			});
			dispatch(folder.actions.setFolderData(response.data));
		} catch (error) {
			if (error instanceof Error) {
				dispatch(folder.actions.hasError(error.toString()));
			} else {
				dispatch(folder.actions.hasError("An unknown error occurred"));
			}
		}
	};
}

export function saveFolderData(folderData: FolderData) {
	return async () => {
		dispatch(loading());
		try {
			const response = await axios.post("/api/folder/save", folderData);
			dispatch(setFolderData(response.data.folder));
		} catch (error) {
			if (error instanceof Error) {
				dispatch(hasError(error.toString()));
			} else {
				dispatch(hasError("An unknown error occurred"));
			}
		}
	};
}

export function updateFolderAsync(folderId: string, newData: Partial<FolderData>) {
	return async () => {
		dispatch(folder.actions.loading());
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
			dispatch(folder.actions.setFolderData(response.data));
		} catch (error) {
			if (error instanceof Error) {
				dispatch(folder.actions.hasError(error.toString()));
			} else {
				dispatch(folder.actions.hasError("An unknown error occurred"));
			}
		}
	};
}

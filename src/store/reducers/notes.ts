import axios, { AxiosError } from "axios";
import { Dispatch } from "redux";
import { Note, NoteState, NoteFormValues } from "types/note";

// Action types
const SET_LOADING = "notes/SET_LOADING";
const SET_ERROR = "notes/SET_ERROR";
const ADD_NOTE = "notes/ADD_NOTE";
const SET_NOTES = "notes/SET_NOTES";
const SET_SELECTED_NOTES = "notes/SET_SELECTED_NOTES";
const UPDATE_NOTE = "notes/UPDATE_NOTE";
const DELETE_NOTE = "notes/DELETE_NOTE";

const initialState: NoteState = {
	notes: [],
	selectedNotes: [], // Notas filtradas por folder
	note: null, // Single note for detail view
	isLoader: false,
	error: null,
	isInitialized: false,
	lastFetchedFolderId: undefined,
};

const notesReducer = (state = initialState, action: any) => {
	switch (action.type) {
		case SET_LOADING:
			return { ...state, isLoader: true, error: null };
		case SET_ERROR:
			return { ...state, isLoader: false, error: action.payload };
		case ADD_NOTE:
			return {
				...state,
				notes: [...state.notes, action.payload],
				selectedNotes: [...state.selectedNotes, action.payload],
				isLoader: false,
			};
		case SET_NOTES:
			return {
				...state,
				notes: action.payload,
				isLoader: false,
				isInitialized: true,
			};
		case SET_SELECTED_NOTES:
			return {
				...state,
				selectedNotes: action.payload,
				isLoader: false,
				lastFetchedFolderId: action.folderId || state.lastFetchedFolderId,
			};
		case UPDATE_NOTE:
			return {
				...state,
				notes: state.notes.map((note) => (note._id === action.payload._id ? action.payload : note)),
				selectedNotes: state.selectedNotes.map((note) => (note._id === action.payload._id ? action.payload : note)),
				isLoader: false,
			};
		case DELETE_NOTE:
			return {
				...state,
				notes: state.notes.filter((note) => note._id !== action.payload),
				selectedNotes: state.selectedNotes.filter((note) => note._id !== action.payload),
				isLoader: false,
			};
		default:
			return state;
	}
};

/**
 * Crea una nueva nota
 */
export const addNote = (data: NoteFormValues) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.post(`${import.meta.env.VITE_BASE_URL}/api/notes/create`, data);

		const note = response.data.note;
		dispatch({
			type: ADD_NOTE,
			payload: note,
		});
		return { success: true, note };
	} catch (error: unknown) {
		const errorMessage = error instanceof AxiosError ? error.response?.data?.message || "Error al crear la nota" : "Error al crear la nota";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

/**
 * Obtiene notas por folder ID
 */
export const getNotesByFolderId =
	(folderId: string, forceRefresh: boolean = false) =>
	async (dispatch: Dispatch, getState: any) => {
		try {
			const state = getState();
			const { lastFetchedFolderId } = state.notesReducer;

			// Si ya tenemos los datos en cache para este folder y no forzamos actualización, no hacer la petición
			if (lastFetchedFolderId === folderId && !forceRefresh) {
				return { success: true, notes: state.notesReducer.selectedNotes };
			}

			dispatch({ type: SET_LOADING });
			const response = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/notes/folder/${folderId}`, {
				params: {
					page: 1,
					limit: 50,
				},
			});

			dispatch({
				type: SET_SELECTED_NOTES,
				payload: response.data.notes,
				folderId: folderId,
			});
			return { success: true, notes: response.data.notes };
		} catch (error: unknown) {
			const errorMessage =
				error instanceof AxiosError ? error.response?.data?.message || "Error al obtener las notas" : "Error al obtener las notas";
			dispatch({ type: SET_ERROR, payload: errorMessage });
			return { success: false, error: errorMessage };
		}
	};

/**
 * Actualiza una nota existente
 */
export const updateNote = (id: string, data: Partial<NoteFormValues>) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		const response = await axios.put(`${import.meta.env.VITE_BASE_URL}/api/notes/${id}`, data);
		dispatch({
			type: UPDATE_NOTE,
			payload: response.data.note,
		});
		return { success: true, note: response.data.note };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof AxiosError ? error.response?.data?.message || "Error al actualizar la nota" : "Error al actualizar la nota";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

/**
 * Elimina una nota
 */
export const deleteNote = (id: string) => async (dispatch: Dispatch) => {
	try {
		dispatch({ type: SET_LOADING });
		await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/notes/${id}`);
		dispatch({
			type: DELETE_NOTE,
			payload: id,
		});
		return { success: true };
	} catch (error: unknown) {
		const errorMessage =
			error instanceof AxiosError ? error.response?.data?.message || "Error al eliminar la nota" : "Error al eliminar la nota";
		dispatch({ type: SET_ERROR, payload: errorMessage });
		return { success: false, error: errorMessage };
	}
};

export default notesReducer;

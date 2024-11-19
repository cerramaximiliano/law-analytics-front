// event.ts
import axios from "axios";
import { Dispatch } from "redux";
// Types for the actions and state
import { Event, EventState, Action } from "types/events";

// action types
const ADD_EVENT = "ADD_EVENT";
const GET_EVENTS_BY_USER = "GET_EVENTS_BY_USER";
const GET_EVENTS_BY_GROUP = "GET_EVENTS_BY_GROUP";
const DELETE_EVENT = "DELETE_EVENT";
const UPDATE_EVENT = "UPDATE_EVENT";
const SET_EVENT_ERROR = "SET_EVENT_ERROR";
const GET_EVENTS_BY_ID = "GET_EVENTS_BY_ID";
const SELECT_EVENT = "SELECT_EVENT";

// initial state
const initialEventState: EventState = {
	events: [],
	isLoader: false,
	error: undefined,
	selectedEventId: null,
};

// ==============================|| EVENT REDUCER & ACTIONS ||============================== //

// Reducer para manejar el estado de los eventos
const eventReducer = (state = initialEventState, action: Action): EventState => {
	switch (action.type) {
		case ADD_EVENT:
			return {
				...state,
				events: [...state.events, action.payload],
			};
		case GET_EVENTS_BY_ID:
		case GET_EVENTS_BY_USER:
		case GET_EVENTS_BY_GROUP:
			return {
				...state,
				events: action.payload,
			};
		case DELETE_EVENT:
			return {
				...state,
				events: state.events.filter((event) => event._id !== action.payload),
			};
		case UPDATE_EVENT:
			return {
				...state,
				events: state.events.map((event) => (event._id === action.payload._id ? action.payload : event)),
			};
		case SET_EVENT_ERROR:
			return {
				...state,
				error: action.payload,
			};
		case SELECT_EVENT: // Nuevo caso para seleccionar un evento
			return {
				...state,
				selectedEventId: action.payload,
			};
		default:
			return state;
	}
};

// Action creators

// Agregar un nuevo evento
export const addEvent = (eventData: Event) => async (dispatch: Dispatch) => {
	try {
		const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/events`, eventData);

		if (response.data && response.data.event) {
			dispatch({
				type: ADD_EVENT,
				payload: response.data.event,
			});
			return { success: true, event: response.data.event };
		} else {
			return { success: false };
		}
	} catch (error) {
		let errorMessage = "Error al agregar evento";
		if (axios.isAxiosError(error) && error.response) {
			errorMessage = error.response.data?.message || errorMessage;
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		dispatch({
			type: SET_EVENT_ERROR,
			payload: errorMessage,
		});
		return { success: false, error };
	}
};

// Actualizar un evento existente
export const updateEvent = (eventId: string, updateData: Partial<Event>) => async (dispatch: Dispatch) => {
	try {
		const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/events/${eventId}`, updateData);
		console.log(response);
		if (response.data && response.data.event) {
			dispatch({
				type: UPDATE_EVENT,
				payload: response.data.event,
			});
			return { success: true, event: response.data.event };
		} else {
			return { success: false };
		}
	} catch (error) {
		console.log(error);
		let errorMessage = "Error al actualizar evento";
		if (axios.isAxiosError(error) && error.response) {
			errorMessage = error.response.data?.message || errorMessage;
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		dispatch({
			type: SET_EVENT_ERROR,
			payload: errorMessage,
		});
		return { success: false, error };
	}
};

// Obtener eventos por userId
export const getEventsByUserId = (userId: string) => async (dispatch: Dispatch) => {
	try {
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/events/user/${userId}`);

		if (response.data.success && Array.isArray(response.data.events)) {
			dispatch({
				type: GET_EVENTS_BY_ID,
				payload: response.data.events,
			});
		} else {
			dispatch({
				type: SET_EVENT_ERROR,
				payload: "No se encontraron eventos para este id",
			});
		}

	} catch (error) {
		dispatch({
			type: SET_EVENT_ERROR,
			payload: (error as any).response?.data?.message || "Error al obtener eventos del usuario",
		});
	}
};

// Obtener eventos por userId
export const getEventsById = (_id: string) => async (dispatch: Dispatch) => {
	try {
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/events/id/${_id}`);
		console.log(response);
		if (response.data.success && Array.isArray(response.data.events)) {
			dispatch({
				type: GET_EVENTS_BY_ID,
				payload: response.data.events,
			});
		} else {
			dispatch({
				type: SET_EVENT_ERROR,
				payload: "No se encontraron eventos para este id",
			});
		}
	} catch (error) {
		dispatch({
			type: SET_EVENT_ERROR,
			payload: (error as any).response?.data?.message || "Error al obtener eventos del usuario",
		});
	}
};

// Obtener eventos por groupId
export const getEventsByGroupId = (groupId: string) => async (dispatch: Dispatch) => {
	try {
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/events/group/${groupId}`);
		dispatch({
			type: GET_EVENTS_BY_GROUP,
			payload: response.data,
		});
	} catch (error) {
		dispatch({
			type: SET_EVENT_ERROR,
			payload: (error as any).response?.data?.message || "Error al obtener eventos del grupo",
		});
	}
};

// Eliminar evento por _id
export const deleteEvent = (eventId: string) => async (dispatch: Dispatch) => {
	try {
		await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/events/${eventId}`);
		dispatch({
			type: DELETE_EVENT,
			payload: eventId,
		});
	} catch (error) {
		dispatch({
			type: SET_EVENT_ERROR,
			payload: (error as any).response?.data?.message || "Error al eliminar evento",
		});
	}
};

export const selectEvent = (eventId: string | null) => (dispatch: Dispatch) => {
	dispatch({
		type: SELECT_EVENT,
		payload: eventId,
	});
};

export default eventReducer;

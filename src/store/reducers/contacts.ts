import axios from "axios";
import { Dispatch } from "redux";
// Types for the actions and state
import { Contact, ContactState, Action } from "types/contact";
// action types
const ADD_CONTACT = "ADD_CONTACT";
const GET_CONTACTS_BY_USER = "GET_CONTACTS_BY_USER";
const GET_CONTACTS_BY_GROUP = "GET_CONTACTS_BY_GROUP";
const DELETE_CONTACT = "DELETE_CONTACT";
const SET_CONTACT_ERROR = "SET_CONTACT_ERROR";
const UPDATE_CONTACT = "UPDATE_CONTACT";

// initial state
const initialContactState: ContactState = {
	contacts: [],
	error: null,
};

// ==============================|| CONTACT REDUCER & ACTIONS ||============================== //

// Reducer para manejar el estado de los contactos
const contacts = (state = initialContactState, action: Action): ContactState => {
	switch (action.type) {
		case ADD_CONTACT:
			return {
				...state,
				contacts: [...state.contacts, action.payload],
			};
		case GET_CONTACTS_BY_USER:
		case GET_CONTACTS_BY_GROUP:
			return {
				...state,
				contacts: action.payload,
			};
		case DELETE_CONTACT:
			return {
				...state,
				contacts: state.contacts.filter((contact) => contact._id !== action.payload),
			};
		case UPDATE_CONTACT:
			return {
				...state,
				contacts: state.contacts.map((contact) => (contact._id === action.payload._id ? action.payload : contact)),
			};
		case SET_CONTACT_ERROR:
			return {
				...state,
				error: action.payload,
			};
		default:
			return state;
	}
};

// Action creators

// Agregar un nuevo contacto
export const addContact = (contactData: Contact) => async (dispatch: Dispatch) => {
	try {
		const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/contacts/create`, contactData);

		if (response.data && response.data.contact) {
			dispatch({
				type: ADD_CONTACT,
				payload: response.data.contact,
			});
			return { success: true, contact: response.data.contact };
		} else {
			return { success: false };
		}
	} catch (error) {
		let errorMessage = "Error al agregar contacto";
		if (axios.isAxiosError(error) && error.response) {
			errorMessage = error.response.data?.message || errorMessage;
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		dispatch({
			type: SET_CONTACT_ERROR,
			payload: errorMessage,
		});
		return { success: false, error };
	}
};

// Actualizar un contacto existente
export const updateContact = (contactId: string, updateData: Partial<Contact>) => async (dispatch: Dispatch) => {
	try {
		const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/contacts/${contactId}`, updateData);
		console.log(response);
		if (response.data && response.data.contact) {
			dispatch({
				type: UPDATE_CONTACT,
				payload: response.data.contact,
			});
			return { success: true, contact: response.data.contact };
		} else {
			return { success: false };
		}
	} catch (error) {
		console.log(error);
		let errorMessage = "Error al actualizar el contacto";
		if (axios.isAxiosError(error) && error.response) {
			errorMessage = error.response.data?.message || errorMessage;
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		dispatch({
			type: SET_CONTACT_ERROR,
			payload: errorMessage,
		});
		return { success: false, error };
	}
};

// Obtener contactos por userId
export const getContactsByUserId = (userId: string) => async (dispatch: Dispatch) => {
	try {
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/contacts/user/${userId}`);
		console.log(response);
		dispatch({
			type: GET_CONTACTS_BY_USER,
			payload: response.data,
		});
	} catch (error) {
		console.log(error);
		dispatch({
			type: SET_CONTACT_ERROR,
			payload: (error as any).response?.data?.message || "Error al obtener contactos del usuario",
		});
	}
};

// Obtener contactos por groupId
export const getContactsByGroupId = (groupId: string) => async (dispatch: Dispatch) => {
	try {
		const response = await axios.get(`/api/contacts/group/${groupId}`);
		dispatch({
			type: GET_CONTACTS_BY_GROUP,
			payload: response.data,
		});
	} catch (error) {
		dispatch({
			type: SET_CONTACT_ERROR,
			payload: (error as any).response?.data?.message || "Error al obtener contactos del grupo",
		});
	}
};

// Eliminar contacto por _id
export const deleteContact = (contactId: string) => async (dispatch: Dispatch) => {
	try {
		await axios.delete(`/api/contacts/${contactId}`);
		dispatch({
			type: DELETE_CONTACT,
			payload: contactId,
		});
	} catch (error) {
		dispatch({
			type: SET_CONTACT_ERROR,
			payload: (error as any).response?.data?.message || "Error al eliminar contacto",
		});
	}
};

export default contacts;

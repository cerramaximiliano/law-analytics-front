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
const FILTER_CONTACTS_BY_FOLDER = "FILTER_CONTACTS_BY_FOLDER";

// initial state
const initialContactState: ContactState = {
	contacts: [],
	selectedContacts: [],
	error: null,
	isLoader: false,
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
		case FILTER_CONTACTS_BY_FOLDER:
			return {
				...state,
				selectedContacts: action.payload,
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
type UpdateContactResponse = {
	success: boolean;
	contact?: Contact; // Ajusta este tipo según la estructura de tu modelo de Contacto
	error?:
		| {
				message?: string;
		  }
		| string;
};

export const updateContact =
	(contactId: string, updateData: Partial<Contact>) =>
	async (dispatch: Dispatch): Promise<UpdateContactResponse> => {
		try {
			const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/contacts/${contactId}`, updateData);
			if (response.data && response.data.contact) {
				dispatch({
					type: UPDATE_CONTACT,
					payload: response.data.contact,
				});
				return { success: true, contact: response.data.contact };
			} else {
				return { success: false, error: "No se pudo actualizar el contacto." };
			}
		} catch (error) {
			let errorMessage = "Error al actualizar el contacto.";
			if (axios.isAxiosError(error) && error.response) {
				errorMessage = error.response.data?.message || errorMessage;
			} else if (error instanceof Error) {
				errorMessage = error.message;
			}

			dispatch({
				type: SET_CONTACT_ERROR,
				payload: errorMessage,
			});
			return { success: false, error: { message: errorMessage } };
		}
	};

export const updateMultipleContacts = (contacts: { id: string; updateData: Partial<Contact> }[]) => async (dispatch: Dispatch) => {
	try {
		const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/contacts/batch-update`, {
			contacts,
		});

		if (response.data && response.data.contacts) {
			response.data.contacts.forEach((contact: Contact) => {
				dispatch({
					type: UPDATE_CONTACT,
					payload: contact,
				});
			});
			return { success: true, contacts: response.data.contacts };
		} else {
			return { success: false };
		}
	} catch (error) {
		console.error("Error", error);
		let errorMessage = "Error al actualizar los contactos";
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
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/contacts/group/${groupId}`);
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
		const response = await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/contacts/${contactId}`);
		if (response.status === 200) {
			dispatch({
				type: DELETE_CONTACT,
				payload: contactId,
			});
			return { success: true };
		}
		return { success: false, error: "Error desconocido al eliminar contacto" };
	} catch (error) {
		const errorMessage = (error as any).response?.data?.message || "Error al eliminar contacto";
		dispatch({
			type: SET_CONTACT_ERROR,
			payload: errorMessage,
		});
		return { success: false, error: errorMessage };
	}
};

export const filterContactsByFolder = (folderId: string) => (dispatch: Dispatch, getState: () => { contacts: ContactState }) => {
	// Obtiene el estado actual
	const { contacts } = getState();

	// Filtra los contactos según el folderId
	const filteredContacts = contacts.contacts.filter((contact) => contact.folderId === folderId);

	// Despacha la acción para actualizar los contactos seleccionados
	dispatch({
		type: FILTER_CONTACTS_BY_FOLDER,
		payload: filteredContacts,
	});
};

export default contacts;

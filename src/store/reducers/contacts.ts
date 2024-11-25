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
				contacts: state.contacts.map((contact) =>
					contact._id === action.payload._id
						? {
								...contact,
								folderIds: action.payload.folderIds, // Asegurarse de que esto se mantiene como array
						  }
						: contact,
				),
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

interface UpdateResponse {
	success: boolean;
	message?: string;
	contacts?: Contact[];
	errors?: Array<{
		contactId: string;
		message: string;
	}>;
}

export const updateMultipleContacts = (contacts: { id: string; updateData: Partial<Contact> }[]) => async (dispatch: Dispatch) => {
	try {
		const response = await axios.put<UpdateResponse>(`${process.env.REACT_APP_BASE_URL}/api/contacts/batch-update`, { contacts });

		// Si la respuesta indica éxito y hay contactos actualizados
		if (response.data.success && response.data.contacts?.length) {
			response.data.contacts.forEach((contact: Contact) => {
				dispatch({
					type: UPDATE_CONTACT,
					payload: contact,
				});
			});
			return {
				success: true,
				contacts: response.data.contacts,
			};
		}

		// Si hay errores pero algunos contactos se actualizaron
		if (!response.data.success && response.data.contacts?.length) {
			// Actualizar los contactos que sí se actualizaron
			response.data.contacts.forEach((contact: Contact) => {
				dispatch({
					type: UPDATE_CONTACT,
					payload: contact,
				});
			});

			// Despachar error para los que fallaron
			dispatch({
				type: SET_CONTACT_ERROR,
				payload: response.data.message || "Algunos contactos no pudieron actualizarse",
			});

			return {
				success: false,
				contacts: response.data.contacts,
				errors: response.data.errors,
			};
		}

		// Si no hay éxito y no hay contactos actualizados
		dispatch({
			type: SET_CONTACT_ERROR,
			payload: response.data.message || "No se pudo actualizar ningún contacto",
		});

		return {
			success: false,
			errors: response.data.errors,
		};
	} catch (error: any) {
		console.error("Error en updateMultipleContacts:", error);

		let errorMessage = "Error al actualizar los contactos";

		if (axios.isAxiosError(error) && error.response?.data) {
			errorMessage = error.response.data.message || errorMessage;
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		dispatch({
			type: SET_CONTACT_ERROR,
			payload: errorMessage,
		});

		return {
			success: false,
			error: errorMessage,
			errors: error.response?.data?.errors,
		};
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
	try {
		// Obtiene el estado actual
		const { contacts } = getState();

		// Verifica que contacts.contacts existe y es un array
		if (!Array.isArray(contacts.contacts)) {
			console.error("contacts.contacts no es un array:", contacts.contacts);
			return;
		}

		// Filtra los contactos que tienen el folderId en su array de folderIds
		const filteredContacts = contacts.contacts.filter((contact) => {
			// Verifica que folderIds existe y es un array
			if (!Array.isArray(contact.folderIds)) {
				console.warn(`Contact ${contact._id} no tiene folderIds válido:`, contact.folderIds);
				return false;
			}

			// Comprueba si el folderId está en el array de folderIds
			return contact.folderIds.includes(folderId);
		});

		// Despacha la acción con los contactos filtrados
		dispatch({
			type: FILTER_CONTACTS_BY_FOLDER,
			payload: filteredContacts,
		});
	} catch (error) {
		console.error("Error al filtrar contactos por folder:", error);
		// Opcionalmente, podrías despachar una acción de error
		/* dispatch({
		  type: FILTER_CONTACTS_ERROR,
		  payload: error.message,
		}); */
	}
};

interface UnlinkResponse {
	success: boolean;
	message: string;
	contact?: Contact;
}

export const unlinkFolderFromContact = (contactId: string, folderId: string) => async (dispatch: Dispatch) => {
	try {
		const response = await axios.delete<UnlinkResponse>(`${process.env.REACT_APP_BASE_URL}/api/contacts/${contactId}/folders/${folderId}`);

		if (response.data.success && response.data.contact) {
			dispatch({
				type: UPDATE_CONTACT,
				payload: response.data.contact,
			});

			return { success: true, contact: response.data.contact };
		}

		throw new Error(response.data.message);
	} catch (error) {
		console.error("Error al desvincular folder:", error);

		let errorMessage = "Error al desvincular el contacto";
		if (axios.isAxiosError(error) && error.response?.data) {
			errorMessage = error.response.data.message;
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		dispatch({
			type: SET_CONTACT_ERROR,
			payload: errorMessage,
		});

		return {
			success: false,
			error: errorMessage,
		};
	}
};

interface LinkFoldersResponse {
	success: boolean;
	message: string;
	contact?: any;
	error?: string;
}

export const linkFoldersToContact = (contactId: string, folderIds: string[]) => async (dispatch: Dispatch) => {
	try {
		const response = await axios.post<LinkFoldersResponse>(`${process.env.REACT_APP_BASE_URL}/api/contacts/${contactId}/link-folders`, {
			folderIds,
		});

		if (response.data.success && response.data.contact) {
			// Actualizar el contacto en el store
			dispatch({
				type: UPDATE_CONTACT,
				payload: response.data.contact,
			});

			return {
				success: true,
				contact: response.data.contact,
			};
		}

		throw new Error(response.data.message || "Error al vincular folders");
	} catch (error) {
		console.error("Error linking folders:", error);

		let errorMessage = "Error al vincular las causas";
		if (axios.isAxiosError(error) && error.response?.data) {
			errorMessage = error.response.data.message || errorMessage;
		} else if (error instanceof Error) {
			errorMessage = error.message;
		}

		dispatch({
			type: SET_CONTACT_ERROR,
			payload: errorMessage,
		});

		return {
			success: false,
			error: errorMessage,
		};
	}
};

export default contacts;

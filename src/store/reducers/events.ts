// event.ts
import axios from "axios";
import { Dispatch } from "redux";
// Types for the actions and state
import { Event, EventState, Action } from "types/events";

// action types
const ADD_EVENT = "ADD_EVENT";
const ADD_BATCH_EVENTS = "ADD_BATCH_EVENTS";
const GET_EVENTS_BY_USER = "GET_EVENTS_BY_USER";
const GET_EVENTS_BY_GROUP = "GET_EVENTS_BY_GROUP";
const DELETE_EVENT = "DELETE_EVENT";
const DELETE_GOOGLE_EVENTS = "DELETE_GOOGLE_EVENTS";
const UPDATE_EVENT = "UPDATE_EVENT";
const SET_EVENT_ERROR = "SET_EVENT_ERROR";
const GET_EVENTS_BY_ID = "GET_EVENTS_BY_ID";
const SELECT_EVENT = "SELECT_EVENT";
const SET_LOADING = "SET_LOADING";

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
		case SET_LOADING:
			return {
				...state,
				isLoader: true,
				error: undefined,
			};
		case ADD_EVENT:
			return {
				...state,
				events: [...state.events, action.payload],
				isLoader: false,
			};
		case ADD_BATCH_EVENTS:
			return {
				...state,
				events: [...state.events, ...action.payload],
				isLoader: false,
			};
		case GET_EVENTS_BY_ID:
		case GET_EVENTS_BY_USER:
		case GET_EVENTS_BY_GROUP:
			return {
				...state,
				events: action.payload,
				isLoader: false,
			};
		case DELETE_EVENT:
			return {
				...state,
				events: state.events.filter((event) => event._id !== action.payload),
				isLoader: false,
			};
		case DELETE_GOOGLE_EVENTS:
			return {
				...state,
				events: state.events.filter((event) => !event.googleCalendarId),
				isLoader: false,
			};
		case UPDATE_EVENT:
			return {
				...state,
				events: state.events.map((event) => (event._id === action.payload._id ? action.payload : event)),
				isLoader: false,
			};
		case SET_EVENT_ERROR:
			return {
				...state,
				error: action.payload,
				isLoader: false,
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
	dispatch({ type: SET_LOADING });
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
	dispatch({ type: SET_LOADING });
	try {
		const response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/events/${eventId}`, updateData);

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
	dispatch({ type: SET_LOADING });
	try {
		// Campos optimizados para listas
		const fields = "_id,title,description,type,color,allDay,start,end,folderId,folderName";
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/events/user/${userId}`, {
			params: { fields },
		});

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
	dispatch({ type: SET_LOADING });
	try {
		const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/events/id/${_id}`);
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
	dispatch({ type: SET_LOADING });
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
	dispatch({ type: SET_LOADING });
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

// Helper function para esperar con backoff exponencial
const waitWithBackoff = async (attempt: number, retryAfter?: number) => {
	if (retryAfter) {
		// Si el servidor nos dice cuándo reintentar, usar ese valor
		await new Promise(resolve => setTimeout(resolve, retryAfter * 1000));
	} else {
		// Backoff exponencial: 2s, 4s, 8s, 16s, max 30s
		const delay = Math.min(Math.pow(2, attempt) * 1000, 30000);
		await new Promise(resolve => setTimeout(resolve, delay));
	}
};

// Agregar múltiples eventos en lote (para importación de Google Calendar)
export const addBatchEvents = (events: Event[], onProgress?: (processed: number, total: number) => void) => async (dispatch: Dispatch) => {
	dispatch({ type: SET_LOADING });
	
	const MAX_BATCH_SIZE = 100; // Máximo permitido por el servidor
	const MAX_RETRIES = 3;
	let totalSuccessCount = 0;
	let totalErrorCount = 0;
	const allCreatedEvents: Event[] = [];
	
	try {
		// Dividir eventos en lotes de máximo 100
		for (let i = 0; i < events.length; i += MAX_BATCH_SIZE) {
			const batch = events.slice(i, i + MAX_BATCH_SIZE);
			let retryCount = 0;
			let batchProcessed = false;
			
			while (!batchProcessed && retryCount < MAX_RETRIES) {
				try {
					const response = await axios.post(
						`${process.env.REACT_APP_BASE_URL}/api/events/batch`,
						{ events: batch },
						{
							headers: {
								"Content-Type": "application/json",
							},
						}
					);

					if (response.data) {
						const createdEvents = response.data.events || [];
						const successCount = response.data.successCount || createdEvents.length;
						const errorCount = response.data.errorCount || (batch.length - successCount);
						const duplicatesCount = response.data.duplicatesCount || 0;
						
						allCreatedEvents.push(...createdEvents);
						totalSuccessCount += successCount;
						totalErrorCount += errorCount;
						batchProcessed = true;
						
						// Log si hay duplicados (no son errores reales)
						if (duplicatesCount > 0) {
							console.log(`${duplicatesCount} eventos omitidos por ser duplicados (ya existen en la base de datos)`);
						}
						
						// Notificar progreso si hay callback
						if (onProgress) {
							onProgress(Math.min(i + MAX_BATCH_SIZE, events.length), events.length);
						}
						
						// Esperar 2 segundos entre batches para respetar rate limit
						if (i + MAX_BATCH_SIZE < events.length) {
							await new Promise(resolve => setTimeout(resolve, 2000));
						}
					}
				} catch (error: any) {
					if (error?.response?.status === 429) {
						// Rate limit alcanzado
						retryCount++;
						console.log(`Rate limit alcanzado. Intento ${retryCount}/${MAX_RETRIES}`);
						
						// Obtener el header Retry-After si existe
						const retryAfter = error.response.headers['retry-after'];
						await waitWithBackoff(retryCount, retryAfter ? parseInt(retryAfter) : undefined);
					} else if (error?.response?.status === 404) {
						// Endpoint batch no existe, fallback a creación individual
						console.log("Endpoint batch no disponible, usando creación individual con throttling...");
						
						for (const event of batch) {
							try {
								await new Promise(resolve => setTimeout(resolve, 600)); // 600ms entre peticiones (máx 10/min)
								
								const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/events`, event);
								if (response.data && response.data.event) {
									allCreatedEvents.push(response.data.event);
									totalSuccessCount++;
								} else {
									totalErrorCount++;
								}
							} catch (individualError: any) {
								console.error("Error al crear evento individual:", individualError);
								totalErrorCount++;
								
								if (individualError?.response?.status === 429) {
									// Rate limit en endpoint individual
									const retryAfter = individualError.response.headers['retry-after'];
									await waitWithBackoff(1, retryAfter ? parseInt(retryAfter) : 6);
								}
							}
							
							// Notificar progreso
							if (onProgress) {
								const processed = i + allCreatedEvents.length - totalSuccessCount + totalErrorCount;
								onProgress(processed, events.length);
							}
						}
						batchProcessed = true;
					} else {
						// Otro tipo de error, no reintentar este batch
						console.error(`Error procesando batch: ${error?.response?.data?.message || error.message}`);
						totalErrorCount += batch.length;
						batchProcessed = true;
					}
				}
			}
			
			if (!batchProcessed) {
				// Después de todos los reintentos, marcar como error
				totalErrorCount += batch.length;
			}
		}
		
		// Actualizar el estado con todos los eventos creados
		if (allCreatedEvents.length > 0) {
			dispatch({
				type: ADD_BATCH_EVENTS,
				payload: allCreatedEvents,
			});
		}
		
		return { 
			success: totalSuccessCount > 0, 
			events: allCreatedEvents,
			successCount: totalSuccessCount,
			errorCount: totalErrorCount
		};
		
	} catch (error: any) {
		console.error("Error general al agregar eventos en lote:", error);
		dispatch({
			type: SET_EVENT_ERROR,
			payload: error?.response?.data?.message || "Error al agregar eventos en lote",
		});
		return { 
			success: false, 
			error,
			successCount: totalSuccessCount,
			errorCount: events.length
		};
	}
};

// Eliminar eventos importados de Google Calendar (al desvincular)
export const deleteGoogleCalendarEvents = () => async (dispatch: Dispatch, getState: any) => {
	console.log("deleteGoogleCalendarEvents: Iniciando eliminación de eventos de Google...");
	dispatch({ type: SET_LOADING });
	try {
		// Obtener userId del Redux store
		const state = getState();
		const userId = state.auth?.user?._id;
		console.log("deleteGoogleCalendarEvents: userId obtenido desde Redux:", userId);
		
		if (!userId) {
			throw new Error("No se pudo obtener el ID del usuario desde el store");
		}
		
		const url = `${process.env.REACT_APP_BASE_URL}/api/events/google-events/${userId}`;
		console.log("deleteGoogleCalendarEvents: Haciendo DELETE a:", url);
		
		// Eliminar del backend todos los eventos con googleCalendarId para este usuario
		const response = await axios.delete(url, {
			headers: {
				"Content-Type": "application/json",
			},
		});
		
		console.log("deleteGoogleCalendarEvents: Respuesta del servidor:", response.data);
		
		// Pequeño delay para asegurar que el backend completó la eliminación
		await new Promise(resolve => setTimeout(resolve, 500));
		
		// Actualizar el estado local eliminando eventos con googleCalendarId
		dispatch({
			type: DELETE_GOOGLE_EVENTS,
		});
		
		console.log("deleteGoogleCalendarEvents: Estado de Redux actualizado");
		
		console.log("deleteGoogleCalendarEvents: Eliminación exitosa");
		
		// Retornar información sobre la eliminación
		const deletedCount = response.data?.deletedCount || response.data?.count || 0;
		return { success: true, deletedCount };
	} catch (error: any) {
		// Si el endpoint no existe (404), intentamos eliminar uno por uno
		if (error?.response?.status === 404) {
			try {
				const state = getState();
				const userId = state.auth?.user?._id;
				if (userId) {
					console.log("Endpoint masivo no disponible, eliminando eventos uno por uno...");
					const eventsResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/events/user/${userId}`);
					if (eventsResponse.data.success && Array.isArray(eventsResponse.data.events)) {
						const googleEvents = eventsResponse.data.events.filter((e: Event) => e.googleCalendarId);
						let deletedCount = 0;
						
						console.log(`Eliminando ${googleEvents.length} eventos de Google Calendar...`);
						for (const event of googleEvents) {
							if (event._id) {
								try {
									await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/events/${event._id}`);
									deletedCount++;
								} catch (deleteError) {
									console.error(`Error eliminando evento ${event._id}:`, deleteError);
								}
							}
						}
						
						// Pequeño delay para asegurar que el backend completó todas las eliminaciones
						await new Promise(resolve => setTimeout(resolve, 500));
						
						// Actualizar el estado local
						dispatch({
							type: DELETE_GOOGLE_EVENTS,
						});
						
						console.log("deleteGoogleCalendarEvents: Estado de Redux actualizado (fallback)");
						
						console.log(`Eliminados ${deletedCount} de ${googleEvents.length} eventos`);
						return { success: true, deletedCount };
					}
				}
			} catch (fallbackError) {
				console.error("Error en fallback de eliminación:", fallbackError);
				dispatch({
					type: SET_EVENT_ERROR,
					payload: "Error al eliminar eventos de Google Calendar",
				});
				return { success: false };
			}
		} else {
			// Otro tipo de error
			console.error("Error al eliminar eventos de Google Calendar:", error);
			dispatch({
				type: SET_EVENT_ERROR,
				payload: error?.response?.data?.message || "Error al eliminar eventos de Google Calendar",
			});
			return { success: false };
		}
		
		dispatch({
			type: SET_EVENT_ERROR,
			payload: "Error al eliminar eventos de Google Calendar",
		});
		return { success: false };
	}
};

export default eventReducer;

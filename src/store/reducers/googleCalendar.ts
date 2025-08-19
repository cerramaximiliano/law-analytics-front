import { createSlice, PayloadAction } from "@reduxjs/toolkit";
import { EventInput } from "@fullcalendar/common";
import googleCalendarService from "services/googleCalendarService";
import { dispatch } from "store";
import { openSnackbar } from "./snackbar";
import { Event } from "types/events";

interface GoogleCalendarState {
	isConnected: boolean;
	isLoading: boolean;
	isSyncing: boolean;
	userProfile: {
		id: string;
		name: string;
		email: string;
		imageUrl: string;
	} | null;
	lastSyncTime: string | null;
	syncStats: {
		created: number;
		updated: number;
		deleted: number;
		imported: number;
	} | null;
	googleEvents: EventInput[];
}

const initialState: GoogleCalendarState = {
	isConnected: false,
	isLoading: false,
	isSyncing: false,
	userProfile: null,
	lastSyncTime: null,
	syncStats: null,
	googleEvents: [],
};

const googleCalendarSlice = createSlice({
	name: "googleCalendar",
	initialState,
	reducers: {
		setLoading: (state, action: PayloadAction<boolean>) => {
			state.isLoading = action.payload;
		},
		setSyncing: (state, action: PayloadAction<boolean>) => {
			state.isSyncing = action.payload;
		},
		setConnected: (state, action: PayloadAction<boolean>) => {
			state.isConnected = action.payload;
			if (!action.payload) {
				state.userProfile = null;
			}
		},
		setUserProfile: (state, action: PayloadAction<GoogleCalendarState["userProfile"]>) => {
			state.userProfile = action.payload;
		},
		setGoogleEvents: (state, action: PayloadAction<EventInput[]>) => {
			state.googleEvents = action.payload;
		},
		setSyncStats: (
			state,
			action: PayloadAction<{ created: number; updated: number; deleted: number; imported: EventInput[] | number }>,
		) => {
			// Handle both EventInput[] and number for imported
			const imported = Array.isArray(action.payload.imported) ? action.payload.imported.length : action.payload.imported;
			state.syncStats = {
				created: action.payload.created,
				updated: action.payload.updated,
				deleted: action.payload.deleted,
				imported: imported,
			};
			state.lastSyncTime = new Date().toISOString();
		},
		resetState: () => initialState,
	},
});

export const { setLoading, setSyncing, setConnected, setUserProfile, setGoogleEvents, setSyncStats, resetState } =
	googleCalendarSlice.actions;

export default googleCalendarSlice.reducer;

// Thunks
export const initializeGoogleCalendar = () => async () => {
	dispatch(setLoading(true));
	try {
		await googleCalendarService.init();
		const isSignedIn = googleCalendarService.isUserSignedIn();
		dispatch(setConnected(isSignedIn));

		if (isSignedIn) {
			const profile = googleCalendarService.getUserProfile();
			dispatch(setUserProfile(profile));
		}
	} catch (error: any) {
		console.error("Error initializing Google Calendar:", error);
		const errorMessage = error?.message || "Error al inicializar Google Calendar";
		dispatch(
			openSnackbar({
				open: true,
				message: errorMessage,
				variant: "alert",
				alert: {
					color: "error",
				},
				close: true,
			}),
		);
	} finally {
		dispatch(setLoading(false));
	}
};

export const connectGoogleCalendar = () => async (dispatch: any, getState: any) => {
	dispatch(setLoading(true));
	try {
		await googleCalendarService.signIn();
		
		// Pequeña espera para asegurar que Google haya actualizado el estado
		await new Promise(resolve => setTimeout(resolve, 100));
		
		// Obtener el perfil del usuario
		const profile = googleCalendarService.getUserProfile();
		
		if (!profile) {
			throw new Error("No se pudo obtener el perfil del usuario");
		}
		
		// Actualizar el estado en el orden correcto
		dispatch(setConnected(true));
		dispatch(setUserProfile(profile));
		
		dispatch(
			openSnackbar({
				open: true,
				message: `Conectado a Google Calendar como ${profile?.email}`,
				variant: "alert",
				alert: {
					color: "success",
				},
				close: true,
			}),
		);
		
		// Importar eventos de Google Calendar automáticamente
		console.log("Iniciando importación automática de eventos de Google Calendar...");
		
		try {
			// Obtener eventos de Google Calendar
			const googleEvents = await googleCalendarService.fetchEvents();
			console.log(`Eventos encontrados en Google Calendar: ${googleEvents.length}`);
			
			if (googleEvents.length > 0) {
				// Obtener userId del estado
				const state = getState();
				const userId = state.auth?.user?._id;
				
				if (userId) {
					// Obtener eventos existentes para evitar duplicados
					const { getEventsByUserId, addBatchEvents } = await import("./events");
					
					// Primero obtener eventos existentes
					await dispatch(getEventsByUserId(userId));
					const updatedState = getState();
					const existingEvents = updatedState.events?.events || [];
					
					// Filtrar eventos que ya existen
					const existingGoogleIds = new Set(
						existingEvents
							.filter((e: any) => e.googleCalendarId)
							.map((e: any) => e.googleCalendarId)
					);
					
					// Preparar eventos para importar
					const eventsToImport: Event[] = googleEvents
						.filter(googleEvent => {
							const googleId = googleEvent.googleCalendarId || googleEvent.id;
							return googleId && !existingGoogleIds.has(googleId);
						})
						.map(googleEvent => ({
							title: googleEvent.title || "Sin título",
							description: googleEvent.description || "",
							type: "other",
							color: googleEvent.color || "#1890ff",
							allDay: googleEvent.allDay || false,
							start: googleEvent.start,
							end: googleEvent.end || googleEvent.start,
							googleCalendarId: googleEvent.googleCalendarId || googleEvent.id,
							userId: userId,
						} as Event));
					
					if (eventsToImport.length > 0) {
						console.log(`Importando ${eventsToImport.length} eventos nuevos...`);
						
						// Mostrar mensaje de progreso
						dispatch(
							openSnackbar({
								open: true,
								message: `Importando ${eventsToImport.length} eventos de Google Calendar...`,
								variant: "alert",
								alert: {
									color: "info",
								},
								close: false,
							}),
						);
						
						// Importar eventos en lote
						const result = await dispatch(addBatchEvents(eventsToImport));
						
						if (result.success) {
							const successCount = result.successCount || eventsToImport.length;
							dispatch(
								openSnackbar({
									open: true,
									message: `✓ ${successCount} evento(s) importado(s) de Google Calendar`,
									variant: "alert",
									alert: {
										color: "success",
									},
									close: true,
								}),
							);
							
							// Recargar eventos
							await dispatch(getEventsByUserId(userId));
						}
					} else {
						console.log("Todos los eventos ya están sincronizados");
					}
				} else {
					console.error("No se pudo obtener el userId para importar eventos");
				}
			}
		} catch (importError) {
			console.error("Error al importar eventos automáticamente:", importError);
			// No lanzar el error para no interrumpir la conexión exitosa
		}
		
		// Retornar el profile para uso posterior si es necesario
		return profile;
	} catch (error: any) {
		console.error("Error connecting to Google Calendar:", error);
		let errorMessage = "Error al conectar con Google Calendar";
		
		if (error?.error === "popup_closed_by_user") {
			errorMessage = "Conexión cancelada por el usuario";
		} else if (error?.message) {
			errorMessage = error.message;
		}
		
		dispatch(
			openSnackbar({
				open: true,
				message: errorMessage,
				variant: "alert",
				alert: {
					color: "error",
				},
				close: true,
			}),
		);
		throw error;
	} finally {
		dispatch(setLoading(false));
	}
};

export const disconnectGoogleCalendar = () => async (dispatch: any, getState: any) => {
	dispatch(setLoading(true));
	try {
		console.log("Iniciando desconexión de Google Calendar...");
		
		// Primero, eliminar eventos importados de Google del backend
		const { deleteGoogleCalendarEvents } = await import("./events");
		console.log("Eliminando eventos de Google Calendar del backend...");
		
		const deleteResult = await dispatch(deleteGoogleCalendarEvents());
		console.log("Resultado de eliminación:", deleteResult);
		
		// Luego, desconectar de Google
		await googleCalendarService.signOut();
		dispatch(resetState());
		
		let message = "Desconectado de Google Calendar";
		if (deleteResult && deleteResult.deletedCount) {
			message = `Desconectado de Google Calendar. ${deleteResult.deletedCount} evento(s) de Google eliminado(s)`;
		} else if (deleteResult && deleteResult.success) {
			message = "Desconectado de Google Calendar y eventos de Google eliminados";
		}
		
		dispatch(
			openSnackbar({
				open: true,
				message,
				variant: "alert",
				alert: {
					color: "info",
				},
				close: true,
			}),
		);
		
		// Recargar eventos desde la base de datos para asegurarnos de que el calendario se actualice
		const state = getState();
		const userId = state.auth?.user?._id;
		
		if (userId) {
			// Importar la función para obtener eventos
			const { getEventsByUserId } = await import("./events");
			
			// Recargar eventos después de eliminar los de Google
			console.log("Recargando eventos después de desvincular Google Calendar...");
			await dispatch(getEventsByUserId(userId));
			
			// Verificar el estado actualizado
			const updatedState = getState();
			const remainingEvents = updatedState.events?.events || [];
			console.log(`Eventos restantes en el calendario: ${remainingEvents.length}`);
		}
	} catch (error) {
		console.error("Error disconnecting from Google Calendar:", error);
		dispatch(
			openSnackbar({
				open: true,
				message: "Error al desconectar de Google Calendar",
				variant: "alert",
				alert: {
					color: "error",
				},
				close: true,
			}),
		);
	} finally {
		dispatch(setLoading(false));
	}
};

export const fetchGoogleEvents = () => async () => {
	dispatch(setLoading(true));
	try {
		const events = await googleCalendarService.fetchEvents();
		dispatch(setGoogleEvents(events));
		return events;
	} catch (error) {
		console.error("Error fetching Google events:", error);
		dispatch(
			openSnackbar({
				open: true,
				message: "Error al obtener eventos de Google Calendar",
				variant: "alert",
				alert: {
					color: "error",
				},
				close: true,
			}),
		);
		return [];
	} finally {
		dispatch(setLoading(false));
	}
};

export const syncWithGoogleCalendar = (localEvents: Event[]) => async () => {
	dispatch(setSyncing(true));
	
	// Mostrar mensaje de inicio
	dispatch(
		openSnackbar({
			open: true,
			message: `Sincronizando ${localEvents.length} eventos locales con Google Calendar...`,
			variant: "alert",
			alert: {
				color: "info",
			},
			close: false, // Mantener abierto durante el proceso
		}),
	);
	
	try {
		// Calcular timeout dinámico basado en cantidad de eventos
		// Aproximadamente 3 segundos por evento + 30 segundos base
		const timeoutMs = Math.max(30000 + (localEvents.length * 3000), 300000); // Máximo 5 minutos
		console.log(`Timeout configurado: ${timeoutMs / 1000} segundos para ${localEvents.length} eventos`);
		
		const timeoutPromise = new Promise((_, reject) => 
			setTimeout(() => reject(new Error("Timeout: La sincronización está tardando demasiado")), timeoutMs)
		);
		
		const syncPromise = googleCalendarService.syncEvents(localEvents);
		
		// Ejecutar con timeout
		const stats = await Promise.race([syncPromise, timeoutPromise]) as {
			created: number;
			updated: number;
			deleted: number;
			imported: EventInput[];
		};
		
		dispatch(
			setSyncStats({
				created: stats.created,
				updated: stats.updated,
				deleted: stats.deleted,
				imported: stats.imported.length,
			}),
		);
		
		// Mostrar mensaje informativo si hay eventos para importar
		if (stats.imported.length > 0) {
			dispatch(
				openSnackbar({
					open: true,
					message: `Sincronización iniciada: ${stats.created} enviados a Google, ${stats.imported.length} eventos listos para importar`,
					variant: "alert",
					alert: {
						color: "info",
					},
					close: true,
				}),
			);
		} else {
			dispatch(
				openSnackbar({
					open: true,
					message: `Sincronización completada: ${stats.created} eventos enviados a Google Calendar`,
					variant: "alert",
					alert: {
						color: "success",
					},
					close: true,
				}),
			);
		}
		return stats;
	} catch (error: any) {
		console.error("Error syncing with Google Calendar:", error);
		
		let errorMessage = "Error al sincronizar con Google Calendar";
		if (error?.message?.includes("Timeout")) {
			errorMessage = "La sincronización está tardando demasiado. Por favor, intenta nuevamente.";
		} else if (error?.message) {
			errorMessage = `Error: ${error.message}`;
		}
		
		dispatch(
			openSnackbar({
				open: true,
				message: errorMessage,
				variant: "alert",
				alert: {
					color: "error",
				},
				close: true,
			}),
		);
		// Asegurarse de que se resetea el estado syncing en caso de error
		dispatch(setSyncing(false));
		return null;
	} finally {
		// Siempre resetear el estado syncing
		dispatch(setSyncing(false));
	}
};

export const createGoogleEvent = (event: Event) => async () => {
	try {
		const googleId = await googleCalendarService.createEvent(event);
		dispatch(
			openSnackbar({
				open: true,
				message: "Evento creado en Google Calendar",
				variant: "alert",
				alert: {
					color: "success",
				},
				close: true,
			}),
		);
		return googleId;
	} catch (error) {
		console.error("Error creating Google event:", error);
		dispatch(
			openSnackbar({
				open: true,
				message: "Error al crear evento en Google Calendar",
				variant: "alert",
				alert: {
					color: "error",
				},
				close: true,
			}),
		);
		return null;
	}
};

export const updateGoogleEvent = (eventId: string, event: Partial<Event>) => async () => {
	try {
		await googleCalendarService.updateEvent(eventId, event);
		dispatch(
			openSnackbar({
				open: true,
				message: "Evento actualizado en Google Calendar",
				variant: "alert",
				alert: {
					color: "success",
				},
				close: true,
			}),
		);
		return true;
	} catch (error) {
		console.error("Error updating Google event:", error);
		dispatch(
			openSnackbar({
				open: true,
				message: "Error al actualizar evento en Google Calendar",
				variant: "alert",
				alert: {
					color: "error",
				},
				close: true,
			}),
		);
		return false;
	}
};

export const deleteGoogleEvent = (eventId: string) => async () => {
	try {
		await googleCalendarService.deleteEvent(eventId);
		dispatch(
			openSnackbar({
				open: true,
				message: "Evento eliminado de Google Calendar",
				variant: "alert",
				alert: {
					color: "success",
				},
				close: true,
			}),
		);
		return true;
	} catch (error) {
		console.error("Error deleting Google event:", error);
		dispatch(
			openSnackbar({
				open: true,
				message: "Error al eliminar evento de Google Calendar",
				variant: "alert",
				alert: {
					color: "error",
				},
				close: true,
			}),
		);
		return false;
	}
};

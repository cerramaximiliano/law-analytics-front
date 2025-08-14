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
	} catch (error) {
		console.error("Error initializing Google Calendar:", error);
		dispatch(
			openSnackbar({
				open: true,
				message: "Error al inicializar Google Calendar",
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

export const connectGoogleCalendar = () => async () => {
	dispatch(setLoading(true));
	try {
		await googleCalendarService.signIn();
		const profile = googleCalendarService.getUserProfile();
		dispatch(setUserProfile(profile));
		dispatch(setConnected(true));
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
	} catch (error: any) {
		console.error("Error connecting to Google Calendar:", error);
		dispatch(
			openSnackbar({
				open: true,
				message: error.error === "popup_closed_by_user" ? "Conexión cancelada" : "Error al conectar con Google Calendar",
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

export const disconnectGoogleCalendar = () => async () => {
	dispatch(setLoading(true));
	try {
		await googleCalendarService.signOut();
		dispatch(resetState());
		dispatch(
			openSnackbar({
				open: true,
				message: "Desconectado de Google Calendar",
				variant: "alert",
				alert: {
					color: "info",
				},
				close: true,
			}),
		);
	} catch (error) {
		console.error("Error disconnecting from Google Calendar:", error);
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
	try {
		const stats = await googleCalendarService.syncEvents(localEvents);
		dispatch(
			setSyncStats({
				created: stats.created,
				updated: stats.updated,
				deleted: stats.deleted,
				imported: stats.imported.length,
			}),
		);
		dispatch(
			openSnackbar({
				open: true,
				message: `Sincronización completada: ${stats.created} creados, ${stats.imported.length} importados`,
				variant: "alert",
				alert: {
					color: "success",
				},
				close: true,
			}),
		);
		return stats;
	} catch (error) {
		console.error("Error syncing with Google Calendar:", error);
		dispatch(
			openSnackbar({
				open: true,
				message: "Error al sincronizar con Google Calendar",
				variant: "alert",
				alert: {
					color: "error",
				},
				close: true,
			}),
		);
		return null;
	} finally {
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

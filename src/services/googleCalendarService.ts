import { gapi } from "gapi-script";
import { GOOGLE_CALENDAR_CONFIG, GOOGLE_CALENDAR_COLORS } from "config/googleCalendar";
import { Event } from "types/events";
import { EventInput } from "@fullcalendar/common";

interface GoogleCalendarEvent {
	id?: string;
	summary: string;
	description?: string;
	start: {
		dateTime?: string;
		date?: string;
		timeZone?: string;
	};
	end: {
		dateTime?: string;
		date?: string;
		timeZone?: string;
	};
	colorId?: string;
	reminders?: {
		useDefault: boolean;
		overrides?: Array<{
			method: string;
			minutes: number;
		}>;
	};
}

class GoogleCalendarService {
	private isInitialized = false;
	private isSignedIn = false;

	// Initialize Google API client
	async init(): Promise<void> {
		return new Promise((resolve, reject) => {
			// Verificar que las credenciales estén configuradas
			if (!GOOGLE_CALENDAR_CONFIG.CLIENT_ID) {
				const error = new Error("Google Client ID no configurado. Agrega REACT_APP_AUTH0_GOOGLE_ID en tu archivo .env");
				console.error(error);
				reject(error);
				return;
			}

			if (!GOOGLE_CALENDAR_CONFIG.API_KEY) {
				const error = new Error("Google API Key no configurada. Agrega REACT_APP_GOOGLE_API_KEY en tu archivo .env");
				console.error(error);
				reject(error);
				return;
			}

			gapi.load("client:auth2", async () => {
				try {
					await gapi.client.init({
						apiKey: GOOGLE_CALENDAR_CONFIG.API_KEY,
						clientId: GOOGLE_CALENDAR_CONFIG.CLIENT_ID,
						discoveryDocs: GOOGLE_CALENDAR_CONFIG.DISCOVERY_DOCS,
						scope: GOOGLE_CALENDAR_CONFIG.SCOPES,
					});

					this.isInitialized = true;

					// Listen for sign-in state changes
					gapi.auth2.getAuthInstance().isSignedIn.listen((signedIn: boolean) => {
						this.isSignedIn = signedIn;
					});

					// Handle initial sign-in state
					this.isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
					resolve();
				} catch (error: any) {
					let errorMessage = "Error inicializando Google Calendar API";
					
					// Analizar el error para dar mensajes más específicos
					if (error?.details) {
						errorMessage = error.details;
					} else if (error?.error === "idpiframe_initialization_failed") {
						errorMessage = "Error de configuración: Verifica que el dominio esté autorizado en Google Cloud Console";
					} else if (error?.error === "popup_closed_by_user") {
						errorMessage = "Autenticación cancelada por el usuario";
					} else if (error?.error === "access_denied") {
						errorMessage = "Acceso denegado: Verifica los permisos en Google Cloud Console";
					}
					
					console.error(errorMessage, error);
					reject(new Error(errorMessage));
				}
			});
		});
	}

	// Sign in to Google
	async signIn(): Promise<void> {
		if (!this.isInitialized) {
			await this.init();
		}
		// Forzar que siempre muestre la pantalla de consentimiento
		// prompt: 'consent' - Siempre muestra la pantalla de consentimiento
		// prompt: 'select_account' - Permite elegir cuenta
		// prompt: 'select_account consent' - Ambas opciones
		await gapi.auth2.getAuthInstance().signIn({
			prompt: 'select_account consent'
		});
		
		// Actualizar el estado de signed in
		this.isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
		
		// Verificar que el login fue exitoso
		if (!this.isSignedIn) {
			throw new Error("No se pudo completar el inicio de sesión");
		}
	}

	// Sign out from Google
	async signOut(): Promise<void> {
		if (!this.isInitialized) {
			return;
		}
		const auth = gapi.auth2.getAuthInstance();
		
		// Opcionalmente, revocar el acceso completamente
		// Esto forzará al usuario a volver a autorizar la próxima vez
		try {
			// Desconectar (solo cierra sesión)
			await auth.signOut();
			
			// Opcional: Revocar acceso completamente
			// await auth.disconnect();
			// Si descomentas la línea anterior, el usuario tendrá que 
			// volver a autorizar todos los permisos la próxima vez
		} catch (error) {
			console.error("Error al cerrar sesión de Google:", error);
			// Continuar aunque falle el signOut
		}
	}

	// Check if user is signed in
	isUserSignedIn(): boolean {
		return this.isSignedIn;
	}

	// Get user profile
	getUserProfile() {
		// Actualizar el estado primero
		if (gapi && gapi.auth2 && gapi.auth2.getAuthInstance()) {
			this.isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
		}
		
		if (!this.isSignedIn) {
			return null;
		}
		
		try {
			const currentUser = gapi.auth2.getAuthInstance().currentUser.get();
			const profile = currentUser.getBasicProfile();
			
			if (!profile) {
				console.warn("Profile not available yet");
				return null;
			}
			
			return {
				id: profile.getId(),
				name: profile.getName(),
				email: profile.getEmail(),
				imageUrl: profile.getImageUrl(),
			};
		} catch (error) {
			console.error("Error getting user profile:", error);
			return null;
		}
	}

	// Convert local event to Google Calendar format
	private convertToGoogleEvent(event: Event): GoogleCalendarEvent {
		const googleEvent: GoogleCalendarEvent = {
			summary: event.title,
			description: event.description || "",
			start: { dateTime: "", timeZone: "" },
			end: { dateTime: "", timeZone: "" },
		};

		// Handle all-day events
		if (event.allDay) {
			googleEvent.start = {
				date: new Date(event.start).toISOString().split("T")[0],
			};
			googleEvent.end = {
				date: new Date(event.end || event.start).toISOString().split("T")[0],
			};
		} else {
			googleEvent.start = {
				dateTime: new Date(event.start).toISOString(),
				timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			};
			googleEvent.end = {
				dateTime: new Date(event.end || event.start).toISOString(),
				timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
			};
		}

		// Map color based on event type or category
		if (event.color) {
			googleEvent.colorId = this.mapColorToGoogle(event.color);
		}

		return googleEvent;
	}

	// Convert Google Calendar event to local format
	private convertFromGoogleEvent(googleEvent: any): EventInput {
		const event: EventInput = {
			id: googleEvent.id,
			title: googleEvent.summary || "Sin título",
			description: googleEvent.description,
			googleCalendarId: googleEvent.id,
		};

		// Handle dates
		if (googleEvent.start.date) {
			// All-day event
			event.start = googleEvent.start.date;
			event.end = googleEvent.end.date;
			event.allDay = true;
		} else {
			// Timed event
			event.start = googleEvent.start.dateTime;
			event.end = googleEvent.end.dateTime;
			event.allDay = false;
		}

		// Map color from Google
		if (googleEvent.colorId) {
			event.color = this.mapColorFromGoogle(googleEvent.colorId);
		}

		return event;
	}

	// Map local color to Google Calendar color ID
	private mapColorToGoogle(color: string): string {
		const colorMap: { [key: string]: string } = {
			"#1976d2": GOOGLE_CALENDAR_COLORS.primary,
			"#4caf50": GOOGLE_CALENDAR_COLORS.success,
			"#ff9800": GOOGLE_CALENDAR_COLORS.warning,
			"#f44336": GOOGLE_CALENDAR_COLORS.error,
			"#2196f3": GOOGLE_CALENDAR_COLORS.info,
			"#9e9e9e": GOOGLE_CALENDAR_COLORS.secondary,
		};
		return colorMap[color.toLowerCase()] || GOOGLE_CALENDAR_COLORS.primary;
	}

	// Map Google Calendar color ID to local color
	private mapColorFromGoogle(colorId: string): string {
		const colorMap: { [key: string]: string } = {
			[GOOGLE_CALENDAR_COLORS.primary]: "#1976d2",
			[GOOGLE_CALENDAR_COLORS.success]: "#4caf50",
			[GOOGLE_CALENDAR_COLORS.warning]: "#ff9800",
			[GOOGLE_CALENDAR_COLORS.error]: "#f44336",
			[GOOGLE_CALENDAR_COLORS.info]: "#2196f3",
			[GOOGLE_CALENDAR_COLORS.secondary]: "#9e9e9e",
		};
		return colorMap[colorId] || "#1976d2";
	}

	// Fetch events from Google Calendar
	async fetchEvents(timeMin?: Date, timeMax?: Date): Promise<EventInput[]> {
		if (!this.isSignedIn) {
			throw new Error("User is not signed in to Google Calendar");
		}

		try {
			const response = await gapi.client.calendar.events.list({
				calendarId: "primary",
				timeMin: timeMin ? timeMin.toISOString() : new Date().toISOString(),
				timeMax: timeMax ? timeMax.toISOString() : undefined,
				showDeleted: false,
				singleEvents: true,
				maxResults: 250,
				orderBy: "startTime",
			});

			const events = response.result.items || [];
			return events.map((event: any) => this.convertFromGoogleEvent(event));
		} catch (error) {
			console.error("Error fetching Google Calendar events:", error);
			throw error;
		}
	}

	// Create event in Google Calendar
	async createEvent(event: Event): Promise<string> {
		if (!this.isSignedIn) {
			throw new Error("User is not signed in to Google Calendar");
		}

		try {
			const googleEvent = this.convertToGoogleEvent(event);
			const response = await gapi.client.calendar.events.insert({
				calendarId: "primary",
				resource: googleEvent,
			});

			return response.result.id;
		} catch (error) {
			console.error("Error creating Google Calendar event:", error);
			throw error;
		}
	}

	// Update event in Google Calendar
	async updateEvent(eventId: string, event: Partial<Event>): Promise<void> {
		if (!this.isSignedIn) {
			throw new Error("User is not signed in to Google Calendar");
		}

		try {
			// First, get the existing event
			const existingEvent = await gapi.client.calendar.events.get({
				calendarId: "primary",
				eventId: eventId,
			});

			// Merge with updates
			const updatedEvent: GoogleCalendarEvent = {
				...existingEvent.result,
				summary: event.title || existingEvent.result.summary,
				description: event.description !== undefined ? event.description : existingEvent.result.description,
			};

			// Update dates if provided
			if (event.start) {
				if (event.allDay) {
					updatedEvent.start = {
						date: new Date(event.start).toISOString().split("T")[0],
					};
				} else {
					updatedEvent.start = {
						dateTime: new Date(event.start).toISOString(),
						timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
					};
				}
			}

			if (event.end) {
				if (event.allDay) {
					updatedEvent.end = {
						date: new Date(event.end).toISOString().split("T")[0],
					};
				} else {
					updatedEvent.end = {
						dateTime: new Date(event.end).toISOString(),
						timeZone: Intl.DateTimeFormat().resolvedOptions().timeZone,
					};
				}
			}

			await gapi.client.calendar.events.update({
				calendarId: "primary",
				eventId: eventId,
				resource: updatedEvent,
			});
		} catch (error) {
			console.error("Error updating Google Calendar event:", error);
			throw error;
		}
	}

	// Delete event from Google Calendar
	async deleteEvent(eventId: string): Promise<void> {
		if (!this.isSignedIn) {
			throw new Error("User is not signed in to Google Calendar");
		}

		try {
			await gapi.client.calendar.events.delete({
				calendarId: "primary",
				eventId: eventId,
			});
		} catch (error) {
			console.error("Error deleting Google Calendar event:", error);
			throw error;
		}
	}

	// Sync events bidirectionally
	async syncEvents(localEvents: Event[]): Promise<{
		created: number;
		updated: number;
		deleted: number;
		imported: EventInput[];
	}> {
		if (!this.isSignedIn) {
			throw new Error("User is not signed in to Google Calendar");
		}

		const stats = {
			created: 0,
			updated: 0,
			deleted: 0,
			imported: [] as EventInput[],
		};

		try {
			// Fetch Google Calendar events
			const googleEvents = await this.fetchEvents();

			// Create maps for efficient lookup
			const localEventMap = new Map<string, Event>();
			const localEventsByTitle = new Map<string, Event>();
			const localEventsWithoutGoogleId: Event[] = [];

			localEvents.forEach((event) => {
				if (event.googleCalendarId) {
					localEventMap.set(event.googleCalendarId, event);
				} else {
					localEventsWithoutGoogleId.push(event);
				}
				// También mapear por título y fecha para evitar duplicados
				// Normalizar la clave para comparación más robusta
				const eventKey = `${event.title}_${new Date(event.start).toISOString()}`.toLowerCase().trim();
				localEventsByTitle.set(eventKey, event);
			});

			// Import events from Google that don't exist locally
			const importedIds = new Set<string>();
			
			for (const googleEvent of googleEvents) {
				// Convertir DateInput a string de manera segura
				const startDate = googleEvent.start ? 
					(typeof googleEvent.start === 'string' ? googleEvent.start : 
					 Array.isArray(googleEvent.start) ? new Date(googleEvent.start[0], googleEvent.start[1] - 1, googleEvent.start[2]).toISOString() :
					 new Date(googleEvent.start).toISOString()) : '';
				
				// Crear clave única más robusta
				const googleEventKey = `${googleEvent.title}_${startDate}`.toLowerCase().trim();
				const googleId = googleEvent.googleCalendarId || googleEvent.id || '';
				
				// Verificar si el evento ya existe por ID o por título+fecha
				const existsByGoogleId = googleId && localEventMap.has(googleId);
				const existsByTitleAndDate = localEventsByTitle.has(googleEventKey);
				const alreadyImportedInThisBatch = importedIds.has(googleId) || importedIds.has(googleEventKey);
				
				if (!existsByGoogleId && !existsByTitleAndDate && !alreadyImportedInThisBatch) {
					stats.imported.push(googleEvent);
					// Marcar como importado para evitar duplicados en el mismo batch
					if (googleId) importedIds.add(googleId);
					importedIds.add(googleEventKey);
				}
			}

			// Create new events in Google Calendar for local events without Google ID
			// Solo crear si no son duplicados
			// Optimizado para grandes volúmenes
			const eventsToCreate = [];
			
			// Crear un Set para búsqueda rápida O(1) en lugar de O(n)
			const googleEventKeys = new Set<string>();
			googleEvents.forEach((gEvent) => {
				const gStartDate = gEvent.start ? 
					(typeof gEvent.start === 'string' ? gEvent.start : 
					 Array.isArray(gEvent.start) ? new Date(gEvent.start[0], gEvent.start[1] - 1, gEvent.start[2]).toISOString() :
					 new Date(gEvent.start).toISOString()) : '';
				const gEventKey = `${gEvent.title}_${gStartDate}`.toLowerCase().trim();
				googleEventKeys.add(gEventKey);
			});
			
			// Filtrar eventos que no existen en Google
			for (const localEvent of localEventsWithoutGoogleId) {
				const eventKey = `${localEvent.title}_${new Date(localEvent.start).toISOString()}`.toLowerCase().trim();
				if (!googleEventKeys.has(eventKey)) {
					eventsToCreate.push(localEvent);
				}
			}
			
			// Si hay muchos eventos, mostrar advertencia
			if (eventsToCreate.length > 100) {
				console.warn(`⚠️ Creando ${eventsToCreate.length} eventos en Google Calendar. Esto puede tomar varios minutos...`);
			}
			
			// Procesar en lotes más grandes pero con delay para evitar rate limits
			const batchSize = 10; // Aumentar tamaño del lote
			const delayBetweenBatches = 1000; // 1 segundo entre lotes
			
			console.log(`Creando ${eventsToCreate.length} eventos en Google Calendar...`);
			
			for (let i = 0; i < eventsToCreate.length; i += batchSize) {
				const batch = eventsToCreate.slice(i, Math.min(i + batchSize, eventsToCreate.length));
				const currentBatch = Math.floor(i / batchSize) + 1;
				const totalBatches = Math.ceil(eventsToCreate.length / batchSize);
				
				console.log(`Procesando lote ${currentBatch}/${totalBatches} (${batch.length} eventos)...`);
				
				// Procesar batch en paralelo
				const promises = batch.map(async (event) => {
					try {
						await this.createEvent(event);
						return true;
					} catch (error: any) {
						// Si es error de cuota, esperar más
						if (error?.message?.includes('quota') || error?.status === 429) {
							console.warn("Límite de API alcanzado, esperando...");
							await new Promise(resolve => setTimeout(resolve, 5000));
							// Reintentar una vez
							try {
								await this.createEvent(event);
								return true;
							} catch (retryError) {
								console.error("Error al reintentar:", retryError);
								return false;
							}
						}
						console.error("Error creating event:", error);
						return false;
					}
				});
				
				const results = await Promise.all(promises);
				stats.created += results.filter(r => r).length;
				
				// Delay entre lotes para evitar rate limits (excepto en el último)
				if (i + batchSize < eventsToCreate.length) {
					await new Promise(resolve => setTimeout(resolve, delayBetweenBatches));
				}
			}

			return stats;
		} catch (error) {
			console.error("Error syncing with Google Calendar:", error);
			throw error;
		}
	}
}

export default new GoogleCalendarService();

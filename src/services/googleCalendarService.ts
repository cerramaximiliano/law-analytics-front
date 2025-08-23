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
	private _isSignedIn = false;
	
	// Getter público para verificar el estado de autenticación
	get isSignedIn(): boolean {
		return this._isSignedIn;
	}

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
						this._isSignedIn = signedIn;
					});

					// Handle initial sign-in state
					this._isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
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
		this._isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
		
		// Verificar que el login fue exitoso
		if (!this._isSignedIn) {
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
		return this._isSignedIn;
	}

	// Intento de reconexión silenciosa
	async signInSilently(): Promise<boolean> {
		try {
			if (!gapi || !gapi.auth2) {
				await this.initClient();
			}

			const auth = gapi.auth2.getAuthInstance();
			if (auth.isSignedIn.get()) {
				this._isSignedIn = true;
				return true;
			}

			// Intentar sign in silencioso
			const user = await auth.signIn({ prompt: 'none' });
			if (user) {
				this._isSignedIn = true;
				return true;
			}

			return false;
		} catch (error) {
			console.log("Sign in silencioso falló (esperado si no hay sesión activa):", error);
			return false;
		}
	}

	// Get user profile
	getUserProfile() {
		// Actualizar el estado primero
		if (gapi && gapi.auth2 && gapi.auth2.getAuthInstance()) {
			this._isSignedIn = gapi.auth2.getAuthInstance().isSignedIn.get();
		}
		
		if (!this._isSignedIn) {
			return null;
		}
		
		try {
			const currentUser = gapi.auth2.getAuthInstance().currentUser.get();
			const profile = currentUser.getBasicProfile();
			
			if (!profile) {
				console.warn("Profile not available yet");
				return null;
			}
			
			// Obtener la URL de la imagen y procesarla
			let imageUrl = profile.getImageUrl();
			
			// Si la URL tiene parámetros, intentar obtener una versión sin restricciones
			if (imageUrl) {
				// Remover el parámetro s96-c si existe y reemplazar con s400 para mejor calidad
				imageUrl = imageUrl.replace(/=s\d+-c/, '=s400-c');
				// Agregar parámetro para evitar restricciones
				if (!imageUrl.includes('?')) {
					imageUrl += '?sz=400';
				}
			}
			
			return {
				id: profile.getId(),
				name: profile.getName(),
				email: profile.getEmail(),
				imageUrl: imageUrl,
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
			// Para eventos de todo el día, necesitamos enviar la fecha en formato YYYY-MM-DD
			// Las fechas vienen de la BD con offset (ej: 2025-08-29T03:00:00.000Z para Argentina)
			// Necesitamos extraer la fecha UTC y ajustarla a la zona local
			const startDate = new Date(event.start);
			const endDate = new Date(event.end || event.start);
			
			// Ajustar las fechas considerando el offset de zona horaria
			// Si la fecha tiene offset (ej: T03:00:00), significa que ya está ajustada
			// y debemos usar la fecha UTC directamente
			const formatDateForGoogle = (date: Date) => {
				// Obtener componentes UTC
				const year = date.getUTCFullYear();
				const month = date.getUTCMonth() + 1;
				const day = date.getUTCDate();
				const hours = date.getUTCHours();
				
				// Si las horas UTC no son 0, significa que la fecha tiene offset de zona horaria
				// En ese caso, usamos la fecha UTC directamente
				if (hours !== 0) {
					// La fecha ya está ajustada (ej: 03:00 UTC = 00:00 Argentina)
					return `${year}-${String(month).padStart(2, '0')}-${String(day).padStart(2, '0')}`;
				} else {
					// La fecha está en UTC puro, usar fecha local
					const localYear = date.getFullYear();
					const localMonth = date.getMonth() + 1;
					const localDay = date.getDate();
					return `${localYear}-${String(localMonth).padStart(2, '0')}-${String(localDay).padStart(2, '0')}`;
				}
			};
			
			googleEvent.start = {
				date: formatDateForGoogle(startDate),
			};
			googleEvent.end = {
				date: formatDateForGoogle(endDate),
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
			// All-day event - Ajustar a zona horaria local
			// Google envía fechas como YYYY-MM-DD (ej: "2025-08-14")
			// Necesitamos convertirlas para que se guarden correctamente en la BD
			
			// Crear las fechas en la zona horaria local (00:00 hora local)
			const [startYear, startMonth, startDay] = googleEvent.start.date.split('-').map(Number);
			const [endYear, endMonth, endDay] = googleEvent.end.date.split('-').map(Number);
			
			// Crear fechas en hora local (00:00)
			const startDate = new Date(startYear, startMonth - 1, startDay, 0, 0, 0);
			const endDate = new Date(endYear, endMonth - 1, endDay, 0, 0, 0);
			
			// Convertir a ISO string (esto mantendrá el offset correcto)
			event.start = startDate.toISOString();
			event.end = endDate.toISOString();
			event.allDay = true;
			
			// Debug para verificar la conversión
			console.log(`Evento todo el día convertido: ${googleEvent.summary}`);
			console.log(`  Google date: ${googleEvent.start.date} -> ISO: ${event.start}`);
			console.log(`  Timezone offset: ${new Date().getTimezoneOffset()} minutos`);
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
		if (!this._isSignedIn) {
			throw new Error("User is not signed in to Google Calendar");
		}

		try {
			// Si no se especifica timeMin, obtener eventos desde hace 1 año
			const defaultTimeMin = new Date();
			defaultTimeMin.setFullYear(defaultTimeMin.getFullYear() - 1);
			
			// Si no se especifica timeMax, obtener eventos hasta dentro de 2 años
			const defaultTimeMax = new Date();
			defaultTimeMax.setFullYear(defaultTimeMax.getFullYear() + 2);
			
			const response = await gapi.client.calendar.events.list({
				calendarId: "primary",
				timeMin: timeMin ? timeMin.toISOString() : defaultTimeMin.toISOString(),
				timeMax: timeMax ? timeMax.toISOString() : defaultTimeMax.toISOString(),
				showDeleted: false,
				singleEvents: true,
				maxResults: 2500, // Aumentar el límite para traer más eventos
				orderBy: "startTime",
			});

			const events = response.result.items || [];
			console.log(`📅 Eventos obtenidos de Google Calendar: ${events.length}`, {
				desde: timeMin ? timeMin.toISOString() : defaultTimeMin.toISOString(),
				hasta: timeMax ? timeMax.toISOString() : defaultTimeMax.toISOString()
			});
			return events.map((event: any) => this.convertFromGoogleEvent(event));
		} catch (error) {
			console.error("Error fetching Google Calendar events:", error);
			throw error;
		}
	}

	// Create event in Google Calendar
	async createEvent(event: Event): Promise<string> {
		if (!this._isSignedIn) {
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
		if (!this._isSignedIn) {
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
		if (!this._isSignedIn) {
			throw new Error("User is not signed in to Google Calendar");
		}

		try {
			await gapi.client.calendar.events.delete({
				calendarId: "primary",
				eventId: eventId,
			});
		} catch (error: any) {
			// Si el error es 404 o 410, el evento ya no existe en Google
			if (error?.status === 404 || error?.status === 410) {
				console.log("ℹ️ El evento ya no existe en Google Calendar, continuando...");
				return; // No lanzar error si el evento ya no existe
			}
			
			console.error("❌ Error eliminando evento de Google Calendar:", {
				status: error?.status,
				message: error?.message || error?.result?.error?.message
			});
			
			throw error;
		}
	}

	// Helper para crear un hash único de un evento para evitar duplicados
	private createEventHash(event: Event | EventInput): string {
		const normalizedTitle = (event.title || '').toLowerCase().trim().replace(/\s+/g, ' ');
		const startDate = new Date(event.start);
		// Usar solo fecha y hora (sin milisegundos) para evitar diferencias mínimas
		const dateKey = `${startDate.getFullYear()}-${startDate.getMonth()}-${startDate.getDate()}-${startDate.getHours()}-${startDate.getMinutes()}`;
		const eventType = (event as Event).type || 'default';
		
		return `${normalizedTitle}_${dateKey}_${eventType}`;
	}

	// Buscar un evento en Google Calendar por título y fecha (para eventos huérfanos)
	async findGoogleEventByTitleAndDate(title: string, startDate: Date): Promise<string | null> {
		if (!this._isSignedIn) {
			console.error("Usuario no autenticado en Google Calendar");
			return null;
		}

		try {
			// Crear ventana de tiempo para buscar (día del evento)
			const timeMin = new Date(startDate);
			timeMin.setHours(0, 0, 0, 0);
			
			const timeMax = new Date(startDate);
			timeMax.setHours(23, 59, 59, 999);

			const response = await gapi.client.calendar.events.list({
				calendarId: "primary",
				timeMin: timeMin.toISOString(),
				timeMax: timeMax.toISOString(),
				singleEvents: true,
				orderBy: "startTime",
			});

			const events = response.result.items || [];
			
			// Buscar evento con título similar
			const normalizedSearchTitle = title.toLowerCase().trim();
			const foundEvent = events.find((event: any) => {
				const eventTitle = (event.summary || '').toLowerCase().trim();
				return eventTitle === normalizedSearchTitle;
			});

			if (foundEvent) {
				console.log(`✅ Evento encontrado en Google Calendar: ${foundEvent.id}`);
				return foundEvent.id;
			}

			return null;
		} catch (error) {
			console.error("Error buscando evento en Google Calendar:", error);
			return null;
		}
	}

	// Sync events bidirectionally
	async syncEvents(localEvents: Event[]): Promise<{
		created: number;
		updated: number;
		deleted: number;
		imported: EventInput[];
	}> {
		if (!this._isSignedIn) {
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
			
			console.log(`📊 Sincronización iniciada:`, {
				eventosGoogle: googleEvents.length,
				eventosLocales: localEvents.length
			});

			// Create maps for efficient lookup
			const localEventMap = new Map<string, Event>();
			const localEventsByHash = new Map<string, Event>();
			const localEventsWithoutGoogleId: Event[] = [];

			localEvents.forEach((event) => {
				if (event.googleCalendarId) {
					localEventMap.set(event.googleCalendarId, event);
				} else {
					localEventsWithoutGoogleId.push(event);
				}
				// Usar el hash robusto para evitar duplicados REALES (mismo título Y fecha)
				const eventHash = this.createEventHash(event);
				localEventsByHash.set(eventHash, event);
			});

			// Import events from Google that don't exist locally
			const importedIds = new Set<string>();
			
			const skippedEvents: any[] = [];
			
			for (const googleEvent of googleEvents) {
				// Usar el hash robusto para comparación
				const googleEventHash = this.createEventHash(googleEvent);
				const googleId = googleEvent.googleCalendarId || googleEvent.id || '';
				
				// Verificar si el evento ya existe SOLO por su ID único de Google
				// NO verificar por hash para permitir eventos con mismo título en diferentes fechas
				const existsByGoogleId = googleId && localEventMap.has(googleId);
				const alreadyImportedInThisBatch = importedIds.has(googleId);
				
				// Verificar por hash SOLO si queremos evitar duplicados exactos (mismo título Y fecha)
				// Por ahora, comentado para permitir importar todos los eventos
				// const existsByHash = localEventsByHash.has(googleEventHash);
				
				if (!existsByGoogleId && !alreadyImportedInThisBatch) {
					stats.imported.push(googleEvent);
					// Marcar como importado para evitar duplicados SOLO por ID, no por hash
					// Esto permite importar eventos con mismo título pero diferente fecha
					if (googleId) importedIds.add(googleId);
				} else {
					// Log para depuración
					skippedEvents.push({
						title: googleEvent.title,
						start: googleEvent.start,
						googleId,
						reason: existsByGoogleId ? 'Ya existe localmente' : 'Ya importado en este batch'
					});
				}
			}
			
			if (skippedEvents.length > 0) {
				console.log(`⚠️ Eventos de Google no importados (${skippedEvents.length}):`, skippedEvents);
			}

			// Create new events in Google Calendar for local events without Google ID
			// Solo crear si no son duplicados
			// Optimizado para grandes volúmenes
			const eventsToCreate = [];
			
			// Crear un Set para búsqueda rápida O(1) en lugar de O(n)
			const googleEventKeys = new Set<string>();
			const processedLocalEvents = new Set<string>();
			
			googleEvents.forEach((gEvent) => {
				const hash = this.createEventHash(gEvent);
				googleEventKeys.add(hash);
			});
			
			// Filtrar eventos que no existen en Google y evitar duplicados
			for (const localEvent of localEventsWithoutGoogleId) {
				const eventHash = this.createEventHash(localEvent);
				// Solo crear si no existe en Google Y no lo hemos procesado ya
				if (!googleEventKeys.has(eventHash) && !processedLocalEvents.has(eventHash)) {
					eventsToCreate.push(localEvent);
					processedLocalEvents.add(eventHash);
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
						const googleEventId = await this.createEvent(event);
						
						// Actualizar el evento en la BD con el googleCalendarId
						if (event._id && googleEventId) {
							try {
								// Usar axios en lugar de fetch para evitar problemas con extensiones
								const axios = (window as any).axios || await import('axios').then(m => m.default);
								const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';
								const updateUrl = `${baseUrl}/api/events/${event._id}/google-id`;
								
								console.log(`📝 Actualizando evento ${event._id} con googleCalendarId: ${googleEventId}`);
								
								const response = await axios.patch(
									updateUrl,
									{ googleCalendarId: googleEventId },
									{
										headers: {
											'Content-Type': 'application/json',
											'Authorization': `Bearer ${localStorage.getItem('token')}`
										}
									}
								);
								
								if (response.data?.success) {
									console.log(`✅ Evento ${event._id} actualizado con googleCalendarId: ${googleEventId}`);
								}
							} catch (updateError: any) {
								// Solo loguear error si no es de red (podría ser extensión del navegador)
								if (updateError?.code !== 'ERR_NETWORK') {
									console.error("Error actualizando googleCalendarId:", updateError?.message);
								}
							}
						}
						
						return true;
					} catch (error: any) {
						// Si es error de cuota, esperar más
						if (error?.message?.includes('quota') || error?.status === 429) {
							console.warn("Límite de API alcanzado, esperando...");
							await new Promise(resolve => setTimeout(resolve, 5000));
							// Reintentar una vez
							try {
								const googleEventId = await this.createEvent(event);
								
								// Actualizar el evento en la BD con el googleCalendarId
								if (event._id && googleEventId) {
									try {
										// Usar axios en lugar de fetch
										const axios = (window as any).axios || await import('axios').then(m => m.default);
										const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';
										const updateUrl = `${baseUrl}/api/events/${event._id}/google-id`;
										
										console.log(`📝 [Reintento] Actualizando evento ${event._id} con googleCalendarId: ${googleEventId}`);
										
										const response = await axios.patch(
											updateUrl,
											{ googleCalendarId: googleEventId },
											{
												headers: {
													'Content-Type': 'application/json',
													'Authorization': `Bearer ${localStorage.getItem('token')}`
												}
											}
										);
										
										if (response.data?.success) {
											console.log(`✅ [Reintento] Evento ${event._id} actualizado con googleCalendarId`);
										}
									} catch (updateError: any) {
										if (updateError?.code !== 'ERR_NETWORK') {
											console.error("[Reintento] Error actualizando googleCalendarId:", updateError?.message);
										}
									}
								}
								
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

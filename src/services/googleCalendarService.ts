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
				} catch (error) {
					console.error("Error initializing Google Calendar API:", error);
					reject(error);
				}
			});
		});
	}

	// Sign in to Google
	async signIn(): Promise<void> {
		if (!this.isInitialized) {
			await this.init();
		}
		return gapi.auth2.getAuthInstance().signIn();
	}

	// Sign out from Google
	async signOut(): Promise<void> {
		if (!this.isInitialized) {
			return;
		}
		return gapi.auth2.getAuthInstance().signOut();
	}

	// Check if user is signed in
	isUserSignedIn(): boolean {
		return this.isSignedIn;
	}

	// Get user profile
	getUserProfile() {
		if (!this.isSignedIn) {
			return null;
		}
		const profile = gapi.auth2.getAuthInstance().currentUser.get().getBasicProfile();
		return {
			id: profile.getId(),
			name: profile.getName(),
			email: profile.getEmail(),
			imageUrl: profile.getImageUrl(),
		};
	}

	// Convert local event to Google Calendar format
	private convertToGoogleEvent(event: Event): GoogleCalendarEvent {
		const googleEvent: GoogleCalendarEvent = {
			summary: event.title,
			description: event.description || "",
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
			const googleEventIds = new Set(googleEvents.map((e) => e.googleCalendarId));

			// Create a map of local events by their Google Calendar ID
			const localEventMap = new Map<string, Event>();
			const localEventsWithoutGoogleId: Event[] = [];

			localEvents.forEach((event) => {
				if (event.googleCalendarId) {
					localEventMap.set(event.googleCalendarId, event);
				} else {
					localEventsWithoutGoogleId.push(event);
				}
			});

			// Import events from Google that don't exist locally
			for (const googleEvent of googleEvents) {
				if (!localEventMap.has(googleEvent.googleCalendarId!)) {
					stats.imported.push(googleEvent);
				}
			}

			// Create new events in Google Calendar for local events without Google ID
			for (const localEvent of localEventsWithoutGoogleId) {
				try {
					const googleId = await this.createEvent(localEvent);
					stats.created++;
					// You would update the local event with the Google ID here
				} catch (error) {
					console.error("Error creating event in Google Calendar:", error);
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
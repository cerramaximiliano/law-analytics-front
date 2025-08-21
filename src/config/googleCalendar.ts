// Google Calendar API Configuration
export const GOOGLE_CALENDAR_CONFIG = {
	CLIENT_ID: process.env.REACT_APP_AUTH0_GOOGLE_ID || "", // Usar el mismo Client ID de Auth0
	API_KEY: process.env.REACT_APP_GOOGLE_API_KEY || "",
	DISCOVERY_DOCS: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
	// IMPORTANTE: Si en Google Cloud Console tienes calendar.acls.readonly, cámbialo a calendar.readonly
	// calendar.readonly: permite leer eventos (necesario para sincronización)
	// calendar.acls.readonly: solo lee permisos (NO sirve para sincronizar eventos)
	SCOPES: "https://www.googleapis.com/auth/calendar.events https://www.googleapis.com/auth/calendar.readonly",
};

// Event color mapping for Google Calendar
export const GOOGLE_CALENDAR_COLORS = {
	primary: "1", // Blue
	success: "10", // Green
	warning: "5", // Yellow
	error: "11", // Red
	info: "9", // Deep Blue
	secondary: "8", // Gray
};

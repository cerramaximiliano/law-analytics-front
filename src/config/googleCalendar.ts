// Google Calendar API Configuration
export const GOOGLE_CALENDAR_CONFIG = {
	CLIENT_ID: process.env.REACT_APP_GOOGLE_CLIENT_ID || "",
	API_KEY: process.env.REACT_APP_GOOGLE_API_KEY || "",
	DISCOVERY_DOCS: ["https://www.googleapis.com/discovery/v1/apis/calendar/v3/rest"],
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
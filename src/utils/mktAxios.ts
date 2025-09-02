import axios from "axios";
import Cookies from "js-cookie";
import authTokenService from "services/authTokenService";

// Create a dedicated axios instance for MKT API
const mktAxios = axios.create({
	baseURL: import.meta.env.VITE_MKT_URL || "https://mkt.lawanalytics.app",
	withCredentials: true,
});

// Helper function to get auth token
const getAuthToken = () => {
	// First try to get token from authTokenService (if captured from responses)
	const serviceToken = authTokenService.getToken();
	if (serviceToken) {
		return serviceToken;
	}

	// Then try to get token from different possible cookie names
	const token =
		Cookies.get("authToken") ||
		Cookies.get("auth_token") ||
		Cookies.get("auth_token_temp") ||
		Cookies.get("token") ||
		Cookies.get("access_token") ||
		Cookies.get("jwt") ||
		Cookies.get("session");

	// If no token in cookies, check if we can get it from document.cookie directly
	if (!token) {
		const cookies = document.cookie.split(";");
		for (const cookie of cookies) {
			const [name, value] = cookie.trim().split("=");
			if (["authToken", "auth_token", "token", "jwt", "session"].includes(name)) {
				return decodeURIComponent(value);
			}
		}
	}

	return token;
};

// Request interceptor to ensure credentials are included
mktAxios.interceptors.request.use(
	(config) => {
		// Ensure credentials are included in all requests
		config.withCredentials = true;

		// Debug: Log available cookies (remove in production)
		if (process.env.NODE_ENV === "development") {
			console.log("Available cookies:", document.cookie);
			console.log("All cookie names:", Object.keys(Cookies.get()));
		}

		// Add Authorization header if token exists
		const token = getAuthToken();
		if (token) {
			config.headers.Authorization = `Bearer ${token}`;
			console.log("Token found and added to MKT API request");
		} else {
			console.warn("No auth token found for MKT API request");
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// Response interceptor for handling authentication errors
mktAxios.interceptors.response.use(
	(response) => response,
	async (error) => {
		const originalRequest = error.config;

		// Handle 401 errors for MKT API
		if (error.response?.status === 401 && !originalRequest._retry) {
			originalRequest._retry = true;

			try {
				// Try to refresh the token
				await axios.post(`${import.meta.env.VITE_BASE_URL}/api/auth/refresh-token`, {}, { withCredentials: true });

				// Get the new token and retry the request
				const newToken = getAuthToken();
				if (newToken) {
					originalRequest.headers.Authorization = `Bearer ${newToken}`;
				}

				// Retry the original request with updated headers
				return mktAxios(originalRequest);
			} catch (refreshError) {
				// If refresh fails, redirect to login
				if (!window.location.href.includes("/login")) {
					window.location.pathname = "/login";
				}
				return Promise.reject(refreshError);
			}
		}

		return Promise.reject(error);
	},
);

export default mktAxios;

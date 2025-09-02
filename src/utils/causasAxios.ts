import axios, { AxiosInstance, InternalAxiosRequestConfig, AxiosResponse } from "axios";
import Cookies from "js-cookie";
import authTokenService from "../services/authTokenService";
import secureStorage from "../services/secureStorage";

const causasAxios: AxiosInstance = axios.create({
	baseURL: import.meta.env.VITE_CAUSAS_URL || "https://api.lawanalytics.app",
	timeout: 30000,
	headers: {
		"Content-Type": "application/json",
	},
	withCredentials: false, // No necesitamos cookies, usamos Authorization header
});

// Helper function to get auth token
const getAuthToken = () => {
	console.log("Getting auth token for causas API...");

	// First try to get token from secureStorage (this is the primary method)
	const secureToken = secureStorage.getAuthToken();
	if (secureToken) {
		console.log("Token found in secureStorage");
		return secureToken;
	}

	// Then try authTokenService
	const serviceToken = authTokenService.getToken();
	if (serviceToken) {
		console.log("Token found in authTokenService");
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

	if (token) {
		console.log("Token found in cookies");
		return token;
	}

	// If no token in cookies, check if we can get it from document.cookie directly
	const cookies = document.cookie.split(";");
	for (const cookie of cookies) {
		const [name, value] = cookie.trim().split("=");
		if (["authToken", "auth_token", "auth_token_temp", "token", "jwt", "session"].includes(name)) {
			console.log(`Token found in document.cookie as ${name}`);
			return decodeURIComponent(value);
		}
	}

	// Also check localStorage and sessionStorage
	const localToken =
		localStorage.getItem("token") || localStorage.getItem("authToken") || localStorage.getItem("auth_token") || localStorage.getItem("jwt");
	if (localToken) {
		console.log("Token found in localStorage");
		return localToken;
	}

	const sessionToken =
		sessionStorage.getItem("token") ||
		sessionStorage.getItem("authToken") ||
		sessionStorage.getItem("auth_token") ||
		sessionStorage.getItem("jwt");
	if (sessionToken) {
		console.log("Token found in sessionStorage");
		return sessionToken;
	}

	console.log("No token found in any location");
	return null;
};

// Request interceptor to add auth token
causasAxios.interceptors.request.use(
	(config: InternalAxiosRequestConfig) => {
		// Get token and add it to Authorization header
		const token = getAuthToken();

		if (token && config.headers) {
			// El backend ahora acepta el token en el header Authorization
			config.headers.Authorization = `Bearer ${token}`;
			console.log("Causas API - Token added to Authorization header");
		} else {
			console.warn("Causas API - No auth token found");
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

// Response interceptor for error handling
causasAxios.interceptors.response.use(
	(response: AxiosResponse) => response,
	(error) => {
		// Check if this is a status check request (by checking the URL)
		const isStatusCheck = error.config?.url?.includes("/api/causas/verified") && error.config?.method === "get";

		if (error.response?.status === 401 && !isStatusCheck) {
			// Only redirect if it's not a status check
			window.location.href = "/login";
		}
		return Promise.reject(error);
	},
);

export default causasAxios;

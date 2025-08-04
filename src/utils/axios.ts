import axios from "axios";
import Cookies from "js-cookie";
import authTokenService from "services/authTokenService";
import secureStorage from "services/secureStorage";

const axiosServices = axios.create({
	baseURL: process.env.REACT_APP_API_URL || "http://localhost:3010/",
});

// Helper function to get auth token
const getAuthToken = () => {
	// First try to get token from authTokenService (if captured from responses)
	const serviceToken = authTokenService.getToken();
	if (serviceToken) {
		return serviceToken;
	}

	// Then try secureStorage (for persistence across sessions)
	const storageToken = secureStorage.getAuthToken();
	if (storageToken) {
		return storageToken;
	}

	// Finally try cookies
	const cookieToken = Cookies.get("authToken") || Cookies.get("token");
	if (cookieToken) {
		return cookieToken;
	}

	return null;
};

// ==============================|| AXIOS - FOR MOCK SERVICES ||============================== //

// Request interceptor to add auth token
axiosServices.interceptors.request.use(
	(config) => {
		// Get auth token
		const token = getAuthToken();

		// Add token to header if available
		if (token && !config.headers.Authorization) {
			config.headers.Authorization = `Bearer ${token}`;
		}

		return config;
	},
	(error) => {
		return Promise.reject(error);
	},
);

axiosServices.interceptors.response.use(
	(response) => response,
	(error) => {
		if (error.response?.status === 401 && !window.location.href.includes("/login")) {
			window.location.pathname = "/login";
		}

		// Return the full error object to preserve status codes and allow specific handling
		return Promise.reject(error);
	},
);

export default axiosServices;

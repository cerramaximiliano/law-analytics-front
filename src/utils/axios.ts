import axios from "axios";

const axiosServices = axios.create({
	baseURL: process.env.REACT_APP_API_URL || "http://localhost:3010/",
});

// ==============================|| AXIOS - FOR MOCK SERVICES ||============================== //

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

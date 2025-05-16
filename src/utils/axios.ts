import axios from "axios";

const axiosServices = axios.create({
	baseURL: process.env.REACT_APP_API_URL || "http://localhost:3010/",
});

// ==============================|| AXIOS - FOR MOCK SERVICES ||============================== //

axiosServices.interceptors.response.use(
	(response) => response,
	(error) => {
		// Don't redirect for marketing API calls
		const isMktAPI = error.config?.baseURL?.includes("mkt.lawanalytics.app") || error.config?.url?.includes("mkt.lawanalytics.app");

		if (error.response?.status === 401 && !window.location.href.includes("/login") && !isMktAPI) {
			window.location.pathname = "/login";
		}
		return Promise.reject((error.response && error.response.data) || "Wrong Services");
	},
);

export default axiosServices;

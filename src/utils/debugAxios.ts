import axios from "axios";

// Create a debugging axios instance that logs everything
const debugAxios = axios.create({
	baseURL: process.env.REACT_APP_MKT_URL || "https://mkt.lawanalytics.app",
	withCredentials: true,
});

// Add comprehensive logging
debugAxios.interceptors.request.use(
	(config: any) => {
		console.group(`📤 Request: ${config.method?.toUpperCase()} ${config.url}`);
		console.log("Full URL:", config.baseURL + config.url);
		console.log("Headers:", config.headers);
		console.log("Params:", config.params);
		console.log("Data:", config.data);
		console.log("With Credentials:", config.withCredentials);
		console.groupEnd();
		return config;
	},
	(error: any) => {
		console.error("❌ Request Error:", error);
		return Promise.reject(error);
	},
);

debugAxios.interceptors.response.use(
	(response: any) => {
		console.group(`📥 Response: ${response.config.method?.toUpperCase()} ${response.config.url}`);
		console.log("Status:", response.status);
		console.log("Headers:", response.headers);
		console.log("Data:", response.data);
		console.groupEnd();
		return response;
	},
	(error: any) => {
		console.group(`❌ Response Error: ${error.config?.method?.toUpperCase()} ${error.config?.url}`);
		console.log("Status:", error.response?.status);
		console.log("Response Data:", error.response?.data);
		console.log("Headers:", error.response?.headers);
		console.error("Full Error:", error);
		console.groupEnd();
		return Promise.reject(error);
	},
);

export default debugAxios;

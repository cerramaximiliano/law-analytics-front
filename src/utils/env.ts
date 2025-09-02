// Helper para migración gradual de variables de entorno de CRA a Vite

const getEnvVar = (craName: string, viteName: string): string | undefined => {
	// Primero intenta con Vite
	if (typeof import.meta !== "undefined" && import.meta.env && import.meta.env[viteName]) {
		return import.meta.env[viteName];
	}
	// Fallback a process.env para compatibilidad
	if (typeof process !== "undefined" && process.env && process.env[craName]) {
		return process.env[craName];
	}
	return undefined;
};

export const env = {
	AUTH0_GOOGLE_ID: getEnvVar("REACT_APP_AUTH0_GOOGLE_ID", "VITE_AUTH0_GOOGLE_ID"),
	GOOGLE_API_KEY: getEnvVar("REACT_APP_GOOGLE_API_KEY", "VITE_GOOGLE_API_KEY"),
	BASE_URL: getEnvVar("REACT_APP_BASE_URL", "VITE_BASE_URL"),
	WS_URL: getEnvVar("REACT_APP_WS_URL", "VITE_WS_URL"),
	MKT_URL: getEnvVar("REACT_APP_MKT_URL", "VITE_MKT_URL"),
	CAUSAS_URL: getEnvVar("REACT_APP_CAUSAS_URL", "VITE_CAUSAS_URL"),
	DEV_EMAIL: getEnvVar("REACT_APP_DEV_EMAIL", "VITE_DEV_EMAIL"),
	DEV_PASSWORD: getEnvVar("REACT_APP_DEV_PASSWORD", "VITE_DEV_PASSWORD"),
	MAINTENANCE_MODE: getEnvVar("REACT_APP_MAINTENANCE_MODE", "VITE_MAINTENANCE_MODE"),
	BASE_NAME: getEnvVar("REACT_APP_BASE_NAME", "VITE_BASE_NAME"),
};

// Para compatibilidad con código existente que usa process.env directamente
if (typeof window !== "undefined") {
	window.process = window.process || { env: {} };
	window.process.env = {
		...window.process.env,
		REACT_APP_AUTH0_GOOGLE_ID: env.AUTH0_GOOGLE_ID,
		REACT_APP_GOOGLE_API_KEY: env.GOOGLE_API_KEY,
		REACT_APP_BASE_URL: env.BASE_URL,
		REACT_APP_WS_URL: env.WS_URL,
		REACT_APP_MKT_URL: env.MKT_URL,
		REACT_APP_CAUSAS_URL: env.CAUSAS_URL,
		REACT_APP_DEV_EMAIL: env.DEV_EMAIL,
		REACT_APP_DEV_PASSWORD: env.DEV_PASSWORD,
		REACT_APP_MAINTENANCE_MODE: env.MAINTENANCE_MODE,
		REACT_APP_BASE_NAME: env.BASE_NAME,
	};
}

/// <reference types="vite/client" />

interface ImportMetaEnv {
	readonly VITE_AUTH0_GOOGLE_ID: string;
	readonly VITE_GOOGLE_API_KEY: string;
	readonly VITE_BASE_URL: string;
	readonly VITE_WS_URL: string;
	readonly VITE_MKT_URL: string;
	readonly VITE_CAUSAS_URL: string;
	readonly VITE_DEV_EMAIL: string;
	readonly VITE_DEV_PASSWORD: string;
	readonly VITE_MAINTENANCE_MODE: string;
	readonly VITE_BASE_NAME?: string;
}

interface ImportMeta {
	readonly env: ImportMetaEnv;
}

// Para compatibilidad con el código existente
declare global {
	interface Window {
		process: {
			env: {
				REACT_APP_AUTH0_GOOGLE_ID?: string;
				REACT_APP_GOOGLE_API_KEY?: string;
				REACT_APP_BASE_URL?: string;
				REACT_APP_WS_URL?: string;
				REACT_APP_MKT_URL?: string;
				REACT_APP_CAUSAS_URL?: string;
				REACT_APP_DEV_EMAIL?: string;
				REACT_APP_DEV_PASSWORD?: string;
				REACT_APP_MAINTENANCE_MODE?: string;
				REACT_APP_BASE_NAME?: string;
			};
		};
	}
}

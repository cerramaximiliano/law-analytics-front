// Estado del portal del PJN (compartido por todos los usuarios).
//
// El valor canónico vive en ManagerConfig.pjnSiteStatus (en Mongo,
// escrito por los workers de scraping). El slice se hidrata vía REST al
// bootear la app (GET /api/pjn-site-status) y se actualiza en tiempo
// real cuando llega un evento socket `system_status` con
// type='PJN_SITE_STATUS' (broadcast por la-notification cuando los
// workers reportan transición).
//
// Componentes que consumen este slice:
// - <PjnMaintenanceAlert /> banner contextual en páginas que requieren PJN
// - <PjnGuardedButton /> wrapper que deshabilita acciones de sync
// - Modales de "Nueva causa PJN" / "Vincular causa PJN" / sync por credenciales

import axios from "axios";
import { Dispatch } from "redux";

export type PjnSiteStatusValue = "healthy" | "maintenance" | "unknown";

export interface PjnSiteStatusState {
	status: PjnSiteStatusValue;
	message: string | null;
	maintenanceSince: string | null;
	lastDetectedAt: string | null;
	lastDetectedBy: string | null;
	lastHealthyAt: string | null;
	consecutiveDetections: number;
	// Metadatos del cliente
	lastUpdatedAt: string | null;       // cuándo se actualizó el slice
	hydrated: boolean;                  // true tras la primera carga REST exitosa
	loading: boolean;
	error: string | null;
}

// Action types
export const PJN_SITE_STATUS_LOADING = "pjnSiteStatus/LOADING";
export const PJN_SITE_STATUS_LOADED = "pjnSiteStatus/LOADED";
export const PJN_SITE_STATUS_ERROR = "pjnSiteStatus/ERROR";
export const PJN_SITE_STATUS_UPDATED = "pjnSiteStatus/UPDATED";
export const PJN_SITE_STATUS_RESET = "pjnSiteStatus/RESET";

const initialState: PjnSiteStatusState = {
	status: "unknown",
	message: null,
	maintenanceSince: null,
	lastDetectedAt: null,
	lastDetectedBy: null,
	lastHealthyAt: null,
	consecutiveDetections: 0,
	lastUpdatedAt: null,
	hydrated: false,
	loading: false,
	error: null,
};

// ---------- Action creators ----------

export const pjnSiteStatusLoading = () => ({
	type: PJN_SITE_STATUS_LOADING as typeof PJN_SITE_STATUS_LOADING,
});

export const pjnSiteStatusLoaded = (payload: Partial<PjnSiteStatusState>) => ({
	type: PJN_SITE_STATUS_LOADED as typeof PJN_SITE_STATUS_LOADED,
	payload,
});

export const pjnSiteStatusError = (message: string) => ({
	type: PJN_SITE_STATUS_ERROR as typeof PJN_SITE_STATUS_ERROR,
	payload: { message },
});

export const pjnSiteStatusUpdated = (payload: Partial<PjnSiteStatusState>) => ({
	type: PJN_SITE_STATUS_UPDATED as typeof PJN_SITE_STATUS_UPDATED,
	payload,
});

export const pjnSiteStatusReset = () => ({
	type: PJN_SITE_STATUS_RESET as typeof PJN_SITE_STATUS_RESET,
});

// ---------- Thunk: hidratación inicial ----------

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

/**
 * Trae el estado actual del portal del PJN desde el server.
 * Se llama una vez al bootear la app autenticada. Después, los cambios
 * llegan por socket (system_status / PJN_SITE_STATUS).
 */
export const fetchPjnSiteStatus = () => async (dispatch: Dispatch) => {
	dispatch(pjnSiteStatusLoading());
	try {
		const res = await axios.get(`${API_BASE_URL}/api/pjn-site-status`, {
			withCredentials: true,
		});
		const data = res.data?.data || {};
		dispatch(pjnSiteStatusLoaded(data));
	} catch (err: any) {
		dispatch(pjnSiteStatusError(err?.message || "Error consultando estado PJN"));
	}
};

// ---------- Reducer ----------

const pjnSiteStatusReducer = (state = initialState, action: any): PjnSiteStatusState => {
	switch (action.type) {
		case PJN_SITE_STATUS_LOADING:
			return { ...state, loading: true, error: null };

		case PJN_SITE_STATUS_LOADED: {
			const p = action.payload || {};
			return {
				...state,
				status: p.status ?? "unknown",
				message: p.message ?? null,
				maintenanceSince: p.maintenanceSince ?? null,
				lastDetectedAt: p.lastDetectedAt ?? null,
				lastDetectedBy: p.lastDetectedBy ?? null,
				lastHealthyAt: p.lastHealthyAt ?? null,
				consecutiveDetections: p.consecutiveDetections ?? 0,
				lastUpdatedAt: new Date().toISOString(),
				hydrated: true,
				loading: false,
				error: null,
			};
		}

		case PJN_SITE_STATUS_UPDATED: {
			// Evento socket: merge incremental. No tocamos hydrated (sigue siendo true
			// si ya estaba) ni loading.
			const p = action.payload || {};
			return {
				...state,
				...p,
				lastUpdatedAt: new Date().toISOString(),
			};
		}

		case PJN_SITE_STATUS_ERROR:
			return {
				...state,
				loading: false,
				error: action.payload?.message ?? "Error desconocido",
			};

		case PJN_SITE_STATUS_RESET:
			return initialState;

		default:
			return state;
	}
};

// ---------- Selectores helpers (sin reselect para mantener simple) ----------

export const selectIsPjnInMaintenance = (state: { pjnSiteStatus: PjnSiteStatusState }): boolean =>
	state.pjnSiteStatus.status === "maintenance";

export const selectPjnSiteStatus = (state: { pjnSiteStatus: PjnSiteStatusState }): PjnSiteStatusState =>
	state.pjnSiteStatus;

export default pjnSiteStatusReducer;

// Estado del portal SCBA (compartido por todos los usuarios).
//
// El valor canónico vive en la colección scba-system-state (doc
// portal-health) escrito por scba-workers. El slice se hidrata vía REST
// al bootear la app (GET /api/scba-site-status) y se actualiza en tiempo
// real cuando llega un evento socket `system_status` con
// type='SCBA_SITE_STATUS' (broadcast por la-notification cuando los
// workers reportan transición healthy↔down).
//
// Componentes que consumen este slice:
// - <ScbaMaintenanceAlert /> banner contextual en páginas que requieren SCBA
// - ScbaAccountConnect — deshabilita submit cuando isDown

import axios from "axios";
import { Dispatch } from "redux";

export type ScbaSiteStatusValue = "healthy" | "down" | "unknown";

export interface ScbaSiteStatusState {
	status: ScbaSiteStatusValue;
	message: string | null;
	lastTransitionAt: string | null;
	lastSuccessAt: string | null;
	firstFailureAt: string | null;
	consecutiveFailures: number;
	// Metadatos del cliente
	lastUpdatedAt: string | null;
	hydrated: boolean;
	loading: boolean;
	error: string | null;
}

// Action types
export const SCBA_SITE_STATUS_LOADING = "scbaSiteStatus/LOADING";
export const SCBA_SITE_STATUS_LOADED = "scbaSiteStatus/LOADED";
export const SCBA_SITE_STATUS_ERROR = "scbaSiteStatus/ERROR";
export const SCBA_SITE_STATUS_UPDATED = "scbaSiteStatus/UPDATED";
export const SCBA_SITE_STATUS_RESET = "scbaSiteStatus/RESET";

const initialState: ScbaSiteStatusState = {
	status: "unknown",
	message: null,
	lastTransitionAt: null,
	lastSuccessAt: null,
	firstFailureAt: null,
	consecutiveFailures: 0,
	lastUpdatedAt: null,
	hydrated: false,
	loading: false,
	error: null,
};

// ---------- Action creators ----------

export const scbaSiteStatusLoading = () => ({
	type: SCBA_SITE_STATUS_LOADING as typeof SCBA_SITE_STATUS_LOADING,
});

export const scbaSiteStatusLoaded = (payload: Partial<ScbaSiteStatusState>) => ({
	type: SCBA_SITE_STATUS_LOADED as typeof SCBA_SITE_STATUS_LOADED,
	payload,
});

export const scbaSiteStatusError = (message: string) => ({
	type: SCBA_SITE_STATUS_ERROR as typeof SCBA_SITE_STATUS_ERROR,
	payload: { message },
});

export const scbaSiteStatusUpdated = (payload: Partial<ScbaSiteStatusState>) => ({
	type: SCBA_SITE_STATUS_UPDATED as typeof SCBA_SITE_STATUS_UPDATED,
	payload,
});

export const scbaSiteStatusReset = () => ({
	type: SCBA_SITE_STATUS_RESET as typeof SCBA_SITE_STATUS_RESET,
});

// ---------- Thunk: hidratación inicial ----------

const API_BASE_URL = import.meta.env.VITE_BASE_URL;

/**
 * Trae el estado actual del portal SCBA desde el server.
 * Se llama una vez al bootear la app autenticada. Después, los cambios
 * llegan por socket (system_status / SCBA_SITE_STATUS).
 */
export const fetchScbaSiteStatus = () => async (dispatch: Dispatch) => {
	dispatch(scbaSiteStatusLoading());
	try {
		const res = await axios.get(`${API_BASE_URL}/api/scba-site-status`, {
			withCredentials: true,
		});
		const data = res.data?.data || {};
		dispatch(scbaSiteStatusLoaded(data));
	} catch (err: any) {
		dispatch(scbaSiteStatusError(err?.message || "Error consultando estado SCBA"));
	}
};

// ---------- Reducer ----------

const scbaSiteStatusReducer = (state = initialState, action: any): ScbaSiteStatusState => {
	switch (action.type) {
		case SCBA_SITE_STATUS_LOADING:
			return { ...state, loading: true, error: null };

		case SCBA_SITE_STATUS_LOADED: {
			const p = action.payload || {};
			return {
				...state,
				status: p.status ?? "unknown",
				message: p.message ?? null,
				lastTransitionAt: p.lastTransitionAt ?? null,
				lastSuccessAt: p.lastSuccessAt ?? null,
				firstFailureAt: p.firstFailureAt ?? null,
				consecutiveFailures: p.consecutiveFailures ?? 0,
				lastUpdatedAt: new Date().toISOString(),
				hydrated: true,
				loading: false,
				error: null,
			};
		}

		case SCBA_SITE_STATUS_UPDATED: {
			// Evento socket: merge incremental. No tocamos hydrated/loading.
			const p = action.payload || {};
			return {
				...state,
				...p,
				lastUpdatedAt: new Date().toISOString(),
			};
		}

		case SCBA_SITE_STATUS_ERROR:
			return {
				...state,
				loading: false,
				error: action.payload?.message ?? "Error desconocido",
			};

		case SCBA_SITE_STATUS_RESET:
			return initialState;

		default:
			return state;
	}
};

// ---------- Selectores helpers ----------

export const selectIsScbaDown = (state: { scbaSiteStatus: ScbaSiteStatusState }): boolean =>
	state.scbaSiteStatus.status === "down";

export const selectScbaSiteStatus = (state: { scbaSiteStatus: ScbaSiteStatusState }): ScbaSiteStatusState =>
	state.scbaSiteStatus;

export default scbaSiteStatusReducer;

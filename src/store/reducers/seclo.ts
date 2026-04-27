// store/reducers/seclo.ts
//
// Reducer + thunks para el módulo SECLO (lado usuario).
// Consume /api/seclo-credentials y /api/seclo-solicitudes del law-analytics-server.

import axios from "axios";
import { Dispatch } from "redux";
import { openSnackbar } from "./snackbar";
import type {
	SecloCredential,
	SecloSolicitud,
	SecloSolicitudStatus,
	SecloPresignResult,
} from "types/seclo";

const BASE_CRED = `${import.meta.env.VITE_BASE_URL}/api/seclo-credentials`;
const BASE_SOL  = `${import.meta.env.VITE_BASE_URL}/api/seclo-solicitudes`;

// ─── Action types ─────────────────────────────────────────────────────────────
// Exportadas para que WebSocketContext pueda despachar transiciones recibidas
// vía socket.io desde el trabajo-worker.

export const SET_LOADING       = "@seclo/SET_LOADING";
export const SET_ERROR         = "@seclo/SET_ERROR";
export const SET_CREDENTIAL    = "@seclo/SET_CREDENTIAL";
export const SET_SOLICITUDES   = "@seclo/SET_SOLICITUDES";
export const ADD_SOLICITUD     = "@seclo/ADD_SOLICITUD";
export const UPDATE_SOLICITUD  = "@seclo/UPDATE_SOLICITUD";
export const REMOVE_SOLICITUD  = "@seclo/REMOVE_SOLICITUD";
export const SET_TOTAL         = "@seclo/SET_TOTAL";

// ─── State ────────────────────────────────────────────────────────────────────

interface SecloState {
	loading: boolean;
	error: string | null;
	credential: SecloCredential | null;
	credentialLoaded: boolean;       // true tras la primera carga (incluso si null)
	solicitudes: SecloSolicitud[];
	solicitudesTotal: number;
}

const initial: SecloState = {
	loading: false,
	error: null,
	credential: null,
	credentialLoaded: false,
	solicitudes: [],
	solicitudesTotal: 0,
};

// ─── Reducer ──────────────────────────────────────────────────────────────────

export default function secloReducer(state = initial, action: any): SecloState {
	switch (action.type) {
		case SET_LOADING:    return { ...state, loading: action.payload };
		case SET_ERROR:      return { ...state, error: action.payload };
		case SET_CREDENTIAL: return { ...state, credential: action.payload, credentialLoaded: true };
		case SET_SOLICITUDES:return { ...state, solicitudes: action.payload };
		case SET_TOTAL:      return { ...state, solicitudesTotal: action.payload };
		case ADD_SOLICITUD:
			return {
				...state,
				solicitudes: [action.payload, ...state.solicitudes],
				solicitudesTotal: state.solicitudesTotal + 1,
			};
		case UPDATE_SOLICITUD:
			// Merge en lugar de replace — los updates por WS llegan parciales
			// (sólo los campos que cambiaron) y no queremos perder los demás.
			return {
				...state,
				solicitudes: state.solicitudes.map((s) =>
					s._id === action.payload._id
						? { ...s, ...action.payload, resultado: { ...(s.resultado || {}), ...(action.payload.resultado || {}) } }
						: s,
				),
			};
		case REMOVE_SOLICITUD:
			return {
				...state,
				solicitudes: state.solicitudes.filter((s) => s._id !== action.payload),
				solicitudesTotal: Math.max(0, state.solicitudesTotal - 1),
			};
		default:
			return state;
	}
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

function snack(dispatch: Dispatch, message: string, color: "success" | "error" | "info" | "warning" = "info") {
	dispatch<any>(openSnackbar({ open: true, message, variant: "alert", alert: { color } }));
}

function errMsg(err: any): string {
	return err?.response?.data?.message || err?.message || "Error desconocido";
}

// ─── Credenciales ─────────────────────────────────────────────────────────────

export const fetchMyCredential = () => async (dispatch: Dispatch) => {
	dispatch({ type: SET_LOADING, payload: true });
	try {
		const { data } = await axios.get(BASE_CRED);
		dispatch({ type: SET_CREDENTIAL, payload: data.credential });
		return data.credential as SecloCredential | null;
	} catch (err) {
		dispatch({ type: SET_ERROR, payload: errMsg(err) });
		return null;
	} finally {
		dispatch({ type: SET_LOADING, payload: false });
	}
};

export const createMyCredential = (cuil: string, password: string) => async (dispatch: Dispatch) => {
	try {
		const { data } = await axios.post(BASE_CRED, { cuil, password });
		dispatch({ type: SET_CREDENTIAL, payload: data.credential });
		snack(dispatch, data.message || "Credencial guardada", "success");
		return data.credential as SecloCredential;
	} catch (err) {
		snack(dispatch, errMsg(err), "error");
		throw err;
	}
};

export const updateMyCredential =
	(payload: { cuil?: string; password?: string; enabled?: boolean }) =>
	async (dispatch: Dispatch) => {
		try {
			const { data } = await axios.patch(BASE_CRED, payload);
			dispatch({ type: SET_CREDENTIAL, payload: data.credential });
			snack(dispatch, data.message || "Credencial actualizada", "success");
			return data.credential as SecloCredential;
		} catch (err) {
			snack(dispatch, errMsg(err), "error");
			throw err;
		}
	};

export const deleteMyCredential = () => async (dispatch: Dispatch) => {
	try {
		await axios.delete(BASE_CRED);
		dispatch({ type: SET_CREDENTIAL, payload: null });
		snack(dispatch, "Credencial eliminada", "success");
	} catch (err) {
		snack(dispatch, errMsg(err), "error");
		throw err;
	}
};

export const validateMyCredential = () => async (dispatch: Dispatch) => {
	try {
		const { data } = await axios.post(`${BASE_CRED}/validate`);
		snack(dispatch, data.message || "Validación solicitada", "info");
	} catch (err) {
		snack(dispatch, errMsg(err), "error");
		throw err;
	}
};

// ─── Solicitudes ──────────────────────────────────────────────────────────────

export interface SecloListParams {
	page?: number;
	limit?: number;
	status?: string;
	folderId?: string;
	dateFrom?: string;
	dateTo?: string;
}

export const fetchMySolicitudes = (params: SecloListParams = {}) => async (dispatch: Dispatch) => {
	dispatch({ type: SET_LOADING, payload: true });
	try {
		const { data } = await axios.get(BASE_SOL, { params });
		dispatch({ type: SET_SOLICITUDES, payload: data.solicitudes });
		dispatch({ type: SET_TOTAL, payload: data.total });
	} catch (err) {
		dispatch({ type: SET_ERROR, payload: errMsg(err) });
	} finally {
		dispatch({ type: SET_LOADING, payload: false });
	}
};

export const fetchSolicitudById = (id: string) => async (_dispatch: Dispatch): Promise<SecloSolicitud | null> => {
	try {
		const { data } = await axios.get(`${BASE_SOL}/${id}`);
		return data.solicitud;
	} catch {
		return null;
	}
};

export const fetchSolicitudStatus = (id: string) => async (_dispatch: Dispatch): Promise<SecloSolicitudStatus | null> => {
	try {
		const { data } = await axios.get(`${BASE_SOL}/${id}/status`);
		return data.status;
	} catch {
		return null;
	}
};

export const createSolicitud = (payload: any) => async (dispatch: Dispatch) => {
	try {
		const { data } = await axios.post(BASE_SOL, payload);
		dispatch({ type: ADD_SOLICITUD, payload: data.solicitud });
		snack(dispatch, "Solicitud creada", "success");
		return data.solicitud as SecloSolicitud;
	} catch (err) {
		snack(dispatch, errMsg(err), "error");
		throw err;
	}
};

export const updateSolicitud = (id: string, payload: any) => async (dispatch: Dispatch) => {
	try {
		const { data } = await axios.patch(`${BASE_SOL}/${id}`, payload);
		dispatch({ type: UPDATE_SOLICITUD, payload: data.solicitud });
		snack(dispatch, "Solicitud actualizada", "success");
		return data.solicitud as SecloSolicitud;
	} catch (err) {
		snack(dispatch, errMsg(err), "error");
		throw err;
	}
};

export const deleteSolicitud = (id: string) => async (dispatch: Dispatch) => {
	try {
		await axios.delete(`${BASE_SOL}/${id}`);
		dispatch({ type: REMOVE_SOLICITUD, payload: id });
		snack(dispatch, "Solicitud eliminada", "success");
	} catch (err) {
		snack(dispatch, errMsg(err), "error");
		throw err;
	}
};

export const reactivarSolicitud = (id: string) => async (dispatch: Dispatch) => {
	try {
		const { data } = await axios.patch(`${BASE_SOL}/${id}/reactivar`);
		dispatch({ type: UPDATE_SOLICITUD, payload: data.solicitud });
		snack(dispatch, "Solicitud reactivada", "success");
		return data.solicitud as SecloSolicitud;
	} catch (err) {
		snack(dispatch, errMsg(err), "error");
		throw err;
	}
};

// ─── S3 helpers ──────────────────────────────────────────────────────────────

/**
 * Sube un archivo a S3 obteniendo URL presignada de la API. Devuelve la s3Key
 * que después se referencia desde la solicitud.
 */
export const uploadDocumento = async (file: File): Promise<SecloPresignResult> => {
	const presign = await axios.post<{ success: boolean; uploadUrl: string; s3Key: string }>(
		`${BASE_SOL}/upload/presign`,
		{ fileName: file.name, contentType: file.type },
	);
	if (!presign.data?.success) throw new Error("No se pudo obtener URL de upload");

	await fetch(presign.data.uploadUrl, {
		method: "PUT",
		body: file,
		headers: { "Content-Type": file.type },
	});

	return { uploadUrl: presign.data.uploadUrl, s3Key: presign.data.s3Key };
};

/**
 * Devuelve una URL presignada de download para una s3Key (sólo si pertenece
 * al usuario — el backend valida ownership).
 */
export const getSecloDownloadUrl = async (s3Key: string): Promise<string | null> => {
	try {
		const { data } = await axios.get(`${BASE_SOL}/download-url`, { params: { key: s3Key } });
		return data?.success ? data.downloadUrl : null;
	} catch {
		return null;
	}
};

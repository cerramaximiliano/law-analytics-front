// Estado de sincronización PJN (mis-causas-worker).
// Actualizado exclusivamente por eventos WebSocket vía WebSocketContext.

export interface PjnSyncState {
	isActive: boolean;
	progress: number;
	message: string;
	phase: string | null;
	completedAt: string | null;
	foldersCreated: number;
	newCausas: number;
	hasError: boolean;
	errorMessage: string | null;
}

// Action types
export const PJN_SYNC_STARTED = "pjnSync/STARTED";
export const PJN_SYNC_PROGRESS = "pjnSync/PROGRESS";
export const PJN_SYNC_COMPLETED = "pjnSync/COMPLETED";
export const PJN_SYNC_ERROR = "pjnSync/ERROR";
export const PJN_SYNC_RESET = "pjnSync/RESET";

const initialState: PjnSyncState = {
	isActive: false,
	progress: 0,
	message: "",
	phase: null,
	completedAt: null,
	foldersCreated: 0,
	newCausas: 0,
	hasError: false,
	errorMessage: null,
};

// Action creators
export const pjnSyncStarted = (payload?: { progress?: number; message?: string }) => ({
	type: PJN_SYNC_STARTED as typeof PJN_SYNC_STARTED,
	payload,
});

export const pjnSyncProgress = (payload: { progress: number; message: string; phase: string }) => ({
	type: PJN_SYNC_PROGRESS as typeof PJN_SYNC_PROGRESS,
	payload,
});

export const pjnSyncCompleted = (payload: { foldersCreated: number; newCausas: number }) => ({
	type: PJN_SYNC_COMPLETED as typeof PJN_SYNC_COMPLETED,
	payload,
});

export const pjnSyncError = (payload: { message: string }) => ({
	type: PJN_SYNC_ERROR as typeof PJN_SYNC_ERROR,
	payload,
});

export const pjnSyncReset = () => ({
	type: PJN_SYNC_RESET as typeof PJN_SYNC_RESET,
});

const pjnSyncReducer = (state = initialState, action: any): PjnSyncState => {
	switch (action.type) {
		case PJN_SYNC_STARTED:
			return {
				...initialState,
				isActive: true,
				progress: action.payload?.progress ?? 0,
				message: action.payload?.message ?? "Sincronizando causas...",
				phase: "started",
			};

		case PJN_SYNC_PROGRESS:
			return {
				...state,
				isActive: true,
				progress: action.payload.progress,
				message: action.payload.message,
				phase: action.payload.phase,
			};

		case PJN_SYNC_COMPLETED:
			return {
				...state,
				isActive: false,
				progress: 100,
				message: "Sincronización completada",
				phase: "completed",
				completedAt: new Date().toISOString(),
				foldersCreated: action.payload.foldersCreated,
				newCausas: action.payload.newCausas,
			};

		case PJN_SYNC_ERROR:
			return {
				...state,
				isActive: false,
				phase: "error",
				hasError: true,
				errorMessage: action.payload.message,
			};

		case PJN_SYNC_RESET:
			return initialState;

		default:
			return state;
	}
};

export default pjnSyncReducer;

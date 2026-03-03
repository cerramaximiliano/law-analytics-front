// Estado de sincronización PJN (mis-causas-worker).
// Actualizado exclusivamente por eventos WebSocket vía WebSocketContext.

export interface PjnSyncState {
	isActive: boolean;
	progress: number;
	message: string;
	phase: string | null;
	// Fases ya superadas (persisten aunque lleguen en ráfaga, para la UI de pasos)
	seenPhases: string[];
	completedAt: string | null;
	foldersCreated: number;
	newCausas: number;
	hasError: boolean;
	errorMessage: string | null;
	// Datos adicionales para UI rica por fase
	currentPage?: number;
	totalPages?: number;
	causasProcessed?: number;
	totalExpected?: number;
	batchNum?: number;
	totalBatches?: number;
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
	seenPhases: [],
	completedAt: null,
	foldersCreated: 0,
	newCausas: 0,
	hasError: false,
	errorMessage: null,
};

// Action creators
export const pjnSyncStarted = (payload?: { progress?: number; message?: string; force?: boolean }) => ({
	type: PJN_SYNC_STARTED as typeof PJN_SYNC_STARTED,
	payload,
});

export const pjnSyncProgress = (payload: {
	progress: number;
	message: string;
	phase: string;
	currentPage?: number;
	totalPages?: number;
	causasProcessed?: number;
	totalExpected?: number;
	batchNum?: number;
	totalBatches?: number;
}) => ({
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
		case PJN_SYNC_STARTED: {
			// Grace period: si el sync completó hace menos de 60s Y el dispatch no es forzado,
			// ignorar el evento "started". Esto previene cycling por eventos WS stale (ej. un
			// segundo credential-processor iniciándose justo después de que el primero completó).
			// Las acciones explícitas del usuario (handleResync, handleSubmit) usan force=true.
			if (!action.payload?.force && state.completedAt) {
				const elapsed = Date.now() - new Date(state.completedAt).getTime();
				if (elapsed < 60 * 1000) {
					return state;
				}
			}
			return {
				...initialState,
				isActive: true,
				progress: action.payload?.progress ?? 0,
				message: action.payload?.message ?? "Sincronizando causas...",
				phase: "started",
			};
		}

		case PJN_SYNC_PROGRESS: {
			const newPhase = action.payload.phase;
			const previousPhase = state.phase;
			// Acumular la fase anterior en seenPhases al transicionar a una nueva
			const seenPhases =
				previousPhase && previousPhase !== newPhase && !state.seenPhases.includes(previousPhase)
					? [...state.seenPhases, previousPhase]
					: state.seenPhases;
			return {
				...state,
				isActive: true,
				progress: action.payload.progress,
				message: action.payload.message,
				phase: newPhase,
				seenPhases,
				currentPage: action.payload.currentPage,
				totalPages: action.payload.totalPages,
				causasProcessed: action.payload.causasProcessed,
				totalExpected: action.payload.totalExpected,
				batchNum: action.payload.batchNum,
				totalBatches: action.payload.totalBatches,
			};
		}

		case PJN_SYNC_COMPLETED: {
			// Registrar la última fase activa antes de marcar como completado
			const lastPhase = state.phase;
			const seenPhases =
				lastPhase && lastPhase !== "completed" && !state.seenPhases.includes(lastPhase)
					? [...state.seenPhases, lastPhase]
					: state.seenPhases;
			return {
				...state,
				isActive: false,
				progress: 100,
				message: "Sincronización completada",
				phase: "completed",
				seenPhases,
				completedAt: new Date().toISOString(),
				foldersCreated: action.payload.foldersCreated,
				newCausas: action.payload.newCausas,
			};
		}

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

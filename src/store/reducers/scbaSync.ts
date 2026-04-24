// Estado de sincronización SCBA (verification + initial-scraping workers).
// Actualizado exclusivamente por eventos WebSocket vía WebSocketContext.
// Espejo del patrón pjnSync.ts — el WebSocketContext discrimina por
// `payload.source === 'scba'` antes de despachar aquí.

export interface ScbaSyncState {
	isActive: boolean;
	progress: number;
	message: string;
	phase: string | null;
	seenPhases: string[];
	completedAt: string | null;
	foldersCreated: number;
	newCausas: number;
	hasError: boolean;
	errorMessage: string | null;
	currentPage?: number;
	totalPages?: number;
	causasProcessed?: number;
	totalExpected?: number;
	causasFound?: number;
}

export const SCBA_SYNC_STARTED = "scbaSync/STARTED";
export const SCBA_SYNC_PROGRESS = "scbaSync/PROGRESS";
export const SCBA_SYNC_COMPLETED = "scbaSync/COMPLETED";
export const SCBA_SYNC_ERROR = "scbaSync/ERROR";
export const SCBA_SYNC_RESET = "scbaSync/RESET";

const initialState: ScbaSyncState = {
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

export const scbaSyncStarted = (payload?: { progress?: number; message?: string; force?: boolean }) => ({
	type: SCBA_SYNC_STARTED as typeof SCBA_SYNC_STARTED,
	payload,
});

export const scbaSyncProgress = (payload: {
	progress: number;
	message: string;
	phase: string;
	currentPage?: number;
	totalPages?: number;
	causasProcessed?: number;
	totalExpected?: number;
	causasFound?: number;
}) => ({
	type: SCBA_SYNC_PROGRESS as typeof SCBA_SYNC_PROGRESS,
	payload,
});

export const scbaSyncCompleted = (payload: { foldersCreated: number; newCausas: number }) => ({
	type: SCBA_SYNC_COMPLETED as typeof SCBA_SYNC_COMPLETED,
	payload,
});

export const scbaSyncError = (payload: { message: string }) => ({
	type: SCBA_SYNC_ERROR as typeof SCBA_SYNC_ERROR,
	payload,
});

export const scbaSyncReset = () => ({
	type: SCBA_SYNC_RESET as typeof SCBA_SYNC_RESET,
});

const scbaSyncReducer = (state = initialState, action: any): ScbaSyncState => {
	switch (action.type) {
		case SCBA_SYNC_STARTED: {
			if (!action.payload?.force && state.completedAt) {
				const elapsed = Date.now() - new Date(state.completedAt).getTime();
				if (elapsed < 5 * 1000) {
					return state;
				}
			}
			return {
				...initialState,
				isActive: true,
				progress: action.payload?.progress ?? 0,
				message: action.payload?.message ?? "Sincronizando causas SCBA...",
				phase: "started",
			};
		}

		case SCBA_SYNC_PROGRESS: {
			const newPhase = action.payload.phase;
			const previousPhase = state.phase;

			if (!state.isActive) {
				return {
					...initialState,
					isActive: true,
					progress: action.payload.progress,
					message: action.payload.message,
					phase: newPhase,
					seenPhases: ["started"],
					currentPage: action.payload.currentPage,
					totalPages: action.payload.totalPages,
					causasProcessed: action.payload.causasProcessed,
					totalExpected: action.payload.totalExpected,
					causasFound: action.payload.causasFound,
				};
			}

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
				causasFound: action.payload.causasFound,
			};
		}

		case SCBA_SYNC_COMPLETED: {
			const lastPhase = state.phase;
			const seenPhases =
				lastPhase && lastPhase !== "completed" && !state.seenPhases.includes(lastPhase)
					? [...state.seenPhases, lastPhase]
					: state.seenPhases;
			return {
				...state,
				isActive: false,
				progress: 100,
				message: "Sincronización SCBA completada",
				phase: "completed",
				seenPhases,
				completedAt: new Date().toISOString(),
				foldersCreated: action.payload.foldersCreated,
				newCausas: action.payload.newCausas,
			};
		}

		case SCBA_SYNC_ERROR:
			return {
				...state,
				isActive: false,
				phase: "error",
				hasError: true,
				errorMessage: action.payload.message,
			};

		case SCBA_SYNC_RESET:
			return initialState;

		default:
			return state;
	}
};

export default scbaSyncReducer;

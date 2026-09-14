// Estado de sincronización de movimientos (private-causas-update-worker).
// Actualizado exclusivamente por eventos WebSocket vía WebSocketContext.
// Solo se usan los eventos de inicio y fin — el detalle granular lo cubre
// ScrapingProgressBanner via polling por folder.

export interface MovementsSyncState {
	isActive: boolean;
	totalCausas: number;
	newMovimientos: number;
	isInitialSync: boolean;
	completedAt: string | null;
	hasError: boolean;
	errorMessage: string | null;
}

// Action types
export const MOVEMENTS_SYNC_STARTED = "movementsSync/STARTED";
export const MOVEMENTS_SYNC_COMPLETED = "movementsSync/COMPLETED";
export const MOVEMENTS_SYNC_ERROR = "movementsSync/ERROR";
export const MOVEMENTS_SYNC_RESET = "movementsSync/RESET";

const initialState: MovementsSyncState = {
	isActive: false,
	totalCausas: 0,
	newMovimientos: 0,
	isInitialSync: false,
	completedAt: null,
	hasError: false,
	errorMessage: null,
};

// Action creators
export const movementsSyncStarted = (payload: { totalCausas: number; isInitialSync: boolean }) => ({
	type: MOVEMENTS_SYNC_STARTED as typeof MOVEMENTS_SYNC_STARTED,
	payload,
});

export const movementsSyncCompleted = (payload: { newMovimientos: number; totalCausas: number; isInitialSync: boolean }) => ({
	type: MOVEMENTS_SYNC_COMPLETED as typeof MOVEMENTS_SYNC_COMPLETED,
	payload,
});

export const movementsSyncError = (payload: { message: string }) => ({
	type: MOVEMENTS_SYNC_ERROR as typeof MOVEMENTS_SYNC_ERROR,
	payload,
});

export const movementsSyncReset = () => ({
	type: MOVEMENTS_SYNC_RESET as typeof MOVEMENTS_SYNC_RESET,
});

const movementsSyncReducer = (state = initialState, action: any): MovementsSyncState => {
	switch (action.type) {
		case MOVEMENTS_SYNC_STARTED:
			return {
				...initialState,
				isActive: true,
				totalCausas: action.payload.totalCausas,
				isInitialSync: action.payload.isInitialSync,
			};

		case MOVEMENTS_SYNC_COMPLETED:
			return {
				...state,
				isActive: false,
				totalCausas: action.payload.totalCausas,
				newMovimientos: action.payload.newMovimientos,
				isInitialSync: action.payload.isInitialSync,
				completedAt: new Date().toISOString(),
			};

		case MOVEMENTS_SYNC_ERROR:
			return {
				...state,
				isActive: false,
				hasError: true,
				errorMessage: action.payload.message,
			};

		case MOVEMENTS_SYNC_RESET:
			return initialState;

		default:
			return state;
	}
};

export default movementsSyncReducer;

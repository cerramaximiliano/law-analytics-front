/**
 * Tests para store/reducers/unifiedStats.ts
 *
 * Foco: los 3 fixes del bug "Sin datos" en /dashboard/default —
 *   1. setStatsSuccess MERGEA data cuando el userId no cambia, así un fetch
 *      parcial (sections=dashboard) no borra secciones ya cargadas (folders).
 *   2. setStatsSuccess REEMPLAZA cuando cambia el userId (switch de team owner).
 *   3. El thunk getUnifiedStats DEDUPA requests en vuelo — N widgets que
 *      dispatchean en paralelo deben provocar 1 sólo HTTP request.
 */

import { describe, it, expect, vi, beforeEach } from "vitest";
import axios from "axios";

import unifiedStatsReducer, { setStatsSuccess, resetStats, getUnifiedStats } from "../store/reducers/unifiedStats";
import type { UnifiedStatsData, UnifiedStatsState } from "../types/unified-stats";

const initialState: UnifiedStatsState = {
	isInitialized: false,
	lastFetchedUserId: null,
	lastFetchTime: null,
	isLoading: false,
	error: null,
	data: null,
	dataQuality: null,
	lastUpdated: null,
	descriptions: null,
	cacheInfo: null,
	history: [],
	historyLoading: false,
	selectedHistoryId: null,
};

const dashboardOnly = {
	dashboard: {
		folders: { active: 4, closed: 0 },
		tasks: { pending: 0, completed: 0, overdue: 0 },
		deadlines: { nextWeek: 10, next15Days: 31, next30Days: 71 },
		financial: { activeAmount: 0 },
		notifications: { unread: 0 },
		trends: { newFolders: [], closedFolders: [], tasks: [] },
	},
} as unknown as UnifiedStatsData;

const foldersOnly = {
	folders: {
		distribution: { nueva: 4, enProceso: 0, cerrada: 0, pendiente: 0 },
		resolutionTimes: { overall: 0, byStatus: { nueva: 0, enProceso: 0, pendiente: 0 } },
		upcomingDeadlines: { next7Days: 10, next15Days: 31, next30Days: 71 },
		byMatter: { distribution: {}, averageAmount: {}, resolutionTime: {} },
	},
} as unknown as UnifiedStatsData;

describe("unifiedStats reducer — setStatsSuccess merge semantics", () => {
	it("mergea data cuando el userId es el mismo (fetch parcial no borra secciones previas)", () => {
		// Estado previo: ya tenemos folders cargado
		const withFolders = unifiedStatsReducer(initialState, setStatsSuccess({ data: foldersOnly, userId: "user-A" }));
		expect(withFolders.data?.folders?.distribution).toBeDefined();

		// Llega un fetch parcial con sólo "dashboard" (el bug original: este wipeaba folders)
		const afterDashboardOnly = unifiedStatsReducer(withFolders, setStatsSuccess({ data: dashboardOnly, userId: "user-A" }));

		// Bug-guard: folders DEBE seguir presente
		expect(afterDashboardOnly.data?.folders?.distribution).toEqual({
			nueva: 4,
			enProceso: 0,
			cerrada: 0,
			pendiente: 0,
		});
		// Y dashboard también
		expect(afterDashboardOnly.data?.dashboard?.folders?.active).toBe(4);
	});

	it("REEMPLAZA data cuando cambia el userId (switch de team owner)", () => {
		const userA = unifiedStatsReducer(initialState, setStatsSuccess({ data: foldersOnly, userId: "user-A" }));
		expect(userA.data?.folders).toBeDefined();

		// Cambio de owner — el state del user previo NO debe filtrarse al nuevo
		const userB = unifiedStatsReducer(userA, setStatsSuccess({ data: dashboardOnly, userId: "user-B" }));

		expect(userB.lastFetchedUserId).toBe("user-B");
		expect(userB.data?.folders).toBeUndefined();
		expect(userB.data?.dashboard).toBeDefined();
	});

	it("setea isInitialized=true y limpia error tras éxito", () => {
		const errored: UnifiedStatsState = { ...initialState, error: "boom", isLoading: true };
		const next = unifiedStatsReducer(errored, setStatsSuccess({ data: dashboardOnly, userId: "user-A" }));
		expect(next.isInitialized).toBe(true);
		expect(next.error).toBeNull();
		expect(next.isLoading).toBe(false);
	});

	it("resetStats limpia data y vuelve a initialState", () => {
		const populated = unifiedStatsReducer(initialState, setStatsSuccess({ data: foldersOnly, userId: "user-A" }));
		const reset = unifiedStatsReducer(populated, resetStats());
		expect(reset.data).toBeNull();
		expect(reset.isInitialized).toBe(false);
		expect(reset.lastFetchedUserId).toBeNull();
	});
});

// ─────────────────────────────────────────────────────────────────────────────

describe("getUnifiedStats thunk — dedup de in-flight requests", () => {
	const axiosGet = vi.mocked(axios.get);

	beforeEach(() => {
		vi.clearAllMocks();
	});

	// Helper: simula store con getState devolviendo el state pasado, dispatch grabable
	const makeStore = (state: UnifiedStatsState) => {
		const dispatched: any[] = [];
		const dispatch = vi.fn((action: any) => {
			// Soportar thunks anidados (el slice dispatcha actions sincrónicas)
			if (typeof action === "function") return action(dispatch, () => ({ unifiedStats: state }));
			dispatched.push(action);
			return action;
		});
		return { dispatch, getState: () => ({ unifiedStats: state }), dispatched };
	};

	it("N dispatchs en paralelo del MISMO userId+sections → 1 solo HTTP request", async () => {
		// axios devuelve recién después de un tick para que el dedup tenga tiempo de registrar
		axiosGet.mockImplementationOnce(
			() =>
				new Promise((resolve) =>
					setTimeout(
						() =>
							resolve({
								data: {
									success: true,
									data: foldersOnly,
									userId: "user-A",
									dataQuality: 80,
									lastUpdated: new Date().toISOString(),
								},
							} as any),
						10,
					),
				),
		);

		const store = makeStore(initialState);
		const thunk = getUnifiedStats("user-A", "folders");

		// 5 widgets dispatchean en paralelo (escenario real: ActiveFolders + FoldersDataRate + ProjectRelease + TaskWidget + default.tsx)
		const promises = [
			thunk(store.dispatch, store.getState),
			thunk(store.dispatch, store.getState),
			thunk(store.dispatch, store.getState),
			thunk(store.dispatch, store.getState),
			thunk(store.dispatch, store.getState),
		];

		await Promise.all(promises);

		expect(axiosGet).toHaveBeenCalledTimes(1);
	});

	it("dispatchs con sections distintas → request por cada sections", async () => {
		axiosGet.mockResolvedValue({
			data: { success: true, data: dashboardOnly, userId: "user-A", dataQuality: 80, lastUpdated: "" },
		} as any);

		const store = makeStore(initialState);

		await Promise.all([
			getUnifiedStats("user-A", "dashboard")(store.dispatch, store.getState),
			getUnifiedStats("user-A", "folders")(store.dispatch, store.getState),
			getUnifiedStats("user-A", "dashboard,folders")(store.dispatch, store.getState),
		]);

		expect(axiosGet).toHaveBeenCalledTimes(3);
	});

	it("forceRefresh skipea el dedup — retry debe disparar fetch real aunque haya uno en vuelo", async () => {
		axiosGet.mockImplementation(
			() =>
				new Promise((resolve) =>
					setTimeout(
						() => resolve({ data: { success: true, data: dashboardOnly, userId: "user-A", dataQuality: 80 } } as any),
						15,
					),
				),
		);

		const store = makeStore(initialState);

		// 1er request en vuelo (dedup-able)
		const first = getUnifiedStats("user-A", "dashboard,folders")(store.dispatch, store.getState);
		// 2do request con forceRefresh — NO debe reutilizar el in-flight
		const second = getUnifiedStats("user-A", "dashboard,folders", true)(store.dispatch, store.getState);

		await Promise.all([first, second]);

		expect(axiosGet).toHaveBeenCalledTimes(2);
	});

	it("después de completarse, un nuevo dispatch con misma key dispara un NUEVO request (no se queda pegado al map)", async () => {
		axiosGet.mockResolvedValue({
			data: { success: true, data: foldersOnly, userId: "user-A", dataQuality: 80 },
		} as any);

		const store = makeStore(initialState);

		await getUnifiedStats("user-A", "folders")(store.dispatch, store.getState);
		expect(axiosGet).toHaveBeenCalledTimes(1);

		// Simular state donde el cache TTL ya expiró (lastFetchTime muy viejo)
		const staleState: UnifiedStatsState = {
			...initialState,
			isInitialized: true,
			lastFetchedUserId: "user-A",
			lastFetchTime: Date.now() - 25 * 60 * 60 * 1000, // 25h atrás, fuera de CACHE_TIME
		};
		const staleStore = makeStore(staleState);

		await getUnifiedStats("user-A", "folders")(staleStore.dispatch, staleStore.getState);
		expect(axiosGet).toHaveBeenCalledTimes(2);
	});
});

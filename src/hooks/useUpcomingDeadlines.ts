import { useEffect, useState, useCallback } from "react";

import { useSelector, RootState } from "store";
import { useTeam } from "contexts/TeamContext";
import { getUpcomingDeadlines, UpcomingMovementEvent, DeadlineCounts } from "services/upcomingMovementsService";

// Fuente de verdad ÚNICA del dashboard para "Próximos vencimientos". Tres
// superficies consumen este hook — el widget de lista, la KPI card y la card de
// Vencimientos 7/15/30 — y todas ven los mismos datos en vivo. Un único fetch
// por scope (caché singleton + dedupe de Promise en vuelo), igual que
// [[useScbaCredentialError]]. Reactivo: cuando se invalida (ej. tras crear un
// evento), todos los suscriptores montados revalidan.

const LIMIT = 8;
const CACHE_TTL_MS = 60000;
const EMPTY_COUNTS: DeadlineCounts = { next7Days: 0, next15Days: 0, next30Days: 0, total: 0 };

export interface UpcomingDeadlinesState {
	events: UpcomingMovementEvent[];
	counts: DeadlineCounts;
	loading: boolean;
}

interface CacheEntry {
	ts: number;
	events: UpcomingMovementEvent[];
	counts: DeadlineCounts;
}

// Caché y fetch en vuelo por scope (groupId del equipo activo, o "personal").
const cache = new Map<string, CacheEntry>();
const pending = new Map<string, Promise<CacheEntry>>();
const subscribers = new Set<() => void>();

function notify() {
	subscribers.forEach((fn) => fn());
}

function fetchOnce(scopeKey: string, groupId?: string): Promise<CacheEntry> {
	const inFlight = pending.get(scopeKey);
	if (inFlight) return inFlight;

	const p = getUpcomingDeadlines({ limit: LIMIT, groupId })
		.then((res) => {
			const entry: CacheEntry = { ts: Date.now(), events: res.events, counts: res.counts };
			cache.set(scopeKey, entry);
			pending.delete(scopeKey);
			notify();
			return entry;
		})
		.catch(() => {
			pending.delete(scopeKey);
			const entry: CacheEntry = { ts: Date.now(), events: [], counts: EMPTY_COUNTS };
			return entry;
		});

	pending.set(scopeKey, p);
	return p;
}

/**
 * Invalida toda la caché de vencimientos y dispara revalidación en los hooks
 * montados. Llamar tras crear/editar/eliminar un evento de tipo vencimiento o
 * audiencia para que el dashboard refleje el cambio sin recargar.
 */
export function invalidateUpcomingDeadlinesCache() {
	cache.clear();
	pending.clear();
	notify();
}

export function useUpcomingDeadlines(): UpcomingDeadlinesState {
	const userId = useSelector((state: RootState) => state.auth.user?._id);
	const { activeTeam, isTeamMode } = useTeam();
	const groupId = isTeamMode && activeTeam?._id ? activeTeam._id : undefined;
	const scopeKey = groupId ? `group:${groupId}` : "personal";

	const [state, setState] = useState<UpcomingDeadlinesState>(() => {
		const cached = cache.get(scopeKey);
		return {
			events: cached?.events ?? [],
			counts: cached?.counts ?? EMPTY_COUNTS,
			loading: !cached,
		};
	});

	const sync = useCallback(() => {
		const cached = cache.get(scopeKey);
		if (cached) {
			setState({ events: cached.events, counts: cached.counts, loading: false });
		}
	}, [scopeKey]);

	useEffect(() => {
		if (!userId) return;

		// Suscribirse para revalidar cuando otro consumidor refresca o se invalida.
		subscribers.add(sync);

		const cached = cache.get(scopeKey);
		const fresh = cached && Date.now() - cached.ts < CACHE_TTL_MS;
		if (cached) {
			setState({ events: cached.events, counts: cached.counts, loading: false });
		} else {
			setState((s) => ({ ...s, loading: true }));
		}

		let cancelled = false;
		if (!fresh) {
			fetchOnce(scopeKey, groupId).then((entry) => {
				if (!cancelled) setState({ events: entry.events, counts: entry.counts, loading: false });
			});
		}

		return () => {
			cancelled = true;
			subscribers.delete(sync);
		};
	}, [userId, scopeKey, groupId, sync]);

	return state;
}

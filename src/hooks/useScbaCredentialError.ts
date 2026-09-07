import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import scbaCredentialsService from "api/scbaCredentials";
import { getScbaStatusReason, isScbaCredentialBroken, scbaStatusNotice, ScbaStatusReason } from "utils/scbaBindingState";

/**
 * Cache singleton: si N componentes (cards de folder, detail) llaman al hook,
 * solo el primer fetch llega al server. Los demás esperan al mismo Promise
 * o leen del cache.
 */
type CacheValue = {
	hasError: boolean;
	isExpired: boolean;
	statusReason: ScbaStatusReason | null;
	errorMessage: string;
	username: string;
};
let cache: CacheValue | null = null;
let cacheTs = 0;
let pendingFetch: Promise<CacheValue> | null = null;

const CACHE_TTL_MS = 30000;
const EMPTY: CacheValue = { hasError: false, isExpired: false, statusReason: null, errorMessage: "", username: "" };

async function fetchOnce(): Promise<CacheValue> {
	if (pendingFetch) return pendingFetch;
	pendingFetch = scbaCredentialsService
		.getCredentialsStatus()
		.then((res: any) => {
			const data = res?.success && res?.hasCredentials ? res.data : null;
			// S15: `isExpired` cuenta como error aunque `syncStatus` no lo sea —
			// la cred no va a sincronizar hasta que el usuario la actualice.
			const hasError = isScbaCredentialBroken(data);
			const isExpired = data?.isExpired === true;
			const statusReason = getScbaStatusReason(data);
			const errorMessage = scbaStatusNotice(data) || data?.lastError?.message || "";
			const username = data?.username || "";
			cache = { hasError, isExpired, statusReason, errorMessage, username };
			cacheTs = Date.now();
			pendingFetch = null;
			return cache;
		})
		.catch(() => {
			pendingFetch = null;
			return EMPTY;
		});
	return pendingFetch;
}

/**
 * Invalida el cache para forzar refetch en la próxima invocación del hook.
 * Llamar desde `GlobalSyncErrorListener` cuando llega un WS de error SCBA, o
 * desde la página de SCBA tras link/unlink.
 */
export function invalidateScbaCredentialErrorCache() {
	cache = null;
	cacheTs = 0;
}

/**
 * Devuelve el estado actual de la cred SCBA del user.
 * - `hasError`: la cred está en `syncStatus='error'` o `isExpired` — necesita
 *   acción del usuario. Usado por las cards/detalle de folders SCBA para
 *   mostrar "Sincronización pausada" (`getScbaBindingState`).
 * - `isExpired`: rechazo confirmado por el portal (subconjunto de `hasError`).
 * - `statusReason`: motivo derivado por el hub (S10) o aproximado localmente.
 * - `errorMessage`: copy para el usuario (`scbaStatusNotice`), con fallback al
 *   `lastError.message` crudo.
 * - `username`: domicilio electrónico del user (para pre-popular form de re-link).
 *
 * Reactivo a `scbaSync.lastEventAt` (slice Redux): cuando el listener global
 * detecta un WS de error e invalida el cache, este hook re-fetcha y actualiza
 * todos los suscriptores.
 */
export function useScbaCredentialError() {
	const [state, setState] = useState<CacheValue>(() => cache ?? EMPTY);
	// Trigger reactivo: cuando el slice scbaSync se actualiza (start, complete,
	// error, reset), revalidamos el estado de la cred. Cubre el caso de WS
	// llegando mientras el componente está montado.
	const scbaSyncTick = useSelector(
		(s: any) => `${s.scbaSync?.phase ?? ""}|${s.scbaSync?.hasError ? "err" : "ok"}|${s.scbaSync?.completedAt ?? ""}`,
	);

	useEffect(() => {
		let cancelled = false;
		const valid = cache && Date.now() - cacheTs < CACHE_TTL_MS;
		if (valid) {
			setState(cache as CacheValue);
			return;
		}
		fetchOnce().then((v) => {
			if (!cancelled) setState(v);
		});
		return () => {
			cancelled = true;
		};
	}, [scbaSyncTick]);

	return state;
}

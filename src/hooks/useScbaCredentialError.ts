import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import scbaCredentialsService from "api/scbaCredentials";

/**
 * Cache singleton: si N componentes (cards de folder, detail) llaman al hook,
 * solo el primer fetch llega al server. Los demás esperan al mismo Promise
 * o leen del cache.
 */
type CacheValue = { hasError: boolean; errorMessage: string };
let cache: CacheValue | null = null;
let cacheTs = 0;
let pendingFetch: Promise<CacheValue> | null = null;

const CACHE_TTL_MS = 30000;

async function fetchOnce(): Promise<CacheValue> {
	if (pendingFetch) return pendingFetch;
	pendingFetch = scbaCredentialsService
		.getCredentialsStatus()
		.then((res: any) => {
			const hasError = !!(res?.success && res?.data?.syncStatus === "error");
			const errorMessage = res?.data?.lastError?.message || "";
			cache = { hasError, errorMessage };
			cacheTs = Date.now();
			pendingFetch = null;
			return cache;
		})
		.catch(() => {
			pendingFetch = null;
			const fallback: CacheValue = { hasError: false, errorMessage: "" };
			return fallback;
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
 * Devuelve si la cred SCBA del user está en estado de error. Usado por las
 * cards/detalle de folders SCBA para mostrar "Sincronización pausada".
 *
 * Reactivo a `scbaSync.lastEventAt` (slice Redux): cuando el listener global
 * detecta un WS de error e invalida el cache, este hook re-fetcha y actualiza
 * todos los suscriptores.
 */
export function useScbaCredentialError() {
	const [state, setState] = useState<CacheValue>(() => cache ?? { hasError: false, errorMessage: "" });
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

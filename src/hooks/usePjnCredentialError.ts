import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import pjnCredentialsService from "api/pjnCredentials";

/**
 * Cache singleton: si N componentes (cards de folder, detail) llaman al hook,
 * solo el primer fetch llega al server. Los demás esperan al mismo Promise
 * o leen del cache.
 *
 * Espejo de useScbaCredentialError. Mantener simétrico — si se modifica algo
 * acá, replicar allá.
 */
type CacheValue = { hasError: boolean; errorMessage: string; cuil: string };
let cache: CacheValue | null = null;
let cacheTs = 0;
let pendingFetch: Promise<CacheValue> | null = null;

const CACHE_TTL_MS = 30000;
const EMPTY: CacheValue = { hasError: false, errorMessage: "", cuil: "" };

async function fetchOnce(): Promise<CacheValue> {
	if (pendingFetch) return pendingFetch;
	pendingFetch = pjnCredentialsService
		.getCredentialsStatus()
		.then((res: any) => {
			// hasError considera ambos códigos que requieren acción del user.
			// Espejo del isCredentialError de PjnAccountConnect.tsx.
			const code = res?.data?.lastError?.code;
			const hasError = !!(
				res?.success &&
				res?.data?.syncStatus === "error" &&
				(code === "CREDENTIAL_INVALID" || code === "REQUIRED_ACTION")
			);
			const errorMessage = res?.data?.lastError?.message || "";
			const cuil = res?.data?.cuil || "";
			cache = { hasError, errorMessage, cuil };
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
 * Llamar desde `GlobalSyncErrorListener` cuando llega un WS de error PJN, o
 * desde la página de PJN tras link/unlink.
 */
export function invalidatePjnCredentialErrorCache() {
	cache = null;
	cacheTs = 0;
}

/**
 * Devuelve el estado actual de la cred PJN del user.
 * - `hasError`: si la cred está en `syncStatus='error'` con un código que
 *   requiere acción del user (CREDENTIAL_INVALID / REQUIRED_ACTION). Usado
 *   por las cards/detalle de folders PJN para mostrar "Sincronización pausada".
 * - `errorMessage`: mensaje del `lastError.message` (para mostrar al user).
 * - `cuil`: CUIL del user (para pre-popular form de re-link).
 *
 * Reactivo a `pjnSync.*` (slice Redux): cuando el listener global detecta un WS
 * de error e invalida el cache, este hook re-fetcha y actualiza todos los
 * suscriptores.
 */
export function usePjnCredentialError() {
	const [state, setState] = useState<CacheValue>(() => cache ?? EMPTY);
	const pjnSyncTick = useSelector(
		(s: any) => `${s.pjnSync?.phase ?? ""}|${s.pjnSync?.hasError ? "err" : "ok"}|${s.pjnSync?.completedAt ?? ""}|${s.pjnSync?.credentialsChangedAt ?? ""}`,
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
	}, [pjnSyncTick]);

	return state;
}

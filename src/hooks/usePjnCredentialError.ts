import { useEffect, useState } from "react";
import { useSelector } from "react-redux";

import pjnCredentialsService from "api/pjnCredentials";
import { getPjnStatusReason, isPjnCredentialBroken, pjnStatusNotice, PjnStatusReason } from "utils/pjnBindingState";

/**
 * Cache singleton: si N componentes (cards de folder, detail) llaman al hook,
 * solo el primer fetch llega al server. Los demás esperan al mismo Promise
 * o leen del cache.
 *
 * Espejo de useScbaCredentialError. Mantener simétrico — si se modifica algo
 * acá, replicar allá.
 */
type CacheValue = {
	hasError: boolean;
	errorMessage: string;
	cuil: string;
	statusReason: PjnStatusReason | null;
	/**
	 * La credencial requiere acción del usuario (el portal rechazó la contraseña
	 * de forma confirmada). Espejo `pjnCredentialState` del hub (verdad en
	 * pjn-credentials); un server viejo no lo manda y se aproxima con
	 * `statusReason` ∈ {credential_invalid, required_action}. 2026-09-28.
	 */
	requiresAction: boolean;
	/** Desde cuándo (ISO) requiere acción; null si no se sabe. */
	requiresActionSince: string | null;
	/** Aviso cerrado por el usuario para esta caída (todas las carpetas o algunas); null = mostrar. */
	bannerDismiss: { global: boolean; folderIds: string[] } | null;
};
let cache: CacheValue | null = null;
let cacheTs = 0;
let pendingFetch: Promise<CacheValue> | null = null;

const CACHE_TTL_MS = 30000;
const EMPTY: CacheValue = {
	hasError: false,
	errorMessage: "",
	cuil: "",
	statusReason: null,
	requiresAction: false,
	requiresActionSince: null,
	bannerDismiss: null,
};
// Suscriptores montados: el cierre del aviso actualiza a todos sin refetch.
const listeners = new Set<(v: CacheValue) => void>();

async function fetchOnce(): Promise<CacheValue> {
	if (pendingFetch) return pendingFetch;
	pendingFetch = pjnCredentialsService
		.getCredentialsStatus()
		.then((res: any) => {
			// hasError = la cred necesita acción del user (contraseña rechazada o
			// acción pendiente en el portal): `isPjnCredentialBroken` sobre el
			// `statusReason` del hub (con fallback local). Copy para el usuario vía
			// `pjnStatusNotice`, no el `lastError.message` crudo del worker.
			const data = res?.success && res?.hasCredentials ? res.data : null;
			const hasError = isPjnCredentialBroken(data);
			const statusReason = getPjnStatusReason(data);
			const errorMessage = pjnStatusNotice(data) || data?.lastError?.message || "";
			const cuil = data?.cuil || "";
			// `requiresAction` / `requiresActionSince` los expone el hub desde
			// usuarios.pjnCredentialState (getCredentialsStatus; también viene el
			// objeto `pjnCredentialState`). Si no vienen (server viejo), fallback al
			// statusReason.
			const mirrorObj = data?.pjnCredentialState;
			const mirrored = typeof data?.requiresAction === "boolean" || (mirrorObj && typeof mirrorObj.requiresAction === "boolean");
			const requiresAction = mirrored ? data?.requiresAction === true || mirrorObj?.requiresAction === true : hasError;
			const requiresActionSince = requiresAction
				? data?.requiresActionSince || mirrorObj?.since || data?.credentialInvalidAt || null
				: null;
			const bannerDismiss =
				requiresAction && data?.bannerDismiss
					? { global: data.bannerDismiss.global === true, folderIds: data.bannerDismiss.folderIds || [] }
					: null;
			cache = { hasError, errorMessage, cuil, statusReason, requiresAction, requiresActionSince, bannerDismiss };
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
/**
 * Cierra el aviso de credencial (persistido en el hub, atado a la caída actual) y actualiza a
 * todos los componentes montados.
 */
export async function dismissPjnCredBanner(scope: "global" | "folder", folderId?: string): Promise<boolean> {
	try {
		const r = await pjnCredentialsService.dismissCredentialBanner(scope, folderId);
		if (!r?.success) return false;
		const base = cache ?? EMPTY;
		cache = { ...base, bannerDismiss: r.bannerDismiss ?? { global: scope === "global", folderIds: folderId ? [folderId] : [] } };
		cacheTs = Date.now();
		listeners.forEach((fn) => fn(cache as CacheValue));
		return true;
	} catch {
		return false;
	}
}

/** ¿El usuario cerró el aviso para esta carpeta (o para todas)? */
export function pjnCredBannerCerrado(state: CacheValue, folderId?: string): boolean {
	const d = state.bannerDismiss;
	if (!d) return false;
	return d.global || (!!folderId && d.folderIds.includes(folderId));
}

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
		(s: any) =>
			`${s.pjnSync?.phase ?? ""}|${s.pjnSync?.hasError ? "err" : "ok"}|${s.pjnSync?.completedAt ?? ""}|${
				s.pjnSync?.credentialsChangedAt ?? ""
			}`,
	);

	useEffect(() => {
		listeners.add(setState);
		return () => {
			listeners.delete(setState);
		};
	}, []);

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

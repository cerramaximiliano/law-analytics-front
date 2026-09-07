/**
 * Estado de vinculación SCBA de una carpeta y estado de la credencial SCBA del
 * usuario — una sola fuente de verdad para la lista (folders.tsx), la fila
 * expandida (FolderView.tsx), el detalle (details.tsx), la tarjeta de
 * Integraciones (ScbaAccountConnect.tsx), el widget de cuentas
 * (FoldersSyncBadges) y el onboarding (S15, 2026-09-07). Misma forma que
 * `pjnBindingState`. Antes cada vista recalculaba los predicados, redactaba su
 * propio copy ("Perfil → Cuentas Judiciales" cuando el tab se llama
 * "Integraciones"), las pills SCBA no eran clickeables y había tres criterios
 * distintos de "cuenta conectada".
 *
 * Prioridad: unlinked > list_removed > cred_error > ok.
 *
 * `cred_error` no sale de la carpeta sino de la credencial SCBA del usuario
 * (`useScbaCredentialError`): aplica a todas sus carpetas de Mis Causas
 * (source scba-login) mientras ningún estado propio de la carpeta mande.
 */

export type ScbaBindingState = "unlinked" | "list_removed" | "cred_error" | "ok";

export interface ScbaFolderLike {
	scba?: boolean;
	source?: string;
	previousSyncSource?: string | null;
	listRemoved?: boolean;
	listRemovedSource?: string | null;
}

export const isScbaFromMisCausas = (f: ScbaFolderLike): boolean => f.scba === true && f.source === "scba-login";

/** El list-audit / sync dejó de ver la causa en "Mis Causas" del portal. */
export const isScbaListRemoved = (f: ScbaFolderLike): boolean =>
	isScbaFromMisCausas(f) && f.listRemoved === true && f.listRemovedSource === "scba";

/** Desvinculada en modo "keep": conserva `previousSyncSource` y perdió el flag `scba`. */
export const isScbaUnlinked = (f: ScbaFolderLike): boolean => f.scba !== true && f.previousSyncSource === "scba";

export interface ScbaBindingOpts {
	/** Credencial SCBA del usuario en error o expirada (`useScbaCredentialError().hasError`). */
	credError?: boolean;
}

/** Tab SCBA de Integraciones (`TabPjnIntegration` lee `view`). */
export const SCBA_PROFILE_PATH = "/apps/profiles/account/pjn?view=scba";

export function getScbaBindingState(f: ScbaFolderLike | null | undefined, opts: ScbaBindingOpts = {}): ScbaBindingState | null {
	if (!f) return null;
	if (isScbaUnlinked(f)) return "unlinked";
	if (f.scba !== true) return null;
	if (isScbaListRemoved(f)) return "list_removed";
	if (opts.credError && isScbaFromMisCausas(f)) return "cred_error";
	return "ok";
}

/** Etiqueta corta del pill (fila expandida y detalle). */
export const SCBA_BINDING_LABEL: Record<ScbaBindingState, string> = {
	unlinked: "Sincronización pausada (era SCBA)",
	list_removed: "SCBA — Ya no en la lista",
	cred_error: "SCBA — Sincronización pausada",
	ok: "Vinculado con SCBA",
};

/** Texto largo (tooltip). Misma redacción en todas las vistas. */
export const SCBA_BINDING_COPY: Record<ScbaBindingState, string> = {
	unlinked:
		"Esta carpeta fue desvinculada de SCBA. Conserva el histórico de movimientos pero no recibe actualizaciones. Para reanudar la sincronización, vinculá tu cuenta desde Integraciones → SCBA.",
	list_removed:
		"Esta causa ya no aparece en tu lista de Mis Causas del portal SCBA. Puede haber sido archivada o desvinculada por el tribunal.",
	cred_error:
		"SCBA — Sincronización pausada: el portal rechazó tus credenciales. Actualizá tu contraseña desde Integraciones → SCBA para reanudar la sincronización.",
	ok: "Causa vinculada a SCBA",
};

// ==============================|| CREDENCIAL ||============================== //

/**
 * Motivo derivado por el hub (`statusReason` de GET /api/scba-credentials/status,
 * S10). Un server viejo no lo manda: `deriveStatusReasonFallback` lo aproxima.
 */
export type ScbaStatusReason =
	| "credential_invalid"
	| "sync_error"
	| "user_inactive"
	| "unlinked"
	| "rejection_pending"
	| "session_conflict"
	| "portal_unstable"
	| "syncing"
	| "never_synced"
	| "ok";

export interface ScbaCredentialStatusLike {
	enabled?: boolean;
	isExpired?: boolean;
	syncStatus?: string;
	statusReason?: ScbaStatusReason | null;
	lastError?: { code?: string | null; message?: string | null } | null;
	rejectionProgress?: { count: number; required: number } | null;
}

/** Aproximación local de `statusReason` para respuestas sin el campo. */
export function deriveStatusReasonFallback(d: ScbaCredentialStatusLike): ScbaStatusReason {
	const code = d.lastError?.code || null;
	if (d.isExpired === true || code === "CREDENTIAL_INVALID") return "credential_invalid";
	if (d.syncStatus === "error") return d.enabled === false && !code ? "credential_invalid" : "sync_error";
	if (d.enabled === false) return "unlinked";
	if (code === "CREDENTIAL_REJECTED") return "rejection_pending";
	if (code === "SESSION_CONFLICT") return "session_conflict";
	if (code === "NETWORK_ERROR" || code === "UNKNOWN_ERROR") return "portal_unstable";
	if (d.syncStatus === "pending" || d.syncStatus === "in_progress") return "syncing";
	if (d.syncStatus === "completed") return "ok";
	return "never_synced";
}

export const getScbaStatusReason = (d: ScbaCredentialStatusLike | null | undefined): ScbaStatusReason | null =>
	d ? d.statusReason || deriveStatusReasonFallback(d) : null;

/**
 * Único criterio de "cuenta SCBA conectada": existe, habilitada, no expirada y
 * sin error de sync. Una cuenta que está sincronizando o con un rechazo
 * pendiente sigue conectada (el worker reintenta solo).
 */
export const isScbaConnected = (d: ScbaCredentialStatusLike | null | undefined): boolean =>
	!!d && d.enabled !== false && d.isExpired !== true && d.syncStatus !== "error";

/**
 * La cred quedó en `pending` sin sync en curso: el worker difirió el reintento
 * (rechazo pendiente de confirmación, sesión ajena o portal caído — fase WS
 * `deferred`, S7). La card no debe mostrar "Sincronizando" ni pollear cada 3 s
 * durante horas: muestra el aviso del motivo y espera al próximo ciclo.
 */
export const isScbaRetryDeferred = (d: ScbaCredentialStatusLike | null | undefined): boolean => {
	if (!d || d.syncStatus !== "pending") return false;
	const reason = getScbaStatusReason(d);
	return reason === "rejection_pending" || reason === "session_conflict" || reason === "portal_unstable";
};

/** La credencial necesita acción del usuario (actualizar contraseña). */
export const isScbaCredentialBroken = (d: ScbaCredentialStatusLike | null | undefined): boolean =>
	!!d && (d.syncStatus === "error" || d.isExpired === true);

/**
 * Copy para el usuario según el motivo. Reemplaza el `lastError.message` crudo
 * del worker (que habla del portal, no del usuario). Null cuando no hay nada
 * que avisar.
 */
export function scbaStatusNotice(d: ScbaCredentialStatusLike | null | undefined): string | null {
	const reason = getScbaStatusReason(d);
	switch (reason) {
		case "credential_invalid":
			return "El Portal SCBA rechazó tus credenciales y la sincronización quedó pausada. Actualizá tu contraseña para reanudarla.";
		case "sync_error":
			return "Pudimos ingresar al Portal SCBA pero falló la lectura de tus causas. Vamos a reintentar; si persiste, re-sincronizá o actualizá tu contraseña.";
		case "user_inactive":
			return "La sincronización está pausada porque tu cuenta figura inactiva. Se reanuda sola al reactivarla.";
		case "rejection_pending": {
			const p = d?.rejectionProgress;
			const progress = p && p.required > 1 ? ` (${p.count} de ${p.required} rechazos antes de pausar)` : "";
			return `El Portal SCBA rechazó el último intento de acceso${progress}. Vamos a reintentar automáticamente; si cambiaste tu contraseña, actualizala acá.`;
		}
		case "session_conflict":
			return "El último acceso coincidió con otra sesión abierta en el Portal SCBA. Se reintenta automáticamente.";
		case "portal_unstable":
			return "El Portal SCBA no respondió en el último intento. Se reintenta automáticamente cuando vuelva a estar disponible.";
		default:
			return null;
	}
}

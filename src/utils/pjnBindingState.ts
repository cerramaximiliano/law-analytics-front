/**
 * Estado de vinculación PJN de una carpeta — una sola fuente de verdad para la
 * lista (folders.tsx), la fila expandida (FolderView.tsx) y el detalle
 * (details.tsx). Antes cada vista recalculaba los predicados y redactaba su
 * propio copy, y la misma carpeta se describía distinto según dónde se mirara
 * (F10, 2026-09-06): "Asociación fallida" / "Causa inválida" / gate failed, o
 * "reservada" en rojo en la lista y "con acceso" en verde en el detalle.
 *
 * Prioridad (de más a menos dominante): revoked > reserved_covered > reserved >
 * pending_selection > list_removed > failed > pending > cred_error > ok. El gate
 * del detalle usa el mismo orden.
 *
 * `cred_error` (F14, 2026-09-06) no sale de la carpeta sino de la credencial PJN
 * del usuario (`usePjnCredentialError`): la lista ya lo mostraba y la fila/detalle
 * decían "Vinculado con PJN" en verde. Solo aplica a carpetas de Mis Causas
 * (source pjn-login) cuando ningún estado propio de la carpeta manda — la causa
 * pública sigue actualizándose por scraping, lo que se pausa es Mis Causas.
 */

export type PjnBindingState =
	| "revoked"
	| "reserved_covered"
	| "reserved"
	| "list_removed"
	| "pending_selection"
	| "failed"
	| "pending"
	| "cred_error"
	| "ok";

export interface PjnFolderLike {
	pjn?: boolean;
	source?: string;
	causaIsPrivate?: boolean;
	causaCredentialCovered?: boolean;
	listRemoved?: boolean;
	listRemovedSource?: string | null;
	pjnNotFound?: boolean;
	causaAssociationStatus?: string | null;
	causaVerified?: boolean;
	causaIsValid?: boolean;
	causaAssociationError?: string | null;
}

export const isPjnFromMisCausas = (f: PjnFolderLike): boolean => f.pjn === true && f.source === "pjn-login";

/** Causa privada cubierta por la credencial del usuario: ve todo, solo se le avisa. */
export const isPjnReservedCovered = (f: PjnFolderLike): boolean =>
	f.pjn === true && f.causaIsPrivate === true && f.causaCredentialCovered === true;

/** Carpeta de Mis Causas cuya credencial ya no cubre la causa reservada (403 CAUSA_RESERVED). */
export const isPjnRevoked = (f: PjnFolderLike): boolean => f.pjn === true && f.source === "pjn-login" && f.causaCredentialCovered === false;

/**
 * Carpeta individual (no pjn-login) sobre una causa reservada sin cobertura:
 * marcada privada por el privacy-checker / handoff del verify, o con
 * causaCredentialCovered=false calculado por pjn-mis-causas.
 */
export const isPjnPrivateRestricted = (f: PjnFolderLike): boolean =>
	f.pjn === true &&
	f.source !== "pjn-login" &&
	!isPjnReservedCovered(f) &&
	(f.causaIsPrivate === true || f.causaCredentialCovered === false);

export const isPjnListRemoved = (f: PjnFolderLike): boolean =>
	isPjnFromMisCausas(f) && ((f.listRemoved === true && f.listRemovedSource === "pjn") || f.pjnNotFound === true);

/** Asociación fallida: status del hub/worker, o verificada e inválida (misma cosa desde F7). */
export const isPjnFailed = (f: PjnFolderLike): boolean =>
	f.causaAssociationStatus === "failed" || (f.causaVerified === true && f.causaIsValid === false);

export const isPjnPending = (f: PjnFolderLike): boolean =>
	!isPjnFailed(f) && (f.causaAssociationStatus === "pending" || f.causaVerified !== true);

export interface PjnBindingOpts {
	/** Credencial PJN del usuario en error (CREDENTIAL_INVALID / REQUIRED_ACTION). */
	credError?: boolean;
}

export const PJN_PROFILE_PATH = "/apps/profiles/account/pjn";

export function getPjnBindingState(f: PjnFolderLike | null | undefined, opts: PjnBindingOpts = {}): PjnBindingState | null {
	if (!f || f.pjn !== true) return null;
	if (isPjnRevoked(f)) return "revoked";
	if (isPjnReservedCovered(f)) return "reserved_covered";
	if (isPjnPrivateRestricted(f)) return "reserved";
	if (f.causaAssociationStatus === "pending_selection") return "pending_selection";
	if (isPjnListRemoved(f)) return "list_removed";
	if (isPjnFailed(f)) return "failed";
	if (isPjnPending(f)) return "pending";
	if (opts.credError && isPjnFromMisCausas(f)) return "cred_error";
	return "ok";
}

/** Etiqueta corta del pill (fila expandida y detalle). */
export const PJN_BINDING_LABEL: Record<PjnBindingState, string> = {
	revoked: "PJN — Acceso restringido",
	reserved_covered: "PJN — Reservada (con acceso)",
	reserved: "PJN — Causa reservada",
	list_removed: "PJN — Ya no en la lista",
	pending_selection: "PJN — Seleccionar expediente",
	failed: "PJN — Asociación fallida",
	pending: "PJN — Pendiente de verificación",
	cred_error: "PJN — Sincronización pausada",
	ok: "Vinculado con PJN",
};

/** Texto largo (tooltip / gate). Misma redacción en las tres vistas. */
export const PJN_BINDING_COPY: Record<PjnBindingState, string> = {
	revoked:
		"Acceso restringido — el tribunal reservó esta causa y ya no figura entre las asignadas a tu credencial PJN. El acceso se restablece solo si vuelve a aparecer en tu listado de Mis Causas.",
	reserved_covered: "Causa reservada por el tribunal — accedés a sus movimientos a través de tu credencial PJN vinculada.",
	reserved: "Causa reservada — el tribunal restringió la consulta web pública. El sistema sigue verificando si vuelve a estar accesible.",
	list_removed:
		"Esta causa ya no aparece en tu lista de Mis Causas del portal PJN. Puede haber sido archivada o desvinculada por el tribunal.",
	pending_selection: "Se encontraron múltiples expedientes — hacé clic para seleccionar.",
	failed: "No se pudo vincular la causa — verificá los datos ingresados.",
	pending: "Pendiente de verificación — el sistema todavía no confirmó la causa en el Poder Judicial.",
	cred_error:
		"PJN — Sincronización pausada: el portal rechazó tus credenciales. Actualizá tu contraseña desde Integraciones → PJN para reanudar la sincronización.",
	ok: "Causa válida",
};

/** Tooltip de "fallida" con el motivo real del portal si lo hay. */
export const pjnFailedCopy = (f: PjnFolderLike): string =>
	f.causaAssociationError && f.causaAssociationError !== "Error desconocido"
		? `No se pudo vincular la causa — ${f.causaAssociationError}`
		: PJN_BINDING_COPY.failed;

// ==============================|| CREDENCIAL ||============================== //

/**
 * Motivo derivado por el hub (`statusReason` de GET /api/pjn-credentials,
 * services/pjnCredentialStatusService.js, 2026-09-08). Un server viejo no lo
 * manda: `derivePjnStatusReasonFallback` lo aproxima con los campos crudos.
 * Espejo de `scbaBindingState.ts`.
 */
export type PjnStatusReason =
	| "credential_invalid"
	| "required_action"
	| "rejection_pending"
	| "unlinked"
	| "portal_maintenance"
	| "portal_unstable"
	| "sync_error"
	| "syncing"
	| "never_synced"
	| "ok";

export interface PjnCredentialStatusLike {
	enabled?: boolean;
	verified?: boolean;
	isValid?: boolean;
	credentialInvalid?: boolean;
	explicitRejections?: number;
	syncStatus?: string;
	statusReason?: PjnStatusReason | null;
	lastError?: { code?: string | null; message?: string | null } | null;
	rejectionProgress?: { count: number; required: number } | null;
}

const PJN_PORTAL_CODES = ["PORTAL_TIMEOUT", "NETWORK_ERROR", "PORTAL_ERROR", "BROWSER_ERROR", "LOGIN_SERVICE_ERROR"];

export function derivePjnStatusReasonFallback(d: PjnCredentialStatusLike): PjnStatusReason {
	const code = d.lastError?.code || null;
	const enabled = d.enabled !== false;
	if (d.credentialInvalid === true) return "credential_invalid";
	if (code === "REQUIRED_ACTION") return "required_action";
	if (code === "CREDENTIAL_INVALID") return (d.explicitRejections || 0) > 0 ? "rejection_pending" : "credential_invalid";
	if (!enabled && d.syncStatus !== "error") return "unlinked";
	if (code === "PJN_MAINTENANCE") return "portal_maintenance";
	if (code && PJN_PORTAL_CODES.includes(code)) return "portal_unstable";
	if (d.syncStatus === "error") return enabled ? "sync_error" : "credential_invalid";
	if (d.syncStatus === "pending" || d.syncStatus === "in_progress") return "syncing";
	if (d.syncStatus === "never_synced" || !d.syncStatus) return "never_synced";
	return "ok";
}

export const getPjnStatusReason = (d: PjnCredentialStatusLike | null | undefined): PjnStatusReason | null =>
	d ? d.statusReason || derivePjnStatusReasonFallback(d) : null;

/** La credencial necesita acción del usuario (contraseña o acción en el portal). */
export const isPjnCredentialBroken = (d: PjnCredentialStatusLike | null | undefined): boolean => {
	const r = getPjnStatusReason(d);
	return r === "credential_invalid" || r === "required_action";
};

/**
 * Único criterio de "cuenta PJN conectada": vinculada, habilitada y sin acción
 * pendiente del usuario. Un error transitorio del portal o un rechazo aún no
 * confirmado NO la desconecta (el worker reintenta solo).
 */
export const isPjnConnected = (d: PjnCredentialStatusLike | null | undefined): boolean =>
	!!d && d.enabled !== false && !isPjnCredentialBroken(d);

/**
 * Copy para el usuario según el motivo. Reemplaza el `lastError.message` crudo
 * del worker (que habla del portal, no del usuario). Null cuando no hay nada
 * que avisar.
 */
export function pjnStatusNotice(d: PjnCredentialStatusLike | null | undefined): string | null {
	const reason = getPjnStatusReason(d);
	switch (reason) {
		case "credential_invalid":
			return d?.enabled === false
				? "El portal del PJN rechazó tu contraseña varias veces y la sincronización de Mis Causas quedó pausada. Actualizá tu contraseña acá para reanudarla."
				: "Contraseña del PJN incorrecta. Si la cambiaste en el portal, actualizala acá para reanudar la sincronización.";
		case "required_action":
			return "El portal del PJN te pide completar una acción en tu cuenta (cambio de contraseña obligatorio, 2FA o verificación de email). Resolvela ingresando al portal y volvé a intentar la sincronización.";
		case "rejection_pending": {
			const p = d?.rejectionProgress;
			const progress = p && p.required > 1 ? ` (${p.count} de ${p.required} rechazos antes de pausar)` : "";
			return `El portal del PJN rechazó el último acceso${progress}. Vamos a reintentar automáticamente; si cambiaste tu contraseña, actualizala acá.`;
		}
		case "portal_maintenance":
			return "El portal del PJN está en mantenimiento. Retomamos la sincronización automáticamente cuando vuelva.";
		case "portal_unstable":
			return "El portal del PJN no respondió en el último intento. Tu cuenta sigue vinculada; se reintenta automáticamente.";
		case "sync_error":
			return "Pudimos ingresar al portal del PJN pero falló la lectura de tus causas. Vamos a reintentar; si persiste, re-sincronizá.";
		case "unlinked":
			return "Desvinculaste tu cuenta del PJN. Volvé a vincularla para reanudar la sincronización.";
		default:
			return null;
	}
}

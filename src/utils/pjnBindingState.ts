/**
 * Estado de vinculación PJN de una carpeta — una sola fuente de verdad para la
 * lista (folders.tsx), la fila expandida (FolderView.tsx) y el detalle
 * (details.tsx). Antes cada vista recalculaba los predicados y redactaba su
 * propio copy, y la misma carpeta se describía distinto según dónde se mirara
 * (F10, 2026-09-06): "Asociación fallida" / "Causa inválida" / gate failed, o
 * "reservada" en rojo en la lista y "con acceso" en verde en el detalle.
 *
 * Prioridad entre los estados propios de la carpeta (de más a menos dominante):
 * revoked > reserved_covered > reserved > pending_selection > list_removed >
 * failed > pending > ok. El gate del detalle usa el mismo orden.
 *
 * `cred_error` (F14, 2026-09-06) no sale de la carpeta sino de la credencial PJN
 * del usuario (`usePjnCredentialError`). Desde 2026-09-28 es transversal: cuando
 * el portal rechazó la contraseña de forma confirmada, aplica a TODAS las carpetas
 * PJN del usuario (no solo a las de Mis Causas) y gana sobre revoked / reserved /
 * list_removed, pero cede ante pending_selection, failed y pending (esos tienen
 * una acción propia más urgente, y una carpeta no verificada no puede decir
 * "se sigue actualizando"). El copy distingue pública (se sigue
 * actualizando por scraping, se avisan sus novedades) de reservada (no se puede
 * actualizar sin credencial) — ver `pjnCredErrorCopy`.
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
	/** Corte de acceso: la credencial cubría la causa reservada y cayó (ver Folder.causaAccessCutoffAt). */
	causaAccessCutoffAt?: string | null;
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

/**
 * Causa que depende de la credencial para actualizarse: reservada por el
 * tribunal (privada) o sin cobertura de la credencial. Las demás son públicas y
 * las sigue actualizando el scraping aunque la credencial esté rechazada.
 */
export const isPjnCredDependent = (f: PjnFolderLike): boolean => f.causaIsPrivate === true || f.causaCredentialCovered === false;

export function getPjnBindingState(f: PjnFolderLike | null | undefined, opts: PjnBindingOpts = {}): PjnBindingState | null {
	if (!f || f.pjn !== true) return null;
	// Credencial rechazada: transversal a todas las carpetas PJN del usuario.
	// Cede solo ante los estados con acción propia (elegir expediente / fallida).
	if (opts.credError && f.causaAssociationStatus !== "pending_selection" && !isPjnFailed(f) && !isPjnPending(f)) return "cred_error";
	if (isPjnRevoked(f)) return "revoked";
	if (isPjnReservedCovered(f)) return "reserved_covered";
	if (isPjnPrivateRestricted(f)) return "reserved";
	if (f.causaAssociationStatus === "pending_selection") return "pending_selection";
	if (isPjnListRemoved(f)) return "list_removed";
	if (isPjnFailed(f)) return "failed";
	if (isPjnPending(f)) return "pending";
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
	cred_error: "PJN — Credencial requiere acción",
	ok: "Vinculado con PJN",
};

/** Credencial rechazada, causa pública: sigue actualizándose por scraping. */
export const PJN_CRED_ERROR_PUBLIC_COPY =
	"El portal rechazó tu credencial PJN. Esta causa es pública: se sigue actualizando y te avisamos sus novedades. Actualizá la contraseña en Integraciones → PJN para recuperar el acceso a tus causas reservadas.";

/** Credencial rechazada, causa reservada: no se puede actualizar sin credencial. */
export const PJN_CRED_ERROR_RESERVED_COPY =
	"El portal rechazó tu credencial PJN y esta causa es reservada: no se puede actualizar hasta que renueves la contraseña en Integraciones → PJN.";

/** Banner (lista de carpetas y detalle) mientras la credencial requiera acción. */
export const PJN_CRED_ERROR_BANNER_COPY =
	"Tu credencial PJN requiere acción: el portal rechazó tu contraseña. Te seguimos avisando las novedades de tus causas públicas; las reservadas no se actualizan hasta que la renueves.";

/** Versión corta del banner para pantallas chicas. */
export const PJN_CRED_ERROR_BANNER_SHORT_COPY =
	"Tu credencial PJN requiere acción.";

/** Frase que agrega la nota de estado (Integraciones → PJN) cuando la credencial requiere acción. */
export const PJN_CRED_ERROR_NOTICE_SUFFIX =
	"Te seguimos avisando las novedades de tus causas públicas; las reservadas no se actualizan hasta que la renueves.";
export const PJN_CRED_ERROR_NOTICE_SUFFIX_ACTION =
	"Te seguimos avisando las novedades de tus causas públicas; las reservadas no se actualizan hasta que resuelvas la acción pendiente.";

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
	cred_error: PJN_CRED_ERROR_BANNER_COPY,
	ok: "Causa válida",
};

/** Tooltip de "fallida" con el motivo real del portal si lo hay. */
export const pjnFailedCopy = (f: PjnFolderLike): string =>
	f.causaAssociationError && f.causaAssociationError !== "Error desconocido"
		? `No se pudo vincular la causa — ${f.causaAssociationError}`
		: PJN_BINDING_COPY.failed;

// ==============================|| CORTE DE ACCESO (2026-09-28) ||============================== //

/**
 * Fecha del corte en dd/mm/aaaa (huso del navegador: el cutoff es un instante
 * real — cuándo cayó la credencial —, no una fecha-calendario a medianoche UTC
 * como las de los movimientos). Null si no hay cutoff o no parsea.
 */
export function formatPjnAccessCutoff(cutoff: string | Date | null | undefined): string | null {
	if (!cutoff) return null;
	const d = cutoff instanceof Date ? cutoff : new Date(cutoff);
	if (Number.isNaN(d.getTime())) return null;
	return d.toLocaleDateString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric" });
}

/** CTA del aviso de corte (viewer de movimientos) — lleva a PJN_PROFILE_PATH. */
export const PJN_ACCESS_CUTOFF_CTA_LABEL = "Actualizar credencial";

/**
 * Aviso arriba de la lista de movimientos cuando el hub sirve solo hasta el
 * corte: "Mostrando movimientos hasta el {fecha}: renová tu credencial PJN para
 * ver los nuevos". Null si no hay cutoff válido (no se muestra nada).
 */
export function pjnAccessCutoffNoticeCopy(cutoff: string | Date | null | undefined): string | null {
	const fecha = formatPjnAccessCutoff(cutoff);
	return fecha ? `Mostrando movimientos hasta el ${fecha}: renová tu credencial PJN para ver los nuevos.` : null;
}

/** Credencial rechazada, causa reservada CON corte: ve lo que su credencial trajo hasta esa fecha. */
export const pjnCredErrorReservedCutoffCopy = (fecha: string): string =>
	`El portal rechazó tu credencial PJN y esta causa es reservada: ves lo actualizado hasta el ${fecha}. No se actualiza ni te avisamos novedades hasta que renueves la contraseña en Integraciones → PJN.`;

/**
 * Tooltip de "cred_error" según la carpeta: pública (sigue) o reservada (no se
 * actualiza). Si la reservada tiene corte de acceso, menciona hasta qué fecha
 * ve movimientos.
 */
export const pjnCredErrorCopy = (f: PjnFolderLike): string => {
	if (!isPjnCredDependent(f)) return PJN_CRED_ERROR_PUBLIC_COPY;
	const fecha = formatPjnAccessCutoff(f.causaAccessCutoffAt);
	return fecha ? pjnCredErrorReservedCutoffCopy(fecha) : PJN_CRED_ERROR_RESERVED_COPY;
};

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
		// Credencial que requiere acción (2026-09-28): las notificaciones NO se
		// suspenden — las causas públicas siguen; las reservadas esperan la contraseña.
		case "credential_invalid":
			return (
				(d?.enabled === false
					? "El portal del PJN rechazó tu contraseña varias veces y la sincronización de Mis Causas quedó pausada. Actualizá tu contraseña acá para reanudarla."
					: "Contraseña del PJN incorrecta. Si la cambiaste en el portal, actualizala acá para reanudar la sincronización.") +
				" " +
				PJN_CRED_ERROR_NOTICE_SUFFIX
			);
		case "required_action":
			return (
				"El portal del PJN te pide completar una acción en tu cuenta (cambio de contraseña obligatorio, 2FA o verificación de email). Resolvela ingresando al portal y volvé a intentar la sincronización. " +
				PJN_CRED_ERROR_NOTICE_SUFFIX_ACTION
			);
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

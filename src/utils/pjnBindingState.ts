/**
 * Estado de vinculación PJN de una carpeta — una sola fuente de verdad para la
 * lista (folders.tsx), la fila expandida (FolderView.tsx) y el detalle
 * (details.tsx). Antes cada vista recalculaba los predicados y redactaba su
 * propio copy, y la misma carpeta se describía distinto según dónde se mirara
 * (F10, 2026-09-06): "Asociación fallida" / "Causa inválida" / gate failed, o
 * "reservada" en rojo en la lista y "con acceso" en verde en el detalle.
 *
 * Prioridad (de más a menos dominante): revoked > reserved_covered > reserved >
 * list_removed > pending_selection > failed > pending > ok. El gate del detalle
 * usa el mismo orden.
 */

export type PjnBindingState =
	| "revoked"
	| "reserved_covered"
	| "reserved"
	| "list_removed"
	| "pending_selection"
	| "failed"
	| "pending"
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

export function getPjnBindingState(f: PjnFolderLike | null | undefined): PjnBindingState | null {
	if (!f || f.pjn !== true) return null;
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
	ok: "Causa válida",
};

/** Tooltip de "fallida" con el motivo real del portal si lo hay. */
export const pjnFailedCopy = (f: PjnFolderLike): string =>
	f.causaAssociationError && f.causaAssociationError !== "Error desconocido"
		? `No se pudo vincular la causa — ${f.causaAssociationError}`
		: PJN_BINDING_COPY.failed;

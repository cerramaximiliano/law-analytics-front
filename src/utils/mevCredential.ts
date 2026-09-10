// Estado de la credencial MEV a nivel carpeta (folder.mevCredentialStatus).
// Fuente de verdad compartida por el listado (folders.tsx), el detalle (details.tsx)
// y el header (FolderView.tsx) para que las tres vistas cuenten la misma historia.

export type MevCredentialIssue = "missing" | "invalid" | "expired" | "disabled";

/** Estados que requieren acción del usuario sobre su credencial. */
export const MEV_CRED_ISSUE_STATUSES: MevCredentialIssue[] = ["missing", "invalid", "expired", "disabled"];

/**
 * Subconjunto que proviene de un login fallido del worker. En estos casos el worker
 * también escribe causaIsValid=false / causaAssociationStatus="failed" sobre la carpeta,
 * pero el problema real es la credencial, no la causa: la UI debe priorizar el aviso de
 * credencial y no bloquear el detalle con "Causa inválida" / "Asociación fallida".
 * "missing" queda afuera: el diagnóstico de la causa es anterior a quitar la credencial.
 */
export const MEV_CRED_LOGIN_FAILURES: MevCredentialIssue[] = ["invalid", "expired", "disabled"];

export const MEV_CRED_LABEL: Record<MevCredentialIssue, string> = {
	missing: "Credencial requerida",
	invalid: "Credencial inválida",
	expired: "Contraseña expirada",
	disabled: "Credencial desactivada",
};

export const MEV_CRED_MESSAGE: Record<MevCredentialIssue, string> = {
	missing: "Falta cargar tu credencial del portal MEV para consultar esta causa. Cargala desde Integraciones → MEV.",
	invalid:
		"El portal MEV rechazó tu usuario o contraseña. Revisalos y volvé a cargarlos desde Integraciones → MEV para reanudar la consulta de tus causas.",
	expired:
		"El portal MEV te pide cambiar la contraseña: la actual expiró. Cambiala en el portal y cargá la nueva desde Integraciones → MEV.",
	disabled:
		"Desactivamos tu credencial del MEV después de varios rechazos seguidos, para no bloquear tu usuario en el portal. Cargala de nuevo desde Integraciones → MEV.",
};

/** Nombre placeholder que escribe el hub/worker cuando la causa resultó inválida (folderController INVALID_FOLDER_NAME). */
export const INVALID_FOLDER_NAME = "Causa inválida o no accesible";

/** Ruta del perfil donde el usuario gestiona su credencial MEV. */
export const MEV_PROFILE_PATH = "/apps/profiles/account/pjn?view=mev";

type MevFolderLike = { mev?: boolean; mevCredentialStatus?: string | null } | null | undefined;

/** Devuelve el problema de credencial de la carpeta, o null si no aplica (no MEV / credencial OK). */
export function mevCredIssue(folder: MevFolderLike): MevCredentialIssue | null {
	if (!folder || folder.mev !== true) return null;
	const status = folder.mevCredentialStatus as MevCredentialIssue | undefined;
	return status && MEV_CRED_ISSUE_STATUSES.includes(status) ? status : null;
}

/**
 * Carpeta con causa fallida cuyo usuario no tiene credencial MEV cargada (MV17, 2026-09-10):
 * el diagnóstico de la causa es real, pero sin credencial no se puede volver a verificar.
 * La lista y el detalle muestran la relación además de "Asociación fallida".
 */
export const MEV_CRED_MISSING_ON_FAILED =
	"Sin credencial MEV cargada: cargala desde Integraciones → MEV para volver a verificar esta causa.";

export function isMevCredMissing(folder: MevFolderLike): boolean {
	return mevCredIssue(folder) === "missing";
}

/** true cuando el estado de la carpeta (failed / causaIsValid=false) es consecuencia de un login fallido. */
export function isMevCredLoginFailure(folder: MevFolderLike): boolean {
	const issue = mevCredIssue(folder);
	return issue !== null && MEV_CRED_LOGIN_FAILURES.includes(issue);
}

// ==============================|| CREDENCIAL DE CUENTA ||============================== //

/**
 * Motivo derivado de la credencial MEV de la cuenta (GET /api/mev-credentials
 * `global`), 2026-09-08. El hub no manda `statusReason`: se deriva acá de
 * enabled / isExpired / verified / lastError.code (mev-workers
 * credentials-resolver: LOGIN_FAILED = rechazo explícito, PASSWORD_EXPIRED,
 * PORTAL_ERROR = transitorio). Espejo de `scbaStatusNotice`.
 */
export type MevStatusReason = "disabled_by_failures" | "password_expired" | "credential_invalid" | "portal_unstable" | "pending" | "ok";

export interface MevCredentialStatusLike {
	enabled?: boolean;
	verified?: boolean;
	isExpired?: boolean;
	lastError?: { code?: string | null; message?: string | null } | null;
}

export function getMevStatusReason(c: MevCredentialStatusLike | null | undefined): MevStatusReason | null {
	if (!c) return null;
	const code = c.lastError?.code || null;
	if (c.enabled === false) return "disabled_by_failures";
	if (c.isExpired === true || code === "PASSWORD_EXPIRED") return "password_expired";
	if (code === "PORTAL_ERROR") return c.verified ? "portal_unstable" : "portal_unstable";
	if (c.verified) return "ok";
	if (c.lastError) return "credential_invalid";
	return "pending";
}

/** La credencial necesita acción del usuario. */
export const isMevCredentialBroken = (c: MevCredentialStatusLike | null | undefined): boolean => {
	const r = getMevStatusReason(c);
	return r === "disabled_by_failures" || r === "password_expired" || r === "credential_invalid";
};

/** Copy para el usuario según el motivo (reemplaza `lastError.message` crudo). Null si no hay nada que avisar. */
export function mevStatusNotice(c: MevCredentialStatusLike | null | undefined): string | null {
	switch (getMevStatusReason(c)) {
		case "disabled_by_failures":
			return MEV_CRED_MESSAGE.disabled;
		case "password_expired":
			return MEV_CRED_MESSAGE.expired;
		case "credential_invalid":
			return MEV_CRED_MESSAGE.invalid;
		case "portal_unstable":
			return "El portal MEV no respondió en el último intento. Tu credencial sigue vinculada; reintentamos automáticamente.";
		case "pending":
			return "Todavía no validamos esta credencial. La probamos automáticamente en la próxima consulta de tus causas.";
		default:
			return null;
	}
}

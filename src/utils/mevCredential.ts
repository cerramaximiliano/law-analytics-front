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
	missing: "Falta cargar tu credencial del portal MEV para consultar esta causa. Cargala en tu perfil → Integraciones → MEV.",
	invalid: "No pudimos iniciar sesión en el portal MEV con tus credenciales. Revisalas y recargalas en tu perfil.",
	expired: "Tu contraseña del portal MEV expiró. Actualizala y recargala en tu perfil.",
	disabled: "Desactivamos tu credencial MEV por fallos repetidos. Verificala y recargala en tu perfil.",
};

/** Ruta del perfil donde el usuario gestiona su credencial MEV. */
export const MEV_PROFILE_PATH = "/apps/profiles/account/pjn?view=mev";

type MevFolderLike = { mev?: boolean; mevCredentialStatus?: string | null } | null | undefined;

/** Devuelve el problema de credencial de la carpeta, o null si no aplica (no MEV / credencial OK). */
export function mevCredIssue(folder: MevFolderLike): MevCredentialIssue | null {
	if (!folder || folder.mev !== true) return null;
	const status = folder.mevCredentialStatus as MevCredentialIssue | undefined;
	return status && MEV_CRED_ISSUE_STATUSES.includes(status) ? status : null;
}

/** true cuando el estado de la carpeta (failed / causaIsValid=false) es consecuencia de un login fallido. */
export function isMevCredLoginFailure(folder: MevFolderLike): boolean {
	const issue = mevCredIssue(folder);
	return issue !== null && MEV_CRED_LOGIN_FAILURES.includes(issue);
}

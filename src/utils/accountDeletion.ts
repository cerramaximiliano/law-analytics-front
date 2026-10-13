// Eliminación de cuenta diferida (30 días). Contrato con el hub:
//   POST /api/auth/account-deletion          { confirm: "ELIMINAR", password? } → { success, deletionScheduledFor }
//   GET  /api/auth/account-deletion          → { requested, deletionScheduledFor? }
//   POST /api/auth/account-deletion/cancel   credenciales del login → misma respuesta que un login
//   Login de una cuenta pendiente            → 403 { code: "ACCOUNT_PENDING_DELETION", deletionScheduledFor, canCancel }

export const ACCOUNT_DELETION_PATH = "/eliminar-cuenta";
export const ACCOUNT_DELETION_CONFIRM_WORD = "ELIMINAR";
export const ACCOUNT_DELETION_GRACE_DAYS = 30;

export interface PendingDeletionInfo {
	deletionScheduledFor?: string;
	canCancel: boolean;
}

// El hub devuelve los códigos de error a veces en `data.code` y a veces en
// `data.error.code` (como ACCOUNT_INACTIVE): aceptamos ambas formas.
export const getPendingDeletion = (err: any): PendingDeletionInfo | null => {
	const data = err?.response?.data;
	if (!data) return null;
	const nested = data.error && typeof data.error === "object" ? data.error : null;
	const code = data.code ?? nested?.code;
	if (code !== "ACCOUNT_PENDING_DELETION") return null;
	return {
		deletionScheduledFor: data.deletionScheduledFor ?? nested?.deletionScheduledFor,
		canCancel: (data.canCancel ?? nested?.canCancel) !== false,
	};
};

export const isPendingDeletionError = (err: any): boolean => getPendingDeletion(err) !== null;

export const getErrorCode = (err: any): string | undefined => {
	const data = err?.response?.data;
	return data?.code ?? (data?.error && typeof data.error === "object" ? data.error.code : undefined);
};

export const formatDeletionDate = (iso?: string): string | null => {
	if (!iso) return null;
	const date = new Date(iso);
	if (Number.isNaN(date.getTime())) return null;
	return date.toLocaleDateString("es-AR", { day: "numeric", month: "long", year: "numeric" });
};

// Resumen de carpetas archivadas por el límite del plan.
//
// Alimenta el gate de carpeta archivada (ArchivedFolderView), el banner del
// listado de carpetas y el aviso de desarchivado rechazado por el tope. Es una
// mejora de copy: si el endpoint falla, las vistas se muestran como antes
// (fetchArchivedSummary devuelve null y nunca tira).
import axios from "axios";

export interface ArchivedSummaryRecommendation {
	planId: string;
	displayName: string;
	folders: number;
	// El plan más grande tampoco alcanza para tener todas activas.
	exceedsAll: boolean;
}

export interface ArchivedSummary {
	active: number;
	archivedByPlan: number;
	archivedByUser: number;
	total: number;
	planId: string;
	planLimit: number;
	recommended: ArchivedSummaryRecommendation | null;
}

const baseUrl = import.meta.env.VITE_BASE_URL || "http://localhost:5000";

/** Motivos de archivado que cuentan como "por el plan" (hub models/Folder.js archivedReason). */
export const PLAN_ARCHIVED_REASONS = ["plan_limit", "plan_downgrade", "auto_archived_limit_exceeded", "extra_folders_reduced"];

export const isPlanArchivedReason = (reason: string | null | undefined): boolean => !!reason && PLAN_ARCHIVED_REASONS.includes(reason);

const PLAN_COPY_NAME: Record<string, string> = {
	free: "gratuito",
	standard: "Estándar",
	pro: "Pro",
	premium: "Premium",
};

/** Nombre del plan para usar dentro de una frase ("el plan gratuito", "el plan Estándar"). */
export const planNameForCopy = (planId: string | null | undefined): string => (planId ? PLAN_COPY_NAME[planId] || planId : "gratuito");

export const fetchArchivedSummary = async (): Promise<ArchivedSummary | null> => {
	try {
		const { data } = await axios.get(`${baseUrl}/api/folders/archived-summary`);
		if (!data?.success) return null;
		return {
			active: Number(data.active) || 0,
			archivedByPlan: Number(data.archivedByPlan) || 0,
			archivedByUser: Number(data.archivedByUser) || 0,
			total: Number(data.total) || 0,
			planId: data.planId || "free",
			planLimit: Number(data.planLimit) || 0,
			recommended: data.recommended || null,
		};
	} catch {
		return null;
	}
};

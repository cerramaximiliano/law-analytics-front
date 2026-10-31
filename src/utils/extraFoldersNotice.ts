/**
 * Aviso de que los bloques de «Causas adicionales» (extra_folders, solo Premium) terminan
 * al bajar de plan o al cancelar la suscripción. Los regalados por el equipo (grant) no
 * dependen del plan y no se mencionan. Mismo criterio que el hub (effectiveLimitsService).
 */
import dayjs from "utils/dayjs-config";

export const EXTRA_FOLDERS_BLOCK = { folders: 250, storage: 100 };

interface SubscriptionLike {
	plan?: string;
	addons?: Array<{ key: string; status?: string; quantity?: number }>;
}

/** Bloques comprados que hoy cuentan (Premium, add-on activo o con pago pendiente). */
export function purchasedExtraFolderBlocks(subscription: SubscriptionLike | null | undefined): number {
	if (!subscription || subscription.plan !== "premium") return 0;
	const entry = (subscription.addons || []).find((a) => a?.key === "extra_folders" && (a.status === "active" || a.status === "past_due"));
	if (!entry) return 0;
	const q = entry.quantity ?? 1;
	return Number.isFinite(q) && q > 0 ? Math.floor(q) : 0;
}

/**
 * Texto del aviso, o null si no hay bloques comprados.
 * reason "downgrade": cambio a un plan sin el add-on; "cancellation": baja de la suscripción.
 */
export function extraFoldersEndingText(
	blocks: number,
	{ endDate, reason }: { endDate?: string | Date | null; reason: "downgrade" | "cancellation" },
): string | null {
	if (!(blocks > 0)) return null;
	const count = blocks === 1 ? "Tu bloque" : `Tus ${blocks} bloques`;
	const verb = blocks === 1 ? "termina" : "terminan";
	const extra = `+${(blocks * EXTRA_FOLDERS_BLOCK.folders).toLocaleString("es-AR")} causas activas y +${
		blocks * EXTRA_FOLDERS_BLOCK.storage
	} MB`;
	const when = endDate ? `el ${dayjs(endDate).format("D [de] MMMM [de] YYYY")}` : "al final del período";
	const tail = reason === "cancellation" ? "junto con tu suscripción" : "porque solo se suman al Plan Premium";
	return `${count} de Causas adicionales (${extra}) ${verb} ${when} ${tail}, y desde esa fecha no se cobra${blocks === 1 ? "" : "n"} más.`;
}

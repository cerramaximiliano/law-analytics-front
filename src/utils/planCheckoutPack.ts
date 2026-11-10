/**
 * Pack (combo) propuesto por un cupón: plan + add-ons preseleccionados que el hub manda en
 * `activeDiscounts[].pack` (discountService.formatPack). /plans lo muestra en una tarjeta propia
 * (sections/plans/PackOfferCard) con los ítems editables; la selección es la MISMA que la de la
 * tarjeta del plan (usePlanCheckoutBlocks + usePlanCheckoutAddon), así que lo que el usuario
 * cambia en el pack se refleja en el plan y viceversa, y el checkout es el mismo.
 *
 * Lógica pura (sin React ni red): la testea utils/planCheckoutPack.test.ts.
 */

import type { ActiveDiscount, ActiveDiscountPack, Plan } from "store/reducers/ApiService";
import { addAmounts } from "utils/planCheckoutAddon";
import { EXTRA_FOLDERS_KEY } from "utils/planCheckoutBlocks";

export const MCP_ADDON_KEY = "mcp_access";

export interface PackOffer {
	plan: Plan;
	discount: ActiveDiscount;
	pack: ActiveDiscountPack;
}

/** Primer plan activo cuyo cupón vigente propone un pack para ese mismo plan. */
export function findPackOffer(plans: Plan[]): PackOffer | null {
	for (const plan of plans) {
		if (!plan.isActive || !plan.activeDiscounts) continue;
		for (const discount of plan.activeDiscounts) {
			const pack = discount.pack;
			if (pack && pack.planId === plan.planId) return { plan, discount, pack };
		}
	}
	return null;
}

/** Bloques de causas adicionales que trae el pack (0 si no incluye). */
export const packBlocks = (pack: ActiveDiscountPack): number => {
	const item = pack.addons.find((a) => a.key === EXTRA_FOLDERS_KEY);
	const n = item ? Math.floor(Number(item.quantity)) : 0;
	return Number.isFinite(n) && n > 0 ? n : 0;
};

/** ¿El pack incluye el conector de IA? */
export const packWantsConnector = (pack: ActiveDiscountPack): boolean => pack.addons.some((a) => a.key === MCP_ADDON_KEY);

/** "durante 6 meses" / "para siempre" / "el primer mes" según la duración del cupón. */
export function discountDurationLabel(discount: Pick<ActiveDiscount, "duration" | "durationInMonths">): string {
	if (discount.duration === "forever") return "para siempre";
	if (discount.duration === "repeating" && discount.durationInMonths && discount.durationInMonths > 0) {
		return discount.durationInMonths === 1 ? "durante 1 mes" : `durante ${discount.durationInMonths} meses`;
	}
	return "el primer mes";
}

/** Subtotal mensual del pack con lo seleccionado; null si falta algún precio. */
export function packSubtotal(p: {
	planPrice: number | null | undefined;
	blocks: number;
	unitPrice: number | null | undefined;
	connector: boolean;
	addonPrice: number | null | undefined;
}): number | null {
	if (typeof p.planPrice !== "number") return null;
	let total = p.planPrice;
	if (p.blocks > 0) {
		if (typeof p.unitPrice !== "number") return null;
		total = addAmounts(total, Math.round(p.unitPrice * p.blocks * 100) / 100);
	}
	if (p.connector) {
		if (typeof p.addonPrice !== "number") return null;
		total = addAmounts(total, p.addonPrice);
	}
	return total;
}

/** Causas activas que cubre el pack: las del plan más las de los bloques. */
export const packFolders = (planFolders: number | null | undefined, blocks: number, foldersPerBlock: number): number | null =>
	typeof planFolders === "number" ? planFolders + blocks * foldersPerBlock : null;

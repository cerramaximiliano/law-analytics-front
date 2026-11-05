/**
 * Contratar Premium + bloques de «Causas adicionales» (extra_folders) en el mismo Stripe
 * Checkout que el plan, y opcionalmente el conector de IA: un solo pago para todo
 * (hub: POST /api/subscriptions/checkout { planId: "premium", addons: ["mcp_access",
 * { key: "extra_folders", quantity }] }, services/checkoutAddons.js).
 *
 * Solo para la rama de ALTA: usuario logueado SIN plan pago. Con Premium activo, los
 * bloques se suman desde su tarjeta (ExtraFoldersSection).
 *
 * Lógica pura (sin React ni red): la testea utils/planCheckoutBlocks.test.ts.
 */

import type { ExtraFoldersStatus } from "store/reducers/ApiService";
import { addAmounts, formatAmount } from "utils/planCheckoutAddon";

export const EXTRA_FOLDERS_KEY = "extra_folders" as const;
/** Único plan con el que se venden bloques. */
export const BLOCKS_PLAN_ID = "premium";

/** Elemento de `addons` del checkout: key sola (cantidad 1) o con cantidad. */
export type CheckoutAddonItem = string | { key: string; quantity: number };

/**
 * ¿Se ofrece el selector de bloques en la tarjeta de Premium? Solo a un usuario sin plan
 * pago (eligibilityReason "paid_plan_required"), con precio, venta abierta o bypass de
 * admin / cuenta de prueba, y sin mantenimiento.
 */
export function shouldOfferBlocksAtPlanCheckout(status: ExtraFoldersStatus | null, isLoggedIn: boolean): boolean {
	if (!isLoggedIn || !status) return false;
	if (status.eligibilityReason !== "paid_plan_required") return false;
	if (status.availabilityReason === "maintenance") return false;
	if (!status.publicAvailable && !status.purchaseBypass) return false;
	return !!status.price && typeof status.price.amount === "number" && status.price.amount > 0;
}

/** Cantidad válida de bloques (0..max, entero). */
export const clampBlocks = (n: number, max: number): number => Math.min(Math.max(0, Math.floor(Number.isFinite(n) ? n : 0)), max);

/**
 * Suma los bloques a la lista de add-ons del checkout (la del conector, si la hay).
 * Con 0 bloques devuelve la lista tal cual.
 */
export function withBlocks(addons: CheckoutAddonItem[] | undefined, blocks: number): CheckoutAddonItem[] {
	const base = (addons || []).filter((a) => (typeof a === "string" ? a : a.key) !== EXTRA_FOLDERS_KEY);
	return blocks > 0 ? [...base, { key: EXTRA_FOLDERS_KEY, quantity: blocks }] : base;
}

/** Costo mensual de N bloques (centavos exactos) o null sin precio. */
export function blocksMonthlyCost(blocks: number, unitPrice: number | null | undefined): number | null {
	if (typeof unitPrice !== "number") return null;
	return Math.round(unitPrice * 100 * blocks) / 100;
}

/** "5 bloques · +1.250 causas" / "1 bloque · +250 causas". */
export function blocksSummary(blocks: number, foldersPerBlock: number): string {
	const extra = (blocks * foldersPerBlock).toLocaleString("es-AR");
	return `${blocks} ${blocks === 1 ? "bloque" : "bloques"} · +${extra} causas`;
}

/**
 * "Plan Premium US$ 29,99 + 5 bloques US$ 45 = US$ 74,99/mes · 1.750 causas".
 * null si falta algún precio, hay 0 bloques o las monedas no coinciden.
 */
export function formatPlanBlocksTotal(p: {
	planPrice: number | null | undefined;
	planCurrency?: string | null;
	planFolders: number | null | undefined;
	blocks: number;
	unitPrice: number | null | undefined;
	unitCurrency?: string | null;
	foldersPerBlock: number;
}): string | null {
	if (p.blocks <= 0 || typeof p.planPrice !== "number") return null;
	const cost = blocksMonthlyCost(p.blocks, p.unitPrice);
	if (cost === null) return null;
	const planCurrency = (p.planCurrency || "usd").toLowerCase();
	if (planCurrency !== (p.unitCurrency || "usd").toLowerCase()) return null;
	const total = addAmounts(p.planPrice, cost);
	const folders =
		typeof p.planFolders === "number" ? ` · ${(p.planFolders + p.blocks * p.foldersPerBlock).toLocaleString("es-AR")} causas` : "";
	return `Plan Premium ${formatAmount(p.planPrice, planCurrency)} + ${p.blocks} ${p.blocks === 1 ? "bloque" : "bloques"} ${formatAmount(
		cost,
		planCurrency,
	)} = ${formatAmount(total, planCurrency)}/mes${folders}`;
}

/** Mensaje para el usuario cuando el hub rechaza los bloques en el checkout del alta. */
export function planCheckoutBlocksErrorMessage(code: string | undefined, reason?: string | null, message?: string | null): string {
	switch (code) {
		case "ADDON_NOT_AVAILABLE":
			return reason === "maintenance"
				? message || "Las causas adicionales están en mantenimiento. Podés contratar Premium y sumarlas después."
				: "Las causas adicionales todavía no están disponibles. Podés contratar Premium y sumarlas después.";
		case "ADDON_USE_ADDON_FLOW":
			return "Ya tenés un plan pago: sumá causas adicionales desde Cuenta → Configuración.";
		case "PREMIUM_REQUIRED":
			return "Las causas adicionales se contratan solo con el plan Premium.";
		case "INVALID_ADDON_QUANTITY":
			return "Elegí una cantidad de bloques válida.";
		default:
			return "No pudimos sumar las causas adicionales. Contratá Premium y agregalas después desde tu cuenta.";
	}
}

/**
 * Contratar un plan + el add-on "Conectores de IA" (mcp_access) en un solo Stripe
 * Checkout (hub: POST /api/subscriptions/checkout { planId, addons: ["mcp_access"],
 * acceptedPolicyVersion }, services/checkoutAddons.js).
 *
 * Solo para la rama de ALTA: usuario logueado SIN plan pago (Free, cancelada, sin
 * suscripción). Con plan pago, el add-on se agrega desde su tarjeta (POST
 * /addons/checkout) y los botones de cambio de plan no cambian.
 *
 * Lógica pura (sin React ni red): la testea utils/planCheckoutAddon.test.ts.
 */

import type { McpAddonStatus } from "types/mcpAddon";
import { isMcpAddonVisible, MCP_ADDON_NAME, MCP_ADDON_REQUIRED_PLANS } from "utils/mcpAddonState";
import { cleanPlanDisplayName } from "utils/planPricingUtils";

/** `cta_location` de los eventos GTM del add-on cuando se contrata junto con el plan. */
export const PLAN_CHECKOUT_CTA_LOCATION = "plan_checkout";

/** Códigos del hub propios del checkout con add-on (además de los del checkout normal). */
export const PLAN_CHECKOUT_ADDON_CODES = new Set([
	"LEGAL_ACCEPTANCE_REQUIRED",
	"ADDON_NOT_AVAILABLE",
	"ADDON_USE_ADDON_FLOW",
	"ADDON_PRICE_MISMATCH",
	"ADDON_PRICE_MISSING",
	"INVALID_ADDON",
]);

/**
 * ¿Se ofrece el checkbox "Agregar Conectores de IA" junto a los planes pagos?
 * Solo si la tarjeta del add-on sería visible (isMcpAddonVisible) y el hub lo vendería
 * al dar de alta el plan: sin plan pago (eligibilityReason "paid_plan_required" — un
 * miembro de equipo llega como "team_member" y queda afuera), sin el add-on, venta
 * abierta o admin con bypass, sin mantenimiento y con precio.
 */
export function shouldOfferAddonAtPlanCheckout(addon: McpAddonStatus | null, isLoggedIn: boolean): boolean {
	if (!isLoggedIn || !addon) return false;
	if (!isMcpAddonVisible(addon)) return false;
	if (addon.status !== "none") return false;
	if (addon.eligibilityReason !== "paid_plan_required") return false;
	if (MCP_ADDON_REQUIRED_PLANS.includes(addon.plan)) return false;
	if (addon.availabilityReason === "maintenance") return false;
	if (!addon.publicAvailable && !addon.adminBypass) return false;
	return typeof addon.price.amount === "number" && addon.price.amount > 0;
}

/** true si el plan se puede contratar con el add-on (planes pagos). */
export const isAddonCompatiblePlan = (planId: string): boolean => MCP_ADDON_REQUIRED_PLANS.includes(planId);

/** "Plan Estándar (production)" → "Estándar" (el copy del total antepone "Plan"). */
export const planShortName = (displayName: string): string =>
	cleanPlanDisplayName(displayName || "")
		.replace(/^plan\s+/i, "")
		.trim();

/** "US$ 7,99" / "US$ 4" / "$ 5.000" (ARS): mismo criterio que formatMonthlyPrice, sin "/mes". */
export function formatAmount(amount: number, currency: string): string {
	const c = (currency || "usd").toLowerCase();
	const symbol = c === "ars" ? "$" : "US$";
	const formatted = amount.toLocaleString("es-AR", {
		minimumFractionDigits: amount % 1 === 0 ? 0 : 2,
		maximumFractionDigits: 2,
	});
	return `${symbol} ${formatted}`;
}

/** Suma en centavos para no arrastrar errores de coma flotante (7.99 + 4 = 11.99). */
export const addAmounts = (a: number, b: number): number => Math.round(a * 100 + b * 100) / 100;

/**
 * Porcentaje del descuento activo del plan (el que el hub manda en `activeDiscounts[0]` y
 * el checkout aplica a TODOS los ítems: plan, bloques y conector). null si no hay descuento
 * porcentual vigente; los descuentos de monto fijo no se proyectan sobre el combo.
 */
export function activePercentOff(discount?: { discountType?: string; discountValue?: number } | null): number | null {
	if (!discount || discount.discountType !== "percentage") return null;
	const v = Number(discount.discountValue);
	return Number.isFinite(v) && v > 0 && v <= 100 ? v : null;
}

/** Total con el porcentaje aplicado, redondeado a centavos como lo hace Stripe sobre el subtotal. */
export const applyPercentOff = (amount: number, percent: number): number => Math.round(amount * (100 - percent)) / 100;

/** " · con 25 % OFF: US$ 65,99/mes" (vacío si no hay porcentaje). */
export function percentOffSuffix(total: number, currency: string, percent?: number | null): string {
	if (typeof percent !== "number" || percent <= 0) return "";
	return ` · con ${percent.toLocaleString("es-AR")} % OFF: ${formatAmount(applyPercentOff(total, percent), currency)}/mes`;
}

/**
 * "Plan Estándar US$ 7,99 + Conectores de IA US$ 4 = US$ 11,99/mes".
 * null si falta algún precio o las monedas no coinciden (no se suma lo que no se puede sumar).
 */
export function formatPlanAddonTotal(p: {
	planName: string;
	planPrice: number | null | undefined;
	planCurrency?: string | null;
	addonPrice: number | null | undefined;
	addonCurrency?: string | null;
	/** Descuento porcentual del plan (activePercentOff): se muestra el total con el % aplicado. */
	discountPercent?: number | null;
}): string | null {
	if (typeof p.planPrice !== "number" || typeof p.addonPrice !== "number") return null;
	const planCurrency = (p.planCurrency || "usd").toLowerCase();
	const addonCurrency = (p.addonCurrency || "usd").toLowerCase();
	if (planCurrency !== addonCurrency) return null;
	const total = addAmounts(p.planPrice, p.addonPrice);
	return `Plan ${p.planName} ${formatAmount(p.planPrice, planCurrency)} + ${MCP_ADDON_NAME} ${formatAmount(
		p.addonPrice,
		addonCurrency,
	)} = ${formatAmount(total, planCurrency)}/mes${percentOffSuffix(total, planCurrency, p.discountPercent)}`;
}

/** Etiqueta del checkbox: "Agregar Conectores de IA (+US$ 4/mes)". */
export function addonCheckboxLabel(addonPrice: number | null, currency: string): string {
	return typeof addonPrice === "number"
		? `Agregar ${MCP_ADDON_NAME} (+${formatAmount(addonPrice, currency)}/mes)`
		: `Agregar ${MCP_ADDON_NAME}`;
}

/** Mensaje para el usuario según el código de rechazo del hub en el checkout con add-on. */
export function planCheckoutAddonErrorMessage(code: string | undefined, reason?: string | null): string {
	switch (code) {
		case "ADDON_NOT_AVAILABLE":
			return reason === "maintenance"
				? `${MCP_ADDON_NAME} está en mantenimiento. Podés contratar el plan sin el conector y sumarlo después.`
				: `${MCP_ADDON_NAME} todavía no está disponible para contratar. Podés contratar el plan sin el conector.`;
		case "ADDON_USE_ADDON_FLOW":
			return `Ya tenés un plan pago: sumá ${MCP_ADDON_NAME} desde su tarjeta, en esta misma página o en Cuenta → Suscripción.`;
		case "ADDON_PRICE_MISMATCH":
		case "ADDON_PRICE_MISSING":
		case "INVALID_ADDON":
			return `No pudimos sumar ${MCP_ADDON_NAME} a este plan. Contratá el plan y agregá el conector después.`;
		default:
			return `No pudimos iniciar el pago con ${MCP_ADDON_NAME}. Intentá de nuevo.`;
	}
}

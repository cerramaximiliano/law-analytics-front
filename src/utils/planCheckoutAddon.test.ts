import { describe, expect, it } from "vitest";

import type { McpAddonStatus } from "types/mcpAddon";
import {
	addAmounts,
	addonCheckboxLabel,
	formatPlanAddonTotal,
	isAddonCompatiblePlan,
	planCheckoutAddonErrorMessage,
	planShortName,
	shouldOfferAddonAtPlanCheckout,
} from "./planCheckoutAddon";

const freeUser = (over: Partial<McpAddonStatus> = {}): McpAddonStatus =>
	({
		key: "mcp_access",
		price: { amount: 4, currency: "usd", interval: "month" },
		status: "none",
		plan: "free",
		subscriptionStatus: null,
		eligible: false,
		eligibilityReason: "paid_plan_required",
		requiredPlans: ["standard", "pro", "premium"],
		publicAvailable: true,
		availabilityReason: null,
		maintenanceMessage: null,
		adminBypass: false,
		purchasable: false,
		canRemove: false,
		canReactivate: false,
		cancellationSource: null,
		nextBillingDate: null,
		endsAt: null,
		hasManualGrant: false,
		legal: null,
		access: { allowed: false, via: null, reason: "addon_missing" },
		mcpUrl: "https://mcp.lawanalytics.app/mcp",
		...over,
	} as McpAddonStatus);

describe("shouldOfferAddonAtPlanCheckout", () => {
	it("usuario Free logueado con la venta abierta y precio → sí", () => {
		expect(shouldOfferAddonAtPlanCheckout(freeUser(), true)).toBe(true);
	});

	it("admin con la venta cerrada (adminBypass) → sí", () => {
		expect(
			shouldOfferAddonAtPlanCheckout(freeUser({ publicAvailable: false, availabilityReason: "not_public", adminBypass: true }), true),
		).toBe(true);
	});

	it.each<[string, Partial<McpAddonStatus> | null, boolean]>([
		["sin sesión", {}, false],
		["sin estado", null, true],
		["venta cerrada sin bypass (beta por grant)", { publicAvailable: false, availabilityReason: "not_public" }, true],
		["mantenimiento", { publicAvailable: false, availabilityReason: "maintenance" }, true],
		["sin precio", { price: { amount: null, currency: "usd", interval: "month" } }, true],
		["ya tiene plan pago (rama de cambio de plan: no se toca)", { plan: "standard", eligibilityReason: null, eligible: true }, true],
		["plan pago con suscripción cancelándose", { plan: "premium", eligibilityReason: "subscription_canceling" }, true],
		["miembro de equipo", { eligibilityReason: "team_member" }, true],
		["ya tiene el add-on", { status: "active" }, true],
	])("%s → no", (_label, over, loggedIn) => {
		expect(shouldOfferAddonAtPlanCheckout(over === null ? null : freeUser(over), loggedIn)).toBe(false);
	});
});

describe("copy y montos", () => {
	it("total del plan + add-on con coma decimal (es-AR) y sin error de coma flotante", () => {
		expect(addAmounts(7.99, 4)).toBe(11.99);
		expect(formatPlanAddonTotal({ planName: "Estándar", planPrice: 7.99, addonPrice: 4 })).toBe(
			"Plan Estándar US$ 7,99 + Conectores de IA US$ 4 = US$ 11,99/mes",
		);
	});

	it("sin precio del plan o con monedas distintas no arma el total", () => {
		expect(formatPlanAddonTotal({ planName: "Estándar", planPrice: null, addonPrice: 4 })).toBeNull();
		expect(
			formatPlanAddonTotal({ planName: "Estándar", planPrice: 7.99, planCurrency: "ars", addonPrice: 4, addonCurrency: "usd" }),
		).toBeNull();
	});

	it("etiqueta del checkbox con el precio del add-on", () => {
		expect(addonCheckboxLabel(4, "usd")).toBe("Agregar Conectores de IA (+US$ 4/mes)");
		expect(addonCheckboxLabel(null, "usd")).toBe("Agregar Conectores de IA");
	});

	it("nombre corto del plan", () => {
		expect(planShortName("Plan Estándar")).toBe("Estándar");
		expect(planShortName("Plan Premium (production)")).toBe("Premium");
		expect(planShortName("Pro")).toBe("Pro");
	});

	it("solo los planes pagos admiten el add-on", () => {
		expect(isAddonCompatiblePlan("standard")).toBe(true);
		expect(isAddonCompatiblePlan("premium")).toBe(true);
		expect(isAddonCompatiblePlan("free")).toBe(false);
	});

	it("mensajes de rechazo del hub", () => {
		expect(planCheckoutAddonErrorMessage("ADDON_NOT_AVAILABLE", "maintenance")).toMatch(/mantenimiento/);
		expect(planCheckoutAddonErrorMessage("ADDON_NOT_AVAILABLE", "not_public")).toMatch(/todavía no está disponible/);
		expect(planCheckoutAddonErrorMessage("ADDON_USE_ADDON_FLOW")).toMatch(/Ya tenés un plan pago/);
		expect(planCheckoutAddonErrorMessage("ADDON_PRICE_MISMATCH")).toMatch(/Contratá el plan/);
	});
});

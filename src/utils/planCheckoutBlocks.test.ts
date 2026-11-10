import { describe, expect, it } from "vitest";

import type { ExtraFoldersStatus } from "store/reducers/ApiService";
import {
	blocksMonthlyCost,
	blocksSummary,
	clampBlocks,
	formatPlanBlocksTotal,
	planCheckoutBlocksErrorMessage,
	shouldOfferBlocksAtPlanCheckout,
	withBlocks,
} from "./planCheckoutBlocks";

const freeUser = (over: Partial<ExtraFoldersStatus> = {}): ExtraFoldersStatus =>
	({
		key: "extra_folders",
		block: { folders: 250, storage: 100 },
		maxBlocks: 20,
		price: { amount: 9, currency: "usd", interval: "month" },
		requiredPlans: ["premium"],
		plan: "free",
		eligible: false,
		eligibilityReason: "paid_plan_required",
		publicAvailable: true,
		availabilityReason: null,
		maintenanceMessage: null,
		purchaseBypass: null,
		...over,
	} as ExtraFoldersStatus);

describe("shouldOfferBlocksAtPlanCheckout", () => {
	it("usuario sin plan pago, venta abierta y con precio: se ofrece", () => {
		expect(shouldOfferBlocksAtPlanCheckout(freeUser(), true)).toBe(true);
	});
	it("sin login o sin estado: no", () => {
		expect(shouldOfferBlocksAtPlanCheckout(freeUser(), false)).toBe(false);
		expect(shouldOfferBlocksAtPlanCheckout(null, true)).toBe(false);
	});
	it("con plan pago (premium_required / ya Premium): no, va por su tarjeta", () => {
		expect(shouldOfferBlocksAtPlanCheckout(freeUser({ eligibilityReason: "premium_required" }), true)).toBe(false);
		expect(shouldOfferBlocksAtPlanCheckout(freeUser({ eligibilityReason: null, plan: "premium" }), true)).toBe(false);
	});
	it("venta cerrada: solo con bypass; mantenimiento: nunca", () => {
		expect(shouldOfferBlocksAtPlanCheckout(freeUser({ publicAvailable: false }), true)).toBe(false);
		expect(shouldOfferBlocksAtPlanCheckout(freeUser({ publicAvailable: false, purchaseBypass: { reason: "admin" } }), true)).toBe(true);
		expect(
			shouldOfferBlocksAtPlanCheckout(
				freeUser({ publicAvailable: false, availabilityReason: "maintenance", purchaseBypass: { reason: "admin" } }),
				true,
			),
		).toBe(false);
	});
	it("sin precio: no", () => {
		expect(shouldOfferBlocksAtPlanCheckout(freeUser({ price: null }), true)).toBe(false);
	});
});

describe("withBlocks / clampBlocks", () => {
	it("suma los bloques a la lista del conector", () => {
		expect(withBlocks(["mcp_access"], 5)).toEqual(["mcp_access", { key: "extra_folders", quantity: 5 }]);
		expect(withBlocks(undefined, 2)).toEqual([{ key: "extra_folders", quantity: 2 }]);
	});
	it("0 bloques no agrega nada y no duplica una entrada previa", () => {
		expect(withBlocks(["mcp_access"], 0)).toEqual(["mcp_access"]);
		expect(withBlocks([{ key: "extra_folders", quantity: 1 }], 3)).toEqual([{ key: "extra_folders", quantity: 3 }]);
	});
	it("clampBlocks acota a 0..max y entero", () => {
		expect(clampBlocks(-1, 20)).toBe(0);
		expect(clampBlocks(25, 20)).toBe(20);
		expect(clampBlocks(2.7, 20)).toBe(2);
		expect(clampBlocks(Number.NaN, 20)).toBe(0);
	});
});

describe("totales", () => {
	it("costo sin errores de coma flotante", () => {
		expect(blocksMonthlyCost(5, 9)).toBe(45);
		expect(blocksMonthlyCost(3, 9.99)).toBe(29.97);
		expect(blocksMonthlyCost(2, null)).toBeNull();
	});
	it("resumen en singular y plural", () => {
		expect(blocksSummary(1, 250)).toBe("1 bloque · +250 causas");
		expect(blocksSummary(5, 250)).toBe("5 bloques · +1.250 causas");
	});
	it("total del combo con causas totales", () => {
		expect(
			formatPlanBlocksTotal({
				planPrice: 29.99,
				planCurrency: "usd",
				planFolders: 500,
				blocks: 5,
				unitPrice: 9,
				unitCurrency: "usd",
				foldersPerBlock: 250,
			}),
		).toBe("Plan Premium US$ 29,99 + 5 bloques US$ 45 = US$ 74,99/mes · 1.750 causas");
	});
	it("total del combo con descuento porcentual", () => {
		expect(
			formatPlanBlocksTotal({
				planPrice: 29.99,
				planCurrency: "usd",
				planFolders: 500,
				blocks: 6,
				unitPrice: 9,
				unitCurrency: "usd",
				foldersPerBlock: 250,
				discountPercent: 25,
			}),
		).toBe("Plan Premium US$ 29,99 + 6 bloques US$ 54 = US$ 83,99/mes · 2.000 causas · con 25 % OFF: US$ 62,99/mes");
	});
	it("null con 0 bloques, sin precio o con monedas distintas", () => {
		const base = { planPrice: 29.99, planCurrency: "usd", planFolders: 500, unitPrice: 9, unitCurrency: "usd", foldersPerBlock: 250 };
		expect(formatPlanBlocksTotal({ ...base, blocks: 0 })).toBeNull();
		expect(formatPlanBlocksTotal({ ...base, blocks: 2, planPrice: null })).toBeNull();
		expect(formatPlanBlocksTotal({ ...base, blocks: 2, unitCurrency: "ars" })).toBeNull();
	});
});

describe("planCheckoutBlocksErrorMessage", () => {
	it("mantenimiento usa el mensaje configurado", () => {
		expect(planCheckoutBlocksErrorMessage("ADDON_NOT_AVAILABLE", "maintenance", "Volvemos pronto")).toBe("Volvemos pronto");
	});
	it("Premium requerido y genérico", () => {
		expect(planCheckoutBlocksErrorMessage("PREMIUM_REQUIRED")).toMatch(/Premium/);
		expect(planCheckoutBlocksErrorMessage("OTRO")).toMatch(/Contratá Premium/);
	});
});

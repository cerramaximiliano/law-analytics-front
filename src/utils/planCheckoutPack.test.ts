import { describe, expect, it } from "vitest";

import type { ActiveDiscount, Plan } from "store/reducers/ApiService";
import { discountDurationLabel, findPackOffer, packBlocks, packFolders, packSubtotal, packWantsConnector } from "./planCheckoutPack";

const discount = (over: Partial<ActiveDiscount> = {}): ActiveDiscount =>
	({
		code: "ESTUDIO-FERNANDEZ-25",
		name: "Estudio",
		discountType: "percentage",
		discountValue: 25,
		validUntil: "2026-12-31",
		badge: "",
		promotionalMessage: "",
		applicablePlans: ["premium"],
		applicableBillingPeriods: [],
		duration: "repeating",
		durationInMonths: 6,
		originalPrice: 29.99,
		discountAmount: 7.5,
		finalPrice: 22.49,
		discountPercentage: 25,
		pack: {
			planId: "premium",
			addons: [
				{ key: "mcp_access", quantity: 1 },
				{ key: "extra_folders", quantity: 6 },
			],
		},
		...over,
	} as ActiveDiscount);

const plan = (planId: string, over: Partial<Plan> = {}): Plan => ({ planId, isActive: true, ...over } as Plan);

describe("findPackOffer", () => {
	it("devuelve el primer plan activo con un cupón que propone pack para ese plan", () => {
		const premium = plan("premium", { activeDiscounts: [discount()] });
		const offer = findPackOffer([plan("standard", { activeDiscounts: [discount({ pack: null })] }), premium]);
		expect(offer?.plan.planId).toBe("premium");
		expect(offer?.discount.code).toBe("ESTUDIO-FERNANDEZ-25");
	});
	it("publicOnly deja afuera los cupones dirigidos (la vista pública /plans)", () => {
		const targeted = plan("premium", { activeDiscounts: [discount({ isTargeted: true })] });
		expect(findPackOffer([targeted], { publicOnly: true })).toBeNull();
		expect(findPackOffer([targeted])?.discount.code).toBe("ESTUDIO-FERNANDEZ-25");
		const forAll = plan("premium", { activeDiscounts: [discount({ code: "PACK-TODOS", isTargeted: false })] });
		expect(findPackOffer([forAll], { publicOnly: true })?.discount.code).toBe("PACK-TODOS");
	});
	it("ignora packs de otro plan, cupones sin pack y planes inactivos", () => {
		expect(findPackOffer([plan("standard", { activeDiscounts: [discount()] })])).toBeNull();
		expect(findPackOffer([plan("premium", { activeDiscounts: [discount({ pack: null })] })])).toBeNull();
		expect(findPackOffer([plan("premium", { isActive: false, activeDiscounts: [discount()] })])).toBeNull();
		expect(findPackOffer([plan("premium")])).toBeNull();
	});
});

describe("contenido del pack", () => {
	it("bloques y conector", () => {
		const pack = discount().pack!;
		expect(packBlocks(pack)).toBe(6);
		expect(packWantsConnector(pack)).toBe(true);
		expect(packBlocks({ planId: "premium", addons: [] })).toBe(0);
		expect(packWantsConnector({ planId: "premium", addons: [] })).toBe(false);
	});
	it("duración del descuento", () => {
		expect(discountDurationLabel({ duration: "repeating", durationInMonths: 6 })).toBe("durante 6 meses");
		expect(discountDurationLabel({ duration: "repeating", durationInMonths: 1 })).toBe("durante 1 mes");
		expect(discountDurationLabel({ duration: "forever" })).toBe("para siempre");
		expect(discountDurationLabel({ duration: "once" })).toBe("el primer mes");
	});
	it("subtotal y causas", () => {
		expect(packSubtotal({ planPrice: 29.99, blocks: 6, unitPrice: 9, connector: true, addonPrice: 4 })).toBe(87.99);
		expect(packSubtotal({ planPrice: 29.99, blocks: 0, unitPrice: null, connector: false, addonPrice: null })).toBe(29.99);
		expect(packSubtotal({ planPrice: 29.99, blocks: 2, unitPrice: null, connector: false, addonPrice: 4 })).toBeNull();
		expect(packSubtotal({ planPrice: null, blocks: 0, unitPrice: 9, connector: false, addonPrice: 4 })).toBeNull();
		expect(packFolders(500, 6, 250)).toBe(2000);
		expect(packFolders(null, 6, 250)).toBeNull();
	});
});

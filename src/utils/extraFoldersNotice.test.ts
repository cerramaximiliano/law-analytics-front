import { describe, expect, it } from "vitest";

import { extraFoldersEndingText, purchasedExtraFolderBlocks } from "./extraFoldersNotice";

describe("purchasedExtraFolderBlocks", () => {
	it("cuenta solo el add-on vigente en Premium (sin quantity = 1)", () => {
		expect(purchasedExtraFolderBlocks({ plan: "premium", addons: [{ key: "extra_folders", status: "active", quantity: 3 }] })).toBe(3);
		expect(purchasedExtraFolderBlocks({ plan: "premium", addons: [{ key: "extra_folders", status: "past_due" }] })).toBe(1);
		expect(purchasedExtraFolderBlocks({ plan: "premium", addons: [{ key: "extra_folders", status: "canceled", quantity: 2 }] })).toBe(0);
		expect(purchasedExtraFolderBlocks({ plan: "pro", addons: [{ key: "extra_folders", status: "active", quantity: 2 }] })).toBe(0);
		expect(purchasedExtraFolderBlocks({ plan: "premium", addons: [{ key: "mcp_access", status: "active" }] })).toBe(0);
		expect(purchasedExtraFolderBlocks(null)).toBe(0);
	});
});

describe("extraFoldersEndingText", () => {
	it("sin bloques no hay aviso", () => {
		expect(extraFoldersEndingText(0, { endDate: "2026-11-30T12:00:00Z", reason: "downgrade" })).toBeNull();
	});

	it("bajar de plan y cancelar", () => {
		expect(extraFoldersEndingText(2, { endDate: "2026-11-30T12:00:00Z", reason: "downgrade" })).toBe(
			"Tus 2 bloques de Causas adicionales (+500 causas activas y +200 MB) terminan el 30 de noviembre de 2026 porque solo se suman al Plan Premium, y desde esa fecha no se cobran más.",
		);
		expect(extraFoldersEndingText(1, { endDate: null, reason: "cancellation" })).toBe(
			"Tu bloque de Causas adicionales (+250 causas activas y +100 MB) termina al final del período junto con tu suscripción, y desde esa fecha no se cobra más.",
		);
	});
});

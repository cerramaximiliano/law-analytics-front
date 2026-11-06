import { describe, expect, it } from "vitest";
import { getTeamAssignees } from "./teamAssignees";
import { isResponsableVistaFija, responsableOptions, responsableQueryValue } from "./responsableVista";

// Vista por responsable del listado y del modal de archivadas (6/11/2026).
const team: any = {
	_id: "g1",
	owner: { _id: "u-owner", firstName: "Olga", lastName: "Owner" },
	members: [{ userId: { _id: "u-ana", firstName: "Ana", lastName: "Activa" }, role: "editor", status: "active" }],
	invitations: [
		{ _id: "i-draft", email: "draft@x.com", role: "editor", status: "draft", displayName: "Dora Prevista" },
		{ _id: "i-pend", email: "pend@x.com", role: "viewer", status: "pending", expiresAt: new Date(Date.now() + 86400000).toISOString() },
	],
};

describe("responsableVista", () => {
	it("traduce las vistas fijas al parámetro del hub y deja pasar los ids", () => {
		expect(responsableQueryValue("todas")).toBeNull();
		expect(responsableQueryValue("")).toBeNull();
		expect(responsableQueryValue(undefined)).toBeNull();
		expect(responsableQueryValue("mias")).toBe("me");
		expect(responsableQueryValue("sin")).toBe("ninguno");
		expect(responsableQueryValue("i-draft")).toBe("i-draft");
	});

	it("distingue vistas fijas de ids", () => {
		expect(isResponsableVistaFija("todas")).toBe(true);
		expect(isResponsableVistaFija("sin")).toBe(true);
		expect(isResponsableVistaFija("u-ana")).toBe(false);
		expect(isResponsableVistaFija(null)).toBe(false);
	});

	it("arma las opciones «De…» con etiquetas y sin el usuario actual", () => {
		const all = getTeamAssignees(team, { includeInvitations: true });
		expect(responsableOptions(all, "u-owner")).toEqual([
			{ id: "u-ana", name: "Ana Activa" },
			{ id: "i-draft", name: "Dora Prevista (previsto)" },
			{ id: "i-pend", name: "pend@x.com (invitado)" },
		]);
		expect(responsableOptions(all).map((o) => o.id)).toEqual(["u-owner", "u-ana", "i-draft", "i-pend"]);
	});
});

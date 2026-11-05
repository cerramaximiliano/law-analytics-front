import { describe, expect, it } from "vitest";
import { assigneeTag, getTeamAssignees, resolveAssignees } from "./teamAssignees";

// Asignables del equipo: owner, integrantes activos y, a pedido, previstos e invitados
// (responsables de carpetas antes de aceptar, 5/11/2026).
const team: any = {
	_id: "g1",
	name: "Estudio",
	owner: { _id: "u-owner", firstName: "Olga", lastName: "Owner", email: "olga@x.com" },
	members: [
		{ userId: { _id: "u-ana", firstName: "Ana", lastName: "Activa", email: "ana@x.com" }, role: "editor", status: "active" },
		{ userId: { _id: "u-rem", firstName: "Rem", lastName: "Ovido", email: "rem@x.com" }, role: "viewer", status: "removed" },
	],
	invitations: [
		{ _id: "i-draft", email: "draft@x.com", role: "editor", status: "draft", displayName: "Dora Prevista", expiresAt: null, sentAt: null },
		{ _id: "i-pend", email: "pend@x.com", role: "viewer", status: "pending", expiresAt: new Date(Date.now() + 86400000).toISOString() },
		{ _id: "i-exp", email: "exp@x.com", role: "viewer", status: "pending", expiresAt: new Date(Date.now() - 1000).toISOString() },
		{ _id: "i-rev", email: "rev@x.com", role: "viewer", status: "revoked", expiresAt: null },
	],
};

describe("getTeamAssignees", () => {
	it("por defecto: owner primero, integrantes activos, sin invitaciones", () => {
		const list = getTeamAssignees(team);
		expect(list.map((a) => a.id)).toEqual(["u-owner", "u-ana"]);
		expect(list[0].isOwner).toBe(true);
		expect(list.every((a) => a.kind === "member")).toBe(true);
	});

	it("con includeInvitations suma previstos e invitados vigentes, no vencidos ni revocados", () => {
		const list = getTeamAssignees(team, { includeInvitations: true });
		expect(list.map((a) => a.id)).toEqual(["u-owner", "u-ana", "i-draft", "i-pend"]);
		const draft = list.find((a) => a.id === "i-draft")!;
		expect(draft.name).toBe("Dora Prevista");
		expect(draft.initials).toBe("DP");
		expect(draft.kind).toBe("invitation");
		expect(draft.invitationStatus).toBe("draft");
		expect(assigneeTag(draft)).toBe("previsto");
		const pend = list.find((a) => a.id === "i-pend")!;
		expect(pend.name).toBe("pend@x.com");
		expect(assigneeTag(pend)).toBe("invitado");
		expect(assigneeTag(list[0])).toBe("");
	});

	it("resolveAssignees resuelve invitaciones cuando están en la lista y deja «Miembro» para desconocidos", () => {
		const all = getTeamAssignees(team, { includeInvitations: true });
		const r = resolveAssignees(["i-draft", "u-ana", "zzz"], all);
		expect(r.map((a) => a.name)).toEqual(["Dora Prevista", "Ana Activa", "Miembro"]);
		const sinInv = resolveAssignees(["i-draft"], getTeamAssignees(team));
		expect(sinInv[0].name).toBe("Miembro");
	});

	it("sin equipo devuelve vacío", () => {
		expect(getTeamAssignees(null, { includeInvitations: true })).toEqual([]);
	});
});

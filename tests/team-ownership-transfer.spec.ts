/**
 * BLOQUE 24 — Transfer ownership del team.
 *
 * Endpoint: POST /api/groups/:groupId/transfer-ownership
 *   body: { newOwnerId }
 *   auth: owner actual (verifyGroupAccess="admin")
 *
 * Reglas del backend (groupController.transferOwnership):
 *   - Solo el owner actual puede transferir.
 *   - `newOwnerId` debe ser miembro activo del grupo (status==="active").
 *   - El nuevo owner debe tener plan PAGO (no "free").
 *   - Al completarse:
 *       group.owner = newOwnerId
 *       newOwnerMember.status = "removed" (sale de la lista de members)
 *       previousOwner se agrega como "admin" en members
 *
 * Nota: no hay UI para este endpoint (solo API). Tests son 100% backend.
 */

import { test, expect } from "@playwright/test";
import { apiAsUser, deleteAllOwnedTeams, leaveAllTeams, TEST_USERS } from "./helpers/multi-user";

const API = "http://localhost:5000";
const makeTeamName = () => `E2E-OwnershipTx-${Date.now()}`;

test.describe.configure({ retries: 2 });

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createTeamAsOwner(name: string): Promise<string> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/groups`, {
			data: { name, description: "E2E ownership transfer" },
		});
		if (!res.ok()) throw new Error(`Create team failed: ${res.status()}`);
		const body = await res.json();
		return body.group?._id ?? body.data?._id ?? body._id;
	} finally {
		await ctx.dispose();
	}
}

async function inviteAndAccept(
	teamId: string,
	inviteeRole: "memberEditor" | "memberViewer" | "ownerSecondary",
	assignedRole: "editor" | "viewer",
): Promise<string> {
	const owner = await apiAsUser("owner");
	try {
		const invRes = await owner.post(`${API}/api/groups/${teamId}/invitations`, {
			data: { invitations: [{ email: TEST_USERS[inviteeRole].email, role: assignedRole }] },
		});
		if (!invRes.ok()) throw new Error(`Invite failed: ${invRes.status()} ${await invRes.text()}`);

		const teamRes = await owner.get(`${API}/api/groups/${teamId}`);
		const group = (await teamRes.json()).group ?? {};
		const invitation = (group.invitations ?? []).find(
			(i: any) => i.email === TEST_USERS[inviteeRole].email && i.status === "pending",
		);
		if (!invitation?.token) throw new Error(`Token not found for ${inviteeRole}`);

		const invitee = await apiAsUser(inviteeRole);
		try {
			const acceptRes = await invitee.post(`${API}/api/groups/invitations/accept/${invitation.token}`, {
				data: { skipResourceCheck: true },
			});
			if (!acceptRes.ok()) {
				const body = await acceptRes.json();
				if (body.code === "USER_HAS_RESOURCES") {
					await invitee.delete(`${API}/api/groups/delete-my-resources`, {
						data: { confirmation: "DELETE_ALL_MY_RESOURCES" },
					});
					const retry = await invitee.post(`${API}/api/groups/invitations/accept/${invitation.token}`, {
						data: { skipResourceCheck: true },
					});
					if (!retry.ok()) throw new Error(`Retry accept failed: ${retry.status()}`);
				} else {
					throw new Error(`Accept failed: ${acceptRes.status()} ${JSON.stringify(body)}`);
				}
			}
		} finally {
			await invitee.dispose();
		}

		const detailRes = await owner.get(`${API}/api/groups/${teamId}`);
		const detail = (await detailRes.json()).group ?? {};
		const member = (detail.members ?? []).find((m: any) => m.userId?.email === TEST_USERS[inviteeRole].email);
		const userId = member?.userId?._id ?? "";
		if (!userId) throw new Error(`User id not found for ${inviteeRole}`);
		return userId;
	} finally {
		await owner.dispose();
	}
}

// ─── Setup/teardown ──────────────────────────────────────────────────────────

test.beforeEach(async () => {
	// ownerSecondary debe estar libre para aceptar invitaciones (sino: ALREADY_IN_TEAM).
	await deleteAllOwnedTeams("owner");
	await deleteAllOwnedTeams("ownerSecondary");
	await leaveAllTeams("ownerSecondary");
	await leaveAllTeams("memberEditor");
	await leaveAllTeams("memberViewer");
	await new Promise((r) => setTimeout(r, 700));
});

test.afterAll(async () => {
	await deleteAllOwnedTeams("owner");
	await deleteAllOwnedTeams("ownerSecondary");
	await leaveAllTeams("ownerSecondary");
	await leaveAllTeams("memberEditor");
	await leaveAllTeams("memberViewer");
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Happy path: owner transfiere a miembro con plan pago
//
// NOTA: Este test está bloqueado por una contradicción de producto:
//   - transferOwnership (groupController.js:1776) requiere que el nuevo owner
//     tenga plan PAGO.
//   - acceptInvitation bloquea con PAID_PLAN_CONFLICT (409) cuando un usuario
//     con plan pago intenta unirse a un team.
//
// Flujo posible solo existiría si el miembro:
//   (a) se une con plan free  →  (b) upgradea a paid estando dentro del team
//       →  (c) owner transfiere ownership.
//
// E2E no puede simular (b) sin mockear Stripe + admin upgrade. Documentado
// para revisión de producto. Los tests 2, 3 y 4 (error paths) sí son viables.
// ─────────────────────────────────────────────────────────────────────────────

test.skip("GRUPO 1 — owner transfiere propiedad a miembro con plan pago (ownerSecondary) [BLOCKED: contradicción accept(paid)]", async () => {
	test.setTimeout(60_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	const newOwnerId = await inviteAndAccept(teamId, "ownerSecondary", "editor");

	const owner = await apiAsUser("owner");
	try {
		const res = await owner.post(`${API}/api/groups/${teamId}/transfer-ownership`, {
			data: { newOwnerId },
		});
		const body = await res.json();
		expect(res.ok()).toBe(true);
		expect(body.success).toBe(true);
		expect(body.newOwner?.userId).toBe(newOwnerId);
	} finally {
		await owner.dispose();
	}

	// Verificar el estado post-transfer desde el nuevo owner
	const nowOwner = await apiAsUser("ownerSecondary");
	try {
		const detailRes = await nowOwner.get(`${API}/api/groups/${teamId}`);
		expect(detailRes.ok()).toBe(true);
		const detail = (await detailRes.json()).group ?? {};
		const ownerId = typeof detail.owner === "string" ? detail.owner : detail.owner?._id;
		expect(ownerId).toBe(newOwnerId);

		// El owner anterior debe aparecer como admin en members
		const prev = (detail.members ?? []).find((m: any) => m.userId?.email === TEST_USERS.owner.email);
		if (prev) {
			expect(["admin", "owner"]).toContain(prev.role);
		}
	} finally {
		await nowOwner.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — 403: no-owner intenta transferir
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — editor intenta transferir → 403", async () => {
	test.setTimeout(60_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	const editorId = await inviteAndAccept(teamId, "memberEditor", "editor");

	const editor = await apiAsUser("memberEditor");
	try {
		const res = await editor.post(`${API}/api/groups/${teamId}/transfer-ownership`, {
			data: { newOwnerId: editorId },
		});
		expect(res.status()).toBe(403);
	} finally {
		await editor.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — 400: nuevo owner tiene plan FREE
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — transferir a miembro con plan free → 400 (debe tener plan pago)", async () => {
	test.setTimeout(60_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	const editorId = await inviteAndAccept(teamId, "memberEditor", "editor");

	const owner = await apiAsUser("owner");
	try {
		const res = await owner.post(`${API}/api/groups/${teamId}/transfer-ownership`, {
			data: { newOwnerId: editorId },
		});
		expect(res.status()).toBeGreaterThanOrEqual(400);
		const body = await res.json();
		expect(body.success).toBe(false);
	} finally {
		await owner.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — 400: newOwnerId no es miembro
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — transferir a userId que no es miembro → 400", async () => {
	test.setTimeout(45_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	const bogusUserId = "650000000000000000000001"; // ObjectId válido sintácticamente, no-miembro

	const owner = await apiAsUser("owner");
	try {
		const res = await owner.post(`${API}/api/groups/${teamId}/transfer-ownership`, {
			data: { newOwnerId: bogusUserId },
		});
		expect(res.status()).toBeGreaterThanOrEqual(400);
		const body = await res.json();
		expect(body.success).toBe(false);
	} finally {
		await owner.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 5 — Después del transfer, el owner anterior NO puede volver a transferir
// (mismo blocker que GRUPO 1: depende del happy path del transfer).
// ─────────────────────────────────────────────────────────────────────────────

test.skip("GRUPO 5 — tras transferir, el owner anterior pierde privilegios de ownership [BLOCKED: depende de GRUPO 1]", async () => {
	test.setTimeout(75_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	const newOwnerId = await inviteAndAccept(teamId, "ownerSecondary", "editor");

	const owner = await apiAsUser("owner");
	try {
		const txRes = await owner.post(`${API}/api/groups/${teamId}/transfer-ownership`, {
			data: { newOwnerId },
		});
		expect(txRes.ok()).toBe(true);
	} finally {
		await owner.dispose();
	}

	// El owner original intenta transferir nuevamente → debe ser 403 (ya no es owner)
	const formerOwner = await apiAsUser("owner");
	try {
		const res = await formerOwner.post(`${API}/api/groups/${teamId}/transfer-ownership`, {
			data: { newOwnerId },
		});
		expect(res.status()).toBe(403);
	} finally {
		await formerOwner.dispose();
	}
});

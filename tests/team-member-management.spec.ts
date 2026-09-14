/**
 * BLOQUE 8 — Gestión de miembros y lifecycle del team.
 *
 * Flujos cubiertos (contra TEAMS_TESTING_GUIDE.md):
 *   - 7.1 Owner cambia rol de miembro
 *   - 7.4 Editor intenta cambiar roles → 403
 *   - 7.5 Owner remueve miembro
 *   - 8.1 Miembro abandona team
 *   - 8.2 Owner intenta abandonar con miembros → error
 *   - 8.3 Owner elimina team (con miembros 400, sin miembros 200)
 *
 * Endpoints:
 *   PUT  /api/groups/:groupId/members/:userId/role     (verifyGroupAccess=admin)
 *   DELETE /api/groups/:groupId/members/:userId        (verifyGroupAccess=admin)
 *   POST /api/groups/:groupId/leave                    (cualquier miembro no-owner)
 *   DELETE /api/groups/:groupId                        (owner, team vacío)
 */

import { test, expect } from "@playwright/test";
import { apiAsUser, deleteAllOwnedTeams, leaveAllTeams, TEST_USERS } from "./helpers/multi-user";

const API = "http://localhost:5000";
const makeTeamName = () => `E2E-Member-${Date.now()}`;

// Retries por timing multi-user (propagación de Mongo tras accept/leave)
test.describe.configure({ retries: 2 });

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createTeamAsOwner(name: string): Promise<string> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/groups`, {
			data: { name, description: "E2E member management" },
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
	inviteeRole: "memberEditor" | "memberViewer" | "memberExtra",
	assignedRole: "editor" | "viewer",
): Promise<string> {
	const owner = await apiAsUser("owner");
	try {
		const invRes = await owner.post(`${API}/api/groups/${teamId}/invitations`, {
			data: { invitations: [{ email: TEST_USERS[inviteeRole].email, role: assignedRole }] },
		});
		if (!invRes.ok()) throw new Error(`Invite failed: ${invRes.status()} ${await invRes.text()}`);

		const teamRes = await owner.get(`${API}/api/groups/${teamId}`);
		const teamBody = await teamRes.json();
		const group = teamBody.group ?? teamBody.data ?? teamBody;
		const invitation = (group.invitations ?? []).find((i: any) => i.email === TEST_USERS[inviteeRole].email && i.status === "pending");
		if (!invitation?.token) throw new Error(`Token not found for ${inviteeRole}`);

		const invitee = await apiAsUser(inviteeRole);
		try {
			const acceptRes = await invitee.post(`${API}/api/groups/invitations/accept/${invitation.token}`, {
				data: { skipResourceCheck: true },
			});
			if (!acceptRes.ok()) {
				const body = await acceptRes.json();
				if (body.code === "USER_HAS_RESOURCES") {
					await invitee.delete(`${API}/api/groups/delete-my-resources`);
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

		// Resolver userId del invitee (necesario para endpoints /members/:userId)
		const detailRes = await owner.get(`${API}/api/groups/${teamId}`);
		const detail = await detailRes.json();
		const g = detail.group ?? detail.data ?? detail;
		const member = (g.members ?? []).find((m: any) => m.userId?.email === TEST_USERS[inviteeRole].email);
		const userId = member?.userId?._id ?? "";
		if (!userId) throw new Error(`User id not found for ${inviteeRole}`);
		return userId;
	} finally {
		await owner.dispose();
	}
}

// ─── Setup/teardown ──────────────────────────────────────────────────────────

test.beforeEach(async () => {
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams("memberEditor");
	await leaveAllTeams("memberViewer");
	await leaveAllTeams("memberExtra");
	await new Promise((r) => setTimeout(r, 600));
});

test.afterAll(async () => {
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams("memberEditor");
	await leaveAllTeams("memberViewer");
	await leaveAllTeams("memberExtra");
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Flujo 7.1: Owner cambia rol de miembro
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — owner cambia rol de viewer → editor (PUT /members/:userId/role)", async () => {
	test.setTimeout(45_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	const memberUserId = await inviteAndAccept(teamId, "memberViewer", "viewer");

	const owner = await apiAsUser("owner");
	try {
		const res = await owner.put(`${API}/api/groups/${teamId}/members/${memberUserId}/role`, {
			data: { role: "editor" },
		});
		expect(res.ok()).toBe(true);

		// Verificar que el rol quedó guardado
		const detail = await owner.get(`${API}/api/groups/${teamId}`);
		const group = (await detail.json()).group ?? {};
		const member = (group.members ?? []).find((m: any) => (m.userId?._id ?? m.userId) === memberUserId);
		expect(member?.role).toBe("editor");
	} finally {
		await owner.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Flujo 7.4: Editor intenta cambiar rol → 403
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — editor intenta cambiar rol de otro miembro → 403", async () => {
	test.setTimeout(60_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	const editorId = await inviteAndAccept(teamId, "memberEditor", "editor");
	const viewerId = await inviteAndAccept(teamId, "memberViewer", "viewer");

	// editor intenta promover viewer a editor
	const editor = await apiAsUser("memberEditor");
	try {
		const res = await editor.put(`${API}/api/groups/${teamId}/members/${viewerId}/role`, {
			data: { role: "editor" },
		});
		expect(res.status()).toBe(403);
	} finally {
		await editor.dispose();
	}
	// Silencia el linter por var no usada
	void editorId;
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Flujo 7.5: Owner remueve miembro
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — owner remueve miembro (DELETE /members/:userId) → sale del team", async () => {
	test.setTimeout(45_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	const memberId = await inviteAndAccept(teamId, "memberExtra", "viewer");

	const owner = await apiAsUser("owner");
	try {
		const res = await owner.delete(`${API}/api/groups/${teamId}/members/${memberId}`);
		expect(res.ok()).toBe(true);

		const detail = await owner.get(`${API}/api/groups/${teamId}`);
		const group = (await detail.json()).group ?? {};
		const activeMembers = (group.members ?? []).filter((m: any) => m.status === "active");
		expect(activeMembers.length).toBe(0);
	} finally {
		await owner.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Flujo 8.1: Miembro abandona team
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — miembro abandona team (POST /:teamId/leave) → ya no es miembro", async () => {
	test.setTimeout(45_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	await inviteAndAccept(teamId, "memberViewer", "viewer");

	// Pre: viewer debería tener el team listado
	const viewer = await apiAsUser("memberViewer");
	try {
		const listBefore = await viewer.get(`${API}/api/groups`);
		const bodyBefore = await listBefore.json();
		expect((bodyBefore.groups ?? []).length).toBeGreaterThan(0);

		// Abandonar
		const leaveRes = await viewer.post(`${API}/api/groups/${teamId}/leave`);
		expect(leaveRes.ok()).toBe(true);

		// Ya no debe aparecer el team en su listado
		const listAfter = await viewer.get(`${API}/api/groups`);
		const bodyAfter = await listAfter.json();
		const stillIn = (bodyAfter.groups ?? []).some((g: any) => g._id === teamId);
		expect(stillIn).toBe(false);
	} finally {
		await viewer.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 5 — Flujo 8.2: Owner intenta abandonar con miembros → error
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 5 — owner intenta POST /leave con miembros activos → error (owner no abandona)", async () => {
	test.setTimeout(45_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	await inviteAndAccept(teamId, "memberExtra", "viewer");

	const owner = await apiAsUser("owner");
	try {
		const res = await owner.post(`${API}/api/groups/${teamId}/leave`);
		// Owner no puede abandonar — backend responde 4xx
		expect(res.ok()).toBe(false);
		expect([400, 403, 409]).toContain(res.status());
	} finally {
		await owner.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 6 — Flujo 8.3: Owner elimina team
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 6 — owner intenta DELETE team con miembros → rechazado (checkMemberManagement)", async () => {
	test.setTimeout(45_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	await inviteAndAccept(teamId, "memberExtra", "viewer");

	const owner = await apiAsUser("owner");
	try {
		const res = await owner.delete(`${API}/api/groups/${teamId}`);
		// Backend exige team vacío de miembros para eliminar
		expect(res.ok()).toBe(false);
		expect([400, 403, 409]).toContain(res.status());
	} finally {
		await owner.dispose();
	}
});

test("GRUPO 6 — owner elimina team sin miembros → 200 OK", async () => {
	test.setTimeout(30_000);
	const teamId = await createTeamAsOwner(makeTeamName());

	const owner = await apiAsUser("owner");
	try {
		const res = await owner.delete(`${API}/api/groups/${teamId}`);
		expect(res.ok()).toBe(true);

		// El team ya no existe para el owner
		const detailRes = await owner.get(`${API}/api/groups/${teamId}`);
		expect([404, 403, 400]).toContain(detailRes.status());
	} finally {
		await owner.dispose();
	}
});

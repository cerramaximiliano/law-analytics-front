/**
 * BLOQUE 13 — Lifecycle de recursos cuando cambia la membresía o se elimina el team.
 *
 * Escenarios:
 *   - 13.1 Editor crea folder en team → owner remueve al editor → folder persiste en el team
 *          (removeMember no toca recursos; groupId se conserva).
 *   - 13.2 Editor crea folder → editor abandona (leave) → folder persiste en el team.
 *   - 13.3 Owner elimina team (con force=true) → recursos pierden `groupId` ($unset)
 *          pero conservan `userId` del owner; pasan a ser personales del owner.
 *
 * Ref: groupController.deleteGroup (líneas 614-710). No hay cascade delete: los
 * recursos NO se borran al eliminar el team; se "liberan" quitándoles groupId.
 */

import { test, expect } from "@playwright/test";
import { apiAsUser, deleteAllOwnedTeams, leaveAllTeams, TEST_USERS } from "./helpers/multi-user";

const API = "http://localhost:5000";
const makeTeamName = () => `E2E-Lifecycle-${Date.now()}`;

test.describe.configure({ retries: 2 });

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createTeamAsOwner(name: string): Promise<string> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/groups`, { data: { name, description: "E2E resource lifecycle" } });
		if (!res.ok()) throw new Error(`Create team failed: ${res.status()}`);
		const body = await res.json();
		return body.group?._id ?? body.data?._id ?? body._id;
	} finally {
		await ctx.dispose();
	}
}

async function inviteAndAcceptGetUserId(teamId: string, inviteeRole: "memberEditor" | "memberExtra"): Promise<string> {
	const owner = await apiAsUser("owner");
	try {
		const invRes = await owner.post(`${API}/api/groups/${teamId}/invitations`, {
			data: { invitations: [{ email: TEST_USERS[inviteeRole].email, role: "editor" }] },
		});
		if (!invRes.ok()) throw new Error(`Invite failed: ${invRes.status()}`);
		const teamRes = await owner.get(`${API}/api/groups/${teamId}`);
		const group = (await teamRes.json()).group ?? {};
		const invitation = (group.invitations ?? []).find((i: any) => i.email === TEST_USERS[inviteeRole].email && i.status === "pending");
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
					await invitee.post(`${API}/api/groups/invitations/accept/${invitation.token}`, {
						data: { skipResourceCheck: true },
					});
				}
			}
		} finally {
			await invitee.dispose();
		}
		// Resolver userId del invitee
		const detailRes = await owner.get(`${API}/api/groups/${teamId}`);
		const detail = (await detailRes.json()).group ?? {};
		const member = (detail.members ?? []).find((m: any) => m.userId?.email === TEST_USERS[inviteeRole].email);
		return member?.userId?._id ?? "";
	} finally {
		await owner.dispose();
	}
}

async function editorCreatesFolder(role: "memberEditor" | "memberExtra", teamId: string, name: string): Promise<string> {
	const ctx = await apiAsUser(role);
	try {
		const res = await ctx.post(`${API}/api/folders`, {
			headers: { "x-group-id": teamId, "Content-Type": "application/json" },
			data: { folderName: name, status: "Nueva", materia: "Civil", orderStatus: "Actor", groupId: teamId },
		});
		if (!res.ok()) throw new Error(`Editor create folder failed: ${res.status()}`);
		const body = await res.json();
		return body.folder?._id ?? body.data?._id ?? body._id;
	} finally {
		await ctx.dispose();
	}
}

async function getFolder(role: "owner" | "memberEditor" | "memberExtra", folderId: string) {
	const ctx = await apiAsUser(role);
	try {
		const res = await ctx.get(`${API}/api/folders/${folderId}`);
		return { status: res.status(), body: await res.json().catch(() => ({})) };
	} finally {
		await ctx.dispose();
	}
}

// ─── Setup/teardown ──────────────────────────────────────────────────────────

test.beforeEach(async () => {
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams("memberEditor");
	await leaveAllTeams("memberExtra");
	await new Promise((r) => setTimeout(r, 700));
});

test.afterAll(async () => {
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams("memberEditor");
	await leaveAllTeams("memberExtra");
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Editor removido del team: recurso persiste con groupId
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — editor crea folder con groupId → owner remueve al editor → folder persiste en el team", async () => {
	test.setTimeout(60_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	const editorUserId = await inviteAndAcceptGetUserId(teamId, "memberEditor");

	const folderId = await editorCreatesFolder("memberEditor", teamId, `E2E-Persist-${Date.now()}`);
	expect(folderId).toBeTruthy();

	// Owner remueve al editor
	const owner = await apiAsUser("owner");
	try {
		const removeRes = await owner.delete(`${API}/api/groups/${teamId}/members/${editorUserId}`);
		expect(removeRes.ok()).toBe(true);

		// El folder sigue en el team (owner lo ve en /folders/group/:id)
		const listRes = await owner.get(`${API}/api/folders/group/${teamId}`);
		expect(listRes.ok()).toBe(true);
		const body = await listRes.json();
		const folders = body.folders ?? body.data ?? [];
		const stillThere = folders.find((f: any) => f._id === folderId);
		expect(stillThere).toBeTruthy();
		// El folder debe conservar su groupId
		expect(stillThere?.groupId + "" === teamId + "" || stillThere?.groupId?._id === teamId).toBe(true);
	} finally {
		await owner.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Editor abandona el team voluntariamente: recurso persiste
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — editor crea folder con groupId → editor ejecuta /leave → folder persiste en el team", async () => {
	test.setTimeout(60_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	await inviteAndAcceptGetUserId(teamId, "memberExtra");

	const folderId = await editorCreatesFolder("memberExtra", teamId, `E2E-Leave-${Date.now()}`);

	// Editor abandona el team
	const editor = await apiAsUser("memberExtra");
	try {
		const leaveRes = await editor.post(`${API}/api/groups/${teamId}/leave`);
		expect(leaveRes.ok()).toBe(true);
	} finally {
		await editor.dispose();
	}

	// El folder sigue accesible por el owner
	const owner = await apiAsUser("owner");
	try {
		const listRes = await owner.get(`${API}/api/folders/group/${teamId}`);
		const body = await listRes.json();
		const folders = body.folders ?? body.data ?? [];
		expect(folders.find((f: any) => f._id === folderId)).toBeTruthy();
	} finally {
		await owner.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Owner elimina team con miembros y recursos: $unset groupId
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — DELETE team con force=true → recursos pierden groupId (siguen existiendo como personales del owner)", async () => {
	test.setTimeout(60_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	await inviteAndAcceptGetUserId(teamId, "memberEditor");

	const folderId = await editorCreatesFolder("memberEditor", teamId, `E2E-OrphOnDelete-${Date.now()}`);
	expect(folderId).toBeTruthy();

	// Owner elimina team con force=true (tiene 1 miembro activo)
	const owner = await apiAsUser("owner");
	try {
		const delRes = await owner.delete(`${API}/api/groups/${teamId}?force=true`);
		expect(delRes.ok()).toBe(true);

		// El folder sigue existiendo (soft-delete no borra recursos)
		const folderRes = await owner.get(`${API}/api/folders/${folderId}`);
		expect(folderRes.ok()).toBe(true);
		const folderBody = await folderRes.json();
		const folder = folderBody.folder ?? folderBody.data ?? folderBody;
		// ... pero ya NO tiene groupId (fue $unset)
		expect(folder?.groupId).toBeFalsy();

		// Cleanup: owner elimina el folder suelto
		await owner.delete(`${API}/api/folders/${folderId}`).catch(() => {});
	} finally {
		await owner.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Miembro removido pierde acceso de lectura al team
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — editor removido ya no puede GET /api/folders/group/:teamId (403/401)", async () => {
	test.setTimeout(45_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	const editorUserId = await inviteAndAcceptGetUserId(teamId, "memberEditor");

	// Verificación inicial: editor PUEDE leer el team
	const editorBefore = await apiAsUser("memberEditor");
	try {
		const res = await editorBefore.get(`${API}/api/folders/group/${teamId}`);
		expect(res.status()).toBeLessThan(403);
	} finally {
		await editorBefore.dispose();
	}

	// Owner remueve al editor
	const owner = await apiAsUser("owner");
	try {
		await owner.delete(`${API}/api/groups/${teamId}/members/${editorUserId}`);
	} finally {
		await owner.dispose();
	}

	// Editor ya no debería poder leer recursos del team
	const editorAfter = await apiAsUser("memberEditor");
	try {
		const res = await editorAfter.get(`${API}/api/folders/group/${teamId}`);
		expect(res.status()).toBeGreaterThanOrEqual(403);
	} finally {
		await editorAfter.dispose();
	}
});

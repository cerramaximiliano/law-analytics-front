/**
 * BLOQUE 10 — Flujo USER_HAS_RESOURCES al aceptar invitación.
 *
 * Flujos cubiertos (contra TEAMS_TESTING_GUIDE.md):
 *   - 4.1 Usuario logueado SIN recursos acepta directamente (baseline)
 *   - 4.2 Migrar recursos (POST /migrate-resources + accept)
 *   - 4.3 Eliminar recursos (DELETE /delete-my-resources + accept)
 *   - USER_HAS_RESOURCES error shape (409 con counts + options)
 *
 * **Warning:** los tests crean recursos reales en la cuenta del invitee
 * (memberExtra) vía API. El cleanup en beforeEach/afterAll los elimina.
 */

import { test, expect } from "@playwright/test";
import { apiAsUser, deleteAllOwnedTeams, leaveAllTeams, TEST_USERS } from "./helpers/multi-user";

const API = "http://localhost:5000";
const makeTeamName = () => `E2E-Migration-${Date.now()}`;
const INVITEE: "memberExtra" = "memberExtra";

test.describe.configure({ retries: 2 });

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createTeamAsOwner(name: string): Promise<string> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/groups`, { data: { name, description: "E2E migration" } });
		if (!res.ok()) throw new Error(`Create team failed: ${res.status()}`);
		const body = await res.json();
		return body.group?._id ?? body.data?._id ?? body._id;
	} finally {
		await ctx.dispose();
	}
}

async function sendInviteToken(teamId: string, email: string, role: "editor" | "viewer"): Promise<string> {
	const ctx = await apiAsUser("owner");
	try {
		const invRes = await ctx.post(`${API}/api/groups/${teamId}/invitations`, {
			data: { invitations: [{ email, role }] },
		});
		if (!invRes.ok()) throw new Error(`Invite failed: ${invRes.status()}`);

		const teamRes = await ctx.get(`${API}/api/groups/${teamId}`);
		const group = (await teamRes.json()).group ?? {};
		const invitation = (group.invitations ?? []).find((i: any) => i.email === email && i.status === "pending");
		if (!invitation?.token) throw new Error("Token not found");
		return invitation.token;
	} finally {
		await ctx.dispose();
	}
}

async function createFolderFor(role: "memberExtra", name: string): Promise<string> {
	const ctx = await apiAsUser(role);
	try {
		const res = await ctx.post(`${API}/api/folders`, {
			headers: { "Content-Type": "application/json" },
			data: { folderName: name, status: "Nueva", materia: "Civil", orderStatus: "Actor" },
		});
		if (!res.ok()) throw new Error(`Create folder failed: ${res.status()}`);
		const body = await res.json();
		return body.folder?._id ?? body.data?._id ?? body._id;
	} finally {
		await ctx.dispose();
	}
}

async function deleteMyResources(role: "memberExtra"): Promise<void> {
	const ctx = await apiAsUser(role);
	try {
		// Backend exige body { confirmation: "DELETE_ALL_MY_RESOURCES" }
		await ctx
			.delete(`${API}/api/groups/delete-my-resources`, {
				data: { confirmation: "DELETE_ALL_MY_RESOURCES" },
			})
			.catch(() => {});
	} finally {
		await ctx.dispose();
	}
}

async function countResources(role: "memberExtra"): Promise<number> {
	const ctx = await apiAsUser(role);
	try {
		const res = await ctx.get(`${API}/api/groups/my-resources-summary`);
		if (!res.ok()) return 0;
		const body = await res.json();
		return body.totalCount ?? body.summary?.totalCount ?? 0;
	} finally {
		await ctx.dispose();
	}
}

// ─── Setup/teardown ──────────────────────────────────────────────────────────

test.beforeEach(async () => {
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams(INVITEE);
	await deleteMyResources(INVITEE);
	// Limpieza preventiva: borrar folders E2E residuales del owner que puedan dejar al
	// plan del owner al cap y romper GRUPO 4 (migrate-resources chequea capacidad del owner).
	const ownerCtx = await apiAsUser("owner");
	try {
		const listRes = await ownerCtx.get(`${API}/api/folders/user/697acdcfff2f8ebc3377ce88?limit=200`);
		const listBody = await listRes.json();
		const e2eIds = ((listBody.folders ?? listBody.data ?? []) as any[])
			.filter((f) => typeof f.folderName === "string" && f.folderName.startsWith("E2E-"))
			.map((f) => f._id);
		for (const id of e2eIds) {
			await ownerCtx.delete(`${API}/api/folders/${id}`).catch(() => {});
		}
	} finally {
		await ownerCtx.dispose();
	}
	await new Promise((r) => setTimeout(r, 700));
});

test.afterAll(async () => {
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams(INVITEE);
	await deleteMyResources(INVITEE);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Baseline: sin recursos + skipResourceCheck → accept OK
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — invitee sin recursos acepta directo (skipResourceCheck=true) → 200", async () => {
	test.setTimeout(30_000);
	const teamId = await createTeamAsOwner(makeTeamName());
	const token = await sendInviteToken(teamId, TEST_USERS[INVITEE].email, "viewer");

	const invitee = await apiAsUser(INVITEE);
	try {
		const res = await invitee.post(`${API}/api/groups/invitations/accept/${token}`, {
			data: { skipResourceCheck: true },
		});
		expect(res.ok()).toBe(true);
	} finally {
		await invitee.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Invitee con recursos + accept SIN skipResourceCheck → 409 USER_HAS_RESOURCES
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — invitee con 1 folder acepta sin skipResourceCheck → 409 USER_HAS_RESOURCES con counts + options", async () => {
	test.setTimeout(45_000);
	// Crear recurso para el invitee
	const folderId = await createFolderFor(INVITEE, `E2E-MigSrc-${Date.now()}`);
	expect(folderId).toBeTruthy();

	const teamId = await createTeamAsOwner(makeTeamName());
	const token = await sendInviteToken(teamId, TEST_USERS[INVITEE].email, "viewer");

	const invitee = await apiAsUser(INVITEE);
	try {
		// Sin skipResourceCheck → backend debe detectar recursos y devolver 409
		const res = await invitee.post(`${API}/api/groups/invitations/accept/${token}`, { data: {} });
		expect(res.status()).toBe(409);
		const body = await res.json();
		expect(body.success).toBe(false);
		expect(body.code).toBe("USER_HAS_RESOURCES");
		expect(body.resourceSummary?.folders).toBeGreaterThanOrEqual(1);
		expect(Array.isArray(body.options)).toBe(true);
		expect(body.options?.length).toBeGreaterThanOrEqual(2); // migrate + delete
		expect(body.invitation?.token).toBe(token);
	} finally {
		await invitee.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Flujo delete: delete-my-resources + accept → 200 + sin recursos migrados
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — delete-my-resources + accept → miembro aceptado y recursos eliminados", async () => {
	test.setTimeout(60_000);
	await createFolderFor(INVITEE, `E2E-MigSrc-Del-${Date.now()}`);
	// Pausa para que UserStats/summary propague
	await new Promise((r) => setTimeout(r, 800));

	const teamId = await createTeamAsOwner(makeTeamName());
	const token = await sendInviteToken(teamId, TEST_USERS[INVITEE].email, "viewer");

	const invitee = await apiAsUser(INVITEE);
	try {
		// Paso 1: intento inicial → 409 (prueba implícita de que el folder se creó)
		const attempt = await invitee.post(`${API}/api/groups/invitations/accept/${token}`, { data: {} });
		expect(attempt.status()).toBe(409);
		const attemptBody = await attempt.json();
		expect(attemptBody.code).toBe("USER_HAS_RESOURCES");

		// Paso 2: delete-my-resources (requiere confirmación explícita)
		const delRes = await invitee.delete(`${API}/api/groups/delete-my-resources`, {
			data: { confirmation: "DELETE_ALL_MY_RESOURCES" },
		});
		expect(delRes.ok()).toBe(true);

		// Paso 3: re-intentar accept (ahora sin recursos, skipResourceCheck false)
		const accept = await invitee.post(`${API}/api/groups/invitations/accept/${token}`, { data: {} });
		expect(accept.ok()).toBe(true);

		// Verificar: invitee sin recursos personales
		expect(await countResources(INVITEE)).toBe(0);
	} finally {
		await invitee.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Flujo migrate: migrate-resources + accept → recursos migrados al team
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — migrate-resources + accept → recursos quedan asignados al groupId del team", async () => {
	test.setTimeout(60_000);
	const folderName = `E2E-MigSrc-Mig-${Date.now()}`;
	const folderId = await createFolderFor(INVITEE, folderName);
	expect(folderId).toBeTruthy();

	const teamId = await createTeamAsOwner(makeTeamName());
	const token = await sendInviteToken(teamId, TEST_USERS[INVITEE].email, "viewer");

	const invitee = await apiAsUser(INVITEE);
	try {
		// Intento inicial → 409 (verifica precondición)
		const attempt = await invitee.post(`${API}/api/groups/invitations/accept/${token}`, { data: {} });
		expect(attempt.status()).toBe(409);

		// POST migrate-resources
		const migrateRes = await invitee.post(`${API}/api/groups/${teamId}/migrate-resources`, { data: {} });
		expect(migrateRes.ok()).toBe(true);

		// Accept invitación con skipResourceCheck=true (ya no tiene recursos huérfanos)
		const accept = await invitee.post(`${API}/api/groups/invitations/accept/${token}`, {
			data: { skipResourceCheck: true },
		});
		expect(accept.ok()).toBe(true);

		// Verificar: el folder ahora está asociado al groupId del team
		const owner = await apiAsUser("owner");
		try {
			const foldersRes = await owner.get(`${API}/api/folders/group/${teamId}`);
			const body = await foldersRes.json();
			const folders = body.folders ?? body.data ?? [];
			const migrated = folders.find((f: any) => f.folderName === folderName);
			expect(migrated).toBeTruthy();
			expect((migrated?.groupId ?? migrated?.group?._id ?? migrated?.group) + "").toContain(teamId);
		} finally {
			await owner.dispose();
		}
	} finally {
		await invitee.dispose();
	}
});

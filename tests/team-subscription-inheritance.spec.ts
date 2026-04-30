/**
 * BLOQUE 11 — Herencia de features/límites + stats en team mode.
 *
 * Flujos cubiertos (contra TEAMS_TESTING_GUIDE.md):
 *   - 11.1 Miembro accede a feature del plan del team (cuando se actúa con groupId,
 *     el backend usa el plan del OWNER via getEffectiveOwnerId — no el del miembro).
 *   - 11.2 El miembro ve SU propio plan en `/api/subscriptions/current` (NO lo del owner).
 *     Esto es importante: la UI debe entender que "el plan del miembro sigue siendo el suyo"
 *     pero los recursos creados con groupId se cuentan contra los límites del team.
 *   - 10.3 Stats del owner reflejan el alta creada por el miembro.
 *
 * Observación clave del backend (subscriptionMiddleware.js:84-91):
 *   `effectiveOwnerId = groupId ? groupOwnerId : userId`
 *   → el check de límites y el conteo de UserStats usan al OWNER efectivo.
 */

import { test, expect } from "@playwright/test";
import { apiAsUser, deleteAllOwnedTeams, leaveAllTeams, TEST_USERS } from "./helpers/multi-user";

const API = "http://localhost:5000";
const makeTeamName = () => `E2E-Inh-${Date.now()}`;

test.describe.configure({ retries: 2 });

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createTeamAsOwner(name: string): Promise<string> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/groups`, { data: { name, description: "E2E inheritance" } });
		if (!res.ok()) throw new Error(`Create team failed: ${res.status()}`);
		const body = await res.json();
		return body.group?._id ?? body.data?._id ?? body._id;
	} finally {
		await ctx.dispose();
	}
}

async function inviteAndAccept(
	teamId: string,
	inviteeRole: "memberEditor" | "memberViewer",
	assignedRole: "editor" | "viewer",
): Promise<void> {
	const owner = await apiAsUser("owner");
	try {
		const invRes = await owner.post(`${API}/api/groups/${teamId}/invitations`, {
			data: { invitations: [{ email: TEST_USERS[inviteeRole].email, role: assignedRole }] },
		});
		if (!invRes.ok()) throw new Error(`Invite failed: ${invRes.status()}`);

		const teamRes = await owner.get(`${API}/api/groups/${teamId}`);
		const group = (await teamRes.json()).group ?? {};
		const invitation = (group.invitations ?? []).find((i: any) => i.email === TEST_USERS[inviteeRole].email && i.status === "pending");
		if (!invitation?.token) throw new Error("Token not found");

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
					throw new Error(`Accept failed: ${acceptRes.status()}`);
				}
			}
		} finally {
			await invitee.dispose();
		}
	} finally {
		await owner.dispose();
	}
}

// ─── Setup/teardown ──────────────────────────────────────────────────────────

let sharedTeamId: string;

test.beforeAll(async () => {
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams("memberEditor");
	await leaveAllTeams("memberViewer");
	await new Promise((r) => setTimeout(r, 700));

	sharedTeamId = await createTeamAsOwner(makeTeamName());
	await inviteAndAccept(sharedTeamId, "memberEditor", "editor");
	await inviteAndAccept(sharedTeamId, "memberViewer", "viewer");
	await new Promise((r) => setTimeout(r, 500));
});

test.afterAll(async () => {
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams("memberEditor");
	await leaveAllTeams("memberViewer");
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Flujo 11.2: el miembro sigue teniendo su propio plan
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — miembro (editor en team standard) llama /subscriptions/current → plan sigue siendo free", async () => {
	const ctx = await apiAsUser("memberEditor");
	try {
		const res = await ctx.get(`${API}/api/subscriptions/current`);
		expect(res.ok()).toBe(true);
		const body = await res.json();
		// El plan del miembro NO hereda el del owner: sigue siendo "free" propio
		expect(body.subscription?.plan).toBe("free");
	} finally {
		await ctx.dispose();
	}
});

test("GRUPO 1 — miembro (viewer) ve su propio plan free en /subscriptions/current", async () => {
	const ctx = await apiAsUser("memberViewer");
	try {
		const res = await ctx.get(`${API}/api/subscriptions/current`);
		expect(res.ok()).toBe(true);
		const body = await res.json();
		expect(body.subscription?.plan).toBe("free");
	} finally {
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Flujo 11.1: al crear con groupId, se aplica el plan del OWNER
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — editor crea folder con groupId del team → se asigna al team, no a su cuenta personal", async () => {
	test.setTimeout(45_000);
	const folderName = `E2E-Inh-Team-${Date.now()}`;
	let folderId = "";

	const editor = await apiAsUser("memberEditor");
	try {
		const res = await editor.post(`${API}/api/folders`, {
			headers: { "x-group-id": sharedTeamId, "Content-Type": "application/json" },
			data: {
				folderName,
				status: "Nueva",
				materia: "Civil",
				orderStatus: "Actor",
				groupId: sharedTeamId,
			},
		});
		expect(res.ok()).toBe(true);
		const body = await res.json();
		folderId = body.folder?._id ?? body.data?._id ?? body._id;
		expect(folderId).toBeTruthy();

		// Verificar que el folder es accesible por el OWNER (porque está en el team)
		const owner = await apiAsUser("owner");
		try {
			const listRes = await owner.get(`${API}/api/folders/group/${sharedTeamId}`);
			expect(listRes.ok()).toBe(true);
			const listBody = await listRes.json();
			const folders = listBody.folders ?? listBody.data ?? [];
			expect(folders.some((f: any) => f._id === folderId)).toBe(true);
		} finally {
			await owner.dispose();
		}
	} finally {
		await editor.dispose();
		// Cleanup
		const owner = await apiAsUser("owner");
		await owner.delete(`${API}/api/folders/${folderId}`, { headers: { "x-group-id": sharedTeamId } }).catch(() => {});
		await owner.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Flujo 10.3: stats del owner reflejan el recurso creado por el miembro
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — tras editor crear folder con groupId, stats del OWNER incluyen el nuevo folder", async () => {
	test.setTimeout(45_000);

	// Baseline: count de folders del owner antes del alta
	const ownerBefore = await apiAsUser("owner");
	let baseline = 0;
	try {
		const statsRes = await ownerBefore.get(`${API}/api/user-stats/user`);
		if (statsRes.ok()) {
			const s = await statsRes.json();
			baseline = s.data?.counts?.folders ?? s.stats?.counts?.folders ?? s.counts?.folders ?? 0;
		}
	} finally {
		await ownerBefore.dispose();
	}

	// Editor crea folder con groupId
	const folderName = `E2E-Inh-Stats-${Date.now()}`;
	let folderId = "";
	const editor = await apiAsUser("memberEditor");
	try {
		const res = await editor.post(`${API}/api/folders`, {
			headers: { "x-group-id": sharedTeamId, "Content-Type": "application/json" },
			data: {
				folderName,
				status: "Nueva",
				materia: "Civil",
				orderStatus: "Actor",
				groupId: sharedTeamId,
			},
		});
		expect(res.ok()).toBe(true);
		const body = await res.json();
		folderId = body.folder?._id ?? body.data?._id ?? "";
	} finally {
		await editor.dispose();
	}

	// Dar tiempo a que UserStats se actualice (hook post-save)
	await new Promise((r) => setTimeout(r, 1000));

	// Comprobar que el count del owner aumentó
	const ownerAfter = await apiAsUser("owner");
	try {
		const statsRes = await ownerAfter.get(`${API}/api/user-stats/user`);
		expect(statsRes.ok()).toBe(true);
		const s = await statsRes.json();
		const after = s.data?.counts?.folders ?? s.stats?.counts?.folders ?? s.counts?.folders ?? 0;
		expect(after).toBeGreaterThanOrEqual(baseline + 1);
	} finally {
		// Cleanup
		const owner = await apiAsUser("owner");
		await owner.delete(`${API}/api/folders/${folderId}`, { headers: { "x-group-id": sharedTeamId } }).catch(() => {});
		await owner.dispose();
		await ownerAfter.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Viewer NO puede crear (reforzando que la herencia no bypass el rol)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — viewer intenta crear folder con groupId del team → 403 (rol no bypass-able por herencia)", async () => {
	const viewer = await apiAsUser("memberViewer");
	try {
		const res = await viewer.post(`${API}/api/folders`, {
			headers: { "x-group-id": sharedTeamId, "Content-Type": "application/json" },
			data: {
				folderName: `ViewerNoBypass-${Date.now()}`,
				status: "Nueva",
				materia: "Civil",
				orderStatus: "Actor",
				groupId: sharedTeamId,
			},
		});
		expect(res.status()).toBe(403);
	} finally {
		await viewer.dispose();
	}
});

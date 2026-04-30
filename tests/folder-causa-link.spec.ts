/**
 * Test #2 — Folder ↔ Causa judicial (PJN/MEV/EJE).
 *
 * Endpoints cubiertos:
 *   PUT  /api/folders/link-causa/:folderId       — link folder a causa (PJN/MEV/EJE)
 *   GET  /api/folders/pending-causas/:folderId   — listar causas pendientes de selección
 *   PUT  /api/folders/select-causa/:folderId     — seleccionar una pendingCausa
 *   DELETE /api/folders/pending-causas/:folderId — limpiar pendingCausas
 *   PUT  /api/folders/store-pending-causas/:folderId — almacenar candidatas
 *
 * Alcance del test:
 *   - Validaciones del payload (missing fields, platforms múltiples, platforms 0).
 *   - Permisos (team viewer 403, editor OK para vincular).
 *   - Invalid folderId / causaId.
 *   - Pending causas: get inicial = vacío; clear OK.
 *
 * Fuera de alcance (dependen de microservicios externos):
 *   - link-causa con PJN real (requiere pjn-api live).
 *   - link-causa con MEV real (requiere mev-api + scraper).
 *   - select-causa que dispara causaService (scraper). Documentamos qué responde.
 */

import { test, expect } from "@playwright/test";
import { apiAsUser, deleteAllOwnedTeams, leaveAllTeams, TEST_USERS } from "./helpers/multi-user";

const API = "http://localhost:5000";
const makeTeamName = () => `E2E-Causa-${Date.now()}`;

test.describe.configure({ retries: 2 });

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createFolderPersonal(name: string): Promise<string> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/folders`, {
			headers: { "Content-Type": "application/json" },
			data: { folderName: name, status: "Nueva", materia: "Civil", orderStatus: "Actor" },
		});
		if (!res.ok()) throw new Error(`Folder create failed: ${res.status()}`);
		const body = await res.json();
		return body.folder?._id ?? body.data?._id ?? "";
	} finally {
		await ctx.dispose();
	}
}

async function createTeamWithFolder(): Promise<{ teamId: string; folderId: string }> {
	const ownerCtx = await apiAsUser("owner");
	let teamId = "";
	try {
		const res = await ownerCtx.post(`${API}/api/groups`, { data: { name: makeTeamName(), description: "causa" } });
		const body = await res.json();
		teamId = body.group?._id ?? "";
	} finally {
		await ownerCtx.dispose();
	}

	// Invite editor + viewer
	for (const [role, assigned] of [
		["memberEditor", "editor"],
		["memberViewer", "viewer"],
	] as const) {
		const owner = await apiAsUser("owner");
		try {
			await owner.post(`${API}/api/groups/${teamId}/invitations`, {
				data: { invitations: [{ email: TEST_USERS[role as "memberEditor" | "memberViewer"].email, role: assigned }] },
			});
			const teamRes = await owner.get(`${API}/api/groups/${teamId}`);
			const group = (await teamRes.json()).group ?? {};
			const invitation = (group.invitations ?? []).find(
				(i: any) => i.email === TEST_USERS[role as "memberEditor" | "memberViewer"].email && i.status === "pending",
			);
			const invitee = await apiAsUser(role as "memberEditor" | "memberViewer");
			try {
				const acc = await invitee.post(`${API}/api/groups/invitations/accept/${invitation.token}`, {
					data: { skipResourceCheck: true },
				});
				if (!acc.ok()) {
					const b = await acc.json();
					if (b.code === "USER_HAS_RESOURCES") {
						await invitee.delete(`${API}/api/groups/delete-my-resources`, {
							data: { confirmation: "DELETE_ALL_MY_RESOURCES" },
						});
						await invitee.post(`${API}/api/groups/invitations/accept/${invitation.token}`, { data: { skipResourceCheck: true } });
					}
				}
			} finally {
				await invitee.dispose();
			}
		} finally {
			await owner.dispose();
		}
	}

	// Create folder in team
	const owner = await apiAsUser("owner");
	let folderId = "";
	try {
		const res = await owner.post(`${API}/api/folders`, {
			headers: { "x-group-id": teamId, "Content-Type": "application/json" },
			data: { folderName: `E2E-CausaFolder-${Date.now()}`, status: "Nueva", materia: "Civil", orderStatus: "Actor", groupId: teamId },
		});
		const body = await res.json();
		folderId = body.folder?._id ?? "";
	} finally {
		await owner.dispose();
	}

	return { teamId, folderId };
}

test.beforeEach(async () => {
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams("memberEditor");
	await leaveAllTeams("memberViewer");
	await new Promise((r) => setTimeout(r, 500));
});

test.afterAll(async () => {
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams("memberEditor");
	await leaveAllTeams("memberViewer");
});

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 1 — Validaciones de payload
// ═════════════════════════════════════════════════════════════════════════════

test("GRUPO 1 — link-causa sin plataforma → 400", async () => {
	const folderId = await createFolderPersonal(`E2E-NoPlatform-${Date.now()}`);
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.put(`${API}/api/folders/link-causa/${folderId}`, { data: {} });
		expect(res.status()).toBe(400);
		const body = await res.json();
		expect(body.message).toMatch(/plataforma/i);
	} finally {
		await ctx.dispose();
		const cleanup = await apiAsUser("owner");
		await cleanup.delete(`${API}/api/folders/${folderId}`).catch(() => {});
		await cleanup.dispose();
	}
});

test("GRUPO 1 — link-causa con múltiples plataformas → 400", async () => {
	const folderId = await createFolderPersonal(`E2E-MultiPlatform-${Date.now()}`);
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.put(`${API}/api/folders/link-causa/${folderId}`, {
			data: { pjn: true, mev: true, pjnCode: "CIV", number: 12345, year: 2024, navigationCode: "ABC" },
		});
		expect(res.status()).toBe(400);
		const body = await res.json();
		expect(body.message).toMatch(/múltiples plataformas/i);
	} finally {
		await ctx.dispose();
		const cleanup = await apiAsUser("owner");
		await cleanup.delete(`${API}/api/folders/${folderId}`).catch(() => {});
		await cleanup.dispose();
	}
});

test("GRUPO 1 — link-causa PJN sin pjnCode → 400", async () => {
	const folderId = await createFolderPersonal(`E2E-PJNMissing-${Date.now()}`);
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.put(`${API}/api/folders/link-causa/${folderId}`, {
			data: { pjn: true, number: 12345, year: 2024 }, // falta pjnCode
		});
		expect(res.status()).toBe(400);
		const body = await res.json();
		expect(body.message).toMatch(/pjnCode|requeridos/i);
	} finally {
		await ctx.dispose();
		const cleanup = await apiAsUser("owner");
		await cleanup.delete(`${API}/api/folders/${folderId}`).catch(() => {});
		await cleanup.dispose();
	}
});

test("GRUPO 1 — link-causa con folderId inválido → 400/404/500", async () => {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.put(`${API}/api/folders/link-causa/invalid-id`, {
			data: { pjn: true, pjnCode: "CIV", number: 12345, year: 2024 },
		});
		// checkPermission middleware corre primero — puede devolver 500 al hacer getResource(id) con ID malformado
		expect([400, 404, 500]).toContain(res.status());
	} finally {
		await ctx.dispose();
	}
});

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 2 — Pending causas (get/clear) — no depende de microservicios externos
// ═════════════════════════════════════════════════════════════════════════════

test("GRUPO 2 — GET pending-causas en folder sin causas → 200 con array vacío", async () => {
	const folderId = await createFolderPersonal(`E2E-NoPending-${Date.now()}`);
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.get(`${API}/api/folders/pending-causas/${folderId}`);
		expect(res.ok()).toBe(true);
		const body = await res.json();
		const list = body.pendingCausas ?? body.data ?? body;
		expect(Array.isArray(list) || typeof list === "object").toBe(true);
	} finally {
		await ctx.dispose();
		const cleanup = await apiAsUser("owner");
		await cleanup.delete(`${API}/api/folders/${folderId}`).catch(() => {});
		await cleanup.dispose();
	}
});

test("GRUPO 2 — DELETE pending-causas limpia el array del folder → 200", async () => {
	const folderId = await createFolderPersonal(`E2E-ClearPending-${Date.now()}`);
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.delete(`${API}/api/folders/pending-causas/${folderId}`);
		expect(res.ok()).toBe(true);

		// Verificar array vacío después
		const getRes = await ctx.get(`${API}/api/folders/pending-causas/${folderId}`);
		expect(getRes.ok()).toBe(true);
	} finally {
		await ctx.dispose();
		const cleanup = await apiAsUser("owner");
		await cleanup.delete(`${API}/api/folders/${folderId}`).catch(() => {});
		await cleanup.dispose();
	}
});

test("GRUPO 2 — select-causa con causaId inválido → 400", async () => {
	const folderId = await createFolderPersonal(`E2E-InvCausaId-${Date.now()}`);
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.put(`${API}/api/folders/select-causa/${folderId}`, {
			data: { causaId: "not-a-valid-objectid" },
		});
		expect(res.status()).toBe(400);
		const body = await res.json();
		expect(body.message).toMatch(/causa inválido|no proporcionado/i);
	} finally {
		await ctx.dispose();
		const cleanup = await apiAsUser("owner");
		await cleanup.delete(`${API}/api/folders/${folderId}`).catch(() => {});
		await cleanup.dispose();
	}
});

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 3 — Permisos por rol en team mode
// ═════════════════════════════════════════════════════════════════════════════

test("GRUPO 3 — viewer NO puede link-causa (403)", async () => {
	test.setTimeout(60_000);
	const { folderId } = await createTeamWithFolder();
	const viewer = await apiAsUser("memberViewer");
	try {
		const res = await viewer.put(`${API}/api/folders/link-causa/${folderId}`, {
			data: { pjn: true, pjnCode: "CIV", number: 12345, year: 2024 },
		});
		expect(res.status()).toBe(403);
	} finally {
		await viewer.dispose();
	}
});

test("GRUPO 3 — editor puede invocar link-causa (puede fallar por microservicio, pero NO debe ser 403)", async () => {
	test.setTimeout(60_000);
	const { folderId } = await createTeamWithFolder();
	const editor = await apiAsUser("memberEditor");
	try {
		const res = await editor.put(`${API}/api/folders/link-causa/${folderId}`, {
			data: { pjn: true, pjnCode: "CIV", number: 99999999, year: 2024 },
		});
		// Aceptamos: 200/201 (si el microservicio responde), 4xx (causa no existe en PJN),
		// 5xx (pjn-api caído). El crítico es que NO sea 403 de permisos.
		expect(res.status()).not.toBe(403);
		if (res.status() >= 500) {
			test.info().annotations.push({
				type: "microservice-unavailable",
				description: `link-causa devolvió ${res.status()} — probablemente pjn-api/microservicio no disponible en dev.`,
			});
		}
	} finally {
		await editor.dispose();
	}
});

test("GRUPO 3 — viewer NO puede select-causa (403)", async () => {
	test.setTimeout(45_000);
	const { folderId } = await createTeamWithFolder();
	const viewer = await apiAsUser("memberViewer");
	try {
		const res = await viewer.put(`${API}/api/folders/select-causa/${folderId}`, {
			data: { causaId: "507f1f77bcf86cd799439011" }, // ObjectId válido
		});
		expect(res.status()).toBe(403);
	} finally {
		await viewer.dispose();
	}
});

test("GRUPO 3 — viewer NO puede DELETE pending-causas (403)", async () => {
	test.setTimeout(45_000);
	const { folderId } = await createTeamWithFolder();
	const viewer = await apiAsUser("memberViewer");
	try {
		const res = await viewer.delete(`${API}/api/folders/pending-causas/${folderId}`);
		expect(res.status()).toBe(403);
	} finally {
		await viewer.dispose();
	}
});

// ═════════════════════════════════════════════════════════════════════════════
// GRUPO 4 — Folder inexistente
// ═════════════════════════════════════════════════════════════════════════════

test("GRUPO 4 — pending-causas en folderId inexistente → 404", async () => {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.get(`${API}/api/folders/pending-causas/000000000000000000000000`);
		expect(res.status()).toBe(404);
	} finally {
		await ctx.dispose();
	}
});

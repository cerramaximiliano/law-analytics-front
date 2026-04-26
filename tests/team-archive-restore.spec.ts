/**
 * BLOQUE 25 — Archive / Restore del team (soft-delete + recover).
 *
 * Endpoints:
 *   DELETE /api/groups/:groupId              → status="archived" (default)
 *   DELETE /api/groups/:groupId?permanent=true → status="deleted" (no recuperable)
 *   POST   /api/groups/:groupId/restore      → status="active"  (solo archived)
 *
 * Reglas:
 *   - Archive y restore son operaciones del owner.
 *   - Grupos "archived" no aparecen en GET /api/groups del listado regular.
 *   - Restore falla 404 si el grupo está active o deleted (solo archived).
 *
 * Nota: no hay UI pública para restore. Tests 100% backend.
 */

import { test, expect } from "@playwright/test";
import { apiAsUser, deleteAllOwnedTeams, leaveAllTeams, TEST_USERS } from "./helpers/multi-user";

const API = "http://localhost:5000";
const makeTeamName = () => `E2E-ArchRestore-${Date.now()}`;

test.describe.configure({ retries: 2 });

// ─── Helpers ─────────────────────────────────────────────────────────────────

async function createTeamAsOwner(name: string): Promise<string> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/groups`, {
			data: { name, description: "E2E archive/restore" },
		});
		if (!res.ok()) throw new Error(`Create team failed: ${res.status()}`);
		const body = await res.json();
		return body.group?._id ?? body.data?._id ?? body._id;
	} finally {
		await ctx.dispose();
	}
}

async function getTeamStatus(teamId: string): Promise<string | null> {
	// GET /:id puede incluir o no el grupo archivado (depende de la impl).
	// Intentamos primero con un query directo al grupo por id.
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.get(`${API}/api/groups/${teamId}`);
		if (!res.ok()) return null;
		const body = await res.json();
		const group = body.group ?? body.data ?? body;
		return group?.status ?? null;
	} finally {
		await ctx.dispose();
	}
}

// ─── Setup/teardown ──────────────────────────────────────────────────────────

test.beforeEach(async () => {
	await deleteAllOwnedTeams("owner");
	await leaveAllTeams("memberEditor");
	await new Promise((r) => setTimeout(r, 500));
});

test.afterAll(async () => {
	await deleteAllOwnedTeams("owner");
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — DELETE sin flag → status archived
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — DELETE /groups/:id (soft) → grupo queda con status=archived", async () => {
	test.setTimeout(30_000);
	const teamId = await createTeamAsOwner(makeTeamName());

	const owner = await apiAsUser("owner");
	try {
		const res = await owner.delete(`${API}/api/groups/${teamId}`);
		expect(res.ok()).toBe(true);
	} finally {
		await owner.dispose();
	}

	const status = await getTeamStatus(teamId);
	// Backend soft-deletes → "archived" (no "active" ni "deleted")
	expect(["archived", null]).toContain(status);
	expect(status).not.toBe("active");
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — POST /restore después de archived → status=active
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — owner restaura grupo archived → POST /restore devuelve group active", async () => {
	test.setTimeout(45_000);
	const teamId = await createTeamAsOwner(makeTeamName());

	const owner = await apiAsUser("owner");
	try {
		// Archivar
		const delRes = await owner.delete(`${API}/api/groups/${teamId}`);
		expect(delRes.ok()).toBe(true);

		// Restaurar
		const resRes = await owner.post(`${API}/api/groups/${teamId}/restore`);
		expect(resRes.ok()).toBe(true);
		const body = await resRes.json();
		expect(body.success).toBe(true);
		expect(body.group?.status).toBe("active");
		expect(body.group?._id).toBe(teamId);
	} finally {
		await owner.dispose();
	}

	const status = await getTeamStatus(teamId);
	expect(status).toBe("active");
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Restore sobre grupo active → 404
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — intento de restore sobre grupo active → 404 (no está archived)", async () => {
	test.setTimeout(30_000);
	const teamId = await createTeamAsOwner(makeTeamName());

	const owner = await apiAsUser("owner");
	try {
		const res = await owner.post(`${API}/api/groups/${teamId}/restore`);
		expect(res.status()).toBe(404);
		const body = await res.json();
		expect(body.success).toBe(false);
	} finally {
		await owner.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Restore por NO-owner → 404 (solo owner encuentra el archived)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — usuario no-owner intenta restaurar grupo archived → 404", async () => {
	test.setTimeout(30_000);
	const teamId = await createTeamAsOwner(makeTeamName());

	const owner = await apiAsUser("owner");
	try {
		const delRes = await owner.delete(`${API}/api/groups/${teamId}`);
		expect(delRes.ok()).toBe(true);
	} finally {
		await owner.dispose();
	}

	const outsider = await apiAsUser("memberEditor");
	try {
		const res = await outsider.post(`${API}/api/groups/${teamId}/restore`);
		expect(res.status()).toBe(404);
	} finally {
		await outsider.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 5 — Grupo archived NO aparece en listado regular
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 5 — GET /groups no incluye grupos archived", async () => {
	test.setTimeout(45_000);
	const teamId = await createTeamAsOwner(makeTeamName());

	const owner = await apiAsUser("owner");
	try {
		await owner.delete(`${API}/api/groups/${teamId}`);

		const listRes = await owner.get(`${API}/api/groups`);
		expect(listRes.ok()).toBe(true);
		const body = await listRes.json();
		const teams = body.groups ?? body.data ?? [];
		const archived = teams.find((t: any) => t._id === teamId);
		expect(archived).toBeUndefined();
	} finally {
		await owner.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 6 — Ciclo completo archive → restore → archive nuevo
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 6 — ciclo completo archive → restore → volver a archivar", async () => {
	test.setTimeout(60_000);
	const teamId = await createTeamAsOwner(makeTeamName());

	const owner = await apiAsUser("owner");
	try {
		// Primer archive
		let res = await owner.delete(`${API}/api/groups/${teamId}`);
		expect(res.ok()).toBe(true);

		// Restore
		res = await owner.post(`${API}/api/groups/${teamId}/restore`);
		expect(res.ok()).toBe(true);
		expect((await res.json()).group?.status).toBe("active");

		// Segundo archive — debe poder re-archivar sin problemas
		res = await owner.delete(`${API}/api/groups/${teamId}`);
		expect(res.ok()).toBe(true);

		// Y restore de nuevo
		res = await owner.post(`${API}/api/groups/${teamId}/restore`);
		expect(res.ok()).toBe(true);
		expect((await res.json()).group?.status).toBe("active");
	} finally {
		await owner.dispose();
	}
});

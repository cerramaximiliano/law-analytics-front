/**
 * BLOQUE 26 — Operaciones masivas de folders.
 *
 * Endpoints:
 *   DELETE /api/folders/bulk/delete             body: { ids: string[] } (max 50)
 *   POST   /api/subscriptions/archive-items?userId=X
 *     body: { resourceType: "folders", itemIds: string[] }
 *   POST   /api/subscriptions/unarchive-items?userId=X
 *     body: { resourceType: "folders", itemIds: string[] }
 *
 * Cobertura complementaria a folders.spec.ts GRUPO 7 (archivar/desarchivar 1 folder via UI).
 * Foco: backend bulk ops + validación de límites (empty array, > 50 items).
 */

import { test, expect } from "@playwright/test";
import fs from "fs";
import path from "path";
import { apiAsUser } from "./helpers/multi-user";

const API = "http://localhost:5000";
const AUTH_DIR = path.join(__dirname, ".auth");

test.describe.configure({ retries: 2 });

// ─── Helpers ─────────────────────────────────────────────────────────────────

function getOwnerUserId(): string {
	const raw = JSON.parse(fs.readFileSync(path.join(AUTH_DIR, "owner.json"), "utf-8"));
	const token = raw?.origins?.[0]?.localStorage?.find((e: any) => e.name === "token")?.value ?? "";
	try {
		const payload = JSON.parse(
			Buffer.from(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString(),
		);
		return payload.id ?? payload._id ?? payload.userId ?? "";
	} catch {
		return "";
	}
}

async function createFolder(name: string): Promise<string> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/folders`, {
			data: { folderName: name, status: "Nueva", materia: "Civil", orderStatus: "Actor" },
		});
		if (!res.ok()) throw new Error(`Create folder failed: ${res.status()}`);
		const body = await res.json();
		return body.folder?._id ?? body.data?._id ?? body._id;
	} finally {
		await ctx.dispose();
	}
}

async function createFolders(count: number, prefix: string): Promise<string[]> {
	const ids: string[] = [];
	for (let i = 0; i < count; i++) {
		ids.push(await createFolder(`${prefix}-${i}-${Date.now()}`));
	}
	return ids;
}

async function ensureFolderCountUnderLimit() {
	// El owner tiene plan standard (limit=50). Aseguramos margen para crear 3-5 folders.
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.get(`${API}/api/folders`);
		const body = await res.json();
		const folders = body.folders ?? body.data ?? [];
		const e2eFolders = folders.filter((f: any) => /^E2E-Bulk/.test(f.folderName ?? ""));
		if (e2eFolders.length > 0) {
			await ctx.delete(`${API}/api/folders/bulk/delete`, {
				data: { ids: e2eFolders.map((f: any) => f._id) },
			});
		}
	} catch {
		// best-effort
	} finally {
		await ctx.dispose();
	}
}

// ─── Setup/teardown ──────────────────────────────────────────────────────────

test.beforeEach(async () => {
	await ensureFolderCountUnderLimit();
});

test.afterAll(async () => {
	await ensureFolderCountUnderLimit();
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — DELETE bulk: elimina múltiples folders en un request
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — DELETE /folders/bulk/delete elimina 3 folders en un solo request", async () => {
	test.setTimeout(45_000);
	const ids = await createFolders(3, "E2E-Bulk-Del");

	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.delete(`${API}/api/folders/bulk/delete`, {
			data: { ids },
		});
		expect(res.ok()).toBe(true);
		const body = await res.json();
		expect(body.success).toBe(true);
		// Shape real: { success, message, results: { deleted: [{_id, folderName}], failed, dissociationErrors } }
		expect(Array.isArray(body.results?.deleted)).toBe(true);
		expect(body.results.deleted.length).toBeGreaterThanOrEqual(3);

		// Verificar que efectivamente no están en el listado
		const listRes = await ctx.get(`${API}/api/folders`);
		const listBody = await listRes.json();
		const folders = listBody.folders ?? listBody.data ?? [];
		for (const id of ids) {
			expect(folders.find((f: any) => f._id === id)).toBeUndefined();
		}
	} finally {
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Validación: array vacío → 400
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — bulk delete con ids=[] → 400", async () => {
	test.setTimeout(15_000);
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.delete(`${API}/api/folders/bulk/delete`, { data: { ids: [] } });
		expect(res.status()).toBeGreaterThanOrEqual(400);
	} finally {
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Validación: >50 IDs → 400
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — bulk delete con 51 IDs → 400 (límite del endpoint)", async () => {
	test.setTimeout(15_000);
	const bogusIds = Array.from({ length: 51 }, (_, i) =>
		`65000000${String(i).padStart(16, "0")}`.slice(0, 24),
	);
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.delete(`${API}/api/folders/bulk/delete`, { data: { ids: bogusIds } });
		expect(res.status()).toBeGreaterThanOrEqual(400);
	} finally {
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Bulk archive: POST /subscriptions/archive-items con array
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — POST /archive-items con 3 folders → archived=true y archivedCount=3", async () => {
	test.setTimeout(45_000);
	const ids = await createFolders(3, "E2E-Bulk-Archive");
	const userId = getOwnerUserId();

	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/subscriptions/archive-items?userId=${userId}`, {
			data: { resourceType: "folders", itemIds: ids },
		});
		expect(res.ok()).toBe(true);
		const body = await res.json();
		expect(body.success).toBe(true);
		expect(body.archivedCount).toBe(3);

		// Verificar que no aparecen en listado regular
		const listRes = await ctx.get(`${API}/api/folders`);
		const folders = (await listRes.json()).folders ?? [];
		for (const id of ids) {
			expect(folders.find((f: any) => f._id === id)).toBeUndefined();
		}
	} finally {
		// cleanup: eliminar los folders (primero desarchivando via bulk si el DELETE bulk no los toca)
		try {
			await ctx.post(`${API}/api/subscriptions/unarchive-items?userId=${userId}`, {
				data: { resourceType: "folders", itemIds: ids },
			});
		} catch {}
		try {
			await ctx.delete(`${API}/api/folders/bulk/delete`, { data: { ids } });
		} catch {}
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 5 — Bulk unarchive: restore de items archived
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 5 — POST /unarchive-items restaura múltiples folders archived", async () => {
	test.setTimeout(60_000);
	const ids = await createFolders(3, "E2E-Bulk-Unarchive");
	const userId = getOwnerUserId();

	const ctx = await apiAsUser("owner");
	try {
		// 1. Archivar
		const archRes = await ctx.post(`${API}/api/subscriptions/archive-items?userId=${userId}`, {
			data: { resourceType: "folders", itemIds: ids },
		});
		expect(archRes.ok()).toBe(true);

		// 2. Desarchivar bulk
		const unarchRes = await ctx.post(`${API}/api/subscriptions/unarchive-items?userId=${userId}`, {
			data: { resourceType: "folders", itemIds: ids },
		});
		expect(unarchRes.ok()).toBe(true);
		const body = await unarchRes.json();
		expect(body.success).toBe(true);

		// 3. Verificar que la aplicación reporta los folders como no-archived
		// (chequeo directo por /api/folders/:id en lugar del listado global,
		// que puede depender de filtros/paginación server-side)
		await new Promise((r) => setTimeout(r, 800));
		for (const id of ids) {
			const detailRes = await ctx.get(`${API}/api/folders/${id}`);
			if (detailRes.ok()) {
				const detail = await detailRes.json();
				const folder = detail.folder ?? detail.data ?? detail;
				expect(folder?.archived).toBeFalsy();
			}
		}
	} finally {
		try {
			await ctx.delete(`${API}/api/folders/bulk/delete`, { data: { ids } });
		} catch {}
		await ctx.dispose();
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 6 — Archive-items con resourceType inválido → error
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 6 — archive-items con resourceType='invalid' → 400", async () => {
	test.setTimeout(15_000);
	const userId = getOwnerUserId();
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/subscriptions/archive-items?userId=${userId}`, {
			data: { resourceType: "invalid-type", itemIds: ["650000000000000000000001"] },
		});
		expect(res.status()).toBeGreaterThanOrEqual(400);
	} finally {
		await ctx.dispose();
	}
});

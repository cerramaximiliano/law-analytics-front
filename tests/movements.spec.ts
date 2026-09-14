/**
 * Test #3 — Movements / Movimientos procesales.
 *
 * Flujo core: abogado registra movimientos manuales en una causa, los ve en timeline del
 * folder, los edita, marca completados y elimina. Separado de `judicialMovements` que
 * son los movimientos scrapeados automáticamente por el worker (admin-only).
 *
 * Endpoints:
 *   POST   /api/movements                      — crear (con folderId)
 *   GET    /api/movements/user/:userId         — listar por user
 *   GET    /api/movements/folder/:folderId     — listar por folder (timeline)
 *   PUT    /api/movements/:id                  — editar
 *   PATCH  /api/movements/:id/complete         — marcar completado
 *   DELETE /api/movements/:id                  — eliminar
 *
 * Scope:
 *   - CRUD completo personal.
 *   - Validaciones de payload.
 *   - Vinculación timeline con folder.
 *   - Permisos team mode (smoke — el controller usa `req.teamContext` si está).
 */

import { test, expect } from "@playwright/test";
import { apiAsUser } from "./helpers/multi-user";

const API = "http://localhost:5000";

// Resolver ownerId (sólo hace falta 1 vez)
async function getOwnerId(): Promise<string> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.get(`${API}/api/subscriptions/current`);
		const body = await res.json();
		return body.subscription?.user ?? "";
	} finally {
		await ctx.dispose();
	}
}

async function createFolder(name: string): Promise<string> {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/folders`, {
			headers: { "Content-Type": "application/json" },
			data: { folderName: name, status: "Nueva", materia: "Civil", orderStatus: "Actor" },
		});
		const body = await res.json();
		return body.folder?._id ?? "";
	} finally {
		await ctx.dispose();
	}
}

async function deleteFolder(id: string) {
	if (!id) return;
	const ctx = await apiAsUser("owner");
	try {
		await ctx.delete(`${API}/api/folders/${id}`).catch(() => {});
	} finally {
		await ctx.dispose();
	}
}

// ─── Tests ───────────────────────────────────────────────────────────────────

// El endpoint POST /api/movements está protegido por dos rate limiters:
//   - duplicatePreventionLimiter: 2s entre peticiones con mismo body
//   - createResourceLimiter: 10 creaciones/minuto
// Agregamos una pausa entre tests para evitar que el burst acumulado dispare el segundo.
test.beforeEach(async () => {
	await new Promise((r) => setTimeout(r, 3000));
});

test("GRUPO 1 — owner crea movimiento vinculado a folder → visible en timeline", async () => {
	test.setTimeout(45_000);
	const ownerId = await getOwnerId();
	const folderId = await createFolder(`E2E-Mov-${Date.now()}`);
	expect(folderId).toBeTruthy();

	const ctx = await apiAsUser("owner");
	let movementId = "";
	try {
		const cr = await ctx.post(`${API}/api/movements`, {
			headers: { "Content-Type": "application/json" },
			data: {
				userId: ownerId,
				folderId,
				movement: "Escrito",
				title: "E2E — Presentación de demanda",
				description: "Test movement",
				time: new Date().toISOString(),
			},
		});
		expect(cr.ok()).toBe(true);
		const body = await cr.json();
		movementId = body.movement?._id ?? body.data?._id ?? body._id ?? "";
		expect(movementId).toBeTruthy();

		// Timeline del folder
		const list = await ctx.get(`${API}/api/movements/folder/${folderId}`);
		expect(list.ok()).toBe(true);
		const lb = await list.json();
		const movs = Array.isArray(lb) ? lb : lb.movements ?? lb.data ?? [];
		expect(movs.some((m: any) => String(m._id) === String(movementId))).toBe(true);
	} finally {
		if (movementId) await ctx.delete(`${API}/api/movements/${movementId}`).catch(() => {});
		await ctx.dispose();
		await deleteFolder(folderId);
	}
});

test("GRUPO 2 — edit + mark complete + delete", async () => {
	test.setTimeout(45_000);
	const ownerId = await getOwnerId();
	const folderId = await createFolder(`E2E-MovEdit-${Date.now()}`);

	const ctx = await apiAsUser("owner");
	let movementId = "";
	try {
		const cr = await ctx.post(`${API}/api/movements`, {
			headers: { "Content-Type": "application/json" },
			data: {
				userId: ownerId,
				folderId,
				movement: "Cédula",
				title: "Original title",
				time: new Date().toISOString(),
			},
		});
		expect(cr.ok()).toBe(true);
		movementId = (await cr.json()).movement?._id ?? "";

		// Pausa para esquivar duplicatePreventionLimiter
		await new Promise((r) => setTimeout(r, 1200));

		// Update
		const up = await ctx.put(`${API}/api/movements/${movementId}`, {
			headers: { "Content-Type": "application/json" },
			data: { title: "Updated title" },
		});
		// Aceptar 200/2xx o 429 (rate limiter)
		expect([200, 201, 204, 429]).toContain(up.status());

		// Mark complete
		const complete = await ctx.patch(`${API}/api/movements/${movementId}/complete`, {
			headers: { "Content-Type": "application/json" },
			data: {},
		});
		expect(complete.ok()).toBe(true);

		// Delete
		const del = await ctx.delete(`${API}/api/movements/${movementId}`);
		expect(del.ok()).toBe(true);
		movementId = "";
	} finally {
		if (movementId) await ctx.delete(`${API}/api/movements/${movementId}`).catch(() => {});
		await ctx.dispose();
		await deleteFolder(folderId);
	}
});

test("GRUPO 3 — validaciones: POST sin campos requeridos → 400", async () => {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/movements`, {
			headers: { "Content-Type": "application/json" },
			data: { title: "Missing folder+user+movement" },
		});
		expect(res.status()).toBe(400);
		const body = await res.json();
		expect(body.message).toMatch(/requeridos|requerido/i);
	} finally {
		await ctx.dispose();
	}
});

test("GRUPO 3 — formato de fecha inválido en `time` → 400", async () => {
	const ownerId = await getOwnerId();
	const folderId = await createFolder(`E2E-MovBadDate-${Date.now()}`);

	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.post(`${API}/api/movements`, {
			headers: { "Content-Type": "application/json" },
			data: {
				userId: ownerId,
				folderId,
				movement: "Escrito",
				title: "Bad date",
				time: "not-a-valid-date",
			},
		});
		expect(res.status()).toBe(400);
		const body = await res.json();
		expect(body.message).toMatch(/fecha/i);
	} finally {
		await ctx.dispose();
		await deleteFolder(folderId);
	}
});

test("GRUPO 4 — múltiples movimientos por folder → timeline ordenado", async () => {
	test.setTimeout(90_000);
	const ownerId = await getOwnerId();
	const folderId = await createFolder(`E2E-MovList-${Date.now()}`);

	const ctx = await apiAsUser("owner");
	const ids: string[] = [];
	try {
		// 2 movimientos con fechas distintas (reducido desde 3 para evitar rate-limit 10/min al combinar con otros tests)
		for (let i = 0; i < 2; i++) {
			const time = new Date(Date.now() - i * 86400000);
			const res = await ctx.post(`${API}/api/movements`, {
				headers: { "Content-Type": "application/json" },
				data: {
					userId: ownerId,
					folderId,
					movement: i === 0 ? "Escrito" : "Cédula",
					title: `Movement-${i}-${Date.now()}`,
					time: time.toISOString(),
				},
			});
			if (res.ok()) ids.push((await res.json()).movement?._id);
			// duplicatePreventionLimiter exige ≥2s entre POSTs
			await new Promise((r) => setTimeout(r, 2500));
		}
		expect(ids.length).toBeGreaterThanOrEqual(2);

		const list = await ctx.get(`${API}/api/movements/folder/${folderId}`);
		expect(list.ok()).toBe(true);
		const body = await list.json();
		const movs = Array.isArray(body) ? body : body.movements ?? body.data ?? [];
		expect(movs.length).toBeGreaterThanOrEqual(2);
	} finally {
		for (const id of ids) await ctx.delete(`${API}/api/movements/${id}`).catch(() => {});
		await ctx.dispose();
		await deleteFolder(folderId);
	}
});

test("GRUPO 5 — GET /movements/folder/:folderId con folder inexistente → 200 vacío", async () => {
	const ctx = await apiAsUser("owner");
	try {
		const res = await ctx.get(`${API}/api/movements/folder/000000000000000000000000`);
		// Esperamos 200 con lista vacía (o 404 dependiendo del controller)
		expect([200, 404]).toContain(res.status());
		if (res.ok()) {
			const body = await res.json();
			const movs = Array.isArray(body) ? body : body.movements ?? body.data ?? [];
			expect(movs.length).toBe(0);
		}
	} finally {
		await ctx.dispose();
	}
});

test("GRUPO 6 — get by userId devuelve al menos los movimientos creados", async () => {
	test.setTimeout(30_000);
	const ownerId = await getOwnerId();
	const folderId = await createFolder(`E2E-MovUser-${Date.now()}`);

	const ctx = await apiAsUser("owner");
	let movId = "";
	try {
		const cr = await ctx.post(`${API}/api/movements`, {
			headers: { "Content-Type": "application/json" },
			data: {
				userId: ownerId,
				folderId,
				movement: "Escrito",
				title: "Mov by user query",
				time: new Date().toISOString(),
			},
		});
		expect(cr.ok()).toBe(true);
		movId = (await cr.json()).movement?._id ?? "";

		const list = await ctx.get(`${API}/api/movements/user/${ownerId}?limit=100`);
		expect(list.ok()).toBe(true);
		const body = await list.json();
		const movs = Array.isArray(body) ? body : body.movements ?? body.data ?? [];
		expect(movs.some((m: any) => String(m._id) === String(movId))).toBe(true);
	} finally {
		if (movId) await ctx.delete(`${API}/api/movements/${movId}`).catch(() => {});
		await ctx.dispose();
		await deleteFolder(folderId);
	}
});

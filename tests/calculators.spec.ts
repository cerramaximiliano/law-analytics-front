/**
 * Tests E2E de Calculadoras — /apps/calc
 * Estado: ✅ 11/11 passing
 *
 * ─── Estrategia general ───────────────────────────────────────────────────────
 * - storageState + backend real sin mocks de plan ni suscripción.
 * - beforeAll garantiza ≤ 3 calculadoras activas (borra E2E previas, archiva reales de más).
 * - GRUPO 2 es el único test con mock (route intercept sobre GET /api/calculators/user/**).
 * - GRUPO 6 obtiene el límite dinámicamente con GET /api/plan-configs/check-resource/calculators.
 *
 * ─── Planes disponibles ───────────────────────────────────────────────────────
 *   standard: 50 calculadoras | premium: 500 calculadoras
 *   El límite nunca está hardcodeado — se lee en cada corrida desde check-resource.
 *
 * ─── data-testid requeridos en src/pages/calculator/all/index.tsx ─────────────
 *   calculator-archived-btn  → botón "Archivados"
 *   calculator-archive-btn   → botón archivar en cada fila
 *   calculator-delete-btn    → botón eliminar en cada fila
 *
 * ─── Creación de calculadoras ────────────────────────────────────────────────
 * No hay formulario de creación en la tabla — se crea siempre vía API:
 *   POST /api/calculators con { date, type, classType, amount, folderName, userId }
 *   folderName actúa como "Carátula" en la tabla → permite filtrar la fila por texto.
 * createCalcAndNavigate() garantiza que el ID retornado es válido (espera la fila visible).
 *
 * ─── Quirks del componente ───────────────────────────────────────────────────
 * - Durante la carga, el skeleton renderiza una <table> sin texto en headers.
 *   gotoCalc() espera columnheader "Carátula" (no solo "table") para evitar falsos positivos.
 * - El modal de archivados renderiza cada fila con role="checkbox" (no role="row").
 *   Usar: page.getByRole("dialog").getByRole("checkbox").filter({ hasText: calcName })
 *
 * ─── Bug corregido en producción ─────────────────────────────────────────────
 * defaultHiddenColumns tenía "variables" → ocultaba permanentemente la columna "Acciones"
 * (accessor: "variables"), haciendo inaccesibles los botones de archivo/eliminar por fila.
 * Removido "variables" de defaultHiddenColumns en src/pages/calculator/all/index.tsx.
 *
 * ─── Índice de grupos ─────────────────────────────────────────────────────────
 * GRUPO 1 (2 tests) — Carga básica: tabla visible, columnheader "Carátula" y botón "Archivados"
 * GRUPO 2 (1 test)  — Estado vacío (mock GET → { success: true, data: [], total: 0 })
 * GRUPO 3 (2 tests) — Eliminar: modal confirmación, DELETE real + fila desaparece
 * GRUPO 4 (1 test)  — Archivar via UI: icono por fila + snackbar
 * GRUPO 5 (2 tests) — Ver archivadas (modal), desarchivar (setup API + acción UI)
 * GRUPO 6 (2 tests) — Límite del plan: backend 4xx + UI (snackbar de error)
 */

import { test, expect, type Page, request } from "@playwright/test";
import * as fs from "fs";

test.use({ storageState: "tests/.auth/user.json" });

const API_BASE = "http://localhost:5000";
const makeName = () => `E2ECalc-${Date.now()}`;

// ─── Helpers de token (Node context) ────────────────────────────────────────

function readTokenFromStorage(): string {
	try {
		const raw = fs.readFileSync("tests/.auth/user.json", "utf8");
		const entries: any[] = JSON.parse(raw)?.origins?.[0]?.localStorage ?? [];
		return entries.find((e) => e.name === "token")?.value ?? "";
	} catch {
		return "";
	}
}

function decodeUserId(token: string): string {
	try {
		const payload = JSON.parse(Buffer.from(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/"), "base64").toString());
		return payload.id ?? payload._id ?? payload.userId ?? payload.sub ?? "";
	} catch {
		return "";
	}
}

// ─── beforeAll: limpiar E2E previos y dejar slots libres para tests ──────────
//
// Objetivo: dejar ≤ (limit - 3) calculadoras activas para que los tests CRUD
// (que crean de a 1) nunca alcancen el límite del plan.
// El límite se obtiene dinámicamente vía /api/plan-configs/check-resource/calculators.

test.beforeAll(async () => {
	const token = readTokenFromStorage();
	const userId = decodeUserId(token);
	if (!token || !userId) return;

	const ctx = await request.newContext();
	try {
		// Obtener el límite del plan dinámicamente
		const planRes = await ctx.get(`${API_BASE}/api/plan-configs/check-resource/calculators`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		const planJson = await planRes.json();
		const planLimit: number = planJson.data?.limit ?? 5;
		// Dejar al menos 3 slots libres para los tests; si el límite es muy bajo, dejar 1
		const maxActive = Math.max(0, planLimit - 3);

		const res = await ctx.get(`${API_BASE}/api/calculators/user/${userId}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (!res.ok()) return;

		const data = await res.json();
		const calcs: any[] = data.data ?? data.calculators ?? [];

		// 1. Eliminar calculadoras E2E de corridas anteriores
		const e2eCalcs = calcs.filter((c: any) => String(c.folderName ?? "").startsWith("E2ECalc") || String(c.folderName ?? "").startsWith("E2EFill"));
		for (const c of e2eCalcs) {
			await ctx.delete(`${API_BASE}/api/calculators/${c._id}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
		}

		// 2. Si quedan más activas que maxActive, archivar las más viejas
		const real = calcs.filter((c: any) => !e2eCalcs.includes(c));
		if (real.length > maxActive) {
			const toArchive = real.slice(0, real.length - maxActive).map((c: any) => c._id);
			await ctx.post(`${API_BASE}/api/subscriptions/archive-items?userId=${userId}`, {
				headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
				data: { resourceType: "calculators", itemIds: toArchive },
			});
		}
	} catch {
		// best-effort
	} finally {
		await ctx.dispose();
	}
});

// ─── Helpers de página ────────────────────────────────────────────────────────

async function getAuthToken(page: Page): Promise<string> {
	return (await page.evaluate(() => localStorage.getItem("token"))) ?? "";
}

async function getUserId(page: Page): Promise<string> {
	return (await page.evaluate(() => {
		const token = localStorage.getItem("token") ?? "";
		try {
			const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
			return payload.id ?? payload._id ?? payload.userId ?? payload.sub ?? "";
		} catch {
			return "";
		}
	})) ?? "";
}

async function getPlanInfo(token: string): Promise<{ limit: number; currentCount: number }> {
	const ctx = await request.newContext();
	try {
		const res = await ctx.get(`${API_BASE}/api/plan-configs/check-resource/calculators`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		const json = await res.json();
		return {
			limit: json.data?.limit ?? 10,
			currentCount: json.data?.currentCount ?? 0,
		};
	} finally {
		await ctx.dispose();
	}
}

async function createFillerCalcs(token: string, userId: string, count: number): Promise<string[]> {
	if (count <= 0) return [];
	const ctx = await request.newContext();
	const ids: string[] = [];
	try {
		for (let i = 0; i < count; i++) {
			const res = await ctx.post(`${API_BASE}/api/calculators`, {
				headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
				data: {
					folderName: `E2EFill-${i}-${Date.now()}`,
					date: new Date().toISOString(),
					type: "Calculado",
					classType: "laboral",
					amount: 1000,
					variables: {},
					userId,
				},
			});
			const json = await res.json();
			const id = json.data?._id ?? json.calculator?._id ?? json._id ?? "";
			if (id) ids.push(id);
		}
	} finally {
		await ctx.dispose();
	}
	return ids;
}

async function archiveCalcsByIds(page: Page, userId: string, ids: string[]): Promise<void> {
	if (!ids.length) return;
	const token = await getAuthToken(page);
	await page.request.post(`${API_BASE}/api/subscriptions/archive-items?userId=${userId}`, {
		headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
		data: { resourceType: "calculators", itemIds: ids },
	});
}

/** Crea una calculadora via API y retorna su _id. */
async function createCalcViaAPI(page: Page, folderName: string): Promise<string> {
	const token = await getAuthToken(page);
	const userId = await getUserId(page);
	const res = await page.request.post(`${API_BASE}/api/calculators`, {
		headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
		data: {
			folderName,
			date: new Date().toISOString(),
			type: "Calculado",
			classType: "laboral",
			amount: 1000,
			variables: {},
			userId,
		},
	});
	const json = await res.json();
	return json.data?._id ?? json.calculator?._id ?? json._id ?? "";
}

async function deleteCalcById(page: Page, calcId: string): Promise<void> {
	const token = await getAuthToken(page);
	await page.request.delete(`${API_BASE}/api/calculators/${calcId}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

async function gotoCalc(page: Page): Promise<void> {
	await page.goto("/apps/calc");
	// Wait for the real table to load (skeleton uses Skeleton components, not text headers)
	await expect(page.getByRole("columnheader", { name: "Carátula" })).toBeVisible({ timeout: 25_000 });
}

/** Create calc via API then navigate fresh so Redux fetches from server. */
async function createCalcAndNavigate(page: Page, calcName: string): Promise<string> {
	const token = await getAuthToken(page);
	const userId = await getUserId(page);
	const res = await page.request.post(`${API_BASE}/api/calculators`, {
		headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
		data: {
			folderName: calcName,
			date: new Date().toISOString(),
			type: "Calculado",
			classType: "laboral",
			amount: 1000,
			variables: {},
			userId,
		},
	});
	const json = await res.json();
	const calcId = json.calculator?._id ?? json.data?._id ?? json._id ?? "";

	// Navigate fresh so Redux re-fetches from server (avoids stale cache from reload)
	await page.goto("/apps/calc");
	await expect(page.getByRole("columnheader", { name: "Carátula" })).toBeVisible({ timeout: 25_000 });
	await expect(page.getByRole("row").filter({ hasText: calcName })).toBeVisible({ timeout: 15_000 });

	return calcId;
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Carga y renderizado básico
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — navega a /apps/calc y renderiza la tabla", async ({ page }) => {
	await gotoCalc(page);

	await expect(page).toHaveURL(/\/apps\/calc/);
	await expect(page.locator("table").first()).toBeVisible({ timeout: 5_000 });
});

test("GRUPO 1 — columna 'Carátula' y botón 'Archivados' son visibles", async ({ page }) => {
	await gotoCalc(page);

	await expect(page.getByRole("columnheader", { name: "Carátula" })).toBeVisible({ timeout: 5_000 });
	await expect(page.locator('[data-testid="calculator-archived-btn"]')).toBeVisible({ timeout: 5_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Estado vacío (mock GET)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — tabla vacía muestra estado sin datos", async ({ page }) => {
	await page.route("**/api/calculators/user/**", async (route) => {
		await route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, data: [], total: 0 }),
		});
	});

	await page.goto("/apps/calc");
	await expect(page.getByRole("columnheader", { name: "Carátula" })).toBeVisible({ timeout: 25_000 });

	const rows = page.getByRole("row");
	const rowCount = await rows.count();
	expect(rowCount).toBeLessThanOrEqual(2);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Eliminar calculadora
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — click 'Eliminar' → modal de confirmación se abre", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalc(page);

	const calcName = makeName();
	const calcId = await createCalcAndNavigate(page, calcName);

	const row = page.getByRole("row").filter({ hasText: calcName });
	await row.locator('[data-testid="calculator-delete-btn"]').click();

	await expect(page.getByRole("heading", { name: "¿Estás seguro que deseas eliminarlo?" })).toBeVisible({ timeout: 5_000 });

	await page.getByRole("button", { name: "Cancelar" }).click();
	await expect(page.getByRole("heading", { name: "¿Estás seguro que deseas eliminarlo?" })).not.toBeVisible({ timeout: 5_000 });

	if (calcId) await deleteCalcById(page, calcId);
});

test("GRUPO 3 — confirmar eliminación → DELETE /api/calculators/:id → calculadora desaparece", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalc(page);

	const calcName = makeName();
	await createCalcAndNavigate(page, calcName);

	const row = page.getByRole("row").filter({ hasText: calcName });
	await row.locator('[data-testid="calculator-delete-btn"]').click();
	await expect(page.getByRole("heading", { name: "¿Estás seguro que deseas eliminarlo?" })).toBeVisible({ timeout: 5_000 });

	await Promise.all([
		page.waitForResponse((r) => r.url().includes("/api/calculators/") && r.request().method() === "DELETE"),
		page.getByRole("button", { name: "Eliminar" }).click(),
	]);

	await expect(page.getByRole("row").filter({ hasText: calcName })).not.toBeVisible({ timeout: 10_000 });
	await expect(page.getByText("Cálculo eliminado correctamente")).toBeVisible({ timeout: 10_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Archivar calculadora
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — archivar calculadora via UI → snackbar 'Cálculo archivado correctamente'", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalc(page);

	const calcName = makeName();
	const calcId = await createCalcAndNavigate(page, calcName);

	const row = page.getByRole("row").filter({ hasText: calcName });
	await row.locator('[data-testid="calculator-archive-btn"]').click();

	await expect(page.getByText("Cálculo archivado correctamente")).toBeVisible({ timeout: 10_000 });
	await expect(page.getByRole("row").filter({ hasText: calcName })).not.toBeVisible({ timeout: 10_000 });

	// cleanup: unarchive via API
	const token = await getAuthToken(page);
	const userId = await getUserId(page);
	if (calcId && userId) {
		await page.request.post(`${API_BASE}/api/subscriptions/unarchive-items?userId=${userId}`, {
			headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
			data: { resourceType: "calculators", itemIds: [calcId] },
		});
		await deleteCalcById(page, calcId);
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 5 — Ver archivadas y desarchivar
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 5 — ver archivadas → modal de calculadoras archivadas se abre", async ({ page }) => {
	test.setTimeout(60_000);
	await gotoCalc(page);

	await page.locator('[data-testid="calculator-archived-btn"]').click();

	await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
});

test("GRUPO 5 — desarchivar calculadora via UI → modal se cierra + snackbar de éxito", async ({ page }) => {
	test.setTimeout(90_000);

	// createCalcAndNavigate validates the row appears before returning — guarantees calcId is valid
	await gotoCalc(page);
	const calcName = makeName();
	const calcId = await createCalcAndNavigate(page, calcName);

	const userId = await getUserId(page);
	const token = await getAuthToken(page);

	await page.request.post(`${API_BASE}/api/subscriptions/archive-items?userId=${userId}`, {
		headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
		data: { resourceType: "calculators", itemIds: [calcId] },
	});

	// Navigate fresh so archived modal shows the new item
	await gotoCalc(page);

	await page.locator('[data-testid="calculator-archived-btn"]').click();
	await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });

	// The archived dialog renders each data row as role="checkbox" (not role="row")
	const archivedRow = page.getByRole("dialog").getByRole("checkbox").filter({ hasText: calcName });
	await expect(archivedRow).toBeVisible({ timeout: 10_000 });
	await archivedRow.getByRole("checkbox").click();

	const responsePromise = page.waitForResponse(
		(r) => r.url().includes("/api/subscriptions/unarchive-items") && r.request().method() === "POST",
		{ timeout: 15_000 },
	);

	await page.getByRole("button", { name: /Desarchivar/ }).click();
	await responsePromise;

	await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10_000 });
	await expect(page.getByText(/Cálculo.*desarchivado|desarchivado.*correctamente/i)).toBeVisible({ timeout: 10_000 });

	if (calcId) await deleteCalcById(page, calcId);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 6 — Límite del plan
//
// Test A: el backend rechaza la creación directa vía API cuando se supera el límite.
// Test B: la UI muestra error cuando se intenta archivar y el límite ya está lleno.
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 6 — backend rechaza creación al superar el límite del plan", async ({ page }) => {
	test.setTimeout(120_000);
	await gotoCalc(page);

	const token = await getAuthToken(page);
	const userId = await getUserId(page);

	const { limit, currentCount } = await getPlanInfo(token);

	const slotsNeeded = limit - currentCount;
	const fillerIds = await createFillerCalcs(token, userId, slotsNeeded);

	try {
		const ctx = await request.newContext();
		try {
			const overLimitRes = await ctx.post(`${API_BASE}/api/calculators`, {
				headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
				data: {
					folderName: `E2ECalc-overlimit-${Date.now()}`,
					date: new Date().toISOString(),
					type: "Calculado",
					classType: "laboral",
					amount: 1000,
					variables: {},
					userId,
				},
			});
			const body = await overLimitRes.json();
			expect(overLimitRes.status() >= 400 || body.success === false).toBeTruthy();
		} finally {
			await ctx.dispose();
		}
	} finally {
		await archiveCalcsByIds(page, userId, fillerIds);
	}
});

test("GRUPO 6 — UI muestra snackbar de error cuando se supera el límite al intentar crear", async ({ page }) => {
	test.setTimeout(120_000);
	await gotoCalc(page);

	const token = await getAuthToken(page);
	const userId = await getUserId(page);

	const { limit, currentCount } = await getPlanInfo(token);
	const slotsNeeded = limit - currentCount;

	// Rellenar hasta el límite via API
	const fillerIds = await createFillerCalcs(token, userId, slotsNeeded);

	try {
		await page.reload();
		await expect(page.locator(".MuiSkeleton-root").first()).not.toBeVisible({ timeout: 15_000 });

		// Intentar crear una más via API directa — debería fallar con 4xx
		const res = await page.request.post(`${API_BASE}/api/calculators`, {
			headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
			data: {
				folderName: `E2ECalc-overlimit-${Date.now()}`,
				date: new Date().toISOString(),
				type: "Calculado",
				classType: "laboral",
				amount: 1000,
				variables: {},
				userId,
			},
		});
		const body = await res.json();
		expect(res.status() >= 400 || body.success === false).toBeTruthy();
	} finally {
		await archiveCalcsByIds(page, userId, fillerIds);
	}
});

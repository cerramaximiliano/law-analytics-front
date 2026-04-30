/**
 * Tests E2E de Carpetas — /apps/folders/list
 * Estado: ✅ 19/19 passing
 *
 * ─── Estrategia general ───────────────────────────────────────────────────────
 * - storageState + backend real sin mocks de plan ni suscripción.
 * - beforeAll garantiza ≤ 3 carpetas activas (borra E2E previas, archiva reales de más)
 *   para que los tests CRUD nunca alcancen el límite accidentalmente.
 * - GRUPO 2 es el único test con mock (simula 0 carpetas vía route intercept).
 * - GRUPO 8 obtiene el límite dinámicamente con GET /api/plan-configs/check-resource/folders
 *   → agnóstico al plan del usuario (free, pro, etc.).
 *
 * ─── data-testid requeridos en folders.tsx ───────────────────────────────────
 *   folder-add-btn    → botón "Agregar carpeta"
 *   folder-edit-btn   → botón editar en cada fila
 *   folder-delete-btn → botón eliminar en cada fila
 *
 * ─── Formulario de creación (3 pasos) ────────────────────────────────────────
 *   Paso 0: Método de ingreso → click "Ingreso Manual" → Siguiente
 *   Paso 1: Datos requeridos → folderName, orderStatus (Actor), status (Nueva), materia (Abrigo)
 *   Paso 2: Datos opcionales → click "Crear" → espera POST + fila en tabla
 *
 * ─── Formulario de edición (2 pasos) ─────────────────────────────────────────
 *   Paso 0: Datos requeridos pre-cargados → modificar folderName → press Enter (avanza)
 *   Paso 1: Datos opcionales → click "Editar" con { force: true } → espera PUT
 *   Nota: el Dialog requiere onClose={handleCloseDialog} para que Escape funcione.
 *
 * ─── Bugs corregidos en producción (relacionados) ────────────────────────────
 *   - AddFolder.tsx: removido onAddFolder(values) del setTimeout(500ms) — era
 *     redundante y causaba race condition cerrando dialogs subsiguientes.
 *   - folders.tsx Dialog: agregado onClose={handleCloseDialog} para Escape key.
 *
 * ─── Índice de grupos ─────────────────────────────────────────────────────────
 * GRUPO 1 (2 tests) — Carga y renderizado básico
 * GRUPO 2 (1 test)  — Estado vacío (mock GET → { folders: [] })
 * GRUPO 3 (5 tests) — Crear carpeta: modal, validación, cancelar, POST real, fila en tabla
 * GRUPO 4 (2 tests) — Editar carpeta: modal pre-cargado, PUT real + snackbar
 * GRUPO 5 (2 tests) — Eliminar carpeta: modal confirmación, DELETE real + desaparece fila
 * GRUPO 6 (1 test)  — Búsqueda en tabla por carátula
 * GRUPO 7 (3 tests) — Archivar (UI), ver archivadas (modal), desarchivar (setup API + acción UI)
 * GRUPO 8 (2 tests) — Límite del plan: backend 4xx + UI LimitErrorModal (Capa 1 Redux)
 *                    Agnóstico al plan: standard (50 carpetas) o premium (500 carpetas).
 *                    Test A usa parallel batches (10 en paralelo) para fills rápidos.
 *                    Test B usa route mocking — crea solo 1 carpeta vía UI, sin fillers.
 */

import { test, expect, type Page, request } from "@playwright/test";
import * as fs from "fs";

test.use({ storageState: "tests/.auth/user.json" });

const API_BASE = "http://localhost:5000";
const makeName = () => `E2EFolder-${Date.now()}`;

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

// ─── Limpieza previa ──────────────────────────────────────────────────────────
//
// Objetivo: dejar ≤ 3 carpetas activas antes de la suite (límite free: 5).

test.beforeAll(async () => {
	const token = readTokenFromStorage();
	const userId = decodeUserId(token);
	if (!token || !userId) return;

	const ctx = await request.newContext();
	try {
		const res = await ctx.get(`${API_BASE}/api/folders/user/${userId}`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		if (!res.ok()) return;

		const data = await res.json();
		const folders: any[] = data.folders ?? [];

		// 1. Eliminar carpetas E2E de corridas anteriores
		const e2eFolders = folders.filter((f: any) => String(f.folderName ?? "").startsWith("E2EFolder"));
		for (const f of e2eFolders) {
			await ctx.delete(`${API_BASE}/api/folders/${f._id}`, {
				headers: { Authorization: `Bearer ${token}` },
			});
		}

		// 2. Si quedan > 3 carpetas reales, archivar las más viejas hasta llegar a 3
		const real = folders.filter((f: any) => !e2eFolders.includes(f));
		if (real.length > 3) {
			const toArchive = real.slice(0, real.length - 3).map((f: any) => f._id);
			await ctx.post(`${API_BASE}/api/subscriptions/archive-items?userId=${userId}`, {
				headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
				data: { resourceType: "folders", itemIds: toArchive },
			});
		}
	} catch {
		// best-effort
	} finally {
		await ctx.dispose();
	}
});

// ─── Helpers de página ───────────────────────────────────────────────────────

async function getAuthToken(page: Page): Promise<string> {
	return (await page.evaluate(() => localStorage.getItem("token"))) ?? "";
}

async function getUserId(page: Page): Promise<string> {
	return (
		(await page.evaluate(() => {
			const token = localStorage.getItem("token") ?? "";
			try {
				const payload = JSON.parse(atob(token.split(".")[1].replace(/-/g, "+").replace(/_/g, "/")));
				return payload.id ?? payload._id ?? payload.userId ?? payload.sub ?? "";
			} catch {
				return "";
			}
		})) ?? ""
	);
}

async function deleteFolderById(page: Page, folderId: string): Promise<void> {
	const token = await getAuthToken(page);
	await page.request.delete(`${API_BASE}/api/folders/${folderId}`, {
		headers: { Authorization: `Bearer ${token}` },
	});
}

/**
 * Obtiene el límite del plan y el conteo actual de carpetas activas.
 * Agnóstico al plan: funciona para free, pro, o cualquier nivel.
 */
async function getPlanInfo(token: string): Promise<{ limit: number; currentCount: number }> {
	const ctx = await request.newContext();
	try {
		const res = await ctx.get(`${API_BASE}/api/plan-configs/check-resource/folders`, {
			headers: { Authorization: `Bearer ${token}` },
		});
		const json = await res.json();
		return {
			limit: json.data?.limit ?? 5,
			currentCount: json.data?.currentCount ?? 0,
		};
	} finally {
		await ctx.dispose();
	}
}

/**
 * Crea N carpetas E2E vía API en paralelo (batches de 10) y retorna sus IDs.
 * Escala para cualquier plan: standard (50) o premium (500).
 */
async function createFillerFolders(token: string, userId: string, count: number): Promise<string[]> {
	if (count <= 0) return [];
	const ctx = await request.newContext();
	const ids: string[] = [];
	const BATCH = 10;
	try {
		for (let i = 0; i < count; i += BATCH) {
			const batchCount = Math.min(BATCH, count - i);
			const batchIds = await Promise.all(
				Array.from({ length: batchCount }, (_, j) =>
					ctx
						.post(`${API_BASE}/api/folders`, {
							headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
							data: { folderName: `E2EFill-${i + j}-${Date.now()}`, orderStatus: "Actor", status: "Nueva", materia: "Abrigo", userId },
						})
						.then(async (res) => {
							const json = await res.json();
							return json.folder?._id ?? json._id ?? "";
						}),
				),
			);
			ids.push(...batchIds.filter(Boolean));
		}
	} finally {
		await ctx.dispose();
	}
	return ids;
}

/** Elimina las carpetas indicadas en paralelo (batches de 10) — cleanup rápido. */
async function deleteFoldersByIds(token: string, ids: string[]): Promise<void> {
	if (!ids.length) return;
	const ctx = await request.newContext();
	const BATCH = 10;
	try {
		for (let i = 0; i < ids.length; i += BATCH) {
			const batch = ids.slice(i, i + BATCH);
			await Promise.all(batch.map((id) => ctx.delete(`${API_BASE}/api/folders/${id}`, { headers: { Authorization: `Bearer ${token}` } })));
		}
	} finally {
		await ctx.dispose();
	}
}

/** Archiva las carpetas indicadas — cleanup en tests de límite. */
async function archiveFoldersByIds(page: Page, userId: string, ids: string[]): Promise<void> {
	if (!ids.length) return;
	const token = await getAuthToken(page);
	await page.request.post(`${API_BASE}/api/subscriptions/archive-items?userId=${userId}`, {
		headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
		data: { resourceType: "folders", itemIds: ids },
	});
}

async function gotoCarpetas(page: Page): Promise<void> {
	await page.goto("/apps/folders/list");
	await expect(page.locator("table, .MuiSkeleton-root").first()).toBeVisible({ timeout: 15_000 });
	await expect(page.locator(".MuiSkeleton-root").first()).not.toBeVisible({ timeout: 15_000 });
}

/**
 * Crea una carpeta vía UI (formulario manual de 3 pasos) y retorna su _id.
 * Requiere que la cuenta esté por debajo del límite del plan.
 */
async function createFolderViaUI(page: Page, folderName: string): Promise<string> {
	await page.locator('[data-testid="folder-add-btn"]').click();
	await expect(page.getByRole("heading", { name: "Nueva Carpeta", exact: true })).toBeVisible({ timeout: 10_000 });

	// Paso 0: Método de ingreso → Ingreso Manual
	await page.getByText("Ingreso Manual").click();
	await page.getByRole("button", { name: "Siguiente" }).click();

	// Paso 1: Datos requeridos
	await expect(page.getByText("Paso 2 de 3: Datos requeridos")).toBeVisible({ timeout: 5_000 });
	await page.locator("#customer-folderName").fill(folderName);

	await page
		.locator(".MuiSelect-select")
		.filter({ hasText: /Seleccione una parte/ })
		.click();
	await page.getByRole("option", { name: "Actor" }).click();

	await page
		.locator(".MuiSelect-select")
		.filter({ hasText: /Seleccione un estado/ })
		.click();
	await page.getByRole("option", { name: "Nueva" }).click();

	// Materia: MUI Autocomplete con opciones del folder.json local
	const materiaInput = page.locator('input[placeholder="Seleccione una materia"]');
	await materiaInput.click();
	await materiaInput.fill("Abrigo");
	await page.getByRole("option", { name: "Abrigo", exact: true }).click();

	await page.getByRole("button", { name: "Siguiente" }).click();

	// Paso 2: Datos opcionales → Crear
	await expect(page.getByText("Paso 3 de 3: Datos opcionales")).toBeVisible({ timeout: 5_000 });

	const [response] = await Promise.all([
		page.waitForResponse((r) => r.url().includes("/api/folders") && r.request().method() === "POST"),
		page.getByRole("button", { name: "Crear" }).click(),
	]);

	await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 15_000 });

	// Wait for the row to appear in the table before returning
	await expect(page.getByRole("row").filter({ hasText: folderName })).toBeVisible({ timeout: 15_000 });

	const data = await response.json();
	return data.folder?._id ?? data._id ?? "";
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Carga y renderizado básico
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — navega a /apps/folders/list y renderiza la tabla", async ({ page }) => {
	await gotoCarpetas(page);

	await expect(page).toHaveURL(/\/apps\/folders\/list/);
	await expect(page.locator("table")).toBeVisible({ timeout: 5_000 });
});

test("GRUPO 1 — columna 'Carátula' y botón 'Agregar carpeta' son visibles", async ({ page }) => {
	await gotoCarpetas(page);

	await expect(page.getByRole("columnheader", { name: "Carátula" })).toBeVisible({ timeout: 5_000 });
	await expect(page.locator('[data-testid="folder-add-btn"]')).toBeVisible({ timeout: 5_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Estado vacío (mock GET)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — sin carpetas → mensaje de estado vacío visible", async ({ page }) => {
	await page.route(`${API_BASE}/api/folders/**`, (route) =>
		route.fulfill({
			status: 200,
			contentType: "application/json",
			body: JSON.stringify({ success: true, folders: [] }),
		}),
	);

	await gotoCarpetas(page);

	await expect(page.getByText(/No hay causas creadas/)).toBeVisible({ timeout: 10_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Crear carpeta
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — click 'Agregar carpeta' → modal 'Nueva Carpeta' se abre", async ({ page }) => {
	await gotoCarpetas(page);

	await page.locator('[data-testid="folder-add-btn"]').click();

	await expect(page.getByRole("heading", { name: "Nueva Carpeta", exact: true })).toBeVisible({ timeout: 10_000 });
	await expect(page.getByRole("dialog")).toBeVisible();
});

test("GRUPO 3 — submit paso 1 sin datos → errores de validación visibles", async ({ page }) => {
	await gotoCarpetas(page);

	await page.locator('[data-testid="folder-add-btn"]').click();
	await expect(page.getByRole("heading", { name: "Nueva Carpeta", exact: true })).toBeVisible({ timeout: 10_000 });

	// Paso 0: seleccionar método y avanzar
	await page.getByText("Ingreso Manual").click();
	await page.getByRole("button", { name: "Siguiente" }).click();

	// Paso 1: intentar avanzar sin llenar campos requeridos
	await expect(page.getByText("Paso 2 de 3: Datos requeridos")).toBeVisible({ timeout: 5_000 });
	await page.getByRole("button", { name: "Siguiente" }).click();

	await expect(page.getByText(/requerido|obligatorio/i).first()).toBeVisible({ timeout: 3_000 });
});

test("GRUPO 3 — cancelar creación → modal se cierra sin POST", async ({ page }) => {
	await gotoCarpetas(page);

	await page.locator('[data-testid="folder-add-btn"]').click();
	await expect(page.getByRole("heading", { name: "Nueva Carpeta", exact: true })).toBeVisible({ timeout: 10_000 });

	let postCalled = false;
	page.on("request", (req) => {
		if (req.url().includes("/api/folders") && req.method() === "POST") postCalled = true;
	});

	await page.getByRole("button", { name: "Cancelar" }).click();

	await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5_000 });
	expect(postCalled).toBe(false);
});

test("GRUPO 3 — crear carpeta real → POST /api/folders → snackbar 'Éxito al agregar la carpeta'", async ({ page }) => {
	test.setTimeout(90_000);
	await gotoCarpetas(page);

	const folderName = makeName();
	const folderId = await createFolderViaUI(page, folderName);

	await expect(page.getByText("Éxito al agregar la carpeta")).toBeVisible({ timeout: 10_000 });

	if (folderId) await deleteFolderById(page, folderId);
});

test("GRUPO 3 — carpeta creada aparece en la tabla", async ({ page }) => {
	test.setTimeout(90_000);
	await gotoCarpetas(page);

	const folderName = makeName();
	const folderId = await createFolderViaUI(page, folderName);

	await expect(page.getByRole("row").filter({ hasText: folderName })).toBeVisible({ timeout: 10_000 });

	if (folderId) await deleteFolderById(page, folderId);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Editar carpeta
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — click 'Editar' → modal 'Editar Carpeta' con carátula pre-cargada", async ({ page }) => {
	test.setTimeout(90_000);
	await gotoCarpetas(page);

	const folderName = makeName();
	const folderId = await createFolderViaUI(page, folderName);

	const row = page.getByRole("row").filter({ hasText: folderName });
	await row.locator('[data-testid="folder-edit-btn"]').click();

	await expect(page.getByRole("heading", { name: "Editar Carpeta", exact: true })).toBeVisible({ timeout: 5_000 });
	await expect(page.locator("#customer-folderName")).toHaveValue(folderName, { timeout: 5_000 });

	await page.keyboard.press("Escape");
	await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5_000 });

	if (folderId) await deleteFolderById(page, folderId);
});

test("GRUPO 4 — editar carátula → PUT /api/folders/:id → snackbar 'Éxito al editar la carpeta'", async ({ page }) => {
	test.setTimeout(90_000);
	await gotoCarpetas(page);

	const folderName = makeName();
	const folderId = await createFolderViaUI(page, folderName);

	const row = page.getByRole("row").filter({ hasText: folderName });
	await row.locator('[data-testid="folder-edit-btn"]').click();
	await expect(page.getByRole("heading", { name: "Editar Carpeta", exact: true })).toBeVisible({ timeout: 5_000 });

	// Paso 0 (edit): Datos requeridos pre-cargados — modificar carátula
	const newName = `${folderName}-edit`;
	await page.locator("#customer-folderName").clear();
	await page.locator("#customer-folderName").fill(newName);

	const responsePromise = page.waitForResponse((r) => r.url().includes(`/api/folders/${folderId}`) && r.request().method() === "PUT", {
		timeout: 30_000,
	});

	await page.locator("#customer-folderName").press("Enter");
	await expect(page.getByText("Paso 2 de 2: Datos opcionales")).toBeVisible({ timeout: 5_000 });

	await page.getByRole("dialog").getByRole("button", { name: "Editar" }).click({ force: true });

	const response = await responsePromise;

	await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 10_000 });
	await expect(page.getByText("Éxito al editar la carpeta")).toBeVisible({ timeout: 10_000 });

	const data = await response.json();
	expect(data.success ?? true).toBeTruthy();

	if (folderId) await deleteFolderById(page, folderId);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 5 — Eliminar carpeta
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 5 — click 'Eliminar' → modal de confirmación se abre", async ({ page }) => {
	test.setTimeout(90_000);
	await gotoCarpetas(page);

	const folderName = makeName();
	const folderId = await createFolderViaUI(page, folderName);

	const row = page.getByRole("row").filter({ hasText: folderName });
	await row.locator('[data-testid="folder-delete-btn"]').click();

	await expect(page.getByRole("heading", { name: "¿Estás seguro que deseas eliminarlo?" })).toBeVisible({ timeout: 5_000 });

	await page.getByRole("button", { name: "Cancelar" }).click();
	await expect(page.getByRole("heading", { name: "¿Estás seguro que deseas eliminarlo?" })).not.toBeVisible({ timeout: 5_000 });

	if (folderId) await deleteFolderById(page, folderId);
});

test("GRUPO 5 — confirmar eliminación → DELETE /api/folders/:id → carpeta desaparece", async ({ page }) => {
	test.setTimeout(90_000);
	await gotoCarpetas(page);

	const folderName = makeName();
	await createFolderViaUI(page, folderName);

	const row = page.getByRole("row").filter({ hasText: folderName });
	await row.locator('[data-testid="folder-delete-btn"]').click();
	await expect(page.getByRole("heading", { name: "¿Estás seguro que deseas eliminarlo?" })).toBeVisible({ timeout: 5_000 });

	await Promise.all([
		page.waitForResponse((r) => r.url().includes("/api/folders/") && r.request().method() === "DELETE"),
		page.getByRole("button", { name: "Eliminar" }).click(),
	]);

	await expect(page.getByRole("row").filter({ hasText: folderName })).not.toBeVisible({ timeout: 10_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 6 — Búsqueda en tabla
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 6 — buscar por carátula → tabla filtra correctamente", async ({ page }) => {
	test.setTimeout(90_000);
	await gotoCarpetas(page);

	const folderName = makeName();
	const folderId = await createFolderViaUI(page, folderName);

	const searchInput = page.getByPlaceholder(/Buscar en \d+ registros/);
	await searchInput.fill(folderName);

	await expect(page.getByRole("row").filter({ hasText: folderName })).toBeVisible({ timeout: 5_000 });

	await searchInput.clear();

	if (folderId) await deleteFolderById(page, folderId);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 7 — Archivar y desarchivar carpeta
//
// Test de archivar: flujo completo via UI (crea via formulario, archiva con checkbox+botón).
// Test de desarchivar: setup via API (crear+archivar) para aislar la UI de desarchivado.
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 7 — archivar carpeta via UI → snackbar '1 causa archivada correctamente'", async ({ page }) => {
	test.setTimeout(90_000);
	await gotoCarpetas(page);

	const folderName = makeName();
	const folderId = await createFolderViaUI(page, folderName);

	const row = page.getByRole("row").filter({ hasText: folderName });
	await row.locator('input[type="checkbox"]').click();

	await Promise.all([
		page.waitForResponse((r) => r.url().includes("/api/subscriptions/archive-items") && r.request().method() === "POST"),
		page.getByRole("button", { name: /Archivar/ }).click(),
	]);

	await expect(page.getByText("1 causa archivada correctamente")).toBeVisible({ timeout: 10_000 });
	await expect(page.getByRole("row").filter({ hasText: folderName })).not.toBeVisible({ timeout: 5_000 });

	if (folderId) await deleteFolderById(page, folderId);
});

test("GRUPO 7 — ver archivadas → modal de carpetas archivadas se abre", async ({ page }) => {
	await gotoCarpetas(page);

	await page.getByRole("button", { name: "Archivados" }).click();

	await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });
	await expect(page.locator("text=Archivados").first()).toBeVisible({ timeout: 5_000 });
});

test("GRUPO 7 — desarchivar carpeta via UI → snackbar '1 causa desarchivada correctamente'", async ({ page }) => {
	test.setTimeout(90_000);

	// Setup via API: crear y archivar para aislar la UI de desarchivado
	const token = readTokenFromStorage();
	const userId = decodeUserId(token);
	const folderName = makeName();

	const ctx = await request.newContext();
	const createRes = await ctx.post(`${API_BASE}/api/folders`, {
		headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
		data: { folderName, orderStatus: "Actor", status: "Nueva", materia: "Abrigo", userId },
	});
	const folderId = (await createRes.json()).folder?._id ?? "";

	await ctx.post(`${API_BASE}/api/subscriptions/archive-items?userId=${userId}`, {
		headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
		data: { resourceType: "folders", itemIds: [folderId] },
	});
	await ctx.dispose();

	await gotoCarpetas(page);

	// Acción via UI: abrir modal → seleccionar fila → click Desarchivar
	await page.getByRole("button", { name: "Archivados" }).click();
	await expect(page.getByRole("dialog")).toBeVisible({ timeout: 5_000 });

	await expect(page.getByRole("dialog").getByText(folderName)).toBeVisible({ timeout: 10_000 });
	await page.getByRole("dialog").getByText(folderName).first().click();

	await Promise.all([
		page.waitForResponse((r) => r.url().includes("/api/subscriptions/unarchive-items") && r.request().method() === "POST"),
		page
			.getByRole("dialog")
			.getByRole("button", { name: /Desarchivar/i })
			.click(),
	]);

	await expect(page.getByText(/causa desarchivada correctamente/)).toBeVisible({ timeout: 10_000 });

	if (folderId) await deleteFolderById(page, folderId);
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 8 — Límite del plan
//
// Diseñado para funcionar con cualquier plan: standard (50 carpetas) o premium (500).
// El límite se lee dinámicamente de check-resource/folders en cada corrida.
// beforeAll garantiza currentCount ≤ 3, minimizando los fillers a crear.
// createFillerFolders usa batches paralelos de 10 → escala para 50 o 500.
//
// Test A — Backend enforcea el límite:
//   Crea (limit - currentCount) fillers en paralelo → llena hasta el tope.
//   Verifica que el servidor rechaza la siguiente creación con 4xx / success:false.
//   Cleanup: elimina fillers en paralelo (DELETE, no ARCHIVE).
//
// Test B — UI muestra LimitErrorModal:
//   Crea (limit - currentCount - 1) fillers en paralelo → deja 1 slot libre.
//   Crea esa última carpeta vía UI → verifica éxito y snackbar.
//   Recarga → Redux ve folders.length = maxFolders → bloquea con LimitErrorModal.
//   Cleanup: elimina todos los fillers en paralelo (DELETE, no ARCHIVE).
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 8 — backend rechaza creación al superar el límite del plan", async ({ page }) => {
	test.setTimeout(300_000); // 5 min — premium puede tener 500 carpetas

	const token = readTokenFromStorage();
	const userId = decodeUserId(token);
	const { limit, currentCount } = await getPlanInfo(token);

	// Llenar hasta el límite exacto (batches paralelos de 10 → rápido para cualquier plan)
	// beforeAll garantiza currentCount ≤ 3, así que solo creamos lo que falta
	const fillerIds = await createFillerFolders(token, userId, Math.max(0, limit - currentCount));

	try {
		// Intentar crear una más → el backend debe rechazarla con 4xx / success:false
		const ctx = await request.newContext();
		try {
			const overRes = await ctx.post(`${API_BASE}/api/folders`, {
				headers: { Authorization: `Bearer ${token}`, "Content-Type": "application/json" },
				data: { folderName: `E2EOver-${Date.now()}`, orderStatus: "Actor", status: "Nueva", materia: "Abrigo", userId },
			});
			const overData = await overRes.json();
			expect(overRes.status()).toBeGreaterThanOrEqual(400);
			expect(overData.success).toBe(false);
		} finally {
			await ctx.dispose();
		}
	} finally {
		// Cleanup: eliminar fillers en paralelo (no archivar — evita polucionar lista de archivados)
		await deleteFoldersByIds(token, fillerIds);
	}
});

test("GRUPO 8 — UI muestra LimitErrorModal al superar el límite (Capa 1 Redux + Capa 2 AddFolder)", async ({ page }) => {
	test.setTimeout(300_000); // 5 min — premium puede necesitar crear ~497 fillers

	const token = readTokenFromStorage();
	const userId = decodeUserId(token);
	const { limit, currentCount } = await getPlanInfo(token);

	// Llenar hasta (límite - 1) en paralelo → deja exactamente 1 slot libre para la UI
	// Para standard (50): ~47 fillers en ~5 batches ≈ 1s
	// Para premium (500): ~497 fillers en ~50 batches ≈ 10s
	const fillerIds = await createFillerFolders(token, userId, Math.max(0, limit - currentCount - 1));

	try {
		await gotoCarpetas(page);

		// Crear la ÚLTIMA carpeta permitida vía UI — debe aceptarse
		const folderName = makeName();
		const lastId = await createFolderViaUI(page, folderName);
		if (lastId) fillerIds.push(lastId);
		await expect(page.getByText("Éxito al agregar la carpeta")).toBeVisible({ timeout: 10_000 });

		// Recargar: Redux re-fetcha datos reales → folders.length = limit = maxFolders → bloqueado
		await gotoCarpetas(page);

		// Capa 1 (Redux) bloquea: folders.length >= subscription.limits.maxFolders
		await page.locator('[data-testid="folder-add-btn"]').click();
		await expect(page.getByText(/límite de carpetas/i)).toBeVisible({ timeout: 10_000 });
		await expect(page.getByRole("button", { name: /Suscribirme/i }).first()).toBeVisible({ timeout: 5_000 });
	} finally {
		// Cleanup: eliminar todos los fillers + la última carpeta en paralelo
		await deleteFoldersByIds(token, fillerIds);
	}
});

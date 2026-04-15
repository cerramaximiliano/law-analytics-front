/**
 * Tests del comportamiento de la página de seguimiento postal
 * ante el estado "not_found".
 *
 * Contexto: el type PostalTrackingType.processingStatus incluía los valores
 * "pending" | "active" | "completed" | "paused" | "error" pero la UI
 * ya comparaba contra "not_found" (TS2367). Se corrigió el tipo para
 * incluirlo explícitamente. Estos tests documentan el comportamiento
 * esperado del rendering condicional para ese estado.
 *
 * Conteo de botones por estado (fila sin carpeta vinculada):
 *   not_found → 6 botones: Eye✓ Edit✓ Link✗ DocUpload✗ Refresh✗ Trash✓  (3 enabled, 3 disabled)
 *   active    → 6 botones: Eye✓ Edit✓ Link✓ DocUpload✓ TickCircle✓ Trash✓ (6 enabled, 0 disabled)
 *
 * GRUPO 1 — Estado "not_found": chip y botones deshabilitados
 * GRUPO 2 — Estado "active": comparación como control positivo
 */

import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers/auth";

const VITE_BASE = "http://localhost:5000";
const POSTAL_API = `${VITE_BASE}/api/postal-tracking*`;

const baseTracking = {
	_id: "aaa111bbb222ccc333dd4444",
	codeId: "CD",
	numberId: "123456789",
	userId: "user_test_id",
	tags: [],
	isFinalStatus: true,
	history: [],
	checkCount: 5,
	createdAt: new Date().toISOString(),
	updatedAt: new Date().toISOString(),
};

const mockListResponse = (tracking: object) => ({
	data: [tracking],
	count: 1,
	page: 1,
	totalPages: 1,
});

// Selector robusto para el chip de estado en la fila de la tabla.
// Usamos .first() porque MUI Chip renderiza el texto en 2 nodos:
// el div root y el span label, ambos con el mismo texto visible.
const chipLabel = (page: ReturnType<typeof expect>["soft"] extends never ? never : any, text: string) =>
	(page as any).getByText(text).first();

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Estado "not_found"
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 1 — Postal tracking: estado 'not_found'", () => {
	const notFoundTracking = {
		...baseTracking,
		label: "Envío no encontrado",
		processingStatus: "not_found",
		folderId: null,
	};

	test.beforeEach(async ({ page }) => {
		await loginViaForm(page);
		await page.route(POSTAL_API, (route) =>
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(mockListResponse(notFoundTracking)),
			}),
		);
		await page.goto("/herramientas/seguimiento-postal");
		// Esperar que la tabla cargue — usamos first() para evitar strict mode
		// (MUI Chip renderiza el texto en div root y span label)
		await expect(page.getByText("No encontrado").first()).toBeVisible({ timeout: 10_000 });
	});

	test("chip de estado muestra 'No encontrado'", async ({ page }) => {
		await expect(page.getByText("No encontrado").first()).toBeVisible();
	});

	test("fila tiene 3 botones deshabilitados (vincular, adjuntar, reactivar)", async ({ page }) => {
		// La fila del tracking "not_found" debe tener exactamente 3 botones disabled:
		// Link1, DocumentUpload, Refresh2
		const row = page.locator("tr").filter({ hasText: "No encontrado" });
		await expect(row.locator("button[disabled]")).toHaveCount(3);
	});

	test("fila tiene solo 3 botones habilitados (ver detalle, editar, eliminar)", async ({ page }) => {
		// Para not_found: Eye✓ Edit✓ Trash✓ — los demás disabled o ausentes
		const row = page.locator("tr").filter({ hasText: "No encontrado" });
		await expect(row.locator("button:not([disabled])")).toHaveCount(3);
	});

	test("'Marcar como completado' NO aparece: 6 botones totales en la fila", async ({ page }) => {
		// TickCircle solo aparece para ["pending","active","paused","error"]
		// Para not_found: 3 enabled + 3 disabled = 6 (sin TickCircle)
		const row = page.locator("tr").filter({ hasText: "No encontrado" });
		await expect(row.locator("button")).toHaveCount(6);
	});

	test("página no crashea con JS errors al renderizar 'not_found'", async ({ page }) => {
		const jsErrors: string[] = [];
		page.on("pageerror", (err) => jsErrors.push(err.message));

		// La página ya está cargada por el beforeEach
		await page.waitForTimeout(500);

		expect(jsErrors).toHaveLength(0);
		await expect(page).toHaveURL(/\/herramientas\/seguimiento-postal/);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Estado "active" (control positivo)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 2 — Postal tracking: estado 'active' (control positivo)", () => {
	const activeTracking = {
		...baseTracking,
		label: "Envío en curso",
		processingStatus: "active",
		isFinalStatus: false,
		folderId: null,
	};

	test.beforeEach(async ({ page }) => {
		await loginViaForm(page);
		await page.route(POSTAL_API, (route) =>
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(mockListResponse(activeTracking)),
			}),
		);
		await page.goto("/herramientas/seguimiento-postal");
		await expect(page.getByText("Activo").first()).toBeVisible({ timeout: 10_000 });
	});

	test("chip de estado muestra 'Activo'", async ({ page }) => {
		await expect(page.getByText("Activo").first()).toBeVisible();
	});

	test("fila tiene 0 botones deshabilitados para 'active'", async ({ page }) => {
		const row = page.locator("tr").filter({ hasText: "Activo" });
		await expect(row.locator("button[disabled]")).toHaveCount(0);
	});

	test("fila tiene 6 botones habilitados (incluye 'Marcar como completado')", async ({ page }) => {
		// active: Eye✓ Edit✓ Link✓ DocUpload✓ TickCircle✓ Trash✓ = 6 enabled
		// (Refresh2 NO aparece para "active")
		const row = page.locator("tr").filter({ hasText: "Activo" });
		await expect(row.locator("button:not([disabled])")).toHaveCount(6);
	});
});

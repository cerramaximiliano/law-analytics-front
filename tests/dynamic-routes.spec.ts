/**
 * Tests de rutas dinámicas con IDs inválidos/inexistentes.
 *
 * Cubre:
 *   GRUPO 1 — /apps/folders/details/:id  → "Carpeta no encontrada" + auto-redirect en 3s
 *   GRUPO 2 — /documentos/escritos/:id/editar → editor abre vacío (sin crash, sin error)
 *   GRUPO 3 — /apps/invoice/details/:id  → pantalla en blanco (sin crash, sin redirect)
 *
 * Estrategia de mock:
 *   folder.ts usa ${VITE_BASE_URL}/api/folders/... → interceptar en localhost:5000
 *   richTextDocuments.ts usa /api/rich-text-documents/... (relativo) → interceptar en localhost:3000
 *   invoice.ts usa /api/invoice/single (POST, relativo) → interceptar en localhost:3000
 *
 * ID falso con formato ObjectId válido para evitar errores de validación de MongoDB:
 *   "000000000000000000000001" (24 hex chars) — formato correcto pero inexistente en DB
 */

import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers/auth";

const VITE_BASE = "http://localhost:5000";
const VITE_PROXY = "http://localhost:3000";

const FAKE_ID = "000000000000000000000001";

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Folders details: "Carpeta no encontrada" + redirect
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 1 — /apps/folders/details/:id con ID inexistente", () => {
	test("ID inválido → muestra 'Carpeta no encontrada' y redirige a /apps/folders/list", async ({ page }) => {
		await loginViaForm(page);

		// Interceptar GET /api/folders/FAKE_ID para devolver { success: false }
		await page.route(`${VITE_BASE}/api/folders/${FAKE_ID}`, (route) =>
			route.fulfill({
				status: 404,
				contentType: "application/json",
				body: JSON.stringify({ success: false, message: "Carpeta no encontrada" }),
			}),
		);

		await page.goto(`/apps/folders/details/${FAKE_ID}`);

		// La página debe mostrar el empty state de carpeta no encontrada
		await expect(page.getByText(/carpeta no encontrada/i)).toBeVisible({ timeout: 10_000 });

		// Auto-redirect después de ~3 segundos
		await expect(page).toHaveURL(/\/apps\/folders\/list/, { timeout: 8_000 });
	});

	test("ID inválido → mensaje de redirección visible antes del redirect", async ({ page }) => {
		await loginViaForm(page);

		await page.route(`${VITE_BASE}/api/folders/${FAKE_ID}`, (route) =>
			route.fulfill({
				status: 404,
				contentType: "application/json",
				body: JSON.stringify({ success: false, message: "Carpeta no encontrada" }),
			}),
		);

		await page.goto(`/apps/folders/details/${FAKE_ID}`);

		// Mensaje de redireccionamiento también visible
		await expect(page.getByText(/redirigiendo/i)).toBeVisible({ timeout: 10_000 });
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Document editor: abre vacío sin crash
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 2 — /documentos/escritos/:id/editar con ID inexistente", () => {
	test("ID inválido → editor abre sin crash (contentLoaded=false queda en false)", async ({ page }) => {
		const jsErrors: string[] = [];
		page.on("pageerror", (err) => jsErrors.push(err.message));

		await loginViaForm(page);

		// richTextDocuments.ts usa path relativo → Vite proxy → interceptar en localhost:3000
		await page.route(`${VITE_PROXY}/api/rich-text-documents/${FAKE_ID}`, (route) =>
			route.fulfill({
				status: 404,
				contentType: "application/json",
				body: JSON.stringify({ success: false, message: "Documento no encontrado" }),
			}),
		);

		await page.goto(`/documentos/escritos/${FAKE_ID}/editar`);
		await page.waitForTimeout(3_000);

		// No debe crashear ni redirigir
		expect(jsErrors).toHaveLength(0);
		await expect(page).toHaveURL(new RegExp(`/documentos/escritos/${FAKE_ID}/editar`));
		await expect(page).not.toHaveURL(/\/login/);
	});

	test("ID inválido → NO muestra ErrorStateCard ni 'Carpeta no encontrada'", async ({ page }) => {
		await loginViaForm(page);

		await page.route(`${VITE_PROXY}/api/rich-text-documents/${FAKE_ID}`, (route) =>
			route.fulfill({
				status: 404,
				contentType: "application/json",
				body: JSON.stringify({ success: false, message: "Documento no encontrado" }),
			}),
		);

		await page.goto(`/documentos/escritos/${FAKE_ID}/editar`);
		await page.waitForTimeout(3_000);

		// No hay estado de error explícito (comportamiento actual: editor vacío)
		await expect(page.getByText(/no encontrado/i)).not.toBeVisible();
		await expect(page).toHaveURL(new RegExp(`/documentos/escritos/${FAKE_ID}/editar`));
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Invoice details: carga sin crash con ID inexistente
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 3 — /apps/invoice/details/:id con ID inexistente", () => {
	test("ID inválido → página carga sin crash (sin error state ni redirect)", async ({ page }) => {
		const jsErrors: string[] = [];
		page.on("pageerror", (err) => jsErrors.push(err.message));

		await loginViaForm(page);

		// invoice.ts usa POST /api/invoice/single con el id en el body
		await page.route(`${VITE_PROXY}/api/invoice/single`, (route) =>
			route.fulfill({
				status: 404,
				contentType: "application/json",
				body: JSON.stringify({ success: false, message: "Invoice not found" }),
			}),
		);

		await page.goto("/apps/invoice/details/999999");
		await page.waitForTimeout(3_000);

		// No debe crashear (comportamiento actual: pantalla en blanco/datos vacíos)
		expect(jsErrors).toHaveLength(0);
		await expect(page).toHaveURL(/\/apps\/invoice\/details\/999999/);
		await expect(page).not.toHaveURL(/\/login/);
	});
});

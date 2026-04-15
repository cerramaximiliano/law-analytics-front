/**
 * Tests de comportamiento ante errores de API (500 / red caída).
 *
 * Objetivo: documentar qué muestra cada página cuando su API falla,
 * y detectar fallos silenciosos que ocultan errores al usuario.
 *
 * Arquitectura de URLs:
 *   - Reducers con path relativo (/api/...) → van a localhost:3000 (Vite proxy)
 *   - Reducers con ${VITE_BASE_URL}/api/... → van directo a localhost:5000
 *
 * GRUPO 1 — Dashboard: ErrorStateCard + botón "Reintentar"
 * GRUPO 2 — Calendar: fallo SILENCIOSO (catch vacío — bug conocido)
 * GRUPO 3 — Postal Tracking: snackbar de error
 * GRUPO 4 — Escritos/Modelos: fallo silencioso en carga inicial
 */

import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers/auth";

const VITE_BASE = "http://localhost:5000";
const VITE_PROXY = "http://localhost:3000";

// Endpoints usados por cada página
const STATS_API    = `${VITE_BASE}/api/stats/**`;
const CALENDAR_API = `${VITE_PROXY}/api/calendar/**`;
const POSTAL_API   = `${VITE_PROXY}/api/postal-documents/**`;
const DOCS_API     = `${VITE_PROXY}/api/rich-text-documents/**`;
const TEMPLATES_API = `${VITE_PROXY}/api/rich-text-templates/**`;

const ERR_500 = {
	status: 500,
	contentType: "application/json",
	body: JSON.stringify({ message: "Internal Server Error", success: false }),
};

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Dashboard: ErrorStateCard + "Reintentar"
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 1 — Dashboard: ErrorStateCard ante 500", () => {
	test("API /api/stats devuelve 500 → muestra ErrorStateCard con botón Reintentar", async ({ page }) => {
		await loginViaForm(page);

		// Interceptar stats antes de navegar
		await page.route(STATS_API, (route) => route.fulfill(ERR_500));

		await page.goto("/dashboard/default");

		// El dashboard muestra ErrorStateCard con botón "Reintentar"
		await expect(page.getByRole("button", { name: /reintentar/i })).toBeVisible({ timeout: 15_000 });

		// La página no debe crashear
		await expect(page).toHaveURL(/\/dashboard\/default/);
	});

	test("botón Reintentar en ErrorStateCard dispara un nuevo fetch", async ({ page }) => {
		await loginViaForm(page);

		let callCount = 0;
		await page.route(STATS_API, (route) => {
			callCount++;
			return route.fulfill(ERR_500);
		});

		await page.goto("/dashboard/default");
		await expect(page.getByRole("button", { name: /reintentar/i })).toBeVisible({ timeout: 15_000 });

		const callsBeforeRetry = callCount;

		// Click en Reintentar → debe disparar otro fetch
		await page.getByRole("button", { name: /reintentar/i }).click();
		await page.waitForTimeout(2_000);

		expect(callCount).toBeGreaterThan(callsBeforeRetry);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Calendar: snackbar de error ante fallo de API (fix aplicado)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 2 — Calendar: snackbar de error ante fallo de API", () => {
	test("API /api/events devuelve 500 → muestra snackbar de error y no queda colgado", async ({ page }) => {
		const jsErrors: string[] = [];
		page.on("pageerror", (err) => jsErrors.push(err.message));

		await loginViaForm(page);

		// events.ts usa ${VITE_BASE_URL}/api/events/user/:id → interceptar en localhost:5000
		await page.route(`${VITE_BASE}/api/events/**`, (route) => route.fulfill(ERR_500));

		await page.goto("/apps/calendar");

		// No debe crashear
		expect(jsErrors).toHaveLength(0);
		await expect(page).toHaveURL(/\/apps\/calendar/);

		// Tras el fix: muestra snackbar con mensaje de error
		await expect(page.getByText(/error al cargar los eventos/i)).toBeVisible({ timeout: 10_000 });
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Postal Tracking: snackbar de error
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 3 — Postal Tracking: feedback visible ante 500", () => {
	test("API /api/postal-documents devuelve 500 → carga sin crash (error en carga inicial silencioso)", async ({ page }) => {
		const jsErrors: string[] = [];
		page.on("pageerror", (err) => jsErrors.push(err.message));

		await loginViaForm(page);
		await page.route(POSTAL_API, (route) => route.fulfill(ERR_500));

		await page.goto("/herramientas/seguimiento-postal");
		await page.waitForTimeout(3_000);

		// No debe crashear
		expect(jsErrors).toHaveLength(0);
		await expect(page).toHaveURL(/\/herramientas\/seguimiento-postal/);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Escritos y Modelos: carga inicial silenciosa ante 500
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 4 — Escritos/Modelos: sin crash ante 500 en carga inicial", () => {
	test("/documentos/escritos con API 500 → carga sin crash", async ({ page }) => {
		const jsErrors: string[] = [];
		page.on("pageerror", (err) => jsErrors.push(err.message));

		await loginViaForm(page);
		await page.route(DOCS_API, (route) => route.fulfill(ERR_500));

		await page.goto("/documentos/escritos");
		await page.waitForTimeout(3_000);

		expect(jsErrors).toHaveLength(0);
		await expect(page).toHaveURL(/\/documentos\/escritos/);
	});

	test("/documentos/modelos con API 500 → carga sin crash", async ({ page }) => {
		const jsErrors: string[] = [];
		page.on("pageerror", (err) => jsErrors.push(err.message));

		await loginViaForm(page);
		await page.route(TEMPLATES_API, (route) => route.fulfill(ERR_500));

		await page.goto("/documentos/modelos");
		await page.waitForTimeout(3_000);

		expect(jsErrors).toHaveLength(0);
		await expect(page).toHaveURL(/\/documentos\/modelos/);
	});
});

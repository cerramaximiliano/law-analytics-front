/**
 * Tests de rutas públicas — accesibles sin autenticación.
 *
 * Estas rutas NO están envueltas en AuthGuard ni GuestGuard:
 *   - /booking, /booking/:slug  → página de reservas pública
 *   - /manage-booking, /manage-booking/:token → gestión de reservas
 *   - /maintenance/404          → página de error
 *
 * GRUPO 1 — No redirigen a /login
 * GRUPO 2 — Rutas inexistentes no crashean (React Router catch-all → 404 page)
 * GRUPO 3 — Contenido de la página 404: texto + botón "Volver al Inicio"
 */

import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers/auth";

const PUBLIC_ROUTES = [
	{ path: "/booking", label: "booking (sin slug)" },
	{ path: "/booking/test-slug", label: "booking/:slug" },
	{ path: "/manage-booking", label: "manage-booking (sin token)" },
	{ path: "/manage-booking/test-token", label: "manage-booking/:token" },
	{ path: "/maintenance/404", label: "página 404" },
];

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Accesibles sin sesión (no redirigen a /login)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Rutas públicas — accesibles sin sesión", () => {
	for (const { path, label } of PUBLIC_ROUTES) {
		test(`[${label}] ${path} → NO redirige a /login`, async ({ page }) => {
			await page.goto(path, { waitUntil: "domcontentloaded" });

			// Esperar a que React Router procese la navegación
			await page.waitForTimeout(2_000);

			await expect(page).not.toHaveURL(/\/login/);
			await expect(page).toHaveURL(new RegExp(path.replace(/\//g, "\\/").replace(/-/g, "\\-")));
		});
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Rutas inexistentes → no rompen la app (React Router catch-all o 404)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Rutas inexistentes — no crashean la app", () => {
	const jsErrors: string[] = [];

	test("ruta inexistente /ruta-que-no-existe → no crash de JS ni redirect a /login", async ({ page }) => {
		page.on("pageerror", (err) => jsErrors.push(`[${err.name}] ${err.message}`));

		await page.goto("/ruta-que-no-existe", { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(2_000);

		// No debe redirigir a /login (no hay AuthGuard en rutas desconocidas)
		await expect(page).not.toHaveURL(/\/login/);

		// No debe haber errores fatales de JS
		expect(jsErrors).toHaveLength(0);
	});

	test("/maintenance/404 → renderiza sin errores de JS", async ({ page }) => {
		page.on("pageerror", (err) => jsErrors.push(`[${err.name}] ${err.message}`));

		await page.goto("/maintenance/404", { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(1_500);

		await expect(page).toHaveURL(/\/maintenance\/404/);
		expect(jsErrors).toHaveLength(0);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Contenido de la página 404
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Página 404 — contenido y navegación", () => {
	test("/maintenance/404 → muestra 'Página No Encontrada' y botón Volver al Inicio", async ({ page }) => {
		await page.goto("/maintenance/404", { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(1_500);

		await expect(page.getByText(/página no encontrada/i)).toBeVisible({ timeout: 5_000 });
		await expect(page.getByRole("link", { name: /volver al inicio/i })).toBeVisible({ timeout: 5_000 });
	});

	test("ruta catch-all /ruta-xyz-inexistente → muestra página 404", async ({ page }) => {
		await page.goto("/ruta-xyz-inexistente", { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(1_500);

		// React Router catch-all: path="*" → <MaintenanceError /> (404 page)
		await expect(page.getByText(/página no encontrada/i)).toBeVisible({ timeout: 5_000 });
	});

	test("usuario logueado en 404 → botón Volver al Inicio lleva a /dashboard/default", async ({ page }) => {
		await loginViaForm(page);
		await page.goto("/maintenance/404", { waitUntil: "domcontentloaded" });
		await page.waitForTimeout(1_000);

		await page.getByRole("link", { name: /volver al inicio/i }).click();

		await expect(page).toHaveURL(/\/dashboard\/default/, { timeout: 10_000 });
	});
});

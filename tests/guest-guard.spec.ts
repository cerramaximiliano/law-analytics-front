/**
 * Tests de GuestGuard — usuario ya autenticado intentando acceder a rutas de auth.
 *
 * GuestGuard redirige al usuario logueado:
 *   - A location.state.from si existe y no es /login ni /register
 *   - Al APP_DEFAULT_PATH (/dashboard/default) en cualquier otro caso
 *
 * Excepción: /code-verification permite acceso incluso con sesión activa.
 */

import { test, expect } from "@playwright/test";
import { loginViaForm } from "./helpers/auth";

// Rutas protegidas por GuestGuard
const GUEST_ROUTES = [
	{ path: "/login",            label: "login" },
	{ path: "/register",         label: "register" },
	{ path: "/forgot-password",  label: "forgot-password" },
	{ path: "/check-mail",       label: "check-mail" },
	{ path: "/reset-password",   label: "reset-password" },
];

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Redirige a /dashboard/default cuando no hay from-state
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GuestGuard — usuario logueado redirigido desde rutas de auth", () => {
	for (const { path, label } of GUEST_ROUTES) {
		test(`[${label}] logueado → intenta acceder a ${path} → redirige a /dashboard/default`, async ({ page }) => {
			await loginViaForm(page);

			// Navegar directamente a la ruta de auth
			await page.goto(path);

			// GuestGuard debe redirigir al default (no hay state.from)
			await expect(page).toHaveURL(/\/dashboard\/default/, { timeout: 10_000 });
			await expect(page).not.toHaveURL(new RegExp(path.replace(/\//g, "\\/")));
		});
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Redirige a state.from cuando la sesión expiró y se re-loguea
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GuestGuard — respeta state.from al redirigir post-login", () => {
	test("state.from=/apps/calendar → después de login redirige a /apps/calendar, no al default", async ({ page }) => {
		// AuthGuard pone state.from cuando redirige a /login
		await page.goto("/apps/calendar");
		await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

		// En este punto location.state.from = /apps/calendar
		await page.fill("#email-login", (await import("./helpers/auth")).CREDENTIALS.email);
		await page.fill("#password-login", (await import("./helpers/auth")).CREDENTIALS.password);
		await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();

		// GuestGuard debe leer state.from y redirigir al calendario
		await expect(page).toHaveURL(/\/apps\/calendar/, { timeout: 15_000 });
		await expect(page).not.toHaveURL(/\/dashboard\/default/);
	});

	test("state.from=/login → GuestGuard lo ignora y redirige al default", async ({ page }) => {
		// Si el from es /login, GuestGuard debe ignorarlo y usar APP_DEFAULT_PATH
		await page.goto("/login");
		await page.fill("#email-login", (await import("./helpers/auth")).CREDENTIALS.email);
		await page.fill("#password-login", (await import("./helpers/auth")).CREDENTIALS.password);
		await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();

		// Debe ir al default, no quedar en un loop
		await expect(page).toHaveURL(/\/dashboard\/default/, { timeout: 15_000 });
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Excepción: /code-verification es accesible con sesión activa
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GuestGuard — excepción /code-verification", () => {
	test("logueado → /code-verification → NO redirige (excepción explícita en GuestGuard)", async ({ page }) => {
		await loginViaForm(page);
		await page.goto("/code-verification");

		// GuestGuard tiene un early return para esta ruta: no redirige
		await expect(page).not.toHaveURL(/\/dashboard\/default/, { timeout: 5_000 });
		await expect(page).toHaveURL(/\/code-verification/);
	});
});

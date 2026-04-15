/**
 * Tests de manejo de token y redirección en Law Analytics Front.
 *
 * Simulan la expiración de sesión sin esperar tiempo real:
 *   - interceptApiWith401  → bloquea APIs no-auth → aparece UnauthorizedModal
 *   - interceptAuthMeWith401 → bloquea /api/auth/me → init() falla → AuthGuard redirige a /login
 *
 * Requiere: dev server en localhost:3000, backend en localhost:5000.
 * Ejecutar: npx playwright test  |  npm run test:e2e
 */

import { test, expect } from "@playwright/test";
import {
	loginViaForm,
	fillLoginForm,
	loginViaModal,
	interceptApiWith401,
	interceptAuthMeWith401,
	waitForUnauthorizedModal,
} from "./helpers/auth";

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1: Navegación sin sesión → login → redirect correcto
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Redirect post-login conserva la URL de origen", () => {
	test("navegar a /documentos/escritos sin sesión → login → vuelve a /documentos/escritos", async ({ page }) => {
		// Ir directo a ruta protegida sin estar logueado
		await page.goto("/documentos/escritos");

		// AuthGuard debe redirigir a /login (con state.from seteado)
		await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

		// Llenar el form que ya está en pantalla (SIN page.goto para preservar state.from)
		await fillLoginForm(page);

		// GuestGuard debe redirigir de vuelta a la URL original
		await expect(page).toHaveURL(/\/documentos\/escritos/, { timeout: 15_000 });
		await expect(page).not.toHaveURL(/\/dashboard\/default/);
	});

	test("navegar a /documentos/modelos sin sesión → login → vuelve a /documentos/modelos", async ({ page }) => {
		await page.goto("/documentos/modelos");

		await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
		await fillLoginForm(page);
		await expect(page).toHaveURL(/\/documentos\/modelos/, { timeout: 15_000 });
		await expect(page).not.toHaveURL(/\/dashboard\/default/);
	});

	test("login directo desde /login sin from-state → va a /dashboard/default", async ({ page }) => {
		// Si el usuario va a /login directamente (sin redirect de AuthGuard)
		// debe ir al default path — comportamiento esperado
		await loginViaForm(page);
		await expect(page).toHaveURL(/\/dashboard\/default/, { timeout: 10_000 });
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2: Sesión expira con tab abierta → UnauthorizedModal
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Sesión expira con tab abierta (UnauthorizedModal)", () => {
	test("token expira en /documentos/escritos → modal → login en modal → permanece en la misma vista", async ({ page }) => {
		await loginViaForm(page);
		await page.goto("/documentos/escritos");
		await expect(page).toHaveURL(/\/documentos\/escritos/);

		// Simular expiración: todas las APIs no-auth devuelven 401
		const removeIntercept = await interceptApiWith401(page);

		// Recargar la vista para que dispare requests → 401 → modal
		await page.reload();
		await waitForUnauthorizedModal(page);

		// Quitar intercept antes de hacer login (para que funcione la request real)
		await removeIntercept();

		// Login dentro del modal
		await loginViaModal(page);

		// Debe permanecer en /documentos/escritos
		await expect(page).toHaveURL(/\/documentos\/escritos/, { timeout: 10_000 });
		await expect(page).not.toHaveURL(/\/dashboard\/default/);
	});

	test("token expira → navegación escritos→modelos → modal → login → permanece en modelos", async ({ page }) => {
		await loginViaForm(page);
		await page.goto("/documentos/escritos");

		const removeIntercept = await interceptApiWith401(page);

		// La navegación a /modelos dispara APIs → 401 → modal
		await page.goto("/documentos/modelos");
		await waitForUnauthorizedModal(page);

		await removeIntercept();
		await loginViaModal(page);

		await expect(page).toHaveURL(/\/documentos\/modelos/, { timeout: 10_000 });
		await expect(page).not.toHaveURL(/\/dashboard\/default/);
	});

	test("token expira → cancelar modal → logout → re-login → redirect a vista original", async ({ page }) => {
		// Este test verifica el fix en handleLogoutAndRedirect:
		// el 'from' debe capturarse ANTES de que logout() navegue a /login.

		await loginViaForm(page);
		await page.goto("/documentos/escritos");

		const removeIntercept = await interceptApiWith401(page);
		await page.reload();
		await waitForUnauthorizedModal(page);

		// Click en "Cancelar" → handleLogoutAndRedirect:
		//   1. captura returnTo = '/documentos/escritos'  (fix aplicado)
		//   2. logout() navega a /login
		//   3. navigate('/login', { state: { from: '/documentos/escritos' } })
		await page.getByRole("button", { name: "Cancelar" }).click();

		// Debe estar en /login con state.from = '/documentos/escritos' intacto
		await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

		await removeIntercept();

		// Llenar el form que YA está en pantalla (SIN page.goto para preservar state.from)
		await fillLoginForm(page);

		// CRÍTICO: debe volver a /documentos/escritos (NO a /dashboard/default)
		await expect(page).toHaveURL(/\/documentos\/escritos/, { timeout: 15_000 });
		await expect(page).not.toHaveURL(/\/dashboard\/default/);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3: Sesión expira al recargar la página (init() → 401)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Sesión expira al recargar (init() → 401)", () => {
	test("recarga en /documentos/escritos con cookie expirada → /login → re-login → vuelve a /documentos/escritos", async ({
		page,
	}) => {
		await loginViaForm(page);
		await page.goto("/documentos/escritos");

		// Interceptar /api/auth/me para simular cookie expirada al recargar
		const removeIntercept = await interceptAuthMeWith401(page);

		// Recarga: Redux resetea → isLoggedIn=false → AuthGuard navega a /login
		// + init() llama /api/auth/me → 401 (mocked) → LOGOUT
		await page.reload();

		// AuthGuard debe haber redirigido con state.from = '/documentos/escritos'
		await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

		// Remover mock ANTES de hacer login (para que /api/auth/login funcione real)
		await removeIntercept();

		// Llenar el form que YA está en /login (SIN page.goto para preservar state.from)
		await fillLoginForm(page);

		// GuestGuard debe redirigir de vuelta a /documentos/escritos
		await expect(page).toHaveURL(/\/documentos\/escritos/, { timeout: 15_000 });
		await expect(page).not.toHaveURL(/\/dashboard\/default/);
	});

	test("recarga en /documentos/modelos con cookie expirada → /login → re-login → vuelve a /documentos/modelos", async ({
		page,
	}) => {
		await loginViaForm(page);
		await page.goto("/documentos/modelos");

		const removeIntercept = await interceptAuthMeWith401(page);
		await page.reload();

		await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
		await removeIntercept();
		await fillLoginForm(page);

		await expect(page).toHaveURL(/\/documentos\/modelos/, { timeout: 15_000 });
		await expect(page).not.toHaveURL(/\/dashboard\/default/);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4: Smoke tests — navegación normal sin expiración
// ─────────────────────────────────────────────────────────────────────────────

test.describe("Navegación normal sin expiración", () => {
	test("login → navegar entre escritos y modelos sin errores", async ({ page }) => {
		await loginViaForm(page);

		await page.goto("/documentos/escritos");
		await expect(page).toHaveURL(/\/documentos\/escritos/);
		await expect(page).not.toHaveURL(/\/login/);

		await page.goto("/documentos/modelos");
		await expect(page).toHaveURL(/\/documentos\/modelos/);
		await expect(page).not.toHaveURL(/\/login/);

		await page.goto("/documentos/escritos");
		await expect(page).toHaveURL(/\/documentos\/escritos/);
	});
});

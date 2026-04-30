/**
 * Tests del formulario de login — validación y manejo de errores.
 *
 * Cubre:
 *   GRUPO 1 — Validación client-side (Formik + Yup): campos vacíos, email inválido
 *   GRUPO 2 — Credenciales incorrectas → snackbar de error del servidor
 *   GRUPO 3 — Estado del botón durante el submit
 *   GRUPO 4 — Rate limiting 429: mensajes de tiempo restante y fallbacks
 *   GRUPO 2 — Credenciales incorrectas → snackbar de error del servidor
 *   GRUPO 3 — Estado del botón durante el submit
 */

import { test, expect } from "@playwright/test";
import { CREDENTIALS, API_BASE } from "./helpers/auth";

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Validación Formik/Yup (client-side, sin llamada al backend)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 1 — Validación client-side del formulario de login", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/login");
		await page.waitForSelector("#email-login", { state: "visible" });
		// En modo dev el form se pre-llena con VITE_DEV_EMAIL/VITE_DEV_PASSWORD — limpiar primero
		await page.fill("#email-login", "");
		await page.fill("#password-login", "");
	});

	test("submit con campos vacíos → muestra errores de requerido", async ({ page }) => {
		// Click en Login con campos vacíos (ya limpiados en beforeEach)
		await page.getByRole("button", { name: "Login", exact: true }).click();

		// Formik valida al hacer submit → ambos campos tocan "touched"
		await expect(page.getByText("El e-mail es requerido")).toBeVisible({ timeout: 5_000 });
		await expect(page.getByText("La contraseña es requerida")).toBeVisible({ timeout: 5_000 });

		// No debe navegar a ningún lado
		await expect(page).toHaveURL(/\/login/);
	});

	test("email inválido → muestra 'Debe ser un e-mail válido'", async ({ page }) => {
		await page.fill("#email-login", "no-es-un-email");
		// Disparar blur para que Formik marque el campo como touched
		await page.locator("#email-login").blur();

		await expect(page.getByText("Debe ser un e-mail válido")).toBeVisible({ timeout: 5_000 });
	});

	test("email vacío + blur → muestra error de requerido", async ({ page }) => {
		// Focus y blur sin escribir
		await page.locator("#email-login").focus();
		await page.locator("#email-login").blur();

		await expect(page.getByText("El e-mail es requerido")).toBeVisible({ timeout: 5_000 });
	});

	test("password vacío + blur → muestra error de requerido", async ({ page }) => {
		await page.locator("#password-login").focus();
		await page.locator("#password-login").blur();

		await expect(page.getByText("La contraseña es requerida")).toBeVisible({ timeout: 5_000 });
	});

	test("email válido + password lleno → errores de validación desaparecen", async ({ page }) => {
		// Primero disparar errores
		await page.getByRole("button", { name: "Login", exact: true }).click();
		await expect(page.getByText("El e-mail es requerido")).toBeVisible({ timeout: 5_000 });

		// Llenar correctamente
		await page.fill("#email-login", "usuario@ejemplo.com");
		await page.fill("#password-login", "una-contraseña-cualquiera");
		await page.locator("#email-login").blur();
		await page.locator("#password-login").blur();

		// Los errores de Yup deben desaparecer
		await expect(page.getByText("El e-mail es requerido")).not.toBeVisible({ timeout: 5_000 });
		await expect(page.getByText("La contraseña es requerida")).not.toBeVisible({ timeout: 5_000 });
		await expect(page.getByText("Debe ser un e-mail válido")).not.toBeVisible();
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Credenciales incorrectas → error del servidor
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 2 — Credenciales incorrectas", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/login");
		await page.waitForSelector("#email-login", { state: "visible" });
	});

	test("contraseña incorrecta → snackbar con 'Credenciales inválidas'", async ({ page }) => {
		// Interceptar el login para devolver 401 de forma controlada
		await page.route(`${API_BASE}/api/auth/login`, async (route) => {
			await route.fulfill({
				status: 401,
				contentType: "application/json",
				body: JSON.stringify({ message: "Credenciales inválidas", success: false }),
			});
		});

		await page.fill("#email-login", CREDENTIALS.email);
		await page.fill("#password-login", "contraseña-incorrecta");
		await page.getByRole("button", { name: "Login", exact: true }).click();

		// El componente AuthLogin muestra un snackbar con el error
		await expect(page.getByText("Credenciales inválidas", { exact: false })).toBeVisible({ timeout: 10_000 });

		// No debe navegar fuera del login
		await expect(page).toHaveURL(/\/login/);
	});

	test("servidor caído (500) → snackbar con mensaje de error del servidor", async ({ page }) => {
		await page.route(`${API_BASE}/api/auth/login`, async (route) => {
			await route.fulfill({
				status: 500,
				contentType: "application/json",
				body: JSON.stringify({ message: "Internal Server Error" }),
			});
		});

		await page.fill("#email-login", CREDENTIALS.email);
		await page.fill("#password-login", CREDENTIALS.password);
		await page.getByRole("button", { name: "Login", exact: true }).click();

		// El código maneja 500 con "Error del servidor. Por favor, intente más tarde."
		await expect(page.getByText("Error del servidor", { exact: false })).toBeVisible({ timeout: 10_000 });
		await expect(page).toHaveURL(/\/login/);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Estado del botón durante el submit
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 3 — Estado del botón durante el submit", () => {
	test("botón se deshabilita y muestra spinner mientras se procesa el login", async ({ page }) => {
		// Interceptar y dejar la request colgada para capturar el estado loading
		let resolveRoute: (() => void) | null = null;
		await page.route(`${API_BASE}/api/auth/login`, async (route) => {
			// Esperar hasta que el test haya verificado el estado loading
			await new Promise<void>((resolve) => {
				resolveRoute = resolve;
			});
			await route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true }),
			});
		});

		await page.goto("/login");
		await page.waitForSelector("#email-login", { state: "visible" });
		await page.fill("#email-login", CREDENTIALS.email);
		await page.fill("#password-login", CREDENTIALS.password);

		// Click en Login — dispara el submit y el request queda colgado
		await page.getByRole("button", { name: "Login", exact: true }).click();

		// El botón debe mostrar "Iniciando sesión..." y estar deshabilitado
		await expect(page.getByRole("button", { name: "Iniciando sesión...", exact: true })).toBeDisabled({ timeout: 5_000 });

		// Resolver la request para que el test termine limpio
		if (resolveRoute) resolveRoute();
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Rate limiting 429
//
// Lógica en AuthLogin.tsx:
//   fullErrorMessage = "Has realizado demasiados intentos..." + description
//   description = errorData.error  ||  tiempo calculado de retryAfter  ||  fallback
//   Tiempo: < 60min → "X minutos" | >= 60min → "X hora(s)" | con resto → "X hora y Y minutos"
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 4 — Rate limiting 429", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/login");
		await page.waitForSelector("#email-login", { state: "visible" });
		await page.fill("#email-login", CREDENTIALS.email);
		await page.fill("#password-login", "cualquier-contraseña");
	});

	test("429 sin retryAfter ni error → muestra mensaje base con fallback", async ({ page }) => {
		await page.route(`${API_BASE}/api/auth/login`, (route) =>
			route.fulfill({
				status: 429,
				contentType: "application/json",
				body: JSON.stringify({ message: "Too Many Requests" }),
			}),
		);

		await page.getByRole("button", { name: "Login", exact: true }).click();

		await expect(page.getByText(/has realizado demasiados intentos/i)).toBeVisible({ timeout: 10_000 });
		// Fallback cuando no hay retryAfter ni error
		await expect(page.getByText(/restablece tu contraseña/i)).toBeVisible({ timeout: 5_000 });
	});

	test("429 con error string → muestra el error string como descripción", async ({ page }) => {
		await page.route(`${API_BASE}/api/auth/login`, (route) =>
			route.fulfill({
				status: 429,
				contentType: "application/json",
				body: JSON.stringify({
					message: "Too Many Requests",
					error: "Cuenta bloqueada por seguridad.",
				}),
			}),
		);

		await page.getByRole("button", { name: "Login", exact: true }).click();

		await expect(page.getByText(/has realizado demasiados intentos/i)).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText(/cuenta bloqueada por seguridad/i)).toBeVisible({ timeout: 5_000 });
	});

	test("429 con retryAfter en minutos → 'Podrás intentar nuevamente en X minutos'", async ({ page }) => {
		await page.route(`${API_BASE}/api/auth/login`, (route) => {
			// 30 minutos en el futuro — Math.ceil(~30min / 1min) = 30
			const retryAfter = new Date(Date.now() + 30 * 60 * 1_000).toISOString();
			return route.fulfill({
				status: 429,
				contentType: "application/json",
				body: JSON.stringify({ retryAfter }),
			});
		});

		await page.getByRole("button", { name: "Login", exact: true }).click();

		await expect(page.getByText(/has realizado demasiados intentos/i)).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText(/podrás intentar nuevamente en 30 minutos/i)).toBeVisible({ timeout: 5_000 });
	});

	test("429 con retryAfter exactamente 1 hora → 'en 1 hora'", async ({ page }) => {
		await page.route(`${API_BASE}/api/auth/login`, (route) => {
			// 60 minutos → hours=1, minutes=0 → "1 hora" (sin "y minutos")
			const retryAfter = new Date(Date.now() + 60 * 60 * 1_000).toISOString();
			return route.fulfill({
				status: 429,
				contentType: "application/json",
				body: JSON.stringify({ retryAfter }),
			});
		});

		await page.getByRole("button", { name: "Login", exact: true }).click();

		await expect(page.getByText(/has realizado demasiados intentos/i)).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText(/podrás intentar nuevamente en 1 hora\./i)).toBeVisible({ timeout: 5_000 });
	});

	test("429 con retryAfter 90 minutos → 'en 1 hora y 30 minutos'", async ({ page }) => {
		await page.route(`${API_BASE}/api/auth/login`, (route) => {
			// 90 minutos → hours=1, minutes=30 → "1 hora y 30 minutos"
			const retryAfter = new Date(Date.now() + 90 * 60 * 1_000).toISOString();
			return route.fulfill({
				status: 429,
				contentType: "application/json",
				body: JSON.stringify({ retryAfter }),
			});
		});

		await page.getByRole("button", { name: "Login", exact: true }).click();

		await expect(page.getByText(/has realizado demasiados intentos/i)).toBeVisible({ timeout: 10_000 });
		await expect(page.getByText(/podrás intentar nuevamente en 1 hora y 30 minutos/i)).toBeVisible({ timeout: 5_000 });
	});

	test("429 → botón vuelve a estar habilitado después de mostrar el error", async ({ page }) => {
		await page.route(`${API_BASE}/api/auth/login`, (route) =>
			route.fulfill({
				status: 429,
				contentType: "application/json",
				body: JSON.stringify({ message: "Too Many Requests" }),
			}),
		);

		await page.getByRole("button", { name: "Login", exact: true }).click();

		// Esperar que el error aparezca
		await expect(page.getByText(/has realizado demasiados intentos/i)).toBeVisible({ timeout: 10_000 });

		// El botón debe volver a estar habilitado (isSubmitting=false tras el finally)
		await expect(page.getByRole("button", { name: "Login", exact: true })).toBeEnabled({ timeout: 5_000 });
		await expect(page).toHaveURL(/\/login/);
	});
});

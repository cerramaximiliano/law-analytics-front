import { test, expect } from "@playwright/test";

// Tests de la página de login — no requieren autenticación.
// Esta página contiene inputs, botones y el layout de auth,
// por eso es clave para detectar regresiones en componentes MUI globales.

test.use({ storageState: { cookies: [], origins: [] } });

test.describe("Login — visual", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/auth/login");
		// Esperar a que el formulario esté completamente renderizado
		await expect(page.locator("#email-login")).toBeVisible();
	});

	test("página completa", async ({ page }) => {
		await expect(page).toHaveScreenshot("login-full.png", { fullPage: true });
	});

	test("input email — tamaño y estilo", async ({ page }) => {
		await expect(page.locator("#email-login")).toHaveScreenshot("login-input-email.png");
	});

	test("input password — tamaño y estilo", async ({ page }) => {
		await expect(page.locator("#password-login")).toHaveScreenshot("login-input-password.png");
	});

	test("botón de login", async ({ page }) => {
		await expect(page.getByRole("button", { name: "Iniciar sesión", exact: true })).toHaveScreenshot("login-btn.png");
	});

	test("formulario completo", async ({ page }) => {
		await expect(page.locator("form")).toHaveScreenshot("login-form.png");
	});
});

import { test, expect } from "@playwright/test";

// Tests enfocados en componentes del tema MUI.
// El objetivo es detectar regresiones en overrides globales como Input, Select, Button, etc.
// Este es el test más importante para detectar el tipo de regresión que ocurrió
// (inputs reduciéndose de tamaño por un cambio en themes/overrides/).

test.describe("Componentes MUI — inputs y formularios", () => {
	// Usamos la página de login como contexto público rico en form elements
	test.use({ storageState: { cookies: [], origins: [] } });

	test.beforeEach(async ({ page }) => {
		await page.goto("/auth/login");
		await expect(page.locator("#email-login")).toBeVisible();
	});

	test("OutlinedInput — altura y padding", async ({ page }) => {
		const input = page.locator(".MuiOutlinedInput-root").first();
		await expect(input).toHaveScreenshot("mui-outlined-input.png");
	});

	test("InputLabel — tamaño y posición", async ({ page }) => {
		const label = page.locator(".MuiInputLabel-root").first();
		await expect(label).toHaveScreenshot("mui-input-label.png");
	});

	test("Button contained — tamaño y estilo", async ({ page }) => {
		const btn = page.locator(".MuiButton-contained").first();
		await expect(btn).toHaveScreenshot("mui-button-contained.png");
	});
});

test.describe("Componentes MUI — páginas autenticadas", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/documentos/escritos");
		await page.waitForLoadState("networkidle");
	});

	test("Select — tamaño y estilo", async ({ page }) => {
		const select = page.locator(".MuiSelect-root").first();
		if (await select.isVisible()) {
			await expect(select).toHaveScreenshot("mui-select.png");
		}
	});

	test("inputs en la página de escritos", async ({ page }) => {
		const inputs = page.locator(".MuiOutlinedInput-root");
		const count = await inputs.count();
		if (count > 0) {
			await expect(inputs.first()).toHaveScreenshot("escritos-input-first.png");
		}
	});
});

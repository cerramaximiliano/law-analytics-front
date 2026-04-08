import { test, expect } from "@playwright/test";

// Tests de la sección Documentos > Escritos.
// Esta página fue recientemente modificada y tiene inputs, selects y tablas
// que son sensibles a cambios en el tema global de MUI.

test.describe("Documentos — Escritos — visual", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/documentos/escritos");
		await page.waitForLoadState("networkidle");
	});

	test("página completa", async ({ page }) => {
		await expect(page).toHaveScreenshot("escritos-full.png", { fullPage: true });
	});

	test("área de contenido principal", async ({ page }) => {
		// Contenido principal excluyendo el sidebar
		const main = page.locator("main").first();
		if (await main.isVisible()) {
			await expect(main).toHaveScreenshot("escritos-main.png");
		}
	});
});

test.describe("Documentos — Editor — visual", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/documentos/escritos/nuevo");
		await page.waitForLoadState("networkidle");
	});

	test("página completa del editor", async ({ page }) => {
		await expect(page).toHaveScreenshot("editor-full.png", { fullPage: true });
	});
});

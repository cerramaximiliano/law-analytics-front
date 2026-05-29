import { test, expect } from "@playwright/test";

// Tests del dashboard principal.
// Detecta regresiones en el layout general, sidebar, navbar y widgets.

test.describe("Dashboard — visual", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/dashboard/default");
		// Esperar a que el contenido principal cargue
		await page.waitForLoadState("networkidle");
	});

	test("página completa", async ({ page }) => {
		await expect(page).toHaveScreenshot("dashboard-full.png", { fullPage: true });
	});

	test("navbar superior", async ({ page }) => {
		// El AppBar de MUI usa role="banner" o el elemento <header>
		const header = page.locator("header, [role='banner']").first();
		if (await header.isVisible()) {
			await expect(header).toHaveScreenshot("dashboard-navbar.png");
		}
	});

	test("sidebar / drawer", async ({ page }) => {
		// El drawer lateral de navegación
		const drawer = page.locator("[class*='MuiDrawer']").first();
		if (await drawer.isVisible()) {
			await expect(drawer).toHaveScreenshot("dashboard-sidebar.png");
		}
	});
});

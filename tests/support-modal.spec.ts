/**
 * Tests del SupportModal — validación de formulario de soporte.
 *
 * El modal se abre desde el botón "Soporte" en el NavCard del Drawer lateral.
 * El NavCard solo se renderiza cuando drawerOpen=true (estado inicial = false),
 * por lo que el test debe abrir el drawer primero.
 *
 * Cambio relevante: el estado de errors se amplió para incluir `name` y `email`
 * (antes solo tenía subject y message). Si el setErrors no incluye todos los
 * campos del estado, TypeScript lanzaba TS2345.
 *
 * GRUPO 1 — Validación client-side: campos requeridos
 * GRUPO 2 — Comportamiento del modal: apertura, cierre, reset
 */

import { test, expect, Page } from "@playwright/test";

// Reutiliza el auth state guardado por el setup global para no llamar al
// login API (evita el rate-limiting del backend al final de la suite).
test.use({ storageState: "tests/.auth/user.json" });

/**
 * Abre el Drawer (si está cerrado) y luego hace click en el botón "Soporte".
 * El NavCard solo existe en el DOM cuando drawerOpen=true, de lo contrario
 * el botón no está renderizado en absoluto.
 */
async function openSupportModal(page: Page) {
	// El botón "open drawer" en el header abre/cierra el Drawer lateral.
	// Verificamos si el NavCard ya está en el DOM (drawer abierto) o no.
	const isNavCardVisible = await page.getByText("¿Necesita ayuda?").isVisible();
	if (!isNavCardVisible) {
		await page.getByRole("button", { name: "open drawer" }).click();
		// Esperar a que el NavCard aparezca tras la animación
		await expect(page.getByText("¿Necesita ayuda?")).toBeVisible({ timeout: 5_000 });
	}

	const btn = page.getByRole("button", { name: "Soporte", exact: true });
	await btn.scrollIntoViewIfNeeded();
	await btn.click();
	await expect(page.getByRole("dialog")).toBeVisible({ timeout: 8_000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Validación client-side del formulario de soporte
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 1 — SupportModal: validación de campos requeridos", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/dashboard/default");
		await openSupportModal(page);
	});

	test("submit sin llenar campos requeridos → errores de subject y message", async ({ page }) => {
		await page.getByRole("button", { name: "Enviar consulta", exact: true }).click();

		await expect(page.getByText("Seleccioná un tipo de consulta")).toBeVisible({ timeout: 5_000 });
		await expect(page.getByText("El mensaje es requerido")).toBeVisible({ timeout: 5_000 });

		// El modal permanece abierto
		await expect(page.getByRole("dialog")).toBeVisible();
	});

	test("seleccionar subject elimina su error de validación", async ({ page }) => {
		// Disparar errores
		await page.getByRole("button", { name: "Enviar consulta", exact: true }).click();
		await expect(page.getByText("Seleccioná un tipo de consulta")).toBeVisible({ timeout: 5_000 });

		// Seleccionar un asunto del dropdown
		await page.getByLabel("Tipo de consulta").click();
		await page.getByRole("option", { name: "Consulta general" }).click();

		// Error de subject desaparece
		await expect(page.getByText("Seleccioná un tipo de consulta")).not.toBeVisible({ timeout: 5_000 });
		// Error de message persiste
		await expect(page.getByText("El mensaje es requerido")).toBeVisible();
	});

	test("llenar mensaje elimina su error de validación", async ({ page }) => {
		// Disparar errores
		await page.getByRole("button", { name: "Enviar consulta", exact: true }).click();
		await expect(page.getByText("El mensaje es requerido")).toBeVisible({ timeout: 5_000 });

		// Llenar mensaje y resubmittear para que se re-evalúe
		await page.getByLabel("Describe tu consulta").fill("Este es un mensaje de prueba.");
		await page.getByRole("button", { name: "Enviar consulta", exact: true }).click();

		// Error de message desaparece
		await expect(page.getByText("El mensaje es requerido")).not.toBeVisible({ timeout: 5_000 });
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Comportamiento de apertura y cierre del modal
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 2 — SupportModal: apertura y cierre", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/dashboard/default");
	});

	test("botón 'Soporte' abre el modal con título 'Contactar a Soporte'", async ({ page }) => {
		await openSupportModal(page);

		await expect(page.getByText("Contactar a Soporte")).toBeVisible();
		await expect(page.getByText("Completa el formulario")).toBeVisible();
	});

	test("botón 'Cancelar' cierra el modal", async ({ page }) => {
		await openSupportModal(page);

		await page.getByRole("button", { name: "Cancelar", exact: true }).click();

		await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5_000 });
	});

	test("los campos se resetean al volver a abrir el modal", async ({ page }) => {
		// Abrir, escribir, cerrar
		await openSupportModal(page);
		await page.getByLabel("Describe tu consulta").fill("Texto que debería limpiarse");
		await page.getByRole("button", { name: "Cancelar", exact: true }).click();
		await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5_000 });

		// Volver a abrir (el drawer ya está abierto)
		await openSupportModal(page);

		// El campo debe estar vacío
		await expect(page.getByLabel("Describe tu consulta")).toHaveValue("");
	});
});

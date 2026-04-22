/**
 * Tests del checkbox "Mantener la sesión abierta" en el formulario de login.
 *
 * El checkbox controla el flag `rememberMe` que se envía en el body del POST
 * a /api/auth/login. Estos tests verifican:
 *  - Estado inicial del checkbox (desmarcado por defecto)
 *  - Que el cuerpo de la petición contenga rememberMe: false cuando está desmarcado
 *  - Que el cuerpo de la petición contenga rememberMe: true cuando está marcado
 *
 * NOTA: Estos tests NO usan storageState — parten desde la página de login.
 * En modo development los campos se pre-rellenan desde VITE_DEV_EMAIL /
 * VITE_DEV_PASSWORD, por lo que no es necesario llenarlos manualmente.
 *
 * GRUPO 1 — Estado inicial del checkbox
 * GRUPO 2 — Valor de rememberMe en el body del POST según estado del checkbox
 */

import { test, expect } from "@playwright/test";

const API_BASE = "http://localhost:5000";
const LOGIN_URL = `${API_BASE}/api/auth/login`;

/** Respuesta de login simulada que evita una redirección real */
const FAKE_LOGIN_RESPONSE = {
	status: 200,
	contentType: "application/json",
	body: JSON.stringify({
		token: "fake-token",
		user: { _id: "123", email: "test@test.com", role: "user" },
		success: true,
	}),
};

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Estado inicial del checkbox
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 1 — rememberMe: estado inicial del checkbox", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/login");
		// Esperar a que el formulario esté visible
		await page.waitForSelector("#email-login", { state: "visible", timeout: 15_000 });
	});

	test("checkbox 'Mantener la sesión abierta' está desmarcado por defecto", async ({ page }) => {
		const checkbox = page.getByRole("checkbox", { name: /mantener la sesión abierta/i });
		await expect(checkbox).toBeVisible({ timeout: 8_000 });
		await expect(checkbox).not.toBeChecked();
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Valor de rememberMe en el body del POST
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 2 — rememberMe: valor enviado en el body según checkbox", () => {
	test.beforeEach(async ({ page }) => {
		await page.goto("/login");
		await page.waitForSelector("#email-login", { state: "visible", timeout: 15_000 });
	});

	test("login sin checkbox marcado → POST body tiene rememberMe: false", async ({ page }) => {
		let capturedBody: Record<string, unknown> | null = null;

		// Interceptar la llamada al API de login antes de que suceda
		await page.route(LOGIN_URL, async (route) => {
			const request = route.request();
			try {
				capturedBody = JSON.parse(request.postData() || "{}");
			} catch {
				capturedBody = null;
			}
			await route.fulfill(FAKE_LOGIN_RESPONSE);
		});

		// El checkbox debe estar desmarcado (estado por defecto)
		const checkbox = page.getByRole("checkbox", { name: /mantener la sesión abierta/i });
		await expect(checkbox).not.toBeChecked();

		// Hacer click en el botón de login
		await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();

		// Esperar a que la ruta sea interceptada
		await page.waitForTimeout(2_000);

		expect(capturedBody).not.toBeNull();
		expect(capturedBody!.rememberMe).toBe(false);
	});

	test("login con checkbox marcado → POST body tiene rememberMe: true", async ({ page }) => {
		let capturedBody: Record<string, unknown> | null = null;

		// Interceptar la llamada al API de login
		await page.route(LOGIN_URL, async (route) => {
			const request = route.request();
			try {
				capturedBody = JSON.parse(request.postData() || "{}");
			} catch {
				capturedBody = null;
			}
			await route.fulfill(FAKE_LOGIN_RESPONSE);
		});

		// Marcar el checkbox antes de hacer login
		const checkbox = page.getByRole("checkbox", { name: /mantener la sesión abierta/i });
		await expect(checkbox).toBeVisible({ timeout: 8_000 });
		await checkbox.check();
		await expect(checkbox).toBeChecked();

		// Hacer click en el botón de login
		await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();

		// Esperar a que la ruta sea interceptada
		await page.waitForTimeout(2_000);

		expect(capturedBody).not.toBeNull();
		expect(capturedBody!.rememberMe).toBe(true);
	});
});

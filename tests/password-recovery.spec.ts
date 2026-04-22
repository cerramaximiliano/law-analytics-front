/**
 * Tests E2E de Recuperación de Contraseña — flujo completo forgot → code → reset → login.
 *
 * El flujo tiene 3 pasos:
 *   1) /auth/forgot-password  → POST /api/auth/reset-request (email)
 *   2) /auth/code-verification → POST /api/auth/verify-reset-code (email, code)
 *   3) /auth/reset-password    → POST /api/auth/reset (email, code, newPassword)
 *
 * **Clave para tests E2E (modo dev):**
 * El endpoint `/api/auth/reset-request` devuelve el `resetCode` en la respuesta
 * cuando `NODE_ENV=development` (ver law-analytics-server/controllers/authController.js:1207-1209).
 * Esto permite capturar el código sin leer el email real.
 *
 * **Sobre el usuario de test:**
 * Usamos `VITE_DEV_EMAIL` (maximilian@rumba-dev.com) con password `VITE_DEV_PASSWORD` (12345678).
 * El flujo E2E cambia la password temporalmente; cada test que resetea restaura el
 * password original en el `finally` para no romper corridas futuras del global-setup.
 *
 * **Mensajes del sessionStorage para navegación entre pasos:**
 *   - reset_in_progress: "true"  (set en forgot, clear en reset-password)
 *   - reset_email: "<email>"
 *   - reset_code: "<6 dígitos>" (set tras verify exitoso)
 *   - reset_verified: "true" (set tras verify)
 *
 * GRUPO 1 — UI /auth/forgot-password (validaciones sin cambiar password)
 * GRUPO 2 — UI /auth/code-verification (validaciones)
 * GRUPO 3 — UI /auth/reset-password (validaciones, campos)
 * GRUPO 4 — Flujo end-to-end real (cambia + restaura password)
 */

import { test, expect, request, type Page } from "@playwright/test";

const API = "http://localhost:5000";
const DEV_EMAIL = "maximilian@rumba-dev.com";
const DEV_PASSWORD = "12345678";
const TEMP_PASSWORD = "TempE2E-P4ssw0rd!";

// ─── Helpers ──────────────────────────────────────────────────────────────────

/** Pide un reset, devuelve el código (disponible en dev mode vía response) */
async function requestResetCode(email: string = DEV_EMAIL): Promise<string> {
	const ctx = await request.newContext();
	try {
		const res = await ctx.post(`${API}/api/auth/reset-request`, {
			data: { email },
			headers: { "Content-Type": "application/json" },
		});
		const body = await res.json();
		if (!body.success || !body.resetCode) {
			throw new Error(`reset-request no devolvió resetCode (dev mode?). Body: ${JSON.stringify(body)}`);
		}
		return body.resetCode as string;
	} finally {
		await ctx.dispose();
	}
}

/** Ejecuta reset de password via API (usado para restaurar al original tras el flow) */
async function apiResetPassword(email: string, code: string, newPassword: string): Promise<void> {
	const ctx = await request.newContext();
	try {
		const res = await ctx.post(`${API}/api/auth/reset`, {
			data: { email, code, newPassword },
			headers: { "Content-Type": "application/json" },
		});
		const body = await res.json();
		if (!body.success) throw new Error(`reset falló: ${body.message}`);
	} finally {
		await ctx.dispose();
	}
}

/**
 * Navega por el flow hasta la página objetivo, usando mocks para evitar tocar el backend.
 * Los componentes de code-verification y reset-password dependen de `location.state`
 * (emailFromState, mode, code) que se setea al navegar desde el paso anterior.
 */
async function navigateToStep(page: Page, step: "verify" | "reset", code: string = "123456") {
	// Mock reset-request siempre
	await page.route(
		(url) => url.pathname === "/api/auth/reset-request",
		(route) =>
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true, message: "Código enviado", userId: "mock", resetCode: code }),
			}),
	);

	if (step === "reset") {
		// Mock verify-reset-code para poder avanzar al último paso
		await page.route(
			(url) => url.pathname === "/api/auth/verify-reset-code",
			(route) =>
				route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({ success: true, message: "Código verificado" }),
				}),
		);
	}

	// Step 1: llenar email en forgot-password → navega a code-verification
	await page.goto("/auth/forgot-password");
	await expect(page.locator("#email-forgot")).toBeVisible({ timeout: 10_000 });
	await page.locator("#email-forgot").fill(DEV_EMAIL);
	await page.getByRole("button", { name: /Enviar Código de Verificación/i }).click();
	await expect(page).toHaveURL(/\/auth\/code-verification/, { timeout: 10_000 });

	if (step === "reset") {
		// Step 2: llenar OTP → navega a reset-password
		const otpInputs = page.getByRole("textbox", { name: /Character \d|verification code/i });
		await expect(otpInputs).toHaveCount(6, { timeout: 5_000 });
		for (let i = 0; i < 6; i++) {
			await otpInputs.nth(i).fill(code[i]);
		}
		await page.getByRole("button", { name: /Verificar código/i }).click();
		await expect(page).toHaveURL(/\/auth\/reset-password/, { timeout: 10_000 });
	}
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — UI /auth/forgot-password
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — /auth/forgot-password carga y muestra el form", async ({ page }) => {
	await page.goto("/auth/forgot-password");
	await expect(page.locator("#email-forgot")).toBeVisible({ timeout: 10_000 });
	await expect(page.getByRole("button", { name: /Enviar Código de Verificación/i })).toBeVisible();
});

test("GRUPO 1 — submit con email vacío → error 'El correo es requerido'", async ({ page }) => {
	await page.goto("/auth/forgot-password");
	await expect(page.locator("#email-forgot")).toBeVisible({ timeout: 10_000 });

	await page.getByRole("button", { name: /Enviar Código de Verificación/i }).click();
	await expect(page.getByText("El correo es requerido")).toBeVisible({ timeout: 5_000 });
});

test("GRUPO 1 — submit con email inválido → error 'Debe ser un formato'", async ({ page }) => {
	await page.goto("/auth/forgot-password");
	await expect(page.locator("#email-forgot")).toBeVisible({ timeout: 10_000 });

	await page.locator("#email-forgot").fill("no-es-email");
	await page.getByRole("button", { name: /Enviar Código de Verificación/i }).click();
	await expect(page.getByText(/Debe ser un formato/i)).toBeVisible({ timeout: 5_000 });
});

test("GRUPO 1 — email válido → snackbar + navega a /auth/code-verification", async ({ page }) => {
	// Mockear el POST para no gastar rate-limit ni generar códigos reales en este test
	await page.route(
		(url) => url.pathname === "/api/auth/reset-request",
		(route) =>
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({
					success: true,
					message: "Se ha enviado un código",
					userId: "mock-user",
					resetCode: "123456",
				}),
			}),
	);

	await page.goto("/auth/forgot-password");
	await expect(page.locator("#email-forgot")).toBeVisible({ timeout: 10_000 });

	await page.locator("#email-forgot").fill(DEV_EMAIL);
	await page.getByRole("button", { name: /Enviar Código de Verificación/i }).click();

	// Snackbar + navegación
	await expect(page.getByText(/Revisa tu correo electrónico/i)).toBeVisible({ timeout: 5_000 });
	await expect(page).toHaveURL(/\/auth\/code-verification/, { timeout: 10_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — UI /auth/code-verification
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — /auth/code-verification muestra email y 6 inputs de OTP", async ({ page }) => {
	await navigateToStep(page, "verify");

	await expect(page.getByText("Verificación para reseteo de contraseña")).toBeVisible({ timeout: 10_000 });
	await expect(page.getByText(DEV_EMAIL)).toBeVisible();
	const otpInputs = page.getByRole("textbox", { name: /Character \d|verification code/i });
	await expect(otpInputs).toHaveCount(6, { timeout: 5_000 });
});

test("GRUPO 2 — código inválido → backend 400 → error en UI", async ({ page }) => {
	// Mock específico para ESTE test: verify devuelve 400
	await page.route(
		(url) => url.pathname === "/api/auth/verify-reset-code",
		(route) =>
			route.fulfill({
				status: 400,
				contentType: "application/json",
				body: JSON.stringify({ success: false, message: "Código inválido o expirado" }),
			}),
	);

	await navigateToStep(page, "verify");

	// Llenar un OTP cualquiera (incorrecto)
	const otpInputs = page.getByRole("textbox", { name: /Character \d|verification code/i });
	await expect(otpInputs).toHaveCount(6, { timeout: 5_000 });
	for (let i = 0; i < 6; i++) {
		await otpInputs.nth(i).fill(String((i + 1) % 10));
	}

	await page.getByRole("button", { name: /Verificar código/i }).click();
	// El mensaje aparece en snackbar + Typography — usar first()
	await expect(page.getByText(/Código inválido o expirado/i).first()).toBeVisible({ timeout: 5_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — UI /auth/reset-password
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — /auth/reset-password carga con campos password + confirm", async ({ page }) => {
	await navigateToStep(page, "reset");

	await expect(page.locator("#password-reset")).toBeVisible({ timeout: 10_000 });
	await expect(page.locator("#confirm-password-reset")).toBeVisible();
	await expect(page.getByRole("button", { name: /Resetear Password/i })).toBeVisible();
});

test("GRUPO 3 — confirmPassword distinto → error 'Ambas constraseñas deben ser iguales'", async ({ page }) => {
	await navigateToStep(page, "reset");

	await page.locator("#password-reset").fill("password-a");
	await page.locator("#confirm-password-reset").fill("password-b");
	await page.getByRole("button", { name: /Resetear Password/i }).click();

	// Nota: el mensaje tiene un typo 'constraseñas' en el código de producción — respetar.
	await expect(page.getByText(/Ambas constraseñas deben ser iguales|Ambas contraseñas deben ser iguales/i)).toBeVisible({
		timeout: 5_000,
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Flujo E2E real (cambia password y restaura al final)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — flujo completo forgot→code→reset→login + restaura password original", async ({ page }) => {
	test.setTimeout(120_000);

	// 1) Pedir código via API directo (dev mode → devuelve resetCode en response)
	//    Esto evita race conditions con el response.json() del waitForResponse del UI.
	const code = await requestResetCode(DEV_EMAIL);
	expect(code).toMatch(/^\d{6}$/);

	// 2) Iniciar flow via UI desde forgot-password (el segundo reset-request
	//    re-genera el código — el backend lo actualiza en DB con el último)
	await page.goto("/auth/forgot-password");
	await expect(page.locator("#email-forgot")).toBeVisible({ timeout: 10_000 });

	const [resetResponse] = await Promise.all([
		page.waitForResponse(
			(r) => r.url().endsWith("/api/auth/reset-request") && r.request().method() === "POST",
			{ timeout: 10_000 },
		),
		(async () => {
			await page.locator("#email-forgot").fill(DEV_EMAIL);
			await page.getByRole("button", { name: /Enviar Código de Verificación/i }).click();
		})(),
	]);
	// Leer body inmediatamente antes que el browser pueda descartarlo
	const body = await resetResponse.json().catch(() => null);
	const uiCode = body?.resetCode ?? code;
	expect(uiCode).toMatch(/^\d{6}$/);
	const actualCode = uiCode as string;

	// 3) Navegación automática a code-verification
	await expect(page).toHaveURL(/\/auth\/code-verification/, { timeout: 10_000 });

	// 4) Llenar OTP con el código actual
	const otpInputs = page.getByRole("textbox", { name: /Character \d|verification code/i });
	await expect(otpInputs).toHaveCount(6, { timeout: 5_000 });
	for (let i = 0; i < 6; i++) {
		await otpInputs.nth(i).fill(actualCode[i]);
	}

	await page.getByRole("button", { name: /Verificar código/i }).click();

	// 4) Navega a reset-password
	await expect(page).toHaveURL(/\/auth\/reset-password/, { timeout: 10_000 });
	await expect(page.locator("#password-reset")).toBeVisible({ timeout: 5_000 });

	// 5) Introducir temp password
	await page.locator("#password-reset").fill(TEMP_PASSWORD);
	await page.locator("#confirm-password-reset").fill(TEMP_PASSWORD);

	try {
		await page.getByRole("button", { name: /Resetear Password/i }).click();

		// 6) Snackbar + redirect a login
		await expect(page.getByText("Contraseña restablecida con éxito.")).toBeVisible({ timeout: 10_000 });
		await expect(page).toHaveURL(/\/(login|auth\/login)/, { timeout: 10_000 });

		// 7) Verificar que el nuevo password funciona via API (login real)
		const loginCtx = await request.newContext();
		try {
			const loginRes = await loginCtx.post(`${API}/api/auth/login`, {
				data: { email: DEV_EMAIL, password: TEMP_PASSWORD },
				headers: { "Content-Type": "application/json" },
			});
			expect(loginRes.ok()).toBe(true);
			const loginBody = await loginRes.json();
			expect(loginBody.success).toBe(true);
		} finally {
			await loginCtx.dispose();
		}
	} finally {
		// 8) CRITICAL: restaurar password original para no romper global-setup de futuras corridas.
		// Pedir un segundo código y hacer reset al password original.
		try {
			const restoreCode = await requestResetCode(DEV_EMAIL);
			await apiResetPassword(DEV_EMAIL, restoreCode, DEV_PASSWORD);
		} catch (err) {
			console.error("⚠️  No se pudo restaurar password original:", err);
			console.error("   Ejecutar manualmente: POST /api/auth/reset-request + /api/auth/reset");
			throw err;
		}
	}
});

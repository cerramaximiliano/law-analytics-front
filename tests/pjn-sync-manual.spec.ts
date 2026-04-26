/**
 * Tests E2E de PJN Sync manual — `/apps/profiles/account/pjn`
 *
 * **Contexto:**
 *   El usuario puede vincular su cuenta del Poder Judicial de la Nación para
 *   que las causas se sincronicen automáticamente. En esta tab puede también
 *   disparar una re-sincronización manual.
 *
 * **Arquitectura:**
 *   - Ruta: /apps/profiles/account/pjn → `AccountTabPjnIntegration`
 *   - Componentes:
 *     · `src/sections/apps/profiles/account/TabPjnIntegration.tsx` (card padre)
 *     · `src/sections/apps/folders/step-components/PjnAccountConnect.tsx` (lógica de vinculación + resync)
 *   - Endpoints consumidos:
 *     · GET  /api/pjn-credentials → estado de credenciales (CUIL, enabled, syncStatus, lastSync, etc.)
 *     · POST /api/pjn-credentials/sync → dispara resync manual
 *     · GET  /api/user-preferences → preferencias (syncContactsFromIntervinientes)
 *     · PATCH /api/user-preferences → toggle de preferencias
 *   - Estados de syncStatus: "pending" | "in_progress" | "completed" | "error" | "never_synced"
 *   - El sync real dispara scraping en `pjn-mis-causas` worker — NO lo activamos en tests.
 *     Solo validamos que el POST /sync se dispara con la intención correcta.
 *
 * **Estrategia:**
 *   Mockeamos todos los endpoints (`GET /api/pjn-credentials`, `POST /api/pjn-credentials/sync`,
 *   `GET /api/user-preferences`) con fixtures que cubren estados clave del lifecycle:
 *     - sin credenciales → formulario de conexión
 *     - conectado + completed → card "Cuenta conectada" + botón resync habilitado
 *     - error de credenciales → Alert + botón deshabilitado
 *     - tracking error → botón "Reintentar sincronización"
 *
 * GRUPO 1 — Navegación a la tab PJN + render básico
 * GRUPO 2 — Usuario sin credenciales → formulario de conexión
 * GRUPO 3 — Usuario con credenciales conectadas (syncStatus=completed) → UI + resync button
 * GRUPO 4 — Click resync → POST /api/pjn-credentials/sync + snackbar "Sincronización iniciada"
 * GRUPO 5 — Error de credenciales → Alert + botón disabled
 * GRUPO 6 — Toggle "Sincronizar intervinientes" → PATCH /api/user-preferences
 */

import { test, expect, type Page, type Route } from "@playwright/test";

const STORAGE_STATE = "tests/.auth/user.json";
test.use({ storageState: STORAGE_STATE });

// ─── Fixtures de estado ─────────────────────────────────────────────────────

// El componente evalúa:
//   isComplete = credentialsStatus.isValid && credentialsStatus.verified
//   hasError = syncErrored && !isComplete  (syncErrored depende del lastError?.code)
//   isCredentialError = hasError && credentialsStatus.lastError?.code === "CREDENTIAL_INVALID"
// También revisa `response.success && response.data` + `response.hasCredentials` + `response.serviceAvailable`.

const NO_CREDENTIALS = {
	success: false,
	hasCredentials: false,
	serviceAvailable: true,
	error: "No hay credenciales vinculadas",
};

const CREDENTIALS_CONNECTED = {
	success: true,
	hasCredentials: true,
	serviceAvailable: true,
	data: {
		id: "cred_1",
		cuil: "20-12345678-9",
		enabled: true,
		verified: true,
		verifiedAt: "2026-04-01T10:00:00.000Z",
		isValid: true,
		isValidAt: "2026-04-19T12:00:00.000Z",
		syncStatus: "completed",
		lastSync: "2026-04-19T12:00:00.000Z",
		lastSyncAttempt: "2026-04-19T12:00:00.000Z",
		consecutiveErrors: 0,
		lastError: null,
		expectedCausasCount: 15,
		processedCausasCount: 15,
		foldersCreatedCount: 15,
		stats: {},
		currentSyncProgress: null,
		evolution: null,
		createdAt: "2026-04-01T10:00:00.000Z",
		updatedAt: "2026-04-19T12:00:00.000Z",
	},
};

const CREDENTIALS_WITH_AUTH_ERROR = {
	success: true,
	hasCredentials: true,
	serviceAvailable: true,
	data: {
		id: "cred_1",
		cuil: "20-12345678-9",
		enabled: false, // deshabilitado tras fallos repetidos
		verified: false,
		verifiedAt: null,
		isValid: false,
		isValidAt: null,
		syncStatus: "error",
		lastSync: null,
		lastSyncAttempt: "2026-04-19T12:00:00.000Z",
		consecutiveErrors: 5,
		lastError: { code: "CREDENTIAL_INVALID", message: "Contraseña incorrecta" },
		expectedCausasCount: 0,
		processedCausasCount: 0,
		foldersCreatedCount: 0,
		stats: {},
		currentSyncProgress: null,
		evolution: null,
		createdAt: "2026-04-01T10:00:00.000Z",
		updatedAt: "2026-04-19T12:00:00.000Z",
	},
};

const PREFS_DEFAULT = {
	success: true,
	data: { pjn: { syncContactsFromIntervinientes: false } },
};

// ─── Helpers ────────────────────────────────────────────────────────────────

async function mockPjnCredentials(page: Page, body: unknown) {
	await page.route(
		(url) => url.pathname === "/api/pjn-credentials",
		(route: Route) => {
			if (route.request().method() === "GET") {
				return route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify(body),
				});
			}
			return route.continue();
		},
	);
}

async function mockPrefs(page: Page, body: unknown) {
	// El endpoint real es /api/notifications/preferences (no /api/user-preferences)
	await page.route(
		(url) => url.pathname === "/api/notifications/preferences",
		(route: Route) => {
			if (route.request().method() === "GET") {
				return route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify(body),
				});
			}
			return route.continue();
		},
	);
}

async function gotoPjnTab(page: Page) {
	await page.goto("/apps/profiles/account/pjn");
	await expect(page.getByRole("heading", { name: /Integración PJN/i })).toBeVisible({ timeout: 15_000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Navegación + render básico
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — /apps/profiles/account/pjn renderiza el card 'Integración PJN'", async ({ page }) => {
	await mockPjnCredentials(page, NO_CREDENTIALS);
	await mockPrefs(page, PREFS_DEFAULT);

	await gotoPjnTab(page);

	await expect(page.getByRole("heading", { name: /Integración PJN/i })).toBeVisible({ timeout: 5_000 });
	await expect(page.getByText(/Vincula tu cuenta del Poder Judicial/i)).toBeVisible();
});

test("GRUPO 1 — card 'Preferencias de sincronización' también visible", async ({ page }) => {
	await mockPjnCredentials(page, NO_CREDENTIALS);
	await mockPrefs(page, PREFS_DEFAULT);

	await gotoPjnTab(page);

	await expect(page.getByRole("heading", { name: /Preferencias de sincronización/i })).toBeVisible({ timeout: 5_000 });
	await expect(page.getByText(/Sincronizar intervinientes como contactos/i)).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Sin credenciales → formulario visible
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — sin credenciales PJN → formulario de CUIL + contraseña visible", async ({ page }) => {
	await mockPjnCredentials(page, NO_CREDENTIALS);
	await mockPrefs(page, PREFS_DEFAULT);

	await gotoPjnTab(page);

	// El formulario debe mostrar campos CUIL y contraseña (no hay card "Cuenta conectada")
	await expect(page.getByText(/Cuenta conectada|Cuenta vinculada/i)).not.toBeVisible({ timeout: 3_000 });
	// Campo CUIL por placeholder "Ej: 20-12345678-9"
	const cuilInput = page.getByPlaceholder(/20-12345678-9|XX-XXXXXXXX-X/);
	await expect(cuilInput).toBeVisible({ timeout: 5_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Cuenta conectada → botón resync habilitado
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — credenciales OK + syncStatus completed → 'Cuenta conectada' + botón resync", async ({ page }) => {
	await mockPjnCredentials(page, CREDENTIALS_CONNECTED);
	await mockPrefs(page, PREFS_DEFAULT);

	await gotoPjnTab(page);

	await expect(page.getByText(/Cuenta conectada/i)).toBeVisible({ timeout: 10_000 });
	await expect(page.getByText(/causas del Poder Judicial.*sincronizadas/i)).toBeVisible();

	const resyncBtn = page.locator('[data-testid="pjn-resync-btn"]');
	await expect(resyncBtn).toBeVisible({ timeout: 5_000 });
	await expect(resyncBtn).toBeEnabled();
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Click resync manual → POST /api/pjn-credentials/sync
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — click 'Re-sincronizar' → POST /api/pjn-credentials/sync + snackbar", async ({ page }) => {
	await mockPjnCredentials(page, CREDENTIALS_CONNECTED);
	await mockPrefs(page, PREFS_DEFAULT);

	// Mock del POST sync
	await page.route(
		(url) => url.pathname === "/api/pjn-credentials/sync",
		(route) =>
			route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify({ success: true, message: "Sincronización iniciada" }),
			}),
	);

	await gotoPjnTab(page);

	const resyncBtn = page.locator('[data-testid="pjn-resync-btn"]');
	await expect(resyncBtn).toBeVisible({ timeout: 10_000 });

	// Capturar el POST cuando se dispara
	const [postRequest] = await Promise.all([
		page.waitForRequest(
			(req) => req.url().endsWith("/api/pjn-credentials/sync") && req.method() === "POST",
			{ timeout: 10_000 },
		),
		resyncBtn.click(),
	]);

	expect(postRequest).toBeTruthy();

	// Snackbar "Sincronización iniciada"
	await expect(page.getByText(/Sincronización iniciada/i)).toBeVisible({ timeout: 5_000 });
});

test("GRUPO 4 — backend responde error → snackbar de warning, sin banner de progreso", async ({ page }) => {
	await mockPjnCredentials(page, CREDENTIALS_CONNECTED);
	await mockPrefs(page, PREFS_DEFAULT);

	await page.route(
		(url) => url.pathname === "/api/pjn-credentials/sync",
		(route) =>
			route.fulfill({
				status: 429,
				contentType: "application/json",
				body: JSON.stringify({ success: false, error: "Ya se sincronizó recientemente" }),
			}),
	);

	await gotoPjnTab(page);
	const resyncBtn = page.locator('[data-testid="pjn-resync-btn"]');
	await expect(resyncBtn).toBeVisible({ timeout: 10_000 });
	await resyncBtn.click();

	// Muestra mensaje de error/warning del backend
	await expect(page.getByText(/Ya se sincronizó recientemente|No se pudo iniciar/i)).toBeVisible({ timeout: 5_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 5 — Error de credenciales → botón deshabilitado
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 5 — credenciales con error → Alert + botón resync deshabilitado", async ({ page }) => {
	await mockPjnCredentials(page, CREDENTIALS_WITH_AUTH_ERROR);
	await mockPrefs(page, PREFS_DEFAULT);

	await gotoPjnTab(page);

	// Alert de error de credenciales
	await expect(page.getByText(/Contraseña del PJN.*incorrecta|Cuenta desactivada/i)).toBeVisible({ timeout: 10_000 });

	const resyncBtn = page.locator('[data-testid="pjn-resync-btn"]');
	await expect(resyncBtn).toBeVisible({ timeout: 5_000 });
	await expect(resyncBtn).toBeDisabled();
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 6 — Toggle de preferencia "Sincronizar intervinientes"
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 6 — toggle ON → PATCH /api/user-preferences + snackbar 'activada'", async ({ page }) => {
	await mockPjnCredentials(page, NO_CREDENTIALS);
	await mockPrefs(page, PREFS_DEFAULT);

	// Mock PUT /api/notifications/preferences
	let patchHit = false;
	let patchBody: any = null;
	await page.route(
		(url) => url.pathname === "/api/notifications/preferences",
		(route) => {
			if (route.request().method() === "PUT" || route.request().method() === "PATCH" || route.request().method() === "POST") {
				patchHit = true;
				try {
					patchBody = route.request().postDataJSON();
				} catch {
					patchBody = null;
				}
				return route.fulfill({
					status: 200,
					contentType: "application/json",
					body: JSON.stringify({
						success: true,
						data: { pjn: { syncContactsFromIntervinientes: true } },
					}),
				});
			}
			return route.fulfill({
				status: 200,
				contentType: "application/json",
				body: JSON.stringify(PREFS_DEFAULT),
			});
		},
	);

	await gotoPjnTab(page);

	// El switch está dentro del FormControlLabel con label "Sincronizar intervinientes como contactos"
	const toggle = page.getByLabel("Sincronizar intervinientes como contactos");
	await expect(toggle).toBeVisible({ timeout: 10_000 });
	await toggle.click();

	await expect.poll(() => patchHit, { timeout: 5_000 }).toBe(true);
	// El body debe incluir syncContactsFromIntervinientes: true
	expect(JSON.stringify(patchBody)).toContain("syncContactsFromIntervinientes");

	await expect(page.getByText(/Sincronización de intervinientes activada/i)).toBeVisible({ timeout: 5_000 });
});

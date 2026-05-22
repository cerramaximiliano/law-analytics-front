/**
 * Tests del LimitErrorModal — modal global de restricción de plan.
 *
 * El modal se activa mediante el interceptor global de axios en ServerContext:
 * cuando cualquier API responde con 403 y el body incluye `limitInfo` o
 * `featureInfo`, el AuthProvider muestra el LimitErrorModal.
 *
 * Estrategia: Se navega a /apps/folders/list y se devuelve 403+limitInfo desde
 * GET /api/folders/** (en lugar de user-stats). Esto evita el loop infinito de
 * ResourceUsageWidget que re-llama fetchUserStats() cuando planInfo=null, lo
 * cual degrada la página a los ~15s y deja pantalla en blanco.
 *
 * Los planes se cargan con GET /api/plan-configs/public — también interceptado.
 *
 * NOTA: No se usa test.describe + test.beforeEach para el goto() porque la
 * combinación hace que la página quede en blanco a los ~3s. El setup se
 * inlinea en cada test usando la función setupAndGo().
 *
 * GRUPO 1 — Apertura y contenido del modal ante limitInfo (403)
 * GRUPO 2 — Apertura ante featureInfo (403)
 * GRUPO 3 — Acciones del modal: "Suscribirme Ahora" y "Cerrar"
 */

import { test, expect } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

const VITE_BASE = "http://localhost:5000";

/** Folders list — el 403 aquí dispara el modal sin afectar user-stats */
const FOLDERS_API = `${VITE_BASE}/api/folders/**`;

/** Equipos — vacíos para que TeamContext inicialice rápido (isTeamReady=true) */
const GROUPS_API = `${VITE_BASE}/api/groups`;

/** Verificación de límite de carpetas — OK para que la página no muestre LimitError antes del test */
const CHECK_RESOURCE_API = `${VITE_BASE}/api/plan-configs/check-resource/folders`;

/** Planes públicos que carga el modal */
const PLANS_API = `${VITE_BASE}/api/plan-configs/public`;

/** Plan de prueba devuelto cuando el modal carga planes */
const MOCK_PLAN = {
	planId: "standard",
	displayName: "Standard Plan",
	description: "Plan estándar de prueba",
	isActive: true,
	isDefault: false,
	features: [],
	resourceLimits: [],
	pricingInfo: {
		basePrice: 2999,
		currency: "ARS",
		billingPeriod: "monthly",
		stripePriceId: "price_test_standard",
	},
	activeDiscounts: [],
};

const MOCK_PLANS_RESPONSE = {
	status: 200,
	contentType: "application/json",
	body: JSON.stringify({ success: true, data: [MOCK_PLAN] }),
};

const EMPTY_FOLDERS_RESPONSE = {
	status: 200,
	contentType: "application/json",
	body: JSON.stringify({ success: true, folders: [], total: 0 }),
};

const EMPTY_GROUPS_RESPONSE = {
	status: 200,
	contentType: "application/json",
	body: JSON.stringify({ success: true, groups: [] }),
};

const LIMIT_OK_RESPONSE = {
	status: 200,
	contentType: "application/json",
	body: JSON.stringify({ success: true, data: { hasReachedLimit: false, resourceType: "folders", currentCount: 5, limit: 10 } }),
};

/**
 * Construye la respuesta 403 con limitInfo que activa el modal "Límite alcanzado".
 */
function buildLimitInfoResponse(currentCount: number, limit: number) {
	return {
		status: 403,
		contentType: "application/json",
		body: JSON.stringify({
			success: false,
			message: "Has alcanzado el límite de carpetas de tu plan",
			limitInfo: {
				resourceType: "Carpetas",
				plan: "free",
				currentCount: String(currentCount),
				limit,
			},
			upgradeRequired: true,
		}),
	};
}

/**
 * Construye la respuesta 403 con featureInfo que activa el modal "Función no disponible".
 */
function buildFeatureInfoResponse() {
	return {
		status: 403,
		contentType: "application/json",
		body: JSON.stringify({
			success: false,
			message: "Esta función no está disponible en tu plan actual",
			featureInfo: {
				feature: "Exportación PDF",
				plan: "Free",
				availableIn: ["Standard", "Premium"],
			},
			upgradeRequired: true,
		}),
	};
}

/**
 * Configura interceptores y navega a /apps/folders/list.
 * Inlinar el goto() dentro de cada test (no en beforeEach) es necesario para
 * evitar que la página quede en blanco cuando se usa test.describe + beforeEach.
 *
 * - check-resource → 200 (no bloquea la apertura de la página)
 * - groups → vacíos (TeamContext inicializa rápido)
 * - plans → mock controlado (modal muestra un plan de prueba)
 * - folders → 403 en el primer llamado (dispara el modal), luego 200 (evita retry loop)
 *   user-stats NO se intercepta → va al backend real → 200 → ResourceUsageWidget ok
 */
async function setupAndGo(page: any, folderErrorResponse: any) {
	await page.route(CHECK_RESOURCE_API, (route: any) => route.fulfill(LIMIT_OK_RESPONSE));
	await page.route(GROUPS_API, (route: any) => route.fulfill(EMPTY_GROUPS_RESPONSE));
	await page.route(PLANS_API, (route: any) => route.fulfill(MOCK_PLANS_RESPONSE));

	// Folders: 403 solo en el primer llamado para disparar el modal.
	// Los llamados siguientes devuelven lista vacía (200) para detener cualquier retry.
	let firstCall = true;
	await page.route(FOLDERS_API, (route: any) => {
		if (firstCall) {
			firstCall = false;
			return route.fulfill(folderErrorResponse);
		}
		return route.fulfill(EMPTY_FOLDERS_RESPONSE);
	});

	await page.goto("/apps/folders/list");
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Modal "Límite alcanzado" ante 403 con limitInfo
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — 403 con limitInfo → modal 'Límite alcanzado' se abre", async ({ page }) => {
	await setupAndGo(page, buildLimitInfoResponse(10, 10));
	await expect(page.getByText("Límite alcanzado")).toBeVisible({ timeout: 20_000 });
	await expect(page.getByRole("dialog")).toBeVisible();
});

test("GRUPO 1 — modal muestra uso actual: currentCount / limit", async ({ page }) => {
	await setupAndGo(page, buildLimitInfoResponse(10, 10));
	await expect(page.getByText("Límite alcanzado")).toBeVisible({ timeout: 20_000 });
	await expect(page.getByText(/10\s*\/\s*10/)).toBeVisible({ timeout: 8_000 });
});

test("GRUPO 1 — modal carga planes y muestra botón 'Suscribirme Ahora'", async ({ page }) => {
	await setupAndGo(page, buildLimitInfoResponse(10, 10));
	await expect(page.getByText("Límite alcanzado")).toBeVisible({ timeout: 20_000 });
	await expect(page.getByRole("button", { name: /suscribirme ahora/i }).first()).toBeVisible({ timeout: 10_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Modal "Función no disponible" ante 403 con featureInfo
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — 403 con featureInfo → modal 'Función no disponible'", async ({ page }) => {
	await setupAndGo(page, buildFeatureInfoResponse());
	await expect(page.getByText("Función no disponible")).toBeVisible({ timeout: 20_000 });
	await expect(page.getByRole("dialog")).toBeVisible();
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Acciones del modal
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — 'Suscribirme Ahora' navega a /suscripciones/tables?plan={planId}", async ({ page }) => {
	await setupAndGo(page, buildLimitInfoResponse(10, 10));
	await expect(page.getByText("Límite alcanzado")).toBeVisible({ timeout: 20_000 });

	const subscribeBtn = page.getByRole("button", { name: /suscribirme ahora/i }).first();
	await expect(subscribeBtn).toBeVisible({ timeout: 10_000 });
	await subscribeBtn.click();

	await expect(page).toHaveURL(/\/suscripciones\/tables\?plan=standard/, { timeout: 10_000 });
});

test("GRUPO 3 — 'Cerrar' cierra el modal", async ({ page }) => {
	await setupAndGo(page, buildLimitInfoResponse(10, 10));
	await expect(page.getByText("Límite alcanzado")).toBeVisible({ timeout: 20_000 });

	const cerrarBtn = page.getByRole("button", { name: "Cerrar", exact: true });
	await expect(cerrarBtn).toBeVisible({ timeout: 8_000 });
	await cerrarBtn.click();

	await expect(page.getByRole("dialog")).not.toBeVisible({ timeout: 5_000 });
});

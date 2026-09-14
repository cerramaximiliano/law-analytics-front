/**
 * Tests E2E del Dashboard — /dashboard/default
 *
 * Todos los tests usan storageState (sesión pre-autenticada).
 * Las APIs se mockean para obtener comportamiento determinista:
 *   - MODO NORMAL: carpetas activas > 0, onboarding dismissed
 *   - MODO ONBOARDING: carpetas = 0, onboarding no descartado
 *
 * Usuario: plan gratuito.
 *
 * APIs interceptadas:
 *   - GET http://localhost:5000/api/stats/unified/**  → datos del dashboard
 *   - GET http://localhost:5000/api/user-stats/user   → datos del plan
 *   - GET http://localhost:5000/api/auth/onboarding   → estado del onboarding
 *
 * GRUPO 1 — Carga básica
 * GRUPO 2 — Modo Normal: widgets de estadísticas
 * GRUPO 3 — Modo Normal: widgets laterales
 * GRUPO 4 — Modo Onboarding: usuario sin carpetas
 * GRUPO 5 — Navegación desde el dashboard
 */

import { test, expect, type Page } from "@playwright/test";

test.use({ storageState: "tests/.auth/user.json" });

const API = "http://localhost:5000";

// ─── Mock data ────────────────────────────────────────────────────────────────

const STATS_NORMAL = {
	success: true,
	data: {
		dashboard: {
			folders: { active: 5, closed: 3 },
			financial: { activeAmount: 250000 },
			deadlines: { nextWeek: 2, next15Days: 5, next30Days: 10 },
			tasks: { pending: 3, completed: 10, overdue: 1 },
			trends: {
				newFolders: [
					{ count: 2, month: "2026-04" },
					{ count: 1, month: "2026-03" },
				],
				closedFolders: [
					{ count: 1, month: "2026-04" },
					{ count: 2, month: "2026-03" },
				],
				tasks: [
					{ count: 3, month: "2026-04" },
					{ count: 5, month: "2026-03" },
				],
				deadlines: [
					{ count: 2, month: "2026-04" },
					{ count: 4, month: "2026-03" },
				],
			},
		},
		folders: {
			active: 5,
			closed: 3,
			total: 8,
			distribution: { nueva: 2, enProceso: 3, pendiente: 1, cerrada: 3 },
		},
	},
	lastUpdated: new Date().toISOString(),
};

const STATS_ONBOARDING = {
	success: true,
	data: {
		dashboard: {
			folders: { active: 0, closed: 0 },
			financial: { activeAmount: 0 },
			deadlines: { nextWeek: 0, next15Days: 0, next30Days: 0 },
			tasks: { pending: 0, completed: 0, overdue: 0 },
			trends: {
				newFolders: [],
				closedFolders: [],
				tasks: [],
				deadlines: [],
			},
		},
		folders: {
			active: 0,
			closed: 0,
			total: 0,
			distribution: { nueva: 0, enProceso: 0, pendiente: 0, cerrada: 0 },
		},
	},
	lastUpdated: new Date().toISOString(),
};

const USER_STATS = {
	success: true,
	data: {
		planInfo: {
			planId: "free",
			planName: "Gratuito",
			limits: { folders: 5, contacts: 10, calculators: 5, storage: 100 },
		},
		storage: { used: 25, total: 100 },
		counts: { folders: 3, contacts: 5, calculators: 2 },
	},
};

const ONBOARDING_DISMISSED = {
	success: true,
	onboarding: { dismissed: true, onboardingComplete: false, onboardingSessionsCount: 6 },
};

const ONBOARDING_ACTIVE = {
	success: true,
	onboarding: { dismissed: false, onboardingComplete: false, onboardingSessionsCount: 1 },
};

// ─── Helpers ──────────────────────────────────────────────────────────────────

async function mockNormalMode(page: Page) {
	await page.route(`${API}/api/stats/unified/**`, (route) =>
		route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(STATS_NORMAL) }),
	);
	await page.route(`${API}/api/user-stats/user`, (route) =>
		route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(USER_STATS) }),
	);
	await page.route(`${API}/api/auth/onboarding`, (route) =>
		route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ONBOARDING_DISMISSED) }),
	);
}

async function mockOnboardingMode(page: Page) {
	await page.route(`${API}/api/stats/unified/**`, (route) =>
		route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(STATS_ONBOARDING) }),
	);
	await page.route(`${API}/api/user-stats/user`, (route) =>
		route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(USER_STATS) }),
	);
	await page.route(`${API}/api/auth/onboarding`, (route) =>
		route.fulfill({ status: 200, contentType: "application/json", body: JSON.stringify(ONBOARDING_ACTIVE) }),
	);
}

async function gotoDashboard(page: Page) {
	await page.goto("/dashboard/default");
	// Esperar a que el skeleton desaparezca y el contenido real esté visible
	await expect(page.locator(".MuiSkeleton-root").first()).not.toBeVisible({ timeout: 15_000 });
}

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Carga básica
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 1 — /dashboard/default carga sin errores de JS", async ({ page }) => {
	const jsErrors: string[] = [];
	page.on("pageerror", (err) => jsErrors.push(err.message));

	await mockNormalMode(page);
	await page.goto("/dashboard/default");
	await expect(page).toHaveURL(/\/dashboard\/default/, { timeout: 10_000 });
	await page.waitForTimeout(2_000);

	expect(jsErrors).toHaveLength(0);
});

test("GRUPO 1 — WelcomeBanner siempre visible al cargar", async ({ page }) => {
	await mockNormalMode(page);
	await gotoDashboard(page);

	// El banner está presente en ambos modos (onboarding y normal)
	// En modo normal muestra "Explore las Herramientas Legales"
	await expect(page.getByText("Explore las Herramientas Legales")).toBeVisible({ timeout: 10_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Modo Normal: widgets de estadísticas
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 2 — Modo Normal → widget 'Monto Activo' visible", async ({ page }) => {
	await mockNormalMode(page);
	await gotoDashboard(page);

	await expect(page.getByText("Monto Activo")).toBeVisible({ timeout: 10_000 });
});

test("GRUPO 2 — Modo Normal → widget 'Carpetas Activas' visible", async ({ page }) => {
	await mockNormalMode(page);
	await gotoDashboard(page);

	// exact:true para no matchear "5 carpetas activas" (caption lowercase)
	await expect(page.getByText("Carpetas Activas", { exact: true })).toBeVisible({ timeout: 10_000 });
});

test("GRUPO 2 — Modo Normal → widget 'Tareas Pendientes' visible", async ({ page }) => {
	await mockNormalMode(page);
	await gotoDashboard(page);

	await expect(page.getByText("Tareas Pendientes")).toBeVisible({ timeout: 10_000 });
});

test("GRUPO 2 — Modo Normal → widget 'Vencimientos Próximos' visible", async ({ page }) => {
	await mockNormalMode(page);
	await gotoDashboard(page);

	await expect(page.getByText("Vencimientos Próximos")).toBeVisible({ timeout: 10_000 });
});

test("GRUPO 2 — Modo Normal → widget 'Distribución de Carpetas' visible", async ({ page }) => {
	await mockNormalMode(page);
	await gotoDashboard(page);

	await expect(page.getByText("Distribución de Carpetas")).toBeVisible({ timeout: 10_000 });
});

test("GRUPO 2 — Modo Normal → banner muestra 'Planes Exclusivos'", async ({ page }) => {
	await mockNormalMode(page);
	await gotoDashboard(page);

	await expect(page.getByRole("link", { name: "Planes Exclusivos" })).toBeVisible({ timeout: 10_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Modo Normal: widgets laterales (plan gratuito)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 3 — Plan gratuito → 'Uso de Recursos' visible con límites", async ({ page }) => {
	await mockNormalMode(page);
	await gotoDashboard(page);

	await expect(page.getByText("Uso de Recursos")).toBeVisible({ timeout: 10_000 });
	// exact:true para no matchear "Carpetas Activas", "Distribución de Carpetas", etc.
	await expect(page.getByText("Carpetas", { exact: true }).first()).toBeVisible({ timeout: 5_000 });
	await expect(page.getByText("Contactos", { exact: true }).first()).toBeVisible({ timeout: 5_000 });
});

test("GRUPO 3 — Plan gratuito → widget 'Almacenamiento' visible", async ({ page }) => {
	await mockNormalMode(page);
	await gotoDashboard(page);

	await expect(page.getByText("Almacenamiento")).toBeVisible({ timeout: 10_000 });
});

test("GRUPO 3 — Plan gratuito → widget 'Tareas Próximas' visible", async ({ page }) => {
	await mockNormalMode(page);
	await gotoDashboard(page);

	await expect(page.getByText("Tareas Próximas")).toBeVisible({ timeout: 10_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Modo Onboarding (usuario sin carpetas)
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 4 — Onboarding → banner de bienvenida con nombre de usuario", async ({ page }) => {
	await mockOnboardingMode(page);
	// Limpiar sessionStorage de onboarding para forzar llamada al backend
	await page.addInitScript(() => {
		Object.keys(sessionStorage)
			.filter((k) => k.startsWith("onboarding_"))
			.forEach((k) => sessionStorage.removeItem(k));
	});

	await gotoDashboard(page);

	await expect(page.getByText(/Bienvenido/i)).toBeVisible({ timeout: 10_000 });
});

test("GRUPO 4 — Onboarding → botón 'Crear mi primera carpeta' visible", async ({ page }) => {
	await mockOnboardingMode(page);
	await page.addInitScript(() => {
		Object.keys(sessionStorage)
			.filter((k) => k.startsWith("onboarding_"))
			.forEach((k) => sessionStorage.removeItem(k));
	});

	await gotoDashboard(page);

	// Aparece en WelcomeBanner + OnboardingCard + EducationalBlock → .first()
	await expect(page.getByRole("button", { name: "Crear mi primera carpeta" }).first()).toBeVisible({ timeout: 10_000 });
});

test("GRUPO 4 — Onboarding → las 4 cards educativas son visibles", async ({ page }) => {
	await mockOnboardingMode(page);
	await page.addInitScript(() => {
		Object.keys(sessionStorage)
			.filter((k) => k.startsWith("onboarding_"))
			.forEach((k) => sessionStorage.removeItem(k));
	});

	await gotoDashboard(page);

	await expect(page.getByText("Monto Activo", { exact: true })).toBeVisible({ timeout: 10_000 });
	await expect(page.getByText("Carpetas Activas", { exact: true })).toBeVisible({ timeout: 5_000 });
	await expect(page.getByText("Tareas Pendientes", { exact: true })).toBeVisible({ timeout: 5_000 });
	// "Vencimientos" aparece en múltiples contextos → apuntar al título h5 de la card
	await expect(page.locator("h5").filter({ hasText: /^Vencimientos$/ })).toBeVisible({ timeout: 5_000 });
});

test("GRUPO 4 — Onboarding → bloque educativo '¿Que es una carpeta?' visible", async ({ page }) => {
	await mockOnboardingMode(page);
	await page.addInitScript(() => {
		Object.keys(sessionStorage)
			.filter((k) => k.startsWith("onboarding_"))
			.forEach((k) => sessionStorage.removeItem(k));
	});

	await gotoDashboard(page);

	await expect(page.getByText("¿Que es una carpeta?")).toBeVisible({ timeout: 10_000 });
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 5 — Navegación desde el dashboard
// ─────────────────────────────────────────────────────────────────────────────

test("GRUPO 5 — Onboarding → click 'Crear mi primera carpeta' navega a /apps/folders", async ({ page }) => {
	await mockOnboardingMode(page);
	await page.addInitScript(() => {
		Object.keys(sessionStorage)
			.filter((k) => k.startsWith("onboarding_"))
			.forEach((k) => sessionStorage.removeItem(k));
	});

	await gotoDashboard(page);

	await page.getByRole("button", { name: "Crear mi primera carpeta" }).first().click(); // WelcomeBanner es el primero
	await expect(page).toHaveURL(/\/apps\/folders/, { timeout: 10_000 });
});

test("GRUPO 5 — Modo Normal → link 'Planes Exclusivos' navega a /suscripciones/tables", async ({ page }) => {
	await mockNormalMode(page);
	await gotoDashboard(page);

	await page.getByRole("link", { name: "Planes Exclusivos" }).click();
	await expect(page).toHaveURL(/\/suscripciones\/tables/, { timeout: 10_000 });
});

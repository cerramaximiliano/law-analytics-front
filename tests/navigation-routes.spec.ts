/**
 * Tests exhaustivos de navegación y autenticación — todas las rutas protegidas.
 *
 * Estrategia:
 *   GRUPO 1 — Redirect sin sesión (39 rutas): liviano, verifica que AuthGuard +
 *             GuestGuard redirijan correctamente a la URL original post-login.
 *   GRUPO 2 — UnauthorizedModal (8 rutas clave): verifica que un 401 en tab abierta
 *             muestre el modal y no haga una navegación dura a /login.
 *   GRUPO 3 — Reload con init() → 401 (8 rutas): verifica que al recargar con
 *             cookie expirada el AuthGuard preserve la URL de origen.
 *   GRUPO 4 — Smoke navigation (1 test, 39 rutas): login único, navega todas las
 *             rutas y captura errores de JS no capturados (pageerror).
 *
 * auth-token.spec.ts cubre los escenarios edge-case con /documentos/* en detalle;
 * este archivo cubre el resto del mapa de rutas.
 */

import { test, expect, Page } from "@playwright/test";
import {
	loginViaForm,
	fillLoginForm,
	loginViaModal,
	interceptApiWith401,
	interceptAuthMeWith401,
	waitForUnauthorizedModal,
} from "./helpers/auth";

// ─── Utilidad ─────────────────────────────────────────────────────────────────

function pathRegex(path: string): RegExp {
	// Escapa separadores para que /apps/calc matchee también /apps/calc/labor
	return new RegExp(path.replace(/\//g, "\\/"));
}

// ─── Catálogo de rutas ────────────────────────────────────────────────────────

/**
 * Todas las rutas estáticas protegidas por AuthGuard (sin segmentos :id dinámicos).
 * Admin routes excluidas — requieren ADMIN_ROLE, no aplica al usuario de test.
 */
const ALL_PROTECTED_ROUTES: { path: string; label: string }[] = [
	// Dashboard
	{ path: "/dashboard/default",                    label: "dashboard default" },
	{ path: "/dashboard/analytics",                  label: "dashboard analytics" },

	// Folders
	{ path: "/apps/folders/list",                    label: "folders list" },

	// Chat
	{ path: "/apps/chat",                            label: "chat" },

	// Calculator
	{ path: "/apps/calc",                            label: "calc (all)" },
	{ path: "/apps/calc/labor",                      label: "calc laboral" },
	{ path: "/apps/calc/civil",                      label: "calc civil" },
	{ path: "/apps/calc/intereses",                  label: "calc intereses" },

	// Documents (template legacy)
	{ path: "/apps/documents",                       label: "documents" },

	// Calendar
	{ path: "/apps/calendar",                        label: "calendar" },
	{ path: "/apps/calendar/availability",           label: "calendar availability" },
	{ path: "/apps/calendar/reservations",           label: "calendar reservations" },
	{ path: "/apps/calendar/booking-config",         label: "calendar booking-config" },

	// Customer
	{ path: "/apps/customer/customer-list",          label: "customer list" },

	// Invoice
	{ path: "/apps/invoice/dashboard",               label: "invoice dashboard" },
	{ path: "/apps/invoice/create",                  label: "invoice create" },
	{ path: "/apps/invoice/list",                    label: "invoice list" },

	// Profiles — account
	{ path: "/apps/profiles/account",                label: "account profile" },
	{ path: "/apps/profiles/account/my-account",     label: "account my-account" },
	// Nota: /apps/profiles/account/password NO existe como ruta propia. Password está en /apps/profiles/user/password.
	{ path: "/apps/profiles/account/role",           label: "account role" },
	{ path: "/apps/profiles/account/settings",       label: "account settings" },

	// Profiles — user
	{ path: "/apps/profiles/user",                   label: "user profile" },
	{ path: "/apps/profiles/user/personal",          label: "user personal" },
	{ path: "/apps/profiles/user/payment",           label: "user payment" },
	{ path: "/apps/profiles/user/password",          label: "user password" },
	{ path: "/apps/profiles/user/professional",      label: "user professional" },
	{ path: "/apps/profiles/user/settings",          label: "user settings" },

	// Subscriptions
	{ path: "/apps/subscription/success",            label: "subscription success" },
	{ path: "/apps/subscription/error",              label: "subscription error" },
	{ path: "/suscripciones/tables",                 label: "suscripciones tables" },

	// Tasks
	{ path: "/tareas",                               label: "tareas" },

	// Herramientas
	{ path: "/herramientas/seguimiento-postal",      label: "seguimiento postal" },
	{ path: "/herramientas/plantillas",              label: "herramientas plantillas" },

	// Documentos
	{ path: "/documentos/escritos",                  label: "escritos" },
	{ path: "/documentos/escritos/nuevo",            label: "escritos nuevo" },
	{ path: "/documentos/modelos",                   label: "modelos" },
	{ path: "/documentos/modelos/nuevo",             label: "modelos nuevo" },

	// Help
	{ path: "/ayuda",                                label: "ayuda" },
];

/**
 * Rutas que disparan llamadas API al montar de forma incondicional (no dependen
 * de estado condicional como activeTeam o user._id).
 * Se usan en los tests de modal y reload que son más costosos.
 *
 * Excluidas intencionalmente por ser condicionales/flaky en GRUPO 2:
 *   - /apps/folders/list  (requiere activeTeam._id o user._id en Redux)
 *   - /apps/profiles/user (puede no disparar calls sin estado previo)
 */
const API_ROUTES = [
	{ path: "/apps/calendar",                   label: "calendar (calendar.ts)" },
	{ path: "/tareas",                          label: "tareas" },
	{ path: "/herramientas/seguimiento-postal", label: "seguimiento postal (postalDocuments.ts)" },
	{ path: "/documentos/escritos",             label: "escritos (richTextDocuments.ts)" },
	{ path: "/documentos/modelos",              label: "modelos (richTextDocuments.ts)" },
	{ path: "/dashboard/default",               label: "dashboard default" },
];

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 1 — Redirect sin sesión → /login → post-login vuelve a URL original
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 1 — Redirect post-login conserva la URL de origen", () => {
	for (const { path, label } of ALL_PROTECTED_ROUTES) {
		test(`[${label}] sin sesión → /login → vuelve a ${path}`, async ({ page }) => {
			await page.goto(path);

			// AuthGuard debe redirigir a /login preservando state.from
			await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

			// Llenar formulario SIN page.goto — preserva location.state.from
			await fillLoginForm(page);

			// Debe quedar en la ruta original (o sub-ruta de ella)
			await expect(page).toHaveURL(pathRegex(path), { timeout: 15_000 });
			await expect(page).not.toHaveURL(/\/login/);

			// Para rutas distintas de /dashboard/default, verificar que no cayó en el default
			if (path !== "/dashboard/default") {
				await expect(page).not.toHaveURL(/\/dashboard\/default/);
			}
		});
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 2 — Sesión expira con tab abierta → UnauthorizedModal
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 2 — Sesión expira con tab abierta (UnauthorizedModal)", () => {
	for (const { path, label } of API_ROUTES) {
		test(`[${label}] token expira → modal → login → permanece en ${path}`, async ({ page }) => {
			await loginViaForm(page);
			await page.goto(path);
			await expect(page).toHaveURL(pathRegex(path));

			const removeIntercept = await interceptApiWith401(page);

			// Recargar para disparar requests → 401 → modal (global axios → ServerContext)
			await page.reload();
			await waitForUnauthorizedModal(page);

			// Quitar intercept para que el login real funcione
			await removeIntercept();
			await loginViaModal(page);

			// Debe permanecer en la misma ruta, no ir a /dashboard/default
			await expect(page).toHaveURL(pathRegex(path), { timeout: 10_000 });
			if (path !== "/dashboard/default") {
				await expect(page).not.toHaveURL(/\/dashboard\/default/);
			}
		});
	}

	test("token expira → cancelar modal → logout → re-login → redirect a ruta original", async ({ page }) => {
		await loginViaForm(page);
		await page.goto("/apps/calendar");

		const removeIntercept = await interceptApiWith401(page);
		await page.reload();
		await waitForUnauthorizedModal(page);

		// Cancelar: handleLogoutAndRedirect captura returnTo ANTES de navegar a /login
		await page.getByRole("button", { name: "Cancelar" }).click();
		await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });

		await removeIntercept();
		await fillLoginForm(page);

		// Debe volver a /apps/calendar (NO a /dashboard/default)
		await expect(page).toHaveURL(/\/apps\/calendar/, { timeout: 15_000 });
		await expect(page).not.toHaveURL(/\/dashboard\/default/);
	});

	test("token expira → navegación entre rutas → modal en destino → login → permanece en destino", async ({ page }) => {
		await loginViaForm(page);
		await page.goto("/apps/folders/list");

		const removeIntercept = await interceptApiWith401(page);

		// Navegar a tareas dispara APIs → 401 → modal
		await page.goto("/tareas");
		await waitForUnauthorizedModal(page);

		await removeIntercept();
		await loginViaModal(page);

		await expect(page).toHaveURL(/\/tareas/, { timeout: 10_000 });
		await expect(page).not.toHaveURL(/\/dashboard\/default/);
	});
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 3 — Sesión expira al recargar (init() → 401)
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 3 — Sesión expira al recargar (init() → 401)", () => {
	for (const { path, label } of API_ROUTES) {
		test(`[${label}] recarga con cookie expirada → /login → re-login → vuelve a ${path}`, async ({ page }) => {
			await loginViaForm(page);
			await page.goto(path);

			// Interceptar /api/auth/me para simular cookie expirada
			const removeIntercept = await interceptAuthMeWith401(page);
			await page.reload();

			// init() falla → LOGOUT → AuthGuard redirige a /login con state.from = path.
			// Esperar que la URL esté en /login Y que el formulario sea visible (garantiza
			// que AuthGuard ya ejecutó su navigate con state.from antes de que hagamos login).
			await expect(page).toHaveURL(/\/login/, { timeout: 10_000 });
			await page.waitForSelector("#email-login", { state: "visible", timeout: 10_000 });

			// Remover mock ANTES del login para que /api/auth/login funcione
			await removeIntercept();
			await fillLoginForm(page);

			// GuestGuard debe redirigir de vuelta a la URL original
			await expect(page).toHaveURL(pathRegex(path), { timeout: 15_000 });
			if (path !== "/dashboard/default") {
				await expect(page).not.toHaveURL(/\/dashboard\/default/);
			}
		});
	}
});

// ─────────────────────────────────────────────────────────────────────────────
// GRUPO 4 — Smoke navigation: recorre todas las rutas en dos batches
//
// Se divide en 2 tests (contextos independientes) para evitar que Chrome
// agote recursos (ERR_INSUFFICIENT_RESOURCES) al navegar demasiadas rutas
// en una sola sesión sin descargar los bundles cargados previamente.
// ─────────────────────────────────────────────────────────────────────────────

test.describe("GRUPO 4 — Smoke: navegación completa sin errores", () => {
	/**
	 * Navega todas las rutas usando history.pushState en lugar de page.goto().
	 * React Router v6 intercepta pushState, actualiza el árbol de componentes y
	 * renderiza cada ruta sin disparar una recarga completa del bundle.
	 * Esto evita el ERR_INSUFFICIENT_RESOURCES que ocurre al acumular ~20 recargas
	 * completas con sus respectivos requests en una sola sesión de browser.
	 */
	test("smoke — 39 rutas protegidas sin crash (navegación client-side)", async ({ page }) => {
		const jsErrors: string[] = [];
		page.on("pageerror", (err) => jsErrors.push(`[${err.name}] ${err.message}`));

		// Primer login: carga completa del bundle
		await loginViaForm(page);

		for (const { path, label } of ALL_PROTECTED_ROUTES) {
			// Client-side navigation: React Router v6 escucha pushState via @remix-run/router
			await page.evaluate((p: string) => window.history.pushState({}, "", p), path);

			// Esperar que React Router procese la navegación
			await expect(page).toHaveURL(pathRegex(path), { timeout: 6_000 });

			// Esperar que el componente monte (detecta crashes en useEffect)
			await page.waitForTimeout(400);

			// Si hay un error fatal, reportarlo con contexto de ruta
			if (jsErrors.length > 0) {
				throw new Error(`Error de JS en [${label}] (${path}):\n${jsErrors.join("\n")}`);
			}
		}
	});

	test("navegación cruzada entre secciones sin perder sesión", async ({ page }) => {
		test.setTimeout(90_000); // 13 rutas × ~5s cada una + login
		await loginViaForm(page);

		const crossRoutes = [
			"/dashboard/default",
			"/apps/calendar",
			"/documentos/escritos",
			"/apps/folders/list",
			"/tareas",
			"/herramientas/seguimiento-postal",
			"/documentos/modelos",
			"/apps/profiles/user/personal",
			"/apps/calc/labor",
			"/ayuda",
			"/suscripciones/tables",
			"/apps/invoice/list",
			"/dashboard/analytics",
		];

		for (const route of crossRoutes) {
			await page.goto(route, { waitUntil: "commit" });
			await expect(page).not.toHaveURL(/\/login/);
			await expect(page).toHaveURL(pathRegex(route));
		}
	});
});

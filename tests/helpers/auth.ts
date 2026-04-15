import { Page, Route } from "@playwright/test";

export const CREDENTIALS = {
	email: process.env.TEST_EMAIL || "maximilian@rumba-dev.com",
	password: process.env.TEST_PASSWORD || "12345678",
};

export const API_BASE = "http://localhost:5000";

// ─── Helpers de formulario ────────────────────────────────────────────────────

/**
 * Rellena y envía el formulario de login que YA está visible en pantalla.
 * NO navega — preserva el location.state.from que el AuthGuard haya seteado.
 */
export async function fillLoginForm(page: Page): Promise<void> {
	await page.waitForSelector("#email-login", { state: "visible", timeout: 15_000 });
	await page.fill("#email-login", CREDENTIALS.email);
	await page.fill("#password-login", CREDENTIALS.password);
	// El botón de la página de login dice "Iniciar sesión"
	await page.getByRole("button", { name: "Iniciar sesión", exact: true }).click();
	await page.waitForURL((url) => !url.pathname.includes("/login"), { timeout: 20_000 });
}

/**
 * Navega a /login y hace login desde cero.
 * USAR SOLO cuando queremos partir sin from-state (ej: primer login del test).
 */
export async function loginViaForm(page: Page): Promise<void> {
	await page.goto("/login");
	await fillLoginForm(page);
}

/**
 * Hace login dentro del UnauthorizedModal (botón "Iniciar Sesión").
 * Usa exact:true para no matchear el botón de Google.
 */
export async function loginViaModal(page: Page): Promise<void> {
	await waitForUnauthorizedModal(page);
	await page.fill("#email-login", CREDENTIALS.email);
	await page.fill("#password-login", CREDENTIALS.password);
	// exact:true distingue "Iniciar Sesión" de "Google Iniciar sesión con"
	await page.getByRole("dialog").getByRole("button", { name: "Iniciar Sesión", exact: true }).click();
	// Esperar que el modal desaparezca
	await page.waitForSelector("text=Sesión Expirada", { state: "hidden", timeout: 15_000 });
}

// ─── Interceptors de red ──────────────────────────────────────────────────────

/**
 * Intercepta TODOS los endpoints de la API excepto los de auth,
 * devolviendo 401. Simula que el token de sesión expiró en el servidor.
 * Retorna una función para quitar el intercept.
 */
export async function interceptApiWith401(page: Page): Promise<() => Promise<void>> {
	// Excluimos login/google/logout para que el re-login en el modal funcione.
	// refresh-token NO está excluido: debe devolver 401 para que el ServerContext
	// falle el refresh y muestre el UnauthorizedModal (dev branch tiene auto-refresh).
	// /api/auth/me tampoco se excluye aquí (se mantiene fuera del intercept de forma
	// implícita porque page.route solo intercepta llamadas del browser a ${API_BASE}).
	const AUTH_PATHS = [
		"/api/auth/login",
		"/api/auth/google",
		"/api/auth/logout",
		"/api/auth/me",
	];

	await page.route(`${API_BASE}/api/**`, async (route: Route) => {
		const url = route.request().url();
		const isAuthEndpoint = AUTH_PATHS.some((p) => url.includes(p));

		if (isAuthEndpoint) {
			await route.continue();
		} else {
			await route.fulfill({
				status: 401,
				contentType: "application/json",
				body: JSON.stringify({ message: "Sesión expirada", success: false }),
			});
		}
	});

	return async () => page.unroute(`${API_BASE}/api/**`);
}

/**
 * Intercepta SOLO /api/auth/me para devolver 401.
 * Simula que el usuario recarga la página con cookie expirada:
 * init() falla → LOGOUT → AuthGuard redirige a /login con from=ruta_original.
 */
export async function interceptAuthMeWith401(page: Page): Promise<() => Promise<void>> {
	const target = `${API_BASE}/api/auth/me`;

	await page.route(target, async (route: Route) => {
		await route.fulfill({
			status: 401,
			contentType: "application/json",
			body: JSON.stringify({ message: "Token expirado", success: false }),
		});
	});

	return async () => page.unroute(target);
}

// ─── Helpers de espera ────────────────────────────────────────────────────────

export async function waitForUnauthorizedModal(page: Page): Promise<void> {
	await page.waitForSelector("text=Sesión Expirada", { state: "visible", timeout: 15_000 });
}

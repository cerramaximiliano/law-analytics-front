import { defineConfig, devices } from "@playwright/test";
import { E2E_BASE_URL, E2E_API_URL } from "./tests/helpers/e2e-env";

/**
 * Playwright config para tests de auth y navegación.
 * Requiere que el dev server esté corriendo en E2E_BASE_URL (default localhost:3000)
 * y el backend en E2E_API_URL (default localhost:5000). Ambas se leen de
 * `.env.e2e.local` (ver tests/helpers/e2e-env.ts) o del entorno.
 *
 * Ejecutar: npx playwright test
 * Con UI:   npx playwright test --ui
 */
export default defineConfig({
	testDir: "./tests",
	testIgnore: "**/visual/**",
	// Limpieza previa: deja las cuentas descartables sin equipos (no-op si no hay .env.e2e.local)
	globalSetup: require.resolve("./tests/helpers/e2e-global-cleanup.ts"),
	timeout: 40_000,
	expect: { timeout: 12_000 },
	fullyParallel: false, // los tests de auth comparten estado de sesión
	retries: 1, // 1 retry para tests e2e con backend real (flakiness de red/latencia)
	workers: 1,
	reporter: [["html", { open: "never", outputFolder: "test-results/html" }], ["line"]],
	use: {
		baseURL: E2E_BASE_URL,
		headless: true,
		viewport: { width: 1280, height: 720 },
		screenshot: "only-on-failure",
		video: "retain-on-failure",
		trace: "retain-on-failure",
		// Las APIs van directamente a E2E_API_URL (default localhost:5000)
		// page.route() intercepta requests a ese origen
	},
	projects: [
		// Setup: login via API y guarda auth state (no llama al formulario)
		{
			name: "setup",
			testMatch: "**/global-setup.ts",
		},
		{
			name: "chromium",
			use: { ...devices["Desktop Chrome"] },
			dependencies: ["setup"],
		},
	],
	outputDir: "test-results/artifacts",
});

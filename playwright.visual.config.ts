import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests/visual",
	snapshotDir: "./tests/snapshots",

	// Falla si hay diferencias visuales mayores al 0.2% de los píxeles
	expect: {
		toHaveScreenshot: {
			maxDiffPixelRatio: 0.002,
			threshold: 0.2,
			animations: "disabled",
		},
	},

	// No correr tests en paralelo para evitar interferencias visuales
	fullyParallel: false,
	workers: 1,

	// Reintentos para evitar flakiness por animaciones
	retries: 1,

	reporter: [["html", { outputFolder: "tests/playwright-report", open: "never" }], ["line"]],

	use: {
		baseURL: "http://localhost:3000",
		// Viewport fijo para screenshots consistentes
		viewport: { width: 1440, height: 900 },
		// Capturar screenshot solo en fallos
		screenshot: "only-on-failure",
		// Deshabilitar animaciones CSS para snapshots estables
		reducedMotion: "reduce",
		// Ignorar errores HTTPS en local
		ignoreHTTPSErrors: true,
		// Timeout por acción
		actionTimeout: 10_000,
		navigationTimeout: 30_000,
	},

	projects: [
		// Proyecto de setup: hace login y guarda el auth state
		{
			name: "setup",
			testMatch: "**/global-setup.ts",
		},
		// Tests visuales — dependen del setup de auth
		{
			name: "visual",
			use: {
				...devices["Desktop Chrome"],
				storageState: "tests/.auth/user.json",
			},
			dependencies: ["setup"],
		},
		// Tests visuales de páginas públicas (sin auth)
		{
			name: "visual-public",
			use: {
				...devices["Desktop Chrome"],
			},
		},
	],

	// Inicia el dev server automáticamente si no está corriendo
	webServer: {
		command: "npm run start",
		url: "http://localhost:3000",
		reuseExistingServer: true,
		timeout: 60_000,
	},
});

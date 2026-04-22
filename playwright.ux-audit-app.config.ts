import { defineConfig, devices } from "@playwright/test";
import path from "path";

const REPORT_DIR = process.env.UX_AUDIT_DIR ?? path.resolve(__dirname, "./ux-reports/current-app");

// Pasada 2 — rutas de la app logueada (no auditadas en el audit inicial).
// Reusa el global-setup que genera tests/.auth/user.json.

export default defineConfig({
	fullyParallel: false,
	workers: 1,
	retries: 0,

	outputDir: path.join(REPORT_DIR, ".playwright-output"),

	reporter: [["line"]],

	use: {
		baseURL: "http://localhost:3000",
		reducedMotion: "reduce",
		ignoreHTTPSErrors: true,
		actionTimeout: 15_000,
		navigationTimeout: 45_000,
	},

	projects: [
		{
			name: "setup",
			testDir: "./tests",
			testMatch: /^global-setup\.ts$/,
		},
		{
			name: "capture-app",
			testDir: "./tests/ux-audit",
			testMatch: "capture-app.spec.ts",
			dependencies: ["setup"],
			use: {
				...devices["Desktop Chrome"],
				storageState: "tests/.auth/user.json",
			},
		},
	],

	webServer: {
		command: "npm run start",
		url: "http://localhost:3000",
		reuseExistingServer: true,
		timeout: 90_000,
	},
});

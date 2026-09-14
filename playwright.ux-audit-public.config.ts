import { defineConfig, devices } from "@playwright/test";
import path from "path";

const REPORT_DIR = process.env.UX_AUDIT_DIR ?? path.resolve(__dirname, "./ux-reports/current-public");

// Configuración para auditoría de rutas públicas y de autenticación.
// NO usa storageState — GuestGuard redirigiría a /dashboard si hubiera sesión.

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
			name: "capture-public",
			testDir: "./tests/ux-audit",
			testMatch: "capture-public.spec.ts",
			use: {
				...devices["Desktop Chrome"],
			},
		},
		{
			name: "capture-auth-forms",
			testDir: "./tests/ux-audit",
			testMatch: "capture-auth-forms.spec.ts",
			use: {
				...devices["Desktop Chrome"],
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

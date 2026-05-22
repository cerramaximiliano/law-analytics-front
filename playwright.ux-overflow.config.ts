import { defineConfig, devices } from "@playwright/test";

export default defineConfig({
	testDir: "./tests",
	testMatch: "ux-overflow.spec.ts",

	fullyParallel: false,
	workers: 1,
	retries: 0,

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
			name: "overflow",
			use: { ...devices["Desktop Chrome"] },
			dependencies: ["setup"],
		},
	],

	webServer: {
		command: "npm run start",
		url: "http://localhost:3000",
		reuseExistingServer: true,
		timeout: 90_000,
	},
});

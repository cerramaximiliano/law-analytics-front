"use strict";
var __assign =
	(this && this.__assign) ||
	function () {
		__assign =
			Object.assign ||
			function (t) {
				for (var s, i = 1, n = arguments.length; i < n; i++) {
					s = arguments[i];
					for (var p in s) if (Object.prototype.hasOwnProperty.call(s, p)) t[p] = s[p];
				}
				return t;
			};
		return __assign.apply(this, arguments);
	};
exports.__esModule = true;
var test_1 = require("@playwright/test");
/**
 * Playwright config para tests de auth y navegación.
 * Requiere que el dev server esté corriendo en localhost:3000
 * y el backend en localhost:5000.
 *
 * Ejecutar: npx playwright test
 * Con UI:   npx playwright test --ui
 */
exports["default"] = (0, test_1.defineConfig)({
	testDir: "./tests",
	testIgnore: "**/visual/**",
	timeout: 40000,
	expect: { timeout: 12000 },
	fullyParallel: false,
	retries: 1,
	workers: 1,
	reporter: [["html", { open: "never", outputFolder: "test-results/html" }], ["line"]],
	use: {
		baseURL: "http://localhost:3000",
		headless: true,
		viewport: { width: 1280, height: 720 },
		screenshot: "only-on-failure",
		video: "retain-on-failure",
		trace: "retain-on-failure",
	},
	projects: [
		// Setup: login via API y guarda auth state (no llama al formulario)
		{
			name: "setup",
			testMatch: "**/global-setup.ts",
		},
		{
			name: "chromium",
			use: __assign({}, test_1.devices["Desktop Chrome"]),
			dependencies: ["setup"],
		},
	],
	outputDir: "test-results/artifacts",
});

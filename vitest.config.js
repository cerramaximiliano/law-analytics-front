"use strict";
exports.__esModule = true;
/// <reference types="vitest" />
var vite_1 = require("vite");
var plugin_react_swc_1 = require("@vitejs/plugin-react-swc");
var vite_tsconfig_paths_1 = require("vite-tsconfig-paths");
exports["default"] = (0, vite_1.defineConfig)({
	plugins: [(0, plugin_react_swc_1["default"])(), (0, vite_tsconfig_paths_1["default"])()],
	test: {
		globals: true,
		environment: "jsdom",
		setupFiles: "./src/tests/setup.ts",
		css: false,
		include: ["src/**/*.{test,spec}.{js,mjs,cjs,ts,mts,cts,jsx,tsx}"],
		coverage: {
			provider: "v8",
			reporter: ["text", "json", "html"],
			include: ["src/**/*.{ts,tsx}"],
			exclude: ["src/**/*.test.{ts,tsx}", "src/tests/**", "node_modules/**", "src/**/*.d.ts"],
		},
	},
});

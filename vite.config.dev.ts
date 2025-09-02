import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import path from "path";

// Configuración optimizada para desarrollo
export default defineConfig({
	plugins: [
		react(),
		tsconfigPaths(),
		svgr({
			svgrOptions: {
				icon: true,
			},
		}),
	],
	server: {
		port: 3000,
		open: false,
		proxy: {
			"/api": {
				target: "http://localhost:5000",
				changeOrigin: true,
				secure: false,
				rewrite: (path) => path,
			},
		},
	},
	resolve: {
		alias: {
			assets: path.resolve(__dirname, "./src/assets"),
			components: path.resolve(__dirname, "./src/components"),
			contexts: path.resolve(__dirname, "./src/contexts"),
			hooks: path.resolve(__dirname, "./src/hooks"),
			layout: path.resolve(__dirname, "./src/layout"),
			pages: path.resolve(__dirname, "./src/pages"),
			routes: path.resolve(__dirname, "./src/routes"),
			sections: path.resolve(__dirname, "./src/sections"),
			services: path.resolve(__dirname, "./src/services"),
			store: path.resolve(__dirname, "./src/store"),
			themes: path.resolve(__dirname, "./src/themes"),
			types: path.resolve(__dirname, "./src/types"),
			utils: path.resolve(__dirname, "./src/utils"),
		},
	},
	optimizeDeps: {
		include: [
			"react",
			"react-dom",
			"react-router-dom",
			"@mui/material",
			"@emotion/react",
			"@emotion/styled",
			"axios",
			"@reduxjs/toolkit",
			"react-redux",
		],
		exclude: ["@react-pdf/renderer"],
	},
	define: {
		"process.env": {},
	},
});
import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig({
	plugins: [
		react({
			babel: {
				presets: ["@babel/preset-react"],
			},
		}),
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
	build: {
		outDir: "build",
		sourcemap: true,
		// Optimización de chunks similar a la configuración de craco
		rollupOptions: {
			output: {
				manualChunks: {
					"react-vendor": ["react", "react-dom", "react-router", "react-router-dom"],
					mui: ["@mui/material", "@mui/system", "@mui/lab", "@mui/x-date-pickers"],
					fullcalendar: ["@fullcalendar/core", "@fullcalendar/react", "@fullcalendar/daygrid", "@fullcalendar/timegrid", "@fullcalendar/list"],
					charts: ["apexcharts", "react-apexcharts"],
					pdf: ["@react-pdf/renderer"],
					redux: ["@reduxjs/toolkit", "react-redux", "redux-persist"],
					emotion: ["@emotion/react", "@emotion/styled", "@emotion/cache"],
					forms: ["formik", "yup"],
					dates: ["date-fns", "dayjs"],
				},
			},
		},
		chunkSizeWarningLimit: 1000,
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
		],
		exclude: ["@react-pdf/renderer"],
	},
	define: {
		// Para compatibilidad con código que usa process.env
		"process.env": {},
	},
});
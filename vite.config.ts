import { defineConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import path from "path";
import { visualizer } from "rollup-plugin-visualizer";

// https://vitejs.dev/config/
export default defineConfig({
	base: "/", // Asegurar que use rutas absolutas desde la raíz
	plugins: [
		react(),
		tsconfigPaths(),
		svgr({
			svgrOptions: {
				icon: true,
			},
		}),
		visualizer({
			open: false,
			filename: "bundle-stats.html",
			gzipSize: true,
			brotliSize: true,
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
		sourcemap: false,
		chunkSizeWarningLimit: 2000,
		rollupOptions: {
			output: {
				// Usar hash de contenido para forzar actualización
				entryFileNames: `assets/[name]-[hash].js`,
				chunkFileNames: `assets/[name]-[hash].js`,
				assetFileNames: `assets/[name]-[hash].[ext]`,
				// Manual chunking para optimizar el bundle
				manualChunks: (id) => {
					// React y ReactDOM en un chunk separado
					if (id.includes("node_modules/react") || id.includes("node_modules/react-dom")) {
						return "vendor-react";
					}
					// MUI en su propio chunk
					if (id.includes("node_modules/@mui")) {
						return "vendor-mui";
					}
					// Emotion (requerido por MUI) en su propio chunk
					if (id.includes("node_modules/@emotion")) {
						return "vendor-emotion";
					}
					// FullCalendar en su propio chunk
					if (id.includes("node_modules/@fullcalendar")) {
						return "vendor-calendar";
					}
					// React-PDF en su propio chunk (muy pesado)
					if (id.includes("node_modules/@react-pdf") || id.includes("node_modules/pdfjs-dist")) {
						return "vendor-pdf";
					}
					// ApexCharts/Recharts en su propio chunk
					if (id.includes("node_modules/apexcharts") || id.includes("node_modules/recharts") || id.includes("node_modules/react-apexcharts")) {
						return "vendor-charts";
					}
					// Chance y datos mock en su propio chunk
					if (id.includes("node_modules/chance")) {
						return "vendor-chance";
					}
					// Lodash en su propio chunk
					if (id.includes("node_modules/lodash")) {
						return "vendor-lodash";
					}
					// Draft.js y WYSIWYG editors
					if (id.includes("node_modules/draft-js") || id.includes("node_modules/react-draft-wysiwyg") || id.includes("node_modules/react-quill")) {
						return "vendor-editors";
					}
					// Otros vendors
					if (id.includes("node_modules")) {
						return "vendor-other";
					}
				},
			},
		},
		// Limpiar directorio de build antes de cada compilación
		emptyOutDir: true,
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
});
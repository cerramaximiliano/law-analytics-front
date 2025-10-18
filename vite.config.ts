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
		// Configuración para detectar problemas temprano y mejorar tree-shaking
		minify: "terser",
		terserOptions: {
			compress: {
				drop_console: false, // Mantener console.error en producción para debugging
				drop_debugger: true,
			},
		},
		rollupOptions: {
			// Mejorar tree-shaking
			treeshake: {
				moduleSideEffects: "no-external",
				preset: "recommended",
			},
			// Detectar errores de dependencias circulares
			onwarn(warning, warn) {
				// Ignorar warnings específicos conocidos
				if (warning.code === "MODULE_LEVEL_DIRECTIVE") return;

				// Mostrar otros warnings importantes
				warn(warning);
			},
			output: {
				// Usar hash de contenido para forzar actualización
				entryFileNames: `assets/[name]-[hash].js`,
				chunkFileNames: `assets/[name]-[hash].js`,
				assetFileNames: `assets/[name]-[hash].[ext]`,
				// Estrategia de chunking simplificada para evitar problemas de orden de carga
				// Solo separamos las librerías MUY grandes que son cargadas de forma lazy
				manualChunks: (id) => {
					// MUI en su propio chunk (muy grande)
					if (id.includes("node_modules/@mui")) {
						return "vendor-mui";
					}
					// Emotion (requerido por MUI)
					if (id.includes("node_modules/@emotion")) {
						return "vendor-emotion";
					}
					// FullCalendar en su propio chunk (muy grande, lazy loaded)
					if (id.includes("node_modules/@fullcalendar")) {
						return "vendor-calendar";
					}
					// React-PDF en su propio chunk (muy pesado, lazy loaded)
					if (id.includes("node_modules/@react-pdf") || id.includes("node_modules/pdfjs-dist")) {
						return "vendor-pdf";
					}
					// ApexCharts/Recharts en su propio chunk (muy grande)
					if (id.includes("node_modules/apexcharts") || id.includes("node_modules/recharts") || id.includes("node_modules/react-apexcharts")) {
						return "vendor-charts";
					}
					// Emoji Picker (lazy loaded)
					if (id.includes("node_modules/emoji-picker-react")) {
						return "vendor-emoji";
					}
					// Lodash (muy grande y ampliamente usado)
					if (id.includes("node_modules/lodash")) {
						return "vendor-lodash";
					}
					// Framer Motion (grande, usado en animaciones)
					if (id.includes("node_modules/framer-motion")) {
						return "vendor-animations";
					}
					// Simplebar
					if (id.includes("node_modules/simplebar")) {
						return "vendor-simplebar";
					}
					// TODO lo demás (React, Redux, Router, Forms, etc.) va junto
					// Esto garantiza que no haya problemas de orden de dependencias
					if (id.includes("node_modules")) {
						return "vendor";
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
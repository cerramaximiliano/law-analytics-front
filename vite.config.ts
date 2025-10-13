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
		// Configuración de minificación y tree-shaking mejorada
		minify: "terser",
		terserOptions: {
			compress: {
				drop_console: true,
				drop_debugger: true,
				pure_funcs: ["console.log", "console.info", "console.debug", "console.trace"],
			},
		},
		rollupOptions: {
			// Mejorar tree-shaking
			treeshake: {
				moduleSideEffects: "no-external",
				preset: "recommended",
			},
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

					// ============ NUEVOS CHUNKS PARA DIVIDIR vendor-other ============

					// Redux (state management) - 15MB en node_modules
					if (
						id.includes("node_modules/@reduxjs") ||
						id.includes("node_modules/redux") ||
						id.includes("node_modules/redux-persist") ||
						id.includes("node_modules/reselect")
					) {
						return "vendor-redux";
					}

					// React Router (routing) - ~1.4MB en node_modules
					if (
						id.includes("node_modules/react-router") ||
						id.includes("node_modules/react-router-dom") ||
						id.includes("node_modules/history") ||
						id.includes("node_modules/@remix-run")
					) {
						return "vendor-router";
					}

					// Forms (formik + yup) - ~1.3MB en node_modules
					if (id.includes("node_modules/formik") || id.includes("node_modules/yup")) {
						return "vendor-forms";
					}

					// Framer Motion (animations) - 3.4MB en node_modules
					if (id.includes("node_modules/framer-motion")) {
						return "vendor-animations";
					}

					// React Table + virtualization - ~1.1MB en node_modules
					if (
						id.includes("node_modules/react-table") ||
						id.includes("node_modules/react-window") ||
						id.includes("node_modules/react-virtualized-auto-sizer") ||
						id.includes("node_modules/react-table-sticky")
					) {
						return "vendor-table";
					}

					// Drag and Drop libraries
					if (
						id.includes("node_modules/react-dnd") ||
						id.includes("node_modules/@hello-pangea/dnd") ||
						id.includes("node_modules/react-draggable")
					) {
						return "vendor-dnd";
					}

					// Internationalization
					if (id.includes("node_modules/react-intl")) {
						return "vendor-intl";
					}

					// Syntax Highlighter (9.1MB, usado solo 2 veces) - Candidato para lazy loading
					if (id.includes("node_modules/react-syntax-highlighter")) {
						return "vendor-syntax";
					}

					// Emoji Picker (3.2MB, usado solo 2 veces) - Candidato para lazy loading
					if (id.includes("node_modules/emoji-picker-react")) {
						return "vendor-emoji";
					}

					// Socket.io (1.6MB, usado solo 1 vez) - Candidato para lazy loading
					if (id.includes("node_modules/socket.io-client")) {
						return "vendor-socket";
					}

					// Core utilities (axios, immer, etc) - Usado extensivamente
					if (
						id.includes("node_modules/axios") ||
						id.includes("node_modules/immer") ||
						id.includes("node_modules/uuid") ||
						id.includes("node_modules/dayjs") ||
						id.includes("node_modules/js-cookie") ||
						id.includes("node_modules/jwt-decode")
					) {
						return "vendor-utils";
					}

					// Simplebar (scrollbar)
					if (id.includes("node_modules/simplebar")) {
						return "vendor-simplebar";
					}

					// Notistack (notifications)
					if (id.includes("node_modules/notistack")) {
						return "vendor-notistack";
					}

					// Otros vendors (lo que quede)
					// Nota: Bibliotecas como react-slick, react-dropzone, react-number-format
					// ya están optimizadas por Vite al estar en rutas lazy-loaded específicas
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
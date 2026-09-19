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
					if (
						id.includes("node_modules/apexcharts") ||
						id.includes("node_modules/recharts") ||
						id.includes("node_modules/react-apexcharts")
					) {
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
					// A partir de acá, librerías que solo usan vistas internas y que
					// viajaban dentro del paquete común. Como ese paquete lo baja
					// cualquier ruta, la landing y el registro descargaban tres librerías
					// de fechas, el cliente de sockets y el de la API de Google sin
					// usarlos. Medido el 2026-09-19:
					// `la-ads/analysis/2026-09-19-por-que-nadie-hace-clic.md`.
					//
					// **El editor de texto no se puede separar así.** Sacar @tiptap y
					// prosemirror a su propio archivo compila sin quejas pero rompe la
					// aplicación en el navegador con "Cannot read properties of undefined
					// (reading 'empty')": queda un ciclo entre ese archivo y el común.
					// Son 397 KB y valen la pena, pero hay que hacerlo desde el código,
					// cargando el editor bajo demanda, no desde acá.
					//
					// Cada regla nueva tiene que apuntar a algo alcanzable solo por rutas
					// que se cargan bajo demanda; si entra al arranque, vuelve a bajarse
					// siempre y el corte no sirve de nada. Verificar siempre cargando el
					// build en un navegador, no solo que compile.

					// Fechas: conviven moment, date-fns y dayjs. Se separan las tres para
					// que cada ruta baje la que realmente usa.
					if (id.includes("node_modules/moment")) {
						return "vendor-moment";
					}
					if (id.includes("node_modules/date-fns")) {
						return "vendor-datefns";
					}
					if (id.includes("node_modules/dayjs")) {
						return "vendor-dayjs";
					}
					// Sockets: notificaciones en vivo dentro del producto.
					if (id.includes("node_modules/socket.io") || id.includes("node_modules/engine.io")) {
						return "vendor-socket";
					}
					// Cliente de la API de Google (Drive, Calendar), solo en ajustes.
					if (id.includes("node_modules/gapi-script")) {
						return "vendor-gapi";
					}
					// Arrastrar y soltar del tablero de tareas.
					if (id.includes("node_modules/@hello-pangea")) {
						return "vendor-dnd";
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
			"@": path.resolve(__dirname, "./src"),
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

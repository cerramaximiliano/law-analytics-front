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
				// Sin manualChunks a propósito. La regla anterior mandaba todo
				// node_modules a un solo archivo "para que no haya problemas de orden
				// de dependencias", y el precio era que cualquier ruta bajaba todas las
				// librerías del producto: 1.088 KB comprimidos para mostrar una página
				// de marketing de 7 KB.
				//
				// El reparto automático de Rollup resuelve el problema de orden solo,
				// porque detecta los ciclos y deja los módulos que se importan entre sí
				// en el mismo archivo. Los intentos de separar a mano el editor de texto
				// fallaron justamente por eso: partían un ciclo al medio
				// (2026-09-20, ver la-ads/analysis/2026-09-19-por-que-nadie-hace-clic.md).
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

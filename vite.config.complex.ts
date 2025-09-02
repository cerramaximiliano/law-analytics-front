import { defineConfig, loadEnv } from "vite";
import react from "@vitejs/plugin-react-swc";
import tsconfigPaths from "vite-tsconfig-paths";
import svgr from "vite-plugin-svgr";
import viteImagemin from "vite-plugin-imagemin";
import path from "path";

// https://vitejs.dev/config/
export default defineConfig(({ mode }) => {
	const env = loadEnv(mode, process.cwd(), "");
	const isProd = mode === "production";
	const shouldOptimizeImages = env.VITE_OPTIMIZE_IMAGES === "true";

	return {
		plugins: [
			react({
				// SWC es mucho más rápido que Babel
				// Configuración para el runtime de JSX
				jsxRuntime: "automatic",
			}),
			tsconfigPaths(),
			svgr({
				svgrOptions: {
					icon: true,
				},
			}),
			// Solo optimizar imágenes si está habilitado y en producción
			...(isProd && shouldOptimizeImages
				? [
						viteImagemin({
							gifsicle: { optimizationLevel: 3 },
							optipng: { optimizationLevel: 5 },
							mozjpeg: { quality: 75 },
							pngquant: { quality: [0.8, 0.9] },
							svgo: {
								plugins: [
									{ name: "removeViewBox", active: false },
									{ name: "removeEmptyAttrs", active: false },
								],
							},
						}),
				  ]
				: []),
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
			// Solo sourcemaps en desarrollo
			sourcemap: !isProd,
			// Target browsers con compatibilidad ES5
			target: "es2015",
			// Optimización de chunks - simplificada para evitar problemas
			rollupOptions: {
				output: {
					manualChunks: {
						// React y sus dependencias core juntas
						"react-vendor": ["react", "react-dom", "react-router", "react-router-dom"],
						// Material UI
						mui: ["@mui/material", "@mui/system", "@mui/lab"],
						// Redux
						redux: ["@reduxjs/toolkit", "react-redux", "redux-persist"],
					},
				},
			},
			// Incrementar límite para evitar warnings innecesarios
			chunkSizeWarningLimit: 1500,
			// Minificación con esbuild en lugar de terser para evitar problemas
			minify: isProd ? "esbuild" : false,
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
			],
			exclude: ["@react-pdf/renderer"],
		},
		define: {
			// Para compatibilidad con código que usa process.env
			"process.env": {},
			// Polyfill para globalThis
			global: "globalThis",
		},
	};
});
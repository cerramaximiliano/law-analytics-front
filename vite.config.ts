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
				// No necesita configuración adicional
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
			// Target browsers modernos para evitar problemas con ES5
			target: ["es2020", "edge88", "firefox78", "chrome87", "safari14"],
			// Optimización de chunks mejorada
			rollupOptions: {
				output: {
					manualChunks(id) {
						// Optimización más inteligente de chunks
						if (id.includes("node_modules")) {
							if (id.includes("react") || id.includes("react-dom") || id.includes("react-router")) {
								return "react-vendor";
							}
							if (id.includes("@mui")) {
								return "mui";
							}
							if (id.includes("@fullcalendar")) {
								return "fullcalendar";
							}
							if (id.includes("apexcharts") || id.includes("recharts")) {
								return "charts";
							}
							if (id.includes("@react-pdf")) {
								return "pdf";
							}
							if (id.includes("redux") || id.includes("@reduxjs")) {
								return "redux";
							}
							if (id.includes("@emotion")) {
								return "emotion";
							}
							if (id.includes("formik") || id.includes("yup")) {
								return "forms";
							}
							if (id.includes("date-fns") || id.includes("dayjs")) {
								return "dates";
							}
							// Otros vendors
							return "vendor";
						}
					},
				},
			},
			// Incrementar límite para evitar warnings innecesarios
			chunkSizeWarningLimit: 1500,
			// Optimizaciones adicionales para producción
			minify: isProd ? "terser" : false,
			terserOptions: isProd
				? {
						compress: {
							drop_console: true,
							drop_debugger: true,
						},
				  }
				: undefined,
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
				"redux-persist",
				"immer",
				"redux",
				"reselect",
			],
			exclude: ["@react-pdf/renderer"],
			esbuildOptions: {
				target: "es2015",
				define: {
					global: "globalThis",
				},
			},
		},
		define: {
			// Para compatibilidad con código que usa process.env
			"process.env": {},
			// Polyfill para globalThis
			global: "globalThis",
		},
	};
});
import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Import polyfills first
import "./polyfills";

// Import env helper for compatibility
import "./utils/env";

// third-party
import { Provider as ReduxProvider } from "react-redux";
import { PersistGate } from "redux-persist/integration/react";

// fonts
import "assets/fonts/inter/inter.css";

// scroll bar
import "simplebar-react/dist/simplebar.min.css";
import "slick-carousel/slick/slick.css";
import "slick-carousel/slick/slick-theme.css";

// apex-chart
import "assets/third-party/apex-chart.css";
import "assets/third-party/react-table.css";

// custom styles
import "assets/css/custom.css";

// project-imports
import App from "./App";
import { store, persister } from "store";
import { ConfigProvider } from "contexts/ConfigContext";
import reportWebVitals from "./reportWebVitals";
import { preloadCriticalRoutes } from "./utils/lazyRetry";

const container = document.getElementById("root");
const root = createRoot(container!);

// Des-registrar cualquier Service Worker antiguo y limpiar caches
if ("serviceWorker" in navigator) {
	let swNeedsCleanup = false;

	navigator.serviceWorker.getRegistrations().then((registrations) => {
		if (registrations.length > 0) {
			swNeedsCleanup = true;
			console.log("Limpiando Service Workers antiguos...");

			const unregisterPromises = registrations.map((registration) => {
				return registration.unregister().then(() => {
					console.log("Service Worker des-registrado:", registration.scope);
				});
			});

			return Promise.all(unregisterPromises);
		}
	}).then(() => {
		// Limpiar caches antiguos
		if ("caches" in window) {
			return caches.keys().then((cacheNames) => {
				if (cacheNames.length > 0) {
					swNeedsCleanup = true;
					console.log("Limpiando caches antiguos:", cacheNames);
					return Promise.all(
						cacheNames.map((cacheName) => caches.delete(cacheName))
					);
				}
			});
		}
	}).then(() => {
		// Si se limpiaron SW o caches, recargar la página una vez
		if (swNeedsCleanup && !sessionStorage.getItem("sw_cleaned")) {
			sessionStorage.setItem("sw_cleaned", "true");
			console.log("Service Workers y caches limpiados. Recargando página...");
			window.location.reload();
		}
	}).catch((error) => {
		console.error("Error limpiando Service Workers:", error);
	});
}

// Precargar rutas críticas en segundo plano
preloadCriticalRoutes();

// ==============================|| MAIN - REACT DOM RENDER  ||============================== //

// Wrapper component to handle persist errors
const PersistGateWrapper = ({ children }: { children: React.ReactNode }) => {
	try {
		return (
			<PersistGate
				loading={null}
				persistor={persister}
				onBeforeLift={() => {
					// Ensure persist is ready before lifting
					console.log("PersistGate: Before lift");
				}}
			>
				{children}
			</PersistGate>
		);
	} catch (error) {
		console.error("PersistGate error:", error);
		// If PersistGate fails, render children directly
		return <>{children}</>;
	}
};

root.render(
	<ReduxProvider store={store}>
		<PersistGateWrapper>
			<ConfigProvider>
				<BrowserRouter basename={import.meta.env.VITE_BASE_NAME}>
					<App />
				</BrowserRouter>
			</ConfigProvider>
		</PersistGateWrapper>
	</ReduxProvider>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

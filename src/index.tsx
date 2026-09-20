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
import "@fontsource-variable/geist";

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
import { TeamProvider } from "contexts/TeamContext";
import reportWebVitals from "./reportWebVitals";
import { preloadCriticalRoutes } from "./utils/lazyRetry";

const container = document.getElementById("root");
const root = createRoot(container!);

// La limpieza de Service Workers se maneja en index.html antes de cargar este script

// Precargar rutas críticas en segundo plano
preloadCriticalRoutes();

// El archivo de la ruta pública se pedía recién cuando la aplicación terminaba
// de arrancar, un segundo y pico después de que bajó el arranque. Pedirlo ya
// lo pone en paralelo. Son los mismos módulos que cargan las rutas, así que el
// paquete no se duplica (2026-09-20).
const RUTAS_PRECARGA: Array<[RegExp, () => Promise<unknown>]> = [
	[/^\/$/, () => import("pages/landing")],
	[/^\/funciones/, () => import("pages/funciones")],
	[/^\/register/, () => import("pages/auth/auth1/register")],
	[/^\/login/, () => import("pages/auth/auth1/login")],
	[/^\/faq/, () => import("pages/faq")],
	[/^\/plans/, () => import("pages/plans")],
];
const precarga = RUTAS_PRECARGA.find(([re]) => re.test(window.location.pathname));
if (precarga) precarga[1]().catch(() => {});

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
					<TeamProvider>
						<App />
					</TeamProvider>
				</BrowserRouter>
			</ConfigProvider>
		</PersistGateWrapper>
	</ReduxProvider>,
);

// If you want to start measuring performance in your app, pass a function
// to log results (for example: reportWebVitals(console.log))
// or send to an analytics endpoint. Learn more: https://bit.ly/CRA-vitals
reportWebVitals();

import React from "react";
import { createRoot } from "react-dom/client";
import { BrowserRouter } from "react-router-dom";

// Import polyfills first
import "./polyfills";

// Import env helper for compatibility
import "./utils/env";

// Fix React for ApexCharts
import "./utils/fixReactForApexCharts";

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

const container = document.getElementById("root");
const root = createRoot(container!);

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
				<BrowserRouter basename={process.env.REACT_APP_BASE_NAME}>
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

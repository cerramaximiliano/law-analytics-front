import React from "react";
import { lazy, Suspense } from "react";

import { Outlet } from "react-router-dom";

// material-ui
import { Container, Toolbar } from "@mui/material";

// project-imports
import ThemeCustomization from "themes";
import { dispatch, useSelector } from "store";
import { openComponentDrawer } from "store/reducers/menu";
import { ThemeMode } from "types/config";
import useAuth from "hooks/useAuth";

// material-ui
import { styled } from "@mui/material/styles";
import LinearProgress, { LinearProgressProps } from "@mui/material/LinearProgress";

const Header = lazy(() => import("./Header"));
const FooterBlock = lazy(() => import("./FooterBlock"));
// Solo lo usa el layout "component" (con SimpleBar y react-device-detect): fuera
// del paquete de arranque de las páginas públicas (2026-10-13).
const ComponentLayout = lazy(() => import("./ComponentLayout"));
// Aviso de descarga de la app: solo se baja el chunk en Android (2026-10-22).
const AndroidAppBanner = lazy(() => import("components/app-download/AndroidAppBanner"));
const IS_ANDROID = typeof navigator !== "undefined" && /Android/i.test(navigator.userAgent || "");
// "Ir a mi panel" en las páginas públicas: chunk aparte, solo se baja con sesión (2026-10-23).
const VolverAlPanel = lazy(() => import("components/VolverAlPanel"));

// ==============================|| LOADER - WRAPPER ||============================== //

const LoaderWrapper = styled("div")(({ theme }) => ({
	position: "fixed",
	top: 0,
	left: 0,
	zIndex: 2001,
	width: "100%",
	"& > * + *": {
		marginTop: theme.spacing(2),
	},
}));

export interface LoaderProps extends LinearProgressProps {}

const Loader = () => (
	<LoaderWrapper>
		<LinearProgress color="primary" />
	</LoaderWrapper>
);

// ==============================|| MINIMAL LAYOUT ||============================== //

const CommonLayout = ({ layout = "blank" }: { layout?: string }) => {
	const { componentDrawerOpen } = useSelector((state) => state.menu);
	const { isLoggedIn } = useAuth();

	const handleDrawerOpen = () => {
		dispatch(openComponentDrawer({ componentDrawerOpen: !componentDrawerOpen }));
	};

	return (
		<ThemeCustomization forceMode={ThemeMode.LIGHT}>
			{(layout === "landing" || layout === "simple") && (
				<Suspense fallback={<Loader />}>
					{IS_ANDROID && <AndroidAppBanner />}
					<Header layout={layout} />
					<Outlet />
					<FooterBlock isFull={layout === "landing"} />
				</Suspense>
			)}
			{layout === "landing" && isLoggedIn && (
				<Suspense fallback={null}>
					<VolverAlPanel />
				</Suspense>
			)}
			{layout === "component" && (
				<Suspense fallback={<Loader />}>
					<Container maxWidth="xl" sx={{ px: { xs: 0, sm: 2 } }}>
						<Header handleDrawerOpen={handleDrawerOpen} layout="component" />
						<Toolbar sx={{ mt: 2 }} />
						<ComponentLayout handleDrawerOpen={handleDrawerOpen} componentDrawerOpen={componentDrawerOpen} />
					</Container>
				</Suspense>
			)}
			{layout === "blank" && <Outlet />}
		</ThemeCustomization>
	);
};

export default CommonLayout;

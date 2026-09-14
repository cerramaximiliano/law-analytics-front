import React from "react";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import { useMediaQuery, Box, Container, Toolbar } from "@mui/material";

// project-imports
import Drawer from "./Drawer";
import Header from "./Header";
import Footer from "./Footer";
import HorizontalBar from "./Drawer/HorizontalBar";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import FeedbackWidget from "components/feedback/FeedbackWidget";
import ActiveSurveyModal from "components/feedback/ActiveSurveyModal";
import { BreadcrumbProvider } from "contexts/BreadcrumbContext";
import { TeamProvider } from "contexts/TeamContext";

import { DRAWER_WIDTH } from "config";
import navigation from "menu-items";
import useConfig from "hooks/useConfig";
import { dispatch } from "store";
import { openDrawer } from "store/reducers/menu";
import { useSearchEntityLoader } from "hooks/useSearchEntityLoader";
import { BRAND_BLUE } from "themes/dashboardTokens";

// types
import { MenuOrientation, ThemeMode } from "types/config";

// ==============================|| MAIN LAYOUT ||============================== //

const MainLayout = () => {
	const theme = useTheme();
	const location = useLocation();
	const downXL = useMediaQuery(theme.breakpoints.down("xl"));
	const downLG = useMediaQuery(theme.breakpoints.down("lg"));

	const { container, miniDrawer, menuOrientation } = useConfig();

	const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;
	const isDetailPage = location.pathname.includes("/apps/folders/details/");
	const isDark = theme.palette.mode === ThemeMode.DARK;

	// Initialize search entity loader
	useSearchEntityLoader();

	// set media wise responsive drawer
	useEffect(() => {
		if (!miniDrawer) {
			dispatch(openDrawer(!downXL));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [downXL]);

	return (
		<TeamProvider>
			<Box sx={{ display: "flex", width: "100%" }}>
				<Header />
				{!isHorizontal ? <Drawer /> : <HorizontalBar />}

				<Box
					component="main"
					sx={{
						width: `calc(100% - ${DRAWER_WIDTH}px)`,
						flexGrow: 1,
						p: { xs: 2, md: 3 },
						position: "relative",
					}}
				>
					{/* Atmósfera del landing — scope: SOLO esta columna, nunca el drawer
					    ni el header. pointerEvents:none + zIndex:0 + el contenido monta
					    con zIndex:1 para garantizar que no captura clicks. Dos capas:
					    blob brand-blue (presencia) + dot grid (textura ambient). */}
					<Box aria-hidden sx={{ position: "absolute", inset: 0, zIndex: 0, pointerEvents: "none", overflow: "hidden" }}>
						{/* Blob brand-blue arriba a la derecha — el elemento más visible */}
						<Box
							sx={{
								position: "absolute",
								top: { xs: "-10%", md: "-15%" },
								right: { xs: "-25%", md: "-10%" },
								width: { xs: 380, md: 620 },
								height: { xs: 380, md: 620 },
								borderRadius: "50%",
								background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.11)} 0%, transparent 65%)`,
								filter: "blur(70px)",
							}}
						/>
						{/* Blob secundario abajo a la izquierda — más suave, balance compositivo */}
						<Box
							sx={{
								position: "absolute",
								bottom: { xs: "-15%", md: "-18%" },
								left: { xs: "-30%", md: "-12%" },
								width: { xs: 420, md: 720 },
								height: { xs: 420, md: 720 },
								borderRadius: "50%",
								background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.1 : 0.07)} 0%, transparent 65%)`,
								filter: "blur(85px)",
							}}
						/>
						{/* Dot grid ambient */}
						<Box
							sx={{
								position: "absolute",
								inset: 0,
								backgroundImage: `radial-gradient(${alpha(theme.palette.text.primary, isDark ? 0.12 : 0.08)} 1.2px, transparent 1.2px)`,
								backgroundSize: "26px 26px",
								maskImage: "radial-gradient(ellipse 95% 85% at 50% 25%, #000 0%, transparent 90%)",
								WebkitMaskImage: "radial-gradient(ellipse 95% 85% at 50% 25%, #000 0%, transparent 90%)",
							}}
						/>
					</Box>
					<Toolbar sx={{ mt: isHorizontal ? 8 : "inherit", mb: isHorizontal ? 2 : "inherit", position: "relative", zIndex: 1 }} />
					<BreadcrumbProvider>
						<Container
							maxWidth={container ? "xl" : false}
							sx={{
								xs: 0,
								...(container && { px: { xs: 0, md: 2 } }),
								position: "relative",
								zIndex: 1,
								minHeight: "calc(100vh - 110px)",
								display: "flex",
								flexDirection: "column",
							}}
						>
							<Box
								sx={{
									position: "relative",
									paddingRight: isDetailPage ? { xs: "200px", sm: "250px", md: "350px" } : 0,
								}}
							>
								<Breadcrumbs navigation={navigation} title titleBottom card={false} divider={false} />
							</Box>
							<Outlet />
							<Footer />
						</Container>
					</BreadcrumbProvider>
				</Box>
				<FeedbackWidget />
				<ActiveSurveyModal />
			</Box>
		</TeamProvider>
	);
};

export default MainLayout;

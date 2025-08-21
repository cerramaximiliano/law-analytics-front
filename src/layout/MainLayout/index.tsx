import React from "react";
import { useEffect } from "react";
import { Outlet, useLocation } from "react-router-dom";

// material-ui
import { useTheme } from "@mui/material/styles";
import { useMediaQuery, Box, Container, Toolbar } from "@mui/material";

// project-imports
import Drawer from "./Drawer";
import Header from "./Header";
import Footer from "./Footer";
import HorizontalBar from "./Drawer/HorizontalBar";
import Breadcrumbs from "components/@extended/Breadcrumbs";
import { BreadcrumbProvider } from "contexts/BreadcrumbContext";

import { DRAWER_WIDTH } from "config";
import navigation from "menu-items";
import useConfig from "hooks/useConfig";
import { dispatch } from "store";
import { openDrawer } from "store/reducers/menu";
import { useSearchEntityLoader } from "hooks/useSearchEntityLoader";

// types
import { MenuOrientation } from "types/config";

// ==============================|| MAIN LAYOUT ||============================== //

const MainLayout = () => {
	const theme = useTheme();
	const location = useLocation();
	const downXL = useMediaQuery(theme.breakpoints.down("xl"));
	const downLG = useMediaQuery(theme.breakpoints.down("lg"));

	const { container, miniDrawer, menuOrientation } = useConfig();

	const isHorizontal = menuOrientation === MenuOrientation.HORIZONTAL && !downLG;
	const isDetailPage = location.pathname.includes("/apps/folders/details/");

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
		<Box sx={{ display: "flex", width: "100%" }}>
			<Header />
			{!isHorizontal ? <Drawer /> : <HorizontalBar />}

			<Box component="main" sx={{ width: `calc(100% - ${DRAWER_WIDTH}px)`, flexGrow: 1, p: { xs: 2, md: 3 } }}>
				<Toolbar sx={{ mt: isHorizontal ? 8 : "inherit", mb: isHorizontal ? 2 : "inherit" }} />
				<BreadcrumbProvider>
					<Container
						maxWidth={container ? "xl" : false}
						sx={{
							xs: 0,
							...(container && { px: { xs: 0, md: 2 } }),
							position: "relative",
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
		</Box>
	);
};

export default MainLayout;

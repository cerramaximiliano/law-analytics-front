import React from "react";
import { useState, SyntheticEvent, useEffect } from "react";
import { useLocation, Link, Outlet, useNavigate } from "react-router-dom";

// material-ui
import { Box, Tab, Tabs } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// project-imports
import MainCard from "components/MainCard";
import { useTeam } from "contexts/TeamContext";
import { BRAND_BLUE } from "themes/dashboardTokens";

// assets
import { Profile2User, Card, TableDocument, Link1 } from "iconsax-react";

// ==============================|| PROFILE - ACCOUNT ||============================== //

const AccountProfile = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { pathname } = useLocation();
	const navigate = useNavigate();
	const { isTeamMode, isOwner } = useTeam();

	const showPjnTab = !isTeamMode || isOwner;

	const tabPaths = [
		"/apps/profiles/account/my-account",
		"/apps/profiles/account/subscription",
		"/apps/profiles/account/role",
		...(showPjnTab ? ["/apps/profiles/account/pjn"] : []),
	];

	const selectedTab = tabPaths.indexOf(pathname);
	const [value, setValue] = useState(selectedTab !== -1 ? selectedTab : 0);

	useEffect(() => {
		const idx = tabPaths.indexOf(pathname);
		if (idx !== -1) setValue(idx);
	}, [pathname, tabPaths.length]);

	useEffect(() => {
		if (!showPjnTab && pathname === "/apps/profiles/account/pjn") {
			navigate("/apps/profiles/account/my-account", { replace: true });
		}
	}, [showPjnTab, pathname, navigate]);

	const handleChange = (_event: SyntheticEvent, newValue: number) => {
		setValue(newValue);
	};

	const brandTabsSx = {
		minHeight: 44,
		"& .MuiTab-root": {
			textTransform: "none",
			fontWeight: 600,
			fontSize: "0.85rem",
			letterSpacing: "-0.005em",
			color: "text.secondary",
			minHeight: 44,
			py: 1,
			px: 2,
			"& .MuiTab-iconWrapper": {
				color: "text.secondary",
				transition: "color 0.15s ease",
			},
			"&.Mui-selected": {
				color: BRAND_BLUE,
				"& .MuiTab-iconWrapper": { color: BRAND_BLUE },
			},
			"&:hover:not(.Mui-selected)": { color: "text.primary" },
		},
		"& .MuiTabs-indicator": { backgroundColor: BRAND_BLUE, height: 2 },
	};

	return (
		<MainCard
			border={false}
			content={false}
			sx={{ borderRadius: 2, border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`, p: 0 }}
		>
			<Box sx={{ px: { xs: 1.5, sm: 2 }, pt: 1, borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}` }}>
				<Tabs
					value={value}
					onChange={handleChange}
					variant="scrollable"
					scrollButtons="auto"
					aria-label="account profile tab"
					sx={brandTabsSx}
				>
					<Tab
						label="Mi cuenta"
						component={Link}
						to="/apps/profiles/account/my-account"
						icon={<TableDocument size={15} variant="Linear" />}
						iconPosition="start"
					/>
					<Tab
						label="Suscripción"
						component={Link}
						to="/apps/profiles/account/subscription"
						icon={<Card size={15} variant="Linear" />}
						iconPosition="start"
					/>
					<Tab
						label="Mi equipo"
						component={Link}
						to="/apps/profiles/account/role"
						icon={<Profile2User size={15} variant="Linear" />}
						iconPosition="start"
					/>
					{showPjnTab && (
						<Tab
							label="Integraciones"
							component={Link}
							to="/apps/profiles/account/pjn"
							icon={<Link1 size={15} variant="Linear" />}
							iconPosition="start"
						/>
					)}
				</Tabs>
			</Box>
			<Box sx={{ p: { xs: 2, sm: 2.5 } }}>
				<Outlet />
			</Box>
		</MainCard>
	);
};

export default AccountProfile;

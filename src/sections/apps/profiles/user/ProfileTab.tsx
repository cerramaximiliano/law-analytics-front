import React from "react";
import { useEffect, useState } from "react";
import { useLocation, useNavigate } from "react-router-dom";

// material-ui
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// assets
import { ArrowRight2, Lock, Profile, Setting3 } from "iconsax-react";
import { BRAND_BLUE } from "themes/dashboardTokens";

function getPathIndex(pathname: string) {
	let selectedTab = 0;
	switch (pathname) {
		case "/apps/profiles/user/professional":
			selectedTab = 1;
			break;
		case "/apps/profiles/user/settings":
			selectedTab = 2;
			break;
		case "/apps/profiles/user/personal":
		default:
			selectedTab = 0;
	}
	return selectedTab;
}

const TABS = [
	{
		key: "personal",
		label: "Información personal",
		description: "Tus datos básicos",
		icon: Profile,
		route: "/apps/profiles/user/personal",
	},
	{
		key: "professional",
		label: "Información profesional",
		description: "Matrículas y datos del estudio",
		icon: Lock,
		route: "/apps/profiles/user/professional",
	},
	{
		key: "settings",
		label: "Configuraciones",
		description: "Preferencias y seguridad",
		icon: Setting3,
		route: "/apps/profiles/user/settings",
	},
];

// ==============================|| USER PROFILE - BASIC ||============================== //

const ProfileTab = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const navigate = useNavigate();
	const { pathname } = useLocation();

	const [selectedIndex, setSelectedIndex] = useState(getPathIndex(pathname));

	useEffect(() => {
		setSelectedIndex(getPathIndex(pathname));
	}, [pathname]);

	const handleClick = (index: number, route: string) => {
		setSelectedIndex(index);
		navigate(route);
	};

	return (
		<Stack component="nav" spacing={0.75} sx={{ width: "100%" }}>
			{TABS.map((tab, idx) => {
				const isSelected = selectedIndex === idx;
				const Icon = tab.icon;
				return (
					<Box
						key={tab.key}
						role="button"
						tabIndex={0}
						onClick={() => handleClick(idx, tab.route)}
						onKeyDown={(e) => (e.key === "Enter" || e.key === " ") && handleClick(idx, tab.route)}
						sx={{
							position: "relative",
							display: "flex",
							alignItems: "center",
							gap: 1.25,
							p: 1.25,
							borderRadius: 1.25,
							cursor: "pointer",
							bgcolor: isSelected ? alpha(BRAND_BLUE, isDark ? 0.14 : 0.07) : "transparent",
							border: `1px solid ${isSelected ? alpha(BRAND_BLUE, isDark ? 0.36 : 0.24) : "transparent"}`,
							transition: "background-color 0.15s ease, border-color 0.15s ease",
							"&:hover": {
								bgcolor: isSelected ? alpha(BRAND_BLUE, isDark ? 0.18 : 0.09) : alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
								borderColor: isSelected ? alpha(BRAND_BLUE, 0.5) : alpha(BRAND_BLUE, isDark ? 0.2 : 0.14),
							},
							"&:focus-visible": {
								outline: "none",
								boxShadow: `0 0 0 2px ${alpha(BRAND_BLUE, 0.35)}`,
							},
						}}
					>
						{/* Indicador lateral cuando seleccionado */}
						{isSelected && (
							<Box
								sx={{
									position: "absolute",
									left: -1,
									top: "50%",
									transform: "translateY(-50%)",
									width: 3,
									height: 20,
									borderRadius: "0 2px 2px 0",
									bgcolor: BRAND_BLUE,
								}}
							/>
						)}

						{/* Icon ring */}
						<Box
							sx={{
								width: 34,
								height: 34,
								borderRadius: 1,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: isSelected
									? alpha(BRAND_BLUE, isDark ? 0.2 : 0.12)
									: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
								border: `1px solid ${
									isSelected ? alpha(BRAND_BLUE, isDark ? 0.36 : 0.24) : alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)
								}`,
								color: isSelected ? BRAND_BLUE : "text.secondary",
								transition: "color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease",
								flexShrink: 0,
							}}
						>
							<Icon size={16} variant={isSelected ? "Bulk" : "Linear"} />
						</Box>

						{/* Label + descripción */}
						<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
							<Typography
								sx={{
									fontSize: "0.85rem",
									fontWeight: 600,
									letterSpacing: "-0.005em",
									color: isSelected ? "text.primary" : "text.primary",
									lineHeight: 1.2,
								}}
							>
								{tab.label}
							</Typography>
							<Typography
								sx={{
									fontSize: "0.7rem",
									color: "text.secondary",
									letterSpacing: "-0.005em",
									lineHeight: 1.3,
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								{tab.description}
							</Typography>
						</Stack>

						{/* Chevron cuando seleccionado */}
						<ArrowRight2
							size={14}
							variant="Linear"
							style={{
								color: isSelected ? BRAND_BLUE : "transparent",
								flexShrink: 0,
								transition: "color 0.15s ease",
							}}
						/>
					</Box>
				);
			})}
		</Stack>
	);
};

export default ProfileTab;

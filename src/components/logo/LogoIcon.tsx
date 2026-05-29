import React from "react";

import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import logoIcon from "assets/images/logo.png";
import { ThemeMode } from "types/config";

// ==============================|| LOGO ICON ||============================== //

const LogoIcon = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === ThemeMode.DARK;
	return (
		<Stack>
			<img
				src={logoIcon}
				width={45}
				alt=""
				style={isDark ? { filter: "brightness(0) invert(1)" } : undefined}
			/>
		</Stack>
	);
};

export default LogoIcon;

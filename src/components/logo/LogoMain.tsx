import React from "react";

import { Stack } from "@mui/material";
import { useTheme } from "@mui/material/styles";

import logo from "assets/images/large_logo_transparent.png";
import { ThemeMode } from "types/config";

// ==============================|| LOGO ||============================== //

const LogoMain = ({ reverse, ...others }: { reverse?: boolean }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === ThemeMode.DARK;
	return (
		<Stack>
			<img
				src={logo}
				height="50"
				alt=""
				style={isDark ? { filter: "brightness(0) invert(1)" } : undefined}
			/>
		</Stack>
	);
};

export default LogoMain;

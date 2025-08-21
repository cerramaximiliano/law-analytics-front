import React from "react";
// material-ui
import { useTheme } from "@mui/material/styles";
import { Box } from "@mui/material";

// types
import { ThemeMode } from "types/config";

// ==============================|| PAGE BACKGROUND ||============================== //

interface PageBackgroundProps {
	variant?: "default" | "auth" | "light";
}

const PageBackground = ({ variant = "default" }: PageBackgroundProps) => {
	const theme = useTheme();

	// Different blur values based on variant
	const blurAmount = variant === "light" ? "100px" : "140px";

	// Different opacity based on variant
	const getOpacity = (baseOpacity: number) => {
		if (variant === "light") return baseOpacity * 0.7;
		return theme.palette.mode === ThemeMode.DARK ? baseOpacity * 0.7 : baseOpacity;
	};

	return (
		<Box
			sx={{
				position: "absolute",
				filter: `blur(${blurAmount})`,
				zIndex: -1,
				bottom: 0,
				left: 0,
				top: 0,
				right: 0,
				overflow: "hidden",
				"&:before": {
					content: `" "`,
					width: variant === "light" ? 250 : 300,
					height: variant === "light" ? 250 : 300,
					borderRadius: "50%",
					bgcolor: "warning.lighter",
					position: "absolute",
					top: variant === "light" ? 20 : 0,
					right: variant === "light" ? 20 : 0,
					opacity: getOpacity(1),
				},
			}}
		>
			<Box
				sx={{
					width: variant === "light" ? 200 : 250,
					height: variant === "light" ? 200 : 250,
					borderRadius: "50%",
					bgcolor: theme.palette.success.lighter,
					ml: variant === "light" ? 15 : 20,
					position: "absolute",
					bottom: variant === "light" ? 150 : 180,
					opacity: getOpacity(1),
				}}
			/>
			<Box
				sx={{
					width: variant === "light" ? 180 : 200,
					height: variant === "light" ? 180 : 200,
					borderRadius: "50%",
					bgcolor: theme.palette.error.light,
					position: "absolute",
					bottom: 0,
					left: variant === "light" ? -30 : -50,
					opacity: getOpacity(1),
				}}
			/>
		</Box>
	);
};

export default PageBackground;

import React from "react";
import { Link as RouterLink } from "react-router-dom";

// material-ui
import { useTheme } from "@mui/material/styles";
import { Box, Link, Stack, Typography } from "@mui/material";

// project-imports
import { headerBorder } from "themes/dashboardTokens";

// types
import { ThemeMode } from "types/config";

// ==============================|| MAIN LAYOUT - FOOTER ||============================== //
// Chrome funcional, baja jerarquía visual: divisor sutil arriba, © a la izquierda
// y links legales a la derecha. Reemplaza el "creado por Rumba" + link a
// rumba-dev.com — no son legales y el link "Home" era confuso.

const Footer = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === ThemeMode.DARK;

	return (
		<Box
			component="footer"
			sx={{
				mt: "auto",
				pt: 2.5,
				pb: 1,
				borderTop: `1px solid ${headerBorder(isDark)}`,
			}}
		>
			<Stack
				direction={{ xs: "column", sm: "row" }}
				justifyContent="space-between"
				alignItems={{ xs: "flex-start", sm: "center" }}
				spacing={{ xs: 1, sm: 0 }}
			>
				<Typography
					variant="caption"
					sx={{
						color: "text.secondary",
						letterSpacing: "-0.005em",
					}}
				>
					© {new Date().getFullYear()} Law·Analytics
				</Typography>

				<Stack
					direction="row"
					spacing={2.5}
					alignItems="center"
					sx={{
						"& a": {
							fontSize: "0.72rem",
							color: "text.secondary",
							textDecoration: "none",
							letterSpacing: "-0.005em",
							transition: "color 150ms",
							"&:hover": { color: "text.primary" },
						},
					}}
				>
					<Link component={RouterLink} to="/terms">
						Términos
					</Link>
					<Link component={RouterLink} to="/privacy-policy">
						Privacidad
					</Link>
					<Link component={RouterLink} to="/cookies-policy">
						Cookies
					</Link>
				</Stack>
			</Stack>
		</Box>
	);
};

export default Footer;

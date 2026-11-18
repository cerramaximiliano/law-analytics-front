import { ReactNode } from "react";
import { Box, Typography, useTheme, alpha } from "@mui/material";
import { BRAND_BLUE } from "themes/dashboardTokens";

interface Props {
	icon: ReactNode;
	title: string;
	subtitle?: string;
	testId?: string;
}

// Estado vacío de las pestañas de la carpeta: mismo recuadro punteado con ícono que usa Historial.
export default function TabEmptyState({ icon, title, subtitle, testId }: Props) {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	return (
		<Box
			data-testid={testId}
			sx={{
				p: 3.5,
				textAlign: "center",
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
				border: `1px dashed ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.2)}`,
				borderRadius: 1.5,
			}}
		>
			<Box
				sx={{
					width: 56,
					height: 56,
					borderRadius: 1.5,
					display: "inline-flex",
					alignItems: "center",
					justifyContent: "center",
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
					color: BRAND_BLUE,
					mb: 1.5,
				}}
			>
				{icon}
			</Box>
			<Typography sx={{ fontSize: "1rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.015em" }}>{title}</Typography>
			{subtitle && (
				<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", letterSpacing: "-0.005em", mt: 0.5 }}>{subtitle}</Typography>
			)}
		</Box>
	);
}

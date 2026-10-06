/**
 * Contenedor con el mismo look que las SectionCard de Cuenta (TabSettings /
 * TabPjnIntegration), pero definido a nivel módulo: las SectionCard de esas vistas
 * se declaran dentro del componente, así que cada render del padre desmonta a sus
 * hijos. El add-on tiene diálogos con estado (alta / baja) que no pueden perderse
 * cuando la suscripción del store se actualiza a mitad del flujo.
 */

import type { ReactNode } from "react";

import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

const BRAND_BLUE = "#3A7BFF";

interface Props {
	eyebrow: string;
	title: string;
	subtitle?: string;
	icon: ReactNode;
	rightSlot?: ReactNode;
	children: ReactNode;
}

const McpSectionShell = ({ eyebrow, title, subtitle, icon, rightSlot, children }: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	return (
		<Box
			sx={{
				borderRadius: 2,
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				bgcolor: "background.paper",
				height: "100%",
				overflow: "hidden",
			}}
		>
			<Box
				sx={{
					px: { xs: 2, sm: 2.5 },
					py: 1.75,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025),
					borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
				}}
			>
				<Stack direction="row" spacing={1.25} alignItems="center">
					<Box
						sx={{
							width: 32,
							height: 32,
							borderRadius: 1,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
							color: BRAND_BLUE,
							flexShrink: 0,
						}}
					>
						{icon}
					</Box>
					<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
						<Stack direction="row" spacing={0.625} alignItems="center">
							<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
							<Typography
								sx={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}
							>
								{eyebrow}
							</Typography>
						</Stack>
						<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary" }}>{title}</Typography>
						{subtitle && (
							<Typography sx={{ fontSize: "0.74rem", color: "text.secondary", letterSpacing: "-0.005em" }}>{subtitle}</Typography>
						)}
					</Stack>
					{rightSlot}
				</Stack>
			</Box>
			<Box sx={{ p: { xs: 2, sm: 2.5 } }}>{children}</Box>
		</Box>
	);
};

export default McpSectionShell;

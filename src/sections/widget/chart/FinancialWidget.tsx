import React from "react";
import { Box, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MainCard from "components/MainCard";
import { Wallet3 } from "iconsax-react";
import { useNavigate } from "react-router-dom";
import { useSelector } from "store";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { ThemeMode } from "types/config";

interface FinancialWidgetProps {
	foldersTrend?: {
		direction: string;
		percentage: number;
	};
}

const FinancialWidget = ({ foldersTrend = { direction: "up", percentage: 0 } }: FinancialWidgetProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === ThemeMode.DARK;
	const navigate = useNavigate();

	// Obtener datos del store unificado
	const { data: unifiedData } = useSelector((state) => state.unifiedStats);
	const dashboardData = unifiedData?.dashboard;

	// Función para formatear moneda
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
			maximumFractionDigits: 0,
		}).format(amount);
	};

	return (
		<MainCard
			onClick={() => navigate("/apps/folders/list")}
			sx={{
				cursor: "pointer",
				transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
				"&:hover": {
					transform: "translateY(-2px)",
					borderColor: alpha(BRAND_BLUE, isDark ? 0.32 : 0.22),
					boxShadow: `0 8px 22px ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				},
			}}
		>
			<Stack spacing={2}>
				{/* Header con ícono brand-tinted y título */}
				<Stack direction="row" alignItems="center" spacing={1.5}>
					<Box
						sx={{
							width: 40,
							height: 40,
							borderRadius: 1.5,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
							color: BRAND_BLUE,
						}}
					>
						<Wallet3 size={20} variant="Bulk" />
					</Box>
					<Typography variant="subtitle1" sx={{ letterSpacing: "-0.005em" }}>
						Monto activo
					</Typography>
				</Stack>

				{/* Contenido — count grande con tabular-nums */}
				<Box sx={{ pt: 1, pb: 0.5 }}>
					<Stack spacing={0.5} alignItems="center">
						<Typography
							sx={{
								fontSize: { xs: "1.4rem", md: "1.625rem" },
								fontWeight: 600,
								letterSpacing: "-0.02em",
								fontVariantNumeric: "tabular-nums",
								color: "text.primary",
								lineHeight: 1.15,
							}}
						>
							{formatCurrency(dashboardData?.financial?.activeAmount || 0)}
						</Typography>
						<Typography
							variant="caption"
							sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.005em" }}
						>
							{dashboardData?.folders?.active || 0} carpetas activas
						</Typography>
					</Stack>
				</Box>
			</Stack>
		</MainCard>
	);
};

export default FinancialWidget;

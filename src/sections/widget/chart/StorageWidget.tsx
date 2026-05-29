import React from "react";
import { Box, Stack, Typography, LinearProgress, Grid } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import MainCard from "components/MainCard";
import { CloudChange } from "iconsax-react";
import { useSelector } from "store";
import { cleanPlanDisplayName } from "utils/planPricingUtils";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { ThemeMode } from "types/config";

const StorageWidget = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === ThemeMode.DARK;
	const userStats = useSelector((state) => state.userStats.data);

	// Helper de formato de bytes.
	const formatBytes = (bytes: number): string => {
		if (!bytes || bytes <= 0 || !isFinite(bytes)) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	const storageUsed = userStats?.storage?.total || 0;
	const storageLimit = userStats?.storage?.limit || 52428800; // Default 50MB

	const storagePercentage =
		userStats?.storage?.usedPercentage !== undefined
			? userStats.storage.usedPercentage
			: storageLimit > 0
			? Math.min((storageUsed / storageLimit) * 100, 100)
			: 0;

	// Color dinámico según uso: BRAND_BLUE (ok) → warning (atención) → error (límite).
	// Mantenemos el coloreo semántico porque acá sí comunica algo.
	const storageColor = storagePercentage < 60 ? BRAND_BLUE : storagePercentage < 80 ? theme.palette.warning.main : theme.palette.error.main;

	const planName = userStats?.planInfo?.planName ? cleanPlanDisplayName(userStats.planInfo.planName) : null;

	return (
		<MainCard>
			<Stack spacing={2}>
				{/* Header con icono brand-tinted + título + chip de porcentaje */}
				<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
					<Stack direction="row" alignItems="center" spacing={1.5}>
						<Box
							sx={{
								width: 40,
								height: 40,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(storageColor, isDark ? 0.18 : 0.1),
								border: `1px solid ${alpha(storageColor, isDark ? 0.32 : 0.2)}`,
								color: storageColor,
							}}
						>
							<CloudChange size={20} variant="Bulk" />
						</Box>
						<Stack spacing={0.25}>
							<Typography variant="subtitle1" sx={{ letterSpacing: "-0.005em" }}>
								Almacenamiento
							</Typography>
							{planName && (
								<Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "-0.005em" }}>
									{planName}
								</Typography>
							)}
						</Stack>
					</Stack>
					{/* Chip de porcentaje con mismo color semántico */}
					<Box
						sx={{
							px: 1,
							py: 0.25,
							borderRadius: 1,
							bgcolor: alpha(storageColor, isDark ? 0.16 : 0.08),
							border: `1px solid ${alpha(storageColor, isDark ? 0.32 : 0.2)}`,
						}}
					>
						<Typography
							sx={{
								fontSize: "0.72rem",
								fontWeight: 600,
								color: storageColor,
								fontVariantNumeric: "tabular-nums",
								letterSpacing: "-0.005em",
							}}
						>
							{storagePercentage.toFixed(1)}%
						</Typography>
					</Box>
				</Stack>

				{/* Barra de progreso */}
				<LinearProgress
					variant="determinate"
					value={storagePercentage}
					sx={{
						height: 8,
						borderRadius: 1,
						backgroundColor: alpha(theme.palette.text.primary, isDark ? 0.08 : 0.05),
						"& .MuiLinearProgress-bar": {
							borderRadius: 1,
							bgcolor: storageColor,
						},
					}}
				/>

				{/* Info de uso */}
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.005em" }}
					>
						{formatBytes(storageUsed)} utilizados
					</Typography>
					<Typography
						variant="caption"
						sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.005em" }}
					>
						{formatBytes(storageLimit)} totales
					</Typography>
				</Stack>

				{/* Desglose por tipo — flatten del MainCard anidado pre-redesign */}
				{userStats?.storage && (
					<Box
						sx={{
							pt: 2,
							borderTop: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.08 : 0.05)}`,
						}}
					>
						<Grid container spacing={2}>
							{[
								{ label: "Carpetas", bytes: userStats.storage.folders || 0 },
								{ label: "Contactos", bytes: userStats.storage.contacts || 0 },
								{ label: "Cálculos", bytes: userStats.storage.calculators || 0 },
							].map((item) => (
								<Grid item xs={4} key={item.label}>
									<Stack spacing={0.25} alignItems="center">
										<Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "-0.005em" }}>
											{item.label}
										</Typography>
										<Typography
											variant="body2"
											sx={{
												fontWeight: 600,
												fontVariantNumeric: "tabular-nums",
												letterSpacing: "-0.005em",
											}}
										>
											{formatBytes(item.bytes)}
										</Typography>
									</Stack>
								</Grid>
							))}
						</Grid>
					</Box>
				)}
			</Stack>
		</MainCard>
	);
};

export default StorageWidget;

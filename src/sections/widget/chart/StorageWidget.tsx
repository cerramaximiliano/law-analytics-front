import React from "react";
import { Box, Stack, Typography, LinearProgress, Grid, Chip } from "@mui/material";
import { useTheme } from "@mui/material/styles";
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import { CloudChange } from "iconsax-react";
import { useSelector } from "store";

const StorageWidget = () => {
	const theme = useTheme();
	const userStats = useSelector((state) => state.userStats.data);

	// Funciones helper para formatear bytes
	const formatBytes = (bytes: number): string => {
		if (bytes === 0) return "0 Bytes";
		const k = 1024;
		const sizes = ["Bytes", "KB", "MB", "GB"];
		const i = Math.floor(Math.log(bytes) / Math.log(k));
		return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + " " + sizes[i];
	};

	// Usar los valores directamente de la API
	const storageUsed = userStats?.storage?.total || 0;
	const storageLimit = userStats?.storage?.limit || 52428800; // Default 50MB si no viene de la API

	// Calcular porcentaje - si la API lo provee, usarlo, sino calcularlo
	const storagePercentage =
		userStats?.storage?.usedPercentage !== undefined
			? userStats.storage.usedPercentage
			: storageLimit > 0
			? Math.min((storageUsed / storageLimit) * 100, 100)
			: 0;

	// Determinar color de la barra según el uso
	const getStorageColor = (percentage: number) => {
		if (percentage < 60) return "primary";
		if (percentage < 80) return "warning";
		return "error";
	};

	return (
		<MainCard>
			<Stack spacing={2}>
				{/* Header con ícono y título */}
				<Stack direction="row" alignItems="center" justifyContent="space-between">
					<Stack direction="row" alignItems="center" spacing={2}>
						<Avatar variant="rounded" color={getStorageColor(storagePercentage) as any}>
							<CloudChange />
						</Avatar>
						<Stack spacing={0.5}>
							<Typography variant="subtitle1">Almacenamiento</Typography>
							{userStats?.planInfo?.planName && (
								<Typography variant="caption" color="text.secondary">
									{userStats.planInfo.planName}
								</Typography>
							)}
						</Stack>
					</Stack>
					<Chip
						label={`${storagePercentage.toFixed(1)}%`}
						color={getStorageColor(storagePercentage) as any}
						size="small"
						variant="outlined"
					/>
				</Stack>

				{/* Barra de progreso */}
				<LinearProgress
					variant="determinate"
					value={storagePercentage}
					color={getStorageColor(storagePercentage) as any}
					sx={{
						height: 8,
						borderRadius: 1,
						backgroundColor: theme.palette.grey[300],
						"& .MuiLinearProgress-bar": {
							borderRadius: 1,
						},
					}}
				/>

				{/* Información de uso */}
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Typography variant="caption" color="text.secondary">
						{formatBytes(storageUsed)} utilizados
					</Typography>
					<Typography variant="caption" color="text.secondary">
						{formatBytes(storageLimit)} totales
					</Typography>
				</Stack>

				{/* Desglose por tipo si está disponible */}
				{userStats?.storage && (
					<MainCard content={false} border={false} sx={{ bgcolor: "background.default" }}>
						<Box sx={{ p: 2 }}>
							<Grid container spacing={2}>
								<Grid item xs={4}>
									<Stack spacing={0.5} alignItems="center">
										<Typography variant="caption" color="text.secondary">
											Carpetas
										</Typography>
										<Typography variant="body2" sx={{ fontWeight: 500 }}>
											{formatBytes(userStats.storage.folders || 0)}
										</Typography>
									</Stack>
								</Grid>
								<Grid item xs={4}>
									<Stack spacing={0.5} alignItems="center">
										<Typography variant="caption" color="text.secondary">
											Contactos
										</Typography>
										<Typography variant="body2" sx={{ fontWeight: 500 }}>
											{formatBytes(userStats.storage.contacts || 0)}
										</Typography>
									</Stack>
								</Grid>
								<Grid item xs={4}>
									<Stack spacing={0.5} alignItems="center">
										<Typography variant="caption" color="text.secondary">
											Cálculos
										</Typography>
										<Typography variant="body2" sx={{ fontWeight: 500 }}>
											{formatBytes(userStats.storage.calculators || 0)}
										</Typography>
									</Stack>
								</Grid>
							</Grid>
						</Box>
					</MainCard>
				)}
			</Stack>
		</MainCard>
	);
};

export default StorageWidget;
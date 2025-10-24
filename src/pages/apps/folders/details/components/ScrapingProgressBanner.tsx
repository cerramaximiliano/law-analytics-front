import React, { useEffect, useCallback } from "react";
import { Alert, AlertTitle, Typography, LinearProgress, IconButton, Box, useTheme, Fade } from "@mui/material";
import { Refresh, CloseCircle } from "iconsax-react";
import { ScrapingProgress } from "types/movements";

interface ScrapingProgressBannerProps {
	scrapingProgress?: ScrapingProgress;
	onRefresh: () => void;
	onClose?: () => void;
}

const ScrapingProgressBanner: React.FC<ScrapingProgressBannerProps> = ({ scrapingProgress, onRefresh, onClose }) => {
	const theme = useTheme();

	// Auto-close cuando está completado
	useEffect(() => {
		if (scrapingProgress?.isComplete && scrapingProgress.status === "completed" && onClose) {
			const timer = setTimeout(() => {
				onClose();
			}, 5000);

			return () => clearTimeout(timer);
		}
	}, [scrapingProgress?.isComplete, scrapingProgress?.status, onClose]);

	if (!scrapingProgress) return null;

	const { status, isComplete, totalExpected, totalProcessed } = scrapingProgress;

	// Calcular porcentaje
	const percentage = totalExpected > 0 ? Math.round((totalProcessed / totalExpected) * 100) : 0;

	// Determinar el tipo de alerta y mensaje según el estado
	const getAlertConfig = () => {
		switch (status) {
			case "completed":
				return {
					severity: "success" as const,
					title: "Descarga completada",
					message: `${totalProcessed} movimientos obtenidos`,
					showProgress: false,
					showRefresh: false,
					showClose: true,
				};

			case "in_progress":
				return {
					severity: "info" as const,
					title: "Descargando movimientos MEV",
					message: `${totalProcessed} de ${totalExpected} (${percentage}%)`,
					showProgress: true,
					progressValue: percentage,
					showRefresh: true,
					showClose: false,
				};

			case "partial":
				return {
					severity: "info" as const,
					title: "Esperando respuesta del servidor",
					message: `${totalProcessed} de ${totalExpected} obtenidos`,
					showProgress: true,
					progressValue: undefined, // Indeterminado
					showRefresh: true,
					showClose: false,
				};

			case "error":
				return {
					severity: "info" as const,
					title: "Reconectando con el servidor",
					message: "Reintentando obtener movimientos...",
					showProgress: true,
					progressValue: undefined, // Indeterminado
					showRefresh: true,
					showClose: false,
				};

			case "pending":
			default:
				return {
					severity: "info" as const,
					title: "Iniciando descarga",
					message: "Iniciando descarga de movimientos MEV...",
					showProgress: true,
					progressValue: undefined, // Indeterminado
					showRefresh: false,
					showClose: false,
				};
		}
	};

	const config = getAlertConfig();

	return (
		<Fade in={true}>
			<Alert
				severity={config.severity}
				sx={{
					mb: 2,
					"& .MuiAlert-message": {
						width: "100%",
					},
				}}
				action={
					<Box sx={{ display: "flex", gap: 0.5 }}>
						{config.showRefresh && (
							<IconButton
								color="inherit"
								size="small"
								onClick={onRefresh}
								sx={{
									"&:hover": {
										bgcolor: "rgba(255, 255, 255, 0.1)",
									},
								}}
							>
								<Refresh size={20} />
							</IconButton>
						)}
						{config.showClose && onClose && (
							<IconButton
								color="inherit"
								size="small"
								onClick={onClose}
								sx={{
									"&:hover": {
										bgcolor: "rgba(255, 255, 255, 0.1)",
									},
								}}
							>
								<CloseCircle size={20} />
							</IconButton>
						)}
					</Box>
				}
			>
				<AlertTitle sx={{ mb: config.showProgress ? 1 : 0 }}>{config.title}</AlertTitle>
				<Typography variant="body2" sx={{ mb: config.showProgress ? 1 : 0 }}>
					{config.message}
				</Typography>

				{config.showProgress && (
					<LinearProgress
						variant={config.progressValue !== undefined ? "determinate" : "indeterminate"}
						value={config.progressValue}
						sx={{
							height: 6,
							borderRadius: 1,
							bgcolor: "rgba(255, 255, 255, 0.2)",
							"& .MuiLinearProgress-bar": {
								borderRadius: 1,
								...(config.progressValue === undefined && {
									// Animación pulsante para estados indeterminados
									animation: "pulse 2s ease-in-out infinite",
									"@keyframes pulse": {
										"0%": { opacity: 0.6 },
										"50%": { opacity: 1 },
										"100%": { opacity: 0.6 },
									},
								}),
							},
						}}
					/>
				)}
			</Alert>
		</Fade>
	);
};

export default ScrapingProgressBanner;

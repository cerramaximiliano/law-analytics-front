import React from "react";
// Componente compacto para mostrar carpetas activas vs cerradas
import { useEffect } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Grid, Stack, Typography, CircularProgress } from "@mui/material";
import ReactApexChart from "react-apexcharts";
import MainCard from "components/MainCard";
import { Book } from "iconsax-react";
import { useSelector, dispatch } from "store";
import { getUnifiedStats } from "store/reducers/unifiedStats";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { ThemeMode } from "types/config";

const ActiveFoldersWidget = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === ThemeMode.DARK;

	// Obtener userId del usuario actual
	const user = useSelector((state) => state.auth.user);
	const userId = user?._id;

	// Obtener datos del store unificado
	const { data: unifiedData, isLoading, isInitialized } = useSelector((state) => state.unifiedStats);
	const foldersData = unifiedData?.folders;

	// Cargar datos si no existen
	useEffect(() => {
		if (userId && !isInitialized && !unifiedData?.folders) {
			dispatch(getUnifiedStats(userId, "folders"));
		}
	}, [userId, isInitialized, unifiedData]);

	// Si está cargando y no hay datos
	if (isLoading && !foldersData) {
		return (
			<MainCard>
				<Grid container spacing={2}>
					<Grid item xs={12}>
						<Stack alignItems="center" justifyContent="center" sx={{ minHeight: 180 }}>
							<CircularProgress size={30} />
						</Stack>
					</Grid>
				</Grid>
			</MainCard>
		);
	}

	// Si no hay datos de carpetas
	if (!foldersData?.distribution) {
		return (
			<MainCard>
				<Grid container spacing={2}>
					<Grid item xs={12}>
						<Stack alignItems="center" justifyContent="center" sx={{ minHeight: 180 }}>
							<Typography variant="body2">Sin datos</Typography>
						</Stack>
					</Grid>
				</Grid>
			</MainCard>
		);
	}

	const { nueva, enProceso, cerrada, pendiente } = foldersData.distribution;

	// Carpetas activas = Nueva + En Proceso + Pendiente
	const activas = nueva + enProceso + pendiente;
	const cerradas = cerrada;
	const total = activas + cerradas;

	// Calcular porcentajes
	const activasPercentage = total > 0 ? Math.round((activas / total) * 100) : 0;

	// Datos para el gráfico
	const seriesData = [activas, cerradas];

	// Opciones del gráfico
	const donutChartOptions = {
		chart: {
			id: "active-folders-chart",
			type: "donut" as const,
			sparkline: {
				enabled: true,
			},
		},
		labels: ["Activas", "Cerradas"],
		dataLabels: {
			enabled: false,
		},
		colors: [BRAND_BLUE, theme.palette.grey[400]],
		legend: {
			show: false,
		},
		plotOptions: {
			pie: {
				donut: {
					size: "75%",
					labels: {
						show: false,
					},
				},
				expandOnClick: false,
			},
		},
		tooltip: {
			enabled: true,
			theme: theme.palette.mode,
			y: {
				formatter: (value: number) => {
					return value + " carpetas";
				},
			},
		},
	};

	return (
		<MainCard>
			<Stack spacing={2}>
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
						<Book size={20} variant="Bulk" />
					</Box>
					<Typography variant="subtitle1" sx={{ letterSpacing: "-0.005em" }}>
						Carpetas activas
					</Typography>
				</Stack>
				{/* Contenido — count grande con tabular-nums */}
				<Box sx={{ pt: 1, pb: 0.5 }}>
					<Grid container spacing={3} alignItems="center">
						<Grid item xs={7}>
							<ReactApexChart options={donutChartOptions} series={seriesData} type="donut" height={50} />
						</Grid>
						<Grid item xs={5}>
							<Stack spacing={0.5}>
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
									{activas}
								</Typography>
								<Typography
									variant="caption"
									sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.005em" }}
								>
									{activasPercentage}% del total
								</Typography>
							</Stack>
						</Grid>
					</Grid>
				</Box>
			</Stack>
		</MainCard>
	);
};

export default ActiveFoldersWidget;

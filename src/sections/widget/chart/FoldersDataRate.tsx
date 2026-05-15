import React from "react";
// Componente para mostrar la distribución de carpetas
import { useEffect } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Grid, Stack, Typography, CircularProgress } from "@mui/material";
import ReactApexChart from "react-apexcharts";
import MainCard from "components/MainCard";
import { useSelector, dispatch } from "store";
import { getUnifiedStats } from "store/reducers/unifiedStats";
import { BRAND_BLUE } from "themes/dashboardTokens";

const FoldersDataRate = () => {
	const theme = useTheme();

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
				<Stack alignItems="center" justifyContent="center" spacing={1} sx={{ minHeight: 300 }}>
					<CircularProgress />
				</Stack>
			</MainCard>
		);
	}

	// Si no hay datos de carpetas
	if (!foldersData?.distribution) {
		return (
			<MainCard>
				<Stack alignItems="center" justifyContent="center" spacing={1} sx={{ minHeight: 300 }}>
					<Typography variant="h6">No hay datos disponibles</Typography>
				</Stack>
			</MainCard>
		);
	}

	const { nueva, enProceso, cerrada, pendiente } = foldersData.distribution;
	const total = nueva + enProceso + cerrada + pendiente;

	// Calcular porcentajes
	const nuevaPercentage = total > 0 ? Math.round((nueva / total) * 100) : 0;
	const enProcesoPercentage = total > 0 ? Math.round((enProceso / total) * 100) : 0;
	const cerradaPercentage = total > 0 ? Math.round((cerrada / total) * 100) : 0;
	const pendientePercentage = total > 0 ? Math.round((pendiente / total) * 100) : 0;

	// Datos para el gráfico
	const seriesData = [nueva, enProceso, pendiente, cerrada];

	// Opciones del gráfico
	const donutChartOptions = {
		chart: {
			id: "folders-chart",
			type: "donut" as const,
		},
		labels: ["Nueva", "En Proceso", "Pendiente", "Cerrada"],
		dataLabels: {
			enabled: true,
			formatter: function (val: number) {
				return Math.round(val) + "%";
			},
		},
		// Paleta brand-coherente: BRAND_BLUE es el "nuevo / activo" — vincula el
		// donut al lenguaje del resto del dashboard. El resto mantiene semántica
		// (proceso=warning, pendiente=neutro, cerrada=success).
		colors: [
			BRAND_BLUE, // Nueva
			theme.palette.warning.main, // En proceso
			alpha(theme.palette.text.primary, 0.35), // Pendiente — neutro tintado
			theme.palette.success.main, // Cerrada
		],
		legend: {
			show: true,
			position: "bottom" as const,
		},
		plotOptions: {
			pie: {
				donut: {
					size: "65%",
				},
				expandOnClick: false,
			},
		},
		tooltip: {
			theme: theme.palette.mode,
			y: {
				formatter: (value: number) => {
					return value + " carpetas";
				},
			},
		},
	};

	// Status rows usan los mismos colores que el donut (sync visual con la legend).
	const statusRows = [
		{ label: "Nueva", pct: nuevaPercentage, color: BRAND_BLUE },
		{ label: "En proceso", pct: enProcesoPercentage, color: theme.palette.warning.main },
		{ label: "Pendiente", pct: pendientePercentage, color: alpha(theme.palette.text.primary, 0.35) },
		{ label: "Cerrada", pct: cerradaPercentage, color: theme.palette.success.main },
	];

	return (
		<MainCard>
			<Box sx={{ mb: 2.5 }}>
				<Typography variant="subtitle1" sx={{ letterSpacing: "-0.005em", mb: 0.25 }}>
					Distribución de carpetas
				</Typography>
				<Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "-0.005em" }}>
					Por estado del expediente
				</Typography>
			</Box>

			<Grid container spacing={3} alignItems="center">
				<Grid item xs={12} sm={5}>
					<Stack spacing={2.5}>
						{/* Total — count hero */}
						<Box>
							<Typography
								sx={{
									fontSize: { xs: "1.625rem", md: "1.875rem" },
									fontWeight: 600,
									letterSpacing: "-0.025em",
									fontVariantNumeric: "tabular-nums",
									lineHeight: 1.15,
									color: "text.primary",
								}}
							>
								{total}
							</Typography>
							<Typography variant="caption" color="text.secondary" sx={{ letterSpacing: "-0.005em" }}>
								carpetas totales
							</Typography>
						</Box>

						{/* Status rows — dot + label + percentage */}
						<Stack spacing={1.5}>
							{statusRows.map((s) => (
								<Stack key={s.label} direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
									<Stack direction="row" alignItems="center" spacing={1.25}>
										<Box
											aria-hidden
											sx={{
												width: 8,
												height: 8,
												borderRadius: "50%",
												bgcolor: s.color,
												flexShrink: 0,
											}}
										/>
										<Typography variant="body2" sx={{ letterSpacing: "-0.005em" }}>
											{s.label}
										</Typography>
									</Stack>
									<Typography
										variant="body2"
										sx={{
											fontWeight: 600,
											fontVariantNumeric: "tabular-nums",
											color: "text.secondary",
										}}
									>
										{s.pct}%
									</Typography>
								</Stack>
							))}
						</Stack>
					</Stack>
				</Grid>
				<Grid item xs={12} sm={7}>
					<ReactApexChart options={donutChartOptions} series={seriesData} type="donut" height={280} />
				</Grid>
			</Grid>
		</MainCard>
	);
};

export default FoldersDataRate;

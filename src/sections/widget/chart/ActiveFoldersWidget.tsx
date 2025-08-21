import React from "react";
// Componente compacto para mostrar carpetas activas vs cerradas
import { useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, Grid, Stack, Typography, CircularProgress } from "@mui/material";
import ReactApexChart from "react-apexcharts";
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import { Book } from "iconsax-react";
import { useSelector, dispatch } from "store";
import { getUnifiedStats } from "store/reducers/unifiedStats";

const ActiveFoldersWidget = () => {
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
		colors: [theme.palette.warning.main, theme.palette.grey[400]],
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
			<Grid container spacing={2}>
				<Grid item xs={12}>
					<Stack direction="row" alignItems="center" spacing={2}>
						<Avatar variant="rounded" color="warning">
							<Book />
						</Avatar>
						<Typography variant="subtitle1">Carpetas Activas</Typography>
					</Stack>
				</Grid>
				<Grid item xs={12}>
					<MainCard content={false} border={false} sx={{ bgcolor: "background.default" }}>
						<Box sx={{ p: 3, pb: 1.25 }}>
							<Grid container spacing={3} alignItems="center">
								<Grid item xs={7}>
									<ReactApexChart options={donutChartOptions} series={seriesData} type="donut" height={50} />
								</Grid>
								<Grid item xs={5}>
									<Stack spacing={1}>
										<Typography variant="h5">{activas}</Typography>
										<Typography variant="caption" color="text.secondary">
											{activasPercentage}% del total
										</Typography>
									</Stack>
								</Grid>
							</Grid>
						</Box>
					</MainCard>
				</Grid>
			</Grid>
		</MainCard>
	);
};

export default ActiveFoldersWidget;

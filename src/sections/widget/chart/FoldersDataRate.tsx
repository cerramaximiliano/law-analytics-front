// Componente para mostrar la distribución de carpetas
import { useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { Chip, Grid, Stack, Typography, CircularProgress } from "@mui/material";
import ReactApexChart from "react-apexcharts";
import MainCard from "components/MainCard";
import { useSelector, dispatch } from "store";
import { getUnifiedStats } from "store/reducers/unifiedStats";

const FoldersDataRate = () => {
	const theme = useTheme();

	// Obtener userId del usuario actual
	const user = useSelector((state) => state.auth.user);
	const userId = user?._id;

	// Obtener datos del store unificado
	const { data: unifiedData, isLoading } = useSelector((state) => state.unifiedStats);
	const foldersData = unifiedData?.folders;

	// Cargar datos si no existen
	useEffect(() => {
		if (userId && !unifiedData?.folders) {
			dispatch(getUnifiedStats(userId, "folders"));
		}
	}, [userId, unifiedData]);

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
		colors: [
			theme.palette.info.main, // Nueva - azul info
			theme.palette.warning.main, // En Proceso - naranja
			theme.palette.secondary.main, // Pendiente - secundario
			theme.palette.success.main, // Cerrada - verde
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

	return (
		<MainCard>
			<Typography variant="h5">Distribución de Carpetas</Typography>

			<Grid container spacing={3} sx={{ mt: 1 }}>
				<Grid item xs={12} sm={5}>
					<Stack spacing={2}>
						<Stack spacing={0.5}>
							<Typography variant="subtitle1">Resumen Total</Typography>
							<Typography variant="h4">{total} carpetas</Typography>
						</Stack>

						<Stack spacing={1.5}>
							<Stack direction="row" alignItems="center" justifyContent="space-between">
								<Stack direction="row" spacing={1} alignItems="center">
									<Chip color="info" variant="light" size="small" label="Nueva" />
									<Typography variant="subtitle1">Nueva</Typography>
								</Stack>
								<Typography variant="subtitle2">{nuevaPercentage}%</Typography>
							</Stack>
							<Stack direction="row" alignItems="center" justifyContent="space-between">
								<Stack direction="row" spacing={1} alignItems="center">
									<Chip color="warning" variant="light" size="small" label="En Proceso" />
									<Typography variant="subtitle1">En Proceso</Typography>
								</Stack>
								<Typography variant="subtitle2">{enProcesoPercentage}%</Typography>
							</Stack>
							<Stack direction="row" alignItems="center" justifyContent="space-between">
								<Stack direction="row" spacing={1} alignItems="center">
									<Chip color="secondary" variant="light" size="small" label="Pendiente" />
									<Typography variant="subtitle1">Pendiente</Typography>
								</Stack>
								<Typography variant="subtitle2">{pendientePercentage}%</Typography>
							</Stack>
							<Stack direction="row" alignItems="center" justifyContent="space-between">
								<Stack direction="row" spacing={1} alignItems="center">
									<Chip color="success" variant="light" size="small" label="Cerrada" />
									<Typography variant="subtitle1">Cerrada</Typography>
								</Stack>
								<Typography variant="subtitle2">{cerradaPercentage}%</Typography>
							</Stack>
						</Stack>
					</Stack>
				</Grid>
				<Grid item xs={12} sm={7}>
					<ReactApexChart options={donutChartOptions} series={seriesData} type="donut" height={300} />
				</Grid>
			</Grid>
		</MainCard>
	);
};

export default FoldersDataRate;

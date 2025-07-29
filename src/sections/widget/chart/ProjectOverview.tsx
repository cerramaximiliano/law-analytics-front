// MUESTRA DATOS DE TENDENCIA MOVIMIENTOS Y CARPETAS

import { useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, CircularProgress, Stack, Typography, Chip } from "@mui/material";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import MainCard from "components/MainCard";
import { useSelector, dispatch } from "store";
import { getUnifiedStats } from "store/reducers/unifiedStats";

const ProjectOverview = () => {
	const theme = useTheme();

	// Obtener userId del usuario actualmente autenticado
	const user = useSelector((state) => state.auth.user);
	const userId = user?._id;

	// Obtener datos del store unificado
	const { data: unifiedData, isLoading, isInitialized } = useSelector((state) => state.unifiedStats);
	const trendsData = unifiedData?.dashboard?.trends || null;

	useEffect(() => {
		if (userId && !isInitialized && !unifiedData?.dashboard) {
			dispatch(getUnifiedStats(userId, "dashboard"));
		}
	}, [userId, isInitialized, unifiedData]);

	if (isLoading && !trendsData) {
		return (
			<MainCard>
				<Stack alignItems="center" justifyContent="center" spacing={1} sx={{ minHeight: 380 }}>
					<CircularProgress />
				</Stack>
			</MainCard>
		);
	}

	if (!trendsData || !trendsData.newFolders || !trendsData.movements) {
		return (
			<MainCard>
				<Stack alignItems="center" justifyContent="center" spacing={1} sx={{ minHeight: 380 }}>
					<Typography variant="h6">No hay datos de tendencias disponibles</Typography>
				</Stack>
			</MainCard>
		);
	}

	// Procesar las fechas para las categorías del eje X
	const categories = trendsData.newFolders.map((item) => {
		const date = new Date(item.month);
		return date.toLocaleDateString("es-AR", { month: "short", year: "2-digit" });
	});

	// Configuración del gráfico
	const chartOptions: ApexOptions = {
		chart: {
			height: 310,
			type: "area",
			toolbar: {
				show: false,
			},
			zoom: {
				enabled: false,
			},
		},
		colors: [theme.palette.primary.main, theme.palette.warning.main],
		dataLabels: {
			enabled: false,
		},
		stroke: {
			curve: "smooth",
			width: 2,
		},
		grid: {
			strokeDashArray: 0,
			borderColor: theme.palette.divider,
		},
		xaxis: {
			categories: categories,
			axisBorder: {
				show: false,
			},
			axisTicks: {
				show: false,
			},
		},
		yaxis: {
			labels: {
				formatter: (value) => Math.round(value).toString(),
			},
			min: 0,
		},
		tooltip: {
			theme: theme.palette.mode,
			x: {
				show: true,
			},
		},
		legend: {
			position: "top",
			horizontalAlign: "left",
			offsetY: -20,
		},
		fill: {
			type: "gradient",
			gradient: {
				shadeIntensity: 1,
				type: "vertical",
				opacityFrom: 0.5,
				opacityTo: 0,
			},
		},
	};

	// Datos para el gráfico de área
	const chartData = [
		{
			name: "Nuevas Carpetas",
			data: trendsData.newFolders.map((item) => item.count),
		},
		{
			name: "Movimientos",
			data: trendsData.movements.map((item) => item.count),
		},
	];

	return (
		<MainCard>
			<Typography variant="h5">Tendencias Mensuales</Typography>

			<Stack spacing={2} sx={{ mt: 2 }}>
				<Stack direction="row" spacing={1}>
					<Chip color="primary" variant="light" size="small" label="Nuevas Carpetas" />
					<Chip color="warning" variant="light" size="small" label="Movimientos" />
				</Stack>
				<Box sx={{ pt: 1 }}>
					<ReactApexChart options={chartOptions} series={chartData} type="area" height={310} />
				</Box>
			</Stack>
		</MainCard>
	);
};

export default ProjectOverview;

// MUESTRA DATOS DE TENDENCIA MOVIMIENTOS Y CARPETAS

import { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, CircularProgress, ListItemButton, Menu, Stack, Typography, Chip } from "@mui/material";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";
import MainCard from "components/MainCard";
import IconButton from "components/@extended/IconButton";
import { More } from "iconsax-react";
import StatsService from "store/reducers/ApiService";
import { useSelector } from "store";

interface TrendEntry {
	month: string;
	count: number;
}

interface TrendsData {
	newFolders: TrendEntry[];
	movements: TrendEntry[];
}

const ProjectOverview = () => {
	const theme = useTheme();
	const [loading, setLoading] = useState(true);
	const [trendsData, setTrendsData] = useState<TrendsData | null>(null);

	const [anchorEl, setAnchorEl] = useState(null);

	const open = Boolean(anchorEl);

	// Obtener userId del usuario actualmente autenticado
	const user = useSelector((state) => state.auth.user);
	const userId = user?._id;

	useEffect(() => {
		const fetchTrendsData = async () => {
			try {
				setLoading(true);
				const dashboardData = await StatsService.getDashboardSummary(userId);
				setTrendsData(dashboardData.trends);
			} catch (error) {
				console.error("Error fetching trends data:", error);
			} finally {
				setLoading(false);
			}
		};

		fetchTrendsData();
	}, [userId]);

	const handleClick = (event: any) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	if (loading) {
		return (
			<MainCard>
				<Stack alignItems="center" justifyContent="center" spacing={1} sx={{ minHeight: 300 }}>
					<CircularProgress />
				</Stack>
			</MainCard>
		);
	}

	if (!trendsData || !trendsData.newFolders || !trendsData.movements) {
		return (
			<MainCard>
				<Stack alignItems="center" justifyContent="center" spacing={1} sx={{ minHeight: 300 }}>
					<Typography variant="h6">No hay datos de tendencias disponibles</Typography>
				</Stack>
			</MainCard>
		);
	}

	// Opciones para el gráfico de área
	const areaChartOptions: ApexOptions = {
		chart: {
			id: "trends-chart",
			type: "area",
			height: 315, // Reducido para dar más espacio a las leyendas
			toolbar: {
				show: false,
			},
			parentHeightOffset: 0, // Aumentar el padding superior del gráfico
		},
		colors: [theme.palette.primary.main, theme.palette.success.main],
		dataLabels: {
			enabled: false,
		},
		stroke: {
			curve: "smooth",
			width: 2,
		},
		grid: {
			strokeDashArray: 3,
			borderColor: theme.palette.divider,
		},
		xaxis: {
			categories: trendsData.newFolders.map((item) => item.month),
			axisBorder: {
				show: false,
			},
			axisTicks: {
				show: false,
			},
		},
		yaxis: {
			labels: {
				formatter: (value: number) => Math.round(value).toString(),
			},
		},
		// Desactivar las leyendas integradas de ApexCharts
		legend: {
			show: false,
		},
		tooltip: {
			theme: theme.palette.mode,
			shared: true,
		},
		fill: {
			type: "gradient",
			gradient: {
				shadeIntensity: 1,
				type: "vertical",
				inverseColors: false,
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
			<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1}>
				<Typography variant="h5">Tendencias Mensuales</Typography>
				<IconButton
					color="secondary"
					id="trends-button"
					aria-controls={open ? "trends-menu" : undefined}
					aria-haspopup="true"
					aria-expanded={open ? "true" : undefined}
					onClick={handleClick}
				>
					<More />
				</IconButton>
				<Menu
					id="trends-menu"
					anchorEl={anchorEl}
					open={open}
					onClose={handleClose}
					MenuListProps={{
						"aria-labelledby": "trends-button",
						sx: { p: 1.25, minWidth: 150 },
					}}
					anchorOrigin={{
						vertical: "bottom",
						horizontal: "right",
					}}
					transformOrigin={{
						vertical: "top",
						horizontal: "right",
					}}
				>
					<ListItemButton onClick={handleClose}>Actualizar</ListItemButton>
				</Menu>
			</Stack>

			{/* Leyendas personalizadas fuera del gráfico */}
			{/* Leyendas personalizadas con mejor contraste */}
			<Stack direction="row" spacing={2} justifyContent="center" sx={{ mt: 1, mb: 1 }}>
				<Chip
					label="Nuevas Carpetas"
					size="small"
					sx={{
						bgcolor: "transparent", // Fondo transparente
						color: theme.palette.primary.main, // Color de texto = color de la línea
						border: `1px solid ${theme.palette.primary.main}`,
						fontWeight: "medium",
						"& .MuiChip-label": { px: 1.5 },
					}}
				/>
				<Chip
					label="Movimientos"
					size="small"
					sx={{
						bgcolor: "transparent", // Fondo transparente
						color: theme.palette.success.main, // Color de texto = color de la línea
						border: `1px solid ${theme.palette.success.main}`,
						fontWeight: "medium",
						"& .MuiChip-label": { px: 1.5 },
					}}
				/>
			</Stack>
			<Box sx={{ mt: 1 }}>
				<ReactApexChart options={areaChartOptions} series={chartData} type="area" height={315} />
			</Box>
		</MainCard>
	);
};

export default ProjectOverview;

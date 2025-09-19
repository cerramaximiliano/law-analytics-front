import { Typography, Box, CircularProgress, useTheme } from "@mui/material";
import { useSelector } from "react-redux";
import ReactApexChart from "react-apexcharts";
import { RootState } from "store";
import MainCard from "components/MainCard";

const FoldersByMatter = () => {
	const theme = useTheme();
	const { data, isLoading } = useSelector((state: RootState) => state.unifiedStats);

	// Try to get matters distribution from multiple possible locations
	const foldersByMatter = data?.matters?.distribution || data?.folders?.byMatter?.distribution || {};

	console.log("📊 [FoldersByMatter] data:", data);
	console.log("📊 [FoldersByMatter] matters from data.matters:", data?.matters);
	console.log("📊 [FoldersByMatter] matters from folders.byMatter:", data?.folders?.byMatter);
	console.log("📊 [FoldersByMatter] final distribution:", foldersByMatter);

	// Prepare data for bar chart - ensure count is a number and sort by count
	const chartData = Object.entries(foldersByMatter)
		.filter(([_, count]) => count != null && count !== undefined)
		.map(([matter, count]) => ({
			matter: matter || "Sin asunto",
			count: typeof count === "number" ? count : Number(count) || 0,
		}))
		.sort((a, b) => b.count - a.count)
		.slice(0, 10); // Show top 10

	console.log("📊 [FoldersByMatter] chartData:", chartData);

	const categories = chartData.map(item => {
		// Truncate long names for better display
		return item.matter.length > 30 ? item.matter.substring(0, 30) + "..." : item.matter;
	});
	const seriesData = chartData.map(item => item.count);

	const series = [
		{
			name: "Carpetas",
			data: seriesData,
		},
	];

	const chartOptions = {
		chart: {
			type: "bar" as const,
			toolbar: {
				show: false,
			},
		},
		plotOptions: {
			bar: {
				borderRadius: 4,
				horizontal: true,
				distributed: true,
				barHeight: '70%',
				dataLabels: {
					position: 'top',
				},
			},
		},
		colors: [
			theme.palette.primary.main,
			theme.palette.primary.dark,
			theme.palette.primary.light,
			theme.palette.secondary.main,
			theme.palette.secondary.light,
			theme.palette.info.main,
			theme.palette.info.light,
			theme.palette.success.main,
			theme.palette.warning.main,
			theme.palette.error.light,
		],
		dataLabels: {
			enabled: true,
			offsetX: 8,
			style: {
				fontSize: "12px",
				colors: [theme.palette.text.primary],
			},
			formatter: function (val: number) {
				return val + " carpetas";
			},
		},
		grid: {
			borderColor: theme.palette.divider,
			strokeDashArray: 5,
			xaxis: {
				lines: {
					show: true,
				},
			},
			yaxis: {
				lines: {
					show: false,
				},
			},
		},
		xaxis: {
			categories: categories,
			labels: {
				style: {
					colors: theme.palette.text.secondary,
				},
			},
		},
		yaxis: {
			labels: {
				style: {
					colors: theme.palette.text.secondary,
				},
			},
		},
		tooltip: {
			theme: theme.palette.mode,
			y: {
				formatter: function (val: number) {
					return val + " carpetas";
				},
			},
		},
		legend: {
			show: false,
		},
	};

	return (
		<MainCard>
			<Typography variant="h4" sx={{ mb: 2 }}>
				Carpetas por Asunto
			</Typography>
			{isLoading ? (
				<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
					<CircularProgress />
				</Box>
			) : chartData.length > 0 ? (
				<ReactApexChart options={chartOptions} series={series} type="bar" height={350} />
			) : (
				<Box sx={{ textAlign: "center", py: 8 }}>
					<Typography variant="body1" color="textSecondary">
						No hay datos disponibles
					</Typography>
				</Box>
			)}
		</MainCard>
	);
};

export default FoldersByMatter;

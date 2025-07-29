import { Typography, Box, CircularProgress } from "@mui/material";
import { useSelector } from "react-redux";
import { useTheme } from "@mui/material/styles";
import ReactApexChart from "react-apexcharts";
import { RootState } from "store";
import MainCard from "components/MainCard";

const FolderClosingTrends = () => {
	const theme = useTheme();
	const { data, isLoading } = useSelector((state: RootState) => state.unifiedStats);

	const closedFoldersTrend = data?.dashboard?.trends?.closedFolders || [];
	const newFoldersTrend = data?.dashboard?.trends?.newFolders || [];

	const categories = closedFoldersTrend.map((item) => item.month);
	const series = [
		{
			name: "Carpetas Cerradas",
			type: "column" as const,
			data: closedFoldersTrend.map((item) => item.count),
		},
		{
			name: "Carpetas Nuevas",
			type: "line" as const,
			data: newFoldersTrend.map((item) => item.count),
		},
	];

	const chartOptions = {
		chart: {
			type: "line" as const,
			toolbar: {
				show: false,
			},
		},
		stroke: {
			width: [0, 4],
		},
		dataLabels: {
			enabled: true,
			enabledOnSeries: [1],
		},
		labels: categories,
		xaxis: {
			type: "category" as const,
		},
		yaxis: [
			{
				title: {
					text: "Carpetas Cerradas",
				},
			},
			{
				opposite: true,
				title: {
					text: "Tasa de Cierre (%)",
				},
			},
		],
		colors: [theme.palette.primary.main, theme.palette.success.main],
		plotOptions: {
			bar: {
				columnWidth: "50%",
				borderRadius: 4,
			},
		},
		legend: {
			position: "top" as const,
		},
	};

	return (
		<MainCard>
			<Typography variant="h4" sx={{ mb: 2 }}>
				Tendencias de Cierre de Carpetas
			</Typography>
			{isLoading ? (
				<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
					<CircularProgress />
				</Box>
			) : categories.length > 0 ? (
				<ReactApexChart options={chartOptions} series={series} type="line" height={350} />
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

export default FolderClosingTrends;

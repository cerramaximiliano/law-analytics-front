import { Typography, Box, CircularProgress } from "@mui/material";
import { useSelector } from "react-redux";
import { useTheme } from "@mui/material/styles";
import ReactApexChart from "react-apexcharts";
import { RootState } from "store";
import MainCard from "components/MainCard";

const FoldersByMatter = () => {
	const theme = useTheme();
	const { data, isLoading } = useSelector((state: RootState) => state.unifiedStats);

	const foldersByMatter = data?.matters?.distribution || {};

	// Prepare data for treemap
	const treeMapData = Object.entries(foldersByMatter).map(([matter, count]) => ({
		x: matter,
		y: count,
	}));

	const series = [
		{
			data: treeMapData,
		},
	];

	const chartOptions = {
		chart: {
			type: "treemap" as const,
			toolbar: {
				show: false,
			},
		},
		title: {
			text: undefined,
		},
		dataLabels: {
			enabled: true,
			style: {
				fontSize: "12px",
			},
			formatter: function (text: string, op: any) {
				return text + ": " + op.value;
			},
			offsetY: -4,
		},
		plotOptions: {
			treemap: {
				enableShades: false,
				shadeIntensity: 0.5,
				reverseNegativeShade: true,
				colorScale: {
					ranges: [
						{
							from: 0,
							to: 10,
							color: theme.palette.primary.lighter,
						},
						{
							from: 10,
							to: 30,
							color: theme.palette.primary.light,
						},
						{
							from: 30,
							to: 100,
							color: theme.palette.primary.main,
						},
					],
				},
			},
		},
		tooltip: {
			y: {
				formatter: function (val: number) {
					return val + " carpetas";
				},
			},
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
			) : treeMapData.length > 0 ? (
				<ReactApexChart options={chartOptions} series={series} type="treemap" height={350} />
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

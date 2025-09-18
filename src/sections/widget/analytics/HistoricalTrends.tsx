import React, { useState } from "react";
import { Typography, Box, CircularProgress, Tabs, Tab, useTheme, Stack, Chip } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "store";
import MainCard from "components/MainCard";
import ReactApexChart from "react-apexcharts";
import { ApexOptions } from "apexcharts";

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

const TabPanel = (props: TabPanelProps) => {
	const { children, value, index, ...other } = props;
	return (
		<div role="tabpanel" hidden={value !== index} {...other}>
			{value === index && <Box sx={{ pt: 2 }}>{children}</Box>}
		</div>
	);
};

const HistoricalTrends = () => {
	const theme = useTheme();
	const { data, isLoading } = useSelector((state: RootState) => state.unifiedStats);
	const [tabValue, setTabValue] = useState(0);

	// Obtener las tendencias
	const trends = {
		tasks: data?.dashboard?.trends?.tasks || [],
		newFolders: data?.dashboard?.trends?.newFolders || data?.activity?.trends?.newFolders || [],
		closedFolders: data?.dashboard?.trends?.closedFolders || data?.activity?.trends?.closedFolders || [],
		movements: data?.dashboard?.trends?.movements || data?.activity?.trends?.movements || [],
		calculators: data?.dashboard?.trends?.calculators || data?.activity?.trends?.calculators || [],
		deadlines: data?.dashboard?.trends?.deadlines || [],
	};

	// Función para preparar datos del gráfico
	const prepareChartData = (trendData: any[]) => {
		const limitedData = trendData.slice(0, 6).reverse(); // Últimos 6 meses, orden cronológico
		return {
			categories: limitedData.map((item) => item.month || ""),
			data: limitedData.map((item) => item.count || 0),
		};
	};

	// Configuración base del gráfico
	const getChartOptions = (categories: string[], color: string): ApexOptions => ({
		chart: {
			type: "line",
			toolbar: { show: false },
			zoom: { enabled: false },
		},
		colors: [color],
		dataLabels: { enabled: false },
		stroke: {
			curve: "smooth",
			width: 3,
		},
		markers: {
			size: 4,
			strokeWidth: 2,
			hover: { size: 6 },
		},
		grid: {
			borderColor: theme.palette.divider,
			strokeDashArray: 5,
		},
		xaxis: {
			categories,
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
		},
	});

	// Datos de cada tendencia
	const trendCharts = [
		{
			title: "Tareas Creadas",
			data: trends.tasks,
			color: theme.palette.primary.main,
			count: trends.tasks.length,
		},
		{
			title: "Carpetas Nuevas",
			data: trends.newFolders,
			color: theme.palette.success.main,
			count: trends.newFolders.length,
		},
		{
			title: "Carpetas Cerradas",
			data: trends.closedFolders,
			color: theme.palette.info.main,
			count: trends.closedFolders.length,
		},
		{
			title: "Movimientos",
			data: trends.movements,
			color: theme.palette.warning.main,
			count: trends.movements.length,
		},
		{
			title: "Calculadoras",
			data: trends.calculators,
			color: theme.palette.secondary.main,
			count: trends.calculators.length,
		},
		{
			title: "Plazos Vencidos",
			data: trends.deadlines,
			color: theme.palette.error.main,
			count: trends.deadlines.length,
		},
	];

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setTabValue(newValue);
	};

	return (
		<MainCard>
			<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
				<Typography variant="h4">Tendencias Históricas</Typography>
				<Typography variant="body2" color="text.secondary">
					Últimos 6 meses
				</Typography>
			</Box>

			{isLoading ? (
				<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
					<CircularProgress />
				</Box>
			) : (
				<>
					<Tabs
						value={tabValue}
						onChange={handleTabChange}
						variant="scrollable"
						scrollButtons="auto"
						sx={{
							borderBottom: 1,
							borderColor: "divider",
							"& .MuiTab-root": {
								minHeight: 48,
								textTransform: "none",
							},
						}}
					>
						{trendCharts.map((chart, index) => (
							<Tab
								key={index}
								label={
									<Stack direction="row" spacing={1} alignItems="center">
										<Typography variant="body2">{chart.title}</Typography>
										{chart.count > 0 && (
											<Chip label={chart.count} size="small" color="default" />
										)}
									</Stack>
								}
								disabled={chart.count === 0}
							/>
						))}
					</Tabs>

					{trendCharts.map((chart, index) => {
						const chartData = prepareChartData(chart.data);
						return (
							<TabPanel key={index} value={tabValue} index={index}>
								{chart.count > 0 ? (
									<Box sx={{ mt: 2 }}>
										<ReactApexChart
											options={getChartOptions(chartData.categories, chart.color)}
											series={[{ name: chart.title, data: chartData.data }]}
											type="line"
											height={250}
										/>
										<Box sx={{ mt: 2, display: "flex", justifyContent: "space-between", px: 2 }}>
											<Typography variant="caption" color="text.secondary">
												Total en período: {chartData.data.reduce((a, b) => a + b, 0)}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												Promedio mensual: {(chartData.data.reduce((a, b) => a + b, 0) / chartData.data.length).toFixed(1)}
											</Typography>
										</Box>
									</Box>
								) : (
									<Box sx={{ py: 4, textAlign: "center" }}>
										<Typography variant="body2" color="text.secondary">
											No hay datos disponibles para {chart.title.toLowerCase()}
										</Typography>
									</Box>
								)}
							</TabPanel>
						);
					})}
				</>
			)}
		</MainCard>
	);
};

export default HistoricalTrends;
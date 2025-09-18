import React from "react";
import { Typography, Box, CircularProgress, Stack, Tooltip, IconButton } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "store";
import MainCard from "components/MainCard";
import { Calendar, DocumentText, DollarCircle, Folder, InfoCircle } from "iconsax-react";

const DailyWeeklyActivity = () => {
	const { data, isLoading, descriptions } = useSelector((state: RootState) => state.unifiedStats);

	// Get the actual data from the API response
	const totalFolders = data?.dashboard?.folders?.total || 0;
	const totalTasks = (data?.tasks?.metrics?.pendingTasks || 0) + (data?.tasks?.metrics?.completedTasks || 0) + (data?.tasks?.metrics?.overdueTasks || 0);

	// Calculate total movements from trends (sum of all movements in the last 6 months)
	const movementsTrend = data?.dashboard?.trends?.movements || [];
	const totalMovements = movementsTrend.reduce((sum: number, item: any) => sum + (item.count || 0), 0);

	// Get activity metrics from the correct location
	const dailyAverage = data?.activity?.metrics?.dailyAverage || 0;
	const weeklyAverage = data?.activity?.metrics?.weeklyAverage || 0;
	const mostActiveDay = data?.activity?.metrics?.mostActiveDay || "N/A";

	const activityMetrics = [
		{
			label: "Total Carpetas",
			value: totalFolders,
			icon: <Folder size={24} />,
			color: "#1890ff",
			description: descriptions?.dashboard?.folders?.total,
		},
		{
			label: "Total Tareas",
			value: totalTasks,
			icon: <DocumentText size={24} />,
			color: "#52c41a",
			description: "Total de tareas en el sistema (pendientes + completadas + vencidas)",
		},
		{
			label: "Promedio Diario",
			value: dailyAverage.toFixed(1),
			icon: <Calendar size={24} />,
			color: "#faad14",
			description: descriptions?.activity?.metrics?.dailyAverage,
		},
		{
			label: "Día Más Activo",
			value: mostActiveDay,
			icon: <DollarCircle size={24} />,
			color: "#722ed1",
			description: descriptions?.activity?.metrics?.mostActiveDay,
		},
	];

	return (
		<MainCard>
			<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
				<Typography variant="h4">Métricas de Actividad</Typography>
				{descriptions?.activity?.metrics && (
					<Tooltip title="Resumen de la actividad general en el sistema" arrow placement="top">
						<IconButton size="small" sx={{ p: 0.5 }}>
							<InfoCircle size={16} color="#8c8c8c" />
						</IconButton>
					</Tooltip>
				)}
			</Box>
			{isLoading ? (
				<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
					<CircularProgress />
				</Box>
			) : (
				<Stack spacing={2}>
					{activityMetrics.map((metric) => (
						<Box
							key={metric.label}
							sx={{
								display: "flex",
								alignItems: "center",
								justifyContent: "space-between",
								p: 2,
								borderRadius: 2,
								bgcolor: "grey.50",
								"&:hover": {
									bgcolor: "grey.100",
								},
							}}
						>
							<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
								<Box sx={{ color: metric.color }}>{metric.icon}</Box>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
									<Typography variant="body1">{metric.label}</Typography>
									{metric.description && (
										<Tooltip title={metric.description} arrow placement="top">
											<IconButton size="small" sx={{ p: 0.25 }}>
												<InfoCircle size={14} color="#8c8c8c" />
											</IconButton>
										</Tooltip>
									)}
								</Box>
							</Box>
							<Typography variant="h6" fontWeight="bold">
								{metric.value}
							</Typography>
						</Box>
					))}
				</Stack>
			)}
		</MainCard>
	);
};

export default DailyWeeklyActivity;

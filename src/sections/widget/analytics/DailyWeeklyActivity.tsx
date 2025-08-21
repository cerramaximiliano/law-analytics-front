import React from "react";
import { Typography, Box, CircularProgress, Stack } from "@mui/material";
import { useSelector } from "react-redux";
import { RootState } from "store";
import MainCard from "components/MainCard";
import { Calendar, DocumentText, DollarCircle, Folder } from "iconsax-react";

const DailyWeeklyActivity = () => {
	const { data, isLoading } = useSelector((state: RootState) => state.unifiedStats);

	// Get the actual activity metrics from the API
	const metrics = data?.activity?.metrics;
	const totalFolders = metrics?.totalFolders || 0;
	const totalTasks = metrics?.totalTasks || 0;
	const totalMovements = metrics?.totalMovements || 0;
	const lastActivityDate = metrics?.lastActivityDate ? new Date(metrics.lastActivityDate).toLocaleString("es-AR") : "N/A";

	const activityMetrics = [
		{
			label: "Total Carpetas",
			value: totalFolders,
			icon: <Folder size={24} />,
			color: "#1890ff",
		},
		{
			label: "Total Tareas",
			value: totalTasks,
			icon: <DocumentText size={24} />,
			color: "#52c41a",
		},
		{
			label: "Total Movimientos",
			value: totalMovements,
			icon: <DollarCircle size={24} />,
			color: "#faad14",
		},
		{
			label: "Última Actividad",
			value: lastActivityDate,
			icon: <Calendar size={24} />,
			color: "#722ed1",
		},
	];

	return (
		<MainCard>
			<Typography variant="h4" sx={{ mb: 3 }}>
				Métricas de Actividad
			</Typography>
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
								<Typography variant="body1">{metric.label}</Typography>
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

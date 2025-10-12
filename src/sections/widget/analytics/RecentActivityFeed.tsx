import React from "react";
import { Typography, Box, CircularProgress, Stack, Paper } from "@mui/material";
import { useSelector } from "react-redux";
import { Activity, Clock, Calendar } from "iconsax-react";
import { RootState } from "store";
import MainCard from "components/MainCard";
import dayjs from "utils/dayjs-config";
import { useTheme } from "@mui/material/styles";

const RecentActivityFeed = () => {
	const theme = useTheme();
	const { data, isLoading, lastUpdated } = useSelector((state: RootState) => state.unifiedStats);

	// Get dashboard trends data to show recent activity summary
	const trends = data?.dashboard?.trends || {};
	const tasksLastMonth = trends.tasks?.[0]?.count || 0;
	const foldersLastMonth = trends.newFolders?.[0]?.count || 0;
	const closedFoldersLastMonth = trends.closedFolders?.[0]?.count || 0;

	const activitySummary = [
		{
			title: "Tareas Último Mes",
			value: tasksLastMonth,
			icon: <Activity size={20} />,
			color: theme.palette.primary.main,
		},
		{
			title: "Carpetas Nuevas",
			value: foldersLastMonth,
			icon: <Calendar size={20} />,
			color: theme.palette.success.main,
		},
		{
			title: "Carpetas Cerradas",
			value: closedFoldersLastMonth,
			icon: <Clock size={20} />,
			color: theme.palette.info.main,
		},
	];

	return (
		<MainCard>
			<Typography variant="h4" sx={{ mb: 2 }}>
				Resumen de Actividad
			</Typography>
			{isLoading ? (
				<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
					<CircularProgress />
				</Box>
			) : (
				<Stack spacing={2}>
					{activitySummary.map((item, index) => (
						<Paper
							key={index}
							sx={{
								p: 2,
								background: theme.palette.background.paper,
								border: `1px solid ${theme.palette.divider}`,
							}}
							elevation={0}
						>
							<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
								<Box sx={{ display: "flex", alignItems: "center", gap: 1.5 }}>
									<Box sx={{ color: item.color }}>{item.icon}</Box>
									<Typography variant="body2" color="textSecondary">
										{item.title}
									</Typography>
								</Box>
								<Typography variant="h5" sx={{ fontWeight: 600, color: item.color }}>
									{item.value}
								</Typography>
							</Box>
						</Paper>
					))}
					{lastUpdated && (
						<Box sx={{ mt: 2, pt: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
							<Typography variant="caption" color="textSecondary">
								Última actualización: {dayjs(lastUpdated).format("DD/MM/YYYY HH:mm")}
							</Typography>
						</Box>
					)}
				</Stack>
			)}
		</MainCard>
	);
};

export default RecentActivityFeed;

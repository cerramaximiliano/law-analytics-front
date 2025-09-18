import React from "react";
import { CardContent, Typography, Box, CircularProgress, Stack, Tooltip, IconButton } from "@mui/material";
import { useSelector } from "react-redux";
import { useTheme } from "@mui/material/styles";
import { TaskSquare, InfoCircle } from "iconsax-react";
import { RootState } from "store";
import MainCard from "components/MainCard";

const TaskDistributionByPriority = () => {
	const theme = useTheme();
	const { data, isLoading, descriptions } = useSelector((state: RootState) => state.unifiedStats);

	// Get task metrics from the API
	const taskMetrics = data?.tasks?.metrics;
	const pendingTasks = taskMetrics?.pendingTasks || 0;
	const completedTasks = taskMetrics?.completedTasks || 0;
	const overdueTasks = taskMetrics?.overdueTasks || 0;
	const completionRate = taskMetrics?.completionRate || 0;
	const description = descriptions?.tasks?.metrics?.pendingTasks;

	const totalTasks = pendingTasks + completedTasks + overdueTasks;

	return (
		<MainCard content={false}>
			<CardContent>
				<Stack spacing={2}>
					<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Box>
								<Typography variant="h6" color="textSecondary">
									Estado de Tareas
								</Typography>
								<Typography variant="body2" color="textSecondary">
									Total: {totalTasks}
								</Typography>
							</Box>
							{description && (
								<Tooltip title={description} arrow placement="top">
									<IconButton size="small" sx={{ p: 0.5 }}>
										<InfoCircle size={16} color="#8c8c8c" />
									</IconButton>
								</Tooltip>
							)}
						</Box>
						<TaskSquare size={32} color={theme.palette.primary.main} />
					</Box>
					{isLoading ? (
						<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
							<CircularProgress size={24} />
						</Box>
					) : (
						<>
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Box
									sx={{
										height: 12,
										borderRadius: 1,
										flex: 1,
										background: `linear-gradient(to right, ${theme.palette.success.main} ${completionRate}%, ${theme.palette.grey[300]} ${completionRate}%)`,
									}}
								/>
								<Typography variant="h5" color="primary">
									{completionRate.toFixed(0)}%
								</Typography>
							</Box>
							<Stack spacing={1} sx={{ mt: 1 }}>
								<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
									<Typography variant="body2" color="textSecondary">
										Completadas
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.success.main }}>
										{completedTasks}
									</Typography>
								</Box>
								<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
									<Typography variant="body2" color="textSecondary">
										Pendientes
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.warning.main }}>
										{pendingTasks}
									</Typography>
								</Box>
								<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
									<Typography variant="body2" color="textSecondary">
										Vencidas
									</Typography>
									<Typography variant="body2" sx={{ fontWeight: 600, color: theme.palette.error.main }}>
										{overdueTasks}
									</Typography>
								</Box>
							</Stack>
						</>
					)}
				</Stack>
			</CardContent>
		</MainCard>
	);
};

export default TaskDistributionByPriority;

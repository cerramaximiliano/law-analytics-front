import React from "react";
import { CardContent, Typography, Box, CircularProgress, Stack, LinearProgress, Tooltip, IconButton } from "@mui/material";
import { useSelector } from "react-redux";
import { TaskSquare, InfoCircle } from "iconsax-react";
import { RootState } from "store";
import MainCard from "components/MainCard";

const TaskCompletionRate = () => {
	const { data, isLoading, descriptions } = useSelector((state: RootState) => state.unifiedStats);
	const completionRate = data?.tasks?.metrics?.completionRate || data?.tasks?.completionRate || 0;
	const description = descriptions?.tasks?.metrics?.completionRate;

	return (
		<MainCard content={false}>
			<CardContent>
				<Stack spacing={2}>
					<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Box>
								<Typography variant="h6" color="textSecondary">
									Tasa de Completado
								</Typography>
								<Typography variant="body2" color="textSecondary">
									Tareas completadas
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
						<TaskSquare size={32} color="#52c41a" />
					</Box>
					{isLoading ? (
						<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
							<CircularProgress size={24} />
						</Box>
					) : (
						<>
							<Typography variant="h3" color="success.main">
								{completionRate.toFixed(1)}%
							</Typography>
							<LinearProgress
								variant="determinate"
								value={completionRate}
								sx={{
									height: 8,
									borderRadius: 1,
									"& .MuiLinearProgress-bar": {
										borderRadius: 1,
									},
								}}
								color="success"
							/>
						</>
					)}
				</Stack>
			</CardContent>
		</MainCard>
	);
};

export default TaskCompletionRate;

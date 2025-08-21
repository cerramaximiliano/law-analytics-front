import React from "react";
import { Typography, Box, CircularProgress, Stack, LinearProgress } from "@mui/material";
import { useSelector } from "react-redux";
import { Notification } from "iconsax-react";
import { RootState } from "store";
import MainCard from "components/MainCard";

const NotificationStatus = () => {
	const { data, isLoading } = useSelector((state: RootState) => state.unifiedStats);
	const unreadCount = data?.notifications?.unreadCount || 0;
	const totalCount = data?.dashboard?.notifications?.total || 100; // Default to 100 if not available
	const readCount = totalCount - unreadCount;

	const readPercentage = totalCount > 0 ? (readCount / totalCount) * 100 : 0;
	const unreadPercentage = totalCount > 0 ? (unreadCount / totalCount) * 100 : 0;

	return (
		<MainCard>
			<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
				<Typography variant="h4">Estado de Notificaciones</Typography>
				<Notification size={24} />
			</Box>
			{isLoading ? (
				<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
					<CircularProgress />
				</Box>
			) : (
				<Stack spacing={3}>
					<Box>
						<Typography variant="h2" color="primary" gutterBottom>
							{totalCount}
						</Typography>
						<Typography variant="body2" color="textSecondary">
							Notificaciones totales
						</Typography>
					</Box>

					<Stack spacing={2}>
						<Box>
							<Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
								<Typography variant="body2">Leídas</Typography>
								<Typography variant="body2" color="success.main">
									{readCount} ({readPercentage.toFixed(0)}%)
								</Typography>
							</Box>
							<LinearProgress
								variant="determinate"
								value={readPercentage}
								sx={{
									height: 8,
									borderRadius: 1,
									backgroundColor: "grey.200",
									"& .MuiLinearProgress-bar": {
										borderRadius: 1,
										backgroundColor: "success.main",
									},
								}}
							/>
						</Box>

						<Box>
							<Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
								<Typography variant="body2">No leídas</Typography>
								<Typography variant="body2" color="warning.main">
									{unreadCount} ({unreadPercentage.toFixed(0)}%)
								</Typography>
							</Box>
							<LinearProgress
								variant="determinate"
								value={unreadPercentage}
								sx={{
									height: 8,
									borderRadius: 1,
									backgroundColor: "grey.200",
									"& .MuiLinearProgress-bar": {
										borderRadius: 1,
										backgroundColor: "warning.main",
									},
								}}
							/>
						</Box>
					</Stack>
				</Stack>
			)}
		</MainCard>
	);
};

export default NotificationStatus;

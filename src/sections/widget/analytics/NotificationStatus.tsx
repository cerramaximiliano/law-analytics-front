import React from "react";
import { Typography, Box, CircularProgress, Stack, LinearProgress, Tooltip, IconButton } from "@mui/material";
import { useSelector } from "react-redux";
import { Notification, InfoCircle } from "iconsax-react";
import { RootState } from "store";
import MainCard from "components/MainCard";

const NotificationStatus = () => {
	const { data, isLoading, descriptions } = useSelector((state: RootState) => state.unifiedStats);

	// Usar las propiedades correctas del objeto notifications
	const totalCount = data?.notifications?.totalCount || 0;
	const unreadCount = data?.notifications?.unreadCount || 0;
	const readCount = totalCount - unreadCount;
	const description = descriptions?.notifications?.unreadCount;

	// Verificar si hay datos disponibles
	const hasData = totalCount > 0;

	const readPercentage = hasData ? (readCount / totalCount) * 100 : 0;
	const unreadPercentage = hasData ? (unreadCount / totalCount) * 100 : 0;

	return (
		<MainCard>
			<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 3 }}>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Typography variant="h4">Estado de Notificaciones</Typography>
					{description && (
						<Tooltip title={description} arrow placement="top">
							<IconButton size="small" sx={{ p: 0.5 }}>
								<InfoCircle size={16} color="#8c8c8c" />
							</IconButton>
						</Tooltip>
					)}
				</Box>
				<Notification size={24} />
			</Box>
			{isLoading ? (
				<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
					<CircularProgress />
				</Box>
			) : !hasData ? (
				<Box sx={{ textAlign: "center", py: 4 }}>
					<Notification size={48} color="#8c8c8c" style={{ marginBottom: 16 }} />
					<Typography variant="h6" color="textSecondary" gutterBottom>
						Sin notificaciones
					</Typography>
					<Typography variant="body2" color="textSecondary">
						No hay datos de notificaciones disponibles en este momento
					</Typography>
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

import React from "react";
import { CardContent, Typography, Box, CircularProgress, Stack, Tooltip, IconButton } from "@mui/material";
import { useSelector } from "react-redux";
import { Clock, InfoCircle } from "iconsax-react";
import { RootState } from "store";
import MainCard from "components/MainCard";

const AverageResolutionTime = () => {
	const { data, isLoading, descriptions } = useSelector((state: RootState) => state.unifiedStats);
	const avgDays = data?.folders?.resolutionTimes?.overall || 0;
	const description = descriptions?.folders?.resolutionTimes?.overall;

	return (
		<MainCard content={false}>
			<CardContent>
				<Stack spacing={2}>
					<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Box>
								<Typography variant="h6" color="textSecondary">
									Tiempo Promedio de Resolución
								</Typography>
								<Typography variant="body2" color="textSecondary">
									En días
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
						<Clock size={32} color="#1890ff" />
					</Box>
					{isLoading ? (
						<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
							<CircularProgress size={24} />
						</Box>
					) : (
						<Typography variant="h3" color="primary">
							{avgDays.toFixed(1)} días
						</Typography>
					)}
				</Stack>
			</CardContent>
		</MainCard>
	);
};

export default AverageResolutionTime;

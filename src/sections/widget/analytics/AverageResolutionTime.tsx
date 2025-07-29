import { CardContent, Typography, Box, CircularProgress, Stack } from "@mui/material";
import { useSelector } from "react-redux";
import { Clock } from "iconsax-react";
import { RootState } from "store";
import MainCard from "components/MainCard";

const AverageResolutionTime = () => {
	const { data, isLoading } = useSelector((state: RootState) => state.unifiedStats);
	const avgDays = data?.folders?.resolutionTimes?.overall || 0;

	return (
		<MainCard content={false}>
			<CardContent>
				<Stack spacing={2}>
					<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
						<Box>
							<Typography variant="h6" color="textSecondary">
								Tiempo Promedio de Resolución
							</Typography>
							<Typography variant="body2" color="textSecondary">
								En días
							</Typography>
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

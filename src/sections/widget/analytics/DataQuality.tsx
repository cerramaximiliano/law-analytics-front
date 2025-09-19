import React from "react";
import { CardContent, Typography, Box, CircularProgress, Stack, LinearProgress, Tooltip, IconButton } from "@mui/material";
import { useSelector } from "react-redux";
import { Chart, InfoCircle } from "iconsax-react";
import { RootState } from "store";
import MainCard from "components/MainCard";

const DataQuality = () => {
	const { data, dataQuality: stateDataQuality, isLoading } = useSelector((state: RootState) => state.unifiedStats);

	// Debug log to check data structure
	console.log("📊 [DataQuality] Full data:", data);
	console.log("📊 [DataQuality] dataQuality from state:", stateDataQuality);

	const dataQuality = stateDataQuality || 0;

	const getQualityColor = (quality: number) => {
		if (quality >= 80) return "success";
		if (quality >= 60) return "warning";
		return "error";
	};

	const getQualityLabel = (quality: number) => {
		if (quality >= 80) return "Excelente";
		if (quality >= 60) return "Buena";
		if (quality >= 40) return "Regular";
		return "Baja";
	};

	const qualityColor = getQualityColor(dataQuality);
	const qualityLabel = getQualityLabel(dataQuality);

	return (
		<MainCard content={false}>
			<CardContent>
				<Stack spacing={2}>
					<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Box>
								<Typography variant="h6" color="textSecondary">
									Calidad de Datos
								</Typography>
								<Typography variant="body2" color="textSecondary">
									{qualityLabel}
								</Typography>
							</Box>
							<Tooltip title="Evalúa la completitud y confiabilidad de la información en el sistema" arrow placement="top">
								<IconButton size="small" sx={{ p: 0.5 }}>
									<InfoCircle size={16} color="#8c8c8c" />
								</IconButton>
							</Tooltip>
						</Box>
						<Chart size={32} color={qualityColor === "success" ? "#52c41a" : qualityColor === "warning" ? "#faad14" : "#f5222d"} />
					</Box>
					{isLoading ? (
						<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
							<CircularProgress size={24} />
						</Box>
					) : (
						<>
							<Typography variant="h3" color={`${qualityColor}.main`}>
								{dataQuality.toFixed(0)}%
							</Typography>
							<LinearProgress
								variant="determinate"
								value={dataQuality}
								sx={{
									height: 8,
									borderRadius: 1,
									"& .MuiLinearProgress-bar": {
										borderRadius: 1,
									},
								}}
								color={qualityColor}
							/>
						</>
					)}
				</Stack>
			</CardContent>
		</MainCard>
	);
};

export default DataQuality;

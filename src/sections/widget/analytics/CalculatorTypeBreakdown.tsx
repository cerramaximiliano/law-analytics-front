import React from "react";
import { CardContent, Typography, Box, CircularProgress, Stack, Tooltip, IconButton } from "@mui/material";
import { useSelector } from "react-redux";
import { Calculator, InfoCircle } from "iconsax-react";
import { RootState } from "store";
import MainCard from "components/MainCard";
import { formatCurrency } from "utils/formatCurrency";

const CalculatorTypeBreakdown = () => {
	const { data, isLoading, descriptions } = useSelector((state: RootState) => state.unifiedStats);

	// Get financial metrics from the API
	const averageAmountPerFolder = data?.financial?.averageAmountPerFolder || 0;
	const totalActiveAmount = data?.financial?.totalActiveAmount || 0;
	const activeFolders = data?.dashboard?.folders?.active || 0;
	const description = descriptions?.financial?.averageAmountPerFolder;

	return (
		<MainCard content={false}>
			<CardContent>
				<Stack spacing={2}>
					<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
						<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
							<Box>
								<Typography variant="h6" color="textSecondary">
									Promedio por Carpeta
								</Typography>
								<Typography variant="body2" color="textSecondary">
									Carpetas activas: {activeFolders}
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
						<Calculator size={32} color="#722ed1" />
					</Box>
					{isLoading ? (
						<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
							<CircularProgress size={24} />
						</Box>
					) : (
						<Stack spacing={1}>
							<Typography variant="h3" color="primary">
								{formatCurrency(averageAmountPerFolder)}
							</Typography>
							{totalActiveAmount > 0 && activeFolders > 0 && (
								<Typography variant="caption" color="textSecondary">
									Total activo: {formatCurrency(totalActiveAmount)}
								</Typography>
							)}
						</Stack>
					)}
				</Stack>
			</CardContent>
		</MainCard>
	);
};

export default CalculatorTypeBreakdown;

import { CardContent, Typography, Box, CircularProgress, Stack } from "@mui/material";
import { useSelector } from "react-redux";
import { Calculator } from "iconsax-react";
import { RootState } from "store";
import MainCard from "components/MainCard";
import { formatCurrency } from "utils/formatCurrency";

const CalculatorTypeBreakdown = () => {
	const { data, isLoading } = useSelector((state: RootState) => state.unifiedStats);

	// Get financial metrics from the API
	const averageAmountPerFolder = data?.financial?.averageAmountPerFolder || 0;
	const totalActiveAmount = data?.financial?.totalActiveAmount || 0;
	const activeFolders = data?.dashboard?.folders?.active || 0;

	return (
		<MainCard content={false}>
			<CardContent>
				<Stack spacing={2}>
					<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
						<Box>
							<Typography variant="h6" color="textSecondary">
								Promedio por Carpeta
							</Typography>
							<Typography variant="body2" color="textSecondary">
								Carpetas activas: {activeFolders}
							</Typography>
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

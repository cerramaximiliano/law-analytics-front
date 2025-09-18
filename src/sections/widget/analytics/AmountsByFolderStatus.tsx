import React from "react";
import { Typography, Box, CircularProgress, Grid, Paper, Tooltip, IconButton } from "@mui/material";
import { useSelector } from "react-redux";
import { useTheme } from "@mui/material/styles";
import { RootState } from "store";
import MainCard from "components/MainCard";
import { formatCurrency } from "utils/formatCurrency";
import { WalletMoney, MoneyRecive, ClipboardTick, InfoCircle } from "iconsax-react";

const AmountsByFolderStatus = () => {
	const theme = useTheme();
	const { data, isLoading, descriptions } = useSelector((state: RootState) => state.unifiedStats);

	// Use the financial data that's actually available in the API
	const totalActiveAmount = data?.financial?.totalActiveAmount || 0;
	const averageAmountPerFolder = data?.financial?.averageAmountPerFolder || 0;
	const description = descriptions?.financial?.totalActiveAmount;

	// Get amounts by status from the amountByStatus object
	const amountByStatus = data?.financial?.amountByStatus || {};
	const pendingAmount = amountByStatus.pendiente || 0;

	const financialData = [
		{
			title: "Monto Activo Total",
			value: totalActiveAmount,
			icon: <WalletMoney size={24} />,
			color: theme.palette.primary.main,
			bgColor: theme.palette.primary.lighter,
		},
		{
			title: "Promedio por Carpeta",
			value: averageAmountPerFolder,
			icon: <MoneyRecive size={24} />,
			color: theme.palette.success.main,
			bgColor: theme.palette.success.lighter,
		},
		{
			title: "Monto Pendiente",
			value: pendingAmount,
			icon: <ClipboardTick size={24} />,
			color: theme.palette.warning.main,
			bgColor: theme.palette.warning.lighter,
		},
	];

	return (
		<MainCard>
			<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 3 }}>
				<Typography variant="h4">Resumen Financiero</Typography>
				{description && (
					<Tooltip title={description} arrow placement="top">
						<IconButton size="small" sx={{ p: 0.5 }}>
							<InfoCircle size={16} color="#8c8c8c" />
						</IconButton>
					</Tooltip>
				)}
			</Box>
			{isLoading ? (
				<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
					<CircularProgress />
				</Box>
			) : (
				<Grid container spacing={3}>
					{financialData.map((item, index) => (
						<Grid item xs={12} md={4} key={index}>
							<Paper
								sx={{
									p: 3,
									background: item.bgColor,
									border: `1px solid ${theme.palette.divider}`,
								}}
								elevation={0}
							>
								<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between", mb: 2 }}>
									<Box sx={{ color: item.color }}>{item.icon}</Box>
									<Typography variant="body2" color="textSecondary">
										{item.title}
									</Typography>
								</Box>
								<Typography variant="h3" sx={{ color: item.color, fontWeight: 600 }}>
									{formatCurrency(item.value)}
								</Typography>
							</Paper>
						</Grid>
					))}
				</Grid>
			)}
		</MainCard>
	);
};

export default AmountsByFolderStatus;

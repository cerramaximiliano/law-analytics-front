import { Box, Stack, Typography } from "@mui/material";
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import { Wallet3 } from "iconsax-react";
import { useSelector } from "store";

interface FinancialWidgetProps {
	foldersTrend?: {
		direction: string;
		percentage: number;
	};
}

const FinancialWidget = ({ foldersTrend = { direction: "up", percentage: 0 } }: FinancialWidgetProps) => {
	// Obtener datos del store unificado
	const { data: unifiedData } = useSelector((state) => state.unifiedStats);
	const dashboardData = unifiedData?.dashboard;

	// Función para formatear moneda
	const formatCurrency = (amount: number) => {
		return new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: "ARS",
			maximumFractionDigits: 0,
		}).format(amount);
	};

	return (
		<MainCard>
			<Stack spacing={2}>
				{/* Header con ícono y título */}
				<Stack direction="row" alignItems="center" spacing={2}>
					<Avatar variant="rounded" color="primary">
						<Wallet3 />
					</Avatar>
					<Typography variant="subtitle1">Monto Activo</Typography>
				</Stack>

				{/* Contenido principal sin división de columnas */}
				<MainCard content={false} border={false} sx={{ bgcolor: "background.default" }}>
					<Box sx={{ p: 3, pb: 1.25 }}>
						<Stack spacing={1} alignItems="center">
							<Typography variant="h5">{formatCurrency(dashboardData?.financial?.activeAmount || 0)}</Typography>
							<Typography variant="caption" color="text.secondary">
								{dashboardData?.folders?.active || 0} carpetas activas
							</Typography>
						</Stack>
					</Box>
				</MainCard>
			</Stack>
		</MainCard>
	);
};

export default FinancialWidget;

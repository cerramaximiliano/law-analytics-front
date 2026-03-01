import React from "react";
import { Alert, Typography, Box } from "@mui/material";
import { TickCircle, Clock } from "iconsax-react";
import dayjs from "dayjs";

interface PjnSyncStatusProps {
	causaLastSyncDate?: string | null;
}

const PjnSyncStatus: React.FC<PjnSyncStatusProps> = ({ causaLastSyncDate }) => {
	if (causaLastSyncDate) {
		return (
			<Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1, color: "success.main" }}>
				<TickCircle size={16} variant="Bold" />
				<Typography variant="caption" color="success.main">
					Última actualización PJN: {dayjs(causaLastSyncDate).format("DD/MM/YYYY HH:mm")}
				</Typography>
			</Box>
		);
	}

	return (
		<Alert severity="warning" icon={<Clock size={18} />} sx={{ mb: 1, py: 0.5 }}>
			<Typography variant="body2">
				<strong>Pendiente de primera actualización PJN.</strong> Los movimientos se sincronizarán en el próximo ciclo de actualización.
			</Typography>
		</Alert>
	);
};

export default PjnSyncStatus;

import React from "react";
import { Typography, Box } from "@mui/material";
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
		<Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1, color: "warning.main" }}>
			<Clock size={16} />
			<Typography variant="caption" color="warning.main">
				Pendiente de primera sincronización PJN
			</Typography>
		</Box>
	);
};

export default PjnSyncStatus;

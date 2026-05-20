import React from "react";
import { Typography, Box } from "@mui/material";
import { TickCircle, Clock } from "iconsax-react";
import dayjs from "dayjs";

export type FolderSyncSource = "pjn" | "mev" | "scba" | "eje";

interface FolderSyncStatusProps {
	source: FolderSyncSource;
	causaLastSyncDate?: string | null;
}

const SOURCE_LABEL: Record<FolderSyncSource, string> = {
	pjn: "PJN",
	mev: "MEV",
	scba: "SCBA",
	eje: "EJE",
};

const FolderSyncStatus: React.FC<FolderSyncStatusProps> = ({ source, causaLastSyncDate }) => {
	const label = SOURCE_LABEL[source];

	if (causaLastSyncDate) {
		return (
			<Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1, color: "success.main" }}>
				<TickCircle size={16} variant="Bold" />
				<Typography variant="caption" color="success.main">
					Última actualización {label}: {dayjs(causaLastSyncDate).format("DD/MM/YYYY HH:mm")}
				</Typography>
			</Box>
		);
	}

	return (
		<Box sx={{ display: "flex", alignItems: "center", gap: 0.5, mb: 1, color: "warning.main" }}>
			<Clock size={16} />
			<Typography variant="caption" color="warning.main">
				Pendiente de primera sincronización {label}
			</Typography>
		</Box>
	);
};

export default FolderSyncStatus;

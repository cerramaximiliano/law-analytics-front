// Línea de info densa del expediente sincronizado (MEV/SCBA/EJE) — mismo
// diseño que la línea del expediente PJN (PjnMovementsViewerSection, rediseño
// 2026-07): eyebrow uppercase + total de movimientos + punto de estado con la
// última sincronización relativa. Reemplaza al banner de dos líneas anterior.
import React from "react";
import { Typography, Box, Stack, Tooltip } from "@mui/material";
import dayjs from "utils/dayjs-config";

export type FolderSyncSource = "pjn" | "mev" | "scba" | "eje";

interface FolderSyncStatusProps {
	source: FolderSyncSource;
	causaLastSyncDate?: string | null;
	// Total de movimientos del expediente (sin filtros) — se muestra junto al eyebrow.
	totalMovements?: number | null;
}

const SOURCE_LABEL: Record<FolderSyncSource, string> = {
	pjn: "PJN",
	mev: "MEV",
	scba: "SCBA",
	eje: "EJE",
};

const FolderSyncStatus: React.FC<FolderSyncStatusProps> = ({ source, causaLastSyncDate, totalMovements }) => {
	const label = SOURCE_LABEL[source];

	return (
		<Stack
			direction="row"
			alignItems="center"
			flexWrap="wrap"
			columnGap={1.25}
			rowGap={0.5}
			sx={(t) => ({ px: 2, py: 1, mb: 1, borderBottom: `1px solid ${t.palette.divider}` })}
		>
			<Typography
				sx={{ fontSize: "0.62rem", fontWeight: 700, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}
			>
				Expediente {label}
			</Typography>
			{typeof totalMovements === "number" && (
				<Typography variant="caption" color="text.secondary" sx={{ fontVariantNumeric: "tabular-nums" }}>
					{totalMovements.toLocaleString("es-AR")} movimiento{totalMovements === 1 ? "" : "s"}
				</Typography>
			)}
			{causaLastSyncDate ? (
				<Tooltip title={dayjs(causaLastSyncDate).format("DD/MM/YYYY HH:mm")}>
					<Stack direction="row" spacing={0.5} alignItems="center">
						<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "success.main" }} />
						<Typography variant="caption" color="text.secondary">
							sincronizado {dayjs(causaLastSyncDate).fromNow()}
						</Typography>
					</Stack>
				</Tooltip>
			) : (
				<Stack direction="row" spacing={0.5} alignItems="center">
					<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: "warning.main" }} />
					<Typography variant="caption" color="text.secondary">
						pendiente de primera sincronización
					</Typography>
				</Stack>
			)}
		</Stack>
	);
};

export default FolderSyncStatus;

import React from "react";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Clock, Refresh, TableDocument } from "iconsax-react";

import { LIVE_PULSE_KEYFRAMES, STALE_AMBER } from "themes/dashboardTokens";
import { FolderSyncSource } from "./FolderSyncStatus";

interface SyncPendingEmptyStateProps {
	source: FolderSyncSource;
	onRefresh: () => void;
	isRefreshing?: boolean;
}

// Copy por source. Las ventanas de tiempo son aproximadas — vienen del cron de
// cada worker (SCBA: every 5min; PJN/MEV: depende del worker, ajustar si cambia).
const COPY: Record<FolderSyncSource, { source: string; window: string; portalLabel: string }> = {
	scba: {
		source: "SCBA",
		window: "El primer scrap puede tardar hasta 10 minutos",
		portalLabel: "del portal SCBA",
	},
	pjn: {
		source: "PJN",
		window: "El primer scrap puede tardar unos minutos",
		portalLabel: "del Poder Judicial de la Nación",
	},
	mev: {
		source: "MEV",
		window: "El primer scrap puede tardar unos minutos",
		portalLabel: "de la Mesa de Entradas Virtual",
	},
	eje: {
		source: "EJE",
		window: "El primer scrap puede tardar unos minutos",
		portalLabel: "del Expediente Judicial Electrónico",
	},
};

const SyncPendingEmptyState: React.FC<SyncPendingEmptyStateProps> = ({ source, onRefresh, isRefreshing = false }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const copy = COPY[source];

	return (
		<Box
			sx={{
				display: "flex",
				alignItems: "center",
				justifyContent: "center",
				minHeight: 360,
				px: { xs: 2, sm: 3 },
				py: { xs: 4, sm: 5 },
				...LIVE_PULSE_KEYFRAMES,
			}}
		>
			<Stack alignItems="center" spacing={2.25} sx={{ maxWidth: 480, textAlign: "center" }}>
				{/* Ícono con pulso amber */}
				<Box sx={{ position: "relative", display: "inline-flex", flexShrink: 0 }}>
					<Box
						sx={{
							width: 64,
							height: 64,
							borderRadius: 2,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(STALE_AMBER, isDark ? 0.18 : 0.1),
							border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
							color: STALE_AMBER,
							zIndex: 1,
						}}
					>
						<TableDocument size={28} variant="Bulk" />
					</Box>
					<Box
						aria-hidden
						sx={{
							position: "absolute",
							inset: -3,
							borderRadius: 2.25,
							border: `2px solid ${STALE_AMBER}`,
							opacity: 0.35,
							animation: "la-live-pulse 2.4s ease-out infinite",
						}}
					/>
				</Box>

				<Stack spacing={0.625} alignItems="center">
					<Stack direction="row" spacing={0.75} alignItems="center">
						<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: STALE_AMBER }} />
						<Typography
							sx={{
								fontSize: "0.68rem",
								fontWeight: 600,
								letterSpacing: "0.08em",
								textTransform: "uppercase",
								color: STALE_AMBER,
							}}
						>
							Sincronización pendiente
						</Typography>
					</Stack>
					<Typography
						sx={{
							fontSize: { xs: "1.1rem", sm: "1.2rem" },
							fontWeight: 600,
							letterSpacing: "-0.018em",
							color: "text.primary",
							lineHeight: 1.3,
							textWrap: "balance",
						}}
					>
						Sincronizando movimientos por primera vez
					</Typography>
					<Typography
						sx={{
							fontSize: "0.86rem",
							color: "text.secondary",
							lineHeight: 1.55,
							letterSpacing: "-0.005em",
							textWrap: "pretty",
						}}
					>
						Estamos extrayendo los movimientos {copy.portalLabel}. Una vez sincronizados van a aparecer acá automáticamente.
					</Typography>
				</Stack>

				{/* Pill informativa con tiempo estimado */}
				<Box
					sx={{
						display: "inline-flex",
						alignItems: "center",
						gap: 0.75,
						px: 1.25,
						py: 0.5,
						borderRadius: 1,
						bgcolor: alpha(STALE_AMBER, isDark ? 0.12 : 0.07),
						border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.28 : 0.2)}`,
					}}
				>
					<Clock size={14} variant="Bulk" color={STALE_AMBER} />
					<Typography sx={{ fontSize: "0.76rem", fontWeight: 500, color: "text.primary" }}>{copy.window}</Typography>
				</Box>

				<Button
					onClick={onRefresh}
					disabled={isRefreshing}
					size="small"
					variant="outlined"
					startIcon={
						isRefreshing ? <CircularProgress size={14} thickness={5} sx={{ color: STALE_AMBER }} /> : <Refresh size={16} />
					}
					sx={{
						textTransform: "none",
						fontWeight: 600,
						letterSpacing: "-0.005em",
						borderRadius: 1.25,
						px: 2,
						py: 0.75,
						color: STALE_AMBER,
						borderColor: alpha(STALE_AMBER, isDark ? 0.42 : 0.32),
						"&:hover": {
							borderColor: STALE_AMBER,
							bgcolor: alpha(STALE_AMBER, isDark ? 0.12 : 0.06),
						},
					}}
				>
					{isRefreshing ? "Actualizando…" : "Actualizar estado"}
				</Button>

				<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", lineHeight: 1.45, mt: 0.5 }}>
					No tenés que hacer nada. La página se actualiza sola cuando el worker termine.
				</Typography>
			</Stack>
		</Box>
	);
};

export default SyncPendingEmptyState;

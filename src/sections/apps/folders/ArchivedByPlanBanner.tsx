import { useEffect, useRef } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// icons
import { Archive } from "iconsax-react";

// project imports
import useArchivedSummary from "hooks/useArchivedSummary";
import { planNameForCopy } from "services/archivedSummaryService";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { trackUpgradeCtaClick } from "utils/gtm";

interface ArchivedByPlanBannerProps {
	// Abre el modal de archivadas existente (ArchivedItemsModal)
	onChooseVisible: () => void;
	// Cambia cuando el listado de activas cambia (archivar/desarchivar) para recalcular
	refreshKey?: number;
}

const PLANS_SOURCE = "archived_banner";

// ==============================|| BANNER: ARCHIVADAS POR EL PLAN ||============================== //
//
// Aviso en el listado de carpetas cuando hay causas archivadas por el límite del
// plan. Solo para el listado personal (en modo equipo no se monta). Si el
// resumen falla o no hay archivadas por plan, no renderiza nada.

const ArchivedByPlanBanner = ({ onChooseVisible, refreshKey }: ArchivedByPlanBannerProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const navigate = useNavigate();
	const { summary, refresh } = useArchivedSummary();

	// Recalcular cuando cambia el listado (sin repetir el fetch del montaje)
	const firstRef = useRef(true);
	useEffect(() => {
		if (firstRef.current) {
			firstRef.current = false;
			return;
		}
		refresh();
	}, [refreshKey, refresh]);

	if (!summary || summary.archivedByPlan <= 0) return null;

	const count = summary.archivedByPlan;

	const handleViewPlans = () => {
		trackUpgradeCtaClick(PLANS_SOURCE);
		navigate(`/suscripciones/tables?source=${PLANS_SOURCE}`);
	};

	return (
		<Box
			sx={{
				mx: { xs: 2, sm: 3 },
				mt: 2,
				borderRadius: 1.5,
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.16)}`,
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.05),
				px: { xs: 2, sm: 2.5 },
				py: { xs: 1.5, sm: 1.75 },
			}}
		>
			<Stack direction={{ xs: "column", md: "row" }} alignItems={{ xs: "stretch", md: "center" }} spacing={{ xs: 1.5, md: 2 }}>
				<Stack direction="row" spacing={1.5} alignItems="flex-start" sx={{ flex: 1, minWidth: 0 }}>
					<Box
						sx={{
							flexShrink: 0,
							width: 32,
							height: 32,
							borderRadius: 1.25,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.12),
							color: BRAND_BLUE,
						}}
					>
						<Archive size={17} variant="Bulk" />
					</Box>
					<Typography sx={{ fontSize: "0.85rem", color: "text.primary", lineHeight: 1.5, letterSpacing: "-0.005em", textWrap: "pretty" }}>
						<Box component="span" sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
							{count} {count === 1 ? "causa" : "causas"}
						</Box>{" "}
						{count === 1 ? "quedó archivada" : "quedaron archivadas"} por el límite del plan {planNameForCopy(summary.planId)}.{" "}
						{count === 1
							? "Sigue recibiendo movimientos, pero no podés abrirla."
							: "Siguen recibiendo movimientos, pero no podés abrirlas."}
					</Typography>
				</Stack>

				<Stack direction="row" spacing={1} sx={{ flexShrink: 0, justifyContent: { xs: "flex-end", md: "flex-start" } }}>
					<Button
						onClick={onChooseVisible}
						size="small"
						sx={{
							textTransform: "none",
							fontWeight: 600,
							letterSpacing: "-0.005em",
							borderRadius: 1.25,
							px: 1.5,
							color: "text.secondary",
							border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
							whiteSpace: "nowrap",
							"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04), borderColor: alpha(BRAND_BLUE, 0.28) },
						}}
					>
						Elegir cuáles ver
					</Button>
					<Button
						variant="contained"
						onClick={handleViewPlans}
						size="small"
						sx={{
							textTransform: "none",
							fontWeight: 600,
							letterSpacing: "-0.005em",
							borderRadius: 1.25,
							px: 1.75,
							bgcolor: BRAND_BLUE,
							boxShadow: "none",
							whiteSpace: "nowrap",
							"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
						}}
					>
						Ver planes
					</Button>
				</Stack>
			</Stack>
		</Box>
	);
};

export default ArchivedByPlanBanner;

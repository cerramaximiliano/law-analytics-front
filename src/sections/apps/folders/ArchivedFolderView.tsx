import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, CircularProgress, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// icons
import { Archive, ArrowLeft, ArrangeHorizontal, Crown1, InfoCircle } from "iconsax-react";

// project imports
import MainCard from "components/MainCard";
import { BRAND_BLUE, STALE_AMBER } from "themes/dashboardTokens";
import { formatFolderName } from "utils/formatFolderName";
import { trackUpgradeCtaClick } from "utils/gtm";
import useArchivedSummary from "hooks/useArchivedSummary";
import { ArchivedSummary, isPlanArchivedReason, planNameForCopy } from "services/archivedSummaryService";
import SwapArchivedFolderDialog from "./SwapArchivedFolderDialog";

interface ArchivedFolderViewProps {
	folder: any;
	// Motivo del último archivado (hub models/Folder.js). Si es por el plan se
	// muestra la variante de límite del plan; si no, la vista de siempre.
	archivedReason?: string | null;
	unarchiving: boolean;
	onUnarchive: () => void;
}

const PLANS_SOURCE = "archived_folder";

// ==============================|| ARCHIVED FOLDER VIEW ||============================== //
//
// Gate de carpeta archivada: bloquea el detalle completo (mismo patrón que
// PendingVerificationView para causas no verificadas). El detalle es accesible
// por URL directa (deep links de notificaciones) — sin este gate el usuario
// opera una carpeta archivada sin saberlo.

const ArchivedFolderView = ({ folder, archivedReason, unarchiving, onUnarchive }: ArchivedFolderViewProps) => {
	if (isPlanArchivedReason(archivedReason ?? folder?.archivedReason)) {
		return <PlanLimitArchivedFolderView folder={folder} />;
	}
	return <UserArchivedFolderView folder={folder} unarchiving={unarchiving} onUnarchive={onUnarchive} />;
};

const UserArchivedFolderView = ({ folder, unarchiving, onUnarchive }: Omit<ArchivedFolderViewProps, "archivedReason">) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const navigate = useNavigate();

	const title = folder?.folderName ? formatFolderName(folder.folderName, 80) : "Carpeta sin nombre";

	return (
		<Box sx={{ maxWidth: { xs: "100%", md: 720 }, mx: "auto", px: { xs: 2, sm: 0 }, py: { xs: 2, sm: 2.5 } }}>
			<Button
				onClick={() => navigate("/apps/folders/list")}
				size="small"
				startIcon={<ArrowLeft size={16} />}
				sx={{
					textTransform: "none",
					color: "text.secondary",
					fontWeight: 600,
					letterSpacing: "-0.005em",
					mb: 1.5,
					"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04) },
				}}
			>
				Volver a Carpetas
			</Button>

			<MainCard
				content={false}
				sx={{
					borderRadius: 2,
					border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
					overflow: "hidden",
				}}
			>
				{/* Header con tinte amber */}
				<Box
					sx={{
						px: { xs: 2.25, sm: 3 },
						py: { xs: 1.75, sm: 2 },
						bgcolor: alpha(STALE_AMBER, isDark ? 0.1 : 0.05),
						borderBottom: `1px solid ${alpha(STALE_AMBER, isDark ? 0.28 : 0.18)}`,
					}}
				>
					<Stack direction="row" alignItems="flex-start" spacing={1.5}>
						<Box
							sx={{
								flexShrink: 0,
								width: 40,
								height: 40,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(STALE_AMBER, isDark ? 0.2 : 0.12),
								border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
								color: STALE_AMBER,
							}}
						>
							<Archive size={20} variant="Bulk" />
						</Box>
						<Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
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
									Carpeta archivada
								</Typography>
							</Stack>
							<Typography
								sx={{
									fontSize: { xs: "1.05rem", sm: "1.15rem" },
									fontWeight: 600,
									letterSpacing: "-0.018em",
									color: "text.primary",
									lineHeight: 1.25,
								}}
							>
								Esta carpeta está archivada
							</Typography>
							<Typography sx={{ fontSize: "0.8rem", color: "text.secondary", letterSpacing: "-0.005em" }}>{title}</Typography>
						</Stack>
					</Stack>
				</Box>

				{/* Body */}
				<Stack spacing={2} sx={{ px: { xs: 2.25, sm: 2.75 }, py: { xs: 2, sm: 2.25 } }}>
					<Box
						sx={{
							p: 1.25,
							borderRadius: 1.25,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
						}}
					>
						<Stack direction="row" spacing={1} alignItems="flex-start">
							<InfoCircle size={14} variant="Bulk" color={BRAND_BLUE} style={{ marginTop: 3, flexShrink: 0 }} />
							<Typography sx={{ fontSize: "0.8rem", color: "text.primary", lineHeight: 1.5, textWrap: "pretty" }}>
								El contenido de la carpeta (movimientos, tareas, notas, cálculos y documentos) se conserva pero permanece oculto mientras
								esté archivada, y la carpeta no aparece en tu listado de causas. Desarchivala para volver a verla y operarla.
							</Typography>
						</Stack>
					</Box>

					<Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
						<Button
							variant="contained"
							onClick={onUnarchive}
							disabled={unarchiving}
							startIcon={unarchiving ? <CircularProgress size={14} color="inherit" /> : <Archive size={15} variant="Linear" />}
							sx={{
								textTransform: "none",
								fontWeight: 600,
								letterSpacing: "-0.005em",
								borderRadius: 1.25,
								bgcolor: BRAND_BLUE,
								boxShadow: "none",
								"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
								"&.Mui-disabled": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.24 : 0.4), color: alpha("#fff", 0.9) },
							}}
						>
							{unarchiving ? "Desarchivando…" : "Desarchivar carpeta"}
						</Button>
						<Button
							onClick={() => navigate("/apps/folders/list")}
							sx={{
								textTransform: "none",
								fontWeight: 600,
								letterSpacing: "-0.005em",
								borderRadius: 1.25,
								color: "text.secondary",
								border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
								"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04), borderColor: alpha(BRAND_BLUE, 0.28) },
							}}
						>
							Volver a Carpetas
						</Button>
					</Stack>
				</Stack>
			</MainCard>
		</Box>
	);
};

// ==============================|| ARCHIVADA POR EL LÍMITE DEL PLAN ||============================== //
//
// Variante para carpetas archivadas por el tope del plan (plan_limit,
// plan_downgrade, auto_archived_limit_exceeded): la causa sigue recibiendo
// movimientos, así que el gate empuja a ver planes o a intercambiarla por otra
// activa. Sin resumen (endpoint caído) usa un texto sin números.

const planLimitInfoText = (summary: ArchivedSummary | null): string => {
	if (!summary) {
		return "Esta causa quedó archivada por el límite de tu plan. Te seguimos avisando de sus movimientos; para abrirlos tiene que estar activa.";
	}
	let text =
		"Te seguimos avisando de sus movimientos. Para abrirlos, ver los documentos y cargar los plazos, la causa tiene que estar activa.";
	if (summary.recommended) {
		text += ` Para tener las ${summary.total} a la vista te conviene el plan ${summary.recommended.displayName} (${summary.recommended.folders} causas activas).`;
		if (summary.recommended.exceedsAll) text += " Si necesitás más, escribinos a soporte@lawanalytics.app.";
	}
	return text;
};

const PlanLimitArchivedFolderView = ({ folder }: { folder: any }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const navigate = useNavigate();
	const { summary } = useArchivedSummary();
	const [swapOpen, setSwapOpen] = useState(false);

	const title = folder?.folderName ? formatFolderName(folder.folderName, 80) : "Carpeta sin nombre";
	const showNumbers = !!summary && summary.archivedByPlan > 0;

	const handleViewPlans = () => {
		trackUpgradeCtaClick(PLANS_SOURCE);
		navigate(`/suscripciones/tables?source=${PLANS_SOURCE}`);
	};

	return (
		<Box sx={{ maxWidth: { xs: "100%", md: 720 }, mx: "auto", px: { xs: 2, sm: 0 }, py: { xs: 2, sm: 2.5 } }}>
			<Button
				onClick={() => navigate("/apps/folders/list")}
				size="small"
				startIcon={<ArrowLeft size={16} />}
				sx={{
					textTransform: "none",
					color: "text.secondary",
					fontWeight: 600,
					letterSpacing: "-0.005em",
					mb: 1.5,
					"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04) },
				}}
			>
				Volver a Carpetas
			</Button>

			<MainCard
				content={false}
				sx={{
					borderRadius: 2,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
					overflow: "hidden",
				}}
			>
				{/* Header con tinte brand */}
				<Box
					sx={{
						px: { xs: 2.25, sm: 3 },
						py: { xs: 1.75, sm: 2 },
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.05),
						borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.24 : 0.14)}`,
					}}
				>
					<Stack direction="row" alignItems="flex-start" spacing={1.5}>
						<Box
							sx={{
								flexShrink: 0,
								width: 40,
								height: 40,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.12),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.22)}`,
								color: BRAND_BLUE,
							}}
						>
							<Archive size={20} variant="Bulk" />
						</Box>
						<Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
							<Stack direction="row" spacing={0.75} alignItems="center">
								<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
								<Typography
									sx={{
										fontSize: "0.68rem",
										fontWeight: 600,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: BRAND_BLUE,
									}}
								>
									Archivada por el límite del plan
								</Typography>
							</Stack>
							<Typography
								sx={{
									fontSize: { xs: "1.05rem", sm: "1.15rem" },
									fontWeight: 600,
									letterSpacing: "-0.018em",
									color: "text.primary",
									lineHeight: 1.25,
									textWrap: "balance",
								}}
							>
								Esta causa tiene novedades, pero tu plan no la incluye
							</Typography>
							<Typography sx={{ fontSize: "0.8rem", color: "text.secondary", letterSpacing: "-0.005em" }}>{title}</Typography>
						</Stack>
					</Stack>
				</Box>

				{/* Body */}
				<Stack spacing={2} sx={{ px: { xs: 2.25, sm: 2.75 }, py: { xs: 2, sm: 2.25 } }}>
					{showNumbers && summary && (
						<Stack direction="row" spacing={1.75} alignItems="center">
							<Typography
								sx={{
									fontSize: { xs: "2.25rem", sm: "2.5rem" },
									fontWeight: 700,
									letterSpacing: "-0.03em",
									lineHeight: 1,
									color: BRAND_BLUE,
									fontVariantNumeric: "tabular-nums",
									flexShrink: 0,
								}}
							>
								{summary.archivedByPlan}
							</Typography>
							<Typography sx={{ fontSize: "0.85rem", color: "text.primary", lineHeight: 1.45, textWrap: "pretty" }}>
								de tus {summary.total} causas están archivadas por el plan {planNameForCopy(summary.planId)}, que deja {summary.planLimit}{" "}
								activas.
							</Typography>
						</Stack>
					)}

					<Box
						sx={{
							p: 1.25,
							borderRadius: 1.25,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
						}}
					>
						<Stack direction="row" spacing={1} alignItems="flex-start">
							<InfoCircle size={14} variant="Bulk" color={BRAND_BLUE} style={{ marginTop: 3, flexShrink: 0 }} />
							<Typography sx={{ fontSize: "0.8rem", color: "text.primary", lineHeight: 1.5, textWrap: "pretty" }}>
								{planLimitInfoText(summary)}
							</Typography>
						</Stack>
					</Box>

					<Stack spacing={1}>
						<Stack direction={{ xs: "column", sm: "row" }} spacing={1.25}>
							<Button
								variant="contained"
								onClick={handleViewPlans}
								startIcon={<Crown1 size={15} variant="Bulk" />}
								sx={{
									textTransform: "none",
									fontWeight: 600,
									letterSpacing: "-0.005em",
									borderRadius: 1.25,
									bgcolor: BRAND_BLUE,
									boxShadow: "none",
									"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
								}}
							>
								Ver planes
							</Button>
							<Button
								onClick={() => setSwapOpen(true)}
								startIcon={<ArrangeHorizontal size={15} variant="Linear" />}
								sx={{
									textTransform: "none",
									fontWeight: 600,
									letterSpacing: "-0.005em",
									borderRadius: 1.25,
									color: "text.secondary",
									border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
									"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04), borderColor: alpha(BRAND_BLUE, 0.28) },
								}}
							>
								Activar esta en lugar de otra
							</Button>
						</Stack>
						<Typography sx={{ fontSize: "0.75rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
							Elegí cuál de tus causas activas pasa a archivada para liberar el lugar.
						</Typography>
					</Stack>
				</Stack>
			</MainCard>

			<SwapArchivedFolderDialog open={swapOpen} onClose={() => setSwapOpen(false)} folder={folder} />
		</Box>
	);
};

export default ArchivedFolderView;

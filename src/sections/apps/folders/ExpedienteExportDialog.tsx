import React, { useCallback, useEffect, useRef, useState } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import {
	Alert,
	Box,
	Button,
	CircularProgress,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControlLabel,
	LinearProgress,
	Radio,
	RadioGroup,
	Stack,
	Typography,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { DocumentDownload } from "iconsax-react";
import { ResponsiveDialog } from "components/@extended/ResponsiveDialog";
import { PopupTransition } from "components/@extended/Transitions";
import { createExpedienteExport, getExpedienteExport } from "services/expedienteExportService";
import type {
	ExpedienteExportEstimate,
	ExpedienteExportJob,
	ExpedienteExportOrder,
	ExpedienteExportResponse,
} from "types/expedienteExport";
import { BRAND_BLUE } from "themes/dashboardTokens";
import dayjs from "utils/dayjs-config";
import { markExportDialogClosed, markExportDialogOpen, trackExport, untrackExport } from "utils/expedienteExportTracker";

// ==============================|| DESCARGA DEL EXPEDIENTE COMPLETO (PJN) ||============================== //
//
// Se abre desde el menú de cada carpeta PJN del listado. El expediente no se
// arma en el momento: el hub encola un job y un worker une los documentos en
// tomos de ~200 MB (hay causas de casi 2 GB). Solo entran los movimientos
// con documento adjunto. Este diálogo muestra la estimación, dispara el job y
// hace polling hasta que los tomos están listos.
//
// Diseño: mismo lenguaje que los modales de la carpeta (ModalNotes/ModalTasks):
// header con ícono en caja BRAND_BLUE, eyebrow + título + subtítulo, y footer
// con borde superior y botones de 1.25 de radio.
//
// Feature paga ("expediente_export"): sin plan, el hub devuelve la estimación
// con requiresUpgrade y acá se muestra el aviso en lugar del botón.

const POLL_MS = 4000;

const PLAN_LABELS: Record<string, string> = { standard: "Estándar", pro: "Pro", premium: "Premium" };

function formatBytes(bytes?: number): string {
	if (!bytes) return "0 MB";
	const mb = bytes / (1024 * 1024);
	if (mb >= 1024) return `${(mb / 1024).toLocaleString("es-AR", { maximumFractionDigits: 1 })} GB`;
	if (mb < 1) return "menos de 1 MB";
	return `${mb.toLocaleString("es-AR", { maximumFractionDigits: mb < 10 ? 1 : 0 })} MB`;
}

// Las fechas de los movimientos vienen a medianoche UTC: formatear en UTC para no correr el día.
function formatFechaMov(fecha?: string | null): string | null {
	if (!fecha) return null;
	const d = dayjs.utc(fecha);
	return d.isValid() ? d.format("DD/MM/YYYY") : null;
}

interface ExpedienteExportDialogProps {
	open: boolean;
	onClose: () => void;
	folderId: string | null;
	folderName?: string;
}

const ExpedienteExportDialog: React.FC<ExpedienteExportDialogProps> = ({ open, onClose, folderId, folderName }) => {
	const navigate = useNavigate();
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const [loading, setLoading] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [estimate, setEstimate] = useState<ExpedienteExportEstimate | null>(null);
	const [job, setJob] = useState<ExpedienteExportJob | null>(null);
	const [upgrade, setUpgrade] = useState<{ requiredPlans: string[] } | null>(null);
	const [accessCutoffAt, setAccessCutoffAt] = useState<string | null>(null);
	const [order, setOrder] = useState<ExpedienteExportOrder>("asc");
	// Con un job terminado a la vista, permite volver al formulario para regenerar.
	const [showForm, setShowForm] = useState(false);
	const pollRef = useRef<ReturnType<typeof setTimeout> | null>(null);

	const applyResponse = useCallback(
		(res: ExpedienteExportResponse) => {
			if (res.estimate) setEstimate(res.estimate);
			setJob(res.job ?? null);
			// Seguimiento para el aviso global: se registra mientras el job está en
			// curso y se quita al verlo terminar acá (ya está a la vista).
			if (folderId) {
				const active = res.job?.status === "queued" || res.job?.status === "processing";
				if (active && res.job) trackExport(folderId, folderName || "", res.job._id);
				else untrackExport(folderId);
			}
			setUpgrade(res.requiresUpgrade ? { requiredPlans: res.requiredPlans || [] } : null);
			setAccessCutoffAt(res.accessCutoffAt ?? null);
		},
		[folderId, folderName],
	);

	// Con el modal abierto el progreso está a la vista: el aviso global no corre.
	useEffect(() => {
		if (!open || !folderId) return;
		markExportDialogOpen(folderId);
		return () => markExportDialogClosed(folderId);
	}, [open, folderId]);

	const errorMessage = (err: unknown): string => {
		if (axios.isAxiosError(err) && err.response?.data?.message) return err.response.data.message;
		return "No pudimos consultar el expediente. Intentá de nuevo en unos minutos.";
	};

	// Carga inicial al abrir.
	useEffect(() => {
		if (!open || !folderId) return;
		let cancelled = false;
		setLoading(true);
		setError(null);
		setEstimate(null);
		setJob(null);
		setUpgrade(null);
		setShowForm(false);
		setOrder("asc");
		getExpedienteExport(folderId)
			.then((res) => {
				if (!cancelled) applyResponse(res);
			})
			.catch((err) => {
				if (!cancelled) setError(errorMessage(err));
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [open, folderId, applyResponse]);

	// Polling mientras el job está en cola o generándose. Un fallo de red
	// puntual no corta el seguimiento: se reintenta en el próximo tick.
	const isActive = job?.status === "queued" || job?.status === "processing";
	useEffect(() => {
		if (!open || !folderId || !isActive) return;
		let cancelled = false;
		const tick = async () => {
			try {
				const res = await getExpedienteExport(folderId);
				if (!cancelled) applyResponse(res);
			} catch (_err) {
				// se reintenta
			}
			if (!cancelled) pollRef.current = setTimeout(tick, POLL_MS);
		};
		pollRef.current = setTimeout(tick, POLL_MS);
		return () => {
			cancelled = true;
			if (pollRef.current) clearTimeout(pollRef.current);
		};
	}, [open, folderId, isActive, applyResponse]);

	const handleGenerate = async () => {
		if (!folderId) return;
		setSubmitting(true);
		setError(null);
		try {
			const res = await createExpedienteExport(folderId, order);
			applyResponse(res);
			setShowForm(false);
		} catch (err) {
			setError(errorMessage(err));
		} finally {
			setSubmitting(false);
		}
	};

	// Los links presignados vencen a los 15 min: se piden frescos al descargar.
	const handleDownload = async (n: number) => {
		if (!folderId) return;
		try {
			const res = await getExpedienteExport(folderId);
			applyResponse(res);
			const tomo = res.job?.tomos.find((t) => t.n === n);
			if (tomo?.url) {
				window.location.assign(tomo.url);
				return;
			}
			setError("La descarga ya no está disponible. Generá el expediente de nuevo.");
		} catch (err) {
			setError(errorMessage(err));
		}
	};

	const planText = (() => {
		const names = (upgrade?.requiredPlans?.length ? upgrade.requiredPlans : ["standard", "pro", "premium"]).map((p) => PLAN_LABELS[p] || p);
		return names.length > 1 ? `${names.slice(0, -1).join(", ")} o ${names[names.length - 1]}` : names[0];
	})();

	const sinDocumentos = !!estimate && estimate.documentos === 0;
	const showResult = !!job && !showForm;
	const pct = job && job.progress.total > 0 ? Math.min(100, Math.round((job.progress.done / job.progress.total) * 100)) : 0;
	const estimateHasta = formatFechaMov(estimate?.hastaFecha);
	const jobHasta = formatFechaMov(job?.snapshot?.hastaFecha);
	// Hay documentos más nuevos que los del PDF ya generado.
	const desactualizado = job?.status === "completed" && !!estimate && !!job.snapshot && estimate.documentos > job.snapshot.documentos;

	const panelSx = {
		px: 1.5,
		py: 1.25,
		borderRadius: 1.25,
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
		bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
	};
	const bodySx = { fontSize: "0.85rem", color: "text.primary", lineHeight: 1.55 };
	const hintSx = { fontSize: "0.75rem", color: "text.secondary", lineHeight: 1.5 };
	const secondaryBtnSx = {
		textTransform: "none",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: "text.secondary",
		borderRadius: 1.25,
		px: 2,
		py: 0.875,
		border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
		"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04), borderColor: alpha(BRAND_BLUE, 0.28) },
	};
	const primaryBtnSx = {
		textTransform: "none",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		bgcolor: BRAND_BLUE,
		color: "#fff",
		borderRadius: 1.25,
		px: 2,
		py: 0.875,
		boxShadow: "none",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
	};

	const renderEstimate = () =>
		estimate && (
			<Box sx={panelSx}>
				<Typography sx={{ ...bodySx, fontWeight: 600 }}>
					{estimate.documentos.toLocaleString("es-AR")} documentos · aprox. {formatBytes(estimate.bytes)}
				</Typography>
				{estimateHasta && <Typography sx={hintSx}>Incluye documentos hasta el {estimateHasta}.</Typography>}
				<Typography sx={hintSx}>
					{estimate.tomos > 1
						? `Por su tamaño se entrega en unos ${estimate.tomos} tomos, cada uno con su índice.`
						: "Se entrega en un solo PDF con índice."}{" "}
					Los movimientos sin documento adjunto no se incluyen.
				</Typography>
				{accessCutoffAt && (
					<Typography sx={hintSx}>Tu acceso a esta causa llega hasta el {dayjs(accessCutoffAt).format("DD/MM/YYYY")}.</Typography>
				)}
			</Box>
		);

	return (
		<ResponsiveDialog
			open={open}
			onClose={onClose}
			TransitionComponent={PopupTransition}
			maxWidth="xs"
			fullWidth
			aria-labelledby="expediente-export-title"
			PaperProps={{
				elevation: 0,
				sx: {
					borderRadius: 2,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
					boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
					overflow: "hidden",
				},
			}}
		>
			<DialogTitle
				id="expediente-export-title"
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1.25,
					px: 2.5,
					py: 1.75,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
					borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				}}
			>
				<Box
					sx={{
						width: 32,
						height: 32,
						borderRadius: 1,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flexShrink: 0,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
						color: BRAND_BLUE,
					}}
				>
					<DocumentDownload size={18} variant="Bulk" />
				</Box>
				<Stack spacing={0.125} sx={{ minWidth: 0, flex: 1 }}>
					<Stack direction="row" spacing={0.5} alignItems="center">
						<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
						<Typography
							sx={{ fontSize: "0.6rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}
						>
							Expediente PJN
						</Typography>
					</Stack>
					<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
						Descargar expediente completo
					</Typography>
					{folderName && (
						<Typography
							sx={{
								fontSize: "0.72rem",
								color: "text.secondary",
								letterSpacing: "-0.005em",
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{folderName}
						</Typography>
					)}
				</Stack>
			</DialogTitle>

			<DialogContent sx={{ p: 2.5, pt: "20px !important" }}>
				<Stack spacing={1.5}>
					{loading && (
						<Stack alignItems="center" sx={{ py: 3 }}>
							<CircularProgress size={28} sx={{ color: BRAND_BLUE }} />
						</Stack>
					)}

					{error && <Alert severity="error">{error}</Alert>}

					{/* Sin plan: estimación + aviso */}
					{!loading && upgrade && (
						<>
							{renderEstimate()}
							<Typography sx={bodySx}>La descarga del expediente completo en PDF está disponible en los planes {planText}.</Typography>
						</>
					)}

					{/* Formulario */}
					{!loading && !upgrade && estimate && !showResult && (
						<>
							{renderEstimate()}
							{sinDocumentos ? (
								<Typography sx={bodySx}>Esta causa todavía no tiene documentos para descargar.</Typography>
							) : (
								<>
									<RadioGroup value={order} onChange={(e) => setOrder(e.target.value as ExpedienteExportOrder)}>
										<FormControlLabel
											value="asc"
											control={<Radio size="small" />}
											label={<Typography sx={bodySx}>Del más antiguo al más reciente</Typography>}
										/>
										<FormControlLabel
											value="desc"
											control={<Radio size="small" />}
											label={<Typography sx={bodySx}>Del más reciente al más antiguo</Typography>}
										/>
									</RadioGroup>
									<Typography sx={hintSx}>
										Armarlo puede llevar unos minutos. Podés cerrar esta ventana: te avisamos cuando esté listo y el archivo queda
										disponible por 48 horas.
									</Typography>
								</>
							)}
						</>
					)}

					{/* En curso */}
					{!loading && showResult && isActive && job && (
						<Stack spacing={1}>
							<Typography sx={bodySx}>{job.status === "queued" ? "En cola para generarse…" : `Armando el expediente… ${pct}%`}</Typography>
							<LinearProgress
								variant={job.status === "queued" ? "indeterminate" : "determinate"}
								value={pct}
								sx={{ borderRadius: 1, bgcolor: alpha(BRAND_BLUE, 0.12), "& .MuiLinearProgress-bar": { bgcolor: BRAND_BLUE } }}
							/>
							<Typography sx={hintSx}>Podés cerrar esta ventana: te avisamos cuando esté listo.</Typography>
						</Stack>
					)}

					{/* Listo */}
					{!loading && showResult && job?.status === "completed" && (
						<Stack spacing={1.25}>
							<Box sx={panelSx}>
								<Typography sx={{ ...bodySx, fontWeight: 600 }}>
									{job.tomos.length > 1 ? `El expediente está listo en ${job.tomos.length} tomos.` : "El expediente está listo."}
								</Typography>
								{jobHasta && <Typography sx={hintSx}>Incluye documentos hasta el {jobHasta}.</Typography>}
								{job.expiresAt && (
									<Typography sx={hintSx}>Disponible para descargar hasta el {dayjs(job.expiresAt).format("DD/MM/YYYY HH:mm")}.</Typography>
								)}
							</Box>
							{desactualizado && (
								<Typography sx={hintSx}>
									La causa tiene documentos más nuevos{estimateHasta ? ` (hasta el ${estimateHasta})` : ""}. Generalo de nuevo para
									incluirlos.
								</Typography>
							)}
							{job.tomos.map((tomo) => (
								<Button
									key={tomo.n}
									startIcon={<DocumentDownload size={18} variant="Bulk" />}
									onClick={() => handleDownload(tomo.n)}
									sx={{ ...secondaryBtnSx, color: BRAND_BLUE, borderColor: alpha(BRAND_BLUE, 0.28), justifyContent: "flex-start" }}
								>
									{job.tomos.length > 1 ? `Tomo ${tomo.n}` : "Descargar PDF"} · {formatBytes(tomo.bytes)}
									{tomo.pages ? ` · ${tomo.pages.toLocaleString("es-AR")} páginas` : ""}
								</Button>
							))}
							{job.omitidos > 0 && (
								<Typography sx={hintSx}>
									{job.omitidos === 1
										? "1 documento no pudo incorporarse porque el archivo original está dañado."
										: `${job.omitidos} documentos no pudieron incorporarse porque los archivos originales están dañados.`}
								</Typography>
							)}
						</Stack>
					)}

					{/* Falló */}
					{!loading && showResult && job?.status === "failed" && (
						<Alert severity="error">{job.error || "No se pudo generar el expediente. Intentá de nuevo."}</Alert>
					)}
				</Stack>
			</DialogContent>

			<DialogActions sx={{ px: 2.5, py: 1.75, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` }}>
				<Button onClick={onClose} sx={secondaryBtnSx}>
					Cerrar
				</Button>
				{!loading && upgrade && (
					<Button variant="contained" onClick={() => navigate("/suscripciones/tables")} sx={primaryBtnSx}>
						Ver planes
					</Button>
				)}
				{!loading && !upgrade && estimate && !showResult && !sinDocumentos && (
					<Button variant="contained" onClick={handleGenerate} disabled={submitting} sx={primaryBtnSx}>
						{submitting ? "Enviando…" : "Generar PDF"}
					</Button>
				)}
				{!loading && showResult && job?.status === "failed" && (
					<Button variant="contained" onClick={() => setShowForm(true)} sx={primaryBtnSx}>
						Intentar de nuevo
					</Button>
				)}
				{!loading && showResult && job?.status === "completed" && (
					<Button onClick={() => setShowForm(true)} sx={secondaryBtnSx}>
						Generar de nuevo
					</Button>
				)}
			</DialogActions>
		</ResponsiveDialog>
	);
};

export default ExpedienteExportDialog;

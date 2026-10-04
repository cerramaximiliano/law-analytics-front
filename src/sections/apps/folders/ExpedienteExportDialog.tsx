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
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { DocumentDownload } from "iconsax-react";
import { ResponsiveDialog } from "components/@extended/ResponsiveDialog";
import { createExpedienteExport, getExpedienteExport } from "services/expedienteExportService";
import type {
	ExpedienteExportEstimate,
	ExpedienteExportJob,
	ExpedienteExportOrder,
	ExpedienteExportResponse,
} from "types/expedienteExport";
import dayjs from "utils/dayjs-config";

// ==============================|| DESCARGA DEL EXPEDIENTE COMPLETO (PJN) ||============================== //
//
// Se abre desde el menú de cada carpeta PJN del listado. El expediente no se
// arma en el momento: el hub encola un job y un worker une los documentos en
// tomos de ~200 MB (hay causas de casi 2 GB). Este diálogo muestra la
// estimación, dispara el job y hace polling hasta que los tomos están listos.
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

interface ExpedienteExportDialogProps {
	open: boolean;
	onClose: () => void;
	folderId: string | null;
	folderName?: string;
}

const ExpedienteExportDialog: React.FC<ExpedienteExportDialogProps> = ({ open, onClose, folderId, folderName }) => {
	const navigate = useNavigate();
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

	const applyResponse = useCallback((res: ExpedienteExportResponse) => {
		if (res.estimate) setEstimate(res.estimate);
		setJob(res.job ?? null);
		setUpgrade(res.requiresUpgrade ? { requiredPlans: res.requiredPlans || [] } : null);
		setAccessCutoffAt(res.accessCutoffAt ?? null);
	}, []);

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

	const sinMovimientos = !!estimate && estimate.movimientos === 0;
	const showResult = !!job && !showForm;
	const pct = job && job.progress.total > 0 ? Math.min(100, Math.round((job.progress.done / job.progress.total) * 100)) : 0;

	const renderEstimate = () =>
		estimate && (
			<Box
				sx={(t) => ({
					px: 1.5,
					py: 1.25,
					borderRadius: 1,
					border: `1px solid ${t.palette.divider}`,
					bgcolor: alpha(t.palette.text.primary, 0.02),
				})}
			>
				<Typography variant="body2">
					{estimate.movimientos.toLocaleString("es-AR")} movimientos · {estimate.documentos.toLocaleString("es-AR")} documentos · aprox.{" "}
					{formatBytes(estimate.bytes)}
				</Typography>
				<Typography variant="caption" color="text.secondary">
					{estimate.tomos > 1
						? `Por su tamaño se entrega en unos ${estimate.tomos} tomos, cada uno con su índice.`
						: "Se entrega en un solo PDF con índice."}
					{accessCutoffAt ? ` Incluye los movimientos hasta el ${dayjs(accessCutoffAt).format("DD/MM/YYYY")}.` : ""}
				</Typography>
			</Box>
		);

	return (
		<ResponsiveDialog open={open} onClose={onClose} maxWidth="xs" fullWidth PaperProps={{ elevation: 5, sx: { borderRadius: 2 } }}>
			<DialogTitle sx={{ pb: 0.5 }}>
				<Typography variant="h5" component="span">
					Descargar expediente completo
				</Typography>
				{folderName && (
					<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.25 }} noWrap>
						{folderName}
					</Typography>
				)}
			</DialogTitle>

			<DialogContent sx={{ pt: "12px !important" }}>
				<Stack spacing={1.5}>
					{loading && (
						<Stack alignItems="center" sx={{ py: 3 }}>
							<CircularProgress size={28} />
						</Stack>
					)}

					{error && <Alert severity="error">{error}</Alert>}

					{/* Sin plan: estimación + aviso */}
					{!loading && upgrade && (
						<>
							{renderEstimate()}
							<Alert severity="info">La descarga del expediente completo en PDF está disponible en los planes {planText}.</Alert>
						</>
					)}

					{/* Formulario */}
					{!loading && !upgrade && estimate && !showResult && (
						<>
							{renderEstimate()}
							{sinMovimientos ? (
								<Alert severity="info">Esta causa todavía no tiene movimientos para descargar.</Alert>
							) : (
								<>
									<RadioGroup value={order} onChange={(e) => setOrder(e.target.value as ExpedienteExportOrder)}>
										<FormControlLabel value="asc" control={<Radio size="small" />} label="Del más antiguo al más reciente" />
										<FormControlLabel value="desc" control={<Radio size="small" />} label="Del más reciente al más antiguo" />
									</RadioGroup>
									<Typography variant="caption" color="text.secondary">
										Armarlo puede llevar unos minutos. Podés cerrar esta ventana y volver después: el archivo queda disponible por 48 horas.
									</Typography>
								</>
							)}
						</>
					)}

					{/* En curso */}
					{!loading && showResult && isActive && job && (
						<Stack spacing={1}>
							<Typography variant="body2">
								{job.status === "queued" ? "En cola para generarse…" : `Armando el expediente… ${pct}%`}
							</Typography>
							<LinearProgress variant={job.status === "queued" ? "indeterminate" : "determinate"} value={pct} />
							<Typography variant="caption" color="text.secondary">
								Podés cerrar esta ventana y volver después desde el menú de la carpeta.
							</Typography>
						</Stack>
					)}

					{/* Listo */}
					{!loading && showResult && job?.status === "completed" && (
						<Stack spacing={1}>
							<Typography variant="body2">
								{job.tomos.length > 1 ? `El expediente está listo en ${job.tomos.length} tomos.` : "El expediente está listo."}
								{job.expiresAt ? ` Disponible hasta el ${dayjs(job.expiresAt).format("DD/MM/YYYY HH:mm")}.` : ""}
							</Typography>
							{job.tomos.map((tomo) => (
								<Button
									key={tomo.n}
									variant="outlined"
									startIcon={<DocumentDownload size={18} />}
									onClick={() => handleDownload(tomo.n)}
									sx={{ textTransform: "none", justifyContent: "flex-start" }}
								>
									{job.tomos.length > 1 ? `Tomo ${tomo.n}` : "Descargar PDF"} · {formatBytes(tomo.bytes)}
									{tomo.pages ? ` · ${tomo.pages.toLocaleString("es-AR")} páginas` : ""}
								</Button>
							))}
							{job.omitidos > 0 && (
								<Alert severity="warning">
									{job.omitidos === 1
										? "1 documento no pudo incorporarse; figura en el índice como no disponible."
										: `${job.omitidos} documentos no pudieron incorporarse; figuran en el índice como no disponibles.`}
								</Alert>
							)}
						</Stack>
					)}

					{/* Falló */}
					{!loading && showResult && job?.status === "failed" && (
						<Alert severity="error">{job.error || "No se pudo generar el expediente. Intentá de nuevo."}</Alert>
					)}
				</Stack>
			</DialogContent>

			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button onClick={onClose} color="secondary" sx={{ textTransform: "none" }}>
					Cerrar
				</Button>
				{!loading && upgrade && (
					<Button variant="contained" onClick={() => navigate("/suscripciones/tables")} sx={{ textTransform: "none" }}>
						Ver planes
					</Button>
				)}
				{!loading && !upgrade && estimate && !showResult && !sinMovimientos && (
					<Button variant="contained" onClick={handleGenerate} disabled={submitting} sx={{ textTransform: "none" }}>
						{submitting ? "Enviando…" : "Generar PDF"}
					</Button>
				)}
				{!loading && showResult && (job?.status === "completed" || job?.status === "failed") && (
					<Button variant={job.status === "failed" ? "contained" : "text"} onClick={() => setShowForm(true)} sx={{ textTransform: "none" }}>
						{job.status === "failed" ? "Intentar de nuevo" : "Generar de nuevo"}
					</Button>
				)}
			</DialogActions>
		</ResponsiveDialog>
	);
};

export default ExpedienteExportDialog;

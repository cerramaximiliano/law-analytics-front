import { useEffect, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	Grid,
	Link,
	Stack,
	Typography,
} from "@mui/material";
import { ArrowLeft, DocumentDownload, RefreshCircle } from "iconsax-react";

import MainCard from "components/MainCard";
import { dispatch } from "store";
import {
	fetchSolicitudById,
	fetchSolicitudStatus,
	getSecloDownloadUrl,
	reactivarSolicitud,
} from "store/reducers/seclo";
import type { SecloSolicitud, SecloSolicitudStatus, SecloStatus } from "types/seclo";

const STATUS_COLORS: Record<SecloStatus, "default" | "warning" | "info" | "success" | "error"> = {
	pending:           "warning",
	processing:        "info",
	submitted:         "info",
	completed:         "success",
	error:             "error",
	dry_run_completed: "info",
};

const STATUS_LABELS: Record<SecloStatus, string> = {
	pending:           "Pendiente",
	processing:        "Procesando",
	submitted:         "Enviada",
	completed:         "Completada",
	error:             "Error",
	dry_run_completed: "Prueba completada",
};

// Polling cuando el estado todavía es "vivo"
const LIVE_STATUSES: SecloStatus[] = ["pending", "processing", "submitted"];
const POLL_INTERVAL_MS = 15000;

function getParticipantName(p: any): string {
	if (p?.contactId && typeof p.contactId === "object") {
		return `${p.contactId.name || ""} ${p.contactId.lastName || ""}`.trim() || p.snapshot?.name || "—";
	}
	return p?.snapshot?.name || "—";
}

export default function SolicitudDetail() {
	const { id } = useParams<{ id: string }>();
	const navigate = useNavigate();

	const [sol, setSol] = useState<SecloSolicitud | null>(null);
	const [status, setStatus] = useState<SecloSolicitudStatus | null>(null);
	const [loading, setLoading] = useState(true);
	const [reactivating, setReactivating] = useState(false);

	const load = async () => {
		if (!id) return;
		const fetched = await dispatch<any>(fetchSolicitudById(id));
		setSol(fetched);
		setLoading(false);
	};

	useEffect(() => {
		load();
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [id]);

	// Polling de status si está vivo
	useEffect(() => {
		if (!sol || !id) return;
		if (!LIVE_STATUSES.includes(sol.status)) return;

		const tick = async () => {
			const s = await dispatch<any>(fetchSolicitudStatus(id));
			if (s) {
				setStatus(s);
				// Si cambió de estado, refrescar el doc completo
				if (s.status !== sol.status) load();
			}
		};
		const intv = setInterval(tick, POLL_INTERVAL_MS);
		return () => clearInterval(intv);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [sol?.status, id]);

	const handleReactivar = async () => {
		if (!id) return;
		setReactivating(true);
		try {
			const updated = await dispatch<any>(reactivarSolicitud(id));
			if (updated) setSol(updated);
		} finally {
			setReactivating(false);
		}
	};

	const handleDownload = async (key: string, fileName: string) => {
		const url = await getSecloDownloadUrl(key);
		if (url) {
			const a = document.createElement("a");
			a.href = url;
			a.download = fileName;
			a.target = "_blank";
			a.click();
		}
	};

	if (loading) {
		return (
			<MainCard title="Solicitud SECLO">
				<Box display="flex" justifyContent="center" py={6}><CircularProgress /></Box>
			</MainCard>
		);
	}

	if (!sol) {
		return (
			<MainCard title="Solicitud SECLO">
				<Alert severity="error">Solicitud no encontrada</Alert>
				<Button sx={{ mt: 2 }} startIcon={<ArrowLeft />} onClick={() => navigate("/herramientas/seclo")}>
					Volver
				</Button>
			</MainCard>
		);
	}

	const audiencias = sol.resultado?.audiencias || [];
	const numeroExpediente = sol.resultado?.numeroExpediente || status?.numeroExpediente;
	const numeroTramite    = sol.resultado?.numeroTramite    || status?.numeroTramite;
	const errorMsg         = sol.errorInfo?.message;

	return (
		<MainCard
			title={
				<Stack direction="row" alignItems="center" spacing={1.5}>
					<Typography variant="h4">Solicitud SECLO</Typography>
					<Chip label={STATUS_LABELS[sol.status]} color={STATUS_COLORS[sol.status]} size="small" />
					{LIVE_STATUSES.includes(sol.status) && (
						<Chip
							label="actualizando…"
							size="small"
							variant="outlined"
							icon={<CircularProgress size={10} />}
							sx={{ "& .MuiChip-icon": { ml: 1 } }}
						/>
					)}
				</Stack>
			}
			secondary={
				<Button startIcon={<ArrowLeft size={16} />} onClick={() => navigate("/herramientas/seclo")} size="small">
					Volver al listado
				</Button>
			}
		>
			<Stack spacing={3}>
				{/* Error si lo hubo */}
				{errorMsg && sol.status === "error" && (
					<Alert
						severity="error"
						action={
							<Button
								size="small"
								color="inherit"
								startIcon={reactivating ? <CircularProgress size={14} /> : <RefreshCircle size={16} />}
								onClick={handleReactivar}
								disabled={reactivating}
							>
								Reactivar
							</Button>
						}
					>
						<strong>Error al procesar:</strong> {errorMsg}
					</Alert>
				)}

				{/* Próxima audiencia destacada */}
				{audiencias.length > 0 && audiencias[0].fecha && (
					<Box
						sx={{
							p: 2,
							borderRadius: 1,
							bgcolor: "primary.lighter",
							borderLeft: 4,
							borderColor: "primary.main",
						}}
					>
						<Typography variant="overline" color="primary.dark">Próxima audiencia</Typography>
						<Typography variant="h5" mt={0.5}>
							📅 {audiencias[0].fecha}
							{audiencias[0].hora && ` — ${audiencias[0].hora} hs`}
						</Typography>
						{audiencias[0].lugar && (
							<Typography variant="body2" mt={0.5}>📍 {audiencias[0].lugar}</Typography>
						)}
						{audiencias[0].conciliador?.nombre && (
							<Typography variant="body2" mt={1}>
								<strong>Conciliador:</strong> {audiencias[0].conciliador.nombre}
								{audiencias[0].conciliador.sala && ` — Sala ${audiencias[0].conciliador.sala}`}
							</Typography>
						)}
					</Box>
				)}

				{/* Datos generales */}
				<Box>
					<Typography variant="overline" color="text.secondary">Información general</Typography>
					<Grid container spacing={2} mt={0}>
						<Grid item xs={12} sm={6}>
							<Typography variant="body2" color="text.secondary">Trabajador</Typography>
							<Typography variant="body2" fontWeight={600}>{getParticipantName(sol.requirentes[0])}</Typography>
						</Grid>
						<Grid item xs={12} sm={6}>
							<Typography variant="body2" color="text.secondary">Empleador</Typography>
							<Typography variant="body2" fontWeight={600}>{getParticipantName(sol.requeridos[0])}</Typography>
						</Grid>
						<Grid item xs={12}>
							<Typography variant="body2" color="text.secondary">Objeto del reclamo</Typography>
							<Box mt={0.5} display="flex" gap={0.5} flexWrap="wrap">
								{sol.objetoReclamo.map((o) => (
									<Chip key={o} label={o} size="small" variant="outlined" />
								))}
							</Box>
						</Grid>
						{sol.comentarioReclamo && (
							<Grid item xs={12}>
								<Typography variant="body2" color="text.secondary">Comentario</Typography>
								<Typography variant="body2">{sol.comentarioReclamo}</Typography>
							</Grid>
						)}
						<Grid item xs={12} sm={6}>
							<Typography variant="body2" color="text.secondary">Iniciado por</Typography>
							<Typography variant="body2">{sol.iniciadoPor === "trabajador" ? "Trabajador" : "Empleador"}</Typography>
						</Grid>
						{sol.datosAbogado && (
							<Grid item xs={12} sm={6}>
								<Typography variant="body2" color="text.secondary">Abogado</Typography>
								<Typography variant="body2">
									Tº {sol.datosAbogado.tomo} Fº {sol.datosAbogado.folio}
								</Typography>
							</Grid>
						)}
					</Grid>
				</Box>

				{/* Resultado del trámite */}
				{(numeroExpediente || numeroTramite) && (
					<>
						<Divider />
						<Box>
							<Typography variant="overline" color="text.secondary">Trámite en el portal</Typography>
							<Grid container spacing={2} mt={0}>
								{numeroExpediente && (
									<Grid item xs={12} sm={6}>
										<Typography variant="body2" color="text.secondary">Expediente</Typography>
										<Typography variant="body2" sx={{ fontFamily: "monospace" }}>{numeroExpediente}</Typography>
									</Grid>
								)}
								{numeroTramite && (
									<Grid item xs={12} sm={6}>
										<Typography variant="body2" color="text.secondary">N° Trámite</Typography>
										<Typography variant="body2" sx={{ fontFamily: "monospace" }}>{numeroTramite}</Typography>
									</Grid>
								)}
								{sol.submittedAt && (
									<Grid item xs={12} sm={6}>
										<Typography variant="body2" color="text.secondary">Enviado al portal</Typography>
										<Typography variant="body2">{new Date(sol.submittedAt).toLocaleString("es-AR")}</Typography>
									</Grid>
								)}
								{sol.completedAt && (
									<Grid item xs={12} sm={6}>
										<Typography variant="body2" color="text.secondary">Completado</Typography>
										<Typography variant="body2">{new Date(sol.completedAt).toLocaleString("es-AR")}</Typography>
									</Grid>
								)}
							</Grid>
						</Box>
					</>
				)}

				{/* Audiencias / constancias */}
				{audiencias.length > 0 && (
					<>
						<Divider />
						<Box>
							<Typography variant="overline" color="text.secondary">Audiencias ({audiencias.length})</Typography>
							<Stack spacing={1.5} mt={1}>
								{audiencias.map((a, i) => (
									<Box
										key={i}
										sx={{ p: 1.5, border: 1, borderColor: "divider", borderRadius: 1 }}
									>
										<Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between" flexWrap="wrap">
											<Box>
												<Typography variant="body2" fontWeight={600}>
													{a.fecha || "—"}{a.hora && ` ${a.hora} hs`}
												</Typography>
												{a.lugar && (
													<Typography variant="caption" color="text.secondary">{a.lugar}</Typography>
												)}
											</Box>
											{a.constanciaKey && (
												<Button
													size="small"
													startIcon={<DocumentDownload size={14} />}
													onClick={() => handleDownload(a.constanciaKey!, `constancia-${a.fecha || i}.pdf`)}
												>
													Constancia
												</Button>
											)}
										</Stack>
										{a.conciliador?.nombre && (
											<Box mt={1}>
												<Typography variant="caption" color="text.secondary">
													Conciliador: {a.conciliador.nombre}
													{a.conciliador.email && ` — ${a.conciliador.email}`}
												</Typography>
											</Box>
										)}
									</Box>
								))}
							</Stack>
						</Box>
					</>
				)}

				{/* Documentos adjuntos */}
				{sol.documentos.length > 0 && (
					<>
						<Divider />
						<Box>
							<Typography variant="overline" color="text.secondary">Documentos adjuntos</Typography>
							<Stack spacing={0.5} mt={1}>
								{sol.documentos.map((d) => (
									<Stack direction="row" spacing={1} alignItems="center" key={d.s3Key}>
										<Typography variant="body2" sx={{ minWidth: 160 }}>{d.tipo.toUpperCase()}</Typography>
										<Link
											component="button"
											variant="body2"
											onClick={() => handleDownload(d.s3Key, d.fileName || "documento")}
										>
											{d.fileName || d.s3Key.split("/").pop()}
										</Link>
									</Stack>
								))}
							</Stack>
						</Box>
					</>
				)}
			</Stack>
		</MainCard>
	);
}

import React, { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import {
	Alert,
	Box,
	Button,
	Chip,
	IconButton,
	InputAdornment,
	Skeleton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TablePagination,
	TableRow,
	TextField,
	Tooltip,
	Typography,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { DocumentText, FolderOpen, NotificationStatus, Refresh, SearchNormal1 } from "iconsax-react";

import MainCard from "components/MainCard";
import PjnPdfViewer from "components/PjnPdfViewer";
import { useTeam } from "contexts/TeamContext";
import { useSelector } from "store";
import { BRAND_BLUE } from "themes/dashboardTokens";
import dayjs from "utils/dayjs-config";
import { PJN_PROFILE_PATH } from "utils/pjnBindingState";
import { getPjnCedulaPdfUrl, getPjnCedulasBandeja } from "services/pjnMovementsService";
import type { PjnCedulaGlobal, PjnCedulasBandejaResponse } from "types/pjnCedula";
import type { PjnMovement } from "types/pjnMovement";

const LIMIT = 50;

// ==============================|| NOTIFICACIONES — bandeja del PJN de todos los expedientes ||============================== //
//
// Vista global (14/11/2026, pedido de Estudio FS Abogados): las cédulas que el juzgado notificó al domicilio
// electrónico, de todas las carpetas activas que ve quien consulta, juntas. En equipo la propietaria ve todas y cada
// integrante con «cada uno ve lo suyo» ve las de sus expedientes (lo resuelve el hub, GET /api/folders/cedulas/bandeja).
// Cada expediente sigue teniendo las suyas en Actividad → Notificaciones; acá se abren con el mismo visor de PDF.

const NotificacionesPage = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const navigate = useNavigate();
	const { activeTeam, seesOnlyOwn, getRequestHeaders } = useTeam();
	const isPlatformAdmin = useSelector((s: any) => s.auth?.user?.role === "ADMIN_ROLE");

	const [q, setQ] = useState("");
	const [qDebounced, setQDebounced] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [page, setPage] = useState(0);
	const [data, setData] = useState<PjnCedulasBandejaResponse | null>(null);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [reloadKey, setReloadKey] = useState(0);

	useEffect(() => {
		const t = setTimeout(() => setQDebounced(q.trim()), 350);
		return () => clearTimeout(t);
	}, [q]);

	useEffect(() => {
		setPage(0);
	}, [qDebounced, from, to, activeTeam?._id]);

	const teamId = activeTeam?._id;
	useEffect(() => {
		let cancelled = false;
		setLoading(true);
		setError(null);
		getPjnCedulasBandeja(
			{ q: qDebounced || undefined, from: from || undefined, to: to || undefined, page: page + 1, limit: LIMIT },
			getRequestHeaders(),
		)
			.then((r) => {
				if (!cancelled) setData(r);
			})
			.catch((e) => {
				if (!cancelled) setError(e?.response?.data?.message || "No se pudieron cargar las notificaciones de la bandeja");
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [qDebounced, from, to, page, teamId, reloadKey]);

	const filas = data?.data || [];

	// Mismo visor de PDF que Actividad → Movimientos: sobre el movimiento vinculado o sobre el PDF bajado de la bandeja.
	const tienePdf = (c: PjnCedulaGlobal) => Boolean(c.movimiento || c.pdf?.status === "downloaded");
	const abribles = useMemo(() => filas.filter(tienePdf), [filas]);
	const [viewerIdx, setViewerIdx] = useState<number | null>(null);
	const abrirCedula = (c: PjnCedulaGlobal) => {
		const idx = abribles.findIndex((x) => x.id === c.id);
		if (idx >= 0) setViewerIdx(idx);
	};
	const actual = viewerIdx !== null ? abribles[viewerIdx] || null : null;
	const viewerMovement: PjnMovement | null = actual
		? actual.movimiento || {
				_id: actual.id,
				fecha: actual.fecha,
				tipo: "CEDULA ELECTRONICA (bandeja del PJN)",
				detalle: [actual.numeroCedula ? `Cédula N° ${actual.numeroCedula}` : null, actual.oficina].filter(Boolean).join(" · ") || null,
				url: null,
				pdfStatus: "downloaded",
				pdfBytes: actual.pdf?.bytes || undefined,
				hasPdf: true,
				read: true,
		  }
		: null;
	const pdfUrlResolver = actual && !actual.movimiento ? () => getPjnCedulaPdfUrl(actual.folder._id, actual.sourceId) : undefined;

	const irAlExpediente = (c: PjnCedulaGlobal) => navigate(`/apps/folders/details/${c.folder._id}?tab=activity&sub=notifications`);

	const hoy = dayjs().startOf("day");
	const vencChip = (c: PjnCedulaGlobal) => {
		if (!c.vencimiento)
			return (
				<Typography variant="caption" color="text.secondary">
					—
				</Typography>
			);
		const v = dayjs(c.vencimiento);
		const dias = v.diff(hoy, "day");
		const color = dias < 0 ? "default" : dias <= 2 ? "error" : dias <= 5 ? "warning" : "success";
		const label = dias < 0 ? `Venció ${v.format("DD/MM")}` : dias === 0 ? "Vence hoy" : `Vence ${v.format("DD/MM")}`;
		return <Chip size="small" color={color} variant={dias < 0 ? "outlined" : "filled"} label={label} sx={{ fontWeight: 600 }} />;
	};

	const alcance = activeTeam
		? seesOnlyOwn
			? "Las cédulas de los expedientes a tu cargo."
			: `Todas las cédulas de los expedientes del equipo «${activeTeam.name}».`
		: "Las cédulas de tus expedientes.";

	const hayFiltros = Boolean(qDebounced || from || to);
	const borderColor = alpha(BRAND_BLUE, isDark ? 0.18 : 0.1);

	return (
		<>
			<MainCard content={false} sx={{ borderRadius: 2, border: `1px solid ${borderColor}` }}>
				<Stack
					direction={{ xs: "column", md: "row" }}
					alignItems={{ md: "center" }}
					justifyContent="space-between"
					spacing={1.5}
					sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${borderColor}`, bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03) }}
				>
					<Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0 }}>
						<Box
							sx={{
								width: 36,
								height: 36,
								borderRadius: 1,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
								color: BRAND_BLUE,
								flexShrink: 0,
							}}
						>
							<NotificationStatus size={20} variant="Bulk" />
						</Box>
						<Stack spacing={0.125} sx={{ minWidth: 0 }}>
							<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em" }}>Notificaciones</Typography>
							<Typography variant="caption" color="text.secondary">
								Bandeja de notificaciones del PJN (solo expedientes con cuenta de Mis Causas vinculada) · {alcance}
							</Typography>
						</Stack>
					</Stack>
					<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
						{data && !loading && (
							<Chip
								size="small"
								variant="outlined"
								label={`${data.total.toLocaleString("es-AR")} ${data.total === 1 ? "cédula" : "cédulas"} · ${data.carpetas.toLocaleString(
									"es-AR",
								)} ${data.carpetas === 1 ? "expediente" : "expedientes"}`}
								sx={{ fontWeight: 600 }}
							/>
						)}
						<Tooltip title="Actualizar">
							<IconButton size="small" onClick={() => setReloadKey((k) => k + 1)} aria-label="Actualizar">
								<Refresh size={18} />
							</IconButton>
						</Tooltip>
					</Stack>
				</Stack>

				<Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} sx={{ px: 2.5, py: 1.5, borderBottom: `1px solid ${borderColor}` }}>
					<TextField
						size="small"
						fullWidth
						placeholder="Buscar por expediente, carátula, cédula, oficina o destinatario"
						value={q}
						onChange={(e) => setQ(e.target.value)}
						InputProps={{
							startAdornment: (
								<InputAdornment position="start">
									<SearchNormal1 size={16} />
								</InputAdornment>
							),
						}}
					/>
					<TextField
						size="small"
						type="date"
						label="Desde"
						value={from}
						onChange={(e) => setFrom(e.target.value)}
						InputLabelProps={{ shrink: true }}
						sx={{ minWidth: 150 }}
					/>
					<TextField
						size="small"
						type="date"
						label="Hasta"
						value={to}
						onChange={(e) => setTo(e.target.value)}
						InputLabelProps={{ shrink: true }}
						sx={{ minWidth: 150 }}
					/>
					{hayFiltros && (
						<Button
							size="small"
							color="secondary"
							onClick={() => {
								setQ("");
								setFrom("");
								setTo("");
							}}
							sx={{ textTransform: "none", whiteSpace: "nowrap" }}
						>
							Limpiar
						</Button>
					)}
				</Stack>

				{/* Solo PJN con cuenta de Mis Causas: sin ninguna credencial activa en el alcance, la bandeja no se sincroniza. */}
				{!loading && data && data.credencialesActivas === 0 && (
					<Alert
						severity="warning"
						sx={{ m: 2.5, mb: 0 }}
						action={
							<Button
								size="small"
								color="inherit"
								onClick={() => navigate(PJN_PROFILE_PATH)}
								sx={{ textTransform: "none", whiteSpace: "nowrap" }}
							>
								Vincular Mis Causas
							</Button>
						}
					>
						{activeTeam
							? "Nadie en el equipo tiene una cuenta de Mis Causas del PJN vinculada, así que la bandeja de notificaciones no se sincroniza. "
							: "No tenés una cuenta de Mis Causas del PJN vinculada, así que la bandeja de notificaciones no se sincroniza. "}
						Las cédulas aparecen acá cuando se autentican las credenciales en Integraciones.
					</Alert>
				)}
				{loading ? (
					<Box sx={{ p: 2.5 }}>
						<Skeleton variant="rounded" height={48} sx={{ mb: 1 }} />
						<Skeleton variant="rounded" height={48} sx={{ mb: 1 }} />
						<Skeleton variant="rounded" height={48} />
					</Box>
				) : error ? (
					<Alert severity="error" sx={{ m: 2.5 }}>
						{error}
					</Alert>
				) : filas.length === 0 ? (
					<Box sx={{ p: 4, textAlign: "center" }}>
						<Typography variant="body2" color="text.secondary">
							{hayFiltros
								? "Ninguna cédula coincide con la búsqueda."
								: data && data.carpetas === 0
								? "No tenés expedientes del PJN activos. Las cédulas aparecen acá cuando vinculás tu cuenta de Mis Causas y tus expedientes."
								: "Todavía no hay cédulas en la bandeja de notificaciones del PJN de la cuenta vinculada."}
						</Typography>
						{!hayFiltros && data && data.carpetas === 0 && (
							<Button size="small" sx={{ mt: 1.5, textTransform: "none" }} onClick={() => navigate(PJN_PROFILE_PATH)}>
								Vincular Mis Causas
							</Button>
						)}
					</Box>
				) : (
					<>
						<TableContainer>
							<Table size="small" sx={{ "& td, & th": { fontSize: "0.8rem", verticalAlign: "top" } }}>
								<TableHead>
									<TableRow>
										<TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>Notificada</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>Expediente</TableCell>
										<TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>N° cédula</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>Oficina / autor</TableCell>
										<TableCell sx={{ fontWeight: 700 }}>Destinatario</TableCell>
										{isPlatformAdmin && <TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }}>Vencimiento</TableCell>}
										<TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }} align="right">
											Acciones
										</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{filas.map((c) => (
										<TableRow key={c.id} hover data-testid="bandeja-cedula-row">
											<TableCell sx={{ whiteSpace: "nowrap" }}>{c.fecha ? dayjs(c.fecha).format("DD/MM/YYYY HH:mm") : "—"}</TableCell>
											<TableCell sx={{ minWidth: 180, maxWidth: 320 }}>
												<Typography
													component="button"
													type="button"
													onClick={() => irAlExpediente(c)}
													sx={{
														fontSize: "0.8rem",
														fontWeight: 600,
														color: BRAND_BLUE,
														background: "none",
														border: 0,
														p: 0,
														cursor: "pointer",
														textAlign: "left",
														"&:hover": { textDecoration: "underline" },
													}}
												>
													{c.folder.folderName || c.expediente.caratula || "Expediente"}
												</Typography>
												{(c.folder.numero || c.expediente.numeracion) && (
													<Typography variant="caption" color="text.secondary" component="div">
														{c.expediente.numeracion || c.folder.numero}
													</Typography>
												)}
											</TableCell>
											<TableCell sx={{ whiteSpace: "nowrap" }}>{c.numeroCedula || "—"}</TableCell>
											<TableCell>
												<Typography sx={{ fontSize: "0.8rem" }}>{c.oficina || "—"}</Typography>
												{c.autor && c.autor.trim().toUpperCase() !== (c.oficina || "").trim().toUpperCase() && (
													<Typography variant="caption" color="text.secondary">
														{c.autor}
													</Typography>
												)}
											</TableCell>
											<TableCell>{c.destinatarios.length ? c.destinatarios.join(", ") : "—"}</TableCell>
											{isPlatformAdmin && <TableCell sx={{ whiteSpace: "nowrap" }}>{vencChip(c)}</TableCell>}
											<TableCell align="right" sx={{ whiteSpace: "nowrap" }}>
												<Stack direction="row" spacing={0.5} justifyContent="flex-end" alignItems="center">
													{tienePdf(c) ? (
														<Button
															size="small"
															variant="outlined"
															startIcon={<DocumentText size={14} />}
															onClick={() => abrirCedula(c)}
															data-testid="bandeja-cedula-ver"
															sx={{ textTransform: "none", fontSize: "0.75rem" }}
														>
															Ver cédula
														</Button>
													) : (
														<Tooltip title="La cédula todavía no aparece entre los movimientos del expediente; el PDF se incorpora cuando el juzgado la carga.">
															<Typography variant="caption" color="text.secondary">
																PDF no disponible aún
															</Typography>
														</Tooltip>
													)}
													<Tooltip title="Ir al expediente">
														<IconButton size="small" onClick={() => irAlExpediente(c)} aria-label="Ir al expediente">
															<FolderOpen size={16} />
														</IconButton>
													</Tooltip>
												</Stack>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
						<TablePagination
							component="div"
							count={data?.total || 0}
							page={page}
							onPageChange={(_e, p) => setPage(p)}
							rowsPerPage={LIMIT}
							rowsPerPageOptions={[LIMIT]}
							labelDisplayedRows={({ from: f, to: t, count }) => `${f}–${t} de ${count}`}
						/>
					</>
				)}
			</MainCard>

			{actual && (
				<PjnPdfViewer
					open={viewerIdx !== null && Boolean(viewerMovement)}
					onClose={() => setViewerIdx(null)}
					folderId={actual.folder._id}
					folderName={actual.folder.folderName}
					movement={viewerMovement}
					onPrev={() => setViewerIdx((i) => (i !== null && i > 0 ? i - 1 : i))}
					onNext={() => setViewerIdx((i) => (i !== null && i < abribles.length - 1 ? i + 1 : i))}
					hasPrev={viewerIdx !== null && viewerIdx > 0}
					hasNext={viewerIdx !== null && viewerIdx < abribles.length - 1}
					pdfUrlResolver={pdfUrlResolver}
				/>
			)}
		</>
	);
};

export default NotificacionesPage;

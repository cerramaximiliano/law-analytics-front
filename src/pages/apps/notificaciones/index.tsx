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
	TableRow,
	TextField,
	Tooltip,
	Typography,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import {
	CloseCircle,
	DocumentText,
	FolderOpen,
	Key,
	Maximize,
	NotificationStatus,
	Refresh,
	SearchNormal1,
	SearchStatus1,
} from "iconsax-react";

import MainCard from "components/MainCard";
import PjnPdfViewer from "components/PjnPdfViewer";
import { TablePagination } from "components/third-party/ReactTable";
import { useTeam } from "contexts/TeamContext";
import { useSelector } from "store";
import { BRAND_BLUE } from "themes/dashboardTokens";
import dayjs from "utils/dayjs-config";
import { readListPrefs, writeListPrefs } from "utils/listPrefs";
import { PJN_PROFILE_PATH } from "utils/pjnBindingState";
import { getPjnCedulaPdfUrl, getPjnCedulasBandeja } from "services/pjnMovementsService";
import type { PjnCedulaGlobal, PjnCedulasBandejaResponse } from "types/pjnCedula";
import type { PjnMovement } from "types/pjnMovement";

// Mismo paginado que la lista de carpetas (16/11/2026): 10 filas por defecto, opciones 5/10/25/50/100 y el tamaño
// elegido se recuerda en la pestaña. Acá la página la arma el hub, así que cada cambio vuelve a pedir.
const PAGE_SIZE_DEFAULT = 10;
const PAGE_SIZES = [5, 10, 25, 50, 100];
const PREFS_KEY = "la.notificaciones.list.v1";

// ==============================|| NOTIFICACIONES — bandeja del PJN de todos los expedientes ||============================== //
//
// Vista global (14/11/2026, pedido de Estudio FS Abogados): las cédulas que el juzgado notificó al domicilio
// electrónico, de todas las carpetas activas que ve quien consulta, juntas. En equipo la propietaria ve todas y cada
// integrante con «cada uno ve lo suyo» ve las de sus expedientes (lo resuelve el hub, GET /api/folders/cedulas/bandeja).
// Cada expediente sigue teniendo las suyas en Actividad → Notificaciones; acá se abren con el mismo visor de PDF.

interface EmptyStateProps {
	eyebrow: string;
	icon: React.ReactNode;
	title: string;
	description: string;
	/** Gris en lugar de azul de marca: búsqueda sin resultados. */
	neutral?: boolean;
	action?: { label: string; onClick: () => void };
}

/** Estado vacío con el mismo diseño que la lista de carpetas: fondo tenue, etiqueta, ícono en círculo, título y texto. */
const EmptyState = ({ eyebrow, icon, title, description, neutral, action }: EmptyStateProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const tone = neutral ? theme.palette.text.primary : BRAND_BLUE;
	const toneText = neutral ? "text.secondary" : BRAND_BLUE;
	return (
		<Box
			data-testid="notificaciones-empty"
			sx={{ position: "relative", overflow: "hidden", width: "100%", py: { xs: 3.5, sm: 4.5 }, px: 2 }}
		>
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					inset: 0,
					background: `radial-gradient(circle at 50% 40%, ${alpha(BRAND_BLUE, isDark ? 0.12 : 0.07)} 0%, transparent 60%)`,
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					inset: 0,
					backgroundImage: `radial-gradient(${alpha(theme.palette.text.primary, isDark ? 0.06 : 0.04)} 1px, transparent 1px)`,
					backgroundSize: "22px 22px",
					maskImage: "radial-gradient(ellipse 70% 70% at center, #000 0%, transparent 80%)",
					WebkitMaskImage: "radial-gradient(ellipse 70% 70% at center, #000 0%, transparent 80%)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>
			<Stack spacing={2} alignItems="center" sx={{ position: "relative", zIndex: 1, maxWidth: 460, mx: "auto", textAlign: "center" }}>
				<Box
					sx={{
						display: "inline-flex",
						alignItems: "center",
						px: 1.25,
						py: 0.4,
						borderRadius: 1,
						bgcolor: alpha(tone, neutral ? (isDark ? 0.1 : 0.06) : isDark ? 0.16 : 0.08),
						border: `1px solid ${alpha(tone, neutral ? (isDark ? 0.2 : 0.12) : isDark ? 0.32 : 0.2)}`,
					}}
				>
					<Typography sx={{ fontSize: "0.68rem", fontWeight: 600, letterSpacing: "0.14em", textTransform: "uppercase", color: toneText }}>
						{eyebrow}
					</Typography>
				</Box>
				<Box
					sx={{
						width: 80,
						height: 80,
						borderRadius: "50%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: alpha(tone, neutral ? (isDark ? 0.08 : 0.05) : isDark ? 0.14 : 0.08),
						color: toneText,
					}}
				>
					{icon}
				</Box>
				<Stack spacing={0.75} alignItems="center">
					<Typography sx={{ fontSize: "1.125rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary", textWrap: "balance" }}>
						{title}
					</Typography>
					<Typography sx={{ fontSize: "0.875rem", color: "text.secondary", lineHeight: 1.55, maxWidth: 380, textWrap: "pretty" }}>
						{description}
					</Typography>
				</Stack>
				{action && (
					<Button
						variant="contained"
						onClick={action.onClick}
						data-testid="notificaciones-empty-action"
						sx={{
							mt: 0.5,
							textTransform: "none",
							bgcolor: BRAND_BLUE,
							color: "#fff",
							fontWeight: 600,
							letterSpacing: "-0.005em",
							borderRadius: 1.25,
							px: 2.25,
							py: 0.9,
							boxShadow: `0 4px 12px ${alpha(BRAND_BLUE, 0.22)}`,
							transition: "background-color 0.15s ease, box-shadow 0.15s ease",
							"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: `0 6px 16px ${alpha(BRAND_BLUE, 0.28)}` },
						}}
					>
						{action.label}
					</Button>
				)}
			</Stack>
		</Box>
	);
};

const NotificacionesPage = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	// Mismo lenguaje que las acciones de la lista de carpetas: ícono gris que pasa a azul de marca al pasar el cursor.
	const actionIconSx = {
		color: "text.secondary",
		transition: "background-color 0.15s ease, color 0.15s ease",
		"&:hover:not(.Mui-disabled)": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08), color: BRAND_BLUE },
		"&.Mui-disabled": { color: alpha(theme.palette.text.disabled, 0.6) },
	} as const;
	const navigate = useNavigate();
	const { activeTeam, seesOnlyOwn, getRequestHeaders } = useTeam();
	const isPlatformAdmin = useSelector((s: any) => s.auth?.user?.role === "ADMIN_ROLE");

	const [q, setQ] = useState("");
	const [qDebounced, setQDebounced] = useState("");
	const [from, setFrom] = useState("");
	const [to, setTo] = useState("");
	const [page, setPage] = useState(0);
	const [pageSize, setPageSize] = useState<number>(() => {
		const saved = readListPrefs<{ pageSize?: number }>(PREFS_KEY).pageSize;
		return typeof saved === "number" && PAGE_SIZES.includes(saved) ? saved : PAGE_SIZE_DEFAULT;
	});
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
			{ q: qDebounced || undefined, from: from || undefined, to: to || undefined, page: page + 1, limit: pageSize },
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
	}, [qDebounced, from, to, page, pageSize, teamId, reloadKey]);

	const filas = data?.data || [];

	// Mismo visor de PDF que Actividad → Movimientos: sobre el movimiento vinculado o sobre el PDF bajado de la bandeja.
	const tienePdf = (c: PjnCedulaGlobal) => Boolean(c.movimiento || c.pdf?.status === "downloaded");
	const abribles = useMemo(() => filas.filter(tienePdf), [filas]);
	const total = data?.total || 0;
	// El paginador compartido cuenta páginas con `rows.length`: como acá las filas las pagina el hub, le alcanza el largo.
	const paginationRows = useMemo(() => new Array(total) as any[], [total]);
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
	const irACredenciales = { label: "Autenticar credenciales del PJN", onClick: () => navigate(PJN_PROFILE_PATH) };
	const vacio: EmptyStateProps = hayFiltros
		? {
				neutral: true,
				eyebrow: "Sin resultados",
				icon: <SearchStatus1 size={40} variant="Bulk" />,
				title: "No encontramos cédulas",
				description: "Ninguna cédula coincide con la búsqueda. Probá con otro texto o con otras fechas.",
		  }
		: data && data.credencialesActivas === 0
		? {
				eyebrow: "Sin credenciales",
				icon: <Key size={40} variant="Bulk" />,
				title: activeTeam ? "Nadie en el equipo autenticó credenciales del PJN" : "Autenticá tus credenciales del PJN",
				description:
					"La bandeja de notificaciones se sincroniza con las credenciales del PJN. Las cédulas aparecen acá cuando las autenticás en Integraciones → PJN.",
				action: irACredenciales,
		  }
		: data && data.carpetas === 0
		? {
				eyebrow: "Sin expedientes",
				icon: <FolderOpen size={40} variant="Bulk" />,
				title: "No hay expedientes del PJN activos",
				description: "Las cédulas aparecen acá cuando tus causas del PJN quedan relacionadas con tus carpetas.",
		  }
		: {
				eyebrow: "Sin notificaciones",
				icon: <NotificationStatus size={40} variant="Bulk" />,
				title: "Todavía no hay cédulas",
				description: "Cuando llegue una cédula a la bandeja de notificaciones del portal del PJN para estas causas, la vas a ver acá.",
		  };
	const borderColor = alpha(BRAND_BLUE, isDark ? 0.18 : 0.1);

	return (
		<>
			<MainCard content={false} sx={{ borderRadius: 2, border: `1px solid ${borderColor}` }}>
				<Box sx={{ px: 2.5, py: 2, borderBottom: `1px solid ${borderColor}`, bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03) }}>
					<Stack direction="row" spacing={1.25} alignItems="center">
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
						<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", flex: 1, minWidth: 0 }}>
							Notificaciones
						</Typography>
						<Tooltip title="Actualizar">
							<IconButton size="small" onClick={() => setReloadKey((k) => k + 1)} aria-label="Actualizar">
								<Refresh size={18} />
							</IconButton>
						</Tooltip>
					</Stack>
					{/* Segunda línea: qué se muestra y cuánto hay; en pantallas chicas el chip baja debajo del texto. */}
					<Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }} sx={{ mt: 0.75 }}>
						<Typography variant="caption" color="text.secondary" sx={{ flex: 1, minWidth: 0 }}>
							Cédulas de la bandeja de notificaciones del portal del PJN, de las causas relacionadas a las credenciales autenticadas ·{" "}
							{alcance}
						</Typography>
						{data && !loading && (
							<Chip
								size="small"
								variant="outlined"
								label={`${data.total.toLocaleString("es-AR")} ${data.total === 1 ? "cédula" : "cédulas"} · ${data.carpetas.toLocaleString(
									"es-AR",
								)} ${data.carpetas === 1 ? "expediente" : "expedientes"}`}
								sx={{ fontWeight: 600, flexShrink: 0, alignSelf: { xs: "flex-start", sm: "center" } }}
							/>
						)}
					</Stack>
				</Box>

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
							// «X» para limpiar la búsqueda de una vez, igual que el buscador de la lista de carpetas.
							endAdornment: q ? (
								<InputAdornment position="end">
									<IconButton
										size="small"
										aria-label="Limpiar búsqueda"
										onClick={() => {
											setQ("");
											setQDebounced("");
										}}
										sx={{ mr: -0.5 }}
									>
										<CloseCircle size={16} />
									</IconButton>
								</InputAdornment>
							) : null,
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

				{/* Solo PJN con credenciales autenticadas: sin ninguna activa en el alcance, la bandeja no se sincroniza. */}
				{!loading && data && data.credencialesActivas === 0 && filas.length > 0 && (
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
								Autenticar credenciales
							</Button>
						}
					>
						{activeTeam
							? "Nadie en el equipo tiene credenciales del PJN autenticadas, así que la bandeja de notificaciones no se sincroniza. "
							: "No tenés credenciales del PJN autenticadas, así que la bandeja de notificaciones no se sincroniza. "}
						Las cédulas aparecen acá cuando autenticás tus credenciales en Integraciones → PJN.
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
					<EmptyState {...vacio} />
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
										<TableCell sx={{ fontWeight: 700, whiteSpace: "nowrap" }} align="center">
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
											<TableCell align="center" sx={{ whiteSpace: "nowrap" }}>
												<Stack direction="row" spacing={0.25} justifyContent="center" alignItems="center">
													<Tooltip
														title={
															tienePdf(c)
																? "Ver cédula"
																: "PDF no disponible aún: la cédula todavía no aparece entre los movimientos del expediente; se incorpora cuando el juzgado la carga."
														}
													>
														<span>
															<IconButton
																size="small"
																sx={actionIconSx}
																disabled={!tienePdf(c)}
																onClick={() => abrirCedula(c)}
																aria-label="Ver cédula"
																data-testid="bandeja-cedula-ver"
															>
																<DocumentText variant="Bulk" size={18} />
															</IconButton>
														</span>
													</Tooltip>
													<Tooltip title="Abrir expediente">
														<IconButton size="small" sx={actionIconSx} onClick={() => irAlExpediente(c)} aria-label="Abrir expediente">
															<Maximize variant="Bulk" size={18} />
														</IconButton>
													</Tooltip>
												</Stack>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
						{total > pageSize && (
							<Box sx={{ p: 2, py: 3 }}>
								<TablePagination
									gotoPage={(p) => setPage(Math.min(Math.max(p, 0), Math.max(Math.ceil(total / pageSize) - 1, 0)))}
									rows={paginationRows}
									setPageSize={(size) => {
										setPageSize(size);
										setPage(0);
										writeListPrefs(PREFS_KEY, { pageSize: size });
									}}
									pageSize={pageSize}
									pageIndex={page}
								/>
							</Box>
						)}
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

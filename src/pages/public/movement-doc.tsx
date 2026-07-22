/**
 * /m/:token — Vista PÚBLICA del documento de un movimiento judicial.
 *
 * Es el destino del link "Ver documento" de los emails de movimientos nuevos.
 * No requiere login: muestra el PDF (espejado en nuestro S3) embebido, con
 * fallback al portal del PJN si no lo tenemos. Las ACCIONES sobre el documento
 * (notas, descarga gestionada, chat) sí requieren login — el CTA empuja a la
 * app, llevando a la causa del usuario si la pudimos resolver.
 *
 * Token: firmado por la-notification, verificado por law-analytics-server.
 * El doc subyacente ya es público en scw.pjn.gov.ar, así que servirlo sin auth
 * no expone nada nuevo. Dispara `notification_movement_open` (GTM) para medir
 * apertura/engagement de la notificación.
 */

import { useEffect, useRef, useState } from "react";
import { Link as RouterLink, useNavigate, useParams, useSearchParams } from "react-router-dom";

import {
	Alert,
	AppBar,
	Box,
	Button,
	Chip,
	CircularProgress,
	Container,
	Paper,
	Stack,
	Toolbar,
	Typography,
	useMediaQuery,
	useTheme,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { ArrowRight, CalendarAdd, DocumentDownload, ExportSquare, Flash, LoginCurve, NoteAdd, TaskSquare } from "iconsax-react";

import Logo from "components/logo";
import PdfCanvasViewer from "components/PdfCanvasViewer";
import { getPublicMovementDoc, markPendingLoginContinue, sendPublicMovementEvent } from "services/publicMovementsService";
import type { PublicMovementBeaconAction } from "services/publicMovementsService";
import { trackNotificationMovementCtaClick, trackNotificationMovementOpen } from "utils/gtm";
import type { PublicMovementDocResponse } from "types/publicMovement";

// Refresco silencioso de la presigned URL (dura 300s) antes de que expire.
const REFRESH_MS = 4 * 60 * 1000;

// Tokens del strip de promo — mismos que DiscountBanner de la landing, para que
// la promo se vea idéntica en ambos lugares.
const BRAND_BLUE = "#3A7BFF";
const BRAND_PURPLE = "#8A5CFF";
const BRAND_GRADIENT_BG = `linear-gradient(90deg, ${BRAND_BLUE} 0%, ${BRAND_PURPLE} 50%, ${BRAND_BLUE} 100%)`;

function formatFecha(iso: string | null | undefined): string {
	if (!iso) return "";
	try {
		// Fecha-calendario guardada como medianoche UTC: formatear en UTC para no
		// correr el día al huso del navegador (mismo criterio que PjnPdfViewer).
		return new Date(iso).toLocaleDateString("es-AR", { day: "2-digit", month: "long", year: "numeric", timeZone: "UTC" });
	} catch {
		return String(iso);
	}
}

function expedienteLabel(exp: PublicMovementDocResponse["expediente"]): string {
	if (!exp) return "";
	if (exp.number != null && exp.year != null) return `Expediente ${exp.number}/${exp.year}`;
	if (exp.number != null) return `Expediente ${exp.number}`;
	return "";
}

const MovementDocPublicPage = () => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const { token } = useParams<{ token: string }>();
	const [searchParams] = useSearchParams();
	const source = searchParams.get("source") || "email";

	const [loading, setLoading] = useState(true);
	const [data, setData] = useState<PublicMovementDocResponse | null>(null);
	const [pdfUrl, setPdfUrl] = useState<string | null>(null);
	const [iframeFailed, setIframeFailed] = useState(false);
	// El render por canvas (mobile) falló → caer al iframe nativo como fallback.
	const [canvasFailed, setCanvasFailed] = useState(false);
	const trackedRef = useRef(false);

	useEffect(() => {
		if (!token) {
			setData({ success: false, reason: "invalid", pdfUrl: null, fallbackUrl: null });
			setLoading(false);
			return;
		}

		let cancelled = false;
		let timer: ReturnType<typeof setTimeout> | null = null;

		const fetchDoc = (silent = false) => {
			if (!silent) setLoading(true);
			getPublicMovementDoc(token, silent)
				.then((res) => {
					if (cancelled) return;
					setData(res);
					setPdfUrl(res.pdfUrl);
					setLoading(false);

					// Tracking de apertura (una sola vez por montaje).
					if (!trackedRef.current) {
						trackedRef.current = true;
						trackNotificationMovementOpen({ source, fuero: res.expediente?.fuero ?? null, hasPdf: Boolean(res.pdfUrl) });
						// Beacon server-side: vista confirmada (corrió JS → humano real,
						// descuenta bots/prefetchers del `open` que registra el GET).
						sendPublicMovementEvent(token, "view_confirmed", source);
					}

					// Reprogramar refresco de la presigned URL mientras hay PDF.
					if (res.pdfUrl) {
						if (timer) clearTimeout(timer);
						timer = setTimeout(() => fetchDoc(true), REFRESH_MS);
					}
				})
				.catch(() => {
					if (cancelled) return;
					setData({ success: false, reason: "error", pdfUrl: null, fallbackUrl: null });
					setLoading(false);
				});
		};

		fetchDoc();
		return () => {
			cancelled = true;
			if (timer) clearTimeout(timer);
		};
	}, [token, source]);

	const expediente = data?.expediente;
	const movimiento = data?.movimiento;
	const folderId = data?.folderId || null;
	const movimientoId = data?.movimientoId || null;
	// CTA "gestionar": al folder del usuario, con deep-link al movimiento puntual
	// (?movement=<id>) para resaltarlo. El detalle abre la pestaña Actividad y hace
	// scroll/highlight a esa fila. Si no resolvimos el folder, cae al listado.
	const ctaHref = folderId
		? `/apps/folders/details/${folderId}${movimientoId ? `?movement=${encodeURIComponent(movimientoId)}` : ""}`
		: "/apps/folders/list";
	const fallbackUrl = data?.fallbackUrl || null;
	const showPdf = Boolean(pdfUrl) && !iframeFailed;
	const promo = data?.promo || null;

	// CTA contextual: si resolvimos la causa del usuario, el botón dice qué hay
	// del otro lado en vez del genérico "Iniciar sesión y gestionar".
	const ctaLabel = folderId ? "Ver la causa completa" : "Iniciar sesión y gestionar";

	// Etiquetas de la promo (mismo criterio que DiscountBanner de la landing).
	const promoLabel = promo ? promo.badge || (promo.discountType === "percentage" ? `${promo.discountValue}% OFF` : promo.name) : "";
	const promoValidLabel = promo?.validUntil
		? new Date(promo.validUntil).toLocaleDateString("es-AR", { day: "numeric", month: "long", timeZone: "UTC" })
		: null;
	const promoDurationLabel = promo?.durationInMonths
		? `${promo.durationInMonths} ${promo.durationInMonths === 1 ? "mes" : "meses"}`
		: null;

	const handleCtaClick = () => {
		trackNotificationMovementCtaClick(Boolean(folderId));
		if (token) {
			sendPublicMovementEvent(token, "cta_click", source);
			// Flag para que AuthGuard emita `login_continue` cuando llegue autenticado
			// a la app (con o sin paso por /login) — cierra el funnel cta → sesión.
			markPendingLoginContinue(token, source);
		}
	};
	const handleDownloadClick = () => {
		if (token) sendPublicMovementEvent(token, "download", source);
	};
	const handleFallbackClick = () => {
		if (token) sendPublicMovementEvent(token, "fallback_click", source);
	};
	// Acción rápida (vencimiento/nota/tarea): mismo destino que el CTA pero con
	// ?action=<x> para que el visor interno abra el panel correspondiente.
	const handleQuickActionClick = (action: PublicMovementBeaconAction) => {
		trackNotificationMovementCtaClick(Boolean(folderId));
		if (token) {
			sendPublicMovementEvent(token, "cta_click", source, action);
			markPendingLoginContinue(token, source);
		}
	};
	const navigate = useNavigate();
	// El strip entero es clickeable (igual que el banner de la landing): trackea
	// y navega a los planes de la app con el código pre-cargado.
	const handlePromoClick = () => {
		if (token) {
			sendPublicMovementEvent(token, "promo_click", source);
			markPendingLoginContinue(token, source);
		}
		if (promo) navigate(`/suscripciones/tables?promo=${encodeURIComponent(promo.code)}`);
	};

	const quickActions: { action: PublicMovementBeaconAction; label: string; icon: React.ReactNode }[] = [
		{ action: "vencimiento", label: "Vencimiento", icon: <CalendarAdd size="16" /> },
		{ action: "nota", label: "Nota", icon: <NoteAdd size="16" /> },
		{ action: "tarea", label: "Tarea", icon: <TaskSquare size="16" /> },
	];
	const canQuickAction = Boolean(folderId && movimientoId);

	return (
		<Box sx={{ display: "flex", flexDirection: "column", height: "100vh", bgcolor: theme.palette.grey[100] }}>
			{/* Top bar: logo + CTA a la app */}
			<AppBar position="static" color="inherit" elevation={0} sx={{ borderBottom: `1px solid ${theme.palette.divider}`, bgcolor: "#fff" }}>
				<Toolbar sx={{ gap: 2 }}>
					<Box sx={{ flexShrink: 0 }}>
						<Logo />
					</Box>
					<Box sx={{ flex: 1 }} />
					<Button
						component={RouterLink}
						to={ctaHref}
						onClick={handleCtaClick}
						variant="contained"
						color="primary"
						startIcon={<LoginCurve size="18" />}
						size={isMobile ? "small" : "medium"}
					>
						{isMobile ? "Ingresar" : ctaLabel}
					</Button>
				</Toolbar>
			</AppBar>

			{/* Header del movimiento */}
			{(expediente?.caratula || movimiento?.tipo) && (
				<Box sx={{ bgcolor: "#fff", borderBottom: `1px solid ${theme.palette.divider}`, px: { xs: 2, md: 4 }, py: 1.5 }}>
					<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5, flexWrap: "wrap" }}>
						{expedienteLabel(expediente) && (
							<Typography
								variant="caption"
								sx={{ color: theme.palette.primary.main, fontWeight: 600, textTransform: "uppercase", letterSpacing: "0.05em" }}
							>
								{expedienteLabel(expediente)}
							</Typography>
						)}
						{expediente?.fuero && <Chip size="small" label={expediente.fuero} variant="outlined" />}
						{movimiento?.fecha && (
							<Typography variant="caption" color="text.secondary">
								{formatFecha(movimiento.fecha)}
							</Typography>
						)}
					</Stack>
					{expediente?.caratula && (
						<Typography variant="subtitle1" sx={{ fontWeight: 600, lineHeight: 1.3 }}>
							{expediente.caratula}
						</Typography>
					)}
					{movimiento?.tipo && (
						<Typography variant="body2" color="text.secondary" sx={{ mt: 0.25 }}>
							<strong>{movimiento.tipo}</strong>
							{movimiento.detalle ? ` — ${movimiento.detalle}` : ""}
						</Typography>
					)}
				</Box>
			)}

			{/* Promo activa (universal de landing o dirigida al usuario). Mismo diseño
			    que DiscountBanner de la landing: strip con gradiente animado, entera
			    clickeable. Acá va inline (no fixed) entre el header y el documento. */}
			{!loading && promo && (
				<Box
					role="button"
					tabIndex={0}
					onClick={handlePromoClick}
					onKeyDown={(e) => {
						if (e.key === "Enter" || e.key === " ") {
							e.preventDefault();
							handlePromoClick();
						}
					}}
					sx={{
						cursor: "pointer",
						background: BRAND_GRADIENT_BG,
						backgroundSize: "300% 100%",
						color: "#fff",
						borderBottom: `1px solid ${alpha("#000", 0.18)}`,
						animation: "discountShift 16s linear infinite",
						"@keyframes discountShift": {
							"0%": { backgroundPosition: "0% 50%" },
							"100%": { backgroundPosition: "300% 50%" },
						},
						"&:hover .banner-arrow": { transform: "translateX(4px)" },
						"&:focus-visible": { outline: `2px solid #fff`, outlineOffset: -2 },
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flexWrap: { xs: "wrap", md: "nowrap" },
						columnGap: { xs: 1.25, sm: 1.5, md: 2 },
						rowGap: 0.25,
						py: { xs: 0.75, md: 1 },
						px: { xs: 1.5, sm: 2, md: 3 },
						textAlign: "center",
						lineHeight: 1.25,
					}}
				>
					{/* Bloque 1 — chip de descuento */}
					<Box
						component="span"
						sx={{
							display: "inline-flex",
							alignItems: "center",
							gap: 0.5,
							flexShrink: 0,
							fontSize: { xs: "0.78rem", sm: "0.82rem", md: "0.86rem" },
							fontWeight: 700,
							letterSpacing: "0.02em",
							textTransform: "uppercase",
							whiteSpace: "nowrap",
						}}
					>
						<Flash size={14} variant="Bold" color="#fff" />
						<Box component="span">{promoLabel}</Box>
					</Box>

					{/* Separador vertical — solo desktop */}
					<Box
						aria-hidden
						sx={{ display: { xs: "none", md: "inline-block" }, width: "1px", height: 14, bgcolor: alpha("#fff", 0.4), flexShrink: 0 }}
					/>

					{/* Bloque 2 — detalles del descuento */}
					<Box
						component="span"
						sx={{
							display: "inline-flex",
							alignItems: "center",
							flexWrap: "wrap",
							justifyContent: "center",
							columnGap: 0.5,
							flexShrink: 0,
							fontSize: { xs: "0.76rem", sm: "0.8rem", md: "0.84rem" },
							fontWeight: 500,
							color: alpha("#fff", 0.95),
							letterSpacing: "0.005em",
						}}
					>
						{promoDurationLabel && (
							<>
								<Box component="span">durante</Box>
								<Box component="span" sx={{ fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
									{promoDurationLabel}
								</Box>
							</>
						)}
						{promoDurationLabel && promoValidLabel && (
							<Box component="span" sx={{ opacity: 0.55, px: 0.25 }}>
								·
							</Box>
						)}
						{promoValidLabel && (
							<>
								<Box component="span">hasta el</Box>
								<Box component="span" sx={{ fontWeight: 700, color: "#fff", whiteSpace: "nowrap" }}>
									{promoValidLabel}
								</Box>
							</>
						)}
					</Box>

					{/* Bloque 3 — CTA */}
					<Box
						component="span"
						sx={{
							display: "inline-flex",
							alignItems: "center",
							gap: 0.5,
							flexShrink: 0,
							fontSize: { xs: "0.78rem", sm: "0.82rem", md: "0.86rem" },
							fontWeight: 700,
							letterSpacing: "0.01em",
							whiteSpace: "nowrap",
							ml: { md: 0.5 },
						}}
					>
						<Box component="span" sx={{ borderBottom: `1.5px solid ${alpha("#fff", 0.7)}`, pb: "1px" }}>
							Aprovechar promo
						</Box>
						<Box className="banner-arrow" component="span" sx={{ display: "inline-flex", transition: "transform 0.2s ease" }}>
							<ArrowRight size={14} color="#fff" />
						</Box>
					</Box>
				</Box>
			)}

			{/* Body: PDF / fallback / error */}
			<Box sx={{ flex: 1, position: "relative", minHeight: 0 }}>
				{loading && (
					<Stack alignItems="center" justifyContent="center" spacing={2} sx={{ height: "100%" }}>
						<CircularProgress />
						<Typography variant="body2" color="text.secondary">
							Cargando documento...
						</Typography>
					</Stack>
				)}

				{/* Mobile: los browsers (Chrome Android sobre todo) no renderizan PDFs en
				    iframe — muestran "archivo.pdf" + botón Abrir. Ahí usamos el render
				    por canvas (pdfjs). Desktop conserva el iframe nativo (toolbar/zoom). */}
				{!loading && showPdf && isMobile && !canvasFailed && (
					<PdfCanvasViewer url={pdfUrl as string} docKey={movimientoId || token || "doc"} onError={() => setCanvasFailed(true)} />
				)}
				{!loading && showPdf && (!isMobile || canvasFailed) && (
					<iframe
						src={pdfUrl as string}
						title="Documento del movimiento"
						style={{ width: "100%", height: "100%", border: 0 }}
						onError={() => setIframeFailed(true)}
					/>
				)}

				{!loading && !showPdf && (
					<Container maxWidth="sm" sx={{ py: 6 }}>
						<Paper variant="outlined" sx={{ p: 4, textAlign: "center" }}>
							<Stack spacing={2} alignItems="center">
								{data?.success === false ? (
									<>
										<Alert severity={data.reason === "expired" ? "warning" : "info"} sx={{ width: "100%", textAlign: "left" }}>
											{data.reason === "expired"
												? "Este enlace expiró. Iniciá sesión para ver el documento desde tu cuenta."
												: "No pudimos abrir este documento desde el enlace."}
										</Alert>
										<Button
											component={RouterLink}
											to={ctaHref}
											onClick={handleCtaClick}
											variant="contained"
											startIcon={<LoginCurve size="18" />}
										>
											Iniciar sesión
										</Button>
									</>
								) : (
									<>
										<Alert severity="info" sx={{ width: "100%", textAlign: "left" }}>
											Este documento todavía no está disponible en nuestra plataforma. Iniciá sesión para verlo y gestionarlo desde tu
											cuenta.
										</Alert>
										<Button
											component={RouterLink}
											to={ctaHref}
											onClick={handleCtaClick}
											variant="contained"
											startIcon={<LoginCurve size="18" />}
										>
											{ctaLabel}
										</Button>
										{fallbackUrl && (
											<Button
												size="small"
												variant="text"
												color="secondary"
												startIcon={<ExportSquare size="16" />}
												href={fallbackUrl}
												target="_blank"
												rel="noopener noreferrer"
												onClick={handleFallbackClick}
											>
												Ver en el portal del PJN (requiere tu login del PJN)
											</Button>
										)}
									</>
								)}
							</Stack>
						</Paper>
					</Container>
				)}
			</Box>

			{/* Footer: acciones rápidas cuando hay PDF */}
			{!loading && showPdf && (
				<Stack
					direction="row"
					spacing={1}
					alignItems="center"
					justifyContent="space-between"
					sx={{ p: 1.5, bgcolor: "#fff", borderTop: `1px solid ${theme.palette.divider}` }}
				>
					{canQuickAction ? (
						<Stack direction="row" spacing={0.5} alignItems="center" flexWrap="wrap" rowGap={0.5}>
							<Typography variant="caption" color="text.secondary" sx={{ mr: 0.5, display: { xs: "none", sm: "block" } }}>
								Agregar a la causa:
							</Typography>
							{quickActions.map((qa) => (
								<Button
									key={qa.action}
									component={RouterLink}
									to={`${ctaHref}&action=${qa.action}`}
									onClick={() => handleQuickActionClick(qa.action)}
									size="small"
									color="secondary"
									startIcon={qa.icon}
									sx={{ textTransform: "none" }}
								>
									{qa.label}
								</Button>
							))}
						</Stack>
					) : (
						<Typography variant="caption" color="text.secondary" sx={{ display: { xs: "none", sm: "block" } }}>
							Documento del Poder Judicial · vista pública de Law Analytics
						</Typography>
					)}
					<Stack direction="row" spacing={1}>
						<Button
							size="small"
							startIcon={<DocumentDownload size="18" />}
							href={pdfUrl as string}
							download={`${movimiento?.tipo || "documento"}.pdf`}
							onClick={handleDownloadClick}
						>
							Descargar
						</Button>
						{fallbackUrl && (
							<Button
								size="small"
								startIcon={<ExportSquare size="18" />}
								href={fallbackUrl}
								target="_blank"
								rel="noopener noreferrer"
								onClick={handleFallbackClick}
							>
								Original PJN
							</Button>
						)}
					</Stack>
				</Stack>
			)}
		</Box>
	);
};

export default MovementDocPublicPage;

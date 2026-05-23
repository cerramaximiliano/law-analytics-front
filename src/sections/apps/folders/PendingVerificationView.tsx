import { useEffect, useMemo, useState } from "react";
import { useNavigate } from "react-router-dom";
import { Box, Button, CircularProgress, Stack, Tooltip, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// icons
import {
	ArrowLeft,
	Clock,
	CloseCircle,
	InfoCircle,
	MessageQuestion,
	Refresh,
	SearchNormal1,
	TickCircle,
	Trash,
	Warning2,
} from "iconsax-react";

// project imports
import MainCard from "components/MainCard";
import { BRAND_BLUE, LIVE_PULSE_KEYFRAMES, STALE_AMBER } from "themes/dashboardTokens";
import { dispatch } from "store";
import { getFolderById, reverifyFolderById, ReverifyResult } from "store/reducers/folder";
import { formatFolderName } from "utils/formatFolderName";

// components reutilizados
import AlertFolderDelete from "./AlertFolderDelete";
import CausaSelector from "./CausaSelector";
import SupportModal from "layout/MainLayout/Drawer/DrawerContent/SupportModal";

export type VerificationGate = "pending" | "pending_selection" | "failed" | "invalid";

interface PendingVerificationViewProps {
	folder: any;
	gate: VerificationGate;
	onSelectCausa?: () => void;
}

const MAX_ATTEMPTS = 2;
const POLL_INTERVAL_MS = 10_000; // 10s
const POLL_TIMEOUT_MS = 3 * 60 * 1000; // 3 minutos

const gateMeta: Record<
	VerificationGate,
	{
		label: string;
		title: string;
		description: string;
		toneColor: "amber" | "red" | "blue";
		icon: typeof Clock;
	}
> = {
	pending: {
		label: "Pendiente de verificación",
		title: "Estamos buscando este expediente",
		description:
			"Un worker está consultando el portal judicial para confirmar que el expediente existe y que el sistema puede acceder a sus movimientos. Esto puede tardar unos minutos.",
		toneColor: "amber",
		icon: Clock,
	},
	pending_selection: {
		label: "Hay varias coincidencias",
		title: "Encontramos más de un expediente",
		description:
			"El número y año coinciden con varios expedientes en el portal. Necesitamos que elijas cuál es el correcto para empezar a sincronizar.",
		toneColor: "blue",
		icon: SearchNormal1,
	},
	failed: {
		label: "Asociación fallida",
		title: "No pudimos encontrar este expediente",
		description:
			"La búsqueda en el portal judicial no devolvió resultados. Suele pasar cuando hay un error de tipeo en el número, la jurisdicción o el año. Revisá los datos y, si están bien, pedile a soporte que lo revise manualmente.",
		toneColor: "red",
		icon: CloseCircle,
	},
	invalid: {
		label: "Causa inválida",
		title: "El expediente no es accesible",
		description:
			"El portal devolvió el expediente, pero está marcado como no público o no existe en el sistema judicial. No vamos a poder sincronizar sus movimientos.",
		toneColor: "red",
		icon: Warning2,
	},
};

const SUPPORT_SUBJECT = "Problema técnico";

const PendingVerificationView = ({ folder, gate, onSelectCausa }: PendingVerificationViewProps) => {
	const theme = useTheme();
	const navigate = useNavigate();
	const isDark = theme.palette.mode === "dark";

	const [deleteOpen, setDeleteOpen] = useState(false);
	const [supportOpen, setSupportOpen] = useState(false);
	const [selectorOpen, setSelectorOpen] = useState(false);
	const [reverifying, setReverifying] = useState(false);
	const [refreshing, setRefreshing] = useState(false);
	const [reverifyError, setReverifyError] = useState<{ code?: string; message?: string } | null>(null);

	const meta = gateMeta[gate];
	const toneHex =
		meta.toneColor === "amber" ? STALE_AMBER : meta.toneColor === "red" ? theme.palette.error.main : BRAND_BLUE;
	const StatusIcon = meta.icon;

	// Estado de reverificación derivado del folder ----------------------------
	const attempts = folder?.verificationAttempts || 0;
	const attemptsLeft = Math.max(0, MAX_ATTEMPTS - attempts);
	const locked = attempts >= MAX_ATTEMPTS;

	const lastReqAt = folder?.lastReverifyRequestedAt ? new Date(folder.lastReverifyRequestedAt).getTime() : null;
	// In-flight: hubo un pedido reciente Y el worker aún no terminó (status sigue
	// pending). Cap absoluto de 3 min para no quedar enganchados si el worker se
	// pisó: pasado ese tiempo dejamos al usuario intentar de nuevo manualmente.
	const inFlight = useMemo(() => {
		if (!lastReqAt) return false;
		const elapsed = Date.now() - lastReqAt;
		if (elapsed > POLL_TIMEOUT_MS) return false;
		return folder?.causaAssociationStatus === "pending";
	}, [lastReqAt, folder?.causaAssociationStatus]);

	// Polling: mientras in-flight, refrescamos el folder cada 10s para reflejar
	// el resultado del worker sin que el usuario tenga que recargar.
	useEffect(() => {
		if (!inFlight || !folder?._id) return;
		const intervalId = setInterval(() => {
			dispatch(getFolderById(folder._id, true));
		}, POLL_INTERVAL_MS);
		return () => clearInterval(intervalId);
	}, [inFlight, folder?._id]);

	// Datos legibles del intento ---------------------------------------------
	const knownData = useMemo(() => {
		const sourceLabel = folder?.pjn
			? "Poder Judicial de la Nación"
			: folder?.mev
			? "Mesa de Entradas Virtual (CABA)"
			: folder?.eje
			? "Expediente Judicial Electrónico (CABA)"
			: folder?.scba
			? "Suprema Corte de Buenos Aires"
			: folder?.source === "auto"
			? "Importación automática"
			: "Manual";

		const createdAt = folder?.createdAt
			? new Date(folder.createdAt).toLocaleString("es-AR", {
					day: "2-digit",
					month: "2-digit",
					year: "numeric",
					hour: "2-digit",
					minute: "2-digit",
			  })
			: null;

		return [
			{ label: "Jurisdicción", value: folder?.folderJuris?.label || folder?.folderJuris || null },
			{ label: "Fuero", value: folder?.folderFuero || null },
			{ label: "N° de expediente", value: folder?.expedientNumber || null },
			{ label: "Año", value: folder?.expedientYear || null },
			{ label: "Origen", value: sourceLabel },
			{ label: "Fecha de alta", value: createdAt },
		].filter((row) => row.value);
	}, [folder]);

	// Bloque enviado SIEMPRE a soporte. El usuario sólo puede agregar contexto
	// adicional desde el textarea del modal.
	const supportLockedHeader = useMemo(() => {
		const lines: string[] = [
			"Necesito revisión de una causa que no pudo verificarse automáticamente.",
			"",
			`Estado: ${meta.label}`,
			`ID interno de la carpeta: ${folder?._id ?? "(desconocido)"}`,
			`Reintentos automáticos usados: ${attempts} de ${MAX_ATTEMPTS}`,
		];
		knownData.forEach((row) => {
			lines.push(`${row.label}: ${row.value}`);
		});
		return lines.join("\n");
	}, [meta.label, folder?._id, knownData, attempts]);

	const handleReverify = async () => {
		if (!folder?._id || reverifying || inFlight || locked) return;
		setReverifying(true);
		setReverifyError(null);
		try {
			const result: ReverifyResult = await dispatch(reverifyFolderById(folder._id));
			if (!result.success) {
				setReverifyError({ code: result.code, message: result.message });
			}
		} finally {
			setReverifying(false);
		}
	};

	const handleRefreshStatus = async () => {
		if (!folder?._id || refreshing) return;
		setRefreshing(true);
		try {
			await dispatch(getFolderById(folder._id, true));
		} finally {
			setRefreshing(false);
		}
	};

	const titleProvisoria = folder?.folderName ? formatFolderName(folder.folderName, 80) : "Carpeta sin nombre";

	// Texto contextual del CTA de reintentar según estado --------------------
	const reverifyTitle = locked
		? "Reintentos automáticos agotados"
		: inFlight
		? "Verificando…"
		: attempts === 0
		? "Reintentar verificación"
		: `Reintentar verificación · queda ${attemptsLeft} intento`;

	const reverifyDescription = inFlight
		? "El worker está procesando tu pedido. Esto puede tardar hasta 3 minutos — el resultado va a aparecer solo."
		: attempts === 0
		? "Consultamos otra vez el portal por si el worker ya completó la búsqueda. Tenés 2 reintentos disponibles."
		: `Ya usaste ${attempts} de ${MAX_ATTEMPTS} reintentos. Si no resuelve, pedile revisión manual a soporte.`;

	const reverifyCtaLabel = inFlight ? "Verificando…" : attempts === 0 ? "Verificar ahora" : "Verificar otra vez";

	return (
		<>
			<Box
				sx={{
					maxWidth: { xs: "100%", md: 1080 },
					mx: "auto",
					px: { xs: 2, sm: 0 },
					py: { xs: 2, sm: 2.5 },
					...LIVE_PULSE_KEYFRAMES,
				}}
			>
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
						border: `1px solid ${alpha(toneHex, isDark ? 0.32 : 0.22)}`,
						overflow: "hidden",
					}}
				>
					{/* Header con tinte de estado y contador de intentos */}
					<Box
						sx={{
							position: "relative",
							overflow: "hidden",
							px: { xs: 2.25, sm: 3 },
							py: { xs: 1.75, sm: 2 },
							bgcolor: alpha(toneHex, isDark ? 0.1 : 0.05),
							borderBottom: `1px solid ${alpha(toneHex, isDark ? 0.28 : 0.18)}`,
						}}
					>
						<Stack direction="row" alignItems="flex-start" spacing={1.5}>
							<Box
								sx={{
									position: "relative",
									flexShrink: 0,
									width: 40,
									height: 40,
									borderRadius: 1.5,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									bgcolor: alpha(toneHex, isDark ? 0.2 : 0.12),
									border: `1px solid ${alpha(toneHex, isDark ? 0.32 : 0.22)}`,
									color: toneHex,
								}}
							>
								<StatusIcon size={20} variant="Bulk" />
								{(gate === "pending" || inFlight) && (
									<Box
										aria-hidden
										sx={{
											position: "absolute",
											inset: -2,
											borderRadius: 1.75,
											border: `2px solid ${toneHex}`,
											opacity: 0.35,
											animation: "la-live-pulse 2.4s ease-out infinite",
										}}
									/>
								)}
							</Box>
							<Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
								<Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
									<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: toneHex }} />
									<Typography
										sx={{
											fontSize: "0.68rem",
											fontWeight: 600,
											letterSpacing: "0.08em",
											textTransform: "uppercase",
											color: toneHex,
										}}
									>
										{meta.label}
									</Typography>
									{/* Contador de intentos — siempre visible si hubo al menos 1 */}
									{attempts > 0 && (
										<Box
											sx={{
												display: "inline-flex",
												alignItems: "center",
												gap: 0.5,
												px: 0.875,
												py: 0.125,
												borderRadius: 0.75,
												bgcolor: alpha(theme.palette.text.primary, isDark ? 0.1 : 0.06),
												border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.18 : 0.12)}`,
												ml: 0.5,
											}}
										>
											{locked ? (
												<TickCircle size={11} variant="Bulk" color={theme.palette.text.secondary} />
											) : (
												<Refresh size={11} color={theme.palette.text.secondary} />
											)}
											<Typography
												sx={{
													fontSize: "0.66rem",
													fontWeight: 600,
													color: "text.secondary",
													letterSpacing: "0.02em",
													lineHeight: 1,
												}}
											>
												{locked ? `Reintentos agotados (${attempts}/${MAX_ATTEMPTS})` : `Reintento ${attempts}/${MAX_ATTEMPTS}`}
											</Typography>
										</Box>
									)}
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
									{meta.title}
								</Typography>
								<Typography sx={{ fontSize: "0.8rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
									{titleProvisoria}
								</Typography>
							</Stack>
						</Stack>
					</Box>

					{/* Body — grid 2-col en desktop para evitar scroll */}
					<Box
						sx={{
							display: "grid",
							gridTemplateColumns: { xs: "1fr", md: "1fr 1fr" },
							gap: { xs: 2, md: 2.5 },
							px: { xs: 2.25, sm: 2.75 },
							py: { xs: 2, sm: 2.25 },
						}}
					>
						{/* Columna izquierda — contexto */}
						<Stack spacing={1.75} sx={{ minWidth: 0 }}>
							{/* Explicación contextual */}
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
										{meta.description}
									</Typography>
								</Stack>
							</Box>

							{/* Lo que cargamos — compacto */}
							{knownData.length > 0 && (
								<Stack spacing={0.875}>
									<Typography
										sx={{
											fontSize: "0.66rem",
											fontWeight: 600,
											letterSpacing: "0.08em",
											textTransform: "uppercase",
											color: "text.secondary",
										}}
									>
										Lo que cargamos
									</Typography>
									<Box
										sx={{
											display: "grid",
											gridTemplateColumns: "repeat(2, 1fr)",
											border: `1px solid ${alpha(theme.palette.divider, 0.8)}`,
											borderRadius: 1.25,
											overflow: "hidden",
										}}
									>
										{knownData.map((row, idx) => (
											<Box
												key={row.label}
												sx={{
													px: 1.25,
													py: 0.875,
													borderBottom: idx >= knownData.length - 2 ? "none" : `1px solid ${alpha(theme.palette.divider, 0.8)}`,
													borderRight: idx % 2 === 0 ? `1px solid ${alpha(theme.palette.divider, 0.8)}` : "none",
													bgcolor: idx % 2 === 0 ? alpha(BRAND_BLUE, isDark ? 0.025 : 0.015) : "transparent",
													minWidth: 0,
												}}
											>
												<Typography
													sx={{
														fontSize: "0.62rem",
														fontWeight: 600,
														letterSpacing: "0.06em",
														textTransform: "uppercase",
														color: "text.secondary",
														mb: 0.125,
													}}
												>
													{row.label}
												</Typography>
												<Typography
													sx={{
														fontSize: "0.8rem",
														fontWeight: 500,
														color: "text.primary",
														letterSpacing: "-0.005em",
														wordBreak: "break-word",
													}}
												>
													{row.value}
												</Typography>
											</Box>
										))}
									</Box>
									<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", lineHeight: 1.45 }}>
										Si algún dato está mal, conviene eliminar la carpeta y crearla de nuevo.
									</Typography>
								</Stack>
							)}
						</Stack>

						{/* Columna derecha — acciones */}
						<Stack spacing={0.875} sx={{ minWidth: 0 }}>
							<Typography
								sx={{
									fontSize: "0.66rem",
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "text.secondary",
								}}
							>
								¿Qué querés hacer?
							</Typography>

							{/* Error inline del último intento (limit reached / in flight) */}
							{reverifyError && reverifyError.message && (
								<Box
									sx={{
										display: "flex",
										alignItems: "flex-start",
										gap: 0.875,
										px: 1.25,
										py: 0.875,
										borderRadius: 1,
										border: `1px solid ${alpha(theme.palette.error.main, isDark ? 0.32 : 0.22)}`,
										bgcolor: alpha(theme.palette.error.main, isDark ? 0.1 : 0.05),
									}}
								>
									<Warning2 size={14} variant="Bulk" color={theme.palette.error.main} style={{ marginTop: 2, flexShrink: 0 }} />
									<Typography sx={{ fontSize: "0.76rem", color: "text.primary", lineHeight: 1.5 }}>{reverifyError.message}</Typography>
								</Box>
							)}

							{/* CTA principal según gate */}
							{gate === "pending_selection" ? (
								<ActionCard
									toneHex={BRAND_BLUE}
									icon={<SearchNormal1 size={18} variant="Bulk" color={BRAND_BLUE} />}
									title="Elegir el expediente correcto"
									description="Abrí el selector y marcá cuál de los expedientes corresponde a esta carpeta. Una vez que elijas, vamos a sincronizar sus movimientos."
									ctaLabel="Elegir expediente"
									ctaLoading={false}
									onClick={onSelectCausa ?? (() => setSelectorOpen(true))}
									isDark={isDark}
								/>
							) : gate === "pending" ? (
								<>
									{/* Banner informativo: esperando al worker */}
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 1.25,
											px: 1.25,
											py: 1.125,
											borderRadius: 1.25,
											border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.24 : 0.16)}`,
											bgcolor: alpha(STALE_AMBER, isDark ? 0.045 : 0.025),
										}}
									>
										<Box
											sx={{
												width: 30,
												height: 30,
												borderRadius: 1,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												bgcolor: alpha(STALE_AMBER, isDark ? 0.18 : 0.1),
												border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.3 : 0.2)}`,
												flexShrink: 0,
											}}
										>
											<Clock size={18} variant="Bulk" color={STALE_AMBER} />
										</Box>
										<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
											<Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em", lineHeight: 1.3 }}>
												Esperando al worker
											</Typography>
											<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", lineHeight: 1.45, textWrap: "pretty" }}>
												{inFlight
													? "El sistema reconsulta el estado cada 10 segundos. El resultado va a aparecer acá automáticamente — esto puede tardar hasta 3 minutos."
													: "La verificación está en cola. Podés actualizar el estado para traer el resultado más reciente o forzar otro intento."}
											</Typography>
										</Stack>
									</Box>

									<ActionCard
										toneHex={BRAND_BLUE}
										icon={
											refreshing ? (
												<CircularProgress size={16} thickness={5} sx={{ color: BRAND_BLUE }} />
											) : (
												<Refresh size={18} color={BRAND_BLUE} />
											)
										}
										title="Actualizar estado"
										description="Trae el resultado más reciente del worker sin esperar al próximo auto-refresh."
										ctaLabel={refreshing ? "Actualizando…" : "Actualizar"}
										ctaLoading={refreshing}
										onClick={handleRefreshStatus}
										isDark={isDark}
									/>

									<ActionCard
										toneHex={theme.palette.error.main}
										icon={<Trash size={18} variant="Bulk" color={theme.palette.error.main} />}
										title="Eliminar carpeta"
										description="Si te equivocaste al cargar los datos y querés crearla de nuevo."
										ctaLabel="Eliminar"
										ctaLoading={false}
										onClick={() => setDeleteOpen(true)}
										isDark={isDark}
										destructive
									/>

									{/* Link sutil: forzar reintento (sólo si no in-flight y quedan intentos) */}
									{!inFlight && !locked && (
										<Button
											onClick={handleReverify}
											disabled={reverifying}
											size="small"
											startIcon={
												reverifying ? (
													<CircularProgress size={12} thickness={5} sx={{ color: STALE_AMBER }} />
												) : (
													<Refresh size={13} color={STALE_AMBER} />
												)
											}
											sx={{
												alignSelf: "flex-start",
												mt: 0.25,
												textTransform: "none",
												fontWeight: 500,
												fontSize: "0.72rem",
												color: "text.secondary",
												letterSpacing: "-0.005em",
												px: 0.875,
												py: 0.375,
												minHeight: 0,
												"&:hover": {
													color: STALE_AMBER,
													bgcolor: alpha(STALE_AMBER, isDark ? 0.08 : 0.05),
												},
											}}
										>
											{reverifying
												? "Forzando reintento…"
												: attempts === 0
												? "Forzar reintento de verificación"
												: `Forzar reintento (queda ${attemptsLeft} de ${MAX_ATTEMPTS})`}
										</Button>
									)}
								</>
							) : !locked ? (
								<ActionCard
									toneHex={STALE_AMBER}
									icon={
										reverifying || inFlight ? (
											<CircularProgress size={16} thickness={5} sx={{ color: STALE_AMBER }} />
										) : (
											<Refresh size={18} color={STALE_AMBER} />
										)
									}
									title={reverifyTitle}
									description={reverifyDescription}
									ctaLabel={reverifyCtaLabel}
									ctaLoading={reverifying || inFlight}
									onClick={handleReverify}
									isDark={isDark}
								/>
							) : (
								<Box
									sx={{
										display: "flex",
										alignItems: "flex-start",
										gap: 0.875,
										px: 1.25,
										py: 1.25,
										borderRadius: 1.25,
										border: `1px dashed ${alpha(theme.palette.text.primary, isDark ? 0.18 : 0.14)}`,
										bgcolor: alpha(theme.palette.text.primary, isDark ? 0.03 : 0.02),
									}}
								>
									<InfoCircle size={14} variant="Bulk" color={theme.palette.text.secondary} style={{ marginTop: 2, flexShrink: 0 }} />
									<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", lineHeight: 1.5, textWrap: "pretty" }}>
										Llegaste al límite de {MAX_ATTEMPTS} reintentos automáticos. Pedile revisión manual a soporte o eliminá la carpeta si te
										equivocaste al cargarla.
									</Typography>
								</Box>
							)}

							{/* Soporte + eliminar — para estados terminales o pending_selection. pending tiene su propio set arriba. */}
							{gate !== "pending" && (
								<>
									<ActionCard
										toneHex={BRAND_BLUE}
										icon={<MessageQuestion size={18} variant="Bulk" color={BRAND_BLUE} />}
										title="Pedir revisión a soporte"
										description="Mandanos el caso con todo el contexto del intento. Vas a poder agregar más detalles antes de enviar."
										ctaLabel="Contactar a soporte"
										ctaLoading={false}
										onClick={() => setSupportOpen(true)}
										isDark={isDark}
									/>

									<ActionCard
										toneHex={theme.palette.error.main}
										icon={<Trash size={18} variant="Bulk" color={theme.palette.error.main} />}
										title="Eliminar carpeta"
										description="Libera espacio en tu plan. Útil si te equivocaste al cargar los datos y querés crearla de nuevo."
										ctaLabel="Eliminar"
										ctaLoading={false}
										onClick={() => setDeleteOpen(true)}
										isDark={isDark}
										destructive
									/>
								</>
							)}
						</Stack>
					</Box>
				</MainCard>
			</Box>

			<AlertFolderDelete
				title={titleProvisoria}
				open={deleteOpen}
				handleClose={(_confirmed: boolean) => setDeleteOpen(false)}
				id={folder?._id || ""}
				onDelete={async () => {
					navigate("/apps/folders/list");
				}}
			/>

			<SupportModal
				open={supportOpen}
				onClose={() => setSupportOpen(false)}
				defaultSubject={SUPPORT_SUBJECT}
				defaultPriority="high"
				lockedHeader={supportLockedHeader}
				variant="dashboard"
			/>

			<CausaSelector
				open={selectorOpen}
				onClose={() => setSelectorOpen(false)}
				folderId={folder?._id || ""}
				folderName={titleProvisoria}
				onCausaSelected={() => {
					// Refrescá el folder para que la vista salga del gate pending_selection
					// y reaparezcan los datos sincronizados.
					if (folder?._id) dispatch(getFolderById(folder._id, true));
				}}
				onSelectionCancelled={() => {
					if (folder?._id) dispatch(getFolderById(folder._id, true));
				}}
			/>
		</>
	);
};

// ============================== ActionCard ============================== //

interface ActionCardProps {
	toneHex: string;
	icon: React.ReactNode;
	title: string;
	description: string;
	ctaLabel: string;
	ctaLoading: boolean;
	onClick: () => void;
	isDark: boolean;
	destructive?: boolean;
}

const ActionCard = ({ toneHex, icon, title, description, ctaLabel, ctaLoading, onClick, isDark, destructive = false }: ActionCardProps) => {
	return (
		<Box
			sx={{
				display: "flex",
				flexDirection: "row",
				alignItems: "center",
				gap: 1.25,
				px: 1.25,
				py: 1.125,
				borderRadius: 1.25,
				border: `1px solid ${alpha(toneHex, isDark ? 0.24 : 0.16)}`,
				bgcolor: alpha(toneHex, isDark ? 0.045 : 0.025),
				transition: "border-color 0.15s ease, background-color 0.15s ease",
				"&:hover": {
					borderColor: alpha(toneHex, isDark ? 0.42 : 0.32),
					bgcolor: alpha(toneHex, isDark ? 0.08 : 0.045),
				},
			}}
		>
			<Box
				sx={{
					width: 30,
					height: 30,
					borderRadius: 1,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					bgcolor: alpha(toneHex, isDark ? 0.18 : 0.1),
					border: `1px solid ${alpha(toneHex, isDark ? 0.3 : 0.2)}`,
					flexShrink: 0,
				}}
			>
				{icon}
			</Box>
			<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
				<Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em", lineHeight: 1.3 }}>
					{title}
				</Typography>
				<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", lineHeight: 1.45, textWrap: "pretty" }}>
					{description}
				</Typography>
			</Stack>
			<Tooltip title={ctaLoading ? "Procesando…" : ""}>
				<span>
					<Button
						onClick={onClick}
						disabled={ctaLoading}
						variant={destructive ? "outlined" : "contained"}
						size="small"
						sx={{
							textTransform: "none",
							fontWeight: 600,
							letterSpacing: "-0.005em",
							borderRadius: 1,
							boxShadow: "none",
							minWidth: 116,
							fontSize: "0.78rem",
							py: 0.625,
							alignSelf: "center",
							flexShrink: 0,
							...(destructive
								? {
										color: toneHex,
										borderColor: alpha(toneHex, isDark ? 0.42 : 0.32),
										"&:hover": { borderColor: toneHex, bgcolor: alpha(toneHex, isDark ? 0.12 : 0.06) },
								  }
								: {
										bgcolor: toneHex,
										color: "#fff",
										"&:hover": { bgcolor: alpha(toneHex, 0.88), boxShadow: "none" },
										"&.Mui-disabled": { bgcolor: alpha(toneHex, isDark ? 0.32 : 0.45), color: alpha("#fff", 0.9) },
								  }),
						}}
					>
						{ctaLabel}
					</Button>
				</span>
			</Tooltip>
		</Box>
	);
};

export default PendingVerificationView;

/**
 * Componente para conectar cuenta del Poder Judicial de la Provincia de Buenos Aires (SCBA)
 *
 * Permite al usuario vincular sus credenciales SCBA (domicilio electrónico)
 * para sincronizar automáticamente sus causas provinciales.
 * Muestra progreso de sincronización en tiempo real.
 */

import React, { useState, useEffect, useCallback, useRef, forwardRef, useImperativeHandle } from "react";
import { useSelector, useDispatch } from "react-redux";
import { scbaSyncReset, ScbaSyncState } from "store/reducers/scbaSync";
import {
	Box,
	Stack,
	Typography,
	TextField,
	Button,
	Alert,
	CircularProgress,
	LinearProgress,
	IconButton,
	InputAdornment,
	Divider,
	Card,
	CardContent,
	Chip,
	Tooltip,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Link1, Eye, EyeSlash, TickCircle, CloseCircle, Refresh2, InfoCircle, DocumentText, ShieldTick } from "iconsax-react";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";
import { enqueueSnackbar } from "notistack";
import { Zoom } from "@mui/material";
import scbaCredentialsService, { ScbaCredentialsData } from "api/scbaCredentials";
import { useScbaSiteStatus } from "hooks/useScbaSiteStatus";
import { scbaSiteStatusUpdated } from "store/reducers/scbaSiteStatus";
import ScbaMaintenanceAlert from "components/ScbaMaintenanceAlert";

interface ScbaAccountConnectProps {
	onConnectionSuccess?: () => void;
	onSyncComplete?: () => void;
	onServiceAvailableChange?: (available: boolean, message?: string) => void;
}

export interface ScbaAccountConnectRef {
	submit: () => Promise<boolean>;
	canSubmit: () => boolean;
}

const ScbaAccountConnect = forwardRef<ScbaAccountConnectRef, ScbaAccountConnectProps>(
	({ onConnectionSuccess, onSyncComplete, onServiceAvailableChange }, ref) => {
		const theme = useTheme();

		// Estado del formulario
		const [username, setUsername] = useState("");
		const [password, setPassword] = useState("");
		const [showPassword, setShowPassword] = useState(false);
		const [isSubmitting, setIsSubmitting] = useState(false);

		// Estado de credenciales existentes
		const [credentialsStatus, setCredentialsStatus] = useState<ScbaCredentialsData | null>(null);
		const [isLoadingStatus, setIsLoadingStatus] = useState(true);
		const [hasCredentials, setHasCredentials] = useState(false);
		const [serviceAvailable, setServiceAvailable] = useState(true);
		const [serviceMessage, setServiceMessage] = useState("");

		// Estado de sincronización
		const [isSyncing, setIsSyncing] = useState(false);
		const [syncProgress, setSyncProgress] = useState(0);
		const [syncMessage, setSyncMessage] = useState("");

		// Errores
		const [usernameError, setUsernameError] = useState("");
		const [passwordError, setPasswordError] = useState("");

		// Polling cleanup
		const [stopPolling, setStopPolling] = useState<(() => void) | null>(null);

		// Estado real-time del worker SCBA (eventos WS → reducer scbaSync).
		// Tiene prioridad sobre el polling: cuando hay eventos WS activos,
		// la UI refleja el progreso enviado por el worker en tiempo real.
		const dispatch = useDispatch();
		const scbaSync = useSelector((state: any) => state.scbaSync as ScbaSyncState);
		const lastWsCompletedAtRef = useRef<string | null>(null);

		// Estado del portal SCBA — usado para deshabilitar submit y mostrar banner.
		const { isDown: isPortalDown } = useScbaSiteStatus();

		// Cargar estado al montar
		useEffect(() => {
			loadCredentialsStatus();

			return () => {
				if (stopPolling) stopPolling();
			};
		}, []);

		const loadCredentialsStatus = async () => {
			setIsLoadingStatus(true);
			try {
				const response = await scbaCredentialsService.getCredentialsStatus();
				setServiceAvailable(response.serviceAvailable);
				setServiceMessage(response.serviceMessage || "");
				onServiceAvailableChange?.(response.serviceAvailable, response.serviceMessage || undefined);

				if (response.success && response.data) {
					setCredentialsStatus(response.data);
					setHasCredentials(true);

					// Si está en progreso o pendiente, iniciar polling
					if (response.data.syncStatus === "in_progress" || response.data.syncStatus === "pending") {
						startPolling();
					}
				} else {
					setHasCredentials(false);
					setCredentialsStatus(null);
				}
			} catch {
				setHasCredentials(false);
			} finally {
				setIsLoadingStatus(false);
			}
		};

		// Puente WS → estado local: si llegan eventos WebSocket, éstos ganan
		// sobre el polling. Los textos por fase son más informativos que los
		// que produce el loop de polling (que sólo ve el snapshot de DB).
		useEffect(() => {
			if (scbaSync.isActive) {
				setIsSyncing(true);
				setSyncProgress(scbaSync.progress);
				setSyncMessage(scbaSync.message);
				return;
			}
			// Fin de sync vía WS: refrescar estado y disparar callback una sola vez.
			if (scbaSync.phase === "completed" && scbaSync.completedAt && scbaSync.completedAt !== lastWsCompletedAtRef.current) {
				lastWsCompletedAtRef.current = scbaSync.completedAt;
				setIsSyncing(false);
				setSyncProgress(100);
				setSyncMessage("Sincronización completada");
				if (stopPolling) {
					stopPolling();
					setStopPolling(null);
				}
				loadCredentialsStatus();
				if (onSyncComplete) onSyncComplete();
			}
			if (scbaSync.hasError && scbaSync.errorMessage) {
				setIsSyncing(false);
				setSyncMessage("");
				enqueueSnackbar(`Error en sincronización: ${scbaSync.errorMessage}`, {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 5000,
				});
				dispatch(scbaSyncReset());
			}
			// eslint-disable-next-line react-hooks/exhaustive-deps
		}, [
			scbaSync.isActive,
			scbaSync.progress,
			scbaSync.message,
			scbaSync.phase,
			scbaSync.completedAt,
			scbaSync.hasError,
			scbaSync.errorMessage,
		]);

		const startPolling = useCallback(() => {
			setIsSyncing(true);
			setSyncMessage("Sincronizando causas...");

			const stop = scbaCredentialsService.pollSyncStatus(
				3000,
				// onProgress
				(status) => {
					setCredentialsStatus(status);
					if (status.currentSyncProgress) {
						setSyncProgress(status.currentSyncProgress.progress || 0);
						const { causasFound, causasProcessed, currentPage, totalPages } = status.currentSyncProgress;
						if (totalPages > 0 && causasProcessed === 0) {
							setSyncMessage(`Descargando página ${currentPage}/${totalPages} (${causasFound} causas encontradas)`);
						} else if (causasProcessed > 0) {
							setSyncMessage(`Procesando causas: ${causasProcessed}/${causasFound}`);
						} else {
							setSyncMessage("Verificando credenciales...");
						}
					}
				},
				// onComplete
				(status) => {
					setCredentialsStatus(status);
					setIsSyncing(false);
					setSyncProgress(100);
					setSyncMessage("Sincronización completada");

					const created = status.stats?.causasCreated || 0;
					const linked = status.stats?.causasLinked || 0;
					enqueueSnackbar(
						`Sincronización completada: ${status.stats?.totalCausasFound || 0} causas encontradas, ${created} nuevas, ${linked} vinculadas`,
						{
							variant: "success",
							anchorOrigin: { vertical: "bottom", horizontal: "right" },
							TransitionComponent: Zoom,
							autoHideDuration: 5000,
						},
					);

					if (onSyncComplete) onSyncComplete();
				},
				// onError
				(error) => {
					setIsSyncing(false);
					setSyncMessage("");
					enqueueSnackbar(`Error en sincronización: ${error}`, {
						variant: "error",
						anchorOrigin: { vertical: "bottom", horizontal: "right" },
						TransitionComponent: Zoom,
						autoHideDuration: 5000,
					});
				},
			);

			setStopPolling(() => stop);
		}, [onSyncComplete]);

		// Validar username
		const validateUsername = (value: string): boolean => {
			const trimmed = value.trim();
			if (!trimmed) {
				setUsernameError("El domicilio electrónico es requerido");
				return false;
			}
			const isFullDomicilio = /^\d{11}@notificaciones\.scba\.gov\.ar$/.test(trimmed);
			const isCuil = /^\d{11}$/.test(trimmed);
			if (!isFullDomicilio && !isCuil) {
				setUsernameError("Formato: CUIL de 11 dígitos o CUIL@notificaciones.scba.gov.ar");
				return false;
			}
			setUsernameError("");
			return true;
		};

		const validatePassword = (value: string): boolean => {
			if (!value || value.trim() === "") {
				setPasswordError("La contraseña es requerida");
				return false;
			}
			setPasswordError("");
			return true;
		};

		// Enviar credenciales
		const handleSubmit = async (): Promise<boolean> => {
			const usernameValid = validateUsername(username);
			const passwordValid = validatePassword(password);

			if (!usernameValid || !passwordValid) return false;

			setIsSubmitting(true);

			try {
				const response = await scbaCredentialsService.linkCredentials(username.trim(), password);

				// Bloqueo por portal caído: sincronizamos el slice (mostrar banner) y
				// avisamos al usuario con un toast específico.
				if (!response.success && response.code === "SCBA_MAINTENANCE") {
					if (response.scbaSiteStatus) {
						dispatch(scbaSiteStatusUpdated(response.scbaSiteStatus));
					}
					enqueueSnackbar(response.error || "El portal de la SCBA no está respondiendo. Reintentá más tarde.", {
						variant: "warning",
						anchorOrigin: { vertical: "bottom", horizontal: "right" },
						TransitionComponent: Zoom,
						autoHideDuration: 5000,
					});
					return false;
				}

				if (response.success) {
					enqueueSnackbar(response.message || "Cuenta SCBA vinculada correctamente", {
						variant: "success",
						anchorOrigin: { vertical: "bottom", horizontal: "right" },
						TransitionComponent: Zoom,
						autoHideDuration: 4000,
					});

					setUsername("");
					setPassword("");
					setHasCredentials(true);

					if (response.data) {
						setCredentialsStatus({
							id: response.data.id,
							enabled: response.data.enabled,
							verified: response.data.verified,
							verifiedAt: null,
							lastUsed: null,
							isExpired: false,
							consecutiveErrors: 0,
							lastError: null,
							syncStatus: "pending",
							lastSync: null,
							lastSyncAttempt: null,
							currentSyncProgress: null,
							stats: { totalCausasFound: 0, causasCreated: 0, causasLinked: 0, causasSkipped: 0, errors: 0 },
							syncHistory: [],
							description: "",
							createdAt: response.data.createdAt || new Date().toISOString(),
							updatedAt: response.data.updatedAt || new Date().toISOString(),
						});
					}

					// Iniciar polling para ver progreso
					startPolling();

					if (onConnectionSuccess) onConnectionSuccess();
					return true;
				} else {
					enqueueSnackbar(response.error || "Error al vincular cuenta SCBA", {
						variant: "error",
						anchorOrigin: { vertical: "bottom", horizontal: "right" },
						TransitionComponent: Zoom,
						autoHideDuration: 5000,
					});
					return false;
				}
			} catch {
				enqueueSnackbar("Error de conexión. Intente nuevamente.", {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 5000,
				});
				return false;
			} finally {
				setIsSubmitting(false);
			}
		};

		// Exponer métodos al padre
		useImperativeHandle(ref, () => ({
			submit: handleSubmit,
			canSubmit: () => Boolean(username && password && !isSubmitting && !hasCredentials && !isPortalDown),
		}));

		// Re-sincronizar
		const handleResync = async () => {
			try {
				const response = await scbaCredentialsService.requestSync();
				if (!response.success && response.code === "SCBA_MAINTENANCE") {
					if (response.scbaSiteStatus) {
						dispatch(scbaSiteStatusUpdated(response.scbaSiteStatus));
					}
					enqueueSnackbar(response.error || "El portal de la SCBA no está respondiendo. Reintentá más tarde.", {
						variant: "warning",
						anchorOrigin: { vertical: "bottom", horizontal: "right" },
						TransitionComponent: Zoom,
						autoHideDuration: 5000,
					});
					return;
				}
				if (response.success) {
					enqueueSnackbar("Sincronización iniciada", {
						variant: "info",
						anchorOrigin: { vertical: "bottom", horizontal: "right" },
						TransitionComponent: Zoom,
						autoHideDuration: 3000,
					});
					startPolling();
				} else {
					enqueueSnackbar(response.error || "No se pudo iniciar sincronización", {
						variant: "warning",
						anchorOrigin: { vertical: "bottom", horizontal: "right" },
						TransitionComponent: Zoom,
						autoHideDuration: 4000,
					});
				}
			} catch {
				enqueueSnackbar("Error al solicitar sincronización", {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 4000,
				});
			}
		};

		// Desvincular
		const handleUnlink = async () => {
			if (!credentialsStatus?.id) return;

			try {
				const response = await scbaCredentialsService.unlinkCredentials(credentialsStatus.id);
				if (response.success) {
					enqueueSnackbar("Cuenta SCBA desvinculada correctamente", {
						variant: "success",
						anchorOrigin: { vertical: "bottom", horizontal: "right" },
						TransitionComponent: Zoom,
						autoHideDuration: 3000,
					});
					setHasCredentials(false);
					setCredentialsStatus(null);
					if (stopPolling) stopPolling();
				} else {
					enqueueSnackbar(response.error || "Error al desvincular cuenta", {
						variant: "error",
						anchorOrigin: { vertical: "bottom", horizontal: "right" },
						TransitionComponent: Zoom,
						autoHideDuration: 4000,
					});
				}
			} catch {
				enqueueSnackbar("Error de conexión", {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 4000,
				});
			}
		};

		// ========== RENDERS ==========

		if (isLoadingStatus) {
			return (
				<Box display="flex" justifyContent="center" alignItems="center" minHeight={150}>
					<CircularProgress size={32} />
				</Box>
			);
		}

		// Servicio no disponible
		if (!serviceAvailable) {
			return (
				<Alert severity="info" icon={<InfoCircle size={18} />} sx={{ "& .MuiAlert-message": { fontSize: "0.8rem" } }}>
					{serviceMessage || "La integración con el Poder Judicial de la Provincia de Buenos Aires no está disponible en este momento."}
				</Alert>
			);
		}

		// Sincronización en progreso
		if (isSyncing || credentialsStatus?.syncStatus === "in_progress" || credentialsStatus?.syncStatus === "pending") {
			const isDark = theme.palette.mode === "dark";
			return (
				<Box
					sx={{
						borderRadius: 1.5,
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
						p: { xs: 1.5, sm: 1.75 },
					}}
				>
					<Stack spacing={1.5}>
						<Stack direction="row" alignItems="center" spacing={0.875}>
							<Box
								sx={{
									width: 28,
									height: 28,
									borderRadius: 1,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
									flexShrink: 0,
								}}
							>
								<CircularProgress size={14} sx={{ color: BRAND_BLUE }} />
							</Box>
							<Typography sx={{ fontSize: "0.88rem", fontWeight: 600, letterSpacing: "-0.005em", color: "text.primary" }}>
								Sincronizando causas
							</Typography>
						</Stack>

						<Box>
							<LinearProgress
								variant="determinate"
								value={syncProgress}
								sx={{
									height: 8,
									borderRadius: 1.25,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08),
									"& .MuiLinearProgress-bar": { bgcolor: BRAND_BLUE, borderRadius: 1.25 },
								}}
							/>
							<Typography
								sx={{
									mt: 0.625,
									display: "block",
									fontSize: "0.72rem",
									color: "text.secondary",
									fontVariantNumeric: "tabular-nums",
								}}
							>
								{syncMessage || `${syncProgress.toFixed(0)}% completado`}
							</Typography>
						</Box>

						<Box
							sx={{
								display: "flex",
								alignItems: "flex-start",
								gap: 1,
								px: 1.25,
								py: 1,
								borderRadius: 1.25,
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.05),
							}}
						>
							<Box sx={{ color: BRAND_BLUE, display: "flex", mt: 0.125, flexShrink: 0 }}>
								<InfoCircle size={14} variant="Bulk" />
							</Box>
							<Typography sx={{ fontSize: "0.75rem", color: "text.secondary", lineHeight: 1.45, textWrap: "pretty" }}>
								El proceso puede tardar unos minutos. Podés seguir trabajando — las carpetas se crean en segundo plano.
							</Typography>
						</Box>

						{credentialsStatus?.currentSyncProgress && (
							<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
								<Chip
									icon={<DocumentText size={14} variant="Bulk" />}
									label={`${credentialsStatus.currentSyncProgress.causasFound || 0} encontradas`}
									size="small"
									sx={{
										fontSize: "0.7rem",
										height: 22,
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
										color: BRAND_BLUE,
										border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.2)}`,
										"& .MuiChip-icon": { color: BRAND_BLUE },
									}}
								/>
								{credentialsStatus.currentSyncProgress.causasCreated > 0 && (
									<Chip
										icon={<DocumentText size={14} variant="Bulk" />}
										label={`${credentialsStatus.currentSyncProgress.causasCreated} nuevas`}
										size="small"
										sx={{
											fontSize: "0.7rem",
											height: 22,
											bgcolor: alpha(LIVE_GREEN, isDark ? 0.14 : 0.08),
											color: LIVE_GREEN,
											border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.32 : 0.2)}`,
											"& .MuiChip-icon": { color: LIVE_GREEN },
										}}
									/>
								)}
							</Stack>
						)}
					</Stack>
				</Box>
			);
		}

		// Cuenta conectada
		if (hasCredentials && credentialsStatus) {
			const isComplete = credentialsStatus.syncStatus === "completed";
			const hasError = credentialsStatus.syncStatus === "error";
			const isDark = theme.palette.mode === "dark";

			// Color accent según estado: brand-blue para neutral, green para completed, error/amber.
			const accent = isComplete ? LIVE_GREEN : hasError ? theme.palette.error.main : BRAND_BLUE;

			// Notice helper brand-aware (mismo lenguaje que automaticStep)
			const renderInlineNotice = (text: string, color: string) => (
				<Box
					sx={{
						display: "flex",
						alignItems: "flex-start",
						gap: 1,
						px: 1.25,
						py: 1,
						borderRadius: 1.25,
						border: `1px solid ${alpha(color, isDark ? 0.28 : 0.18)}`,
						bgcolor: alpha(color, isDark ? 0.08 : 0.05),
					}}
				>
					<Box sx={{ color, display: "flex", mt: 0.125, flexShrink: 0 }}>
						<InfoCircle size={14} variant="Bulk" />
					</Box>
					<Typography sx={{ fontSize: "0.75rem", color: "text.secondary", lineHeight: 1.45, textWrap: "pretty" }}>{text}</Typography>
				</Box>
			);

			return (
				<Box
					sx={{
						borderRadius: 1.5,
						border: `1px solid ${alpha(accent, isDark ? 0.32 : 0.22)}`,
						bgcolor: alpha(accent, isDark ? 0.06 : 0.03),
						p: { xs: 1.5, sm: 1.75 },
					}}
				>
					<Stack spacing={1.5}>
						{isPortalDown && (
							<ScbaMaintenanceAlert
								compact
								contextHint="Mientras el portal esté caído, la sincronización queda en pausa."
							/>
						)}
						<Stack direction="row" alignItems="center" justifyContent="space-between">
							<Stack direction="row" alignItems="center" spacing={0.875}>
								<Box
									sx={{
										width: 28,
										height: 28,
										borderRadius: 1,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										bgcolor: alpha(accent, isDark ? 0.18 : 0.1),
										color: accent,
										flexShrink: 0,
									}}
								>
									{isComplete ? (
										<TickCircle size={16} variant="Bulk" />
									) : hasError ? (
										<CloseCircle size={16} variant="Bulk" />
									) : (
										<Link1 size={16} variant="Bulk" />
									)}
								</Box>
								<Typography sx={{ fontSize: "0.88rem", fontWeight: 600, letterSpacing: "-0.005em", color: "text.primary" }}>
									{isComplete ? "Cuenta conectada" : hasError ? "Error de sincronización" : "Cuenta vinculada"}
								</Typography>
							</Stack>

							<Tooltip title={isPortalDown ? "Portal SCBA caído — no se puede re-sincronizar" : "Re-sincronizar"} placement="top" arrow>
								<span>
									<IconButton
										size="small"
										onClick={handleResync}
										disabled={!credentialsStatus.enabled || isPortalDown}
										sx={{
											color: "text.secondary",
											transition: "background-color 0.15s ease, color 0.15s ease",
											"&:hover:not(.Mui-disabled)": {
												bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
												color: BRAND_BLUE,
											},
										}}
									>
										<Refresh2 size={16} />
									</IconButton>
								</span>
							</Tooltip>
						</Stack>

						{isComplete &&
							renderInlineNotice(
								`Tus causas de la Provincia de Buenos Aires están sincronizadas. Se encontraron ${credentialsStatus.stats?.totalCausasFound || 0} causas (${credentialsStatus.stats?.causasCreated || 0} nuevas, ${credentialsStatus.stats?.causasLinked || 0} vinculadas).`,
								LIVE_GREEN,
							)}

						{hasError && credentialsStatus.lastError && renderInlineNotice(credentialsStatus.lastError.message, theme.palette.error.main)}

						{!isComplete && !hasError && credentialsStatus.syncStatus === "never_synced" &&
							renderInlineNotice("Tu cuenta está vinculada pero aún no se sincronizó. Apretá el botón de re-sincronizar para iniciar.", BRAND_BLUE)}

						{credentialsStatus.isExpired &&
							renderInlineNotice("Tus credenciales expiraron. Desvinculá tu cuenta y vinculala con la contraseña actualizada.", STALE_AMBER)}

						{isComplete && (
							<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
								<Chip
									icon={<DocumentText size={14} variant="Bulk" />}
									label={`${credentialsStatus.stats?.totalCausasFound || 0} causas`}
									size="small"
									sx={{
										fontSize: "0.7rem",
										height: 22,
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
										color: BRAND_BLUE,
										border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.2)}`,
										"& .MuiChip-icon": { color: BRAND_BLUE },
									}}
								/>
								<Chip
									icon={<DocumentText size={14} variant="Bulk" />}
									label={`${credentialsStatus.stats?.causasCreated || 0} nuevas`}
									size="small"
									sx={{
										fontSize: "0.7rem",
										height: 22,
										bgcolor: alpha(LIVE_GREEN, isDark ? 0.14 : 0.08),
										color: LIVE_GREEN,
										border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.32 : 0.2)}`,
										"& .MuiChip-icon": { color: LIVE_GREEN },
									}}
								/>
							</Stack>
						)}

						<Box sx={{ height: 1, bgcolor: alpha(accent, isDark ? 0.16 : 0.1) }} />

						<Button
							size="small"
							onClick={handleUnlink}
							startIcon={<CloseCircle size={14} />}
							sx={{
								alignSelf: "flex-start",
								textTransform: "none",
								color: "text.secondary",
								fontWeight: 500,
								fontSize: "0.78rem",
								"&:hover": {
									bgcolor: alpha(theme.palette.error.main, isDark ? 0.16 : 0.08),
									color: theme.palette.error.main,
								},
							}}
						>
							Desvincular cuenta
						</Button>
					</Stack>
				</Box>
			);
		}

		// Formulario de conexión
		const isDark = theme.palette.mode === "dark";
		return (
			<Stack spacing={1.5}>
				{isPortalDown && (
					<ScbaMaintenanceAlert
						compact
						contextHint="No se pueden conectar cuentas nuevas mientras el portal esté caído."
					/>
				)}
				<Box
					sx={{
						borderRadius: 1.5,
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
						p: { xs: 1.5, sm: 1.75 },
					}}
				>
				<Stack spacing={1.25}>
					<Stack direction="row" alignItems="center" spacing={0.875}>
						<Box
							sx={{
								width: 28,
								height: 28,
								borderRadius: 1,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
								color: BRAND_BLUE,
								flexShrink: 0,
							}}
						>
							<Link1 size={16} variant="Bulk" />
						</Box>
						<Typography sx={{ fontSize: "0.88rem", fontWeight: 600, letterSpacing: "-0.005em", color: "text.primary" }}>
							Conectar cuenta SCBA
						</Typography>
					</Stack>

					<TextField
						fullWidth
						label="Domicilio electrónico"
						placeholder="20XXXXXXXX7@notificaciones.scba.gov.ar"
						value={username}
						onChange={(e) => {
							setUsername(e.target.value);
							if (usernameError) validateUsername(e.target.value);
						}}
						onBlur={() => validateUsername(username)}
						error={Boolean(usernameError)}
						helperText={usernameError || undefined}
						disabled={isSubmitting}
						size="small"
					/>

					<TextField
						fullWidth
						label="Contraseña"
						type={showPassword ? "text" : "password"}
						value={password}
						onChange={(e) => {
							setPassword(e.target.value);
							if (passwordError) validatePassword(e.target.value);
						}}
						onBlur={() => validatePassword(password)}
						error={Boolean(passwordError)}
						helperText={passwordError || undefined}
						disabled={isSubmitting}
						size="small"
						InputProps={{
							endAdornment: (
								<InputAdornment position="end">
									<Tooltip title="Tu contraseña se almacena encriptada (AES-256) y solo se usa para sincronizar tus causas." arrow placement="top">
										<IconButton edge="end" size="small" sx={{ color: BRAND_BLUE, mr: 0.25 }}>
											<ShieldTick size={14} variant="Bulk" />
										</IconButton>
									</Tooltip>
									<IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
										{showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
									</IconButton>
								</InputAdornment>
							),
						}}
					/>

					<Tooltip
						title={isPortalDown ? "Portal SCBA caído — no se pueden conectar cuentas nuevas ahora" : ""}
						placement="top"
						arrow
						disableHoverListener={!isPortalDown}
					>
						<span>
							<Button
								variant="contained"
								fullWidth
								size="small"
								onClick={handleSubmit}
								disabled={isSubmitting || !username || !password || isPortalDown}
								startIcon={isSubmitting ? <CircularProgress size={14} color="inherit" /> : <Link1 size={14} />}
								sx={{
									textTransform: "none",
									bgcolor: BRAND_BLUE,
									color: "#fff",
									fontWeight: 600,
									letterSpacing: "-0.005em",
									borderRadius: 1.25,
									boxShadow: "none",
									transition: "background-color 0.15s ease",
									"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
									"&.Mui-disabled": {
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.24 : 0.4),
										color: alpha("#fff", 0.9),
									},
								}}
							>
								{isSubmitting ? "Conectando…" : "Conectar cuenta"}
							</Button>
						</span>
					</Tooltip>
				</Stack>
				</Box>
			</Stack>
		);
	},
);

export default ScbaAccountConnect;

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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { Link1, Eye, EyeSlash, TickCircle, CloseCircle, Refresh2, InfoCircle, DocumentText } from "iconsax-react";
import { enqueueSnackbar } from "notistack";
import { Zoom } from "@mui/material";
import scbaCredentialsService, { ScbaCredentialsData } from "api/scbaCredentials";

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
			canSubmit: () => Boolean(username && password && !isSubmitting && !hasCredentials),
		}));

		// Re-sincronizar
		const handleResync = async () => {
			try {
				const response = await scbaCredentialsService.requestSync();
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
			return (
				<Card variant="outlined" sx={{ borderColor: theme.palette.primary.light }}>
					<CardContent>
						<Stack spacing={2}>
							<Stack direction="row" alignItems="center" spacing={1}>
								<CircularProgress size={20} />
								<Typography variant="subtitle1" fontWeight={500}>
									Sincronizando causas...
								</Typography>
							</Stack>

							<Box>
								<LinearProgress variant="determinate" value={syncProgress} sx={{ height: 8, borderRadius: 4 }} />
								<Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
									{syncMessage || `${syncProgress.toFixed(0)}% completado`}
								</Typography>
							</Box>

							<Alert severity="info" icon={<InfoCircle size={20} />}>
								El proceso puede tomar varios minutos dependiendo de la cantidad de causas. Puede continuar trabajando con normalidad, las
								carpetas se crearán automáticamente.
							</Alert>

							{credentialsStatus?.currentSyncProgress && (
								<Stack direction="row" spacing={2} justifyContent="center">
									<Chip
										icon={<DocumentText size={16} />}
										label={`${credentialsStatus.currentSyncProgress.causasFound || 0} causas encontradas`}
										size="small"
										variant="outlined"
									/>
									{credentialsStatus.currentSyncProgress.causasCreated > 0 && (
										<Chip
											icon={<DocumentText size={16} />}
											label={`${credentialsStatus.currentSyncProgress.causasCreated} nuevas`}
											size="small"
											variant="outlined"
											color="primary"
										/>
									)}
								</Stack>
							)}
						</Stack>
					</CardContent>
				</Card>
			);
		}

		// Cuenta conectada
		if (hasCredentials && credentialsStatus) {
			const isComplete = credentialsStatus.syncStatus === "completed";
			const hasError = credentialsStatus.syncStatus === "error";

			return (
				<Card
					variant="outlined"
					sx={{
						borderColor: isComplete ? theme.palette.success.light : hasError ? theme.palette.error.light : theme.palette.warning.light,
					}}
				>
					<CardContent>
						<Stack spacing={2}>
							<Stack direction="row" alignItems="center" justifyContent="space-between">
								<Stack direction="row" alignItems="center" spacing={1}>
									{isComplete ? (
										<TickCircle size={24} color={theme.palette.success.main} variant="Bold" />
									) : hasError ? (
										<CloseCircle size={24} color={theme.palette.error.main} variant="Bold" />
									) : (
										<Link1 size={24} color={theme.palette.warning.main} />
									)}
									<Typography variant="subtitle1" fontWeight={500}>
										{isComplete ? "Cuenta conectada" : hasError ? "Error de sincronización" : "Cuenta vinculada"}
									</Typography>
								</Stack>

								<Stack direction="row" spacing={1}>
									<IconButton size="small" onClick={handleResync} title="Re-sincronizar" disabled={!credentialsStatus.enabled}>
										<Refresh2 size={18} />
									</IconButton>
								</Stack>
							</Stack>

							{isComplete && (
								<Alert severity="success" icon={<TickCircle size={20} />}>
									Tus causas del Poder Judicial de la Provincia de Buenos Aires están sincronizadas. Se encontraron{" "}
									{credentialsStatus.stats?.totalCausasFound || 0} causas ({credentialsStatus.stats?.causasCreated || 0} nuevas,{" "}
									{credentialsStatus.stats?.causasLinked || 0} vinculadas).
								</Alert>
							)}

							{hasError && credentialsStatus.lastError && <Alert severity="error">{credentialsStatus.lastError.message}</Alert>}

							{!isComplete && !hasError && credentialsStatus.syncStatus === "never_synced" && (
								<Alert severity="info">
									Tu cuenta está vinculada pero aún no se ha sincronizado. Presiona el botón de sincronización para iniciar.
								</Alert>
							)}

							{credentialsStatus.isExpired && (
								<Alert severity="warning">
									Tus credenciales han expirado. Desvinculá tu cuenta y vinculala nuevamente con la contraseña actualizada.
								</Alert>
							)}

							{isComplete && (
								<Stack direction="row" spacing={2} justifyContent="center">
									<Chip
										icon={<DocumentText size={16} />}
										label={`${credentialsStatus.stats?.totalCausasFound || 0} causas`}
										size="small"
										variant="outlined"
									/>
									<Chip
										icon={<DocumentText size={16} />}
										label={`${credentialsStatus.stats?.causasCreated || 0} nuevas`}
										size="small"
										variant="outlined"
										color="primary"
									/>
								</Stack>
							)}

							<Divider />

							<Button variant="text" color="error" size="small" onClick={handleUnlink} startIcon={<CloseCircle size={16} />}>
								Desvincular cuenta
							</Button>
						</Stack>
					</CardContent>
				</Card>
			);
		}

		// Formulario de conexión
		return (
			<Card variant="outlined" sx={{ overflow: "visible" }}>
				<CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
					<Stack spacing={1.25}>
						<Stack direction="row" alignItems="center" spacing={1}>
							<Link1 size={20} color={theme.palette.primary.main} />
							<Typography variant="subtitle2" fontWeight={500}>
								Conectar cuenta SCBA
							</Typography>
						</Stack>

						<Alert severity="info" icon={<InfoCircle size={14} />} sx={{ py: 0.25, "& .MuiAlert-message": { fontSize: "0.75rem" } }}>
							Vincula tu cuenta del Portal de Notificaciones SCBA para importar y sincronizar tus causas de la Provincia de Buenos Aires.
						</Alert>

						<TextField
							fullWidth
							label="Domicilio Electrónico"
							placeholder="20XXXXXXXX7@notificaciones.scba.gov.ar"
							value={username}
							onChange={(e) => {
								setUsername(e.target.value);
								if (usernameError) validateUsername(e.target.value);
							}}
							onBlur={() => validateUsername(username)}
							error={Boolean(usernameError)}
							helperText={usernameError || "CUIL o domicilio electrónico completo"}
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
							helperText={passwordError}
							disabled={isSubmitting}
							size="small"
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">
										<IconButton onClick={() => setShowPassword(!showPassword)} edge="end" size="small">
											{showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
										</IconButton>
									</InputAdornment>
								),
							}}
						/>

						<Alert severity="info" icon={<InfoCircle size={14} />} sx={{ py: 0.25, "& .MuiAlert-message": { fontSize: "0.75rem" } }}>
							<strong>Seguridad:</strong> Tu contraseña se almacena encriptada (AES-256) y solo se usa para sincronizar tus causas.
						</Alert>

						<Button
							variant="contained"
							fullWidth
							size="small"
							onClick={handleSubmit}
							disabled={isSubmitting || !username || !password}
							startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Link1 size={16} />}
						>
							{isSubmitting ? "Conectando..." : "Conectar cuenta"}
						</Button>
					</Stack>
				</CardContent>
			</Card>
		);
	},
);

export default ScbaAccountConnect;

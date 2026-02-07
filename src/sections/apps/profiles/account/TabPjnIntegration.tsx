import React, { useState, useEffect, useCallback, useRef } from "react";
import {
  Alert,
  Box,
  Button,
  Card,
  CardContent,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogContentText,
  DialogTitle,
  Divider,
  FormControlLabel,
  Grid,
  IconButton,
  InputAdornment,
  LinearProgress,
  Stack,
  Switch,
  TextField,
  Tooltip,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Link1,
  Link21,
  TickCircle,
  CloseCircle,
  Refresh2,
  Eye,
  EyeSlash,
  InfoCircle,
  Folder2,
  DocumentText,
  Calendar,
  Timer1,
  Warning2,
  People,
} from "iconsax-react";
import { enqueueSnackbar } from "notistack";
import MainCard from "components/MainCard";
import pjnCredentialsService, { PjnCredentialsStatus } from "api/pjnCredentials";
import ApiService from "store/reducers/ApiService";

const TabPjnIntegration = () => {
  const theme = useTheme();

  // Estado de credenciales
  const [credentialsStatus, setCredentialsStatus] = useState<PjnCredentialsStatus | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const [hasCredentials, setHasCredentials] = useState(false);

  // Estado de sincronización en progreso
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState("");
  const [stopPolling, setStopPolling] = useState<(() => void) | null>(null);

  // Diálogos
  const [disconnectDialog, setDisconnectDialog] = useState(false);
  const [changePasswordDialog, setChangePasswordDialog] = useState(false);

  // Sincronización de intervinientes
  const [syncContactsEnabled, setSyncContactsEnabled] = useState(false);
  const [syncContactsLoading, setSyncContactsLoading] = useState(false);

  // Formulario de cambio de contraseña
  const [newPassword, setNewPassword] = useState("");
  const [showNewPassword, setShowNewPassword] = useState(false);
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  // Cargar estado de credenciales y preferencias (independientes entre sí)
  const loadCredentialsStatus = useCallback(async () => {
    try {
      setIsLoading(true);
      const [credResult, prefsResult] = await Promise.allSettled([
        pjnCredentialsService.getCredentialsStatus(),
        ApiService.getUserPreferences(),
      ]);

      if (credResult.status === "fulfilled" && credResult.value.success && credResult.value.data) {
        setCredentialsStatus(credResult.value.data);
        setHasCredentials(true);

        // Si está en progreso, iniciar polling
        if (credResult.value.data.syncStatus === "in_progress" || credResult.value.data.syncStatus === "pending") {
          startPolling();
        }
      } else {
        setHasCredentials(false);
        setCredentialsStatus(null);
      }

      if (prefsResult.status === "fulfilled" && prefsResult.value.success && prefsResult.value.data) {
        setSyncContactsEnabled(prefsResult.value.data.pjn?.syncContactsFromIntervinientes ?? false);
      }
    } finally {
      setIsLoading(false);
    }
  }, []);

  // Polling para sincronización
  const startPolling = useCallback(() => {
    setIsSyncing(true);
    setSyncMessage("Sincronizando causas...");

    const stop = pjnCredentialsService.pollSyncStatus(
      3000,
      // onProgress
      (status) => {
        setCredentialsStatus(status);
        if (status.currentSyncProgress) {
          setSyncProgress(status.currentSyncProgress.progress || 0);
          const { causasProcessed, totalExpected, currentPage, totalPages } = status.currentSyncProgress;
          if (totalExpected > 0) {
            setSyncMessage(`Procesando: ${causasProcessed}/${totalExpected} causas (Pág. ${currentPage}/${totalPages})`);
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
        setSyncMessage("");
        enqueueSnackbar(
          `Sincronización completada: ${status.foldersCreatedCount} carpetas`,
          { variant: "success" }
        );
      },
      // onError
      (error) => {
        setIsSyncing(false);
        setSyncMessage("");
        enqueueSnackbar(`Error en sincronización: ${error}`, { variant: "error" });
        loadCredentialsStatus();
      }
    );

    setStopPolling(() => stop);
  }, [loadCredentialsStatus]);

  // Refs para el chequeo periódico (evitar recrear el interval)
  const isSyncingRef = useRef(isSyncing);
  const credentialsStatusRef = useRef(credentialsStatus);

  // Mantener refs actualizados
  useEffect(() => {
    isSyncingRef.current = isSyncing;
  }, [isSyncing]);

  useEffect(() => {
    credentialsStatusRef.current = credentialsStatus;
  }, [credentialsStatus]);

  // Efecto inicial: cargar estado y configurar chequeo periódico
  useEffect(() => {
    loadCredentialsStatus();

    // Chequeo periódico cada 10 segundos para detectar sincronizaciones
    // iniciadas por el worker mientras la página está abierta
    const periodicCheck = setInterval(async () => {
      // Solo chequear si no estamos ya en polling
      if (!isSyncingRef.current) {
        try {
          const response = await pjnCredentialsService.getCredentialsStatus();
          if (response.success && response.data) {
            // Si hay una sincronización en progreso que no detectamos, iniciar polling
            if (response.data.syncStatus === "in_progress" || response.data.syncStatus === "pending") {
              setCredentialsStatus(response.data);
              startPolling();
            } else if (response.data.syncStatus !== credentialsStatusRef.current?.syncStatus) {
              // Si el estado cambió, actualizar
              setCredentialsStatus(response.data);
            }
          }
        } catch (error) {
          // Ignorar errores silenciosamente en el chequeo periódico
        }
      }
    }, 10000); // Cada 10 segundos

    return () => {
      clearInterval(periodicCheck);
      if (stopPolling) {
        stopPolling();
      }
    };
  }, []);

  // Desconectar cuenta
  const handleDisconnect = async () => {
    try {
      const response = await pjnCredentialsService.unlinkCredentials();
      if (response.success) {
        enqueueSnackbar("Cuenta PJN desvinculada correctamente", { variant: "success" });
        setDisconnectDialog(false);
        setHasCredentials(false);
        setCredentialsStatus(null);
        if (stopPolling) stopPolling();
      } else {
        enqueueSnackbar(response.error || "Error al desvincular cuenta", { variant: "error" });
      }
    } catch (error) {
      enqueueSnackbar("Error de conexión", { variant: "error" });
    }
  };

  // Cambiar contraseña
  const handleChangePassword = async () => {
    if (!newPassword.trim()) {
      enqueueSnackbar("Ingrese la nueva contraseña", { variant: "warning" });
      return;
    }

    setIsChangingPassword(true);
    try {
      const response = await pjnCredentialsService.updatePassword(newPassword);
      if (response.success) {
        enqueueSnackbar("Contraseña actualizada correctamente", { variant: "success" });
        setChangePasswordDialog(false);
        setNewPassword("");
        loadCredentialsStatus();
      } else {
        enqueueSnackbar(response.error || "Error al actualizar contraseña", { variant: "error" });
      }
    } catch (error) {
      enqueueSnackbar("Error de conexión", { variant: "error" });
    } finally {
      setIsChangingPassword(false);
    }
  };

  // Forzar re-sincronización
  const handleResync = async () => {
    try {
      const response = await pjnCredentialsService.requestSync();
      if (response.success) {
        enqueueSnackbar("Sincronización iniciada", { variant: "info" });
        startPolling();
      } else {
        enqueueSnackbar(response.error || "No se pudo iniciar la sincronización", { variant: "warning" });
      }
    } catch (error) {
      enqueueSnackbar("Error al solicitar sincronización", { variant: "error" });
    }
  };

  // Toggle sincronización de intervinientes como contactos
  const handleToggleSyncContacts = async () => {
    const newValue = !syncContactsEnabled;
    setSyncContactsLoading(true);
    try {
      const response = await ApiService.updateUserPreferences({
        pjn: { syncContactsFromIntervinientes: newValue },
      } as any);
      if (response.success) {
        setSyncContactsEnabled(newValue);
        enqueueSnackbar(
          newValue
            ? "Sincronización de intervinientes activada"
            : "Sincronización de intervinientes desactivada",
          { variant: "success", anchorOrigin: { vertical: "bottom", horizontal: "right" } }
        );
      } else {
        enqueueSnackbar("Error al actualizar la preferencia", { variant: "error" });
      }
    } catch (error) {
      enqueueSnackbar("Error de conexión", { variant: "error" });
    } finally {
      setSyncContactsLoading(false);
    }
  };

  // Formatear fecha
  const formatDate = (dateString: string | null | undefined) => {
    if (!dateString) return "Nunca";
    return new Date(dateString).toLocaleString("es-AR", {
      day: "2-digit",
      month: "2-digit",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  };

  // Estado de carga
  if (isLoading) {
    return (
      <MainCard title="Integración PJN">
        <Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
          <CircularProgress />
        </Box>
      </MainCard>
    );
  }

  const isComplete = credentialsStatus?.isValid && credentialsStatus?.verified;
  const hasError = credentialsStatus?.syncStatus === "error";

  return (
    <Grid container spacing={3}>
      <Grid item xs={12} md={6}>
      {/* === Card 1: Integración PJN (cuenta y sincronización de causas) === */}
      <MainCard title="Integración PJN">
        {!hasCredentials ? (
          <Stack spacing={3} alignItems="center" sx={{ py: 4 }}>
            <Link21 size={64} color={theme.palette.text.secondary} />
            <Typography variant="h5" color="text.secondary">
              No tienes una cuenta PJN vinculada
            </Typography>
            <Typography variant="body2" color="text.secondary" textAlign="center" maxWidth={400}>
              Vincula tu cuenta del Poder Judicial de la Nación para sincronizar automáticamente
              todas tus causas y mantenerlas actualizadas.
            </Typography>
            <Button
              variant="contained"
              startIcon={<Link1 size={18} />}
              href="/apps/folders"
            >
              Vincular cuenta desde Nueva Carpeta
            </Button>
          </Stack>
        ) : (
          <Grid container spacing={3}>
            {/* Estado de conexión */}
            <Grid item xs={12}>
              <Card variant="outlined">
                <CardContent>
                  <Stack spacing={2}>
                    <Stack direction="row" alignItems="center" justifyContent="space-between">
                      <Stack direction="row" alignItems="center" spacing={1.5}>
                        {isComplete ? (
                          <TickCircle size={28} color={theme.palette.success.main} variant="Bold" />
                        ) : hasError ? (
                          <Warning2 size={28} color={theme.palette.error.main} variant="Bold" />
                        ) : (
                          <Link1 size={28} color={theme.palette.warning.main} />
                        )}
                        <Box>
                          <Typography variant="h6">
                            {isComplete ? "Cuenta conectada" : hasError ? "Error de sincronización" : "Cuenta vinculada"}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            CUIL: {credentialsStatus?.cuil ? `${credentialsStatus.cuil.substring(0, 2)}-****-${credentialsStatus.cuil.substring(credentialsStatus.cuil.length - 1)}` : "****"}
                          </Typography>
                        </Box>
                      </Stack>
                      <Chip
                        label={credentialsStatus?.enabled ? "Activa" : "Pausada"}
                        color={credentialsStatus?.enabled ? "success" : "warning"}
                        size="small"
                      />
                    </Stack>

                    {/* Alerta de error */}
                    {hasError && credentialsStatus?.lastError && (
                      <Box sx={{ p: 1.5, bgcolor: "error.lighter", borderRadius: 1 }}>
                        <Stack direction="row" spacing={1} alignItems="flex-start">
                          <InfoCircle size={18} color={theme.palette.error.main} />
                          <Box>
                            <Typography variant="body2" color="error.main" fontWeight={500}>
                              Error en la última sincronización
                            </Typography>
                            <Typography variant="caption" color="error.main">
                              {credentialsStatus.lastError.message}
                            </Typography>
                          </Box>
                        </Stack>
                      </Box>
                    )}

                    {/* Progreso de sincronización */}
                    {isSyncing && (
                      <Box>
                        <Stack direction="row" alignItems="center" spacing={1} mb={1}>
                          <CircularProgress size={16} />
                          <Typography variant="body2">{syncMessage}</Typography>
                        </Stack>
                        <LinearProgress variant="determinate" value={syncProgress} sx={{ borderRadius: 1 }} />
                      </Box>
                    )}

                    <Divider />

                    {/* Estadísticas */}
                    <Grid container spacing={2}>
                      <Grid item xs={6} sm={3}>
                        <Stack alignItems="center" spacing={0.5}>
                          <DocumentText size={24} color={theme.palette.primary.main} />
                          <Typography variant="h5">
                            {isSyncing && credentialsStatus?.currentSyncProgress?.totalExpected
                              ? credentialsStatus.currentSyncProgress.totalExpected
                              : credentialsStatus?.expectedCausasCount || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Causas</Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Stack alignItems="center" spacing={0.5}>
                          <Folder2 size={24} color={theme.palette.success.main} />
                          <Typography variant="h5">
                            {isSyncing && credentialsStatus?.currentSyncProgress?.causasProcessed !== undefined
                              ? `${credentialsStatus.currentSyncProgress.causasProcessed}/${credentialsStatus.currentSyncProgress.totalExpected || '?'}`
                              : credentialsStatus?.foldersCreatedCount || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">
                            {isSyncing ? "Procesadas" : "Carpetas"}
                          </Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Stack alignItems="center" spacing={0.5}>
                          <Calendar size={24} color={theme.palette.info.main} />
                          <Typography variant="body2" fontWeight={500}>
                            {formatDate(credentialsStatus?.lastSync)}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Última sync</Typography>
                        </Stack>
                      </Grid>
                      <Grid item xs={6} sm={3}>
                        <Stack alignItems="center" spacing={0.5}>
                          <Timer1 size={24} color={theme.palette.secondary.main} />
                          <Typography variant="body2" fontWeight={500}>
                            {credentialsStatus?.consecutiveErrors || 0}
                          </Typography>
                          <Typography variant="caption" color="text.secondary">Errores consecutivos</Typography>
                        </Stack>
                      </Grid>
                    </Grid>
                  </Stack>
                </CardContent>
              </Card>
            </Grid>

            {/* Acciones */}
            <Grid item xs={12}>
              <Stack direction={{ xs: "column", sm: "row" }} spacing={2}>
                <Button
                  variant="contained"
                  startIcon={<Refresh2 size={18} />}
                  onClick={handleResync}
                  disabled={isSyncing || !credentialsStatus?.enabled}
                >
                  {isSyncing ? "Sincronizando..." : "Sincronizar ahora"}
                </Button>
                <Tooltip title={isSyncing ? "No se puede cambiar mientras se sincroniza" : ""}>
                  <span>
                    <Button
                      variant="outlined"
                      startIcon={<Eye size={18} />}
                      onClick={() => setChangePasswordDialog(true)}
                      disabled={isSyncing}
                    >
                      Cambiar contraseña
                    </Button>
                  </span>
                </Tooltip>
                <Tooltip title={isSyncing ? "No se puede desconectar mientras se sincroniza" : ""}>
                  <span>
                    <Button
                      variant="outlined"
                      color="error"
                      startIcon={<Link21 size={18} />}
                      onClick={() => setDisconnectDialog(true)}
                      disabled={isSyncing}
                    >
                      Desconectar cuenta
                    </Button>
                  </span>
                </Tooltip>
              </Stack>
            </Grid>

            {/* Información adicional */}
            <Grid item xs={12}>
              <Box sx={{ p: 2, bgcolor: "action.hover", borderRadius: 1 }}>
                <Stack direction="row" spacing={1} alignItems="flex-start">
                  <InfoCircle size={18} color={theme.palette.info.main} />
                  <Box>
                    <Typography variant="body2" color="text.secondary">
                      Tu cuenta PJN se sincroniza automáticamente cada día para mantener tus carpetas actualizadas.
                      Al desconectar la cuenta, las carpetas existentes se mantendrán pero no se sincronizarán nuevas causas.
                    </Typography>
                  </Box>
                </Stack>
              </Box>
            </Grid>
          </Grid>
        )}

        {/* Dialog de desconexión */}
        <Dialog open={disconnectDialog} onClose={() => setDisconnectDialog(false)}>
          <DialogTitle>Desconectar cuenta PJN</DialogTitle>
          <DialogContent>
            <DialogContentText>
              ¿Estás seguro de desconectar tu cuenta del Poder Judicial de la Nación?
            </DialogContentText>
            <Box sx={{ mt: 2, p: 1.5, bgcolor: "info.lighter", borderRadius: 1 }}>
              <Stack spacing={1}>
                <Typography variant="body2" color="info.dark">
                  <strong>¿Qué sucederá?</strong>
                </Typography>
                <Typography variant="caption" color="info.dark" component="div">
                  • Las carpetas existentes <strong>se mantendrán</strong> y podrás seguir usándolas
                  <br />
                  • No se sincronizarán nuevas causas automáticamente
                  <br />
                  • Los movimientos de tus causas dejarán de actualizarse
                  <br />
                  • Podrás volver a vincular tu cuenta en cualquier momento
                </Typography>
              </Stack>
            </Box>
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setDisconnectDialog(false)}>Cancelar</Button>
            <Button onClick={handleDisconnect} color="error" variant="contained">
              Desconectar
            </Button>
          </DialogActions>
        </Dialog>

        {/* Dialog de cambio de contraseña */}
        <Dialog open={changePasswordDialog} onClose={() => setChangePasswordDialog(false)}>
          <DialogTitle>Cambiar contraseña PJN</DialogTitle>
          <DialogContent>
            <DialogContentText sx={{ mb: 2 }}>
              Si tu contraseña del portal PJN cambió, actualízala aquí para continuar sincronizando tus causas.
            </DialogContentText>
            <Box sx={{ p: 1.5, mb: 2, bgcolor: "warning.lighter", borderRadius: 1 }}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <Warning2 size={18} color={theme.palette.warning.main} />
                <Typography variant="caption" color="warning.dark">
                  <strong>Importante:</strong> El cambio de contraseña se aplicará en la próxima sincronización.
                  Se verificarán las credenciales y se iniciará una nueva sincronización completa.
                </Typography>
              </Stack>
            </Box>
            <Box sx={{ p: 1.5, mb: 2, bgcolor: "action.hover", borderRadius: 1 }}>
              <Stack direction="row" spacing={1} alignItems="flex-start">
                <InfoCircle size={18} color={theme.palette.info.main} />
                <Typography variant="caption" color="text.secondary">
                  <strong>Seguridad:</strong> Tu contraseña se almacena de forma encriptada (AES-256) en nuestra base de datos
                  y solo se utiliza para sincronizar tus causas con el PJN.
                </Typography>
              </Stack>
            </Box>
            <TextField
              fullWidth
              label="Nueva contraseña"
              type={showNewPassword ? "text" : "password"}
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              disabled={isChangingPassword}
              InputProps={{
                endAdornment: (
                  <InputAdornment position="end">
                    <IconButton onClick={() => setShowNewPassword(!showNewPassword)} edge="end">
                      {showNewPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                    </IconButton>
                  </InputAdornment>
                ),
              }}
            />
          </DialogContent>
          <DialogActions>
            <Button onClick={() => setChangePasswordDialog(false)} disabled={isChangingPassword}>
              Cancelar
            </Button>
            <Button
              onClick={handleChangePassword}
              variant="contained"
              disabled={isChangingPassword || !newPassword.trim()}
            >
              {isChangingPassword ? <CircularProgress size={20} /> : "Actualizar"}
            </Button>
          </DialogActions>
        </Dialog>
      </MainCard>
      </Grid>

      <Grid item xs={12} md={6}>
      {/* === Card 2: Preferencias de sincronización (siempre visible) === */}
      <MainCard title="Preferencias de sincronización">
        <Stack spacing={2}>
          <Stack direction="row" alignItems="center" justifyContent="space-between">
            <Box>
              <FormControlLabel
                control={
                  <Switch
                    checked={syncContactsEnabled}
                    onChange={handleToggleSyncContacts}
                    disabled={syncContactsLoading}
                  />
                }
                label="Sincronizar intervinientes como contactos"
              />
              <Typography variant="caption" color="text.secondary" display="block" sx={{ ml: 6 }}>
                Los intervinientes (partes y letrados) extraídos de tus causas se crearán automáticamente
                como contactos en las carpetas vinculadas.
              </Typography>
            </Box>
            {syncContactsLoading && <CircularProgress size={20} />}
          </Stack>
          <Alert severity="info" variant="outlined">
            La cantidad de contactos sincronizados está sujeta a los límites de tu plan actual.
          </Alert>
        </Stack>
      </MainCard>
      </Grid>
    </Grid>
  );
};

export default TabPjnIntegration;

/**
 * Componente para conectar cuenta del Poder Judicial de la Nación
 *
 * Permite al usuario vincular sus credenciales PJN para sincronizar
 * automáticamente todas sus causas.
 */

import React, { useState, useEffect, useCallback, forwardRef, useImperativeHandle } from "react";
import {
  Box,
  Stack,
  Typography,
  TextField,
  Button,
  Alert,
  CircularProgress,
  LinearProgress,
  Collapse,
  IconButton,
  InputAdornment,
  Divider,
  Card,
  CardContent,
  Chip,
  Dialog,
  DialogContent,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import {
  Link1,
  Eye,
  EyeSlash,
  TickCircle,
  CloseCircle,
  Refresh2,
  InfoCircle,
  Folder2,
  DocumentText,
} from "iconsax-react";
import { enqueueSnackbar } from "notistack";
import { Zoom } from "@mui/material";
import { useSelector } from "react-redux";
import { dispatch as storeDispatch } from "store";
import { getFoldersByUserId } from "store/reducers/folder";
import { PopupTransition } from "components/@extended/Transitions";
import Avatar from "components/@extended/Avatar";
import pjnCredentialsService, {
  PjnCredentialsStatus,
  UnlinkImpact,
} from "api/pjnCredentials";

interface PjnAccountConnectProps {
  onConnectionSuccess?: () => void;
  onSyncComplete?: () => void;
  onServiceAvailableChange?: (available: boolean, message?: string) => void;
}

// Interface para exponer métodos al componente padre
export interface PjnAccountConnectRef {
  submit: () => Promise<boolean>;
  canSubmit: () => boolean;
}

const PjnAccountConnect = forwardRef<PjnAccountConnectRef, PjnAccountConnectProps>(({
  onConnectionSuccess,
  onSyncComplete,
  onServiceAvailableChange,
}, ref) => {
  const theme = useTheme();
  const authUser = useSelector((state: any) => state.auth?.user);

  // Estado del formulario
  const [cuil, setCuil] = useState("");
  const [password, setPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);
  const [isSubmitting, setIsSubmitting] = useState(false);

  // Estado de credenciales existentes
  const [credentialsStatus, setCredentialsStatus] = useState<PjnCredentialsStatus | null>(null);
  const [isLoadingStatus, setIsLoadingStatus] = useState(true);
  const [hasCredentials, setHasCredentials] = useState(false);
  const [serviceAvailable, setServiceAvailable] = useState(true);
  const [serviceMessage, setServiceMessage] = useState("");

  // Estado de sincronización
  const [isSyncing, setIsSyncing] = useState(false);
  const [syncProgress, setSyncProgress] = useState(0);
  const [syncMessage, setSyncMessage] = useState("");

  // Errores
  const [cuilError, setCuilError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Estado del dialog de desvinculación
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [unlinkImpact, setUnlinkImpact] = useState<UnlinkImpact | null>(null);
  const [isLoadingImpact, setIsLoadingImpact] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  // Polling cleanup
  const [stopPolling, setStopPolling] = useState<(() => void) | null>(null);

  // Cargar estado de credenciales al montar
  useEffect(() => {
    loadCredentialsStatus();

    // Cleanup polling on unmount
    return () => {
      if (stopPolling) {
        stopPolling();
      }
    };
  }, []);

  const loadCredentialsStatus = async () => {
    setIsLoadingStatus(true);
    try {
      const response = await pjnCredentialsService.getCredentialsStatus();
      setServiceAvailable(response.serviceAvailable);
      setServiceMessage(response.serviceMessage || "");
      onServiceAvailableChange?.(response.serviceAvailable, response.serviceMessage);

      if (response.success && response.data) {
        setCredentialsStatus(response.data);
        setHasCredentials(true);

        // Si está en progreso, iniciar polling
        if (response.data.syncStatus === "in_progress" || response.data.syncStatus === "pending") {
          startPolling();
        }
      } else {
        setHasCredentials(false);
        setCredentialsStatus(null);
      }
    } catch (error) {
      setHasCredentials(false);
    } finally {
      setIsLoadingStatus(false);
    }
  };

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
            setSyncMessage(`Procesando causas: ${causasProcessed}/${totalExpected} (Página ${currentPage}/${totalPages})`);
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

        enqueueSnackbar(
          `Sincronización completada: ${status.foldersCreatedCount} carpetas creadas`,
          {
            variant: "success",
            anchorOrigin: { vertical: "bottom", horizontal: "right" },
            TransitionComponent: Zoom,
            autoHideDuration: 5000,
          }
        );

        if (onSyncComplete) {
          onSyncComplete();
        }
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
      }
    );

    setStopPolling(() => stop);
  }, [onSyncComplete]);

  // Validar CUIL
  const validateCuil = (value: string): boolean => {
    const cuilClean = value.replace(/-/g, "").trim();
    if (!cuilClean) {
      setCuilError("El CUIL es requerido");
      return false;
    }
    if (!/^\d{11}$/.test(cuilClean)) {
      setCuilError("El CUIL debe tener 11 dígitos");
      return false;
    }
    setCuilError("");
    return true;
  };

  // Validar password
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
    const cuilValid = validateCuil(cuil);
    const passwordValid = validatePassword(password);

    if (!cuilValid || !passwordValid) {
      return false;
    }

    setIsSubmitting(true);

    try {
      const response = await pjnCredentialsService.linkCredentials(cuil, password);

      if (response.success) {
        enqueueSnackbar(response.message || "Cuenta vinculada correctamente", {
          variant: "success",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          TransitionComponent: Zoom,
          autoHideDuration: 4000,
        });

        // Limpiar formulario
        setCuil("");
        setPassword("");

        // Actualizar estado
        setHasCredentials(true);
        if (response.data) {
          setCredentialsStatus({
            ...credentialsStatus,
            id: response.data.id,
            verified: response.data.verified,
            isValid: response.data.isValid,
            syncStatus: "pending",
          } as PjnCredentialsStatus);
        }

        // Iniciar polling para ver progreso
        startPolling();

        if (onConnectionSuccess) {
          onConnectionSuccess();
        }
        return true;
      } else {
        enqueueSnackbar(response.error || "Error al vincular cuenta", {
          variant: "error",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          TransitionComponent: Zoom,
          autoHideDuration: 5000,
        });
        return false;
      }
    } catch (error) {
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

  // Exponer métodos al componente padre
  useImperativeHandle(ref, () => ({
    submit: handleSubmit,
    canSubmit: () => Boolean(cuil && password && !isSubmitting && !hasCredentials),
  }));

  // Solicitar re-sincronización
  const handleResync = async () => {
    try {
      const response = await pjnCredentialsService.requestSync();

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
    } catch (error) {
      enqueueSnackbar("Error al solicitar sincronización", {
        variant: "error",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
        TransitionComponent: Zoom,
        autoHideDuration: 4000,
      });
    }
  };

  // Abre el dialog y carga el análisis de impacto
  const handleUnlinkClick = async () => {
    setUnlinkDialogOpen(true);
    setUnlinkImpact(null);
    setIsLoadingImpact(true);
    try {
      const response = await pjnCredentialsService.getUnlinkImpact();
      if (response.success && response.data) {
        setUnlinkImpact(response.data);
      }
    } catch {
      // Si falla el análisis de impacto, igual se puede continuar con el dialog
    } finally {
      setIsLoadingImpact(false);
    }
  };

  // Ejecuta la desvinculación con el modo elegido
  const handleUnlink = async (mode: "keep" | "delete") => {
    setIsUnlinking(true);
    try {
      const response = await pjnCredentialsService.unlinkCredentials(mode);

      if (response.success) {
        setUnlinkDialogOpen(false);
        enqueueSnackbar(response.message || "Cuenta desvinculada correctamente", {
          variant: "success",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          TransitionComponent: Zoom,
          autoHideDuration: 3000,
        });

        setHasCredentials(false);
        setCredentialsStatus(null);
        if (stopPolling) {
          stopPolling();
        }

        // Recargar carpetas en Redux para reflejar los cambios
        const userId = authUser?._id || authUser?.id;
        if (userId) {
          storeDispatch(getFoldersByUserId(userId, true) as any);
        }
      } else {
        enqueueSnackbar(response.error || "Error al desvincular cuenta", {
          variant: "error",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          TransitionComponent: Zoom,
          autoHideDuration: 4000,
        });
      }
    } catch (error) {
      enqueueSnackbar("Error de conexión", {
        variant: "error",
        anchorOrigin: { vertical: "bottom", horizontal: "right" },
        TransitionComponent: Zoom,
        autoHideDuration: 4000,
      });
    } finally {
      setIsUnlinking(false);
    }
  };

  // Formatear CUIL con guiones
  const formatCuil = (value: string) => {
    const clean = value.replace(/\D/g, "");
    if (clean.length <= 2) return clean;
    if (clean.length <= 10) return `${clean.slice(0, 2)}-${clean.slice(2)}`;
    return `${clean.slice(0, 2)}-${clean.slice(2, 10)}-${clean.slice(10, 11)}`;
  };

  // Dialog de confirmación de desvinculación
  const unlinkDialog = (
    <Dialog
      open={unlinkDialogOpen}
      onClose={() => !isUnlinking && setUnlinkDialogOpen(false)}
      keepMounted
      TransitionComponent={PopupTransition}
      maxWidth="xs"
      fullWidth
    >
      <DialogContent sx={{ mt: 2, my: 1 }}>
        <Stack alignItems="center" spacing={2.5}>
          <Avatar color="error" sx={{ width: 64, height: 64, fontSize: "1.5rem" }}>
            <CloseCircle variant="Bold" size={32} />
          </Avatar>

          <Typography variant="h5" align="center">
            ¿Cómo deseas desvincular la cuenta PJN?
          </Typography>

          {isLoadingImpact ? (
            <CircularProgress size={24} />
          ) : unlinkImpact ? (
            <Stack spacing={1} sx={{ width: "100%" }}>
              <Alert severity="warning" sx={{ "& .MuiAlert-message": { fontSize: "0.8rem" } }}>
                {unlinkImpact.folders.total} carpetas afectadas
                ({unlinkImpact.folders.active} activas, {unlinkImpact.folders.archived} archivadas)
              </Alert>
              {unlinkImpact.folders.names.length > 0 && (
                <Box
                  sx={{
                    maxHeight: 160,
                    overflowY: "auto",
                    border: `1px solid ${theme.palette.divider}`,
                    borderRadius: 1,
                    p: 1,
                  }}
                >
                  <Stack spacing={0.25}>
                    {unlinkImpact.folders.names.map((name, idx) => (
                      <Typography key={idx} variant="caption" color="text.secondary" noWrap>
                        • {name}
                      </Typography>
                    ))}
                  </Stack>
                </Box>
              )}
            </Stack>
          ) : null}

          <Stack spacing={1} sx={{ width: "100%" }}>
            <Button
              fullWidth
              variant="outlined"
              color="warning"
              onClick={() => handleUnlink("keep")}
              disabled={isUnlinking}
              startIcon={isUnlinking ? <CircularProgress size={14} color="inherit" /> : undefined}
            >
              Conservar sin sincronización
            </Button>
            <Button
              fullWidth
              variant="contained"
              color="error"
              onClick={() => handleUnlink("delete")}
              disabled={isUnlinking}
              startIcon={isUnlinking ? <CircularProgress size={14} color="inherit" /> : undefined}
            >
              Eliminar carpetas y causas
            </Button>
            <Button
              fullWidth
              variant="text"
              color="secondary"
              onClick={() => setUnlinkDialogOpen(false)}
              disabled={isUnlinking}
            >
              Cancelar
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );

  // Renderizar estado de carga
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
      <Alert
        severity="info"
        icon={<InfoCircle size={18} />}
        sx={{ "& .MuiAlert-message": { fontSize: "0.8rem" } }}
      >
        {serviceMessage || "La integración con el Poder Judicial de la Nación no está disponible en este momento."}
      </Alert>
    );
  }

  // Renderizar estado de sincronización en progreso
  if (isSyncing || (credentialsStatus?.syncStatus === "in_progress")) {
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
              <LinearProgress
                variant="determinate"
                value={syncProgress}
                sx={{ height: 8, borderRadius: 4 }}
              />
              <Typography variant="caption" color="text.secondary" sx={{ mt: 0.5, display: "block" }}>
                {syncMessage || `${syncProgress.toFixed(0)}% completado`}
              </Typography>
            </Box>

            <Alert severity="info" icon={<InfoCircle size={20} />}>
              El proceso puede tomar varios minutos dependiendo de la cantidad de causas.
              Puede cerrar este diálogo y continuar trabajando, las carpetas se crearán automáticamente.
            </Alert>

            {credentialsStatus?.currentSyncProgress && (
              <Stack direction="row" spacing={2} justifyContent="center">
                <Chip
                  icon={<DocumentText size={16} />}
                  label={`${credentialsStatus.currentSyncProgress.causasProcessed || 0} causas`}
                  size="small"
                  variant="outlined"
                />
                <Chip
                  icon={<Folder2 size={16} />}
                  label={`${credentialsStatus.foldersCreatedCount || 0} carpetas`}
                  size="small"
                  variant="outlined"
                  color="primary"
                />
              </Stack>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Renderizar cuenta conectada
  if (hasCredentials && credentialsStatus) {
    const isComplete = credentialsStatus.isValid && credentialsStatus.verified;
    const hasError = credentialsStatus.syncStatus === "error";

    return (
      <>
        {unlinkDialog}
        <Card variant="outlined" sx={{ borderColor: isComplete ? theme.palette.success.light : theme.palette.warning.light }}>
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
                  <IconButton
                    size="small"
                    onClick={handleResync}
                    title="Re-sincronizar"
                    disabled={!credentialsStatus.enabled}
                  >
                    <Refresh2 size={18} />
                  </IconButton>
                </Stack>
              </Stack>

              {isComplete && (
                <Alert severity="success" icon={<TickCircle size={20} />}>
                  Tus causas del Poder Judicial de la Nación están sincronizadas.
                  Se crearon {credentialsStatus.foldersCreatedCount || 0} carpetas.
                </Alert>
              )}

              {hasError && credentialsStatus.lastError && (
                <Alert severity="error">
                  {credentialsStatus.lastError.message}
                </Alert>
              )}

              {!isComplete && !hasError && credentialsStatus.syncStatus === "pending" && (
                <Alert severity="info">
                  Tu cuenta está vinculada. La sincronización comenzará en breve.
                </Alert>
              )}

              <Divider />

              <Button
                variant="text"
                color="error"
                size="small"
                onClick={handleUnlinkClick}
                startIcon={<CloseCircle size={16} />}
              >
                Desvincular cuenta
              </Button>
            </Stack>
          </CardContent>
        </Card>
      </>
    );
  }

  // Renderizar formulario de conexión
  return (
    <Card variant="outlined" sx={{ overflow: "visible" }}>
      <CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
        <Stack spacing={1.25}>
          <Stack direction="row" alignItems="center" spacing={1}>
            <Link1 size={20} color={theme.palette.primary.main} />
            <Typography variant="subtitle2" fontWeight={500}>
              Conectar cuenta PJN
            </Typography>
          </Stack>

          <Alert
            severity="info"
            icon={<InfoCircle size={14} />}
            sx={{ py: 0.25, "& .MuiAlert-message": { fontSize: "0.75rem" } }}
          >
            Vincula tu cuenta del Portal PJN para importar todas tus causas.
          </Alert>

          <TextField
            fullWidth
            label="CUIL"
            placeholder="XX-XXXXXXXX-X"
            value={formatCuil(cuil)}
            onChange={(e) => {
              const value = e.target.value.replace(/\D/g, "");
              setCuil(value);
              if (cuilError) validateCuil(value);
            }}
            onBlur={() => validateCuil(cuil)}
            error={Boolean(cuilError)}
            helperText={cuilError}
            disabled={isSubmitting}
            inputProps={{ maxLength: 13 }}
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
                  <IconButton
                    onClick={() => setShowPassword(!showPassword)}
                    edge="end"
                    size="small"
                  >
                    {showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
                  </IconButton>
                </InputAdornment>
              ),
            }}
          />

          <Alert
            severity="info"
            icon={<InfoCircle size={14} />}
            sx={{ py: 0.25, "& .MuiAlert-message": { fontSize: "0.75rem" } }}
          >
            <strong>Seguridad:</strong> Tu contraseña se almacena encriptada (AES-256) y solo se usa para sincronizar tus causas.
          </Alert>

          <Button
            variant="contained"
            fullWidth
            size="small"
            onClick={handleSubmit}
            disabled={isSubmitting || !cuil || !password}
            startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <Link1 size={16} />}
          >
            {isSubmitting ? "Conectando..." : "Conectar cuenta"}
          </Button>
        </Stack>
      </CardContent>
    </Card>
  );
});

export default PjnAccountConnect;

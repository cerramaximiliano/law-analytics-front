/**
 * Componente para conectar cuenta del Poder Judicial de la Nación
 *
 * Permite al usuario vincular sus credenciales PJN para sincronizar
 * automáticamente todas sus causas.
 */

import React, { useState, useEffect, useRef, forwardRef, useImperativeHandle } from "react";
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
} from "iconsax-react";
import { enqueueSnackbar } from "notistack";
import { Zoom } from "@mui/material";
import { useSelector, useDispatch } from "react-redux";
import { dispatch as storeDispatch } from "store";
import { RootState } from "store";
import { getFoldersByUserId } from "store/reducers/folder";
import { pjnSyncStarted, pjnSyncReset, pjnSyncCompleted, pjnSyncError } from "store/reducers/pjnSync";
import { PopupTransition } from "components/@extended/Transitions";
import Avatar from "components/@extended/Avatar";
import pjnCredentialsService, {
  PjnCredentialsStatus,
  UnlinkImpact,
} from "api/pjnCredentials";
import { useTeam } from "contexts/TeamContext";

interface PjnAccountConnectProps {
  onConnectionSuccess?: () => void;
  onSyncComplete?: () => void;
  onServiceAvailableChange?: (available: boolean, message?: string) => void;
}

// Interface para exponer métodos al componente padre
export interface PjnAccountConnectRef {
  submit: () => Promise<boolean>;
  canSubmit: () => boolean;
  isConnected: () => boolean;
}

const PjnAccountConnect = forwardRef<PjnAccountConnectRef, PjnAccountConnectProps>(({
  onConnectionSuccess,
  onSyncComplete,
  onServiceAvailableChange,
}, ref) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const authUser = useSelector((state: any) => state.auth?.user);
  const pjnSync = useSelector((state: RootState) => state.pjnSync);
  const folders = useSelector((state: RootState) => state.folder.folders);
  const { isTeamMode, isOwner } = useTeam();
  const isTeamMember = isTeamMode && !isOwner;

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

  // Errores
  const [cuilError, setCuilError] = useState("");
  const [passwordError, setPasswordError] = useState("");

  // Estado del dialog de desvinculación
  const [unlinkDialogOpen, setUnlinkDialogOpen] = useState(false);
  const [unlinkImpact, setUnlinkImpact] = useState<UnlinkImpact | null>(null);
  const [isLoadingImpact, setIsLoadingImpact] = useState(false);
  const [isUnlinking, setIsUnlinking] = useState(false);

  // Muestra el resumen de pasos completados brevemente después de que el sync termina
  const [showCompletionSummary, setShowCompletionSummary] = useState(false);
  const completionTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  // Ref para rastrear la fase anterior y detectar transiciones (no el valor al montar)
  const prevPhaseRef = useRef(pjnSync.phase);

  useEffect(() => {
    const prevPhase = prevPhaseRef.current;
    prevPhaseRef.current = pjnSync.phase;
    // Solo activar si este componente presenció la transición hacia "completed".
    // Evita que al montar con phase="completed" (heredado del modal) se active
    // el timer y luego se cancele por un pjnSyncReset dejando showCompletionSummary=true.
    if (pjnSync.phase === "completed" && prevPhase !== "completed") {
      setShowCompletionSummary(true);
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
      completionTimerRef.current = setTimeout(() => setShowCompletionSummary(false), 3000);
    }
    return () => {
      if (completionTimerRef.current) clearTimeout(completionTimerRef.current);
    };
  }, [pjnSync.phase]);

  // Ref para detectar transición isActive: true → false
  const prevIsActiveRef = useRef(false);

  // Ref que refleja pjnSync.isActive en tiempo real
  // Evita stale closures en funciones async (loadCredentialsStatus, handleSubmit)
  const pjnSyncActiveRef = useRef(pjnSync.isActive);
  pjnSyncActiveRef.current = pjnSync.isActive;

  // Rescue polling: fallback cuando los eventos WS no llegan
  const WS_TIMEOUT_MS = 20000;
  const WS_RESCUE_INTERVAL_MS = 10000;
  const MAX_SYNC_DURATION_MS = 5 * 60 * 1000; // 5 minutos máximo (sync típica: 2-3 min)
  const lastWsEventRef = useRef<number>(0);
  const syncStartedAtRef = useRef<number>(0);
  const rescuePollIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);

  // Detecta cuando el sync pasa de activo a inactivo para recargar estado
  // El snackbar de completado/error se dispara en WebSocketContext (path WS)
  // o directamente en la función poll del rescue polling (path fallback)
  useEffect(() => {
    if (!prevIsActiveRef.current && pjnSync.isActive) {
      // Sync acaba de empezar: registrar timestamp de inicio para el timeout del rescue polling
      syncStartedAtRef.current = Date.now();
      lastWsEventRef.current = Date.now();
    }
    if (prevIsActiveRef.current && !pjnSync.isActive) {
      if (pjnSync.completedAt || pjnSync.hasError) {
        // calledAfterCompletion=true: el WS ya confirmó el fin del sync.
        // Si el DB devuelve syncStatus=in_progress (stale), no redisparar pjnSyncStarted.
        loadCredentialsStatus(true);
        if (pjnSync.completedAt) onSyncComplete?.();
      }
    }
    prevIsActiveRef.current = pjnSync.isActive;
  }, [pjnSync.isActive]);

  // Actualiza el timestamp del último evento WS al recibir cambios de progreso
  useEffect(() => {
    if (pjnSync.isActive) {
      lastWsEventRef.current = Date.now();
    }
  }, [pjnSync.isActive, pjnSync.progress, pjnSync.message, pjnSync.phase]);

  // Rescue polling: se activa si no llegan eventos WS en WS_TIMEOUT_MS
  useEffect(() => {
    if (!pjnSync.isActive) {
      if (rescuePollIntervalRef.current) {
        clearInterval(rescuePollIntervalRef.current);
        rescuePollIntervalRef.current = null;
      }
      return;
    }

    const poll = async () => {
      if (Date.now() - lastWsEventRef.current < WS_TIMEOUT_MS) return;

      try {
        const response = await pjnCredentialsService.getCredentialsStatus();
        if (!response.success || !response.data) {
          // Sin datos: verificar si superó el tiempo máximo de espera
          const elapsed = syncStartedAtRef.current > 0 ? Date.now() - syncStartedAtRef.current : 0;
          if (elapsed > MAX_SYNC_DURATION_MS) {
            dispatch(pjnSyncError({ message: "La sincronización tardó demasiado y no pudo completarse" }));
            enqueueSnackbar("La sincronización tardó más de lo esperado. Puedes reintentar manualmente.", {
              variant: "warning",
              anchorOrigin: { vertical: "bottom", horizontal: "right" },
              TransitionComponent: Zoom,
              autoHideDuration: 6000,
            });
          }
          return;
        }

        // Abortar si el WS ya manejó la finalización mientras la llamada API estaba en curso
        if (!rescuePollIntervalRef.current) return;

        const { syncStatus, lastError } = response.data;
        setCredentialsStatus(response.data);

        if (syncStatus !== "completed" && syncStatus !== "error") {
          // Sync sigue en curso: verificar si superó el tiempo máximo
          const elapsed = syncStartedAtRef.current > 0 ? Date.now() - syncStartedAtRef.current : 0;
          if (elapsed > MAX_SYNC_DURATION_MS) {
            dispatch(pjnSyncError({ message: "La sincronización tardó demasiado y no pudo completarse" }));
            enqueueSnackbar("La sincronización tardó más de lo esperado. Puedes reintentar manualmente.", {
              variant: "warning",
              anchorOrigin: { vertical: "bottom", horizontal: "right" },
              TransitionComponent: Zoom,
              autoHideDuration: 6000,
            });
          }
          return;
        }

        if (syncStatus === "error") {
          dispatch(pjnSyncError({ message: lastError?.message || "Error en sincronización" }));
          enqueueSnackbar(`Error en sincronización: ${lastError?.message || "Error desconocido"}`, {
            variant: "error",
            anchorOrigin: { vertical: "bottom", horizontal: "right" },
            TransitionComponent: Zoom,
            autoHideDuration: 5000,
          });
        } else {
          const foldersCreated = response.data.foldersCreatedCount ?? 0;
          dispatch(pjnSyncCompleted({ foldersCreated, newCausas: 0 }));
          enqueueSnackbar(`Sincronización completada: ${foldersCreated} carpetas creadas`, {
            variant: "success",
            anchorOrigin: { vertical: "bottom", horizontal: "right" },
            TransitionComponent: Zoom,
            autoHideDuration: 5000,
          });
          // Recargar carpetas para reflejar el badge PJN
          const uid = authUser?._id || authUser?.id;
          if (uid) {
            storeDispatch(getFoldersByUserId(uid, true) as any);
          }
        }
      } catch {
        // Silently ignore — es un fallback, no debe afectar la UX
      }
    };

    rescuePollIntervalRef.current = setInterval(poll, WS_RESCUE_INTERVAL_MS);
    return () => {
      if (rescuePollIntervalRef.current) {
        clearInterval(rescuePollIntervalRef.current);
        rescuePollIntervalRef.current = null;
      }
    };
  }, [pjnSync.isActive]);

  // Cargar estado de credenciales al montar
  useEffect(() => {
    loadCredentialsStatus();
  }, []);

  // calledAfterCompletion=true cuando se invoca desde la transición isActive: true→false.
  // En ese contexto, el DB puede devolver syncStatus=in_progress stale (ya que el WS
  // completó antes de que el DB se actualizara). No redisparar pjnSyncStarted en ese caso
  // para evitar el ciclo: completedAt set → stale DB in_progress → pjnSyncStarted → cycle.
  const loadCredentialsStatus = async (calledAfterCompletion = false) => {
    setIsLoadingStatus(true);
    try {
      const response = await pjnCredentialsService.getCredentialsStatus();
      setServiceAvailable(response.serviceAvailable);
      setServiceMessage(response.serviceMessage || "");
      onServiceAvailableChange?.(response.serviceAvailable, response.serviceMessage);

      if (response.success && response.data) {
        setCredentialsStatus(response.data);
        setHasCredentials(true);

        // Si hay sync en curso, inicializar estado en Redux para mostrar UI correcta.
        // Cuando calledAfterCompletion=true el WS ya envió "completed": ignorar DB stale.
        // Cuando pjnSyncActiveRef.current=true el WS ya marcó un sync activo: no resetear
        // seenPhases (PJN_SYNC_STARTED hace full-reset incluyendo seenPhases=[]).
        if (!calledAfterCompletion && !pjnSyncActiveRef.current && (response.data.syncStatus === "in_progress" || response.data.syncStatus === "pending")) {
          const cp = response.data.currentSyncProgress;
          dispatch(pjnSyncStarted({
            progress: cp?.progress ?? 0,
            message: "Sincronizando causas...",
          }));
        } else if (!pjnSyncActiveRef.current && !calledAfterCompletion) {
          // Limpiar estado stale solo si WS no ha marcado un sync activo
          // Excluir calledAfterCompletion=true: pjnSyncReset borraría completedAt,
          // anulando la guardia !completedAt en el render y mostrando el sync card stale.
          dispatch(pjnSyncReset());
        }
      } else {
        setHasCredentials(false);
        setCredentialsStatus(null);
        dispatch(pjnSyncReset());
      }
    } catch (error) {
      setHasCredentials(false);
      dispatch(pjnSyncReset());
    } finally {
      setIsLoadingStatus(false);
    }
  };

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
    // Guard: evitar re-submit si ya hay un sync activo
    if (pjnSyncActiveRef.current) return false;

    const cuilValid = validateCuil(cuil);
    const passwordValid = validatePassword(password);

    if (!cuilValid || !passwordValid) {
      return false;
    }

    setIsSubmitting(true);

    try {
      const response = await pjnCredentialsService.linkCredentials(cuil, password);

      if (response.success) {
        // Dispatch ANTES de setHasCredentials para evitar flash de "Cuenta conectada"
        // Si hay un render entre estos dos calls, pjnSync.isActive=true toma prioridad
        // force=true: acción explícita del usuario, ignora el grace period del reducer.
        dispatch(pjnSyncStarted({ progress: 0, message: "Sincronizando causas...", force: true }));

        enqueueSnackbar("Cuenta vinculada. Iniciando sincronización...", {
          variant: "success",
          anchorOrigin: { vertical: "bottom", horizontal: "right" },
          TransitionComponent: Zoom,
          autoHideDuration: 3000,
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
    canSubmit: () => Boolean(cuil && password && !isSubmitting && !hasCredentials && !isLoadingStatus && !pjnSyncActiveRef.current),
    isConnected: () => hasCredentials,
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

        // Mostrar UI de sync mientras el WS no llegue con el evento "started".
        // force=true: acción explícita del usuario, ignora el grace period del reducer.
        dispatch(pjnSyncStarted({ progress: 0, message: "Sincronizando causas...", force: true }));
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
        dispatch(pjnSyncReset());

        if (mode === "delete") {
          // Eliminar inmediatamente del store los folders PJN para que no
          // se sigan mostrando en la UI mientras el server confirma la operación
          const pjnIds = folders
            .filter((f: any) => f.pjn)
            .map((f: any) => f._id);
          if (pjnIds.length > 0) {
            dispatch({ type: "DELETE_FOLDERS", payload: pjnIds });
          }
        }

        // Recargar carpetas desde el server para confirmar el estado final
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
              Eliminar carpetas
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

  // Miembros del equipo (viewer/editor): solo lectura, sin gestión PJN
  if (isTeamMember) {
    return (
      <Alert
        severity="info"
        icon={<InfoCircle size={18} />}
        sx={{ "& .MuiAlert-message": { fontSize: "0.85rem" } }}
      >
        La integración PJN es gestionada por el propietario del equipo.
        Solo el propietario puede vincular, desvincular o iniciar sincronizaciones.
      </Alert>
    );
  }

  // Renderizar estado de carga (no interrumpir si estamos mostrando el resumen de finalización)
  if (isLoadingStatus && !showCompletionSummary) {
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
  // Incluye "pending" para evitar flash de "Cuenta conectada" entre requestSync y el evento WS "started"
  if (
    pjnSync.isActive ||
    showCompletionSummary ||
    (credentialsStatus?.syncStatus === "in_progress" && !pjnSync.completedAt && !pjnSync.hasError) ||
    credentialsStatus?.syncStatus === "pending"
  ) {
    const isCompleted = pjnSync.phase === "completed";
    const isRetrying = pjnSync.phase === "retrying";
    // Orden canónico de las fases visibles
    const PHASE_STEPS = [
      { key: "started", label: "Autenticación con PJN" },
      { key: "extraction", label: "Extracción de causas" },
      { key: "processing", label: "Creación de carpetas" },
    ];
    // Fases acumuladas por el reducer (persisten aunque los eventos lleguen en ráfaga)
    const seen = pjnSync.seenPhases ?? [];
    // Cuando el sync completó, todas las fases se muestran como ✓
    const stepsToShow = isCompleted
      ? PHASE_STEPS
      : PHASE_STEPS.filter((s) => seen.includes(s.key));
    // Etiqueta del paso activo (solo cuando no está completado)
    const activeLabel = PHASE_STEPS.find((s) => s.key === pjnSync.phase)?.label ?? "Autenticación con PJN";

    return (
      <Card variant="outlined" sx={{ borderColor: isCompleted ? theme.palette.success.light : isRetrying ? theme.palette.warning.light : theme.palette.primary.light }}>
        <CardContent>
          <Stack spacing={2}>
            {/* Título */}
            <Stack direction="row" alignItems="center" spacing={1}>
              {isCompleted ? (
                <Box sx={{ width: 20, height: 20, borderRadius: "50%", bgcolor: "success.main", display: "flex", alignItems: "center", justifyContent: "center", flexShrink: 0 }}>
                  <Typography sx={{ color: "white", fontSize: "0.65rem", fontWeight: 700, lineHeight: 1 }}>✓</Typography>
                </Box>
              ) : (
                <CircularProgress size={20} color={isRetrying ? "warning" : "primary"} />
              )}
              <Typography variant="subtitle1" fontWeight={500} color={isCompleted ? "success.main" : "text.primary"}>
                {isCompleted ? "Sincronización completada" : "Sincronizando causas..."}
              </Typography>
              {!isCompleted && pjnSync.progress > 0 && (
                <Typography variant="caption" color="text.secondary" sx={{ ml: "auto" }}>
                  {pjnSync.progress.toFixed(0)}%
                </Typography>
              )}
            </Stack>

            {/* Barra de progreso (solo mientras sincroniza) */}
            {!isCompleted && (
              <LinearProgress
                variant={pjnSync.progress > 0 && !isRetrying ? "determinate" : "indeterminate"}
                value={pjnSync.progress > 0 && !isRetrying ? pjnSync.progress : undefined}
                color={isRetrying ? "warning" : "primary"}
                sx={{ height: 8, borderRadius: 4 }}
              />
            )}

            {/* Pasos */}
            <Stack spacing={1}>
              {/* Fases ya superadas o completadas: tilde verde */}
              {stepsToShow.map((step) => (
                <Stack key={step.key} direction="row" alignItems="center" spacing={1}>
                  <Box
                    sx={{
                      width: 20, height: 20, borderRadius: "50%",
                      bgcolor: "success.main", flexShrink: 0,
                      display: "flex", alignItems: "center", justifyContent: "center",
                    }}
                  >
                    <Typography sx={{ color: "white", fontSize: "0.65rem", fontWeight: 700, lineHeight: 1 }}>✓</Typography>
                  </Box>
                  <Typography variant="body2" color="success.main">
                    {step.label}
                  </Typography>
                </Stack>
              ))}

              {/* Fase activa: solo texto, sin spinner (solo mientras sincroniza) */}
              {!isCompleted && (
                <Box>
                  <Typography variant="body2" fontWeight={500} color={isRetrying ? "warning.main" : "text.primary"}>
                    {activeLabel}
                  </Typography>
                  {pjnSync.message ? (
                    <Typography variant="caption" color={isRetrying ? "warning.main" : "text.secondary"}>
                      {pjnSync.message}
                    </Typography>
                  ) : (
                    <Typography variant="caption" color="text.disabled">
                      {credentialsStatus?.syncStatus === "pending" ? "En cola, esperando inicio..." : "Iniciando..."}
                    </Typography>
                  )}
                </Box>
              )}
            </Stack>

            {/* Info (solo mientras sincroniza) */}
            {!isCompleted && (
              <Alert severity="info" icon={<InfoCircle size={20} />}>
                El proceso puede tomar varios minutos dependiendo de la cantidad de causas.
                Puede continuar trabajando con normalidad, las carpetas se crearán automáticamente.
              </Alert>
            )}
          </Stack>
        </CardContent>
      </Card>
    );
  }

  // Renderizar cuenta conectada
  if (hasCredentials && credentialsStatus) {
    const isComplete = credentialsStatus.isValid && credentialsStatus.verified;
    const syncErrored = credentialsStatus.syncStatus === "error";
    // hasError solo cuando hay error Y las credenciales no están en estado completo
    // (si isValid && verified, la cuenta sigue conectada a pesar del error de seguimiento)
    const hasError = syncErrored && !isComplete;
    const isCredentialError = hasError && credentialsStatus.lastError?.code === "CREDENTIAL_INVALID";
    // Error con credenciales válidas → error de seguimiento o transitorio (ej. DocumentNotFoundError)
    const isTrackingError = hasError && !isCredentialError && credentialsStatus.isValid;

    return (
      <>
        {unlinkDialog}
        <Card variant="outlined" sx={{ borderColor: isComplete ? theme.palette.success.light : isCredentialError ? theme.palette.error.light : theme.palette.warning.light }}>
          <CardContent>
            <Stack spacing={2}>
              <Stack direction="row" alignItems="center" justifyContent="space-between">
                <Stack direction="row" alignItems="center" spacing={1}>
                  {isComplete ? (
                    <TickCircle size={24} color={theme.palette.success.main} variant="Bold" />
                  ) : isCredentialError ? (
                    <CloseCircle size={24} color={theme.palette.error.main} variant="Bold" />
                  ) : hasError ? (
                    <CloseCircle size={24} color={theme.palette.warning.main} variant="Bold" />
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

              {hasError && (
                <Alert
                  severity={isCredentialError ? "error" : "warning"}
                  action={
                    isCredentialError ? (
                      credentialsStatus.enabled ? (
                        <Button color="inherit" size="small" onClick={handleResync}>
                          Reintentar
                        </Button>
                      ) : undefined
                    ) : (
                      <Button color="inherit" size="small" onClick={() => loadCredentialsStatus()}>
                        Verificar
                      </Button>
                    )
                  }
                >
                  {isCredentialError
                    ? (!credentialsStatus.enabled
                        ? "Cuenta desactivada: la contraseña del PJN falló en múltiples intentos. Actualizá tu contraseña y volvé a intentar."
                        : "Contraseña del PJN incorrecta o expirada. Verificá tus credenciales en el portal del Poder Judicial.")
                    : "Ocurrió un error durante la sincronización. Tus credenciales son válidas — podés reintentar la sincronización o verificar el estado actual."}
                  {isCredentialError && credentialsStatus.consecutiveErrors > 1 && credentialsStatus.enabled && (
                    <Typography variant="caption" display="block" sx={{ mt: 0.5, opacity: 0.8 }}>
                      Intentos fallidos: {credentialsStatus.consecutiveErrors} / 5
                    </Typography>
                  )}
                </Alert>
              )}

              {isTrackingError && (
                <Button
                  variant="outlined"
                  size="small"
                  color="warning"
                  startIcon={<Refresh2 size={16} />}
                  onClick={handleResync}
                  disabled={!credentialsStatus.enabled}
                >
                  Reintentar sincronización
                </Button>
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

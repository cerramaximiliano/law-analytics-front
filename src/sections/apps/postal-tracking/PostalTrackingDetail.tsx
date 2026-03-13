import React, { useState, useEffect, useRef } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  IconButton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { DocumentUpload, Trash } from "iconsax-react";
import { PopupTransition } from "components/@extended/Transitions";
import { PostalTrackingType } from "types/postal-tracking";
import { dispatch } from "store";
import { uploadAttachment, deleteAttachment, getPostalTrackingById } from "store/reducers/postalTracking";

const CORREO_LOGO = "https://res.cloudinary.com/dqyoeolib/image/upload/v1773403406/logo-correo_lxrcmr.png";

const STATUS_COLORS: Record<string, "default" | "warning" | "info" | "success" | "error"> = {
  pending: "warning",
  active: "info",
  completed: "success",
  paused: "default",
  error: "error",
};

const STATUS_LABELS: Record<string, string> = {
  pending: "Pendiente",
  active: "Activo",
  completed: "Completado",
  paused: "Pausado",
  error: "Error",
};

function formatDate(date?: string | null) {
  if (!date) return "—";
  return new Intl.DateTimeFormat("es-AR", {
    day: "2-digit",
    month: "2-digit",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  }).format(new Date(date));
}

interface Props {
  open: boolean;
  tracking: PostalTrackingType | null;
  loading: boolean;
  handleClose: () => void;
}

const PostalTrackingDetail = ({ open, tracking, loading, handleClose }: Props) => {
  const theme = useTheme();
  const [tab, setTab] = useState(0);
  const [attachmentBusy, setAttachmentBusy] = useState(false);
  const attachmentInputRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setTab(0);
  }, [tracking?._id]);

  const handleReplaceAttachment = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !tracking) return;
    setAttachmentBusy(true);
    await dispatch(uploadAttachment(tracking._id, file));
    await dispatch(getPostalTrackingById(tracking._id));
    setAttachmentBusy(false);
  };

  const handleDeleteAttachment = async () => {
    if (!tracking) return;
    setAttachmentBusy(true);
    await dispatch(deleteAttachment(tracking._id));
    await dispatch(getPostalTrackingById(tracking._id));
    setAttachmentBusy(false);
  };

  const screenshotEnabled = Boolean(tracking?.screenshotEnabled);
  const hasScreenshot = Boolean(tracking?.screenshotUrl);
  const hasAttachment = Boolean(tracking?.attachmentUrl);
  const history = tracking?.history ?? [];

  // Índices fijos — ambos tabs siempre presentes
  const TAB_HISTORY = 0;
  const TAB_SCREENSHOT = 1;
  const TAB_ATTACHMENT = 2;

  return (
    <Dialog
      open={open}
      onClose={handleClose}
      keepMounted
      TransitionComponent={PopupTransition}
      maxWidth="md"
      fullWidth
      PaperProps={{
        elevation: 5,
        sx: { borderRadius: 2, overflow: "hidden" },
      }}
    >
      <DialogTitle sx={{ bgcolor: theme.palette.primary.lighter, p: 3, borderBottom: `1px solid ${theme.palette.divider}` }}>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography variant="h5" color="primary" fontWeight={600}>
              {tracking ? `${tracking.codeId} ${tracking.numberId}` : "Detalle del seguimiento"}
            </Typography>
            {tracking?.label && (
              <Typography variant="body2" color="textSecondary">
                {tracking.label}
              </Typography>
            )}
          </Stack>
          <Box sx={{ bgcolor: "#FFCE00", borderRadius: 1, px: 1, py: 0.5, display: "flex", alignItems: "center" }}>
            <Box component="img" src={CORREO_LOGO} alt="Correo Argentino" sx={{ height: 28, width: "auto" }} />
          </Box>
        </Stack>

        {tracking && (
          <Stack direction="row" spacing={1} mt={1.5} flexWrap="wrap">
            <Chip
              size="small"
              label={STATUS_LABELS[tracking.processingStatus] ?? tracking.processingStatus}
              color={STATUS_COLORS[tracking.processingStatus] ?? "default"}
              sx={tracking.processingStatus === "pending" ? { color: "text.primary", fontWeight: 500 } : undefined}
            />
            <Chip size="small" label={tracking.trackingStatus || "Sin estado"} variant="outlined" />
            <Chip size="small" label={tracking.deliveryStatus || "Sin estado de entrega"} variant="outlined" color="info" />
          </Stack>
        )}
      </DialogTitle>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ px: 3, borderBottom: `1px solid ${theme.palette.divider}` }}
      >
        <Tab value={TAB_HISTORY} label={`Historial (${history.length})`} />
        <Tab value={TAB_SCREENSHOT} label="Captura de pantalla" disabled={!screenshotEnabled} />
        <Tab value={TAB_ATTACHMENT} label="Adjunto" />
      </Tabs>

      <DialogContent sx={{ p: 0, height: 480, overflow: "hidden", display: "flex", flexDirection: "column" }}>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ flex: 1 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <>
            {/* Tab Historial */}
            {tab === TAB_HISTORY && (
              <Stack sx={{ flex: 1, overflow: "hidden" }}>
                <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
                  {history.length === 0 ? (
                    <Typography color="textSecondary" align="center" sx={{ py: 4 }}>
                      Sin eventos registrados todavía
                    </Typography>
                  ) : (
                    <TableContainer>
                      <Table size="small">
                        <TableHead>
                          <TableRow>
                            <TableCell>Fecha</TableCell>
                            <TableCell>Estado</TableCell>
                            <TableCell>Estado de entrega</TableCell>
                            <TableCell>Ubicación</TableCell>
                          </TableRow>
                        </TableHead>
                        <TableBody>
                          {[...history].reverse().map((event, idx) => (
                            <TableRow key={idx} hover>
                              <TableCell sx={{ whiteSpace: "nowrap" }}>
                                {formatDate(event.eventDate)}
                              </TableCell>
                              <TableCell>
                                <Typography variant="body2" fontWeight={500}>
                                  {event.status}
                                </Typography>
                              </TableCell>
                              <TableCell>{event.deliveryStatus || "—"}</TableCell>
                              <TableCell>{event.location || "—"}</TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </TableContainer>
                  )}
                </Box>
                {tracking && (
                  <Box sx={{ flexShrink: 0, px: 2, pb: 2, borderTop: `1px solid ${theme.palette.divider}`, pt: 1.5 }}>
                    <Stack direction="row" spacing={4} flexWrap="wrap">
                      <Stack spacing={0.25}>
                        <Typography variant="caption" color="textSecondary">Creado</Typography>
                        <Typography variant="body2">{formatDate(tracking.createdAt)}</Typography>
                      </Stack>
                      <Stack spacing={0.25}>
                        <Typography variant="caption" color="textSecondary">Último chequeo</Typography>
                        <Typography variant="body2">{formatDate(tracking.lastCheckedAt)}</Typography>
                      </Stack>
                      <Stack spacing={0.25}>
                        <Typography variant="caption" color="textSecondary">Último cambio</Typography>
                        <Typography variant="body2">{formatDate(tracking.lastChangedAt)}</Typography>
                      </Stack>
                      <Stack spacing={0.25}>
                        <Typography variant="caption" color="textSecondary">Chequeos realizados</Typography>
                        <Typography variant="body2">{tracking.checkCount}</Typography>
                      </Stack>
                    </Stack>
                  </Box>
                )}
              </Stack>
            )}

            {/* Tab Captura */}
            {tab === TAB_SCREENSHOT && screenshotEnabled && (
              <Stack sx={{ flex: 1, overflow: "hidden" }}>
                <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
                  {hasScreenshot ? (
                    <Box
                      component="img"
                      src={tracking!.screenshotUrl!}
                      alt="Captura del seguimiento postal"
                      sx={{ width: "100%", height: "auto", display: "block", borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}
                    />
                  ) : (
                    <Stack alignItems="center" justifyContent="center" sx={{ height: "100%", py: 4 }}>
                      <Typography color="textSecondary" align="center">
                        La captura aún no está disponible. El worker la generará en el próximo chequeo.
                      </Typography>
                    </Stack>
                  )}
                </Box>
                {hasScreenshot && (
                  <Box sx={{ flexShrink: 0, px: 2, py: 1.25, borderTop: `1px solid ${theme.palette.divider}` }}>
                    <Typography variant="caption" color="textSecondary">
                      Captura generada el {formatDate(tracking?.screenshotUpdatedAt)}. El enlace expira en 15 minutos.
                    </Typography>
                  </Box>
                )}
              </Stack>
            )}

            {/* Tab Adjunto — siempre visible */}
            {tab === TAB_ATTACHMENT && (
              <Stack sx={{ flex: 1, overflow: "hidden" }}>
                <input
                  ref={attachmentInputRef}
                  type="file"
                  accept="image/jpeg,image/png,image/webp,application/pdf"
                  style={{ display: "none" }}
                  onChange={handleReplaceAttachment}
                />
                <Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
                  {attachmentBusy ? (
                    <Stack alignItems="center" justifyContent="center" sx={{ height: "100%", py: 4 }}>
                      <CircularProgress size={28} />
                    </Stack>
                  ) : !hasAttachment ? (
                    <Stack alignItems="center" justifyContent="center" spacing={1.5} sx={{ height: "100%", py: 4 }}>
                      <Typography color="textSecondary" align="center">
                        No hay ningún archivo adjunto para este envío.
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        startIcon={<DocumentUpload size={16} />}
                        onClick={() => attachmentInputRef.current?.click()}
                      >
                        Adjuntar imagen o PDF
                      </Button>
                    </Stack>
                  ) : tracking.attachmentKey?.toLowerCase().endsWith(".pdf") ? (
                    <Stack spacing={1.5} alignItems="flex-start">
                      <Typography variant="body2" color="textSecondary">
                        El adjunto es un archivo PDF.
                      </Typography>
                      <Button
                        variant="outlined"
                        size="small"
                        href={tracking.attachmentUrl!}
                        target="_blank"
                        rel="noopener noreferrer"
                      >
                        Abrir PDF
                      </Button>
                    </Stack>
                  ) : (
                    <Box
                      component="img"
                      src={tracking.attachmentUrl!}
                      alt="Adjunto del envío"
                      sx={{ width: "100%", height: "auto", display: "block", borderRadius: 1, border: `1px solid ${theme.palette.divider}` }}
                    />
                  )}
                </Box>
                {hasAttachment && (
                  <Box sx={{ flexShrink: 0, px: 2, py: 1.25, borderTop: `1px solid ${theme.palette.divider}`, display: "flex", alignItems: "center", justifyContent: "space-between" }}>
                    <Typography variant="caption" color="textSecondary">
                      Cargado el {formatDate(tracking.attachmentUpdatedAt)}. Expira en 15 min.
                    </Typography>
                    <Stack direction="row" spacing={0.5}>
                      <Tooltip title="Reemplazar adjunto">
                        <IconButton size="small" disabled={attachmentBusy} onClick={() => attachmentInputRef.current?.click()}>
                          <DocumentUpload size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Eliminar adjunto">
                        <IconButton size="small" color="error" disabled={attachmentBusy} onClick={handleDeleteAttachment}>
                          <Trash size={16} />
                        </IconButton>
                      </Tooltip>
                    </Stack>
                  </Box>
                )}
              </Stack>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PostalTrackingDetail;

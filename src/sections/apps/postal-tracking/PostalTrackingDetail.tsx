import React, { useState } from "react";
import {
  Box,
  Chip,
  CircularProgress,
  Dialog,
  DialogContent,
  DialogTitle,
  Divider,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  Typography,
  useTheme,
} from "@mui/material";
import { PopupTransition } from "components/@extended/Transitions";
import { PostalTrackingType } from "types/postal-tracking";

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

  const hasScreenshot = Boolean(tracking?.screenshotUrl);
  const history = tracking?.history ?? [];

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
            {tracking.isFinalStatus && (
              <Chip size="small" label="Estado final" color="success" variant="outlined" />
            )}
            {tracking.trackingStatus && (
              <Chip size="small" label={tracking.trackingStatus} variant="outlined" />
            )}
          </Stack>
        )}
      </DialogTitle>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ px: 3, borderBottom: `1px solid ${theme.palette.divider}` }}
      >
        <Tab label={`Historial (${history.length})`} />
        {hasScreenshot && <Tab label="Captura de pantalla" />}
      </Tabs>

      <DialogContent sx={{ p: 0, minHeight: 300 }}>
        {loading ? (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 8 }}>
            <CircularProgress />
          </Stack>
        ) : (
          <>
            {/* Tab Historial */}
            {tab === 0 && (
              <Box sx={{ p: 2 }}>
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
                          <TableCell>Descripción</TableCell>
                          <TableCell>Ubicación</TableCell>
                        </TableRow>
                      </TableHead>
                      <TableBody>
                        {[...history].reverse().map((event, idx) => (
                          <TableRow key={idx} hover>
                            <TableCell sx={{ whiteSpace: "nowrap" }}>
                              {formatDate(event.date)}
                            </TableCell>
                            <TableCell>
                              <Typography variant="body2" fontWeight={500}>
                                {event.status}
                              </Typography>
                            </TableCell>
                            <TableCell>{event.description || "—"}</TableCell>
                            <TableCell>{event.location || "—"}</TableCell>
                          </TableRow>
                        ))}
                      </TableBody>
                    </Table>
                  </TableContainer>
                )}

                {tracking && (
                  <Box sx={{ mt: 2, px: 1 }}>
                    <Divider sx={{ mb: 1.5 }} />
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
              </Box>
            )}

            {/* Tab Captura */}
            {tab === 1 && hasScreenshot && (
              <Box sx={{ p: 2 }}>
                <Box
                  sx={{
                    overflow: "auto",
                    maxHeight: 520,
                    borderRadius: 1,
                    border: `1px solid ${theme.palette.divider}`,
                  }}
                >
                  <Box
                    component="img"
                    src={tracking!.screenshotUrl!}
                    alt="Captura del seguimiento postal"
                    sx={{ width: "100%", height: "auto", display: "block" }}
                  />
                </Box>
                <Typography variant="caption" color="textSecondary" sx={{ mt: 1, display: "block" }}>
                  Captura generada el {formatDate(tracking?.screenshotUpdatedAt)}. El enlace expira en 15 minutos.
                </Typography>
              </Box>
            )}
          </>
        )}
      </DialogContent>
    </Dialog>
  );
};

export default PostalTrackingDetail;

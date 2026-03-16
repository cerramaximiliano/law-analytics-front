import React, { useEffect, useState, useCallback, useRef } from "react";
import {
  Box,
  Button,
  Checkbox,
  Chip,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  TableSortLabel,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { Add, Box as BoxIcon, DocumentUpload, Edit2, Eye, Link1, Refresh2, SearchNormal1, TickCircle, Trash } from "iconsax-react";

import MainCard from "components/MainCard";
import { dispatch, useSelector } from "store";
import {
  fetchPostalTrackings,
  deletePostalTracking,
  bulkDeletePostalTrackings,
  getPostalTrackingById,
  clearPostalTrackingDetail,
  uploadAttachment,
  markPostalTrackingAsCompleted,
  reactivatePostalTracking,
} from "store/reducers/postalTracking";
import { openSnackbar } from "store/reducers/snackbar";
import { PostalTrackingType } from "types/postal-tracking";

import AlertPostalTrackingDelete from "sections/apps/postal-tracking/AlertPostalTrackingDelete";
import PostalTrackingModal from "sections/apps/postal-tracking/PostalTrackingModal";
import PostalTrackingDetail from "sections/apps/postal-tracking/PostalTrackingDetail";
import LinkPostalTrackingToFolder from "sections/apps/postal-tracking/LinkPostalTrackingToFolder";

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
  not_found: "No encontrado",
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

// ── Empty state ────────────────────────────────────────────────────────────────

const EmptyState = ({ onAdd }: { onAdd: () => void }) => {
  const theme = useTheme();
  return (
    <Stack alignItems="center" justifyContent="center" spacing={2.5} sx={{ py: 8 }}>
      <Box sx={{ p: 2.5, bgcolor: "primary.lighter", borderRadius: "50%" }}>
        <BoxIcon size={40} variant="Bulk" style={{ color: theme.palette.primary.main }} />
      </Box>
      <Stack alignItems="center" spacing={1}>
        <Typography variant="h5" color="textSecondary">
          Todavía no tenés seguimientos
        </Typography>
        <Typography variant="body2" color="textSecondary" align="center" sx={{ maxWidth: 380 }}>
          Agregá el código y número de tu envío postal para hacer el seguimiento automático.
          Te avisaremos cada vez que cambie el estado.
        </Typography>
      </Stack>
      <Button variant="contained" startIcon={<Add />} onClick={onAdd}>
        Crear primer seguimiento
      </Button>
    </Stack>
  );
};

// ── Página principal ───────────────────────────────────────────────────────────

const PostalTrackingPage = () => {
  const theme = useTheme();
  const { trackings, isLoader, total } = useSelector((state: any) => state.postalTrackingReducer);
  const { tracking: trackingDetail } = useSelector((state: any) => state.postalTrackingReducer);

  // Paginación y filtros
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");
  const [sortBy, setSortBy] = useState<"label" | "createdAt">("createdAt");
  const [sortOrder, setSortOrder] = useState<"asc" | "desc">("desc");

  // Modales
  const [openCreate, setOpenCreate] = useState(false);
  const [trackingToEdit, setTrackingToEdit] = useState<PostalTrackingType | undefined>(undefined);
  const [trackingToDelete, setTrackingToDelete] = useState<PostalTrackingType | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);
  const [linkTracking, setLinkTracking] = useState<PostalTrackingType | null>(null);

  // Selección múltiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());

  // Adjunto
  const attachmentInputRef = useRef<HTMLInputElement>(null);
  const [attachmentTargetId, setAttachmentTargetId] = useState<string | null>(null);

  const loadData = useCallback(() => {
    setSelectedIds(new Set());
    dispatch(
      fetchPostalTrackings({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
        sortBy,
        sortOrder,
      })
    );
  }, [page, rowsPerPage, search, sortBy, sortOrder]);

  const handleLabelSort = () => {
    if (sortBy === "label") {
      setSortOrder((prev) => (prev === "asc" ? "desc" : "asc"));
    } else {
      setSortBy("label");
      setSortOrder("asc");
      setPage(0);
    }
  };

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Búsqueda con debounce
  useEffect(() => {
    const timer = setTimeout(() => {
      setSearch(searchInput);
      setPage(0);
    }, 400);
    return () => clearTimeout(timer);
  }, [searchInput]);

  const showSnackbar = (message: string, severity: "success" | "error") => {
    dispatch(
      openSnackbar({
        open: true,
        message,
        variant: "alert",
        alert: { color: severity },
        close: true,
      })
    );
  };

  const handleViewDetail = async (id: string) => {
    setDetailOpen(true);
    setDetailLoading(true);
    await dispatch(getPostalTrackingById(id));
    setDetailLoading(false);
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    dispatch(clearPostalTrackingDetail());
  };

  const handleOpenEdit = (tracking: PostalTrackingType) => {
    setTrackingToEdit(tracking);
    setOpenCreate(true);
  };

  const handleCloseModal = () => {
    setOpenCreate(false);
    setTrackingToEdit(undefined);
    loadData();
  };

  const handleDeleteConfirm = async (confirmed: boolean) => {
    if (confirmed && trackingToDelete) {
      const result = await dispatch(deletePostalTracking(trackingToDelete._id));
      if (result.success) {
        showSnackbar("Seguimiento eliminado", "success");
        loadData();
      } else {
        showSnackbar(result.error || "Error al eliminar", "error");
      }
    }
    setTrackingToDelete(null);
  };

  const handleCloseLinkModal = () => {
    setLinkTracking(null);
    loadData();
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allCurrentSelected = trackings.length > 0 && trackings.every((t: PostalTrackingType) => selectedIds.has(t._id));
  const someCurrentSelected = trackings.some((t: PostalTrackingType) => selectedIds.has(t._id));

  const handleToggleAll = () => {
    if (allCurrentSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(trackings.map((t: PostalTrackingType) => t._id)));
    }
  };

  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const handleBulkDeleteConfirm = async (confirmed: boolean) => {
    setBulkDeleteOpen(false);
    if (!confirmed) return;
    const ids = Array.from(selectedIds);
    const result = await dispatch(bulkDeletePostalTrackings(ids));
    if (result.success) {
      showSnackbar(`${result.deleted} seguimiento${result.deleted !== 1 ? "s" : ""} eliminado${result.deleted !== 1 ? "s" : ""}`, "success");
      setSelectedIds(new Set());
      loadData();
    } else {
      showSnackbar(result.error || "Error al eliminar", "error");
    }
  };

  const handleReactivate = async (id: string) => {
    const result = await dispatch(reactivatePostalTracking(id));
    if (result.success) {
      showSnackbar("Seguimiento reactivado", "success");
    } else {
      showSnackbar(result.error || "Error al reactivar el seguimiento", "error");
    }
  };

  const handleMarkAsCompleted = async (id: string) => {
    const result = await dispatch(markPostalTrackingAsCompleted(id));
    if (result.success) {
      showSnackbar("Seguimiento marcado como completado", "success");
    } else {
      showSnackbar(result.error || "Error al completar el seguimiento", "error");
    }
  };

  const handleAttachmentClick = (id: string) => {
    setAttachmentTargetId(id);
    attachmentInputRef.current?.click();
  };

  const handleAttachmentChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    e.target.value = "";
    if (!file || !attachmentTargetId) return;
    const result = await dispatch(uploadAttachment(attachmentTargetId, file));
    setAttachmentTargetId(null);
    if (result.success) {
      showSnackbar("Adjunto guardado exitosamente", "success");
    } else {
      showSnackbar(result.error || "Error al subir el adjunto", "error");
    }
  };

  return (
    <MainCard
      title={
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h5">Seguimiento de envíos</Typography>
          <Box
            sx={{
              bgcolor: "#FFCE00",
              borderRadius: 1,
              px: 1,
              py: 0.5,
              display: "flex",
              alignItems: "center",
            }}
          >
            <Box component="img" src={CORREO_LOGO} alt="Correo Argentino" sx={{ height: 24, width: "auto" }} />
          </Box>
        </Stack>
      }
      secondary={
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenCreate(true)} size="small">
          Nuevo seguimiento
        </Button>
      }
    >
      {/* Barra de búsqueda — solo si hay datos o se está buscando */}
      {(trackings.length > 0 || search) && (
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Buscar por número, etiqueta o estado..."
            value={searchInput}
            onChange={(e) => setSearchInput(e.target.value)}
            sx={{ width: 340 }}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchNormal1 size={16} color={theme.palette.text.secondary} />
                </InputAdornment>
              ),
            }}
          />
        </Stack>
      )}

      {/* Tabla */}
      {isLoader ? (
        <>
          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Skeleton variant="rounded" width={18} height={18} />
                  </TableCell>
                  <TableCell sx={{ width: 60 }}><Skeleton variant="rounded" width={50} height={24} /></TableCell>
                  <TableCell><Skeleton variant="rounded" width={120} height={24} /></TableCell>
                  <TableCell><Skeleton variant="rounded" width={100} height={24} /></TableCell>
                  <TableCell><Skeleton variant="rounded" width={100} height={24} /></TableCell>
                  <TableCell><Skeleton variant="rounded" width={150} height={24} /></TableCell>
                  <TableCell><Skeleton variant="rounded" width={110} height={24} /></TableCell>
                  <TableCell align="center"><Skeleton variant="rounded" width={80} height={24} sx={{ mx: "auto" }} /></TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {Array(Math.min(rowsPerPage, 10)).fill(0).map((_, i) => (
                  <TableRow key={i} sx={{ height: 53 }}>
                    <TableCell padding="checkbox">
                      <Skeleton variant="rounded" width={18} height={18} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rounded" width={44} height={28} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rounded" width={130} height={20} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rounded" width={90} height={20} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rounded" width={72} height={22} sx={{ borderRadius: 4 }} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rounded" width={150} height={20} />
                    </TableCell>
                    <TableCell>
                      <Skeleton variant="rounded" width={110} height={20} />
                    </TableCell>
                    <TableCell align="center">
                      <Stack direction="row" spacing={0.5} justifyContent="center">
                        {Array(5).fill(0).map((_, j) => (
                          <Skeleton key={j} variant="circular" width={28} height={28} />
                        ))}
                      </Stack>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          </TableContainer>
          <Grid container alignItems="center" justifyContent="space-between" sx={{ px: 1, pt: 2 }}>
            <Grid item>
              <Stack direction="row" spacing={1} alignItems="center">
                <Skeleton variant="rounded" width={110} height={32} />
                <Skeleton variant="rounded" width={60} height={32} />
                <Skeleton variant="rounded" width={40} height={32} />
                <Skeleton variant="rounded" width={52} height={32} />
              </Stack>
            </Grid>
            <Grid item>
              <Skeleton variant="rounded" width={300} height={32} />
            </Grid>
          </Grid>
        </>
      ) : trackings.length === 0 && !search ? (
        <EmptyState onAdd={() => setOpenCreate(true)} />
      ) : (
        <>
          {selectedIds.size > 0 && (
            <Stack direction="row" alignItems="center" spacing={1.5} sx={{ mb: 1.5, px: 0.5 }}>
              <Typography variant="body2" color="textSecondary">
                {selectedIds.size} seleccionado{selectedIds.size !== 1 ? "s" : ""}
              </Typography>
              <Button
                size="small"
                variant="contained"
                color="error"
                startIcon={<Trash size={15} />}
                onClick={() => setBulkDeleteOpen(true)}
              >
                Eliminar seleccionados
              </Button>
              <Button size="small" color="secondary" onClick={() => setSelectedIds(new Set())}>
                Cancelar selección
              </Button>
            </Stack>
          )}

          <TableContainer>
            <Table size="small">
              <TableHead>
                <TableRow>
                  <TableCell padding="checkbox">
                    <Checkbox
                      size="small"
                      checked={allCurrentSelected}
                      indeterminate={!allCurrentSelected && someCurrentSelected}
                      onChange={handleToggleAll}
                    />
                  </TableCell>
                  <TableCell sx={{ width: 60 }}>Proveedor</TableCell>
                  <TableCell>Código / Número</TableCell>
                  <TableCell sortDirection={sortBy === "label" ? sortOrder : false}>
                    <TableSortLabel
                      active={sortBy === "label"}
                      direction={sortBy === "label" ? sortOrder : "asc"}
                      onClick={handleLabelSort}
                    >
                      Etiqueta
                    </TableSortLabel>
                  </TableCell>
                  <TableCell>Estado proceso</TableCell>
                  <TableCell>Estado envío / Entrega</TableCell>
                  <TableCell>Último chequeo</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {trackings.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={8} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">Sin resultados para la búsqueda</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  trackings.map((row: PostalTrackingType) => (
                    <TableRow key={row._id} hover selected={selectedIds.has(row._id)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={selectedIds.has(row._id)}
                          onChange={() => handleToggleSelect(row._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Box
                          sx={{
                            bgcolor: "#FFCE00",
                            borderRadius: 1,
                            px: 0.75,
                            py: 0.5,
                            display: "inline-flex",
                            alignItems: "center",
                          }}
                        >
                          <Box
                            component="img"
                            src={CORREO_LOGO}
                            alt="Correo Argentino"
                            sx={{ height: 20, width: "auto" }}
                          />
                        </Box>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" fontFamily="monospace" fontWeight={600}>
                          {row.codeId} {row.numberId}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Typography
                          variant="body2"
                          color={row.label ? "textPrimary" : "textSecondary"}
                        >
                          {row.label || "—"}
                        </Typography>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={STATUS_LABELS[row.processingStatus] ?? row.processingStatus}
                          color={STATUS_COLORS[row.processingStatus] ?? "default"}
                          sx={row.processingStatus === "pending" ? { color: "text.primary", fontWeight: 500 } : undefined}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack spacing={0.25}>
                          <Typography
                            variant="body2"
                            color={row.trackingStatus ? "textPrimary" : "textSecondary"}
                            sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          >
                            {row.trackingStatus || "—"}
                          </Typography>
                          <Typography
                            variant="caption"
                            color={row.deliveryStatus ? "textSecondary" : "text.disabled"}
                            sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          >
                            {row.deliveryStatus || "—"}
                          </Typography>
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {formatDate(row.lastCheckedAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">

                          {/* Ver detalle — siempre habilitado */}
                          <Tooltip title="Ver detalle">
                            <IconButton size="small" onClick={() => handleViewDetail(row._id)} color="primary">
                              <Eye size={16} />
                            </IconButton>
                          </Tooltip>

                          {/* Editar — siempre habilitado */}
                          <Tooltip title="Editar">
                            <IconButton size="small" onClick={() => handleOpenEdit(row)} color="info">
                              <Edit2 size={16} />
                            </IconButton>
                          </Tooltip>

                          {/* Vincular a causa — deshabilitado si not_found sin carpeta previa */}
                          {row.processingStatus === "not_found" && !row.folderId ? (
                            <Tooltip title="No se puede vincular una causa a un seguimiento no encontrado">
                              <span style={{ display: "inline-flex" }}>
                                <IconButton size="small" disabled>
                                  <Link1 size={16} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : (
                            <Tooltip title={row.folderId ? "Cambiar causa vinculada" : "Vincular a causa"}>
                              <IconButton size="small" onClick={() => setLinkTracking(row)} color={row.folderId ? "success" : "default"}>
                                <Link1 size={16} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Adjuntar — deshabilitado si not_found */}
                          {row.processingStatus === "not_found" ? (
                            <Tooltip title="No se puede adjuntar archivos a un seguimiento no encontrado">
                              <span style={{ display: "inline-flex" }}>
                                <IconButton size="small" disabled>
                                  <DocumentUpload size={16} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          ) : (
                            <Tooltip title={row.attachmentKey ? "Reemplazar adjunto" : "Adjuntar imagen o PDF"}>
                              <IconButton size="small" onClick={() => handleAttachmentClick(row._id)} color={row.attachmentKey ? "success" : "default"}>
                                <DocumentUpload size={16} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Marcar como completado — solo para estados en curso */}
                          {["pending", "active", "paused", "error"].includes(row.processingStatus) && (
                            <Tooltip title="Marcar como completado">
                              <IconButton size="small" onClick={() => handleMarkAsCompleted(row._id)} color="success">
                                <TickCircle size={16} />
                              </IconButton>
                            </Tooltip>
                          )}

                          {/* Reactivar — visible en todos los estados terminales, deshabilitado cuando no aplica */}
                          {["completed", "not_found", "error", "paused"].includes(row.processingStatus) && (() => {
                            const canReactivate =
                              row.processingStatus === "paused" ||
                              row.processingStatus === "error" ||
                              (row.processingStatus === "completed" && (row.manuallyCompleted || row.autoCompletedReason === "code_reuse_detected"));
                            const reactivateTooltip = row.processingStatus === "not_found"
                              ? "No se puede reactivar un seguimiento no encontrado por el sitio"
                              : "No se puede reactivar un seguimiento con estado final determinado por el sistema";
                            return canReactivate ? (
                              <Tooltip title="Reactivar seguimiento">
                                <IconButton size="small" onClick={() => handleReactivate(row._id)} color="warning">
                                  <Refresh2 size={16} />
                                </IconButton>
                              </Tooltip>
                            ) : (
                              <Tooltip title={reactivateTooltip}>
                                <span style={{ display: "inline-flex" }}>
                                  <IconButton size="small" disabled>
                                    <Refresh2 size={16} />
                                  </IconButton>
                                </span>
                              </Tooltip>
                            );
                          })()}

                          {/* Eliminar — siempre habilitado */}
                          <Tooltip title="Eliminar">
                            <IconButton size="small" onClick={() => setTrackingToDelete(row)} color="error">
                              <Trash size={16} />
                            </IconButton>
                          </Tooltip>

                        </Stack>
                      </TableCell>
                    </TableRow>
                  ))
                )}
              </TableBody>
            </Table>
          </TableContainer>

          <Grid container alignItems="center" justifyContent="space-between" sx={{ px: 1, pt: 2 }}>
            <Grid item>
              <Stack direction="row" spacing={1} alignItems="center">
                <Typography variant="caption" color="secondary">Filas por Páginas</Typography>
                <FormControl>
                  <Select
                    value={rowsPerPage}
                    onChange={(e) => { setRowsPerPage(Number(e.target.value)); setPage(0); }}
                    size="small"
                    sx={{ "& .MuiSelect-select": { py: 0.75, px: 1.25 } }}
                  >
                    {[10, 25, 50, 100].map((opt) => (
                      <MenuItem key={opt} value={opt}>{opt}</MenuItem>
                    ))}
                  </Select>
                </FormControl>
                <Typography variant="caption" color="secondary">Ir a</Typography>
                <TextField
                  size="small"
                  type="number"
                  value={page + 1}
                  onChange={(e) => {
                    const p = Math.max(1, Math.min(Number(e.target.value), Math.ceil(total / rowsPerPage)));
                    setPage(p - 1);
                  }}
                  sx={{ "& .MuiOutlinedInput-input": { py: 0.75, px: 1.25, width: 36 } }}
                />
              </Stack>
            </Grid>
            <Grid item sx={{ mt: { xs: 2, sm: 0 } }}>
              <Pagination
                count={Math.ceil(total / rowsPerPage)}
                page={page + 1}
                onChange={(_, value) => setPage(value - 1)}
                color="primary"
                variant="combined"
                showFirstButton
                showLastButton
              />
            </Grid>
          </Grid>
        </>
      )}

      {/* Input oculto para adjuntos */}
      <input
        ref={attachmentInputRef}
        type="file"
        accept="image/jpeg,image/png,image/webp,application/pdf"
        style={{ display: "none" }}
        onChange={handleAttachmentChange}
      />

      {/* Modales */}
      <PostalTrackingModal
        open={openCreate}
        handleClose={handleCloseModal}
        tracking={trackingToEdit}
        showSnackbar={showSnackbar}
      />

      <PostalTrackingDetail
        open={detailOpen}
        tracking={trackingDetail}
        loading={detailLoading}
        handleClose={handleCloseDetail}
      />

      {linkTracking && (
        <LinkPostalTrackingToFolder
          open={Boolean(linkTracking)}
          onClose={handleCloseLinkModal}
          trackingId={linkTracking._id}
          currentFolderId={linkTracking.folderId}
        />
      )}

      {trackingToDelete && (
        <AlertPostalTrackingDelete
          numberId={`${trackingToDelete.codeId} ${trackingToDelete.numberId}`}
          open={Boolean(trackingToDelete)}
          handleClose={handleDeleteConfirm}
        />
      )}

      <AlertPostalTrackingDelete
        numberId={`${selectedIds.size} seguimiento${selectedIds.size !== 1 ? "s" : ""} seleccionado${selectedIds.size !== 1 ? "s" : ""}`}
        open={bulkDeleteOpen}
        handleClose={handleBulkDeleteConfirm}
      />
    </MainCard>
  );
};

export default PostalTrackingPage;

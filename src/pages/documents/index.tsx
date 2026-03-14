import { useCallback, useEffect, useState } from "react";
import {
  Autocomplete,
  Box,
  Button,
  Checkbox,
  Chip,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  FormControl,
  Grid,
  IconButton,
  InputAdornment,
  MenuItem,
  Pagination,
  Select,
  Skeleton,
  Stack,
  Tab,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TableRow,
  Tabs,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { Add, DocumentDownload, DocumentText, Edit2, Eye, Routing, Trash } from "iconsax-react";
import { SearchNormal1 } from "iconsax-react";

import MainCard from "components/MainCard";
import { dispatch, useSelector } from "store";
import {
  fetchPostalDocuments,
  deletePostalDocument,
  getPostalDocumentById,
  clearPostalDocument,
  updatePostalDocument,
} from "store/reducers/postalDocuments";
import { openSnackbar } from "store/reducers/snackbar";
import {
  createPostalTracking,
  fetchPostalTrackings,
  updatePostalTracking,
} from "store/reducers/postalTracking";
import { PostalDocumentType } from "types/postal-document";
import { PostalTrackingType } from "types/postal-tracking";
import CreatePostalDocumentModal from "sections/apps/postal-documents/CreatePostalDocumentModal";
import AlertPostalTrackingDelete from "sections/apps/postal-tracking/AlertPostalTrackingDelete";

// ── Constantes ─────────────────────────────────────────────────────────────────

const VALID_CODE_IDS = [
  "CC", "CD", "CL", "CM", "CO", "CP", "DE", "DI", "EC", "EE", "EO", "EP",
  "GC", "GD", "GE", "GF", "GO", "GR", "GS", "HC", "HD", "HE", "HO", "HU",
  "HX", "IN", "IS", "JP", "LC", "LS", "ND", "MD", "ME", "MC", "MS", "MU",
  "MX", "OL", "PC", "PP", "RD", "RE", "RP", "RR", "SD", "SL", "SP", "SR",
  "ST", "TC", "TD", "TL", "UP",
];

// ── Helpers ────────────────────────────────────────────────────────────────────

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

const STATUS_COLORS: Record<string, "default" | "warning" | "success" | "info"> = {
  draft: "warning",
  generated: "success",
  sent: "info",
  archived: "default",
};

const STATUS_LABELS: Record<string, string> = {
  draft: "Borrador",
  generated: "Generado",
  sent: "Enviado",
  archived: "Archivado",
};

// ── Empty State ────────────────────────────────────────────────────────────────

const EmptyState = ({ onAdd }: { onAdd: () => void }) => {
  const theme = useTheme();
  return (
    <Stack alignItems="center" justifyContent="center" spacing={2.5} sx={{ py: 8 }}>
      <Box sx={{ p: 2.5, bgcolor: "primary.lighter", borderRadius: "50%" }}>
        <DocumentText size={40} variant="Bulk" style={{ color: theme.palette.primary.main }} />
      </Box>
      <Stack alignItems="center" spacing={1}>
        <Typography variant="h5" color="textSecondary">
          Todavía no tenés documentos
        </Typography>
        <Typography variant="body2" color="textSecondary" align="center" sx={{ maxWidth: 380 }}>
          Generá documentos PDF a partir de las plantillas disponibles para tus causas y comunicaciones.
        </Typography>
      </Stack>
      <Button variant="contained" startIcon={<Add />} onClick={onAdd}>
        Crear primer documento
      </Button>
    </Stack>
  );
};

// ── Skeleton de carga ──────────────────────────────────────────────────────────

const TableSkeleton = ({ rows }: { rows: number }) => (
  <>
    <TableContainer>
      <Table size="small">
        <TableHead>
          <TableRow>
            <TableCell padding="checkbox">
              <Skeleton variant="rounded" width={18} height={18} />
            </TableCell>
            <TableCell><Skeleton variant="rounded" width={120} height={24} /></TableCell>
            <TableCell><Skeleton variant="rounded" width={150} height={24} /></TableCell>
            <TableCell><Skeleton variant="rounded" width={80} height={24} /></TableCell>
            <TableCell><Skeleton variant="rounded" width={120} height={24} /></TableCell>
            <TableCell align="center"><Skeleton variant="rounded" width={80} height={24} sx={{ mx: "auto" }} /></TableCell>
          </TableRow>
        </TableHead>
        <TableBody>
          {Array(rows).fill(0).map((_, i) => (
            <TableRow key={i} sx={{ height: 53 }}>
              <TableCell padding="checkbox">
                <Skeleton variant="rounded" width={18} height={18} />
              </TableCell>
              <TableCell><Skeleton variant="rounded" width={130} height={20} /></TableCell>
              <TableCell><Skeleton variant="rounded" width={160} height={20} /></TableCell>
              <TableCell><Skeleton variant="rounded" width={72} height={22} sx={{ borderRadius: 4 }} /></TableCell>
              <TableCell><Skeleton variant="rounded" width={120} height={20} /></TableCell>
              <TableCell align="center">
                <Stack direction="row" spacing={0.5} justifyContent="center">
                  {Array(4).fill(0).map((_, j) => (
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
);

// ── Detalle del documento ──────────────────────────────────────────────────────

interface DocumentDetailDialogProps {
  open: boolean;
  document: PostalDocumentType | null;
  onClose: () => void;
}

const DocumentDetailDialog = ({ open, document, onClose }: DocumentDetailDialogProps) => {
  if (!document) return null;
  return (
    <Dialog open={open} onClose={onClose} maxWidth="lg" fullWidth>
      <DialogTitle>
        <Stack direction="row" alignItems="center" justifyContent="space-between">
          <Stack spacing={0.5}>
            <Typography variant="h5">{document.title}</Typography>
            <Stack direction="row" spacing={1} alignItems="center">
              <Chip size="small" label={document.templateName} variant="outlined" />
              <Chip
                size="small"
                label={STATUS_LABELS[document.status] ?? document.status}
                color={STATUS_COLORS[document.status] ?? "default"}
              />
              <Typography variant="caption" color="textSecondary">
                {formatDate(document.createdAt)}
              </Typography>
            </Stack>
          </Stack>
          {document.documentUrl && (
            <Button
              variant="contained"
              size="small"
              startIcon={<DocumentDownload size={16} />}
              onClick={() => window.open(document.documentUrl, "_blank")}
            >
              Descargar PDF
            </Button>
          )}
        </Stack>
      </DialogTitle>
      <DialogContent dividers>
        {document.documentUrl ? (
          <iframe
            src={document.documentUrl}
            title={document.title}
            style={{ width: "100%", height: 500, border: "none" }}
          />
        ) : (
          <Stack alignItems="center" justifyContent="center" sx={{ py: 6 }}>
            <Typography color="textSecondary">
              El PDF aún no ha sido generado o no está disponible.
            </Typography>
          </Stack>
        )}
      </DialogContent>
    </Dialog>
  );
};

// ── Modal de seguimiento (crear / vincular) ────────────────────────────────────

interface TrackingDialogProps {
  open: boolean;
  document: PostalDocumentType | null;
  onClose: () => void;
  onSuccess: () => void;
  showSnackbar: (msg: string, sev: "success" | "error") => void;
}

const TrackingDialog = ({ open, document, onClose, onSuccess, showSnackbar }: TrackingDialogProps) => {
  const trackings: PostalTrackingType[] = useSelector((state: any) => state.postalTracking?.trackings || []);

  const [tab, setTab] = useState(0);
  const [loadingTrackings, setLoadingTrackings] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  // Tab 0 — Crear nuevo
  const [codeId, setCodeId] = useState("TC");
  const [numberId, setNumberId] = useState("");
  const [label, setLabel] = useState("");

  // Tab 1 — Vincular existente
  const [selected, setSelected] = useState<PostalTrackingType | null>(null);

  useEffect(() => {
    if (!open || !document) return;
    setTab(0);
    setCodeId("TC");
    setNumberId("");
    setLabel(document.title || "");
    setSelected(null);
    setLoadingTrackings(true);
    dispatch(fetchPostalTrackings()).then(() => setLoadingTrackings(false));
  }, [open]); // eslint-disable-line react-hooks/exhaustive-deps

  const numberIdValid = /^\d{9}$/.test(numberId);

  const handleCreate = async () => {
    if (!document || !numberIdValid) return;
    setSubmitting(true);
    try {
      const result = await dispatch(
        createPostalTracking({
          codeId,
          numberId,
          label,
          documentId: document._id,
          ...(document.linkedFolderId ? { folderId: document.linkedFolderId } : {}),
        })
      );
      if (result?.success !== false) {
        if (result?.id) {
          await dispatch(updatePostalDocument(document._id, { linkedTrackingId: result.id }));
        }
        showSnackbar("Seguimiento creado y vinculado al documento", "success");
        onSuccess();
        onClose();
      } else {
        showSnackbar(result?.error || "Error al crear el seguimiento", "error");
      }
    } catch {
      showSnackbar("Error al crear el seguimiento", "error");
    }
    setSubmitting(false);
  };

  const handleLink = async () => {
    if (!document || !selected) return;
    setSubmitting(true);
    try {
      await Promise.all([
        dispatch(updatePostalTracking(selected._id, { documentId: document._id })),
        dispatch(updatePostalDocument(document._id, { linkedTrackingId: selected._id })),
      ]);
      showSnackbar("Documento vinculado al seguimiento exitosamente", "success");
      onSuccess();
      onClose();
    } catch {
      showSnackbar("Error al vincular el seguimiento", "error");
    }
    setSubmitting(false);
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
      <DialogTitle>
        <Stack spacing={0.5}>
          <Typography variant="h5">Seguimiento de envío</Typography>
          <Typography variant="body2" color="textSecondary">
            {document?.title}
          </Typography>
        </Stack>
      </DialogTitle>

      <Tabs
        value={tab}
        onChange={(_, v) => setTab(v)}
        sx={{ px: 3, borderBottom: 1, borderColor: "divider" }}
      >
        <Tab label="Crear nuevo seguimiento" />
        <Tab label="Vincular a uno existente" />
      </Tabs>

      <DialogContent sx={{ pt: 2.5 }}>
        {/* ── Tab 0: crear ── */}
        {tab === 0 && (
          <Stack spacing={2}>
            <Typography variant="body2" color="textSecondary">
              Ingresá el código de seguimiento del envío postal para registrarlo y vincularlo a este documento.
            </Typography>

            <Stack direction="row" spacing={1.5}>
              <FormControl size="small" sx={{ minWidth: 90 }}>
                <Select value={codeId} onChange={(e) => setCodeId(e.target.value)}>
                  {VALID_CODE_IDS.map((c) => (
                    <MenuItem key={c} value={c}>{c}</MenuItem>
                  ))}
                </Select>
              </FormControl>
              <TextField
                size="small"
                label="Número (9 dígitos)"
                fullWidth
                value={numberId}
                onChange={(e) => setNumberId(e.target.value.replace(/\D/g, "").slice(0, 9))}
                error={numberId.length > 0 && !numberIdValid}
                helperText={numberId.length > 0 && !numberIdValid ? "Debe tener exactamente 9 dígitos" : ""}
                inputProps={{ inputMode: "numeric" }}
              />
            </Stack>

            <TextField
              size="small"
              label="Etiqueta (opcional)"
              fullWidth
              value={label}
              onChange={(e) => setLabel(e.target.value)}
            />

            {document?.linkedFolderId && (
              <Typography variant="caption" color="textSecondary">
                El seguimiento también se vinculará a la carpeta asociada al documento.
              </Typography>
            )}
          </Stack>
        )}

        {/* ── Tab 1: vincular ── */}
        {tab === 1 && (
          <Stack spacing={2}>
            <Typography variant="body2" color="textSecondary">
              Seleccioná un seguimiento postal ya existente para vincularlo a este documento.
            </Typography>

            {loadingTrackings ? (
              <Stack alignItems="center" sx={{ py: 3 }}>
                <CircularProgress size={28} />
              </Stack>
            ) : (
              <Autocomplete
                size="small"
                options={trackings}
                value={selected}
                getOptionLabel={(t: PostalTrackingType) =>
                  `${t.codeId} ${t.numberId}${t.label ? ` — ${t.label}` : ""}`
                }
                isOptionEqualToValue={(opt, val) => opt._id === val._id}
                onChange={(_e, val) => setSelected(val)}
                renderOption={(props, t: PostalTrackingType) => (
                  <Box component="li" {...props} key={t._id}>
                    <Stack>
                      <Typography variant="body2" fontWeight={500}>
                        {t.codeId} {t.numberId}
                      </Typography>
                      {t.label && (
                        <Typography variant="caption" color="textSecondary">{t.label}</Typography>
                      )}
                    </Stack>
                  </Box>
                )}
                renderInput={(params) => (
                  <TextField {...params} label="Buscar seguimiento..." />
                )}
                noOptionsText="Sin seguimientos disponibles"
              />
            )}

            {selected?.documentId && selected.documentId !== document?._id && (
              <Typography variant="caption" color="warning.main">
                Este seguimiento ya tiene un documento vinculado. Al continuar se reemplazará.
              </Typography>
            )}
          </Stack>
        )}
      </DialogContent>

      <DialogActions sx={{ px: 3, py: 2 }}>
        <Button onClick={onClose} color="secondary" variant="outlined">Cancelar</Button>
        {tab === 0 ? (
          <Button
            onClick={handleCreate}
            variant="contained"
            disabled={submitting || !numberIdValid}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Routing size={16} />}
          >
            Crear seguimiento
          </Button>
        ) : (
          <Button
            onClick={handleLink}
            variant="contained"
            disabled={submitting || !selected || loadingTrackings}
            startIcon={submitting ? <CircularProgress size={16} color="inherit" /> : <Routing size={16} />}
          >
            Vincular
          </Button>
        )}
      </DialogActions>
    </Dialog>
  );
};

// ── Página principal ───────────────────────────────────────────────────────────

const DocumentsLayout = () => {
  const theme = useTheme();
  const { documents, isLoader, total } = useSelector((state: any) => state.postalDocumentsReducer);
  const { document: documentDetail } = useSelector((state: any) => state.postalDocumentsReducer);

  // Paginación y filtros
  const [page, setPage] = useState(0);
  const [rowsPerPage, setRowsPerPage] = useState(10);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Modales
  const [openCreate, setOpenCreate] = useState(false);
  const [documentToDelete, setDocumentToDelete] = useState<PostalDocumentType | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [trackingDialogDoc, setTrackingDialogDoc] = useState<PostalDocumentType | null>(null);

  // Selección múltiple
  const [selectedIds, setSelectedIds] = useState<Set<string>>(new Set());
  const [bulkDeleteOpen, setBulkDeleteOpen] = useState(false);

  const loadData = useCallback(() => {
    setSelectedIds(new Set());
    dispatch(
      fetchPostalDocuments({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
      })
    );
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

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
    await dispatch(getPostalDocumentById(id));
  };

  const handleCloseDetail = () => {
    setDetailOpen(false);
    dispatch(clearPostalDocument());
  };

  const handleCloseCreate = () => {
    setOpenCreate(false);
    loadData();
  };

  const handleDeleteConfirm = async (confirmed: boolean) => {
    if (confirmed && documentToDelete) {
      const result = await dispatch(deletePostalDocument(documentToDelete._id));
      if (result.success) {
        showSnackbar("Documento eliminado", "success");
        loadData();
      } else {
        showSnackbar(result.error || "Error al eliminar", "error");
      }
    }
    setDocumentToDelete(null);
  };

  const handleToggleSelect = (id: string) => {
    setSelectedIds((prev) => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const allCurrentSelected = documents.length > 0 && documents.every((d: PostalDocumentType) => selectedIds.has(d._id));
  const someCurrentSelected = documents.some((d: PostalDocumentType) => selectedIds.has(d._id));

  const handleToggleAll = () => {
    if (allCurrentSelected) {
      setSelectedIds(new Set());
    } else {
      setSelectedIds(new Set(documents.map((d: PostalDocumentType) => d._id)));
    }
  };

  const handleBulkDeleteConfirm = async (confirmed: boolean) => {
    setBulkDeleteOpen(false);
    if (!confirmed) return;
    const ids = Array.from(selectedIds);
    let successCount = 0;
    for (const id of ids) {
      const result = await dispatch(deletePostalDocument(id));
      if (result.success) successCount++;
    }
    if (successCount > 0) {
      showSnackbar(`${successCount} documento${successCount !== 1 ? "s" : ""} eliminado${successCount !== 1 ? "s" : ""}`, "success");
      setSelectedIds(new Set());
      loadData();
    } else {
      showSnackbar("Error al eliminar los documentos", "error");
    }
  };

  return (
    <MainCard
      title="Documentos generados"
      secondary={
        <Button variant="contained" startIcon={<Add />} onClick={() => setOpenCreate(true)} size="small">
          Nuevo documento
        </Button>
      }
    >
      {(documents.length > 0 || search) && (
        <Stack direction="row" spacing={2} sx={{ mb: 2 }}>
          <TextField
            size="small"
            placeholder="Buscar por título o plantilla..."
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

      {isLoader ? (
        <TableSkeleton rows={Math.min(rowsPerPage, 10)} />
      ) : documents.length === 0 && !search ? (
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
                  <TableCell>Plantilla</TableCell>
                  <TableCell>Título</TableCell>
                  <TableCell>Estado</TableCell>
                  <TableCell>Fecha</TableCell>
                  <TableCell align="center">Acciones</TableCell>
                </TableRow>
              </TableHead>
              <TableBody>
                {documents.length === 0 ? (
                  <TableRow>
                    <TableCell colSpan={6} align="center" sx={{ py: 4 }}>
                      <Typography color="textSecondary">Sin resultados para la búsqueda</Typography>
                    </TableCell>
                  </TableRow>
                ) : (
                  documents.map((row: PostalDocumentType) => (
                    <TableRow key={row._id} hover selected={selectedIds.has(row._id)}>
                      <TableCell padding="checkbox">
                        <Checkbox
                          size="small"
                          checked={selectedIds.has(row._id)}
                          onChange={() => handleToggleSelect(row._id)}
                        />
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Typography variant="body2">{row.templateName}</Typography>
                          {row.templateCategory && (
                            <Chip size="small" label={row.templateCategory} variant="outlined" />
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Stack direction="row" alignItems="center" spacing={1}>
                          <Stack>
                            <Typography variant="body2" fontWeight={500}>
                              {row.title}
                            </Typography>
                            {row.description && (
                              <Typography
                                variant="caption"
                                color="textSecondary"
                                sx={{ display: "block", maxWidth: 240, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                              >
                                {row.description}
                              </Typography>
                            )}
                          </Stack>
                          {row.linkedTrackingId && (
                            <Tooltip title="Vinculado a un seguimiento postal">
                              <Chip size="small" label="Seguimiento" color="info" variant="outlined" />
                            </Tooltip>
                          )}
                        </Stack>
                      </TableCell>
                      <TableCell>
                        <Chip
                          size="small"
                          label={STATUS_LABELS[row.status] ?? row.status}
                          color={STATUS_COLORS[row.status] ?? "default"}
                          sx={row.status === "draft" ? { color: "text.primary", fontWeight: 500 } : undefined}
                        />
                      </TableCell>
                      <TableCell>
                        <Typography variant="body2" color="textSecondary">
                          {formatDate(row.createdAt)}
                        </Typography>
                      </TableCell>
                      <TableCell align="center">
                        <Stack direction="row" spacing={0.5} justifyContent="center">
                          {/* Ver detalle */}
                          <Tooltip title="Ver documento">
                            <IconButton size="small" onClick={() => handleViewDetail(row._id)} color="primary">
                              <Eye size={16} />
                            </IconButton>
                          </Tooltip>

                          {/* Descargar */}
                          {row.documentUrl ? (
                            <Tooltip title="Descargar PDF">
                              <IconButton size="small" onClick={() => window.open(row.documentUrl, "_blank")} color="info">
                                <DocumentDownload size={16} />
                              </IconButton>
                            </Tooltip>
                          ) : (
                            <Tooltip title="PDF no disponible">
                              <span style={{ display: "inline-flex" }}>
                                <IconButton size="small" disabled>
                                  <DocumentDownload size={16} />
                                </IconButton>
                              </span>
                            </Tooltip>
                          )}

                          {/* Seguimiento de envío */}
                          <Tooltip title={row.linkedTrackingId ? "Ya tiene un seguimiento vinculado" : "Seguimiento de envío"}>
                            <span style={{ display: "inline-flex" }}>
                              <IconButton
                                size="small"
                                color={row.linkedTrackingId ? "default" : "success"}
                                disabled={Boolean(row.linkedTrackingId)}
                                onClick={() => setTrackingDialogDoc(row)}
                              >
                                <Routing size={16} />
                              </IconButton>
                            </span>
                          </Tooltip>

                          {/* Editar (pendiente) */}
                          <Tooltip title="Editar (próximamente)">
                            <span style={{ display: "inline-flex" }}>
                              <IconButton size="small" disabled>
                                <Edit2 size={16} />
                              </IconButton>
                            </span>
                          </Tooltip>

                          {/* Eliminar */}
                          <Tooltip title="Eliminar">
                            <IconButton size="small" onClick={() => setDocumentToDelete(row)} color="error">
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

      {/* Modales */}
      <CreatePostalDocumentModal
        open={openCreate}
        handleClose={handleCloseCreate}
        showSnackbar={showSnackbar}
      />

      <DocumentDetailDialog
        open={detailOpen}
        document={documentDetail}
        onClose={handleCloseDetail}
      />

      <TrackingDialog
        open={Boolean(trackingDialogDoc)}
        document={trackingDialogDoc}
        onClose={() => setTrackingDialogDoc(null)}
        onSuccess={loadData}
        showSnackbar={showSnackbar}
      />

      {documentToDelete && (
        <AlertPostalTrackingDelete
          numberId={documentToDelete.title}
          open={Boolean(documentToDelete)}
          handleClose={handleDeleteConfirm}
        />
      )}

      <AlertPostalTrackingDelete
        numberId={`${selectedIds.size} documento${selectedIds.size !== 1 ? "s" : ""} seleccionado${selectedIds.size !== 1 ? "s" : ""}`}
        open={bulkDeleteOpen}
        handleClose={handleBulkDeleteConfirm}
      />
    </MainCard>
  );
};

export default DocumentsLayout;

import React, { useEffect, useState, useCallback } from "react";
import {
  Box,
  Button,
  Chip,
  CircularProgress,
  IconButton,
  InputAdornment,
  Stack,
  Table,
  TableBody,
  TableCell,
  TableContainer,
  TableHead,
  TablePagination,
  TableRow,
  TextField,
  Tooltip,
  Typography,
  useTheme,
} from "@mui/material";
import { Add, Edit2, Eye, SearchNormal1, Trash } from "iconsax-react";

import MainCard from "components/MainCard";
import { dispatch, useSelector } from "store";
import {
  fetchPostalTrackings,
  deletePostalTracking,
  getPostalTrackingById,
  clearPostalTrackingDetail,
} from "store/reducers/postalTracking";
import { openSnackbar } from "store/reducers/snackbar";
import { PostalTrackingType } from "types/postal-tracking";

import AlertPostalTrackingDelete from "sections/apps/postal-tracking/AlertPostalTrackingDelete";
import PostalTrackingModal from "sections/apps/postal-tracking/PostalTrackingModal";
import PostalTrackingDetail from "sections/apps/postal-tracking/PostalTrackingDetail";

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

// ==============================|| SEGUIMIENTO DE ENVÍOS ||============================== //

const PostalTrackingPage = () => {
  const theme = useTheme();
  const { trackings, isLoader, total, totalPages } = useSelector(
    (state: any) => state.postalTrackingReducer
  );

  // Paginación y filtros (estado local)
  const [page, setPage] = useState(0); // MUI TablePagination es 0-based
  const [rowsPerPage, setRowsPerPage] = useState(20);
  const [search, setSearch] = useState("");
  const [searchInput, setSearchInput] = useState("");

  // Modales
  const [openCreate, setOpenCreate] = useState(false);
  const [trackingToEdit, setTrackingToEdit] = useState<PostalTrackingType | undefined>(undefined);
  const [trackingToDelete, setTrackingToDelete] = useState<PostalTrackingType | null>(null);
  const [detailOpen, setDetailOpen] = useState(false);
  const [detailLoading, setDetailLoading] = useState(false);

  const { tracking: trackingDetail } = useSelector((state: any) => state.postalTrackingReducer);

  const loadData = useCallback(() => {
    dispatch(
      fetchPostalTrackings({
        page: page + 1,
        limit: rowsPerPage,
        search: search || undefined,
      })
    );
  }, [page, rowsPerPage, search]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  // Búsqueda con debounce básico
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

  return (
    <MainCard
      title={
        <Stack direction="row" alignItems="center" spacing={2}>
          <Typography variant="h5">Seguimiento de envíos</Typography>
          <Box sx={{ bgcolor: "#FFCE00", borderRadius: 1, px: 1, py: 0.5, display: "flex", alignItems: "center" }}>
            <Box
              component="img"
              src={CORREO_LOGO}
              alt="Correo Argentino"
              sx={{ height: 24, width: "auto" }}
            />
          </Box>
        </Stack>
      }
      secondary={
        <Button
          variant="contained"
          startIcon={<Add />}
          onClick={() => setOpenCreate(true)}
          size="small"
        >
          Nuevo seguimiento
        </Button>
      }
    >
      {/* Barra de búsqueda */}
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

      {/* Tabla */}
      <TableContainer>
        <Table size="small">
          <TableHead>
            <TableRow>
              <TableCell sx={{ width: 60 }}>Proveedor</TableCell>
              <TableCell>Código / Número</TableCell>
              <TableCell>Etiqueta</TableCell>
              <TableCell>Estado proceso</TableCell>
              <TableCell>Estado envío</TableCell>
              <TableCell>Último chequeo</TableCell>
              <TableCell align="center">Acciones</TableCell>
            </TableRow>
          </TableHead>
          <TableBody>
            {isLoader ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <CircularProgress size={32} />
                </TableCell>
              </TableRow>
            ) : trackings.length === 0 ? (
              <TableRow>
                <TableCell colSpan={7} align="center" sx={{ py: 6 }}>
                  <Typography color="textSecondary">
                    {search ? "Sin resultados para la búsqueda" : "No hay seguimientos creados todavía"}
                  </Typography>
                </TableCell>
              </TableRow>
            ) : (
              trackings.map((row: PostalTrackingType) => (
                <TableRow key={row._id} hover>
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
                    <Typography variant="body2" color={row.label ? "textPrimary" : "textSecondary"}>
                      {row.label || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Chip
                      size="small"
                      label={STATUS_LABELS[row.processingStatus] ?? row.processingStatus}
                      color={STATUS_COLORS[row.processingStatus] ?? "default"}
                    />
                  </TableCell>
                  <TableCell>
                    <Typography
                      variant="body2"
                      color={row.trackingStatus ? "textPrimary" : "textSecondary"}
                      sx={{ maxWidth: 200, overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                    >
                      {row.trackingStatus || "—"}
                    </Typography>
                  </TableCell>
                  <TableCell>
                    <Typography variant="body2" color="textSecondary">
                      {formatDate(row.lastCheckedAt)}
                    </Typography>
                  </TableCell>
                  <TableCell align="center">
                    <Stack direction="row" spacing={0.5} justifyContent="center">
                      <Tooltip title="Ver detalle">
                        <IconButton size="small" onClick={() => handleViewDetail(row._id)} color="primary">
                          <Eye size={16} />
                        </IconButton>
                      </Tooltip>
                      <Tooltip title="Editar">
                        <IconButton size="small" onClick={() => handleOpenEdit(row)} color="info">
                          <Edit2 size={16} />
                        </IconButton>
                      </Tooltip>
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

      <TablePagination
        component="div"
        count={total}
        page={page}
        onPageChange={(_, newPage) => setPage(newPage)}
        rowsPerPage={rowsPerPage}
        onRowsPerPageChange={(e) => {
          setRowsPerPage(parseInt(e.target.value, 10));
          setPage(0);
        }}
        rowsPerPageOptions={[10, 20, 50]}
        labelRowsPerPage="Filas por página:"
        labelDisplayedRows={({ from, to, count }) => `${from}–${to} de ${count}`}
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

      {trackingToDelete && (
        <AlertPostalTrackingDelete
          numberId={`${trackingToDelete.codeId} ${trackingToDelete.numberId}`}
          open={Boolean(trackingToDelete)}
          handleClose={handleDeleteConfirm}
        />
      )}
    </MainCard>
  );
};

export default PostalTrackingPage;

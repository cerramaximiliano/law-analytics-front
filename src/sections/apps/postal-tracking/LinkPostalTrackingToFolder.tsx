import React, { useEffect, useState } from "react";
import {
  Box,
  Button,
  CircularProgress,
  Dialog,
  DialogActions,
  DialogContent,
  DialogTitle,
  Divider,
  FormControl,
  InputAdornment,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import { SearchNormal1, TickCircle } from "iconsax-react";
import SimpleBar from "components/third-party/SimpleBar";
import { useSelector, useDispatch } from "store";
import { Folder } from "types/folders";
import { getFoldersByUserId } from "store/reducers/folder";
import { openSnackbar } from "store/reducers/snackbar";
import { linkFolderToTracking } from "store/reducers/postalTracking";

interface Props {
  open: boolean;
  onClose: () => void;
  trackingId: string;
  currentFolderId?: string | null;
}

const LinkPostalTrackingToFolder = ({ open, onClose, trackingId, currentFolderId }: Props) => {
  const theme = useTheme();
  const dispatch = useDispatch();
  const [isLoading, setIsLoading] = useState(false);
  const [searchTerm, setSearchTerm] = useState("");
  const [selectedFolder, setSelectedFolder] = useState<Folder | null>(null);
  const { folders } = useSelector((state) => state.folder);
  const { user } = useSelector((state) => state.auth);

  useEffect(() => {
    const loadFolders = async () => {
      if (folders.length === 0 && user?._id && open) {
        setIsLoading(true);
        try {
          await dispatch(getFoldersByUserId(user._id));
        } finally {
          setIsLoading(false);
        }
      }
    };
    loadFolders();
  }, [folders.length, user?._id, open, dispatch]);

  useEffect(() => {
    if (open) {
      setSelectedFolder(null);
      setSearchTerm("");
    }
  }, [open]);

  const filteredFolders = folders.filter((folder: Folder) =>
    folder.folderName.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const handleLink = async () => {
    if (!selectedFolder) return;
    try {
      const result = await dispatch(linkFolderToTracking(trackingId, selectedFolder._id));
      if (result.success) {
        dispatch(
          openSnackbar({
            open: true,
            message: "Causa vinculada correctamente",
            variant: "alert",
            alert: { color: "success" },
            close: true,
          })
        );
        onClose();
      } else {
        dispatch(
          openSnackbar({
            open: true,
            message: result.error || "Error al vincular la causa",
            variant: "alert",
            alert: { color: "error" },
            close: true,
          })
        );
      }
    } catch {
      dispatch(
        openSnackbar({
          open: true,
          message: "Error inesperado al vincular",
          variant: "alert",
          alert: { color: "error" },
          close: true,
        })
      );
    }
  };

  const handleUnlink = async () => {
    const result = await dispatch(linkFolderToTracking(trackingId, null));
    if (result.success) {
      dispatch(
        openSnackbar({
          open: true,
          message: "Causa desvinculada",
          variant: "alert",
          alert: { color: "success" },
          close: true,
        })
      );
      onClose();
    }
  };

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      open={open}
      onClose={onClose}
      sx={{
        "& .MuiDialog-paper": { p: 0, borderRadius: 2, boxShadow: `0 2px 10px -2px ${theme.palette.divider}` },
        "& .MuiBackdrop-root": { opacity: "0.5 !important" },
      }}
    >
      <DialogTitle
        sx={{
          bgcolor: theme.palette.primary.lighter,
          p: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" justifyContent="space-between" alignItems="center">
          <Typography variant="h5" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
            Seleccione Carpetas
          </Typography>
          {selectedFolder && (
            <Typography variant="subtitle2" color="textSecondary">
              Seleccionada: {selectedFolder.folderName}
            </Typography>
          )}
        </Stack>
      </DialogTitle>
      <Divider />

      <DialogContent sx={{ p: 3 }}>
        {currentFolderId && (
          <Box
            sx={{
              mb: 2,
              p: 1.5,
              borderRadius: 1,
              bgcolor: theme.palette.warning.lighter,
              border: `1px solid ${theme.palette.warning.light}`,
            }}
          >
            <Stack direction="row" justifyContent="space-between" alignItems="center">
              <Typography variant="body2" color="textSecondary">
                Este seguimiento ya tiene una causa vinculada.
              </Typography>
              <Button size="small" color="warning" onClick={handleUnlink}>
                Desvincular
              </Button>
            </Stack>
          </Box>
        )}

        <FormControl sx={{ width: "100%", mb: 2 }}>
          <TextField
            autoFocus
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            InputProps={{
              startAdornment: (
                <InputAdornment position="start">
                  <SearchNormal1 size={18} color={theme.palette.primary.main} />
                </InputAdornment>
              ),
            }}
            placeholder="Buscar causas..."
            fullWidth
          />
        </FormControl>

        <SimpleBar sx={{ maxHeight: 380, width: "100%", overflowX: "hidden", overflowY: "auto" }}>
          {isLoading ? (
            <Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
              <CircularProgress />
            </Box>
          ) : (
            <Stack spacing={1.5}>
              {filteredFolders.length > 0 ? (
                filteredFolders.map((folder: Folder) => {
                  const isSelected = selectedFolder?._id === folder._id;
                  const isCurrent = folder._id === currentFolderId;
                  return (
                    <Box
                      key={folder._id}
                      onClick={() => setSelectedFolder(isSelected ? null : folder)}
                      sx={{
                        border: "1px solid",
                        borderColor: isSelected
                          ? theme.palette.primary.main
                          : isCurrent
                          ? theme.palette.success.main
                          : "divider",
                        borderRadius: 1,
                        p: 2,
                        cursor: "pointer",
                        bgcolor: isSelected
                          ? theme.palette.primary.lighter
                          : isCurrent
                          ? theme.palette.success.lighter
                          : "background.paper",
                        transition: "all 0.2s ease",
                        "&:hover": {
                          borderColor: theme.palette.primary.main,
                          bgcolor: theme.palette.primary.lighter + "80",
                        },
                      }}
                    >
                      <Stack direction="row" alignItems="center" spacing={1}>
                        <Stack spacing={0.5} flex={1}>
                          <Typography
                            variant="h6"
                            sx={{ overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
                          >
                            {folder.folderName}
                            {isCurrent && (
                              <Typography component="span" variant="caption" color="success.main" sx={{ ml: 1 }}>
                                (vinculada actualmente)
                              </Typography>
                            )}
                          </Typography>
                          <Stack direction="row" spacing={2} color="text.secondary">
                            <Typography variant="body2">Estado: {folder.status || "Sin estado"}</Typography>
                            {folder.materia && (
                              <Typography variant="body2">Materia: {folder.materia}</Typography>
                            )}
                          </Stack>
                        </Stack>
                        {isSelected && (
                          <TickCircle variant="Bold" size={22} style={{ color: theme.palette.primary.main }} />
                        )}
                      </Stack>
                    </Box>
                  );
                })
              ) : (
                <Box
                  sx={{
                    textAlign: "center",
                    py: 4,
                    borderRadius: 2,
                    border: "1px dashed",
                    borderColor: theme.palette.divider,
                  }}
                >
                  <Typography color="textSecondary">
                    {searchTerm ? "No se encontraron causas" : "No hay causas disponibles"}
                  </Typography>
                </Box>
              )}
            </Stack>
          )}
        </SimpleBar>
      </DialogContent>

      <Divider />

      <DialogActions
        sx={{ p: 2.5, bgcolor: theme.palette.background.default, borderTop: `1px solid ${theme.palette.divider}` }}
      >
        <Button color="inherit" onClick={onClose} sx={{ color: theme.palette.text.secondary }}>
          Cancelar
        </Button>
        <Button
          onClick={handleLink}
          color="primary"
          variant="contained"
          disabled={!selectedFolder || isLoading}
          sx={{ minWidth: 120, fontWeight: 600 }}
        >
          Vincular
        </Button>
      </DialogActions>
    </Dialog>
  );
};

export default LinkPostalTrackingToFolder;

import React from "react";
import { Box, Dialog, DialogContent, DialogTitle, Divider, Stack, Typography, useTheme } from "@mui/material";
import { Box as BoxIcon } from "iconsax-react";
import { PopupTransition } from "components/@extended/Transitions";
import AddEditPostalTracking from "./AddEditPostalTracking";
import { PostalTrackingType } from "types/postal-tracking";

const CORREO_LOGO = "https://res.cloudinary.com/dqyoeolib/image/upload/v1773403406/logo-correo_lxrcmr.png";

interface Props {
  open: boolean;
  handleClose: () => void;
  tracking?: PostalTrackingType;
  showSnackbar: (message: string, severity: "success" | "error") => void;
}

const PostalTrackingModal = ({ open, handleClose, tracking, showSnackbar }: Props) => {
  const theme = useTheme();

  return (
    <Dialog
      maxWidth="sm"
      fullWidth
      TransitionComponent={PopupTransition}
      keepMounted
      open={open}
      onClose={handleClose}
      aria-labelledby="postal-tracking-modal-title"
      PaperProps={{
        elevation: 5,
        sx: { borderRadius: 2, overflow: "hidden" },
      }}
    >
      <DialogTitle
        id="postal-tracking-modal-title"
        sx={{
          bgcolor: theme.palette.primary.lighter,
          p: 3,
          borderBottom: `1px solid ${theme.palette.divider}`,
        }}
      >
        <Stack direction="row" alignItems="center" spacing={2}>
          <Stack direction="row" alignItems="center" spacing={1.5} flex={1}>
            <BoxIcon size={24} color={theme.palette.primary.main} variant="Bold" />
            <Stack spacing={0.5}>
              <Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
                {tracking ? "Editar seguimiento" : "Nuevo seguimiento"}
              </Typography>
              <Typography variant="body2" color="textSecondary">
                {tracking
                  ? "Modificá la etiqueta o etiquetas del seguimiento"
                  : "Ingresá el código y número del envío postal"}
              </Typography>
            </Stack>
          </Stack>
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
            <Box
              component="img"
              src={CORREO_LOGO}
              alt="Correo Argentino"
              sx={{ height: 28, width: "auto" }}
            />
          </Box>
        </Stack>
      </DialogTitle>
      <Divider />
      <DialogContent sx={{ p: 3 }}>
        <AddEditPostalTracking
          tracking={tracking}
          onCancel={handleClose}
          showSnackbar={showSnackbar}
        />
      </DialogContent>
    </Dialog>
  );
};

export default PostalTrackingModal;

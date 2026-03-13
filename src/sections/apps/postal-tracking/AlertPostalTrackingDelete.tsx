import React from "react";
import { Button, Dialog, DialogContent, Stack, Typography } from "@mui/material";
import Avatar from "components/@extended/Avatar";
import { PopupTransition } from "components/@extended/Transitions";
import { Trash } from "iconsax-react";

interface Props {
  numberId: string;
  open: boolean;
  handleClose: (confirmed: boolean) => void;
}

export default function AlertPostalTrackingDelete({ numberId, open, handleClose }: Props) {
  return (
    <Dialog
      open={open}
      onClose={() => handleClose(false)}
      keepMounted
      TransitionComponent={PopupTransition}
      maxWidth="xs"
      aria-labelledby="postal-tracking-delete-title"
    >
      <DialogContent sx={{ mt: 2, my: 1 }}>
        <Stack alignItems="center" spacing={3.5}>
          <Avatar color="error" sx={{ width: 72, height: 72, fontSize: "1.75rem" }}>
            <Trash variant="Bold" />
          </Avatar>
          <Stack spacing={2}>
            <Typography variant="h4" align="center">
              ¿Eliminar este seguimiento?
            </Typography>
            <Typography align="center">
              Se eliminará el seguimiento del envío
              <Typography variant="subtitle1" component="span"> "{numberId}" </Typography>
              de forma permanente. Esta acción no se puede deshacer.
            </Typography>
          </Stack>
          <Stack direction="row" spacing={2} sx={{ width: 1 }}>
            <Button fullWidth onClick={() => handleClose(false)} color="secondary" variant="outlined">
              Cancelar
            </Button>
            <Button fullWidth color="error" variant="contained" onClick={() => handleClose(true)} autoFocus>
              Eliminar
            </Button>
          </Stack>
        </Stack>
      </DialogContent>
    </Dialog>
  );
}

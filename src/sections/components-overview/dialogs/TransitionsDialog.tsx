import { useState } from "react";

// material-ui
import { Box, Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle } from "@mui/material";
import { PopupTransition } from "components/@extended/Transitions";

// ==============================|| DIALOG - TRANSITIONS ||============================== //

export default function AlertDialogSlide() {
	const [open, setOpen] = useState(false);

	const handleClickOpen = () => {
		setOpen(true);
	};

	const handleClose = () => {
		setOpen(false);
	};

	return (
		<>
			<Button variant="contained" onClick={handleClickOpen}>
				Slide in dialog
			</Button>
			<Dialog
				open={open}
				TransitionComponent={PopupTransition}
				keepMounted
				onClose={handleClose}
				aria-describedby="alert-dialog-slide-description"
			>
				<Box sx={{ p: 1, py: 1.5 }}>
					<DialogTitle>Use Google&apos;ss location service?</DialogTitle>
					<DialogContent>
						<DialogContentText id="alert-dialog-slide-description">
							Let Google help apps determine location. This means sending anonymous location data to Google, even when no apps are running.
						</DialogContentText>
					</DialogContent>
					<DialogActions>
						<Button color="error" onClick={handleClose}>
							Disagree
						</Button>
						<Button variant="contained" onClick={handleClose}>
							Agree
						</Button>
					</DialogActions>
				</Box>
			</Dialog>
		</>
	);
}

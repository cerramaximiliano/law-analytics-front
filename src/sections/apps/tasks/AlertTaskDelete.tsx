// material-ui
import { Button, Dialog, DialogContent, Stack, Typography } from "@mui/material";

// project import
import Avatar from "components/@extended/Avatar";
import { PopupTransition } from "components/@extended/Transitions";

// assets
import { Trash } from "iconsax-react";

// types
interface Props {
	title: string;
	open: boolean;
	handleClose: (status: boolean) => void;
}

// ==============================|| TASK DELETE ALERT ||============================== //

export default function AlertTaskDelete({ title, open, handleClose }: Props) {
	return (
		<Dialog
			open={open}
			onClose={() => handleClose(false)}
			keepMounted
			TransitionComponent={PopupTransition}
			maxWidth="xs"
			aria-labelledby="task-delete-title"
			aria-describedby="task-delete-description"
		>
			<DialogContent sx={{ mt: 2, my: 1 }}>
				<Stack alignItems="center" spacing={3.5}>
					<Avatar color="error" sx={{ width: 72, height: 72, fontSize: "1.75rem" }}>
						<Trash variant="Bold" />
					</Avatar>
					<Stack spacing={2}>
						<Typography variant="h4" align="center">
							¿Está seguro que desea eliminar esta tarea?
						</Typography>
						<Typography align="center">
							Al eliminar
							<Typography variant="subtitle1" component="span">
								{" "}
								"{title}"{" "}
							</Typography>
							esta acción no se puede deshacer. La tarea será eliminada de forma permanente.
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

// material-ui
import { Button, Dialog, DialogContent, Stack, Typography } from "@mui/material";

// project-imports
import Avatar from "components/@extended/Avatar";
import { PopupTransition } from "components/@extended/Transitions";

// assets
import { Trash } from "iconsax-react";
import { dispatch } from "store";
import { deleteContact } from "store/reducers/contacts";

// types
interface Props {
	title: string;
	open: boolean;
	handleClose: (status: boolean) => void;
	id?: string;
}

// ==============================|| CUSTOMER - DELETE ||============================== //

export default function AlertCustomerDelete({ title, open, handleClose, id }: Props) {
	console.log(title, id);
	const handleClick = () => {
		handleClose(true);
		if (id) {
			dispatch(deleteContact(id));
		}
	};

	return (
		<Dialog
			open={open}
			onClose={() => handleClose(false)}
			keepMounted
			TransitionComponent={PopupTransition}
			maxWidth="xs"
			aria-labelledby="column-delete-title"
			aria-describedby="column-delete-description"
		>
			<DialogContent sx={{ mt: 2, my: 1 }}>
				<Stack alignItems="center" spacing={3.5}>
					<Avatar color="error" sx={{ width: 72, height: 72, fontSize: "1.75rem" }}>
						<Trash variant="Bold" />
					</Avatar>
					<Stack spacing={2}>
						<Typography variant="h4" align="center">
							¿Estás seguro que deseas eliminarlo?
						</Typography>
						<Typography align="center">
							Eliminando el elemento
							<Typography variant="subtitle1" component="span">
								{" "}
								"{title}"{" "}
							</Typography>
							no podrás luego recuperar sus datos.
						</Typography>
					</Stack>

					<Stack direction="row" spacing={2} sx={{ width: 1 }}>
						<Button fullWidth onClick={() => handleClose(false)} color="secondary" variant="outlined">
							Cancelar
						</Button>
						<Button
							fullWidth
							color="error"
							variant="contained"
							onClick={() => {
								handleClick();
							}}
							autoFocus
						>
							Eliminar
						</Button>
					</Stack>
				</Stack>
			</DialogContent>
		</Dialog>
	);
}

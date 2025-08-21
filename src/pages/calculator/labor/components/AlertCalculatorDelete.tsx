import React from "react";
import { Button, Dialog, DialogContent, Stack, Typography } from "@mui/material";

// project-imports
import Avatar from "components/@extended/Avatar";
import { PopupTransition } from "components/@extended/Transitions";

// assets
import { Trash } from "iconsax-react";
import { dispatch } from "store";
import { deleteCalculator } from "store/reducers/calculator";

// types
interface Props {
	id: string;
	open: boolean;
	handleClose: () => void;
}

// ==============================|| CALCULATOR - DELETE ||============================== //

export default function AlertCalculatorDelete({ id, open, handleClose }: Props) {
	const handleDelete = async () => {
		try {
			const result = await dispatch(deleteCalculator(id));
			if (result.success) {
				// Cierra el diálogo después de eliminar con éxito
				handleClose();
			} else {
			}
		} catch (error) {}
	};

	return (
		<Dialog
			open={open}
			onClose={handleClose}
			keepMounted
			TransitionComponent={PopupTransition}
			maxWidth="xs"
			aria-labelledby="calculator-delete-title"
			aria-describedby="calculator-delete-description"
		>
			<DialogContent sx={{ mt: 2, my: 1 }}>
				<Stack alignItems="center" spacing={3.5}>
					<Avatar color="error" sx={{ width: 72, height: 72, fontSize: "1.75rem" }}>
						<Trash variant="Bold" />
					</Avatar>
					<Stack spacing={2}>
						<Typography variant="h4" align="center">
							¿Estás seguro que deseas eliminar este cálculo?
						</Typography>
						<Typography align="center">Al eliminar este cálculo no podrás recuperar sus datos después.</Typography>
					</Stack>

					<Stack direction="row" spacing={2} sx={{ width: 1 }}>
						<Button fullWidth onClick={handleClose} color="secondary" variant="outlined">
							Cancelar
						</Button>
						<Button fullWidth color="error" variant="contained" onClick={handleDelete} autoFocus>
							Eliminar
						</Button>
					</Stack>
				</Stack>
			</DialogContent>
		</Dialog>
	);
}

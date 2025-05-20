import React, { useState } from "react";
import { useSelector } from "react-redux";
import { dispatch } from "store/index";

// material-ui
import { Button, Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Typography, Box } from "@mui/material";

// project imports
import { User } from "types/user";
import { DefaultRootStateProps } from "types/root";
import userApi from "utils/userApi";
import { DELETE_USER, SET_ERROR } from "store/reducers/users";

interface DeleteUserDialogProps {
	user: User;
	open: boolean;
	onClose: () => void;
}

const DeleteUserDialog: React.FC<DeleteUserDialogProps> = ({ user, open, onClose }) => {
	const { loading } = useSelector((state: DefaultRootStateProps) => state.users);
	const [error, setError] = useState<string | null>(null);

	// Función para eliminar el usuario
	const handleDelete = async () => {
		try {
			setError(null);

			// Realizar la petición a la API
			await userApi.delete(`/api/users/${user.id}`);
			console.log("Usuario eliminado:", user.id);

			// Actualizar el estado global
			dispatch({
				type: DELETE_USER,
				payload: user.id,
			});

			// Cerrar el diálogo
			onClose();
		} catch (err: any) {
			console.error("Error al eliminar usuario:", err);
			setError(err.message || "Error al eliminar el usuario");
			dispatch({
				type: SET_ERROR,
				payload: err.message || "Error al eliminar el usuario",
			});
		}
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>Eliminar Usuario</DialogTitle>
			<DialogContent>
				<DialogContentText>
					¿Está seguro que desea eliminar al usuario <strong>{user.name}</strong>?
				</DialogContentText>
				<DialogContentText sx={{ mt: 2 }}>
					Email:{" "}
					<Typography component="span" fontWeight="bold">
						{user.email}
					</Typography>
				</DialogContentText>
				<DialogContentText sx={{ mt: 1 }}>
					Rol:{" "}
					<Typography component="span" fontWeight="bold">
						{user.role}
					</Typography>
				</DialogContentText>
				<DialogContentText sx={{ mt: 1, color: "error.main" }}>Esta acción no se puede deshacer.</DialogContentText>
				{error && <Box sx={{ color: "error.main", mt: 2 }}>{error}</Box>}
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} color="primary">
					Cancelar
				</Button>
				<Button onClick={handleDelete} color="error" variant="contained" disabled={loading}>
					Eliminar
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default DeleteUserDialog;

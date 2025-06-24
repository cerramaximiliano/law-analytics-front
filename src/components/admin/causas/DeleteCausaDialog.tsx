import React from "react";
import { Dialog, DialogActions, DialogContent, DialogContentText, DialogTitle, Button, Typography, Box } from "@mui/material";
import { VerifiedCausa } from "types/causas";

interface DeleteCausaDialogProps {
	open: boolean;
	causa: VerifiedCausa | null;
	onClose: () => void;
	onConfirm: () => void;
	loading?: boolean;
}

const DeleteCausaDialog: React.FC<DeleteCausaDialogProps> = ({ open, causa, onClose, onConfirm, loading = false }) => {
	if (!causa) return null;

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>Confirmar eliminación</DialogTitle>
			<DialogContent>
				<DialogContentText>¿Está seguro que desea eliminar la siguiente causa?</DialogContentText>
				<Box mt={2}>
					<Typography variant="body2" gutterBottom>
						<strong>Carátula:</strong> {causa.caratula}
					</Typography>
					<Typography variant="body2" gutterBottom>
						<strong>Número:</strong> {causa.number}/{causa.year}
					</Typography>
					<Typography variant="body2" gutterBottom>
						<strong>Fuero:</strong> {causa.fuero === "CNT" ? "Trabajo" : causa.fuero === "CSS" ? "Seguridad Social" : "Civil"}
					</Typography>
					<Typography variant="body2" color="error" mt={2}>
						Esta acción no se puede deshacer.
					</Typography>
				</Box>
			</DialogContent>
			<DialogActions>
				<Button onClick={onClose} disabled={loading}>
					Cancelar
				</Button>
				<Button onClick={onConfirm} color="error" variant="contained" disabled={loading}>
					{loading ? "Eliminando..." : "Eliminar"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default DeleteCausaDialog;


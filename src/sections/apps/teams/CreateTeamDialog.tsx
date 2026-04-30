// sections/apps/teams/CreateTeamDialog.tsx
import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, TextField, Stack, Alert } from "@mui/material";
import { useDispatch } from "store";
import { createTeam } from "store/reducers/teams";
import { useTeam, useTeamsFeature } from "contexts/TeamContext";

interface CreateTeamDialogProps {
	open: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

export default function CreateTeamDialog({ open, onClose, onSuccess }: CreateTeamDialogProps) {
	const dispatch = useDispatch();
	const { refreshTeams } = useTeam();
	const { isTeamsEnabled } = useTeamsFeature();

	const [name, setName] = useState("");
	const [description, setDescription] = useState("");
	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleClose = () => {
		if (!isSubmitting) {
			setName("");
			setDescription("");
			setError(null);
			onClose();
		}
	};

	const handleSubmit = async () => {
		if (!name.trim()) {
			setError("El nombre del equipo es requerido");
			return;
		}

		if (name.trim().length < 2) {
			setError("El nombre debe tener al menos 2 caracteres");
			return;
		}

		if (name.trim().length > 50) {
			setError("El nombre no puede exceder 50 caracteres");
			return;
		}

		setError(null);
		setIsSubmitting(true);

		try {
			const result = await dispatch(
				createTeam({
					name: name.trim(),
					description: description.trim() || undefined,
				}) as any,
			);

			if (result.success) {
				await refreshTeams();
				handleClose();
				onSuccess?.();
			} else {
				setError(result.message || "Error al crear el equipo");
			}
		} catch (err) {
			setError("Error al crear el equipo");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!isTeamsEnabled) {
		return (
			<Dialog open={open} onClose={handleClose} maxWidth="xs" fullWidth>
				<DialogTitle>Crear Equipo</DialogTitle>
				<DialogContent>
					<Alert severity="warning">
						La funcionalidad de equipos no está disponible en tu plan actual. Actualiza a un plan Standard o Premium para crear equipos.
					</Alert>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleClose}>Cerrar</Button>
				</DialogActions>
			</Dialog>
		);
	}

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
			<DialogTitle>Crear Nuevo Equipo</DialogTitle>
			<DialogContent>
				<Stack spacing={2} sx={{ mt: 1 }}>
					{error && (
						<Alert severity="error" onClose={() => setError(null)}>
							{error}
						</Alert>
					)}

					<TextField
						label="Nombre del equipo"
						value={name}
						onChange={(e) => setName(e.target.value)}
						fullWidth
						required
						placeholder="Ej: Estudio Jurídico García"
						disabled={isSubmitting}
						autoFocus
						inputProps={{ maxLength: 50 }}
						helperText={`${name.length}/50 caracteres`}
					/>

					<TextField
						label="Descripción (opcional)"
						value={description}
						onChange={(e) => setDescription(e.target.value)}
						fullWidth
						multiline
						rows={2}
						placeholder="Una breve descripción del equipo..."
						disabled={isSubmitting}
						inputProps={{ maxLength: 200 }}
						helperText={`${description.length}/200 caracteres`}
					/>
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} color="inherit" disabled={isSubmitting}>
					Cancelar
				</Button>
				<Button onClick={handleSubmit} variant="contained" disabled={isSubmitting || !name.trim()}>
					{isSubmitting ? "Creando..." : "Crear Equipo"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

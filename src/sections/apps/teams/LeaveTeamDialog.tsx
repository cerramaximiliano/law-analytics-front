// sections/apps/teams/LeaveTeamDialog.tsx
import { useState } from "react";
import { Dialog, DialogTitle, DialogContent, DialogActions, Button, Typography, Alert, Stack } from "@mui/material";
import { Logout } from "iconsax-react";
import { useDispatch } from "store";
import { leaveTeam, deleteTeam } from "store/reducers/teams";
import { resetFoldersState } from "store/reducers/folder";
import { resetContactsState } from "store/reducers/contacts";
import { resetCalculatorsState } from "store/reducers/calculator";
import { fetchUserStats } from "store/reducers/userStats";
import { useTeam } from "contexts/TeamContext";

interface LeaveTeamDialogProps {
	open: boolean;
	onClose: () => void;
	onSuccess?: () => void;
}

export default function LeaveTeamDialog({ open, onClose, onSuccess }: LeaveTeamDialogProps) {
	const dispatch = useDispatch();
	const { activeTeam, isOwner, switchTeam, refreshTeams } = useTeam();

	const [isSubmitting, setIsSubmitting] = useState(false);
	const [error, setError] = useState<string | null>(null);

	const handleClose = () => {
		if (!isSubmitting) {
			setError(null);
			onClose();
		}
	};

	const handleLeave = async () => {
		if (!activeTeam) return;

		setError(null);
		setIsSubmitting(true);

		try {
			const result = await dispatch(leaveTeam(activeTeam._id) as any);

			if (result.success) {
				// Clear cached resources before switching to personal mode
				dispatch(resetFoldersState());
				dispatch(resetContactsState());
				dispatch(resetCalculatorsState());
				switchTeam("");
				await refreshTeams();
				dispatch(fetchUserStats() as any);
				handleClose();
				onSuccess?.();
			} else {
				setError(result.message || "Error al abandonar el equipo");
			}
		} catch (err) {
			setError("Error al abandonar el equipo");
		} finally {
			setIsSubmitting(false);
		}
	};

	const handleDelete = async () => {
		if (!activeTeam) return;

		setError(null);
		setIsSubmitting(true);

		try {
			const result = await dispatch(deleteTeam(activeTeam._id) as any);

			if (result.success) {
				// Clear cached resources before switching to personal mode
				dispatch(resetFoldersState());
				dispatch(resetContactsState());
				dispatch(resetCalculatorsState());
				switchTeam("");
				await refreshTeams();
				dispatch(fetchUserStats() as any);
				handleClose();
				onSuccess?.();
			} else {
				setError(result.message || "Error al eliminar el equipo");
			}
		} catch (err) {
			setError("Error al eliminar el equipo");
		} finally {
			setIsSubmitting(false);
		}
	};

	if (!activeTeam) {
		return null;
	}

	const memberCount = activeTeam.members?.length || 0;

	return (
		<Dialog open={open} onClose={handleClose} maxWidth="sm" fullWidth>
			<DialogTitle sx={{ display: "flex", alignItems: "center", gap: 1 }}>
				<Logout size={24} />
				{isOwner ? "Eliminar Equipo" : "Abandonar Equipo"}
			</DialogTitle>
			<DialogContent>
				<Stack spacing={2}>
					{error && (
						<Alert severity="error" onClose={() => setError(null)}>
							{error}
						</Alert>
					)}

					{isOwner ? (
						<>
							<Alert severity="warning">
								Como propietario del equipo, al eliminarlo:
								<ul style={{ margin: "8px 0 0 0", paddingLeft: 20 }}>
									<li>Todos los miembros perderán acceso inmediatamente</li>
									<li>Los recursos compartidos volverán a ser solo tuyos</li>
									<li>Esta acción no se puede deshacer</li>
								</ul>
							</Alert>

							{memberCount > 0 && (
								<Typography variant="body2" color="text.secondary">
									Este equipo tiene {memberCount} miembro(s) que serán removidos.
								</Typography>
							)}

							<Typography variant="body2">
								¿Estás seguro de que deseas eliminar el equipo <strong>{activeTeam.name}</strong>?
							</Typography>
						</>
					) : (
						<>
							<Alert severity="warning">
								Al abandonar el equipo:
								<ul style={{ margin: "8px 0 0 0", paddingLeft: 20 }}>
									<li>Perderás acceso a todos los recursos del equipo</li>
									<li>
										<strong>Los recursos que migraste al unirte permanecerán en el equipo</strong> (no podrás recuperarlos)
									</li>
									<li>
										<strong>Los recursos que creaste en el equipo también permanecerán</strong> (son propiedad del equipo)
									</li>
									<li>Podrás ser invitado nuevamente en el futuro</li>
								</ul>
							</Alert>

							<Typography variant="body2">
								¿Estás seguro de que deseas abandonar el equipo <strong>{activeTeam.name}</strong>?
							</Typography>
						</>
					)}
				</Stack>
			</DialogContent>
			<DialogActions>
				<Button onClick={handleClose} color="inherit" disabled={isSubmitting}>
					Cancelar
				</Button>
				<Button onClick={isOwner ? handleDelete : handleLeave} variant="contained" color="error" disabled={isSubmitting}>
					{isSubmitting ? "Procesando..." : isOwner ? "Eliminar Equipo" : "Abandonar Equipo"}
				</Button>
			</DialogActions>
		</Dialog>
	);
}

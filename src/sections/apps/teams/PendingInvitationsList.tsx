// sections/apps/teams/PendingInvitationsList.tsx
import { useState } from "react";
import {
	Box,
	List,
	ListItem,
	ListItemText,
	IconButton,
	Typography,
	Tooltip,
	Paper,
	Stack,
	Chip,
	Alert,
} from "@mui/material";
import { Refresh, CloseCircle, Sms, Clock } from "iconsax-react";
import { useDispatch } from "store";
import { cancelInvitation, resendInvitation } from "store/reducers/teams";
import { TeamInvitation, ROLE_CONFIG } from "types/teams";
import { openSnackbar } from "store/reducers/snackbar";
import { useTeam } from "contexts/TeamContext";
import RoleBadge from "./RoleBadge";
import ConfirmDialog from "components/dialogs/ConfirmDialog";

const actionBtnSx = { width: { xs: 44, sm: 30 }, height: { xs: 44, sm: 30 } };

interface PendingInvitationsListProps {
	onInvitationUpdated?: () => void;
}

export default function PendingInvitationsList({ onInvitationUpdated }: PendingInvitationsListProps) {
	const dispatch = useDispatch();
	const { activeTeam, canManageMembers, refreshActiveTeam } = useTeam();

	const [selectedInvitation, setSelectedInvitation] = useState<TeamInvitation | null>(null);
	const [confirmCancel, setConfirmCancel] = useState(false);
	// Reenviar también pide confirmación: en el celular un toque sin querer mandaba el correo (31/10/2026).
	const [confirmResend, setConfirmResend] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);

	const pendingInvitations = activeTeam?.invitations?.filter((i) => i.status === "pending") || [];

	const handleResendClick = (invitation: TeamInvitation) => {
		setSelectedInvitation(invitation);
		setConfirmResend(true);
	};

	const handleConfirmResend = async () => {
		if (!activeTeam || !selectedInvitation) return;

		setIsUpdating(true);
		setConfirmResend(false);

		try {
			const result = await dispatch(resendInvitation(activeTeam._id, selectedInvitation._id) as any);

			dispatch(
				openSnackbar({
					open: true,
					message: result.success ? "Invitación reenviada" : result.message || "No se pudo reenviar la invitación",
					variant: "alert",
					alert: { color: result.success ? "success" : "warning" },
					close: true,
				}),
			);
			if (result.success) {
				await refreshActiveTeam();
				onInvitationUpdated?.();
			}
		} finally {
			setIsUpdating(false);
			setSelectedInvitation(null);
		}
	};

	const handleCancelClick = (invitation: TeamInvitation) => {
		setSelectedInvitation(invitation);
		setConfirmCancel(true);
	};

	const handleConfirmCancel = async () => {
		if (!activeTeam || !selectedInvitation) return;

		setIsUpdating(true);
		setConfirmCancel(false);

		try {
			const result = await dispatch(cancelInvitation(activeTeam._id, selectedInvitation._id) as any);

			if (result.success) {
				await refreshActiveTeam();
				onInvitationUpdated?.();
			}
		} finally {
			setIsUpdating(false);
			setSelectedInvitation(null);
		}
	};

	const formatDate = (dateString: string): string => {
		const date = new Date(dateString);
		return date.toLocaleDateString("es-AR", {
			day: "2-digit",
			month: "short",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const isExpiringSoon = (expiresAt: string): boolean => {
		const expDate = new Date(expiresAt);
		const now = new Date();
		const diffHours = (expDate.getTime() - now.getTime()) / (1000 * 60 * 60);
		return diffHours < 24 && diffHours > 0;
	};

	const isExpired = (expiresAt: string): boolean => {
		return new Date(expiresAt) < new Date();
	};

	if (!activeTeam) {
		return null;
	}

	if (pendingInvitations.length === 0) {
		return (
			<Paper variant="outlined" sx={{ p: 2 }}>
				<Typography variant="subtitle1" fontWeight={600} gutterBottom>
					Invitaciones Pendientes
				</Typography>
				<Typography variant="body2" color="text.secondary">
					No hay invitaciones pendientes
				</Typography>
			</Paper>
		);
	}

	return (
		<>
			<Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
				<Typography variant="subtitle1" fontWeight={600} gutterBottom>
					Invitaciones Pendientes ({pendingInvitations.length})
				</Typography>

				<List dense disablePadding>
					{pendingInvitations.map((invitation) => {
						const expired = isExpired(invitation.expiresAt);
						const expiringSoon = isExpiringSoon(invitation.expiresAt);

						return (
							<ListItem
								key={invitation._id}
								sx={{
									flexDirection: { xs: "column", sm: "row" },
									alignItems: { xs: "stretch", sm: "center" },
									px: { xs: 0.5, sm: 2 },
									bgcolor: expired ? "action.disabledBackground" : "transparent",
									borderRadius: 1,
									mb: 0.5,
								}}
							>
								<ListItemText
									primary={
										<Stack direction="row" alignItems="center" flexWrap="wrap" gap={1}>
											<Sms size={16} style={{ flexShrink: 0 }} />
											<Typography variant="body2" fontWeight={500} sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
												{invitation.email}
											</Typography>
											<RoleBadge role={invitation.role} size="small" />
										</Stack>
									}
									secondary={
										<Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} sx={{ mt: 0.5 }}>
											<Clock size={14} style={{ flexShrink: 0 }} />
											<Typography variant="caption" color="text.secondary">
												Enviada: {formatDate(invitation.sentAt)}
											</Typography>
											{expired ? (
												<Chip label="Expirada" size="small" color="error" variant="outlined" />
											) : expiringSoon ? (
												<Chip label="Expira pronto" size="small" color="warning" variant="outlined" />
											) : (
												<Typography variant="caption" color="text.secondary">
													Expira: {formatDate(invitation.expiresAt)}
												</Typography>
											)}
										</Stack>
									}
								/>
								{canManageMembers && (
									<Stack direction="row" spacing={0.5} justifyContent="flex-end" sx={{ flexShrink: 0, ml: { sm: 1 } }}>
										<Tooltip title="Reenviar invitación">
											<IconButton size="small" onClick={() => handleResendClick(invitation)} disabled={isUpdating} sx={actionBtnSx}>
												<Refresh size={18} />
											</IconButton>
										</Tooltip>
										<Tooltip title="Cancelar invitación">
											<IconButton size="small" color="error" onClick={() => handleCancelClick(invitation)} disabled={isUpdating} sx={actionBtnSx}>
												<CloseCircle size={18} />
											</IconButton>
										</Tooltip>
									</Stack>
								)}
							</ListItem>
						);
					})}
				</List>
			</Paper>

			<ConfirmDialog
				open={confirmResend}
				title="Reenviar invitación"
				content={`Se va a enviar de nuevo el correo de invitación a ${selectedInvitation?.email}.`}
				confirmText="Reenviar"
				onConfirm={handleConfirmResend}
				onCancel={() => {
					setConfirmResend(false);
					setSelectedInvitation(null);
				}}
			/>

			{/* Confirm Cancel Dialog */}
			<ConfirmDialog
				open={confirmCancel}
				title="Cancelar invitación"
				content={`¿Estás seguro de que deseas cancelar la invitación a ${selectedInvitation?.email}?`}
				confirmText="Cancelar invitación"
				confirmColor="error"
				onConfirm={handleConfirmCancel}
				onCancel={() => {
					setConfirmCancel(false);
					setSelectedInvitation(null);
				}}
			/>
		</>
	);
}

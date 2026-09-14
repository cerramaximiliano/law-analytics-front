// sections/apps/teams/PendingInvitationsList.tsx
import { useState } from "react";
import {
	Box,
	List,
	ListItem,
	ListItemText,
	ListItemSecondaryAction,
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
import { useTeam } from "contexts/TeamContext";
import RoleBadge from "./RoleBadge";
import ConfirmDialog from "components/dialogs/ConfirmDialog";

interface PendingInvitationsListProps {
	onInvitationUpdated?: () => void;
}

export default function PendingInvitationsList({ onInvitationUpdated }: PendingInvitationsListProps) {
	const dispatch = useDispatch();
	const { activeTeam, canManageMembers, refreshActiveTeam } = useTeam();

	const [selectedInvitation, setSelectedInvitation] = useState<TeamInvitation | null>(null);
	const [confirmCancel, setConfirmCancel] = useState(false);
	const [isUpdating, setIsUpdating] = useState(false);

	const pendingInvitations = activeTeam?.invitations?.filter((i) => i.status === "pending") || [];

	const handleResend = async (invitation: TeamInvitation) => {
		if (!activeTeam) return;

		setIsUpdating(true);

		try {
			const result = await dispatch(resendInvitation(activeTeam._id, invitation._id) as any);

			if (result.success) {
				await refreshActiveTeam();
				onInvitationUpdated?.();
			}
		} finally {
			setIsUpdating(false);
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
			<Paper variant="outlined" sx={{ p: 2 }}>
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
									bgcolor: expired ? "action.disabledBackground" : "transparent",
									borderRadius: 1,
									mb: 0.5,
								}}
							>
								<ListItemText
									primary={
										<Stack direction="row" alignItems="center" spacing={1}>
											<Sms size={16} />
											<Typography variant="body2" fontWeight={500}>
												{invitation.email}
											</Typography>
											<RoleBadge role={invitation.role} size="small" />
										</Stack>
									}
									secondary={
										<Stack direction="row" alignItems="center" spacing={1} sx={{ mt: 0.5 }}>
											<Clock size={14} />
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
									<ListItemSecondaryAction>
										<Stack direction="row" spacing={0.5}>
											<Tooltip title="Reenviar invitación">
												<IconButton size="small" onClick={() => handleResend(invitation)} disabled={isUpdating}>
													<Refresh size={18} />
												</IconButton>
											</Tooltip>
											<Tooltip title="Cancelar invitación">
												<IconButton size="small" color="error" onClick={() => handleCancelClick(invitation)} disabled={isUpdating}>
													<CloseCircle size={18} />
												</IconButton>
											</Tooltip>
										</Stack>
									</ListItemSecondaryAction>
								)}
							</ListItem>
						);
					})}
				</List>
			</Paper>

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

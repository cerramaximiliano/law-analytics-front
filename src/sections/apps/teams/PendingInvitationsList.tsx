// sections/apps/teams/PendingInvitationsList.tsx
import { useCallback, useEffect, useState } from "react";
import {
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	IconButton,
	InputLabel,
	List,
	ListItem,
	ListItemText,
	MenuItem,
	Paper,
	Select,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { Refresh, CloseCircle, Sms, Clock, Edit2, Send2, UserAdd, Folder2 } from "iconsax-react";
import { useDispatch } from "store";
import {
	cancelInvitation,
	fetchTeamInvitations,
	resendInvitation,
	sendAllDraftInvitations,
	sendDraftInvitation,
	updateDraftInvitation,
} from "store/reducers/teams";
import { TeamInvitation, TeamRole, ROLE_CONFIG, ADMIN_CHIP_TEXT_COLOR } from "types/teams";
import { openSnackbar } from "store/reducers/snackbar";
import { useTeam } from "contexts/TeamContext";
import RoleBadge from "./RoleBadge";
import ConfirmDialog from "components/dialogs/ConfirmDialog";

const actionBtnSx = { width: { xs: 44, sm: 30 }, height: { xs: 44, sm: 30 } };

interface PendingInvitationsListProps {
	onInvitationUpdated?: () => void;
}

// Integrantes previstos (borradores sin correo) e invitaciones pendientes (5/11/2026).
// Un previsto se edita, se envía (pasa a invitado) o se elimina; un invitado se reenvía o se
// cancela. Si tiene carpetas asignadas, al eliminarlo o cancelarlo se avisa: las carpetas
// quedan sin ese responsable.
export default function PendingInvitationsList({ onInvitationUpdated }: PendingInvitationsListProps) {
	const dispatch = useDispatch();
	const { activeTeam, canManageMembers, refreshActiveTeam, userRole } = useTeam();

	const [selectedInvitation, setSelectedInvitation] = useState<TeamInvitation | null>(null);
	const [confirmCancel, setConfirmCancel] = useState(false);
	// Reenviar también pide confirmación: en el celular un toque sin querer mandaba el correo (31/10/2026).
	const [confirmResend, setConfirmResend] = useState(false);
	const [confirmSend, setConfirmSend] = useState(false);
	const [confirmSendAll, setConfirmSendAll] = useState(false);
	const [editing, setEditing] = useState<TeamInvitation | null>(null);
	const [editForm, setEditForm] = useState<{ displayName: string; email: string; role: TeamRole }>({
		displayName: "",
		email: "",
		role: "viewer",
	});
	const [isUpdating, setIsUpdating] = useState(false);
	const [folderCounts, setFolderCounts] = useState<Record<string, number>>({});

	const drafts = activeTeam?.invitations?.filter((i) => i.status === "draft") || [];
	const pendingInvitations = activeTeam?.invitations?.filter((i) => i.status === "pending") || [];
	const total = drafts.length + pendingInvitations.length;

	// Carpetas asignadas por previsto/invitado (las trae GET /invitations, no el detalle del equipo).
	const loadCounts = useCallback(async () => {
		if (!activeTeam?._id || !canManageMembers) return;
		const list = await fetchTeamInvitations(activeTeam._id);
		if (!list) return;
		const next: Record<string, number> = {};
		list.forEach((inv) => {
			next[inv._id] = inv.assignedFolders || 0;
		});
		setFolderCounts(next);
	}, [activeTeam?._id, canManageMembers]);

	useEffect(() => {
		loadCounts();
	}, [loadCounts, total]);

	const notify = (message: string, color: "success" | "warning" | "error") =>
		dispatch(openSnackbar({ open: true, message, variant: "alert", alert: { color }, close: true }));

	const afterChange = async () => {
		await refreshActiveTeam();
		await loadCounts();
		onInvitationUpdated?.();
	};

	const handleConfirmResend = async () => {
		if (!activeTeam || !selectedInvitation) return;
		setIsUpdating(true);
		setConfirmResend(false);
		try {
			const result = await dispatch(resendInvitation(activeTeam._id, selectedInvitation._id) as any);
			notify(
				result.success ? "Invitación reenviada" : result.message || "No se pudo reenviar la invitación",
				result.success ? "success" : "warning",
			);
			if (result.success) await afterChange();
		} finally {
			setIsUpdating(false);
			setSelectedInvitation(null);
		}
	};

	const handleConfirmCancel = async () => {
		if (!activeTeam || !selectedInvitation) return;
		setIsUpdating(true);
		setConfirmCancel(false);
		try {
			const result = await dispatch(cancelInvitation(activeTeam._id, selectedInvitation._id) as any);
			if (result.success) {
				notify(selectedInvitation.status === "draft" ? "Integrante previsto eliminado" : "Invitación cancelada", "success");
				await afterChange();
			} else {
				notify(result.message || "No se pudo completar", "error");
			}
		} finally {
			setIsUpdating(false);
			setSelectedInvitation(null);
		}
	};

	const handleConfirmSend = async () => {
		if (!activeTeam || !selectedInvitation) return;
		setIsUpdating(true);
		setConfirmSend(false);
		try {
			const result = await dispatch(sendDraftInvitation(activeTeam._id, selectedInvitation._id) as any);
			if (result.success) {
				notify(
					result.emailStatus === "sent"
						? `Invitación enviada a ${selectedInvitation.email}`
						: "Quedó como invitado, pero el correo no salió. Probá reenviar.",
					result.emailStatus === "sent" ? "success" : "warning",
				);
				await afterChange();
			} else {
				notify(result.message || "No se pudo enviar la invitación", "error");
			}
		} finally {
			setIsUpdating(false);
			setSelectedInvitation(null);
		}
	};

	const handleConfirmSendAll = async () => {
		if (!activeTeam) return;
		setIsUpdating(true);
		setConfirmSendAll(false);
		try {
			const result = await dispatch(sendAllDraftInvitations(activeTeam._id) as any);
			if (result.success) {
				const sent = result.results?.sent?.length || 0;
				const failed = result.results?.failed?.length || 0;
				notify(
					failed ? `${sent} enviada(s), ${failed} sin correo (probá reenviar)` : `${sent} invitación(es) enviada(s)`,
					failed ? "warning" : "success",
				);
				await afterChange();
			} else {
				notify(result.message || "No se pudieron enviar las invitaciones", "error");
			}
		} finally {
			setIsUpdating(false);
		}
	};

	const openEdit = (inv: TeamInvitation) => {
		setEditing(inv);
		setEditForm({ displayName: inv.displayName || "", email: inv.email, role: inv.role });
	};

	const handleSaveEdit = async () => {
		if (!activeTeam || !editing) return;
		const email = editForm.email.trim().toLowerCase();
		if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
			notify("Email inválido", "error");
			return;
		}
		setIsUpdating(true);
		try {
			const result = await dispatch(
				updateDraftInvitation(activeTeam._id, editing._id, { displayName: editForm.displayName.trim(), email, role: editForm.role }) as any,
			);
			if (result.success) {
				notify("Integrante previsto actualizado", "success");
				setEditing(null);
				await afterChange();
			} else {
				notify(result.message || "No se pudo editar", "error");
			}
		} finally {
			setIsUpdating(false);
		}
	};

	const formatDate = (dateString: string | null | undefined): string => {
		if (!dateString) return "";
		return new Date(dateString).toLocaleDateString("es-AR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" });
	};

	const isExpiringSoon = (expiresAt: string | null | undefined): boolean => {
		if (!expiresAt) return false;
		const diffHours = (new Date(expiresAt).getTime() - Date.now()) / (1000 * 60 * 60);
		return diffHours < 24 && diffHours > 0;
	};

	const isExpired = (expiresAt: string | null | undefined): boolean => !!expiresAt && new Date(expiresAt) < new Date();

	if (!activeTeam) return null;

	const foldersChip = (inv: TeamInvitation) => {
		const n = folderCounts[inv._id] || 0;
		if (!n) return null;
		return (
			<Tooltip title="Carpetas que lo tienen como responsable. Cuando acepte, pasan a su nombre.">
				<Chip icon={<Folder2 size={14} />} label={n === 1 ? "1 carpeta" : `${n} carpetas`} size="small" variant="outlined" />
			</Tooltip>
		);
	};

	const renderItem = (invitation: TeamInvitation) => {
		const isDraft = invitation.status === "draft";
		const expired = !isDraft && isExpired(invitation.expiresAt);
		const expiringSoon = !isDraft && isExpiringSoon(invitation.expiresAt);
		const n = folderCounts[invitation._id] || 0;
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
							{isDraft ? <UserAdd size={16} style={{ flexShrink: 0 }} /> : <Sms size={16} style={{ flexShrink: 0 }} />}
							<Typography variant="body2" fontWeight={500} sx={{ minWidth: 0, overflowWrap: "anywhere" }}>
								{invitation.displayName ? `${invitation.displayName} · ${invitation.email}` : invitation.email}
							</Typography>
							<RoleBadge role={invitation.role} size="small" />
							{isDraft ? (
								<Chip label="Previsto" size="small" sx={{ bgcolor: "action.selected" }} />
							) : (
								<Chip label="Invitado" size="small" color="warning" sx={{ color: "#1b1b1b" }} />
							)}
							{foldersChip(invitation)}
						</Stack>
					}
					secondary={
						<Stack direction="row" alignItems="center" flexWrap="wrap" gap={1} sx={{ mt: 0.5 }}>
							<Clock size={14} style={{ flexShrink: 0 }} />
							{isDraft ? (
								<Typography variant="caption" color="text.secondary">
									Sin invitación enviada. Podés asignarle carpetas y mandarla cuando quieras.
								</Typography>
							) : (
								<>
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
								</>
							)}
						</Stack>
					}
				/>
				{canManageMembers && (
					<Stack direction="row" spacing={0.5} justifyContent="flex-end" sx={{ flexShrink: 0, ml: { sm: 1 } }}>
						{isDraft ? (
							<>
								<Tooltip title="Editar nombre, correo o rol">
									<IconButton
										size="small"
										onClick={() => openEdit(invitation)}
										disabled={isUpdating}
										sx={actionBtnSx}
										data-testid="draft-edit-btn"
									>
										<Edit2 size={18} />
									</IconButton>
								</Tooltip>
								<Tooltip title="Enviar la invitación por correo">
									<IconButton
										size="small"
										color="primary"
										onClick={() => {
											setSelectedInvitation(invitation);
											setConfirmSend(true);
										}}
										disabled={isUpdating}
										sx={actionBtnSx}
										data-testid="draft-send-btn"
									>
										<Send2 size={18} />
									</IconButton>
								</Tooltip>
								<Tooltip title={n ? "Eliminar previsto (sus carpetas quedan sin este responsable)" : "Eliminar previsto"}>
									<IconButton
										size="small"
										color="error"
										onClick={() => {
											setSelectedInvitation(invitation);
											setConfirmCancel(true);
										}}
										disabled={isUpdating}
										sx={actionBtnSx}
									>
										<CloseCircle size={18} />
									</IconButton>
								</Tooltip>
							</>
						) : (
							<>
								<Tooltip title="Reenviar invitación">
									<IconButton
										size="small"
										onClick={() => {
											setSelectedInvitation(invitation);
											setConfirmResend(true);
										}}
										disabled={isUpdating}
										sx={actionBtnSx}
									>
										<Refresh size={18} />
									</IconButton>
								</Tooltip>
								<Tooltip title={n ? "Cancelar invitación (sus carpetas quedan sin este responsable)" : "Cancelar invitación"}>
									<IconButton
										size="small"
										color="error"
										onClick={() => {
											setSelectedInvitation(invitation);
											setConfirmCancel(true);
										}}
										disabled={isUpdating}
										sx={actionBtnSx}
									>
										<CloseCircle size={18} />
									</IconButton>
								</Tooltip>
							</>
						)}
					</Stack>
				)}
			</ListItem>
		);
	};

	const selectedFolders = selectedInvitation ? folderCounts[selectedInvitation._id] || 0 : 0;
	const cancelWarning = selectedFolders
		? ` Tiene ${
				selectedFolders === 1 ? "1 carpeta asignada, que queda" : `${selectedFolders} carpetas asignadas, que quedan`
		  } sin este responsable.`
		: "";

	return (
		<>
			<Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
				<Stack
					direction={{ xs: "column", sm: "row" }}
					justifyContent="space-between"
					alignItems={{ xs: "stretch", sm: "center" }}
					gap={1}
					sx={{ mb: 1 }}
				>
					<Typography variant="subtitle1" fontWeight={600}>
						Previstos e invitaciones {total > 0 ? `(${total})` : ""}
					</Typography>
					{canManageMembers && drafts.length > 1 && (
						<Button
							size="small"
							variant="outlined"
							startIcon={<Send2 size={16} />}
							onClick={() => setConfirmSendAll(true)}
							disabled={isUpdating}
						>
							Enviar todas las invitaciones ({drafts.length})
						</Button>
					)}
				</Stack>

				{total === 0 ? (
					<Typography variant="body2" color="text.secondary">
						No hay integrantes previstos ni invitaciones pendientes
					</Typography>
				) : (
					<List dense disablePadding>
						{drafts.map(renderItem)}
						{pendingInvitations.map(renderItem)}
					</List>
				)}
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

			<ConfirmDialog
				open={confirmSend}
				title="Enviar invitación"
				content={`Se va a enviar el correo de invitación a ${selectedInvitation?.displayName || ""} (${
					selectedInvitation?.email
				}). Cuando acepte, las carpetas que le asignaste pasan a su nombre.`}
				confirmText="Enviar"
				onConfirm={handleConfirmSend}
				onCancel={() => {
					setConfirmSend(false);
					setSelectedInvitation(null);
				}}
			/>

			<ConfirmDialog
				open={confirmSendAll}
				title="Enviar todas las invitaciones"
				content={`Se va a enviar el correo de invitación a los ${drafts.length} integrantes previstos.`}
				confirmText="Enviar todas"
				onConfirm={handleConfirmSendAll}
				onCancel={() => setConfirmSendAll(false)}
			/>

			<ConfirmDialog
				open={confirmCancel}
				title={selectedInvitation?.status === "draft" ? "Eliminar integrante previsto" : "Cancelar invitación"}
				content={
					selectedInvitation?.status === "draft"
						? `¿Eliminar a ${selectedInvitation?.displayName || selectedInvitation?.email}?${cancelWarning}`
						: `¿Cancelar la invitación a ${selectedInvitation?.email}?${cancelWarning}`
				}
				confirmText={selectedInvitation?.status === "draft" ? "Eliminar" : "Cancelar invitación"}
				confirmColor="error"
				onConfirm={handleConfirmCancel}
				onCancel={() => {
					setConfirmCancel(false);
					setSelectedInvitation(null);
				}}
			/>

			<Dialog open={!!editing} onClose={() => !isUpdating && setEditing(null)} fullWidth maxWidth="xs">
				<DialogTitle>Editar integrante previsto</DialogTitle>
				<DialogContent>
					<Stack spacing={2} sx={{ mt: 1 }}>
						<TextField
							label="Nombre"
							value={editForm.displayName}
							onChange={(e) => setEditForm({ ...editForm, displayName: e.target.value })}
							size="small"
							inputProps={{ maxLength: 80 }}
							fullWidth
						/>
						<TextField
							label="Email"
							type="email"
							value={editForm.email}
							onChange={(e) => setEditForm({ ...editForm, email: e.target.value })}
							size="small"
							fullWidth
						/>
						<FormControl size="small" fullWidth>
							<InputLabel>Rol</InputLabel>
							<Select value={editForm.role} label="Rol" onChange={(e) => setEditForm({ ...editForm, role: e.target.value as TeamRole })}>
								{userRole === "owner" && (
									<MenuItem value="admin">
										<Chip
											label={ROLE_CONFIG.admin.label}
											color={ROLE_CONFIG.admin.color}
											size="small"
											sx={{ color: ADMIN_CHIP_TEXT_COLOR }}
										/>
									</MenuItem>
								)}
								<MenuItem value="editor">
									<Chip label={ROLE_CONFIG.editor.label} color={ROLE_CONFIG.editor.color} size="small" />
								</MenuItem>
								<MenuItem value="viewer">
									<Chip label={ROLE_CONFIG.viewer.label} color={ROLE_CONFIG.viewer.color} size="small" />
								</MenuItem>
							</Select>
						</FormControl>
						<Box>
							<Typography variant="caption" color="text.secondary">
								Las carpetas que ya le asignaste se conservan.
							</Typography>
						</Box>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={() => setEditing(null)} disabled={isUpdating} sx={{ textTransform: "none", color: "text.secondary" }}>
						Cancelar
					</Button>
					<Button variant="contained" onClick={handleSaveEdit} disabled={isUpdating} sx={{ textTransform: "none" }}>
						Guardar
					</Button>
				</DialogActions>
			</Dialog>
		</>
	);
}

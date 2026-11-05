// sections/apps/teams/InviteMembersForm.tsx
import { useState } from "react";
import {
	Button,
	TextField,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	Stack,
	Typography,
	Alert,
	IconButton,
	Chip,
	Paper,
	Tooltip,
} from "@mui/material";
import { Add, CloseCircle, Send2, UserAdd } from "iconsax-react";
import { useDispatch } from "store";
import { createDraftInvitations, sendInvitations } from "store/reducers/teams";
import { trackActivity } from "utils/productAnalytics";
import { TeamRole, ROLE_CONFIG, ADMIN_CHIP_TEXT_COLOR, SendInvitationRequest, DraftInvitationRequest } from "types/teams";
import { useTeam, useTeamsFeature } from "contexts/TeamContext";

interface InviteEntry {
	email: string;
	role: TeamRole;
	displayName: string;
}

interface InviteMembersFormProps {
	onSuccess?: () => void;
}

const emptyEntry = (): InviteEntry => ({ email: "", role: "viewer", displayName: "" });

// Invitar integrantes (manda el correo) o dejarlos PREVISTOS (5/11/2026): se guardan con
// nombre, correo y rol sin enviar nada, se les pueden asignar carpetas desde ya, y la
// invitación se manda después desde la lista de abajo. Ocupan cupo igual que los invitados.
export default function InviteMembersForm({ onSuccess }: InviteMembersFormProps) {
	const dispatch = useDispatch();
	const { activeTeam, refreshActiveTeam, userRole } = useTeam();
	const { maxTeamMembers } = useTeamsFeature();

	const [invites, setInvites] = useState<InviteEntry[]>([emptyEntry()]);
	const [submitting, setSubmitting] = useState<"send" | "draft" | null>(null);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const isSubmitting = submitting !== null;

	// Cupo: integrantes + owner + invitados pendientes + previstos
	const currentMemberCount = activeTeam ? (activeTeam.members?.length || 0) + 1 : 0; // +1 for owner
	const pendingInvitesCount = activeTeam?.invitations?.filter((i) => i.status === "pending" || i.status === "draft").length || 0;
	const remainingSlots = maxTeamMembers - currentMemberCount - pendingInvitesCount;

	const handleAddInvite = () => {
		if (invites.length < remainingSlots) {
			setInvites([...invites, emptyEntry()]);
		}
	};

	const handleRemoveInvite = (index: number) => {
		if (invites.length > 1) {
			setInvites(invites.filter((_, i) => i !== index));
		}
	};

	const handleChange = (index: number, patch: Partial<InviteEntry>) => {
		const updated = [...invites];
		updated[index] = { ...updated[index], ...patch };
		setInvites(updated);
	};

	const validateEmail = (email: string): boolean => {
		const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
		return emailRegex.test(email);
	};

	/** Validaciones comunes a invitar y a prever. Devuelve las filas válidas o null si hay error. */
	const validate = (requireName: boolean): InviteEntry[] | null => {
		if (!activeTeam) return null;
		const validInvites = invites.filter((inv) => inv.email.trim() !== "");

		if (validInvites.length === 0) {
			setError("Ingresá al menos un email");
			return null;
		}

		const invalidEmails = validInvites.filter((inv) => !validateEmail(inv.email));
		if (invalidEmails.length > 0) {
			setError(`Email(s) inválido(s): ${invalidEmails.map((i) => i.email).join(", ")}`);
			return null;
		}

		if (requireName) {
			const sinNombre = validInvites.filter((inv) => !inv.displayName.trim());
			if (sinNombre.length > 0) {
				setError(`Para dejarlos previstos necesitás el nombre: ${sinNombre.map((i) => i.email).join(", ")}`);
				return null;
			}
		}

		const emails = validInvites.map((i) => i.email.toLowerCase());
		if (new Set(emails).size !== emails.length) {
			setError("Hay emails duplicados en la lista");
			return null;
		}

		const ownerEmail = (activeTeam.ownerInfo?.email || (activeTeam.owner as any)?.email)?.toLowerCase();
		if (ownerEmail && validInvites.some((i) => i.email.toLowerCase() === ownerEmail)) {
			setError("No podés invitar al propietario del equipo");
			return null;
		}

		const existingMembers = (activeTeam.members || [])
			.map((m: any) => {
				const email = m.email || m.userId?.email;
				return email ? email.toLowerCase() : "";
			})
			.filter(Boolean);
		const alreadyMember = validInvites.filter((i) => existingMembers.includes(i.email.toLowerCase()));
		if (alreadyMember.length > 0) {
			setError(`Ya son integrantes: ${alreadyMember.map((i) => i.email).join(", ")}`);
			return null;
		}

		const existingInvites = (activeTeam.invitations || [])
			.filter((i) => i.status === "pending" || i.status === "draft")
			.map((i) => i.email.toLowerCase());
		const alreadyInvited = validInvites.filter((i) => existingInvites.includes(i.email.toLowerCase()));
		if (alreadyInvited.length > 0) {
			setError(`Ya están previstos o invitados: ${alreadyInvited.map((i) => i.email).join(", ")}`);
			return null;
		}

		return validInvites;
	};

	const handleSubmit = async () => {
		if (!activeTeam) return;
		setError(null);
		setSuccess(null);
		const validInvites = validate(false);
		if (!validInvites) return;

		setSubmitting("send");
		try {
			const invitationsData: SendInvitationRequest[] = validInvites.map((inv) => ({
				email: inv.email.trim().toLowerCase(),
				role: inv.role,
			}));

			const result = await dispatch(sendInvitations(activeTeam._id, { invitations: invitationsData }) as any);

			if (result.success) {
				const failedCount = result.results?.failed?.length || 0;
				const sentCount = result.results?.sent?.length || 0;
				if (sentCount > 0) trackActivity("team_invite_send", { count: sentCount });

				setSuccess(`${sentCount} invitación(es) enviada(s) correctamente`);
				if (failedCount > 0 && sentCount > 0) {
					const failedReasons = result.results.failed.map((f: { email: string; reason: string }) => `${f.email}: ${f.reason}`).join(". ");
					setError(failedReasons);
				}
				setInvites([emptyEntry()]);
				await refreshActiveTeam();
				onSuccess?.();
			} else {
				setError(result.message || "Error al enviar invitaciones");
			}
		} catch (err: any) {
			setError(err?.message || err?.response?.data?.message || "Error al enviar invitaciones");
		} finally {
			setSubmitting(null);
		}
	};

	const handleSaveDrafts = async () => {
		if (!activeTeam) return;
		setError(null);
		setSuccess(null);
		const validInvites = validate(true);
		if (!validInvites) return;

		setSubmitting("draft");
		try {
			const drafts: DraftInvitationRequest[] = validInvites.map((inv) => ({
				email: inv.email.trim().toLowerCase(),
				role: inv.role,
				displayName: inv.displayName.trim(),
			}));
			const result = await dispatch(createDraftInvitations(activeTeam._id, drafts) as any);
			const created = result.results?.created?.length || 0;
			const failed: { email: string; reason: string }[] = result.results?.failed || [];
			if (created > 0) {
				trackActivity("team_draft_save", { count: created });
				setSuccess(
					created === 1
						? "1 integrante previsto guardado. Ya podés asignarle carpetas; la invitación se manda cuando quieras."
						: `${created} integrantes previstos guardados. Ya podés asignarles carpetas; las invitaciones se mandan cuando quieras.`,
				);
				setInvites([emptyEntry()]);
				await refreshActiveTeam();
				onSuccess?.();
			}
			if (failed.length > 0) {
				setError(failed.map((f) => `${f.email}: ${f.reason}`).join(". "));
			} else if (created === 0) {
				setError(result.message || "No se pudo guardar los integrantes previstos");
			}
		} catch (err: any) {
			setError(err?.message || err?.response?.data?.message || "No se pudo guardar los integrantes previstos");
		} finally {
			setSubmitting(null);
		}
	};

	if (!activeTeam) {
		return <Alert severity="warning">Seleccioná un equipo para invitar integrantes</Alert>;
	}

	if (remainingSlots <= 0) {
		return (
			<Alert severity="info">
				Alcanzaste el límite de integrantes de tu plan ({maxTeamMembers}, contando previstos e invitados). Actualizá tu plan para agregar
				más.
			</Alert>
		);
	}

	const nothingTyped = invites.every((i) => !i.email.trim());

	return (
		<Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 } }}>
			<Typography variant="subtitle1" fontWeight={600} gutterBottom>
				Sumar integrantes
			</Typography>

			<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
				Podés sumar hasta {remainingSlots} integrante(s) más. <strong>Enviar invitaciones</strong> manda el correo ahora.{" "}
				<strong>Guardar como previstos</strong> los deja cargados sin avisarles: les asignás carpetas desde ya y les mandás la invitación
				cuando tengas todo listo.
			</Typography>

			{error && (
				<Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
					{error}
				</Alert>
			)}

			{success && (
				<Alert severity="success" sx={{ mb: 2 }} onClose={() => setSuccess(null)}>
					{success}
				</Alert>
			)}

			<Stack spacing={2}>
				{invites.map((invite, index) => (
					<Stack key={index} direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ xs: "stretch", sm: "center" }}>
						<TextField
							label="Nombre"
							value={invite.displayName}
							onChange={(e) => handleChange(index, { displayName: e.target.value })}
							size="small"
							placeholder="Ana Pérez"
							disabled={isSubmitting}
							inputProps={{ maxLength: 80 }}
							sx={{ minWidth: { sm: 170 } }}
						/>
						<TextField
							label="Email"
							type="email"
							value={invite.email}
							onChange={(e) => handleChange(index, { email: e.target.value })}
							size="small"
							fullWidth
							placeholder="colaborador@email.com"
							disabled={isSubmitting}
						/>

						<FormControl size="small" sx={{ minWidth: { sm: 140 } }}>
							<InputLabel>Rol</InputLabel>
							<Select
								value={invite.role}
								label="Rol"
								onChange={(e) => handleChange(index, { role: e.target.value as TeamRole })}
								disabled={isSubmitting}
								renderValue={(value) => ROLE_CONFIG[value as TeamRole]?.label || value}
							>
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

						{invites.length > 1 && (
							<IconButton
								size="small"
								onClick={() => handleRemoveInvite(index)}
								disabled={isSubmitting}
								color="error"
								sx={{ alignSelf: { xs: "flex-end", sm: "center" } }}
							>
								<CloseCircle size={18} />
							</IconButton>
						)}
					</Stack>
				))}

				<Stack direction={{ xs: "column", sm: "row" }} spacing={{ xs: 1, sm: 2 }} justifyContent="space-between">
					<Button
						variant="outlined"
						size="small"
						startIcon={<Add size={16} />}
						onClick={handleAddInvite}
						disabled={invites.length >= remainingSlots || isSubmitting}
					>
						Agregar otro
					</Button>

					<Stack direction={{ xs: "column", sm: "row" }} spacing={1}>
						<Tooltip title="Quedan cargados con nombre, correo y rol, sin enviarles nada. Les asignás carpetas y después mandás la invitación.">
							<span>
								<Button
									variant="outlined"
									startIcon={<UserAdd size={16} />}
									onClick={handleSaveDrafts}
									disabled={isSubmitting || nothingTyped}
									data-testid="team-save-drafts-btn"
								>
									{submitting === "draft" ? "Guardando..." : "Guardar como previstos"}
								</Button>
							</span>
						</Tooltip>
						<Button variant="contained" startIcon={<Send2 size={16} />} onClick={handleSubmit} disabled={isSubmitting || nothingTyped}>
							{submitting === "send" ? "Enviando..." : "Enviar invitaciones"}
						</Button>
					</Stack>
				</Stack>
			</Stack>
		</Paper>
	);
}

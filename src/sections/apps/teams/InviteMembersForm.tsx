// sections/apps/teams/InviteMembersForm.tsx
import { useState } from "react";
import {
  Box,
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
} from "@mui/material";
import { Add, CloseCircle, Send2 } from "iconsax-react";
import { useDispatch } from "store";
import { sendInvitations } from "store/reducers/teams";
import { TeamRole, ROLE_CONFIG, SendInvitationRequest } from "types/teams";
import { useTeam, useTeamsFeature } from "contexts/TeamContext";

interface InviteEntry {
  email: string;
  role: TeamRole;
}

interface InviteMembersFormProps {
  onSuccess?: () => void;
}

export default function InviteMembersForm({ onSuccess }: InviteMembersFormProps) {
  const dispatch = useDispatch();
  const { activeTeam, refreshActiveTeam } = useTeam();
  const { maxTeamMembers } = useTeamsFeature();

  const [invites, setInvites] = useState<InviteEntry[]>([{ email: "", role: "viewer" }]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState<string | null>(null);

  // Calculate remaining slots
  const currentMemberCount = activeTeam ? (activeTeam.members?.length || 0) + 1 : 0; // +1 for owner
  const pendingInvitesCount = activeTeam?.invitations?.filter((i) => i.status === "pending").length || 0;
  const remainingSlots = maxTeamMembers - currentMemberCount - pendingInvitesCount;

  const handleAddInvite = () => {
    if (invites.length < remainingSlots) {
      setInvites([...invites, { email: "", role: "viewer" }]);
    }
  };

  const handleRemoveInvite = (index: number) => {
    if (invites.length > 1) {
      setInvites(invites.filter((_, i) => i !== index));
    }
  };

  const handleEmailChange = (index: number, email: string) => {
    const updated = [...invites];
    updated[index].email = email;
    setInvites(updated);
  };

  const handleRoleChange = (index: number, role: TeamRole) => {
    const updated = [...invites];
    updated[index].role = role;
    setInvites(updated);
  };

  const validateEmail = (email: string): boolean => {
    const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
    return emailRegex.test(email);
  };

  const handleSubmit = async () => {
    if (!activeTeam) return;

    setError(null);
    setSuccess(null);

    // Validate emails
    const validInvites = invites.filter((inv) => inv.email.trim() !== "");

    if (validInvites.length === 0) {
      setError("Ingresa al menos un email");
      return;
    }

    const invalidEmails = validInvites.filter((inv) => !validateEmail(inv.email));
    if (invalidEmails.length > 0) {
      setError(`Email(s) inválido(s): ${invalidEmails.map((i) => i.email).join(", ")}`);
      return;
    }

    // Check for duplicates
    const emails = validInvites.map((i) => i.email.toLowerCase());
    const uniqueEmails = new Set(emails);
    if (uniqueEmails.size !== emails.length) {
      setError("Hay emails duplicados en la lista");
      return;
    }

    // Check if trying to invite the owner
    // ownerInfo tiene el email cuando está disponible, o puede estar en owner si está poblado
    const ownerEmail = (activeTeam.ownerInfo?.email || (activeTeam.owner as any)?.email)?.toLowerCase();
    if (ownerEmail) {
      const invitingOwner = validInvites.filter((i) => i.email.toLowerCase() === ownerEmail);
      if (invitingOwner.length > 0) {
        setError("No puedes invitar al propietario del equipo");
        return;
      }
    }

    // Check if already members or invited
    // Note: member.email puede estar directamente o en member.userId.email si viene poblado del backend
    const existingMembers = (activeTeam.members || []).map((m: any) => {
      const email = m.email || m.userId?.email;
      return email ? email.toLowerCase() : '';
    }).filter(Boolean);

    const existingInvites = (activeTeam.invitations || [])
      .filter((i) => i.status === "pending")
      .map((i) => i.email.toLowerCase());

    const alreadyMember = validInvites.filter((i) => existingMembers.includes(i.email.toLowerCase()));
    if (alreadyMember.length > 0) {
      setError(`Ya son miembros: ${alreadyMember.map((i) => i.email).join(", ")}`);
      return;
    }

    const alreadyInvited = validInvites.filter((i) => existingInvites.includes(i.email.toLowerCase()));
    if (alreadyInvited.length > 0) {
      setError(`Ya tienen invitación pendiente: ${alreadyInvited.map((i) => i.email).join(", ")}`);
      return;
    }

    setIsSubmitting(true);

    try {
      const invitationsData: SendInvitationRequest[] = validInvites.map((inv) => ({
        email: inv.email.trim().toLowerCase(),
        role: inv.role,
      }));

      const result = await dispatch(
        sendInvitations(activeTeam._id, { invitations: invitationsData }) as any
      );

      if (result.success) {
        // Check for partial success (some sent, some failed)
        const failedCount = result.results?.failed?.length || 0;
        const sentCount = result.results?.sent?.length || 0;

        if (failedCount > 0 && sentCount > 0) {
          // Partial success - show both success and warning
          setSuccess(`${sentCount} invitación(es) enviada(s) correctamente`);
          const failedReasons = result.results.failed.map((f: { email: string; reason: string }) =>
            `${f.email}: ${f.reason}`
          ).join(". ");
          setError(failedReasons);
        } else {
          setSuccess(`${sentCount} invitación(es) enviada(s) correctamente`);
        }
        setInvites([{ email: "", role: "viewer" }]);
        await refreshActiveTeam();
        onSuccess?.();
      } else {
        // Complete failure - show the error message
        setError(result.message || "Error al enviar invitaciones");
      }
    } catch (err: any) {
      // Try to extract meaningful error message
      const errorMessage = err?.message || err?.response?.data?.message || "Error al enviar invitaciones";
      setError(errorMessage);
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeTeam) {
    return (
      <Alert severity="warning">
        Selecciona un equipo para invitar miembros
      </Alert>
    );
  }

  if (remainingSlots <= 0) {
    return (
      <Alert severity="info">
        Has alcanzado el límite de miembros para tu plan ({maxTeamMembers} miembros).
        Actualiza tu plan para agregar más miembros.
      </Alert>
    );
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Typography variant="subtitle1" fontWeight={600} gutterBottom>
        Invitar Miembros
      </Typography>

      <Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
        Puedes invitar hasta {remainingSlots} miembro(s) más
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
          <Stack key={index} direction="row" spacing={1} alignItems="center">
            <TextField
              label="Email"
              type="email"
              value={invite.email}
              onChange={(e) => handleEmailChange(index, e.target.value)}
              size="small"
              fullWidth
              placeholder="colaborador@email.com"
              disabled={isSubmitting}
            />

            <FormControl size="small" sx={{ minWidth: 140 }}>
              <InputLabel>Rol</InputLabel>
              <Select
                value={invite.role}
                label="Rol"
                onChange={(e) => handleRoleChange(index, e.target.value as TeamRole)}
                disabled={isSubmitting}
                renderValue={(value) => ROLE_CONFIG[value as TeamRole]?.label || value}
              >
                <MenuItem value="editor">
                  <Chip
                    label={ROLE_CONFIG.editor.label}
                    color={ROLE_CONFIG.editor.color}
                    size="small"
                  />
                </MenuItem>
                <MenuItem value="viewer">
                  <Chip
                    label={ROLE_CONFIG.viewer.label}
                    color={ROLE_CONFIG.viewer.color}
                    size="small"
                  />
                </MenuItem>
              </Select>
            </FormControl>

            {invites.length > 1 && (
              <IconButton
                size="small"
                onClick={() => handleRemoveInvite(index)}
                disabled={isSubmitting}
                color="error"
              >
                <CloseCircle size={18} />
              </IconButton>
            )}
          </Stack>
        ))}

        <Stack direction="row" spacing={2} justifyContent="space-between">
          <Button
            variant="outlined"
            size="small"
            startIcon={<Add size={16} />}
            onClick={handleAddInvite}
            disabled={invites.length >= remainingSlots || isSubmitting}
          >
            Agregar otro
          </Button>

          <Button
            variant="contained"
            startIcon={<Send2 size={16} />}
            onClick={handleSubmit}
            disabled={isSubmitting || invites.every((i) => !i.email.trim())}
          >
            {isSubmitting ? "Enviando..." : "Enviar Invitaciones"}
          </Button>
        </Stack>
      </Stack>
    </Paper>
  );
}

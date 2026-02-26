// sections/apps/teams/TeamSettingsCard.tsx
import { useState, useEffect } from "react";
import {
  Paper,
  Typography,
  Stack,
  TextField,
  Button,
  Alert,
} from "@mui/material";
import { Setting2, TickCircle } from "iconsax-react";
import { useDispatch } from "store";
import { updateTeam } from "store/reducers/teams";
import { useTeam } from "contexts/TeamContext";

interface TeamSettingsCardProps {
  onUpdated?: () => void;
}

export default function TeamSettingsCard({ onUpdated }: TeamSettingsCardProps) {
  const dispatch = useDispatch();
  const { activeTeam, isAdmin, refreshActiveTeam } = useTeam();

  const [name, setName] = useState(activeTeam?.name || "");
  const [description, setDescription] = useState(activeTeam?.description || "");
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [success, setSuccess] = useState(false);

  // Sync state when activeTeam changes
  useEffect(() => {
    if (activeTeam) {
      setName(activeTeam.name || "");
      setDescription(activeTeam.description || "");
    }
  }, [activeTeam]);

  // Track if there are changes
  const hasChanges =
    name !== activeTeam?.name ||
    description !== (activeTeam?.description || "");

  const handleSave = async () => {
    if (!activeTeam) return;

    if (!name.trim()) {
      setError("El nombre del equipo es requerido");
      return;
    }

    setError(null);
    setSuccess(false);
    setIsSubmitting(true);

    try {
      const result = await dispatch(
        updateTeam(activeTeam._id, {
          name: name.trim(),
          description: description.trim() || undefined,
        }) as any
      );

      if (result.success) {
        setSuccess(true);
        await refreshActiveTeam();
        onUpdated?.();
        setTimeout(() => setSuccess(false), 3000);
      } else {
        setError(result.message || "Error al actualizar el equipo");
      }
    } catch (err) {
      setError("Error al actualizar el equipo");
    } finally {
      setIsSubmitting(false);
    }
  };

  if (!activeTeam || !isAdmin) {
    return null;
  }

  return (
    <Paper variant="outlined" sx={{ p: 2 }}>
      <Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 1.5 }}>
        <Setting2 size={18} />
        <Typography variant="subtitle2" fontWeight={600}>
          Editar Equipo
        </Typography>
      </Stack>

      <Stack spacing={1.5}>
        {error && (
          <Alert severity="error" onClose={() => setError(null)}>
            {error}
          </Alert>
        )}

        {success && (
          <Alert severity="success" onClose={() => setSuccess(false)}>
            Guardado
          </Alert>
        )}

        <TextField
          label="Nombre"
          value={name}
          onChange={(e) => setName(e.target.value)}
          fullWidth
          required
          disabled={isSubmitting}
          inputProps={{ maxLength: 50 }}
          size="small"
        />

        <TextField
          label="Descripción"
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          fullWidth
          disabled={isSubmitting}
          inputProps={{ maxLength: 200 }}
          size="small"
          placeholder="Opcional"
        />

        <Button
          variant="contained"
          size="small"
          startIcon={<TickCircle size={16} />}
          onClick={handleSave}
          disabled={isSubmitting || !hasChanges}
          fullWidth
        >
          {isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
      </Stack>
    </Paper>
  );
}

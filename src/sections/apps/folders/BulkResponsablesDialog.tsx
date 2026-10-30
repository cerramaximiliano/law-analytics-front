import React, { useEffect, useMemo, useState } from "react";
import {
	Autocomplete,
	Avatar,
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Stack,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";

import { dispatch } from "store";
import { BulkResponsablesMode, updateFoldersResponsablesBulk } from "store/reducers/folder";
import { openSnackbar } from "store/reducers/snackbar";
import { useTeam } from "contexts/TeamContext";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { getTeamAssignees, TeamAssignee } from "utils/teamAssignees";

interface Props {
	open: boolean;
	folderIds: string[];
	onClose: () => void;
	/** Se llama después de guardar con éxito (p. ej. para limpiar la selección). */
	onDone?: () => void;
	/**
	 * Edición de UNA carpeta desde la celda «Responsable» del listado: precarga sus
	 * responsables actuales y reemplaza (asignar, cambiar o quitar con un clic).
	 */
	single?: { folderName?: string; responsables: string[] };
}

const MODE_OPTIONS: { value: BulkResponsablesMode; label: string; help: string }[] = [
	{ value: "replace", label: "Reemplazar", help: "Las carpetas quedan solo con los integrantes elegidos." },
	{ value: "add", label: "Agregar", help: "Suma los integrantes elegidos a los responsables que ya tienen." },
	{ value: "remove", label: "Quitar", help: "Saca a los integrantes elegidos de los responsables." },
];

const MAX_FOLDERS = 500;

const notify = (message: string, color: "success" | "error") =>
	dispatch(openSnackbar({ open: true, message, variant: "alert", alert: { color }, close: true }));

// Asignación masiva de responsables desde el listado de carpetas (solo modo equipo).
const BulkResponsablesDialog = ({ open, folderIds, onClose, onDone, single }: Props) => {
	const { activeTeam, getRequestHeaders } = useTeam();
	const assignableMembers = useMemo(() => getTeamAssignees(activeTeam), [activeTeam]);

	const [selected, setSelected] = useState<TeamAssignee[]>([]);
	const [mode, setMode] = useState<BulkResponsablesMode>("replace");
	const [saving, setSaving] = useState(false);

	useEffect(() => {
		if (open) {
			const current = single ? assignableMembers.filter((a) => single.responsables.includes(a.id)) : [];
			setSelected(current);
			setMode("replace");
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	const count = folderIds.length;
	const tooMany = count > MAX_FOLDERS;
	// «Reemplazar» sin nadie elegido deja las carpetas sin responsable (válido); «Agregar» y «Quitar» necesitan a alguien.
	const canSave = count > 0 && !tooMany && (mode === "replace" || selected.length > 0);
	const modeHelp = MODE_OPTIONS.find((o) => o.value === mode)?.help;

	const handleSave = async () => {
		if (!canSave) return;
		setSaving(true);
		const result = await dispatch(
			updateFoldersResponsablesBulk(
				folderIds,
				selected.map((a) => a.id),
				mode,
				getRequestHeaders(),
			),
		);
		setSaving(false);
		if (result.success) {
			notify(result.modified === 1 ? "Se actualizó 1 carpeta" : `Se actualizaron ${result.modified} carpetas`, "success");
			onDone?.();
			onClose();
		} else {
			notify(result.message, "error");
		}
	};

	return (
		<Dialog open={open} onClose={() => !saving && onClose()} fullWidth maxWidth="sm">
			<DialogTitle>{single ? "Responsables de la carpeta" : "Asignar responsable"}</DialogTitle>
			<DialogContent>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
					{single
						? `${
								single.folderName ? `«${single.folderName}». ` : ""
						  }Elegí uno o más integrantes, cambiá los actuales o quitá todos para dejarla sin responsable.`
						: `${count === 1 ? "1 carpeta seleccionada." : `${count} carpetas seleccionadas.`}`}{" "}
					Los responsables reciben los avisos de la carpeta cuando la regla es «Solo responsables», y la ven en «Mis carpetas».
				</Typography>
				{tooMany && (
					<Typography variant="body2" color="error" sx={{ mb: 2 }}>
						Podés asignar hasta {MAX_FOLDERS} carpetas por vez.
					</Typography>
				)}

				<Stack spacing={2}>
					<Box>
						{!single && (
							<ToggleButtonGroup
								exclusive
								size="small"
								value={mode}
								onChange={(_e, next: BulkResponsablesMode | null) => next && setMode(next)}
								aria-label="Modo de asignación"
								sx={{
									"& .MuiToggleButton-root": {
										textTransform: "none",
										fontSize: "0.78rem",
										fontWeight: 600,
										px: 1.5,
										py: 0.5,
										"&.Mui-selected": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, 0.08) },
									},
								}}
							>
								{MODE_OPTIONS.map((o) => (
									<ToggleButton key={o.value} value={o.value}>
										{o.label}
									</ToggleButton>
								))}
							</ToggleButtonGroup>
						)}
						{!single && modeHelp && (
							<Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.75 }}>
								{modeHelp}
							</Typography>
						)}
					</Box>

					<Autocomplete<TeamAssignee, true>
						multiple
						fullWidth
						options={assignableMembers}
						value={selected}
						onChange={(_event, newValue) => setSelected(newValue)}
						isOptionEqualToValue={(option, value) => option.id === value.id}
						getOptionLabel={(option) => option.name}
						filterSelectedOptions
						noOptionsText="No hay miembros para asignar"
						renderOption={(props, option) => (
							<Box component="li" {...props} key={option.id}>
								<Stack direction="row" spacing={1} alignItems="center">
									<Avatar src={option.avatar} sx={{ width: 26, height: 26, fontSize: "0.65rem", fontWeight: 700 }}>
										{option.initials}
									</Avatar>
									<Stack spacing={0}>
										<Typography variant="body2">
											{option.name}
											{option.isOwner ? " · Propietario" : ""}
										</Typography>
										{option.email && option.email !== option.name && (
											<Typography variant="caption" color="text.secondary">
												{option.email}
											</Typography>
										)}
									</Stack>
								</Stack>
							</Box>
						)}
						renderTags={(tagValue, getTagProps) =>
							tagValue.map((option, index) => (
								<Chip
									{...getTagProps({ index })}
									key={option.id}
									size="small"
									label={option.name}
									avatar={
										<Avatar src={option.avatar} sx={{ fontSize: "0.6rem", fontWeight: 700 }}>
											{option.initials}
										</Avatar>
									}
								/>
							))
						}
						renderInput={(params) => (
							<TextField
								{...params}
								placeholder={
									selected.length > 0 ? "" : mode === "replace" ? "Sin responsable (elegí uno o más miembros)" : "Elegí uno o más miembros"
								}
							/>
						)}
					/>
				</Stack>
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2 }}>
				<Button onClick={onClose} disabled={saving} sx={{ textTransform: "none", color: "text.secondary" }}>
					Cancelar
				</Button>
				<Button
					variant="contained"
					onClick={handleSave}
					disabled={saving || !canSave}
					sx={{ textTransform: "none", bgcolor: BRAND_BLUE, boxShadow: "none", "&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88) } }}
				>
					{saving ? "Guardando…" : "Guardar"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default BulkResponsablesDialog;

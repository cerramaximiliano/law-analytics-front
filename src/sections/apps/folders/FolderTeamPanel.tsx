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
	MenuItem,
	Select,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Edit2, InfoCircle } from "iconsax-react";

import { dispatch } from "store";
import { updateFolderNotificationPolicy, updateFolderResponsables } from "store/reducers/folder";
import { openSnackbar } from "store/reducers/snackbar";
import { useTeam } from "contexts/TeamContext";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { getTeamAssignees, resolveAssignees, TeamAssignee } from "utils/teamAssignees";
import TaskAssignees from "sections/apps/tasks/TaskAssignees";
import { FolderNotificationPolicy } from "types/folder";

export const FOLDER_POLICY_OPTIONS: { value: FolderNotificationPolicy; label: string; help: string }[] = [
	{ value: "equipo", label: "Según el equipo", help: "Sigue la regla por defecto del equipo (Mi equipo → Avisos del equipo)." },
	{
		value: "responsables",
		label: "Solo responsables",
		help: "Avisa solo a los responsables de la carpeta. Si no tiene responsables, avisa a todos.",
	},
	{ value: "todos", label: "Todos", help: "Avisa a todos los integrantes del equipo." },
];

interface Props {
	folderId: string;
	responsables?: string[];
	notificationPolicy?: FolderNotificationPolicy;
}

const notify = (message: string, color: "success" | "error") =>
	dispatch(
		openSnackbar({
			open: true,
			message,
			variant: "alert",
			alert: { color },
			close: true,
		}),
	);

// Bloque compacto del detalle de carpeta (solo modo equipo): responsables y regla de avisos.
const FolderTeamPanel = ({ folderId, responsables, notificationPolicy }: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { activeTeam, userRole, isAdmin, getRequestHeaders } = useTeam();

	const canEditResponsables = userRole === "owner" || userRole === "admin" || userRole === "editor";
	const canEditPolicy = isAdmin;

	const assignableMembers = useMemo(() => getTeamAssignees(activeTeam), [activeTeam]);
	const currentIds = useMemo(() => responsables || [], [responsables]);
	const policy: FolderNotificationPolicy = notificationPolicy || "equipo";
	const policyOption = FOLDER_POLICY_OPTIONS.find((o) => o.value === policy) || FOLDER_POLICY_OPTIONS[0];

	const [editOpen, setEditOpen] = useState(false);
	const [draft, setDraft] = useState<string[]>(currentIds);
	const [savingResponsables, setSavingResponsables] = useState(false);
	const [savingPolicy, setSavingPolicy] = useState(false);

	useEffect(() => {
		if (editOpen) setDraft(currentIds);
	}, [editOpen, currentIds]);

	const selectedAssignees = useMemo(() => resolveAssignees(draft, assignableMembers), [draft, assignableMembers]);

	const handleSaveResponsables = async () => {
		setSavingResponsables(true);
		const result = await dispatch(updateFolderResponsables(folderId, draft, getRequestHeaders()));
		setSavingResponsables(false);
		if (result.success) {
			setEditOpen(false);
			notify("Responsables actualizados", "success");
		} else {
			notify(result.message, "error");
		}
	};

	const handlePolicyChange = async (next: FolderNotificationPolicy) => {
		if (next === policy) return;
		setSavingPolicy(true);
		const result = await dispatch(updateFolderNotificationPolicy(folderId, next, getRequestHeaders()));
		setSavingPolicy(false);
		if (result.success) {
			notify("Regla de avisos actualizada", "success");
		} else {
			notify(result.message, "error");
		}
	};

	const labelSx = {
		fontSize: "0.68rem",
		fontWeight: 600,
		letterSpacing: "0.08em",
		textTransform: "uppercase",
		color: "text.secondary",
		whiteSpace: "nowrap",
	} as const;

	return (
		<Box
			sx={{
				px: { xs: 1.5, sm: 2 },
				py: 1.25,
				borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
			}}
			data-testid="folder-team-panel"
		>
			<Stack direction={{ xs: "column", md: "row" }} spacing={{ xs: 1.25, md: 3 }} alignItems={{ xs: "flex-start", md: "center" }}>
				<Stack direction="row" spacing={1.25} alignItems="center" sx={{ minWidth: 0, flexWrap: "wrap" }} useFlexGap>
					<Typography sx={labelSx}>Responsables</Typography>
					<TaskAssignees ids={currentIds} variant="chips" emptyLabel="Sin responsable" />
					{canEditResponsables && (
						<Button
							size="small"
							startIcon={<Edit2 size={14} />}
							onClick={() => setEditOpen(true)}
							sx={{ textTransform: "none", fontWeight: 600, fontSize: "0.75rem", color: BRAND_BLUE, minWidth: 0, px: 1 }}
						>
							Editar
						</Button>
					)}
				</Stack>

				<Stack direction="row" spacing={1.25} alignItems="center">
					<Typography sx={labelSx}>Avisos de esta carpeta</Typography>
					{canEditPolicy ? (
						<Select
							size="small"
							value={policy}
							disabled={savingPolicy}
							onChange={(e) => handlePolicyChange(e.target.value as FolderNotificationPolicy)}
							sx={{ minWidth: 180, "& .MuiSelect-select": { py: "5px", fontSize: "0.8rem", fontWeight: 500 } }}
							inputProps={{ "aria-label": "Avisos de esta carpeta" }}
						>
							{FOLDER_POLICY_OPTIONS.map((o) => (
								<MenuItem key={o.value} value={o.value}>
									{o.label}
								</MenuItem>
							))}
						</Select>
					) : (
						<Typography sx={{ fontSize: "0.82rem", fontWeight: 500 }}>{policyOption.label}</Typography>
					)}
					<Tooltip
						title={
							<Box>
								{FOLDER_POLICY_OPTIONS.map((o) => (
									<Typography key={o.value} variant="caption" component="div" sx={{ mb: 0.5 }}>
										<b>{o.label}:</b> {o.help}
									</Typography>
								))}
								<Typography variant="caption" component="div">
									Rige los avisos de movimientos, cédulas y eventos del calendario de esta carpeta.
								</Typography>
							</Box>
						}
					>
						<Box component="span" sx={{ display: "inline-flex", color: "text.secondary", cursor: "help" }}>
							<InfoCircle size={16} />
						</Box>
					</Tooltip>
				</Stack>
			</Stack>

			<Dialog open={editOpen} onClose={() => !savingResponsables && setEditOpen(false)} fullWidth maxWidth="sm">
				<DialogTitle>Responsables de la carpeta</DialogTitle>
				<DialogContent>
					<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
						Los responsables reciben los avisos de la carpeta cuando la regla es «Solo responsables», y la ven en «Mis carpetas».
					</Typography>
					<Autocomplete<TeamAssignee, true>
						multiple
						fullWidth
						options={assignableMembers}
						value={selectedAssignees}
						onChange={(_event, newValue) => setDraft(newValue.map((a) => a.id))}
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
							<TextField {...params} placeholder={selectedAssignees.length === 0 ? "Sin responsable (elegí uno o más miembros)" : ""} />
						)}
					/>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={() => setEditOpen(false)} disabled={savingResponsables} sx={{ textTransform: "none", color: "text.secondary" }}>
						Cancelar
					</Button>
					<Button
						variant="contained"
						onClick={handleSaveResponsables}
						disabled={savingResponsables}
						sx={{ textTransform: "none", bgcolor: BRAND_BLUE, boxShadow: "none", "&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88) } }}
					>
						{savingResponsables ? "Guardando…" : "Guardar"}
					</Button>
				</DialogActions>
			</Dialog>
		</Box>
	);
};

export default FolderTeamPanel;

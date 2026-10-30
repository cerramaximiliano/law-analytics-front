// sections/apps/teams/TeamVisibilityCard.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import axios from "axios";
import {
	Alert,
	Avatar,
	Box,
	Button,
	FormControlLabel,
	MenuItem,
	Paper,
	Radio,
	RadioGroup,
	Select,
	Skeleton,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Eye, TickCircle } from "iconsax-react";

import { useDispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { useTeam } from "contexts/TeamContext";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { getTeamAssignees } from "utils/teamAssignees";

export type TeamVisibilityMode = "todo" | "propio";

interface VisibilitySettings {
	defaultMode: TeamVisibilityMode;
	members: { userId: string; mode: TeamVisibilityMode }[];
}

const MODE_OPTIONS: { value: TeamVisibilityMode; label: string }[] = [
	{ value: "todo", label: "Todo el equipo" },
	{ value: "propio", label: "Solo lo suyo" },
];

const DEFAULT_OPTIONS: { value: TeamVisibilityMode; label: string }[] = [
	{ value: "todo", label: "Todos ven todo" },
	{ value: "propio", label: "Cada integrante ve solo lo suyo" },
];

const apiError = (error: unknown, fallback: string) =>
	axios.isAxiosError(error) ? error.response?.data?.message || error.response?.data?.error || fallback : fallback;

// Tarjeta «Qué ve cada integrante» en Mi equipo. «Lo suyo»: carpetas donde es responsable o
// que creó, tareas asignadas o creadas por él (o de esas carpetas) y eventos que creó o de
// esas carpetas. El propietario y los administradores siempre ven todo. Owner/admin editan.
export default function TeamVisibilityCard() {
	const dispatch = useDispatch();
	const { activeTeam, isAdmin } = useTeam();
	const groupId = activeTeam?._id;

	const assignees = useMemo(() => getTeamAssignees(activeTeam), [activeTeam]);
	// Rol de cada miembro activo (los administradores no se configuran: ven todo).
	const roleById = useMemo(() => {
		const map = new Map<string, string>();
		for (const m of (activeTeam?.members || []) as any[]) {
			const id = typeof m.userId === "object" && m.userId ? m.userId._id : m.userId;
			if (id && m.status === "active") map.set(String(id), m.role);
		}
		return map;
	}, [activeTeam]);
	const alwaysAll = useCallback((a: { id: string; isOwner: boolean }) => a.isOwner || roleById.get(a.id) === "admin", [roleById]);

	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState<VisibilitySettings | null>(null);
	const [defaultMode, setDefaultMode] = useState<TeamVisibilityMode>("todo");
	const [modes, setModes] = useState<Record<string, TeamVisibilityMode>>({});

	const applySettings = useCallback((settings: VisibilitySettings) => {
		setSaved(settings);
		setDefaultMode(settings.defaultMode || "todo");
		const next: Record<string, TeamVisibilityMode> = {};
		for (const m of settings.members || []) next[String(m.userId)] = m.mode;
		setModes(next);
	}, []);

	useEffect(() => {
		if (!groupId) return;
		let cancelled = false;
		setLoading(true);
		setLoadError(null);
		axios
			.get(`${import.meta.env.VITE_BASE_URL}/api/groups/${groupId}/visibility-settings`, { headers: { "X-Group-Id": groupId } })
			.then((response) => {
				if (cancelled) return;
				if (response.data?.success && response.data.settings) applySettings(response.data.settings);
				else setLoadError("No se pudo cargar la visibilidad del equipo");
			})
			.catch((error) => {
				if (!cancelled) setLoadError(apiError(error, "No se pudo cargar la visibilidad del equipo"));
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [groupId, applySettings]);

	// Modo efectivo: excepción del integrante o la regla del equipo.
	const modeOf = (id: string): TeamVisibilityMode => modes[id] || defaultMode;

	// Se mandan como excepción solo quienes difieren de la regla del equipo.
	const membersPayload = useMemo(
		() =>
			assignees
				.filter((a) => !alwaysAll(a) && modes[a.id] && modes[a.id] !== defaultMode)
				.map((a) => ({ userId: a.id, mode: modes[a.id] })),
		[assignees, modes, defaultMode, alwaysAll],
	);

	const hasChanges = useMemo(() => {
		if (!saved) return false;
		if ((saved.defaultMode || "todo") !== defaultMode) return true;
		const savedMap = new Map((saved.members || []).map((m) => [String(m.userId), m.mode]));
		return assignees.some((a) => !alwaysAll(a) && (savedMap.get(a.id) || saved.defaultMode || "todo") !== (modes[a.id] || defaultMode));
	}, [saved, defaultMode, modes, assignees, alwaysAll]);

	const handleSave = async () => {
		if (!groupId) return;
		setSaving(true);
		try {
			const response = await axios.put(
				`${import.meta.env.VITE_BASE_URL}/api/groups/${groupId}/visibility-settings`,
				{ defaultMode, members: membersPayload },
				{ headers: { "X-Group-Id": groupId } },
			);
			if (response.data?.success && response.data.settings) {
				applySettings(response.data.settings);
				dispatch(
					openSnackbar({
						open: true,
						message: "Visibilidad del equipo guardada",
						variant: "alert",
						alert: { color: "success" },
						close: true,
					}),
				);
			} else {
				throw new Error(response.data?.message || "No se pudo guardar la visibilidad del equipo");
			}
		} catch (error) {
			const message =
				error instanceof Error && !axios.isAxiosError(error)
					? error.message
					: apiError(error, "No se pudo guardar la visibilidad del equipo");
			dispatch(openSnackbar({ open: true, message, variant: "alert", alert: { color: "error" }, close: true }));
		} finally {
			setSaving(false);
		}
	};

	if (!activeTeam) return null;

	const headCellSx = {
		fontSize: "0.7rem",
		fontWeight: 600,
		letterSpacing: "0.08em",
		textTransform: "uppercase",
		color: "text.secondary",
	} as const;

	return (
		<Paper variant="outlined" sx={{ p: 2, borderRadius: 2, borderColor: alpha(BRAND_BLUE, 0.14) }}>
			<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
				<Eye size={18} />
				<Typography variant="subtitle2" fontWeight={600}>
					Qué ve cada integrante
				</Typography>
			</Stack>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
				«Solo lo suyo» muestra las carpetas donde es responsable o que creó, sus tareas (asignadas o creadas por él, o de esas carpetas) y
				los eventos que creó o de esas carpetas. Tampoco recibe avisos de las carpetas que no ve. El propietario y los administradores
				siempre ven todo.
			</Typography>

			{loading ? (
				<Stack spacing={1}>
					<Skeleton variant="text" width={260} />
					<Skeleton variant="rounded" height={120} />
				</Stack>
			) : loadError ? (
				<Alert severity="error">{loadError}</Alert>
			) : (
				<Stack spacing={2}>
					<Box>
						<Typography sx={{ ...headCellSx, mb: 0.5 }}>Regla del equipo</Typography>
						{isAdmin ? (
							<RadioGroup row value={defaultMode} onChange={(e) => setDefaultMode(e.target.value as TeamVisibilityMode)}>
								{DEFAULT_OPTIONS.map((o) => (
									<FormControlLabel
										key={o.value}
										value={o.value}
										control={<Radio size="small" />}
										label={<Typography variant="body2">{o.label}</Typography>}
										disabled={saving}
									/>
								))}
							</RadioGroup>
						) : (
							<Typography variant="body2" fontWeight={500}>
								{DEFAULT_OPTIONS.find((o) => o.value === defaultMode)?.label}
							</Typography>
						)}
					</Box>

					<Box>
						<Typography sx={{ ...headCellSx, mb: 0.5 }}>Por integrante</Typography>
						<TableContainer>
							<Table size="small">
								<TableHead>
									<TableRow>
										<TableCell sx={headCellSx}>Integrante</TableCell>
										<TableCell sx={headCellSx}>Ve</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{assignees.map((a) => (
										<TableRow key={a.id}>
											<TableCell>
												<Stack direction="row" alignItems="center" spacing={1.5}>
													<Avatar src={a.avatar} sx={{ width: 32, height: 32, fontSize: "0.75rem", fontWeight: 700 }}>
														{a.initials}
													</Avatar>
													<Box sx={{ minWidth: 0 }}>
														<Typography variant="body2" fontWeight={500} noWrap>
															{a.name}
															{a.isOwner ? " · Propietario" : roleById.get(a.id) === "admin" ? " · Administrador" : ""}
														</Typography>
														{a.email && a.email !== a.name && (
															<Typography variant="caption" color="text.secondary" noWrap component="div">
																{a.email}
															</Typography>
														)}
													</Box>
												</Stack>
											</TableCell>
											<TableCell sx={{ width: { sm: 220 } }}>
												{alwaysAll(a) ? (
													<Typography variant="body2" color="text.secondary">
														Todo (administra)
													</Typography>
												) : isAdmin ? (
													<Select
														size="small"
														fullWidth
														value={modeOf(a.id)}
														disabled={saving}
														onChange={(e) => setModes((prev) => ({ ...prev, [a.id]: e.target.value as TeamVisibilityMode }))}
														inputProps={{ "aria-label": `Qué ve ${a.name}` }}
														sx={{ "& .MuiSelect-select": { py: "6px", fontSize: "0.82rem" } }}
													>
														{MODE_OPTIONS.map((o) => (
															<MenuItem key={o.value} value={o.value}>
																{o.label}
															</MenuItem>
														))}
													</Select>
												) : (
													<Typography variant="body2">{MODE_OPTIONS.find((o) => o.value === modeOf(a.id))?.label}</Typography>
												)}
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					</Box>

					{isAdmin && (
						<Stack direction="row" justifyContent="flex-end">
							<Button
								variant="contained"
								size="small"
								startIcon={<TickCircle size={16} />}
								onClick={handleSave}
								disabled={saving || !hasChanges}
							>
								{saving ? "Guardando..." : "Guardar"}
							</Button>
						</Stack>
					)}
				</Stack>
			)}
		</Paper>
	);
}

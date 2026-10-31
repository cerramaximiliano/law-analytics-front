// sections/apps/teams/TeamNotificationsCard.tsx
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
import { Notification, TickCircle } from "iconsax-react";

import { useDispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { useTeam } from "contexts/TeamContext";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { getTeamAssignees } from "utils/teamAssignees";
import { stackedTableSx, wrapOnMobileSx } from "./stackedTableSx";

export type TeamDefaultPolicy = "todos" | "responsables";
export type TeamMemberNotificationMode = "segun_carpeta" | "todo" | "solo_lo_mio";

interface NotificationSettings {
	defaultPolicy: TeamDefaultPolicy;
	members: { userId: string; mode: TeamMemberNotificationMode }[];
}

const DEFAULT_POLICY_OPTIONS: { value: TeamDefaultPolicy; label: string }[] = [
	{ value: "todos", label: "Todos los integrantes" },
	{ value: "responsables", label: "Solo los responsables de cada carpeta" },
];

const MODE_OPTIONS: { value: TeamMemberNotificationMode; label: string }[] = [
	{ value: "segun_carpeta", label: "Según cada carpeta" },
	{ value: "todo", label: "Todo" },
	{ value: "solo_lo_mio", label: "Solo lo mío" },
];

const modeLabel = (mode: TeamMemberNotificationMode) => MODE_OPTIONS.find((o) => o.value === mode)?.label || "Según cada carpeta";

const apiError = (error: unknown, fallback: string) =>
	axios.isAxiosError(error) ? error.response?.data?.message || error.response?.data?.error || fallback : fallback;

// Tarjeta «Avisos del equipo» en Mi equipo: regla por defecto de las carpetas y modo de
// avisos de cada integrante. Owner/admin editan; el resto la ve en solo lectura.
export default function TeamNotificationsCard() {
	const dispatch = useDispatch();
	const { activeTeam, isAdmin } = useTeam();
	const groupId = activeTeam?._id;

	const assignees = useMemo(() => getTeamAssignees(activeTeam), [activeTeam]);

	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [saving, setSaving] = useState(false);
	const [saved, setSaved] = useState<NotificationSettings | null>(null);
	const [defaultPolicy, setDefaultPolicy] = useState<TeamDefaultPolicy>("todos");
	const [modes, setModes] = useState<Record<string, TeamMemberNotificationMode>>({});

	const applySettings = useCallback((settings: NotificationSettings) => {
		setSaved(settings);
		setDefaultPolicy(settings.defaultPolicy || "todos");
		const next: Record<string, TeamMemberNotificationMode> = {};
		for (const m of settings.members || []) next[String(m.userId)] = m.mode;
		setModes(next);
	}, []);

	useEffect(() => {
		if (!groupId) return;
		let cancelled = false;
		setLoading(true);
		setLoadError(null);
		axios
			.get(`${import.meta.env.VITE_BASE_URL}/api/groups/${groupId}/notification-settings`, { headers: { "X-Group-Id": groupId } })
			.then((response) => {
				if (cancelled) return;
				if (response.data?.success && response.data.settings) {
					applySettings(response.data.settings);
				} else {
					setLoadError("No se pudo cargar la configuración de avisos");
				}
			})
			.catch((error) => {
				if (!cancelled) setLoadError(apiError(error, "No se pudo cargar la configuración de avisos"));
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
	}, [groupId, applySettings]);

	const modeOf = (userId: string): TeamMemberNotificationMode => modes[userId] || "segun_carpeta";

	// Lista que se manda: solo quienes no están en «Según cada carpeta» (y siguen en el equipo).
	const membersPayload = useMemo(
		() =>
			assignees
				.filter((a) => (modes[a.id] || "segun_carpeta") !== "segun_carpeta")
				.map((a) => ({ userId: a.id, mode: modes[a.id] as TeamMemberNotificationMode })),
		[assignees, modes],
	);

	const hasChanges = useMemo(() => {
		if (!saved) return false;
		if ((saved.defaultPolicy || "todos") !== defaultPolicy) return true;
		const savedMap = new Map((saved.members || []).map((m) => [String(m.userId), m.mode]));
		return assignees.some((a) => (savedMap.get(a.id) || "segun_carpeta") !== (modes[a.id] || "segun_carpeta"));
	}, [saved, defaultPolicy, modes, assignees]);

	const handleSave = async () => {
		if (!groupId) return;
		setSaving(true);
		try {
			const response = await axios.put(
				`${import.meta.env.VITE_BASE_URL}/api/groups/${groupId}/notification-settings`,
				{ defaultPolicy, members: membersPayload },
				{ headers: { "X-Group-Id": groupId } },
			);
			if (response.data?.success && response.data.settings) {
				applySettings(response.data.settings);
				dispatch(
					openSnackbar({ open: true, message: "Avisos del equipo guardados", variant: "alert", alert: { color: "success" }, close: true }),
				);
			} else {
				throw new Error(response.data?.message || "No se pudieron guardar los avisos del equipo");
			}
		} catch (error) {
			const message =
				error instanceof Error && !axios.isAxiosError(error)
					? error.message
					: apiError(error, "No se pudieron guardar los avisos del equipo");
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
		<Paper variant="outlined" sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, borderColor: alpha(BRAND_BLUE, 0.14) }}>
			<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
				<Notification size={18} />
				<Typography variant="subtitle2" fontWeight={600}>
					Avisos del equipo
				</Typography>
			</Stack>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
				Define quién recibe los avisos de movimientos, cédulas y eventos del calendario de cada carpeta. Cada carpeta puede seguir esta
				regla o tener la suya («Solo responsables» o «Todos»). Las tareas avisan a sus responsables y, si no tienen, a quien las creó.
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
						<Typography sx={{ ...headCellSx, mb: 0.5 }}>Regla por defecto de las carpetas</Typography>
						{isAdmin ? (
							<RadioGroup row value={defaultPolicy} onChange={(e) => setDefaultPolicy(e.target.value as TeamDefaultPolicy)}>
								{DEFAULT_POLICY_OPTIONS.map((o) => (
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
								{DEFAULT_POLICY_OPTIONS.find((o) => o.value === defaultPolicy)?.label}
							</Typography>
						)}
					</Box>

					<Box>
						<Typography sx={{ ...headCellSx, mb: 0.5 }}>Por integrante</Typography>
						<Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 1 }}>
							«Según cada carpeta» sigue la regla de la carpeta. «Todo» recibe todos los avisos. «Solo lo mío» recibe solo los de las
							carpetas donde es responsable.
						</Typography>
						<TableContainer>
							<Table size="small" sx={stackedTableSx}>
								<TableHead>
									<TableRow>
										<TableCell sx={headCellSx}>Integrante</TableCell>
										<TableCell sx={headCellSx}>Avisos</TableCell>
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
														<Typography variant="body2" fontWeight={500} noWrap sx={wrapOnMobileSx}>
															{a.name}
															{a.isOwner ? " · Propietario" : ""}
														</Typography>
														{a.email && a.email !== a.name && (
															<Typography variant="caption" color="text.secondary" noWrap component="div" sx={wrapOnMobileSx}>
																{a.email}
															</Typography>
														)}
													</Box>
												</Stack>
											</TableCell>
											<TableCell sx={{ width: { sm: 220 } }}>
												{isAdmin ? (
													<Select
														size="small"
														fullWidth
														value={modeOf(a.id)}
														disabled={saving}
														onChange={(e) => setModes((prev) => ({ ...prev, [a.id]: e.target.value as TeamMemberNotificationMode }))}
														inputProps={{ "aria-label": `Avisos de ${a.name}` }}
														sx={{ "& .MuiSelect-select": { py: "6px", fontSize: "0.82rem" } }}
													>
														{MODE_OPTIONS.map((o) => (
															<MenuItem key={o.value} value={o.value}>
																{o.label}
															</MenuItem>
														))}
													</Select>
												) : (
													<Typography variant="body2">{modeLabel(modeOf(a.id))}</Typography>
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

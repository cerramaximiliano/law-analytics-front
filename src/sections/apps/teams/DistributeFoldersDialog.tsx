// sections/apps/teams/DistributeFoldersDialog.tsx
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Alert,
	Autocomplete,
	Avatar,
	Box,
	Button,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormControlLabel,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	Skeleton,
	Stack,
	Step,
	StepLabel,
	Stepper,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	TextField,
	ToggleButton,
	ToggleButtonGroup,
	Tooltip,
	Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { Refresh, Shuffle } from "iconsax-react";
import { useNavigate } from "react-router-dom";

import { useTeam } from "contexts/TeamContext";
import { distributeFolderResponsables, fetchRadicacionSummary } from "store/reducers/folder";
import { BRAND_BLUE } from "themes/dashboardTokens";
import {
	DistributeArchivedScope,
	DistributeCriteriaType,
	DistributeMode,
	DistributeOrder,
	DistributePreview,
	RadicacionSummary,
} from "types/folderDistribute";
import {
	ARCHIVED_OPTIONS,
	buildDistributeRequest,
	CRITERIA_OPTIONS,
	CriteriaRow,
	DistributeWizardState,
	fueroRows,
	initialWizardState,
	isMapCriteria,
	joinRadicacion,
	juzgadoRows,
	MAP_LABELS,
	MAX_DISTRIBUTE_FOLDERS,
	newSeed,
	ORDER_OPTIONS,
	previewRows,
	radicacionFilterOptions,
	salaRows,
	splitKeysEqually,
	splitRadicacion,
	ubicacionRows,
} from "utils/folderDistribute";
import { trackActivity } from "utils/productAnalytics";
import { assigneeTag, getTeamAssignees, TeamAssignee } from "utils/teamAssignees";

interface Props {
	open: boolean;
	onClose: () => void;
	/** Selección del listado: el reparto se limita a estas carpetas (cualquier estado). */
	folderIds?: string[];
	/** Se llama después de aplicar (para recargar el listado o la distribución). */
	onApplied?: (modified: number) => void;
}

const STEPS = ["Alcance", "Criterio", "Vista previa", "Resultado"];
const nf = (n: number) => n.toLocaleString("es-AR");

const toggleSx = {
	"& .MuiToggleButton-root": {
		textTransform: "none",
		fontSize: "0.78rem",
		fontWeight: 600,
		px: 1.5,
		py: 0.5,
		"&.Mui-selected": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, 0.08) },
	},
} as const;

const primarySx = {
	textTransform: "none",
	bgcolor: BRAND_BLUE,
	boxShadow: "none",
	"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88) },
} as const;

/** Selector de responsables (integrantes, previstos e invitados) con chips. */
function AssigneePicker({
	options,
	value,
	onChange,
	placeholder,
	size = "medium",
	multiple = true,
}: {
	options: TeamAssignee[];
	value: TeamAssignee[];
	onChange: (next: TeamAssignee[]) => void;
	placeholder?: string;
	size?: "small" | "medium";
	multiple?: boolean;
}) {
	return (
		<Autocomplete<TeamAssignee, true>
			multiple
			fullWidth
			size={size}
			options={options}
			value={value}
			onChange={(_e, next) => onChange(multiple ? next : next.slice(-1))}
			isOptionEqualToValue={(o, v) => o.id === v.id}
			getOptionLabel={(o) => o.name}
			filterSelectedOptions
			noOptionsText="No hay integrantes para asignar"
			renderOption={(props, option) => (
				<Box component="li" {...props} key={option.id}>
					<Stack direction="row" spacing={1} alignItems="center">
						<Avatar src={option.avatar} sx={{ width: 24, height: 24, fontSize: "0.62rem", fontWeight: 700 }}>
							{option.initials}
						</Avatar>
						<Typography variant="body2">
							{option.name}
							{option.isOwner ? " · Propietario" : ""}
							{assigneeTag(option) ? ` · ${assigneeTag(option)}` : ""}
						</Typography>
					</Stack>
				</Box>
			)}
			renderTags={(tagValue, getTagProps) =>
				tagValue.map((option, index) => (
					<Chip
						{...getTagProps({ index })}
						key={option.id}
						size="small"
						label={assigneeTag(option) ? `${option.name} (${assigneeTag(option)})` : option.name}
						variant={assigneeTag(option) ? "outlined" : "filled"}
						avatar={
							<Avatar src={option.avatar} sx={{ fontSize: "0.6rem", fontWeight: 700 }}>
								{option.initials}
							</Avatar>
						}
					/>
				))
			}
			renderInput={(params) => <TextField {...params} placeholder={value.length ? "" : placeholder} />}
		/>
	);
}

// Asistente «Repartir carpetas» (Equipos, fase 3, 6/11/2026): alcance → criterio → vista previa
// (dryRun en el hub) → aplicar. El hub calcula y escribe; acá solo se arma el pedido.
export default function DistributeFoldersDialog({ open, onClose, folderIds = [], onApplied }: Props) {
	const navigate = useNavigate();
	const { activeTeam, getRequestHeaders } = useTeam();
	const groupId = activeTeam?._id;
	const assignees = useMemo(() => getTeamAssignees(activeTeam, { includeInvitations: true }), [activeTeam]);
	const byId = useMemo(() => new Map(assignees.map((a) => [a.id, a])), [assignees]);
	const pick = useCallback((ids: string[]) => ids.map((id) => byId.get(id)).filter(Boolean) as TeamAssignee[], [byId]);

	const [step, setStep] = useState(0);
	const [s, setS] = useState<DistributeWizardState>(() => initialWizardState(folderIds));
	const patch = useCallback((p: Partial<DistributeWizardState>) => setS((prev) => ({ ...prev, ...p })), []);
	// `baseSummary`: todas las carpetas que ve quien reparte (para las opciones de los filtros). `summary`: las del
	// alcance elegido (archivadas, sin responsable, filtros), que es lo que cuentan las tablas del criterio (14/11/2026).
	const [baseSummary, setBaseSummary] = useState<RadicacionSummary | null>(null);
	const [summary, setSummary] = useState<RadicacionSummary | null>(null);
	const [loadingSummary, setLoadingSummary] = useState(false);
	const [preview, setPreview] = useState<DistributePreview | null>(null);
	const [busy, setBusy] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [modified, setModified] = useState<number | null>(null);
	const [prefill, setPrefill] = useState<TeamAssignee[]>([]);

	useEffect(() => {
		if (!open) return;
		setStep(0);
		setS(initialWizardState(folderIds));
		setPreview(null);
		setError(null);
		setModified(null);
		setPrefill([]);
		if (!groupId) return;
		setLoadingSummary(true);
		fetchRadicacionSummary(groupId).then((r) => {
			setBaseSummary(r);
		});
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, groupId]);

	// Cada cambio del alcance vuelve a contar en el hub (con una pausa corta para no pedir en cada tecla).
	useEffect(() => {
		if (!open || !groupId) return;
		const built = buildDistributeRequest({ ...s, type: "equal", assignees: ["x"] }, true);
		const scope = built.ok ? built.request.scope : { archived: s.archived, onlyUnassigned: s.onlyUnassigned, filters: {} };
		let cancelled = false;
		setLoadingSummary(true);
		const t = setTimeout(() => {
			fetchRadicacionSummary(groupId, scope).then((r) => {
				if (cancelled) return;
				setSummary(r);
				setLoadingSummary(false);
			});
		}, 250);
		return () => {
			cancelled = true;
			clearTimeout(t);
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open, groupId, s.archived, s.onlyUnassigned, s.fueros, s.juzgados, s.salas, s.ubicaciones, s.folderIds]);

	const selectionMode = s.folderIds.length > 0;

	// Filas de criterio acotadas por los filtros del alcance
	const rowsJuzgado = useMemo(() => {
		const rows = juzgadoRows(summary, s.archived, s.fueros);
		return s.juzgados.length ? rows.filter((r) => s.juzgados.includes(r.key)) : rows;
	}, [summary, s.archived, s.fueros, s.juzgados]);
	const rowsFuero = useMemo(() => {
		const rows = fueroRows(summary, s.archived);
		return s.fueros.length ? rows.filter((r) => s.fueros.includes(r.key)) : rows;
	}, [summary, s.archived, s.fueros]);
	// Sala de Cámara (radicación) y ubicación actual (14/11/2026, pedido de Silvia): como en Archivadas.
	const rowsSala = useMemo(() => {
		const rows = salaRows(summary, s.archived, s.fueros);
		return s.salas.length ? rows.filter((r) => s.salas.includes(r.key)) : rows;
	}, [summary, s.archived, s.fueros, s.salas]);
	const rowsUbicacion = useMemo(() => {
		const rows = ubicacionRows(summary, s.archived);
		return s.ubicaciones.length ? rows.filter((r) => s.ubicaciones.includes(r.key)) : rows;
	}, [summary, s.archived, s.ubicaciones]);
	const allFueros = useMemo(() => fueroRows(baseSummary, s.archived), [baseSummary, s.archived]);
	const radicacionOpts = useMemo(() => radicacionFilterOptions(baseSummary, s.archived, s.fueros), [baseSummary, s.archived, s.fueros]);
	const allUbicaciones = useMemo(() => ubicacionRows(baseSummary, s.archived), [baseSummary, s.archived]);
	// Carpetas del alcance (cuenta exacta del hub) y cuántas quedan afuera por «solo sin responsable».
	const estimate = summary?.total ?? 0;
	const conResponsable = summary?.conResponsable ?? 0;
	// Resumen del alcance para el paso Criterio: qué universo se reparte.
	const scopeChips = useMemo(() => {
		const chips: string[] = [];
		if (selectionMode) chips.push(`${nf(s.folderIds.length)} seleccionadas`);
		else chips.push(ARCHIVED_OPTIONS.find((o) => o.value === s.archived)?.label || "");
		chips.push(...s.fueros);
		chips.push(...joinRadicacion(s.juzgados, s.salas).map((v) => radicacionOpts.find((o) => o.value === v)?.label || v));
		chips.push(...s.ubicaciones.map((k) => allUbicaciones.find((r) => r.key === k)?.label || k));
		if (s.onlyUnassigned) chips.push("Solo sin responsable");
		return chips.filter(Boolean);
	}, [
		selectionMode,
		s.folderIds.length,
		s.archived,
		s.fueros,
		s.juzgados,
		s.salas,
		s.ubicaciones,
		s.onlyUnassigned,
		radicacionOpts,
		allUbicaciones,
	]);

	const criteriaRows: CriteriaRow[] =
		s.type === "juzgado" ? rowsJuzgado : s.type === "sala" ? rowsSala : s.type === "ubicacion" ? rowsUbicacion : rowsFuero;
	const mapLabels = MAP_LABELS[s.type] || MAP_LABELS.fuero;

	const setRowAssignees = (key: string, next: TeamAssignee[]) =>
		setS((prev) => ({ ...prev, map: { ...prev.map, [key]: next.map((a) => a.id) } }));

	const handlePrefill = () => {
		if (!prefill.length) return;
		patch({
			map: splitKeysEqually(
				criteriaRows,
				prefill.map((a) => a.id),
			),
		});
	};

	const runPreview = async () => {
		const built = buildDistributeRequest(s, true);
		if (!built.ok) {
			setError(built.error);
			return;
		}
		setError(null);
		setBusy(true);
		const r = await distributeFolderResponsables(built.request, getRequestHeaders());
		setBusy(false);
		if (!r.success) {
			setError(r.message);
			return;
		}
		setPreview(r.data.preview);
		setStep(2);
	};

	const runApply = async () => {
		const built = buildDistributeRequest(s, false);
		if (!built.ok) {
			setError(built.error);
			return;
		}
		setError(null);
		setBusy(true);
		const r = await distributeFolderResponsables(built.request, getRequestHeaders());
		setBusy(false);
		if (!r.success) {
			setError(r.message);
			return;
		}
		const n = r.data.modified ?? 0;
		setModified(n);
		setPreview(r.data.preview);
		trackActivity("team_distribute_apply", { type: s.type, mode: s.mode, count: n });
		onApplied?.(n);
		setStep(3);
	};

	const rows = useMemo(() => previewRows(preview, assignees, assigneeTag), [preview, assignees]);

	const quantitiesPicked = pick(Object.keys(s.quantities));
	const quantitiesSum = Object.values(s.quantities).reduce((a, b) => a + (Number.isFinite(b) ? b : 0), 0);

	const canNextFromScope = !loadingSummary && (selectionMode || estimate > 0);

	const renderScope = () => (
		<Stack spacing={2}>
			{selectionMode ? (
				<Alert severity="info" sx={{ py: 0.5 }}>
					El reparto se limita a las <strong>{nf(s.folderIds.length)}</strong> carpetas seleccionadas en el listado.
				</Alert>
			) : (
				<Box>
					<Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
						Qué carpetas entran
					</Typography>
					<ToggleButtonGroup
						exclusive
						size="small"
						value={s.archived}
						onChange={(_e, v: DistributeArchivedScope | null) => v && patch({ archived: v, map: {} })}
						sx={toggleSx}
					>
						{ARCHIVED_OPTIONS.map((o) => (
							<ToggleButton key={o.value} value={o.value}>
								{o.label}
							</ToggleButton>
						))}
					</ToggleButtonGroup>
					{s.archived !== "active" && (
						<Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.75 }}>
							Las archivadas se asignan igual que las activas, no cuentan para el cupo y cada integrante las ve cuando se activan.
						</Typography>
					)}
				</Box>
			)}

			<FormControlLabel
				control={<Switch size="small" checked={s.onlyUnassigned} onChange={(e) => patch({ onlyUnassigned: e.target.checked })} />}
				label={
					<Typography variant="body2">
						Solo las carpetas <strong>sin responsable</strong>
						<Typography component="span" variant="caption" color="text.secondary">
							{" "}
							(desactivalo para reasignar las que ya tienen)
						</Typography>
					</Typography>
				}
			/>

			{!selectionMode && (
				<Stack direction={{ xs: "column", sm: "row" }} spacing={1.5}>
					<Autocomplete
						multiple
						size="small"
						fullWidth
						options={allFueros.map((r) => r.key)}
						value={s.fueros}
						onChange={(_e, v) => patch({ fueros: v, juzgados: [], salas: [], map: {} })}
						getOptionLabel={(k) => {
							const r = allFueros.find((x) => x.key === k);
							return r ? `${r.label} (${nf(r.count)})` : k;
						}}
						renderInput={(params) => <TextField {...params} label="Fuero" placeholder={s.fueros.length ? "" : "Todos"} />}
					/>
					{/* Radicación (14/11/2026, como en Archivadas): juzgados de origen y salas de Cámara por las que pasó la causa */}
					<Autocomplete
						multiple
						size="small"
						fullWidth
						options={radicacionOpts.map((o) => o.value)}
						groupBy={(v) => radicacionOpts.find((o) => o.value === v)?.group || ""}
						value={joinRadicacion(s.juzgados, s.salas)}
						onChange={(_e, v) => patch({ ...splitRadicacion(v), map: {} })}
						getOptionLabel={(v) => {
							const o = radicacionOpts.find((x) => x.value === v);
							return o ? `${o.label} (${nf(o.count)})` : v;
						}}
						renderInput={(params) => (
							<TextField
								{...params}
								label="Radicación"
								placeholder={s.juzgados.length || s.salas.length ? "" : "Juzgados y salas de Cámara"}
							/>
						)}
					/>
					<Autocomplete
						multiple
						size="small"
						fullWidth
						options={allUbicaciones.map((r) => r.key)}
						value={s.ubicaciones}
						onChange={(_e, v) => patch({ ubicaciones: v, map: {} })}
						getOptionLabel={(k) => {
							const r = allUbicaciones.find((x) => x.key === k);
							return r ? `${r.label} (${nf(r.count)})` : k;
						}}
						renderInput={(params) => <TextField {...params} label="Ubicación actual" placeholder={s.ubicaciones.length ? "" : "Todas"} />}
					/>
				</Stack>
			)}

			{loadingSummary ? (
				<Skeleton variant="text" width={260} />
			) : selectionMode ? null : (
				<Typography variant="body2" color="text.secondary">
					{estimate === 0 ? (
						s.onlyUnassigned && conResponsable > 0 ? (
							<>
								Las <strong>{nf(conResponsable)}</strong> carpetas de este alcance ya tienen responsable. Para reasignarlas, desactivá{" "}
								<strong>«Solo las carpetas sin responsable»</strong>.
							</>
						) : (
							"No hay carpetas en este alcance."
						)
					) : (
						<>
							Se reparten <strong>{nf(estimate)}</strong> {estimate === 1 ? "carpeta" : "carpetas"}
							{s.onlyUnassigned && conResponsable > 0 && <> (otras {nf(conResponsable)} ya tienen responsable y quedan afuera)</>}.
							{estimate > MAX_DISTRIBUTE_FOLDERS && (
								<Typography component="span" color="error">
									{" "}
									Supera el máximo de {nf(MAX_DISTRIBUTE_FOLDERS)} por vez: acotá con filtros.
								</Typography>
							)}
						</>
					)}
				</Typography>
			)}
		</Stack>
	);

	const renderCriteria = () => {
		const opt = CRITERIA_OPTIONS.find((o) => o.value === s.type);
		return (
			<Stack spacing={2}>
				{/* El alcance ya está elegido: acá solo se decide CÓMO se reparte ese universo (14/11/2026). */}
				<Stack direction="row" spacing={0.75} alignItems="center" flexWrap="wrap" useFlexGap>
					<Typography variant="body2">
						Cómo se reparten las <strong>{nf(estimate)}</strong> carpetas del alcance:
					</Typography>
					{scopeChips.map((c) => (
						<Chip key={c} size="small" variant="outlined" label={c} />
					))}
				</Stack>
				<Box>
					<ToggleButtonGroup
						exclusive
						size="small"
						value={s.type}
						onChange={(_e, v: DistributeCriteriaType | null) => v && patch({ type: v, map: {} })}
						sx={{ ...toggleSx, flexWrap: "wrap" }}
					>
						{CRITERIA_OPTIONS.map((o) => (
							<ToggleButton key={o.value} value={o.value}>
								{o.label}
							</ToggleButton>
						))}
					</ToggleButtonGroup>
					{opt && (
						<Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.75 }}>
							{opt.help}
						</Typography>
					)}
				</Box>

				{isMapCriteria(s.type) && (
					<>
						<Stack direction={{ xs: "column", sm: "row" }} spacing={1} alignItems={{ sm: "center" }}>
							<Box sx={{ flex: 1 }}>
								<AssigneePicker
									options={assignees}
									value={prefill}
									onChange={setPrefill}
									size="small"
									placeholder="Pre-llenar la tabla entre…"
								/>
							</Box>
							<Stack direction="row" spacing={1}>
								<Button
									size="small"
									variant="outlined"
									color="secondary"
									onClick={handlePrefill}
									disabled={!prefill.length || !criteriaRows.length}
									sx={{ textTransform: "none" }}
								>
									Pre-llenar
								</Button>
								<Button
									size="small"
									color="secondary"
									onClick={() => patch({ map: {} })}
									disabled={!Object.keys(s.map).length}
									sx={{ textTransform: "none" }}
								>
									Limpiar
								</Button>
							</Stack>
						</Stack>
						<Typography variant="caption" color="text.secondary" component="div" sx={{ mt: -1 }}>
							<strong>Pre-llenar</strong> asigna cada fila a una sola persona y reparte las filas entre las elegidas para equilibrar la
							cantidad; después podés ajustar fila por fila. Si en una fila elegís a varios, todos quedan como responsables de esas
							carpetas. Para dividir las carpetas de una misma fila entre varios, usá <strong>Partes iguales</strong> con ese alcance.
						</Typography>
						{loadingSummary ? (
							<Skeleton variant="rounded" height={120} />
						) : criteriaRows.length === 0 ? (
							<Alert severity="warning">No hay {mapLabels.plural} en el alcance elegido.</Alert>
						) : (
							<Box sx={{ maxHeight: 360, overflow: "auto", border: `1px solid ${alpha(BRAND_BLUE, 0.12)}`, borderRadius: 1.5 }}>
								<Table size="small" stickyHeader>
									<TableHead>
										<TableRow>
											<TableCell sx={{ width: "32%" }}>{mapLabels.column}</TableCell>
											<TableCell align="right" sx={{ width: 90 }}>
												Carpetas
											</TableCell>
											<TableCell>
												<Tooltip title="Varios en una misma fila = todos responsables de esas carpetas">
													<span>Responsables</span>
												</Tooltip>
											</TableCell>
										</TableRow>
									</TableHead>
									<TableBody>
										{criteriaRows.map((r) => (
											<TableRow key={r.key} hover>
												<TableCell>
													<Typography variant="body2" fontWeight={600}>
														{r.label}
													</Typography>
													{r.fueros.length > 0 && (
														<Typography variant="caption" color="text.secondary" component="div" noWrap>
															{r.fueros.join(" · ")}
														</Typography>
													)}
												</TableCell>
												<TableCell align="right">
													<Typography variant="body2">{nf(r.count)}</Typography>
													{!s.onlyUnassigned && r.sinResponsable > 0 && r.sinResponsable !== r.count && (
														<Typography variant="caption" color="text.secondary" component="div">
															{nf(r.sinResponsable)} sin resp.
														</Typography>
													)}
												</TableCell>
												<TableCell sx={{ py: 0.5 }}>
													<AssigneePicker
														options={assignees}
														value={pick(s.map[r.key] || [])}
														onChange={(next) => setRowAssignees(r.key, next)}
														size="small"
														placeholder="Sin asignar"
													/>
												</TableCell>
											</TableRow>
										))}
									</TableBody>
								</Table>
							</Box>
						)}
					</>
				)}

				{(s.type === "equal" || s.type === "random") && (
					<AssigneePicker
						options={assignees}
						value={pick(s.assignees)}
						onChange={(next) => patch({ assignees: next.map((a) => a.id) })}
						placeholder="Entre quiénes repartir"
					/>
				)}

				{(s.type === "equal" || s.type === "quantities") && (
					<FormControl size="small" fullWidth>
						<InputLabel id="distribute-order">Orden de recorrido</InputLabel>
						<Select
							labelId="distribute-order"
							label="Orden de recorrido"
							value={s.order}
							onChange={(e) => patch({ order: e.target.value as DistributeOrder })}
						>
							{ORDER_OPTIONS.map((o) => (
								<MenuItem key={o.value} value={o.value}>
									{o.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				)}

				{s.type === "quantities" && (
					<>
						<AssigneePicker
							options={assignees}
							value={quantitiesPicked}
							onChange={(next) => {
								const q: Record<string, number> = {};
								for (const a of next) q[a.id] = s.quantities[a.id] ?? 0;
								patch({ quantities: q });
							}}
							placeholder="Quiénes reciben una cantidad fija"
						/>
						{quantitiesPicked.length > 0 && (
							<Stack spacing={1}>
								{quantitiesPicked.map((a) => (
									<Stack key={a.id} direction="row" spacing={1.5} alignItems="center">
										<Avatar src={a.avatar} sx={{ width: 26, height: 26, fontSize: "0.65rem", fontWeight: 700 }}>
											{a.initials}
										</Avatar>
										<Typography variant="body2" sx={{ flex: 1, minWidth: 0 }} noWrap>
											{a.name}
											{assigneeTag(a) ? ` (${assigneeTag(a)})` : ""}
										</Typography>
										<TextField
											size="small"
											type="number"
											value={s.quantities[a.id] ?? 0}
											onChange={(e) => patch({ quantities: { ...s.quantities, [a.id]: Math.max(0, parseInt(e.target.value, 10) || 0) } })}
											inputProps={{ min: 0, style: { width: 80, textAlign: "right" } }}
										/>
									</Stack>
								))}
								<Typography variant="caption" color="text.secondary">
									Suman {nf(quantitiesSum)}
									{!selectionMode && estimate > 0 ? ` de ${nf(estimate)} en el alcance` : ""}.
								</Typography>
							</Stack>
						)}
						<FormControl size="small" fullWidth>
							<InputLabel id="distribute-rest">El resto a</InputLabel>
							<Select
								labelId="distribute-rest"
								label="El resto a"
								value={s.rest || ""}
								onChange={(e) => patch({ rest: e.target.value || null })}
							>
								<MenuItem value="">
									<em>Nadie (quedan sin asignar)</em>
								</MenuItem>
								{assignees.map((a) => (
									<MenuItem key={a.id} value={a.id}>
										{a.name}
										{assigneeTag(a) ? ` (${assigneeTag(a)})` : ""}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</>
				)}

				{s.type === "random" && (
					<Stack direction="row" spacing={1} alignItems="center">
						<Tooltip
							title="Asigna un número aleatorio para que con ese número puedas volver a generar el mismo sorteo las veces que quieras."
							placement="top"
							arrow
						>
							<TextField
								size="small"
								type="number"
								label="Número de sorteo"
								value={s.seed}
								onChange={(e) => patch({ seed: Math.max(1, parseInt(e.target.value, 10) || 1) })}
								inputProps={{ min: 1 }}
								sx={{ width: 160 }}
							/>
						</Tooltip>
						<Tooltip title="Otro número: otro sorteo">
							<IconButton size="small" onClick={() => patch({ seed: newSeed() })}>
								<Shuffle size={18} />
							</IconButton>
						</Tooltip>
						<Typography variant="caption" color="text.secondary">
							Con el mismo número y las mismas carpetas, el sorteo sale igual. Anotalo si querés repetirlo.
						</Typography>
					</Stack>
				)}

				{!s.onlyUnassigned && (
					<Box>
						<Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
							Carpetas que ya tienen responsable
						</Typography>
						<ToggleButtonGroup
							exclusive
							size="small"
							value={s.mode}
							onChange={(_e, v: DistributeMode | null) => v && patch({ mode: v })}
							sx={toggleSx}
						>
							<ToggleButton value="replace">Reemplazar</ToggleButton>
							<ToggleButton value="add">Agregar</ToggleButton>
						</ToggleButtonGroup>
						<Typography variant="caption" color="text.secondary" component="div" sx={{ mt: 0.75 }}>
							{s.mode === "replace"
								? "Quedan solo con el responsable que les toque."
								: "Se suma el responsable que les toque a los que ya tienen."}
						</Typography>
					</Box>
				)}
			</Stack>
		);
	};

	const renderPreview = () => (
		<Stack spacing={2}>
			{preview && (
				<>
					<Stack direction="row" spacing={1} flexWrap="wrap" useFlexGap>
						<Chip size="small" label={`${nf(preview.total)} en el alcance`} />
						<Chip size="small" color="primary" variant="outlined" label={`${nf(preview.asignadas)} se asignan`} />
						{preview.sinAsignar > 0 && (
							<Chip size="small" color="warning" variant="outlined" label={`${nf(preview.sinAsignar)} quedan sin asignar`} />
						)}
						{preview.archivadasIncluidas > 0 && (
							<Chip size="small" variant="outlined" label={`${nf(preview.archivadasIncluidas)} archivadas incluidas`} />
						)}
						{(preview.excluidasConResponsable ?? 0) > 0 && (
							<Tooltip title="Quedan afuera por «Solo las carpetas sin responsable»">
								<Chip size="small" variant="outlined" label={`${nf(preview.excluidasConResponsable as number)} con responsable, afuera`} />
							</Tooltip>
						)}
					</Stack>
					{preview.restrictedByVisibility && (
						<Alert severity="info" sx={{ py: 0.5 }}>
							Con «cada uno ve lo suyo», el reparto alcanza solo las carpetas que ves.
						</Alert>
					)}
					{preview.sinAsignar > 0 && isMapCriteria(s.type) && (
						<Typography variant="caption" color="text.secondary">
							Quedan sin asignar las carpetas de {mapLabels.plural} sin responsable elegido; podés volver y completarlos.
						</Typography>
					)}
					{rows.length === 0 ? (
						<Alert severity="warning">
							{preview.total === 0 ? (
								(preview.excluidasConResponsable ?? 0) > 0 ? (
									<>
										Las {nf(preview.excluidasConResponsable as number)} carpetas que cumplen los filtros ya tienen responsable, así que el
										alcance quedó vacío. En <strong>Alcance</strong>, desactivá «Solo las carpetas sin responsable» para reasignarlas.
									</>
								) : (
									"El alcance no tiene carpetas para repartir: revisá los filtros."
								)
							) : (
								<>
									Ninguna de las {nf(preview.total)} carpetas del alcance tiene responsable elegido en el criterio. Volvé a{" "}
									<strong>Criterio</strong> y completá las filas.
								</>
							)}
						</Alert>
					) : (
						<Box sx={{ maxHeight: 360, overflow: "auto", border: `1px solid ${alpha(BRAND_BLUE, 0.12)}`, borderRadius: 1.5 }}>
							<Table size="small" stickyHeader>
								<TableHead>
									<TableRow>
										<TableCell>Responsable</TableCell>
										<TableCell align="right" sx={{ width: 90 }}>
											Carpetas
										</TableCell>
										<TableCell>{s.type === "ubicacion" ? "Por ubicación actual" : "Por juzgado"}</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{rows.map((r) => (
										<TableRow key={r.id} hover>
											<TableCell>
												<Stack direction="row" spacing={1} alignItems="center">
													<Avatar src={r.avatar} sx={{ width: 26, height: 26, fontSize: "0.65rem", fontWeight: 700 }}>
														{r.initials}
													</Avatar>
													<Typography variant="body2" fontWeight={600} noWrap>
														{r.name}
														{r.tag ? ` (${r.tag})` : ""}
													</Typography>
												</Stack>
											</TableCell>
											<TableCell align="right">
												<Typography variant="body2" fontWeight={600}>
													{nf(r.cantidad)}
												</Typography>
											</TableCell>
											<TableCell>
												<Typography variant="caption" color="text.secondary">
													{s.type === "ubicacion" && r.ubicaciones ? r.ubicaciones : r.juzgados}
												</Typography>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</Box>
					)}
					<Typography variant="body2" color="text.secondary">
						{s.onlyUnassigned
							? "Solo se tocan carpetas sin responsable."
							: s.mode === "replace"
							? "Las carpetas que ya tenían responsable quedan solo con el que les toque."
							: "A las carpetas que ya tenían responsable se les suma el que les toque."}{" "}
						Los previstos e invitados reciben las carpetas a su nombre cuando aceptan.
					</Typography>
				</>
			)}
		</Stack>
	);

	const renderResult = () => (
		<Stack spacing={2} alignItems="flex-start">
			<Alert severity="success" sx={{ width: "100%" }}>
				{modified === 1 ? "Se asignó 1 carpeta." : `Se asignaron ${nf(modified || 0)} carpetas.`}
				{preview && preview.sinAsignar > 0 ? ` Quedaron ${nf(preview.sinAsignar)} sin asignar.` : ""}
			</Alert>
			<Typography variant="body2" color="text.secondary">
				En «Mi equipo», la tarjeta Distribución de responsables muestra cómo quedó el reparto. En el listado de carpetas podés filtrar por
				«Sin responsable» para ver lo que falta.
			</Typography>
			<Button
				size="small"
				variant="outlined"
				color="secondary"
				onClick={() => {
					onClose();
					navigate("/apps/profiles/account/role");
				}}
				sx={{ textTransform: "none" }}
			>
				Ver distribución
			</Button>
		</Stack>
	);

	if (!activeTeam) return null;

	return (
		<Dialog open={open} onClose={() => !busy && onClose()} fullWidth maxWidth="md" disableEscapeKeyDown>
			<DialogTitle>Repartir carpetas</DialogTitle>
			<DialogContent>
				<Stepper activeStep={step} alternativeLabel sx={{ mb: 2.5, mt: 0.5 }}>
					{STEPS.map((label) => (
						<Step key={label}>
							<StepLabel>{label}</StepLabel>
						</Step>
					))}
				</Stepper>
				{error && (
					<Alert severity="error" sx={{ mb: 2 }} onClose={() => setError(null)}>
						{error}
					</Alert>
				)}
				{step === 0 && renderScope()}
				{step === 1 && renderCriteria()}
				{step === 2 && renderPreview()}
				{step === 3 && renderResult()}
			</DialogContent>
			<DialogActions sx={{ px: 3, pb: 2 }}>
				{step < 3 && (
					<Button onClick={onClose} disabled={busy} sx={{ textTransform: "none", color: "text.secondary", mr: "auto" }}>
						Cancelar
					</Button>
				)}
				{step > 0 && step < 3 && (
					<Button onClick={() => setStep(step - 1)} disabled={busy} sx={{ textTransform: "none" }} color="secondary">
						Atrás
					</Button>
				)}
				{step === 0 && (
					<Button variant="contained" onClick={() => setStep(1)} disabled={!canNextFromScope} sx={primarySx}>
						Siguiente
					</Button>
				)}
				{step === 1 && (
					<Button variant="contained" onClick={runPreview} disabled={busy} sx={primarySx}>
						{busy ? "Calculando…" : "Vista previa"}
					</Button>
				)}
				{step === 2 && (
					<>
						<Tooltip title="Volver a calcular con los mismos datos">
							<span>
								<IconButton size="small" onClick={runPreview} disabled={busy}>
									<Refresh size={18} />
								</IconButton>
							</span>
						</Tooltip>
						<Button variant="contained" onClick={runApply} disabled={busy || !preview || preview.asignadas === 0} sx={primarySx}>
							{busy ? "Aplicando…" : preview?.asignadas === 1 ? "Aplicar a 1 carpeta" : `Aplicar a ${nf(preview?.asignadas || 0)} carpetas`}
						</Button>
					</>
				)}
				{step === 3 && (
					<Button variant="contained" onClick={onClose} sx={primarySx}>
						Cerrar
					</Button>
				)}
			</DialogActions>
		</Dialog>
	);
}

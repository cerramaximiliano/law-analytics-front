// sections/apps/teams/TeamReglaDeAltaCard.tsx
// «Regla para las causas nuevas» en Mi equipo (14/11/2026, hub docs/REPARTO_POR_UBICACION_DINAMICO.md §7): el reparto
// estático (por radicación o por fuero) guardado desde «Repartir carpetas». Cada carpeta que entra después sin
// responsable (sincronización de Mis Causas o alta a mano) recibe el suyo según la tabla, o «Las demás». La aplica el
// hub cada hora; acá se ve, se edita, se desactiva y se aplica a mano. Owner/admin la editan.
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Alert,
	Button,
	FormControlLabel,
	Paper,
	Skeleton,
	Stack,
	Switch,
	Table,
	TableBody,
	TableCell,
	TableHead,
	TableRow,
	Typography,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { DocumentText } from "iconsax-react";

import { useDispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { useTeam } from "contexts/TeamContext";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { juzgadoLabel } from "utils/folderDistribute";
import { getTeamAssignees, resolveAssignees, TeamAssignee } from "utils/teamAssignees";
import {
	apiError,
	applyReglaDeAlta,
	getReglaDeAlta,
	ReglaDeAlta,
	ReglaDeAltaApplyResult,
	ReglaDeAltaResponse,
	saveReglaDeAlta,
} from "utils/responsablesReglasApi";
import AssigneePicker from "./AssigneePicker";
import { stackedTableSx } from "./stackedTableSx";

const fmtDate = (iso?: string | null, withTime = false) =>
	iso
		? new Date(iso).toLocaleString("es-AR", {
				day: "2-digit",
				month: "2-digit",
				year: "numeric",
				...(withTime ? { hour: "2-digit", minute: "2-digit" } : {}),
		  })
		: "";

type Draft = Pick<ReglaDeAlta, "enabled" | "map" | "rest" | "soloPjn">;
const toDraft = (r: ReglaDeAlta): Draft => ({
	enabled: r.enabled,
	map: Object.fromEntries(Object.entries(r.map || {}).map(([k, v]) => [k, [...v]])),
	rest: [...(r.rest || [])],
	soloPjn: r.soloPjn,
});
const cleanMap = (m: Record<string, string[]>) => Object.fromEntries(Object.entries(m).filter(([, v]) => v && v.length));
const sameDraft = (a: Draft, b: Draft) => JSON.stringify({ ...a, map: cleanMap(a.map) }) === JSON.stringify({ ...b, map: cleanMap(b.map) });
const numOrInf = (s: string) => (/^\d+$/.test(s) ? parseInt(s, 10) : Number.POSITIVE_INFINITY);

export default function TeamReglaDeAltaCard() {
	const dispatch = useDispatch();
	const { activeTeam } = useTeam();
	const groupId = activeTeam?._id;
	const assignees = useMemo(() => getTeamAssignees(activeTeam, { includeInvitations: true }), [activeTeam]);

	const [data, setData] = useState<ReglaDeAltaResponse | null>(null);
	const [draft, setDraft] = useState<Draft | null>(null);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [busy, setBusy] = useState<"" | "save" | "preview" | "apply">("");
	const [preview, setPreview] = useState<ReglaDeAltaApplyResult | null>(null);

	const notify = (message: string, color: "success" | "error" | "info" = "success") =>
		dispatch(openSnackbar({ open: true, message, variant: "alert", alert: { color }, close: true }));

	const load = useCallback(async () => {
		if (!groupId) return;
		setLoading(true);
		setLoadError(null);
		try {
			const r = await getReglaDeAlta(groupId);
			setData(r);
			setDraft(toDraft(r.rule));
		} catch (e) {
			setLoadError(apiError(e, "No se pudo cargar la regla para las causas nuevas"));
		} finally {
			setLoading(false);
		}
	}, [groupId]);

	useEffect(() => {
		load();
	}, [load]);
	// El asistente «Repartir carpetas» guarda la regla desde otra tarjeta: recargar al enterarse.
	useEffect(() => {
		const onUpdated = () => load();
		window.addEventListener("regla-de-alta-updated", onUpdated);
		return () => window.removeEventListener("regla-de-alta-updated", onUpdated);
	}, [load]);

	if (!activeTeam) return null;
	const rule = data?.rule;
	const canEdit = !!data?.canEdit;
	const criterio = rule?.criterio || null;
	const keyLabel = (k: string) => (criterio === "fuero" ? k || "Sin fuero" : juzgadoLabel(k));
	const keys = Object.keys(draft?.map || {}).sort((a, b) => numOrInf(a) - numOrInf(b) || a.localeCompare(b, "es"));
	const dirty = !!(rule && draft && !sameDraft(draft, toDraft(rule)));
	const hasAny = !!draft && (Object.values(draft.map).some((v) => v.length) || draft.rest.length > 0);
	const patch = (p: Partial<Draft>) => {
		setPreview(null);
		setDraft((d) => (d ? { ...d, ...p } : d));
	};
	const setKey = (k: string, next: TeamAssignee[]) => patch({ map: { ...(draft?.map || {}), [k]: next.map((a) => a.id) } });

	const handleSave = async () => {
		if (!groupId || !draft) return;
		setBusy("save");
		try {
			const r = await saveReglaDeAlta(groupId, { ...draft, map: cleanMap(draft.map) });
			setData((prev) => (prev ? { ...prev, rule: r.rule, coverage: r.coverage } : prev));
			setDraft(toDraft(r.rule));
			notify(r.rule.enabled ? "Regla guardada" : "Regla desactivada: las causas nuevas quedan sin responsable automático");
		} catch (e) {
			notify(apiError(e, "No se pudo guardar la regla"), "error");
		} finally {
			setBusy("");
		}
	};

	const handlePreview = async () => {
		if (!groupId || !draft || !criterio) return;
		setBusy("preview");
		try {
			setPreview(await applyReglaDeAlta(groupId, true, { criterio, map: cleanMap(draft.map), rest: draft.rest, soloPjn: draft.soloPjn }));
		} catch (e) {
			notify(apiError(e, "No se pudo calcular la vista previa"), "error");
		} finally {
			setBusy("");
		}
	};

	const handleApply = async () => {
		if (!groupId) return;
		setBusy("apply");
		try {
			const r = await applyReglaDeAlta(groupId, false);
			setPreview(null);
			notify(
				r.modified
					? `Se asignaron ${r.modified} ${r.modified === 1 ? "carpeta nueva" : "carpetas nuevas"}`
					: "No había carpetas nuevas para asignar",
			);
			await load();
		} catch (e) {
			notify(apiError(e, "No se pudo aplicar la regla"), "error");
		} finally {
			setBusy("");
		}
	};

	return (
		<Paper
			variant="outlined"
			sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, borderColor: alpha(BRAND_BLUE, 0.14) }}
			data-testid="team-regla-alta-card"
		>
			<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
				<DocumentText size={18} />
				<Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>
					Regla para las causas nuevas
				</Typography>
				{draft && criterio && (
					<FormControlLabel
						control={<Switch checked={draft.enabled} onChange={(e) => patch({ enabled: e.target.checked })} disabled={!canEdit} />}
						label={draft.enabled ? "Activa" : "Inactiva"}
						labelPlacement="start"
						sx={{ mr: 0 }}
					/>
				)}
			</Stack>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
				Las carpetas que entran sin responsable (las que trae la sincronización de Mis Causas o las que se cargan a mano) reciben el suyo
				según el reparto guardado. Nunca cambia una carpeta que ya tiene responsable. Se revisa cada hora.
			</Typography>

			{loading ? (
				<Stack spacing={1}>
					<Skeleton variant="text" width={240} />
					<Skeleton variant="rounded" height={96} />
				</Stack>
			) : loadError || !draft ? (
				<Alert
					severity="error"
					action={
						<Button color="inherit" size="small" onClick={load}>
							Reintentar
						</Button>
					}
				>
					{loadError || "No se pudo cargar la regla"}
				</Alert>
			) : !criterio ? (
				<Alert severity="info" variant="outlined">
					Todavía no hay regla. Para crearla, usá «Repartir carpetas» con el criterio «Por radicación» o «Por fuero» y, en el último paso,
					marcá «Guardar como regla para las causas nuevas».
				</Alert>
			) : (
				<Stack spacing={2}>
					<Typography variant="body2">
						<strong>{criterio === "fuero" ? "Por fuero" : "Por radicación"}</strong>
						{rule?.desde ? ` · para carpetas creadas desde el ${fmtDate(rule.desde)}` : ""}
						{data?.coverage.asignadasPorRegla ? ` · ${data.coverage.asignadasPorRegla} carpetas asignadas por la regla` : ""}
					</Typography>
					{!canEdit && (
						<Alert severity="info" variant="outlined">
							Solo el propietario o un administrador pueden cambiar esta regla.
						</Alert>
					)}
					<Table size="small" sx={stackedTableSx}>
						<TableHead>
							<TableRow>
								<TableCell sx={{ width: { sm: 240 } }}>{criterio === "fuero" ? "Fuero" : "Radicación"}</TableCell>
								<TableCell>Responsables</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{keys.map((k) => (
								<TableRow key={k}>
									<TableCell data-label={criterio === "fuero" ? "Fuero" : "Radicación"}>
										<Typography variant="body2" fontWeight={500}>
											{keyLabel(k)}
										</Typography>
									</TableCell>
									<TableCell data-label="Responsables">
										<AssigneePicker
											size="small"
											options={assignees}
											value={resolveAssignees(draft.map[k], assignees)}
											onChange={(next) => setKey(k, next)}
											placeholder="Sin responsable (va a «Las demás»)"
											disabled={!canEdit}
										/>
									</TableCell>
								</TableRow>
							))}
							<TableRow>
								<TableCell data-label={criterio === "fuero" ? "Fuero" : "Radicación"}>
									<Typography variant="body2" fontWeight={600}>
										Las demás
									</Typography>
									<Typography variant="caption" color="text.secondary">
										{criterio === "fuero" ? "Fueros que no están en la tabla" : "Radicaciones que no están en la tabla o sin juzgado"}
									</Typography>
								</TableCell>
								<TableCell data-label="Responsables">
									<AssigneePicker
										size="small"
										options={assignees}
										value={resolveAssignees(draft.rest, assignees)}
										onChange={(next) => patch({ rest: next.map((a) => a.id) })}
										placeholder="Nadie: quedan sin responsable"
										disabled={!canEdit}
									/>
								</TableCell>
							</TableRow>
						</TableBody>
					</Table>
					<FormControlLabel
						control={<Switch checked={draft.soloPjn} onChange={(e) => patch({ soloPjn: e.target.checked })} disabled={!canEdit} />}
						label="Solo expedientes del PJN"
					/>
					{rule?.lastRun && (
						<Typography variant="caption" color="text.secondary">
							Última corrida: {fmtDate(rule.lastRun.at, true)} ({rule.lastRun.source === "cron" ? "automática" : "manual"}) ·{" "}
							{rule.lastRun.asignadas} {rule.lastRun.asignadas === 1 ? "carpeta asignada" : "carpetas asignadas"}
							{rule.lastRun.sinClave ? ` · ${rule.lastRun.sinClave} sin destino en la tabla` : ""}
						</Typography>
					)}
					{preview && (
						<Alert severity={preview.asignadas ? "info" : "success"} variant="outlined" onClose={() => setPreview(null)}>
							{preview.asignadas === 0 && preview.sinClave === 0 ? (
								"No hay carpetas nuevas sin responsable."
							) : (
								<Stack spacing={0.5}>
									<Typography variant="body2" fontWeight={600}>
										Se asignarían {preview.asignadas} {preview.asignadas === 1 ? "carpeta" : "carpetas"}
										{preview.sinClave
											? ` · ${preview.sinClave} quedarían sin responsable (no están en la tabla y «Las demás» está vacío)`
											: ""}
									</Typography>
									{preview.porResponsable.map((p) => (
										<Typography key={p.id} variant="body2">
											{resolveAssignees([p.id], assignees)[0]?.name}: {p.cantidad}
										</Typography>
									))}
								</Stack>
							)}
						</Alert>
					)}
					{canEdit && (
						<Stack direction={{ xs: "column", sm: "row" }} spacing={1} justifyContent="flex-end">
							<Button
								size="small"
								variant="outlined"
								color="secondary"
								onClick={handlePreview}
								disabled={!!busy || !hasAny}
								sx={{ textTransform: "none" }}
							>
								{busy === "preview" ? "Calculando…" : "Vista previa"}
							</Button>
							<Button
								size="small"
								variant="outlined"
								onClick={handleApply}
								disabled={!!busy || dirty || !rule?.enabled}
								sx={{ textTransform: "none" }}
								title={dirty ? "Guardá los cambios antes de aplicar" : !rule?.enabled ? "Activá y guardá la regla" : ""}
							>
								{busy === "apply" ? "Aplicando…" : "Aplicar ahora"}
							</Button>
							<Button
								size="small"
								variant="contained"
								onClick={handleSave}
								disabled={!!busy || !dirty || (draft.enabled && !hasAny)}
								sx={{ textTransform: "none", bgcolor: BRAND_BLUE, boxShadow: "none", "&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88) } }}
							>
								{busy === "save" ? "Guardando…" : "Guardar"}
							</Button>
						</Stack>
					)}
				</Stack>
			)}
		</Paper>
	);
}

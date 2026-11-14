// sections/apps/teams/TeamUbicacionRuleCard.tsx
// «Responsables por ubicación actual» en Mi equipo (14/11/2026, pedido de Estudio FS Abogados): regla permanente del
// equipo — lo que está en Cámara lo sigue X, lo que está en la Corte lo sigue Y — que se mantiene sola cuando el
// expediente cambia de instancia. Solo carpetas PJN activas (el dato lo trae la sincronización de Mis Causas). La
// aplica el hub cada hora (`responsables-reglas-apply`) o «Aplicar ahora». Owner/admin la editan; el resto la ve.
import { useCallback, useEffect, useMemo, useState } from "react";
import {
	Alert,
	Box,
	Button,
	FormControlLabel,
	MenuItem,
	Paper,
	Select,
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
import { Location } from "iconsax-react";

import { useDispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { useTeam } from "contexts/TeamContext";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { getTeamAssignees, resolveAssignees, TeamAssignee } from "utils/teamAssignees";
import {
	apiError,
	applyUbicacionRule,
	getUbicacionRule,
	saveUbicacionRule,
	UbicacionApplyResult,
	UbicacionKind,
	UbicacionRule,
	UbicacionRuleResponse,
} from "utils/responsablesReglasApi";
import AssigneePicker from "./AssigneePicker";
import { stackedTableSx } from "./stackedTableSx";

const FALLBACK_KINDS: { key: UbicacionKind; label: string }[] = [
	{ key: "juzgado", label: "1ª instancia (Juzgado)" },
	{ key: "camara", label: "2ª instancia (Cámara)" },
	{ key: "corte", label: "Corte Suprema" },
	{ key: "tribunal-oral", label: "Tribunal Oral" },
	{ key: "archivo", label: "Archivo General" },
	{ key: "otro", label: "Otra dependencia" },
];

const fmtDate = (iso?: string | null) =>
	iso
		? new Date(iso).toLocaleString("es-AR", { day: "2-digit", month: "2-digit", year: "numeric", hour: "2-digit", minute: "2-digit" })
		: "";

type Draft = Pick<UbicacionRule, "enabled" | "mode" | "alVolver" | "soloSinResponsable"> & { map: Record<string, string[]> };

const toDraft = (r: UbicacionRule): Draft => ({
	enabled: r.enabled,
	mode: r.mode,
	alVolver: r.alVolver,
	soloSinResponsable: r.soloSinResponsable,
	map: Object.fromEntries(Object.entries(r.map || {}).map(([k, v]) => [k, [...(v || [])]])),
});
const cleanMap = (m: Record<string, string[]>) => Object.fromEntries(Object.entries(m).filter(([, v]) => v && v.length));
const sameDraft = (a: Draft, b: Draft) => JSON.stringify({ ...a, map: cleanMap(a.map) }) === JSON.stringify({ ...b, map: cleanMap(b.map) });

export default function TeamUbicacionRuleCard() {
	const dispatch = useDispatch();
	const { activeTeam } = useTeam();
	const groupId = activeTeam?._id;
	const assignees = useMemo(() => getTeamAssignees(activeTeam, { includeInvitations: true }), [activeTeam]);

	const [data, setData] = useState<UbicacionRuleResponse | null>(null);
	const [draft, setDraft] = useState<Draft | null>(null);
	const [loading, setLoading] = useState(true);
	const [loadError, setLoadError] = useState<string | null>(null);
	const [busy, setBusy] = useState<"" | "save" | "preview" | "apply">("");
	const [preview, setPreview] = useState<UbicacionApplyResult | null>(null);

	const notify = (message: string, color: "success" | "error" | "info" = "success") =>
		dispatch(openSnackbar({ open: true, message, variant: "alert", alert: { color }, close: true }));

	const load = useCallback(async () => {
		if (!groupId) return;
		setLoading(true);
		setLoadError(null);
		try {
			const r = await getUbicacionRule(groupId);
			setData(r);
			setDraft(toDraft(r.rule));
		} catch (e) {
			setLoadError(apiError(e, "No se pudo cargar la regla de responsables por ubicación"));
		} finally {
			setLoading(false);
		}
	}, [groupId]);

	useEffect(() => {
		load();
	}, [load]);

	if (!activeTeam) return null;
	const canEdit = !!data?.canEdit;
	const kinds = data?.kinds?.length ? data.kinds : FALLBACK_KINDS;
	const kindLabel = (k: string) => kinds.find((x) => x.key === k)?.label || k;
	const dirty = !!(data && draft && !sameDraft(draft, toDraft(data.rule)));
	const hasAny = !!draft && Object.values(draft.map).some((v) => v && v.length);

	const setMap = (k: string, next: TeamAssignee[]) => {
		setPreview(null);
		setDraft((d) => (d ? { ...d, map: { ...d.map, [k]: next.map((a) => a.id) } } : d));
	};
	const patch = (p: Partial<Draft>) => {
		setPreview(null);
		setDraft((d) => (d ? { ...d, ...p } : d));
	};

	const handleSave = async () => {
		if (!groupId || !draft) return;
		setBusy("save");
		try {
			const r = await saveUbicacionRule(groupId, { ...draft, map: cleanMap(draft.map) });
			setData((prev) => (prev ? { ...prev, rule: r.rule, coverage: r.coverage } : prev));
			setDraft(toDraft(r.rule));
			notify(
				r.rule.enabled
					? "Regla guardada: se aplica en la próxima corrida (cada hora) o con «Aplicar ahora»"
					: "Regla guardada (desactivada)",
			);
		} catch (e) {
			notify(apiError(e, "No se pudo guardar la regla"), "error");
		} finally {
			setBusy("");
		}
	};

	const handlePreview = async () => {
		if (!groupId || !draft) return;
		setBusy("preview");
		try {
			setPreview(
				await applyUbicacionRule(groupId, true, {
					mode: draft.mode,
					alVolver: draft.alVolver,
					soloSinResponsable: draft.soloSinResponsable,
					map: cleanMap(draft.map),
				}),
			);
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
			const r = await applyUbicacionRule(groupId, false);
			setPreview(null);
			notify(
				r.cambios
					? `Regla aplicada: ${r.cambios} ${r.cambios === 1 ? "carpeta cambió" : "carpetas cambiaron"} de responsables`
					: "Regla aplicada: no hubo cambios",
			);
			await load();
		} catch (e) {
			notify(apiError(e, "No se pudo aplicar la regla"), "error");
		} finally {
			setBusy("");
		}
	};

	const cov = data?.coverage;
	const lastRun = data?.rule.lastRun;

	return (
		<Paper
			variant="outlined"
			sx={{ p: { xs: 1.5, sm: 2 }, borderRadius: 2, borderColor: alpha(BRAND_BLUE, 0.14) }}
			data-testid="team-ubicacion-rule-card"
		>
			<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
				<Location size={18} />
				<Typography variant="subtitle2" fontWeight={600} sx={{ flex: 1 }}>
					Responsables por ubicación actual
				</Typography>
				{draft && (
					<FormControlLabel
						control={<Switch checked={draft.enabled} onChange={(e) => patch({ enabled: e.target.checked })} disabled={!canEdit} />}
						label={draft.enabled ? "Activa" : "Inactiva"}
						labelPlacement="start"
						sx={{ mr: 0 }}
					/>
				)}
			</Stack>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 1.5 }}>
				Elegí quién sigue los expedientes según dónde están hoy (Cámara, Corte…). Cuando un expediente cambia de instancia, sus responsables
				se actualizan solos: la regla se revisa cada hora, después de la sincronización con Mis Causas.
				{cov && (
					<>
						{" "}
						<strong>
							Aplica a los expedientes del PJN ({cov.pjn} de tus {cov.activas} carpetas activas)
						</strong>
						; las de otras jurisdicciones no tienen ubicación actual y no se tocan. Las archivadas tampoco.
					</>
				)}
			</Typography>

			{loading ? (
				<Stack spacing={1}>
					<Skeleton variant="text" width={240} />
					<Skeleton variant="rounded" height={160} />
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
			) : (
				<Stack spacing={2}>
					{!canEdit && (
						<Alert severity="info" variant="outlined">
							Solo el propietario o un administrador pueden cambiar esta regla.
						</Alert>
					)}
					<Table size="small" sx={stackedTableSx}>
						<TableHead>
							<TableRow>
								<TableCell sx={{ width: { sm: 220 } }}>Ubicación actual</TableCell>
								<TableCell>Responsables</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{kinds.map((k) => (
								<TableRow key={k.key}>
									<TableCell data-label="Ubicación actual">
										<Typography variant="body2" fontWeight={500}>
											{k.label}
										</Typography>
									</TableCell>
									<TableCell data-label="Responsables">
										<AssigneePicker
											size="small"
											options={assignees}
											value={resolveAssignees(draft.map[k.key], assignees)}
											onChange={(next) => setMap(k.key, next)}
											placeholder={
												k.key === "juzgado" && draft.alVolver === "restaurar"
													? "Al volver se restaura a quien la tenía"
													: "Sin regla (no se toca)"
											}
											disabled={!canEdit}
										/>
									</TableCell>
								</TableRow>
							))}
						</TableBody>
					</Table>

					<Stack direction={{ xs: "column", md: "row" }} spacing={2}>
						<Box sx={{ flex: 1 }}>
							<Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
								Cómo se asigna
							</Typography>
							<Select
								size="small"
								fullWidth
								value={draft.mode}
								onChange={(e) => patch({ mode: e.target.value as Draft["mode"] })}
								disabled={!canEdit}
							>
								<MenuItem value="add">Sumar a los responsables que ya tenía</MenuItem>
								<MenuItem value="replace">Reemplazar los responsables</MenuItem>
							</Select>
						</Box>
						<Box sx={{ flex: 1 }}>
							<Typography variant="caption" color="text.secondary" component="div" sx={{ mb: 0.5 }}>
								Al volver al juzgado
							</Typography>
							<Select
								size="small"
								fullWidth
								value={draft.alVolver}
								onChange={(e) => patch({ alVolver: e.target.value as Draft["alVolver"] })}
								disabled={!canEdit}
							>
								<MenuItem value="restaurar">Vuelve a quien la tenía antes de subir</MenuItem>
								<MenuItem value="regla">Aplicar la fila «1ª instancia»</MenuItem>
							</Select>
						</Box>
					</Stack>
					<FormControlLabel
						control={
							<Switch
								checked={draft.soloSinResponsable}
								onChange={(e) => patch({ soloSinResponsable: e.target.checked })}
								disabled={!canEdit}
							/>
						}
						label="Solo carpetas sin responsables propios (no tocar las que alguien ya tiene asignadas)"
					/>

					{lastRun && (
						<Typography variant="caption" color="text.secondary">
							Última corrida: {fmtDate(lastRun.at)} ({lastRun.source === "cron" ? "automática" : "manual"}) · {lastRun.modified}{" "}
							{lastRun.modified === 1 ? "carpeta cambió" : "carpetas cambiaron"} de responsables
							{cov?.asignadasPorRegla ? ` · ${cov.asignadasPorRegla} carpetas con responsables puestos por la regla` : ""}
						</Typography>
					)}

					{preview && (
						<Alert severity={preview.cambios ? "info" : "success"} variant="outlined" onClose={() => setPreview(null)}>
							{preview.cambios === 0 ? (
								"Con esta regla no cambiaría ninguna carpeta por ahora."
							) : (
								<Stack spacing={0.5}>
									<Typography variant="body2" fontWeight={600}>
										Cambiarían {preview.cambios} {preview.cambios === 1 ? "carpeta" : "carpetas"}
										{preview.omitidas ? ` · ${preview.omitidas} quedan igual porque ya tienen responsable` : ""}
									</Typography>
									<Typography variant="body2">
										{Object.entries(preview.porUbicacion)
											.map(([k, n]) => `${kindLabel(k)}: ${n}`)
											.join(" · ")}
									</Typography>
									{preview.porResponsable.map((p) => (
										<Typography key={p.id} variant="body2">
											{resolveAssignees([p.id], assignees)[0]?.name}: {p.entra ? `entra en ${p.entra}` : ""}
											{p.entra && p.sale ? ", " : ""}
											{p.sale ? `sale de ${p.sale}` : ""}
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
								disabled={!!busy || dirty || !data?.rule.enabled}
								sx={{ textTransform: "none" }}
								title={dirty ? "Guardá los cambios antes de aplicar" : !data?.rule.enabled ? "Activá y guardá la regla" : ""}
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

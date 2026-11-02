/**
 * Varias cuentas SCBA por cuenta (solo Premium, 2/11/2026; la-ads equipos-credenciales-multiples.md §6 bis, nivel 4).
 *
 * La muestra `ScbaAccountConnect` cuando el hub informa `quota.max > 1` y ya hay al menos una credencial. Una fila por
 * credencial con etiqueta, abogado titular, usuario del portal, estado y acciones (sincronizar, cambiar clave, pausar,
 * editar, desvincular por credencial: solo afecta a las carpetas de causas que ninguna otra cuenta cubre).
 */
import { useMemo, useState } from "react";
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	FormControl,
	FormControlLabel,
	IconButton,
	InputLabel,
	MenuItem,
	Radio,
	RadioGroup,
	Select,
	Stack,
	TextField,
	Tooltip,
	Typography,
	alpha,
	useTheme,
} from "@mui/material";
import { Add, Edit2, Key, Link1, PauseCircle, PlayCircle, Refresh2, Trash } from "iconsax-react";
import { useSnackbar } from "notistack";
import { useSelector } from "react-redux";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { useTeam } from "contexts/TeamContext";
import scbaCredentialsService, { ScbaCredentialSummary, ScbaCredentialsQuota, ScbaUnlinkImpact } from "api/scbaCredentials";

const SNACK = { variant: "info" as const, anchorOrigin: { vertical: "bottom", horizontal: "right" } as const };

type Estado = "ok" | "sync" | "pending" | "error" | "paused" | "expired";
const estadoDe = (c: ScbaCredentialSummary): Estado => {
	if (!c.enabled) return "paused";
	if (c.isExpired) return "expired";
	if (c.syncStatus === "in_progress" || c.syncStatus === "pending") return "sync";
	if (c.syncStatus === "error") return "error";
	if (c.syncStatus === "completed") return "ok";
	return "pending";
};
const META: Record<Estado, { label: string; color: "success" | "warning" | "error" | "default" | "info" }> = {
	ok: { label: "Sincronizada", color: "success" },
	sync: { label: "Sincronizando", color: "info" },
	pending: { label: "Pendiente", color: "warning" },
	error: { label: "Requiere atención", color: "error" },
	expired: { label: "Contraseña vencida", color: "error" },
	paused: { label: "Pausada", color: "default" },
};
const fecha = (v?: string | null) => (v ? new Date(v).toLocaleDateString("es-AR") : null);

interface Props {
	credentials: ScbaCredentialSummary[];
	quota: ScbaCredentialsQuota;
	onChanged: () => Promise<void> | void;
}

const ScbaAccountsList = ({ credentials, quota, onChanged }: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { enqueueSnackbar } = useSnackbar();
	const { activeTeam } = useTeam();
	const authUser = useSelector((state: any) => state.auth?.user);

	const abogados = useMemo(() => {
		const list: { id: string; label: string }[] = [];
		const add = (id?: string | null, label?: string | null) => {
			if (!id || list.some((x) => x.id === String(id))) return;
			list.push({ id: String(id), label: label || "Integrante" });
		};
		const nombre = (o?: { firstName?: string; lastName?: string; email?: string } | null) =>
			o ? [o.firstName, o.lastName].filter(Boolean).join(" ") || o.email || null : null;
		if (activeTeam) {
			const ownerId = typeof (activeTeam as any).owner === "object" ? (activeTeam as any).owner?._id : activeTeam.owner;
			add(ownerId, nombre(activeTeam.ownerInfo) || nombre((activeTeam as any).owner) || "Propietario");
			for (const m of activeTeam.members || []) {
				if (m.status !== "active") continue;
				const populated = typeof (m as any).userId === "object" ? (m as any).userId : null;
				add(populated?._id || (m.userId as string), nombre(populated) || nombre(m));
			}
		} else {
			add(authUser?._id || authUser?.id, nombre(authUser) || "Mi cuenta");
		}
		return list;
	}, [activeTeam, authUser]);
	const nombreAbogado = (id?: string | null) => (id ? abogados.find((a) => a.id === String(id))?.label || "Integrante" : null);

	const [formOpen, setFormOpen] = useState(false);
	const [formTarget, setFormTarget] = useState<ScbaCredentialSummary | null>(null);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [etiqueta, setEtiqueta] = useState("");
	const [abogado, setAbogado] = useState("");
	const [saving, setSaving] = useState(false);
	const [metaTarget, setMetaTarget] = useState<ScbaCredentialSummary | null>(null);
	const [metaEtiqueta, setMetaEtiqueta] = useState("");
	const [metaAbogado, setMetaAbogado] = useState("");
	const [savingMeta, setSavingMeta] = useState(false);
	const [unlinkTarget, setUnlinkTarget] = useState<ScbaCredentialSummary | null>(null);
	const [impact, setImpact] = useState<ScbaUnlinkImpact | null>(null);
	const [loadingImpact, setLoadingImpact] = useState(false);
	const [mode, setMode] = useState<"keep" | "delete">("keep");
	const [unlinking, setUnlinking] = useState(false);
	const [busyId, setBusyId] = useState<string | null>(null);

	const cupoLleno = credentials.length >= quota.max;

	const openAdd = () => {
		setFormTarget(null);
		setUsername("");
		setPassword("");
		setEtiqueta("");
		setAbogado("");
		setFormOpen(true);
	};
	const openPassword = (c: ScbaCredentialSummary) => {
		setFormTarget(c);
		setUsername(c.username || "");
		setPassword("");
		setFormOpen(true);
	};
	const handleSave = async () => {
		if (!username.trim() || !password.trim()) {
			enqueueSnackbar("Ingresá usuario y contraseña del portal", { ...SNACK, variant: "warning" });
			return;
		}
		try {
			setSaving(true);
			// La clave se cambia cargando de nuevo la misma cuenta (el hub la identifica por el usuario).
			const res = await scbaCredentialsService.linkCredentials(
				username.trim(),
				password,
				undefined,
				formTarget ? {} : { etiqueta: etiqueta.trim() || undefined, abogadoUserId: abogado || null },
			);
			if (res.success) {
				enqueueSnackbar(
					formTarget ? "Contraseña actualizada. Volvemos a sincronizar." : "Cuenta SCBA conectada. Empezamos a sincronizar sus causas.",
					{ ...SNACK, variant: "success" },
				);
				setFormOpen(false);
				await onChanged();
			} else {
				enqueueSnackbar(res.error || "No se pudo guardar la cuenta", {
					...SNACK,
					variant: res.code === "CREDENTIAL_QUOTA_REACHED" || res.code === "PREMIUM_REQUIRED" ? "warning" : "error",
				});
			}
		} finally {
			setSaving(false);
		}
	};

	const openMeta = (c: ScbaCredentialSummary) => {
		setMetaTarget(c);
		setMetaEtiqueta(c.etiqueta || "");
		setMetaAbogado(c.abogadoUserId ? String(c.abogadoUserId) : "");
	};
	const saveMeta = async () => {
		if (!metaTarget) return;
		try {
			setSavingMeta(true);
			const res = await scbaCredentialsService.updateCredential(metaTarget.id, {
				etiqueta: metaEtiqueta.trim(),
				abogadoUserId: metaAbogado || null,
			});
			if (res.success) {
				setMetaTarget(null);
				await onChanged();
			} else enqueueSnackbar(res.error || "No se pudo guardar", { ...SNACK, variant: "error" });
		} finally {
			setSavingMeta(false);
		}
	};

	const accion = async (c: ScbaCredentialSummary, fn: () => Promise<{ success: boolean; error?: string }>, okMsg: string) => {
		try {
			setBusyId(c.id);
			const res = await fn();
			if (res.success) enqueueSnackbar(okMsg, SNACK);
			else enqueueSnackbar(res.error || "No se pudo completar la acción", { ...SNACK, variant: "warning" });
			await onChanged();
		} finally {
			setBusyId(null);
		}
	};

	const openUnlink = async (c: ScbaCredentialSummary) => {
		setUnlinkTarget(c);
		setImpact(null);
		setMode("keep");
		setLoadingImpact(true);
		try {
			const res = await scbaCredentialsService.getUnlinkImpactById(c.id);
			setImpact(res.success && res.data ? res.data : null);
		} finally {
			setLoadingImpact(false);
		}
	};
	const confirmUnlink = async () => {
		if (!unlinkTarget) return;
		try {
			setUnlinking(true);
			const res = await scbaCredentialsService.unlinkCredentials(unlinkTarget.id, mode);
			if (res.success) {
				enqueueSnackbar("Cuenta SCBA desvinculada", { ...SNACK, variant: "success" });
				setUnlinkTarget(null);
				await onChanged();
			} else enqueueSnackbar(res.error || "No se pudo desvincular", { ...SNACK, variant: "error" });
		} finally {
			setUnlinking(false);
		}
	};

	return (
		<Stack spacing={1.5}>
			<Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
				<Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
					Cuentas de la Suprema Corte del estudio: {credentials.length} de {quota.max}. Cada una importa las causas del domicilio
					electrónico de su titular; las causas que varias cuentas comparten tienen una sola carpeta.
				</Typography>
				<Tooltip title={cupoLleno ? `Tu plan permite hasta ${quota.max} cuentas` : ""}>
					<span>
						<Button
							size="small"
							variant="contained"
							startIcon={<Add size={16} />}
							onClick={openAdd}
							disabled={cupoLleno}
							sx={{ bgcolor: BRAND_BLUE, "&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88) } }}
							data-testid="scba-add-account"
						>
							Agregar cuenta
						</Button>
					</span>
				</Tooltip>
			</Stack>

			<Stack spacing={1}>
				{credentials.map((c) => {
					const estado = estadoDe(c);
					const meta = META[estado];
					const titular = nombreAbogado(c.abogadoUserId);
					const busy = busyId === c.id;
					const adminPaused = c.disabledReason === "admin";
					return (
						<Box
							key={c.id}
							sx={{
								p: 1.5,
								borderRadius: 1.25,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
							}}
						>
							<Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
								<Typography sx={{ fontSize: "0.88rem", fontWeight: 600 }}>
									{c.etiqueta || titular || c.username || "Cuenta SCBA"}
								</Typography>
								<Chip
									size="small"
									label={adminPaused ? "Pausada por el administrador" : meta.label}
									color={adminPaused ? "default" : meta.color}
								/>
								{c.principal && <Chip size="small" variant="outlined" label="Principal" />}
								<Box sx={{ flex: 1 }} />
								<Tooltip title="Sincronizar ahora">
									<span>
										<IconButton
											size="small"
											disabled={busy || !c.enabled || estado === "sync" || c.isExpired}
											onClick={() => accion(c, () => scbaCredentialsService.requestSyncById(c.id), "Sincronización iniciada")}
										>
											<Refresh2 size={16} />
										</IconButton>
									</span>
								</Tooltip>
								<Tooltip title="Editar etiqueta y abogado">
									<IconButton size="small" onClick={() => openMeta(c)}>
										<Edit2 size={16} />
									</IconButton>
								</Tooltip>
								<Tooltip title="Cambiar contraseña">
									<IconButton size="small" onClick={() => openPassword(c)}>
										<Key size={16} />
									</IconButton>
								</Tooltip>
								<Tooltip title={c.enabled ? "Pausar" : "Reanudar"}>
									<span>
										<IconButton
											size="small"
											disabled={busy || adminPaused}
											onClick={() =>
												accion(
													c,
													() => scbaCredentialsService.toggleCredentialById(c.id),
													c.enabled ? "Cuenta pausada" : "Cuenta reanudada",
												)
											}
										>
											{c.enabled ? <PauseCircle size={16} /> : <PlayCircle size={16} />}
										</IconButton>
									</span>
								</Tooltip>
								<Tooltip title="Desvincular">
									<IconButton size="small" color="error" onClick={() => openUnlink(c)}>
										<Trash size={16} />
									</IconButton>
								</Tooltip>
							</Stack>
							<Typography sx={{ fontSize: "0.76rem", color: "text.secondary", mt: 0.5 }}>
								{[
									c.username ? `Usuario ${c.username}` : null,
									titular ? `Abogado: ${titular}` : null,
									c.lastSync ? `última sincronización ${fecha(c.lastSync)}` : "sin sincronizar todavía",
								]
									.filter(Boolean)
									.join(" · ")}
							</Typography>
						</Box>
					);
				})}
			</Stack>

			<Dialog open={formOpen} onClose={() => !saving && setFormOpen(false)} maxWidth="xs" fullWidth>
				<DialogTitle sx={{ fontSize: "1rem" }}>{formTarget ? "Cambiar la contraseña" : "Agregar cuenta de la Suprema Corte"}</DialogTitle>
				<DialogContent dividers>
					<Stack spacing={1.5} sx={{ pt: 0.5 }}>
						<TextField
							fullWidth
							size="small"
							label="Usuario del portal"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							disabled={!!formTarget}
							autoComplete="off"
							inputProps={{ autoCapitalize: "none", autoCorrect: "off", spellCheck: false }}
						/>
						<TextField
							fullWidth
							size="small"
							label="Contraseña del portal"
							type="password"
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete="new-password"
						/>
						{!formTarget && (
							<>
								<TextField
									fullWidth
									size="small"
									label="Etiqueta (opcional)"
									placeholder="Ej.: Dra. Pérez"
									value={etiqueta}
									onChange={(e) => setEtiqueta(e.target.value)}
									inputProps={{ maxLength: 60 }}
								/>
								<FormControl fullWidth size="small">
									<InputLabel id="scba-abogado">Abogado titular (opcional)</InputLabel>
									<Select
										labelId="scba-abogado"
										label="Abogado titular (opcional)"
										value={abogado}
										onChange={(e) => setAbogado(String(e.target.value))}
									>
										<MenuItem value="">
											<em>Sin titular</em>
										</MenuItem>
										{abogados.map((a) => (
											<MenuItem key={a.id} value={a.id}>
												{a.label}
											</MenuItem>
										))}
									</Select>
								</FormControl>
								<Typography sx={{ fontSize: "0.74rem", color: "text.secondary" }}>
									Las carpetas que importe esta cuenta nacen con el abogado titular como responsable.
								</Typography>
							</>
						)}
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 1.5 }}>
					<Button onClick={() => setFormOpen(false)} disabled={saving} color="inherit">
						Cancelar
					</Button>
					<Button
						variant="contained"
						onClick={handleSave}
						disabled={saving}
						startIcon={saving ? <CircularProgress size={14} color="inherit" /> : <Link1 size={16} />}
						sx={{ bgcolor: BRAND_BLUE, "&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88) } }}
					>
						{saving ? "Guardando…" : formTarget ? "Actualizar" : "Conectar"}
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog open={!!metaTarget} onClose={() => !savingMeta && setMetaTarget(null)} maxWidth="xs" fullWidth>
				<DialogTitle sx={{ fontSize: "1rem" }}>Etiqueta y abogado titular</DialogTitle>
				<DialogContent dividers>
					<Stack spacing={1.5} sx={{ pt: 0.5 }}>
						<TextField
							fullWidth
							size="small"
							label="Etiqueta"
							value={metaEtiqueta}
							onChange={(e) => setMetaEtiqueta(e.target.value)}
							inputProps={{ maxLength: 60 }}
						/>
						<FormControl fullWidth size="small">
							<InputLabel id="scba-abogado-meta">Abogado titular</InputLabel>
							<Select
								labelId="scba-abogado-meta"
								label="Abogado titular"
								value={metaAbogado}
								onChange={(e) => setMetaAbogado(String(e.target.value))}
							>
								<MenuItem value="">
									<em>Sin titular</em>
								</MenuItem>
								{abogados.map((a) => (
									<MenuItem key={a.id} value={a.id}>
										{a.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 1.5 }}>
					<Button onClick={() => setMetaTarget(null)} disabled={savingMeta} color="inherit">
						Cancelar
					</Button>
					<Button variant="contained" onClick={saveMeta} disabled={savingMeta}>
						Guardar
					</Button>
				</DialogActions>
			</Dialog>

			<Dialog open={!!unlinkTarget} onClose={() => !unlinking && setUnlinkTarget(null)} maxWidth="xs" fullWidth>
				<DialogTitle sx={{ fontSize: "1rem" }}>¿Desvincular esta cuenta SCBA?</DialogTitle>
				<DialogContent dividers>
					{loadingImpact ? (
						<Stack alignItems="center" sx={{ py: 2 }}>
							<CircularProgress size={22} />
						</Stack>
					) : (
						<Stack spacing={1.5}>
							<Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
								{impact && impact.folders.total > 0
									? `${impact.folders.total} carpeta${impact.folders.total > 1 ? "s" : ""} dependen solo de esta cuenta (${
											impact.folders.active
									  } activa${impact.folders.active === 1 ? "" : "s"}, ${impact.folders.archived} archivada${
											impact.folders.archived === 1 ? "" : "s"
									  }). Las que también cubre otra cuenta del estudio no se tocan.`
									: "Ninguna carpeta depende solo de esta cuenta: las demás cuentas del estudio siguen cubriendo las causas."}
							</Typography>
							{impact && impact.folders.total > 0 && (
								<RadioGroup value={mode} onChange={(e) => setMode(e.target.value as "keep" | "delete")}>
									<FormControlLabel
										value="keep"
										control={<Radio size="small" />}
										label={
											<Typography sx={{ fontSize: "0.82rem" }}>Conservar las carpetas (dejan de actualizarse por esta cuenta)</Typography>
										}
									/>
									<FormControlLabel
										value="delete"
										control={<Radio size="small" />}
										label={<Typography sx={{ fontSize: "0.82rem" }}>Eliminar las carpetas</Typography>}
									/>
								</RadioGroup>
							)}
							{mode === "delete" && impact && impact.folders.total > 0 && (
								<Alert severity="warning" sx={{ "& .MuiAlert-message": { fontSize: "0.8rem" } }}>
									Se eliminan {impact.folders.total} carpeta{impact.folders.total > 1 ? "s" : ""} con sus tareas, eventos y notas.
								</Alert>
							)}
						</Stack>
					)}
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 1.5 }}>
					<Button onClick={() => setUnlinkTarget(null)} disabled={unlinking} color="inherit">
						Cancelar
					</Button>
					<Button
						variant="contained"
						color="error"
						onClick={confirmUnlink}
						disabled={unlinking || loadingImpact}
						startIcon={unlinking ? <CircularProgress size={14} color="inherit" /> : <Trash size={16} />}
					>
						{unlinking ? "Desvinculando…" : "Desvincular"}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
};

export default ScbaAccountsList;

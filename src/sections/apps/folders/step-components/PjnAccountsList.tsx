/**
 * Varias cuentas PJN por cuenta (solo Premium, 2/11/2026; la-ads equipos-credenciales-multiples.md §6 bis, nivel 4).
 *
 * La muestra `PjnAccountConnect` cuando el hub informa `quota.max > 1` y ya hay al menos una credencial. Una fila por
 * credencial con etiqueta, abogado titular, CUIL, estado y acciones (sincronizar, cambiar clave, pausar/reanudar, editar,
 * desvincular por credencial: solo afecta a las carpetas que ninguna otra cuenta cubre). «Agregar cuenta» hasta el cupo.
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
import { Add, Edit2, Key, Link1, PauseCircle, PlayCircle, Refresh2, Trash, ArrowRotateLeft } from "iconsax-react";
import { useSnackbar } from "notistack";
import { useSelector } from "react-redux";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { useTeam } from "contexts/TeamContext";
import pjnCredentialsService, { PjnCredentialSummary, PjnCredentialsQuota, UnlinkImpact } from "api/pjnCredentials";

const SNACK = { variant: "info" as const, anchorOrigin: { vertical: "bottom", horizontal: "right" } as const };

type Estado = "ok" | "sync" | "pending" | "error" | "paused";
const estadoDe = (c: PjnCredentialSummary): Estado => {
	if (!c.enabled) return "paused";
	if (c.syncStatus === "in_progress" || c.syncStatus === "pending") return "sync";
	if (c.credentialInvalid || c.syncStatus === "error") return "error";
	if (c.verified && c.isValid) return "ok";
	return "pending";
};
const META: Record<Estado, { label: string; color: "success" | "warning" | "error" | "default" | "info" }> = {
	ok: { label: "Sincronizada", color: "success" },
	sync: { label: "Sincronizando", color: "info" },
	pending: { label: "Pendiente", color: "warning" },
	error: { label: "Requiere atención", color: "error" },
	paused: { label: "Pausada", color: "default" },
};
const fecha = (v?: string | null) => (v ? new Date(v).toLocaleDateString("es-AR") : null);

interface Props {
	credentials: PjnCredentialSummary[];
	quota: PjnCredentialsQuota;
	onChanged: () => Promise<void> | void;
	/** Abre «Re-sincronizar» (vista previa de papelera y bajas) para esa cuenta; lo provee el componente padre */
	onResync?: (c: PjnCredentialSummary) => void;
}

const PjnAccountsList = ({ credentials, quota, onChanged, onResync }: Props) => {
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
			// `owner` puede venir poblado (objeto) o como id
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

	// Alta / clave
	const [formOpen, setFormOpen] = useState(false);
	const [formTarget, setFormTarget] = useState<PjnCredentialSummary | null>(null);
	const [cuil, setCuil] = useState("");
	const [password, setPassword] = useState("");
	const [etiqueta, setEtiqueta] = useState("");
	const [abogado, setAbogado] = useState("");
	const [saving, setSaving] = useState(false);
	// Etiqueta / abogado
	const [metaTarget, setMetaTarget] = useState<PjnCredentialSummary | null>(null);
	const [metaEtiqueta, setMetaEtiqueta] = useState("");
	const [metaAbogado, setMetaAbogado] = useState("");
	const [savingMeta, setSavingMeta] = useState(false);
	// Desvincular
	const [unlinkTarget, setUnlinkTarget] = useState<PjnCredentialSummary | null>(null);
	const [impact, setImpact] = useState<UnlinkImpact | null>(null);
	const [loadingImpact, setLoadingImpact] = useState(false);
	const [mode, setMode] = useState<"keep" | "delete">("keep");
	const [unlinking, setUnlinking] = useState(false);
	const [busyId, setBusyId] = useState<string | null>(null);

	const cupoLleno = credentials.length >= quota.max;

	const openAdd = () => {
		setFormTarget(null);
		setCuil("");
		setPassword("");
		setEtiqueta("");
		setAbogado("");
		setFormOpen(true);
	};
	const openPassword = (c: PjnCredentialSummary) => {
		setFormTarget(c);
		setCuil(c.cuil || "");
		setPassword("");
		setFormOpen(true);
	};
	const handleSave = async () => {
		if (!password.trim() || (!formTarget && !cuil.trim())) {
			enqueueSnackbar("Ingresá CUIL y contraseña del portal", { ...SNACK, variant: "warning" });
			return;
		}
		try {
			setSaving(true);
			const res = formTarget
				? await pjnCredentialsService.updatePasswordById(formTarget.id, password)
				: await pjnCredentialsService.linkCredentials(cuil.trim(), password, {
						etiqueta: etiqueta.trim() || undefined,
						abogadoUserId: abogado || null,
				  });
			if (res.success) {
				enqueueSnackbar(
					formTarget ? "Contraseña actualizada. Volvemos a sincronizar." : "Cuenta PJN conectada. Empezamos a sincronizar sus causas.",
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

	const openMeta = (c: PjnCredentialSummary) => {
		setMetaTarget(c);
		setMetaEtiqueta(c.etiqueta || "");
		setMetaAbogado(c.abogadoUserId ? String(c.abogadoUserId) : "");
	};
	const saveMeta = async () => {
		if (!metaTarget) return;
		try {
			setSavingMeta(true);
			const res = await pjnCredentialsService.updateCredential(metaTarget.id, {
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

	const accion = async (c: PjnCredentialSummary, fn: () => Promise<{ success: boolean; error?: string }>, okMsg: string) => {
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

	const openUnlink = async (c: PjnCredentialSummary) => {
		setUnlinkTarget(c);
		setImpact(null);
		setMode("keep");
		setLoadingImpact(true);
		try {
			const res = await pjnCredentialsService.getUnlinkImpactById(c.id);
			setImpact(res.success && res.data ? res.data : null);
		} finally {
			setLoadingImpact(false);
		}
	};
	const confirmUnlink = async () => {
		if (!unlinkTarget) return;
		try {
			setUnlinking(true);
			const res = await pjnCredentialsService.unlinkCredentialById(unlinkTarget.id, mode);
			if (res.success) {
				enqueueSnackbar("Cuenta PJN desvinculada", { ...SNACK, variant: "success" });
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
					Cuentas del Poder Judicial del estudio: {credentials.length} de {quota.max}. Cada una importa las causas de «Mis Causas» de su
					titular; las causas que varias cuentas comparten tienen una sola carpeta.
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
							data-testid="pjn-add-account"
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
								<Typography sx={{ fontSize: "0.88rem", fontWeight: 600 }}>{c.etiqueta || titular || c.cuil || "Cuenta PJN"}</Typography>
								<Chip size="small" label={meta.label} color={meta.color} />
								{c.principal && <Chip size="small" variant="outlined" label="Principal" />}
								<Box sx={{ flex: 1 }} />
								<Tooltip title="Sincronizar ahora">
									<span>
										<IconButton
											size="small"
											disabled={busy || !c.enabled || estado === "sync"}
											onClick={() => accion(c, () => pjnCredentialsService.requestSyncById(c.id), "Sincronización iniciada")}
										>
											<Refresh2 size={16} />
										</IconButton>
									</span>
								</Tooltip>
								{onResync && (
									<Tooltip title="Re-sincronizar desde cero (y traer carpetas de la papelera)">
										<span>
											<IconButton size="small" disabled={busy || !c.enabled} onClick={() => onResync(c)}>
												<ArrowRotateLeft size={16} />
											</IconButton>
										</span>
									</Tooltip>
								)}
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
											disabled={busy}
											onClick={() =>
												accion(
													c,
													() => pjnCredentialsService.toggleCredentialById(c.id, !c.enabled),
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
									c.cuil ? `CUIL ${c.cuil}` : null,
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
				<DialogTitle sx={{ fontSize: "1rem" }}>{formTarget ? "Cambiar la contraseña" : "Agregar cuenta del Poder Judicial"}</DialogTitle>
				<DialogContent dividers>
					<Stack spacing={1.5} sx={{ pt: 0.5 }}>
						<TextField
							fullWidth
							size="small"
							label="CUIL"
							value={cuil}
							onChange={(e) => setCuil(e.target.value)}
							disabled={!!formTarget}
							autoComplete="off"
							inputProps={{ inputMode: "numeric" }}
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
									<InputLabel id="pjn-abogado">Abogado titular (opcional)</InputLabel>
									<Select
										labelId="pjn-abogado"
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
							<InputLabel id="pjn-abogado-meta">Abogado titular</InputLabel>
							<Select
								labelId="pjn-abogado-meta"
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
				<DialogTitle sx={{ fontSize: "1rem" }}>¿Desvincular esta cuenta PJN?</DialogTitle>
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

export default PjnAccountsList;

/**
 * Varias cuentas MEV por cuenta (solo Premium, 2/11/2026; la-ads equipos-credenciales-multiples.md §6 bis, nivel 4).
 *
 * La muestra `MevAccountConnect` cuando el hub informa `quota.max > 1` (Premium vigente + interruptor encendido). Una fila
 * por credencial de la cuenta con etiqueta, abogado titular, usuario del portal, estado y acciones (editar, cambiar clave,
 * pausar/reanudar, desvincular con impacto). «Agregar cuenta» hasta el cupo. Solo la ven owner y admin (la pestaña ya
 * está restringida).
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
	Divider,
	FormControl,
	IconButton,
	InputAdornment,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	TextField,
	Tooltip,
	Typography,
	alpha,
	useTheme,
} from "@mui/material";
import { Add, Edit2, Eye, EyeSlash, Key, Link1, PauseCircle, PlayCircle, ShieldTick, Trash } from "iconsax-react";
import { useSnackbar } from "notistack";
import { useSelector } from "react-redux";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { useTeam } from "contexts/TeamContext";
import { getMevStatusReason, mevStatusNotice } from "utils/mevCredential";
import mevCredentialsService, { MevCredentialData, MevCredentialsQuota, MevUnlinkImpact } from "api/mevCredentials";

const SNACK_ANCHOR = { vertical: "bottom", horizontal: "right" } as const;

type CredStatus = "valid" | "pending" | "invalid" | "expired" | "disabled";
// Mismo criterio que MevAccountConnect (utils/mevCredential getMevStatusReason).
const deriveStatus = (c: MevCredentialData): CredStatus => {
	if (!c.enabled) return "disabled";
	switch (getMevStatusReason(c as any)) {
		case "disabled_by_failures":
			return "disabled";
		case "password_expired":
			return "expired";
		case "credential_invalid":
			return "invalid";
		case "ok":
			return "valid";
		default:
			return "pending";
	}
};
const STATUS_META: Record<CredStatus, { label: string; color: "success" | "warning" | "error" | "default" }> = {
	valid: { label: "Validada", color: "success" },
	pending: { label: "Pendiente", color: "warning" },
	invalid: { label: "Rechazada", color: "error" },
	expired: { label: "Vencida", color: "error" },
	disabled: { label: "Pausada", color: "default" },
};

interface Props {
	credentials: MevCredentialData[];
	quota: MevCredentialsQuota;
	onChanged: () => Promise<void> | void;
}

const MevAccountsList = ({ credentials, quota, onChanged }: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { enqueueSnackbar } = useSnackbar();
	const { activeTeam } = useTeam();
	const authUser = useSelector((state: any) => state.auth?.user);

	// Abogados elegibles como titular: el propietario (cuenta del equipo) y los integrantes activos.
	const abogados = useMemo(() => {
		const ownerId = String(authUser?._id || authUser?.id || "");
		const list: { id: string; label: string }[] = [];
		if (ownerId)
			list.push({
				id: ownerId,
				label: [authUser?.firstName, authUser?.lastName].filter(Boolean).join(" ") || authUser?.email || "Propietario",
			});
		for (const m of activeTeam?.members || []) {
			if (m.status !== "active") continue;
			const id = String((m as any).userId?._id || m.userId);
			if (!id || list.some((x) => x.id === id)) continue;
			list.push({ id, label: [m.firstName, m.lastName].filter(Boolean).join(" ") || m.email });
		}
		return list;
	}, [activeTeam, authUser]);
	const nombreAbogado = (id?: string | null) => (id ? abogados.find((a) => a.id === String(id))?.label || "Integrante" : null);

	// Alta / cambio de clave
	const [formOpen, setFormOpen] = useState(false);
	const [formTarget, setFormTarget] = useState<MevCredentialData | null>(null); // null = alta nueva
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [etiqueta, setEtiqueta] = useState("");
	const [abogado, setAbogado] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [saving, setSaving] = useState(false);

	// Editar etiqueta / abogado
	const [metaTarget, setMetaTarget] = useState<MevCredentialData | null>(null);
	const [metaEtiqueta, setMetaEtiqueta] = useState("");
	const [metaAbogado, setMetaAbogado] = useState("");
	const [savingMeta, setSavingMeta] = useState(false);

	// Desvincular
	const [unlinkTarget, setUnlinkTarget] = useState<MevCredentialData | null>(null);
	const [unlinkImpact, setUnlinkImpact] = useState<MevUnlinkImpact | null>(null);
	const [loadingImpact, setLoadingImpact] = useState(false);
	const [unlinking, setUnlinking] = useState(false);
	const [togglingId, setTogglingId] = useState<string | null>(null);

	const cupoLleno = credentials.length >= quota.max;

	const openAdd = () => {
		setFormTarget(null);
		setUsername("");
		setPassword("");
		setEtiqueta("");
		setAbogado("");
		setShowPassword(false);
		setFormOpen(true);
	};
	const openPassword = (c: MevCredentialData) => {
		setFormTarget(c);
		setUsername(c.username || "");
		setPassword("");
		setEtiqueta(c.etiqueta || "");
		setAbogado(c.abogadoUserId ? String(c.abogadoUserId) : "");
		setShowPassword(false);
		setFormOpen(true);
	};
	const closeForm = () => {
		if (saving) return;
		setFormOpen(false);
	};
	const handleSave = async () => {
		if (!username.trim() || !password.trim()) {
			enqueueSnackbar("Ingresá usuario y contraseña del portal MEV", { variant: "warning", anchorOrigin: SNACK_ANCHOR });
			return;
		}
		try {
			setSaving(true);
			const res = await mevCredentialsService.saveCredentials(username.trim(), password, null, {
				etiqueta: etiqueta.trim() || undefined,
				abogadoUserId: abogado || null,
			});
			if (res.success) {
				enqueueSnackbar(
					res.data?.verified
						? "Cuenta MEV validada. Ya la usamos para consultar las causas."
						: "Cuenta MEV guardada. La validaremos al consultar las causas.",
					{ variant: "success", anchorOrigin: SNACK_ANCHOR },
				);
				setFormOpen(false);
				await onChanged();
			} else if (res.code === "CREDENTIAL_QUOTA_REACHED" || res.code === "PREMIUM_REQUIRED") {
				enqueueSnackbar(res.error || "No hay cupo para otra cuenta", { variant: "warning", anchorOrigin: SNACK_ANCHOR });
			} else {
				enqueueSnackbar(res.error || "No se pudo guardar la cuenta", { variant: "error", anchorOrigin: SNACK_ANCHOR });
			}
		} finally {
			setSaving(false);
		}
	};

	const openMeta = (c: MevCredentialData) => {
		setMetaTarget(c);
		setMetaEtiqueta(c.etiqueta || "");
		setMetaAbogado(c.abogadoUserId ? String(c.abogadoUserId) : "");
	};
	const saveMeta = async () => {
		if (!metaTarget) return;
		try {
			setSavingMeta(true);
			const res = await mevCredentialsService.updateCredential(metaTarget.id, {
				etiqueta: metaEtiqueta.trim(),
				abogadoUserId: metaAbogado || null,
			});
			if (res.success) {
				setMetaTarget(null);
				await onChanged();
			} else {
				enqueueSnackbar(res.error || "No se pudo guardar", { variant: "error", anchorOrigin: SNACK_ANCHOR });
			}
		} finally {
			setSavingMeta(false);
		}
	};

	const toggle = async (c: MevCredentialData) => {
		try {
			setTogglingId(c.id);
			const res = await mevCredentialsService.toggleCredentials(c.id);
			if (!res.success) enqueueSnackbar(res.error || "No se pudo cambiar el estado", { variant: "error", anchorOrigin: SNACK_ANCHOR });
			await onChanged();
		} finally {
			setTogglingId(null);
		}
	};

	const openUnlink = async (c: MevCredentialData) => {
		setUnlinkTarget(c);
		setUnlinkImpact(null);
		setLoadingImpact(true);
		try {
			const res = await mevCredentialsService.getUnlinkImpact(c.id);
			setUnlinkImpact(res.success && res.data ? res.data : null);
		} finally {
			setLoadingImpact(false);
		}
	};
	const confirmUnlink = async () => {
		if (!unlinkTarget) return;
		try {
			setUnlinking(true);
			const res = await mevCredentialsService.deleteCredentials(unlinkTarget.id);
			if (res.success) {
				enqueueSnackbar("Cuenta MEV desvinculada", { variant: "success", anchorOrigin: SNACK_ANCHOR });
				setUnlinkTarget(null);
				await onChanged();
			} else {
				enqueueSnackbar(res.error || "No se pudo desvincular", { variant: "error", anchorOrigin: SNACK_ANCHOR });
			}
		} finally {
			setUnlinking(false);
		}
	};

	const otrasSanas = (c: MevCredentialData) => credentials.some((o) => o.id !== c.id && o.enabled && !o.isExpired);

	return (
		<Stack spacing={1.5}>
			<Stack direction="row" alignItems="center" justifyContent="space-between" flexWrap="wrap" gap={1}>
				<Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
					Cuentas del portal MEV del estudio: {credentials.length} de {quota.max}. Cualquiera de ellas sirve para consultar todas las causas
					de Buenos Aires; una por abogado evita que el portal bloquee por exceso de consultas.
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
							data-testid="mev-add-account"
						>
							Agregar cuenta
						</Button>
					</span>
				</Tooltip>
			</Stack>

			{credentials.length === 0 && (
				<Alert severity="info" sx={{ "& .MuiAlert-message": { fontSize: "0.82rem" } }}>
					Todavía no hay cuentas MEV conectadas. Agregá la del estudio o una por abogado.
				</Alert>
			)}

			<Stack spacing={1}>
				{credentials.map((c) => {
					const status = deriveStatus(c);
					const meta = STATUS_META[status];
					const titular = nombreAbogado(c.abogadoUserId);
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
								<Typography sx={{ fontSize: "0.88rem", fontWeight: 600 }}>{c.etiqueta || titular || c.username || "Cuenta MEV"}</Typography>
								<Chip size="small" label={meta.label} color={meta.color} />
								<Box sx={{ flex: 1 }} />
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
										<IconButton size="small" onClick={() => toggle(c)} disabled={togglingId === c.id}>
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
									c.verifiedAt ? `validada el ${new Date(c.verifiedAt).toLocaleDateString("es-AR")}` : null,
								]
									.filter(Boolean)
									.join(" · ")}
							</Typography>
							{status !== "valid" && status !== "disabled" && mevStatusNotice(c as any) && (
								<Typography sx={{ fontSize: "0.76rem", color: "text.secondary", mt: 0.5 }}>
									{mevStatusNotice(c as any)}
									{otrasSanas(c) ? " Las otras cuentas siguen cubriendo las causas." : ""}
								</Typography>
							)}
						</Box>
					);
				})}
			</Stack>

			{/* Alta / cambio de clave */}
			<Dialog open={formOpen} onClose={closeForm} maxWidth="xs" fullWidth>
				<DialogTitle sx={{ fontSize: "1rem" }}>{formTarget ? "Cambiar la contraseña" : "Agregar cuenta MEV"}</DialogTitle>
				<DialogContent dividers>
					<Stack spacing={1.5} sx={{ pt: 0.5 }}>
						<TextField
							fullWidth
							size="small"
							label="Nombre de usuario"
							value={username}
							onChange={(e) => setUsername(e.target.value)}
							autoComplete="off"
							disabled={!!formTarget}
							inputProps={{ autoCapitalize: "none", autoCorrect: "off", spellCheck: false }}
						/>
						<TextField
							fullWidth
							size="small"
							label="Contraseña MEV"
							type={showPassword ? "text" : "password"}
							value={password}
							onChange={(e) => setPassword(e.target.value)}
							autoComplete="new-password"
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">
										<Tooltip title="Se almacena encriptada (AES-256)">
											<ShieldTick size={16} variant="Bulk" color={BRAND_BLUE} />
										</Tooltip>
										<IconButton onClick={() => setShowPassword((s) => !s)} edge="end" size="small">
											{showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
										</IconButton>
									</InputAdornment>
								),
							}}
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
									<InputLabel id="mev-abogado">Abogado titular (opcional)</InputLabel>
									<Select
										labelId="mev-abogado"
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
							</>
						)}
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 1.5 }}>
					<Button onClick={closeForm} disabled={saving} color="inherit">
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

			{/* Etiqueta y abogado */}
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
							<InputLabel id="mev-abogado-meta">Abogado titular</InputLabel>
							<Select
								labelId="mev-abogado-meta"
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

			{/* Desvincular con impacto */}
			<Dialog open={!!unlinkTarget} onClose={() => !unlinking && setUnlinkTarget(null)} maxWidth="xs" fullWidth>
				<DialogTitle sx={{ fontSize: "1rem" }}>¿Desvincular esta cuenta MEV?</DialogTitle>
				<DialogContent dividers>
					{loadingImpact ? (
						<Stack alignItems="center" sx={{ py: 2 }}>
							<CircularProgress size={22} />
						</Stack>
					) : unlinkImpact && unlinkImpact.folders.total > 0 && !(unlinkTarget && otrasSanas(unlinkTarget)) ? (
						<Alert severity="warning" sx={{ "& .MuiAlert-message": { fontSize: "0.82rem" } }}>
							{unlinkImpact.folders.total} causa{unlinkImpact.folders.total > 1 ? "s" : ""} dejará
							{unlinkImpact.folders.total > 1 ? "n" : ""} de consultarse hasta que conectes otra cuenta.
						</Alert>
					) : (
						<Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
							Las causas siguen cubiertas por las otras cuentas del estudio. Las carpetas no se tocan.
						</Typography>
					)}
					<Divider sx={{ my: 1.5 }} />
					<Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
						{unlinkTarget?.etiqueta || unlinkTarget?.username || "Cuenta MEV"}
						{unlinkTarget?.abogadoUserId ? ` · ${nombreAbogado(unlinkTarget.abogadoUserId)}` : ""}
					</Typography>
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

export default MevAccountsList;

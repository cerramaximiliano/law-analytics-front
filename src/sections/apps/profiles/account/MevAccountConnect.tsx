import { useState, useEffect, useCallback } from "react";
import {
	Box,
	Stack,
	Typography,
	TextField,
	Button,
	InputAdornment,
	IconButton,
	Tooltip,
	CircularProgress,
	Chip,
	Divider,
	Dialog,
	DialogContent,
	DialogActions,
	alpha,
	useTheme,
} from "@mui/material";
import { Eye, EyeSlash, ShieldTick, TickCircle, CloseCircle, Link1, Trash, Edit2, Refresh, Warning2 } from "iconsax-react";
import { useSnackbar } from "notistack";
import { useSelector } from "react-redux";
import { dispatch as storeDispatch } from "store";
import { getFoldersByUserId } from "store/reducers/folder";
import { BRAND_BLUE } from "themes/dashboardTokens";
import mevCredentialsService, { MevCredentialData, MevUnlinkImpact } from "api/mevCredentials";

type ConnectionStatus = "connected" | "error" | "disconnected" | null;

interface Props {
	onConnectionStatusChange?: (connected: ConnectionStatus) => void;
}

type CredStatus = "valid" | "pending" | "invalid" | "expired" | "disabled";

function deriveStatus(c: MevCredentialData): CredStatus {
	if (!c.enabled) return "disabled";
	if (c.isExpired) return "expired";
	if (c.verified) return "valid";
	if (c.lastError) return "invalid";
	return "pending";
}

const STATUS_META: Record<CredStatus, { label: string; color: "success" | "warning" | "error" | "default" }> = {
	valid: { label: "Validada", color: "success" },
	pending: { label: "Pendiente de validar", color: "warning" },
	invalid: { label: "Inválida", color: "error" },
	expired: { label: "Contraseña expirada", color: "error" },
	disabled: { label: "Deshabilitada", color: "default" },
};

const isErrorStatus = (s: CredStatus) => s === "invalid" || s === "expired" || s === "disabled";

// EditTarget: a qué credencial apunta el formulario abierto.
type EditTarget = { type: "global" } | { type: "causa"; causaId: string; label: string } | null;

const MevAccountConnect = ({ onConnectionStatusChange }: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { enqueueSnackbar } = useSnackbar();
	const authUser = useSelector((state: any) => state.auth?.user);

	// Refresca el listado de folders en el store para que la tabla refleje los
	// cambios de mevCredentialStatus (ej. tras desvincular → 'missing', o recargar → 'pending').
	const refreshFolders = () => {
		const uid = authUser?._id || authUser?.id;
		if (uid) storeDispatch(getFoldersByUserId(uid, true) as any);
	};

	const [loading, setLoading] = useState(true);
	const [global, setGlobal] = useState<MevCredentialData | null>(null);
	const [perCausa, setPerCausa] = useState<MevCredentialData[]>([]);

	// Formulario (compartido entre global y per-causa según editTarget)
	const [editTarget, setEditTarget] = useState<EditTarget>(null);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [togglingId, setTogglingId] = useState<string | null>(null);

	// Diálogo de impacto de desvinculación
	const [unlinkTarget, setUnlinkTarget] = useState<MevCredentialData | null>(null);
	const [unlinkImpact, setUnlinkImpact] = useState<MevUnlinkImpact | null>(null);
	const [loadingImpact, setLoadingImpact] = useState(false);
	const [unlinking, setUnlinking] = useState(false);

	const reportOverall = useCallback(
		(g: MevCredentialData | null, pc: MevCredentialData[]) => {
			const all = [g, ...pc].filter(Boolean) as MevCredentialData[];
			if (all.length === 0) {
				onConnectionStatusChange?.("disconnected");
				return;
			}
			const anyError = all.some((c) => isErrorStatus(deriveStatus(c)));
			onConnectionStatusChange?.(anyError ? "error" : "connected");
		},
		[onConnectionStatusChange],
	);

	const fetchStatus = useCallback(async () => {
		try {
			setLoading(true);
			const res = await mevCredentialsService.getCredentialsStatus();
			const g = res.success && res.data ? res.data.global : null;
			const pc = res.success && res.data ? res.data.perCausa || [] : [];
			setGlobal(g);
			setPerCausa(pc);
			reportOverall(g, pc);
		} catch {
			setGlobal(null);
			setPerCausa([]);
			onConnectionStatusChange?.("disconnected");
		} finally {
			setLoading(false);
		}
	}, [reportOverall, onConnectionStatusChange]);

	useEffect(() => {
		fetchStatus();
	}, [fetchStatus]);

	const startEdit = (target: EditTarget) => {
		setUsername("");
		setPassword("");
		setShowPassword(false);
		setEditTarget(target);
	};
	const cancelEdit = () => {
		setEditTarget(null);
		setUsername("");
		setPassword("");
	};

	const handleSave = async () => {
		if (!username.trim() || !password.trim()) {
			enqueueSnackbar("Ingresá usuario y contraseña del portal MEV", { variant: "warning" });
			return;
		}
		const causaId = editTarget?.type === "causa" ? editTarget.causaId : null;
		try {
			setSubmitting(true);
			const res = await mevCredentialsService.saveCredentials(username.trim(), password, causaId);
			if (res.success) {
				enqueueSnackbar("Credencial MEV guardada. La validaremos al consultar tus causas.", { variant: "success" });
				cancelEdit();
				await fetchStatus();
				refreshFolders();
			} else {
				enqueueSnackbar(res.error || "No se pudo guardar la credencial", { variant: "error" });
			}
		} finally {
			setSubmitting(false);
		}
	};

	const handleToggle = async (cred: MevCredentialData) => {
		try {
			setTogglingId(cred.id);
			const res = await mevCredentialsService.toggleCredentials(cred.id);
			if (res.success) {
				enqueueSnackbar(`Credencial ${cred.enabled ? "deshabilitada" : "habilitada"}`, { variant: "success" });
				await fetchStatus();
				refreshFolders();
			} else {
				enqueueSnackbar(res.error || "No se pudo cambiar el estado", { variant: "error" });
			}
		} finally {
			setTogglingId(null);
		}
	};

	// Abre el diálogo de impacto antes de desvincular (global o per-causa).
	const openUnlink = async (cred: MevCredentialData) => {
		setUnlinkTarget(cred);
		setUnlinkImpact(null);
		setLoadingImpact(true);
		try {
			const res = await mevCredentialsService.getUnlinkImpact(cred.id);
			setUnlinkImpact(res.success && res.data ? res.data : null);
		} catch {
			setUnlinkImpact(null);
		} finally {
			setLoadingImpact(false);
		}
	};

	const closeUnlink = () => {
		if (unlinking) return;
		setUnlinkTarget(null);
		setUnlinkImpact(null);
	};

	const confirmUnlink = async () => {
		if (!unlinkTarget) return;
		try {
			setUnlinking(true);
			const res = await mevCredentialsService.deleteCredentials(unlinkTarget.id);
			if (res.success) {
				enqueueSnackbar("Credencial MEV desvinculada", { variant: "success" });
				setUnlinkTarget(null);
				setUnlinkImpact(null);
				await fetchStatus();
				refreshFolders();
			} else {
				enqueueSnackbar(res.error || "No se pudo desvincular la credencial", { variant: "error" });
			}
		} finally {
			setUnlinking(false);
		}
	};

	if (loading) {
		return (
			<Stack alignItems="center" sx={{ py: 4 }} spacing={1}>
				<CircularProgress size={24} sx={{ color: BRAND_BLUE }} />
				<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>Cargando credenciales MEV…</Typography>
			</Stack>
		);
	}

	const renderForm = (submitLabel: string, showHelp: boolean, onCancel?: () => void) => (
		<Stack spacing={1.5}>
			{showHelp && (
				<Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
					Cargá tu usuario y contraseña del portal MEV (mev.scba.gov.ar). Con esta credencial consultamos automáticamente
					tus causas de Buenos Aires. Tu contraseña se guarda encriptada (AES-256).
				</Typography>
			)}
			<TextField
				fullWidth
				size="small"
				label="Nombre de usuario"
				placeholder="Tu nombre de usuario del portal MEV"
				value={username}
				onChange={(e) => setUsername(e.target.value)}
				autoComplete="off"
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
			<Stack direction="row" spacing={1}>
				<Button
					variant="contained"
					size="small"
					onClick={handleSave}
					disabled={submitting}
					startIcon={submitting ? <CircularProgress size={14} color="inherit" /> : <Link1 size={16} />}
					sx={{ bgcolor: BRAND_BLUE, "&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88) } }}
				>
					{submitting ? "Guardando…" : submitLabel}
				</Button>
				{onCancel && (
					<Button size="small" onClick={onCancel} disabled={submitting} sx={{ color: "text.secondary" }}>
						Cancelar
					</Button>
				)}
			</Stack>
		</Stack>
	);

	const renderGlobalCard = (g: MevCredentialData) => {
		const status = deriveStatus(g);
		const meta = STATUS_META[status];
		return (
			<Stack spacing={1.5}>
				<Box
					sx={{
						p: 1.5,
						borderRadius: 1.25,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
					}}
				>
					<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 0.5 }}>
						{status === "valid" ? (
							<TickCircle size={18} variant="Bulk" color={theme.palette.success.main} />
						) : (
							<CloseCircle size={18} variant="Bulk" color={theme.palette.warning.main} />
						)}
						<Typography sx={{ fontSize: "0.88rem", fontWeight: 600 }}>Credencial de tu cuenta MEV</Typography>
						<Chip size="small" label={meta.label} color={meta.color} sx={{ ml: "auto" }} />
					</Stack>
					{g.lastError && status !== "valid" && (
						<Typography sx={{ fontSize: "0.76rem", color: "text.secondary" }}>{g.lastError.message}</Typography>
					)}
					{status === "pending" && (
						<Typography sx={{ fontSize: "0.76rem", color: "text.secondary" }}>
							La validaremos automáticamente cuando consultemos tus causas.
						</Typography>
					)}
				</Box>
				<Stack direction="row" spacing={1}>
					<Button
						size="small"
						variant="outlined"
						onClick={() => startEdit({ type: "global" })}
						startIcon={<Edit2 size={15} />}
						sx={{ borderColor: BRAND_BLUE, color: BRAND_BLUE }}
					>
						Actualizar credencial
					</Button>
					<Button size="small" color="error" onClick={() => openUnlink(g)} disabled={submitting} startIcon={<Trash size={16} />}>
						Desvincular
					</Button>
				</Stack>
			</Stack>
		);
	};

	const renderPerCausaRow = (c: MevCredentialData) => {
		const status = deriveStatus(c);
		const meta = STATUS_META[status];
		const isEditingThis = editTarget?.type === "causa" && editTarget.causaId === String(c.causaId);
		const isError = isErrorStatus(status);
		return (
			<Box
				key={c.id}
				sx={{
					p: 1.25,
					borderRadius: 1.25,
					bgcolor: alpha(theme.palette.text.primary, isDark ? 0.04 : 0.02),
					border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.12 : 0.08)}`,
				}}
			>
				<Stack direction="row" alignItems="center" spacing={1}>
					<Stack sx={{ minWidth: 0, flex: 1 }}>
						<Typography noWrap sx={{ fontSize: "0.82rem", fontWeight: 600 }}>
							{c.causaLabel || "Causa MEV"}
						</Typography>
						{c.lastError && status !== "valid" && (
							<Typography noWrap sx={{ fontSize: "0.72rem", color: "text.secondary" }}>
								{c.lastError.message}
							</Typography>
						)}
					</Stack>
					<Chip size="small" label={meta.label} color={meta.color} />
				</Stack>
				<Stack direction="row" spacing={0.5} sx={{ mt: 1 }}>
					<Button
						size="small"
						variant={isError ? "contained" : "text"}
						onClick={() => startEdit({ type: "causa", causaId: String(c.causaId), label: c.causaLabel || "Causa MEV" })}
						startIcon={isError ? <Refresh size={15} /> : <Edit2 size={15} />}
						sx={isError ? { bgcolor: BRAND_BLUE, "&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88) } } : { color: BRAND_BLUE }}
					>
						{isError ? "Recargar" : "Editar"}
					</Button>
					<Button
						size="small"
						onClick={() => handleToggle(c)}
						disabled={togglingId === c.id}
						sx={{ color: "text.secondary" }}
					>
						{togglingId === c.id ? "…" : c.enabled ? "Deshabilitar" : "Habilitar"}
					</Button>
					<Button size="small" color="error" onClick={() => openUnlink(c)} startIcon={<Trash size={15} />} sx={{ ml: "auto" }}>
						Desvincular
					</Button>
				</Stack>
				{isEditingThis && (
					<Box sx={{ mt: 1.25 }}>{renderForm("Guardar credencial", false, cancelEdit)}</Box>
				)}
			</Box>
		);
	};

	const showGlobalForm = editTarget?.type === "global" || (!global && editTarget === null);

	const impactWarn = unlinkImpact && unlinkImpact.folders.total > 0;
	const tone = impactWarn ? theme.palette.error.main : theme.palette.success.main;

	return (
		<>
			<Stack spacing={2}>
				{/* ===== Credencial GLOBAL ===== */}
				{showGlobalForm
					? renderForm(global ? "Actualizar credencial" : "Conectar cuenta MEV", true, editTarget?.type === "global" ? cancelEdit : undefined)
					: global
						? renderGlobalCard(global)
						: null}

				{/* ===== Credenciales POR CAUSA ===== */}
				{perCausa.length > 0 && (
					<Stack spacing={1}>
						<Divider />
						<Typography sx={{ fontSize: "0.78rem", fontWeight: 700, color: "text.secondary", letterSpacing: "0.02em" }}>
							Credenciales por causa ({perCausa.length})
						</Typography>
						<Typography sx={{ fontSize: "0.74rem", color: "text.secondary" }}>
							Credenciales específicas que sobrescriben la credencial de tu cuenta para una causa puntual.
						</Typography>
						{perCausa.map(renderPerCausaRow)}
					</Stack>
				)}
			</Stack>

			{/* ===== Diálogo de impacto de desvinculación ===== */}
			<Dialog open={!!unlinkTarget} onClose={closeUnlink} maxWidth="xs" fullWidth>
				<DialogContent sx={{ pt: 2.5 }}>
					<Stack spacing={1.5}>
						<Stack direction="row" alignItems="center" spacing={1}>
							<Box
								sx={{
									width: 34,
									height: 34,
									borderRadius: "50%",
									display: "inline-flex",
									alignItems: "center",
									justifyContent: "center",
									bgcolor: alpha(theme.palette.error.main, 0.12),
								}}
							>
								<Trash size={18} variant="Bulk" color={theme.palette.error.main} />
							</Box>
							<Typography sx={{ fontSize: "1rem", fontWeight: 700 }}>¿Desvincular esta credencial MEV?</Typography>
						</Stack>

						{loadingImpact ? (
							<Stack alignItems="center" sx={{ py: 2 }} spacing={1}>
								<CircularProgress size={20} sx={{ color: BRAND_BLUE }} />
								<Typography sx={{ fontSize: "0.74rem", color: "text.secondary" }}>Analizando impacto…</Typography>
							</Stack>
						) : (
							<Box
								sx={{
									p: 1.5,
									borderRadius: 1.25,
									bgcolor: alpha(tone, isDark ? 0.14 : 0.08),
									border: `1px solid ${alpha(tone, isDark ? 0.3 : 0.2)}`,
								}}
							>
								{impactWarn ? (
									<Stack spacing={0.75}>
										<Stack direction="row" alignItems="center" spacing={0.75}>
											<Warning2 size={16} variant="Bold" color={theme.palette.error.main} />
											<Typography sx={{ fontSize: "0.82rem", fontWeight: 600, color: theme.palette.error.main }}>
												{unlinkImpact!.folders.total} causa{unlinkImpact!.folders.total > 1 ? "s" : ""} dejará
												{unlinkImpact!.folders.total > 1 ? "n" : ""} de seguirse
											</Typography>
										</Stack>
										<Typography sx={{ fontSize: "0.76rem", color: "text.secondary" }}>
											No vamos a consultar movimientos nuevos de esas causas del MEV hasta que vincules una credencial de
											nuevo. Las carpetas no se borran.
										</Typography>
										{unlinkImpact!.folders.names.length > 0 && (
											<Box sx={{ maxHeight: 120, overflowY: "auto", mt: 0.5 }}>
												{unlinkImpact!.folders.names.map((n, i) => (
													<Typography key={i} sx={{ fontSize: "0.74rem", color: "text.secondary" }}>
														• {n}
													</Typography>
												))}
											</Box>
										)}
									</Stack>
								) : (
									<Stack direction="row" alignItems="center" spacing={0.75}>
										<TickCircle size={16} variant="Bulk" color={theme.palette.success.main} />
										<Typography sx={{ fontSize: "0.78rem", color: "text.secondary" }}>
											{unlinkImpact?.coveredByGlobal
												? "Esta causa seguirá sincronizándose con la credencial de tu cuenta MEV."
												: "Ninguna causa quedará sin seguimiento."}
										</Typography>
									</Stack>
								)}
							</Box>
						)}
					</Stack>
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 2 }}>
					<Button onClick={closeUnlink} disabled={unlinking} sx={{ color: "text.secondary" }}>
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
		</>
	);
};

export default MevAccountConnect;

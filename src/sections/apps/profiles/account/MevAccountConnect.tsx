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
	Dialog,
	DialogContent,
	DialogActions,
	alpha,
	useTheme,
} from "@mui/material";
import { Eye, EyeSlash, ShieldTick, TickCircle, CloseCircle, Link1, Trash, Edit2, Warning2 } from "iconsax-react";
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

/**
 * Modelo "una credencial MEV por usuario": esta vista gestiona ÚNICAMENTE la
 * credencial de la cuenta del usuario (global, causaId=null), que cubre todas sus
 * causas de Buenos Aires. Las credenciales per-causa quedaron deprecadas y no se
 * exponen; al guardar la credencial de la cuenta, la API elimina cualquier per-causa
 * remanente (ver saveCredentials en el server).
 */
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

	// Formulario de la credencial de la cuenta
	const [editing, setEditing] = useState(false);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [submitting, setSubmitting] = useState(false);

	// Diálogo de impacto de desvinculación
	const [unlinkOpen, setUnlinkOpen] = useState(false);
	const [unlinkImpact, setUnlinkImpact] = useState<MevUnlinkImpact | null>(null);
	const [loadingImpact, setLoadingImpact] = useState(false);
	const [unlinking, setUnlinking] = useState(false);

	const reportOverall = useCallback(
		(g: MevCredentialData | null) => {
			if (!g) {
				onConnectionStatusChange?.("disconnected");
				return;
			}
			onConnectionStatusChange?.(isErrorStatus(deriveStatus(g)) ? "error" : "connected");
		},
		[onConnectionStatusChange],
	);

	const fetchStatus = useCallback(async () => {
		try {
			setLoading(true);
			const res = await mevCredentialsService.getCredentialsStatus();
			const g = res.success && res.data ? res.data.global : null;
			setGlobal(g);
			reportOverall(g);
		} catch {
			setGlobal(null);
			onConnectionStatusChange?.("disconnected");
		} finally {
			setLoading(false);
		}
	}, [reportOverall, onConnectionStatusChange]);

	useEffect(() => {
		fetchStatus();
	}, [fetchStatus]);

	const startEdit = () => {
		setUsername("");
		setPassword("");
		setShowPassword(false);
		setEditing(true);
	};
	const cancelEdit = () => {
		setEditing(false);
		setUsername("");
		setPassword("");
	};

	const handleSave = async () => {
		if (!username.trim() || !password.trim()) {
			enqueueSnackbar("Ingresá usuario y contraseña del portal MEV", { variant: "warning" });
			return;
		}
		try {
			setSubmitting(true);
			// causaId null → credencial de la cuenta (una por usuario).
			const res = await mevCredentialsService.saveCredentials(username.trim(), password, null);
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

	// Abre el diálogo de impacto antes de desvincular la credencial de la cuenta.
	const openUnlink = async () => {
		if (!global) return;
		setUnlinkOpen(true);
		setUnlinkImpact(null);
		setLoadingImpact(true);
		try {
			const res = await mevCredentialsService.getUnlinkImpact(global.id);
			setUnlinkImpact(res.success && res.data ? res.data : null);
		} catch {
			setUnlinkImpact(null);
		} finally {
			setLoadingImpact(false);
		}
	};

	const closeUnlink = () => {
		if (unlinking) return;
		setUnlinkOpen(false);
		setUnlinkImpact(null);
	};

	const confirmUnlink = async () => {
		if (!global) return;
		try {
			setUnlinking(true);
			const res = await mevCredentialsService.deleteCredentials(global.id);
			if (res.success) {
				enqueueSnackbar("Credencial MEV desvinculada", { variant: "success" });
				setUnlinkOpen(false);
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
				<Typography sx={{ fontSize: "0.72rem", color: "text.secondary" }}>Cargando credencial MEV…</Typography>
			</Stack>
		);
	}

	const renderForm = () => (
		<Stack spacing={1.5}>
			<Typography sx={{ fontSize: "0.82rem", color: "text.secondary" }}>
				Cargá tu usuario y contraseña del portal MEV (mev.scba.gov.ar). Con esta credencial consultamos automáticamente
				todas tus causas de Buenos Aires. Tu contraseña se guarda encriptada (AES-256).
			</Typography>
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
					{submitting ? "Guardando…" : global ? "Actualizar credencial" : "Conectar cuenta MEV"}
				</Button>
				{editing && global && (
					<Button size="small" onClick={cancelEdit} disabled={submitting} sx={{ color: "text.secondary" }}>
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
					<Typography sx={{ fontSize: "0.76rem", color: "text.secondary" }}>
						Con esta credencial consultamos todas tus causas de Buenos Aires.
					</Typography>
					{g.lastError && status !== "valid" && (
						<Typography sx={{ fontSize: "0.76rem", color: "text.secondary", mt: 0.5 }}>{g.lastError.message}</Typography>
					)}
					{status === "pending" && (
						<Typography sx={{ fontSize: "0.76rem", color: "text.secondary", mt: 0.5 }}>
							La validaremos automáticamente cuando consultemos tus causas.
						</Typography>
					)}
				</Box>
				<Stack direction="row" spacing={1}>
					<Button
						size="small"
						variant="outlined"
						onClick={startEdit}
						startIcon={<Edit2 size={15} />}
						sx={{ borderColor: BRAND_BLUE, color: BRAND_BLUE }}
					>
						Actualizar credencial
					</Button>
					<Button size="small" color="error" onClick={openUnlink} disabled={submitting} startIcon={<Trash size={16} />}>
						Desvincular
					</Button>
				</Stack>
			</Stack>
		);
	};

	// Con credencial cargada y sin editar → tarjeta; si no → formulario.
	const showForm = editing || !global;
	const impactWarn = unlinkImpact && unlinkImpact.folders.total > 0;
	const tone = impactWarn ? theme.palette.error.main : theme.palette.success.main;

	return (
		<>
			{showForm ? renderForm() : global ? renderGlobalCard(global) : renderForm()}

			{/* ===== Diálogo de impacto de desvinculación ===== */}
			<Dialog open={unlinkOpen} onClose={closeUnlink} maxWidth="xs" fullWidth>
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
							<Typography sx={{ fontSize: "1rem", fontWeight: 700 }}>¿Desvincular tu credencial MEV?</Typography>
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
											No vamos a consultar movimientos nuevos de tus causas del MEV hasta que vincules una credencial de
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
											Ninguna causa quedará sin seguimiento.
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

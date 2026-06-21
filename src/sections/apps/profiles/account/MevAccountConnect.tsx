import { useState, useEffect, useCallback } from "react";
import { Box, Stack, Typography, TextField, Button, InputAdornment, IconButton, Tooltip, CircularProgress, Chip, alpha, useTheme } from "@mui/material";
import { Eye, EyeSlash, ShieldTick, TickCircle, CloseCircle, Link1, Trash } from "iconsax-react";
import { useSnackbar } from "notistack";
import { useSelector } from "react-redux";
import { dispatch as storeDispatch } from "store";
import { getFoldersByUserId } from "store/reducers/folder";
import { BRAND_BLUE } from "themes/dashboardTokens";
import mevCredentialsService, { MevCredentialData } from "api/mevCredentials";

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

const MevAccountConnect = ({ onConnectionStatusChange }: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { enqueueSnackbar } = useSnackbar();
	const authUser = useSelector((state: any) => state.auth?.user);

	// Refresca el listado de folders en el store para que la tabla refleje los
	// cambios de mevCredentialStatus (ej. tras desvincular → 'missing').
	const refreshFolders = () => {
		const uid = authUser?._id || authUser?.id;
		if (uid) storeDispatch(getFoldersByUserId(uid, true) as any);
	};

	const [loading, setLoading] = useState(true);
	const [global, setGlobal] = useState<MevCredentialData | null>(null);
	const [username, setUsername] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [editing, setEditing] = useState(false);

	const fetchStatus = useCallback(async () => {
		try {
			setLoading(true);
			const res = await mevCredentialsService.getCredentialsStatus();
			const g = res.success && res.data ? res.data.global : null;
			setGlobal(g);
			if (!g) onConnectionStatusChange?.("disconnected");
			else {
				const st = deriveStatus(g);
				onConnectionStatusChange?.(st === "invalid" || st === "expired" || st === "disabled" ? "error" : "connected");
			}
		} catch {
			onConnectionStatusChange?.("disconnected");
		} finally {
			setLoading(false);
		}
	}, [onConnectionStatusChange]);

	useEffect(() => {
		fetchStatus();
	}, [fetchStatus]);

	const handleSave = async () => {
		if (!username.trim() || !password.trim()) {
			enqueueSnackbar("Ingresá usuario y contraseña del portal MEV", { variant: "warning" });
			return;
		}
		try {
			setSubmitting(true);
			const res = await mevCredentialsService.saveCredentials(username.trim(), password, null);
			if (res.success) {
				enqueueSnackbar("Credencial MEV guardada. La validaremos al consultar tus causas.", { variant: "success" });
				setUsername("");
				setPassword("");
				setEditing(false);
				await fetchStatus();
				refreshFolders();
			} else {
				enqueueSnackbar(res.error || "No se pudo guardar la credencial", { variant: "error" });
			}
		} finally {
			setSubmitting(false);
		}
	};

	const handleDisconnect = async () => {
		if (!global) return;
		try {
			setSubmitting(true);
			const res = await mevCredentialsService.deleteCredentials(global.id);
			if (res.success) {
				enqueueSnackbar("Credencial MEV eliminada", { variant: "success" });
				await fetchStatus();
				refreshFolders();
			} else {
				enqueueSnackbar(res.error || "No se pudo eliminar la credencial", { variant: "error" });
			}
		} finally {
			setSubmitting(false);
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
					<Button size="small" onClick={() => setEditing(false)} disabled={submitting} sx={{ color: "text.secondary" }}>
						Cancelar
					</Button>
				)}
			</Stack>
		</Stack>
	);

	if (global && !editing) {
		const status = deriveStatus(global);
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
						{status === "valid" ? <TickCircle size={18} variant="Bulk" color={theme.palette.success.main} /> : <CloseCircle size={18} variant="Bulk" color={theme.palette.warning.main} />}
						<Typography sx={{ fontSize: "0.88rem", fontWeight: 600 }}>Cuenta MEV vinculada</Typography>
						<Chip size="small" label={meta.label} color={meta.color} sx={{ ml: "auto" }} />
					</Stack>
					{global.lastError && status !== "valid" && (
						<Typography sx={{ fontSize: "0.76rem", color: "text.secondary" }}>{global.lastError.message}</Typography>
					)}
					{status === "pending" && (
						<Typography sx={{ fontSize: "0.76rem", color: "text.secondary" }}>
							La validaremos automáticamente cuando consultemos tus causas.
						</Typography>
					)}
				</Box>
				<Stack direction="row" spacing={1}>
					<Button size="small" variant="outlined" onClick={() => setEditing(true)} sx={{ borderColor: BRAND_BLUE, color: BRAND_BLUE }}>
						Actualizar credencial
					</Button>
					<Button
						size="small"
						color="error"
						onClick={handleDisconnect}
						disabled={submitting}
						startIcon={<Trash size={16} />}
					>
						Desvincular
					</Button>
				</Stack>
			</Stack>
		);
	}

	return renderForm();
};

export default MevAccountConnect;

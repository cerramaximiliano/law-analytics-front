import { useState } from "react";
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	Divider,
	IconButton,
	InputAdornment,
	Stack,
	TextField,
	Tooltip,
	Typography,
} from "@mui/material";
import { Eye, EyeSlash, FlashCircle, Trash } from "iconsax-react";

import { dispatch, useSelector } from "store";
import {
	createMyCredential,
	updateMyCredential,
	deleteMyCredential,
	validateMyCredential,
	fetchMyCredential,
} from "store/reducers/seclo";

/**
 * Tab "Credenciales" del módulo SECLO.
 *
 * Cada usuario tiene una sola credencial — esta vista la muestra (o el form
 * para cargar la primera) con un chip de estado de validación.
 *
 * Estados:
 *   🟢 Validada      — credentialsValidated:true
 *   🔴 Inválida      — credentialInvalid:true (con mensaje)
 *   🟡 Pendiente     — recién cargada, esperando al worker
 */
export default function CredencialesTab() {
	const credential = useSelector((s: any) => s.seclo.credential);
	const credentialLoaded = useSelector((s: any) => s.seclo.credentialLoaded);

	const [editing, setEditing] = useState(false);
	const [cuil, setCuil] = useState("");
	const [password, setPassword] = useState("");
	const [showPassword, setShowPassword] = useState(false);
	const [submitting, setSubmitting] = useState(false);
	const [validating, setValidating] = useState(false);
	const [deleting, setDeleting] = useState(false);

	const hasCredential = !!credential;

	// ── Crear ───────────────────────────────────────────────────────────────
	const handleCreate = async () => {
		if (!cuil || !password) return;
		setSubmitting(true);
		try {
			await dispatch(createMyCredential(cuil.replace(/\D/g, ""), password));
			setCuil("");
			setPassword("");
		} finally {
			setSubmitting(false);
		}
	};

	// ── Actualizar password ────────────────────────────────────────────────
	const handleUpdatePassword = async () => {
		if (!password) return;
		setSubmitting(true);
		try {
			await dispatch(updateMyCredential({ password }));
			setPassword("");
			setEditing(false);
		} finally {
			setSubmitting(false);
		}
	};

	// ── Validar ────────────────────────────────────────────────────────────
	const handleValidate = async () => {
		setValidating(true);
		try {
			await dispatch(validateMyCredential());
			// Refrescar la credencial tras unos segundos para ver el resultado
			setTimeout(() => {
				dispatch(fetchMyCredential());
				setValidating(false);
			}, 25000);
		} catch {
			setValidating(false);
		}
	};

	// ── Eliminar ───────────────────────────────────────────────────────────
	const handleDelete = async () => {
		if (!window.confirm("¿Eliminar tu credencial SECLO? Las solicitudes activas vinculadas la bloquean.")) return;
		setDeleting(true);
		try {
			await dispatch(deleteMyCredential());
		} finally {
			setDeleting(false);
		}
	};

	// ── Estado de validación → chip ───────────────────────────────────────
	const renderValidationChip = () => {
		if (!credential) return null;
		if (credential.credentialInvalid) {
			return (
				<Tooltip title={credential.credentialInvalidReason || "Credenciales inválidas"}>
					<Chip label="Inválida" color="error" size="small" />
				</Tooltip>
			);
		}
		if (credential.credentialsValidated) {
			return (
				<Tooltip
					title={
						credential.credentialsValidatedAt
							? `Validada el ${new Date(credential.credentialsValidatedAt).toLocaleString("es-AR")}`
							: "Validada"
					}
				>
					<Chip label="Validada" color="success" size="small" />
				</Tooltip>
			);
		}
		return (
			<Tooltip title="Pendiente de validar — el worker la verifica en ≤ 5 min">
				<Chip label="Pendiente" color="warning" size="small" variant="outlined" />
			</Tooltip>
		);
	};

	// ── Loading inicial ─────────────────────────────────────────────────────
	if (!credentialLoaded) {
		return (
			<Box display="flex" justifyContent="center" py={6}>
				<CircularProgress size={24} />
			</Box>
		);
	}

	// ── Sin credencial: form de carga inicial ──────────────────────────────
	if (!hasCredential) {
		return (
			<Stack spacing={3} sx={{ maxWidth: 480 }}>
				<Box>
					<Typography variant="h5" gutterBottom>
						Cargá tus credenciales SECLO
					</Typography>
					<Typography variant="body2" color="text.secondary">
						Necesitás tu CUIL y contraseña del Portal del Ministerio de Trabajo
						(<a href="https://portalabogados.trabajo.gob.ar" target="_blank" rel="noopener noreferrer">portalabogados.trabajo.gob.ar</a>)
						para que podamos crear y enviar tus solicitudes de audiencia automáticamente.
					</Typography>
				</Box>

				<TextField
					label="CUIL/CUIT"
					placeholder="20123456789"
					value={cuil}
					onChange={(e) => setCuil(e.target.value)}
					inputProps={{ inputMode: "numeric", maxLength: 13 }}
					fullWidth
				/>

				<TextField
					label="Contraseña del portal"
					type={showPassword ? "text" : "password"}
					value={password}
					onChange={(e) => setPassword(e.target.value)}
					fullWidth
					InputProps={{
						endAdornment: (
							<InputAdornment position="end">
								<IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
									{showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
								</IconButton>
							</InputAdornment>
						),
					}}
				/>

				<Alert severity="info">
					Apenas guardes, validamos automáticamente las credenciales contra el portal y te avisamos por email
					(suele llevar unos 10-30 segundos).
				</Alert>

				<Box>
					<Button
						variant="contained"
						color="primary"
						onClick={handleCreate}
						disabled={submitting || !cuil || !password}
						startIcon={submitting ? <CircularProgress size={14} /> : null}
					>
						{submitting ? "Guardando…" : "Guardar credenciales"}
					</Button>
				</Box>
			</Stack>
		);
	}

	// ── Con credencial: vista de estado + edit/delete ──────────────────────
	return (
		<Stack spacing={3} sx={{ maxWidth: 560 }}>
			<Box>
				<Stack direction="row" alignItems="center" spacing={1} mb={0.5}>
					<Typography variant="h5">Tus credenciales SECLO</Typography>
					{renderValidationChip()}
				</Stack>
				<Typography variant="body2" color="text.secondary">
					Las usamos para enviar tus solicitudes de audiencia al portal del Ministerio de Trabajo.
				</Typography>
			</Box>

			{credential.credentialInvalid && (
				<Alert severity="error">
					{credential.credentialInvalidReason ||
						"Las credenciales fueron rechazadas por el portal. Actualizá la contraseña para reintentar."}
				</Alert>
			)}

			<Box
				sx={{
					p: 2,
					border: 1,
					borderColor: "divider",
					borderRadius: 1,
					bgcolor: "background.default",
				}}
			>
				<Stack spacing={1.5}>
					<Stack direction="row" justifyContent="space-between">
						<Typography variant="body2" color="text.secondary">CUIL/CUIT</Typography>
						<Typography variant="body2" sx={{ fontFamily: "monospace" }}>{credential.cuil}</Typography>
					</Stack>
					<Stack direction="row" justifyContent="space-between">
						<Typography variant="body2" color="text.secondary">Contraseña</Typography>
						<Typography variant="body2" sx={{ fontFamily: "monospace" }}>••••••••</Typography>
					</Stack>
					<Stack direction="row" justifyContent="space-between">
						<Typography variant="body2" color="text.secondary">Última verificación</Typography>
						<Typography variant="body2">
							{credential.credentialsValidatedAt
								? new Date(credential.credentialsValidatedAt).toLocaleString("es-AR")
								: credential.credentialInvalidAt
								? new Date(credential.credentialInvalidAt).toLocaleString("es-AR")
								: "—"}
						</Typography>
					</Stack>
				</Stack>
			</Box>

			{/* Form de cambio de password (collapsable) */}
			{editing && (
				<Box
					sx={{
						p: 2,
						border: 1,
						borderColor: "divider",
						borderRadius: 1,
						bgcolor: "background.default",
					}}
				>
					<Typography variant="subtitle1" mb={2}>Cambiar contraseña</Typography>
					<TextField
						label="Nueva contraseña"
						type={showPassword ? "text" : "password"}
						value={password}
						onChange={(e) => setPassword(e.target.value)}
						fullWidth
						InputProps={{
							endAdornment: (
								<InputAdornment position="end">
									<IconButton onClick={() => setShowPassword((v) => !v)} edge="end" size="small">
										{showPassword ? <EyeSlash size={18} /> : <Eye size={18} />}
									</IconButton>
								</InputAdornment>
							),
						}}
					/>
					<Stack direction="row" spacing={1} mt={2}>
						<Button
							variant="contained"
							size="small"
							onClick={handleUpdatePassword}
							disabled={submitting || !password}
						>
							{submitting ? "Guardando…" : "Guardar"}
						</Button>
						<Button
							size="small"
							onClick={() => {
								setEditing(false);
								setPassword("");
							}}
						>
							Cancelar
						</Button>
					</Stack>
				</Box>
			)}

			<Divider />

			<Stack direction="row" spacing={1} flexWrap="wrap">
				<Button
					variant="contained"
					color="info"
					startIcon={validating ? <CircularProgress size={14} /> : <FlashCircle size={16} />}
					onClick={handleValidate}
					disabled={validating}
				>
					{validating ? "Validando…" : "Validar ahora"}
				</Button>
				{!editing && (
					<Button
						variant="outlined"
						onClick={() => setEditing(true)}
						disabled={validating}
					>
						Cambiar contraseña
					</Button>
				)}
				<Box flexGrow={1} />
				<Button
					variant="outlined"
					color="error"
					startIcon={deleting ? <CircularProgress size={14} /> : <Trash size={16} />}
					onClick={handleDelete}
					disabled={deleting}
				>
					Eliminar
				</Button>
			</Stack>
		</Stack>
	);
}

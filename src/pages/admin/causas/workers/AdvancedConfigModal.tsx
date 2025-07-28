import { useState, useEffect } from "react";
import {
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	Button,
	Stack,
	Typography,
	TextField,
	Switch,
	FormControlLabel,
	Alert,
	Divider,
	Box,
	Chip,
	IconButton,
	InputAdornment,
} from "@mui/material";
import { Eye, EyeSlash, Setting2 } from "iconsax-react";
import { useSnackbar } from "notistack";
import { WorkersService, WorkerConfig, WorkerType } from "api/workers";

interface AdvancedConfigModalProps {
	open: boolean;
	onClose: () => void;
	config: WorkerConfig;
	onUpdate: () => void;
	workerType: WorkerType;
}

const AdvancedConfigModal = ({ open, onClose, config, onUpdate, workerType }: AdvancedConfigModalProps) => {
	const { enqueueSnackbar } = useSnackbar();
	const [loading, setLoading] = useState(false);
	const [showApiKeys, setShowApiKeys] = useState({
		twocaptcha: false,
		capsolver: false,
	});

	// Estado del formulario
	const [formData, setFormData] = useState({
		defaultProvider: config.captcha?.defaultProvider || "2captcha",
		twocaptchaKey: config.captcha?.apiKeys?.twocaptcha?.key || "",
		twocaptchaEnabled: config.captcha?.apiKeys?.twocaptcha?.enabled ?? true,
		capsolverKey: config.captcha?.apiKeys?.capsolver?.key || "",
		capsolverEnabled: config.captcha?.apiKeys?.capsolver?.enabled ?? false,
	});

	// Actualizar estado cuando cambie la configuración
	useEffect(() => {
		setFormData({
			defaultProvider: config.captcha?.defaultProvider || "2captcha",
			twocaptchaKey: config.captcha?.apiKeys?.twocaptcha?.key || "",
			twocaptchaEnabled: config.captcha?.apiKeys?.twocaptcha?.enabled ?? true,
			capsolverKey: config.captcha?.apiKeys?.capsolver?.key || "",
			capsolverEnabled: config.captcha?.apiKeys?.capsolver?.enabled ?? false,
		});
	}, [config]);

	// Obtener el ID real del documento
	const getConfigId = (): string => {
		if (typeof config._id === "string") {
			return config._id;
		}
		return config._id.$oid;
	};

	// Manejar cambios en el formulario
	const handleChange = (field: string, value: any) => {
		setFormData((prev) => ({
			...prev,
			[field]: value,
		}));
	};

	// Guardar configuración
	const handleSave = async () => {
		try {
			setLoading(true);

			// Preparar datos para actualizar
			const updateData: Partial<WorkerConfig> = {
				captcha: {
					defaultProvider: formData.defaultProvider as "2captcha" | "capsolver",
					apiKeys: {
						twocaptcha: {
							key: formData.twocaptchaKey,
							enabled: formData.twocaptchaEnabled,
						},
						capsolver: {
							key: formData.capsolverKey,
							enabled: formData.capsolverEnabled,
						},
					},
				},
			};

			const configId = getConfigId();
			const response = await WorkersService.updateConfig(workerType, configId, updateData);

			if (response.success) {
				enqueueSnackbar("Configuración avanzada actualizada exitosamente", { variant: "success" });
				onUpdate();
				onClose();
			}
		} catch (error: any) {
			enqueueSnackbar(error.message || "Error al actualizar la configuración", { variant: "error" });
		} finally {
			setLoading(false);
		}
	};

	// Toggle visibilidad de API key
	const toggleShowApiKey = (provider: "twocaptcha" | "capsolver") => {
		setShowApiKeys((prev) => ({
			...prev,
			[provider]: !prev[provider],
		}));
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="sm" fullWidth>
			<DialogTitle>
				<Stack direction="row" alignItems="center" spacing={1}>
					<Setting2 size={24} />
					<Typography variant="h6">Configuración Avanzada - Servicios de Captcha</Typography>
				</Stack>
			</DialogTitle>

			<DialogContent dividers>
				<Stack spacing={3}>
					{/* Información del worker */}
					<Alert severity="info" variant="outlined">
						<Typography variant="body2">
							Worker: <strong>{config.worker_id}</strong>
						</Typography>
						<Typography variant="body2">
							Fuero: <strong>{config.fuero}</strong>
						</Typography>
					</Alert>

					{/* Proveedor por defecto */}
					<Box>
						<Typography variant="subtitle2" gutterBottom>
							Proveedor de Captcha por Defecto
						</Typography>
						<Stack direction="row" spacing={1} sx={{ mt: 1 }}>
							<Chip
								label="2Captcha"
								color={formData.defaultProvider === "2captcha" ? "primary" : "default"}
								onClick={() => handleChange("defaultProvider", "2captcha")}
								clickable
							/>
							<Chip
								label="Capsolver"
								color={formData.defaultProvider === "capsolver" ? "primary" : "default"}
								onClick={() => handleChange("defaultProvider", "capsolver")}
								clickable
							/>
						</Stack>
					</Box>

					<Divider />

					{/* Configuración 2Captcha */}
					<Box>
						<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
							<Typography variant="subtitle1" fontWeight={500}>
								2Captcha
							</Typography>
							<FormControlLabel
								control={
									<Switch
										checked={formData.twocaptchaEnabled}
										onChange={(e) => handleChange("twocaptchaEnabled", e.target.checked)}
										size="small"
									/>
								}
								label="Habilitado"
							/>
						</Stack>

						<TextField
							fullWidth
							label="API Key"
							type={showApiKeys.twocaptcha ? "text" : "password"}
							value={formData.twocaptchaKey}
							onChange={(e) => handleChange("twocaptchaKey", e.target.value)}
							disabled={!formData.twocaptchaEnabled}
							placeholder="Ingrese su API key de 2Captcha"
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">
										<IconButton onClick={() => toggleShowApiKey("twocaptcha")} edge="end" size="small">
											{showApiKeys.twocaptcha ? <EyeSlash size={20} /> : <Eye size={20} />}
										</IconButton>
									</InputAdornment>
								),
							}}
						/>
					</Box>

					<Divider />

					{/* Configuración Capsolver */}
					<Box>
						<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ mb: 2 }}>
							<Typography variant="subtitle1" fontWeight={500}>
								Capsolver
							</Typography>
							<FormControlLabel
								control={
									<Switch
										checked={formData.capsolverEnabled}
										onChange={(e) => handleChange("capsolverEnabled", e.target.checked)}
										size="small"
									/>
								}
								label="Habilitado"
							/>
						</Stack>

						<TextField
							fullWidth
							label="API Key"
							type={showApiKeys.capsolver ? "text" : "password"}
							value={formData.capsolverKey}
							onChange={(e) => handleChange("capsolverKey", e.target.value)}
							disabled={!formData.capsolverEnabled}
							placeholder="Ingrese su API key de Capsolver"
							InputProps={{
								endAdornment: (
									<InputAdornment position="end">
										<IconButton onClick={() => toggleShowApiKey("capsolver")} edge="end" size="small">
											{showApiKeys.capsolver ? <EyeSlash size={20} /> : <Eye size={20} />}
										</IconButton>
									</InputAdornment>
								),
							}}
						/>
					</Box>

					{/* Advertencia */}
					<Alert severity="warning" variant="outlined">
						<Typography variant="body2">
							<strong>Importante:</strong> Las API keys se almacenan de forma segura. Asegúrese de que las keys sean válidas antes de
							guardar.
						</Typography>
					</Alert>
				</Stack>
			</DialogContent>

			<DialogActions>
				<Button onClick={onClose} disabled={loading}>
					Cancelar
				</Button>
				<Button onClick={handleSave} variant="contained" disabled={loading}>
					{loading ? "Guardando..." : "Guardar Configuración"}
				</Button>
			</DialogActions>
		</Dialog>
	);
};

export default AdvancedConfigModal;

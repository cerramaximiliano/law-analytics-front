import { useState, useEffect } from "react";
import {
	Box,
	Card,
	CardContent,
	Grid,
	Typography,
	Switch,
	TextField,
	Button,
	Stack,
	IconButton,
	Tooltip,
	Alert,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Skeleton,
	Chip,
	Select,
	MenuItem,
	FormControl,
	LinearProgress,
} from "@mui/material";
import { Edit2, TickCircle, CloseCircle, Refresh, Setting2 } from "iconsax-react";
import { useSnackbar } from "notistack";
import { WorkersService, WorkerConfig } from "api/workers";
import AdvancedConfigModal from "./AdvancedConfigModal";

// Enums para el worker de scraping
const FUERO_OPTIONS = [
	{ value: "CIV", label: "Civil" },
	{ value: "CSS", label: "Contencioso Social y Seguridad" },
	{ value: "CNT", label: "Contencioso Tributario" },
];

const ScrapingWorker = () => {
	const { enqueueSnackbar } = useSnackbar();
	const [configs, setConfigs] = useState<WorkerConfig[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editValues, setEditValues] = useState<Partial<WorkerConfig>>({});
	const [advancedConfigOpen, setAdvancedConfigOpen] = useState(false);
	const [selectedConfig, setSelectedConfig] = useState<WorkerConfig | null>(null);

	// Cargar configuraciones
	const fetchConfigs = async () => {
		try {
			setLoading(true);
			const response = await WorkersService.getScrapingConfigs({ page: 1, limit: 20 });
			if (response.success && Array.isArray(response.data)) {
				setConfigs(response.data);
			}
		} catch (error) {
			enqueueSnackbar("Error al cargar las configuraciones de scraping", { variant: "error" });
			console.error(error);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchConfigs();
	}, []);

	// Obtener el ID real del documento
	const getConfigId = (config: WorkerConfig): string => {
		if (typeof config._id === "string") {
			return config._id;
		}
		return config._id.$oid;
	};

	// Formatear fecha
	const formatDate = (date: any): string => {
		if (!date) return "N/A";
		const dateStr = typeof date === "string" ? date : date.$date;
		return new Date(dateStr).toLocaleString("es-ES");
	};

	// Calcular progreso del rango
	const calculateProgress = (config: WorkerConfig): number => {
		if (!config.range_start || !config.range_end || !config.number) return 0;
		const total = config.range_end - config.range_start;
		const current = config.number - config.range_start;
		return Math.min(100, Math.max(0, (current / total) * 100));
	};

	// Manejar edición
	const handleEdit = (config: WorkerConfig) => {
		const id = getConfigId(config);
		setEditingId(id);
		setEditValues({
			worker_id: config.worker_id,
			fuero: config.fuero,
			enabled: config.enabled,
			year: config.year,
			number: config.number,
			max_number: config.max_number,
			range_start: config.range_start,
			range_end: config.range_end,
			captcha: config.captcha,
			proxy: config.proxy,
		});
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditValues({});
	};

	const handleSave = async () => {
		if (!editingId) return;

		try {
			const response = await WorkersService.updateScrapingConfig(editingId, editValues);
			if (response.success) {
				enqueueSnackbar("Configuración actualizada exitosamente", { variant: "success" });
				await fetchConfigs();
				handleCancelEdit();
			}
		} catch (error: any) {
			enqueueSnackbar(error.message || "Error al actualizar la configuración", { variant: "error" });
		}
	};

	const handleToggleEnabled = async (config: WorkerConfig) => {
		const id = getConfigId(config);
		try {
			const response = await WorkersService.updateScrapingConfig(id, {
				enabled: !config.enabled,
			});
			if (response.success) {
				enqueueSnackbar(`Worker ${!config.enabled ? "activado" : "desactivado"}`, { variant: "success" });
				await fetchConfigs();
			}
		} catch (error: any) {
			enqueueSnackbar(error.message || "Error al cambiar el estado", { variant: "error" });
		}
	};

	// Manejar configuración avanzada
	const handleAdvancedConfig = (config: WorkerConfig) => {
		setSelectedConfig(config);
		setAdvancedConfigOpen(true);
	};

	const handleCloseAdvancedConfig = () => {
		setAdvancedConfigOpen(false);
		setSelectedConfig(null);
	};

	if (loading) {
		return (
			<Grid container spacing={3}>
				{[1, 2, 3, 4].map((item) => (
					<Grid item xs={12} key={item}>
						<Skeleton variant="rectangular" height={80} />
					</Grid>
				))}
			</Grid>
		);
	}

	return (
		<Stack spacing={3}>
			{/* Header con acciones */}
			<Box display="flex" justifyContent="space-between" alignItems="center">
				<Typography variant="h5">Configuración del Worker de Scraping</Typography>
				<Button variant="outlined" size="small" startIcon={<Refresh size={16} />} onClick={fetchConfigs}>
					Actualizar
				</Button>
			</Box>

			{/* Información del worker */}
			<Alert severity="info" variant="outlined">
				<Typography variant="subtitle2" fontWeight="bold">
					Worker de Scraping de Causas
				</Typography>
				<Typography variant="body2" sx={{ mt: 1 }}>
					Este worker se encarga de buscar y recopilar automáticamente nuevas causas judiciales desde los sistemas del Poder Judicial,
					procesando rangos de números de expedientes por fuero y año.
				</Typography>
			</Alert>

			{/* Tabla de configuraciones */}
			<TableContainer component={Paper} variant="outlined">
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Worker ID</TableCell>
							<TableCell>Fuero</TableCell>
							<TableCell align="center">Año</TableCell>
							<TableCell align="center">Número Actual</TableCell>
							<TableCell align="center">Rango</TableCell>
							<TableCell align="center">Progreso</TableCell>
							<TableCell align="center">Balance</TableCell>
							<TableCell align="center">Captchas</TableCell>
							<TableCell align="center">Proxy</TableCell>
							<TableCell align="center">Estado</TableCell>
							<TableCell align="center">Última Verificación</TableCell>
							<TableCell align="center">Acciones</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{configs.map((config) => {
							const configId = getConfigId(config);
							const isEditing = editingId === configId;
							const progress = calculateProgress(config);

							return (
								<TableRow key={configId}>
									<TableCell>
										{isEditing ? (
											<TextField
												size="small"
												value={editValues.worker_id || ""}
												onChange={(e) => setEditValues({ ...editValues, worker_id: e.target.value })}
												fullWidth
											/>
										) : (
											<Typography variant="body2" fontWeight={500}>
												{config.worker_id}
											</Typography>
										)}
									</TableCell>
									<TableCell>
										{isEditing ? (
											<FormControl size="small" fullWidth>
												<Select value={editValues.fuero || ""} onChange={(e) => setEditValues({ ...editValues, fuero: e.target.value })}>
													{FUERO_OPTIONS.map((option) => (
														<MenuItem key={option.value} value={option.value}>
															{option.label}
														</MenuItem>
													))}
												</Select>
											</FormControl>
										) : (
											<Chip label={config.fuero || ""} size="small" color="primary" variant="outlined" />
										)}
									</TableCell>
									<TableCell align="center">
										{isEditing ? (
											<TextField
												size="small"
												type="number"
												value={editValues.year || ""}
												onChange={(e) => setEditValues({ ...editValues, year: Number(e.target.value) })}
												sx={{ width: 80 }}
											/>
										) : (
											<Typography variant="body2">{config.year}</Typography>
										)}
									</TableCell>
									<TableCell align="center">
										{isEditing ? (
											<TextField
												size="small"
												type="number"
												value={editValues.number || ""}
												onChange={(e) => setEditValues({ ...editValues, number: Number(e.target.value) })}
												sx={{ width: 100 }}
											/>
										) : (
											<Stack alignItems="center" spacing={0.5}>
												<Typography variant="body2" fontWeight={500}>
													{config.number?.toLocaleString() || 0}
												</Typography>
												<Typography variant="caption" color="text.secondary">
													No encontrados: {config.consecutive_not_found || 0}
												</Typography>
											</Stack>
										)}
									</TableCell>
									<TableCell align="center">
										{isEditing ? (
											<Stack direction="row" spacing={1}>
												<TextField
													size="small"
													type="number"
													value={editValues.range_start || ""}
													onChange={(e) => setEditValues({ ...editValues, range_start: Number(e.target.value) })}
													sx={{ width: 80 }}
													placeholder="Inicio"
												/>
												<Typography variant="body2" sx={{ alignSelf: "center" }}>
													-
												</Typography>
												<TextField
													size="small"
													type="number"
													value={editValues.range_end || ""}
													onChange={(e) => setEditValues({ ...editValues, range_end: Number(e.target.value) })}
													sx={{ width: 80 }}
													placeholder="Fin"
												/>
											</Stack>
										) : (
											<Typography variant="body2">
												{config.range_start?.toLocaleString()} - {config.range_end?.toLocaleString()}
											</Typography>
										)}
									</TableCell>
									<TableCell align="center">
										<Box sx={{ width: 100 }}>
											<LinearProgress variant="determinate" value={progress} sx={{ height: 8, borderRadius: 4 }} />
											<Typography variant="caption" color="text.secondary">
												{progress.toFixed(1)}%
											</Typography>
										</Box>
									</TableCell>
									<TableCell align="center">
										<Stack alignItems="center" spacing={0.5}>
											<Typography
												variant="body2"
												fontWeight={500}
												color={config.balance?.current && config.balance.current > 1 ? "success.main" : "warning.main"}
											>
												${config.balance?.current?.toFixed(2) || "0.00"}
											</Typography>
											<Typography variant="caption" color="text.secondary">
												{config.balance?.provider || "N/A"}
											</Typography>
										</Stack>
									</TableCell>
									<TableCell align="center">
										<Stack alignItems="center" spacing={0.5}>
											<Typography variant="body2" fontWeight={500}>
												{config.capsolver?.totalCaptchas?.toLocaleString() || 0}
											</Typography>
											<Chip label={config.captcha?.defaultProvider || "2captcha"} size="small" color="secondary" variant="outlined" />
										</Stack>
									</TableCell>
									<TableCell align="center">
										<Chip
											label={config.proxy?.enabled ? "Activo" : "Inactivo"}
											size="small"
											color={config.proxy?.enabled ? "success" : "default"}
											variant="outlined"
										/>
									</TableCell>
									<TableCell align="center">
										<Switch
											checked={isEditing ? editValues.enabled : config.enabled}
											onChange={() => {
												if (isEditing) {
													setEditValues({ ...editValues, enabled: !editValues.enabled });
												} else {
													handleToggleEnabled(config);
												}
											}}
											size="small"
											color="primary"
										/>
									</TableCell>
									<TableCell align="center">
										<Typography variant="caption">{formatDate(config.last_check)}</Typography>
									</TableCell>
									<TableCell align="center">
										{isEditing ? (
											<Stack direction="row" spacing={1} justifyContent="center">
												<Tooltip title="Guardar">
													<IconButton size="small" color="primary" onClick={handleSave}>
														<TickCircle size={18} />
													</IconButton>
												</Tooltip>
												<Tooltip title="Cancelar">
													<IconButton size="small" color="error" onClick={handleCancelEdit}>
														<CloseCircle size={18} />
													</IconButton>
												</Tooltip>
											</Stack>
										) : (
											<Stack direction="row" spacing={1} justifyContent="center">
												<Tooltip title="Editar">
													<IconButton size="small" color="primary" onClick={() => handleEdit(config)}>
														<Edit2 size={18} />
													</IconButton>
												</Tooltip>
												<Tooltip title="Configuración avanzada">
													<IconButton size="small" color="secondary" onClick={() => handleAdvancedConfig(config)}>
														<Setting2 size={18} />
													</IconButton>
												</Tooltip>
											</Stack>
										)}
									</TableCell>
								</TableRow>
							);
						})}
					</TableBody>
				</Table>
			</TableContainer>

			{/* Estadísticas */}
			<Grid container spacing={2}>
				<Grid item xs={12} sm={6} md={3}>
					<Card variant="outlined">
						<CardContent>
							<Typography variant="subtitle2" color="text.secondary" gutterBottom>
								Total Workers
							</Typography>
							<Typography variant="h4">{configs.length}</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<Card variant="outlined">
						<CardContent>
							<Typography variant="subtitle2" color="text.secondary" gutterBottom>
								Workers Activos
							</Typography>
							<Typography variant="h4" color="success.main">
								{configs.filter((c) => c.enabled).length}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<Card variant="outlined">
						<CardContent>
							<Typography variant="subtitle2" color="text.secondary" gutterBottom>
								Balance Total
							</Typography>
							<Typography variant="h4" color="info.main">
								${configs.reduce((acc, c) => acc + (c.balance?.current || 0), 0).toFixed(2)}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<Card variant="outlined">
						<CardContent>
							<Typography variant="subtitle2" color="text.secondary" gutterBottom>
								Captchas Resueltos
							</Typography>
							<Typography variant="h4">
								{configs.reduce((acc, c) => acc + (c.capsolver?.totalCaptchas || 0), 0).toLocaleString()}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			{/* Modal de configuración avanzada */}
			{selectedConfig && (
				<AdvancedConfigModal
					open={advancedConfigOpen}
					onClose={handleCloseAdvancedConfig}
					config={selectedConfig}
					onUpdate={fetchConfigs}
					workerType="scraping"
				/>
			)}
		</Stack>
	);
};

export default ScrapingWorker;

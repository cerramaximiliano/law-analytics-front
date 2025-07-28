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
	LinearProgress,
} from "@mui/material";
import { Edit2, TickCircle, CloseCircle, Refresh, Setting2 } from "iconsax-react";
import { useSnackbar } from "notistack";
import { WorkersService, WorkerConfig } from "api/workers";
import AdvancedConfigModal from "./AdvancedConfigModal";

// Enums para el worker de actualización
const UPDATE_MODE_OPTIONS = [
	{ value: "all", label: "Todos los documentos" },
	{ value: "single", label: "Documento único" },
];

const AppUpdateWorker = () => {
	const { enqueueSnackbar } = useSnackbar();
	const [configs, setConfigs] = useState<WorkerConfig[]>([]);
	const [loading, setLoading] = useState(true);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editValues, setEditValues] = useState<Partial<WorkerConfig>>({});
	const [advancedConfigOpen, setAdvancedConfigOpen] = useState(false);
	const [selectedConfig, setSelectedConfig] = useState<WorkerConfig | null>(null);

	// Helper para obtener label del modo de actualización
	const getUpdateModeLabel = (value: string) => {
		return UPDATE_MODE_OPTIONS.find((opt) => opt.value === value)?.label || value;
	};

	// Cargar configuraciones
	const fetchConfigs = async () => {
		try {
			setLoading(true);
			const response = await WorkersService.getAppUpdateConfigs({ page: 1, limit: 20 });
			if (response.success && Array.isArray(response.data)) {
				setConfigs(response.data);
			}
		} catch (error) {
			enqueueSnackbar("Error al cargar las configuraciones de actualización", { variant: "error" });
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

	// Calcular tasa de éxito
	const calculateSuccessRate = (config: WorkerConfig): number => {
		const checked = config.documents_checked || 0;
		const updated = config.documents_updated || 0;
		if (checked === 0) return 0;
		return (updated / checked) * 100;
	};

	// Manejar edición
	const handleEdit = (config: WorkerConfig) => {
		const id = getConfigId(config);
		setEditingId(id);
		setEditValues({
			worker_id: config.worker_id,
			enabled: config.enabled,
			batch_size: config.batch_size,
			last_update_threshold_hours: config.last_update_threshold_hours,
		});
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditValues({});
	};

	const handleSave = async () => {
		if (!editingId) return;

		try {
			const response = await WorkersService.updateAppUpdateConfig(editingId, editValues);
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
			const response = await WorkersService.updateAppUpdateConfig(id, {
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
				<Typography variant="h5">Configuración del Worker de Actualización</Typography>
				<Button variant="outlined" size="small" startIcon={<Refresh size={16} />} onClick={fetchConfigs}>
					Actualizar
				</Button>
			</Box>

			{/* Información del worker */}
			<Alert severity="info" variant="outlined">
				<Typography variant="subtitle2" fontWeight="bold">
					Worker de Actualización de Aplicaciones
				</Typography>
				<Typography variant="body2" sx={{ mt: 1 }}>
					Este worker se encarga de mantener actualizados los documentos de causas judiciales, verificando periódicamente cambios en los
					expedientes y sincronizando la información más reciente.
				</Typography>
			</Alert>

			{/* Información detallada del worker */}
			<Card variant="outlined" sx={{ backgroundColor: "background.default" }}>
				<CardContent sx={{ py: 2 }}>
					<Typography variant="subtitle2" fontWeight="bold" gutterBottom>
						Elegibilidad de Documentos - Worker de Actualización
					</Typography>
					<Grid container spacing={1.5}>
						<Grid item xs={6} sm={3}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="caption" color="text.secondary">
									Source:
								</Typography>
								<Typography variant="caption" fontWeight={500}>
									"app"
								</Typography>
							</Stack>
						</Grid>
						<Grid item xs={6} sm={3}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="caption" color="text.secondary">
									Verified (req):
								</Typography>
								<Typography variant="caption" fontWeight={500}>
									true
								</Typography>
							</Stack>
						</Grid>
						<Grid item xs={6} sm={3}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="caption" color="text.secondary">
									isValid (req):
								</Typography>
								<Typography variant="caption" fontWeight={500}>
									true
								</Typography>
							</Stack>
						</Grid>
						<Grid item xs={6} sm={3}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="caption" color="text.secondary">
									Update:
								</Typography>
								<Typography variant="caption" fontWeight={500}>
									true
								</Typography>
							</Stack>
						</Grid>
						<Grid item xs={6} sm={3}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="caption" color="text.secondary">
									Función:
								</Typography>
								<Typography variant="caption" fontWeight={500} color="primary.main">
									Mantenimiento continuo
								</Typography>
							</Stack>
						</Grid>
						<Grid item xs={6} sm={3}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="caption" color="text.secondary">
									Modifica verified:
								</Typography>
								<Typography variant="caption" fontWeight={500} color="error.main">
									NO
								</Typography>
							</Stack>
						</Grid>
						<Grid item xs={6} sm={3}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="caption" color="text.secondary">
									Modifica isValid:
								</Typography>
								<Typography variant="caption" fontWeight={500} color="error.main">
									NO
								</Typography>
							</Stack>
						</Grid>
						<Grid item xs={6} sm={3}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="caption" color="text.secondary">
									Frecuencia:
								</Typography>
								<Typography variant="caption" fontWeight={500} color="info.main">
									Según threshold
								</Typography>
							</Stack>
						</Grid>
					</Grid>
				</CardContent>
			</Card>

			{/* Tabla de configuraciones */}
			<TableContainer component={Paper} variant="outlined">
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Worker ID</TableCell>
							<TableCell>Modo</TableCell>
							<TableCell align="center">Tamaño Lote</TableCell>
							<TableCell align="center">Umbral (horas)</TableCell>
							<TableCell align="center">Verificados</TableCell>
							<TableCell align="center">Actualizados</TableCell>
							<TableCell align="center">Fallidos</TableCell>
							<TableCell align="center">Tasa de Éxito</TableCell>
							<TableCell align="center">Estado</TableCell>
							<TableCell align="center">Última Verificación</TableCell>
							<TableCell align="center">Acciones</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{configs.map((config) => {
							const configId = getConfigId(config);
							const isEditing = editingId === configId;
							const successRate = calculateSuccessRate(config);

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
										<Chip
											label={getUpdateModeLabel(config.update_mode || "")}
											size="small"
											color={config.update_mode === "all" ? "secondary" : "default"}
											variant="outlined"
										/>
									</TableCell>
									<TableCell align="center">
										{isEditing ? (
											<TextField
												size="small"
												type="number"
												value={editValues.batch_size || ""}
												onChange={(e) => setEditValues({ ...editValues, batch_size: Number(e.target.value) })}
												sx={{ width: 80 }}
											/>
										) : (
											<Typography variant="body2">{config.batch_size}</Typography>
										)}
									</TableCell>
									<TableCell align="center">
										{isEditing ? (
											<TextField
												size="small"
												type="number"
												value={editValues.last_update_threshold_hours || ""}
												onChange={(e) => setEditValues({ ...editValues, last_update_threshold_hours: Number(e.target.value) })}
												sx={{ width: 80 }}
											/>
										) : (
											<Typography variant="body2">{config.last_update_threshold_hours || 0}</Typography>
										)}
									</TableCell>
									<TableCell align="center">
										<Typography variant="body2" fontWeight={500}>
											{config.documents_checked?.toLocaleString() || 0}
										</Typography>
									</TableCell>
									<TableCell align="center">
										<Typography variant="body2" color="success.main" fontWeight={500}>
											{config.documents_updated?.toLocaleString() || 0}
										</Typography>
									</TableCell>
									<TableCell align="center">
										<Typography variant="body2" color="error.main" fontWeight={500}>
											{config.documents_failed?.toLocaleString() || 0}
										</Typography>
									</TableCell>
									<TableCell align="center">
										<Box sx={{ width: 100 }}>
											<LinearProgress
												variant="determinate"
												value={successRate}
												color={successRate > 50 ? "success" : successRate > 25 ? "warning" : "error"}
												sx={{ height: 8, borderRadius: 4 }}
											/>
											<Typography variant="caption" color="text.secondary">
												{successRate.toFixed(1)}%
											</Typography>
										</Box>
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
												<Tooltip title="Configuración Avanzada">
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
								Total Actualizados
							</Typography>
							<Typography variant="h4" color="info.main">
								{configs.reduce((acc, c) => acc + (c.documents_updated || 0), 0).toLocaleString()}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<Card variant="outlined">
						<CardContent>
							<Typography variant="subtitle2" color="text.secondary" gutterBottom>
								Tasa de Éxito Global
							</Typography>
							<Typography variant="h4" color="warning.main">
								{(() => {
									const totalChecked = configs.reduce((acc, c) => acc + (c.documents_checked || 0), 0);
									const totalUpdated = configs.reduce((acc, c) => acc + (c.documents_updated || 0), 0);
									return totalChecked > 0 ? `${((totalUpdated / totalChecked) * 100).toFixed(1)}%` : "0%";
								})()}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			{/* Información adicional */}
			<Alert severity="warning" variant="outlined">
				<Typography variant="subtitle2">
					<strong>Nota sobre el umbral de actualización:</strong>
				</Typography>
				<Typography variant="body2" sx={{ mt: 1 }}>
					El umbral indica cuántas horas deben pasar desde la última actualización de un documento antes de verificar nuevamente si hay
					cambios. Un valor más bajo significa verificaciones más frecuentes pero mayor consumo de recursos.
				</Typography>
			</Alert>

			{/* Modal de configuración avanzada */}
			{selectedConfig && (
				<AdvancedConfigModal
					open={advancedConfigOpen}
					onClose={handleCloseAdvancedConfig}
					config={selectedConfig}
					onUpdate={fetchConfigs}
					workerType="app-update"
				/>
			)}
		</Stack>
	);
};

export default AppUpdateWorker;

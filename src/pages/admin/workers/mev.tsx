import React from "react";
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
	Tabs,
	Tab,
} from "@mui/material";
import { Edit2, TickCircle, CloseCircle, Refresh, Setting2 } from "iconsax-react";
import { useSnackbar } from "notistack";
import MainCard from "components/MainCard";
import MEVWorkersService, { MEVWorkerConfig, SystemConfig } from "api/workersMev";

interface TabPanelProps {
	children?: React.ReactNode;
	index: number;
	value: number;
}

function TabPanel(props: TabPanelProps) {
	const { children, value, index, ...other } = props;

	return (
		<div role="tabpanel" hidden={value !== index} id={`worker-tabpanel-${index}`} aria-labelledby={`worker-tab-${index}`} {...other}>
			{value === index && <Box sx={{ pt: 3 }}>{children}</Box>}
		</div>
	);
}

const VERIFICATION_MODE_OPTIONS = [
	{ value: "all", label: "Todos" },
	{ value: "civil", label: "Civil" },
	{ value: "ss", label: "Seguridad Social" },
	{ value: "trabajo", label: "Trabajo" },
];

const JURISDICCION_OPTIONS = [
	{ value: "all", label: "Todas" },
	{ value: "nacional", label: "Nacional" },
	{ value: "federal", label: "Federal" },
];

const TIPO_ORGANISMO_OPTIONS = [
	{ value: "all", label: "Todos" },
	{ value: "juzgado", label: "Juzgado" },
	{ value: "tribunal", label: "Tribunal" },
	{ value: "camara", label: "Cámara" },
];

const MEVWorkers = () => {
	const { enqueueSnackbar } = useSnackbar();
	const [activeTab, setActiveTab] = useState(0);
	const [configs, setConfigs] = useState<MEVWorkerConfig[]>([]);
	const [systemConfigs, setSystemConfigs] = useState<SystemConfig[]>([]);
	const [loading, setLoading] = useState(true);
	const [loadingSystem, setLoadingSystem] = useState(false);
	const [editingId, setEditingId] = useState<string | null>(null);
	const [editingSystemId, setEditingSystemId] = useState<string | null>(null);
	const [editValues, setEditValues] = useState<Partial<MEVWorkerConfig>>({});
	const [editSystemValues, setEditSystemValues] = useState<Partial<SystemConfig>>({});
	const [hasError, setHasError] = useState(false);

	// Helper para obtener labels
	const getVerificationModeLabel = (value: string) => {
		return VERIFICATION_MODE_OPTIONS.find((opt) => opt.value === value)?.label || value;
	};

	const getJurisdiccionLabel = (value: string) => {
		return JURISDICCION_OPTIONS.find((opt) => opt.value === value)?.label || value;
	};

	const getTipoOrganismoLabel = (value: string) => {
		return TIPO_ORGANISMO_OPTIONS.find((opt) => opt.value === value)?.label || value;
	};

	// Cargar configuraciones del sistema
	const fetchSystemConfigs = async () => {
		try {
			setLoadingSystem(true);
			const response = await MEVWorkersService.getSystemConfigs();
			console.log("System Configs Response:", response);
			if (response.success && Array.isArray(response.data)) {
				setSystemConfigs(response.data);
			} else if (Array.isArray(response)) {
				setSystemConfigs(response);
			} else {
				setSystemConfigs([]);
			}
		} catch (error: any) {
			enqueueSnackbar(error.message || "Error al cargar las configuraciones del sistema", {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
			});
			setSystemConfigs([]);
		} finally {
			setLoadingSystem(false);
		}
	};

	// Cargar configuraciones
	const fetchConfigs = async () => {
		// Si ya hay un error, no intentar de nuevo
		if (hasError) {
			return;
		}

		try {
			setLoading(true);
			const response = await MEVWorkersService.getVerificationConfigs();

			if (response.success && Array.isArray(response.data)) {
				setConfigs(response.data);
				setHasError(false);
			} else if (Array.isArray(response)) {
				// Si la respuesta es directamente un array
				setConfigs(response);
				setHasError(false);
			} else {
				setConfigs([]);
			}
		} catch (error: any) {
			setHasError(true); // Marcar que hubo error para no reintentar
			enqueueSnackbar(error.message || "Error al cargar las configuraciones", {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
			});
			// No lanzar el error para evitar que la página falle
			setConfigs([]);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		// Solo cargar una vez al montar el componente
		let mounted = true;

		if (mounted) {
			fetchConfigs();
		}

		return () => {
			mounted = false;
		};
	}, []); // Dependencias vacías para ejecutar solo una vez

	// Cargar configuraciones del sistema cuando se cambie a esa tab
	useEffect(() => {
		if (activeTab === 1 && systemConfigs.length === 0) {
			fetchSystemConfigs();
		}
	}, [activeTab]);

	// Formatear fecha
	const formatDate = (date: string | undefined): string => {
		if (!date) return "N/A";
		return new Date(date).toLocaleString("es-ES");
	};

	// Formatear fecha con tiempo transcurrido
	const formatDateWithElapsed = (date: string | undefined): { formatted: string; elapsed: string } => {
		if (!date) return { formatted: "N/A", elapsed: "" };

		const dateObj = new Date(date);
		const now = new Date();
		const diffMs = now.getTime() - dateObj.getTime();

		// Calcular diferencias
		const diffSeconds = Math.floor(diffMs / 1000);
		const diffMinutes = Math.floor(diffSeconds / 60);
		const diffHours = Math.floor(diffMinutes / 60);
		const diffDays = Math.floor(diffHours / 24);

		let elapsed = "";
		if (diffDays > 0) {
			elapsed = `hace ${diffDays} día${diffDays > 1 ? 's' : ''}`;
		} else if (diffHours > 0) {
			elapsed = `hace ${diffHours} hora${diffHours > 1 ? 's' : ''}`;
		} else if (diffMinutes > 0) {
			elapsed = `hace ${diffMinutes} minuto${diffMinutes > 1 ? 's' : ''}`;
		} else {
			elapsed = `hace ${diffSeconds} segundo${diffSeconds > 1 ? 's' : ''}`;
		}

		return {
			formatted: dateObj.toLocaleString("es-ES"),
			elapsed
		};
	};

	// Manejar edición
	const handleEdit = (config: MEVWorkerConfig) => {
		setEditingId(config._id);
		setEditValues({
			worker_id: config.worker_id,
			jurisdiccion: config.jurisdiccion,
			tipo_organismo: config.tipo_organismo,
			verification_mode: config.verification_mode,
			enabled: config.enabled,
			batch_size: config.batch_size,
			delay_between_searches: config.delay_between_searches,
			max_retries: config.max_retries,
		});
	};

	const handleCancelEdit = () => {
		setEditingId(null);
		setEditValues({});
	};

	const handleSave = async () => {
		if (!editingId) return;

		try {
			const response = await MEVWorkersService.updateVerificationConfig(editingId, editValues);
			if (response.success) {
				enqueueSnackbar("Configuración actualizada exitosamente", {
					variant: "success",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
				});
				await fetchConfigs();
				handleCancelEdit();
			}
		} catch (error: any) {
			enqueueSnackbar(error.message || "Error al actualizar la configuración", {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
			});
		}
	};

	const handleToggleEnabled = async (config: MEVWorkerConfig) => {
		try {
			const response = await MEVWorkersService.toggleVerificationConfig(config._id);
			if (response.success) {
				enqueueSnackbar(`Worker ${!config.enabled ? "activado" : "desactivado"}`, {
					variant: "success",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
				});
				await fetchConfigs();
			}
		} catch (error: any) {
			enqueueSnackbar(error.message || "Error al cambiar el estado", {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
			});
		}
	};

	// Manejar edición de configuración del sistema
	const handleEditSystem = (config: SystemConfig) => {
		setEditingSystemId(config._id);
		setEditSystemValues({
			value: config.value,
			description: config.description,
			metadata: {
				...config.metadata,
				lastModifiedReason: ''
			}
		});
	};

	const handleCancelEditSystem = () => {
		setEditingSystemId(null);
		setEditSystemValues({});
	};

	const handleSaveSystem = async () => {
		if (!editingSystemId) return;

		try {
			const response = await MEVWorkersService.updateSystemConfig(editingSystemId, editSystemValues);
			if (response.success) {
				enqueueSnackbar("Configuración del sistema actualizada exitosamente", {
					variant: "success",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
				});
				await fetchSystemConfigs();
				handleCancelEditSystem();
			}
		} catch (error: any) {
			enqueueSnackbar(error.message || "Error al actualizar la configuración del sistema", {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
			});
		}
	};

	// Formatear valor según tipo de dato
	const formatSystemValue = (value: any, dataType: string): string => {
		switch (dataType) {
			case 'date':
				return value ? new Date(value).toLocaleString('es-ES') : 'N/A';
			case 'boolean':
				return value ? 'Sí' : 'No';
			case 'number':
				return value?.toLocaleString() || '0';
			case 'json':
				return typeof value === 'object' ? JSON.stringify(value, null, 2) : value;
			default:
				return value?.toString() || '';
		}
	};

	const handleTabChange = (_event: React.SyntheticEvent, newValue: number) => {
		setActiveTab(newValue);
	};

	if (loading) {
		return (
			<MainCard title="Workers MEV">
				<Grid container spacing={3}>
					{[1, 2, 3, 4].map((item) => (
						<Grid item xs={12} key={item}>
							<Skeleton variant="rectangular" height={80} />
						</Grid>
					))}
				</Grid>
			</MainCard>
		);
	}

	// Componente de Worker de Verificación
	const VerificationWorkerContent = () => (
		<Stack spacing={3}>
			{/* Header con acciones */}
			<Box display="flex" justifyContent="space-between" alignItems="center">
				<Typography variant="h5">Configuración del Worker de Verificación MEV</Typography>
				<Button variant="outlined" size="small" startIcon={<Refresh size={16} />} onClick={fetchConfigs}>
					Actualizar
				</Button>
			</Box>

			{/* Información del worker */}
			<Alert severity="info" variant="outlined">
				<Typography variant="subtitle2" fontWeight="bold">
					Worker de Verificación de Causas MEV
				</Typography>
				<Typography variant="body2" sx={{ mt: 1 }}>
					Este worker se encarga de verificar automáticamente el estado de las causas judiciales MEV, validando su existencia y actualizando
					la información en el sistema.
				</Typography>
			</Alert>

			{/* Información detallada del worker */}
			<Card variant="outlined" sx={{ backgroundColor: "background.default" }}>
				<CardContent sx={{ py: 2 }}>
					<Typography variant="subtitle2" fontWeight="bold" gutterBottom>
						Elegibilidad de Documentos - Worker de Verificación MEV
					</Typography>
					<Grid container spacing={1.5}>
						<Grid item xs={6} sm={3}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="caption" color="text.secondary">
									Source:
								</Typography>
								<Typography variant="caption" fontWeight={500}>
									"mev"
								</Typography>
							</Stack>
						</Grid>
						<Grid item xs={6} sm={3}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="caption" color="text.secondary">
									Verified (req):
								</Typography>
								<Typography variant="caption" fontWeight={500}>
									false
								</Typography>
							</Stack>
						</Grid>
						<Grid item xs={6} sm={3}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="caption" color="text.secondary">
									isValid (req):
								</Typography>
								<Typography variant="caption" fontWeight={500}>
									null
								</Typography>
							</Stack>
						</Grid>
						<Grid item xs={6} sm={3}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="caption" color="text.secondary">
									Update:
								</Typography>
								<Typography variant="caption" fontWeight={500}>
									No importa
								</Typography>
							</Stack>
						</Grid>
						<Grid item xs={6} sm={3}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="caption" color="text.secondary">
									Función:
								</Typography>
								<Typography variant="caption" fontWeight={500} color="primary.main">
									Verificación inicial
								</Typography>
							</Stack>
						</Grid>
						<Grid item xs={6} sm={3}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="caption" color="text.secondary">
									Modifica verified:
								</Typography>
								<Typography variant="caption" fontWeight={500} color="success.main">
									SÍ
								</Typography>
							</Stack>
						</Grid>
						<Grid item xs={6} sm={3}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="caption" color="text.secondary">
									Modifica isValid:
								</Typography>
								<Typography variant="caption" fontWeight={500} color="success.main">
									SÍ
								</Typography>
							</Stack>
						</Grid>
						<Grid item xs={6} sm={3}>
							<Stack direction="row" spacing={1} alignItems="center">
								<Typography variant="caption" color="text.secondary">
									Frecuencia:
								</Typography>
								<Typography variant="caption" fontWeight={500} color="warning.main">
									Una sola vez
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
							<TableCell>Jurisdicción</TableCell>
							<TableCell>Tipo Organismo</TableCell>
							<TableCell>Modo Verificación</TableCell>
							<TableCell align="center">Tamaño Lote</TableCell>
							<TableCell align="center">Delay (ms)</TableCell>
							<TableCell align="center">Reintentos</TableCell>
							<TableCell align="center">Verificados</TableCell>
							<TableCell align="center">Válidos</TableCell>
							<TableCell align="center">Inválidos</TableCell>
							<TableCell align="center">Estado</TableCell>
							<TableCell align="center">Última Verificación</TableCell>
							<TableCell align="center">Acciones</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{configs.map((config) => {
							const isEditing = editingId === config._id;

							return (
								<TableRow key={config._id}>
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
												<Select
													value={editValues.jurisdiccion || ""}
													onChange={(e) => setEditValues({ ...editValues, jurisdiccion: e.target.value })}
												>
													{JURISDICCION_OPTIONS.map((option) => (
														<MenuItem key={option.value} value={option.value}>
															{option.label}
														</MenuItem>
													))}
												</Select>
											</FormControl>
										) : (
											<Typography variant="body2">{getJurisdiccionLabel(config.jurisdiccion)}</Typography>
										)}
									</TableCell>
									<TableCell>
										{isEditing ? (
											<FormControl size="small" fullWidth>
												<Select
													value={editValues.tipo_organismo || ""}
													onChange={(e) => setEditValues({ ...editValues, tipo_organismo: e.target.value })}
												>
													{TIPO_ORGANISMO_OPTIONS.map((option) => (
														<MenuItem key={option.value} value={option.value}>
															{option.label}
														</MenuItem>
													))}
												</Select>
											</FormControl>
										) : (
											<Typography variant="body2">{getTipoOrganismoLabel(config.tipo_organismo)}</Typography>
										)}
									</TableCell>
									<TableCell>
										{isEditing ? (
											<FormControl size="small" fullWidth>
												<Select
													value={editValues.verification_mode || ""}
													onChange={(e) => setEditValues({ ...editValues, verification_mode: e.target.value })}
												>
													{VERIFICATION_MODE_OPTIONS.map((option) => (
														<MenuItem key={option.value} value={option.value}>
															{option.label}
														</MenuItem>
													))}
												</Select>
											</FormControl>
										) : (
											<Typography variant="body2">{getVerificationModeLabel(config.verification_mode)}</Typography>
										)}
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
												value={editValues.delay_between_searches || ""}
												onChange={(e) => setEditValues({ ...editValues, delay_between_searches: Number(e.target.value) })}
												sx={{ width: 100 }}
											/>
										) : (
											<Typography variant="body2">{config.delay_between_searches}</Typography>
										)}
									</TableCell>
									<TableCell align="center">
										{isEditing ? (
											<TextField
												size="small"
												type="number"
												value={editValues.max_retries || ""}
												onChange={(e) => setEditValues({ ...editValues, max_retries: Number(e.target.value) })}
												sx={{ width: 80 }}
											/>
										) : (
											<Typography variant="body2">{config.max_retries}</Typography>
										)}
									</TableCell>
									<TableCell align="center">
										<Typography variant="body2" fontWeight={500}>
											{config.documents_verified?.toLocaleString() || 0}
										</Typography>
									</TableCell>
									<TableCell align="center">
										<Typography variant="body2" color="success.main" fontWeight={500}>
											{config.documents_valid?.toLocaleString() || 0}
										</Typography>
									</TableCell>
									<TableCell align="center">
										<Typography variant="body2" color="error.main" fontWeight={500}>
											{config.documents_invalid?.toLocaleString() || 0}
										</Typography>
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
										{(() => {
											const dateInfo = formatDateWithElapsed(config.last_check);
											return (
												<Stack spacing={0.5}>
													<Typography variant="caption">{dateInfo.formatted}</Typography>
													{dateInfo.elapsed && (
														<Typography variant="caption" color="text.secondary">
															({dateInfo.elapsed})
														</Typography>
													)}
												</Stack>
											);
										})()}
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
													<span>
														<IconButton size="small" color="secondary" disabled>
															<Setting2 size={18} />
														</IconButton>
													</span>
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
								Total Verificados
							</Typography>
							<Typography variant="h4">{configs.reduce((acc, c) => acc + (c.documents_verified || 0), 0).toLocaleString()}</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<Card variant="outlined">
						<CardContent>
							<Typography variant="subtitle2" color="text.secondary" gutterBottom>
								Tasa de Éxito
							</Typography>
							<Typography variant="h4" color="info.main">
								{(() => {
									const total = configs.reduce((acc, c) => acc + (c.documents_verified || 0), 0);
									const valid = configs.reduce((acc, c) => acc + (c.documents_valid || 0), 0);
									return total > 0 ? `${((valid / total) * 100).toFixed(1)}%` : "0%";
								})()}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			{/* Información de estadísticas del worker */}
			{configs.length > 0 && configs[0].statistics && (
				<Card variant="outlined">
					<CardContent>
						<Typography variant="subtitle2" fontWeight="bold" gutterBottom>
							Estadísticas del Worker
						</Typography>
						<Grid container spacing={2}>
							<Grid item xs={12} sm={6} md={3}>
								<Stack>
									<Typography variant="caption" color="text.secondary">
										Total Búsquedas
									</Typography>
									<Typography variant="body2" fontWeight={500}>
										{configs[0].statistics.total_searches?.toLocaleString() || 0}
									</Typography>
								</Stack>
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<Stack>
									<Typography variant="caption" color="text.secondary">
										Búsquedas Exitosas
									</Typography>
									<Typography variant="body2" fontWeight={500} color="success.main">
										{configs[0].statistics.successful_searches?.toLocaleString() || 0}
									</Typography>
								</Stack>
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<Stack>
									<Typography variant="caption" color="text.secondary">
										Búsquedas Fallidas
									</Typography>
									<Typography variant="body2" fontWeight={500} color="error.main">
										{configs[0].statistics.failed_searches?.toLocaleString() || 0}
									</Typography>
								</Stack>
							</Grid>
							<Grid item xs={12} sm={6} md={3}>
								<Stack>
									<Typography variant="caption" color="text.secondary">
										Uptime (horas)
									</Typography>
									<Typography variant="body2" fontWeight={500}>
										{configs[0].statistics.uptime_hours?.toLocaleString() || 0}
									</Typography>
								</Stack>
							</Grid>
							{configs[0].statistics.last_error && (
								<>
									<Grid item xs={12} sm={6}>
										<Stack>
											<Typography variant="caption" color="text.secondary">
												Último Error
											</Typography>
											<Typography variant="body2" color="error.main">
												{configs[0].statistics.last_error}
											</Typography>
										</Stack>
									</Grid>
									<Grid item xs={12} sm={6}>
										<Stack>
											<Typography variant="caption" color="text.secondary">
												Fecha Último Error
											</Typography>
											<Typography variant="body2">
												{formatDate(configs[0].statistics.last_error_date)}
											</Typography>
										</Stack>
									</Grid>
								</>
							)}
						</Grid>
					</CardContent>
				</Card>
			)}

			{/* Información de configuración del worker */}
			{configs.length > 0 && configs[0].schedule && (
				<Alert severity="info" variant="outlined">
					<Typography variant="subtitle2">
						Programación: <strong>{configs[0].schedule.cron_pattern}</strong> ({configs[0].schedule.timezone})
						{configs[0].schedule.active_hours && (
							<> - Activo de {configs[0].schedule.active_hours.start}:00 a {configs[0].schedule.active_hours.end}:00</>
						)}
						{configs[0].schedule.skip_weekends && <> - Sin fines de semana</>}
					</Typography>
				</Alert>
			)}
		</Stack>
	);

	// Componente de Configuración del Sistema
	const SystemConfigContent = () => (
		<Stack spacing={3}>
			{/* Header con acciones */}
			<Box display="flex" justifyContent="space-between" alignItems="center">
				<Typography variant="h5">Configuración del Sistema MEV</Typography>
				<Button variant="outlined" size="small" startIcon={<Refresh size={16} />} onClick={fetchSystemConfigs}>
					Actualizar
				</Button>
			</Box>

			{/* Información del sistema */}
			<Alert severity="info" variant="outlined">
				<Typography variant="subtitle2" fontWeight="bold">
					Configuración del Sistema MEV
				</Typography>
				<Typography variant="body2" sx={{ mt: 1 }}>
					Gestiona las configuraciones del sistema MEV incluyendo parámetros de seguridad, scraping y notificaciones.
				</Typography>
			</Alert>

			{loadingSystem ? (
				<Grid container spacing={3}>
					{[1, 2, 3].map((item) => (
						<Grid item xs={12} key={item}>
							<Skeleton variant="rectangular" height={60} />
						</Grid>
					))}
				</Grid>
			) : (
				<TableContainer component={Paper} variant="outlined">
					<Table>
						<TableHead>
							<TableRow>
								<TableCell>Usuario</TableCell>
								<TableCell>Clave</TableCell>
								<TableCell>Valor</TableCell>
								<TableCell>Tipo</TableCell>
								<TableCell>Categoría</TableCell>
								<TableCell>Descripción</TableCell>
								<TableCell align="center">Encriptado</TableCell>
								<TableCell>Última Actualización</TableCell>
								<TableCell align="center">Acciones</TableCell>
							</TableRow>
						</TableHead>
						<TableBody>
							{systemConfigs.map((config) => {
								const isEditing = editingSystemId === config._id;
								const dateInfo = formatDateWithElapsed(config.updatedAt);

								return (
									<TableRow key={config._id}>
										<TableCell>
											<Typography variant="body2" fontWeight={500}>
												{config.userId}
											</Typography>
										</TableCell>
										<TableCell>
											<Typography variant="body2" fontWeight={500} sx={{ fontFamily: 'monospace' }}>
												{config.key}
											</Typography>
										</TableCell>
										<TableCell>
											{isEditing ? (
												config.dataType === 'boolean' ? (
													<Switch
														checked={editSystemValues.value === true}
														onChange={(e) => setEditSystemValues({ ...editSystemValues, value: e.target.checked })}
														size="small"
													/>
												) : config.dataType === 'number' ? (
													<TextField
														size="small"
														type="number"
														value={editSystemValues.value || ''}
														onChange={(e) => setEditSystemValues({ ...editSystemValues, value: Number(e.target.value) })}
														fullWidth
													/>
												) : (
													<TextField
														size="small"
														value={editSystemValues.value || ''}
														onChange={(e) => setEditSystemValues({ ...editSystemValues, value: e.target.value })}
														fullWidth
														multiline={config.dataType === 'json'}
														rows={config.dataType === 'json' ? 3 : 1}
													/>
												)
											) : (
												<Typography
													variant="body2"
													sx={{
														maxWidth: 200,
														overflow: 'hidden',
														textOverflow: 'ellipsis',
														whiteSpace: config.dataType === 'json' ? 'pre-wrap' : 'nowrap',
														fontFamily: config.dataType === 'json' ? 'monospace' : 'inherit',
														fontSize: config.dataType === 'json' ? '0.75rem' : 'inherit'
													}}
													title={formatSystemValue(config.value, config.dataType)}
												>
													{formatSystemValue(config.value, config.dataType)}
												</Typography>
											)}
										</TableCell>
										<TableCell>
											<Chip
												label={config.dataType}
												size="small"
												variant="outlined"
												color={
													config.dataType === 'boolean' ? 'success' :
													config.dataType === 'number' ? 'info' :
													config.dataType === 'date' ? 'warning' :
													'default'
												}
											/>
										</TableCell>
										<TableCell>
											<Chip
												label={config.category}
												size="small"
												color={
													config.category === 'security' ? 'error' :
													config.category === 'scraping' ? 'primary' :
													config.category === 'notification' ? 'warning' :
													'default'
												}
											/>
										</TableCell>
										<TableCell>
											{isEditing ? (
												<TextField
													size="small"
													value={editSystemValues.description || ''}
													onChange={(e) => setEditSystemValues({ ...editSystemValues, description: e.target.value })}
													fullWidth
													multiline
													rows={2}
												/>
											) : (
												<Typography variant="caption" sx={{ display: 'block', maxWidth: 250 }}>
													{config.description}
												</Typography>
											)}
										</TableCell>
										<TableCell align="center">
											{config.isEncrypted ? (
												<Chip label="Sí" size="small" color="error" variant="filled" />
											) : (
												<Chip label="No" size="small" variant="outlined" />
											)}
										</TableCell>
										<TableCell>
											<Stack spacing={0.5}>
												<Typography variant="caption">{dateInfo.formatted}</Typography>
												{dateInfo.elapsed && (
													<Typography variant="caption" color="text.secondary">
														({dateInfo.elapsed})
													</Typography>
												)}
												{config.metadata?.updatedBy && (
													<Typography variant="caption" color="text.secondary">
														Por: {config.metadata.updatedBy}
													</Typography>
												)}
											</Stack>
										</TableCell>
										<TableCell align="center">
											{isEditing ? (
												<Stack direction="row" spacing={1} justifyContent="center">
													{editingSystemId && (
														<>
															<TextField
																size="small"
																placeholder="Razón del cambio"
																value={editSystemValues.metadata?.lastModifiedReason || ''}
																onChange={(e) => setEditSystemValues({
																	...editSystemValues,
																	metadata: {
																		...editSystemValues.metadata,
																		lastModifiedReason: e.target.value
																	}
																})}
																sx={{ width: 150, mb: 1 }}
															/>
															<Tooltip title="Guardar">
																<IconButton
																	size="small"
																	color="primary"
																	onClick={handleSaveSystem}
																	disabled={!editSystemValues.metadata?.lastModifiedReason}
																>
																	<TickCircle size={18} />
																</IconButton>
															</Tooltip>
															<Tooltip title="Cancelar">
																<IconButton size="small" color="error" onClick={handleCancelEditSystem}>
																	<CloseCircle size={18} />
																</IconButton>
															</Tooltip>
														</>
													)}
												</Stack>
											) : (
												<Tooltip title="Editar">
													<IconButton size="small" color="primary" onClick={() => handleEditSystem(config)}>
														<Edit2 size={18} />
													</IconButton>
												</Tooltip>
											)}
										</TableCell>
									</TableRow>
								);
							})}
							{systemConfigs.length === 0 && (
								<TableRow>
									<TableCell colSpan={9} align="center">
										<Typography variant="body2" color="text.secondary">
											No hay configuraciones disponibles
										</Typography>
									</TableCell>
								</TableRow>
							)}
						</TableBody>
					</Table>
				</TableContainer>
			)}
		</Stack>
	);

	return (
		<MainCard title="Workers MEV">
			<Box sx={{ width: "100%" }}>
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
					<Tabs value={activeTab} onChange={handleTabChange} aria-label="workers mev tabs">
						<Tab label="Worker de Verificación" />
						<Tab label="Configuración del Sistema" />
					</Tabs>
				</Box>
				<TabPanel value={activeTab} index={0}>
					<VerificationWorkerContent />
				</TabPanel>
				<TabPanel value={activeTab} index={1}>
					<SystemConfigContent />
				</TabPanel>
			</Box>
		</MainCard>
	);
};

export default MEVWorkers;
import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import {
	Box,
	Typography,
	Alert,
	Chip,
	Stack,
	FormControl,
	InputLabel,
	Select,
	MenuItem,
	IconButton,
	Tooltip,
	useTheme,
	alpha,
	Paper,
	Collapse,
	SelectChangeEvent,
	Divider,
	Skeleton,
} from "@mui/material";
import {
	Timeline,
	TimelineItem,
	TimelineSeparator,
	TimelineDot,
	TimelineConnector,
	TimelineContent,
	TimelineOppositeContent,
} from "@mui/lab";
import {
	Folder2,
	User,
	Note,
	Calendar,
	Task,
	Calculator,
	Document,
	ArrowSwapVertical,
	Moneys,
	Clock,
	Add,
	Edit2,
	Archive,
	Refresh,
	Trash,
	Eye,
	Export,
	Share,
	Message,
	Link21,
	ArrowDown2,
	ArrowUp2,
	Filter,
	Refresh2,
} from "iconsax-react";
import { format, formatDistanceToNow, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { dispatch } from "store";
import { getFolderActivityLog } from "store/reducers/activityLog";
import PaginationWithJump from "components/shared/PaginationWithJump";
import {
	ActivityLogEntry,
	ActivityResourceType,
	ActivityAction,
	RESOURCE_TYPE_LABELS,
	ACTION_LABELS,
	ACTION_COLORS,
	formatPerformedBy,
	ActivityLogQueryParams,
} from "types/activityLog";

// State interface
interface ActivityLogState {
	logs: ActivityLogEntry[];
	pagination?: {
		total: number;
		page: number;
		limit: number;
		pages: number;
	};
	isLoading: boolean;
	error?: string;
}

interface RootState {
	activityLog: ActivityLogState;
}

interface HistorialTabProps {
	folderId: string;
}

// Icon mapping for resource types
const RESOURCE_ICONS: Record<ActivityResourceType, React.ElementType> = {
	folder: Folder2,
	contact: User,
	note: Note,
	event: Calendar,
	task: Task,
	calculator: Calculator,
	document: Document,
	movement: ArrowSwapVertical,
	expense: Moneys,
	availability: Clock,
};

// Icon mapping for actions
const ACTION_ICONS: Record<ActivityAction, React.ElementType> = {
	created: Add,
	updated: Edit2,
	archived: Archive,
	restored: Refresh,
	deleted: Trash,
	viewed: Eye,
	exported: Export,
	shared: Share,
	unshared: Share,
	commented: Message,
	attached: Link21,
	detached: Link21,
};

// Field names to human-readable labels mapping
const FIELD_LABELS: Record<string, string> = {
	// Campos comunes
	title: "Título",
	name: "Nombre",
	description: "Descripción",
	status: "Estado",
	archived: "Archivado",
	content: "Contenido",
	color: "Color",
	link: "Enlace",
	source: "Fuente",

	// Movimientos
	time: "Fecha",
	dateExpiration: "Fecha de vencimiento",
	movement: "Tipo de movimiento",
	completed: "Completado",
	browserAlertSent: "Alerta enviada",

	// Eventos
	start: "Fecha de inicio",
	end: "Fecha de fin",
	allDay: "Todo el día",
	type: "Tipo",
	googleCalendarId: "ID Google Calendar",

	// Tareas
	dueDate: "Fecha límite",
	dueTime: "Hora límite",
	priority: "Prioridad",
	checked: "Completada",

	// Contactos
	lastName: "Apellido",
	role: "Rol",
	email: "Correo electrónico",
	phone: "Teléfono",
	address: "Dirección",
	city: "Ciudad",
	state: "Provincia",
	zipCode: "Código postal",
	nationality: "Nacionalidad",
	document: "Documento",
	cuit: "CUIT/CUIL",
	company: "Empresa",
	fiscal: "Condición fiscal",
	activity: "Actividad",

	// Notas
	// (title y content ya están arriba)

	// Carpetas
	folderName: "Carátula",
	materia: "Materia",
	orderStatus: "Estado del expediente",
	currentPhase: "Fase actual",
	currentStage: "Etapa actual",
	initialDateFolder: "Fecha de inicio",
	finalDateFolder: "Fecha de finalización",
	amount: "Monto",
	folderJuris: "Jurisdicción",
	folderFuero: "Fuero",
	situationFolder: "Situación",

	// Carpeta Pre-judicial
	initialDatePreFolder: "Fecha inicio pre-judicial",
	finalDatePreFolder: "Fecha fin pre-judicial",
	memberPreFolder: "Miembro pre-judicial",
	numberPreFolder: "Número pre-judicial",
	amountPreFolder: "Monto pre-judicial",
	statusPreFolder: "Estado pre-judicial",
	descriptionPreFolder: "Descripción pre-judicial",

	// Carpeta Judicial
	initialDateJudFolder: "Fecha inicio judicial",
	finalDateJudFolder: "Fecha fin judicial",
	numberJudFolder: "Número de expediente",
	statusJudFolder: "Estado judicial",
	amountJudFolder: "Monto judicial",
	descriptionJudFolder: "Descripción judicial",
	courtNumber: "Número de juzgado",
	secretaryNumber: "Número de secretaría",

	// Documentos
	fileName: "Nombre de archivo",
	fileType: "Tipo de archivo",
	fileSize: "Tamaño",
	url: "URL",

	// Calculadoras
	calculatorType: "Tipo de cálculo",
	result: "Resultado",
	parameters: "Parámetros",

	// Configuraciones de notificación
	notifyOnceOnly: "Notificar solo una vez",
	daysInAdvance: "Días de anticipación",

	// PJN/MEV
	causaVerified: "Causa verificada",
	causaIsValid: "Causa válida",
	causaUpdateEnabled: "Actualización habilitada",
	lastMovementDate: "Última fecha de movimiento",
};

/**
 * Obtiene el label legible para un campo
 * @param fieldName - Nombre técnico del campo
 * @returns Label legible o el nombre original si no existe mapeo
 */
const getFieldLabel = (fieldName: string): string => {
	return FIELD_LABELS[fieldName] || fieldName;
};

// Color mapping for MUI
const getMuiColor = (color: string): "success" | "info" | "warning" | "error" | "primary" | "secondary" => {
	switch (color) {
		case "success":
			return "success";
		case "info":
			return "info";
		case "warning":
			return "warning";
		case "error":
			return "error";
		default:
			return "primary";
	}
};

// Skeleton loader for timeline
const HistorialLoader: React.FC = () => (
	<Timeline
		sx={{
			p: 0,
			m: 0,
			"& .MuiTimelineItem-root:before": {
				flex: 0,
				padding: 0,
			},
		}}
	>
		{[1, 2, 3, 4, 5].map((item, index) => (
			<TimelineItem key={item}>
				<TimelineOppositeContent
					sx={{
						flex: 0.2,
						minWidth: { xs: 60, sm: 100 },
						py: 1.5,
					}}
				>
					<Skeleton variant="text" width={70} height={16} sx={{ ml: "auto" }} />
				</TimelineOppositeContent>

				<TimelineSeparator>
					<TimelineDot color="primary" sx={{ opacity: 0.3 }}>
						<Skeleton variant="circular" width={16} height={16} />
					</TimelineDot>
					{index < 4 && <TimelineConnector sx={{ opacity: 0.3 }} />}
				</TimelineSeparator>

				<TimelineContent sx={{ py: 1.5, px: 2 }}>
					<Paper
						elevation={0}
						sx={{
							p: 2,
							bgcolor: "background.default",
							border: "1px solid",
							borderColor: "divider",
							borderRadius: 2,
						}}
					>
						{/* User name */}
						<Skeleton variant="text" width="40%" height={24} sx={{ mb: 1 }} />

						{/* Action chips and resource info */}
						<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
							<Skeleton variant="rounded" width={80} height={22} />
							<Skeleton variant="circular" width={14} height={14} />
							<Skeleton variant="text" width={60} height={18} />
							<Skeleton variant="text" width="30%" height={18} />
						</Stack>
					</Paper>
				</TimelineContent>
			</TimelineItem>
		))}
	</Timeline>
);

const HistorialTab: React.FC<HistorialTabProps> = ({ folderId }) => {
	const theme = useTheme();

	// Filters state
	const [resourceTypeFilter, setResourceTypeFilter] = useState<ActivityResourceType | "">("");
	const [actionFilter, setActionFilter] = useState<ActivityAction | "">("");
	const [page, setPage] = useState(1);
	const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set());
	const [showFilters, setShowFilters] = useState(false);

	const ITEMS_PER_PAGE = 10;

	// Selectors
	const { logs, pagination, isLoading, error } = useSelector((state: RootState) => state.activityLog);

	// Fetch activity log
	const fetchActivityLog = useCallback(
		(forceRefresh: boolean = false) => {
			const params: ActivityLogQueryParams = {
				page,
				limit: ITEMS_PER_PAGE,
			};

			if (resourceTypeFilter) {
				params.resourceType = resourceTypeFilter;
			}
			if (actionFilter) {
				params.action = actionFilter;
			}

			dispatch(getFolderActivityLog(folderId, params, forceRefresh));
		},
		[folderId, page, resourceTypeFilter, actionFilter],
	);

	// Initial fetch (cache-aware, no cleanup needed to preserve cache)
	useEffect(() => {
		fetchActivityLog();
		// Note: We don't clear activity log on unmount to preserve the cache
		// The cache will be invalidated when fetching a different folder or with different params
	}, [fetchActivityLog]);

	// Reset page when filters change
	useEffect(() => {
		setPage(1);
	}, [resourceTypeFilter, actionFilter]);

	// Handle filter changes
	const handleResourceTypeChange = (event: SelectChangeEvent<ActivityResourceType | "">) => {
		setResourceTypeFilter(event.target.value as ActivityResourceType | "");
	};

	const handleActionChange = (event: SelectChangeEvent<ActivityAction | "">) => {
		setActionFilter(event.target.value as ActivityAction | "");
	};

	// Handle page change (receives 0-indexed page from PaginationWithJump)
	const handlePageChange = (zeroIndexedPage: number) => {
		setPage(zeroIndexedPage + 1);
	};

	// Toggle item expansion
	const toggleExpand = (id: string) => {
		setExpandedItems((prev) => {
			const newSet = new Set(prev);
			if (newSet.has(id)) {
				newSet.delete(id);
			} else {
				newSet.add(id);
			}
			return newSet;
		});
	};

	// Clear filters
	const clearFilters = () => {
		setResourceTypeFilter("");
		setActionFilter("");
		setPage(1);
	};

	// Format timestamp
	const formatTimestamp = (dateString: string): { relative: string; absolute: string } => {
		try {
			const date = parseISO(dateString);
			return {
				relative: formatDistanceToNow(date, { addSuffix: true, locale: es }),
				absolute: format(date, "dd/MM/yyyy HH:mm", { locale: es }),
			};
		} catch {
			return { relative: dateString, absolute: dateString };
		}
	};

	// Render change details
	const renderChanges = (changes?: Array<{ field: string; oldValue: any; newValue: any }>) => {
		if (!changes || changes.length === 0) return null;

		return (
			<Box sx={{ mt: 1.5, pl: 1 }}>
				<Typography variant="caption" color="text.secondary" sx={{ fontWeight: 600, display: "block", mb: 0.5 }}>
					Cambios realizados:
				</Typography>
				{changes.map((change, index) => (
					<Box
						key={index}
						sx={{
							display: "flex",
							alignItems: "flex-start",
							gap: 1,
							py: 0.5,
							borderBottom: index < changes.length - 1 ? `1px dashed ${theme.palette.divider}` : "none",
						}}
					>
						<Typography variant="caption" sx={{ fontWeight: 500, minWidth: 120 }}>
							{getFieldLabel(change.field)}:
						</Typography>
						<Box sx={{ flex: 1 }}>
							{change.oldValue !== undefined && change.oldValue !== null && (
								<Typography
									variant="caption"
									sx={{
										color: theme.palette.error.main,
										textDecoration: "line-through",
										display: "block",
									}}
								>
									{String(change.oldValue).substring(0, 100)}
									{String(change.oldValue).length > 100 && "..."}
								</Typography>
							)}
							{change.newValue !== undefined && change.newValue !== null && (
								<Typography variant="caption" sx={{ color: theme.palette.success.main, display: "block" }}>
									{String(change.newValue).substring(0, 100)}
									{String(change.newValue).length > 100 && "..."}
								</Typography>
							)}
						</Box>
					</Box>
				))}
			</Box>
		);
	};

	// Render activity item
	const renderActivityItem = (entry: ActivityLogEntry, isLast: boolean) => {
		const ResourceIcon = RESOURCE_ICONS[entry.resourceType] || Document;
		const ActionIcon = ACTION_ICONS[entry.action] || Edit2;
		const actionColor = ACTION_COLORS[entry.action] || "default";
		const muiColor = getMuiColor(actionColor);
		const timestamp = formatTimestamp(entry.createdAt);
		const isExpanded = expandedItems.has(entry._id);
		const hasChanges = entry.changes && entry.changes.length > 0;

		return (
			<TimelineItem key={entry._id}>
				<TimelineOppositeContent
					sx={{
						flex: 0.2,
						minWidth: { xs: 60, sm: 100 },
						py: 1.5,
					}}
				>
					<Tooltip title={timestamp.absolute}>
						<Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "right" }}>
							{timestamp.relative}
						</Typography>
					</Tooltip>
				</TimelineOppositeContent>

				<TimelineSeparator>
					<TimelineDot
						color={muiColor}
						sx={{
							boxShadow: `0 0 0 4px ${alpha(theme.palette[muiColor].main, 0.15)}`,
						}}
					>
						<ActionIcon size={16} variant="Bold" />
					</TimelineDot>
					{!isLast && <TimelineConnector sx={{ bgcolor: alpha(theme.palette.divider, 0.5) }} />}
				</TimelineSeparator>

				<TimelineContent sx={{ py: 1.5, px: 2 }}>
					<Paper
						elevation={0}
						sx={{
							p: 2,
							bgcolor: alpha(theme.palette.background.default, 0.5),
							border: `1px solid ${theme.palette.divider}`,
							borderRadius: 2,
							transition: "all 0.2s",
							"&:hover": {
								bgcolor: alpha(theme.palette.primary.main, 0.02),
								borderColor: alpha(theme.palette.primary.main, 0.2),
							},
						}}
					>
						{/* Header */}
						<Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
							<Box sx={{ flex: 1 }}>
								{/* User info */}
								<Typography variant="subtitle2" sx={{ fontWeight: 600, mb: 0.5 }}>
									{formatPerformedBy(entry.performedByInfo)}
								</Typography>

								{/* Action description */}
								<Box sx={{ display: "flex", alignItems: "center", gap: 0.75, flexWrap: "wrap" }}>
									<Chip
										label={ACTION_LABELS[entry.action] || entry.action}
										size="small"
										color={muiColor}
										variant="outlined"
										sx={{ height: 22, fontSize: "0.7rem" }}
									/>
									<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
										<ResourceIcon size={14} color={theme.palette.text.secondary} />
										<Typography variant="body2" color="text.secondary">
											{RESOURCE_TYPE_LABELS[entry.resourceType] || entry.resourceType}
										</Typography>
									</Box>
									{entry.resourceName && (
										<Typography variant="body2" sx={{ fontWeight: 500 }}>
											"{entry.resourceName}"
										</Typography>
									)}
								</Box>
							</Box>

							{/* Expand button for changes */}
							{hasChanges && (
								<IconButton size="small" onClick={() => toggleExpand(entry._id)} sx={{ mt: -0.5 }}>
									{isExpanded ? <ArrowUp2 size={16} /> : <ArrowDown2 size={16} />}
								</IconButton>
							)}
						</Box>

						{/* Expandable changes section */}
						{hasChanges && (
							<Collapse in={isExpanded}>
								<Divider sx={{ my: 1.5 }} />
								{renderChanges(entry.changes)}
							</Collapse>
						)}
					</Paper>
				</TimelineContent>
			</TimelineItem>
		);
	};

	// Resource type options
	const resourceTypeOptions = useMemo(
		() =>
			Object.entries(RESOURCE_TYPE_LABELS).map(([value, label]) => (
				<MenuItem key={value} value={value}>
					{label}
				</MenuItem>
			)),
		[],
	);

	// Action options
	const actionOptions = useMemo(
		() =>
			Object.entries(ACTION_LABELS).map(([value, label]) => (
				<MenuItem key={value} value={value}>
					{label}
				</MenuItem>
			)),
		[],
	);

	// Loading state
	if (isLoading && logs.length === 0) {
		return (
			<Box sx={{ p: { xs: 1, sm: 2 } }}>
				{/* Header skeleton */}
				<Box sx={{ display: "flex", alignItems: "center", gap: 1, mb: 2 }}>
					<Skeleton variant="circular" width={24} height={24} />
					<Skeleton variant="text" width={180} height={32} />
					<Skeleton variant="rounded" width={80} height={24} sx={{ ml: 1 }} />
				</Box>
				<HistorialLoader />
			</Box>
		);
	}

	// Error state
	if (error) {
		return (
			<Alert severity="error" sx={{ m: 2 }}>
				{error}
			</Alert>
		);
	}

	return (
		<Box sx={{ p: { xs: 1, sm: 2 } }}>
			{/* Header */}
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					justifyContent: "space-between",
					mb: 2,
					flexWrap: "wrap",
					gap: 1,
				}}
			>
				<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
					<Clock size={24} color={theme.palette.primary.main} />
					<Typography variant="h5" sx={{ fontWeight: 600 }}>
						Historial de Actividad
					</Typography>
					{pagination && (
						<Chip label={`${pagination.total} registros`} size="small" variant="outlined" sx={{ ml: 1 }} />
					)}
				</Box>

				<Stack direction="row" spacing={1}>
					<Tooltip title="Actualizar">
						<IconButton onClick={() => fetchActivityLog(true)} disabled={isLoading} size="small">
							<Refresh2 size={20} />
						</IconButton>
					</Tooltip>
					<Tooltip title={showFilters ? "Ocultar filtros" : "Mostrar filtros"}>
						<IconButton
							onClick={() => setShowFilters(!showFilters)}
							size="small"
							color={showFilters ? "primary" : "default"}
						>
							<Filter size={20} />
						</IconButton>
					</Tooltip>
				</Stack>
			</Box>

			{/* Filters */}
			<Collapse in={showFilters}>
				<Paper
					elevation={0}
					sx={{
						p: 2,
						mb: 2,
						bgcolor: alpha(theme.palette.primary.main, 0.02),
						border: `1px solid ${theme.palette.divider}`,
						borderRadius: 2,
					}}
				>
					<Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems="flex-end">
						<FormControl size="small" sx={{ minWidth: 150 }}>
							<InputLabel>Tipo de recurso</InputLabel>
							<Select value={resourceTypeFilter} onChange={handleResourceTypeChange} label="Tipo de recurso">
								<MenuItem value="">Todos</MenuItem>
								{resourceTypeOptions}
							</Select>
						</FormControl>

						<FormControl size="small" sx={{ minWidth: 150 }}>
							<InputLabel>Acción</InputLabel>
							<Select value={actionFilter} onChange={handleActionChange} label="Acción">
								<MenuItem value="">Todas</MenuItem>
								{actionOptions}
							</Select>
						</FormControl>

						{(resourceTypeFilter || actionFilter) && (
							<Chip label="Limpiar filtros" size="small" onDelete={clearFilters} onClick={clearFilters} />
						)}
					</Stack>
				</Paper>
			</Collapse>

			{/* Loading overlay for pagination */}
			{isLoading && logs.length > 0 && (
				<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
					<Stack direction="row" spacing={1} alignItems="center">
						<Skeleton variant="circular" width={20} height={20} animation="wave" />
						<Skeleton variant="text" width={100} height={20} animation="wave" />
					</Stack>
				</Box>
			)}

			{/* Empty state */}
			{!isLoading && logs.length === 0 && (
				<Paper
					elevation={0}
					sx={{
						p: 4,
						textAlign: "center",
						bgcolor: alpha(theme.palette.background.default, 0.5),
						border: `1px dashed ${theme.palette.divider}`,
						borderRadius: 2,
					}}
				>
					<Clock size={48} color={theme.palette.text.disabled} />
					<Typography variant="h6" color="text.secondary" sx={{ mt: 2 }}>
						No hay actividad registrada
					</Typography>
					<Typography variant="body2" color="text.disabled">
						{resourceTypeFilter || actionFilter
							? "No se encontraron registros con los filtros seleccionados"
							: "Las acciones realizadas en esta causa aparecerán aquí"}
					</Typography>
				</Paper>
			)}

			{/* Timeline */}
			{logs.length > 0 && (
				<Timeline
					sx={{
						p: 0,
						m: 0,
						"& .MuiTimelineItem-root:before": {
							flex: 0,
							padding: 0,
						},
					}}
				>
					{logs.map((entry, index) => renderActivityItem(entry, index === logs.length - 1))}
				</Timeline>
			)}

			{/* Pagination */}
			{pagination && pagination.pages > 1 && (
				<Box sx={{ display: "flex", justifyContent: "center", mt: 3 }}>
					<PaginationWithJump
						page={page - 1}
						totalPages={pagination.pages}
						onPageChange={handlePageChange}
						disabled={isLoading}
					/>
				</Box>
			)}
		</Box>
	);
};

export default HistorialTab;

import React, { useEffect, useState, useCallback, useMemo } from "react";
import { useSelector } from "react-redux";
import {
	Box,
	Typography,
	Alert,
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
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

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

// Brand accent mapping for action types
const getBrandAccent = (color: string, errorMain: string): string => {
	switch (color) {
		case "success":
			return LIVE_GREEN;
		case "warning":
			return STALE_AMBER;
		case "error":
			return errorMain;
		case "info":
		default:
			return BRAND_BLUE;
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

	// Render change details — brand
	const renderChanges = (changes?: Array<{ field: string; oldValue: any; newValue: any }>) => {
		if (!changes || changes.length === 0) return null;

		const isDarkLocal = theme.palette.mode === "dark";

		return (
			<Box sx={{ mt: 1, pl: 0.5 }}>
				<Stack direction="row" spacing={0.5} alignItems="center" mb={0.75}>
					<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
					<Typography
						sx={{
							fontSize: "0.6rem",
							fontWeight: 600,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							color: "text.secondary",
						}}
					>
						Cambios realizados
					</Typography>
				</Stack>
				{changes.map((change, index) => (
					<Box
						key={index}
						sx={{
							display: "flex",
							alignItems: "flex-start",
							gap: 1,
							py: 0.5,
							borderBottom:
								index < changes.length - 1 ? `1px dashed ${alpha(BRAND_BLUE, isDarkLocal ? 0.18 : 0.12)}` : "none",
						}}
					>
						<Typography
							sx={{
								fontSize: "0.7rem",
								fontWeight: 600,
								color: "text.primary",
								letterSpacing: "-0.005em",
								minWidth: 120,
							}}
						>
							{getFieldLabel(change.field)}
						</Typography>
						<Box sx={{ flex: 1 }}>
							{change.oldValue !== undefined && change.oldValue !== null && (
								<Typography
									sx={{
										fontSize: "0.7rem",
										color: theme.palette.error.main,
										textDecoration: "line-through",
										display: "block",
										letterSpacing: "-0.005em",
									}}
								>
									{String(change.oldValue).substring(0, 100)}
									{String(change.oldValue).length > 100 && "..."}
								</Typography>
							)}
							{change.newValue !== undefined && change.newValue !== null && (
								<Typography
									sx={{
										fontSize: "0.7rem",
										color: LIVE_GREEN,
										display: "block",
										fontWeight: 600,
										letterSpacing: "-0.005em",
									}}
								>
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

	const isDark = theme.palette.mode === "dark";

	// Render activity item — brand-aligned
	const renderActivityItem = (entry: ActivityLogEntry, isLast: boolean) => {
		const ResourceIcon = RESOURCE_ICONS[entry.resourceType] || Document;
		const ActionIcon = ACTION_ICONS[entry.action] || Edit2;
		const actionColor = ACTION_COLORS[entry.action] || "default";
		const accent = getBrandAccent(actionColor, theme.palette.error.main);
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
						<Typography
							sx={{
								fontSize: "0.7rem",
								color: "text.secondary",
								letterSpacing: "-0.005em",
								display: "block",
								textAlign: "right",
							}}
						>
							{timestamp.relative}
						</Typography>
					</Tooltip>
				</TimelineOppositeContent>

				<TimelineSeparator>
					<Box
						sx={{
							width: 26,
							height: 26,
							borderRadius: "50%",
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(accent, isDark ? 0.18 : 0.1),
							border: `1px solid ${alpha(accent, isDark ? 0.32 : 0.22)}`,
							color: accent,
							flexShrink: 0,
							boxShadow: `0 0 0 3px ${alpha(accent, isDark ? 0.08 : 0.04)}`,
						}}
					>
						<ActionIcon size={12} variant="Bulk" />
					</Box>
					{!isLast && <TimelineConnector sx={{ bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.12), width: 1.5 }} />}
				</TimelineSeparator>

				<TimelineContent sx={{ py: 1.25, px: 2 }}>
					<Box
						sx={{
							p: 1.75,
							borderRadius: 1.5,
							bgcolor: theme.palette.background.paper,
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
							transition: "all 180ms ease",
							"&:hover": {
								borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
							},
						}}
					>
						{/* Header */}
						<Box sx={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", gap: 1 }}>
							<Box sx={{ flex: 1, minWidth: 0 }}>
								<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, letterSpacing: "-0.005em", color: "text.primary", mb: 0.5 }}>
									{formatPerformedBy(entry.performedByInfo)}
								</Typography>

								<Box sx={{ display: "flex", alignItems: "center", gap: 0.625, flexWrap: "wrap" }}>
									{/* Action pill brand-accented */}
									<Box
										sx={{
											display: "inline-flex",
											alignItems: "center",
											gap: 0.5,
											px: 0.75,
											py: 0.125,
											borderRadius: 0.625,
											bgcolor: alpha(accent, isDark ? 0.16 : 0.1),
											border: `1px solid ${alpha(accent, isDark ? 0.32 : 0.22)}`,
										}}
									>
										<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: accent }} />
										<Typography
											sx={{
												fontSize: "0.62rem",
												fontWeight: 600,
												color: accent,
												letterSpacing: "0.04em",
												textTransform: "uppercase",
												lineHeight: 1,
											}}
										>
											{ACTION_LABELS[entry.action] || entry.action}
										</Typography>
									</Box>
									<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
										<ResourceIcon size={12} variant="Bulk" color={theme.palette.text.secondary} />
										<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
											{RESOURCE_TYPE_LABELS[entry.resourceType] || entry.resourceType}
										</Typography>
									</Box>
									{entry.resourceName && (
										<Typography
											sx={{
												fontSize: "0.78rem",
												fontWeight: 600,
												color: "text.primary",
												letterSpacing: "-0.005em",
												overflow: "hidden",
												textOverflow: "ellipsis",
											}}
										>
											"{entry.resourceName}"
										</Typography>
									)}
								</Box>
							</Box>

							{/* Expand button */}
							{hasChanges && (
								<IconButton
									size="small"
									onClick={() => toggleExpand(entry._id)}
									sx={{
										width: 24,
										height: 24,
										borderRadius: 0.75,
										color: BRAND_BLUE,
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
										border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
										"&:hover": {
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
										},
									}}
								>
									{isExpanded ? <ArrowUp2 size={12} variant="Bulk" /> : <ArrowDown2 size={12} variant="Bulk" />}
								</IconButton>
							)}
						</Box>

						{/* Expandable changes */}
						{hasChanges && (
							<Collapse in={isExpanded}>
								<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.1), my: 1.25 }} />
								{renderChanges(entry.changes)}
							</Collapse>
						)}
					</Box>
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
			{/* Header — brand */}
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
				<Stack direction="row" spacing={1.25} alignItems="center">
					<Box
						sx={{
							width: 36,
							height: 36,
							borderRadius: 1,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
							color: BRAND_BLUE,
						}}
					>
						<Clock size={18} variant="Bulk" />
					</Box>
					<Stack spacing={0.125}>
						<Stack direction="row" spacing={0.5} alignItems="center">
							<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
							<Typography
								sx={{
									fontSize: "0.6rem",
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "text.secondary",
								}}
							>
								Historial
							</Typography>
						</Stack>
						<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
							<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
								Actividad
							</Typography>
							{pagination && (
								<Box
									sx={{
										display: "inline-flex",
										alignItems: "center",
										px: 0.875,
										py: 0.25,
										borderRadius: 0.75,
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
										border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
									}}
								>
									<Typography
										sx={{
											fontSize: "0.7rem",
											fontWeight: 700,
											color: BRAND_BLUE,
											letterSpacing: "-0.005em",
											fontVariantNumeric: "tabular-nums",
										}}
									>
										{pagination.total}{" "}
										<Box component="span" sx={{ fontSize: "0.66rem", fontWeight: 500, opacity: 0.85 }}>
											registros
										</Box>
									</Typography>
								</Box>
							)}
						</Stack>
					</Stack>
				</Stack>

				<Stack direction="row" spacing={0.75}>
					<Tooltip title="Actualizar">
						<IconButton
							onClick={() => fetchActivityLog(true)}
							disabled={isLoading}
							size="small"
							sx={{
								width: 32,
								height: 32,
								borderRadius: 1,
								color: BRAND_BLUE,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
								"&:hover": {
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
									borderColor: alpha(BRAND_BLUE, isDark ? 0.38 : 0.28),
								},
								"&:disabled": {
									bgcolor: alpha(theme.palette.text.disabled, 0.06),
									color: theme.palette.text.disabled,
								},
							}}
						>
							<Refresh2 size={16} variant="Bulk" />
						</IconButton>
					</Tooltip>
					<Tooltip title={showFilters ? "Ocultar filtros" : "Mostrar filtros"}>
						<IconButton
							onClick={() => setShowFilters(!showFilters)}
							size="small"
							sx={{
								width: 32,
								height: 32,
								borderRadius: 1,
								color: BRAND_BLUE,
								bgcolor: showFilters ? alpha(BRAND_BLUE, isDark ? 0.18 : 0.1) : alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
								border: `1px solid ${alpha(BRAND_BLUE, showFilters ? (isDark ? 0.38 : 0.28) : isDark ? 0.22 : 0.14)}`,
								"&:hover": {
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.14),
								},
							}}
						>
							<Filter size={16} variant="Bulk" />
						</IconButton>
					</Tooltip>
				</Stack>
			</Box>

			{/* Filters — brand */}
			<Collapse in={showFilters}>
				<Box
					sx={{
						p: 1.75,
						mb: 2,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
						borderRadius: 1.5,
					}}
				>
					<Stack direction={{ xs: "column", sm: "row" }} spacing={1.5} alignItems="flex-end">
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
							<Box
								onClick={clearFilters}
								sx={{
									display: "inline-flex",
									alignItems: "center",
									gap: 0.5,
									px: 1,
									py: 0.5,
									borderRadius: 0.875,
									cursor: "pointer",
									bgcolor: alpha(STALE_AMBER, isDark ? 0.12 : 0.08),
									border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.28 : 0.2)}`,
									"&:hover": {
										bgcolor: alpha(STALE_AMBER, isDark ? 0.2 : 0.14),
									},
								}}
							>
								<Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: STALE_AMBER, letterSpacing: "-0.005em" }}>
									Limpiar filtros
								</Typography>
							</Box>
						)}
					</Stack>
				</Box>
			</Collapse>

			{/* Loading overlay */}
			{isLoading && logs.length > 0 && (
				<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
					<Stack direction="row" spacing={1} alignItems="center">
						<Skeleton variant="circular" width={20} height={20} animation="wave" />
						<Skeleton variant="text" width={100} height={20} animation="wave" />
					</Stack>
				</Box>
			)}

			{/* Empty state — brand */}
			{!isLoading && logs.length === 0 && (
				<Box
					sx={{
						p: 3.5,
						textAlign: "center",
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
						border: `1px dashed ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.2)}`,
						borderRadius: 1.5,
					}}
				>
					<Box
						sx={{
							width: 56,
							height: 56,
							borderRadius: 1.5,
							display: "inline-flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
							color: BRAND_BLUE,
							mb: 1.5,
						}}
					>
						<Clock size={28} variant="Bulk" />
					</Box>
					<Typography sx={{ fontSize: "1rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.015em" }}>
						Sin actividad registrada
					</Typography>
					<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", letterSpacing: "-0.005em", mt: 0.5 }}>
						{resourceTypeFilter || actionFilter
							? "No se encontraron registros con los filtros seleccionados."
							: "Las acciones realizadas en esta causa aparecerán acá."}
					</Typography>
				</Box>
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
					<PaginationWithJump page={page - 1} totalPages={pagination.pages} onPageChange={handlePageChange} disabled={isLoading} />
				</Box>
			)}
		</Box>
	);
};

export default HistorialTab;

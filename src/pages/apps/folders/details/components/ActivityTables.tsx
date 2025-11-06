import React, { useState, useEffect } from "react";
import {
	Box,
	Paper,
	Tab,
	Tabs,
	Typography,
	Stack,
	IconButton,
	Tooltip,
	Button,
	TextField,
	InputAdornment,
	Chip,
	useTheme,
	alpha,
	Skeleton,
	Dialog,
	Collapse,
	Fade,
	useMediaQuery,
	Drawer,
	Divider,
	FormControlLabel,
	Checkbox,
	Alert,
	Badge,
} from "@mui/material";
import dayjs from "utils/dayjs-config";
import {
	TableDocument,
	NotificationStatus,
	Calendar,
	Link21,
	SearchNormal1,
	ExportSquare,
	Filter,
	Add,
	Menu,
	TickCircle,
	DocumentText,
	Gallery,
} from "iconsax-react";
import MainCard from "components/MainCard";
import { useParams } from "react-router";
import { useSelector, dispatch } from "store";
import { getMovementsByFolderId } from "store/reducers/movements";
import { getNotificationsByFolderId } from "store/reducers/notifications";
import { getEventsById } from "store/reducers/events";
import { getCombinedActivities } from "store/reducers/activities";
import MovementsTable from "./tables/MovementsTable";
import NotificationsTable from "./tables/NotificationsTable";
import CalendarTable from "./tables/CalendarTable";
import CombinedTablePaginated from "./tables/CombinedTablePaginated";
import ModalMovements from "../modals/ModalMovements";
import ModalNotifications from "../modals/ModalNotifications";
import AddEventFrom from "sections/apps/calendar/AddEventForm";
import AlertMemberDelete from "../modals/alertMemberDelete";
import AlertNotificationDelete from "../modals/alertNotificationDelete";
import { Movement } from "types/movements";
import { NotificationType } from "types/notifications";
import { CombinedActivity } from "types/activities";
import { PopupTransition } from "components/@extended/Transitions";
import { toggleModal, selectEvent } from "store/reducers/calendar";
import { deleteEvent } from "store/reducers/events";
import ActivityFilters from "./filters/ActivityFilters";
import { exportActivityData } from "./utils/exportUtils";
import PDFViewer from "components/shared/PDFViewer";
import ScrapingProgressBanner from "./ScrapingProgressBanner";
import { useScrapingProgress } from "hooks/useScrapingProgress";

// Types
interface ActivityTablesProps {
	folderName?: string;
}

type TabValue = "movements" | "notifications" | "calendar" | "combined";

interface TabConfig {
	value: TabValue;
	label: string;
	icon: React.ReactElement;
	color: string;
	description: string;
}

const ActivityTables: React.FC<ActivityTablesProps> = ({ folderName }) => {
	const theme = useTheme();
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const { id } = useParams<{ id: string }>();
	const [activeTab, setActiveTab] = useState<TabValue>("movements");
	const [searchQuery, setSearchQuery] = useState("");
	const [showFilters, setShowFilters] = useState(false);
	const [mobileOpen, setMobileOpen] = useState(false);
	const [filters, setFilters] = useState<any>({
		startDate: null,
		endDate: null,
		type: "",
		status: "",
		user: "",
		hasExpiration: "",
		allDay: "",
		source: "",
		onlyWithDocuments: true, // Inicialmente activado para mostrar solo movimientos con documento
	});

	// Modals states - Movements
	const [openMovementModal, setOpenMovementModal] = useState(false);
	const [openDeleteModal, setOpenDeleteModal] = useState(false);
	const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
	const [movementToDelete, setMovementToDelete] = useState<string | null>(null);

	// Modals states - Notifications
	const [openNotificationModal, setOpenNotificationModal] = useState(false);
	const [openNotificationDeleteModal, setOpenNotificationDeleteModal] = useState(false);
	const [selectedNotification, setSelectedNotification] = useState<NotificationType | null>(null);
	const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);

	// Modals states - Calendar
	const [eventToDelete, setEventToDelete] = useState<string | null>(null);
	const [deleteEventDialog, setDeleteEventDialog] = useState(false);

	// View details states
	const [viewMovementDetails, setViewMovementDetails] = useState<Movement | null>(null);
	const [viewNotificationDetails, setViewNotificationDetails] = useState<NotificationType | null>(null);
	const [viewEventDetails, setViewEventDetails] = useState<any | null>(null);

	// Estado para navegación secuencial de documentos
	const [documentNavigationOpen, setDocumentNavigationOpen] = useState(false);
	const [currentDocumentMovement, setCurrentDocumentMovement] = useState<Movement | null>(null);

	// Estado para PDFViewer desde modal de detalles
	const [pdfViewerFromDetailsOpen, setPdfViewerFromDetailsOpen] = useState(false);
	const [pdfUrlFromDetails, setPdfUrlFromDetails] = useState<string>("");
	const [pdfTitleFromDetails, setPdfTitleFromDetails] = useState<string>("");

	// Estado para ScrapingProgressBanner
	const [scrapingBannerClosed, setScrapingBannerClosed] = useState(false);

	// Selectors
	const movementsData = useSelector((state: any) => state.movements);
	const notificationsData = useSelector((state: any) => state.notifications);
	const eventsData = useSelector((state: any) => state.events);
	const activitiesData = useSelector((state: any) => state.activities);
	const calendarState = useSelector((state: any) => state.calendar);
	const auth = useSelector((state: any) => state.auth);
	const userId = auth.user?._id;

	// Hook personalizado para gestionar scrapingProgress con transición suave
	const { scrapingProgress } = useScrapingProgress(movementsData.scrapingProgress, id);

	// Detectar si es PJN o MEV basado en la presencia de pjnAccess
	const scrapingSource: "mev" | "pjn" = movementsData.pjnAccess ? "pjn" : "mev";

	// Load data on mount - con paginación inicial
	useEffect(() => {
		if (id) {
			// Cargar movimientos con paginación inicial y ordenamiento por defecto
			// Si el filtro de documentos está activo, incluirlo en la petición inicial
			dispatch(
				getMovementsByFolderId(id, {
					page: 1,
					limit: 10,
					sort: "-time", // Ordenar por fecha descendente por defecto
					filter: filters.onlyWithDocuments ? { hasLink: true } : undefined,
				}),
			);
			dispatch(getNotificationsByFolderId(id));
			dispatch(getEventsById(id));
		}
	}, [id, filters.onlyWithDocuments]);

	// Polling para scrapingProgress cada 30 segundos
	useEffect(() => {
		// Solo hacer polling si:
		// 1. Hay scrapingProgress
		// 2. No está completo
		// 3. El estado no es "completed"
		// 4. Hay un folderId
		if (!scrapingProgress || scrapingProgress.isComplete || scrapingProgress.status === "completed" || !id) {
			return;
		}

		// Configurar intervalo de 30 segundos
		const pollInterval = setInterval(() => {
			dispatch(
				getMovementsByFolderId(id, {
					page: 1,
					limit: 10,
					sort: "-time",
					filter: filters.onlyWithDocuments ? { hasLink: true } : undefined,
				}),
			);
		}, 30000); // 30 segundos

		// Limpiar intervalo al desmontar o cuando cambian las dependencias
		return () => clearInterval(pollInterval);
	}, [id, scrapingProgress?.isComplete, scrapingProgress?.status, filters.onlyWithDocuments]);

	// Resetear estado del banner cuando cambia scrapingProgress
	useEffect(() => {
		// Si scrapingProgress cambia (nuevo proceso), resetear el estado de cerrado
		if (scrapingProgress && !scrapingProgress.isComplete) {
			setScrapingBannerClosed(false);
		}
	}, [scrapingProgress?.status]);

	// Tab configuration
	const tabs: TabConfig[] = [
		{
			value: "movements",
			label: "Movimientos",
			icon: <TableDocument size={20} />,
			color: theme.palette.success.main,
			description: "Escritos y despachos judiciales",
		},
		{
			value: "notifications",
			label: "Notificaciones",
			icon: <NotificationStatus size={20} />,
			color: theme.palette.primary.main,
			description: "Cédulas y notificaciones",
		},
		{
			value: "calendar",
			label: "Calendario",
			icon: <Calendar size={20} />,
			color: theme.palette.warning.main,
			description: "Eventos y audiencias",
		},
		{
			value: "combined",
			label: "Vista Combinada",
			icon: <Link21 size={20} />,
			color: theme.palette.secondary.main,
			description: "Todas las actividades unificadas",
		},
	];

	const handleTabChange = (_event: React.SyntheticEvent, newValue: TabValue) => {
		setActiveTab(newValue);
		setSearchQuery(""); // Reset search when changing tabs
		setShowFilters(false); // Hide filters when changing tabs
		setFilters({
			// Reset filters
			startDate: null,
			endDate: null,
			type: "",
			status: "",
			user: "",
			hasExpiration: "",
			allDay: "",
			source: "",
		});

		// Cargar datos combinados cuando se selecciona esa pestaña
		if (newValue === "combined" && id) {
			dispatch(
				getCombinedActivities(id, {
					page: 1,
					limit: 10,
					sort: "-date",
					filter: {
						types: ["movement", "notification", "event"],
					},
				}),
			);
		}

		if (isMobile) {
			setMobileOpen(false);
		}
	};

	const handleExport = () => {
		// Get filtered data based on current tab
		let dataToExport: any = {};

		if (activeTab === "movements") {
			dataToExport.movements = movementsData.movements;
		} else if (activeTab === "notifications") {
			dataToExport.notifications = notificationsData.notifications;
		} else if (activeTab === "calendar") {
			dataToExport.events = eventsData.events;
		} else if (activeTab === "combined") {
			// For combined view, export from the paginated data
			dataToExport.combined = activitiesData.activities;
		}

		exportActivityData(activeTab, dataToExport, folderName);
	};

	// Date formatting utility
	const formatDate = (dateString: string) => {
		if (!dateString || dateString.trim() === "") {
			return "";
		}

		try {
			// Try to parse as ISO date first
			if (dateString.includes("T") || dateString.includes("-")) {
				const parsed = dayjs.utc(dateString);
				if (parsed.isValid()) {
					// Usar componentes de fecha UTC para evitar conversión de zona horaria
					return parsed.format("DD/MM/YYYY");
				}
			}

			// Try to parse as DD/MM/YYYY format
			const parsed = dayjs(dateString, "DD/MM/YYYY");
			if (parsed.isValid()) {
				return parsed.format("DD/MM/YYYY");
			}

			return "";
		} catch {
			return "";
		}
	};

	// Movement handlers
	const handleAddMovement = () => {
		setSelectedMovement(null);
		setOpenMovementModal(true);
	};

	const handleEditMovement = (movement: Movement) => {
		setSelectedMovement(movement);
		setOpenMovementModal(true);
	};

	const handleDeleteMovement = (id: string) => {
		setMovementToDelete(id);
		setOpenDeleteModal(true);
	};

	const handleViewMovement = (movement: Movement) => {
		setViewMovementDetails(movement);
	};

	const handleCloseMovementModal = () => {
		setOpenMovementModal(false);
		setSelectedMovement(null);
	};

	const handleCloseDeleteModal = () => {
		setOpenDeleteModal(false);
		setMovementToDelete(null);
	};

	const handleRefreshMovements = () => {
		if (id) {
			dispatch(
				getMovementsByFolderId(id, {
					page: 1,
					limit: 10,
					sort: "-time",
					filter: filters.onlyWithDocuments ? { hasLink: true } : undefined,
				}),
			);
		}
	};

	const handleCloseBanner = () => {
		setScrapingBannerClosed(true);
	};

	// Notification handlers
	const handleAddNotification = () => {
		setSelectedNotification(null);
		setOpenNotificationModal(true);
	};

	const handleEditNotification = (notification: NotificationType) => {
		setSelectedNotification(notification);
		setOpenNotificationModal(true);
	};

	const handleDeleteNotification = (id: string) => {
		setNotificationToDelete(id);
		setOpenNotificationDeleteModal(true);
	};

	const handleViewNotification = (notification: NotificationType) => {
		setViewNotificationDetails(notification);
	};

	const handleCloseNotificationModal = () => {
		setOpenNotificationModal(false);
		setSelectedNotification(null);
	};

	const handleCloseNotificationDeleteModal = () => {
		setOpenNotificationDeleteModal(false);
		setNotificationToDelete(null);
	};

	// Calendar handlers
	const handleAddEvent = () => {
		dispatch(selectEvent(null));
	};

	const handleEditEvent = (event: any) => {
		dispatch(selectEvent(event._id));
	};

	const handleDeleteEvent = (id: string) => {
		setEventToDelete(id);
		setDeleteEventDialog(true);
	};

	const handleViewEvent = (event: any) => {
		setViewEventDetails(event);
	};

	const handleConfirmDeleteEvent = async () => {
		if (eventToDelete) {
			await dispatch(deleteEvent(eventToDelete));
			setDeleteEventDialog(false);
			setEventToDelete(null);
		}
	};

	const handleCloseEventModal = () => {
		dispatch(toggleModal());
	};

	// Combined view handlers for paginated table
	const handleCombinedEdit = (activity: CombinedActivity) => {
		switch (activity.type) {
			case "movement":
				// Create a Movement object from CombinedActivity
				const movement: Movement = {
					_id: activity._id,
					title: activity.title,
					description: activity.description,
					movement: activity.movement || "",
					time: activity.date,
					dateExpiration: activity.dateExpiration,
					link: activity.link,
					source: activity.source === "pjn" ? "pjn" : activity.source === "mev" ? "mev" : undefined,
					folderId: activity.folderId,
					userId: activity.userId,
					completed: activity.completed,
				};
				handleEditMovement(movement);
				break;
			case "notification":
				// Create a NotificationType object from CombinedActivity
				const notification: NotificationType = {
					_id: activity._id,
					title: activity.title,
					description: activity.description,
					notification: activity.notification || "",
					time: activity.date,
					user: activity.user || "",
					dateExpiration: activity.dateExpiration,
					folderId: activity.folderId,
					userId: activity.userId,
				};
				handleEditNotification(notification);
				break;
			case "event":
				// Create an event object from CombinedActivity
				const event = {
					_id: activity._id,
					title: activity.title,
					description: activity.description,
					start: activity.start || activity.date,
					end: activity.end,
					allDay: activity.allDay,
					type: activity.eventType,
					location: activity.location,
					folderId: activity.folderId,
					userId: activity.userId,
				};
				handleEditEvent(event);
				break;
		}
	};

	const handleCombinedDelete = (activity: CombinedActivity) => {
		switch (activity.type) {
			case "movement":
				handleDeleteMovement(activity._id);
				break;
			case "notification":
				handleDeleteNotification(activity._id);
				break;
			case "event":
				handleDeleteEvent(activity._id);
				break;
		}
	};

	const handleCombinedView = (activity: CombinedActivity) => {
		switch (activity.type) {
			case "movement":
				// Create a Movement object from CombinedActivity
				const movement: Movement = {
					_id: activity._id,
					title: activity.title,
					description: activity.description,
					movement: activity.movement || "",
					time: activity.date,
					dateExpiration: activity.dateExpiration,
					link: activity.link,
					source: activity.source === "pjn" ? "pjn" : activity.source === "mev" ? "mev" : undefined,
					folderId: activity.folderId,
					userId: activity.userId,
					completed: activity.completed,
				};
				handleViewMovement(movement);
				break;
			case "notification":
				// Create a NotificationType object from CombinedActivity
				const notification: NotificationType = {
					_id: activity._id,
					title: activity.title,
					description: activity.description,
					notification: activity.notification || "",
					time: activity.date,
					user: activity.user || "",
					dateExpiration: activity.dateExpiration,
					folderId: activity.folderId,
					userId: activity.userId,
				};
				handleViewNotification(notification);
				break;
			case "event":
				// Create an event object from CombinedActivity
				const event = {
					_id: activity._id,
					title: activity.title,
					description: activity.description,
					start: activity.start || activity.date,
					end: activity.end,
					allDay: activity.allDay,
					type: activity.eventType,
					location: activity.location,
					folderId: activity.folderId,
					userId: activity.userId,
				};
				handleViewEvent(event);
				break;
		}
	};

	const currentTab = tabs.find((tab) => tab.value === activeTab);
	const isLoading =
		(activeTab === "movements" && movementsData.isLoader) ||
		(activeTab === "notifications" && notificationsData.isLoader) ||
		(activeTab === "calendar" && eventsData.isLoader) ||
		(activeTab === "combined" && activitiesData.isLoading);

	// Función para verificar si hay filtros avanzados activos
	const hasActiveFilters = () => {
		return !!(
			filters.startDate ||
			filters.endDate ||
			filters.type ||
			filters.status ||
			filters.user ||
			filters.hasExpiration ||
			filters.allDay ||
			filters.source
		);
	};

	// Función para construir el objeto de filtros basado en el estado actual de filters
	const buildFilterObject = (includeDocumentFilter: boolean) => {
		const filterObj: any = {};

		// Agregar filtro de documento si está activo
		if (includeDocumentFilter) {
			filterObj.hasLink = true;
		}

		// Agregar filtro de tipo de movimiento si existe
		if (filters.type) {
			filterObj.movement = filters.type;
		}

		// Agregar otros filtros según estén disponibles
		// (pueden agregarse más filtros en el futuro)

		// Si no hay ningún filtro, retornar undefined en lugar de objeto vacío
		return Object.keys(filterObj).length > 0 ? filterObj : undefined;
	};

	// Sidebar content
	const sidebarContent = (
		<Box
			sx={{
				width: isMobile ? 280 : 240,
				display: "flex",
				flexDirection: "column",
				height: "100%",
				bgcolor: theme.palette.mode === "dark" ? alpha(theme.palette.background.paper, 0.8) : theme.palette.grey[50],
			}}
		>
			<Box sx={{ p: 2, borderBottom: `1px solid ${theme.palette.divider}` }}>
				<Typography variant="h5" gutterBottom>
					Actividad
				</Typography>
				<Typography variant="caption" color="textSecondary">
					{folderName || "Carpeta"}
				</Typography>
			</Box>

			<Tabs
				orientation="vertical"
				variant="scrollable"
				value={activeTab}
				onChange={handleTabChange}
				sx={{
					flex: 1,
					"& .MuiTabs-indicator": {
						left: 0,
						width: 4,
					},
					"& .MuiTab-root": {
						minHeight: 72,
						justifyContent: "flex-start",
						textAlign: "left",
						alignItems: "flex-start",
						px: 2,
						py: 1.5,
						borderRadius: 0,
						textTransform: "none",
						"&.Mui-selected": {
							bgcolor: alpha(theme.palette.primary.main, 0.08),
							color: theme.palette.primary.main,
						},
						"&:hover": {
							bgcolor: alpha(theme.palette.primary.main, 0.04),
						},
					},
				}}
			>
				{tabs.map((tab) => (
					<Tab
						key={tab.value}
						value={tab.value}
						label={
							<Stack spacing={0.5} alignItems="flex-start" width="100%">
								<Stack direction="row" spacing={1} alignItems="center">
									<Box sx={{ color: tab.color }}>{tab.icon}</Box>
									<Typography variant="subtitle1" fontWeight={500}>
										{tab.label}
									</Typography>
								</Stack>
								<Typography variant="caption" color="textSecondary" sx={{ lineHeight: 1.2 }}>
									{tab.description}
								</Typography>
							</Stack>
						}
					/>
				))}
			</Tabs>

			{/* Stats or Quick Info */}
			<Box sx={{ p: 2, borderTop: `1px solid ${theme.palette.divider}` }}>
				<Typography variant="caption" color="textSecondary">
					Total de registros
				</Typography>
				<Stack spacing={0.5} mt={1}>
					{movementsData.isLoading || notificationsData.isLoading || eventsData.isLoading ? (
						<>
							<Skeleton variant="rectangular" height={24} />
							<Skeleton variant="rectangular" height={24} />
							<Skeleton variant="rectangular" height={24} />
						</>
					) : (
						<>
							<Tooltip
								title={movementsData.pagination ? `Mostrando ${movementsData.movements?.length} de ${movementsData.pagination.total}` : ""}
								arrow
								placement="right"
							>
								<Chip
									size="small"
									label={`${movementsData.pagination?.total || movementsData.movements?.length || 0} movimientos`}
									variant="outlined"
									sx={{ justifyContent: "flex-start", width: "100%" }}
								/>
							</Tooltip>
							<Tooltip
								title={
									notificationsData.pagination
										? `Mostrando ${notificationsData.notifications?.length} de ${notificationsData.pagination.total}`
										: ""
								}
								arrow
								placement="right"
							>
								<Chip
									size="small"
									label={`${notificationsData.pagination?.total || notificationsData.notifications?.length || 0} notificaciones`}
									variant="outlined"
									sx={{ justifyContent: "flex-start", width: "100%" }}
								/>
							</Tooltip>
							<Tooltip
								title={eventsData.pagination ? `Mostrando ${eventsData.events?.length} de ${eventsData.pagination.total}` : ""}
								arrow
								placement="right"
							>
								<Chip
									size="small"
									label={`${eventsData.pagination?.total || eventsData.events?.length || 0} eventos`}
									variant="outlined"
									sx={{ justifyContent: "flex-start", width: "100%" }}
								/>
							</Tooltip>
						</>
					)}
				</Stack>
			</Box>
		</Box>
	);

	return (
		<MainCard
			shadow={3}
			content={false}
			sx={{
				"& .MuiCardContent-root": { p: 0 },
				height: "100%",
				display: "flex",
				flexDirection: "column",
			}}
		>
			<Box sx={{ display: "flex", height: "100%", minHeight: 600 }}>
				{isMobile ? (
					<>
						{/* Mobile Layout */}
						<Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
							{/* Header Toolbar with Menu Button */}
							<Box
								sx={{
									p: 2,
									borderBottom: `1px solid ${theme.palette.divider}`,
									bgcolor: theme.palette.background.paper,
								}}
							>
								<Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
									<Stack direction="row" spacing={2} alignItems="center" flex={1}>
										{/* Menu Button */}
										<IconButton onClick={() => setMobileOpen(true)} sx={{ mr: 1 }}>
											<Menu />
										</IconButton>

										{/* Current Tab Indicator */}
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 1,
												px: 2,
												py: 1,
												borderRadius: 1,
												bgcolor: alpha(currentTab?.color || theme.palette.primary.main, 0.1),
												color: currentTab?.color,
											}}
										>
											{currentTab?.icon}
											<Typography variant="subtitle2" fontWeight={600}>
												{currentTab?.label}
											</Typography>
										</Box>
									</Stack>

									{/* Action Buttons */}
									<Stack direction="row" spacing={1}>
										{activeTab !== "combined" && (
											<Tooltip title={`Agregar ${currentTab?.label.toLowerCase().slice(0, -1)}`}>
												<IconButton
													size="small"
													color="primary"
													onClick={() => {
														if (activeTab === "movements") handleAddMovement();
														else if (activeTab === "notifications") handleAddNotification();
														else if (activeTab === "calendar") handleAddEvent();
													}}
												>
													<Add />
												</IconButton>
											</Tooltip>
										)}
									</Stack>
								</Stack>

								{/* Search Bar - Full width on mobile */}
								<Box sx={{ mt: 2 }}>
									<TextField
										size="small"
										fullWidth
										placeholder={`Buscar en ${currentTab?.label.toLowerCase()}...`}
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<SearchNormal1 size={18} />
												</InputAdornment>
											),
										}}
									/>
								</Box>

								{/* Controles específicos para movimientos */}
								{activeTab === "movements" && (
									<Box
										sx={{
											mt: 2,
											p: 1.5,
											bgcolor: alpha(theme.palette.primary.main, 0.04),
											borderRadius: 1,
											border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
										}}
									>
										<Stack spacing={1.5}>
											<Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
												OPCIONES DE VISUALIZACIÓN
											</Typography>

											{/* Checkbox para filtrar solo movimientos con documento */}
											<FormControlLabel
												control={
													<Checkbox
														checked={filters.onlyWithDocuments}
														onChange={(e) => {
															setFilters({ ...filters, onlyWithDocuments: e.target.checked });
															// Recargar movimientos manteniendo los filtros avanzados activos
															if (id) {
																dispatch(
																	getMovementsByFolderId(id, {
																		page: 1,
																		limit: 10,
																		sort: "-time",
																		filter: buildFilterObject(e.target.checked),
																	}),
																);
															}
														}}
														size="small"
														color="primary"
													/>
												}
												label={
													<Stack direction="row" alignItems="center" spacing={1}>
														<DocumentText size={18} color={theme.palette.primary.main} />
														<Typography variant="body2">
															Solo movimientos con documento
															{movementsData.totalWithLinks > 0 && (
																<Chip size="small" label={movementsData.totalWithLinks} color="primary" sx={{ ml: 1, height: 20 }} />
															)}
														</Typography>
													</Stack>
												}
											/>

											{/* Alerta informativa cuando hay más movimientos disponibles */}
											{filters.onlyWithDocuments &&
												(movementsData.pagination?.totalAvailable ?? 0) > (movementsData.pagination?.total ?? 0) && (
													<Alert
														severity="info"
														sx={{
															mt: 1,
															py: 0.5,
															fontSize: "0.75rem",
															"& .MuiAlert-message": {
																py: 0.5,
															},
														}}
													>
														<Typography variant="caption">
															Mostrando {movementsData.pagination.total || 0} de {movementsData.pagination.totalAvailable} movimientos
															totales.{" "}
															<Typography
																component="span"
																variant="caption"
																sx={{
																	color: "info.main",
																	cursor: "pointer",
																	textDecoration: "underline",
																	fontWeight: 600,
																}}
																onClick={() => {
																	setFilters({ ...filters, onlyWithDocuments: false });
																	if (id) {
																		dispatch(
																			getMovementsByFolderId(id, {
																				page: 1,
																				limit: 10,
																				sort: "-time",
																				filter: buildFilterObject(false),
																			}),
																		);
																	}
																}}
															>
																Ver todos
															</Typography>
														</Typography>
													</Alert>
												)}

											<Divider sx={{ my: 1 }} />

											{/* Botón para navegación secuencial de documentos */}
											<Button
												variant="contained"
												size="small"
												fullWidth
												startIcon={<Gallery size={18} />}
												onClick={() => {
													const movementsWithLinks = movementsData.movements.filter((m: Movement) => m.link);
													if (movementsWithLinks.length > 0) {
														setCurrentDocumentMovement(movementsWithLinks[0]);
														setDocumentNavigationOpen(true);
													}
												}}
												disabled={!movementsData.totalWithLinks || movementsData.totalWithLinks === 0}
												sx={{
													bgcolor: theme.palette.primary.main,
													color: "white",
													"&:hover": {
														bgcolor: theme.palette.primary.dark,
													},
													"&.Mui-disabled": {
														bgcolor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)",
														color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.26)",
														opacity: 1,
													},
												}}
											>
												Expediente digital
												{movementsData.totalWithLinks > 0 && ` (${movementsData.totalWithLinks})`}
											</Button>
										</Stack>
									</Box>
								)}

								{/* Filters Section (Collapsible) */}
								<Collapse in={showFilters} timeout="auto" unmountOnExit>
									<Fade in={showFilters} timeout={350}>
										<Box
											sx={{
												mt: 2,
												p: 2,
												bgcolor: theme.palette.grey[50],
												borderRadius: 1,
												border: `1px solid ${theme.palette.divider}`,
												transition: "all 0.3s ease-in-out",
											}}
										>
											<ActivityFilters activeTab={activeTab} filters={filters} onFiltersChange={setFilters} />
										</Box>
									</Fade>
								</Collapse>
							</Box>

							{/* Table Content Area */}
							<Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
								{isLoading ? (
									<Stack spacing={2}>
										<Skeleton variant="rectangular" height={60} />
										<Skeleton variant="rectangular" height={400} />
									</Stack>
								) : (
									<Box>
										{/* Scraping Progress Banner - solo para movements */}
										{activeTab === "movements" && scrapingProgress && !scrapingBannerClosed && (
											<Box sx={{ mb: 2 }}>
												<ScrapingProgressBanner
													scrapingProgress={scrapingProgress}
													source={scrapingSource}
													onRefresh={handleRefreshMovements}
													onClose={handleCloseBanner}
												/>
											</Box>
										)}

										<Paper elevation={0} sx={{ height: "100%", border: `1px solid ${theme.palette.divider}` }}>
											{activeTab === "movements" && (
												<MovementsTable
													movements={movementsData.movements}
													searchQuery={searchQuery}
													onEdit={handleEditMovement}
													onDelete={handleDeleteMovement}
													onView={handleViewMovement}
													filters={filters}
													pagination={movementsData.pagination}
													isLoading={movementsData.isLoading}
													totalWithLinks={movementsData.totalWithLinks}
													documentsBeforeThisPage={movementsData.documentsBeforeThisPage}
													documentsInThisPage={movementsData.documentsInThisPage}
													pjnAccess={movementsData.pjnAccess}
												/>
											)}
											{activeTab === "notifications" && (
												<NotificationsTable
													notifications={notificationsData.notifications}
													searchQuery={searchQuery}
													onEdit={handleEditNotification}
													onDelete={handleDeleteNotification}
													onView={handleViewNotification}
												/>
											)}
											{activeTab === "calendar" && (
												<CalendarTable
													events={eventsData.events}
													searchQuery={searchQuery}
													onEdit={handleEditEvent}
													onDelete={handleDeleteEvent}
													onView={handleViewEvent}
												/>
											)}
											{activeTab === "combined" && (
												<CombinedTablePaginated
													activities={activitiesData.activities || []}
													searchQuery={searchQuery}
													onEdit={handleCombinedEdit}
													onDelete={handleCombinedDelete}
													onView={handleCombinedView}
													filters={filters}
													pagination={activitiesData.pagination}
													isLoading={activitiesData.isLoading}
													stats={activitiesData.stats}
													pjnAccess={activitiesData.pjnAccess}
												/>
											)}
										</Paper>
									</Box>
								)}
							</Box>
						</Box>

						{/* Mobile Drawer */}
						<Drawer
							anchor="left"
							open={mobileOpen}
							onClose={() => setMobileOpen(false)}
							ModalProps={{
								keepMounted: true,
							}}
						>
							{sidebarContent}
						</Drawer>
					</>
				) : (
					<>
						{/* Desktop Layout */}
						<Paper
							elevation={0}
							sx={{
								borderRight: `1px solid ${theme.palette.divider}`,
							}}
						>
							{sidebarContent}
						</Paper>

						{/* Main Content Area */}
						<Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
							{/* Header Toolbar */}
							<Box
								sx={{
									p: 2,
									borderBottom: `1px solid ${theme.palette.divider}`,
									bgcolor: theme.palette.background.paper,
								}}
							>
								<Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
									<Stack direction="row" spacing={2} alignItems="center" flex={1}>
										{/* Current Tab Indicator */}
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												gap: 1,
												px: 2,
												py: 1,
												borderRadius: 1,
												bgcolor: alpha(currentTab?.color || theme.palette.primary.main, 0.1),
												color: currentTab?.color,
											}}
										>
											{currentTab?.icon}
											<Typography variant="subtitle2" fontWeight={600}>
												{currentTab?.label}
											</Typography>
										</Box>

										{/* Search Bar */}
										<TextField
											size="small"
											placeholder={`Buscar en ${currentTab?.label.toLowerCase()}...`}
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											sx={{ minWidth: 300 }}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<SearchNormal1 size={18} />
													</InputAdornment>
												),
											}}
										/>
									</Stack>

									{/* Action Buttons */}
									<Stack direction="row" spacing={1}>
										<Tooltip title="Exportar">
											<IconButton size="small" onClick={handleExport}>
												<ExportSquare />
											</IconButton>
										</Tooltip>
										{activeTab !== "combined" && (
											<Tooltip title={`Agregar ${currentTab?.label.toLowerCase().slice(0, -1)}`}>
												<IconButton
													size="small"
													color="primary"
													onClick={() => {
														if (activeTab === "movements") handleAddMovement();
														else if (activeTab === "notifications") handleAddNotification();
														else if (activeTab === "calendar") handleAddEvent();
													}}
												>
													<Add />
												</IconButton>
											</Tooltip>
										)}
									</Stack>
								</Stack>

								{/* Controles específicos para movimientos - Desktop */}
								{activeTab === "movements" ? (
									<Box
										sx={{
											mt: 2,
											p: 1.5,
											bgcolor: alpha(theme.palette.primary.main, 0.04),
											borderRadius: 1,
											border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
										}}
									>
										<Stack spacing={1.5}>
											<Stack direction="row" justifyContent="space-between" alignItems="center">
												<Typography variant="caption" sx={{ fontWeight: 600, color: theme.palette.primary.main }}>
													OPCIONES DE VISUALIZACIÓN
												</Typography>
												<Tooltip title={showFilters ? "Ocultar filtros avanzados" : "Mostrar filtros avanzados"}>
													<Badge
														color="primary"
														variant="dot"
														invisible={!hasActiveFilters()}
														sx={{
															"& .MuiBadge-dot": {
																right: 2,
																top: 2,
															},
														}}
													>
														<IconButton
															size="small"
															onClick={() => setShowFilters(!showFilters)}
															color={showFilters ? "primary" : hasActiveFilters() ? "primary" : "default"}
															sx={{
																transition: "all 0.3s ease",
																transform: showFilters ? "rotate(180deg)" : "rotate(0deg)",
															}}
														>
															<Filter size={18} />
														</IconButton>
													</Badge>
												</Tooltip>
											</Stack>

											<Stack direction="row" spacing={3} alignItems="center">
												{/* Checkbox para filtrar solo movimientos con documento */}
												<FormControlLabel
													control={
														<Checkbox
															checked={filters.onlyWithDocuments}
															onChange={(e) => {
																setFilters({ ...filters, onlyWithDocuments: e.target.checked });
																// Recargar movimientos manteniendo los filtros avanzados activos
																if (id) {
																	dispatch(
																		getMovementsByFolderId(id, {
																			page: 1,
																			limit: 10,
																			sort: "-time",
																			filter: buildFilterObject(e.target.checked),
																		}),
																	);
																}
															}}
															size="small"
															color="primary"
														/>
													}
													label={
														<Stack direction="row" alignItems="center" spacing={1}>
															<DocumentText size={18} color={theme.palette.primary.main} />
															<Typography variant="body2">
																Solo con documento
																{movementsData.totalWithLinks > 0 && (
																	<Chip size="small" label={movementsData.totalWithLinks} color="primary" sx={{ ml: 1, height: 20 }} />
																)}
															</Typography>
														</Stack>
													}
												/>

												<Divider orientation="vertical" flexItem />

												{/* Botón para navegación secuencial de documentos */}
												<Button
													variant="contained"
													size="small"
													startIcon={<Gallery size={18} />}
													onClick={() => {
														const movementsWithLinks = movementsData.movements.filter((m: Movement) => m.link);
														if (movementsWithLinks.length > 0) {
															setCurrentDocumentMovement(movementsWithLinks[0]);
															setDocumentNavigationOpen(true);
														}
													}}
													disabled={!movementsData.totalWithLinks || movementsData.totalWithLinks === 0}
													sx={{
														bgcolor: theme.palette.primary.main,
														color: "white",
														"&:hover": {
															bgcolor: theme.palette.primary.dark,
														},
														"&.Mui-disabled": {
															bgcolor: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.12)" : "rgba(0, 0, 0, 0.12)",
															color: theme.palette.mode === "dark" ? "rgba(255, 255, 255, 0.3)" : "rgba(0, 0, 0, 0.26)",
															opacity: 1,
														},
													}}
												>
													Expediente digital
													{movementsData.totalWithLinks > 0 && ` (${movementsData.totalWithLinks})`}
												</Button>
											</Stack>

											{/* Alerta informativa cuando hay más movimientos disponibles */}
											{filters.onlyWithDocuments &&
												(movementsData.pagination?.totalAvailable ?? 0) > (movementsData.pagination?.total ?? 0) && (
													<Alert
														severity="info"
														sx={{
															py: 0.5,
															fontSize: "0.75rem",
															"& .MuiAlert-message": {
																py: 0.5,
															},
														}}
													>
														<Typography variant="caption">
															Mostrando {movementsData.pagination.total || 0} de {movementsData.pagination.totalAvailable} movimientos
															totales.{" "}
															<Typography
																component="span"
																variant="caption"
																sx={{
																	color: "info.main",
																	cursor: "pointer",
																	textDecoration: "underline",
																	fontWeight: 600,
																}}
																onClick={() => {
																	setFilters({ ...filters, onlyWithDocuments: false });
																	if (id) {
																		dispatch(
																			getMovementsByFolderId(id, {
																				page: 1,
																				limit: 10,
																				sort: "-time",
																				filter: buildFilterObject(false),
																			}),
																		);
																	}
																}}
															>
																Ver todos
															</Typography>
														</Typography>
													</Alert>
												)}

											{/* Filtros avanzados - Collapsible */}
											<Collapse in={showFilters} timeout="auto" unmountOnExit>
												<Box sx={{ pt: 1.5 }}>
													<Divider sx={{ mb: 1.5 }} />
													<ActivityFilters activeTab={activeTab} filters={filters} onFiltersChange={setFilters} />
												</Box>
											</Collapse>
										</Stack>
									</Box>
								) : (
									/* Filtros para otras pestañas */
									<>
										<Box sx={{ mt: 2, display: "flex", justifyContent: "flex-end" }}>
											<Tooltip title={showFilters ? "Ocultar filtros" : "Mostrar filtros"}>
												<Badge
													color="primary"
													variant="dot"
													invisible={!hasActiveFilters()}
													sx={{
														"& .MuiBadge-dot": {
															right: 2,
															top: 2,
														},
													}}
												>
													<IconButton
														size="small"
														onClick={() => setShowFilters(!showFilters)}
														color={showFilters ? "primary" : hasActiveFilters() ? "primary" : "default"}
														sx={{
															transition: "all 0.3s ease",
															transform: showFilters ? "rotate(180deg)" : "rotate(0deg)",
														}}
													>
														<Filter />
													</IconButton>
												</Badge>
											</Tooltip>
										</Box>
										<Collapse in={showFilters} timeout="auto" unmountOnExit>
											<Fade in={showFilters} timeout={350}>
												<Box
													sx={{
														mt: 2,
														p: 2,
														bgcolor: theme.palette.grey[50],
														borderRadius: 1,
														border: `1px solid ${theme.palette.divider}`,
														transition: "all 0.3s ease-in-out",
													}}
												>
													<ActivityFilters activeTab={activeTab} filters={filters} onFiltersChange={setFilters} />
												</Box>
											</Fade>
										</Collapse>
									</>
								)}
							</Box>

							{/* Table Content Area */}
							<Box sx={{ flex: 1, overflow: "auto", p: 2 }}>
								{isLoading ? (
									<Stack spacing={2}>
										<Skeleton variant="rectangular" height={60} />
										<Skeleton variant="rectangular" height={400} />
									</Stack>
								) : (
									<Box>
										{/* Scraping Progress Banner - solo para movements */}
										{activeTab === "movements" && scrapingProgress && !scrapingBannerClosed && (
											<Box sx={{ mb: 2 }}>
												<ScrapingProgressBanner
													scrapingProgress={scrapingProgress}
													source={scrapingSource}
													onRefresh={handleRefreshMovements}
													onClose={handleCloseBanner}
												/>
											</Box>
										)}

										<Paper elevation={0} sx={{ height: "100%", border: `1px solid ${theme.palette.divider}` }}>
											{activeTab === "movements" && (
												<MovementsTable
													movements={movementsData.movements}
													searchQuery={searchQuery}
													onEdit={handleEditMovement}
													onDelete={handleDeleteMovement}
													onView={handleViewMovement}
													filters={filters}
													pagination={movementsData.pagination}
													isLoading={movementsData.isLoading}
													totalWithLinks={movementsData.totalWithLinks}
													documentsBeforeThisPage={movementsData.documentsBeforeThisPage}
													documentsInThisPage={movementsData.documentsInThisPage}
													pjnAccess={movementsData.pjnAccess}
												/>
											)}
											{activeTab === "notifications" && (
												<NotificationsTable
													notifications={notificationsData.notifications}
													searchQuery={searchQuery}
													onEdit={handleEditNotification}
													onDelete={handleDeleteNotification}
													onView={handleViewNotification}
												/>
											)}
											{activeTab === "calendar" && (
												<CalendarTable
													events={eventsData.events}
													searchQuery={searchQuery}
													onEdit={handleEditEvent}
													onDelete={handleDeleteEvent}
													onView={handleViewEvent}
												/>
											)}
											{activeTab === "combined" && (
												<CombinedTablePaginated
													activities={activitiesData.activities || []}
													searchQuery={searchQuery}
													onEdit={handleCombinedEdit}
													onDelete={handleCombinedDelete}
													onView={handleCombinedView}
													filters={filters}
													pagination={activitiesData.pagination}
													isLoading={activitiesData.isLoading}
													stats={activitiesData.stats}
													pjnAccess={activitiesData.pjnAccess}
												/>
											)}
										</Paper>
									</Box>
								)}
							</Box>
						</Box>
					</>
				)}
			</Box>

			{/* Modals */}
			<ModalMovements
				open={openMovementModal}
				setOpen={handleCloseMovementModal}
				folderId={id}
				editMode={!!selectedMovement}
				movementData={selectedMovement}
				folderName={folderName || ""}
			/>

			<AlertMemberDelete title="¿Eliminar movimiento?" open={openDeleteModal} handleClose={handleCloseDeleteModal} id={movementToDelete} />

			{/* Notifications Modals */}
			<ModalNotifications
				open={openNotificationModal}
				setOpen={handleCloseNotificationModal}
				folderId={id}
				editMode={!!selectedNotification}
				notificationData={selectedNotification}
				folderName={folderName}
			/>

			<AlertNotificationDelete
				title="¿Eliminar notificación?"
				open={openNotificationDeleteModal}
				handleClose={handleCloseNotificationDeleteModal}
				id={notificationToDelete}
			/>

			{/* View Movement Details Dialog */}
			{viewMovementDetails && (
				<Dialog
					maxWidth="sm"
					open={!!viewMovementDetails}
					onClose={() => setViewMovementDetails(null)}
					TransitionComponent={PopupTransition}
					PaperProps={{
						sx: {
							width: "600px",
							maxWidth: "600px",
							p: 0,
							borderRadius: 2,
							boxShadow: `0 2px 10px -2px ${theme.palette.divider}`,
							display: "flex",
							flexDirection: "column",
							maxHeight: { xs: "90vh", sm: "85vh" },
						},
					}}
					sx={{
						"& .MuiBackdrop-root": {
							opacity: "0.5 !important",
						},
					}}
				>
					{/* Dialog Title - Fixed */}
					<Box
						sx={{
							bgcolor: theme.palette.primary.lighter,
							p: 3,
							borderBottom: `1px solid ${theme.palette.divider}`,
							flexShrink: 0,
						}}
					>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Stack direction="row" alignItems="center" spacing={1}>
								<TableDocument size={24} color={theme.palette.primary.main} />
								<Typography
									variant="h5"
									sx={{
										color: theme.palette.primary.main,
										fontWeight: 600,
									}}
								>
									Detalles del Movimiento
								</Typography>
							</Stack>
							<Typography
								color="textSecondary"
								variant="subtitle2"
								sx={{
									maxWidth: "30%",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
								}}
							>
								Carpeta: {folderName}
							</Typography>
						</Stack>
					</Box>

					<Divider />

					{/* Dialog Content - Scrollable */}
					<Box
						sx={{
							p: 3,
							overflowY: "auto",
							flex: 1,
						}}
					>
						<Stack spacing={2.5}>
							{/* Título */}
							<Box>
								<Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5, fontSize: "0.875rem" }}>
									Título
								</Typography>
								<Box
									sx={{
										p: 1.5,
										bgcolor: theme.palette.grey[50],
										borderRadius: 1,
										border: `1px solid ${theme.palette.divider}`,
									}}
								>
									<Typography variant="body1">{viewMovementDetails.title}</Typography>
								</Box>
							</Box>

							{/* Tipo de Movimiento */}
							<Box>
								<Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5, fontSize: "0.875rem" }}>
									Tipo de Movimiento
								</Typography>
								<Box
									sx={{
										p: 1.5,
										bgcolor: theme.palette.grey[50],
										borderRadius: 1,
										border: `1px solid ${theme.palette.divider}`,
									}}
								>
									<Chip
										label={viewMovementDetails.movement}
										size="small"
										variant="outlined"
										color={
											viewMovementDetails.movement === "Escrito-Actor"
												? "success"
												: viewMovementDetails.movement === "Escrito-Demandado"
												? "error"
												: viewMovementDetails.movement === "Despacho"
												? "secondary"
												: viewMovementDetails.movement === "Cédula" || viewMovementDetails.movement === "Oficio"
												? "primary"
												: viewMovementDetails.movement === "Evento"
												? "warning"
												: "default"
										}
									/>
								</Box>
							</Box>

							{/* Fecha de Dictado */}
							<Box>
								<Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5, fontSize: "0.875rem" }}>
									Fecha de Dictado
								</Typography>
								<Box
									sx={{
										p: 1.5,
										bgcolor: theme.palette.grey[50],
										borderRadius: 1,
										border: `1px solid ${theme.palette.divider}`,
										display: "flex",
										alignItems: "center",
										gap: 1,
									}}
								>
									<Calendar size={16} color={theme.palette.text.secondary} />
									<Typography variant="body1">{formatDate(viewMovementDetails.time)}</Typography>
								</Box>
							</Box>

							{/* Fecha de Vencimiento */}
							{viewMovementDetails.dateExpiration && (
								<Box>
									<Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5, fontSize: "0.875rem" }}>
										Fecha de Vencimiento
									</Typography>
									<Box
										sx={{
											p: 1.5,
											bgcolor: theme.palette.grey[50],
											borderRadius: 1,
											border: `1px solid ${theme.palette.divider}`,
											display: "flex",
											alignItems: "center",
											gap: 1,
										}}
									>
										<Calendar size={16} color={theme.palette.text.secondary} />
										<Typography variant="body1">{formatDate(viewMovementDetails.dateExpiration)}</Typography>
									</Box>
								</Box>
							)}

							{/* Estado de Completitud */}
							{viewMovementDetails.completed !== undefined && viewMovementDetails.completed !== null && (
								<Box>
									<Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5, fontSize: "0.875rem" }}>
										Estado
									</Typography>
									<Box
										sx={{
											p: 1.5,
											bgcolor: theme.palette.grey[50],
											borderRadius: 1,
											border: `1px solid ${theme.palette.divider}`,
											display: "flex",
											alignItems: "center",
											gap: 1,
										}}
									>
										<TickCircle
											size={20}
											variant={viewMovementDetails.completed ? "Bold" : "Linear"}
											color={viewMovementDetails.completed ? theme.palette.success.main : theme.palette.text.secondary}
										/>
										<Typography
											variant="body1"
											sx={{
												color: viewMovementDetails.completed ? theme.palette.success.main : theme.palette.text.primary,
												fontWeight: viewMovementDetails.completed ? 500 : 400,
											}}
										>
											{viewMovementDetails.completed ? "Completado" : "Pendiente"}
										</Typography>
									</Box>
								</Box>
							)}

							{/* Descripción */}
							{viewMovementDetails.description && (
								<Box>
									<Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5, fontSize: "0.875rem" }}>
										Descripción
									</Typography>
									<Box
										sx={{
											p: 1.5,
											bgcolor: theme.palette.grey[50],
											borderRadius: 1,
											border: `1px solid ${theme.palette.divider}`,
										}}
									>
										<Typography variant="body1" sx={{ whiteSpace: "pre-wrap" }}>
											{viewMovementDetails.description}
										</Typography>
									</Box>
								</Box>
							)}

							{/* Link */}
							{viewMovementDetails.link && (
								<Box>
									<Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5, fontSize: "0.875rem" }}>
										Documento
									</Typography>
									<Box
										sx={{
											p: 1.5,
											bgcolor: theme.palette.grey[50],
											borderRadius: 1,
											border: `1px solid ${theme.palette.divider}`,
											display: "flex",
											alignItems: "center",
											gap: 1,
										}}
									>
										<Link21 size={16} color={theme.palette.primary.main} />
										<Typography
											variant="body2"
											sx={{
												color: theme.palette.primary.main,
												textDecoration: "underline",
												cursor: "pointer",
												wordBreak: "break-all",
											}}
											onClick={() => {
												setPdfUrlFromDetails(viewMovementDetails.link || "");
												setPdfTitleFromDetails(viewMovementDetails.title || "Documento");
												setPdfViewerFromDetailsOpen(true);
											}}
										>
											Ver documento adjunto
										</Typography>
									</Box>
								</Box>
							)}

							{/* Origen */}
							{viewMovementDetails.source === "pjn" && (
								<Box>
									<Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5, fontSize: "0.875rem" }}>
										Origen
									</Typography>
									<Box
										sx={{
											p: 1.5,
											bgcolor: theme.palette.info.lighter,
											borderRadius: 1,
											border: `1px solid ${theme.palette.info.light}`,
										}}
									>
										<Typography variant="body2" sx={{ fontStyle: "italic", color: theme.palette.info.dark }}>
											Sincronizado desde Poder Judicial de la Nación (PJN)
										</Typography>
									</Box>
								</Box>
							)}
							{viewMovementDetails.source === "mev" && (
								<Box>
									<Typography variant="subtitle2" color="textSecondary" sx={{ mb: 0.5, fontSize: "0.875rem" }}>
										Origen
									</Typography>
									<Box
										sx={{
											p: 1.5,
											bgcolor: theme.palette.info.lighter,
											borderRadius: 1,
											border: `1px solid ${theme.palette.info.light}`,
										}}
									>
										<Typography variant="body2" sx={{ fontStyle: "italic", color: theme.palette.info.dark }}>
											Sincronizado desde Poder Judicial de la provincia de Buenos Aires (MEV)
										</Typography>
									</Box>
								</Box>
							)}
						</Stack>
					</Box>

					<Divider />

					{/* Dialog Actions - Fixed */}
					<Box
						sx={{
							p: 2,
							display: "flex",
							justifyContent: "flex-end",
							bgcolor: theme.palette.grey[50],
							flexShrink: 0,
						}}
					>
						<Button onClick={() => setViewMovementDetails(null)} variant="contained" color="primary">
							Cerrar
						</Button>
					</Box>
				</Dialog>
			)}

			{/* View Notification Details Dialog */}
			{viewNotificationDetails && (
				<Dialog
					maxWidth="sm"
					fullWidth
					open={!!viewNotificationDetails}
					onClose={() => setViewNotificationDetails(null)}
					TransitionComponent={PopupTransition}
				>
					<Box sx={{ p: 3 }}>
						<Typography variant="h5" gutterBottom>
							Detalles de la Notificación
						</Typography>
						<Stack spacing={2} sx={{ mt: 2 }}>
							<Box>
								<Typography variant="subtitle2" color="textSecondary">
									Título
								</Typography>
								<Typography variant="body1">{viewNotificationDetails.title}</Typography>
							</Box>
							<Box>
								<Typography variant="subtitle2" color="textSecondary">
									Tipo
								</Typography>
								<Typography variant="body1">{viewNotificationDetails.notification}</Typography>
							</Box>
							<Box>
								<Typography variant="subtitle2" color="textSecondary">
									Usuario
								</Typography>
								<Typography variant="body1">{viewNotificationDetails.user || "-"}</Typography>
							</Box>
							<Box>
								<Typography variant="subtitle2" color="textSecondary">
									Fecha
								</Typography>
								<Typography variant="body1">{formatDate(viewNotificationDetails.time)}</Typography>
							</Box>
							{viewNotificationDetails.description && (
								<Box>
									<Typography variant="subtitle2" color="textSecondary">
										Descripción
									</Typography>
									<Typography variant="body1">{viewNotificationDetails.description}</Typography>
								</Box>
							)}
							{viewNotificationDetails.dateExpiration && (
								<Box>
									<Typography variant="subtitle2" color="textSecondary">
										Fecha de Vencimiento
									</Typography>
									<Typography variant="body1">{formatDate(viewNotificationDetails.dateExpiration)}</Typography>
								</Box>
							)}
						</Stack>
						<Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
							<Button onClick={() => setViewNotificationDetails(null)}>Cerrar</Button>
						</Box>
					</Box>
				</Dialog>
			)}

			{/* Calendar Event Modal */}
			<Dialog
				maxWidth="sm"
				TransitionComponent={PopupTransition}
				keepMounted
				fullWidth
				onClose={handleCloseEventModal}
				open={calendarState.isModalOpen}
				sx={{ "& .MuiDialog-paper": { p: 0 }, transition: "transform 225ms" }}
			>
				<AddEventFrom
					event={eventsData.events.find((e: any) => e._id === eventsData.selectedEventId)}
					range={calendarState.selectedRange}
					onCancel={handleCloseEventModal}
					userId={userId}
					folderId={id}
					folderName={folderName || ""}
				/>
			</Dialog>

			{/* Delete Event Dialog */}
			<Dialog open={deleteEventDialog} onClose={() => setDeleteEventDialog(false)} TransitionComponent={PopupTransition}>
				<Box sx={{ p: 3 }}>
					<Typography variant="h5" gutterBottom>
						¿Eliminar evento?
					</Typography>
					<Typography variant="body1" sx={{ mt: 2 }}>
						¿Está seguro que desea eliminar este evento? Esta acción no se puede deshacer.
					</Typography>
					<Stack direction="row" spacing={2} sx={{ mt: 3, justifyContent: "flex-end" }}>
						<Button onClick={() => setDeleteEventDialog(false)} color="secondary">
							Cancelar
						</Button>
						<Button onClick={handleConfirmDeleteEvent} color="error" variant="contained">
							Eliminar
						</Button>
					</Stack>
				</Box>
			</Dialog>

			{/* View Event Details Dialog */}
			{viewEventDetails && (
				<Dialog
					maxWidth="sm"
					fullWidth
					open={!!viewEventDetails}
					onClose={() => setViewEventDetails(null)}
					TransitionComponent={PopupTransition}
				>
					<Box sx={{ p: 3 }}>
						<Typography variant="h5" gutterBottom>
							Detalles del Evento
						</Typography>
						<Stack spacing={2} sx={{ mt: 2 }}>
							<Box>
								<Typography variant="subtitle2" color="textSecondary">
									Título
								</Typography>
								<Typography variant="body1">{viewEventDetails.title}</Typography>
							</Box>
							<Box>
								<Typography variant="subtitle2" color="textSecondary">
									Tipo
								</Typography>
								<Typography variant="body1">{viewEventDetails.type || "General"}</Typography>
							</Box>
							<Box>
								<Typography variant="subtitle2" color="textSecondary">
									Fecha de inicio
								</Typography>
								<Typography variant="body1">
									{viewEventDetails.start ? dayjs(viewEventDetails.start).format("DD/MM/YYYY HH:mm") : "-"}
								</Typography>
							</Box>
							{viewEventDetails.end && (
								<Box>
									<Typography variant="subtitle2" color="textSecondary">
										Fecha de fin
									</Typography>
									<Typography variant="body1">{dayjs(viewEventDetails.end).format("DD/MM/YYYY HH:mm")}</Typography>
								</Box>
							)}
							{viewEventDetails.description && (
								<Box>
									<Typography variant="subtitle2" color="textSecondary">
										Descripción
									</Typography>
									<Typography variant="body1">{viewEventDetails.description}</Typography>
								</Box>
							)}
							{viewEventDetails.allDay && <Chip label="Evento de todo el día" color="info" variant="outlined" />}
						</Stack>
						<Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
							<Button onClick={() => setViewEventDetails(null)}>Cerrar</Button>
						</Box>
					</Box>
				</Dialog>
			)}

			{/* Modal para navegación de documentos */}
			{documentNavigationOpen &&
				(() => {
					const movementsWithLinks = movementsData.movements.filter((m: Movement) => m.link);
					const movementToShow = currentDocumentMovement || movementsWithLinks[0];

					return movementToShow ? (
						<PDFViewer
							open={documentNavigationOpen}
							onClose={() => {
								setDocumentNavigationOpen(false);
								setCurrentDocumentMovement(null);
							}}
							url={movementToShow.link}
							title={movementToShow.title || "Documento"}
							movements={movementsWithLinks}
							currentMovementId={movementToShow._id}
							totalWithLinks={movementsData.totalWithLinks}
							documentsBeforeThisPage={movementsData.documentsBeforeThisPage || 0}
							documentsInThisPage={movementsData.documentsInThisPage}
							hasNextPage={movementsData.pagination?.hasNext}
							hasPreviousPage={movementsData.pagination?.hasPrev}
							isLoadingMore={movementsData.isLoading}
							onNavigate={(movement: Movement) => {
								// Actualizar el movimiento actual para cambiar la URL
								setCurrentDocumentMovement(movement);
							}}
							onRequestNextPage={async () => {
								if (id && movementsData.pagination?.hasNext) {
									await dispatch(
										getMovementsByFolderId(id, {
											page: (movementsData.pagination.page || 1) + 1,
											limit: 10,
											sort: "-time",
											filter: { hasLink: true }, // Siempre filtrar por documentos en navegación
										}),
									);
								}
							}}
							onRequestPreviousPage={async () => {
								if (id && movementsData.pagination?.hasPrev) {
									await dispatch(
										getMovementsByFolderId(id, {
											page: (movementsData.pagination.page || 1) - 1,
											limit: 10,
											sort: "-time",
											filter: { hasLink: true }, // Siempre filtrar por documentos en navegación
										}),
									);
								}
							}}
						/>
					) : null;
				})()}

			{/* PDFViewer desde modal de detalles */}
			<PDFViewer
				open={pdfViewerFromDetailsOpen}
				onClose={() => {
					setPdfViewerFromDetailsOpen(false);
					setPdfUrlFromDetails("");
					setPdfTitleFromDetails("");
				}}
				url={pdfUrlFromDetails}
				title={pdfTitleFromDetails}
			/>
		</MainCard>
	);
};

export default ActivityTables;

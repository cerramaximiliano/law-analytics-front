import React, { useState, useEffect, useRef } from "react";
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
	FormControlLabel,
	Checkbox,
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
import { useSearchParams } from "react-router-dom";
import { useSelector, dispatch } from "store";
import { getMovementsByFolderId } from "store/reducers/movements";
import { getNotificationsByFolderId } from "store/reducers/notifications";
import { getEventsById } from "store/reducers/events";
import { getCombinedActivities } from "store/reducers/activities";
import MovementsTable from "./tables/MovementsTable";
import PjnMovementsViewerSection from "./PjnMovementsViewerSection";
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
import { openSnackbar } from "store/reducers/snackbar";
import ActivityFilters from "./filters/ActivityFilters";
import { exportActivityData } from "./utils/exportUtils";
import PDFViewer from "components/shared/PDFViewer";
import DocumentExplorer from "components/shared/DocumentExplorer";
import ScrapingProgressBanner from "./ScrapingProgressBanner";
import FolderSyncStatus from "./FolderSyncStatus";
import SyncPendingEmptyState from "./SyncPendingEmptyState";
import { useScrapingProgress } from "hooks/useScrapingProgress";
import { useTeam } from "contexts/TeamContext";
import { toggleMovementComplete } from "store/reducers/movements";
import ModalTasks from "../modals/MoldalTasks";
import ModalNotes from "../modals/ModalNotes";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

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
	const isDark = theme.palette.mode === "dark";
	const isMobile = useMediaQuery(theme.breakpoints.down("md"));
	const { id } = useParams<{ id: string }>();
	const [searchParams] = useSearchParams();
	// Deep-link a un movimiento puntual (?movement=<id>, desde la vista pública /m/:token).
	const highlightMovementId = searchParams.get("movement");
	const { canCreate } = useTeam();
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

	// Estado para ScrapingProgressBanner (MEV)
	const [scrapingBannerClosed, setScrapingBannerClosed] = useState(false);
	// Document Explorer (overlay) states
	const [explorerOpen, setExplorerOpen] = useState(false);
	const [explorerMovement, setExplorerMovement] = useState<Movement | null>(null);

	// Quick action modals from DocumentPanel
	const [panelTaskModalOpen, setPanelTaskModalOpen] = useState(false);
	const [panelTaskInitialValues, setPanelTaskInitialValues] = useState<any>(undefined);
	const [panelNoteModalOpen, setPanelNoteModalOpen] = useState(false);
	const [panelNoteInitialValues, setPanelNoteInitialValues] = useState<any>(undefined);

	// Selectors
	const movementsData = useSelector((state: any) => state.movements);
	const notificationsData = useSelector((state: any) => state.notifications);
	const eventsData = useSelector((state: any) => state.events);
	const activitiesData = useSelector((state: any) => state.activities);
	const calendarState = useSelector((state: any) => state.calendar);
	const auth = useSelector((state: any) => state.auth);
	const userId = auth.user?._id;

	// Hook personalizado para gestionar scrapingProgress con transición suave (MEV)
	const { scrapingProgress } = useScrapingProgress(movementsData.scrapingProgress, id);

	// Detectar origen del scraping por la presencia del *Access correspondiente
	// (el server solo devuelve scbaAccess/pjnAccess/ejeAccess cuando el folder es de ese tipo).
	const scrapingSource: "mev" | "pjn" | "scba" | "eje" = movementsData.scbaAccess
		? "scba"
		: movementsData.pjnAccess
			? "pjn"
			: movementsData.ejeAccess
				? "eje"
				: "mev";

	// En EJE el parser resuelve adjuntos via API pública del portal, pero
	// solo una minoría de movimientos tiene PDF asociado (en muchas causas
	// directamente ninguno). Si totalWithLinks llega en 0 con el filtro
	// "Solo con documento" activo, dejaríamos al user con una tabla vacía
	// sin pista de qué hay. Apagamos el filtro automáticamente solo en
	// ese caso — si hay al menos un adjunto, dejamos el default ON.
	const ejeAutoDisabledRef = useRef(false);
	useEffect(() => {
		if (
			!ejeAutoDisabledRef.current &&
			movementsData.ejeAccess &&
			filters.onlyWithDocuments &&
			movementsData.totalWithLinks === 0 &&
			!movementsData.isLoading
		) {
			ejeAutoDisabledRef.current = true;
			setFilters((prev: any) => ({ ...prev, onlyWithDocuments: false }));
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [movementsData.ejeAccess, movementsData.totalWithLinks, movementsData.isLoading]);

	// SCBA recién vinculado pero todavía sin primer scrap: el worker SCBA corre
	// cada ~5min y hasta que termine no hay movimientos ni causaLastSyncDate.
	// En esa ventana mostramos un empty state contextual en lugar de tabla vacía.
	// (Si scrapingProgress está en vuelo, ScrapingProgressBanner ya cubre el caso.)
	const isScbaFirstSyncPending =
		!!movementsData.scbaAccess &&
		!movementsData.causaLastSyncDate &&
		(movementsData.movements?.length ?? 0) === 0 &&
		!scrapingProgress;

	// Load data on mount y cuando cambien los filtros
	useEffect(() => {
		if (id && activeTab === "movements") {
			// Cargar movimientos con todos los filtros aplicados
			dispatch(
				getMovementsByFolderId(id, {
					page: 1,
					limit: 10,
					sort: "-time", // Ordenar por fecha descendente por defecto
					filter: buildFilterObject(filters.onlyWithDocuments),
				}),
			);
		}
		if (id && activeTab !== "movements") {
			dispatch(getNotificationsByFolderId(id));
			dispatch(getEventsById(id));
		}
	}, [id, activeTab, filters.onlyWithDocuments, filters.type]);

	// Polling para scrapingProgress (MEV y PJN): 10s cuando está en progreso, 30s en otros estados activos
	useEffect(() => {
		if (!scrapingProgress || scrapingProgress.isComplete || scrapingProgress.status === "completed" || !id) {
			return;
		}

		const pollMs = scrapingProgress.status === "in_progress" ? 10000 : 30000;

		const pollInterval = setInterval(() => {
			dispatch(
				getMovementsByFolderId(id, {
					page: 1,
					limit: 10,
					sort: "-time",
					filter: buildFilterObject(filters.onlyWithDocuments),
				}),
			);
		}, pollMs);

		return () => clearInterval(pollInterval);
	}, [id, scrapingProgress?.isComplete, scrapingProgress?.status, filters.onlyWithDocuments]);

	// Resetear estado del banner cuando cambia scrapingProgress
	useEffect(() => {
		// Si scrapingProgress cambia (nuevo proceso), resetear el estado de cerrado
		if (scrapingProgress && !scrapingProgress.isComplete) {
			setScrapingBannerClosed(false);
		}
	}, [scrapingProgress?.status]);

	// Tab configuration — all brand-aligned (no rainbow)
	const tabs: TabConfig[] = [
		{
			value: "movements",
			label: "Movimientos",
			icon: <TableDocument size={20} />,
			color: BRAND_BLUE,
			description: "Escritos y despachos judiciales",
		},
		{
			value: "notifications",
			label: "Notificaciones",
			icon: <NotificationStatus size={20} />,
			color: BRAND_BLUE,
			description: "Cédulas y notificaciones",
		},
		{
			value: "calendar",
			label: "Calendario",
			icon: <Calendar size={20} />,
			color: BRAND_BLUE,
			description: "Eventos y audiencias",
		},
		{
			value: "combined",
			label: "Vista combinada",
			icon: <Link21 size={20} />,
			color: BRAND_BLUE,
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
			// Usar la página actual para mantener la vista del usuario
			const currentPage = movementsData.pagination?.page || 1;
			dispatch(
				getMovementsByFolderId(id, {
					page: currentPage,
					limit: 10,
					sort: "-time",
					filter: buildFilterObject(filters.onlyWithDocuments),
				}),
			);
		}
	};

	const handleCloseBanner = () => {
		setScrapingBannerClosed(true);
	};

	// Document Explorer handlers
	const handleOpenExplorer = (movement: Movement) => {
		setExplorerMovement(movement);
		setExplorerOpen(true);
	};

	const handleCloseExplorer = () => {
		setExplorerOpen(false);
		setExplorerMovement(null);
	};

	const handleOpenExplorerFromNavigation = () => {
		// Close document navigation modal, open explorer with current movement
		const movementsWithLinks = movementsData.movements.filter((m: Movement) => m.link);
		const movementToOpen = currentDocumentMovement || movementsWithLinks[0];
		setDocumentNavigationOpen(false);
		setCurrentDocumentMovement(null);
		if (movementToOpen) {
			handleOpenExplorer(movementToOpen);
		}
	};

	const handleExplorerPageRequest = async (page: number) => {
		if (id) {
			await dispatch(
				getMovementsByFolderId(id, {
					page,
					limit: 10,
					sort: "-time",
					filter: buildFilterObject(filters.onlyWithDocuments),
				}),
			);
		}
	};

	// Cerrar explorer si se cambia de tab
	useEffect(() => {
		if (activeTab !== "movements") {
			handleCloseExplorer();
		}
	}, [activeTab]);

	// Quick action handlers from DocumentPanel
	const handleCreateTaskFromPanel = (movement: Movement) => {
		const movementRef = movement.source === "pjn" ? movement.link : movement._id;
		setPanelTaskInitialValues({
			name: `[${movement.movement}] ${movement.title}`,
			description: movement.description || "",
			dueDate: movement.dateExpiration || "",
			movementRef: movementRef || undefined,
			movementSource: movement.source || undefined,
		});
		setPanelTaskModalOpen(true);
	};

	const handleAddNoteFromPanel = (movement: Movement) => {
		const movementRef = movement.source === "pjn" ? movement.link : movement._id;
		setPanelNoteInitialValues({
			title: `Nota: ${movement.title}`,
			content: movement.description || "",
			movementRef: movementRef || undefined,
			movementSource: movement.source || undefined,
		});
		setPanelNoteModalOpen(true);
	};

	const handleEditMovementFromPanel = (movement: Movement) => {
		handleEditMovement(movement);
	};

	const handleToggleCompleteFromPanel = async (movementId: string) => {
		const result = await dispatch(toggleMovementComplete(movementId));
		if (!result.success) {
			console.error("Error al cambiar el estado del movimiento:", result.error);
		}
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
			const result = await dispatch(deleteEvent(eventToDelete) as any);
			setDeleteEventDialog(false);
			setEventToDelete(null);

			if (result?.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Evento eliminado exitosamente",
						variant: "alert",
						alert: {
							color: "success",
						},
						close: true,
					}),
				);
			} else {
				// Mostrar mensaje de error apropiado según el código de estado
				const errorMessage =
					result?.statusCode === 403 ? "No tienes permisos para eliminar este evento" : result?.error || "Error al eliminar el evento";
				dispatch(
					openSnackbar({
						open: true,
						message: errorMessage,
						variant: "alert",
						alert: {
							color: "error",
						},
						close: true,
					}),
				);
			}
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
	const StatRow = ({ label, count }: { label: string; count: number }) => (
		<Stack
			direction="row"
			alignItems="center"
			justifyContent="space-between"
			sx={{
				px: 1,
				py: 0.625,
				borderRadius: 0.75,
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
			}}
		>
			<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>{label}</Typography>
			<Typography
				sx={{
					fontSize: "0.78rem",
					fontWeight: 700,
					color: count > 0 ? BRAND_BLUE : "text.disabled",
					letterSpacing: "-0.005em",
					fontVariantNumeric: "tabular-nums",
				}}
			>
				{count}
			</Typography>
		</Stack>
	);

	const sidebarContent = (
		<Box
			sx={{
				width: isMobile ? 280 : 240,
				display: "flex",
				flexDirection: "column",
				height: "100%",
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
				borderRight: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
			}}
		>
			{/* Header */}
			<Box sx={{ p: 1.75, borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` }}>
				<Stack direction="row" spacing={1.25} alignItems="center">
					<Box
						sx={{
							width: 32,
							height: 32,
							borderRadius: 1,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
							color: BRAND_BLUE,
						}}
					>
						<TableDocument size={16} variant="Bulk" />
					</Box>
					<Stack spacing={0.125} sx={{ minWidth: 0 }}>
						<Stack direction="row" spacing={0.5} alignItems="center">
							<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
							<Typography
								sx={{
									fontSize: "0.58rem",
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "text.secondary",
								}}
							>
								Actividad
							</Typography>
						</Stack>
						<Typography
							sx={{
								fontSize: "0.82rem",
								fontWeight: 600,
								letterSpacing: "-0.005em",
								color: "text.primary",
								overflow: "hidden",
								textOverflow: "ellipsis",
								whiteSpace: "nowrap",
							}}
						>
							{folderName || "Carpeta"}
						</Typography>
					</Stack>
				</Stack>
			</Box>

			{/* Tabs verticales */}
			<Tabs
				orientation="vertical"
				variant="scrollable"
				value={activeTab}
				onChange={handleTabChange}
				TabIndicatorProps={{
					sx: {
						left: 0,
						width: 3,
						borderRadius: "0 2px 2px 0",
						bgcolor: BRAND_BLUE,
						transition: "all 200ms ease",
					},
				}}
				sx={{
					flex: 1,
					"& .MuiTab-root": {
						minHeight: 68,
						justifyContent: "flex-start",
						textAlign: "left",
						alignItems: "flex-start",
						px: 1.75,
						py: 1.25,
						borderRadius: 0,
						textTransform: "none",
						transition: "all 180ms ease",
						"&.Mui-selected": {
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
						},
						"&:hover": {
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
						},
					},
				}}
			>
				{tabs.map((tab) => {
					const active = activeTab === tab.value;
					return (
						<Tab
							key={tab.value}
							value={tab.value}
							disableRipple
							label={
								<Stack spacing={0.5} alignItems="flex-start" width="100%">
									<Stack direction="row" spacing={1.25} alignItems="center">
										<Box
											sx={{
												width: 26,
												height: 26,
												borderRadius: 0.75,
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												bgcolor: active ? alpha(BRAND_BLUE, isDark ? 0.18 : 0.1) : alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
												border: `1px solid ${active ? alpha(BRAND_BLUE, isDark ? 0.32 : 0.22) : alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
												color: BRAND_BLUE,
												flexShrink: 0,
												transition: "all 180ms ease",
											}}
										>
											{React.cloneElement(tab.icon, {
												size: 14,
												variant: active ? "Bulk" : "Linear",
											})}
										</Box>
										<Typography
											sx={{
												fontSize: "0.82rem",
												fontWeight: active ? 600 : 500,
												letterSpacing: "-0.005em",
												color: active ? "text.primary" : "text.secondary",
											}}
										>
											{tab.label}
										</Typography>
									</Stack>
									<Typography
										sx={{
											fontSize: "0.68rem",
											color: "text.secondary",
											letterSpacing: "-0.005em",
											pl: 4.625,
											opacity: 0.85,
										}}
									>
										{tab.description}
									</Typography>
								</Stack>
							}
						/>
					);
				})}
			</Tabs>

			{/* Stats footer — brand StatRows */}
			<Box sx={{ p: 1.75, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` }}>
				<Stack direction="row" spacing={0.5} alignItems="center" mb={1}>
					<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
					<Typography
						sx={{
							fontSize: "0.58rem",
							fontWeight: 600,
							letterSpacing: "0.08em",
							textTransform: "uppercase",
							color: "text.secondary",
						}}
					>
						Total de registros
					</Typography>
				</Stack>
				<Stack spacing={0.625}>
					{movementsData.isLoading || notificationsData.isLoading || eventsData.isLoading ? (
						<>
							<Skeleton variant="rectangular" height={28} sx={{ borderRadius: 0.75 }} />
							<Skeleton variant="rectangular" height={28} sx={{ borderRadius: 0.75 }} />
							<Skeleton variant="rectangular" height={28} sx={{ borderRadius: 0.75 }} />
						</>
					) : (
						<>
							<Tooltip
								title={movementsData.pagination ? `Mostrando ${movementsData.movements?.length} de ${movementsData.pagination.total}` : ""}
								arrow
								placement="right"
							>
								<Box>
									<StatRow label="Movimientos" count={movementsData.pagination?.total || movementsData.movements?.length || 0} />
								</Box>
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
								<Box>
									<StatRow
										label="Notificaciones"
										count={notificationsData.pagination?.total || notificationsData.notifications?.length || 0}
									/>
								</Box>
							</Tooltip>
							<Tooltip
								title={eventsData.pagination ? `Mostrando ${eventsData.events?.length} de ${eventsData.pagination.total}` : ""}
								arrow
								placement="right"
							>
								<Box>
									<StatRow label="Eventos" count={eventsData.pagination?.total || eventsData.events?.length || 0} />
								</Box>
							</Tooltip>
						</>
					)}
				</Stack>
			</Box>
		</Box>
	);

	const brandIconButtonSx = {
		width: 32,
		height: 32,
		borderRadius: 1,
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
		bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
		color: BRAND_BLUE,
		transition: "all 180ms ease",
		"&:hover": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
			borderColor: alpha(BRAND_BLUE, isDark ? 0.38 : 0.28),
		},
	};

	return (
		<MainCard
			content={false}
			sx={{
				"& .MuiCardContent-root": { p: 0 },
				height: "100%",
				display: "flex",
				flexDirection: "column",
				borderRadius: 1.5,
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				boxShadow: "none",
				overflow: "hidden",
			}}
		>
			<Box sx={{ display: "flex", height: "100%", minHeight: 600 }}>
				{isMobile ? (
					<>
						{/* Mobile Layout */}
						<Box sx={{ flex: 1, display: "flex", flexDirection: "column", overflow: "hidden" }}>
							{/* Header Toolbar */}
							<Box
								sx={{
									p: 1.5,
									borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
								}}
							>
								<Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
									<Stack direction="row" spacing={1} alignItems="center" flex={1}>
										{/* Menu */}
										<IconButton onClick={() => setMobileOpen(true)} size="small" sx={brandIconButtonSx}>
											<Menu size={16} variant="Bulk" />
										</IconButton>

										{/* Current tab pill */}
										<Box
											sx={{
												display: "inline-flex",
												alignItems: "center",
												gap: 0.625,
												px: 1,
												py: 0.5,
												borderRadius: 1,
												bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
												border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
												color: BRAND_BLUE,
											}}
										>
											{React.cloneElement(currentTab?.icon || <TableDocument />, { size: 14, variant: "Bulk" })}
											<Typography sx={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "-0.005em", color: BRAND_BLUE }}>
												{currentTab?.label}
											</Typography>
										</Box>
									</Stack>

									{/* Action buttons */}
									<Stack direction="row" spacing={0.75}>
										{activeTab !== "combined" && canCreate && (
											<Tooltip title={`Agregar ${currentTab?.label.toLowerCase().slice(0, -1)}`}>
												<IconButton
													size="small"
													onClick={() => {
														if (activeTab === "movements") handleAddMovement();
														else if (activeTab === "notifications") handleAddNotification();
														else if (activeTab === "calendar") handleAddEvent();
													}}
													sx={brandIconButtonSx}
												>
													<Add size={16} variant="Bulk" />
												</IconButton>
											</Tooltip>
										)}
									</Stack>
								</Stack>

								{/* Search */}
								<Box sx={{ mt: 1.5 }}>
									<TextField
										size="small"
										fullWidth
										placeholder={`Buscar en ${currentTab?.label.toLowerCase()}…`}
										value={searchQuery}
										onChange={(e) => setSearchQuery(e.target.value)}
										InputProps={{
											startAdornment: (
												<InputAdornment position="start">
													<SearchNormal1 size={16} variant="Bulk" color={BRAND_BLUE} />
												</InputAdornment>
											),
											sx: {
												bgcolor: theme.palette.background.paper,
												borderRadius: 1,
												"& .MuiOutlinedInput-notchedOutline": {
													borderColor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.14),
												},
												"&:hover .MuiOutlinedInput-notchedOutline": {
													borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
												},
												"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
													borderColor: BRAND_BLUE,
												},
											},
										}}
									/>
								</Box>

								{/* Controles para movimientos — mobile */}
								{activeTab === "movements" && (
									<Box
										sx={{
											mt: 1.5,
											p: 1.5,
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025),
											borderRadius: 1,
											border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
										}}
									>
										<Stack spacing={1.25}>
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
													Opciones de visualización
												</Typography>
											</Stack>

											{/* Checkbox */}
											<FormControlLabel
												control={
													<Checkbox
														checked={filters.onlyWithDocuments}
														onChange={(e) => setFilters({ ...filters, onlyWithDocuments: e.target.checked })}
														size="small"
														sx={{
															color: alpha(BRAND_BLUE, 0.5),
															"&.Mui-checked": { color: BRAND_BLUE },
														}}
													/>
												}
												label={
													<Stack direction="row" alignItems="center" spacing={0.875}>
														<DocumentText size={16} variant="Bulk" color={BRAND_BLUE} />
														<Typography sx={{ fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em" }}>
															Solo movimientos con documento
														</Typography>
														{movementsData.totalWithLinks > 0 && (
															<Box
																sx={{
																	display: "inline-flex",
																	alignItems: "center",
																	px: 0.625,
																	py: 0.125,
																	borderRadius: 0.5,
																	bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
																	border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.22)}`,
																}}
															>
																<Typography sx={{ fontSize: "0.66rem", fontWeight: 700, color: BRAND_BLUE, fontVariantNumeric: "tabular-nums" }}>
																	{movementsData.totalWithLinks}
																</Typography>
															</Box>
														)}
													</Stack>
												}
											/>

											{filters.onlyWithDocuments &&
												(movementsData.pagination?.totalAvailable ?? 0) > (movementsData.pagination?.total ?? 0) && (
													<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
														{movementsData.pagination.total || 0} de {movementsData.pagination.totalAvailable} ·{" "}
														<Box
															component="span"
															sx={{ color: BRAND_BLUE, cursor: "pointer", fontWeight: 600 }}
															onClick={() => setFilters({ ...filters, onlyWithDocuments: false })}
														>
															Ver todos
														</Box>
													</Typography>
												)}

											<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.1) }} />

											{/* Expediente digital — sober brand */}
											<Button
												variant="contained"
												size="small"
												fullWidth
												startIcon={<Gallery size={16} variant="Bulk" />}
												onClick={() => {
													const movementsWithLinks = movementsData.movements.filter((m: Movement) => m.link);
													if (movementsWithLinks.length > 0) {
														setCurrentDocumentMovement(movementsWithLinks[0]);
														setDocumentNavigationOpen(true);
													}
												}}
												disabled={!movementsData.totalWithLinks || movementsData.totalWithLinks === 0}
												sx={{
													textTransform: "none",
													fontWeight: 600,
													letterSpacing: "-0.005em",
													bgcolor: BRAND_BLUE,
													color: "#fff",
													borderRadius: 1,
													py: 0.875,
													boxShadow: "none",
													"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
													"&.Mui-disabled": {
														bgcolor: alpha(theme.palette.text.disabled, 0.12),
														color: theme.palette.text.disabled,
													},
												}}
											>
												Expediente digital
												{movementsData.totalWithLinks > 0 && ` (${movementsData.totalWithLinks})`}
											</Button>
										</Stack>
									</Box>
								)}

								{/* Filtros — brand */}
								<Collapse in={showFilters} timeout="auto" unmountOnExit>
									<Fade in={showFilters} timeout={350}>
										<Box
											sx={{
												mt: 1.5,
												p: 1.75,
												bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
												borderRadius: 1,
												border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
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
										{/* Scraping Progress Banner / Estado de sincronización PJN */}
										{activeTab === "movements" && (
											<>
												{scrapingProgress && !scrapingBannerClosed && (
													<Box sx={{ mb: 2 }}>
														<ScrapingProgressBanner
															scrapingProgress={scrapingProgress}
															source={scrapingSource}
															onRefresh={handleRefreshMovements}
															onClose={handleCloseBanner}
														/>
													</Box>
												)}
												{!scrapingProgress && !isScbaFirstSyncPending && (movementsData.pjnAccess || movementsData.scbaAccess || movementsData.ejeAccess) && (
													<FolderSyncStatus source={scrapingSource} causaLastSyncDate={movementsData.causaLastSyncDate} />
												)}
											</>
										)}

										<Paper
											elevation={0}
											sx={{
												height: "100%",
												borderRadius: 1,
												border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
												overflow: "hidden",
											}}
										>
											{activeTab === "movements" &&
												(isScbaFirstSyncPending ? (
													<SyncPendingEmptyState
														source={scrapingSource}
														onRefresh={handleRefreshMovements}
														isRefreshing={movementsData.isLoading}
													/>
												) : scrapingSource === "pjn" && id ? (
													// PJN: el viewer paginado (pjn-movements) REEMPLAZA la tabla clásica —
													// una sola tabla. Otros fueros (EJE/SCBA/MEV/manual) usan MovementsTable.
													<PjnMovementsViewerSection folderId={id} highlightMovementId={highlightMovementId} />
												) : (
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
														pjnAccess={movementsData.pjnAccess ?? movementsData.scbaAccess}
													/>
												))}
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
						{sidebarContent}

						{/* Main Content Area */}
						<Box
							sx={{
								flex: 1,
								display: "flex",
								flexDirection: "column",
								overflow: "hidden",
							}}
						>
							{/* Header Toolbar */}
							<Box
								sx={{
									p: 1.5,
									borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
								}}
							>
								<Stack direction="row" spacing={1.5} alignItems="center" justifyContent="space-between">
									<Stack direction="row" spacing={1.25} alignItems="center" flex={1}>
										{/* Current tab pill */}
										<Box
											sx={{
												display: "inline-flex",
												alignItems: "center",
												gap: 0.625,
												px: 1.25,
												py: 0.625,
												borderRadius: 1,
												bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
												border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
												color: BRAND_BLUE,
											}}
										>
											{React.cloneElement(currentTab?.icon || <TableDocument />, { size: 14, variant: "Bulk" })}
											<Typography sx={{ fontSize: "0.78rem", fontWeight: 600, letterSpacing: "-0.005em", color: BRAND_BLUE }}>
												{currentTab?.label}
											</Typography>
										</Box>

										{/* Search */}
										<TextField
											size="small"
											placeholder={`Buscar en ${currentTab?.label.toLowerCase()}…`}
											value={searchQuery}
											onChange={(e) => setSearchQuery(e.target.value)}
											sx={{ minWidth: 300 }}
											InputProps={{
												startAdornment: (
													<InputAdornment position="start">
														<SearchNormal1 size={16} variant="Bulk" color={BRAND_BLUE} />
													</InputAdornment>
												),
												sx: {
													bgcolor: theme.palette.background.paper,
													borderRadius: 1,
													"& .MuiOutlinedInput-notchedOutline": {
														borderColor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.14),
													},
													"&:hover .MuiOutlinedInput-notchedOutline": {
														borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
													},
													"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
														borderColor: BRAND_BLUE,
													},
												},
											}}
										/>
									</Stack>

									{/* Action buttons — brand */}
									<Stack direction="row" spacing={0.75}>
										<Tooltip title="Exportar">
											<IconButton size="small" onClick={handleExport} sx={brandIconButtonSx}>
												<ExportSquare size={16} variant="Bulk" />
											</IconButton>
										</Tooltip>
										{activeTab !== "combined" && canCreate && (
											<Tooltip title={`Agregar ${currentTab?.label.toLowerCase().slice(0, -1)}`}>
												<IconButton
													size="small"
													onClick={() => {
														if (activeTab === "movements") handleAddMovement();
														else if (activeTab === "notifications") handleAddNotification();
														else if (activeTab === "calendar") handleAddEvent();
													}}
													sx={brandIconButtonSx}
												>
													<Add size={16} variant="Bulk" />
												</IconButton>
											</Tooltip>
										)}
									</Stack>
								</Stack>

								{/* Controles para movimientos — desktop */}
								{activeTab === "movements" ? (
									<Box
										sx={{
											mt: 1.5,
											p: 1.5,
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025),
											borderRadius: 1,
											border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
										}}
									>
										<Stack spacing={1.25}>
											<Stack direction="row" justifyContent="space-between" alignItems="center">
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
														Opciones de visualización
													</Typography>
												</Stack>
												<Tooltip title={showFilters ? "Ocultar filtros avanzados" : "Mostrar filtros avanzados"}>
													<Badge
														variant="dot"
														invisible={!hasActiveFilters()}
														sx={{
															"& .MuiBadge-dot": {
																right: 2,
																top: 2,
																bgcolor: LIVE_GREEN,
															},
														}}
													>
														<IconButton
															size="small"
															onClick={() => setShowFilters(!showFilters)}
															sx={{
																...brandIconButtonSx,
																...(showFilters && {
																	bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
																	borderColor: alpha(BRAND_BLUE, isDark ? 0.38 : 0.28),
																}),
																transition: "all 200ms ease",
																transform: showFilters ? "rotate(180deg)" : "rotate(0deg)",
															}}
														>
															<Filter size={14} variant="Bulk" />
														</IconButton>
													</Badge>
												</Tooltip>
											</Stack>

											<Stack direction="row" spacing={2} alignItems="center">
												<FormControlLabel
													control={
														<Checkbox
															checked={filters.onlyWithDocuments}
															onChange={(e) => setFilters({ ...filters, onlyWithDocuments: e.target.checked })}
															size="small"
															sx={{
																color: alpha(BRAND_BLUE, 0.5),
																"&.Mui-checked": { color: BRAND_BLUE },
															}}
														/>
													}
													label={
														<Stack direction="row" alignItems="center" spacing={0.875}>
															<DocumentText size={16} variant="Bulk" color={BRAND_BLUE} />
															<Typography sx={{ fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em" }}>
																Solo con documento
															</Typography>
															{movementsData.totalWithLinks > 0 && (
																<Box
																	sx={{
																		display: "inline-flex",
																		alignItems: "center",
																		px: 0.625,
																		py: 0.125,
																		borderRadius: 0.5,
																		bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
																		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.22)}`,
																	}}
																>
																	<Typography sx={{ fontSize: "0.66rem", fontWeight: 700, color: BRAND_BLUE, fontVariantNumeric: "tabular-nums" }}>
																		{movementsData.totalWithLinks}
																	</Typography>
																</Box>
															)}
														</Stack>
													}
												/>

												<Box sx={{ width: 1, height: 20, bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.12) }} />

												<Button
													variant="contained"
													size="small"
													startIcon={<Gallery size={16} variant="Bulk" />}
													onClick={() => {
														const movementsWithLinks = movementsData.movements.filter((m: Movement) => m.link);
														if (movementsWithLinks.length > 0) {
															setCurrentDocumentMovement(movementsWithLinks[0]);
															setDocumentNavigationOpen(true);
														}
													}}
													disabled={!movementsData.totalWithLinks || movementsData.totalWithLinks === 0}
													sx={{
														textTransform: "none",
														fontWeight: 600,
														letterSpacing: "-0.005em",
														bgcolor: BRAND_BLUE,
														color: "#fff",
														borderRadius: 1,
														px: 1.5,
														py: 0.75,
														boxShadow: "none",
														"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
														"&.Mui-disabled": {
															bgcolor: alpha(theme.palette.text.disabled, 0.12),
															color: theme.palette.text.disabled,
														},
													}}
												>
													Expediente digital
													{movementsData.totalWithLinks > 0 && ` (${movementsData.totalWithLinks})`}
												</Button>
											</Stack>

											{filters.onlyWithDocuments &&
												(movementsData.pagination?.totalAvailable ?? 0) > (movementsData.pagination?.total ?? 0) && (
													<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
														{movementsData.pagination.total || 0} de {movementsData.pagination.totalAvailable} ·{" "}
														<Box
															component="span"
															sx={{ color: BRAND_BLUE, cursor: "pointer", fontWeight: 600 }}
															onClick={() => setFilters({ ...filters, onlyWithDocuments: false })}
														>
															Ver todos
														</Box>
													</Typography>
												)}

											<Collapse in={showFilters} timeout="auto" unmountOnExit>
												<Box sx={{ pt: 1.25 }}>
													<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.1), mb: 1.25 }} />
													<ActivityFilters activeTab={activeTab} filters={filters} onFiltersChange={setFilters} />
												</Box>
											</Collapse>
										</Stack>
									</Box>
								) : (
									/* Filtros para otras pestañas */
									<>
										<Box sx={{ mt: 1.5, display: "flex", justifyContent: "flex-end" }}>
											<Tooltip title={showFilters ? "Ocultar filtros" : "Mostrar filtros"}>
												<Badge
													variant="dot"
													invisible={!hasActiveFilters()}
													sx={{
														"& .MuiBadge-dot": {
															right: 2,
															top: 2,
															bgcolor: LIVE_GREEN,
														},
													}}
												>
													<IconButton
														size="small"
														onClick={() => setShowFilters(!showFilters)}
														sx={{
															...brandIconButtonSx,
															...(showFilters && {
																bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
																borderColor: alpha(BRAND_BLUE, isDark ? 0.38 : 0.28),
															}),
															transition: "all 200ms ease",
															transform: showFilters ? "rotate(180deg)" : "rotate(0deg)",
														}}
													>
														<Filter size={14} variant="Bulk" />
													</IconButton>
												</Badge>
											</Tooltip>
										</Box>
										<Collapse in={showFilters} timeout="auto" unmountOnExit>
											<Fade in={showFilters} timeout={350}>
												<Box
													sx={{
														mt: 1.5,
														p: 1.75,
														bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
														borderRadius: 1,
														border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
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
										{/* Scraping Progress Banner / Estado de sincronización PJN */}
										{activeTab === "movements" && (
											<>
												{scrapingProgress && !scrapingBannerClosed && (
													<Box sx={{ mb: 2 }}>
														<ScrapingProgressBanner
															scrapingProgress={scrapingProgress}
															source={scrapingSource}
															onRefresh={handleRefreshMovements}
															onClose={handleCloseBanner}
														/>
													</Box>
												)}
												{!scrapingProgress && !isScbaFirstSyncPending && (movementsData.pjnAccess || movementsData.scbaAccess || movementsData.ejeAccess) && (
													<FolderSyncStatus source={scrapingSource} causaLastSyncDate={movementsData.causaLastSyncDate} />
												)}
											</>
										)}

										<Paper
											elevation={0}
											sx={{
												height: "100%",
												borderRadius: 1,
												border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
												overflow: "hidden",
											}}
										>
											{activeTab === "movements" &&
												(isScbaFirstSyncPending ? (
													<SyncPendingEmptyState
														source={scrapingSource}
														onRefresh={handleRefreshMovements}
														isRefreshing={movementsData.isLoading}
													/>
												) : scrapingSource === "pjn" && id ? (
													// PJN: el viewer paginado (pjn-movements) REEMPLAZA la tabla clásica —
													// una sola tabla. Otros fueros (EJE/SCBA/MEV/manual) usan MovementsTable.
													<PjnMovementsViewerSection folderId={id} highlightMovementId={highlightMovementId} />
												) : (
													<MovementsTable
														movements={movementsData.movements}
														searchQuery={searchQuery}
														onEdit={handleEditMovement}
														onDelete={handleDeleteMovement}
														onView={handleViewMovement}
														onOpenExplorer={handleOpenExplorer}
														filters={filters}
														pagination={movementsData.pagination}
														isLoading={movementsData.isLoading}
														totalWithLinks={movementsData.totalWithLinks}
														documentsBeforeThisPage={movementsData.documentsBeforeThisPage}
														documentsInThisPage={movementsData.documentsInThisPage}
														pjnAccess={movementsData.pjnAccess ?? movementsData.scbaAccess}
													/>
												))}
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

						{/* Document Explorer rendered as portal overlay below */}
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
				onSuccess={handleRefreshMovements}
				dialogSx={explorerOpen ? { zIndex: (t: any) => t.zIndex.modal + 20 } : undefined}
			/>

			<AlertMemberDelete
				title={
					movementToDelete
						? movementsData.movements.find((m: Movement) => m._id === movementToDelete)?.title ||
						  activitiesData.activities.find((a: any) => a._id === movementToDelete)?.title ||
						  "este movimiento"
						: ""
				}
				open={openDeleteModal}
				handleClose={handleCloseDeleteModal}
				id={movementToDelete}
			/>

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
			{viewMovementDetails && (() => {
				// Mapeo de tipo de movimiento a brand accent
				const movementAccentMap: Record<string, string> = {
					"Escrito-Actor": LIVE_GREEN,
					"Escrito-Demandado": theme.palette.error.main,
					Despacho: BRAND_BLUE,
					Cédula: BRAND_BLUE,
					Oficio: BRAND_BLUE,
					Evento: STALE_AMBER,
				};
				const movementAccent = movementAccentMap[viewMovementDetails.movement || ""] ?? theme.palette.text.secondary;

				// Reusable: tarjeta de campo (eyebrow + value box)
				const FieldRow = ({
					label,
					children,
				}: {
					label: string;
					children: React.ReactNode;
				}) => (
					<Box>
						<Stack direction="row" spacing={0.5} alignItems="center" mb={0.625}>
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
								{label}
							</Typography>
						</Stack>
						<Box
							sx={{
								p: 1.25,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
								borderRadius: 1.25,
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
							}}
						>
							{children}
						</Box>
					</Box>
				);

				return (
				<Dialog
					maxWidth="sm"
					fullWidth
					open={!!viewMovementDetails}
					onClose={() => setViewMovementDetails(null)}
					TransitionComponent={PopupTransition}
					PaperProps={{
						sx: {
							width: 600,
							maxWidth: 600,
							p: 0,
							borderRadius: 2,
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
							boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
							overflow: "hidden",
							display: "flex",
							flexDirection: "column",
							maxHeight: { xs: "90vh", sm: "85vh" },
						},
					}}
					sx={{ "& .MuiBackdrop-root": { opacity: "0.5 !important" } }}
				>
					{/* Header brand */}
					<Box
						sx={{
							display: "flex",
							alignItems: "center",
							gap: 1.25,
							px: 2.5,
							py: 1.75,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
							borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
							flexShrink: 0,
						}}
					>
						<Box
							sx={{
								width: 32,
								height: 32,
								borderRadius: 1,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
								color: BRAND_BLUE,
								flexShrink: 0,
							}}
						>
							<TableDocument size={18} variant="Bulk" />
						</Box>
						<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
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
									Detalle
								</Typography>
							</Stack>
							<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
								Detalles del movimiento
							</Typography>
							{folderName && (
								<Typography
									sx={{
										fontSize: "0.72rem",
										color: "text.secondary",
										letterSpacing: "-0.005em",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
									}}
								>
									{folderName}
								</Typography>
							)}
						</Stack>
					</Box>

					{/* Content scrollable */}
					<Box sx={{ p: 2.5, overflowY: "auto", flex: 1 }}>
						<Stack spacing={1.75}>
							{/* Título */}
							<FieldRow label="Título">
								<Typography sx={{ fontSize: "0.88rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
									{viewMovementDetails.title}
								</Typography>
							</FieldRow>

							{/* Tipo de Movimiento — pill brand-aligned */}
							{viewMovementDetails.movement && (
								<FieldRow label="Tipo de movimiento">
									<Box
										sx={{
											display: "inline-flex",
											alignItems: "center",
											gap: 0.625,
											px: 0.875,
											py: 0.25,
											borderRadius: 0.75,
											bgcolor: alpha(movementAccent, isDark ? 0.16 : 0.1),
											border: `1px solid ${alpha(movementAccent, isDark ? 0.32 : 0.22)}`,
										}}
									>
										<Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: movementAccent }} />
										<Typography
											sx={{
												fontSize: "0.66rem",
												fontWeight: 600,
												color: movementAccent,
												letterSpacing: "0.04em",
												textTransform: "uppercase",
												lineHeight: 1,
											}}
										>
											{viewMovementDetails.movement}
										</Typography>
									</Box>
								</FieldRow>
							)}

							{/* Fecha de Dictado */}
							<FieldRow label="Fecha de dictado">
								<Stack direction="row" spacing={0.875} alignItems="center">
									<Calendar size={14} variant="Bulk" color={BRAND_BLUE} />
									<Typography
										sx={{
											fontSize: "0.88rem",
											fontWeight: 500,
											color: "text.primary",
											letterSpacing: "-0.005em",
											fontVariantNumeric: "tabular-nums",
										}}
									>
										{formatDate(viewMovementDetails.time)}
									</Typography>
								</Stack>
							</FieldRow>

							{/* Fecha de Vencimiento */}
							{viewMovementDetails.dateExpiration && (
								<FieldRow label="Fecha de vencimiento">
									<Stack direction="row" spacing={0.875} alignItems="center">
										<Calendar size={14} variant="Bulk" color={STALE_AMBER} />
										<Typography
											sx={{
												fontSize: "0.88rem",
												fontWeight: 500,
												color: "text.primary",
												letterSpacing: "-0.005em",
												fontVariantNumeric: "tabular-nums",
											}}
										>
											{formatDate(viewMovementDetails.dateExpiration)}
										</Typography>
									</Stack>
								</FieldRow>
							)}

							{/* Estado de Completitud */}
							{viewMovementDetails.completed !== undefined && viewMovementDetails.completed !== null && (
								<FieldRow label="Estado">
									<Stack direction="row" spacing={0.875} alignItems="center">
										<Box
											sx={{
												width: 18,
												height: 18,
												borderRadius: "50%",
												display: "flex",
												alignItems: "center",
												justifyContent: "center",
												bgcolor: alpha(
													viewMovementDetails.completed ? LIVE_GREEN : STALE_AMBER,
													isDark ? 0.16 : 0.1,
												),
												border: `1px solid ${alpha(
													viewMovementDetails.completed ? LIVE_GREEN : STALE_AMBER,
													isDark ? 0.32 : 0.22,
												)}`,
												color: viewMovementDetails.completed ? LIVE_GREEN : STALE_AMBER,
											}}
										>
											<TickCircle size={11} variant="Bulk" />
										</Box>
										<Typography
											sx={{
												fontSize: "0.85rem",
												fontWeight: 600,
												color: viewMovementDetails.completed ? LIVE_GREEN : STALE_AMBER,
												letterSpacing: "-0.005em",
											}}
										>
											{viewMovementDetails.completed ? "Completado" : "Pendiente"}
										</Typography>
									</Stack>
								</FieldRow>
							)}

							{/* Descripción */}
							{viewMovementDetails.description && (
								<FieldRow label="Descripción">
									<Typography
										sx={{
											fontSize: "0.85rem",
											color: "text.primary",
											letterSpacing: "-0.005em",
											lineHeight: 1.6,
											whiteSpace: "pre-wrap",
											textWrap: "pretty" as any,
										}}
									>
										{viewMovementDetails.description}
									</Typography>
								</FieldRow>
							)}

							{/* Link */}
							{viewMovementDetails.link && (
								<FieldRow label="Documento">
									<Box
										onClick={() => {
											setPdfUrlFromDetails(viewMovementDetails.link || "");
											setPdfTitleFromDetails(viewMovementDetails.title || "Documento");
											setPdfViewerFromDetailsOpen(true);
										}}
										sx={{
											display: "inline-flex",
											alignItems: "center",
											gap: 0.75,
											cursor: "pointer",
											color: BRAND_BLUE,
											"&:hover": { textDecoration: "underline" },
										}}
									>
										<Link21 size={14} variant="Bulk" color={BRAND_BLUE} />
										<Typography
											sx={{
												fontSize: "0.85rem",
												fontWeight: 600,
												color: BRAND_BLUE,
												letterSpacing: "-0.005em",
												wordBreak: "break-all",
											}}
										>
											Ver documento adjunto
										</Typography>
									</Box>
								</FieldRow>
							)}

							{/* Origen — sync notice brand */}
							{(viewMovementDetails.source === "pjn" || viewMovementDetails.source === "mev") && (
								<Box>
									<Stack direction="row" spacing={0.5} alignItems="center" mb={0.625}>
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
											Origen
										</Typography>
									</Stack>
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 0.875,
											p: 1.25,
											borderRadius: 1.25,
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
											border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
										}}
									>
										<ExportSquare size={14} variant="Bulk" color={BRAND_BLUE} />
										<Typography sx={{ fontSize: "0.78rem", fontWeight: 500, color: "text.primary", letterSpacing: "-0.005em" }}>
											Sincronizado desde{" "}
											<Box component="span" sx={{ fontWeight: 700, color: BRAND_BLUE }}>
												{viewMovementDetails.source === "pjn"
													? "Poder Judicial de la Nación (PJN)"
													: "Poder Judicial de Buenos Aires (MEV)"}
											</Box>
										</Typography>
									</Box>
								</Box>
							)}
						</Stack>
					</Box>

					{/* Actions — ghost brand */}
					<Box
						sx={{
							px: 2.5,
							py: 1.75,
							display: "flex",
							justifyContent: "flex-end",
							borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
							flexShrink: 0,
						}}
					>
						<Button
							onClick={() => setViewMovementDetails(null)}
							sx={{
								textTransform: "none",
								fontWeight: 600,
								letterSpacing: "-0.005em",
								color: "text.secondary",
								borderRadius: 1.25,
								px: 2,
								py: 0.875,
								border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
								"&:hover": {
									color: BRAND_BLUE,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
									borderColor: alpha(BRAND_BLUE, 0.28),
								},
							}}
						>
							Cerrar
						</Button>
					</Box>
				</Dialog>
				);
			})()}

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
					event={eventsData.events.find((e: any) => e._id === calendarState.selectedEventId)}
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
							onOpenExplorer={!isMobile ? handleOpenExplorerFromNavigation : undefined}
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

			{/* Quick Action Modals from Explorer */}
			<ModalTasks
				open={panelTaskModalOpen}
				setOpen={setPanelTaskModalOpen}
				folderId={id || ""}
				folderName={folderName || ""}
				initialValues={panelTaskInitialValues}
				onClose={() => {
					setPanelTaskModalOpen(false);
					setPanelTaskInitialValues(undefined);
				}}
				dialogSx={{ zIndex: (t: any) => t.zIndex.modal + 20 }}
			/>
			<ModalNotes
				open={panelNoteModalOpen}
				setOpen={(open: boolean) => {
					setPanelNoteModalOpen(open);
					if (!open) setPanelNoteInitialValues(undefined);
				}}
				folderId={id || ""}
				folderName={folderName || ""}
				initialValues={panelNoteInitialValues}
				dialogSx={{ zIndex: (t: any) => t.zIndex.modal + 20 }}
			/>

			{/* Document Explorer (full-screen overlay) - desktop only */}
			{!isMobile && (
				<DocumentExplorer
					open={explorerOpen}
					onClose={handleCloseExplorer}
					initialMovement={explorerMovement}
					movements={movementsData.movements}
					pagination={movementsData.pagination}
					totalWithLinks={movementsData.totalWithLinks}
					documentsBeforeThisPage={movementsData.documentsBeforeThisPage}
					isLoading={movementsData.isLoading}
					onRequestPage={handleExplorerPageRequest}
					folderId={id || ""}
					folderName={folderName || ""}
					onCreateTask={handleCreateTaskFromPanel}
					onAddNote={handleAddNoteFromPanel}
					onEditMovement={handleEditMovementFromPanel}
					onToggleComplete={handleToggleCompleteFromPanel}
				/>
			)}
		</MainCard>
	);
};

export default ActivityTables;

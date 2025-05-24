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
} from "@mui/material";
import { format, parseISO } from "date-fns";
import { es } from "date-fns/locale";
import { TableDocument, NotificationStatus, Calendar, Link21, SearchNormal1, ExportSquare, Filter, Add } from "iconsax-react";
import MainCard from "components/MainCard";
import { useParams } from "react-router";
import { useSelector, dispatch } from "store";
import { getMovementsByFolderId } from "store/reducers/movements";
import { getNotificationsByFolderId } from "store/reducers/notifications";
import { getEventsById } from "store/reducers/events";
import MovementsTable from "./tables/MovementsTable";
import NotificationsTable from "./tables/NotificationsTable";
import CalendarTable from "./tables/CalendarTable";
import CombinedTable, { UnifiedActivity } from "./tables/CombinedTable";
import ModalMovements from "../modals/ModalMovements";
import ModalNotifications from "../modals/ModalNotifications";
import AddEventFrom from "sections/apps/calendar/AddEventForm";
import AlertMemberDelete from "../modals/alertMemberDelete";
import AlertNotificationDelete from "../modals/alertNotificationDelete";
import { Movement } from "types/movements";
import { NotificationType } from "types/notifications";
import { PopupTransition } from "components/@extended/Transitions";
import { toggleModal, selectEvent } from "store/reducers/calendar";
import { deleteEvent } from "store/reducers/events";
import ActivityFilters from "./filters/ActivityFilters";
import { exportActivityData } from "./utils/exportUtils";

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
	const { id } = useParams<{ id: string }>();
	const [activeTab, setActiveTab] = useState<TabValue>("movements");
	const [searchQuery, setSearchQuery] = useState("");
	const [showFilters, setShowFilters] = useState(false);
	const [filters, setFilters] = useState<any>({
		startDate: null,
		endDate: null,
		type: "",
		status: "",
		user: "",
		hasExpiration: "",
		allDay: "",
		source: "",
	});

	// Modals states - Movements
	const [openMovementModal, setOpenMovementModal] = useState(false);
	const [openDeleteModal, setOpenDeleteModal] = useState(false);
	const [selectedMovement, setSelectedMovement] = useState<Movement | null>(null);
	const [movementToDelete, setMovementToDelete] = useState<string | null>(null);
	const [viewMovementDetails, setViewMovementDetails] = useState<Movement | null>(null);

	// Modals states - Notifications
	const [openNotificationModal, setOpenNotificationModal] = useState(false);
	const [openNotificationDeleteModal, setOpenNotificationDeleteModal] = useState(false);
	const [selectedNotification, setSelectedNotification] = useState<NotificationType | null>(null);
	const [notificationToDelete, setNotificationToDelete] = useState<string | null>(null);
	const [viewNotificationDetails, setViewNotificationDetails] = useState<NotificationType | null>(null);

	// Modals states - Calendar
	const [eventToDelete, setEventToDelete] = useState<string | null>(null);
	const [viewEventDetails, setViewEventDetails] = useState<any>(null);
	const [deleteEventDialog, setDeleteEventDialog] = useState(false);

	// Selectors
	const movementsData = useSelector((state: any) => state.movements);
	const notificationsData = useSelector((state: any) => state.notifications);
	const eventsData = useSelector((state: any) => state.events);
	const calendarState = useSelector((state: any) => state.calendar);
	const auth = useSelector((state: any) => state.auth);
	const userId = auth.user?._id;

	// Load data on mount
	useEffect(() => {
		if (id) {
			dispatch(getMovementsByFolderId(id));
			dispatch(getNotificationsByFolderId(id));
			dispatch(getEventsById(id));
		}
	}, [id]);

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
			// For combined view, we need to get the unified data
			const unified: UnifiedActivity[] = [];

			// Convert movements
			movementsData.movements.forEach((movement: Movement) => {
				unified.push({
					id: movement._id || "",
					title: movement.title || "",
					date: new Date(),
					dateString: movement.time,
					description: movement.description,
					type: "movement",
					subType: movement.movement || "",
					expirationDate: movement.dateExpiration,
					originalData: movement,
				});
			});

			// Convert notifications
			notificationsData.notifications.forEach((notification: NotificationType) => {
				unified.push({
					id: notification._id || "",
					title: notification.title || "",
					date: new Date(),
					dateString: notification.time || "",
					description: notification.description,
					type: "notification",
					subType: notification.notification || "",
					expirationDate: notification.dateExpiration,
					user: notification.user,
					originalData: notification,
				});
			});

			// Convert calendar events
			eventsData.events.forEach((event: any) => {
				unified.push({
					id: event._id || "",
					title: event.title || "",
					date: new Date(),
					dateString: format(parseISO(event.start), "dd/MM/yyyy", { locale: es }),
					description: event.description,
					type: "calendar",
					subType: event.type || "General",
					originalData: event,
				});
			});

			dataToExport.combined = unified;
		}

		exportActivityData(activeTab, dataToExport, folderName);
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
		// TODO: Implementar vista de detalles
	};

	const handleCloseMovementModal = () => {
		setOpenMovementModal(false);
		setSelectedMovement(null);
	};

	const handleCloseDeleteModal = () => {
		setOpenDeleteModal(false);
		setMovementToDelete(null);
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

	const handleConfirmDeleteEvent = async () => {
		if (eventToDelete) {
			await dispatch(deleteEvent(eventToDelete));
			setDeleteEventDialog(false);
			setEventToDelete(null);
		}
	};

	const handleViewEvent = (event: any) => {
		setViewEventDetails(event);
	};

	const handleCloseEventModal = () => {
		dispatch(toggleModal());
	};

	// Combined view handlers
	const handleCombinedEdit = (activity: UnifiedActivity) => {
		switch (activity.type) {
			case "movement":
				handleEditMovement(activity.originalData as Movement);
				break;
			case "notification":
				handleEditNotification(activity.originalData as NotificationType);
				break;
			case "calendar":
				handleEditEvent(activity.originalData);
				break;
		}
	};

	const handleCombinedDelete = (activity: UnifiedActivity) => {
		switch (activity.type) {
			case "movement":
				handleDeleteMovement(activity.id);
				break;
			case "notification":
				handleDeleteNotification(activity.id);
				break;
			case "calendar":
				handleDeleteEvent(activity.id);
				break;
		}
	};

	const handleCombinedView = (activity: UnifiedActivity) => {
		switch (activity.type) {
			case "movement":
				handleViewMovement(activity.originalData as Movement);
				break;
			case "notification":
				handleViewNotification(activity.originalData as NotificationType);
				break;
			case "calendar":
				handleViewEvent(activity.originalData);
				break;
		}
	};

	const currentTab = tabs.find((tab) => tab.value === activeTab);
	const isLoading =
		(activeTab === "movements" && movementsData.isLoader) ||
		(activeTab === "notifications" && notificationsData.isLoader) ||
		(activeTab === "calendar" && eventsData.isLoader) ||
		(activeTab === "combined" && (movementsData.isLoader || notificationsData.isLoader || eventsData.isLoader));

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
				{/* Vertical Tabs Section */}
				<Paper
					elevation={0}
					sx={{
						width: 240,
						borderRight: `1px solid ${theme.palette.divider}`,
						bgcolor: theme.palette.mode === "dark" ? alpha(theme.palette.background.paper, 0.8) : theme.palette.grey[50],
						display: "flex",
						flexDirection: "column",
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
							<Chip
								size="small"
								label={`${movementsData.movements?.length || 0} movimientos`}
								variant="outlined"
								sx={{ justifyContent: "flex-start" }}
							/>
							<Chip
								size="small"
								label={`${notificationsData.notifications?.length || 0} notificaciones`}
								variant="outlined"
								sx={{ justifyContent: "flex-start" }}
							/>
							<Chip
								size="small"
								label={`${eventsData.events?.length || 0} eventos`}
								variant="outlined"
								sx={{ justifyContent: "flex-start" }}
							/>
						</Stack>
					</Box>
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
								<Tooltip title="Filtros">
									<IconButton
										size="small"
										onClick={() => setShowFilters(!showFilters)}
										color={showFilters ? "primary" : "default"}
										sx={{
											transition: "all 0.3s ease",
											transform: showFilters ? "rotate(180deg)" : "rotate(0deg)",
										}}
									>
										<Filter />
									</IconButton>
								</Tooltip>
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
							<Paper elevation={0} sx={{ height: "100%", border: `1px solid ${theme.palette.divider}` }}>
								{activeTab === "movements" && (
									<MovementsTable
										movements={movementsData.movements}
										searchQuery={searchQuery}
										onEdit={handleEditMovement}
										onDelete={handleDeleteMovement}
										onView={handleViewMovement}
										filters={filters}
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
									<CombinedTable
										movements={movementsData.movements}
										notifications={notificationsData.notifications}
										events={eventsData.events}
										searchQuery={searchQuery}
										onEdit={handleCombinedEdit}
										onDelete={handleCombinedDelete}
										onView={handleCombinedView}
									/>
								)}
							</Paper>
						)}
					</Box>
				</Box>
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
					fullWidth
					open={!!viewMovementDetails}
					onClose={() => setViewMovementDetails(null)}
					TransitionComponent={PopupTransition}
				>
					<Box sx={{ p: 3 }}>
						<Typography variant="h5" gutterBottom>
							Detalles del Movimiento
						</Typography>
						<Stack spacing={2} sx={{ mt: 2 }}>
							<Box>
								<Typography variant="subtitle2" color="textSecondary">
									Título
								</Typography>
								<Typography variant="body1">{viewMovementDetails.title}</Typography>
							</Box>
							<Box>
								<Typography variant="subtitle2" color="textSecondary">
									Tipo
								</Typography>
								<Typography variant="body1">{viewMovementDetails.movement}</Typography>
							</Box>
							<Box>
								<Typography variant="subtitle2" color="textSecondary">
									Fecha
								</Typography>
								<Typography variant="body1">{viewMovementDetails.time}</Typography>
							</Box>
							{viewMovementDetails.description && (
								<Box>
									<Typography variant="subtitle2" color="textSecondary">
										Descripción
									</Typography>
									<Typography variant="body1">{viewMovementDetails.description}</Typography>
								</Box>
							)}
							{viewMovementDetails.dateExpiration && (
								<Box>
									<Typography variant="subtitle2" color="textSecondary">
										Fecha de Vencimiento
									</Typography>
									<Typography variant="body1">{viewMovementDetails.dateExpiration}</Typography>
								</Box>
							)}
						</Stack>
						<Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
							<Button onClick={() => setViewMovementDetails(null)}>Cerrar</Button>
						</Box>
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
								<Typography variant="body1">{viewNotificationDetails.time}</Typography>
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
									<Typography variant="body1">{viewNotificationDetails.dateExpiration}</Typography>
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
									{viewEventDetails.start ? format(parseISO(viewEventDetails.start), "dd/MM/yyyy HH:mm", { locale: es }) : "-"}
								</Typography>
							</Box>
							{viewEventDetails.end && (
								<Box>
									<Typography variant="subtitle2" color="textSecondary">
										Fecha de fin
									</Typography>
									<Typography variant="body1">{format(parseISO(viewEventDetails.end), "dd/MM/yyyy HH:mm", { locale: es })}</Typography>
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
		</MainCard>
	);
};

export default ActivityTables;

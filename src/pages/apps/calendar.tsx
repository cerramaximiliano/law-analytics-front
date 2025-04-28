import { useEffect, useRef, useState } from "react";

// material-ui
import { Theme, useTheme } from "@mui/material/styles";
import { 
	useMediaQuery, 
	Box, 
	Dialog, 
	SpeedDial, 
	Tooltip, 
	Typography,
	Button,
	Stack,
	IconButton,
	Divider,
	Grid,
	DialogTitle,
	DialogContent,
	DialogActions,
	List,
	ListItem,
	ListItemButton,
	ListItemIcon,
	ListItemText,
	Checkbox,
	CircularProgress,
} from "@mui/material";

// third-party
import FullCalendar from "@fullcalendar/react";
import { DateSelectArg, EventClickArg, EventDropArg, EventSourceInput } from "@fullcalendar/core";
import interactionPlugin, { EventResizeDoneArg } from "@fullcalendar/interaction";
import listPlugin from "@fullcalendar/list";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import timelinePlugin from "@fullcalendar/timeline";
import esLocale from "@fullcalendar/core/locales/es";
// project imports
import Loader from "components/Loader";
import { PopupTransition } from "components/@extended/Transitions";
import CalendarStyled from "sections/apps/calendar/CalendarStyled";
import Toolbar from "sections/apps/calendar/Toolbar";
import AddEventForm from "sections/apps/calendar/AddEventForm";
import { GuideCalendar } from "components/guides";

import {
	//getEvents,
	selectRange,
	updateCalendarView,
} from "store/reducers/calendar";

// types
import { Add, Calendar as CalendarIcon, Edit2, InfoCircle, Link1, Trash } from "iconsax-react";
import { dispatch, useSelector } from "store";
import { deleteEvent, getEventsByUserId, selectEvent, updateEvent } from "store/reducers/events";
import { openSnackbar } from "store/reducers/snackbar";

// Importación de eventos y carpetas types
import { Event } from "types/events";
import { Folder } from "types/folders";
import { getFoldersByUserId } from "store/reducers/folders";

// ==============================|| LINK FOLDERS MODAL ||============================== //

interface LinkFoldersModalProps {
	open: boolean;
	onClose: () => void;
	event: Event | null;
	onLink: (folderIds: string[], folders: Folder[]) => void;
	availableFolders: Folder[];
	loadingFolders: boolean;
}

const LinkFoldersModal = ({ open, onClose, event, onLink, availableFolders, loadingFolders }: LinkFoldersModalProps) => {
	const theme = useTheme();
	const [selectedFolders, setSelectedFolders] = useState<string[]>([]);
	
	// Si el evento ya está vinculado a una carpeta, pre-seleccionarla
	useEffect(() => {
		if (open && event?.folderId) {
			setSelectedFolders([event.folderId]);
		} else if (open) {
			setSelectedFolders([]);
		}
	}, [open, event]);
	
	const handleToggleFolder = (folderId: string) => {
		// Solo permitimos una carpeta seleccionada a la vez
		setSelectedFolders([folderId]);
	};
	
	const handleLinkFolders = () => {
		onLink(selectedFolders, availableFolders);
		onClose();
	};
	
	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="sm"
			fullWidth
			TransitionComponent={PopupTransition}
			sx={{ "& .MuiDialog-paper": { p: 0, bgcolor: "secondary.lighter" } }}
		>
			<DialogTitle
				sx={{
					bgcolor: theme.palette.primary.lighter,
					p: 3,
					borderBottom: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Stack direction="row" alignItems="center" spacing={1}>
						<Link1 size={24} color={theme.palette.primary.main} />
						<Typography variant="h5" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
							Vincular evento a carpetas
						</Typography>
					</Stack>
				</Stack>
			</DialogTitle>
			<DialogContent sx={{ p: 3 }}>
				{loadingFolders ? (
					<Box sx={{ display: 'flex', justifyContent: 'center', p: 3 }}>
						<CircularProgress />
					</Box>
				) : availableFolders.length === 0 ? (
					<Typography variant="body1" sx={{ textAlign: 'center', p: 3 }}>
						No hay carpetas disponibles para vincular. Cree una carpeta primero.
					</Typography>
				) : (
					<Box sx={{ mt: 2 }}>
						<Typography variant="subtitle1" gutterBottom>
							Seleccione una carpeta para vincular este evento:
						</Typography>
						<Typography variant="body2" color="error.main" gutterBottom>
							Nota: Sólo se permite vincular un evento a una única carpeta.
						</Typography>
						<List sx={{ width: '100%', bgcolor: 'background.paper' }}>
							{availableFolders.map((folder) => (
								<ListItem key={folder._id} disablePadding>
									<ListItemButton onClick={() => handleToggleFolder(folder._id)}>
										<ListItemIcon>
											<Checkbox
												edge="start"
												checked={selectedFolders.includes(folder._id)}
												tabIndex={-1}
												disableRipple
											/>
										</ListItemIcon>
										<ListItemText 
											primary={folder.folderName} 
											secondary={folder.description || `Estado: ${folder.status}`} 
										/>
									</ListItemButton>
								</ListItem>
							))}
						</List>
					</Box>
				)}
			</DialogContent>
			<DialogActions
				sx={{
					p: 2.5,
					bgcolor: theme.palette.background.default,
					borderTop: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Button color="error" onClick={onClose}>
					Cancelar
				</Button>
				<Button
					variant="contained"
					onClick={handleLinkFolders}
					disabled={loadingFolders || selectedFolders.length === 0}
				>
					Vincular
				</Button>
			</DialogActions>
		</Dialog>
	);
};

// ==============================|| CALENDAR - MAIN ||============================== //


// Tipos de props para EventDetailsView
interface EventDetailsViewProps {
	event: Event | null | undefined;
	onClose: () => void;
	onEdit: () => void;
	onLink: () => void;
	onDelete: () => void;
}

// Componente para la visualización detallada de un evento
const EventDetailsView = ({ event, onClose, onEdit, onLink, onDelete }: EventDetailsViewProps) => {
	const theme = useTheme();
	const eventType = event?.type || "";
	
	// Mapeo de tipos a etiquetas en español
	const eventTypeLabels: Record<string, string> = {
		audiencia: "Audiencia",
		vencimiento: "Vencimiento",
		reunion: "Reunión",
		otro: "Otro"
	};
	
	// Obtener el tipo formateado en español
	const formattedType = eventTypeLabels[eventType as keyof typeof eventTypeLabels] || eventType;
	
	// Formatear fechas para mostrar
	const formatDate = (date: Date | string | undefined): string => {
		if (!date) return "";
		const d = new Date(date);
		return d.toLocaleString('es-ES', { 
			day: '2-digit', 
			month: '2-digit', 
			year: 'numeric', 
			hour: '2-digit', 
			minute: '2-digit'
		});
	};
	
	return (
		<>
			<DialogTitle
				sx={{
					bgcolor: theme.palette.primary.lighter,
					p: 3,
					borderBottom: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Stack direction="row" justifyContent="space-between" alignItems="center">
					<Stack direction="row" alignItems="center" spacing={1}>
						<CalendarIcon size={24} color={theme.palette.primary.main} />
						<Typography variant="h5" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
							Detalles del Evento
						</Typography>
					</Stack>
				</Stack>
			</DialogTitle>
			<Divider />
			<DialogContent
				sx={{
					p: 3,
					display: "flex",
					flexDirection: "column",
					gap: 3,
				}}
			>
				<Box sx={{ mb: 2 }}>
					<Typography variant="h4" gutterBottom>{event?.title}</Typography>
					
					<Grid container spacing={2} sx={{ mt: 2 }}>
						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="textSecondary">Tipo:</Typography>
							<Typography variant="body1" sx={{ mb: 1 }}>
								<Box component="span" sx={{ 
									display: 'inline-block', 
									width: 12, 
									height: 12, 
									borderRadius: '50%', 
									backgroundColor: event?.color || '#1890ff',
									mr: 1
								}}/>
								{formattedType}
							</Typography>
						</Grid>
						
						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="textSecondary">Duración:</Typography>
							<Typography variant="body1" sx={{ mb: 1 }}>
								{event?.allDay ? 'Todo el día' : 'Hora específica'}
							</Typography>
						</Grid>
						
						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="textSecondary">Fecha de inicio:</Typography>
							<Typography variant="body1" sx={{ mb: 1 }}>{formatDate(event?.start)}</Typography>
						</Grid>
						
						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="textSecondary">Fecha de finalización:</Typography>
							<Typography variant="body1" sx={{ mb: 1 }}>{formatDate(event?.end)}</Typography>
						</Grid>
						
						{event?.description && (
							<Grid item xs={12}>
								<Typography variant="subtitle2" color="textSecondary">Descripción:</Typography>
								<Typography variant="body1" sx={{ mb: 1, whiteSpace: 'pre-wrap' }}>
									{event.description}
								</Typography>
							</Grid>
						)}
						
						{event?.folderName && (
							<Grid item xs={12}>
								<Typography variant="subtitle2" color="textSecondary">Carpeta:</Typography>
								<Typography variant="body1" sx={{ mb: 1 }}>
									{event.folderName}
								</Typography>
							</Grid>
						)}
					</Grid>
				</Box>
			</DialogContent>
			<Divider />
			<DialogActions
				sx={{
					p: 2.5,
					bgcolor: theme.palette.background.default,
					borderTop: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Grid container justifyContent="space-between" alignItems="center">
					<Grid item>
						<Tooltip title="Eliminar Evento" placement="top">
							<IconButton onClick={onDelete} size="large" color="error">
								<Trash variant="Bold" />
							</IconButton>
						</Tooltip>
						<Tooltip title="Vincular Evento" placement="top">
							<IconButton onClick={onLink} size="large" color="primary" sx={{ ml: 1 }}>
								<Link1 variant="Bold" />
							</IconButton>
						</Tooltip>
					</Grid>
					<Grid item>
						<Stack direction="row" spacing={2} alignItems="center">
							<Button color="error" onClick={onClose}>
								Cerrar
							</Button>
							<Button
								variant="contained"
								startIcon={<Edit2 />}
								onClick={onEdit}
							>
								Editar
							</Button>
						</Stack>
					</Grid>
				</Grid>
			</DialogActions>
		</>
	);
};

const Calendar = () => {
	const matchDownSM = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

	const [loading, setLoading] = useState<boolean>(true);
	const [guideOpen, setGuideOpen] = useState<boolean>(false);
	const [localModalOpen, setLocalModalOpen] = useState(false);
	const [isEditingEvent, setIsEditingEvent] = useState(false);
	const [isViewingEvent, setIsViewingEvent] = useState(false);
	const [linkFoldersOpen, setLinkFoldersOpen] = useState(false);
	
	// Estado para las carpetas disponibles
	const [availableFolders, setAvailableFolders] = useState<Folder[]>([]);
	const [loadingFolders, setLoadingFolders] = useState<boolean>(false);

	const { calendarView, selectedRange } = useSelector((state) => state.calendar);
	const { events } = useSelector((state) => state.events);

	const auth = useSelector((state) => state.auth);
	const id = auth.user?._id;

	// Componente autónomo para manejar el modal
	const selectedEvent = useSelector((state) => {
		const { selectedEventId } = state.events;
		const { events } = state.events;
		if (selectedEventId) {
			const found = events.find((event) => event._id === selectedEventId);
			return found;
		}
		return null;
	});

	useEffect(() => {
		if (id && id !== "undefined") {
			const fetchData = async () => {
				setLoading(true);
				try {
					await dispatch(getEventsByUserId(id));
					setLoading(false);
				} catch (error) {
					console.error(error);
				}
			};
			fetchData();
		}
	}, [id, dispatch]);

	useEffect(() => {
		const calendarEl = calendarRef.current;
		if (calendarEl) {
			const calendarApi = calendarEl.getApi();
			const newView = matchDownSM ? "listWeek" : "dayGridMonth";
			calendarApi.changeView(newView);
			dispatch(updateCalendarView(newView));
		}

		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [matchDownSM]);

	const calendarRef = useRef<FullCalendar>(null);

	const [date, setDate] = useState(new Date());

	// calendar toolbar events
	const handleDateToday = () => {
		const calendarEl = calendarRef.current;

		if (calendarEl) {
			const calendarApi = calendarEl.getApi();

			calendarApi.today();
			setDate(calendarApi.getDate());
		}
	};

	const handleViewChange = (newView: string) => {
		const calendarEl = calendarRef.current;
		if (calendarEl) {
			const calendarApi = calendarEl.getApi();

			calendarApi.changeView(newView);
			dispatch(updateCalendarView(newView));
		}
	};

	const handleDatePrev = () => {
		const calendarEl = calendarRef.current;

		if (calendarEl) {
			const calendarApi = calendarEl.getApi();

			calendarApi.prev();
			setDate(calendarApi.getDate());
		}
	};

	const handleDateNext = () => {
		const calendarEl = calendarRef.current;

		if (calendarEl) {
			const calendarApi = calendarEl.getApi();

			calendarApi.next();
			setDate(calendarApi.getDate());
		}
	};

	// calendar events
	const handleRangeSelect = (arg: DateSelectArg) => {
		const calendarEl = calendarRef.current;
		if (calendarEl) {
			const calendarApi = calendarEl.getApi();
			calendarApi.unselect();
		}

		// Al seleccionar un rango de fechas para crear un nuevo evento
		setIsEditingEvent(false);
		setIsViewingEvent(false);
		dispatch(selectEvent(null));
		dispatch(selectRange(arg.start, arg.end));
		setLocalModalOpen(true);
	};

	const handleEventSelect = (arg: EventClickArg) => {
		// Cuando se selecciona un evento existente, ahora lo mostramos en vista de detalles
		const eventId = arg.event.extendedProps?._id || arg.event.id;
		console.log("Event selected for viewing:", eventId, arg.event);
		setIsEditingEvent(false);
		setIsViewingEvent(true);
		dispatch(selectEvent(eventId));
		setLocalModalOpen(true);
	};

	const handleEventUpdate = async ({ event }: EventResizeDoneArg | EventDropArg) => {
		try {
			const eventId = event.extendedProps?._id || event.id;
			dispatch(
				updateEvent(eventId, {
					allDay: event.allDay,
					start: event.start ? new Date(event.start) : undefined,
					end: event.end ? new Date(event.end) : undefined,
				}),
			);
		} catch (error) {
			console.error(error);
		}
	};

	const handleModalClose = () => {
		setLocalModalOpen(false);
		setIsViewingEvent(false);
		setIsEditingEvent(false);
		dispatch(selectEvent(null));
	};

	const handleAddEventClick = () => {
		setIsEditingEvent(false);
		setIsViewingEvent(false);
		dispatch(selectEvent(null));
		setLocalModalOpen(true);
	};
	
	const handleSwitchToEditMode = () => {
		setIsViewingEvent(false);
		setIsEditingEvent(true);
	};
	
	const handleDeleteEvent = () => {
		if (selectedEvent?._id) {
			dispatch(deleteEvent(selectedEvent._id));
			dispatch(
				openSnackbar({
					open: true,
					message: "Evento eliminado correctamente.",
					variant: "alert",
					alert: {
						color: "success",
					},
					close: false,
				}),
			);
			handleModalClose();
		}
	};
	
	const handleLinkEvent = () => {
		// Cargar las carpetas antes de abrir el modal
		const loadFolders = async () => {
			if (id) {
				setLoadingFolders(true);
				try {
					const result = await dispatch(getFoldersByUserId(id));
					if (result && result.success) {
						setAvailableFolders(result.folders);
					}
				} catch (error) {
					console.error("Error al cargar carpetas:", error);
					dispatch(
						openSnackbar({
							open: true,
							message: "Error al cargar las carpetas.",
							variant: "alert",
							alert: {
								color: "error",
							},
							close: true,
						}),
					);
				} finally {
					setLoadingFolders(false);
				}
			}
		};
		
		loadFolders();
		// Abre el modal de vinculación
		setLinkFoldersOpen(true);
	};
	
	const handleLinkFolders = async (folderIds: string[], folders: Folder[]) => {
		if (selectedEvent?._id) {
			try {
				// Obtiene el ID de la carpeta seleccionada (solo una)
				const folderId = folderIds.length > 0 ? folderIds[0] : null;
				
				// Obtiene el nombre de la carpeta de la lista de carpetas proporcionada
				let folderName = "";
				if (folderId) {
					const folder = folders.find(f => f._id === folderId);
					folderName = folder?.folderName || "";
				}
				
				// Actualiza el evento con la nueva vinculación
				await dispatch(
					updateEvent(selectedEvent._id, {
						allDay: selectedEvent.allDay,
						start: selectedEvent.start,
						end: selectedEvent.end,
						title: selectedEvent.title,
						description: selectedEvent.description,
						type: selectedEvent.type,
						folderId: folderId || undefined,
						folderName
					})
				);
				
				dispatch(
					openSnackbar({
						open: true,
						message: "Evento vinculado correctamente.",
						variant: "alert",
						alert: {
							color: "success",
						},
						close: true,
					}),
				);
			} catch (error) {
				console.error("Error al vincular evento:", error);
				dispatch(
					openSnackbar({
						open: true,
						message: "Error al vincular el evento.",
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

	if (loading) return <Loader />;

	// Preprocesar los eventos para asegurarnos de que tengan el formato correcto
	const formattedEvents = events.map(event => ({
		id: event._id,
		title: event.title,
		start: event.start,
		end: event.end,
		allDay: event.allDay,
		color: event.color,
		extendedProps: {
			description: event.description,
			_id: event._id,
			type: event.type,
			folderId: event.folderId,
			folderName: event.folderName
		}
	}));

	return (
		<Box sx={{ position: "relative" }}>
			<CalendarStyled>
				<Toolbar
					date={date}
					view={calendarView}
					onClickNext={handleDateNext}
					onClickPrev={handleDatePrev}
					onClickToday={handleDateToday}
					onChangeView={handleViewChange}
				/>

				<FullCalendar
					weekends
					editable
					droppable
					selectable
					events={formattedEvents as EventSourceInput}
					ref={calendarRef}
					rerenderDelay={10}
					initialDate={date}
					initialView={calendarView}
					dayMaxEventRows={3}
					eventDisplay="block"
					headerToolbar={false}
					allDayMaintainDuration
					eventResizableFromStart
					select={handleRangeSelect}
					eventDrop={handleEventUpdate}
					eventClick={handleEventSelect}
					eventResize={handleEventUpdate}
					locale={esLocale}
					height={matchDownSM ? "auto" : 720}
					plugins={[listPlugin, dayGridPlugin, timelinePlugin, timeGridPlugin, interactionPlugin]}
					noEventsContent={
						<Box 
							sx={{ 
								display: 'flex', 
								flexDirection: 'column', 
								alignItems: 'center', 
								justifyContent: 'center', 
								height: '100%', 
								p: 3 
							}}
						>
							<Typography variant="h5" color="textSecondary" sx={{ mb: 1 }}>
								No hay eventos programados
							</Typography>
							<Typography variant="body2" color="textSecondary">
								Haga clic en un día para agregar un nuevo evento o use el botón "+" para crear uno rápidamente.
							</Typography>
						</Box>
					}
				/>
			</CalendarStyled>

			{/* Dialog manejado localmente */}
			<Dialog
				maxWidth="sm"
				TransitionComponent={PopupTransition}
				fullWidth
				onClose={handleModalClose}
				open={localModalOpen}
				sx={{ "& .MuiDialog-paper": { p: 0, bgcolor: "secondary.lighter" } }}
			>
				{isViewingEvent ? (
					<EventDetailsView 
						event={selectedEvent} 
						onClose={handleModalClose} 
						onEdit={handleSwitchToEditMode}
						onDelete={handleDeleteEvent}
						onLink={handleLinkEvent}
					/>
				) : (
					<AddEventForm 
						event={isEditingEvent ? selectedEvent : null} 
						range={selectedRange} 
						onCancel={handleModalClose} 
					/>
				)}
			</Dialog>
			<Tooltip title="Agregar Nuevo Evento">
				<SpeedDial
					ariaLabel="add-event-fab"
					sx={{
						display: "inline-flex",
						position: "sticky",
						bottom: 24,
						left: "100%",
						transform: "translate(-50%, -50% )",
					}}
					icon={<Add />}
					onClick={handleAddEventClick}
				/>
			</Tooltip>
			
			<Tooltip title="Ver Guía">
				<SpeedDial
					ariaLabel="guide-fab"
					sx={{
						display: "inline-flex",
						position: "fixed",
						bottom: 24,
						right: 24,
						transform: "translate(0, 0)",
					}}
					icon={<InfoCircle variant="Bold" />}
					onClick={() => setGuideOpen(true)}
				/>
			</Tooltip>

			{/* Guía del Calendario */}
			<GuideCalendar open={guideOpen} onClose={() => setGuideOpen(false)} />
			
			{/* Modal para vincular evento a carpetas */}
			<LinkFoldersModal 
				open={linkFoldersOpen}
				onClose={() => setLinkFoldersOpen(false)}
				event={selectedEvent || null}
				onLink={handleLinkFolders}
				availableFolders={availableFolders}
				loadingFolders={loadingFolders}
			/>
		</Box>
	);
};

export default Calendar;
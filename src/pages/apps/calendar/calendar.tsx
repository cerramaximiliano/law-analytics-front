import React from "react";
import { useEffect, useRef, useState } from "react";
import axios from "axios";

// material-ui
import { Theme, useTheme } from "@mui/material/styles";
import {
	useMediaQuery,
	Box,
	Dialog,
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
	Skeleton,
	Card,
	Paper,
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
import { format } from "date-fns";
import { es } from "date-fns/locale";
// project imports
import Loader from "components/Loader";
import { PopupTransition } from "components/@extended/Transitions";
import CalendarStyled from "sections/apps/calendar/CalendarStyled";
import AddEventForm from "sections/apps/calendar/AddEventForm";
import GoogleCalendarSync from "sections/apps/calendar/GoogleCalendarSync";
import { GuideCalendar } from "components/guides";

import {
	//getEvents,
	selectRange,
	updateCalendarView,
} from "store/reducers/calendar";

// types
import { Add, Calendar as CalendarIcon, Edit2, InfoCircle, Link1, Trash, ArrowLeft2, ArrowRight2, Calendar1, Category, Grid6 } from "iconsax-react";
import { dispatch, useSelector } from "store";
import { addBatchEvents, deleteEvent, getEventsByUserId, selectEvent, updateEvent } from "store/reducers/events";
import { openSnackbar } from "store/reducers/snackbar";

// Importación de eventos y carpetas types
import { Event } from "types/events";
import { Folder } from "types/folders";
import { getFoldersByUserId } from "store/reducers/folder";
import googleCalendarService from "services/googleCalendarService";

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
					<Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
						<CircularProgress />
					</Box>
				) : availableFolders.length === 0 ? (
					<Typography variant="body1" sx={{ textAlign: "center", p: 3 }}>
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
						<List sx={{ width: "100%", bgcolor: "background.paper" }}>
							{availableFolders.map((folder) => (
								<ListItem key={folder._id} disablePadding>
									<ListItemButton onClick={() => handleToggleFolder(folder._id)}>
										<ListItemIcon>
											<Checkbox edge="start" checked={selectedFolders.includes(folder._id)} tabIndex={-1} disableRipple />
										</ListItemIcon>
										<ListItemText primary={folder.folderName} secondary={folder.description || `Estado: ${folder.status}`} />
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
				<Button variant="contained" onClick={handleLinkFolders} disabled={loadingFolders || selectedFolders.length === 0}>
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
		otro: "Otro",
		google: "Google Calendar",
	};

	// Obtener el tipo formateado en español
	const formattedType = eventTypeLabels[eventType as keyof typeof eventTypeLabels] || eventType;

	// Formatear fechas para mostrar
	const formatDate = (date: Date | string | undefined): string => {
		if (!date) return "";
		const d = new Date(date);
		return d.toLocaleString("es-ES", {
			day: "2-digit",
			month: "2-digit",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
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
					<Typography variant="h4" gutterBottom>
						{event?.title}
					</Typography>

					<Grid container spacing={2} sx={{ mt: 2 }}>
						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="textSecondary">
								Tipo:
							</Typography>
							<Typography variant="body1" sx={{ mb: 1 }}>
								<Box
									component="span"
									sx={{
										display: "inline-block",
										width: 12,
										height: 12,
										borderRadius: "50%",
										backgroundColor: event?.color || "#1890ff",
										mr: 1,
									}}
								/>
								{formattedType}
							</Typography>
						</Grid>

						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="textSecondary">
								Duración:
							</Typography>
							<Typography variant="body1" sx={{ mb: 1 }}>
								{event?.allDay ? "Todo el día" : "Hora específica"}
							</Typography>
						</Grid>

						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="textSecondary">
								Fecha de inicio:
							</Typography>
							<Typography variant="body1" sx={{ mb: 1 }}>
								{formatDate(event?.start)}
							</Typography>
						</Grid>

						<Grid item xs={12} md={6}>
							<Typography variant="subtitle2" color="textSecondary">
								Fecha de finalización:
							</Typography>
							<Typography variant="body1" sx={{ mb: 1 }}>
								{formatDate(event?.end)}
							</Typography>
						</Grid>

						{event?.description && (
							<Grid item xs={12}>
								<Typography variant="subtitle2" color="textSecondary">
									Descripción:
								</Typography>
								<Typography variant="body1" sx={{ mb: 1, whiteSpace: "pre-wrap" }}>
									{event.description}
								</Typography>
							</Grid>
						)}

						{event?.folderName && (
							<Grid item xs={12}>
								<Typography variant="subtitle2" color="textSecondary">
									Carpeta:
								</Typography>
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
							<Button variant="contained" startIcon={<Edit2 />} onClick={onEdit}>
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
	const { isConnected: isGoogleConnected } = useSelector((state) => state.googleCalendar);

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
				} catch (error) {}
			};
			fetchData();
		}
	}, [id, dispatch]);

	// Recargar eventos cuando cambie el estado de conexión de Google Calendar
	useEffect(() => {
		// Solo recargar si hay un userId válido y Google Calendar se acaba de desconectar
		if (id && id !== "undefined" && !isGoogleConnected) {
			// Pequeño delay para asegurar que el backend completó la eliminación
			const timer = setTimeout(() => {
				dispatch(getEventsByUserId(id));
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [isGoogleConnected, id, dispatch]);

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
		} catch (error) {}
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

	const handleDeleteEvent = async () => {
		if (selectedEvent?._id) {
			let googleIdToDelete = selectedEvent.googleCalendarId;
			
			// Si no tiene googleCalendarId pero está autenticado, intentar buscarlo
			if (!googleIdToDelete && googleCalendarService.isSignedIn && selectedEvent.title && selectedEvent.start) {
				googleIdToDelete = await googleCalendarService.findGoogleEventByTitleAndDate(
					selectedEvent.title,
					new Date(selectedEvent.start)
				);
				
				if (googleIdToDelete) {
					// Opcionalmente, actualizar la BD con el ID encontrado
					try {
						const baseUrl = import.meta.env.VITE_BASE_URL || 'http://localhost:5000';
						await axios.patch(
							`${baseUrl}/api/events/${selectedEvent._id}/google-id`,
							{ googleCalendarId: googleIdToDelete },
							{
								headers: {
									'Content-Type': 'application/json',
									'Authorization': `Bearer ${localStorage.getItem('token')}`
								}
							}
						);
					} catch (err) {
						// Ignorar errores de actualización, no son críticos
					}
				}
			}
			
			// Si tenemos un ID de Google (original o encontrado), eliminarlo
			let googleDeleteSuccess = true;
			let googleDeleteMessage = "";
			
			if (googleIdToDelete && googleCalendarService.isSignedIn) {
				try {
					await googleCalendarService.deleteEvent(googleIdToDelete);
					console.log("Evento eliminado de Google Calendar exitosamente");
				} catch (error: any) {
					// Solo marcar como fallo si no es porque el evento ya fue eliminado
					if (error?.status !== 404 && error?.status !== 410) {
						console.error("Error eliminando de Google Calendar:", error);
						googleDeleteSuccess = false;
						googleDeleteMessage = " (No se pudo eliminar de Google Calendar)";
					}
					// Continuar con la eliminación local aunque falle en Google
				}
			} else if (googleIdToDelete && !googleCalendarService.isSignedIn) {
				// Tiene ID de Google pero no está conectado
				googleDeleteSuccess = false;
				googleDeleteMessage = " (Conecta Google Calendar para eliminar también de Google)";
			}
			
			// Eliminar de la base de datos local
			dispatch(deleteEvent(selectedEvent._id));
			
			// Mensaje diferenciado según el resultado
			const message = googleDeleteSuccess 
				? "Evento eliminado correctamente." 
				: `Evento eliminado localmente${googleDeleteMessage}`;
			
			const alertColor = googleDeleteSuccess ? "success" : "warning";
			
			dispatch(
				openSnackbar({
					open: true,
					message,
					variant: "alert",
					alert: {
						color: alertColor,
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
					const folder = folders.find((f) => f._id === folderId);
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
						folderName,
					}),
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

	// Componente de Skeleton para el calendario
	if (loading) {
		return (
			<Box sx={{ position: "relative" }}>
				<CalendarStyled>
					{/* Skeleton para barra superior integrada */}
					<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2 }}>
						{/* Skeleton para Google Calendar Sync */}
						<Box sx={{ maxWidth: { xs: '200px', sm: '300px', md: '400px' } }}>
							<Skeleton variant="rectangular" height={36} sx={{ borderRadius: 1 }} />
						</Box>
						
						{/* Skeleton para controles del calendario */}
						<Stack direction="row" alignItems="center" spacing={1}>
							<Skeleton variant="circular" width={28} height={28} />
							<Skeleton variant="circular" width={28} height={28} />
							<Skeleton variant="circular" width={28} height={28} />
							<Skeleton variant="text" width={150} height={28} sx={{ mx: 2 }} />
						</Stack>
						
						{/* Skeleton para botones de vista y acciones */}
						<Stack direction="row" spacing={1} alignItems="center">
							<Stack direction="row" spacing={0.5}>
								<Skeleton variant="circular" width={28} height={28} />
								<Skeleton variant="circular" width={28} height={28} />
								<Skeleton variant="circular" width={28} height={28} />
							</Stack>
							<Skeleton variant="rectangular" width={1} height={24} sx={{ mx: 1 }} />
							<Skeleton variant="circular" width={40} height={40} />
							<Skeleton variant="circular" width={40} height={40} />
						</Stack>
					</Stack>
					
					{/* Skeleton para FullCalendar */}
					<Card sx={{ overflow: 'hidden' }}>
						<Box sx={{ p: 2 }}>
							{/* Encabezados de días de la semana */}
							<Grid container sx={{ mb: 1, pb: 1, borderBottom: '1px solid', borderColor: 'divider' }}>
								{['Domingo', 'Lunes', 'Martes', 'Miércoles', 'Jueves', 'Viernes', 'Sábado'].map((day) => (
									<Grid item xs key={day} sx={{ textAlign: 'center' }}>
										<Typography variant="subtitle2" color="text.secondary">
											{matchDownSM ? day.substring(0, 3) : day}
										</Typography>
									</Grid>
								))}
							</Grid>
							
							{/* Grid del calendario - 5 semanas típicamente */}
							<Grid container>
								{Array.from({ length: 35 }, (_, i) => (
									<Grid 
										item 
										xs={1.714} 
										key={i} 
										sx={{ 
											border: '1px solid',
											borderColor: 'divider',
											minHeight: matchDownSM ? 60 : 80,
											p: 0.5
										}}
									>
										{/* Número del día */}
										<Skeleton variant="text" width={25} height={20} sx={{ mb: 0.5 }} />
										
										{/* Eventos simulados */}
										{i % 3 === 0 && (
											<Skeleton 
												variant="rectangular" 
												height={18} 
												sx={{ 
													mb: 0.5, 
													borderRadius: 0.5,
													bgcolor: 'primary.lighter'
												}} 
											/>
										)}
										{i % 7 === 0 && (
											<Skeleton 
												variant="rectangular" 
												height={18} 
												sx={{ 
													mb: 0.5, 
													borderRadius: 0.5,
													bgcolor: 'secondary.lighter'
												}} 
											/>
										)}
										{i % 5 === 0 && i % 3 !== 0 && (
											<Skeleton 
												variant="rectangular" 
												height={18} 
												sx={{ 
													borderRadius: 0.5,
													bgcolor: 'success.lighter'
												}} 
											/>
										)}
									</Grid>
								))}
							</Grid>
						</Box>
					</Card>
				</CalendarStyled>
			</Box>
		);
	}

	// Preprocesar los eventos para asegurarnos de que tengan el formato correcto
	const formattedEvents = events.map((event) => ({
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
			folderName: event.folderName,
		},
	}));

	// Función para manejar eventos importados de Google Calendar
	const handleEventsImported = async (importedEvents: any[]) => {
		if (!id || id === "undefined") return;

		console.log("📥 Eventos recibidos para importar:", {
			total: importedEvents?.length || 0,
			primerosEventos: importedEvents?.slice(0, 5).map(e => ({
				title: e.title,
				start: e.start,
				googleId: e.googleCalendarId || e.id,
				allDay: e.allDay
			}))
		});

		const totalEvents = importedEvents.length;

		// Mostrar mensaje de inicio
		dispatch(
			openSnackbar({
				open: true,
				message: `Preparando importación de ${totalEvents} evento(s) de Google Calendar...`,
				variant: "alert",
				alert: {
					color: "info",
				},
				close: false,
			}),
		);

		// Filtrar eventos que ya existen localmente antes de intentar crearlos
		const existingGoogleIds = new Set(events.filter((e) => e.googleCalendarId).map((e) => e.googleCalendarId));

		// Preparar solo eventos que no existen localmente
		const eventsToCreate: Event[] = importedEvents
			.filter((googleEvent) => {
				const googleId = googleEvent.googleCalendarId || googleEvent.id;
				// Filtrar si ya existe por googleCalendarId
				if (googleId && existingGoogleIds.has(googleId)) {
					console.log(`Evento omitido (ya existe): ${googleEvent.title}`);
					return false;
				}
				return true;
			})
			.map((googleEvent) => ({
				title: googleEvent.title || "Sin título",
				description: googleEvent.description || "",
				type: "google", // Tipo específico para eventos de Google Calendar
				color: googleEvent.color || "#4285f4", // Color azul de Google
				allDay: googleEvent.allDay || false,
				start: googleEvent.start,
				end: googleEvent.end || googleEvent.start,
				googleCalendarId: googleEvent.googleCalendarId || googleEvent.id,
				userId: id, // Agregar el userId del contexto
			}));

		// Si todos los eventos ya existen, informar al usuario
		if (eventsToCreate.length === 0 && importedEvents.length > 0) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Todos los eventos ya están sincronizados",
					variant: "alert",
					alert: {
						color: "info",
					},
					close: true,
				}),
			);
			return;
		}

		// Callback para mostrar progreso
		const handleProgress = (processed: number, total: number) => {
			const percentage = Math.round((processed / total) * 100);
			dispatch(
				openSnackbar({
					open: true,
					message: `Importando eventos... ${processed}/${total} (${percentage}%)`,
					variant: "alert",
					alert: {
						color: "info",
					},
					close: false,
				}),
			);
		};

		// Procesar todos los eventos usando el endpoint batch optimizado
		// El addBatchEvents ahora maneja automáticamente:
		// - Lotes de hasta 100 eventos
		// - Retry con backoff exponencial
		// - Respeto del header Retry-After
		// - Fallback a creación individual si es necesario
		const result = await dispatch(addBatchEvents(eventsToCreate, handleProgress));

		// Mostrar mensaje de resultado final
		const { successCount = 0, errorCount = 0 } = result;

		if (successCount > 0 || errorCount > 0) {
			let message = "";
			let color: "success" | "warning" | "error" = "success";

			if (successCount > 0 && errorCount === 0) {
				message = `✓ Importación completada: ${successCount} evento(s) importado(s) exitosamente`;
				color = "success";
			} else if (successCount > 0 && errorCount > 0) {
				message = `Importación parcial: ${successCount} exitoso(s), ${errorCount} error(es)`;
				color = "warning";
			} else {
				message = `Error en la importación: No se pudieron importar ${errorCount} evento(s)`;
				color = "error";
			}

			dispatch(
				openSnackbar({
					open: true,
					message,
					variant: "alert",
					alert: {
						color,
					},
					close: true,
				}),
			);

			// Recargar eventos después de la importación
			if (successCount > 0) {
				dispatch(getEventsByUserId(id));
			}
		} else {
			dispatch(
				openSnackbar({
					open: true,
					message: "No se encontraron eventos para importar",
					variant: "alert",
					alert: {
						color: "info",
					},
					close: true,
				}),
			);
		}
	};

	return (
		<Box sx={{ position: "relative" }}>
			<CalendarStyled>
				{/* Barra superior integrada con todas las funciones */}
				<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={2} sx={{ mb: 2 }}>
					{/* Google Calendar Sync Component - Lado izquierdo */}
					<Box sx={{ maxWidth: { xs: '200px', sm: '300px', md: '400px' } }}>
						<GoogleCalendarSync localEvents={events} onEventsImported={handleEventsImported} />
					</Box>
					
					{/* Controles del calendario - Centro */}
					<Stack direction="row" alignItems="center" spacing={1}>
						<IconButton onClick={handleDatePrev} size="small">
							<ArrowLeft2 size={18} />
						</IconButton>
						<IconButton onClick={handleDateNext} size="small">
							<ArrowRight2 size={18} />
						</IconButton>
						<Tooltip title="Ir a hoy">
							<IconButton color="primary" onClick={handleDateToday} size="small">
								<Calendar1 size={18} variant="Bulk" />
							</IconButton>
						</Tooltip>
						<Typography variant={matchDownSM ? "h6" : "h5"} color="textPrimary" sx={{ fontWeight: 600, mx: 2 }}>
							{format(date, "MMMM yyyy", { locale: es })}
						</Typography>
					</Stack>
					
					{/* Botones de vista y acciones - Lado derecho */}
					<Stack direction="row" spacing={1} alignItems="center">
						{/* Botones de vista */}
						<Stack direction="row" spacing={0.5}>
							{[
								{ label: "Mes", value: "dayGridMonth", icon: Category },
								{ label: "Semana", value: "timeGridWeek", icon: Grid6 },
								{ label: "Día", value: "timeGridDay", icon: Calendar1 }
							].filter(item => !matchDownSM || (item.value !== "dayGridMonth" && item.value !== "timeGridWeek"))
							.map((viewOption) => {
								const Icon = viewOption.icon;
								const isActive = viewOption.value === calendarView;
								return (
									<Tooltip title={viewOption.label} key={viewOption.value}>
										<IconButton
											color={isActive ? "primary" : "default"}
											size="small"
											onClick={() => handleViewChange(viewOption.value)}
										>
											<Icon size={18} variant={isActive ? "Bulk" : "Linear"} />
										</IconButton>
									</Tooltip>
								);
							})}
						</Stack>
						
						<Divider orientation="vertical" flexItem sx={{ mx: 1 }} />
						
						{/* Botones de acción */}
						<Tooltip title="Agregar Nuevo Evento">
							<IconButton color="primary" onClick={handleAddEventClick} size="medium">
								<Add variant="Bulk" />
							</IconButton>
						</Tooltip>
						<Tooltip title="Ver Guía">
							<IconButton color="success" onClick={() => setGuideOpen(true)} size="medium">
								<InfoCircle variant="Bulk" />
							</IconButton>
						</Tooltip>
					</Stack>
				</Stack>

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
						height="auto"
						contentHeight="auto"
						aspectRatio={matchDownSM ? 1.2 : 2.1}
						fixedWeekCount={false}
						showNonCurrentDates={false}
						plugins={[listPlugin, dayGridPlugin, timelinePlugin, timeGridPlugin, interactionPlugin]}
					noEventsContent={
						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								height: "100%",
								p: 3,
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
				maxWidth="md"
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
					<AddEventForm event={isEditingEvent ? selectedEvent : null} range={selectedRange} onCancel={handleModalClose} userId={id} />
				)}
			</Dialog>

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

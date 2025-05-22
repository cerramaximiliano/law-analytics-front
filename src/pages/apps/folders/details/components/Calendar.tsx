import { Box, Skeleton, CardContent, IconButton, Typography, Dialog, Tooltip, Stack } from "@mui/material";
import { Trash, Edit2, Eye, Add, CalendarRemove } from "iconsax-react";
import MainCard from "components/MainCard";
import { PopupTransition } from "components/@extended/Transitions";
import {
	toggleModal,
	//updateCalendarView
} from "store/reducers/calendar";
import AddEventFrom from "sections/apps/calendar/AddEventForm";
import CalendarStyled from "sections/apps/calendar/CalendarStyled";
import FullCalendar from "@fullcalendar/react";
import esLocale from "@fullcalendar/core/locales/es";
import listPlugin from "@fullcalendar/list";
import dayGridPlugin from "@fullcalendar/daygrid";
import timeGridPlugin from "@fullcalendar/timegrid";
import { useSelector, dispatch } from "store";
import { useCallback, useEffect, useRef, useState } from "react";
import CalendarToolbar from "./CalendarToolbar";
import SimpleBar from "components/third-party/SimpleBar";
import { useParams } from "react-router";
import { getEventsById, deleteEvent, selectEvent } from "store/reducers/events";
import { openSnackbar } from "store/reducers/snackbar";
import { EventContentArg } from "@fullcalendar/core";
import { parseISO, format } from "date-fns";
import EmptyStateCard from "components/EmptyStateCard";

interface CalendarProps {
	title: string;
	folderName: string;
}

const Calendar: React.FC<CalendarProps> = ({ title, folderName }) => {
	const [isLoading, setIsLoading] = useState(true);
	const [expandedEventId, setExpandedEventId] = useState<string | null>(null);

	const handleModal = () => {
		if (isLoading) return;
		dispatch(toggleModal());
		dispatch(selectEvent(null)); // Limpiar el evento seleccionado para crear uno nuevo
	};

	const { id } = useParams<{ id: string }>();

	const { selectedRange, isModalOpen } = useSelector((state) => state.calendar);
	const [date, setDate] = useState(new Date());
	const calendarRef = useRef<FullCalendar>(null);

	const renderEventContent = (eventInfo: EventContentArg) => {
		const _id = eventInfo.event._def.extendedProps._id;

		const formatDate = (date: string | Date | null | undefined) => {
			if (!date) return "No especificado";

			let parsedDate: Date;

			if (typeof date === "string") {
				try {
					parsedDate = parseISO(date); // Convierte cadenas a objetos Date
				} catch {
					return "Fecha inválida"; // Si parseISO falla
				}
			} else if (date instanceof Date) {
				parsedDate = date; // Si ya es un objeto Date, úsalo directamente
			} else {
				return "Fecha inválida"; // Cualquier otro caso
			}

			return format(parsedDate, "dd/MM/yyyy HH:mm:ss");
		};
		const handleToggleDetails = () => {
			// Alternar el detalle del evento
			setExpandedEventId((prevId) => (prevId === _id ? null : _id));
		};

		return (
			<Box display="flex" alignItems="center" flexDirection="column" width="100%">
				<Box display="flex" alignItems="center" width="100%">
					<Typography variant="body2" sx={{ flexGrow: 1 }}>
						{eventInfo.event.title}
					</Typography>
					{/* Ícono para visualizar detalles */}
					<IconButton color="info" size="small" onClick={handleToggleDetails}>
						{expandedEventId === _id ? (
							<Add style={{ color: "red", transform: "rotate(45deg)" }} /> // Ícono cuando está abierto
						) : (
							<Eye style={{ color: "grey" }} /> // Ícono cuando está cerrado
						)}
					</IconButton>
					{/* Ícono para editar */}
					<IconButton color="primary" size="small" onClick={() => handleEditEvent(_id)}>
						<Edit2 variant="Bulk" />
					</IconButton>
					{/* Ícono para eliminar */}
					<IconButton color="error" size="small" onClick={() => handleDeleteEvent(_id)}>
						<Trash variant="Bulk" />
					</IconButton>
				</Box>

				{/* Mostrar detalles del evento si está expandido */}
				{expandedEventId === _id && (
					<Box
						mt={2}
						p={2}
						width="100%"
						bgcolor="background.paper"
						borderRadius={1}
						boxShadow={1}
						sx={{
							animation: expandedEventId === _id ? "expand 0.3s ease forwards" : "collapse 0.3s ease forwards",
							"@keyframes expand": {
								"0%": { maxHeight: 0, opacity: 0 },
								"100%": { maxHeight: "300px", opacity: 1 },
							},
							"@keyframes collapse": {
								"0%": { maxHeight: "300px", opacity: 1 },
								"100%": { maxHeight: 0, opacity: 0 },
							},
						}}
					>
						<Typography variant="body1">
							<strong>Descripción:</strong> {eventInfo.event.extendedProps.description || "No disponible"}
						</Typography>
						<Typography variant="body2">
							<strong>Inicio:</strong> {formatDate(eventInfo.event.start)}
						</Typography>
						<Typography variant="body2">
							<strong>Fin:</strong> {formatDate(eventInfo.event.end)}
						</Typography>
						<Typography variant="body2">
							<strong>Tipo:</strong> {eventInfo.event.extendedProps.type || "No especificado"}
						</Typography>
					</Box>
				)}
			</Box>
		);
	};

	const handleEditEvent = (_id: string) => {
		dispatch(toggleModal()); // Abrir el modal para editar el evento
		dispatch(selectEvent(_id));
	};

	const handleDeleteEvent = async (eventId: string) => {
		try {
			await dispatch(deleteEvent(eventId));
			dispatch(
				openSnackbar({
					open: true,
					message: "Evento eliminado correctamente.",
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
					message: (error as any).response?.data?.message || "Error al eliminar evento",
					variant: "alert",
					alert: {
						color: "error",
					},
					close: true,
				}),
			);
		}
	};

	const handleDatePrev = useCallback(() => {
		const calendarEl = calendarRef.current;
		if (calendarEl) {
			const calendarApi = calendarEl.getApi();
			calendarApi.prev();
			setDate(calendarApi.getDate());
		}
	}, []);

	const handleDateNext = useCallback(() => {
		const calendarEl = calendarRef.current;
		if (calendarEl) {
			const calendarApi = calendarEl.getApi();
			calendarApi.next();
			setDate(calendarApi.getDate());
		}
	}, []);

	const handleDateToday = useCallback(() => {
		const calendarEl = calendarRef.current;

		if (calendarEl) {
			const calendarApi = calendarEl.getApi();

			calendarApi.today();
			setDate(calendarApi.getDate());
		}
	}, []);

	const [currentView, setCurrentView] = useState<string>("listMonth");
	const handleViewChange = (newView: string) => {
		const calendarEl = calendarRef.current;
		if (calendarEl) {
			const calendarApi = calendarEl.getApi();
			calendarApi.changeView(newView);
			setCurrentView(newView);
		}
	};

	const selectedEvent = useSelector((state) => {
		const { events, selectedEventId } = state.events;
		if (selectedEventId) {
			return events.find((event) => event._id === selectedEventId);
		}
		return null;
	});

	const auth = useSelector((state) => state.auth);
	const userId = auth.user?._id;

	const { events } = useSelector((state) => state.events);

	useEffect(() => {
		if (id && id !== "undefined") {
			const fetchData = async () => {
				setIsLoading(true);
				try {
					await dispatch(getEventsById(id));
					setIsLoading(false);
				} catch (error) {
					console.error(error);
				}
			};
			fetchData();
		}
	}, [id, dispatch]);

	// Escuchar eventos globales para restricciones de plan y cierre forzado de modales
	useEffect(() => {
		// Manejador para eventos de restricción de plan
		const handlePlanRestriction = () => {
			console.log("Calendar: Restricción de plan detectada, cerrando modal Agregar Evento");
			if (isModalOpen) {
				dispatch(toggleModal()); // Cerrar el modal
				dispatch(selectEvent(null)); // Limpiar evento seleccionado
			}
		};

		// Revisar periódicamente si hay una flag global para cerrar modales
		const checkGlobalFlag = () => {
			if ((window as any).FORCE_CLOSE_ALL_MODALS && isModalOpen) {
				console.log("Calendar: Flag global detectada, cerrando modal Agregar Evento");
				dispatch(toggleModal()); // Cerrar el modal
				dispatch(selectEvent(null)); // Limpiar evento seleccionado
			}
		};

		// Agregar listener para el evento
		window.addEventListener("planRestrictionError", handlePlanRestriction);

		// Configurar intervalo para verificar la flag global
		const intervalId = setInterval(checkGlobalFlag, 200);

		// Limpieza
		return () => {
			window.removeEventListener("planRestrictionError", handlePlanRestriction);
			clearInterval(intervalId);
		};
	}, [isModalOpen]);

	return (
		<MainCard
			shadow={3}
			title={title}
			content={false}
			secondary={
				<Stack direction="row" spacing={1}>
					<Tooltip title="Agregar Evento">
						<IconButton color="secondary" sx={{ color: "secondary.darker" }} onClick={handleModal} disabled={isLoading}>
							<Add />
						</IconButton>
					</Tooltip>
				</Stack>
			}
			sx={{
				"& .MuiCardContent-root": {
					p: 0,
				},
			}}
		>
			<Dialog
				maxWidth="sm"
				TransitionComponent={PopupTransition}
				keepMounted
				fullWidth
				onClose={handleModal}
				open={isModalOpen}
				sx={{ "& .MuiDialog-paper": { p: 0 }, transition: "transform 225ms" }}
				aria-describedby="alert-dialog-slide-description"
			>
				<AddEventFrom
					event={selectedEvent}
					range={selectedRange}
					onCancel={handleModal}
					userId={userId}
					folderId={id}
					folderName={folderName}
				/>
			</Dialog>

			<CardContent sx={{ p: 3 }}>
				{isLoading ? (
					<Stack spacing={3}>
						<Skeleton variant="rounded" height={60} />
						<Skeleton variant="rounded" height={60} />
						<Skeleton variant="rounded" height={60} />
					</Stack>
				) : events.length > 0 ? (
					<SimpleBar
						sx={{
							overflowX: "hidden",
							height: "100%",
							maxHeight: "600px", // Ajusta este valor si necesitas más espacio
							overflowY: "auto", // Scroll vertical
						}}
					>
						<CalendarStyled
							sx={{
								height: "auto",
								maxHeight: "600px", // Límite máximo para evitar desbordamientos
								overflowY: "auto", // Scroll si el contenido excede
							}}
						>
							<CalendarToolbar
								date={date}
								view={currentView}
								onClickNext={handleDateNext}
								onClickPrev={handleDatePrev}
								onClickToday={handleDateToday}
								onChangeView={handleViewChange}
							/>
							<FullCalendar
								events={events}
								initialView="listMonth"
								ref={calendarRef}
								rerenderDelay={10}
								initialDate={date}
								dayMaxEventRows={3}
								headerToolbar={false}
								allDayMaintainDuration
								eventResizableFromStart
								locale={esLocale}
								plugins={[listPlugin, dayGridPlugin, timeGridPlugin]}
								height={"auto"}
								eventContent={(eventInfo) => renderEventContent(eventInfo)}
								views={{
									listMonth: {
										buttonText: "Mes",
										titleFormat: { year: "numeric", month: "long" },
									},
									listYear: {
										buttonText: "Año",
										titleFormat: { year: "numeric" },
										duration: { years: 1 },
									},
								}}
							/>
						</CalendarStyled>
					</SimpleBar>
				) : (
					<EmptyStateCard
						icon={<CalendarRemove variant="Bold" />}
						title="No hay eventos registrados"
						subtitle="Comienza agregando un nuevo evento usando el botón +"
					/>
				)}
			</CardContent>
		</MainCard>
	);
};

export default Calendar;

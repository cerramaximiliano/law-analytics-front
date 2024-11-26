import { Box, Skeleton, Grid, CardContent, IconButton, Typography, Dialog, Tooltip, Stack } from "@mui/material";
import { Trash, Edit2, Eye, Add, CalendarRemove } from "iconsax-react";
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
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
import { useSelector, dispatch } from "store";
import { useCallback, useEffect, useRef, useState } from "react";
import CalendarToolbar from "./CalendarToolbar";
import SimpleBar from "components/third-party/SimpleBar";
import { useParams } from "react-router";
import { getEventsById, deleteEvent, selectEvent } from "store/reducers/events";
import { openSnackbar } from "store/reducers/snackbar";
import { EventContentArg } from "@fullcalendar/core";
import { parseISO, format } from "date-fns";

interface CalendarProps {
	title: string;
}

const Calendar: React.FC<CalendarProps> = ({ title }) => {
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
							transition: "max-height 0.3s ease", // Animación para expandir
							maxHeight: expandedEventId === _id ? "300px" : "0px", // Altura dinámica basada en estado
							overflow: "hidden", // Evita overflow visual
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

	const handleViewChange = (newView: string) => {
		/* 		const calendarEl = calendarRef.current;
		if (calendarEl) {
			const calendarApi = calendarEl.getApi();
			calendarApi.changeView(newView);
			dispatch(updateCalendarView(newView));
		} */
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

	return (
		<MainCard
			shadow={3}
			title={title}
			content={false}
			secondary={
				<Tooltip title="Agregar Evento">
					<IconButton color="secondary" sx={{ color: "secondary.darker" }} onClick={handleModal}>
						<Add />
					</IconButton>
				</Tooltip>
			}
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
				<AddEventFrom event={selectedEvent} range={selectedRange} onCancel={handleModal} userId={userId} folderId={id} />
			</Dialog>

			<CardContent
				sx={{
					display: "grid",
					gridTemplateRows: "1fr auto", // Ajusta automáticamente
					height: "100%",
				}}
			>
				{isLoading ? (
					<>
						<Skeleton />
						<Skeleton />
						<Skeleton />
						<Skeleton />
						<Skeleton />
						<Skeleton />
						<Skeleton />
					</>
				) : (
					<>
						{events.length > 0 ? (
							<Grid container>
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
											view={"listWeek"}
											onClickNext={handleDateNext}
											onClickPrev={handleDatePrev}
											onClickToday={handleDateToday}
											onChangeView={handleViewChange}
										/>
										<FullCalendar
											events={events}
											initialView="listWeek"
											ref={calendarRef}
											rerenderDelay={10}
											initialDate={date}
											dayMaxEventRows={3}
											headerToolbar={false}
											allDayMaintainDuration
											eventResizableFromStart
											locale={esLocale}
											plugins={[listPlugin]}
											height={"auto"}
											eventContent={(eventInfo) => renderEventContent(eventInfo)}
										/>
									</CalendarStyled>
								</SimpleBar>
							</Grid>
						) : (
							<>
								<Stack spacing={2} alignItems="center" py={4}>
									<Avatar
										color="error"
										variant="rounded"
										sx={{
											width: 64,
											height: 64,
											bgcolor: "error.lighter",
										}}
									>
										<CalendarRemove variant="Bold" />
									</Avatar>

									<Typography variant="subtitle1" color="textSecondary" align="center">
										No hay eventos registrados
									</Typography>
									<Typography variant="body2" color="textSecondary" align="center">
										Comienza agregando un nuevo evento usando el botón +
									</Typography>
								</Stack>
							</>
						)}
					</>
				)}
			</CardContent>
		</MainCard>
	);
};

export default Calendar;

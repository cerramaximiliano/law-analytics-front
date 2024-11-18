import { Box, Skeleton, Grid, CardContent, IconButton, Typography, Dialog } from "@mui/material";
import { Trash, Edit2 } from "iconsax-react";
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import { Add, CalendarRemove } from "iconsax-react";
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

interface CalendarProps {
	title: string;
}

const Calendar: React.FC<CalendarProps> = ({ title }) => {
	const [isLoading, setIsLoading] = useState(true);

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

		return (
			<Box display="flex" alignItems="center">
				<Typography variant="body2" sx={{ flexGrow: 1 }}>
					{eventInfo.event.title}
				</Typography>
				<IconButton color="primary" size="small" onClick={() => handleEditEvent(_id)}>
					<Edit2 variant="Bulk" />
				</IconButton>
				<IconButton color="error" size="small" onClick={() => handleDeleteEvent(_id)}>
					<Trash variant="Bulk" />
				</IconButton>
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
			title={title}
			content={false}
			secondary={
				<IconButton color="secondary" sx={{ color: "secondary.darker" }} onClick={handleModal}>
					<Add />
				</IconButton>
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

			<CardContent>
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
										maxHeight: "350px",
										overflowY: "auto",
									}}
								>
									<CalendarStyled sx={{ minHeight: "250px", height: "auto" }}>
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
								<Grid container justifyContent="center">
									<Avatar color="error" variant="rounded">
										<CalendarRemove variant="Bold" />
									</Avatar>
								</Grid>
								<Typography variant="body1" color="text.secondary" align="center">
									No hay eventos agendados
								</Typography>
							</>
						)}
					</>
				)}
			</CardContent>
		</MainCard>
	);
};

export default Calendar;

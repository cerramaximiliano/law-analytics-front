import { useEffect, useRef, useState } from "react";

// material-ui
import { Theme } from "@mui/material/styles";
import { useMediaQuery, Box, Dialog, SpeedDial, Tooltip } from "@mui/material";

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

import {
	//getEvents,
	selectEvent,
	selectRange,
	toggleModal,
	updateCalendarView,
	updateEvent,
} from "store/reducers/calendar";

// types
import { Add } from "iconsax-react";
import { dispatch, useSelector } from "store";
import { getEventsByUserId } from "store/reducers/events";

// ==============================|| CALENDAR - MAIN ||============================== //

const Calendar = () => {
	const matchDownSM = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));

	const [loading, setLoading] = useState<boolean>(true);

	const { calendarView, isModalOpen, selectedRange } = useSelector((state) => state.calendar);
	const { events } = useSelector((state) => state.events);

	const auth = useSelector((state) => state.auth);
	const id = auth.user?._id;

	console.log(events, calendarView);
	const selectedEvent = useSelector((state) => {
		const { events, selectedEventId } = state.calendar;
		if (selectedEventId) {
			return events.find((event) => event.id === selectedEventId);
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
		console.log("change");
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

		dispatch(selectRange(arg.start, arg.end));
	};

	const handleEventSelect = (arg: EventClickArg) => {
		dispatch(selectEvent(arg.event.id));
	};

	const handleEventUpdate = async ({ event }: EventResizeDoneArg | EventDropArg) => {
		try {
			dispatch(
				updateEvent(event.id, {
					allDay: event.allDay,
					start: event.start,
					end: event.end,
				}),
			);
		} catch (error) {
			console.error(error);
		}
	};

	const handleModal = () => {
		dispatch(toggleModal());
	};

	if (loading) return <Loader />;

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
					events={events as EventSourceInput}
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
				/>
			</CalendarStyled>

			{/* Dialog renders its body even if not open */}
			<Dialog
				maxWidth="sm"
				TransitionComponent={PopupTransition}
				fullWidth
				onClose={handleModal}
				open={isModalOpen}
				sx={{ "& .MuiDialog-paper": { p: 0, bgcolor: "secondary.lighter" } }}
			>
				<AddEventForm event={selectedEvent} range={selectedRange} onCancel={handleModal} />
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
					onClick={handleModal}
				/>
			</Tooltip>
		</Box>
	);
};

export default Calendar;

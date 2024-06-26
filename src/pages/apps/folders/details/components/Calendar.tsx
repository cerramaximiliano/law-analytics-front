import { Skeleton, Grid, CardContent, IconButton, Typography, Dialog } from "@mui/material";
import MainCard from "components/MainCard";
import Avatar from "components/@extended/Avatar";
import { Add, CalendarRemove } from "iconsax-react";
import { PopupTransition } from "components/@extended/Transitions";
import { toggleModal, updateCalendarView, getEvents } from "store/reducers/calendar";
import AddEventFrom from "sections/apps/calendar/AddEventForm";
import CalendarStyled from "sections/apps/calendar/CalendarStyled";
import FullCalendar from "@fullcalendar/react";
import esLocale from "@fullcalendar/core/locales/es";
import listPlugin from "@fullcalendar/list";
import { useSelector, dispatch } from "store";
import { useEffect, useRef, useState } from "react";
import CalendarToolbar from "./CalendarToolbar";
import SimpleBar from "components/third-party/SimpleBar";
import { useParams } from "react-router";

interface CalendarProps {
	title: string;
	events: any;
}

const Calendar: React.FC<CalendarProps> = ({ title, events }) => {
	const [isLoading, setIsLoading] = useState(true);
	//console.log(isLoading, setIsLoading);
	const handleModal = () => {
		if (isLoading === true) {
			return;
		} else {
			dispatch(toggleModal());
		}
	};
	const { id } = useParams<{ id: string }>();
	const { selectedRange, isModalOpen } = useSelector((state) => state.calendar);
	const [date, setDate] = useState(new Date());
	const calendarRef = useRef<FullCalendar>(null);

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
	const selectedEvent = useSelector((state) => {
		const { events, selectedEventId } = state.calendar;
		if (selectedEventId) {
			return events.find((event) => event.id === selectedEventId);
		}
		return null;
	});
	useEffect(() => {
		if (id) {
			const fetchData = async () => {
				setIsLoading(true);
				await dispatch(getEvents(id));
				setIsLoading(false);
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
				<AddEventFrom event={selectedEvent} range={selectedRange} onCancel={handleModal} />
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
									<CalendarStyled>
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
									No hay datos
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

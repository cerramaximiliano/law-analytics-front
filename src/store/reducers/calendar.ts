import { createSlice } from "@reduxjs/toolkit";

// third-party
import { EventInput } from "@fullcalendar/common";

// project-imports
import axios from "utils/axios";
import { dispatch } from "store";

// types
import { CalendarProps } from "types/calendar";

const initialState: CalendarProps = {
	calendarView: "dayGridMonth",
	error: false,
	events: [],
	isLoader: false,
	isModalOpen: false,
	selectedEventId: null,
	selectedRange: null,
};

// ==============================|| SLICE - CALENDAR ||============================== //

const calendar = createSlice({
	name: "calendar",
	initialState,
	reducers: {
		// loader
		loading(state) {
			state.isLoader = true;
		},

		// error
		hasError(state, action) {
			state.isLoader = false;
			state.error = action.payload;
		},

		// event list
		setEvents(state, action) {
			state.isLoader = false;
			state.events = action.payload;
		},

		// update calendar view
		updateCalendarView(state, action) {
			state.calendarView = action.payload;
		},

		// select event
		selectEvent(state, action) {
			const eventId = action.payload;
			state.isModalOpen = true;
			state.selectedEventId = eventId;
		},

		// create event
		createEvent(state, action) {
			state.isLoader = false;
			state.isModalOpen = false;
			state.events = action.payload;
		},

		// update event
		updateEvent(state, action) {
			state.isLoader = false;
			state.isModalOpen = false;
			state.events = action.payload;
		},

		// delete event
		deleteEvent(state, action) {
			const { eventId } = action.payload;
			state.isModalOpen = false;
			const deleteEvent = state.events.filter((user) => user.id !== eventId);
			state.events = deleteEvent;
		},

		// select date range
		selectRange(state, action) {
			const { start, end } = action.payload;
			state.isModalOpen = true;
			state.selectedRange = { start, end };
		},

		// modal toggle
		toggleModal(state) {
			state.isModalOpen = !state.isModalOpen;
			if (state.isModalOpen === false) {
				state.selectedEventId = null;
				state.selectedRange = null;
			}
		},
	},
});

export default calendar.reducer;

export const { selectEvent, toggleModal, updateCalendarView } = calendar.actions;

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export function getEvents(id: any) {
	return async () => {
		dispatch(calendar.actions.loading());
		try {
			const response = await axios.get("/api/calendar/events");
			await delay(5000);
			//
			dispatch(calendar.actions.setEvents(response.data.events));
		} catch (error) {
			//dispatch(calendar.actions.hasError(error));
		}
	};
}

export function createEvent(newEvent: Omit<EventInput, "id">) {
	return async () => {
		dispatch(calendar.actions.loading());
		try {
			const response = await axios.post("/api/calendar/events/add", newEvent);
			dispatch(calendar.actions.createEvent(response.data));
		} catch (error) {
			dispatch(calendar.actions.hasError(error));
		}
	};
}

export function updateEvent(
	eventId: string,
	updateEvent: Partial<{
		allDay: boolean;
		start: Date | null;
		end: Date | null;
	}>,
) {
	return async () => {
		dispatch(calendar.actions.loading());
		try {
			const response = await axios.post("/api/calendar/events/update", {
				eventId,
				update: updateEvent,
			});
			dispatch(calendar.actions.updateEvent(response.data.events));
		} catch (error) {
			dispatch(calendar.actions.hasError(error));
		}
	};
}

export function deleteEvent(eventId: string) {
	return async () => {
		dispatch(calendar.actions.loading());
		try {
			await axios.post("/api/calendar/events/delete", { eventId });
			dispatch(calendar.actions.deleteEvent({ eventId }));
		} catch (error) {
			dispatch(calendar.actions.hasError(error));
		}
	};
}

export function selectRange(start: Date, end: Date) {
	return async () => {
		dispatch(
			calendar.actions.selectRange({
				start: start.getTime(),
				end: end.getTime(),
			}),
		);
	};
}

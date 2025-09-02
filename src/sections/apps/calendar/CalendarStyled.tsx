// material-ui
import { styled } from "@mui/material/styles";

// ==============================|| CALENDAR - STYLED ||============================== //

const ExperimentalStyled = styled("div")(({ theme }) => ({
	width: "100%",
	marginBottom: 16,

	// hide license message
	"& .fc-license-message": {
		display: "none",
	},
	"& .fc .fc-daygrid .fc-scroller-liquid-absolute": {
		overflow: "hidden !important",
	},

	// basic style
	"& .fc": {
		"--fc-bg-event-opacity": 1,
		"--fc-border-color": theme.palette.divider,
		"--fc-daygrid-event-dot-width": "8px",
		"--fc-today-bg-color": theme.palette.primary.lighter,
		"--fc-list-event-dot-width": "8px",
		"--fc-event-border-color": theme.palette.primary.dark,
		"--fc-now-indicator-color": theme.palette.error.main,
		color: theme.palette.text.primary,
		backgroundColor: theme.palette.background.paper,
		fontFamily: theme.typography.fontFamily,
	},

	// date text
	"& .fc .fc-daygrid-day-top": {
		display: "grid",
		"& .fc-daygrid-day-number": {
			textAlign: "center",
			marginTop: 2,
			marginBottom: 2,
			fontSize: "0.75rem",
			lineHeight: 1,
		},
	},

	// weekday
	"& .fc .fc-col-header-cell": {
		backgroundColor: theme.palette.secondary[100],
	},

	"& .fc .fc-col-header-cell-cushion": {
		color: theme.palette.secondary.darker,
		padding: 8,
	},

	// events
	"& .fc-direction-ltr .fc-daygrid-event.fc-event-end, .fc-direction-rtl .fc-daygrid-event.fc-event-start": {
		marginLeft: 4,
		marginRight: 4,
		marginBottom: 3,
		borderRadius: 8,
		backgroundColor: theme.palette.primary.main,
		border: "none",
		overflow: "hidden",
	},
	"& .fc-v-event .fc-event-title": {
		overflow: "unset",
		fontSize: "0.75rem",
	},

	"& .fc-h-event .fc-event-main": {
		padding: 2,
		paddingLeft: 8,
		fontSize: "0.75rem",
	},

	// Título del evento más pequeño
	"& .fc-event-title": {
		fontSize: "0.75rem",
		lineHeight: 1.2,
	},

	// Hora del evento más pequeña
	"& .fc-event-time": {
		fontSize: "0.7rem",
	},

	// popover when multiple events
	"& .fc .fc-more-popover": {
		border: "none",
		borderRadius: 12,
		zIndex: 1200,
	},

	"& .fc .fc-more-popover .fc-popover-body": {
		backgroundColor: theme.palette.secondary[200],
		borderBottomLeftRadius: 12,
		borderBottomRightRadius: 12,
	},

	"& .fc .fc-popover-header": {
		padding: 12,
		borderTopLeftRadius: 12,
		borderTopRightRadius: 12,
		backgroundColor: theme.palette.secondary[200],
		color: theme.palette.text.primary,
	},

	// agenda view
	"& .fc-theme-standard .fc-list-day-cushion": {
		backgroundColor: theme.palette.secondary[100],
	},

	"& .fc .fc-day": {
		cursor: "pointer",
	},

	"& .fc .fc-timeGridDay-view .fc-timegrid-slot": {
		backgroundColor: theme.palette.background.paper,
	},

	"& .fc .fc-timegrid-slot": {
		cursor: "pointer",
	},

	"& .fc .fc-list-event:hover td": {
		cursor: "pointer",
		backgroundColor: theme.palette.secondary[100],
	},

	"& .fc-timegrid-event-harness-inset .fc-timegrid-event, .fc-timegrid-event.fc-event-mirror, .fc-timegrid-more-link": {
		padding: 4,
		margin: 1,
		borderRadius: 8,
		fontSize: "0.75rem",
	},

	// Botón de más eventos
	"& .fc-daygrid-more-link": {
		fontSize: "0.7rem",
		marginTop: 1,
	},

	// Eventos en vista de lista
	"& .fc-list-event-title": {
		fontSize: "0.8rem",
	},

	"& .fc-list-event-time": {
		fontSize: "0.75rem",
	},
}));

export default ExperimentalStyled;

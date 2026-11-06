// third-party
import { combineReducers } from "redux";

// project-imports
import chat from "./chat";
import calendar from "./calendar";
import menu from "./menu";
import snackbar from "./snackbar";
import folder from "./folder";
import calculator from "./calculator";
import notifications from "./notifications";
import movements from "./movements";
import auth from "./auth";
import alerts from "./alerts";
import contacts from "./contacts";
import events from "./events";
import tasksReducer from "./tasks";
import notesReducer from "./notes";
import userStats from "./userStats";
import users from "./users";
import search from "./search";
import unifiedStats from "./unifiedStats";
import interestRates from "./interestRates";
import stripeSubscriptions from "./stripe-subscriptions";
import activities from "./activities";
import notificationMonitoring from "./notificationMonitoring";
import googleCalendar from "./googleCalendar";
import teams from "./teams";
import activityLog from "./activityLog";
import pjnSync from "./pjnSync";
import pjnSiteStatus from "./pjnSiteStatus";
import scbaSiteStatus from "./scbaSiteStatus";
import scbaSync from "./scbaSync";
import movementsSync from "./movementsSync";
import postalTrackingReducer from "./postalTracking";
import postalDocumentsReducer from "./postalDocuments";
import richTextDocumentsReducer from "./richTextDocuments";

// ==============================|| COMBINE REDUCERS ||============================== //

const reducers = combineReducers({
	chat,
	calendar,
	menu,
	snackbar,
	folder,
	notifications,
	calculator,
	movements,
	auth,
	alerts,
	contacts,
	events,
	tasksReducer,
	notesReducer,
	userStats,
	users,
	search,
	unifiedStats,
	interestRates,
	stripeSubscriptions,
	activities,
	notificationMonitoring,
	googleCalendar,
	teams,
	activityLog,
	pjnSync,
	pjnSiteStatus,
	scbaSiteStatus,
	scbaSync,
	movementsSync,
	postalTrackingReducer,
	postalDocumentsReducer,
	richTextDocumentsReducer,
});

export default reducers;

// third-party
import { combineReducers } from "redux";
import { persistReducer } from "redux-persist";
import storage from "redux-persist/lib/storage";

// project-imports
import chat from "./chat";
import calendar from "./calendar";
import menu from "./menu";
import snackbar from "./snackbar";
import productReducer from "./product";
import cartReducer from "./cart";
import kanban from "./kanban";
import invoice from "./invoice";
import folder from "./folder";
import calculator from "./calculator";
import notifications from "./notifications";
import movements from "./movements";
import auth from "./auth";
import alerts from "./alerts";
import contacts from "./contacts";
import events from "./events";
import tasksReducer from "./tasks";
import userStats from "./userStats";
import users from "./users";
import search from "./search";
import unifiedStats from "./unifiedStats";

// ==============================|| COMBINE REDUCERS ||============================== //

const reducers = combineReducers({
	chat,
	calendar,
	menu,
	snackbar,
	cart: persistReducer(
		{
			key: "cart",
			storage,
			keyPrefix: "able-pro-material-ts-",
		},
		cartReducer,
	),
	product: productReducer,
	kanban,
	invoice,
	folder,
	notifications,
	calculator,
	movements,
	auth,
	alerts,
	contacts,
	events,
	tasksReducer,
	userStats,
	users,
	search,
	unifiedStats,
});

export default reducers;

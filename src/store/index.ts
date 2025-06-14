// third-party
import { configureStore } from "@reduxjs/toolkit";
import { useDispatch as useAppDispatch, useSelector as useAppSelector, TypedUseSelectorHook } from "react-redux";
import { persistStore, FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER, Persistor } from "redux-persist";

// project-imports
import reducers from "./reducers";

// ==============================|| REDUX TOOLKIT - MAIN STORE ||============================== //

const store = configureStore({
	reducer: reducers,
	middleware: (getDefaultMiddleware) =>
		getDefaultMiddleware({
			serializableCheck: {
				ignoredActions: [FLUSH, REHYDRATE, PAUSE, PERSIST, PURGE, REGISTER],
			},
		}),
});

export type RootState = ReturnType<typeof reducers>;

export type AppDispatch = typeof store.dispatch;

// Create persister with proper error handling
let persister: Persistor;

// Create a mock persister for fallback
const createMockPersistor = (): any => ({
	persist: () => Promise.resolve(),
	purge: () => Promise.resolve(),
	flush: () => Promise.resolve(),
	pause: () => {},
	dispatch: (action: any) => store.dispatch(action),
	getState: () => store.getState(),
	subscribe: (callback: () => void) => {
		const unsubscribe = () => {};
		return unsubscribe;
	},
});

try {
	persister = persistStore(store);
} catch (error) {
	console.error("Error initializing persister:", error);
	persister = createMockPersistor();
}

const { dispatch } = store;

const useDispatch = () => useAppDispatch<AppDispatch>();
const useSelector: TypedUseSelectorHook<RootState> = useAppSelector;

export { store, dispatch, persister, useSelector, useDispatch };

// third-party
import { configureStore } from "@reduxjs/toolkit";
import { useDispatch as useAppDispatch, useSelector as useAppSelector, TypedUseSelectorHook } from "react-redux";

// project-imports
import reducers from "./reducers";

// ==============================|| REDUX TOOLKIT - MAIN STORE ||============================== //

const store = configureStore({
	reducer: reducers,
});

export type RootState = ReturnType<typeof reducers>;

export type AppDispatch = typeof store.dispatch;

// Sin redux-persist (7/11/2026): el único slice persistido era el carrito de la plantilla, ya
// borrado. Con PersistGate y ningún persistReducer la app no montaba (pantalla en blanco).

const { dispatch } = store;

const useDispatch = () => useAppDispatch<AppDispatch>();
const useSelector: TypedUseSelectorHook<RootState> = useAppSelector;

// En dev mode (Vite DEV), exponer el store a window para tests E2E
// que simulan eventos Socket.io (dispatch directo de acciones).
if (import.meta.env?.DEV) {
	(window as unknown as { __store__?: typeof store }).__store__ = store;
}

export { store, dispatch, useSelector, useDispatch };

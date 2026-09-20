import { createAsyncThunk, createSlice } from "@reduxjs/toolkit";

// types
import { MenuProps } from "types/menu";

// initial state
const initialState: MenuProps = {
	openItem: ["dashboard"],
	openComponent: "buttons",
	selectedID: null,
	drawerOpen: false,
	componentDrawerOpen: true,
	menu: {},
	error: null,
};

// ==============================|| SLICE - MENU ||============================== //

// El menú del panel se carga bajo demanda. Trae 34 iconos y todo el árbol de
// navegación del producto, que en una página pública no se usa para nada y
// viajaba en el arranque de todas (2026-09-20, ver
// la-ads/analysis/2026-09-19-por-que-nadie-hace-clic.md).
export const fetchMenu = createAsyncThunk("menu/fetch", async () => {
	const { default: menuData } = await import("data/menu");
	return { dashboard: menuData };
});

const menu = createSlice({
	name: "menu",
	initialState,
	reducers: {
		activeItem(state, action) {
			state.openItem = action.payload.openItem;
		},

		activeID(state, action) {
			state.selectedID = action.payload;
		},

		activeComponent(state, action) {
			state.openComponent = action.payload.openComponent;
		},

		openDrawer(state, action) {
			state.drawerOpen = action.payload;
		},

		openComponentDrawer(state, action) {
			state.componentDrawerOpen = action.payload.componentDrawerOpen;
		},

		hasError(state, action) {
			state.error = action.payload;
		},
	},

	extraReducers(builder) {
		builder.addCase(fetchMenu.fulfilled, (state, action) => {
			state.menu = action.payload.dashboard;
		});
	},
});

export default menu.reducer;

export const { activeItem, activeComponent, openDrawer, openComponentDrawer, activeID } = menu.actions;

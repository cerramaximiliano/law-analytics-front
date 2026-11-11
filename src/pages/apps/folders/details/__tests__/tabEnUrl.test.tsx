/**
 * Pedido de Silvia (11/11/2026): la pestaña Actividad (o la que esté abierta) se mantiene al pasar de
 * causa con las flechas del detalle. La pestaña vive en ?tab= y NavigationControls la conserva.
 */
import { render, screen, fireEvent } from "@testing-library/react";
import { MemoryRouter, Route, Routes, useLocation } from "react-router-dom";
import { vi } from "vitest";
import NavigationControls from "../components/NavigationControls";
import { TAB_PARAM_BY_INDEX, tabIndexFromParam, tabQuery } from "../tabParams";

const state = {
	folder: {
		folders: [
			{ _id: "a", folderName: "Alfa" },
			{ _id: "b", folderName: "Beta" },
			{ _id: "c", folderName: "Gamma" },
		],
		sortBy: "folderName",
		sortDesc: false,
	},
};
vi.mock("react-redux", () => ({ useSelector: (selector: any) => selector(state) }));

const Ubicacion = () => {
	const location = useLocation();
	return <div data-testid="ubicacion">{location.pathname + location.search}</div>;
};

const renderControles = (tabParam?: string) =>
	render(
		<MemoryRouter initialEntries={["/apps/folders/details/b"]}>
			<Routes>
				<Route
					path="/apps/folders/details/:id"
					element={
						<>
							<NavigationControls currentFolderId="b" tabParam={tabParam} inline />
							<Ubicacion />
						</>
					}
				/>
			</Routes>
		</MemoryRouter>,
	);

const botones = () => screen.getAllByRole("button");

describe("NavigationControls conserva la pestaña", () => {
	it("siguiente con Actividad abierta va a /details/<next>?tab=activity", () => {
		renderControles("activity");
		fireEvent.click(botones()[2]);
		expect(screen.getByTestId("ubicacion").textContent).toBe("/apps/folders/details/c?tab=activity");
	});

	it("anterior con Gestión abierta va a /details/<prev>?tab=gestion", () => {
		renderControles("gestion");
		fireEvent.click(botones()[0]);
		expect(screen.getByTestId("ubicacion").textContent).toBe("/apps/folders/details/a?tab=gestion");
	});

	it("en Información General navega sin query", () => {
		renderControles();
		fireEvent.click(botones()[2]);
		expect(screen.getByTestId("ubicacion").textContent).toBe("/apps/folders/details/c");
	});
});

describe("tabParams", () => {
	it("cada ?tab= abre su pestaña y la ida y vuelta es estable", () => {
		expect(tabIndexFromParam("activity", false)).toBe(1);
		expect(tabIndexFromParam("gestion", false)).toBe(2);
		expect(tabIndexFromParam("recursos", false)).toBe(3);
		expect(tabIndexFromParam("historial", false)).toBe(4);
		expect(tabIndexFromParam("relaciones", false)).toBe(5);
		for (const [index, param] of Object.entries(TAB_PARAM_BY_INDEX)) {
			expect(tabIndexFromParam(param, true)).toBe(Number(index));
		}
	});

	it("chat solo con acceso; valores vacíos o desconocidos no cambian la pestaña", () => {
		expect(tabIndexFromParam("chat", false)).toBeNull();
		expect(tabIndexFromParam("chat", true)).toBe(6);
		expect(tabIndexFromParam(null, true)).toBeNull();
		expect(tabIndexFromParam("otra", true)).toBeNull();
	});

	it("tabQuery arma el sufijo", () => {
		expect(tabQuery("activity")).toBe("?tab=activity");
		expect(tabQuery(undefined)).toBe("");
	});
});

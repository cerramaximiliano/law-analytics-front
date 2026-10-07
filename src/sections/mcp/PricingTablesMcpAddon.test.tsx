/**
 * Tarjeta del add-on "Conectores de IA" en /suscripciones/tables: misma regla de
 * visibilidad que /plans (isMcpAddonVisible), CTA de plan gratuito que baja a la grilla
 * y refresco del estado del add-on tras un cambio de plan en la página.
 */
import { fireEvent, render, screen } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import PricingTablesMcpAddon from "./PricingTablesMcpAddon";
import type { McpAddonStatus } from "types/mcpAddon";

const mockDispatch = vi.fn();
const mockRefresh = vi.fn(() => Promise.resolve());
let mockAddon: Partial<McpAddonStatus> | null = null;

vi.mock("react-redux", () => ({ useDispatch: () => mockDispatch }));
vi.mock("hooks/useMcpAddon", () => ({
	default: () => ({ addon: mockAddon, loading: false, source: "consolidated", refresh: mockRefresh }),
}));
vi.mock("sections/mcp/McpAddonCard", () => ({
	default: ({ variant, location, onUpgradeClick }: any) => (
		<button type="button" data-variant={variant} data-location={location} onClick={onUpgradeClick}>
			card
		</button>
	),
}));

const baseAddon: Partial<McpAddonStatus> = {
	status: "none",
	plan: "free",
	publicAvailable: false,
	hasManualGrant: false,
	adminBypass: false,
};

const renderSection = (subscriptionKey: string | null = "free|0|") =>
	render(
		<MemoryRouter initialEntries={["/suscripciones/tables"]}>
			<div id="planes-grilla" />
			<PricingTablesMcpAddon gridAnchorId="planes-grilla" subscriptionKey={subscriptionKey} />
		</MemoryRouter>,
	);

beforeEach(() => {
	mockDispatch.mockClear();
	mockRefresh.mockClear();
	mockAddon = null;
});

describe("PricingTablesMcpAddon — visibilidad", () => {
	it("no se muestra sin estado o con la venta cerrada y sin add-on, grant ni bypass", () => {
		renderSection();
		expect(screen.queryByTestId("pricing-tables-mcp-addon")).toBeNull();

		mockAddon = { ...baseAddon };
		renderSection();
		expect(screen.queryByTestId("pricing-tables-mcp-addon")).toBeNull();
	});

	it.each([
		["venta abierta", { publicAvailable: true }],
		["add-on ya contratado", { status: "active" as const }],
		["grant beta", { hasManualGrant: true }],
		["adminBypass", { adminBypass: true }],
	])("se muestra con %s, con ancla #conectores-ia y la variante plans", (_label, patch) => {
		mockAddon = { ...baseAddon, ...patch };
		renderSection();
		const section = screen.getByTestId("pricing-tables-mcp-addon");
		expect(section.id).toBe("conectores-ia");
		const card = screen.getByRole("button", { name: "card" });
		expect(card.dataset.variant).toBe("plans");
		expect(card.dataset.location).toBe("pricing_tables");
	});
});

describe("PricingTablesMcpAddon — comportamiento", () => {
	it("el CTA de plan gratuito baja a la grilla de planes y avisa", () => {
		mockAddon = { ...baseAddon, publicAvailable: true };
		renderSection();
		const grid = document.getElementById("planes-grilla")!;
		const scroll = vi.fn();
		grid.scrollIntoView = scroll;
		fireEvent.click(screen.getByRole("button", { name: "card" }));
		expect(scroll).toHaveBeenCalledWith({ behavior: "smooth", block: "start" });
		expect(mockDispatch).toHaveBeenCalledTimes(1);
	});

	it("refresca el add-on cuando cambia el plan, no en la carga inicial", () => {
		mockAddon = { ...baseAddon, publicAvailable: true };
		const { rerender } = render(
			<MemoryRouter>
				<PricingTablesMcpAddon gridAnchorId="planes-grilla" subscriptionKey={null} />
			</MemoryRouter>,
		);
		const renderKey = (key: string | null) =>
			rerender(
				<MemoryRouter>
					<PricingTablesMcpAddon gridAnchorId="planes-grilla" subscriptionKey={key} />
				</MemoryRouter>,
			);

		renderKey("free|0|"); // la página terminó de cargar la suscripción
		expect(mockRefresh).not.toHaveBeenCalled();

		renderKey("free|0|"); // re-render sin cambios
		expect(mockRefresh).not.toHaveBeenCalled();

		renderKey("standard|0|"); // Free → Estándar
		expect(mockRefresh).toHaveBeenCalledTimes(1);
	});
});

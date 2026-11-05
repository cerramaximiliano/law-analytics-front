/**
 * Selector de bloques de «Causas adicionales» en la tarjeta de Premium: se ofrece solo a
 * usuarios sin plan pago con la venta abierta, acota la cantidad a 0..maxBlocks, muestra el
 * total del combo y arma la lista de add-ons que va al checkout del hub.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import usePlanCheckoutBlocks from "./usePlanCheckoutBlocks";
import PlanCheckoutBlocksOption from "sections/addons/PlanCheckoutBlocksOption";
import type { ExtraFoldersStatus } from "store/reducers/ApiService";
import { formatPlanBlocksTotal, withBlocks } from "utils/planCheckoutBlocks";

let mockLoggedIn = true;
const mockGetExtraFolders = vi.fn();
vi.mock("hooks/useAuth", () => ({ default: () => ({ isLoggedIn: mockLoggedIn }) }));
vi.mock("store/reducers/ApiService", () => ({
	default: { getExtraFolders: (...a: unknown[]) => mockGetExtraFolders(...a) },
}));

const freeStatus = (over: Partial<ExtraFoldersStatus> = {}): ExtraFoldersStatus =>
	({
		key: "extra_folders",
		block: { folders: 250, storage: 100 },
		maxBlocks: 3,
		price: { amount: 9, currency: "usd", interval: "month" },
		requiredPlans: ["premium"],
		plan: "free",
		eligible: false,
		eligibilityReason: "paid_plan_required",
		publicAvailable: true,
		availabilityReason: null,
		maintenanceMessage: null,
		purchaseBypass: null,
		...over,
	} as ExtraFoldersStatus);

/** Mini tarjeta de Premium (US$ 29,99, 500 causas) con el selector y un CTA que muestra el pedido. */
function Harness({ onCheckout }: { onCheckout: (addons: unknown) => void }) {
	const b = usePlanCheckoutBlocks();
	return (
		<div>
			<span data-testid="offer">{String(b.offer)}</span>
			{b.offer && (
				<PlanCheckoutBlocksOption
					planId="premium"
					blocks={b.blocks}
					maxBlocks={b.maxBlocks}
					onChange={b.setBlocks}
					unitPrice={b.unitPrice}
					unitCurrency={b.unitCurrency}
					foldersPerBlock={b.foldersPerBlock}
					totalLabel={formatPlanBlocksTotal({
						planPrice: 29.99,
						planCurrency: "usd",
						planFolders: 500,
						blocks: b.blocks,
						unitPrice: b.unitPrice,
						unitCurrency: b.unitCurrency,
						foldersPerBlock: b.foldersPerBlock,
					})}
				/>
			)}
			<button type="button" onClick={() => onCheckout(withBlocks(["mcp_access"], b.blocks))}>
				Suscribirme
			</button>
		</div>
	);
}

beforeEach(() => {
	vi.clearAllMocks();
	mockLoggedIn = true;
	mockGetExtraFolders.mockResolvedValue(freeStatus());
});

describe("oferta del selector", () => {
	it("usuario sin plan pago con venta abierta: aparece con el precio por bloque", async () => {
		render(<Harness onCheckout={vi.fn()} />);
		await waitFor(() => expect(screen.getByTestId("offer")).toHaveTextContent("true"));
		expect(screen.getByText("Sumar causas adicionales (+US$ 9/mes c/u)")).toBeInTheDocument();
		expect(screen.getByText("Cada bloque suma 250 causas activas. Se paga junto con el plan.")).toBeInTheDocument();
	});

	it.each<[string, Partial<ExtraFoldersStatus>]>([
		["usuario con plan pago", { plan: "standard", eligibilityReason: "premium_required" }],
		["venta cerrada sin bypass", { publicAvailable: false, availabilityReason: "not_public" }],
		["mantenimiento", { availabilityReason: "maintenance", maintenanceMessage: "x" }],
	])("%s: no aparece", async (_label, over) => {
		mockGetExtraFolders.mockResolvedValue(freeStatus(over));
		render(<Harness onCheckout={vi.fn()} />);
		await waitFor(() => expect(mockGetExtraFolders).toHaveBeenCalled());
		expect(screen.getByTestId("offer")).toHaveTextContent("false");
		expect(screen.queryByTestId("plan-blocks-option-premium")).not.toBeInTheDocument();
	});

	it("sin login no consulta el hub", async () => {
		mockLoggedIn = false;
		render(<Harness onCheckout={vi.fn()} />);
		expect(screen.getByTestId("offer")).toHaveTextContent("false");
		expect(mockGetExtraFolders).not.toHaveBeenCalled();
	});

	it("si el hub falla, no se ofrece y el plan se contrata igual", async () => {
		mockGetExtraFolders.mockRejectedValue(new Error("red"));
		const onCheckout = vi.fn();
		render(<Harness onCheckout={onCheckout} />);
		await waitFor(() => expect(mockGetExtraFolders).toHaveBeenCalled());
		expect(screen.getByTestId("offer")).toHaveTextContent("false");
		fireEvent.click(screen.getByText("Suscribirme"));
		expect(onCheckout).toHaveBeenCalledWith(["mcp_access"]);
	});
});

describe("cantidad, total y pedido", () => {
	it("más y menos acotan a 0..maxBlocks, muestran el total y arman el pedido", async () => {
		const onCheckout = vi.fn();
		render(<Harness onCheckout={onCheckout} />);
		const plus = await screen.findByRole("button", { name: "Sumar un bloque de causas" });
		const minus = screen.getByRole("button", { name: "Quitar un bloque de causas" });
		expect(minus).toBeDisabled();

		fireEvent.click(plus);
		fireEvent.click(plus);
		expect(screen.getByTestId("plan-blocks-count-premium")).toHaveTextContent("2");
		expect(screen.getByText("Plan Premium US$ 29,99 + 2 bloques US$ 18 = US$ 47,99/mes · 1.000 causas")).toBeInTheDocument();

		fireEvent.click(plus);
		expect(screen.getByTestId("plan-blocks-count-premium")).toHaveTextContent("3");
		expect(plus).toBeDisabled();

		fireEvent.click(screen.getByText("Suscribirme"));
		expect(onCheckout).toHaveBeenCalledWith(["mcp_access", { key: "extra_folders", quantity: 3 }]);

		fireEvent.click(minus);
		fireEvent.click(minus);
		fireEvent.click(minus);
		expect(screen.getByTestId("plan-blocks-count-premium")).toHaveTextContent("0");
		fireEvent.click(screen.getByText("Suscribirme"));
		expect(onCheckout).toHaveBeenLastCalledWith(["mcp_access"]);
	});
});

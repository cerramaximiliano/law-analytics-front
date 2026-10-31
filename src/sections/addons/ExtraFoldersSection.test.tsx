/**
 * Add-on «Causas adicionales» (extra_folders): sección de Cuenta → Suscripción y línea bajo
 * Premium en precios. El hub decide qué se puede (canIncrease/canDecrease); la UI arma el
 * total de bloques y confirma antes de cobrar.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ExtraFoldersStatus, PublicAddon } from "store/reducers/ApiService";

const mockDispatch = vi.fn();
const mockGet = vi.fn();
const mockSet = vi.fn();
let mockPublicAddons: PublicAddon[] = [];

vi.mock("react-redux", () => ({ useDispatch: () => mockDispatch }));
vi.mock("store/reducers/ApiService", () => ({
	default: { getExtraFolders: (...a: any[]) => mockGet(...a), setExtraFolders: (...a: any[]) => mockSet(...a) },
}));
vi.mock("store/reducers/auth", () => ({ fetchCurrentSubscription: vi.fn(() => ({ type: "refresh" })) }));
vi.mock("store/reducers/snackbar", () => ({ openSnackbar: vi.fn((p) => ({ type: "snackbar", payload: p })) }));
vi.mock("hooks/usePublicAddons", () => ({ usePublicAddons: () => ({ addons: mockPublicAddons, loading: false }) }));
vi.mock("sections/mcp/McpSectionShell", () => ({
	default: ({ title, subtitle, children }: any) => (
		<section>
			<h2>{title}</h2>
			<p>{subtitle}</p>
			{children}
		</section>
	),
}));

import ExtraFoldersSection, { folderLimitWith, isExtraFoldersVisible } from "./ExtraFoldersSection";
import ExtraFoldersPlanNote from "components/cards/ExtraFoldersPlanNote";

const status = (over: Partial<ExtraFoldersStatus> = {}): ExtraFoldersStatus => ({
	key: "extra_folders",
	block: { folders: 250, storage: 100 },
	maxBlocks: 20,
	price: { amount: 9, currency: "usd", interval: "month" },
	requiredPlans: ["premium"],
	plan: "premium",
	blocks: { purchased: 1, scheduled: null, scheduledAt: null, granted: 0, counted: 1 },
	folders: { used: 600, plan: 500, extra: 250, limit: 750 },
	storage: { usedMB: 10, plan: 200, extra: 100, limit: 300 },
	eligible: true,
	eligibilityReason: null,
	publicAvailable: true,
	availabilityReason: null,
	maintenanceMessage: null,
	purchaseBypass: null,
	canIncrease: true,
	canDecrease: true,
	nextBillingDate: "2026-11-30T00:00:00.000Z",
	grace: null,
	...over,
});

beforeEach(() => {
	vi.clearAllMocks();
	mockPublicAddons = [];
});

describe("reglas puras", () => {
	it("visible con Premium y venta abierta, o con bloques vigentes", () => {
		expect(isExtraFoldersVisible(status())).toBe(true);
		const noBlocks = { purchased: 0, scheduled: null, scheduledAt: null, granted: 0, counted: 0 };
		expect(isExtraFoldersVisible(status({ blocks: noBlocks, publicAvailable: false }))).toBe(false);
		expect(isExtraFoldersVisible(status({ blocks: noBlocks, publicAvailable: false, purchaseBypass: { reason: "admin" } }))).toBe(true);
		expect(isExtraFoldersVisible(status({ blocks: noBlocks, plan: "pro", eligibilityReason: "premium_required" }))).toBe(false);
	});

	it("el límite con N bloques conserva los regalados", () => {
		const s = status({ blocks: { purchased: 2, scheduled: null, scheduledAt: null, granted: 1, counted: 3 } });
		expect(folderLimitWith(s, 0)).toBe(750);
		expect(folderLimitWith(s, 2)).toBe(1250);
	});
});

describe("ExtraFoldersSection", () => {
	it("no renderiza nada si no corresponde", async () => {
		mockGet.mockResolvedValue(
			status({ plan: "standard", publicAvailable: true, blocks: { purchased: 0, scheduled: null, scheduledAt: null, granted: 0, counted: 0 } }),
		);
		const { container } = render(<ExtraFoldersSection />);
		await waitFor(() => expect(mockGet).toHaveBeenCalled());
		expect(container.querySelector("[data-testid=extra-folders-section]")).toBeNull();
	});

	it("subir: confirma, llama al hub con el total y refresca", async () => {
		mockGet.mockResolvedValue(status());
		mockSet.mockResolvedValue({ success: true, result: "increased", blocks: 2 });
		render(<ExtraFoldersSection />);
		await screen.findByTestId("extra-folders-section");
		expect(screen.getByText("600 / 750")).toBeTruthy();

		fireEvent.click(screen.getByLabelText("Sumar un bloque"));
		expect(screen.getByTestId("extra-folders-target").textContent).toBe("2 bloques");
		fireEvent.click(screen.getByTestId("extra-folders-apply"));
		expect(await screen.findByText(/tu límite sube a 1.000 causas activas/)).toBeTruthy();
		fireEvent.click(screen.getByTestId("extra-folders-confirm"));

		await waitFor(() => expect(mockSet).toHaveBeenCalledWith(2));
		await waitFor(() => expect(mockGet).toHaveBeenCalledTimes(2));
		expect(mockDispatch).toHaveBeenCalledWith({ type: "refresh" });
	});

	it("tarjeta rechazada: el error queda en el diálogo", async () => {
		mockGet.mockResolvedValue(status());
		mockSet.mockResolvedValue({ success: false, code: "CARD_DECLINED", message: "Tarjeta rechazada. No se realizó ningún cargo." });
		render(<ExtraFoldersSection />);
		await screen.findByTestId("extra-folders-section");
		fireEvent.click(screen.getByLabelText("Sumar un bloque"));
		fireEvent.click(screen.getByTestId("extra-folders-apply"));
		fireEvent.click(await screen.findByTestId("extra-folders-confirm"));
		expect(await screen.findByText("Tarjeta rechazada. No se realizó ningún cargo.")).toBeTruthy();
		expect(mockGet).toHaveBeenCalledTimes(1);
	});

	it("bajar por debajo del uso avisa del archivado", async () => {
		mockGet.mockResolvedValue(status());
		render(<ExtraFoldersSection />);
		await screen.findByTestId("extra-folders-section");
		fireEvent.click(screen.getByLabelText("Quitar un bloque"));
		fireEvent.click(screen.getByTestId("extra-folders-apply"));
		expect(await screen.findByText(/100 por encima/)).toBeTruthy();
	});

	it("baja programada: «Mantener mis bloques» manda la cantidad actual", async () => {
		mockGet.mockResolvedValue(
			status({ blocks: { purchased: 2, scheduled: 1, scheduledAt: "2026-11-30T00:00:00.000Z", granted: 0, counted: 2 } }),
		);
		mockSet.mockResolvedValue({ success: true, result: "reduction_cancelled", blocks: 2, message: "Cancelaste la baja programada." });
		render(<ExtraFoldersSection />);
		await screen.findByText(/pasás de 2 bloques a 1 bloque/);
		fireEvent.click(screen.getAllByText("Mantener mis bloques")[0]);
		fireEvent.click(await screen.findByTestId("extra-folders-confirm"));
		await waitFor(() => expect(mockSet).toHaveBeenCalledWith(2));
	});

	it("sin elegibilidad muestra el motivo y no deja editar", async () => {
		mockGet.mockResolvedValue(
			status({
				eligibilityReason: "subscription_canceling",
				eligible: false,
				canIncrease: false,
				canDecrease: false,
			}),
		);
		render(<ExtraFoldersSection />);
		expect(await screen.findByText(/programada para cancelarse/)).toBeTruthy();
		expect(screen.queryByTestId("extra-folders-apply")).toBeNull();
	});
});

describe("ExtraFoldersPlanNote", () => {
	const addon: PublicAddon = {
		key: "extra_folders",
		displayName: "Causas adicionales",
		description: "",
		priceMonthly: 9,
		currency: "usd",
		interval: "month",
		available: true,
		requiredPlans: ["premium"],
		requiresIntegrationsAny: [],
		block: { folders: 250, storage: 100 },
	};

	it("muestra bloque y precio si está disponible", () => {
		mockPublicAddons = [addon];
		render(<ExtraFoldersPlanNote />);
		expect(screen.getByTestId("extra-folders-plan-note").textContent).toContain("+250 causas y +100 MB por US$ 9/mes");
	});

	it("con la venta cerrada no aparece", () => {
		mockPublicAddons = [{ ...addon, available: false }];
		const { container } = render(<ExtraFoldersPlanNote />);
		expect(container.innerHTML).toBe("");
	});
});

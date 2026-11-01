/**
 * Modal de límite alcanzado: a un Premium sin lugar le ofrece bloques de «Causas adicionales»
 * en vez de listar planes inferiores. El resto de los casos sigue mostrando planes.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import type { ExtraFoldersStatus } from "store/reducers/ApiService";

const mockDispatch = vi.fn();
const mockGet = vi.fn();
const mockSet = vi.fn();
const mockPlans = vi.fn();
let mockTeam = { isTeamMode: false, isOwner: false };

vi.mock("react-redux", () => ({ useDispatch: () => mockDispatch }));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("contexts/TeamContext", () => ({ useTeam: () => mockTeam }));
vi.mock("store/reducers/ApiService", () => ({
	default: {
		getExtraFolders: (...a: any[]) => mockGet(...a),
		setExtraFolders: (...a: any[]) => mockSet(...a),
		getPublicPlans: (...a: any[]) => mockPlans(...a),
	},
}));
vi.mock("store/reducers/auth", () => ({ fetchCurrentSubscription: vi.fn(() => ({ type: "refresh" })) }));
vi.mock("store/reducers/snackbar", () => ({ openSnackbar: vi.fn((p) => ({ type: "snackbar", payload: p })) }));
vi.mock("components/cards/PlanCard", () => ({ default: ({ plan }: any) => <div data-testid="plan-card">{plan.planId}</div> }));

// eslint-disable-next-line import/first
import { LimitErrorModal, isExtraFoldersLimit } from "./LimitErrorModal";

const status = (over: Partial<ExtraFoldersStatus> = {}): ExtraFoldersStatus => ({
	key: "extra_folders",
	block: { folders: 250, storage: 100 },
	maxBlocks: 20,
	price: { amount: 9, currency: "usd", interval: "month" },
	requiredPlans: ["premium"],
	plan: "premium",
	blocks: { purchased: 0, scheduled: null, scheduledAt: null, granted: 0, counted: 0 },
	folders: { used: 500, plan: 500, extra: 0, limit: 500 },
	storage: { usedMB: 10, plan: 200, extra: 0, limit: 200 },
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

const limitInfo = (over = {}) => ({ resourceType: "Carpetas", plan: "premium", currentCount: "500", limit: 500, ...over });
const MESSAGE = "Has alcanzado el límite de carpetas para tu plan actual (premium)";

beforeEach(() => {
	vi.clearAllMocks();
	mockTeam = { isTeamMode: false, isOwner: false };
	mockPlans.mockResolvedValue({ success: true, data: [{ planId: "pro", isActive: true }] });
	mockGet.mockResolvedValue(status());
});

describe("isExtraFoldersLimit", () => {
	it("solo causas o almacenamiento en Premium", () => {
		expect(isExtraFoldersLimit(limitInfo(), "")).toBe(true);
		expect(isExtraFoldersLimit(limitInfo({ resourceType: undefined }), MESSAGE)).toBe(true);
		expect(isExtraFoldersLimit(limitInfo({ resourceType: "Carpetas/Causas", plan: "Premium" }), "")).toBe(true);
		expect(isExtraFoldersLimit(limitInfo({ resourceType: "Contactos" }), "Has alcanzado el límite de contactos")).toBe(false);
		expect(isExtraFoldersLimit(limitInfo({ plan: "pro" }), MESSAGE)).toBe(false);
		expect(isExtraFoldersLimit(undefined, MESSAGE)).toBe(false);
	});
});

describe("LimitErrorModal", () => {
	it("Premium sin lugar: ofrece bloques, cobra al confirmar y cierra", async () => {
		mockSet.mockResolvedValue({ success: true, result: "increased", blocks: 1 });
		const onClose = vi.fn();
		render(<LimitErrorModal open onClose={onClose} message={MESSAGE} limitInfo={limitInfo()} />);

		expect((await screen.findByTestId("extra-folders-target")).textContent).toBe("1 bloque");
		expect(screen.queryByTestId("plan-card")).toBeNull();
		expect(screen.queryByText("Causas activas")).toBeNull(); // el uso ya está en el recuadro de arriba
		expect(screen.queryByText("Actualizá tu plan para continuar")).toBeNull();

		fireEvent.click(screen.getByTestId("extra-folders-apply"));
		fireEvent.click(await screen.findByTestId("extra-folders-confirm"));
		await waitFor(() => expect(mockSet).toHaveBeenCalledWith(1));
		await waitFor(() => expect(onClose).toHaveBeenCalled());
	});

	it("con bloques ya comprados arranca en uno más", async () => {
		mockGet.mockResolvedValue(
			status({
				blocks: { purchased: 2, scheduled: null, scheduledAt: null, granted: 0, counted: 2 },
				folders: { used: 1000, plan: 500, extra: 500, limit: 1000 },
			}),
		);
		render(<LimitErrorModal open onClose={vi.fn()} message={MESSAGE} limitInfo={limitInfo({ limit: 1000, currentCount: "1000" })} />);
		expect((await screen.findByTestId("extra-folders-target")).textContent).toBe("3 bloques");
		expect(screen.getByTestId("extra-folders-apply").textContent).toBe("Sumar bloques");
	});

	it("con la suscripción cancelándose muestra el motivo y no deja comprar", async () => {
		mockGet.mockResolvedValue(
			status({ eligible: false, eligibilityReason: "subscription_canceling", canIncrease: false, canDecrease: false }),
		);
		render(<LimitErrorModal open onClose={vi.fn()} message={MESSAGE} limitInfo={limitInfo()} />);
		expect(await screen.findByText(/programada para cancelarse/)).toBeTruthy();
		expect(screen.queryByTestId("extra-folders-apply")).toBeNull();
	});

	it("miembro de un equipo: no consulta bloques y sigue con los planes", async () => {
		mockTeam = { isTeamMode: true, isOwner: false };
		render(<LimitErrorModal open onClose={vi.fn()} message={MESSAGE} limitInfo={limitInfo()} />);
		expect(await screen.findByTestId("plan-card")).toBeTruthy();
		expect(mockGet).not.toHaveBeenCalled();
	});

	it("dueño de un equipo: ofrece bloques", async () => {
		mockTeam = { isTeamMode: true, isOwner: true };
		render(<LimitErrorModal open onClose={vi.fn()} message={MESSAGE} limitInfo={limitInfo()} />);
		expect(await screen.findByTestId("extra-folders-target")).toBeTruthy();
	});

	it("otro plan u otro recurso: sigue con los planes", async () => {
		render(
			<LimitErrorModal
				open
				onClose={vi.fn()}
				message="Has alcanzado el límite de contactos"
				limitInfo={limitInfo({ resourceType: "Contactos" })}
			/>,
		);
		expect(await screen.findByTestId("plan-card")).toBeTruthy();
		expect(mockGet).not.toHaveBeenCalled();
	});

	it("venta cerrada o error del hub: quedan los planes", async () => {
		mockGet.mockRejectedValue(new Error("red"));
		render(<LimitErrorModal open onClose={vi.fn()} message={MESSAGE} limitInfo={limitInfo()} />);
		expect(await screen.findByTestId("plan-card")).toBeTruthy();
		expect(screen.queryByTestId("extra-folders-target")).toBeNull();
	});

	it("sin resourceType del hub no muestra «undefined»", async () => {
		render(<LimitErrorModal open onClose={vi.fn()} message={MESSAGE} limitInfo={limitInfo({ resourceType: undefined })} />);
		expect(await screen.findByText("Uso actual")).toBeTruthy();
		expect(screen.queryByText(/undefined/)).toBeNull();
	});
});

/**
 * Flujo "plan + Conectores de IA en un solo checkout": checkbox junto al plan →
 * diálogo legal obligatorio → POST /checkout con addons + acceptedPolicyVersion.
 * Sin checkbox el checkout sigue directo. Rechazos propios del add-on se resuelven en
 * el diálogo (política) o con aviso (venta cerrada / ya tiene plan pago).
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { beforeEach, describe, expect, it, vi } from "vitest";

import usePlanCheckoutAddon, { type BeginCheckoutArgs } from "./usePlanCheckoutAddon";
import PlanCheckoutAddonOption from "sections/mcp/PlanCheckoutAddonOption";
import type { McpAddonStatus } from "types/mcpAddon";

const mockDispatch = vi.fn();
const mockRefresh = vi.fn(() => Promise.resolve());
let mockAddon: McpAddonStatus | null = null;
let mockLoggedIn = true;
const mockGetLegalVersions = vi.fn();
const gtm = { cta: vi.fn(), dialog: vi.fn(), error: vi.fn() };

vi.mock("react-redux", () => ({ useDispatch: () => mockDispatch }));
vi.mock("hooks/useAuth", () => ({ default: () => ({ isLoggedIn: mockLoggedIn }) }));
vi.mock("hooks/useMcpAddon", () => ({
	default: () => ({ addon: mockAddon, loading: false, source: "consolidated", refresh: mockRefresh }),
}));
vi.mock("store/reducers/ApiService", () => ({
	default: { getLegalVersions: (...a: unknown[]) => mockGetLegalVersions(...a) },
	LEGAL_ACCEPTANCE_REQUIRED: "LEGAL_ACCEPTANCE_REQUIRED",
	PRIVACY_CONNECTORS_URL: "/privacy-policy#conectores-ia",
}));
vi.mock("utils/gtm", () => ({
	trackMcpAddonCtaClick: (...a: unknown[]) => gtm.cta(...a),
	trackMcpAddonDialogOpen: (...a: unknown[]) => gtm.dialog(...a),
	trackMcpAddonPurchaseError: (...a: unknown[]) => gtm.error(...a),
}));

const POLICY = "privacy-2026-10-05";

const freeAddon = (over: Partial<McpAddonStatus> = {}): McpAddonStatus =>
	({
		key: "mcp_access",
		price: { amount: 4, currency: "usd", interval: "month" },
		status: "none",
		plan: "free",
		subscriptionStatus: null,
		eligible: false,
		eligibilityReason: "paid_plan_required",
		requiredPlans: ["standard", "pro", "premium"],
		publicAvailable: true,
		availabilityReason: null,
		maintenanceMessage: null,
		adminBypass: false,
		purchasable: false,
		canRemove: false,
		canReactivate: false,
		cancellationSource: null,
		nextBillingDate: null,
		endsAt: null,
		hasManualGrant: false,
		legal: {
			privacyVersion: POLICY,
			privacyUrl: "/privacy-policy#conectores-ia",
			previouslyAcceptedVersion: null,
			acceptanceRequired: true,
		},
		access: { allowed: false, via: null, reason: "addon_missing" },
		mcpUrl: "https://mcp.lawanalytics.app/mcp",
		...over,
	} as McpAddonStatus);

/** Mini página: una tarjeta de plan (Estándar US$ 7,99) con el checkbox y el CTA. */
function Harness({ proceed }: { proceed: BeginCheckoutArgs["proceed"] }) {
	const c = usePlanCheckoutAddon();
	return (
		<div>
			<span data-testid="offer">{String(c.offer)}</span>
			{c.offer && (
				<PlanCheckoutAddonOption
					planId="standard"
					checked={c.isSelected("standard")}
					onChange={(v) => c.setSelected("standard", v)}
					addonPrice={c.addonPrice.amount}
					addonCurrency={c.addonPrice.currency}
					totalLabel={c.totalFor("Estándar", 7.99, "usd")}
				/>
			)}
			<button
				type="button"
				onClick={() => c.begin({ planId: "standard", planName: "Estándar", planPrice: 7.99, planCurrency: "usd", proceed })}
			>
				Suscribirme
			</button>
			{c.dialogs}
		</div>
	);
}

const checkbox = () => screen.getByRole("checkbox", { name: /Agregar Conectores de IA/ });

beforeEach(() => {
	vi.clearAllMocks();
	mockAddon = freeAddon();
	mockLoggedIn = true;
	mockGetLegalVersions.mockResolvedValue({ privacy: POLICY, privacyUrl: "/privacy-policy#conectores-ia" });
});

describe("checkbox junto al plan", () => {
	it("usuario Free con venta abierta: muestra el checkbox con el precio y, marcado, el total", () => {
		render(<Harness proceed={vi.fn()} />);
		expect(checkbox()).not.toBeChecked();
		expect(screen.getByText("Agregar Conectores de IA (+US$ 4/mes)")).toBeInTheDocument();
		fireEvent.click(checkbox());
		expect(checkbox()).toBeChecked();
		expect(screen.getByText("Plan Estándar US$ 7,99 + Conectores de IA US$ 4 = US$ 11,99/mes")).toBeInTheDocument();
		expect(gtm.cta).toHaveBeenCalledWith("plan_checkout", "plan_standard", "free");
	});

	it.each<[string, Partial<McpAddonStatus>]>([
		["usuario con plan pago", { plan: "standard", eligibilityReason: null, eligible: true }],
		["venta cerrada sin bypass", { publicAvailable: false, availabilityReason: "not_public" }],
		["miembro de equipo", { eligibilityReason: "team_member" }],
	])("%s: no hay checkbox", (_l, over) => {
		mockAddon = freeAddon(over);
		render(<Harness proceed={vi.fn()} />);
		expect(screen.getByTestId("offer")).toHaveTextContent("false");
		expect(screen.queryByRole("checkbox")).toBeNull();
	});

	it("admin con bypass y venta cerrada: hay checkbox", () => {
		mockAddon = freeAddon({ publicAvailable: false, availabilityReason: "not_public", adminBypass: true });
		render(<Harness proceed={vi.fn()} />);
		expect(checkbox()).toBeInTheDocument();
	});
});

describe("flujo de checkout", () => {
	it("sin marcar: checkout directo sin add-on ni diálogo", async () => {
		const proceed = vi.fn().mockResolvedValue({ success: true, url: "https://checkout" });
		render(<Harness proceed={proceed} />);
		fireEvent.click(screen.getByRole("button", { name: "Suscribirme" }));
		await waitFor(() => expect(proceed).toHaveBeenCalledWith(undefined));
		expect(screen.queryByRole("dialog")).toBeNull();
	});

	it("marcado: abre el diálogo legal con el total; sin aceptar no avanza; al aceptar llama al checkout con addons + versión", async () => {
		const proceed = vi.fn().mockResolvedValue({ success: true, url: "https://checkout.stripe.com/x" });
		render(<Harness proceed={proceed} />);
		fireEvent.click(checkbox());
		fireEvent.click(screen.getByRole("button", { name: "Suscribirme" }));

		const dialog = await screen.findByRole("dialog");
		expect(gtm.dialog).toHaveBeenCalledWith("plan_checkout", true);
		expect(screen.getByTestId("mcp-addon-plan-total")).toHaveTextContent("Plan Estándar US$ 7,99 + Conectores de IA US$ 4 = US$ 11,99/mes");
		const continueBtn = screen.getByRole("button", { name: "Continuar al pago" });
		expect(continueBtn).toBeDisabled();
		expect(proceed).not.toHaveBeenCalled();

		fireEvent.click(screen.getByRole("checkbox", { name: /Leí y acepto/ }));
		fireEvent.click(continueBtn);
		await waitFor(() => expect(proceed).toHaveBeenCalledWith({ addons: ["mcp_access"], acceptedPolicyVersion: POLICY }));
		// Redirige a Stripe: el diálogo queda abierto y "Procesando…".
		expect(dialog).toBeInTheDocument();
		await waitFor(() => expect(screen.getByRole("button", { name: "Procesando…" })).toBeDisabled());
	});

	it("sin política activa: el diálogo no exige checkbox y manda acceptedPolicyVersion null", async () => {
		mockAddon = freeAddon({
			legal: { privacyVersion: null, privacyUrl: "/p", previouslyAcceptedVersion: null, acceptanceRequired: false },
		});
		const proceed = vi.fn().mockResolvedValue({ success: true, url: "https://checkout" });
		render(<Harness proceed={proceed} />);
		fireEvent.click(checkbox());
		fireEvent.click(screen.getByRole("button", { name: "Suscribirme" }));
		fireEvent.click(await screen.findByRole("button", { name: "Continuar al pago" }));
		await waitFor(() => expect(proceed).toHaveBeenCalledWith({ addons: ["mcp_access"], acceptedPolicyVersion: null }));
	});

	it("LEGAL_ACCEPTANCE_REQUIRED (política nueva): el diálogo sigue abierto con aviso y la versión nueva", async () => {
		const proceed = vi
			.fn()
			.mockResolvedValueOnce({
				success: false,
				code: "LEGAL_ACCEPTANCE_REQUIRED",
				privacyVersion: "privacy-2026-11-01",
				privacyUrl: "/privacy-policy",
			})
			.mockResolvedValueOnce({ success: true, url: "https://checkout" });
		render(<Harness proceed={proceed} />);
		fireEvent.click(checkbox());
		fireEvent.click(screen.getByRole("button", { name: "Suscribirme" }));
		fireEvent.click(await screen.findByRole("checkbox", { name: /Leí y acepto/ }));
		fireEvent.click(screen.getByRole("button", { name: "Continuar al pago" }));

		expect(await screen.findByText(/La Política de Privacidad se actualizó/)).toBeInTheDocument();
		expect(gtm.error).toHaveBeenCalledWith("plan_checkout", "LEGAL_ACCEPTANCE_REQUIRED");
		// Hay que volver a aceptar (el checkbox arranca destildado con la versión nueva).
		await waitFor(() => expect(screen.getByRole("button", { name: "Continuar al pago" })).toBeDisabled());
		fireEvent.click(screen.getByRole("checkbox", { name: /Leí y acepto/ }));
		fireEvent.click(screen.getByRole("button", { name: "Continuar al pago" }));
		await waitFor(() => expect(proceed).toHaveBeenLastCalledWith({ addons: ["mcp_access"], acceptedPolicyVersion: "privacy-2026-11-01" }));
	});

	it.each(["ADDON_NOT_AVAILABLE", "ADDON_USE_ADDON_FLOW"])("%s: cierra el diálogo, destilda, avisa y relee el estado", async (code) => {
		const proceed = vi.fn().mockResolvedValue({ success: false, code, reason: "not_public" });
		render(<Harness proceed={proceed} />);
		fireEvent.click(checkbox());
		fireEvent.click(screen.getByRole("button", { name: "Suscribirme" }));
		fireEvent.click(await screen.findByRole("checkbox", { name: /Leí y acepto/ }));
		fireEvent.click(screen.getByRole("button", { name: "Continuar al pago" }));
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
		expect(checkbox()).not.toBeChecked();
		expect(mockDispatch).toHaveBeenCalled();
		expect(mockRefresh).toHaveBeenCalled();
		expect(gtm.error).toHaveBeenCalledWith("plan_checkout", code);
	});

	it("rechazo general del checkout (p. ej. descuento inválido): cierra el diálogo, el aviso lo da la página", async () => {
		const proceed = vi.fn().mockResolvedValue({ success: false, code: "INVALID_DISCOUNT_CODE", message: "Código vencido" });
		render(<Harness proceed={proceed} />);
		fireEvent.click(checkbox());
		fireEvent.click(screen.getByRole("button", { name: "Suscribirme" }));
		fireEvent.click(await screen.findByRole("checkbox", { name: /Leí y acepto/ }));
		fireEvent.click(screen.getByRole("button", { name: "Continuar al pago" }));
		await waitFor(() => expect(screen.queryByRole("dialog")).toBeNull());
		expect(mockDispatch).not.toHaveBeenCalled();
	});

	it("estado del add-on sin `legal` (fallback): pide la versión a /api/legal/versions", async () => {
		mockAddon = freeAddon({ legal: null });
		render(<Harness proceed={vi.fn()} />);
		fireEvent.click(checkbox());
		fireEvent.click(screen.getByRole("button", { name: "Suscribirme" }));
		await screen.findByRole("dialog");
		expect(mockGetLegalVersions).toHaveBeenCalledTimes(1);
		expect(screen.getByRole("checkbox", { name: /Leí y acepto/ })).toBeInTheDocument();
	});
});

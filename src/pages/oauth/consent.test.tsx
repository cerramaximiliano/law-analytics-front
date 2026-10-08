/**
 * /oauth/consent — Etapa F (escritura, ESCRITURA.md §2.1): bloque propio cuando
 * el step-up pide `mcp:write`, granted_scopes, aceptación de política y GTM.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OauthConsentPage from "./consent";
import { trackOauthConsentAccept, trackOauthConsentReject, trackOauthConsentView } from "utils/gtm";

const mockPost = vi.fn();
const mockNavigate = vi.fn();
let contextState: any = { status: "loading" };

vi.mock("react-router-dom", async (orig) => ({ ...(await orig<any>()), useNavigate: () => mockNavigate }));
vi.mock("utils/axios", () => ({ default: { post: (...args: any[]) => mockPost(...args) } }));
vi.mock("hooks/useOauthConsentContext", () => ({ useOauthConsentContext: () => contextState }));
vi.mock("utils/gtm", () => ({
	trackOauthConsentAccept: vi.fn(),
	trackOauthConsentReject: vi.fn(),
	trackOauthConsentView: vi.fn(),
}));
vi.mock("sections/auth/AuthWrapper", () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock("components/logo", () => ({ default: () => null }));
vi.mock("sections/oauth/OauthClientBanner", () => ({ default: ({ clientName }: any) => <div>{clientName}</div> }));

const READ_LABEL =
	"Consultar la información de tu cuenta (carpetas, movimientos, agenda, contactos, cálculos, documentos y jurisprudencia)";
const WRITE_LABEL = "Crear y modificar tareas, eventos, notas y contactos (no puede borrar ni archivar)";

const ready = (overrides: Record<string, any> = {}) => ({
	status: "ready",
	context: {
		client: {
			client_id: "cl-1",
			name: "Claude",
			vendor: "Anthropic",
			verified: true,
			logo_url: null,
			vendor_url: null,
			provider: "claude",
		},
		user: { email: "maria@x.com", name: "María Pérez", subscription_plan: "standard", access_via: "plan" },
		requested_scope: ["openid", "offline_access", "mcp:access"],
		requested_access_token_audience: [],
		plan_check: { allowed: true, reason: "ok", plan: "standard", addon_status: "active" },
		skip: false,
		legal: { privacy_version: "2026-10-01", privacy_url: null, previously_accepted_version: "2026-10-01" },
		...overrides,
	},
});

const renderPage = () =>
	render(
		<MemoryRouter initialEntries={["/oauth/consent?consent_challenge=abc"]}>
			<OauthConsentPage />
		</MemoryRouter>,
	);

beforeEach(() => {
	vi.clearAllMocks();
	Object.defineProperty(window, "location", { value: { href: "" }, writable: true });
	mockPost.mockResolvedValue({ data: { redirect_to: "https://auth.lawanalytics.app/done" } });
});

describe("/oauth/consent — solo lectura", () => {
	it("muestra la etiqueta nueva de mcp:access (sin 'solo lectura') y no el bloque de escritura", async () => {
		contextState = ready();
		renderPage();

		expect(screen.getByText(READ_LABEL)).toBeTruthy();
		expect(screen.queryByText(/solo lectura/i)).toBeNull();
		expect(screen.queryByTestId("consent-write-block")).toBeNull();
		expect(screen.getByRole("button", { name: "Autorizar" })).toBeTruthy();
		expect(trackOauthConsentView).toHaveBeenCalledWith("cl-1", "Claude", true, false);
	});

	it("política ya aceptada → pre-marcada; acepta con los scopes pedidos y scope_write=false", async () => {
		contextState = ready();
		renderPage();

		const btn = screen.getByRole("button", { name: "Autorizar" }) as HTMLButtonElement;
		await waitFor(() => expect(btn.disabled).toBe(false));
		fireEvent.click(btn);

		await waitFor(() => expect(window.location.href).toBe("https://auth.lawanalytics.app/done"));
		expect(mockPost).toHaveBeenCalledWith("/api/oauth/consent/accept", {
			consent_challenge: "abc",
			granted_scopes: ["openid", "offline_access", "mcp:access"],
			remember: true,
			accepted_policy_version: "2026-10-01",
		});
		expect(trackOauthConsentAccept).toHaveBeenCalledWith("cl-1", ["openid", "offline_access", "mcp:access"], false);
	});
});

describe("/oauth/consent — step-up con mcp:write", () => {
	const WRITE_SCOPES = ["openid", "offline_access", "mcp:access", "mcp:write"];

	it("muestra el bloque de escritura, la etiqueta de mcp:write y el botón Permitir", () => {
		contextState = ready({ requested_scope: WRITE_SCOPES });
		renderPage();

		const block = screen.getByTestId("consent-write-block");
		expect(block.textContent).toContain("Claude pide permiso para crear y modificar tareas, eventos, notas y contactos en tu cuenta.");
		expect(block.textContent).toContain("No puede borrar ni archivar. Lo que cree queda marcado como creado por el asistente.");
		expect(screen.getByText(WRITE_LABEL)).toBeTruthy();
		expect(screen.getByRole("button", { name: "Permitir" })).toBeTruthy();
		expect(trackOauthConsentView).toHaveBeenCalledWith("cl-1", "Claude", true, true);
	});

	it("exige marcar la política aunque ya se haya aceptado la versión vigente; manda mcp:write y la versión", async () => {
		contextState = ready({ requested_scope: WRITE_SCOPES });
		renderPage();

		const btn = screen.getByRole("button", { name: "Permitir" }) as HTMLButtonElement;
		expect(btn.disabled).toBe(true);

		fireEvent.click(screen.getByRole("checkbox", { name: /Leí y acepto/ }));
		expect(btn.disabled).toBe(false);
		fireEvent.click(btn);

		await waitFor(() => expect(window.location.href).toBe("https://auth.lawanalytics.app/done"));
		expect(mockPost).toHaveBeenCalledWith("/api/oauth/consent/accept", {
			consent_challenge: "abc",
			granted_scopes: WRITE_SCOPES,
			remember: true,
			accepted_policy_version: "2026-10-01",
		});
		expect(trackOauthConsentAccept).toHaveBeenCalledWith("cl-1", WRITE_SCOPES, true);
	});

	it("Rechazar → flujo de rechazo existente con scope_write=true", async () => {
		contextState = ready({ requested_scope: WRITE_SCOPES });
		renderPage();

		fireEvent.click(screen.getByRole("button", { name: "Rechazar" }));
		await waitFor(() => expect(window.location.href).toBe("https://auth.lawanalytics.app/done"));
		expect(mockPost).toHaveBeenCalledWith("/api/oauth/consent/reject", { consent_challenge: "abc", reason: "user_declined" });
		expect(trackOauthConsentReject).toHaveBeenCalledWith("cl-1", "user_declined", true);
	});

	it("hub con write.allowed=false → muestra su mensaje, no ofrece escritura y no manda mcp:write", async () => {
		contextState = ready({
			requested_scope: WRITE_SCOPES,
			write: { allowed: false, reason: "beta_grant_required", message: "La escritura está en beta cerrada." },
		});
		renderPage();

		expect(screen.queryByTestId("consent-write-block")).toBeNull();
		expect(screen.getByTestId("consent-write-blocked").textContent).toContain("La escritura está en beta cerrada.");
		expect(screen.queryByText(WRITE_LABEL)).toBeNull();
		expect(trackOauthConsentView).toHaveBeenCalledWith("cl-1", "Claude", true, false);

		const btn = screen.getByRole("button", { name: "Autorizar" }) as HTMLButtonElement;
		await waitFor(() => expect(btn.disabled).toBe(false));
		fireEvent.click(btn);
		await waitFor(() => expect(mockPost).toHaveBeenCalled());
		expect(mockPost.mock.calls[0][1].granted_scopes).toEqual(["openid", "offline_access", "mcp:access"]);
	});
});

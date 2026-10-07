/**
 * /oauth/login — sesión recordada de Hydra (skip) y cambio de cuenta.
 * Incidente 2026-10-07: el challenge venía con skip:true, se mostraba el form
 * igual y, al ingresar con otra cuenta, Hydra pedía el login dos veces.
 */
import { fireEvent, render, screen, waitFor } from "@testing-library/react";
import { MemoryRouter } from "react-router-dom";
import { beforeEach, describe, expect, it, vi } from "vitest";

import OauthLoginPage, { OAUTH_LOGIN_NOTICE_KEY } from "./login";

const mockPost = vi.fn();
let contextState: any = { status: "loading" };

vi.mock("utils/axios", () => ({ default: { post: (...args: any[]) => mockPost(...args) } }));
vi.mock("hooks/useOauthLoginContext", () => ({ useOauthLoginContext: () => contextState }));
vi.mock("@react-oauth/google", () => ({ useGoogleLogin: () => vi.fn() }));
vi.mock("utils/gtm", () => ({
	trackOauthLoginError: vi.fn(),
	trackOauthLoginSubmit: vi.fn(),
	trackOauthLoginSuccess: vi.fn(),
	trackOauthLoginView: vi.fn(),
}));
vi.mock("sections/auth/AuthWrapper", () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock("sections/auth/AuthDivider", () => ({ default: ({ children }: any) => <div>{children}</div> }));
vi.mock("components/logo", () => ({ default: () => null }));
vi.mock("components/auth/CustomGoogleButton", () => ({ default: ({ text }: any) => <button type="button">{text}</button> }));
vi.mock("sections/oauth/OauthClientBanner", () => ({ default: ({ clientName }: any) => <div>{clientName}</div> }));

const READY = {
	status: "ready",
	context: {
		client: { client_id: "cl-1", client_name: "Claude", logo_uri: null },
		requested_scope: ["mcp:access"],
		skip: true,
		subject: "user-123",
		remembered: { email: "maria@x.com", name: "María Pérez" },
		switch_account_url: "https://auth.lawanalytics.app/oauth2/auth?client_id=cl-1&prompt=login+consent",
	},
};

const sessionStore = new Map<string, string>();
Object.defineProperty(window, "sessionStorage", {
	value: {
		getItem: (k: string) => sessionStore.get(k) ?? null,
		setItem: (k: string, v: string) => void sessionStore.set(k, v),
		removeItem: (k: string) => void sessionStore.delete(k),
	},
});

const renderPage = () =>
	render(
		<MemoryRouter initialEntries={["/oauth/login?login_challenge=abc"]}>
			<OauthLoginPage />
		</MemoryRouter>,
	);

beforeEach(() => {
	mockPost.mockReset();
	sessionStore.clear();
	Object.defineProperty(window, "location", { value: { href: "" }, writable: true });
});

describe("/oauth/login — sesión recordada", () => {
	it("skip:true → 'Continuar como' sin form de credenciales; acepta con accept-remembered y navega", async () => {
		contextState = READY;
		mockPost.mockResolvedValue({ data: { redirect_to: "https://auth.lawanalytics.app/oauth2/auth?login_verifier=v" } });
		renderPage();

		expect(screen.getByText("María Pérez")).toBeTruthy();
		expect(screen.getByText("maria@x.com")).toBeTruthy();
		expect(screen.queryByLabelText("E-mail")).toBeNull();
		expect(screen.queryByText("Continuar con Google")).toBeNull();

		fireEvent.click(screen.getByRole("button", { name: "Continuar como María Pérez" }));
		await waitFor(() => expect(window.location.href).toBe("https://auth.lawanalytics.app/oauth2/auth?login_verifier=v"));
		expect(mockPost).toHaveBeenCalledWith("/api/oauth/login/accept-remembered", { login_challenge: "abc" });
	});

	it("'Usar otra cuenta' → navega a switch_account_url (prompt=login) en vez de mostrar el form", () => {
		contextState = READY;
		renderPage();
		fireEvent.click(screen.getByText("Usar otra cuenta"));
		expect(window.location.href).toBe(READY.context.switch_account_url);
		expect(mockPost).not.toHaveBeenCalled();
	});

	it("sin switch_account_url (hub viejo) 'Usar otra cuenta' muestra el form", () => {
		contextState = { ...READY, context: { ...READY.context, switch_account_url: null } };
		renderPage();
		fireEvent.click(screen.getByText("Usar otra cuenta"));
		expect(window.location.href).toBe("");
		expect(screen.getByLabelText("E-mail")).toBeTruthy();
	});

	it("accept-remembered 409 not_remembered → cae al form", async () => {
		contextState = READY;
		mockPost.mockRejectedValue({ response: { status: 409, data: { error: "not_remembered" } } });
		renderPage();
		fireEvent.click(screen.getByRole("button", { name: "Continuar como María Pérez" }));
		await waitFor(() => expect(screen.getByLabelText("E-mail")).toBeTruthy());
		expect(window.location.href).toBe("");
	});

	it("skip:false → form normal, sin 'Continuar como'", () => {
		contextState = { ...READY, context: { ...READY.context, skip: false, remembered: null, switch_account_url: null } };
		renderPage();
		expect(screen.queryByText(/Continuar como/)).toBeNull();
		expect(screen.getByLabelText("E-mail")).toBeTruthy();
	});
});

describe("/oauth/login — cambio de cuenta y challenge usado", () => {
	it("accept con account_switch deja el aviso para la próxima carga y navega", async () => {
		contextState = { ...READY, context: { ...READY.context, skip: false, remembered: null, switch_account_url: null } };
		mockPost.mockResolvedValue({
			data: {
				redirect_to: "https://auth.lawanalytics.app/oauth2/auth?prompt=login",
				account_switch: true,
				error_description: "Ingresaste con otra cuenta.",
			},
		});
		renderPage();
		fireEvent.change(screen.getByLabelText("E-mail"), { target: { value: "otra@x.com", name: "email" } });
		fireEvent.change(screen.getByLabelText("Contraseña"), { target: { value: "secreta", name: "password" } });
		fireEvent.click(screen.getByRole("button", { name: "Ingresar y continuar" }));
		await waitFor(() => expect(window.location.href).toBe("https://auth.lawanalytics.app/oauth2/auth?prompt=login"));
		expect(sessionStore.get(OAUTH_LOGIN_NOTICE_KEY)).toBe("Ingresaste con otra cuenta.");
		expect(mockPost).toHaveBeenCalledWith("/api/oauth/login/accept", expect.objectContaining({ login_challenge: "abc", remember: true }));
	});

	it("muestra (una vez) el aviso guardado por el cambio de cuenta", () => {
		sessionStore.set(OAUTH_LOGIN_NOTICE_KEY, "Por seguridad, volvé a ingresar.");
		contextState = { ...READY, context: { ...READY.context, skip: false, remembered: null } };
		renderPage();
		expect(screen.getByText("Por seguridad, volvé a ingresar.")).toBeTruthy();
		expect(sessionStore.has(OAUTH_LOGIN_NOTICE_KEY)).toBe(false);
	});

	it("challenge_used con redirect_to → botón para reiniciar la conexión", () => {
		contextState = {
			status: "error",
			code: "challenge_used",
			message: "La solicitud ya fue usada.",
			redirectTo: "https://auth.lawanalytics.app/oauth2/auth?x=1",
		};
		renderPage();
		expect(screen.getByText("La solicitud ya fue usada.")).toBeTruthy();
		expect(screen.getByRole("link", { name: "Reiniciar la conexión" }).getAttribute("href")).toBe(
			"https://auth.lawanalytics.app/oauth2/auth?x=1",
		);
	});
});

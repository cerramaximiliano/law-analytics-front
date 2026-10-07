/**
 * Regresión 2026-10-07: el consent de Claude.ai no mostraba el logo.
 * El hub manda `client.logo_url = "/assets/oauth-clients/claude.svg"` (path
 * relativo a server.lawanalytics.app, 404 en lawanalytics.app) y el banner
 * priorizaba ese `logoUrl` sobre el logo de marca.
 */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import OauthClientBanner from "./OauthClientBanner";
import { deriveAiProvider } from "utils/mcpLegal";

// vi.mock se hoistea: los logos de marca se reemplazan por marcadores.
vi.mock("components/icons/ClaudeAiLogo", () => ({ default: () => <span data-testid="claude-logo" /> }));
vi.mock("components/icons/ChatGptLogo", () => ({ default: () => <span data-testid="chatgpt-logo" /> }));

// Inputs reales del consent context del hub para el client DCR de Claude.ai
// (client_name "Claude" en Hydra; enrichClient lo renombra "Claude AI").
const CONSENT_CLIENT = {
	name: "Claude AI",
	provider: "claude",
	redirect_uris: ["claude.ai"],
	vendor: "Anthropic",
	logo_url: "/assets/oauth-clients/claude.svg",
};

describe("deriveAiProvider con los hints del consent", () => {
	it("provider del hub + host de redirect + vendor → anthropic aunque el nombre no diga claude", () => {
		expect(deriveAiProvider(CONSENT_CLIENT.provider, ...CONSENT_CLIENT.redirect_uris, CONSENT_CLIENT.vendor, "La Artista")).toBe(
			"anthropic",
		);
		expect(deriveAiProvider(undefined, "claude.ai", undefined, "La Artista")).toBe("anthropic");
	});

	it("solo el nombre del cliente (login) también alcanza", () => {
		expect(deriveAiProvider("Claude")).toBe("anthropic");
	});
});

describe("OauthClientBanner", () => {
	it("consent de Claude con logo_url relativo del hub → logo de marca, no <img> roto", () => {
		render(
			<OauthClientBanner
				clientId="3ad157b0"
				clientName={CONSENT_CLIENT.name}
				logoUrl={CONSENT_CLIENT.logo_url}
				verified
				providerHints={[CONSENT_CLIENT.provider, ...CONSENT_CLIENT.redirect_uris, CONSENT_CLIENT.vendor]}
			/>,
		);
		expect(screen.getByTestId("claude-logo")).toBeTruthy();
		expect(document.querySelector("img")).toBeNull();
		expect(screen.getByText("Claude AI")).toBeTruthy();
	});

	it("login de Claude (sin hints, sin logo_uri) → logo de marca por el nombre", () => {
		render(<OauthClientBanner clientName="Claude" logoUrl={null} />);
		expect(screen.getByTestId("claude-logo")).toBeTruthy();
	});

	it("ChatGPT → logo de ChatGPT", () => {
		render(<OauthClientBanner clientName="ChatGPT" logoUrl="/assets/oauth-clients/chatgpt.svg" providerHints={["chatgpt"]} />);
		expect(screen.getByTestId("chatgpt-logo")).toBeTruthy();
	});

	it("cliente desconocido con logo propio → avatar con la imagen; sin logo → inicial", () => {
		const { unmount } = render(<OauthClientBanner clientName="Mi Bot" logoUrl="https://mibot.example/logo.png" verified={false} />);
		expect(document.querySelector("img")?.getAttribute("src")).toBe("https://mibot.example/logo.png");
		expect(screen.getByText(/no está verificada/)).toBeTruthy();
		unmount();
		render(<OauthClientBanner clientName="Mi Bot" logoUrl={null} />);
		expect(screen.getByText("M")).toBeTruthy();
	});
});

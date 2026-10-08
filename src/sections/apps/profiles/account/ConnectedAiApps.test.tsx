/** Tarjeta de asistentes conectados: chips por scope, incluido `mcp:write` (Etapa F). */
import { render, screen } from "@testing-library/react";
import { describe, expect, it, vi } from "vitest";

import ConnectedAiApps from "./ConnectedAiApps";

vi.mock("utils/axios", () => ({
	default: {
		get: vi.fn().mockResolvedValue({
			data: {
				count: 1,
				apps: [
					{
						client_id: "cl-1",
						name: "Claude",
						vendor: "Anthropic",
						verified: true,
						logo_url: null,
						vendor_url: null,
						granted_scopes: ["mcp:access", "mcp:write"],
						granted_audiences: [],
						granted_at: "2026-10-08T12:00:00.000Z",
						remember: true,
						remember_for_seconds: 2592000,
					},
				],
			},
		}),
		delete: vi.fn(),
	},
}));
vi.mock("hooks/useMcpAccess", () => ({ default: () => ({ access: null, loading: false }) }));
vi.mock("sections/apps/profiles/account/McpConnectGuide", () => ({ default: () => null }));

describe("ConnectedAiApps — chips de scopes", () => {
	it("muestra 'Crear y modificar' para mcp:write y no dice 'solo lectura'", async () => {
		render(<ConnectedAiApps />);
		expect(await screen.findByText("Crear y modificar")).toBeTruthy();
		expect(screen.getByText("Consultar datos de tu cuenta")).toBeTruthy();
		expect(screen.queryByText(/solo lectura/i)).toBeNull();
	});
});

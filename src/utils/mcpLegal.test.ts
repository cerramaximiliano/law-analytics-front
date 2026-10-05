import { describe, expect, it } from "vitest";

import { MCP_SHARED_DATA_TEXT, aiProviderLabel, deriveAiProvider } from "./mcpLegal";

describe("deriveAiProvider", () => {
	it("detecta Anthropic por provider, redirect o nombre", () => {
		expect(deriveAiProvider("claude")).toBe("anthropic");
		expect(deriveAiProvider(null, "https://claude.ai/api/mcp/auth_callback")).toBe("anthropic");
		expect(deriveAiProvider(undefined, "Anthropic")).toBe("anthropic");
	});

	it("detecta OpenAI por provider, redirect o nombre", () => {
		expect(deriveAiProvider("chatgpt")).toBe("openai");
		expect(deriveAiProvider(null, "https://chatgpt.com/connector_platform_oauth_redirect")).toBe("openai");
		expect(deriveAiProvider("OpenAI")).toBe("openai");
	});

	it("cae a genérico sin pistas o con un cliente desconocido", () => {
		expect(deriveAiProvider()).toBe("other");
		expect(deriveAiProvider(null, undefined, "")).toBe("other");
		expect(deriveAiProvider("Cursor")).toBe("other");
	});
});

describe("aiProviderLabel / MCP_SHARED_DATA_TEXT", () => {
	it("nombra al proveedor", () => {
		expect(aiProviderLabel("anthropic")).toBe("Anthropic");
		expect(aiProviderLabel("openai")).toBe("OpenAI");
		expect(aiProviderLabel("other")).toBe("el proveedor");
	});

	it("enumera los datos compartidos en castellano", () => {
		expect(MCP_SHARED_DATA_TEXT.startsWith("carpetas, movimientos")).toBe(true);
		expect(MCP_SHARED_DATA_TEXT.endsWith("seguimientos postales y jurisprudencia")).toBe(true);
	});
});

import { describe, expect, it } from "vitest";

import { describeConsentScope, describeScopeChip, includesWriteScope, joinSpanishList } from "./mcpScopes";

describe("mcpScopes", () => {
	it("etiquetas de consent", () => {
		expect(describeConsentScope("mcp:access")).toBe(
			"Consultar la información de tu cuenta (carpetas, movimientos, agenda, contactos, cálculos, documentos y jurisprudencia)",
		);
		expect(describeConsentScope("mcp:write")).toBe("Crear y modificar tareas, eventos, notas y contactos (no puede borrar ni archivar)");
		expect(describeConsentScope("otro:scope")).toBe("otro:scope");
	});

	it("chips", () => {
		expect(describeScopeChip("mcp:write")).toBe("Crear y modificar");
		expect(describeScopeChip("x")).toBe("x");
	});

	it("includesWriteScope y joinSpanishList", () => {
		expect(includesWriteScope(["mcp:access", "mcp:write"])).toBe(true);
		expect(includesWriteScope(["mcp:access"])).toBe(false);
		expect(includesWriteScope(undefined)).toBe(false);
		expect(joinSpanishList(["a"])).toBe("a");
		expect(joinSpanishList(["a", "b", "c"])).toBe("a, b y c");
	});
});

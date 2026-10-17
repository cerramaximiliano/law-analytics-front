import { describe, expect, it } from "vitest";
import { codigoCompleto, normalizarCodigo } from "./validacionService";

describe("normalizarCodigo", () => {
	it("pasa a mayúsculas y agrega los guiones", () => {
		expect(normalizarCodigo("7k4m2qxt9zd3")).toBe("7K4M-2QXT-9ZD3");
	});

	it("tolera espacios, guiones y otros separadores mezclados", () => {
		expect(normalizarCodigo(" 7k4m - 2QXT 9zd3 ")).toBe("7K4M-2QXT-9ZD3");
		expect(normalizarCodigo("7K4M--2qxt_9ZD3")).toBe("7K4M-2QXT-9ZD3");
		expect(normalizarCodigo("7K4M-2QXT-9ZD3")).toBe("7K4M-2QXT-9ZD3");
	});

	it("formatea mientras se escribe y corta en 12 caracteres", () => {
		expect(normalizarCodigo("7k4m2")).toBe("7K4M-2");
		expect(normalizarCodigo("7k4m")).toBe("7K4M");
		expect(normalizarCodigo("7k4m2qxt9zd3XYZ")).toBe("7K4M-2QXT-9ZD3");
		expect(normalizarCodigo("")).toBe("");
	});

	it("codigoCompleto solo acepta los tres grupos de cuatro", () => {
		expect(codigoCompleto("7K4M-2QXT-9ZD3")).toBe(true);
		expect(codigoCompleto("7K4M-2QXT-9ZD")).toBe(false);
	});
});

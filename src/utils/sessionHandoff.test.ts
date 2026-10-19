import { describe, expect, it } from "vitest";
import { loginFallbackPath, parseHandoffHash, sanitizeInternalPath } from "./sessionHandoff";

const TOKEN = "a".repeat(43);

describe("parseHandoffHash", () => {
	it("lee token y destino del fragmento", () => {
		expect(parseHandoffHash(`#t=${TOKEN}&next=%2Fapps%2Fcalc%2Flabor`)).toEqual({ token: TOKEN, next: "/apps/calc/labor" });
	});

	it("acepta el fragmento sin numeral y destinos con query", () => {
		expect(parseHandoffHash(`t=${TOKEN}&next=%2Fapps%2Ffolders%2Fdetails%2Fabc%3Ftab%3Drecursos`)).toEqual({
			token: TOKEN,
			next: "/apps/folders/details/abc?tab=recursos",
		});
	});

	it("sin destino o con destino inválido cae al panel", () => {
		expect(parseHandoffHash(`#t=${TOKEN}`).next).toBe("/dashboard/default");
		expect(parseHandoffHash(`#t=${TOKEN}&next=https%3A%2F%2Fevil.test`).next).toBe("/dashboard/default");
		expect(parseHandoffHash(`#t=${TOKEN}&next=%2F%2Fevil.test`).next).toBe("/dashboard/default");
		expect(parseHandoffHash(`#t=${TOKEN}&next=%2Fhandoff%23t%3Dx`).next).toBe("/dashboard/default");
	});

	it("token ausente o con formato raro → null", () => {
		expect(parseHandoffHash("#next=%2Ftareas").token).toBeNull();
		expect(parseHandoffHash("#t=corto").token).toBeNull();
		expect(parseHandoffHash(`#t=${"a".repeat(43)}%3Cscript%3E`).token).toBeNull();
	});
});

describe("sanitizeInternalPath", () => {
	it("solo rutas internas", () => {
		expect(sanitizeInternalPath("/tareas")).toBe("/tareas");
		expect(sanitizeInternalPath("tareas")).toBeNull();
		expect(sanitizeInternalPath("/\\evil")).toBeNull();
		expect(sanitizeInternalPath("/login")).toBeNull();
	});
});

describe("loginFallbackPath", () => {
	it("conserva el destino", () => {
		expect(loginFallbackPath("/apps/calc/labor")).toBe("/login?redirect=%2Fapps%2Fcalc%2Flabor");
	});
});

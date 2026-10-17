import { describe, expect, it } from "vitest";
import { fechaCalculo } from "./calculatorDate";

describe("fechaCalculo", () => {
	it("una fecha guardada a medianoche UTC se muestra como fecha de calendario, sin correrse un día", () => {
		expect(fechaCalculo("2026-10-17T00:00:00.000Z")).toBe("17/10/2026");
		expect(fechaCalculo(new Date("2026-10-17T00:00:00.000Z"))).toBe("17/10/2026");
	});
	it("una fecha con hora se muestra en hora local", () => {
		const local = new Date(2026, 9, 17, 11, 49);
		expect(fechaCalculo(local.toISOString())).toBe("17/10/2026");
	});
	it("vacío o inválido devuelve guion", () => {
		expect(fechaCalculo(null)).toBe("-");
		expect(fechaCalculo("")).toBe("-");
		expect(fechaCalculo("no es fecha")).toBe("-");
	});
});

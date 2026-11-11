import { describe, it, expect } from "vitest";
import dayjs from "utils/dayjs-config";
import { dueDateToIso } from "./taskDueDate";

describe("dueDateToIso", () => {
	it("un día tipeado DD/MM/AAAA se muestra ese mismo día al volver del hub", () => {
		const iso = dueDateToIso("25/11/2026");
		expect(iso).toBeDefined();
		expect(dayjs(iso).format("DD/MM/YYYY")).toBe("25/11/2026");
		// Mediodía local: el día calendario no cambia en ningún huso entre UTC-11 y UTC+11.
		expect(dayjs(iso).hour()).toBe(12);
	});

	it("acepta día y mes sin cero a la izquierda", () => {
		expect(dayjs(dueDateToIso("5/3/2027")).format("DD/MM/YYYY")).toBe("05/03/2027");
	});

	it("un dayjs del DatePicker conserva el día aunque traiga la hora actual", () => {
		const picked = dayjs("2026-11-25T23:30:00");
		expect(dayjs(dueDateToIso(picked)).format("DD/MM/YYYY")).toBe("25/11/2026");
	});

	it("rechaza fechas inválidas o vacías", () => {
		expect(dueDateToIso("31/02/2026")).toBeUndefined();
		expect(dueDateToIso("")).toBeUndefined();
		expect(dueDateToIso(undefined)).toBeUndefined();
	});
});

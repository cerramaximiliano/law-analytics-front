import { beforeEach, describe, expect, it } from "vitest";
import { readListPrefs, writeListPrefs } from "./listPrefs";

// Memoria del listado entre entrar a una causa y volver (6/11/2026).
describe("listPrefs", () => {
	beforeEach(() => sessionStorage.clear());

	it("vacío al principio; mezcla por nivel superior; tolera basura", () => {
		expect(readListPrefs("k")).toEqual({});
		writeListPrefs("k", { pageSize: 100 });
		writeListPrefs("k", { sortBy: [{ id: "lastMovementDate", desc: true }] });
		expect(readListPrefs("k")).toEqual({ pageSize: 100, sortBy: [{ id: "lastMovementDate", desc: true }] });
		sessionStorage.setItem("k", "{no es json");
		expect(readListPrefs("k")).toEqual({});
	});
});

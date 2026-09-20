// El cliente de la API de Google entraba en el arranque de cualquier página
// porque este reductor lo importaba arriba de todo y el store se monta siempre.
// Ahora el servicio se pide dentro de las acciones. Esta prueba evita que
// alguien vuelva a ponerlo como importación de módulo sin darse cuenta
// (2026-09-19, ver la-ads/analysis/2026-09-19-por-que-nadie-hace-clic.md).

import { beforeEach, describe, expect, it, vi } from "vitest";

let vecesImportadaGapi = 0;

vi.mock("gapi-script", () => {
	vecesImportadaGapi++;
	return { gapi: { load: vi.fn(), client: {}, auth2: {} } };
});

describe("googleCalendar: el cliente de Google no viaja en el arranque", () => {
	beforeEach(() => {
		vecesImportadaGapi = 0;
		vi.resetModules();
	});

	it("cargar el reductor no arrastra gapi-script", async () => {
		const modulo = await import("./googleCalendar");
		expect(modulo.default).toBeTruthy();
		expect(vecesImportadaGapi).toBe(0);
	});

	it("el servicio sigue siendo alcanzable por el camino que usan las acciones", async () => {
		const { default: servicio } = await import("services/googleCalendarService");
		expect(typeof servicio.init).toBe("function");
		expect(typeof servicio.fetchEvents).toBe("function");
		expect(typeof servicio.signOut).toBe("function");
		expect(vecesImportadaGapi).toBe(1);
	});
});

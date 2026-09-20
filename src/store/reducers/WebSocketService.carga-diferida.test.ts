// socket.io-client dejó de importarse en el arranque: ahora se pide dentro de
// connect(), que por eso pasó a ser asíncrono. Estas pruebas cubren lo que ese
// cambio puede romper y que no se ve sin iniciar sesión (2026-09-19, ver
// la-ads/analysis/2026-09-19-por-que-nadie-hace-clic.md).
//
// Lo que se verifica:
//   1. la librería no se toca hasta que alguien llama a connect();
//   2. connect() la pide y crea el socket;
//   3. si llega un disconnect() mientras la librería está cargando, la conexión
//      que venía en camino se descarta en vez de quedar huérfana.

import { beforeEach, describe, expect, it, vi } from "vitest";

// Fábrica del doble de socket.io. `resolver` deja la importación colgada a
// propósito para poder meter un disconnect() en el medio.
const sockets: any[] = [];
let resolverImportacion: (() => void) | null = null;
let vecesImportada = 0;

const crearSocketFalso = () => {
	const s = {
		connected: false,
		disconnect: vi.fn(function (this: any) {
			this.connected = false;
		}),
		on: vi.fn(),
		off: vi.fn(),
		emit: vi.fn(),
		io: { on: vi.fn(), off: vi.fn() },
	};
	sockets.push(s);
	return s;
};

vi.mock("socket.io-client", async () => {
	vecesImportada++;
	if (resolverImportacion) {
		await new Promise<void>((resolve) => {
			resolverImportacion = resolve as any;
		});
	}
	return { io: vi.fn(() => crearSocketFalso()) };
});

describe("WebSocketService: carga diferida de socket.io", () => {
	beforeEach(() => {
		sockets.length = 0;
		vecesImportada = 0;
		resolverImportacion = null;
		vi.resetModules();
	});

	it("no pide la librería hasta que alguien conecta", async () => {
		const { default: servicio } = await import("./WebSocketService");
		expect(servicio).toBeTruthy();
		expect(vecesImportada).toBe(0);
	});

	it("connect() pide la librería y crea el socket", async () => {
		const { default: servicio } = await import("./WebSocketService");
		await servicio.connect("usuario-de-prueba");
		expect(vecesImportada).toBe(1);
		expect(sockets).toHaveLength(1);
	});

	it("un disconnect() durante la carga descarta la conexión en camino", async () => {
		const { default: servicio } = await import("./WebSocketService");

		// Primera conexión, ya establecida.
		await servicio.connect("usuario-de-prueba");
		expect(sockets).toHaveLength(1);

		// Segunda: se la interrumpe con un disconnect() antes de que termine.
		const enCamino = servicio.connect("usuario-de-prueba");
		servicio.disconnect();
		await enCamino;

		// El socket de la segunda no llegó a crearse.
		expect(sockets).toHaveLength(1);
	});
});

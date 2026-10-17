import { describe, expect, it, vi } from "vitest";
import { armarBloquesTramos, labelTipoPago } from "./previsionalTramos";

vi.mock("utils/axios", () => ({ default: { post: vi.fn() } }));

// Caso real (Troche, 10/2026): un pago administrativo el 23/06/2026 y cierre al 17/10/2026.
const fila = (periodo: string, capital: number, interes: number, tramo: number) => ({
	periodo,
	percibido: 0,
	reclamado: 0,
	diferencia: 0,
	haberMaximo: null,
	quitaTope: 0,
	diferenciaMenosTope: 0,
	sac: 0,
	obraSocial: 0,
	capital,
	interes,
	tramo,
});

const troche = {
	consolidacion: "2026-10-17",
	filas: [
		fila("2014-02", 7_000_000, 12_900_000, 0),
		fila("2026-06", 7_093_363.91, 13_002_443.43, 0),
		fila("2026-07", 1_000_000, 20_000, 1),
		fila("2026-10", 1_108_490.24, 16_479.12, 1),
	],
	pagos: [{ fecha: "2026-06-23", importe: 26_218_187.57, tipo: "administrativo" as const }],
	tramos: [
		{
			hasta: "2026-06-30",
			capitalTramo: 14_093_363.91,
			interesTramo: 25_902_443.43,
			interesSobreSaldo: 0,
			pago: 26_218_187.57,
			pagoFecha: "2026-06-23",
			pagoTipo: "administrativo" as const,
			imputadoInteres: 25_902_443.43,
			imputadoCapital: 315_744.14,
			saldoCapital: 13_777_619.77,
			saldoInteres: 0,
		},
		{ hasta: "2026-10-17", capitalTramo: 2_108_490.24, interesTramo: 36_479.12, interesSobreSaldo: 736_360.24 },
	],
};

describe("armarBloquesTramos", () => {
	it("sin pagos no hay tramos", () => {
		expect(armarBloquesTramos({ consolidacion: "2026-10-17", filas: troche.filas, pagos: [], tramos: [] })).toEqual({
			tramos: [],
			pagos: [],
		});
	});

	it("corta la tabla mensual en el mes de cada pago", () => {
		const b = armarBloquesTramos(troche);
		expect(b.tramos).toHaveLength(2);
		expect(b.tramos[0]).toMatchObject({ indice: 0, desde: "2014-02", hasta: "2026-06-30" });
		expect(b.tramos[0].filas.map((f) => f.periodo)).toEqual(["2014-02", "2026-06"]);
		expect(b.tramos[1]).toMatchObject({ indice: 1, desde: "2026-07", hasta: "2026-10-17", corte: {} });
		expect(b.tramos[1].filas.map((f) => f.periodo)).toEqual(["2026-07", "2026-10"]);
	});

	it("tramo con pago: adeudado, pago en negativo y saldo del motor", () => {
		const [t1] = armarBloquesTramos(troche).tramos;
		expect(t1.corte.pago).toMatchObject({
			fecha: "2026-06-23",
			tipo: "administrativo",
			label: "Pago administrativo (ANSES)",
			importe: 26_218_187.57,
			imputadoInteres: 25_902_443.43,
			imputadoCapital: 315_744.14,
			saldoLuego: 13_777_619.77,
		});
		expect(t1.detalle).toEqual([
			{ label: "Adeudado del período", capital: 14_093_363.91, intereses: 25_902_443.43, total: 39_995_807.34 },
			{
				label: "Pago del 23/06/2026 · Pago administrativo (ANSES)",
				capital: -315_744.14,
				intereses: -25_902_443.43,
				total: -26_218_187.57,
				negativo: true,
			},
			{ label: "Saldo al 30/06/2026", capital: 13_777_619.77, intereses: 0, total: 13_777_619.77, negrita: true },
		]);
	});

	it("último tramo: saldo anterior + intereses sobre el saldo; el saldo final coincide con totales.saldo", () => {
		const [, t2] = armarBloquesTramos(troche).tramos;
		expect(t2.detalle).toEqual([
			{ label: "Adeudado del período", capital: 2_108_490.24, intereses: 36_479.12, total: 2_144_969.36 },
			{ label: "Saldo al 30/06/2026", capital: 13_777_619.77, intereses: 0, total: 13_777_619.77 },
			{ label: "Intereses sobre el saldo del 30/06/2026 al 17/10/2026", capital: null, intereses: 736_360.24, total: 736_360.24 },
			{ label: "Saldo al 17/10/2026", capital: 15_886_110.01, intereses: 772_839.36, total: 16_658_949.37, negrita: true },
		]);
	});

	it("cuadro de pagos a cuenta y remanente del último pago actualizado al cierre", () => {
		const b = armarBloquesTramos(troche);
		expect(b.pagos).toHaveLength(1);
		expect(b.pagos[0].saldoLuego).toBe(13_777_619.77);
		expect(b.remanente).toEqual({
			saldoLuego: 13_777_619.77,
			interesesPosteriores: 736_360.24,
			actualizado: 14_513_980.01,
			hasta: "2026-10-17",
		});
	});

	it("guardados viejos: sin pagoFecha/pagoTipo cae a pagos[k].fecha y a la etiqueta genérica", () => {
		const viejo = {
			...troche,
			pagos: [{ fecha: "2026-06-23", importe: 26_218_187.57 }],
			tramos: troche.tramos.map(({ pagoFecha, pagoTipo, ...t }) => t),
		};
		const [t1] = armarBloquesTramos(viejo).tramos;
		expect(t1.corte.pago).toMatchObject({ fecha: "2026-06-23", tipo: null, label: "Pago a cuenta" });
		expect(t1.detalle[1].label).toBe("Pago del 23/06/2026 · Pago a cuenta");
	});

	it("sin tramos posteriores al último pago no hay remanente y se omite el tramo final vacío", () => {
		const b = armarBloquesTramos({
			consolidacion: "2026-06-30",
			filas: troche.filas.filter((f) => f.tramo === 0),
			pagos: troche.pagos,
			tramos: [troche.tramos[0], { hasta: "2026-06-30", capitalTramo: 0, interesTramo: 0, interesSobreSaldo: 0 }],
		});
		expect(b.tramos).toHaveLength(1);
		expect(b.remanente).toBeUndefined();
	});

	it("labelTipoPago", () => {
		expect(labelTipoPago("embargo")).toBe("Transferencia por embargo");
		expect(labelTipoPago("deposito_judicial")).toBe("Depósito judicial");
		expect(labelTipoPago(undefined)).toBe("Pago a cuenta");
		expect(labelTipoPago("cualquiera")).toBe("Pago a cuenta");
	});
});

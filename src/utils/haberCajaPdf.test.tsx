/**
 * Planilla del haber de caja en PDF: nombre del archivo y armado real del documento (jubilación con la serie mensual,
 * retiro por invalidez y pensión derivada). Datos inventados.
 */
import React from "react";
import { describe, expect, it, vi } from "vitest";
import { pdf } from "@react-pdf/renderer";
import HaberCajaPDF from "components/calculator/HaberCajaPDF";
import { nombreArchivoHaberCaja } from "./haberCajaPdf";

vi.mock("notistack", () => ({ enqueueSnackbar: vi.fn() }));
// el logo es un PNG del proyecto: para el armado alcanza con una imagen mínima
vi.mock("assets/images/large_logo_transparent.png", () => ({
	default: "data:image/png;base64,iVBORw0KGgoAAAANSUhEUgAAAAEAAAABCAYAAAAfFcSJAAAADUlEQVR42mNkYPhfDwAChwGA60e6kgAAAABJRU5ErkJggg==",
}));

const entrada = {
	prestacion: "jubilacion",
	fechas: { fad: "2019-02-28", cese: "2019-02-28", solicitud: "2019-03-11", alta: "2019-06-01" },
	servicios: { n: { antes: { a: 8, m: 4, d: 0 }, despues: { a: 24, m: 0, d: 0 } } },
	remuneraciones: [
		{ periodo: "2019-01", importe: 40000, moneda: "pesos" },
		{ periodo: "1975-03", importe: 120000, moneda: "pesosLey" },
	],
};
const resultado: any = {
	regimen: { codigo: "ley27260", descripcion: "Ley 27.260" },
	ancla: "2019-02",
	mesParametros: "2019-02",
	W: 41000.5,
	R: 0,
	PBU: 4500.25,
	PC: 5125.06,
	PAP: 15170.19,
	haberPuro: 24795.5,
	haber: 24795.5,
	anios: { pbu: 33, N1: 8, N2: 24 },
	remuneraciones: {
		filas: [{ periodo: "2019-01", importe: 40000, topeArt9: null, actualizada: 41000, topeArt14: null, topeSimultaneo: null }],
		suma: 41000,
		divisor: 1,
		meses: 1,
	},
	avisos: [],
};
const serie = {
	desde: "2019-02",
	hasta: "2021-03",
	minimo82: true,
	filas: Array.from({ length: 26 }, (_, i) => ({
		mes: `${2019 + Math.floor((i + 1) / 12)}-${String(((i + 1) % 12) + 1).padStart(2, "0")}`,
		PBU: 4500.25 + i,
		PC: 5125.06 + i,
		PAP: 15170.19 + i,
		suplemento: 0,
		sumaFija: i > 12 && i < 25 ? 1500 : 0,
		haberPuro: 24795.5 + 3 * i,
		descuentoMaximo: 0,
		complementoMinimo: i === 0 ? 100 : 0,
		haberAlPago: 24795.5 + 3 * i,
		pensionDerivada: i > 20,
	})),
};
const datos = { titular: "Caso de prueba", emitido: "28/11/2026" };
const renderToBuffer = (el: React.ReactElement) => pdf(el as any).toString();
const esPdf = (b: string) => b.startsWith("%PDF-");

describe("PDF del haber de caja", { timeout: 60000 }, () => {
	it("nombre del archivo: titular y FAD", () => {
		expect(nombreArchivoHaberCaja("Pérez, Juan José", "2019-02-28")).toBe("haber-de-caja-perez-juan-jose-2019-02-28.pdf");
		expect(nombreArchivoHaberCaja(null, "2019-02-28")).toBe("haber-de-caja-2019-02-28.pdf");
	});

	it("arma la planilla sola y con el anexo de la serie mensual (una página más)", async () => {
		const sin = await renderToBuffer(<HaberCajaPDF entrada={entrada} resultado={resultado} datos={datos} />);
		const con = await renderToBuffer(<HaberCajaPDF entrada={entrada} resultado={resultado} datos={datos} serie={serie} />);
		expect(esPdf(sin)).toBe(true);
		expect(esPdf(con)).toBe(true);
		const paginas = (b: string) => (b.match(/\/Type\s*\/Page[^s]/g) || []).length;
		expect(paginas(con)).toBe(paginas(sin) + 1);
	});

	it("arma el retiro por invalidez (sin PBU, PC ni PAP ni años) y la pensión derivada", async () => {
		const invalidez = {
			...resultado,
			PBU: 0,
			PC: 0,
			PAP: 0,
			anios: undefined,
			retiroInvalidez: {
				norma: "Ley 24.241 arts. 27, 95 y 97",
				ingresoBase: 41000.5,
				pctReferencia: 70,
				prestacionReferencia: 28700.35,
				participacionEstatal: 100,
				haberRetiro: 28700.35,
			},
			haber: 28700.35,
		};
		const serieUnica = {
			...serie,
			filas: serie.filas.map((f) => ({ ...f, PBU: 0, PC: 0, PAP: 0, haberBase: f.haberPuro, pensionDerivada: false })),
		};
		expect(
			esPdf(
				await renderToBuffer(
					<HaberCajaPDF entrada={{ ...entrada, prestacion: "retiroInvalidez" }} resultado={invalidez} datos={datos} serie={serieUnica} />,
				),
			),
		).toBe(true);
		const derivada = {
			...resultado,
			pensionDerivada: {
				norma: "Ley 24.241 art. 98",
				mes: "2020-10",
				porcentaje: 70,
				PBU: 3150.18,
				PC: 3587.54,
				PAP: 10619.13,
				haber: 17356.85,
				haberConMinimo: 18128.85,
			},
		};
		expect(
			esPdf(
				await renderToBuffer(
					<HaberCajaPDF
						entrada={{ ...entrada, pensionDerivada: { fallecimiento: "2020-10-05", porcentaje: 70 } }}
						resultado={derivada}
						datos={datos}
						serie={serie}
					/>,
				),
			),
		).toBe(true);
	});
});

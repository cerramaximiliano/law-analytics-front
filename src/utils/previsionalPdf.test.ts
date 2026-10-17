import { beforeEach, describe, expect, it, vi } from "vitest";
import { AVISO_VALIDACION_FALLO, AVISO_VALIDACION_RECALCULAR, descargarPdfRetroactivo } from "./previsionalPdf";

const { toBlob, pdf, emitirValidacion, enqueueSnackbar, toDataURL } = vi.hoisted(() => {
	const toBlob = vi.fn(async () => new Blob(["%PDF"], { type: "application/pdf" }));
	return {
		toBlob,
		pdf: vi.fn((_el: any) => ({ toBlob })),
		emitirValidacion: vi.fn(),
		enqueueSnackbar: vi.fn(),
		toDataURL: vi.fn(async (..._a: any[]) => "data:image/png;base64,QR"),
	};
});

vi.mock("@react-pdf/renderer", () => ({ pdf, Document: () => null }));
vi.mock("components/calculator/PrevisionalRetroactivoPDF", () => ({ default: () => null }));
vi.mock("services/validacionService", () => ({ emitirValidacion }));
vi.mock("notistack", () => ({ enqueueSnackbar }));
vi.mock("qrcode", () => ({ default: { toDataURL } }));

const resultado: any = {
	filas: [{ periodo: "2026-01", capital: 1, interes: 1 }],
	consolidacion: "2026-10-17",
	totales: { capital: 1, intereses: 1, total: 2, pagado: 0, saldo: 2 },
};
const input: any = { percibido: { importe: 1, fecha: "2026-01-01" } };
const datos = { titular: "Pérez, Juan", expedienteAdmin: "024-1", prestacion: "jubilacion_ordinaria" };

const propsDelPdf = () => pdf.mock.calls[0][0].props;

describe("descargarPdfRetroactivo con validación", () => {
	beforeEach(() => {
		vi.clearAllMocks();
		(URL as any).createObjectURL = vi.fn(() => "blob:x");
		(URL as any).revokeObjectURL = vi.fn();
	});

	it("con el código emitido pasa el bloque de validación al PDF", async () => {
		emitirValidacion.mockResolvedValue({
			success: true,
			codigo: "7K4M-2QXT-9ZD3",
			url: "https://lawanalytics.app/validar/7K4M-2QXT-9ZD3",
			huella: "abc",
			emitidoEn: "2026-10-17T15:30:00.000Z",
		});
		const ok = await descargarPdfRetroactivo({ resultado, input, datos, calculatorId: "calc1" });
		expect(ok).toBe(true);
		expect(emitirValidacion).toHaveBeenCalledWith({
			input,
			totales: resultado.totales,
			calculatorId: "calc1",
			datos: { titular: "Pérez, Juan", expedienteAdmin: "024-1", prestacion: "Jubilación Ordinaria" },
		});
		expect(toDataURL).toHaveBeenCalledWith("https://lawanalytics.app/validar/7K4M-2QXT-9ZD3", {
			margin: 1,
			width: 240,
			errorCorrectionLevel: "M",
		});
		expect(propsDelPdf().validacion).toMatchObject({ codigo: "7K4M-2QXT-9ZD3", qr: "data:image/png;base64,QR" });
		expect(enqueueSnackbar).not.toHaveBeenCalled();
	});

	it("si la validación devuelve 409 descarga igual, sin bloque, y pide recalcular", async () => {
		emitirValidacion.mockRejectedValue({ response: { status: 409, data: { error: "TOTALES_NO_COINCIDEN" } } });
		const ok = await descargarPdfRetroactivo({ resultado, input, datos });
		expect(ok).toBe(true);
		expect(toBlob).toHaveBeenCalledTimes(1);
		expect(propsDelPdf().validacion).toBeNull();
		expect(enqueueSnackbar).toHaveBeenCalledWith(AVISO_VALIDACION_RECALCULAR, { variant: "warning" });
	});

	it("si la validación falla por otro motivo descarga igual con el aviso genérico", async () => {
		emitirValidacion.mockRejectedValue(new Error("Network Error"));
		const ok = await descargarPdfRetroactivo({ resultado, input, datos });
		expect(ok).toBe(true);
		expect(toBlob).toHaveBeenCalledTimes(1);
		expect(propsDelPdf().validacion).toBeNull();
		expect(enqueueSnackbar).toHaveBeenCalledWith(AVISO_VALIDACION_FALLO, { variant: "warning" });
	});
});

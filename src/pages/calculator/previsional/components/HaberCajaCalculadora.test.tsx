/**
 * Pantalla del haber de caja: validación mínima, armado de la entrada del motor, pegado desde planilla y
 * estados de resultado y de error. El hub se simula; los importes y las fechas son inventados.
 */
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import HaberCajaCalculadora from "./HaberCajaCalculadora";

const { post } = vi.hoisted(() => ({ post: vi.fn() }));
vi.mock("utils/axios", () => ({ default: { post } }));
vi.mock("hooks/useSubscription", () => ({ default: () => ({ subscription: null, hasFeatureLocal: () => true }) }));
vi.mock("sections/auth/LimitErrorModal", () => ({
	LimitErrorModal: ({ open, message }: { open: boolean; message: string }) => (open ? <div role="dialog">{message}</div> : null),
}));

const RESPUESTA = {
	success: true,
	datosVersion: "abc123def456",
	programa: "ansesPrpa",
	resultado: {
		programa: "ansesPrpa",
		regimen: { codigo: "ley27260", descripcion: "Ley 27.260" },
		ancla: "2019-02",
		mesValuacion: "2019-03",
		W: 41000.5,
		R: 0,
		PBU: 4500.25,
		PC: 5125.06,
		PAP: 15170.19,
		haberPuro: 24795.5,
		haber: 24795.5,
		anios: { pbu: 33, N1: 8.33, N2: 24.67 },
		remuneraciones: {
			filas: [
				{ periodo: "2019-01", importe: 40000, topeArt9: null, actualizada: 41000, topeArt14: null, topeSimultaneo: null },
				{ periodo: "2019-02", importe: 41001, topeArt9: null, actualizada: 41001, topeArt14: null, topeSimultaneo: null },
			],
			suma: 82001,
			divisor: 2,
			meses: 2,
		},
		avisos: ["Aviso de prueba del motor"],
	},
};

// Error como los de axios: un Error con la respuesta del hub colgada
const errorHub = (status: number, data: object) =>
	Object.assign(new Error(`Request failed with status code ${status}`), { response: { status, data } });

const fecha = (etiqueta: RegExp, valor: string) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } });
const escribir = (etiqueta: string, valor: string) => fireEvent.change(screen.getByLabelText(etiqueta), { target: { value: valor } });
const calcular = async () => {
	await act(async () => {
		fireEvent.click(screen.getByRole("button", { name: "Calcular" }));
	});
};
function cargarFormulario() {
	fecha(/Adquisición del derecho/, "2019-02-28");
	fecha(/^Cese/, "2019-02-28");
	fecha(/^Solicitud/, "2019-03-11");
	fecha(/^Alta/, "2019-06-01");
	const [aniosAntes, aniosDespues] = screen.getAllByLabelText("Años");
	fireEvent.change(aniosAntes, { target: { value: "8" } });
	fireEvent.change(aniosDespues, { target: { value: "24" } });
	fireEvent.change(screen.getAllByLabelText("Meses")[0], { target: { value: "4" } });
	escribir("Período de la fila 1", "02/2019");
	escribir("Importe de la fila 1", "41.001,00");
	escribir("Período de la fila 2", "2019-01");
	escribir("Importe de la fila 2", "40000");
}

describe("HaberCajaCalculadora", () => {
	// con llaves: vitest toma lo que devuelve beforeEach como función de limpieza y mockReset devuelve el mock
	beforeEach(() => {
		post.mockReset();
	});

	it("no llama al hub sin fechas ni remuneraciones y marca lo que falta", async () => {
		render(<HaberCajaCalculadora />);
		await calcular();
		expect(post).not.toHaveBeenCalled();
		expect(screen.getAllByText("Requerida")).toHaveLength(4);
		expect(screen.getByText("Cargá al menos una remuneración.")).toBeInTheDocument();
		expect(screen.getByText("Cargá los servicios en relación de dependencia.")).toBeInTheDocument();
	});

	it("arma la entrada del motor y muestra el resultado, los avisos y las remuneraciones actualizadas", async () => {
		post.mockResolvedValue({ data: RESPUESTA });
		render(<HaberCajaCalculadora />);
		cargarFormulario();
		await calcular();

		expect(post).toHaveBeenCalledWith("/api/previsional/haber-caja/calcular", {
			programa: "ansesPrpa",
			prestacion: "jubilacion",
			fechas: { fad: "2019-02-28", cese: "2019-02-28", solicitud: "2019-03-11", alta: "2019-06-01" },
			servicios: { n: { antes: { a: 8, m: 4, d: 0 }, despues: { a: 24, m: 0, d: 0 } } },
			remuneraciones: [
				{ periodo: "2019-01", importe: 40000 },
				{ periodo: "2019-02", importe: 41001 },
			],
		});
		await waitFor(() => expect(screen.getByText("Resultado")).toBeInTheDocument());
		expect(screen.getByText(/41\.000,50/)).toBeInTheDocument(); // W
		expect(screen.getByText(/4\.500,25/)).toBeInTheDocument(); // PBU
		expect(screen.getByText(/5\.125,06/)).toBeInTheDocument(); // PC
		expect(screen.getByText(/15\.170,19/)).toBeInTheDocument(); // PAP
		expect(screen.getByText(/24\.795,50/)).toBeInTheDocument(); // haber
		expect(screen.getByText(/Haber valuado en 03\/2019/)).toBeInTheDocument();
		expect(screen.getByText("Aviso de prueba del motor")).toBeInTheDocument();
		expect(screen.getByText("Remuneraciones actualizadas")).toBeInTheDocument();
		expect(screen.getByText("41.000,00")).toBeInTheDocument();
		expect(screen.getByText(/abc123def456/)).toBeInTheDocument();
	});

	it("muestra el mensaje del hub cuando el cálculo falla", async () => {
		post.mockRejectedValue(errorHub(400, { success: false, mensaje: "Sin datos previsionales para 2019-02" }));
		render(<HaberCajaCalculadora />);
		cargarFormulario();
		await calcular();
		await waitFor(() => expect(screen.getByText("Sin datos previsionales para 2019-02")).toBeInTheDocument());
		expect(screen.queryByText("Resultado")).not.toBeInTheDocument();
	});

	it("abre el aviso de plan con el 403 del hub", async () => {
		post.mockRejectedValue(errorHub(403, { upgradeRequired: true }));
		render(<HaberCajaCalculadora />);
		cargarFormulario();
		await calcular();
		await waitFor(() => expect(screen.getByRole("dialog")).toHaveTextContent("necesitás un plan pago"));
	});

	it("pega dos columnas de una planilla como filas de la grilla", () => {
		render(<HaberCajaCalculadora />);
		fireEvent.paste(screen.getByLabelText("Período de la fila 1"), {
			clipboardData: { getData: () => "01/2018\t30.000,00\n02/2018\t31.500,50\nencabezado suelto\n" },
		});
		expect(screen.getByLabelText("Período de la fila 1")).toHaveValue("2018-01");
		expect(screen.getByLabelText("Importe de la fila 2")).toHaveValue("31500,5");
		expect(screen.getByText(/Se pegaron 2 filas \(1 línea descartada/)).toBeInTheDocument();
		expect(screen.getByText("2 remuneraciones cargadas")).toBeInTheDocument();
	});
});

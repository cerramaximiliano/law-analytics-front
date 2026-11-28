/**
 * Pantalla del haber de caja: validación con Formik y Yup, armado de la entrada del motor, moneda por período, autónomos
 * con las categorías del catálogo, pegado desde planilla, guardado y encadenado con el retroactivo.
 * El hub se simula; los importes, las fechas y los nombres son inventados.
 */
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor, within } from "@testing-library/react";
import HaberCajaCalculadora from "./HaberCajaCalculadora";
import { CATALOGO_PRUEBA } from "sections/forms/wizard/calc-previsional/haber-caja/formModel/catalogoPrueba";

const { post, get, navigate, addCalculator, updateCalculator } = vi.hoisted(() => ({
	post: vi.fn(),
	get: vi.fn(),
	navigate: vi.fn(),
	addCalculator: vi.fn(),
	updateCalculator: vi.fn(),
}));
vi.mock("utils/axios", () => ({ default: { post, get } }));
vi.mock("hooks/useSubscription", () => ({ default: () => ({ subscription: null, hasFeatureLocal: () => true }) }));
vi.mock("sections/auth/LimitErrorModal", () => ({
	LimitErrorModal: ({ open, message }: { open: boolean; message: string }) => (open ? <div role="dialog">{message}</div> : null),
}));
// el selector de carpeta trae el listado del usuario desde el store: acá no interviene
vi.mock("sections/forms/wizard/calc-previsional/retroactivo/components/LinkCauseSelector", () => ({ default: () => null }));
vi.mock("react-router-dom", () => ({ useNavigate: () => navigate }));
vi.mock("notistack", () => ({ enqueueSnackbar: vi.fn() }));
vi.mock("contexts/TeamContext", () => ({ useTeam: () => ({ getRequestHeaders: () => ({}) }) }));
vi.mock("store", () => ({
	dispatch: (accion: any) => accion,
	useSelector: (f: any) => f({ auth: { user: { _id: "u1", name: "Usuario de prueba" } } }),
}));
vi.mock("store/reducers/calculator", () => ({ addCalculator, updateCalculator }));

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

// Las celdas de las grillas llevan aria-label: se buscan directo (las consultas por etiqueta y por rol recorren todo el
// árbol y en esta pantalla, que es grande, tardan cerca de un segundo cada una)
const celda = <T extends HTMLElement = HTMLInputElement>(etiqueta: string) =>
	document.querySelector(`[aria-label="${etiqueta}"]`) as unknown as T;
const campo = (etiqueta: string | RegExp) => (typeof etiqueta === "string" && celda(etiqueta)) || screen.getByLabelText(etiqueta);
const escribir = (etiqueta: string | RegExp, valor: string) => fireEvent.change(campo(etiqueta), { target: { value: valor } });
const boton = (texto: string) => Array.from(document.querySelectorAll("button")).find((b) => b.textContent === texto) as HTMLButtonElement;
const calcular = async () => {
	await act(async () => {
		fireEvent.click(boton("Calcular"));
	});
};
// espera al catálogo: las monedas de la grilla dejan de estar deshabilitadas
const montar = async (props: object = {}) => {
	render(<HaberCajaCalculadora {...props} />);
	await waitFor(() => expect(celda("Moneda de la fila 1")).not.toBeDisabled());
};
function cargarFormulario() {
	escribir("Titular", "Caso de prueba");
	escribir(/Adquisición del derecho/, "2019-02-28");
	escribir(/^Cese/, "2019-02-28");
	escribir(/^Solicitud/, "2019-03-11");
	escribir(/^Alta/, "2019-06-01");
	escribir("Años de relación de dependencia hasta 6/1994", "8");
	escribir("Meses de relación de dependencia hasta 6/1994", "4");
	escribir("Años de relación de dependencia desde 7/1994", "24");
	escribir("Período de la fila 1", "02/2019");
	escribir("Importe de la fila 1", "41.001,00");
	escribir("Período de la fila 2", "2019-01");
	escribir("Importe de la fila 2", "40000");
}

describe("HaberCajaCalculadora", { timeout: 60000 }, () => {
	// con llaves: vitest toma lo que devuelve beforeEach como función de limpieza y mockReset devuelve el mock
	beforeEach(() => {
		post.mockReset();
		get.mockReset();
		navigate.mockReset();
		addCalculator.mockReset();
		updateCalculator.mockReset();
		get.mockResolvedValue({ data: { success: true, ...CATALOGO_PRUEBA } });
	});

	it("no llama al hub con el formulario vacío y marca lo que falta", async () => {
		await montar();
		await calcular();
		expect(post).not.toHaveBeenCalled();
		const resumen = within(screen.getByRole("alert"));
		expect(resumen.getByText("Ingrese un nombre o seleccione una carpeta")).toBeInTheDocument();
		expect(resumen.getByText("Ingrese la fecha de adquisición del derecho")).toBeInTheDocument();
		expect(resumen.getByText("Cargue los años de servicios")).toBeInTheDocument();
		expect(resumen.getByText("Cargue al menos una remuneración o un período de autónomos")).toBeInTheDocument();
	});

	it("arma la entrada del motor con la moneda del período y muestra el resultado, los avisos y las remuneraciones", async () => {
		post.mockResolvedValue({ data: RESPUESTA });
		await montar();
		cargarFormulario();
		await calcular();

		expect(post).toHaveBeenCalledWith("/api/previsional/haber-caja/calcular", {
			programa: "ansesPrpa",
			prestacion: "jubilacion",
			fechas: { fad: "2019-02-28", cese: "2019-02-28", solicitud: "2019-03-11", alta: "2019-06-01" },
			servicios: { n: { antes: { a: 8, m: 4, d: 0 }, despues: { a: 24, m: 0, d: 0 } } },
			remuneraciones: [
				{ periodo: "2019-01", importe: 40000, moneda: "pesos" },
				{ periodo: "2019-02", importe: 41001, moneda: "pesos" },
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

	it("la moneda de la fila sale sola del período y se puede corregir", async () => {
		post.mockResolvedValue({ data: RESPUESTA });
		await montar();
		cargarFormulario();
		escribir("Período de la fila 3", "06/1988");
		escribir("Importe de la fila 3", "4500");
		const moneda = celda<HTMLSelectElement>("Moneda de la fila 3");
		expect(moneda.value).toBe("");
		expect(moneda.options[0].textContent).toBe("Australes (por el período)");
		fireEvent.click(boton("Agregar fila"));
		escribir("Período de la fila 4", "01/1975");
		escribir("Hasta de la fila 4", "12/1975");
		escribir("Importe de la fila 4", "60000");
		// la constancia ya la trae convertida: se corrige a pesos
		fireEvent.change(celda("Moneda de la fila 4"), { target: { value: "pesos" } });
		await calcular();
		expect(post.mock.calls[0][1].remuneraciones).toEqual([
			{ periodo: "1975-01", importe: 60000, moneda: "pesos", hasta: "1975-12" },
			{ periodo: "1988-06", importe: 4500, moneda: "australes" },
			{ periodo: "2019-01", importe: 40000, moneda: "pesos" },
			{ periodo: "2019-02", importe: 41001, moneda: "pesos" },
		]);
	});

	it("autónomos: ofrece las categorías de la época, exige la categoría y manda los períodos al motor", async () => {
		post.mockResolvedValue({ data: RESPUESTA });
		await montar();
		cargarFormulario();
		escribir("Años de autónomos hasta 6/1994", "6");
		fireEvent.click(boton("Agregar período"));
		escribir("Desde del período de autónomos 1", "01/1975");
		escribir("Hasta del período de autónomos 1", "06/1980");
		const categoria = celda<HTMLSelectElement>("Categoría del período de autónomos 1");
		const delPeriodo = within(categoria.querySelector('optgroup[label="Categorías del período"]') as HTMLElement);
		expect(delPeriodo.getAllByRole("option").map((o) => (o as HTMLOptionElement).value)).toEqual([
			"A",
			"B",
			"C",
			"D",
			"E",
			"F",
			"G",
			"H",
			"I",
			"J",
			"M",
		]);
		// la moratoria todavía no cambia el cálculo: visible y deshabilitada
		expect(celda("Moratoria del período de autónomos 1")).toBeDisabled();

		// sin categoría no calcula
		await calcular();
		expect(post).not.toHaveBeenCalled();
		expect(screen.getAllByText(/Elegí la categoría del período 1\/1975 a 6\/1980/).length).toBeGreaterThan(0);

		// una categoría que no existía en esa época no se deja cargar (la IND vale hasta 12/1968)
		fireEvent.change(categoria, { target: { value: "IND" } });
		await calcular();
		expect(post).not.toHaveBeenCalled();
		expect(screen.getAllByText(/valen hasta 12\/1968/).length).toBeGreaterThan(0);

		// se pide la categoría histórica y se muestra la conversión
		fireEvent.change(categoria, { target: { value: "C" } });
		expect(screen.getByText("Se computa C → A por el Dec. 1361/80.")).toBeInTheDocument();
		fireEvent.click(screen.getByLabelText(/Computar la categoría efectivamente aportada/));
		expect(screen.queryByText("Se computa C → A por el Dec. 1361/80.")).not.toBeInTheDocument();
		await calcular();
		expect(post.mock.calls[0][1]).toMatchObject({
			servicios: { m: { antes: { a: 6, m: 0, d: 0 } } },
			autonomo: { equivalencia: false, periodos: [{ desde: "1975-01", hasta: "1980-06", categoria: "C" }] },
		});
	});

	it("la fecha inicial de pago está visible y deshabilitada, y sin catálogo avisa y deja la moneda al servidor", async () => {
		get.mockRejectedValue(new Error("sin red"));
		post.mockResolvedValue({ data: RESPUESTA });
		render(<HaberCajaCalculadora />);
		await waitFor(() => expect(screen.getByText(/No se pudo cargar el catálogo/)).toBeInTheDocument());
		expect(screen.getByLabelText(/Inicial de pago/)).toBeDisabled();
		expect(celda("Moneda de la fila 1")).toBeDisabled();
		cargarFormulario();
		await calcular();
		expect(post.mock.calls[0][1].remuneraciones).toEqual([
			{ periodo: "2019-01", importe: 40000 },
			{ periodo: "2019-02", importe: 41001 },
		]);
	});

	it("muestra el mensaje del hub cuando el cálculo falla", async () => {
		post.mockRejectedValue(errorHub(400, { success: false, mensaje: "Sin datos previsionales para 2019-02" }));
		await montar();
		cargarFormulario();
		await calcular();
		await waitFor(() => expect(screen.getByText("Sin datos previsionales para 2019-02")).toBeInTheDocument());
		expect(screen.queryByText("Resultado")).not.toBeInTheDocument();
	});

	it("abre el aviso de plan con el 403 del hub", async () => {
		post.mockRejectedValue(errorHub(403, { upgradeRequired: true }));
		await montar();
		cargarFormulario();
		await calcular();
		await waitFor(() => expect(screen.getByRole("dialog")).toHaveTextContent("necesitás un plan pago"));
	});

	it("pega dos columnas de una planilla como filas de la grilla", async () => {
		await montar();
		fireEvent.paste(celda("Período de la fila 1"), {
			clipboardData: { getData: () => "01/2018\t30.000,00\n02/2018\t31.500,50\nencabezado suelto\n" },
		});
		expect(celda("Período de la fila 1")).toHaveValue("2018-01");
		expect(celda("Importe de la fila 2")).toHaveValue("31500,5");
		expect(screen.getByText(/Se pegaron 2 filas \(1 línea descartada/)).toBeInTheDocument();
		expect(screen.getByText("2 remuneraciones cargadas")).toBeInTheDocument();
	});

	it("guarda el haber de caja como cálculo previsional y lo encadena con el retroactivo", async () => {
		const entradaDelHub = { ...RESPUESTA, entrada: { prestacion: "jubilacion", fechas: { fad: "2019-02-28" }, remuneraciones: [] } };
		post.mockResolvedValue({ data: entradaDelHub });
		addCalculator.mockReturnValue(Promise.resolve({ success: true, calculator: { _id: "hc1" } }));
		await montar();
		cargarFormulario();
		await calcular();
		await waitFor(() => expect(screen.getByText("Resultado")).toBeInTheDocument());

		// sin guardar: el retroactivo se precarga pero no queda vinculado
		fireEvent.click(boton("Usar en el retroactivo"));
		expect(navigate).toHaveBeenLastCalledWith("/apps/calc/previsional", {
			state: {
				desdeHaberCaja: expect.objectContaining({
					origen: expect.objectContaining({ etapa: "haberCaja", calculatorId: null, haber: 24795.5 }),
				}),
			},
		});

		await act(async () => {
			fireEvent.click(boton("Guardar"));
		});
		const [guardado] = addCalculator.mock.calls[0];
		expect(guardado).toMatchObject({
			userId: "u1",
			type: "Calculado",
			classType: "previsional",
			subClassType: "haberCaja",
			cadenaPrevisional: {},
			amount: 24795.5,
			user: "Caso de prueba",
			variables: {
				input: entradaDelHub.entrada,
				resultado: { haber: 24795.5 },
				datosVersion: "abc123def456",
				formulario: { fad: "2019-02-28" },
			},
		});
		expect(guardado).not.toHaveProperty("folderId");
		expect(boton("Guardado")).toBeDisabled();

		// ya guardado: el retroactivo lleva el id para dejar registrado el vínculo
		fireEvent.click(boton("Usar en el retroactivo"));
		const { desdeHaberCaja } = navigate.mock.calls[1][1].state;
		expect(desdeHaberCaja.origen).toMatchObject({
			calculatorId: "hc1",
			mes: "2019-03",
			componentes: { PBU: 4500.25, PC: 5125.06, PAP: 15170.19 },
		});
		expect(desdeHaberCaja.valores).toMatchObject({
			haberPagadoAnses: 24795.5,
			haberPagadoAl: "01/03/2019",
			fechaAdquisicion: "28/02/2019",
			prestacion: "jubilacion_ordinaria",
		});
	});

	it("reabre un guardado, recalcula y guarda los cambios sobre el mismo cálculo", async () => {
		post.mockResolvedValue({ data: RESPUESTA });
		updateCalculator.mockReturnValue(Promise.resolve({ success: true, calculator: { _id: "hc1" } }));
		const onGuardado = vi.fn();
		const guardado = {
			_id: "hc1",
			date: "2026-11-20",
			classType: "previsional",
			subClassType: "haberCaja",
			user: "Caso de prueba",
			variables: {
				input: {
					programa: "bluecorp",
					prestacion: "jubilacion",
					fechas: { fad: "2019-02-28", cese: "2019-02-28", solicitud: "2019-03-11", alta: "2019-06-01" },
					servicios: { n: { antes: { a: 8, m: 4, d: 0 }, despues: { a: 24, m: 0, d: 0 } } },
					remuneraciones: [{ periodo: "2019-01", importe: 40000, moneda: "pesos", monedaAutomatica: true }],
				},
				resultado: RESPUESTA.resultado,
				datosExpediente: { reclamante: "Caso de prueba" },
			},
		};
		await montar({ calculadoraEnEdicion: guardado, onGuardado });
		expect(screen.getByText(/Estás editando el haber de caja guardado/)).toBeInTheDocument();
		expect(screen.getByLabelText("Titular")).toHaveValue("Caso de prueba");
		expect(celda("Período de la fila 1")).toHaveValue("2019-01");
		expect(celda("Importe de la fila 1")).toHaveValue("40000");
		await calcular();
		expect(post.mock.calls[0][1]).toMatchObject({
			programa: "bluecorp",
			remuneraciones: [{ periodo: "2019-01", importe: 40000, moneda: "pesos" }],
		});
		await act(async () => {
			fireEvent.click(boton("Guardar cambios"));
		});
		expect(updateCalculator).toHaveBeenCalledWith(
			"hc1",
			expect.objectContaining({
				amount: 24795.5,
				folderId: null,
				variables: expect.objectContaining({ resultado: expect.objectContaining({ haber: 24795.5 }) }),
			}),
		);
		expect(onGuardado).toHaveBeenCalledWith("actualizado");
	});
});

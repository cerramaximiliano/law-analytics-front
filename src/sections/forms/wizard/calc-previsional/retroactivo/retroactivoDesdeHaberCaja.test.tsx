/**
 * Cadena previsional en el retroactivo: precarga desde el haber de caja (los percibidos son su serie mensual), aviso del
 * origen, desvincular, volver a traer la serie y `cadenaPrevisional` al guardar. El hub se simula; datos inventados.
 */
import React from "react";
import { beforeEach, describe, expect, it, vi } from "vitest";
import { act, fireEvent, render, screen, waitFor } from "@testing-library/react";
import { Formik } from "formik";
import PrevisionalRetroactivoWizard from "./index";
import PercibidosMensuales from "./components/PercibidosMensuales";
import ResultadoCalculo from "./components/ResultadoCalculo";
import formInitialValues from "./formModel/formInitialValues";
import { valoresDesdeCalculadora } from "./formModel/valoresDesdeGuardado";
import { armarInputRetroactivo } from "services/previsionalService";
import { precargaRetroactivoDesdeHaberCaja } from "../haber-caja/formModel/valoresDesdeGuardado";
import { valoresIniciales } from "../haber-caja/formModel/haberCajaFormModel";

const { post, get, addCalculator, updateCalculator, snackbar } = vi.hoisted(() => ({
	post: vi.fn(),
	get: vi.fn(),
	addCalculator: vi.fn(),
	updateCalculator: vi.fn(),
	snackbar: vi.fn(),
}));
vi.mock("utils/axios", () => ({ default: { post, get } }));
vi.mock("hooks/useSubscription", () => ({ default: () => ({ subscription: null, hasFeatureLocal: () => true }) }));
vi.mock("sections/auth/LimitErrorModal", () => ({ LimitErrorModal: () => null }));
vi.mock("./components/LinkCauseSelector", () => ({ default: () => null }));
vi.mock("react-router", () => ({ useNavigate: () => vi.fn() }));
vi.mock("react-router-dom", () => ({ useNavigate: () => vi.fn() }));
vi.mock("notistack", () => ({ enqueueSnackbar: snackbar }));
vi.mock("contexts/TeamContext", () => ({ useTeam: () => ({ getRequestHeaders: () => ({}) }) }));
vi.mock("store", () => ({
	dispatch: (accion: any) => accion,
	useSelector: (f: any) => f({ auth: { user: { _id: "u1", name: "Usuario de prueba" } }, interestRates: { rates: [] } }),
}));
vi.mock("store/reducers/calculator", () => ({ addCalculator, updateCalculator }));
vi.mock("utils/productAnalytics", () => ({ trackActivity: vi.fn() }));
vi.mock("utils/gtm", () => ({ trackFeatureLocked: vi.fn() }));
vi.mock("utils/previsionalPdf", () => ({
	descargarPdfRetroactivo: vi.fn(),
	PRESTACION_LABELS: { jubilacion_ordinaria: "Jubilación Ordinaria", pension_derivada: "Pensión derivada" },
}));
vi.mock("components/calculator/TablaRetroactivo", () => ({ default: () => null }));
vi.mock("components/calculator/LiquidacionPorTramos", () => ({ default: () => null }));

const fila = (mes: string, haberAlPago: number) => ({
	mes,
	PBU: 1,
	PC: 1,
	PAP: 1,
	suplemento: 0,
	sumaFija: 0,
	haberPuro: haberAlPago,
	descuentoMaximo: 0,
	complementoMinimo: 0,
	haberAlPago,
});
const SERIE = {
	desde: "2019-02",
	hasta: "2019-07",
	mesParametros: "2019-02",
	filas: [
		fila("2019-02", 24795.5),
		fila("2019-03", 27728.81),
		fila("2019-04", 27728.81),
		fila("2019-05", 27728.81),
		fila("2019-06", 30709.66),
		fila("2019-07", 30709.66),
	],
	avisos: [],
};
const RESULTADO_HC: any = { mesValuacion: "2019-02", haber: 24795.5, PBU: 4500.25, PC: 5125.06, PAP: 15170.19, avisos: [] };
const valoresHC = { ...valoresIniciales(), reclamante: "Caso de prueba", fad: "2019-02-28", alta: "2019-06-01" };
const precarga = (id: string | null = "hc1", serie: any = SERIE) => precargaRetroactivoDesdeHaberCaja(RESULTADO_HC, valoresHC, id, serie);
// valores del asistente tal como quedan con la precarga, más el período que elige el usuario
const valoresRetro = (id: string | null = "hc1", extra: object = {}) => {
	const p = precarga(id);
	return {
		...formInitialValues,
		...p.valores,
		cadenaOrigen: p.origen,
		fechaDesdeReclamado: "01/04/2019",
		fechaHastaReclamado: "30/06/2019",
		fechaCierre: "30/06/2019",
		haberReclamado: 30000,
		...extra,
	};
};
const boton = (texto: string) => Array.from(document.querySelectorAll("button")).find((b) => b.textContent === texto) as HTMLButtonElement;

describe("retroactivo encadenado con el haber de caja", { timeout: 60000 }, () => {
	beforeEach(() => {
		post.mockReset();
		get.mockReset();
		addCalculator.mockReset();
		updateCalculator.mockReset();
		snackbar.mockReset();
	});

	it("la precarga llega al asistente: haber pagado, prestación, percibidos mes a mes y aviso del origen", () => {
		render(<PrevisionalRetroactivoWizard precarga={precarga()} />);
		expect(
			screen.getByText(/Los haberes percibidos vienen del haber de caja calculado: su serie mensual, de 02\/2019 a 07\/2019/),
		).toBeInTheDocument();
		expect(screen.getByText(/Al guardar, este retroactivo queda vinculado a ese haber de caja/)).toBeInTheDocument();
		expect((document.querySelector('input[name="haberPagadoAnses"]') as HTMLInputElement).value.replace(/[^\d]/g, "")).toBe("2479550");
		expect((document.querySelector('input[name="reclamante"]') as HTMLInputElement).value).toBe("Caso de prueba");
		// la prestación del haber de caja queda elegida en el selector del retroactivo
		expect(screen.getByText("Jubilación Ordinaria")).toBeInTheDocument();
	});

	it("sin guardar el haber de caja se avisa que no queda vinculado; sin serie vuelve el aviso del haber pagado", () => {
		const { unmount } = render(<PrevisionalRetroactivoWizard precarga={precarga(null)} />);
		expect(screen.getByText(/El haber de caja no está guardado: este retroactivo no queda vinculado a él/)).toBeInTheDocument();
		unmount();
		render(<PrevisionalRetroactivoWizard precarga={precarga("hc1", null)} />);
		expect(screen.getByText(/El haber pagado por ANSES viene del haber de caja calculado \(02\/2019\)/)).toBeInTheDocument();
	});

	it("los percibidos del período son los mensuales del haber de caja y así llegan al motor", () => {
		const input = armarInputRetroactivo(valoresRetro());
		expect(input.percibido).toMatchObject({
			modo: "manual",
			manual: [
				{ periodo: "2019-04", importe: 27728.81 },
				{ periodo: "2019-05", importe: 27728.81 },
				{ periodo: "2019-06", importe: 30709.66 },
			],
		});
		// desvinculado: el modo de siempre, desde el haber pagado
		const manual = armarInputRetroactivo(valoresRetro("hc1", { percibidoManual: false, cadenaOrigen: null }));
		expect(manual.percibido).toMatchObject({ importe: 24795.5, fecha: "2019-02-01" });
		expect(manual.percibido).not.toHaveProperty("modo");
	});

	it("muestra que los percibidos vienen del haber de caja vinculado y deja desvincular", async () => {
		let valores: any = null;
		render(
			<Formik initialValues={valoresRetro()} onSubmit={() => {}}>
				{({ values }) => {
					valores = values;
					return <PercibidosMensuales />;
				}}
			</Formik>,
		);
		expect(
			screen.getByText(/Los percibidos vienen del haber de caja vinculado: es su serie mensual, de 02\/2019 a 07\/2019/),
		).toBeInTheDocument();
		expect(screen.getByText("3 meses cargados")).toBeInTheDocument();
		expect((document.querySelector('[aria-label="Haber percibido 06/2019"]') as HTMLInputElement).value).toBe("30.709,66");

		await act(async () => {
			fireEvent.click(boton("Desvincular"));
		});
		expect(valores.cadenaOrigen).toBeNull();
		expect(valores.percibidoManual).toBe(false);
		expect(screen.queryByText(/Los percibidos vienen del haber de caja/)).not.toBeInTheDocument();
		// los importes quedan cargados por si vuelve a la carga mes a mes
		expect(valores.percibidosMensuales).toHaveLength(6);
	});

	it("vuelve a traer la serie del haber de caja guardado (pisa lo corregido)", async () => {
		post.mockResolvedValue({
			data: {
				success: true,
				serie: { ...SERIE, hasta: "2019-08", filas: [...SERIE.filas.slice(0, 5), fila("2019-07", 31000), fila("2019-08", 31000)] },
			},
		});
		let valores: any = null;
		render(
			<Formik initialValues={valoresRetro("hc1", { percibidosMensuales: [{ periodo: "2019-04", importe: 1 }] })} onSubmit={() => {}}>
				{({ values }) => {
					valores = values;
					return <PercibidosMensuales />;
				}}
			</Formik>,
		);
		await act(async () => {
			fireEvent.click(boton("Volver a traer"));
		});
		await waitFor(() => expect(valores.percibidosMensuales).toHaveLength(7));
		expect(post).toHaveBeenCalledWith("/api/previsional/haber-caja/guardados/hc1/serie-mensual", {});
		expect(valores.percibidosMensuales.find((x: any) => x.periodo === "2019-04").importe).toBe(27728.81);
		expect(valores.cadenaOrigen.serie).toEqual({ desde: "2019-02", hasta: "2019-08" });
	});

	it("sin haber de caja guardado no ofrece volver a traer; sin cadena no muestra el aviso", () => {
		const { unmount } = render(
			<Formik initialValues={valoresRetro(null)} onSubmit={() => {}}>
				<PercibidosMensuales />
			</Formik>,
		);
		expect(screen.getByText(/Los percibidos vienen del haber de caja calculado \(sin guardar\)/)).toBeInTheDocument();
		expect(boton("Volver a traer")).toBeUndefined();
		unmount();
		render(
			<Formik initialValues={valoresRetro("hc1", { cadenaOrigen: null })} onSubmit={() => {}}>
				<PercibidosMensuales />
			</Formik>,
		);
		expect(screen.queryByText(/Los percibidos vienen del haber de caja/)).not.toBeInTheDocument();
	});
});

describe("retroactivo encadenado: cadenaPrevisional al guardar", { timeout: 60000 }, () => {
	const resultado: any = {
		desde: "2019-04-01",
		consolidacion: "2019-06-30",
		tasa: { tipo: "tasaPasivaBCRA", descripcion: "Tasa pasiva BCRA" },
		filas: [{ periodo: "2019-04", percibido: 27728.81, reclamado: 30000 }],
		pagos: [],
		tramos: [],
		totales: { capital: 6000, intereses: 500, total: 6500, pagado: 0, saldo: 6500 },
		haberReajustado: { periodo: "2019-06", reclamado: 33000, percibido: 30709.66 },
		percibidoManual: true,
		avisos: [],
	};
	const montar = (values: any, extra: object = {}) =>
		render(
			<ResultadoCalculo
				resultado={resultado}
				input={armarInputRetroactivo(values)}
				values={values}
				onModificar={() => {}}
				onNuevoCalculo={() => {}}
				{...extra}
			/>,
		);

	beforeEach(() => {
		addCalculator.mockReset();
		updateCalculator.mockReset();
		addCalculator.mockReturnValue(Promise.resolve({ success: true, calculator: { _id: "retro1" } }));
		updateCalculator.mockReturnValue(Promise.resolve({ success: true }));
	});

	it("guarda el retroactivo con el vínculo al haber de caja y los percibidos que tomó de su serie", async () => {
		montar(valoresRetro());
		await act(async () => {
			fireEvent.click(boton("Guardar"));
		});
		const [guardado] = addCalculator.mock.calls[0];
		expect(guardado).toMatchObject({
			classType: "previsional",
			subClassType: "retroactivo",
			cadenaPrevisional: { origenRef: "hc1" },
			variables: {
				input: { percibido: { modo: "manual" } },
				formulario: { cadenaOrigen: { etapa: "haberCaja", calculatorId: "hc1", serie: { desde: "2019-02", hasta: "2019-07" } } },
			},
		});
		expect(guardado.variables.input.percibido.manual).toHaveLength(3);
	});

	it("sin haber de caja guardado o desvinculado no manda el vínculo", async () => {
		montar(valoresRetro(null));
		await act(async () => {
			fireEvent.click(boton("Guardar"));
		});
		expect(addCalculator.mock.calls[0][0]).not.toHaveProperty("cadenaPrevisional");
	});

	it("al guardar cambios manda el vínculo vigente: si se desvinculó, lo suelta", async () => {
		const { unmount } = montar(valoresRetro(), { enEdicion: { id: "retro1" } });
		await act(async () => {
			fireEvent.click(boton("Guardar cambios"));
		});
		expect(updateCalculator.mock.calls[0][1]).toMatchObject({ cadenaPrevisional: { origenRef: "hc1" } });
		unmount();
		montar(valoresRetro("hc1", { cadenaOrigen: null, percibidoManual: false }), { enEdicion: { id: "retro1" } });
		await act(async () => {
			fireEvent.click(boton("Guardar cambios"));
		});
		expect(updateCalculator.mock.calls[1][1]).toMatchObject({ cadenaPrevisional: { origenRef: null } });
	});

	it("al reabrir, el vínculo que manda es el del documento: si el haber de caja se borró, no se vuelve a mandar", () => {
		const formulario = valoresRetro();
		const guardado = (cadenaPrevisional: object | undefined) => ({
			_id: "retro1",
			classType: "previsional",
			subClassType: "retroactivo",
			cadenaPrevisional,
			variables: { formulario },
		});
		expect(
			valoresDesdeCalculadora(guardado({ etapa: "retroactivo", origenRef: "hc1", origenEtapa: "haberCaja" }))!.cadenaOrigen,
		).toMatchObject({ calculatorId: "hc1" });
		const borrado = valoresDesdeCalculadora(guardado({ etapa: "retroactivo", origenRef: null, origenEtapa: null }))!;
		expect(borrado.cadenaOrigen).toMatchObject({ calculatorId: null, origenBorrado: true, serie: { desde: "2019-02", hasta: "2019-07" } });
		// los percibidos que trajo de la serie siguen en el retroactivo
		expect(borrado.percibidoManual).toBe(true);
		expect(borrado.percibidosMensuales).toHaveLength(6);
		// guardado sin formulario pero con vínculo en el documento: se conserva
		const sinFormulario = valoresDesdeCalculadora({
			...guardado({ origenRef: "hc1", origenEtapa: "haberCaja" }),
			variables: { input: armarInputRetroactivo(formulario) },
		})!;
		expect(sinFormulario.cadenaOrigen).toEqual({ etapa: "haberCaja", calculatorId: "hc1" });
	});
});

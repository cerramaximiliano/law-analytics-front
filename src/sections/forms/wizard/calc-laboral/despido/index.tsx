import React from "react";
import { useEffect, useState } from "react";

// material-ui
import { Button, Stack, Box, Typography } from "@mui/material";

// project-imports
import AnimateButton from "components/@extended/AnimateButton";
import FirstForm from "./first";
import SecondForm from "./second";
import ThirdForm from "./third";
import despidoFormModel from "./formModel/despidoFormModel";
import initialValues from "./formModel/formInitialValues";
import validationSchema from "./formModel/validationSchema";
import { Formik, Form } from "formik";

// third party
import dayjs from "utils/dayjs-config";
import ResultsView from "./resultsView";

import { WizardProps } from "types/wizards";

// step options - Eliminado el paso "Resultados" (resumen) para ir directo a los resultados calculados
const steps = ["Datos requeridos", "Cálculos opcionales", "Intereses"];
const { formId, formField } = despidoFormModel;

// Función helper para calcular el monto base para intereses
// IMPORTANTE: Esta función debe usar la MISMA lógica que _submitForm para que el capital
// mostrado en el paso de intereses coincida con el capital final calculado
function calculateBaseAmount(values: any): number {
	const remuneracionBase = parseFloat(values.remuneracion) || 0;
	if (!remuneracionBase || remuneracionBase <= 0) return 0;

	const fechaIngreso = values.fechaIngreso ? dayjs(values.fechaIngreso, "DD/MM/YYYY") : null;
	const fechaEgreso = values.fechaEgreso ? dayjs(values.fechaEgreso, "DD/MM/YYYY") : null;

	if (!fechaIngreso || !fechaEgreso || !fechaIngreso.isValid() || !fechaEgreso.isValid()) return 0;

	// Calcular remuneración con tope Vizzoti si aplica
	let remuneracionCalculada = remuneracionBase;
	if (values.isTopes && values.remuneracionTopes) {
		const topeLegalVigente = parseFloat(values.remuneracionTopes);
		if (!isNaN(topeLegalVigente) && topeLegalVigente > 0) {
			// Criterio Vizzoti: mayor entre 67% de remuneración y tope, pero no mayor que remuneración
			const sesentiSietePorciento = remuneracionBase * 0.67;
			const valorCalculado = Math.max(sesentiSietePorciento, topeLegalVigente);
			remuneracionCalculada = Math.min(valorCalculado, remuneracionBase);
		}
	}

	// Aplicar SAC si corresponde
	if (values.incluirSAC) {
		remuneracionCalculada = remuneracionCalculada + remuneracionCalculada / 12;
	}

	// Calcular períodos (misma lógica que _submitForm)
	const años = fechaEgreso.diff(fechaIngreso, "years");
	const finCopia = fechaEgreso.clone();
	const mesesRestantes = finCopia.subtract(años, "years").diff(fechaIngreso, "months");

	let periodos: number;
	if (values.aplicarLey27742) {
		const totalMeses = fechaEgreso.diff(fechaIngreso, "months");
		periodos = totalMeses < 6 ? 0 : años >= 1 ? años : 1;
	} else {
		periodos = mesesRestantes > 3 ? años + 1 : años;
	}

	let total = 0;

	// 1. Indemnización por antigüedad
	const indemnizacion = periodos * remuneracionCalculada;
	total += indemnizacion;

	// 2. Liquidación final (si está habilitada)
	if (values.isLiquidacion && Array.isArray(values.liquidacion)) {
		// Preaviso (misma lógica que calcularPreaviso)
		if (values.liquidacion.includes("preaviso")) {
			const mesesTotal = fechaEgreso.diff(fechaIngreso, "months");
			const añosTotal = fechaEgreso.diff(fechaIngreso, "years");
			if (mesesTotal < 3) {
				total += (remuneracionCalculada / 30) * 15;
			} else if (mesesTotal >= 3 && añosTotal < 5) {
				total += remuneracionCalculada;
			} else {
				total += remuneracionCalculada * 2;
			}
		}

		// Integración mes (misma lógica que calcularIntegracionMes)
		if (values.liquidacion.includes("integracionMes")) {
			const diasTotalesMes = fechaEgreso.daysInMonth();
			const diaEgreso = fechaEgreso.date();
			const diasRestantes = diasTotalesMes - diaEgreso;
			total += diasRestantes * (remuneracionBase / diasTotalesMes);
		}

		// SAC s/ Preaviso
		if (values.liquidacion.includes("sacPreaviso") && values.liquidacion.includes("preaviso")) {
			const mesesTotal = fechaEgreso.diff(fechaIngreso, "months");
			const añosTotal = fechaEgreso.diff(fechaIngreso, "years");
			let preaviso = 0;
			if (mesesTotal < 3) {
				preaviso = (remuneracionCalculada / 30) * 15;
			} else if (mesesTotal >= 3 && añosTotal < 5) {
				preaviso = remuneracionCalculada;
			} else {
				preaviso = remuneracionCalculada * 2;
			}
			total += preaviso / 12;
		}

		// SAC proporcional (misma lógica que en _submitForm)
		if (values.liquidacion.includes("sacProp")) {
			const finPeriodo = fechaEgreso;
			const inicioPeriodo = finPeriodo.month() < 6 ? dayjs(`${finPeriodo.year()}-01-01`) : dayjs(`${finPeriodo.year()}-07-01`);
			const diasTrabajados = finPeriodo.diff(inicioPeriodo, "days") + 1;
			total += (diasTrabajados / 365) * (remuneracionBase / 12);
		}

		// Días trabajados (misma lógica que en _submitForm)
		if (values.liquidacion.includes("diasTrabajados")) {
			const diasEnMes = fechaEgreso.daysInMonth();
			const diaDelMes = fechaEgreso.date();
			total += diaDelMes * (remuneracionBase / diasEnMes);
		}

		// Vacaciones (misma lógica que calcularVacacionesProporcionales)
		if (values.liquidacion.includes("vacaciones")) {
			// Para vacaciones usamos antigüedad tradicional (no afectada por Ley 27.742)
			const antiguedadVacaciones = mesesRestantes > 3 ? años + 1 : años;
			let diasVacaciones = 14;
			if (antiguedadVacaciones >= 5 && antiguedadVacaciones <= 9) diasVacaciones = 21;
			else if (antiguedadVacaciones >= 10 && antiguedadVacaciones <= 19) diasVacaciones = 28;
			else if (antiguedadVacaciones >= 20) diasVacaciones = 35;

			const inicioAnoCalendario = dayjs(`01-01-${fechaEgreso.year()}`, "DD-MM-YYYY");
			const inicioComputo = fechaIngreso.isAfter(inicioAnoCalendario) ? fechaIngreso : inicioAnoCalendario;
			const diasTrabajadosEnAno = fechaEgreso.diff(inicioComputo, "days") + 1;
			const diasVacacionesProporcionales = (diasTrabajadosEnAno / 365) * diasVacaciones;
			total += (remuneracionBase / 25) * diasVacacionesProporcionales;
		}
	}

	// 3. Multas (si están habilitadas)
	if (values.isMultas && Array.isArray(values.multas)) {
		if (values.multas.includes("multaArt1")) {
			total += indemnizacion * 0.5;
		}
		if (values.multas.includes("multaArt2")) {
			total += indemnizacion;
		}
		if (values.multas.includes("multaArt80")) {
			total += remuneracionBase * 3;
		}
		if (values.multas.includes("multaArt15")) {
			const mesesTrabajados = fechaEgreso.diff(fechaIngreso, "months", true);
			total += mesesTrabajados * remuneracionBase * 0.25;
		}
	}

	// 4. Otras sumas adeudadas
	const otrasSumas = parseFloat(values.otrasSumas) || 0;
	total += otrasSumas;

	return total;
}

function getStepContent(step: number, values: any, folder: any, onFolderChange?: (folderId: string | null) => void) {
	switch (step) {
		case 0:
			return <FirstForm formField={formField} folder={folder} onFolderChange={onFolderChange} />;
		case 1:
			return <SecondForm formField={formField} />;
		case 2:
			// Calcular el monto base para pasar al paso de intereses
			const calculatedAmount = calculateBaseAmount(values);
			return <ThirdForm formField={formField} calculatedAmount={calculatedAmount} />;
		default:
			throw new Error("Unknown step");
	}
}

// ==============================|| FORMS WIZARD - BASIC ||============================== //
const BasicWizard: React.FC<WizardProps> = ({ folder, onFolderChange }) => {
	const [activeStep, setActiveStep] = useState(0);
	const currentValidationSchema = validationSchema[activeStep];
	const isLastStep = activeStep === steps.length - 1;

	const handleBack = () => {
		setActiveStep(activeStep - 1);
	};

	const [formInitialValues, setFormInitialValues] = useState(() => ({
		...initialValues,
		folderId: folder?._id || "",
		folderName: folder?.folderName || "",
	}));

	useEffect(() => {
		setFormInitialValues((currentValues) => ({
			...currentValues,
			folderId: folder?._id || "",
			folderName: folder?.folderName || "",
		}));
	}, [folder?._id, folder?.folderName]);

	const [formResults, setFormResults] = useState<Record<string, any> | null>(null);

	function _sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	// Función para calcular intereses
	const calcularIntereses = (montoBase: number, fechaInicial: string, fechaFinal: string, tasaId: string): number => {
		if (!montoBase || !fechaInicial || !fechaFinal || !tasaId) return 0;

		const fechaInicialMoment = dayjs(fechaInicial, "DD/MM/YYYY");
		const fechaFinalMoment = dayjs(fechaFinal, "DD/MM/YYYY");

		// Calcular días entre fechas
		const diasTotales = fechaFinalMoment.diff(fechaInicialMoment, "days");
		if (diasTotales <= 0) return 0;

		// Tasas mensuales aproximadas (en el backend se usará la real)
		const tasas: { [key: string]: number } = {
			tasaPasivaBCRA: 0.06 / 30, // ~6% mensual
			acta2601: 0.08 / 30, // ~8% mensual
			acta2630: 0.1 / 30, // ~10% mensual
		};

		// Tasa diaria (aproximada para preview)
		const tasaDiaria = tasas[tasaId] || 0.06 / 30;

		// Cálculo de interés simple
		const interesTotal = montoBase * tasaDiaria * diasTotales;

		return Math.round(interesTotal * 100) / 100;
	};

	const calcularPreaviso = (fechaIngreso: string | null, fechaEgreso: string | null, remuneracion: number) => {
		if (!fechaIngreso || !fechaEgreso) return 0;

		const inicio = dayjs(fechaIngreso, "DD/MM/YYYY");
		const fin = dayjs(fechaEgreso, "DD/MM/YYYY");

		if (!inicio.isValid() || !fin.isValid()) return 0;

		const periodoPrueba = 3; // 3 meses
		const mesesTotal = fin.diff(inicio, "months");
		const añosTotal = fin.diff(inicio, "years");

		// Escenario 1: Menos de 3 meses (período de prueba)
		if (mesesTotal < periodoPrueba) {
			return (remuneracion / 30) * 15;
		}

		// Escenario 2: 3 meses o más pero menos de 5 años
		if (mesesTotal >= periodoPrueba && añosTotal < 5) {
			return remuneracion * 1;
		}

		// Escenario 3: 5 años o más
		return remuneracion * 2;
	};
	const calcularIntegracionMes = (fechaEgreso: string | null, remuneracion: number) => {
		if (!fechaEgreso) return 0;

		const fin = dayjs(fechaEgreso, "DD/MM/YYYY");
		if (!fin.isValid()) return 0;

		const diasTotalesMes = fin.daysInMonth();
		const diaEgreso = fin.date();
		const diasRestantes = diasTotalesMes - diaEgreso;

		const valorDiario = remuneracion / diasTotalesMes;
		return diasRestantes * valorDiario;
	};
	function calcularDiasTrabajados(fechaDespido: string) {
		// Convertir la fecha de despido a un objeto dayjs con formato DD/MM/YYYY
		const finPeriodo = dayjs(fechaDespido, "DD/MM/YYYY");

		if (!finPeriodo.isValid()) return 0;

		// Determinar la fecha de inicio del período según el semestre
		const inicioPeriodo =
			finPeriodo.month() < 6 // Mes 0-5 = primer semestre
				? dayjs(`${finPeriodo.year()}-01-01`) // 1 de enero del mismo año
				: dayjs(`${finPeriodo.year()}-07-01`); // 1 de julio del mismo año

		// Calcular la diferencia en días (incluyendo el día de despido)
		const diasTrabajados = finPeriodo.diff(inicioPeriodo, "days") + 1;

		return diasTrabajados;
	}

	function calcularVacacionesProporcionales(
		remuneracion: number,
		fechaInicioRelacion: string,
		fechaFin: string,
		antiguedad: number,
	): { diasVacacionesProporcionales: number; montoVacaciones: number } {
		// Días de vacaciones según antigüedad
		const diasVacacionesPorAntiguedad: { [key: string]: number } = {
			"0-4": 14,
			"5-9": 21,
			"10-19": 28,
			"20+": 35,
		};

		// Determinar los días de vacaciones por antigüedad
		let diasVacaciones = 0;
		if (antiguedad >= 0 && antiguedad <= 4) {
			diasVacaciones = diasVacacionesPorAntiguedad["0-4"];
		} else if (antiguedad >= 5 && antiguedad <= 9) {
			diasVacaciones = diasVacacionesPorAntiguedad["5-9"];
		} else if (antiguedad >= 10 && antiguedad <= 19) {
			diasVacaciones = diasVacacionesPorAntiguedad["10-19"];
		} else if (antiguedad >= 20) {
			diasVacaciones = diasVacacionesPorAntiguedad["20+"];
		}

		// Convertir fechas a objetos Moment
		const fechaInicioRelacionMoment = dayjs(fechaInicioRelacion, "DD/MM/YYYY");
		const fechaFinMoment = dayjs(fechaFin, "DD/MM/YYYY");

		// Validar fechas
		if (!fechaInicioRelacionMoment.isValid() || !fechaFinMoment.isValid()) {
			throw new Error("Las fechas proporcionadas no son válidas.");
		}

		// Obtener el inicio del año calendario o la fecha de inicio de la relación, lo que sea más reciente
		const inicioAnoCalendario = dayjs(`01-01-${fechaFinMoment.year()}`, "DD-MM-YYYY");
		const inicioComputo = fechaInicioRelacionMoment.isAfter(inicioAnoCalendario) ? fechaInicioRelacionMoment : inicioAnoCalendario;

		// Calcular los días trabajados en el año calendario
		const diasTrabajados = fechaFinMoment.diff(inicioComputo, "days") + 1;

		// Calcular los días de vacaciones proporcionales
		const diasVacacionesProporcionales = (diasTrabajados / 365) * diasVacaciones;

		// Calcular el monto por vacaciones proporcionales
		const montoVacaciones = (remuneracion / 25) * diasVacacionesProporcionales;

		// Retornar el resultado
		return {
			diasVacacionesProporcionales: parseFloat(diasVacacionesProporcionales.toFixed(2)),
			montoVacaciones: parseFloat(montoVacaciones.toFixed(2)),
		};
	}

	function calcularTopeVizzoti(mejorRemuneracionBruta: number, topeLegalVigente: number): number {
		// Calcular el 67% de la remuneración (criterio Vizzoti)
		const sesentiSietePorciento = mejorRemuneracionBruta * 0.67;

		// Criterio Vizzoti: tomar el mayor valor entre el 67% de la remuneración y el tope legal
		// Pero nunca superar la remuneración original
		const valorCalculado = Math.max(sesentiSietePorciento, topeLegalVigente);

		// No puede superar la remuneración original
		return Math.min(valorCalculado, mejorRemuneracionBruta);
	}
	function calcularMultaArt1Ley25323(indemnizacionTotal: number): number {
		return indemnizacionTotal * 0.5;
	}
	function calcularMultaArt2Ley25323(indemnizacionTotal: number): number {
		return indemnizacionTotal * 1;
	}
	function calcularMultaArt80LCT(mejorRemuneracionMensual: number): number {
		return mejorRemuneracionMensual * 3;
	}
	function calcularMultaArt15Ley24013(fechaInicio: string, fechaEgreso: string, mejorRemuneracion: number): number {
		// Convertir las fechas a objetos Moment
		const inicio = dayjs(fechaInicio, "DD/MM/YYYY");
		const egreso = dayjs(fechaEgreso, "DD/MM/YYYY");

		// Validar las fechas
		if (!inicio.isValid() || !egreso.isValid()) {
			throw new Error("Las fechas proporcionadas no son válidas.");
		}

		// Calcular la diferencia en meses completos
		const mesesTrabajados = egreso.diff(inicio, "months", true);

		// Calcular el total de remuneraciones no registradas
		const remuneracionesNoRegistradas = mesesTrabajados * mejorRemuneracion;

		// Calcular la multa (25% de las remuneraciones no registradas)
		const multa = remuneracionesNoRegistradas * 0.25;

		// Redondear a dos decimales y retornar
		return parseFloat(multa.toFixed(2));
	}
	function calcularMultaArt8Ley24013(fechaInicio: string, fechaEgreso: string, mejorRemuneracion: number): number {
		const inicio = dayjs(fechaInicio, "DD/MM/YYYY");
		const egreso = dayjs(fechaEgreso, "DD/MM/YYYY");

		if (!inicio.isValid() || !egreso.isValid()) {
			throw new Error("Las fechas proporcionadas no son válidas.");
		}

		const mesesTrabajados = egreso.diff(inicio, "months", true);
		const totalRemuneraciones = mesesTrabajados * mejorRemuneracion;

		return parseFloat((totalRemuneraciones * 0.25).toFixed(2));
	}
	function calcularMultaArt9Ley24013(fechaInicio: string, fechaEgreso: string, mejorRemuneracion: number): number {
		const inicio = dayjs(fechaInicio, "DD/MM/YYYY");
		const egreso = dayjs(fechaEgreso, "DD/MM/YYYY");

		if (!inicio.isValid() || !egreso.isValid()) {
			throw new Error("Las fechas proporcionadas no son válidas.");
		}

		const mesesTrabajados = egreso.diff(inicio, "months", true);
		const totalRemuneraciones = mesesTrabajados * mejorRemuneracion;

		return parseFloat((totalRemuneraciones * 0.25).toFixed(2));
	}
	function calcularMultaArt10Ley24013(
		fechaInicioNoRegistrada: string,
		fechaEgreso: string,
		remuneracionPercibida: number,
		remuneracionConsignada: number,
	): number {
		// Convertir fechas a objetos Moment
		const inicio = dayjs(fechaInicioNoRegistrada, "DD/MM/YYYY");
		const egreso = dayjs(fechaEgreso, "DD/MM/YYYY");

		// Validar fechas
		if (!inicio.isValid() || !egreso.isValid()) {
			throw new Error("Las fechas proporcionadas no son válidas.");
		}

		// Calcular meses trabajados en el período no registrado
		const mesesNoRegistrados = egreso.diff(inicio, "months", true);

		// Calcular el monto mensual no registrado
		const montoNoRegistradoMensual = remuneracionPercibida - remuneracionConsignada;

		// Validar que haya un monto no registrado positivo
		if (montoNoRegistradoMensual <= 0) {
			throw new Error("No hay remuneración no registrada para calcular la multa.");
		}

		// Calcular el total no registrado
		const totalNoRegistrado = montoNoRegistradoMensual * mesesNoRegistrados;

		// Calcular la multa (25% del total no registrado)
		const multa = totalNoRegistrado * 0.25;

		// Retornar el resultado redondeado a dos decimales
		return parseFloat(multa.toFixed(2));
	}
	async function _submitForm(values: any, actions: any) {
		await _sleep(1000);
		const calcularPeriodos = (fechaIngreso: string | null, fechaEgreso: string | null, aplicarLey27742: boolean = false) => {
			if (!fechaIngreso || !fechaEgreso) return 0;

			const inicio = dayjs(fechaIngreso, "DD/MM/YYYY");
			const fin = dayjs(fechaEgreso, "DD/MM/YYYY");

			if (!inicio.isValid() || !fin.isValid()) return 0;

			// Calcular años y meses sin modificar los objetos originales
			const años = fin.diff(inicio, "years");
			const finCopia = fin.clone(); // Crear copia para evitar modificar el original
			const mesesRestantes = finCopia.subtract(años, "years").diff(inicio, "months");

			if (aplicarLey27742) {
				// Ley 27.742: Solo años completos (sin sumar fracción mayor a 3 meses)
				// Requiere mínimo 6 meses de antigüedad (período de prueba)
				const totalMeses = fin.diff(inicio, "months");
				if (totalMeses < 6) {
					return 0; // Menos de 6 meses = sin indemnización
				}
				return años >= 1 ? años : 1; // A partir de 6 meses ya cuenta como 1 año mínimo
			} else {
				// Criterio tradicional: fracción mayor a 3 meses cuenta como año adicional
				return mesesRestantes > 3 ? años + 1 : años;
			}
		};

		const periodos = calcularPeriodos(values.fechaIngreso, values.fechaEgreso, values.aplicarLey27742);
		if (isNaN(periodos) || periodos < 0) {
			actions.setSubmitting(false);
			return;
		}

		// Con Ley 27.742, si hay 0 períodos es válido (menos de 6 meses de antigüedad)

		const remuneracionBase = parseFloat(values.remuneracion);
		if (isNaN(remuneracionBase) || remuneracionBase <= 0) {
			actions.setSubmitting(false);
			return;
		}
		let remuneracionCalculada;

		if (values.isTopes && values.remuneracionTopes) {
			const topeLegalVigente = parseFloat(values.remuneracionTopes);
			if (!isNaN(topeLegalVigente) && topeLegalVigente > 0) {
				const remuneracionTope = calcularTopeVizzoti(remuneracionBase, topeLegalVigente);
				remuneracionCalculada = values.incluirSAC ? remuneracionTope + remuneracionTope / 12 : remuneracionTope;
			} else {
				// Si el tope no es válido, usar la remuneración base
				remuneracionCalculada = values.incluirSAC ? remuneracionBase + remuneracionBase / 12 : remuneracionBase;
			}
		} else {
			remuneracionCalculada = values.incluirSAC ? remuneracionBase + remuneracionBase / 12 : remuneracionBase;
		}

		const indemnizacion = periodos * remuneracionCalculada;
		if (isNaN(indemnizacion)) {
			actions.setSubmitting(false);
			return;
		}

		// Verificar si está en período de prueba (menos de 3 meses o 6 meses con Ley 27.742)
		const fechaIngresoDate = dayjs(values.fechaIngreso, "DD/MM/YYYY");
		const fechaEgresoDate = dayjs(values.fechaEgreso, "DD/MM/YYYY");
		const mesesTrabajados = fechaEgresoDate.diff(fechaIngresoDate, "months");
		const esPeriodoPrueba = values.aplicarLey27742 ? mesesTrabajados < 6 : mesesTrabajados < 3;

		const resultado: Record<string, any> = {
			folderId: values.folderId,
			...values,
			Periodos: periodos,
			Indemnizacion: indemnizacion,
			esPeriodoPrueba: esPeriodoPrueba,
		};

		// Si se aplicó tope, agregar la remuneración tope calculada
		if (values.isTopes && values.remuneracionTopes) {
			const topeLegalVigente = parseFloat(values.remuneracionTopes);
			if (!isNaN(topeLegalVigente) && topeLegalVigente > 0) {
				const remuneracionTope = calcularTopeVizzoti(remuneracionBase, topeLegalVigente);
				resultado.remuneracionTope = remuneracionTope;
			}
		}
		// Debug intermedio

		if (values.isLiquidacion && Array.isArray(values.liquidacion)) {
			if (values.liquidacion.includes("preaviso")) {
				resultado.Preaviso = calcularPreaviso(values.fechaIngreso, values.fechaEgreso, remuneracionCalculada);
			}
			if (values.liquidacion.includes("integracionMes")) {
				resultado["Integración Mes"] = calcularIntegracionMes(values.fechaEgreso, remuneracionBase);
			}
			if (values.liquidacion.includes("sacPreaviso") && resultado.Preaviso) {
				resultado["SAC s/ Preaviso"] = resultado.Preaviso / 12;
			}
			if (values.liquidacion.includes("sacProp")) {
				const diasTrabajados = calcularDiasTrabajados(values.fechaEgreso);
				resultado["SAC proporcional"] = (diasTrabajados / 365) * (remuneracionBase / 12);
			}
			if (values.liquidacion.includes("diasTrabajados")) {
				const fin = dayjs(values.fechaEgreso, "DD/MM/YYYY");
				if (fin.isValid()) {
					const diasEnMes = fin.daysInMonth();
					const diaDelMes = fin.date();
					resultado["Días Trabajados"] = diaDelMes * (remuneracionBase / diasEnMes);
				}
			}
			if (values.liquidacion.includes("vacaciones")) {
				// Para vacaciones usamos siempre el cálculo tradicional de antigüedad (no afectado por Ley 27.742)
				const antiguedad = calcularPeriodos(values.fechaIngreso, values.fechaEgreso, false);
				const vacaciones = calcularVacacionesProporcionales(remuneracionBase, values.fechaIngreso, values.fechaEgreso, antiguedad);
				resultado["Días Vacaciones"] = vacaciones.diasVacacionesProporcionales;
				resultado["Monto Vacaciones"] = vacaciones.montoVacaciones;
			}
		}

		if (values.isMultas && Array.isArray(values.multas)) {
			if (values.multas.includes("multaArt1")) {
				resultado["Multa Art. 1º Ley 25.323"] = calcularMultaArt1Ley25323(indemnizacion);
			}
			if (values.multas.includes("multaArt2")) {
				resultado["Multa Art. 2º Ley 25.323"] = calcularMultaArt2Ley25323(indemnizacion);
			}
			if (values.multas.includes("multaArt80")) {
				resultado["Multa Art. 80 LCT"] = calcularMultaArt80LCT(remuneracionBase);
			}
			if (values.multas.includes("multaArt15")) {
				resultado["Multa Art. 15 Ley 24.013"] = calcularMultaArt15Ley24013(values.fechaIngreso, values.fechaEgreso, remuneracionBase);
			}
		}

		if (values.multaLE === 1) {
			resultado["Multa Art. 8 Ley 24.013"] = calcularMultaArt8Ley24013(values.fechaIngreso, values.fechaEgreso, remuneracionBase);
		} else if (values.multaLE === 2 && values.fechaFalsa) {
			resultado["Multa Art. 9 Ley 24.013"] = calcularMultaArt9Ley24013(values.fechaFalsa, values.fechaIngreso, remuneracionBase);
		} else if (values.multaLE === 3) {
			resultado["Multa Art. 10 Ley 24.013"] = calcularMultaArt10Ley24013(
				values.fechaIngreso,
				values.fechaEgreso,
				remuneracionBase,
				values.salarioFalso,
			);
		}

		// Agregar cálculo de intereses si corresponde
		if (values.aplicarIntereses) {
			const segments = values.segmentsIntereses || [];

			if (segments.length > 0) {
				// Calcular el capital base sumando todos los rubros (indemnización + liquidación + multas + otras sumas)
				let capitalBase = indemnizacion;

				// Sumar liquidación
				if (resultado.Preaviso) capitalBase += resultado.Preaviso;
				if (resultado["Integración Mes"]) capitalBase += resultado["Integración Mes"];
				if (resultado["SAC s/ Preaviso"]) capitalBase += resultado["SAC s/ Preaviso"];
				if (resultado["SAC proporcional"]) capitalBase += resultado["SAC proporcional"];
				if (resultado["Días Trabajados"]) capitalBase += resultado["Días Trabajados"];
				if (resultado["Monto Vacaciones"]) capitalBase += resultado["Monto Vacaciones"];

				// Sumar multas
				if (resultado["Multa Art. 1º Ley 25.323"]) capitalBase += resultado["Multa Art. 1º Ley 25.323"];
				if (resultado["Multa Art. 2º Ley 25.323"]) capitalBase += resultado["Multa Art. 2º Ley 25.323"];
				if (resultado["Multa Art. 80 LCT"]) capitalBase += resultado["Multa Art. 80 LCT"];
				if (resultado["Multa Art. 15 Ley 24.013"]) capitalBase += resultado["Multa Art. 15 Ley 24.013"];
				if (resultado["Multa Art. 8 Ley 24.013"]) capitalBase += resultado["Multa Art. 8 Ley 24.013"];
				if (resultado["Multa Art. 9 Ley 24.013"]) capitalBase += resultado["Multa Art. 9 Ley 24.013"];
				if (resultado["Multa Art. 10 Ley 24.013"]) capitalBase += resultado["Multa Art. 10 Ley 24.013"];

				// Sumar otras sumas
				if (values.otrasSumas) capitalBase += parseFloat(values.otrasSumas) || 0;

				// Verificar si el capital de los segmentos coincide con el capital calculado real
				// Si el usuario modificó rubros después de configurar intereses, los segmentos pueden estar desactualizados
				const capitalSegmentos = segments[0]?.capital || 0;
				const diferenciaCapital = Math.abs(capitalBase - capitalSegmentos);

				// Recalcular segmentos si hay diferencia significativa (más de $1)
				let segmentosAjustados = segments;
				let totalIntereses: number;

				if (diferenciaCapital > 1) {
					// Ajustar proporcionalmente cada segmento con el nuevo capital
					let capitalAcumulado = capitalBase;
					segmentosAjustados = segments.map((seg: any, index: number) => {
						const nuevoCapital = values.capitalizeInterest && index > 0 ? capitalAcumulado : capitalBase;
						const nuevoInteres = Math.round(nuevoCapital * seg.coefficient);

						if (values.capitalizeInterest) {
							capitalAcumulado = nuevoCapital + nuevoInteres;
						}

						return {
							...seg,
							capital: nuevoCapital,
							interest: nuevoInteres,
						};
					});

					totalIntereses = segmentosAjustados.reduce((sum: number, seg: any) => sum + (seg.interest || 0), 0);
				} else {
					totalIntereses = segments.reduce((sum: number, seg: any) => sum + (seg.interest || 0), 0);
				}

				// Si hay capitalización, el monto final es diferente
				const montoTotalConIntereses = values.capitalizeInterest
					? (segmentosAjustados[segmentosAjustados.length - 1]?.capital || capitalBase) +
						(segmentosAjustados[segmentosAjustados.length - 1]?.interest || 0)
					: capitalBase + totalIntereses;

				resultado.datosIntereses = {
					fechaInicialIntereses: segmentosAjustados[0]?.startDate || values.fechaInicialIntereses,
					fechaFinalIntereses: segmentosAjustados[segmentosAjustados.length - 1]?.endDate || values.fechaFinalIntereses,
					tasaIntereses: segmentosAjustados.map((s: any) => s.rate).join(","),
					segments: segmentosAjustados.map((seg: any) => ({
						startDate: seg.startDate,
						endDate: seg.endDate,
						rate: seg.rate,
						rateName: seg.rateName,
						capital: seg.capital,
						interest: seg.interest,
						coefficient: seg.coefficient,
						isExtension: seg.isExtension || false,
					})),
					capitalizeInterest: values.capitalizeInterest || false,
					montoIntereses: totalIntereses,
					montoTotalConIntereses: montoTotalConIntereses,
					capitalAjustado: diferenciaCapital > 1, // Flag para indicar si hubo ajuste
				};
			} else if (values.fechaInicialIntereses && values.fechaFinalIntereses && values.tasaIntereses) {
				// Fallback al método anterior para compatibilidad
				// Calcular el capital base sumando todos los rubros
				let capitalBaseFallback = indemnizacion;

				// Sumar liquidación
				if (resultado.Preaviso) capitalBaseFallback += resultado.Preaviso;
				if (resultado["Integración Mes"]) capitalBaseFallback += resultado["Integración Mes"];
				if (resultado["SAC s/ Preaviso"]) capitalBaseFallback += resultado["SAC s/ Preaviso"];
				if (resultado["SAC proporcional"]) capitalBaseFallback += resultado["SAC proporcional"];
				if (resultado["Días Trabajados"]) capitalBaseFallback += resultado["Días Trabajados"];
				if (resultado["Monto Vacaciones"]) capitalBaseFallback += resultado["Monto Vacaciones"];

				// Sumar multas
				if (resultado["Multa Art. 1º Ley 25.323"]) capitalBaseFallback += resultado["Multa Art. 1º Ley 25.323"];
				if (resultado["Multa Art. 2º Ley 25.323"]) capitalBaseFallback += resultado["Multa Art. 2º Ley 25.323"];
				if (resultado["Multa Art. 80 LCT"]) capitalBaseFallback += resultado["Multa Art. 80 LCT"];
				if (resultado["Multa Art. 15 Ley 24.013"]) capitalBaseFallback += resultado["Multa Art. 15 Ley 24.013"];
				if (resultado["Multa Art. 8 Ley 24.013"]) capitalBaseFallback += resultado["Multa Art. 8 Ley 24.013"];
				if (resultado["Multa Art. 9 Ley 24.013"]) capitalBaseFallback += resultado["Multa Art. 9 Ley 24.013"];
				if (resultado["Multa Art. 10 Ley 24.013"]) capitalBaseFallback += resultado["Multa Art. 10 Ley 24.013"];

				// Sumar otras sumas
				if (values.otrasSumas) capitalBaseFallback += parseFloat(values.otrasSumas) || 0;

				const montoIntereses = calcularIntereses(
					capitalBaseFallback,
					values.fechaInicialIntereses,
					values.fechaFinalIntereses,
					values.tasaIntereses,
				);

				resultado.datosIntereses = {
					fechaInicialIntereses: values.fechaInicialIntereses,
					fechaFinalIntereses: values.fechaFinalIntereses,
					tasaIntereses: values.tasaIntereses,
					montoIntereses: montoIntereses,
					montoTotalConIntereses: capitalBaseFallback + montoIntereses,
				};
			}
		}

		//alert(JSON.stringify(resultado, null, 2));
		setFormResults(resultado);
		actions.setSubmitting(false);
		setActiveStep(activeStep + 1);
	}

	function _handleSubmit(values: any, actions: any) {
		if (isLastStep) {
			_submitForm(values, actions);
		} else {
			setActiveStep(activeStep + 1);
			actions.setTouched({});
			actions.setSubmitting(false);
		}
	}

	return (
		<Box sx={{ width: "100%" }}>
			{/* Progress Steps */}
			<Stack direction="row" spacing={1.5} sx={{ pb: 4 }}>
				{steps.map((label, index) => (
					<Box key={label} sx={{ position: "relative", width: "100%" }}>
						<Box
							sx={{
								height: 3,
								bgcolor: index <= activeStep ? "primary.main" : "divider",
								borderRadius: 1,
								transition: "all 0.3s ease",
							}}
						/>
						<Typography
							variant="caption"
							sx={{
								position: "absolute",
								top: 6,
								fontSize: 11,
								color: index <= activeStep ? "primary.main" : "text.secondary",
								transition: "color 0.3s ease",
							}}
						>
							{label}
						</Typography>
					</Box>
				))}
			</Stack>
			{activeStep === steps.length ? (
				<ResultsView
					values={formResults || {}}
					onReset={() => {
						setActiveStep(0);
						setFormResults(null);
						setFormInitialValues({
							...initialValues,
							folderId: folder?._id || "",
							folderName: folder?.folderName || "",
						});
					}}
					folderId={formResults?.folderId}
					folderName={formResults?.folderName}
				/>
			) : (
				<Formik initialValues={formInitialValues} validationSchema={currentValidationSchema} onSubmit={_handleSubmit}>
					{({ isSubmitting, values }) => (
						<Form id={formId}>
							{getStepContent(activeStep, values, folder, onFolderChange)}
							<Stack direction="row" justifyContent={activeStep !== 0 ? "space-between" : "flex-end"}>
								{activeStep !== 0 && (
									<Button onClick={handleBack} sx={{ my: 3, ml: 1 }}>
										Atrás
									</Button>
								)}
								<AnimateButton>
									<Button disabled={isSubmitting} variant="contained" type="submit" sx={{ my: 3, ml: 1 }}>
										{isLastStep ? "Calcular" : "Siguiente"}
									</Button>
								</AnimateButton>
							</Stack>
						</Form>
					)}
				</Formik>
			)}
		</Box>
	);
};

export default BasicWizard;

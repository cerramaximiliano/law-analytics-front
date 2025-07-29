import { useEffect, useState } from "react";

// material-ui
import { Button, Step, Stepper, StepLabel, Stack } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import AnimateButton from "components/@extended/AnimateButton";
import FirstForm from "./first";
import SecondForm from "./second";
import ThirdForm from "./third";
import Review from "./final";
import despidoFormModel from "./formModel/despidoFormModel";
import initialValues from "./formModel/formInitialValues";
import validationSchema from "./formModel/validationSchema";
import { Formik, Form } from "formik";

// third party
import moment from "moment";
import ResultsView from "./resultsView";

import { WizardProps } from "types/wizards";

// step options
const steps = ["Datos requeridos", "Cálculos opcionales", "Intereses", "Resultados"];
const { formId, formField } = despidoFormModel;

function getStepContent(step: number, values: any) {
	switch (step) {
		case 0:
			return <FirstForm formField={formField} />;
		case 1:
			return <SecondForm formField={formField} />;
		case 2:
			return <ThirdForm formField={formField} />;
		case 3:
			return <Review formField={formField} values={values} />;
		default:
			throw new Error("Unknown step");
	}
}

// ==============================|| FORMS WIZARD - BASIC ||============================== //
const BasicWizard: React.FC<WizardProps> = ({ folder }) => {
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

		const fechaInicialMoment = moment(fechaInicial, "DD/MM/YYYY");
		const fechaFinalMoment = moment(fechaFinal, "DD/MM/YYYY");

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

	const calcularPreaviso = (fechaIngreso: Date | null, fechaEgreso: Date | null, remuneracion: number) => {
		if (!fechaIngreso || !fechaEgreso) return 0;

		const inicio = moment(fechaIngreso);
		const fin = moment(fechaEgreso);

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
	const calcularIntegracionMes = (fechaEgreso: Date | null, remuneracion: number) => {
		if (!fechaEgreso) return 0;

		const fin = moment(fechaEgreso);
		const diasTotalesMes = fin.daysInMonth();
		const diaEgreso = fin.date();
		const diasRestantes = diasTotalesMes - diaEgreso;

		const valorDiario = remuneracion / diasTotalesMes;
		return diasRestantes * valorDiario;
	};
	function calcularDiasTrabajados(fechaDespido: string) {
		// Convertir la fecha de despido a un objeto Moment
		const finPeriodo = moment(fechaDespido);

		// Determinar la fecha de inicio del período según el semestre
		const inicioPeriodo =
			finPeriodo.month() < 6 // Mes 0-5 = primer semestre
				? moment(`${finPeriodo.year()}-01-01`) // 1 de enero del mismo año
				: moment(`${finPeriodo.year()}-07-01`); // 1 de julio del mismo año

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
		const fechaInicioRelacionMoment = moment(fechaInicioRelacion, "DD/MM/YYYY");
		const fechaFinMoment = moment(fechaFin, "DD/MM/YYYY");

		// Validar fechas
		if (!fechaInicioRelacionMoment.isValid() || !fechaFinMoment.isValid()) {
			throw new Error("Las fechas proporcionadas no son válidas.");
		}

		// Obtener el inicio del año calendario o la fecha de inicio de la relación, lo que sea más reciente
		const inicioAnoCalendario = moment(`01-01-${fechaFinMoment.year()}`, "DD-MM-YYYY");
		const inicioComputo = moment.max(fechaInicioRelacionMoment, inicioAnoCalendario);

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
		const inicio = moment(fechaInicio, "DD/MM/YYYY");
		const egreso = moment(fechaEgreso, "DD/MM/YYYY");

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
		const inicio = moment(fechaInicio, "DD/MM/YYYY");
		const egreso = moment(fechaEgreso, "DD/MM/YYYY");

		if (!inicio.isValid() || !egreso.isValid()) {
			throw new Error("Las fechas proporcionadas no son válidas.");
		}

		const mesesTrabajados = egreso.diff(inicio, "months", true);
		const totalRemuneraciones = mesesTrabajados * mejorRemuneracion;

		return parseFloat((totalRemuneraciones * 0.25).toFixed(2));
	}
	function calcularMultaArt9Ley24013(fechaInicio: string, fechaEgreso: string, mejorRemuneracion: number): number {
		const inicio = moment(fechaInicio, "DD/MM/YYYY");
		const egreso = moment(fechaEgreso, "DD/MM/YYYY");

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
		const inicio = moment(fechaInicioNoRegistrada, "DD/MM/YYYY");
		const egreso = moment(fechaEgreso, "DD/MM/YYYY");

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
		const calcularPeriodos = (fechaIngreso: Date | null, fechaEgreso: Date | null, aplicarLey27742: boolean = false) => {
			if (!fechaIngreso || !fechaEgreso) return 0;

			const inicio = moment(fechaIngreso);
			const fin = moment(fechaEgreso);

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

		const resultado = {
			folderId: values.folderId,
			...values,
			Periodos: periodos,
			Indemnizacion: indemnizacion,
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
				const fin = moment(values.fechaEgreso);
				const diasEnMes = fin.daysInMonth();
				const diaDelMes = fin.date();
				resultado["Días Trabajados"] = diaDelMes * (remuneracionBase / diasEnMes);
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
		if (values.aplicarIntereses && values.fechaInicialIntereses && values.fechaFinalIntereses && values.tasaIntereses) {
			// Calcular intereses sobre el monto total
			const montoIntereses = calcularIntereses(
				indemnizacion,
				values.fechaInicialIntereses,
				values.fechaFinalIntereses,
				values.tasaIntereses,
			);

			resultado.datosIntereses = {
				fechaInicialIntereses: values.fechaInicialIntereses,
				fechaFinalIntereses: values.fechaFinalIntereses,
				tasaIntereses: values.tasaIntereses,
				montoIntereses: montoIntereses,
				montoTotalConIntereses: indemnizacion + montoIntereses,
			};
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
		<MainCard title="Liquidación por Despido con Causa">
			<Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
				{steps.map((label) => (
					<Step key={label}>
						<StepLabel>{label}</StepLabel>
					</Step>
				))}
			</Stepper>
			<>
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
								{getStepContent(activeStep, values)}
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
			</>
		</MainCard>
	);
};

export default BasicWizard;

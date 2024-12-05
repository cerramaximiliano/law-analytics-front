import { useState } from "react";

// material-ui
import { Button, Step, Stepper, StepLabel, Stack, Typography } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import AnimateButton from "components/@extended/AnimateButton";
import FirstForm from "./first";
import SecondForm from "./second";
import Review from "./final";
import despidoFormModel from "./formModel/despidoFormModel";
import initialValues from "./formModel/formInitialValues";
import validationSchema from "./formModel/validationSchema";
import { Formik, Form } from "formik";

// third party
import moment from "moment";

// step options
const steps = ["Datos requeridos", "Cálculos opcionales", "Resultados"];
const { formId, formField } = despidoFormModel;

function getStepContent(step: number, values: any) {
	switch (step) {
		case 0:
			return <FirstForm formField={formField} />;
		case 1:
			return <SecondForm formField={formField} />;
		case 2:
			return <Review formField={formField} values={values} />;
		default:
			throw new Error("Unknown step");
	}
}

// ==============================|| FORMS WIZARD - BASIC ||============================== //

const BasicWizard = () => {
	const [activeStep, setActiveStep] = useState(0);
	const currentValidationSchema = validationSchema[activeStep];
	const isLastStep = activeStep === steps.length - 1;
	const handleBack = () => {
		setActiveStep(activeStep - 1);
	};

	function _sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
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
	async function _submitForm(values: any, actions: any) {
		await _sleep(1000);
		const calcularPeriodos = (fechaIngreso: Date | null, fechaEgreso: Date | null) => {
			if (!fechaIngreso || !fechaEgreso) return 0;

			const inicio = moment(fechaIngreso);
			const fin = moment(fechaEgreso);

			// Obtener años y meses de diferencia
			const años = fin.diff(inicio, "years");
			const mesesRestantes = fin.subtract(años, "years").diff(inicio, "months");

			// Si hay más de 3 meses, sumar un año adicional
			const añosFinales = mesesRestantes > 3 ? años + 1 : años;

			return añosFinales;
		};

		// Calcular períodos
		const periodos = calcularPeriodos(values.fechaIngreso, values.fechaEgreso);

		// Calcular la remuneración incluyendo SAC si corresponde
		const remuneracionBase = parseFloat(values.remuneracion);
		const remuneracionCalculada = values.incluirSAC
			? remuneracionBase + remuneracionBase / 12 // Suma una doceava parte si incluirSAC es true
			: remuneracionBase;

		// Calcular indemnización con la remuneración ajustada
		const indemnizacion = periodos * remuneracionCalculada;

		const resultado = {
			...values,
			Periodos: periodos,
			Indemnizacion: indemnizacion,
			...(values.otrasSumas && { "Otras Sumas": parseFloat(values.otrasSumas) }),
		};

		// Si isLiquidacion es true, verificamos los valores en el array liquidacion
		if (values.isLiquidacion && Array.isArray(values.liquidacion)) {
			if (values.liquidacion.includes("preaviso")) {
				resultado.Preaviso = calcularPreaviso(values.fechaIngreso, values.fechaEgreso, remuneracionCalculada);
			}
			if (values.liquidacion.includes("integracionMes")) {
				resultado["Integracion Mes"] = calcularIntegracionMes(
					values.fechaEgreso,
					remuneracionBase, // Usamos remuneracionBase sin SAC para este cálculo
				);
			}
			if (values.liquidacion.includes("sacPreaviso") && resultado.Preaviso) {
				resultado["SAC s/ Preaviso"] = resultado.Preaviso / 12;
			}
			if (values.liquidacion.includes("sacProp")) {
				const diasTrabajados = calcularDiasTrabajados(values.fechaEgreso);
				resultado["SAC proporcional"] = (diasTrabajados / 365) * (remuneracionBase / 12);
			}
		}

		alert(JSON.stringify(resultado, null, 2));
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
					<>
						<Typography variant="h5" gutterBottom>
							Resultados.
						</Typography>
						<Typography variant="subtitle1">
							Your order number is #2001539. We have emailed your order confirmation, and will send you an update when your order has
							shipped.
						</Typography>
						<Stack direction="row" justifyContent="flex-end">
							<AnimateButton>
								<Button variant="contained" color="error" onClick={() => setActiveStep(0)} sx={{ my: 3, ml: 1 }}>
									Reset
								</Button>
							</AnimateButton>
						</Stack>
					</>
				) : (
					<Formik initialValues={initialValues} validationSchema={currentValidationSchema} onSubmit={_handleSubmit}>
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

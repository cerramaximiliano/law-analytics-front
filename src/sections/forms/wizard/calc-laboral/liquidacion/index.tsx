import React from "react";
import { useState } from "react";

// material-ui
import { Button, Stack, Box, Typography } from "@mui/material";

// project-imports
import AnimateButton from "components/@extended/AnimateButton";
import FirstForm from "./first";
import SecondForm from "./second";
import ThirdForm from "./third";
import ResultsView from "./resultsView";
import liquidacionFormModel from "./formModel/liquidacionFormModel";
import initialValues from "./formModel/formInitialValues";
import validationSchema from "./formModel/validationSchema";
import { Formik, Form } from "formik";

// third party
import dayjs from "utils/dayjs-config";

//types
import { WizardProps } from "types/wizards";
// step options
const steps = ["Datos requeridos", "Cálculos", "Intereses", "Resultados"];
const { formId, formField } = liquidacionFormModel;

// Función helper para calcular el monto base para intereses
function calculateBaseAmount(values: any): number {
	const remuneracionBase = parseFloat(values.remuneracion) || 0;
	const remuneracionCalculada = values.incluirSAC ? remuneracionBase + remuneracionBase / 12 : remuneracionBase;

	// Calcular períodos - las fechas vienen como strings en formato DD/MM/YYYY
	const fechaIngreso = values.fechaIngreso ? dayjs(values.fechaIngreso, "DD/MM/YYYY") : null;
	const fechaEgreso = values.fechaEgreso ? dayjs(values.fechaEgreso, "DD/MM/YYYY") : null;

	let periodos = 0;
	if (fechaIngreso && fechaEgreso && fechaIngreso.isValid() && fechaEgreso.isValid()) {
		const años = fechaEgreso.diff(fechaIngreso, "years");
		const mesesRestantes = fechaEgreso.clone().subtract(años, "years").diff(fechaIngreso, "months");
		periodos = mesesRestantes > 3 ? años + 1 : años;
	}

	let total = 0;

	// Liquidación final
	if (Array.isArray(values.liquidacion)) {
		// Preaviso
		if (values.liquidacion.includes("preaviso") && fechaIngreso && fechaEgreso) {
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
		// Integración mes
		if (values.liquidacion.includes("integracionMes") && fechaEgreso) {
			const diasTotalesMes = fechaEgreso.daysInMonth();
			const diaEgreso = fechaEgreso.date();
			const diasRestantes = diasTotalesMes - diaEgreso;
			total += diasRestantes * (remuneracionBase / diasTotalesMes);
		}
		// SAC s/ Preaviso (solo si hay preaviso)
		if (values.liquidacion.includes("sacPreaviso") && values.liquidacion.includes("preaviso")) {
			const mesesTotal = fechaEgreso?.diff(fechaIngreso, "months") || 0;
			const añosTotal = fechaEgreso?.diff(fechaIngreso, "years") || 0;
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
		// SAC proporcional
		if (values.liquidacion.includes("sacProp") && fechaEgreso) {
			const finPeriodo = fechaEgreso;
			const inicioPeriodo = finPeriodo.month() < 6 ? dayjs(`${finPeriodo.year()}-01-01`) : dayjs(`${finPeriodo.year()}-07-01`);
			const diasTrabajados = finPeriodo.diff(inicioPeriodo, "days") + 1;
			total += (diasTrabajados / 365) * (remuneracionBase / 12);
		}
		// Días trabajados
		if (values.liquidacion.includes("diasTrabajados") && fechaEgreso) {
			const diasEnMes = fechaEgreso.daysInMonth();
			const diaDelMes = fechaEgreso.date();
			total += diaDelMes * (remuneracionBase / diasEnMes);
		}
		// Vacaciones
		if (values.liquidacion.includes("vacaciones") && fechaIngreso && fechaEgreso) {
			const antiguedad = periodos;
			let diasVacaciones = 14;
			if (antiguedad >= 5 && antiguedad <= 9) diasVacaciones = 21;
			else if (antiguedad >= 10 && antiguedad <= 19) diasVacaciones = 28;
			else if (antiguedad >= 20) diasVacaciones = 35;

			const inicioAnoCalendario = dayjs(`01-01-${fechaEgreso.year()}`, "DD-MM-YYYY");
			const inicioComputo = fechaIngreso.isAfter(inicioAnoCalendario) ? fechaIngreso : inicioAnoCalendario;
			const diasTrabajadosEnAno = fechaEgreso.diff(inicioComputo, "days") + 1;
			const diasVacacionesProporcionales = (diasTrabajadosEnAno / 365) * diasVacaciones;
			total += (remuneracionBase / 25) * diasVacacionesProporcionales;
		}
	}

	// Otras sumas adeudadas
	const otrasSumas = parseFloat(values.otrasSumas) || 0;
	total += otrasSumas;

	return total;
}

function getStepContent(
	step: number,
	values: any,
	handleReset: () => void,
	folderId?: string,
	folderName?: string,
	folder?: any,
	onFolderChange?: (folderId: string | null) => void,
) {
	switch (step) {
		case 0:
			return <FirstForm formField={formField} folder={folder} onFolderChange={onFolderChange} />;
		case 1:
			return <SecondForm formField={formField} />;
		case 2:
			// Calcular el monto base para pasar al paso de intereses
			const calculatedAmount = calculateBaseAmount(values);
			return <ThirdForm formField={formField} calculatedAmount={calculatedAmount} />;
		case 3:
			return <ResultsView values={values} onReset={handleReset} folderId={folderId} folderName={folderName} />;
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

	const createHandleReset = (resetForm: () => void) => () => {
		setActiveStep(0);
		resetForm();
	};

	function _handleSubmit(values: any, actions: any) {
		if (isLastStep) {
			// En el último paso, simplemente renderizamos los resultados
			actions.setSubmitting(false);
		} else {
			setActiveStep(activeStep + 1);
			actions.setTouched({});
			actions.setSubmitting(false);
		}
	}

	return (
		<Box sx={{ width: "100%" }}>
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
			<Formik initialValues={initialValues} validationSchema={currentValidationSchema} onSubmit={_handleSubmit}>
				{({ isSubmitting, values, resetForm }) => (
					<Form id={formId}>
						{getStepContent(activeStep, values, createHandleReset(resetForm), folder?._id, folder?.folderName, folder, onFolderChange)}
						{!isLastStep && (
							<Stack direction="row" justifyContent={activeStep !== 0 ? "space-between" : "flex-end"}>
								{activeStep !== 0 && (
									<Button onClick={handleBack} sx={{ my: 3, ml: 1 }}>
										Atrás
									</Button>
								)}
								<AnimateButton>
									<Button disabled={isSubmitting} variant="contained" type="submit" sx={{ my: 3, ml: 1 }}>
										{activeStep === steps.length - 2 ? "Calcular" : "Siguiente"}
									</Button>
								</AnimateButton>
							</Stack>
						)}
					</Form>
				)}
			</Formik>
		</Box>
	);
};

export default BasicWizard;

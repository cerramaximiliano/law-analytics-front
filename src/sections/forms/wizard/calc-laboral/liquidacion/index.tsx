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

//types
import { WizardProps } from "types/wizards";
// step options
const steps = ["Datos requeridos", "Cálculos", "Intereses", "Resultados"];
const { formId, formField } = liquidacionFormModel;

// Función helper para calcular el monto base para intereses
// IMPORTANTE: Esta función debe coincidir EXACTAMENTE con los cálculos en resultsView.tsx groupResults()
function calculateBaseAmount(values: any): number {
	const remuneracion = parseFloat(values.remuneracion) || 0;
	const otrasSumas = parseFloat(values.otrasSumas) || 0;
	const diasNoTrabajados = parseInt(values.dias) || 0;

	let totalLiquidacion = 0;
	const liquidacionSeleccionada = values.liquidacion || [];

	// Preaviso - 1 mes de remuneración
	if (liquidacionSeleccionada.includes("preaviso")) {
		totalLiquidacion += remuneracion;
	}

	// Integración mes - 1 mes de remuneración
	if (liquidacionSeleccionada.includes("integracionMes")) {
		totalLiquidacion += remuneracion;
	}

	// SAC proporcional - remuneración / 12
	if (liquidacionSeleccionada.includes("sacProp")) {
		totalLiquidacion += remuneracion / 12;
	}

	// SAC sobre preaviso - remuneración / 12
	if (liquidacionSeleccionada.includes("sacPreaviso")) {
		totalLiquidacion += remuneracion / 12;
	}

	// Días trabajados - (remuneración / 30) * (30 - días no trabajados)
	if (liquidacionSeleccionada.includes("diasTrabajados")) {
		totalLiquidacion += (remuneracion / 30) * (30 - diasNoTrabajados);
	}

	// Vacaciones - remuneración / 12
	if (liquidacionSeleccionada.includes("vacaciones")) {
		totalLiquidacion += remuneracion / 12;
	}

	return totalLiquidacion + otrasSumas;
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

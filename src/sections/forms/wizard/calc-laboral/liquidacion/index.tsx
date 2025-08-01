import { useState } from "react";

// material-ui
import { Button, Step, Stepper, StepLabel, Stack } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
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

function getStepContent(step: number, values: any, handleReset: () => void, folderId?: string, folderName?: string) {
	switch (step) {
		case 0:
			return <FirstForm formField={formField} />;
		case 1:
			return <SecondForm formField={formField} />;
		case 2:
			return <ThirdForm formField={formField} />;
		case 3:
			return <ResultsView values={values} onReset={handleReset} folderId={folderId} folderName={folderName} />;
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
		<MainCard title="Liquidación Final">
			<Stepper activeStep={activeStep} sx={{ pt: 3, pb: 5 }}>
				{steps.map((label) => (
					<Step key={label}>
						<StepLabel>{label}</StepLabel>
					</Step>
				))}
			</Stepper>
			<Formik initialValues={initialValues} validationSchema={currentValidationSchema} onSubmit={_handleSubmit}>
				{({ isSubmitting, values, resetForm }) => (
					<Form id={formId}>
						{getStepContent(activeStep, values, createHandleReset(resetForm), folder?._id, folder?.folderName)}
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
		</MainCard>
	);
};

export default BasicWizard;

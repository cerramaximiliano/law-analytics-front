import { useState } from "react";

// material-ui
import { Button, Step, Stepper, StepLabel, Stack, Typography } from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import AnimateButton from "components/@extended/AnimateButton";
import FirstForm from "./first";
import FinalStep from "./final";
import despidoFormModel from "./formModel/despidoFormModel";
import initialValues from "./formModel/formInitialValues";
import validationSchema from "./formModel/validationSchema";
import { Formik, Form } from "formik";

//types
import { WizardProps } from "types/wizards";
// step options
const steps = ["Datos requeridos", "Resultados"];
const { formId, formField } = despidoFormModel;

function getStepContent(step: number, values: any) {
	switch (step) {
		case 0:
			return <FirstForm formField={formField} />;
		case 1:
			return <FinalStep formField={formField} values={values} />;
		default:
			throw new Error("Unknown step");
	}
}

// ==============================|| FORMS WIZARD - BASIC ||============================== //

const BasicWizard: React.FC<WizardProps> = ({ folder }) => {
	console.log(folder);
	const [activeStep, setActiveStep] = useState(0);
	const currentValidationSchema = validationSchema[activeStep];
	const isLastStep = activeStep === steps.length - 1;
	const handleBack = () => {
		setActiveStep(activeStep - 1);
	};

	function _sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}
	async function _submitForm(values: any, actions: any) {
		await _sleep(1000);
		alert(JSON.stringify(values, null, 2));
		actions.setSubmitting(false);
		setActiveStep(activeStep + 1);
	}

	function _handleSubmit(values: any, actions: any) {
		console.log("submit", values, actions);
		if (isLastStep) {
			_submitForm(values, actions);
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

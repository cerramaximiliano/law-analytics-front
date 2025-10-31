import React from "react";
import { useState } from "react";

// material-ui
import { Button, Stack, Box, Typography } from "@mui/material";

// project-imports
import AnimateButton from "components/@extended/AnimateButton";
import FirstForm from "./first";
import SecondForm from "./second";
import Review from "./final";
import compensacionFormModel from "./formModel/compensacionFormModel";

import initialValues from "./formModel/formInitialValues";
import validationSchema from "./formModel/validationSchema";
import { Formik, Form } from "formik";

//types
import { WizardProps } from "types/wizards";

// step options
const steps = ["Datos requeridos", "Datos opcionales", "Resultados"];
const { formId, formField } = compensacionFormModel;

function getStepContent(step: number, values: any, folder?: any, onFolderChange?: (folderId: string | null) => void) {
	switch (step) {
		case 0:
			return <FirstForm formField={formField} folder={folder} onFolderChange={onFolderChange} />;
		case 1:
			return <SecondForm formField={formField} />;
		case 2:
			return <Review formField={formField} values={values} />;
		default:
			throw new Error("Unknown step");
	}
}

// ==============================|| FORMS WIZARD - BASIC ||============================== //

const CompensacionWizard: React.FC<WizardProps> = ({ folder, onFolderChange }) => {
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
			</>
		</Box>
	);
};

export default CompensacionWizard;

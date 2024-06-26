import { useState, useCallback } from "react";

// material-ui
import { Tooltip, IconButton, Grid, Button, Step, Stepper, StepLabel, Stack, Typography, Zoom } from "@mui/material";
import LoadingButton from "components/@extended/LoadingButton";

// project-imports
import MainCard from "components/MainCard";
import AnimateButton from "components/@extended/AnimateButton";
import FirstForm from "./first";
import Review from "./final";
import interesesFormModel from "./formModel/interesesFormModel";

import initialValues from "./formModel/formInitialValues";
import validationSchema from "./formModel/validationSchema";
import { Formik, Form } from "formik";
import { Copy, Printer, Send } from "iconsax-react";
import { CopyToClipboard } from "react-copy-to-clipboard";
import { enqueueSnackbar } from "notistack";

// step options
const steps = ["Datos requeridos", "Resultados"];
const { formId, formField } = interesesFormModel;

function getStepContent(step: number, values: any) {
	switch (step) {
		case 0:
			return <FirstForm formField={formField} />;
		case 1:
			return <Review formField={formField} values={values} />;
		default:
			throw new Error("Unknown step");
	}
}

// ==============================|| FORMS WIZARD - BASIC ||============================== //

const CompensacionWizard = () => {
	const [activeStep, setActiveStep] = useState(0);
	const currentValidationSchema = validationSchema[activeStep];
	const isLastStep = activeStep === steps.length - 1;
	const [text, setText] = useState("");
	const [isSaving, setIsSaving] = useState(false); // Cambiado a false para el estado inicial

	const handleBack = () => {
		setActiveStep(activeStep - 1);
	};

	function _sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async function _submitForm(values: any, actions: any) {
		await _sleep(1000);
		console.log(values);
		setText(values);
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

	const _handleSave = useCallback(async (values: any) => {
		setIsSaving(true);
		console.log("Guardar valores:", values);
		// Aquí puedes agregar la lógica para guardar los valores
		await _sleep(2000); // Simula el tiempo de guardar los valores
		setIsSaving(false);
	}, []);

	return (
		<MainCard title="Liquidación de Intereses">
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
						<Stack direction={"row"} justifyContent={"space-between"}>
							<Typography variant="h5" gutterBottom>
								Resultados
							</Typography>
							<Grid container direction={"row"} justifyContent={"end"}>
								<CopyToClipboard
									text={JSON.stringify(text)}
									onCopy={() => {
										console.log(true);
										enqueueSnackbar("Copiado correctamente", {
											variant: "success",
											anchorOrigin: {
												vertical: "bottom",
												horizontal: "right",
											},
											TransitionComponent: Zoom,
											autoHideDuration: 3000,
										});
									}}
								>
									<Tooltip title={"Copiar"}>
										<IconButton>
											<Copy />
										</IconButton>
									</Tooltip>
								</CopyToClipboard>
								<Tooltip title={"Enviar"}>
									<IconButton>
										<Send />
									</IconButton>
								</Tooltip>
								<Tooltip title={"Imprimir"}>
									<IconButton>
										<Printer />
									</IconButton>
								</Tooltip>
							</Grid>
						</Stack>

						<Typography variant="subtitle1">
							Your order number is #2001539. We have emailed your order confirmation, and will send you an update when your order has
							shipped.
						</Typography>

						<Stack direction={"row"} justifyContent="flex-end">
							<AnimateButton>
								<Button variant="contained" color="error" onClick={() => setActiveStep(0)} sx={{ my: 3, ml: 1 }}>
									Nuevo Cálculo
								</Button>
							</AnimateButton>
							<AnimateButton>
								<LoadingButton
									loading={isSaving}
									variant="contained"
									color="primary"
									onClick={() => _handleSave(text)}
									sx={{ my: 3, ml: 1 }}
								>
									Guardar
								</LoadingButton>
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

export default CompensacionWizard;

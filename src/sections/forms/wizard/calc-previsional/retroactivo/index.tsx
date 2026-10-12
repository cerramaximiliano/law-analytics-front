import React, { useState } from "react";

// material-ui
import { Box, Button, Stack, Typography, Zoom } from "@mui/material";

// third-party
import { enqueueSnackbar } from "notistack";

// project-imports
import AnimateButton from "components/@extended/AnimateButton";
import { Formik, Form } from "formik";
import { armarInputRetroactivo, calcularRetroactivo, RetroactivoInput, RetroactivoResultado } from "services/previsionalService";

import previsionalFormModel from "./formModel/previsionalFormModel";
import formInitialValues from "./formModel/formInitialValues";
import validationSchema from "./formModel/validationSchema";

import FirstForm from "./first";
import SecondForm from "./second";
import ThirdForm from "./third";
import FourthForm from "./fourth";
import FifthForm from "./fifth";
import ResultadoCalculo from "./components/ResultadoCalculo";

const steps = ["Datos del expediente", "Haberes", "Movilidad", "Topes", "Intereses"];
const { formId, formField } = previsionalFormModel;

// ==============================|| PREVISIONAL RETROACTIVO WIZARD ||============================== //

interface PrevisionalRetroactivoWizardProps {
	folder?: any;
	onFolderChange?: (folderId: string | null) => void;
}

function _renderStepContent(step: number, formField: any, folder?: any, onFolderChange?: (folderId: string | null) => void) {
	switch (step) {
		case 0:
			return <FirstForm formField={formField} folder={folder} onFolderChange={onFolderChange} />;
		case 1:
			return <SecondForm formField={formField} />;
		case 2:
			return <ThirdForm formField={formField} />;
		case 3:
			return <FourthForm formField={formField} />;
		case 4:
			return <FifthForm formField={formField} />;
		default:
			return null;
	}
}

const PrevisionalRetroactivoWizard = ({ folder, onFolderChange }: PrevisionalRetroactivoWizardProps) => {
	const [activeStep, setActiveStep] = useState(0);
	const [calculo, setCalculo] = useState<{ resultado: RetroactivoResultado; input: RetroactivoInput; values: any } | null>(null);
	const [valoresPrevios, setValoresPrevios] = useState<any>(null);

	const isLastStep = activeStep === steps.length - 1;
	const currentValidationSchema = validationSchema[activeStep];

	const handleBack = () => {
		setActiveStep((prev) => prev - 1);
	};

	const handleReset = () => {
		setActiveStep(0);
		setCalculo(null);
		setValoresPrevios(null);
	};

	async function _handleSubmit(values: any, actions: any) {
		if (!isLastStep) {
			setActiveStep((prev) => prev + 1);
			actions.setTouched({});
			actions.setSubmitting(false);
			return;
		}
		try {
			const input = armarInputRetroactivo(values);
			const resultado = await calcularRetroactivo(input);
			setValoresPrevios(values);
			setCalculo({ resultado, input, values });
		} catch (error: any) {
			const mensaje = error?.response?.data?.mensaje || error?.mensaje || error?.message || "No se pudo calcular el retroactivo";
			enqueueSnackbar(mensaje, {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
				TransitionComponent: Zoom,
				autoHideDuration: 6000,
			});
		} finally {
			actions.setSubmitting(false);
		}
	}

	if (calculo) {
		return (
			<ResultadoCalculo
				resultado={calculo.resultado}
				input={calculo.input}
				values={calculo.values}
				onModificar={() => setCalculo(null)}
				onNuevoCalculo={handleReset}
			/>
		);
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

			<Formik
				initialValues={valoresPrevios || formInitialValues}
				validationSchema={currentValidationSchema}
				onSubmit={_handleSubmit}
				validateOnChange={false}
				validateOnBlur={true}
			>
				{({ isSubmitting, values, setValues }) => (
					<Form id={formId}>
						{_renderStepContent(activeStep, formField, folder, onFolderChange)}

						<Stack direction="row" justifyContent={activeStep !== 0 ? "space-between" : "flex-end"} alignItems="center">
							{activeStep !== 0 && (
								<Button onClick={handleBack} sx={{ my: 3, ml: 1 }} disabled={isSubmitting}>
									Atrás
								</Button>
							)}
							<Stack direction="row" spacing={1} alignItems="center">
								<AnimateButton>
									<Button disabled={isSubmitting} variant="contained" type="submit" sx={{ my: 3, ml: 1 }}>
										{isLastStep ? "Calcular" : "Siguiente"}
									</Button>
								</AnimateButton>
							</Stack>
						</Stack>
					</Form>
				)}
			</Formik>
		</Box>
	);
};

export default PrevisionalRetroactivoWizard;

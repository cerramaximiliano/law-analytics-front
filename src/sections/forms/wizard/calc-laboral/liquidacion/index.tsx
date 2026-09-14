import React from "react";
import { useState } from "react";

// material-ui
import { Button, Stack, Box, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { ArrowLeft2, ArrowRight2, TickCircle } from "iconsax-react";

// project-imports
import AnimateButton from "components/@extended/AnimateButton";
import { BRAND_BLUE } from "themes/dashboardTokens";
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

	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const submitButtonSx = {
		minWidth: 110,
		textTransform: "none" as const,
		bgcolor: BRAND_BLUE,
		color: "#fff",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		boxShadow: "none",
		transition: "background-color 0.15s ease",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
		"&.Mui-disabled": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.24 : 0.4),
			color: alpha("#fff", 0.9),
		},
	};

	const ghostButtonSx = {
		minWidth: 90,
		textTransform: "none" as const,
		color: "text.secondary",
		fontWeight: 500,
		"&:hover": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.06),
			color: BRAND_BLUE,
		},
	};

	return (
		<Box sx={{ width: "100%" }}>
			{/* Progress Steps brand-aware */}
			<Stack spacing={1} sx={{ pb: 3.5 }}>
				<Stack direction="row" spacing={1.25}>
					{steps.map((label, index) => {
						const isActive = index <= activeStep;
						return (
							<Box key={label} sx={{ width: "100%" }}>
								<Box
									sx={{
										height: 3,
										bgcolor: isActive ? BRAND_BLUE : alpha(theme.palette.text.primary, isDark ? 0.12 : 0.08),
										borderRadius: 1,
										transition: "background-color 0.3s ease",
									}}
								/>
							</Box>
						);
					})}
				</Stack>
				<Stack direction="row" spacing={1.25}>
					{steps.map((label, index) => {
						const isCompleted = index < activeStep;
						const isCurrent = index === activeStep;
						return (
							<Stack key={label} direction="row" alignItems="center" spacing={0.5} sx={{ width: "100%" }}>
								{isCompleted ? (
									<TickCircle size={12} variant="Bulk" color={BRAND_BLUE} />
								) : (
									<Typography
										sx={{
											fontSize: "0.6rem",
											fontWeight: 600,
											letterSpacing: "0.08em",
											color: isCurrent ? BRAND_BLUE : "text.secondary",
											fontVariantNumeric: "tabular-nums",
											opacity: isCurrent ? 1 : 0.7,
										}}
									>
										{`0${index + 1}`.slice(-2)}
									</Typography>
								)}
								<Typography
									sx={{
										fontSize: "0.7rem",
										fontWeight: isCurrent ? 600 : 500,
										letterSpacing: "0.04em",
										textTransform: "uppercase",
										color: isCurrent || isCompleted ? BRAND_BLUE : "text.secondary",
										transition: "color 0.3s ease",
									}}
								>
									{label}
								</Typography>
							</Stack>
						);
					})}
				</Stack>
			</Stack>
			<Formik initialValues={initialValues} validationSchema={currentValidationSchema} onSubmit={_handleSubmit}>
				{({ isSubmitting, values, resetForm }) => (
					<Form id={formId}>
						{getStepContent(activeStep, values, createHandleReset(resetForm), folder?._id, folder?.folderName, folder, onFolderChange)}
						{!isLastStep && (
							<Stack direction="row" justifyContent={activeStep !== 0 ? "space-between" : "flex-end"} sx={{ mt: 3 }}>
								{activeStep !== 0 && (
									<Button onClick={handleBack} startIcon={<ArrowLeft2 size={16} />} sx={ghostButtonSx}>
										Atrás
									</Button>
								)}
								<AnimateButton>
									<Button
										disabled={isSubmitting}
										variant="contained"
										type="submit"
										endIcon={activeStep !== steps.length - 2 ? <ArrowRight2 size={16} /> : undefined}
										sx={submitButtonSx}
									>
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

import { useState, useEffect } from "react";

// material-ui
import { Button, Step, Stepper, StepLabel, Stack, Zoom } from "@mui/material";
//import LoadingButton from "components/@extended/LoadingButton";

// project-imports
import MainCard from "components/MainCard";
import AnimateButton from "components/@extended/AnimateButton";
import FirstForm from "./first";
import Review from "./final";
import ResultsView from "./resultsView";

import interesesFormModel from "./formModel/interesesFormModel";

import initialValues from "./formModel/formInitialValues";
//import validationSchema from "./formModel/validationSchema";
import { Formik, Form } from "formik";
//import { Copy, Printer, Send } from "iconsax-react";
//import { CopyToClipboard } from "react-copy-to-clipboard";
import { enqueueSnackbar } from "notistack";
import axios from "axios";
import esquemaInicial, { crearEsquemaValidacion } from "./formModel/validationSchema";
import { hayRangosFechas } from "./formModel/tasasFechasStore";

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
	const isLastStep = activeStep === steps.length - 1;
	const [tasasData, setTasasData] = useState(null);
	const [validationSchema, setValidationSchema] = useState(esquemaInicial);
	const currentValidationSchema = validationSchema[activeStep];
	const [hayRangos, setHayRangos] = useState(false);

	const [calculationResult, setCalculationResult] = useState<any>(null);

	const handleBack = () => {
		setActiveStep(activeStep - 1);
	};
	const handleReset = () => {
		setActiveStep(0);
		setCalculationResult(null);
	};

	useEffect(() => {
		const checkRangos = () => {
			const tieneRangos = hayRangosFechas();
			if (tieneRangos !== hayRangos) {
				setHayRangos(tieneRangos);
			}
		};

		// Verificar inmediatamente
		checkRangos();

		// Revisar periódicamente (cada segundo)
		const interval = setInterval(checkRangos, 1000);

		return () => clearInterval(interval);
	}, [hayRangos]);

	useEffect(() => {
		if (hayRangos) {
			console.log("Actualizando esquema de validación con rangos de fechas");
			setValidationSchema(crearEsquemaValidacion());
		}
	}, [hayRangos]);

	function _sleep(ms: number) {
		return new Promise((resolve) => setTimeout(resolve, ms));
	}

	async function _submitForm(values: any, actions: any) {
		try {
			const fechaDesde = values.fechaInicial;
			const fechaHasta = values.fechaFinal;
			const campo = values.tasa;
			const completo = true;

			const url = `${process.env.REACT_APP_BASE_URL}/api/tasas/consulta?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}&campo=${campo}&completo=${completo}`;

			const response = await axios.get(url, {
				withCredentials: true,
			});

			const tasasResult = response.data;
			console.log("Resultados de tasas:", tasasResult);
			setTasasData(tasasResult);

			let interesTotal = 0;
			if (Array.isArray(tasasResult)) {
				interesTotal = tasasResult.reduce((sum, item) => {
					return sum + (typeof item.interes === "number" ? item.interes : 0);
				}, 0);
			}

			await _sleep(1000);
			//console.log(values);

			const finalResult = {
				...values,
				tasasResult,
				interesTotal,
				capitalActualizado: parseFloat(values.capital || 0) + interesTotal,
			};

			console.log(tasasData);

			setCalculationResult(finalResult);
			actions.setSubmitting(false);

			actions.setSubmitting(false);
			setActiveStep(activeStep + 1);
		} catch (error) {
			console.error("Error al consultar tasas:", error);
			enqueueSnackbar("Error al consultar tasas. Por favor intente nuevamente.", {
				variant: "error",
				anchorOrigin: {
					vertical: "bottom",
					horizontal: "right",
				},
				TransitionComponent: Zoom,
				autoHideDuration: 5000,
			});

			actions.setSubmitting(false);
		}
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
					<ResultsView values={calculationResult} formField={formField} onReset={handleReset} />
				) : (
					<Formik
						initialValues={initialValues}
						validationSchema={currentValidationSchema}
						onSubmit={_handleSubmit}
						validateOnChange={true}
						validateOnBlur={true}
					>
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

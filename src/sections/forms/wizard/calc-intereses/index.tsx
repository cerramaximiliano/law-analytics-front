import React from "react";
import { useState, useEffect } from "react";

// material-ui
import { Button, Stack, Box, Typography, Zoom } from "@mui/material";
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

function getStepContent(step: number, values: any, folder: any, onFolderChange?: (folderId: string | null) => void) {
	switch (step) {
		case 0:
			return <FirstForm formField={formField} folder={folder} onFolderChange={onFolderChange} />;
		case 1:
			return <Review formField={formField} values={values} />;
		default:
			throw new Error("Unknown step");
	}
}

// ==============================|| FORMS WIZARD - BASIC ||============================== //

interface CompensacionWizardProps {
	folder?: any;
	onFolderChange?: (folderId: string | null) => void;
}

const CompensacionWizard = ({ folder, onFolderChange }: CompensacionWizardProps) => {
	const [activeStep, setActiveStep] = useState(0);
	const isLastStep = activeStep === steps.length - 1;
	//const [tasasData, setTasasData] = useState(null);
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
			setHayRangos((prevHayRangos) => {
				if (tieneRangos !== prevHayRangos) {
					return tieneRangos;
				}
				return prevHayRangos;
			});
		};

		// Verificar inmediatamente
		checkRangos();

		// Revisar periódicamente (cada segundo)
		const interval = setInterval(checkRangos, 1000);

		return () => clearInterval(interval);
	}, []);

	useEffect(() => {
		if (hayRangos) {
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
			const calcular = true;

			const url = `${process.env.REACT_APP_BASE_URL}/api/tasas/consulta?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}&campo=${campo}&calcular=${calcular}`;

			const response = await axios.get(url, {
				withCredentials: true,
			});

			const tasasResult = response.data;

			//setTasasData(tasasResult);

			let interesTotal = 0;
			if (Array.isArray(tasasResult)) {
				interesTotal = tasasResult.reduce((sum, item) => {
					return sum + (typeof item.interes === "number" ? item.interes : 0);
				}, 0);
			}

			await _sleep(1000);

			const finalResult = {
				...values,
				tasasResult,
				interesTotal,
				capitalActualizado: parseFloat(values.capital || 0) + interesTotal,
				folderId: values.folderId,
				folderName: values.folderName,
			};

			setCalculationResult(finalResult);
			actions.setSubmitting(false);

			actions.setSubmitting(false);
			setActiveStep(activeStep + 1);
		} catch (error) {
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
			<Stack direction="row" spacing={1.5} sx={{ pt: 3, pb: 3 }}>
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
					<ResultsView
						values={calculationResult}
						formField={formField}
						onReset={handleReset}
						folderId={calculationResult?.folderId}
						folderName={calculationResult?.folderName}
					/>
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
		</MainCard>
	);
};

export default CompensacionWizard;

import React, { useState } from "react";

// material-ui
import { Box, Button, Stack, Typography, Zoom } from "@mui/material";

// third-party
import { enqueueSnackbar } from "notistack";

// project-imports
import AnimateButton from "components/@extended/AnimateButton";
import { Formik, Form } from "formik";
import { useSelector, dispatch } from "store";
import { addCalculator } from "store/reducers/calculator";

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
	const [savedCalculator, setSavedCalculator] = useState<any>(null);
	const [calculoParams, setCalculoParams] = useState<{
		haberPagadoAnses: number;
		haberPagadoAl: string;
		fechaHastaReclamado: string;
	} | null>(null);

	const userId = useSelector((state) => state.auth.user?._id);

	const isLastStep = activeStep === steps.length - 1;
	const currentValidationSchema = validationSchema[activeStep];

	const handleBack = () => {
		setActiveStep((prev) => prev - 1);
	};

	const handleReset = () => {
		setActiveStep(0);
		setSavedCalculator(null);
		setCalculoParams(null);
	};

	async function _handleSubmit(values: any, actions: any) {
		if (!isLastStep) {
			setActiveStep((prev) => prev + 1);
			actions.setTouched({});
			actions.setSubmitting(false);
			return;
		}

		try {
			// Normalizar reclamante si vino del modo "causa"
			const reclamante = values.reclamante?.startsWith("__CAUSA_VINCULADA__")
				? values.folderName || ""
				: values.reclamante;

			// Todos los datos específicos se guardan en variables
			const variables = {
				reclamante,
				expedienteAdmin: values.expedienteAdmin || null,
				prestacion: values.prestacion || null,
				obraSocial: values.obraSocial || null,
				fechaAdquisicion: values.fechaAdquisicion || null,
				fechaAlta: values.fechaAlta || null,
				haberPagadoAnses: values.haberPagadoAnses || null,
				haberPagadoAl: values.haberPagadoAl || null,
				monedaHaberPagado: values.monedaHaberPagado,
				tieneReajuste: values.tieneReajuste,
				fechaAltaReajuste: values.tieneReajuste ? values.fechaAltaReajuste || null : null,
				importeReajuste: values.tieneReajuste ? values.importeReajuste || null : null,
				monedaReajuste: values.monedaReajuste,
				haberReclamado: values.haberReclamado || null,
				monedaReclamado: values.monedaReclamado,
				fechaDesdeReclamado: values.fechaDesdeReclamado || null,
				fechaHastaReclamado: values.fechaHastaReclamado || null,
				fechaCierre: values.fechaCierre || null,
				criteriosMovilidad: values.criteriosMovilidad || [],
				tipoTope: values.tipoTope || null,
				topeDesde: values.tipoTope && values.tipoTope !== "no" ? values.topeDesde || null : null,
				topeHasta: values.tipoTope && values.tipoTope !== "no" ? values.topeHasta || null : null,
				tasaInteresSentencia: values.tasaInteresSentencia || null,
			};

			const result = await dispatch(
				addCalculator({
					userId,
					folderId: values.folderId || null,
					folderName: values.folderName || null,
					type: "Calculado",
					classType: "previsional",
					subClassType: values.tasaInteresSentencia || "retroactivo",
					// amount usa haberReclamado como importe de referencia
					amount: Number(values.haberReclamado) || 0,
					user: reclamante,
					variables,
				} as any),
			);

			if (result.success) {
				setSavedCalculator(result.calculator);
				setCalculoParams({
					haberPagadoAnses: Number(values.haberPagadoAnses),
					haberPagadoAl: values.haberPagadoAl,
					fechaHastaReclamado: values.fechaHastaReclamado,
				});
				enqueueSnackbar("Cálculo previsional guardado correctamente", {
					variant: "success",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 4000,
				});
			} else {
				enqueueSnackbar(result.error || "Error al guardar el cálculo. Por favor intente nuevamente.", {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 5000,
				});
			}
		} finally {
			actions.setSubmitting(false);
		}
	}

	if (savedCalculator && calculoParams) {
		return (
			<ResultadoCalculo
				savedCalculator={savedCalculator}
				calculoParams={calculoParams}
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
				initialValues={formInitialValues}
				validationSchema={currentValidationSchema}
				onSubmit={_handleSubmit}
				validateOnChange={false}
				validateOnBlur={true}
			>
				{({ isSubmitting }) => (
					<Form id={formId}>
						{_renderStepContent(activeStep, formField, folder, onFolderChange)}

						<Stack direction="row" justifyContent={activeStep !== 0 ? "space-between" : "flex-end"}>
							{activeStep !== 0 && (
								<Button onClick={handleBack} sx={{ my: 3, ml: 1 }} disabled={isSubmitting}>
									Atrás
								</Button>
							)}
							<AnimateButton>
								<Button disabled={isSubmitting} variant="contained" type="submit" sx={{ my: 3, ml: 1 }}>
									{isLastStep ? "Guardar" : "Siguiente"}
								</Button>
							</AnimateButton>
						</Stack>
					</Form>
				)}
			</Formik>
		</Box>
	);
};

export default PrevisionalRetroactivoWizard;

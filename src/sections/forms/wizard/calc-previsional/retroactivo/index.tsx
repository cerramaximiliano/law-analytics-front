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

// ==============================|| DEV PRESETS ||============================== //
// Cada preset llena TODOS los steps con datos de un caso real (PDF de BlueCorp) para
// poder reproducir y comparar resultados rápidamente. Solo visibles en modo desarrollo.
const pickTasa = (rates: { value: string }[], preferida: string) =>
	rates.find((r) => r.value === preferida)?.value ?? rates[0]?.value ?? preferida;

const DEV_PRESETS: Record<string, (rates: { value: string }[]) => Record<string, any>> = {
	// CASSARET HORACIO OSCAR — expte. 024-20-085228634-490-0000001.
	// Resultado esperado: capital 20.524.941,18 + intereses 35.593.085,18 = 56.118.026,36 al 31/03/2026.
	CASSARET: (rates) => ({
		reclamante: "Cassaret Horacio Oscar",
		expedienteAdmin: "024-20-085228634-490-0000001",
		prestacion: "jubilacion_ordinaria",
		obraSocial: "inssjyp_pami",
		fechaAdquisicion: "31/05/2008",
		fechaAlta: "01/2016",
		haberPagadoAnses: 6131.62,
		haberPagadoAl: "14/01/2016",
		monedaHaberPagado: "ARS",
		tieneReajuste: true,
		fechaAltaReajuste: "01/02/2026",
		importeReajuste: 1344447.81,
		monedaReajuste: "ARS",
		haberReclamado: 17317.26,
		monedaReclamado: "ARS",
		fechaDesdeReclamado: "24/08/2016",
		fechaHastaReclamado: "31/03/2026",
		fechaCierre: "31/03/2026",
		criteriosMovilidad: [{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: "24/08/2016" }],
		tipoTope: "no",
		topeDesde: "",
		topeHasta: "",
		tasaInteresSentencia: pickTasa(rates, "tasaPasivaBCRA"),
	}),
	// TROCHE ANA IRIS — expte. 024-27-110680096-974-0000001.
	// Resultado esperado: capital 8.411.418,10 + intereses 17.806.769,47 = 26.218.187,57 al 30/06/2025.
	// Caso útil para validar el piso del 82% del SMVyM (saltos en 1/2018, 10/2019, 11/2022).
	TROCHE: (rates) => ({
		reclamante: "Troche Ana Iris",
		expedienteAdmin: "024-27-110680096-974-0000001",
		prestacion: "jubilacion_ordinaria",
		obraSocial: "inssjyp_pami",
		fechaAdquisicion: "12/02/2014",
		fechaAlta: "02/2014",
		haberPagadoAnses: 2558.5,
		haberPagadoAl: "12/02/2014",
		monedaHaberPagado: "ARS",
		tieneReajuste: false,
		fechaAltaReajuste: "",
		importeReajuste: "",
		monedaReajuste: "ARS",
		haberReclamado: 6175.61,
		monedaReclamado: "ARS",
		fechaDesdeReclamado: "12/02/2014",
		fechaHastaReclamado: "30/06/2025",
		fechaCierre: "30/06/2025",
		criteriosMovilidad: [{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: "12/02/2014" }],
		tipoTope: "no",
		topeDesde: "",
		topeHasta: "",
		tasaInteresSentencia: pickTasa(rates, "tasaPasivaBCRA"),
	}),
	// TROCHE-Cortes — caso TROCHE pero aplicando el precedente "Cortes, Leonardo Evaristo".
	// Esperado: haber reajustado a Mayo 2026 = 1.599.763,47 (vs 1.029.662,33 del TROCHE estándar).
	"TROCHE-Cortes": (rates) => ({
		reclamante: "Troche Ana Iris (Cortes)",
		expedienteAdmin: "024-27-110680096-974-0000001",
		prestacion: "jubilacion_ordinaria",
		obraSocial: "inssjyp_pami",
		fechaAdquisicion: "12/02/2014",
		fechaAlta: "02/2014",
		haberPagadoAnses: 2558.5,
		haberPagadoAl: "12/02/2014",
		monedaHaberPagado: "ARS",
		tieneReajuste: false,
		fechaAltaReajuste: "",
		importeReajuste: "",
		monedaReajuste: "ARS",
		haberReclamado: 6175.61,
		monedaReclamado: "ARS",
		fechaDesdeReclamado: "12/02/2014",
		fechaHastaReclamado: "31/05/2026",
		fechaCierre: "31/05/2026",
		criteriosMovilidad: [
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: "12/02/2014" },
			{ indiceMovilidad: "recomposicion_ley_27426", fechaDesde: "01/01/2021" },
			{ indiceMovilidad: "aumento_mar_2021_sem2_2020", fechaDesde: "01/02/2021" },
			{ indiceMovilidad: "ipc_trimestral_retrasado_3m", fechaDesde: "01/04/2021" },
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: "01/04/2024" },
		],
		tipoTope: "no",
		topeDesde: "",
		topeHasta: "",
		tasaInteresSentencia: pickTasa(rates, "tasaPasivaBCRA"),
	}),
	// VATER ALBERTO EDUARDO — expte. 024-20-080338318-004-0000001 (Reajustado con todos los topes).
	// Caso útil para validar el patrón de "Recomposición por diferencias Ley 27.426" en 1/2021.
	// Esperado en haberReclamado: salto de 91.522,70 (12/2020) a 104.071,11 (1/2021) = +13,71%.
	VATER: (rates) => ({
		reclamante: "Vater Alberto Eduardo",
		expedienteAdmin: "024-20-080338318-004-0000001",
		prestacion: "jubilacion_ordinaria",
		obraSocial: "inssjyp_pami",
		fechaAdquisicion: "22/04/2014",
		fechaAlta: "06/2014",
		haberPagadoAnses: 6801.5,
		haberPagadoAl: "22/04/2014",
		monedaHaberPagado: "ARS",
		tieneReajuste: false,
		fechaAltaReajuste: "",
		importeReajuste: "",
		monedaReajuste: "ARS",
		haberReclamado: 14350.75,
		monedaReclamado: "ARS",
		fechaDesdeReclamado: "22/04/2014",
		fechaHastaReclamado: "30/04/2026",
		fechaCierre: "30/04/2026",
		criteriosMovilidad: [
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: "22/04/2014" },
			{ indiceMovilidad: "recomposicion_ley_27426", fechaDesde: "01/01/2021" },
			{ indiceMovilidad: "aumentos_generales_anses", fechaDesde: "01/02/2021" },
		],
		tipoTope: "no",
		topeDesde: "",
		topeHasta: "",
		tasaInteresSentencia: pickTasa(rates, "tasaPasivaBCRA"),
	}),
};

const PrevisionalRetroactivoWizard = ({ folder, onFolderChange }: PrevisionalRetroactivoWizardProps) => {
	const [activeStep, setActiveStep] = useState(0);
	const [savedCalculator, setSavedCalculator] = useState<any>(null);
	const [calculoParams, setCalculoParams] = useState<{
		haberPagadoAnses: number;
		haberPagadoAl: string;
		haberReclamado: number;
		fechaDesdeReclamado: string;
		fechaHastaReclamado: string;
		tieneReajuste: boolean;
		fechaAltaReajuste: string;
		importeReajuste: number | null;
		criteriosMovilidad: { indiceMovilidad: string; fechaDesde: string }[];
	} | null>(null);

	const userId = useSelector((state) => state.auth.user?._id);
	const rates = useSelector((state: any) => state.interestRates?.rates ?? []);
	const isDev = import.meta.env.DEV;

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
					haberReclamado: Number(values.haberReclamado),
					fechaDesdeReclamado: values.fechaDesdeReclamado,
					fechaHastaReclamado: values.fechaHastaReclamado,
					tieneReajuste: !!values.tieneReajuste,
					fechaAltaReajuste: values.tieneReajuste ? values.fechaAltaReajuste || "" : "",
					importeReajuste: values.tieneReajuste ? Number(values.importeReajuste) : null,
					criteriosMovilidad: Array.isArray(values.criteriosMovilidad) ? values.criteriosMovilidad : [],
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
								{isDev &&
									Object.keys(DEV_PRESETS).map((nombre) => (
										<Button
											key={nombre}
											variant="outlined"
											color="warning"
											size="small"
											sx={{ my: 3 }}
											onClick={() => {
												const patch = DEV_PRESETS[nombre](rates);
												setValues({ ...values, ...patch });
											}}
										>
											DEV: {nombre}
										</Button>
									))}
								<AnimateButton>
									<Button disabled={isSubmitting} variant="contained" type="submit" sx={{ my: 3, ml: 1 }}>
										{isLastStep ? "Guardar" : "Siguiente"}
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

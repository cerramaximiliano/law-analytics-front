import React, { useMemo, useState } from "react";

// material-ui
import { Alert, Box, Button, Stack, Typography, Zoom } from "@mui/material";

// third-party
import { enqueueSnackbar } from "notistack";

// project-imports
import AnimateButton from "components/@extended/AnimateButton";
import { Formik, Form } from "formik";
import { armarInputRetroactivo, calcularRetroactivo, RetroactivoInput, RetroactivoResultado } from "services/previsionalService";
import { trackActivity } from "utils/productAnalytics";
import { fechaCalculo } from "utils/calculatorDate";

import previsionalFormModel from "./formModel/previsionalFormModel";
import formInitialValues from "./formModel/formInitialValues";
import validationSchema from "./formModel/validationSchema";
import { valoresDesdeCalculadora } from "./formModel/valoresDesdeGuardado";

import FirstForm from "./first";
import SecondForm from "./second";
import ThirdForm from "./third";
import FourthForm from "./fourth";
import FifthForm from "./fifth";
import ResultadoCalculo, { CalculoEnEdicion } from "./components/ResultadoCalculo";
import useSubscription from "hooks/useSubscription";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";

// Feature paga (PlanConfig): el hub responde 403 con upgradeRequired si el plan no la tiene
const FEATURE = "calculoPrevisional";

const steps = ["Datos del expediente", "Haberes", "Movilidad", "Topes", "Intereses"];
const { formId, formField } = previsionalFormModel;

// ==============================|| PREVISIONAL RETROACTIVO WIZARD ||============================== //

interface PrevisionalRetroactivoWizardProps {
	folder?: any;
	onFolderChange?: (folderId: string | null) => void;
	/** Cálculo guardado (documento de `calculators`) que se reabre para editar. */
	calculadoraEnEdicion?: any | null;
	/** Descartar la edición: la página limpia `?edit=`. */
	onSalirEdicion?: () => void;
	/** Ya se guardó (actualizado o como nuevo): la página limpia `?edit=` y vuelve a Guardados. */
	onGuardado?: (modo: "actualizado" | "nuevo") => void;
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

const PrevisionalRetroactivoWizard = ({
	folder,
	onFolderChange,
	calculadoraEnEdicion,
	onSalirEdicion,
	onGuardado,
}: PrevisionalRetroactivoWizardProps) => {
	const [activeStep, setActiveStep] = useState(0);
	const [calculo, setCalculo] = useState<{ resultado: RetroactivoResultado; input: RetroactivoInput; values: any } | null>(null);
	const [valoresPrevios, setValoresPrevios] = useState<any>(null);
	const [mejorarPlan, setMejorarPlan] = useState(false);
	const { subscription, hasFeatureLocal } = useSubscription();
	// Sin suscripción cargada todavía no se bloquea: decide el hub
	const sinAcceso = !!subscription && !hasFeatureLocal(FEATURE);

	// Edición de un guardado: valores iniciales desde `variables.formulario` (o `input` como fallback).
	// Si el guardado es anterior y no trae ninguno de los dos, se avisa y se sigue con el formulario vacío.
	const valoresEdicion = useMemo(
		() => (calculadoraEnEdicion ? valoresDesdeCalculadora(calculadoraEnEdicion) : null),
		[calculadoraEnEdicion],
	);
	const enEdicion: CalculoEnEdicion | null =
		calculadoraEnEdicion && valoresEdicion
			? {
					id: calculadoraEnEdicion._id,
					fecha: calculadoraEnEdicion.date,
					titular: calculadoraEnEdicion.user || calculadoraEnEdicion.variables?.datosExpediente?.reclamante || "",
			  }
			: null;

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
		if (sinAcceso) {
			setMejorarPlan(true);
			actions.setSubmitting(false);
			return;
		}
		try {
			const input = armarInputRetroactivo(values);
			const resultado = await calcularRetroactivo(input);
			trackActivity("calculator_run", { type: "previsional", mode: enEdicion ? "edit" : "new" });
			setValoresPrevios(values);
			setCalculo({ resultado, input, values });
		} catch (error: any) {
			if (error?.response?.status === 403 && error?.response?.data?.upgradeRequired) {
				setMejorarPlan(true);
				return;
			}
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
				onNuevoCalculo={() => {
					handleReset();
					onSalirEdicion?.();
				}}
				enEdicion={enEdicion}
				onGuardado={onGuardado}
			/>
		);
	}

	return (
		<Box sx={{ width: "100%" }}>
			{enEdicion && (
				<Alert
					severity="warning"
					sx={{ mb: 3 }}
					action={
						<Button color="inherit" size="small" onClick={onSalirEdicion} sx={{ textTransform: "none" }}>
							Descartar edición
						</Button>
					}
				>
					Estás editando el cálculo guardado del {enEdicion.fecha ? fechaCalculo(enEdicion.fecha) : "—"}
					{enEdicion.titular ? ` (${enEdicion.titular})` : ""}. Los cambios no se aplican hasta que guardes.
					{calculadoraEnEdicion?.keepUpdated
						? " Tiene la actualización automática activa: al guardar con otra fecha de cierre, se volverá a extender al último mes publicado. Si cargás los percibidos mes a mes, se desactiva."
						: ""}
				</Alert>
			)}
			{calculadoraEnEdicion && !valoresEdicion && (
				<Alert
					severity="info"
					sx={{ mb: 3 }}
					action={
						<Button color="inherit" size="small" onClick={onSalirEdicion} sx={{ textTransform: "none" }}>
							Entendido
						</Button>
					}
				>
					Este cálculo es anterior y no se puede reabrir para editar. Podés cargar uno nuevo.
				</Alert>
			)}
			{sinAcceso && (
				<Alert severity="info" sx={{ mb: 3 }}>
					El cálculo de retroactivos previsionales está disponible en los planes Estándar, Pro y Premium. Podés cargar los datos; para
					calcular, mejorá tu plan.
				</Alert>
			)}
			<LimitErrorModal
				open={mejorarPlan}
				onClose={() => setMejorarPlan(false)}
				message="Para calcular retroactivos previsionales necesitás un plan pago."
				featureInfo={{
					feature: "Retroactivo previsional",
					plan: subscription?.plan || "free",
					availableIn: ["standard", "pro", "premium"],
				}}
				upgradeRequired={true}
			/>
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
				initialValues={valoresPrevios || valoresEdicion || formInitialValues}
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

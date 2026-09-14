import React from "react";
import { useState, useEffect } from "react";

// material-ui
import { Button, Stack, Box, Typography, Zoom } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { TickCircle } from "iconsax-react";

// project-imports
import AnimateButton from "components/@extended/AnimateButton";
import { BRAND_BLUE } from "themes/dashboardTokens";
import FirstForm from "./first";
import ResultsView from "./resultsView";
import { getEffectiveInterest } from "components/calculator/InterestSegmentsManager";

import interesesFormModel from "./formModel/interesesFormModel";

import initialValues from "./formModel/formInitialValues";
import { Formik, Form } from "formik";
import { enqueueSnackbar } from "notistack";
import axios from "axios";
import esquemaInicial, { crearEsquemaValidacion } from "./formModel/validationSchema";
import { hayRangosFechas } from "./formModel/tasasFechasStore";

// step options
const steps = ["Datos requeridos", "Resultados"];
const { formId, formField } = interesesFormModel;

// ==============================|| FORMS WIZARD - BASIC ||============================== //

interface CompensacionWizardProps {
	folder?: any;
	onFolderChange?: (folderId: string | null) => void;
}

const CompensacionWizard = ({ folder, onFolderChange }: CompensacionWizardProps) => {
	const [showResults, setShowResults] = useState(false);
	const [validationSchema, setValidationSchema] = useState(esquemaInicial);
	const currentValidationSchema = validationSchema[0]; // Solo hay un paso
	const [hayRangos, setHayRangos] = useState(false);

	const [calculationResult, setCalculationResult] = useState<any>(null);

	const handleReset = () => {
		setShowResults(false);
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
			const segments = values.segments || [];

			// Si hay tramos calculados por el InterestSegmentsManager
			if (segments.length > 0) {
				// Usar el interés efectivo de cada tramo: aplica clamp por comparativa CER
				// (techo/piso Ley 27.802) si está activa. Sin comparativa, devuelve el crudo.
				const interesTotal = segments.reduce((sum: number, seg: any) => sum + getEffectiveInterest(seg), 0);
				const capitalBase = parseFloat(values.capital || 0);
				const lastSeg = segments[segments.length - 1];
				const lastEffective = lastSeg ? getEffectiveInterest(lastSeg) : 0;

				// Si hay capitalización, el monto final es el capital del último tramo + su interés efectivo
				// Si no hay capitalización, es el capital original + todos los intereses efectivos
				const capitalActualizado = values.capitalizeInterest
					? (lastSeg?.capital || capitalBase) + lastEffective
					: capitalBase + interesTotal;

				await _sleep(500);

				const finalResult = {
					...values,
					segments,
					interesTotal,
					capitalActualizado,
					folderId: values.folderId,
					folderName: values.folderName,
					capitalizeInterest: values.capitalizeInterest || false,
					// Para compatibilidad con la vista de resultados existente
					tasasResult: {
						resultado: interesTotal / capitalBase,
						detalleCalculo: {
							tipoIndice: "multipleSegments",
							formula: "Suma de intereses por tramos",
							cantidadTramos: segments.length,
						},
					},
				};

				setCalculationResult(finalResult);
				actions.setSubmitting(false);
				setShowResults(true);
			} else {
				// Fallback al método anterior para compatibilidad
				const fechaDesde = values.fechaInicial;
				const fechaHasta = values.fechaFinal;
				const campo = values.tasa;
				const calcular = true;

				const url = `${
					import.meta.env.VITE_BASE_URL || ""
				}/api/tasas/consulta?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}&campo=${campo}&calcular=${calcular}`;

				const response = await axios.get(url, {
					withCredentials: true,
				});

				const tasasResult = response.data;

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
				setShowResults(true);
			}
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
		// Siempre ejecutar el cálculo y mostrar resultados
		_submitForm(values, actions);
	}

	// Determinar el step actual
	const activeStep = showResults ? 1 : 0;

	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const submitButtonSx = {
		minWidth: 130,
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

			{showResults ? (
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
					{({ isSubmitting, values }) => {
						const hasSegments = Array.isArray(values.segments) && values.segments.length > 0;
						return (
							<Form id={formId}>
								<FirstForm formField={formField} folder={folder} onFolderChange={onFolderChange} />
								<Stack direction="row" justifyContent="flex-end" sx={{ mt: 3 }}>
									<AnimateButton>
										<Button disabled={isSubmitting} variant="contained" type="submit" sx={submitButtonSx}>
											{hasSegments ? "Ver resultados" : "Calcular"}
										</Button>
									</AnimateButton>
								</Stack>
							</Form>
						);
					}}
				</Formik>
			)}
		</Box>
	);
};

export default CompensacionWizard;

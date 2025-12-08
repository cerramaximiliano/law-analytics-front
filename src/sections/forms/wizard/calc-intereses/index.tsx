import React from "react";
import { useState, useEffect } from "react";

// material-ui
import { Button, Stack, Box, Typography, Zoom } from "@mui/material";

// project-imports
import AnimateButton from "components/@extended/AnimateButton";
import FirstForm from "./first";
import ResultsView from "./resultsView";

import interesesFormModel from "./formModel/interesesFormModel";

import initialValues from "./formModel/formInitialValues";
import { Formik, Form } from "formik";
import { enqueueSnackbar } from "notistack";
import axios from "axios";
import esquemaInicial, { crearEsquemaValidacion } from "./formModel/validationSchema";
import { hayRangosFechas } from "./formModel/tasasFechasStore";

// step options - Solo un paso, luego resultados
const steps = ["Datos requeridos"];
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
				// Los tramos ya están calculados, solo necesitamos preparar el resultado
				const interesTotal = segments.reduce((sum: number, seg: any) => sum + (seg.interest || 0), 0);
				const capitalBase = parseFloat(values.capital || 0);

				// Si hay capitalización, el monto final es el capital del último tramo + su interés
				// Si no hay capitalización, es el capital original + todos los intereses
				const capitalActualizado = values.capitalizeInterest
					? (segments[segments.length - 1]?.capital || capitalBase) + (segments[segments.length - 1]?.interest || 0)
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

				const url = `${process.env.REACT_APP_BASE_URL}/api/tasas/consulta?fechaDesde=${fechaDesde}&fechaHasta=${fechaHasta}&campo=${campo}&calcular=${calcular}`;

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

	return (
		<Box sx={{ width: "100%" }}>
			{/* Barra de progreso simplificada */}
			<Stack direction="row" spacing={1.5} sx={{ pb: 4 }}>
				<Box sx={{ position: "relative", width: "100%" }}>
					<Box
						sx={{
							height: 3,
							bgcolor: showResults ? "success.main" : "primary.main",
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
							color: showResults ? "success.main" : "primary.main",
							transition: "color 0.3s ease",
						}}
					>
						{showResults ? "Resultados" : "Datos requeridos"}
					</Typography>
				</Box>
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
					{({ isSubmitting, values }) => (
						<Form id={formId}>
							<FirstForm formField={formField} folder={folder} onFolderChange={onFolderChange} />
							<Stack direction="row" justifyContent="flex-end">
								<AnimateButton>
									<Button disabled={isSubmitting} variant="contained" type="submit" sx={{ my: 3, ml: 1 }}>
										Calcular
									</Button>
								</AnimateButton>
							</Stack>
						</Form>
					)}
				</Formik>
			)}
		</Box>
	);
};

export default CompensacionWizard;

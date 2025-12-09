import React from "react";
import { useState, useEffect, useCallback } from "react";
import { Grid, InputLabel, Typography, Box, Switch, FormControlLabel, Paper, useTheme, Alert } from "@mui/material";
import { useFormikContext } from "formik";
import dayjs from "utils/dayjs-config";
import { useSelector, dispatch } from "store";
import { getInterestRates } from "store/reducers/interestRates";
import InterestSegmentsManager, { InterestSegment, InterestRate } from "components/calculator/InterestSegmentsManager";

interface FormField {
	aplicarIntereses: {
		name: string;
	};
	fechaInicialIntereses: {
		name: string;
	};
	fechaFinalIntereses: {
		name: string;
	};
	tasaIntereses: {
		name: string;
	};
	fechaEgreso: {
		name: string;
	};
	segmentsIntereses: {
		name: string;
	};
	capitalizeInterest: {
		name: string;
	};
}

interface ThirdFormProps {
	formField: FormField;
	calculatedAmount?: number; // Monto calculado en pasos anteriores para usar como capital
}

export default function ThirdForm(props: ThirdFormProps) {
	const {
		formField: {
			aplicarIntereses,
			fechaInicialIntereses,
			fechaFinalIntereses,
			tasaIntereses,
			fechaEgreso,
			segmentsIntereses,
			capitalizeInterest,
		},
		calculatedAmount = 0,
	} = props;

	const theme = useTheme();

	// Obtener datos del store
	const user = useSelector((state) => state.auth.user);
	const userId = user?._id;
	const { rates: tasasOpciones, isLoading: cargandoTasas, isInitialized } = useSelector((state) => state.interestRates);

	const { values, setFieldValue, setFieldError, setFieldTouched, validateForm } = useFormikContext<any>();

	// Manejar el cambio de aplicar intereses
	const handleAplicarInteresesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const checked = event.target.checked;
		setFieldValue(aplicarIntereses.name, checked);

		// Si se desactiva, limpiar los otros campos y errores de validación
		if (!checked) {
			setFieldValue(fechaInicialIntereses.name, "");
			setFieldValue(fechaFinalIntereses.name, "");
			setFieldValue(tasaIntereses.name, "");
			setFieldValue(segmentsIntereses.name, []);
			setFieldValue(capitalizeInterest.name, false);
			// Limpiar errores de validación
			setFieldError(fechaInicialIntereses.name, undefined);
			setFieldError(fechaFinalIntereses.name, undefined);
			setFieldError(tasaIntereses.name, undefined);
			// Marcar los campos como no tocados para evitar validaciones
			setFieldTouched(fechaInicialIntereses.name, false);
			setFieldTouched(fechaFinalIntereses.name, false);
			setFieldTouched(tasaIntereses.name, false);
		}

		// Forzar revalidación del formulario después de los cambios
		setTimeout(() => {
			validateForm();
		}, 0);
	};

	// Cargar tasas del store
	useEffect(() => {
		if (userId && !isInitialized) {
			dispatch(getInterestRates(userId));
		}
	}, [userId, isInitialized]);

	// Handlers para InterestSegmentsManager
	const handleSegmentsChange = useCallback(
		(newSegments: InterestSegment[]) => {
			setFieldValue(segmentsIntereses.name, newSegments);

			// Actualizar fechaInicial y fechaFinal basado en los tramos
			if (newSegments.length > 0) {
				setFieldValue(fechaInicialIntereses.name, newSegments[0].startDate);
				setFieldValue(fechaFinalIntereses.name, newSegments[newSegments.length - 1].endDate);
				// Usar la tasa del primer tramo para compatibilidad
				setFieldValue(tasaIntereses.name, newSegments[0].rate);
			}
		},
		[setFieldValue, segmentsIntereses.name, fechaInicialIntereses.name, fechaFinalIntereses.name, tasaIntereses.name],
	);

	const handleCapitalizeChange = useCallback(
		(capitalize: boolean) => {
			setFieldValue(capitalizeInterest.name, capitalize);
		},
		[setFieldValue, capitalizeInterest.name],
	);

	const handleTotalChange = useCallback(
		(total: { interest: number; amount: number }) => {
			// Guardar los totales calculados para usarlos en el submit
			setFieldValue("calculatedInterest", total.interest);
			setFieldValue("calculatedAmountWithInterest", total.amount);
		},
		[setFieldValue],
	);

	// Convertir tasas al formato esperado por InterestSegmentsManager
	const availableRates: InterestRate[] = tasasOpciones.map((tasa) => ({
		label: tasa.label,
		value: tasa.value,
		fechaInicio: tasa.fechaInicio,
		fechaUltima: tasa.fechaUltima,
	}));

	// Obtener la fecha de egreso para usarla como fecha inicial por defecto
	const fechaEgresoValue = values[fechaEgreso.name];
	const initialDate = fechaEgresoValue ? dayjs(fechaEgresoValue).format("DD/MM/YYYY") : dayjs().format("DD/MM/YYYY");

	const isInterestSectionEnabled = values[aplicarIntereses.name];

	return (
		<>
			<Typography variant="h5" gutterBottom>
				Actualización por Intereses
			</Typography>

			<Paper
				elevation={0}
				sx={{
					p: 3,
					mb: 3,
					bgcolor: theme.palette.background.default,
					borderRadius: 2,
				}}
			>
				<Typography variant="body2" color="textSecondary" paragraph>
					Puede actualizar el monto calculado aplicando intereses desde una fecha determinada hasta la fecha actual o una fecha específica.
					Puede agregar múltiples tramos con diferentes tasas de interés.
				</Typography>

				<FormControlLabel
					control={<Switch checked={values[aplicarIntereses.name]} onChange={handleAplicarInteresesChange} color="primary" />}
					label="Aplicar intereses al monto calculado"
				/>
			</Paper>

			{isInterestSectionEnabled && (
				<Box sx={{ mt: 3 }}>
					{calculatedAmount <= 0 && (
						<Alert severity="warning" sx={{ mb: 2 }}>
							El monto calculado en los pasos anteriores es $0 o no está disponible. Los intereses se calcularán sobre este monto.
						</Alert>
					)}

					{calculatedAmount > 0 && (
						<Paper elevation={0} sx={{ mb: 3, p: 2, bgcolor: theme.palette.primary.lighter, borderRadius: 2 }}>
							<Typography variant="subtitle2" color="primary.dark" gutterBottom>
								Capital base para intereses
							</Typography>
							<Typography variant="h6" color="primary.main">
								{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(calculatedAmount)}
							</Typography>
						</Paper>
					)}

					<InterestSegmentsManager
						capital={calculatedAmount}
						initialDate={initialDate}
						segments={values[segmentsIntereses.name] || []}
						onSegmentsChange={handleSegmentsChange}
						availableRates={availableRates}
						disabled={cargandoTasas || calculatedAmount <= 0}
						capitalizeInterest={values[capitalizeInterest.name] || false}
						onCapitalizeChange={handleCapitalizeChange}
						onTotalChange={handleTotalChange}
					/>
				</Box>
			)}
		</>
	);
}

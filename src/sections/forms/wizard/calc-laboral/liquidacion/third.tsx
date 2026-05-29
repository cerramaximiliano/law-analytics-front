import React from "react";
import { useEffect, useCallback } from "react";
import { Stack, Typography, Box, Switch, FormControlLabel, useTheme } from "@mui/material";
import { alpha } from "@mui/material/styles";
import { InfoCircle } from "iconsax-react";
import { useFormikContext } from "formik";
import dayjs from "utils/dayjs-config";
import { useSelector, dispatch } from "store";
import { getInterestRates } from "store/reducers/interestRates";
import InterestSegmentsManager, { InterestSegment, InterestRate } from "components/calculator/InterestSegmentsManager";
import { BRAND_BLUE, STALE_AMBER } from "themes/dashboardTokens";

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

	const { values, setFieldValue, setFieldError, setFieldTouched, validateForm, errors, touched } = useFormikContext<any>();

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
	const initialDate = fechaEgresoValue ? dayjs(fechaEgresoValue, "DD/MM/YYYY").format("DD/MM/YYYY") : dayjs().format("DD/MM/YYYY");

	const isInterestSectionEnabled = values[aplicarIntereses.name];

	const isDark = theme.palette.mode === "dark";

	const renderNotice = (text: React.ReactNode, variant: "info" | "warning" | "error" = "info") => {
		const accent = variant === "info" ? BRAND_BLUE : variant === "warning" ? STALE_AMBER : theme.palette.error.main;
		return (
			<Box
				sx={{
					display: "flex",
					alignItems: "flex-start",
					gap: 1,
					px: 1.5,
					py: 1.25,
					borderRadius: 1.5,
					border: `1px solid ${alpha(accent, isDark ? 0.32 : 0.22)}`,
					bgcolor: alpha(accent, isDark ? 0.1 : 0.05),
					mb: 2,
				}}
			>
				<Box sx={{ color: accent, display: "flex", mt: 0.125, flexShrink: 0 }}>
					<InfoCircle size={16} variant="Bulk" />
				</Box>
				<Typography sx={{ fontSize: "0.82rem", color: "text.primary", lineHeight: 1.5, fontWeight: 500, textWrap: "pretty" }}>{text}</Typography>
			</Box>
		);
	};

	return (
		<>
			<Box
				sx={{
					p: { xs: 2, sm: 2.25 },
					mb: 2.5,
					borderRadius: 1.5,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
				}}
			>
				<Stack spacing={1}>
					<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", lineHeight: 1.55, textWrap: "pretty" }}>
						Actualizá el monto calculado aplicando intereses desde una fecha determinada hasta hoy u otra fecha. Podés sumar múltiples tramos con
						diferentes tasas.
					</Typography>

					<FormControlLabel
						control={
							<Switch
								checked={values[aplicarIntereses.name]}
								onChange={handleAplicarInteresesChange}
								sx={{
									"& .MuiSwitch-switchBase.Mui-checked": {
										color: BRAND_BLUE,
										"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08) },
									},
									"& .MuiSwitch-switchBase.Mui-checked + .MuiSwitch-track": { bgcolor: BRAND_BLUE },
								}}
							/>
						}
						label={<Typography sx={{ fontSize: "0.875rem", fontWeight: 500 }}>Aplicar intereses al monto calculado</Typography>}
					/>
				</Stack>
			</Box>

			{isInterestSectionEnabled && (
				<Box sx={{ mt: 2.5 }}>
					{errors[segmentsIntereses.name] &&
						touched[segmentsIntereses.name] &&
						renderNotice(
							typeof errors[segmentsIntereses.name] === "string" ? String(errors[segmentsIntereses.name]) : "Debe agregar al menos un tramo",
							"error",
						)}

					{calculatedAmount <= 0 &&
						renderNotice(
							"El monto calculado en los pasos anteriores es $0 o no está disponible. Los intereses se calcularán sobre este monto.",
							"warning",
						)}

					{calculatedAmount > 0 && (
						<Box
							sx={{
								mb: 2.5,
								p: 2,
								borderRadius: 1.5,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.05),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
							}}
						>
							<Typography
								sx={{
									fontSize: "0.62rem",
									fontWeight: 600,
									letterSpacing: "0.14em",
									textTransform: "uppercase",
									color: BRAND_BLUE,
									mb: 0.5,
								}}
							>
								Capital base para intereses
							</Typography>
							<Typography
								sx={{
									fontSize: "1.25rem",
									fontWeight: 600,
									letterSpacing: "-0.015em",
									color: "text.primary",
									fontVariantNumeric: "tabular-nums",
								}}
							>
								{new Intl.NumberFormat("es-AR", { style: "currency", currency: "ARS" }).format(calculatedAmount)}
							</Typography>
						</Box>
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

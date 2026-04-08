import React, { useEffect } from "react";
import {
	Box,
	CircularProgress,
	FormControl,
	FormHelperText,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	Typography,
} from "@mui/material";
import { PercentageCircle } from "iconsax-react";
import { useFormikContext } from "formik";
import { useSelector, dispatch } from "store";
import { getInterestRates } from "store/reducers/interestRates";

interface FifthFormProps {
	formField: any;
}

export default function FifthForm({ formField }: FifthFormProps) {
	const { tasaInteresSentencia } = formField;

	const { values, setFieldValue, errors, touched } = useFormikContext<any>();
	const userId = useSelector((state: any) => state.auth.user?._id);
	const { rates, isLoading, isInitialized } = useSelector((state: any) => state.interestRates);

	// Cargar tasas si no están en el store
	useEffect(() => {
		if (userId && !isInitialized) {
			dispatch(getInterestRates(userId));
		}
	}, [userId, isInitialized]);

	const hasError = !!(touched[tasaInteresSentencia.name] && errors[tasaInteresSentencia.name]);

	return (
		<>
			<Typography variant="h5" gutterBottom sx={{ mb: 0.5 }}>
				Tasa de Interés de Sentencia
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 3 }}>
				Seleccione la tasa de interés aplicable a la sentencia para el cálculo retroactivo previsional.
			</Typography>

			{isLoading && !isInitialized ? (
				<Stack direction="row" spacing={2} alignItems="center" sx={{ py: 4 }}>
					<CircularProgress size={20} />
					<Typography variant="body2" color="text.secondary">
						Cargando tasas disponibles…
					</Typography>
				</Stack>
			) : (
				<Box sx={{ maxWidth: 480 }}>
					<InputLabel sx={{ mb: 0.5 }}>{tasaInteresSentencia.label} *</InputLabel>
					<FormControl fullWidth error={hasError}>
						<Select
							value={values[tasaInteresSentencia.name]}
							onChange={(e) => setFieldValue(tasaInteresSentencia.name, e.target.value)}
							displayEmpty
							startAdornment={
								<Box sx={{ mr: 1, display: "flex", alignItems: "center", color: "text.secondary" }}>
									<PercentageCircle size={18} />
								</Box>
							}
						>
							<MenuItem value="" disabled>
								<Typography color="text.secondary">Seleccione una tasa</Typography>
							</MenuItem>
							{rates.map((rate: { label: string; value: string }) => (
								<MenuItem key={rate.value} value={rate.value}>
									{rate.label}
								</MenuItem>
							))}
						</Select>
						{hasError && (
							<FormHelperText>{errors[tasaInteresSentencia.name] as string}</FormHelperText>
						)}
					</FormControl>
				</Box>
			)}
		</>
	);
}

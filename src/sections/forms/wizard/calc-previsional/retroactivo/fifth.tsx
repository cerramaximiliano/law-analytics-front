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
	Button,
	Checkbox,
	Divider,
	FormControlLabel,
	Grid,
	IconButton,
} from "@mui/material";
import { Add, PercentageCircle, Trash } from "iconsax-react";
import DateInputField from "components/UI/DateInputField";
import NumberField from "components/UI/NumberField";
import { useFormikContext } from "formik";
import { useSelector, dispatch } from "store";
import { getInterestRates } from "store/reducers/interestRates";
import { OPCIONES_BONO, TRATAMIENTOS_BONO } from "services/previsionalService";

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
						{hasError && <FormHelperText>{errors[tasaInteresSentencia.name] as string}</FormHelperText>}
					</FormControl>
				</Box>
			)}

			<Divider sx={{ my: 3 }} />

			<FormControlLabel
				control={<Checkbox checked={values.sac !== false} onChange={(e) => setFieldValue("sac", e.target.checked)} />}
				label="Incluir las diferencias de SAC (junio y diciembre, proporcional en el semestre de inicio)"
			/>

			<Typography variant="h6" sx={{ mt: 3, mb: 0.5 }}>
				Bono previsional
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
				Sumas fijas que el Poder Ejecutivo otorgó algunos meses (subsidios desde 12/2019, refuerzos 2022–23, ayudas y bonos extraordinarios
				desde 2024). Cada decreto da el monto completo a quien cobra hasta un umbral y completa hasta umbral + monto por encima. No integran
				el haber ni se mueven con la movilidad.
			</Typography>
			<Grid container spacing={2} sx={{ maxWidth: 720 }}>
				<Grid item xs={12} sm={6}>
					<InputLabel sx={{ mb: 0.5 }}>Contabilizar el bono</InputLabel>
					<FormControl fullWidth>
						<Select value={values.bono || "no"} onChange={(e) => setFieldValue("bono", e.target.value)}>
							{OPCIONES_BONO.map((o) => (
								<MenuItem key={o.value} value={o.value}>
									{o.label}
								</MenuItem>
							))}
						</Select>
					</FormControl>
				</Grid>
				{values.bono && values.bono !== "no" && (
					<Grid item xs={12} sm={6}>
						<InputLabel sx={{ mb: 0.5 }}>Cómo se liquida</InputLabel>
						<FormControl fullWidth>
							<Select value={values.bonoTratamiento || "decreto"} onChange={(e) => setFieldValue("bonoTratamiento", e.target.value)}>
								{TRATAMIENTOS_BONO.map((o) => (
									<MenuItem key={o.value} value={o.value}>
										{o.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Grid>
				)}
			</Grid>

			<Typography variant="h6" sx={{ mt: 3, mb: 0.5 }}>
				Pagos a cuenta
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
				Cada pago se imputa primero a intereses y después a capital; el saldo de capital sigue devengando hasta la fecha de cierre.
			</Typography>
			<Stack spacing={1.5}>
				{(values.pagosACuenta || []).map((_: any, i: number) => (
					<Grid container spacing={2} key={i} alignItems="flex-end">
						<Grid item xs={12} sm={5}>
							<DateInputField name={`pagosACuenta.${i}.fecha`} />
						</Grid>
						<Grid item xs={10} sm={5}>
							<NumberField
								thousandSeparator=","
								allowNegative={false}
								decimalScale={2}
								fullWidth
								placeholder="0,00"
								name={`pagosACuenta.${i}.importe`}
								InputProps={{ startAdornment: "$" }}
							/>
						</Grid>
						<Grid item xs={2}>
							<IconButton
								color="error"
								onClick={() =>
									setFieldValue(
										"pagosACuenta",
										values.pagosACuenta.filter((__: any, j: number) => j !== i),
									)
								}
							>
								<Trash size={18} />
							</IconButton>
						</Grid>
					</Grid>
				))}
			</Stack>
			<Button
				sx={{ mt: 1.5 }}
				size="small"
				variant="outlined"
				startIcon={<Add size={16} />}
				onClick={() => setFieldValue("pagosACuenta", [...(values.pagosACuenta || []), { fecha: "", importe: "" }])}
			>
				Agregar pago
			</Button>
		</>
	);
}

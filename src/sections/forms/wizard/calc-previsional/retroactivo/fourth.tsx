import React from "react";
import {
	Grid,
	InputLabel,
	Typography,
	Box,
	alpha,
	useTheme,
	FormControl,
	Select,
	MenuItem,
	FormHelperText,
	Paper,
	Stack,
} from "@mui/material";
import { useFormikContext } from "formik";
import DateInputField from "components/UI/DateInputField";
import { InfoCircle } from "iconsax-react";

const TIPO_TOPE_OPCIONES = [
	{ value: "no", label: "No" },
	{ value: "si", label: "Sí" },
	{
		value: "actis_caporale_menor_15",
		label: '"Actis Caporale" — si el tope es menor al 15% del haber',
	},
	{
		value: "actis_caporale_menor_15_sino_descuenta",
		label: '"Actis Caporale" — si es menor al 15%, sino descuenta el 15%',
	},
];

interface FourthFormProps {
	formField: any;
}

export default function FourthForm({ formField }: FourthFormProps) {
	const { tipoTope, topeDesde, topeHasta } = formField;

	const theme = useTheme();
	const { values, setFieldValue, errors, touched } = useFormikContext<any>();

	const aplicaTope = values[tipoTope.name] && values[tipoTope.name] !== "no";

	return (
		<>
			<Typography variant="h5" gutterBottom sx={{ mb: 0.5 }}>
				Aplicación de Topes
			</Typography>
			<Typography variant="body2" color="text.secondary" sx={{ mb: 2.5 }}>
				Indique si se aplica el tope del artículo 9 de la Ley 24.463 inc. 3 sobre el haber reclamado.
			</Typography>

			{/* Info box */}
			<Paper
				elevation={0}
				sx={{
					p: 2,
					mb: 3,
					bgcolor: alpha(theme.palette.info.main, 0.06),
					border: `1px solid ${alpha(theme.palette.info.main, 0.2)}`,
					borderRadius: 1,
				}}
			>
				<Stack direction="row" spacing={1} alignItems="flex-start">
					<InfoCircle size={18} color={theme.palette.info.main} style={{ marginTop: 2, flexShrink: 0 }} />
					<Typography variant="body2" color="text.secondary">
						El criterio <em>Actis Caporale</em> limita el descuento previsional en función de si representa menos o más del 15% del
						haber jubilatorio. La selección afecta el cálculo del haber neto de aporte.
					</Typography>
				</Stack>
			</Paper>

			<Grid container spacing={2.5}>
				{/* Tipo de tope */}
				<Grid item xs={12}>
					<InputLabel>{tipoTope.label} *</InputLabel>
					<FormControl fullWidth error={!!(touched[tipoTope.name] && errors[tipoTope.name])}>
						<Select
							value={values[tipoTope.name]}
							onChange={(e) => {
								setFieldValue(tipoTope.name, e.target.value);
								if (e.target.value === "no") {
									setFieldValue(topeDesde.name, "");
									setFieldValue(topeHasta.name, "");
								}
							}}
							displayEmpty
						>
							<MenuItem value="" disabled>
								<Typography color="text.secondary">Seleccione una opción</Typography>
							</MenuItem>
							{TIPO_TOPE_OPCIONES.map((opt) => (
								<MenuItem key={opt.value} value={opt.value}>
									{opt.label}
								</MenuItem>
							))}
						</Select>
						{touched[tipoTope.name] && errors[tipoTope.name] && (
							<FormHelperText>{errors[tipoTope.name] as string}</FormHelperText>
						)}
					</FormControl>
				</Grid>

				{/* Rango de fechas — solo si aplica tope */}
				{aplicaTope && (
					<Grid item xs={12}>
						<Paper
							elevation={0}
							sx={{
								p: 2.5,
								bgcolor: alpha(theme.palette.primary.main, 0.04),
								border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
								borderRadius: 1,
							}}
						>
							<Typography variant="subtitle2" sx={{ mb: 2, fontWeight: 600 }}>
								Período de aplicación del tope
							</Typography>
							<Grid container spacing={2.5}>
								<Grid item xs={12} md={6}>
									<InputLabel>{topeDesde.label} *</InputLabel>
									<DateInputField name={topeDesde.name} />
									{touched[topeDesde.name] && errors[topeDesde.name] && (
										<Box sx={{ mt: 0.5 }}>
											<Typography variant="caption" color="error">
												{errors[topeDesde.name] as string}
											</Typography>
										</Box>
									)}
								</Grid>
								<Grid item xs={12} md={6}>
									<InputLabel>{topeHasta.label} *</InputLabel>
									<DateInputField name={topeHasta.name} />
									{touched[topeHasta.name] && errors[topeHasta.name] && (
										<Box sx={{ mt: 0.5 }}>
											<Typography variant="caption" color="error">
												{errors[topeHasta.name] as string}
											</Typography>
										</Box>
									)}
								</Grid>
							</Grid>
						</Paper>
					</Grid>
				)}
			</Grid>
		</>
	);
}

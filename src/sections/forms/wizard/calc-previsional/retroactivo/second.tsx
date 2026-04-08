import React from "react";
import {
	Grid,
	InputLabel,
	Typography,
	Divider,
	Box,
	alpha,
	useTheme,
	FormControl,
	Select,
	MenuItem,
	FormControlLabel,
	FormHelperText,
	Switch,
	Paper,
} from "@mui/material";
import { useFormikContext } from "formik";
import NumberField from "components/UI/NumberField";
import DateInputField from "components/UI/DateInputField";

const MONEDAS = [{ value: "ARS", label: "Pesos (ARS)" }];

interface SecondFormProps {
	formField: any;
}

export default function SecondForm({ formField }: SecondFormProps) {
	const { tieneReajuste, fechaAltaReajuste, importeReajuste, monedaReajuste, haberReclamado, monedaReclamado, fechaDesdeReclamado, fechaHastaReclamado, fechaCierre } = formField;

	const theme = useTheme();
	const { values, setFieldValue, errors, touched } = useFormikContext<any>();

	return (
		<>
			{/* Sección: Haber Reajustado */}
			<Box>
				<Typography variant="h5" gutterBottom sx={{ mb: 0.5 }}>
					Haber Reajustado por ANSES
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
					Indique si ANSES realizó un reajuste del haber con anterioridad al inicio del reclamo.
				</Typography>

				<FormControlLabel
					control={
						<Switch
							checked={values[tieneReajuste.name]}
							onChange={(e) => {
								setFieldValue(tieneReajuste.name, e.target.checked);
								if (!e.target.checked) {
									setFieldValue(fechaAltaReajuste.name, "");
									setFieldValue(importeReajuste.name, "");
								}
							}}
							color="primary"
						/>
					}
					label={
						<Typography variant="body1">
							{values[tieneReajuste.name] ? "Sí, posee haber reajustado" : "No posee haber reajustado"}
						</Typography>
					}
				/>

				{values[tieneReajuste.name] && (
					<Paper
						elevation={0}
						sx={{
							mt: 2,
							p: 2.5,
							bgcolor: alpha(theme.palette.primary.main, 0.04),
							border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
							borderRadius: 1,
						}}
					>
						<Grid container spacing={2.5}>
							<Grid item xs={12} md={6}>
								<InputLabel>{fechaAltaReajuste.label} *</InputLabel>
								<DateInputField name={fechaAltaReajuste.name} />
							</Grid>

							<Grid item xs={12} md={6}>
								<InputLabel>{monedaReajuste.label}</InputLabel>
								<FormControl fullWidth>
									<Select value={values[monedaReajuste.name]} onChange={(e) => setFieldValue(monedaReajuste.name, e.target.value)}>
										{MONEDAS.map((m) => (
											<MenuItem key={m.value} value={m.value}>
												{m.label}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Grid>

							<Grid item xs={12} md={6}>
								<InputLabel>{importeReajuste.label} *</InputLabel>
								<NumberField
									thousandSeparator=","
									allowNegative={false}
									decimalScale={2}
									fullWidth
									placeholder="0,00"
									name={importeReajuste.name}
									InputProps={{ startAdornment: "$" }}
								/>
							</Grid>
						</Grid>
					</Paper>
				)}
			</Box>

			<Divider sx={{ my: 3 }} />

			{/* Sección: Haber Reclamado */}
			<Box>
				<Typography variant="h5" gutterBottom sx={{ mb: 0.5 }}>
					Haber Reclamado
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
					Importe del haber que se reclama como correcto según la liquidación.
				</Typography>

				{values.fechaAdquisicion && (
					<Box sx={{ mb: 2 }}>
						<Typography variant="caption" color="text.secondary">
							Fecha de Adquisición del Derecho
						</Typography>
						<Typography variant="body2" fontWeight={500}>
							{values.fechaAdquisicion}
						</Typography>
					</Box>
				)}

				<Grid container spacing={2.5}>
					<Grid item xs={12} md={6}>
						<InputLabel>{haberReclamado.label} *</InputLabel>
						<NumberField
							thousandSeparator=","
							allowNegative={false}
							decimalScale={2}
							fullWidth
							placeholder="0,00"
							name={haberReclamado.name}
							InputProps={{ startAdornment: "$" }}
						/>
					</Grid>

					<Grid item xs={12} md={6}>
						<InputLabel>{monedaReclamado.label}</InputLabel>
						<FormControl fullWidth>
							<Select value={values[monedaReclamado.name]} onChange={(e) => setFieldValue(monedaReclamado.name, e.target.value)}>
								{MONEDAS.map((m) => (
									<MenuItem key={m.value} value={m.value}>
										{m.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>
					</Grid>
				</Grid>
			</Box>

			<Divider sx={{ my: 3 }} />

			{/* Sección: Período Reclamado */}
			<Box>
				<Typography variant="h5" gutterBottom sx={{ mb: 0.5 }}>
					Período Reclamado
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
					Indique el período de tiempo comprendido en el reclamo. Ambas fechas deben ser posteriores a la fecha de alta.
				</Typography>

				<Grid container spacing={2.5}>
					<Grid item xs={12} md={6}>
						<InputLabel>{fechaDesdeReclamado.label} *</InputLabel>
						<FormControl fullWidth error={!!(touched[fechaDesdeReclamado.name] && errors[fechaDesdeReclamado.name])}>
							<DateInputField name={fechaDesdeReclamado.name} />
							{touched[fechaDesdeReclamado.name] && errors[fechaDesdeReclamado.name] && (
								<FormHelperText>{errors[fechaDesdeReclamado.name] as string}</FormHelperText>
							)}
						</FormControl>
					</Grid>

					<Grid item xs={12} md={6}>
						<InputLabel>{fechaHastaReclamado.label} *</InputLabel>
						<FormControl fullWidth error={!!(touched[fechaHastaReclamado.name] && errors[fechaHastaReclamado.name])}>
							<DateInputField name={fechaHastaReclamado.name} />
							{touched[fechaHastaReclamado.name] && errors[fechaHastaReclamado.name] && (
								<FormHelperText>{errors[fechaHastaReclamado.name] as string}</FormHelperText>
							)}
						</FormControl>
					</Grid>
				</Grid>
			</Box>

			<Divider sx={{ my: 3 }} />

			{/* Sección: Fecha de Cierre de la Liquidación */}
			<Box>
				<Typography variant="h5" gutterBottom sx={{ mb: 0.5 }}>
					Fecha de Cierre de la Liquidación
				</Typography>
				<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
					Fecha hasta la cual se practica la liquidación. No puede ser anterior al período reclamado ni posterior a hoy.
				</Typography>

				<Grid container spacing={2.5}>
					<Grid item xs={12} md={6}>
						<InputLabel>{fechaCierre.label} *</InputLabel>
						<FormControl fullWidth error={!!(touched[fechaCierre.name] && errors[fechaCierre.name])}>
							<DateInputField name={fechaCierre.name} />
							{touched[fechaCierre.name] && errors[fechaCierre.name] && (
								<FormHelperText>{errors[fechaCierre.name] as string}</FormHelperText>
							)}
						</FormControl>
					</Grid>
				</Grid>
			</Box>
		</>
	);
}

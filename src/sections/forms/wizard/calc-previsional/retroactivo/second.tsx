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
	Button,
	IconButton,
} from "@mui/material";
import { Add, Trash } from "iconsax-react";
import { useFormikContext } from "formik";
import { MONEDAS_HABER, PISOS_PERCIBIDO } from "services/previsionalService";
import NumberField from "components/UI/NumberField";
import DateInputField from "components/UI/DateInputField";
import PercibidosMensuales from "./components/PercibidosMensuales";

const MONEDAS = [{ value: "ARS", label: "Pesos (ARS)" }];

interface SecondFormProps {
	formField: any;
}

export default function SecondForm({ formField }: SecondFormProps) {
	const {
		tieneReajuste,
		fechaAltaReajuste,
		importeReajuste,
		monedaReajuste,
		haberReclamado,
		monedaReclamado,
		fechaDesdeReclamado,
		fechaHastaReclamado,
		fechaCierre,
	} = formField;

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
									setFieldValue("descuentoReajuste", "");
									setFieldValue("reajustesAdicionales", []);
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
									fixedDecimalScale
									fullWidth
									placeholder="0,00"
									name={importeReajuste.name}
									InputProps={{ startAdornment: "$" }}
								/>
							</Grid>

							<Grid item xs={12} md={6}>
								<InputLabel>Descuento ley 24.463 sobre el reajustado (%)</InputLabel>
								<NumberField allowNegative={false} decimalScale={4} fullWidth placeholder="0" name="descuentoReajuste" />
								<FormHelperText>Opcional: porcentaje fijo que ANSES descuenta del haber reajustado.</FormHelperText>
							</Grid>
						</Grid>

						{(values.reajustesAdicionales || []).map((_: any, i: number) => (
							<Grid container spacing={2.5} key={i} sx={{ mt: 0.5 }} alignItems="flex-end">
								<Grid item xs={12} md={4}>
									<InputLabel>Reajuste {i + 2}: fecha de alta *</InputLabel>
									<DateInputField name={`reajustesAdicionales.${i}.fecha`} />
								</Grid>
								<Grid item xs={12} md={4}>
									<InputLabel>Importe *</InputLabel>
									<NumberField
										thousandSeparator=","
										allowNegative={false}
										decimalScale={2}
										fixedDecimalScale
										fullWidth
										placeholder="0,00"
										name={`reajustesAdicionales.${i}.importe`}
										InputProps={{ startAdornment: "$" }}
									/>
								</Grid>
								<Grid item xs={10} md={3}>
									<InputLabel>Descuento (%)</InputLabel>
									<NumberField
										allowNegative={false}
										decimalScale={4}
										fullWidth
										placeholder="0"
										name={`reajustesAdicionales.${i}.descuentoPct`}
									/>
								</Grid>
								<Grid item xs={2} md={1}>
									<IconButton
										color="error"
										aria-label="Quitar reajuste"
										onClick={() =>
											setFieldValue(
												"reajustesAdicionales",
												values.reajustesAdicionales.filter((__: any, j: number) => j !== i),
											)
										}
									>
										<Trash size={18} />
									</IconButton>
								</Grid>
							</Grid>
						))}
						<Button
							size="small"
							startIcon={<Add size={16} />}
							sx={{ mt: 2, textTransform: "none" }}
							onClick={() =>
								setFieldValue("reajustesAdicionales", [
									...(values.reajustesAdicionales || []),
									{ fecha: "", importe: "", descuentoPct: "" },
								])
							}
						>
							Agregar otro reajuste
						</Button>
						<FormHelperText>
							Cada reajuste reemplaza el haber percibido desde su mes y sigue con la movilidad. Si es posterior al fallecimiento del
							causante, cargue el haber de la pensión.
						</FormHelperText>
					</Paper>
				)}
			</Box>

			<Box sx={{ mt: 3 }}>
				<InputLabel>{formField.pisoPercibido.label}</InputLabel>
				<FormControl fullWidth>
					<Select
						value={values[formField.pisoPercibido.name] || "no"}
						onChange={(e) => setFieldValue(formField.pisoPercibido.name, e.target.value)}
					>
						{PISOS_PERCIBIDO.map((p) => (
							<MenuItem key={p.value} value={p.value}>
								{p.label}
							</MenuItem>
						))}
					</Select>
				</FormControl>
				<FormHelperText>Si el haber pagado queda por debajo del mínimo, ANSES paga el mínimo: el percibido se toma así.</FormHelperText>
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
							fixedDecimalScale
							fullWidth
							placeholder="0,00"
							name={haberReclamado.name}
							InputProps={{ startAdornment: "$" }}
						/>
					</Grid>

					<Grid item xs={12} md={6}>
						<InputLabel>{formField.haberReclamadoAl.label}</InputLabel>
						<DateInputField name={formField.haberReclamadoAl.name} />
						<FormHelperText>Fecha a la que corresponde el importe. Si se deja vacía, se toma la del haber pagado.</FormHelperText>
					</Grid>

					<Grid item xs={12} md={6}>
						<InputLabel>{monedaReclamado.label}</InputLabel>
						<FormControl fullWidth>
							<Select value={values[monedaReclamado.name]} onChange={(e) => setFieldValue(monedaReclamado.name, e.target.value)}>
								{MONEDAS_HABER.map((m) => (
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

			<Divider sx={{ my: 3 }} />

			<PercibidosMensuales />
		</>
	);
}

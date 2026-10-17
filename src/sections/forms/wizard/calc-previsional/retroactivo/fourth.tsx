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
	Button,
	Checkbox,
	FormControlLabel,
	IconButton,
} from "@mui/material";
import { useFormikContext } from "formik";
import DateInputField from "components/UI/DateInputField";
import NumberField from "components/UI/NumberField";
import { Add, InfoCircle, Trash } from "iconsax-react";

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

const EVALUACION_OPCIONES = [
	{ value: "cadaPeriodo", label: "En cada período: quita = haber reclamado − haber máximo del mes" },
	{ value: "haberActual", label: "En el haber actual: el porcentaje de quita a la fecha de cierre se aplica a todo el período" },
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
						El criterio <em>Actis Caporale</em> limita el descuento previsional en función de si representa menos o más del 15% del haber
						jubilatorio. La selección afecta el cálculo del haber neto de aporte.
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
						{touched[tipoTope.name] && errors[tipoTope.name] && <FormHelperText>{errors[tipoTope.name] as string}</FormHelperText>}
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
							<Grid container spacing={2.5} sx={{ mt: 0.5 }}>
								<Grid item xs={12} md={8}>
									<InputLabel>Cómo se evalúa el tope</InputLabel>
									<FormControl fullWidth>
										<Select
											value={values.topeEvaluacion || "cadaPeriodo"}
											onChange={(e) => setFieldValue("topeEvaluacion", e.target.value)}
										>
											{EVALUACION_OPCIONES.map((o) => (
												<MenuItem key={o.value} value={o.value}>
													{o.label}
												</MenuItem>
											))}
										</Select>
									</FormControl>
								</Grid>
								<Grid item xs={12}>
									<FormControlLabel
										control={
											<Checkbox checked={!!values.topeMaximoBadaro} onChange={(e) => setFieldValue("topeMaximoBadaro", e.target.checked)} />
										}
										label="Mover el haber máximo con la movilidad del fallo Badaro"
									/>
									<Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
										El máximo del mes anterior a la fecha se actualiza con el índice de salarios INDEC hasta 12/2006 y después con el
										porcentaje de la movilidad general, en lugar del máximo de ley.
									</Typography>
								</Grid>
								{values.topeMaximoBadaro && (
									<Grid item xs={12} md={4}>
										<InputLabel>Desde</InputLabel>
										<DateInputField name="topeMaximoBadaroDesde" />
									</Grid>
								)}
								{values.topeEvaluacion === "haberActual" && (
									<Grid item xs={12} md={4}>
										<InputLabel>Porcentaje de quita (opcional)</InputLabel>
										<NumberField
											allowNegative={false}
											decimalScale={2}
											fullWidth
											placeholder="Se calcula solo"
											name="topePorcentaje"
											InputProps={{ endAdornment: "%" }}
										/>
									</Grid>
								)}
							</Grid>
						</Paper>
					</Grid>
				)}
			</Grid>

			<VillanustreSeccion />
		</>
	);
}

/** Tope con el salario del activo (CSJN "Villanustre"): el haber computado no supera un porcentaje del salario. */
function VillanustreSeccion() {
	const theme = useTheme();
	const { values, setFieldValue, errors, submitCount } = useFormikContext<any>();
	const errorSalarios = submitCount > 0 && typeof errors.villanustreSalarios === "string" ? errors.villanustreSalarios : null;
	const salarios: { fecha: string; importe: number | string }[] = values.villanustreSalarios || [];
	return (
		<Box sx={{ mt: 3 }}>
			<FormControlLabel
				control={
					<Checkbox
						checked={!!values.villanustre}
						onChange={(e) => {
							setFieldValue("villanustre", e.target.checked);
							if (e.target.checked && !salarios.length) setFieldValue("villanustreSalarios", [{ fecha: "", importe: "" }]);
						}}
					/>
				}
				label="Aplicar el tope con el salario del activo (Villanustre)"
			/>
			<Typography variant="caption" color="text.secondary" sx={{ display: "block", mb: 1.5 }}>
				El haber computado de cada mes no supera el porcentaje indicado del salario de actividad (CSJN &quot;Villanustre&quot;, 1991). Se
				aplica después del tope del art. 9.
			</Typography>
			{values.villanustre && (
				<Paper
					elevation={0}
					sx={{
						p: 2.5,
						bgcolor: alpha(theme.palette.primary.main, 0.04),
						border: `1px solid ${alpha(theme.palette.primary.main, 0.2)}`,
						borderRadius: 1,
					}}
				>
					<Grid container spacing={2.5} alignItems="flex-end">
						<Grid item xs={12} sm={4}>
							<InputLabel>Porcentaje del salario *</InputLabel>
							<NumberField
								allowNegative={false}
								decimalScale={2}
								fullWidth
								name="villanustrePorcentaje"
								InputProps={{ endAdornment: "%" }}
							/>
						</Grid>
						<Grid item xs={12} sm={8}>
							<FormControlLabel
								control={
									<Checkbox checked={!!values.villanustrePauta} onChange={(e) => setFieldValue("villanustrePauta", e.target.checked)} />
								}
								label="Pauta salarial objetiva en los meses sin salario cargado"
							/>
						</Grid>
					</Grid>
					<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 1, mb: 2 }}>
						Cada salario rige desde su fecha hasta el siguiente. Con la pauta salarial objetiva (Circular 70/14), los meses sin salario
						cargado mueven el último con la variación del salario mínimo, vital y móvil. Antes del primer salario no hay límite.
					</Typography>
					<Typography variant="subtitle2" sx={{ mb: 1, fontWeight: 600 }}>
						Salarios de actividad
					</Typography>
					<Stack spacing={1.5}>
						{salarios.map((_, i) => (
							<Grid container spacing={2} key={i} alignItems="flex-end">
								<Grid item xs={12} sm={5}>
									<InputLabel sx={{ mb: 0.5 }}>Desde</InputLabel>
									<DateInputField name={`villanustreSalarios.${i}.fecha`} />
								</Grid>
								<Grid item xs={10} sm={6}>
									<InputLabel sx={{ mb: 0.5 }}>Salario</InputLabel>
									<NumberField
										thousandSeparator=","
										allowNegative={false}
										decimalScale={2}
										fixedDecimalScale
										fullWidth
										placeholder="0,00"
										name={`villanustreSalarios.${i}.importe`}
										InputProps={{ startAdornment: "$" }}
									/>
								</Grid>
								<Grid item xs={2} sm={1}>
									<IconButton
										color="error"
										aria-label="Quitar salario"
										onClick={() =>
											setFieldValue(
												"villanustreSalarios",
												salarios.filter((__, j) => j !== i),
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
						onClick={() => setFieldValue("villanustreSalarios", [...salarios, { fecha: "", importe: "" }])}
					>
						Agregar salario
					</Button>
					{errorSalarios && <FormHelperText error>{errorSalarios}</FormHelperText>}
				</Paper>
			)}
		</Box>
	);
}

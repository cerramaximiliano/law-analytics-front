import { Divider, Switch, FormControlLabel, Grid, Typography, InputLabel } from "@mui/material";
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";
import { useField } from "formik";
import { Calendar, Profile2User } from "iconsax-react";

export default function SecondForm(props: any) {
	const {
		formField: {
			isPatrimonio,
			patrimonioInicialReclamado,
			patrimonioInicialReclamante,
			patrimonioFinalReclamado,
			patrimonioFinalReclamante,
			isVivienda,
			cantMesesAtribucionVivienda,
			porcentajeInmuebleOCanon,
			valorCanon,
			cantidadHijos,
			cantidadOtrosFamiliares,
		},
	} = props;
	const fieldIsPatrimonio = useField(isPatrimonio.name)[0];
	const helperIsPatrimonio = useField(isPatrimonio.name)[2];

	const fieldIsVivienda = useField(isVivienda.name)[0];
	const helperIsVivienda = useField(isVivienda.name)[2];

	return (
		<>
			<Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
				Seleccione Cálculos opcionales
			</Typography>
			<Grid item xs={12}>
				<Grid>
					<FormControlLabel
						name={isPatrimonio.name}
						control={
							<Switch
								checked={fieldIsPatrimonio.value}
								onChange={(e) => {
									helperIsPatrimonio.setValue(e.target.checked);
								}}
							/>
						}
						label={isPatrimonio.label}
						labelPlacement="end"
					/>
				</Grid>
				{fieldIsPatrimonio.value && (
					<Grid container spacing={2} alignItems="center">
						<Grid item xs={12} lg={6}>
							<Grid container spacing={2} alignItems="center">
								<Grid item xs={12} lg={3}>
									<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>{patrimonioInicialReclamado.label}</InputLabel>
								</Grid>
								<Grid item xs={12} lg={9}>
									<NumberField
										thousandSeparator={","}
										allowNegative={false}
										allowLeadingZeros={false}
										decimalScale={2}
										InputProps={{ startAdornment: "$" }}
										fullWidth
										placeholder="Ingrese un monto"
										name={patrimonioInicialReclamado.name}
									/>
								</Grid>
							</Grid>
						</Grid>
						<Grid item xs={12} lg={6}>
							<Grid container spacing={2} alignItems="center">
								<Grid item xs={12} lg={3}>
									<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>{patrimonioInicialReclamante.label}:</InputLabel>
								</Grid>
								<Grid item xs={12} lg={9}>
									<NumberField
										thousandSeparator={","}
										allowNegative={false}
										allowLeadingZeros={false}
										decimalScale={2}
										InputProps={{ startAdornment: "$" }}
										fullWidth
										placeholder="Ingrese un monto"
										name={patrimonioInicialReclamante.name}
									/>
								</Grid>
							</Grid>
						</Grid>
						<Grid item xs={12} lg={6}>
							<Grid container spacing={2} alignItems="center">
								<Grid item xs={12} lg={3}>
									<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>{patrimonioFinalReclamado.label}:</InputLabel>
								</Grid>
								<Grid item xs={12} lg={9}>
									<NumberField
										thousandSeparator={","}
										allowNegative={false}
										allowLeadingZeros={false}
										decimalScale={2}
										InputProps={{ startAdornment: "$" }}
										fullWidth
										placeholder="Ingrese un monto"
										name={patrimonioFinalReclamado.name}
									/>
								</Grid>
							</Grid>
						</Grid>
						<Grid item xs={12} lg={6}>
							<Grid container spacing={2} alignItems="center">
								<Grid item xs={12} lg={3}>
									<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>{patrimonioFinalReclamante.label}:</InputLabel>
								</Grid>
								<Grid item xs={12} lg={9}>
									<NumberField
										thousandSeparator={","}
										allowNegative={false}
										allowLeadingZeros={false}
										decimalScale={2}
										InputProps={{ startAdornment: "$" }}
										fullWidth
										placeholder="Ingrese un monto"
										name={patrimonioFinalReclamante.name}
									/>
								</Grid>
							</Grid>
						</Grid>
					</Grid>
				)}
				<Divider />

				<Grid>
					<FormControlLabel
						name={isVivienda.name}
						control={
							<Switch
								checked={fieldIsVivienda.value}
								onChange={(e) => {
									helperIsVivienda.setValue(e.target.checked);
								}}
							/>
						}
						label={isVivienda.label}
						labelPlacement="end"
					/>
				</Grid>
				{fieldIsVivienda.value && (
					<Grid container spacing={2} alignItems="center">
						<Grid item xs={12} lg={6}>
							<Grid container spacing={2} alignItems="center">
								<Grid item xs={12} lg={3}>
									<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>{cantMesesAtribucionVivienda.label}:</InputLabel>
								</Grid>
								<Grid item xs={12} lg={9}>
									<InputField
										InputProps={{ startAdornment: <Calendar /> }}
										fullWidth
										placeholder="Ingrese una cantidad"
										name={cantMesesAtribucionVivienda.name}
									/>
								</Grid>
							</Grid>
						</Grid>
						<Grid item xs={12} lg={6}>
							<Grid container spacing={2} alignItems="center">
								<Grid item xs={12} lg={3}>
									<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>{porcentajeInmuebleOCanon.label}:</InputLabel>
								</Grid>
								<Grid item xs={12} lg={9}>
									<InputField
										InputProps={{ startAdornment: "%" }}
										fullWidth
										placeholder="Ingrese un porcentaje"
										name={porcentajeInmuebleOCanon.name}
									/>
								</Grid>
							</Grid>
						</Grid>
						<Grid item xs={12} lg={6}>
							<Grid container spacing={2} alignItems="center">
								<Grid item xs={12} lg={3}>
									<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>{valorCanon.label}:</InputLabel>
								</Grid>
								<Grid item xs={12} lg={9}>
									<InputField InputProps={{ startAdornment: "$" }} fullWidth placeholder="Ingrese un monto" name={valorCanon.name} />
								</Grid>
							</Grid>
						</Grid>
						<Grid item xs={12} lg={6}>
							<Grid container spacing={2} alignItems="center">
								<Grid item xs={12} lg={3}>
									<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>{cantidadHijos.label}:</InputLabel>
								</Grid>
								<Grid item xs={12} lg={9}>
									<InputField
										InputProps={{ startAdornment: <Profile2User /> }}
										fullWidth
										placeholder="Ingrese un monto"
										name={cantidadHijos.name}
									/>
								</Grid>
							</Grid>
						</Grid>
						<Grid item xs={12} lg={6}>
							<Grid container spacing={2} alignItems="center">
								<Grid item xs={12} lg={3}>
									<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>{cantidadOtrosFamiliares.label}:</InputLabel>
								</Grid>
								<Grid item xs={12} lg={9}>
									<InputField
										InputProps={{ startAdornment: <Profile2User /> }}
										fullWidth
										placeholder="Ingrese un monto"
										name={cantidadOtrosFamiliares.name}
									/>
								</Grid>
							</Grid>
						</Grid>
					</Grid>
				)}
				<Divider />
			</Grid>
		</>
	);
}

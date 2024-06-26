import { Checkbox, Grid, InputLabel, Typography } from "@mui/material";
import LaborCheckbox from "../components/labor-chebox";
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";
import DateInputField from "components/UI/DateInputField";
import { UserSquare, Calendar2 } from "iconsax-react";

export default function FirstForm(props: any) {
	const {
		formField: { reclamado, reclamante, remuneracion, otrasSumas, fechaIngreso, fechaEgreso, dias, liquidacion },
	} = props;

	const optionsLiquidacion = [
		{ value: "preaviso", label: "Preaviso" },
		{ value: "integracionMes", label: "Integración mes" },
		{ value: "sacProp", label: "SAC proporcional" },
		{ value: "sacPreaviso", label: "SAC s/ Preaviso" },
		{ value: "diasTrabajados", label: "Días trabajados" },
		{ value: "vacaciones", label: "Vacaciones" },
	];

	return (
		<>
			<Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
				Seleccione Cálculos opcionales
			</Typography>
			<Grid item xs={12}>
				<Grid container spacing={2} alignItems="center">
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Reclamante*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<InputField
									InputProps={{ startAdornment: <UserSquare /> }}
									fullWidth
									placeholder="Ingrese un nombre"
									name={reclamante.name}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Reclamado*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<InputField
									InputProps={{ startAdornment: <UserSquare /> }}
									fullWidth
									placeholder="Ingrese un nombre"
									name={reclamado.name}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Fecha de ingreso*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<DateInputField name={fechaIngreso.name} />
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Fecha de egreso*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<DateInputField name={fechaEgreso.name} />
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Remuneración*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="00.00"
									name={remuneracion.name}
									InputProps={{ startAdornment: "$" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Otras sumas adeudadas:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="00.00"
									name={otrasSumas.name}
									InputProps={{ startAdornment: "$" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Días no trabajados:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									decimalScale={0}
									fullWidth
									placeholder="Ingrese un valor numérico mayor a 0"
									name={dias.name}
									InputProps={{ startAdornment: <Calendar2 /> }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Incluir SAC:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<Checkbox name="incluirSAC" />
							</Grid>
						</Grid>
					</Grid>
				</Grid>
			</Grid>

			<Grid item xs={12} style={{ marginTop: "35px" }}>
				<Grid>
					<LaborCheckbox name={liquidacion.name} options={optionsLiquidacion} />
				</Grid>
			</Grid>
		</>
	);
}

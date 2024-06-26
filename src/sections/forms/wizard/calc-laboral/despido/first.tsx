import { Checkbox, Grid, InputLabel, Typography } from "@mui/material";
import DateInputField from "components/UI/DateInputField";
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";

import { UserSquare, Calendar2 } from "iconsax-react";
interface FormField {
	reclamante: {
		name: string;
	};
	reclamado: {
		name: string;
	};
	remuneracion: {
		name: string;
	};
	otrasSumas: {
		name: string;
	};
	fechaIngreso: {
		name: string;
	};
	fechaEgreso: {
		name: string;
	};
	dias: {
		name: string;
	};
}

interface FirstFormProps {
	formField: FormField;
}
export default function FirstForm(props: FirstFormProps) {
	const {
		formField: { reclamado, reclamante, remuneracion, otrasSumas, fechaIngreso, fechaEgreso, dias },
	} = props;
	return (
		<>
			<Typography variant="h5" gutterBottom sx={{ mb: 2 }}>
				Datos requeridos
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
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Remuneración*</InputLabel>
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
		</>
	);
}

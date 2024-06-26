import { Grid, InputLabel, Typography } from "@mui/material";
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";
import { Calendar, UserSquare } from "iconsax-react";

interface FormField {
	reclamante: {
		name: string;
	};
	reclamado: {
		name: string;
	};
	ingresosTotales: {
		name: string;
	};
	porcentajeIncapacidad: {
		name: string;
	};
	tasaInteres: {
		name: string;
	};
	edadDesde: {
		name: string;
	};
	edadHasta: {
		name: string;
	};
}

interface FirstFormProps {
	formField: FormField;
}
export default function FirstForm(props: FirstFormProps) {
	const {
		formField: { reclamante, reclamado, ingresosTotales, porcentajeIncapacidad, tasaInteres, edadDesde, edadHasta },
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
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Ingresos totales anuales*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="00.00"
									name={ingresosTotales.name}
									InputProps={{ startAdornment: "$" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Porcentaje de incapacidad*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="Indique una edad"
									name={porcentajeIncapacidad.name}
									InputProps={{ startAdornment: "%" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Tasa de interés anual</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="Indique un porcentaje"
									name={tasaInteres.name}
									InputProps={{ startAdornment: "%" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Edad a partir de la cual se computan los ingresos*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								{/* Aca va un select */}
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={0}
									fullWidth
									placeholder="Indique la edad al accidente"
									name={edadDesde.name}
									InputProps={{ startAdornment: <Calendar /> }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Edad hasta la cual se computan los ingresos*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={0}
									fullWidth
									placeholder="Indique la edad final"
									name={edadHasta.name}
									InputProps={{ startAdornment: <Calendar /> }}
								/>
							</Grid>
						</Grid>
					</Grid>
				</Grid>
			</Grid>
		</>
	);
}

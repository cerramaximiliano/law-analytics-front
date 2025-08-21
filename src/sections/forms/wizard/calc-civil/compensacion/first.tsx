import React from "react";
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
	tasaDescuentoAnual: {
		name: string;
	};
	edadDisolucion: {
		name: string;
	};
	edadLimite: {
		name: string;
	};
	cantIngresosMensuales: {
		name: string;
	};
	probCapacitacion: {
		name: string;
	};
	ingresoMax: {
		name: string;
	};
	probIngresoMax: {
		name: string;
	};
	ingresoReal: {
		name: string;
	};
	probIngresoReal: {
		name: string;
	};
}

interface FirstFormProps {
	formField: FormField;
}
export default function FirstForm(props: FirstFormProps) {
	const {
		formField: {
			reclamante,
			reclamado,
			tasaDescuentoAnual,
			edadDisolucion,
			edadLimite,
			cantIngresosMensuales,
			probCapacitacion,
			ingresoMax,
			probIngresoMax,
			ingresoReal,
			probIngresoReal,
		},
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
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Tasa de descuento anual*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="00.00"
									name={tasaDescuentoAnual.name}
									InputProps={{ startAdornment: "%" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Edad al momento de disolución del vínculo*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={0}
									fullWidth
									placeholder="Indique una edad"
									name={edadDisolucion.name}
									InputProps={{ startAdornment: <Calendar /> }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>
									Edad límite hasta el cual se calculan los ingresos*:
								</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={0}
									fullWidth
									placeholder="Indique una edad"
									name={edadLimite.name}
									InputProps={{ startAdornment: <Calendar /> }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Cantidad de ingresos mensuales por año:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								{/* Aca va un select */}
								<InputField
									fullWidth
									placeholder="Indique una monto"
									name={cantIngresosMensuales.name}
									InputProps={{ startAdornment: "$" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>
									Probabilidad de capacitación de no haberse iniciado el vínculo conyugal*:
								</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={0}
									fullWidth
									placeholder="Indique un porcentaje"
									name={probCapacitacion.name}
									InputProps={{ startAdornment: "%" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Ingreso máximo para capacitación frustrada*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="Indique un porcentaje"
									name={ingresoMax.name}
									InputProps={{ startAdornment: "$" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Probabilidad de acceder al máximo ingreso*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="Indique un porcentaje"
									name={probIngresoMax.name}
									InputProps={{ startAdornment: "%" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Ingreso real actual sin capacitación*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="Indique un porcentaje"
									name={ingresoReal.name}
									InputProps={{ startAdornment: "$" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>
									Probabilidad de acceder o mantener el ingreso real*:
								</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="Indique un porcentaje"
									name={probIngresoReal.name}
									InputProps={{ startAdornment: "%" }}
								/>
							</Grid>
						</Grid>
					</Grid>
				</Grid>
			</Grid>
		</>
	);
}

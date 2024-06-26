import { Grid, InputLabel, Typography } from "@mui/material";
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";

import { UserSquare } from "iconsax-react";
interface FormField {
	reclamante: {
		name: string;
	};
	reclamado: {
		name: string;
	};
	compensacion: {
		name: string;
	};
	probabilidadPunitivos: {
		name: string;
	};
	probabilidadDsPs: {
		name: string;
	};
	nivelPrecaucion: {
		name: string;
	};
	porcentajeMin: {
		name: string;
	};
	probOcurrencia: {
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
			compensacion,
			probabilidadPunitivos,
			probabilidadDsPs,
			nivelPrecaucion,
			porcentajeMin,
			probOcurrencia,
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
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Reclamante:</InputLabel>
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
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Reclamado:</InputLabel>
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
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Compensación por daños y perjuicios*</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="00.00"
									name={compensacion.name}
									InputProps={{ startAdornment: "$" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Probabilidad de condena por daños y perjuicios*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="Indique un porcentaje"
									name={probabilidadDsPs.name}
									InputProps={{ startAdornment: "%" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Probabilidad de condena por daños punitivos*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="Indique un porcentaje"
									name={probabilidadPunitivos.name}
									InputProps={{ startAdornment: "%" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Nivel de precaución socialmente deseable*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="Indique una cuantía"
									name={nivelPrecaucion.name}
									InputProps={{ startAdornment: "$" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Porcentaje mínimo de nivel de precaución*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="Indique un porcentaje"
									name={porcentajeMin.name}
									InputProps={{ startAdornment: "%" }}
								/>
							</Grid>
						</Grid>
					</Grid>
					<Grid item xs={12} lg={6}>
						<Grid container spacing={2} alignItems="center">
							<Grid item xs={12} lg={3}>
								<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Probabilidad de ocurrencia del daño*:</InputLabel>
							</Grid>
							<Grid item xs={12} lg={9}>
								<NumberField
									thousandSeparator={","}
									allowNegative={false}
									allowLeadingZeros={false}
									decimalScale={2}
									fullWidth
									placeholder="Indique un porcentaje"
									name={probOcurrencia.name}
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

import { Grid, InputLabel, Typography } from "@mui/material";
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";
import SelectField from "components/UI/SelectField";
import "dayjs/locale/es";
import { esES } from "@mui/x-date-pickers/locales";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { UserSquare } from "iconsax-react";
import DateInputField from "components/UI/DateInputField";

interface FormField {
	reclamante: {
		name: string;
	};
	reclamado: {
		name: string;
	};
	tasa: {
		name: string;
	};
	capital: {
		name: string;
	};
	fechaInicial: {
		name: string;
	};
	fechaFinal: {
		name: string;
	};
}

interface FirstFormProps {
	formField: FormField;
}
export default function FirstForm(props: FirstFormProps) {
	const {
		formField: { reclamante, reclamado, fechaInicial, fechaFinal, tasa, capital },
	} = props;
	const esLocale = esES.components.MuiLocalizationProvider.defaultProps.localeText;
	return (
		<>
			<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es" localeText={esLocale}>
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
									<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Fecha inicial*:</InputLabel>
								</Grid>
								<Grid item xs={12} lg={9}>
									<DateInputField name={fechaInicial.name} />
								</Grid>
							</Grid>
						</Grid>
						<Grid item xs={12} lg={6}>
							<Grid container spacing={2} alignItems="center">
								<Grid item xs={12} lg={3}>
									<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Fecha final*:</InputLabel>
								</Grid>
								<Grid item xs={12} lg={9}>
									<DateInputField name={fechaFinal.name} />
								</Grid>
							</Grid>
						</Grid>

						<Grid item xs={12} lg={6}>
							<Grid container spacing={2} alignItems="center">
								<Grid item xs={12} lg={3}>
									<InputLabel htmlFor="folder-status">Tasa de interés*:</InputLabel>
								</Grid>
								<Grid item xs={12} lg={9}>
									<SelectField
										label="Seleccione una tasa"
										data={[
											"Tasa Pasiva BCRA",
											"Tasa Pasiva BNA",
											"Tasa Activa BNA",
											"Tasa Activa BNA -Acta 2601",
											"Tasa Activa BNA -Acta 2658",
											"ICL BCRA",
										]}
										name={tasa.name}
									></SelectField>
								</Grid>
							</Grid>
						</Grid>
						<Grid item xs={12} lg={6}>
							<Grid container spacing={2} alignItems="center">
								<Grid item xs={12} lg={3}>
									<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Capital*:</InputLabel>
								</Grid>
								<Grid item xs={12} lg={9}>
									<NumberField
										thousandSeparator={","}
										allowNegative={false}
										allowLeadingZeros={false}
										decimalScale={2}
										fullWidth
										placeholder="00.00"
										name={capital.name}
										InputProps={{ startAdornment: "$" }}
									/>
								</Grid>
							</Grid>
						</Grid>
					</Grid>
				</Grid>
			</LocalizationProvider>
		</>
	);
}

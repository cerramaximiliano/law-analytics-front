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
import { useEffect, useState } from "react";
import axios from "axios";
import { useFormikContext } from "formik";
import { actualizarRangoFechasTasa } from "./formModel/tasasFechasStore";
import moment from "moment";

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

interface TasaOpcion {
	label: string;
	value: string;
	fechaInicio: Date;
	fechaUltima: Date;
}

interface FirstFormProps {
	formField: FormField;
}

export default function FirstForm(props: FirstFormProps) {
	const {
		formField: { reclamante, reclamado, fechaInicial, fechaFinal, tasa, capital },
	} = props;

	const [tasasOpciones, setTasasOpciones] = useState<TasaOpcion[]>([]);
	const [cargandoTasas, setCargandoTasas] = useState<boolean>(true);
	const [errorTasas, setErrorTasas] = useState<string | null>(null);
	const [tasaSeleccionada, setTasaSeleccionada] = useState<TasaOpcion | null>(null);

	const esLocale = esES.components.MuiLocalizationProvider.defaultProps.localeText;

	// Obtenemos el valor actual del formulario para detectar cambios
	const { values } = useFormikContext<any>();

	useEffect(() => {
		const obtenerTasas = async () => {
			try {
				setCargandoTasas(true);
				setErrorTasas(null);

				const respuesta = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/tasas/listado`, {
					withCredentials: true,
				});

				// Convertir fechas de string a objetos Date
				const tasasConFechas = respuesta.data.map((tasa: any) => {
					// Usar moment para manejar fechas correctamente
					const fechaInicio = moment.utc(tasa.fechaInicio).startOf("day").toDate();
					const fechaUltima = moment.utc(tasa.fechaUltima).startOf("day").toDate();

					// Actualizar el mapa global de rangos de fechas
					actualizarRangoFechasTasa(tasa.value, fechaInicio, fechaUltima);

					return {
						...tasa,
						fechaInicio,
						fechaUltima,
					};
				});

				setTasasOpciones(tasasConFechas);

				// Si ya hay una tasa seleccionada en el formulario, encontrarla y establecerla
				if (values[tasa.name] && values[tasa.name] !== 0) {
					const tasaActual = tasasConFechas.find((t: TasaOpcion) => t.value === values[tasa.name]);
					if (tasaActual) {
						setTasaSeleccionada(tasaActual);
					}
				}
			} catch (error) {
				console.error("Error al cargar las tasas:", error);
				setErrorTasas("No se pudieron cargar las tasas. Por favor, intenta de nuevo más tarde.");
				// Opciones de fallback
				setTasasOpciones([
					{
						label: "Tasa Pasiva BCRA",
						value: "tasaPasivaBCRA",
						fechaInicio: new Date("2000-01-01"),
						fechaUltima: new Date(),
					},
					// Otras opciones de fallback...
				]);
			} finally {
				setCargandoTasas(false);
			}
		};

		obtenerTasas();
	}, []);

	// Efecto para actualizar tasaSeleccionada cuando cambia la selección en el formulario
	useEffect(() => {
		if (values[tasa.name] && values[tasa.name] !== 0) {
			const tasaActual = tasasOpciones.find((t) => t.value === values[tasa.name]);
			if (tasaActual) {
				setTasaSeleccionada(tasaActual);
			}
		} else {
			setTasaSeleccionada(null);
		}
	}, [values[tasa.name], tasasOpciones]);

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
									<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Tasa de interés*:</InputLabel>
								</Grid>
								<Grid item xs={12} lg={9}>
									<SelectField label="Seleccione una tasa" data={tasasOpciones} name={tasa.name} disabled={cargandoTasas} />
									<div>
										{errorTasas && (
											<Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
												{errorTasas}
											</Typography>
										)}
										{tasaSeleccionada && !errorTasas && (
											<Typography variant="caption" sx={{ display: "block", mt: 1 }}>
												Datos disponibles desde{" "}
												{new Date(
													tasaSeleccionada.fechaInicio.getTime() + tasaSeleccionada.fechaInicio.getTimezoneOffset() * 60000,
												).toLocaleDateString()}{" "}
												hasta{" "}
												{new Date(
													tasaSeleccionada.fechaUltima.getTime() + tasaSeleccionada.fechaUltima.getTimezoneOffset() * 60000,
												).toLocaleDateString()}
											</Typography>
										)}
									</div>
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
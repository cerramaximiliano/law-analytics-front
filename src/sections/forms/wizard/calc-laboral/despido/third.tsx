import { useState, useEffect } from "react";
import { Grid, InputLabel, Typography, Box, Switch, FormControlLabel, Paper, useTheme } from "@mui/material";
import DateInputField from "components/UI/DateInputField";
import SelectField from "components/UI/SelectField";
import { useFormikContext } from "formik";
import axios from "axios";
import moment from "moment";

// Almacenamiento de rangos de fechas para las tasas
interface RangoFechas {
	fechaInicio: Date;
	fechaUltima: Date;
}

interface TasaOpcion {
	label: string;
	value: string;
	fechaInicio: Date;
	fechaUltima: Date;
}

interface FormField {
	aplicarIntereses: {
		name: string;
	};
	fechaInicialIntereses: {
		name: string;
	};
	fechaFinalIntereses: {
		name: string;
	};
	tasaIntereses: {
		name: string;
	};
	fechaEgreso: {
		name: string;
	};
}

interface ThirdFormProps {
	formField: FormField;
}

const tasasFechasRangoMap = new Map<string, RangoFechas>();

const actualizarRangoFechasTasa = (tipoTasa: string, fechaInicio: Date, fechaUltima: Date) => {
	tasasFechasRangoMap.set(tipoTasa, { fechaInicio, fechaUltima });
};

// Removed unused function: obtenerRangoFechasTasa

export default function ThirdForm(props: ThirdFormProps) {
	const {
		formField: { aplicarIntereses, fechaInicialIntereses, fechaFinalIntereses, tasaIntereses, fechaEgreso },
	} = props;

	const theme = useTheme();
	const [tasasOpciones, setTasasOpciones] = useState<TasaOpcion[]>([]);
	const [cargandoTasas, setCargandoTasas] = useState<boolean>(true);
	const [errorTasas, setErrorTasas] = useState<string | null>(null);
	const [tasaSeleccionada, setTasaSeleccionada] = useState<TasaOpcion | null>(null);

	const { values, setFieldValue, setFieldError, setFieldTouched, validateForm } = useFormikContext<any>();

	// Manejar el cambio de aplicar intereses
	const handleAplicarInteresesChange = async (event: React.ChangeEvent<HTMLInputElement>) => {
		const checked = event.target.checked;
		setFieldValue(aplicarIntereses.name, checked);

		// Si se desactiva, limpiar los otros campos y errores de validación
		if (!checked) {
			setFieldValue(fechaInicialIntereses.name, "");
			setFieldValue(fechaFinalIntereses.name, "");
			setFieldValue(tasaIntereses.name, "");
			// Limpiar errores de validación
			setFieldError(fechaInicialIntereses.name, undefined);
			setFieldError(fechaFinalIntereses.name, undefined);
			setFieldError(tasaIntereses.name, undefined);
			// Marcar los campos como no tocados para evitar validaciones
			setFieldTouched(fechaInicialIntereses.name, false);
			setFieldTouched(fechaFinalIntereses.name, false);
			setFieldTouched(tasaIntereses.name, false);
		} else if (values[fechaEgreso.name]) {
			// Si se activa y hay fecha de egreso, establecer la fecha inicial de interés igual a la fecha de egreso
			setFieldValue(fechaInicialIntereses.name, values[fechaEgreso.name]);

			// Establecer la fecha final como la fecha actual
			const hoy = moment().format("DD/MM/YYYY");
			setFieldValue(fechaFinalIntereses.name, hoy);
		}

		// Forzar revalidación del formulario después de los cambios
		setTimeout(() => {
			validateForm();
		}, 0);
	};

	// Efecto para cargar las tasas al montar el componente
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
				if (values[tasaIntereses.name] && values[tasaIntereses.name] !== "") {
					const tasaActual = tasasConFechas.find((t: TasaOpcion) => t.value === values[tasaIntereses.name]);
					if (tasaActual) {
						setTasaSeleccionada(tasaActual);
					}
				}
			} catch (error) {
				setErrorTasas("No se pudieron cargar las tasas. Por favor, intenta de nuevo más tarde.");
				// Opciones de fallback
				setTasasOpciones([
					{
						label: "Tasa Pasiva BCRA",
						value: "tasaPasivaBCRA",
						fechaInicio: new Date("2000-01-01"),
						fechaUltima: new Date(),
					},
					{
						label: "Acta 2601",
						value: "acta2601",
						fechaInicio: new Date("2000-01-01"),
						fechaUltima: new Date(),
					},
					{
						label: "Acta 2630",
						value: "acta2630",
						fechaInicio: new Date("2000-01-01"),
						fechaUltima: new Date(),
					},
				]);
			} finally {
				setCargandoTasas(false);
			}
		};

		obtenerTasas();
	}, []);

	// Efecto para actualizar tasaSeleccionada cuando cambia la selección en el formulario
	useEffect(() => {
		if (values[tasaIntereses.name] && values[tasaIntereses.name] !== "") {
			const tasaActual = tasasOpciones.find((t) => t.value === values[tasaIntereses.name]);
			if (tasaActual) {
				setTasaSeleccionada(tasaActual);
			}
		} else {
			setTasaSeleccionada(null);
		}
	}, [values[tasaIntereses.name], tasasOpciones]);

	// Removed unused function: obtenerLimitesFechasParaTasa

	const isInterestSectionEnabled = values[aplicarIntereses.name];

	return (
		<>
			<Typography variant="h5" gutterBottom>
				Actualización por Intereses
			</Typography>

			<Paper
				elevation={0}
				sx={{
					p: 3,
					mb: 3,
					bgcolor: theme.palette.background.default,
					borderRadius: 2,
				}}
			>
				<Typography variant="body2" color="textSecondary" paragraph>
					Puede actualizar el monto calculado aplicando intereses desde una fecha determinada hasta la fecha actual o una fecha específica.
					Seleccione la tasa de interés que desea aplicar.
				</Typography>

				<FormControlLabel
					control={<Switch checked={values[aplicarIntereses.name]} onChange={handleAplicarInteresesChange} color="primary" />}
					label="Aplicar intereses al monto calculado"
				/>
			</Paper>

			{isInterestSectionEnabled && (
				<Box sx={{ mt: 3 }}>
					<Grid container spacing={2} alignItems="center">
						<Grid item xs={12} lg={6}>
							<Grid container spacing={2} alignItems="center">
								<Grid item xs={12} lg={3}>
									<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Fecha inicial*:</InputLabel>
								</Grid>
								<Grid item xs={12} lg={9}>
									<DateInputField name={fechaInicialIntereses.name} disabled={!isInterestSectionEnabled} fullWidth />
								</Grid>
							</Grid>
						</Grid>

						<Grid item xs={12} lg={6}>
							<Grid container spacing={2} alignItems="center">
								<Grid item xs={12} lg={3}>
									<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Fecha final*:</InputLabel>
								</Grid>
								<Grid item xs={12} lg={9}>
									<DateInputField name={fechaFinalIntereses.name} disabled={!isInterestSectionEnabled} fullWidth />
								</Grid>
							</Grid>
						</Grid>

						<Grid item xs={12} lg={6}>
							<Grid container spacing={2} alignItems="center">
								<Grid item xs={12} lg={3}>
									<InputLabel sx={{ textAlign: { xs: "left", sm: "right" } }}>Tasa de interés*:</InputLabel>
								</Grid>
								<Grid item xs={12} lg={9}>
									<SelectField
										label="Seleccione una tasa"
										data={tasasOpciones}
										name={tasaIntereses.name}
										disabled={cargandoTasas || !isInterestSectionEnabled}
									/>
									{errorTasas && (
										<Typography variant="caption" color="error" sx={{ mt: 1, display: "block" }}>
											{errorTasas}
										</Typography>
									)}
									{tasaSeleccionada && !errorTasas && (
										<Typography variant="caption" sx={{ display: "block", mt: 1 }}>
											Rango válido: {moment(tasaSeleccionada.fechaInicio).format("DD/MM/YYYY")} -{" "}
											{moment(tasaSeleccionada.fechaUltima).format("DD/MM/YYYY")}
										</Typography>
									)}
								</Grid>
							</Grid>
						</Grid>
					</Grid>

					{/* Resumen de datos de intereses */}
					{values[fechaInicialIntereses.name] && values[fechaFinalIntereses.name] && values[tasaIntereses.name] && (
						<Paper elevation={0} sx={{ mt: 3, p: 2, bgcolor: theme.palette.primary.lighter, borderRadius: 2 }}>
							<Typography variant="subtitle2" color="primary.dark" gutterBottom>
								Resumen de intereses
							</Typography>
							<Grid container spacing={2}>
								<Grid item xs={12} md={4}>
									<Typography variant="body2">
										<strong>Fecha inicial:</strong> {values[fechaInicialIntereses.name]}
									</Typography>
								</Grid>
								<Grid item xs={12} md={4}>
									<Typography variant="body2">
										<strong>Fecha final:</strong> {values[fechaFinalIntereses.name]}
									</Typography>
								</Grid>
								<Grid item xs={12} md={4}>
									<Typography variant="body2">
										<strong>Tasa:</strong>{" "}
										{tasasOpciones.find((t) => t.value === values[tasaIntereses.name])?.label || values[tasaIntereses.name]}
									</Typography>
								</Grid>
							</Grid>
						</Paper>
					)}
				</Box>
			)}
		</>
	);
}

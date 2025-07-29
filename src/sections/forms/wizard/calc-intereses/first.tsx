import { Grid, InputLabel, Typography, Divider, Box, alpha, useTheme } from "@mui/material";
import InputField from "components/UI/InputField";
import NumberField from "components/UI/NumberField";
import SelectField from "components/UI/SelectField";
import "dayjs/locale/es";
import { esES } from "@mui/x-date-pickers/locales";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { UserSquare, DocumentText } from "iconsax-react";
import DateInputField from "components/UI/DateInputField";
import { useEffect, useState } from "react";
import { useFormikContext } from "formik";
import { actualizarRangoFechasTasa } from "./formModel/tasasFechasStore";
import LinkCauseSelector from "./components/LinkCauseSelector";
import { useSelector, dispatch } from "store";
import { getInterestRates } from "store/reducers/interestRates";

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

	const [tasaSeleccionada, setTasaSeleccionada] = useState<TasaOpcion | null>(null);
	const [inputMethod, setInputMethod] = useState<"manual" | "causa">("manual");
	const [selectedFolder, setSelectedFolder] = useState<any>(null);

	// Obtener datos del store
	const user = useSelector((state) => state.auth.user);
	const userId = user?._id;
	const { rates: tasasOpciones, isLoading: cargandoTasas, error: errorTasas, isInitialized } = useSelector((state) => state.interestRates);

	const esLocale = esES.components.MuiLocalizationProvider.defaultProps.localeText;
	const theme = useTheme();

	// Obtenemos el valor actual del formulario para detectar cambios
	const { values, setFieldValue } = useFormikContext<any>();

	// Manejador para el cambio de método de entrada
	const handleMethodChange = (method: "manual" | "causa", folder: any, folderData?: { folderId: string; folderName: string }) => {
		setInputMethod(method);
		setSelectedFolder(folder);

		if (method === "causa" && folder) {
			// Si se ha seleccionado una causa, establecer los valores de reclamante/reclamado como
			// campos especiales para indicar que se está utilizando una causa vinculada
			setFieldValue(reclamante.name, `__CAUSA_VINCULADA__${folder._id}`);
			setFieldValue(reclamado.name, `__CAUSA_VINCULADA__${folder._id}`);

			// Almacenar folderId y folderName para guardarlos en la base de datos
			if (folderData) {
				// Guardar estos valores en campos ocultos o estado del formulario
				// para que estén disponibles al guardar
				setFieldValue("folderId", folderData.folderId);
				setFieldValue("folderName", folderData.folderName);
			}
		} else if (method === "manual") {
			// Si se cambia a modo manual, limpiar los campos
			setFieldValue(reclamante.name, "");
			setFieldValue(reclamado.name, "");
			// Limpiar los campos de vinculación de carpeta
			setFieldValue("folderId", "");
			setFieldValue("folderName", "");
		}
	};

	// Cargar tasas del store
	useEffect(() => {
		if (userId && !isInitialized) {
			dispatch(getInterestRates(userId));
		}
	}, [userId, isInitialized]);

	// Actualizar el mapa global de rangos de fechas cuando se cargan las tasas
	useEffect(() => {
		tasasOpciones.forEach((tasa) => {
			actualizarRangoFechasTasa(tasa.value, tasa.fechaInicio, tasa.fechaUltima);
		});

		// Si ya hay una tasa seleccionada en el formulario, encontrarla y establecerla
		if (values[tasa.name] && values[tasa.name] !== 0) {
			const tasaActual = tasasOpciones.find((t: TasaOpcion) => t.value === values[tasa.name]);
			if (tasaActual) {
				setTasaSeleccionada(tasaActual);
			}
		}
	}, [tasasOpciones, values, tasa.name]);

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

				{/* Selector de método de entrada */}
				<LinkCauseSelector requiereField={reclamante.name} requeridoField={reclamado.name} onMethodChange={handleMethodChange} />

				<Divider sx={{ my: 3 }} />

				<Grid container spacing={2} alignItems="center">
					{/* Sección reclamante/reclamado o causa vinculada */}
					{inputMethod === "causa" && selectedFolder ? (
						<Grid item xs={12}>
							<Box sx={{ mb: 4 }}>
								<Typography variant="subtitle1" color="primary" gutterBottom>
									Causa vinculada
								</Typography>
								<Box
									sx={{
										p: 2,
										bgcolor: alpha(theme.palette.primary.main, 0.08),
										borderRadius: 1,
										border: `1px solid ${theme.palette.primary.main}`,
										display: "flex",
										alignItems: "center",
										gap: 2,
									}}
								>
									<DocumentText size={20} variant="Bold" />
									<Typography variant="body1" fontWeight={500}>
										{selectedFolder.folderName}
									</Typography>
									{selectedFolder.materia && (
										<Typography variant="body2" sx={{ ml: 1, color: "text.secondary" }}>
											({selectedFolder.materia})
										</Typography>
									)}
								</Box>
							</Box>
						</Grid>
					) : (
						<>
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
						</>
					)}

					{/* Campos de fechas */}
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

					{/* Campos de tasa y capital */}
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
			</LocalizationProvider>
		</>
	);
}

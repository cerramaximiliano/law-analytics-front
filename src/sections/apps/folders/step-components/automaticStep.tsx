import React from "react";
import {
	Grid,
	Stack,
	InputLabel,
	DialogContent,
	Typography,
	Alert,
	MenuItem,
	Select,
	FormControl,
	SelectChangeEvent,
	Collapse,
	CircularProgress,
	Box,
} from "@mui/material";
import { DocumentUpload } from "iconsax-react";
import { useTheme } from "@mui/material/styles";
import { useFormikContext } from "formik";
import InputField from "components/UI/InputField";
import { useState, useEffect, useRef } from "react";
import mevWorkersService, { NavigationCode } from "api/workersMev";

const customInputStyles = {
	"& .MuiInputBase-root": {
		height: 39.91,
	},
	"& .MuiInputBase-input": {
		fontSize: 12,
	},
	"& input::placeholder": {
		color: "#000000",
		opacity: 0.6,
	},
};

// Lista de jurisdicciones del Poder Judicial de la Nación
const jurisdicciones = [
	{
		value: "",
		nombre: "Seleccione una jurisdicción",
	},
	/* {
    value: "0",
    nombre: "CSJ - Corte Suprema de Justicia de la Nación",
  }, */
	{
		value: "1",
		nombre: "CIV - Cámara Nacional de Apelaciones en lo Civil",
	},
	/*{ 
    value: "2",
    nombre: "CAF - Cámara Nacional de Apelaciones en lo Contencioso Administrativo Federal",
  },
  {
    value: "3",
    nombre: "CCF - Cámara Nacional de Apelaciones en lo Civil y Comercial Federal",
  },
  {
    value: "4",
    nombre: "CNE - Cámara Nacional Electoral",
  }, */
	{
		value: "5",
		nombre: "CSS - Camara Federal de la Seguridad Social",
	},
	/*   {
      value: "6",
      nombre: "CPE - Cámara Nacional de Apelaciones en lo Penal Económico",
    }, */
	{
		value: "7",
		nombre: "CNT - Cámara Nacional de Apelaciones del Trabajo",
	},
	/*   {
      value: "8",
      nombre: "CFP - Camara Criminal y Correccional Federal",
    },
    {
      value: "9",
      nombre: "CCC - Camara Nacional de Apelaciones en lo Criminal y Correccional",
    }, */
	{
		value: "10",
		nombre: "COM - Cámara Nacional de Apelaciones en lo Comercial",
	},
	/*
    {
      value: "11",
      nombre: "CPF - Camara Federal de Casación Penal",
    },
    {
      value: "12",
      nombre: "CPN - Camara Nacional Casacion Penal",
    },
    {
      value: "13",
      nombre: "FBB - Justicia Federal de Bahia Blanca",
    },
    {
      value: "14",
      nombre: "FCR - Justicia Federal de Comodoro Rivadavia",
    },
    {
      value: "15",
      nombre: "FCB - Justicia Federal de Córdoba",
    },
    {
      value: "16",
      nombre: "FCT - Justicia Federal de Corrientes",
    },
    {
      value: "17",
      nombre: "FGR - Justicia Federal de General Roca",
    },
    {
      value: "18",
      nombre: "FLP - Justicia Federal de La Plata",
    },
    {
      value: "19",
      nombre: "FMP - Justicia Federal de Mar del Plata",
    },
    {
      value: "20",
      nombre: "FMZ - Justicia Federal de Mendoza",
    },
    {
      value: "21",
      nombre: "FPO - Justicia Federal de Posadas",
    },
    {
      value: "22",
      nombre: "FPA - Justicia Federal de Paraná",
    },
    {
      value: "23",
      nombre: "FRE - Justicia Federal de Resistencia",
    },
    {
      value: "24",
      nombre: "FSA - Justicia Federal de Salta",
    },
    {
      value: "25",
      nombre: "FRO - Justicia Federal de Rosario",
    },
    {
      value: "26",
      nombre: "FSM - Justicia Federal de San Martin",
    },
    {
      value: "27",
      nombre: "FTU - Justicia Federal de Tucuman",
    }, */
];

interface FormValues {
	folderJuris?: string;
	folderJurisItem?: string;
	folderJurisLabel?: string;
	expedientNumber?: string;
	expedientYear?: string;
	folderName?: string;
	materia?: string;
	orderStatus?: string;
	status?: string;
	description?: string;
	folderFuero?: string;
	source?: string;
	pjn?: boolean;
	initialDateFolder?: string;
	judicialPower?: string;
	jurisdictionBA?: string;
	organismoBA?: string;
	navigationCode?: string;
}

const AutomaticStep = () => {
	const theme = useTheme();
	const formik = useFormikContext<FormValues>();
	const { setFieldValue, values, setFieldError, touched, setTouched } = formik;

	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [yearError, setYearError] = useState("");
	const [jurisdictionError, setJurisdictionError] = useState("");
	const [numberError, setNumberError] = useState("");
	const [navigationCodes, setNavigationCodes] = useState<NavigationCode[]>([]);
	const [loadingCodes, setLoadingCodes] = useState(false);
	const [organismoError, setOrganismoError] = useState("");

	// Referencia para detectar el botón de siguiente
	const formSubmitAttempted = useRef<boolean>(false);

	// Obtener jurisdicciones únicas de Buenos Aires
	const jurisdictionsBA = React.useMemo(() => {
		const uniqueJurisdictions = new Map();
		navigationCodes.forEach((code) => {
			if (!uniqueJurisdictions.has(code.jurisdiccion.codigo)) {
				uniqueJurisdictions.set(code.jurisdiccion.codigo, code.jurisdiccion);
			}
		});
		return Array.from(uniqueJurisdictions.values()).sort((a, b) => a.nombre.localeCompare(b.nombre));
	}, [navigationCodes]);

	// Filtrar organismos de Buenos Aires basados en la jurisdicción seleccionada
	const organismosBA = React.useMemo(() => {
		if (!values.jurisdictionBA) return [];
		return navigationCodes
			.filter((code) => code.jurisdiccion.codigo === values.jurisdictionBA)
			.sort((a, b) => a.organismo.nombre.localeCompare(b.organismo.nombre));
	}, [values.jurisdictionBA, navigationCodes]);

	// Cargar códigos de navegación cuando sea Buenos Aires
	useEffect(() => {
		if (values.judicialPower === "buenosaires") {
			loadNavigationCodes();
		}
	}, [values.judicialPower]);

	const loadNavigationCodes = async () => {
		setLoadingCodes(true);
		try {
			const response = await mevWorkersService.getNavigationCodes();
			if (response.success && response.data?.codes) {
				const activeCodes = response.data.codes.filter((code) => code.activo);
				setNavigationCodes(activeCodes);
			} else {
				setError("No se pudieron cargar los organismos judiciales");
			}
		} catch (err: any) {
			setError(err.message || "Error al cargar los organismos judiciales");
		} finally {
			setLoadingCodes(false);
		}
	};

	// Función para validar el año
	const validateYear = (year: string | undefined) => {
		if (!year || year.trim() === "") {
			setYearError("El año es requerido");
			setFieldError("expedientYear", "El año es requerido");
			return false;
		}

		const currentYear = new Date().getFullYear();
		const yearNumber = parseInt(year);

		// Verificamos que tenga 4 dígitos
		if (year.length !== 4) {
			setYearError("El año debe tener 4 dígitos");
			setFieldError("expedientYear", "El año debe tener 4 dígitos");
			return false;
		}

		// Verificamos que esté en el rango correcto
		if (yearNumber < 2000 || yearNumber > currentYear) {
			setYearError(`El año debe estar entre 2000 y ${currentYear}`);
			setFieldError("expedientYear", `El año debe estar entre 2000 y ${currentYear}`);
			return false;
		}

		setYearError("");
		setFieldError("expedientYear", ""); // Limpiamos el error en Formik
		return true;
	};

	// Validar el número de expediente
	const validateExpedientNumber = (number: string | undefined) => {
		if (!number || number.trim() === "") {
			setNumberError("El número de expediente es requerido");
			setFieldError("expedientNumber", "El número de expediente es requerido");
			return false;
		}
		setNumberError("");
		setFieldError("expedientNumber", ""); // Limpiamos el error en Formik
		return true;
	};

	// Validar la jurisdicción de PJN
	const validateJurisdiction = (jurisdiction: string | undefined) => {
		if (!jurisdiction || jurisdiction === "") {
			setJurisdictionError("Debe seleccionar una jurisdicción");
			setFieldError("folderJuris", "Debe seleccionar una jurisdicción");
			return false;
		}

		// Si la jurisdicción es válida, aseguramos de limpiar errores
		setJurisdictionError("");
		setFieldError("folderJuris", ""); // Limpiamos el error en Formik
		return true;
	};

	// Validar la jurisdicción de Buenos Aires
	const validateJurisdictionBA = (jurisdiction: string | undefined) => {
		console.log("validateJurisdictionBA llamado con:", jurisdiction);

		if (!jurisdiction || jurisdiction === "") {
			console.log("ERROR: jurisdicción BA vacía");
			setJurisdictionError("Debe seleccionar una jurisdicción");
			setFieldError("jurisdictionBA", "Debe seleccionar una jurisdicción");
			return false;
		}

		// Si la jurisdicción es válida, aseguramos de limpiar errores
		console.log("OK: jurisdicción BA válida:", jurisdiction);
		setJurisdictionError("");
		setFieldError("jurisdictionBA", ""); // Limpiamos el error en Formik
		return true;
	};

	// Validar el organismo (para Buenos Aires)
	const validateOrganismo = (organismo: string | undefined) => {
		if (!organismo || organismo === "") {
			setOrganismoError("Debe seleccionar un organismo");
			setFieldError("organismoBA", "Debe seleccionar un organismo");
			return false;
		}

		// Si el organismo es válido, aseguramos de limpiar errores
		setOrganismoError("");
		setFieldError("organismoBA", ""); // Limpiamos el error en Formik
		return true;
	};

	// Función para determinar el fuero basado en la jurisdicción
	const getFueroFromJurisdiction = (jurisdiccion: string | undefined): string => {
		if (!jurisdiccion) return "Civil"; // Valor por defecto

		switch (jurisdiccion) {
			case "1":
				return "Civil";
			case "5":
				return "Seguridad Social";
			case "7":
				return "Laboral";
			default:
				return "Civil"; // Valor por defecto para otras jurisdicciones
		}
	};

	// Función para establecer los valores automáticamente
	const setAutomaticValues = () => {
		// Solo ejecutar para PJN
		if (values.judicialPower !== "nacional") {
			return;
		}

		// Validamos la jurisdicción primero
		let jurisdictionValid = values.folderJuris ? validateJurisdiction(values.folderJuris) : false;

		// Solo continuamos si tenemos los tres campos necesarios
		if (values.folderJuris && values.expedientNumber && values.expedientYear) {
			// Validamos todos los campos cuando están completos
			if (jurisdictionValid) {
				// Validamos año y número solo si la jurisdicción es válida
				const yearValid = validateYear(values.expedientYear);
				const numberValid = validateExpedientNumber(values.expedientNumber);

				// Si algún campo no es válido, no continuamos
				if (!yearValid || !numberValid) {
					setSuccess(false);
					return;
				}
			} else {
				// Si la jurisdicción no es válida, no continuamos
				setSuccess(false);
				return;
			}

			try {
				// Obtenemos el nombre de la jurisdicción seleccionada
				const jurisdiccionSeleccionada = jurisdicciones.find((j) => j.value === values.folderJuris);
				const nombreJurisdiccion = jurisdiccionSeleccionada ? jurisdiccionSeleccionada.nombre : "";

				// Determinamos el fuero basado en la jurisdicción
				const fuero = getFueroFromJurisdiction(values.folderJuris);

				// Establecemos los valores requeridos
				setFieldValue("folderName", "Pendiente"); // Valor requerido
				setFieldValue("materia", "No verificado"); // Materia igual al valor de jurisdicción
				setFieldValue("orderStatus", "No verificado"); // Valor requerido
				setFieldValue("status", "Nueva"); // Valor requerido
				setFieldValue("description", `Expediente importado desde ${nombreJurisdiccion} - Poder Judicial de la Nación`);
				setFieldValue("folderFuero", fuero); // Establecemos el fuero según la jurisdicción seleccionada

				setFieldValue("pjnCode", values.folderJuris);

				// También preparamos los datos para la integración con el sistema
				setFieldValue("folderJurisItem", values.folderJuris);
				setFieldValue("folderJurisLabel", nombreJurisdiccion);

				// Además de la info visible, vamos a cargar algunos datos básicos para los campos opcionales
				setFieldValue("initialDateFolder", new Date().toLocaleDateString("es-AR"));

				// Establecer pjn = true para indicar que los datos provienen del Poder Judicial de la Nación
				setFieldValue("pjn", true);
				setFieldValue("source", "auto");
				setFieldValue("expedientNumber", values.expedientNumber);
				setFieldValue("expedientYear", values.expedientYear);

				setSuccess(true);
				setError("");
			} catch (err) {
				setError("Error al procesar los datos del expediente.");
			}
		} else {
			setSuccess(false);
		}
	};

	// Efecto para monitorear cambios en los campos principales
	useEffect(() => {
		console.log("=== useEffect principal ===");
		console.log("judicialPower:", values.judicialPower);
		console.log("jurisdictionBA:", values.jurisdictionBA);
		console.log("organismoBA:", values.organismoBA);
		console.log("jurisdictionError actual:", jurisdictionError);

		if (values.judicialPower === "nacional") {
			// Siempre validamos la jurisdicción al cambiar cualquier campo
			const jurisdictionValid = values.folderJuris ? validateJurisdiction(values.folderJuris) : false;

			// Solo validamos los otros campos si la jurisdicción es válida y han sido tocados
			if (jurisdictionValid) {
				if (touched.expedientNumber) {
					validateExpedientNumber(values.expedientNumber);
				}
				if (touched.expedientYear) {
					validateYear(values.expedientYear);
				}
			}
		} else if (values.judicialPower === "buenosaires") {
			// Para Buenos Aires, validamos jurisdicción y organismo específicos
			let jurisdictionValid = false;
			let organismoValid = false;

			console.log(
				"Validando Buenos Aires - touched.jurisdictionBA:",
				touched.jurisdictionBA,
				"formSubmitAttempted:",
				formSubmitAttempted.current,
			);

			// Solo validar si el campo ha sido tocado o se intentó enviar el formulario
			if (touched.jurisdictionBA || formSubmitAttempted.current) {
				// Validar jurisdicción de Buenos Aires
				if (!values.jurisdictionBA || values.jurisdictionBA === "") {
					console.log("Setting jurisdiction error - BA empty");
					setJurisdictionError("Debe seleccionar una jurisdicción");
					setFieldError("jurisdictionBA", "Debe seleccionar una jurisdicción");
					jurisdictionValid = false;
				} else {
					console.log("Clearing jurisdiction error - BA has value:", values.jurisdictionBA);
					setJurisdictionError("");
					setFieldError("jurisdictionBA", "");
					jurisdictionValid = true;
				}
			} else {
				// Si no ha sido tocado, no mostrar error pero verificar si tiene valor
				if (values.jurisdictionBA && values.jurisdictionBA !== "") {
					jurisdictionValid = true;
					// Limpiar errores si hay valor
					setJurisdictionError("");
					setFieldError("jurisdictionBA", "");
				}
			}

			// Solo validar organismo si el campo ha sido tocado o se intentó enviar
			if (touched.organismoBA || formSubmitAttempted.current) {
				if (!values.organismoBA || values.organismoBA === "") {
					setOrganismoError("Debe seleccionar un organismo");
					setFieldError("organismoBA", "Debe seleccionar un organismo");
					organismoValid = false;
				} else {
					setOrganismoError("");
					setFieldError("organismoBA", "");
					organismoValid = true;
				}
			} else {
				// Si no ha sido tocado, no mostrar error pero verificar si tiene valor
				if (values.organismoBA && values.organismoBA !== "") {
					organismoValid = true;
					// Limpiar errores si hay valor
					setOrganismoError("");
					setFieldError("organismoBA", "");
				}
			}

			if (jurisdictionValid && organismoValid) {
				if (touched.expedientNumber) {
					validateExpedientNumber(values.expedientNumber);
				}
				if (touched.expedientYear) {
					validateYear(values.expedientYear);
				}

				// Si todos los campos están completos y válidos, establecer valores automáticos para Buenos Aires
				if (values.expedientNumber && values.expedientYear) {
					const yearValid = validateYear(values.expedientYear);
					const numberValid = validateExpedientNumber(values.expedientNumber);

					if (yearValid && numberValid) {
						// Establecer valores automáticos para Buenos Aires
						setFieldValue("source", "auto");
						setFieldValue("mev", true);
						setFieldValue("initialDateFolder", new Date().toLocaleDateString("es-AR"));

						// Valores requeridos para la carpeta
						if (!values.folderName || values.folderName === "") {
							setFieldValue("folderName", "Pendiente");
						}
						if (!values.materia || values.materia === "") {
							setFieldValue("materia", "No verificado");
						}
						if (!values.orderStatus || values.orderStatus === "") {
							setFieldValue("orderStatus", "No verificado");
						}
						if (!values.status || values.status === "") {
							setFieldValue("status", "Nueva");
						}

						// Descripción automática
						const selectedJurisdiction = jurisdictionsBA.find((j) => j.codigo === values.jurisdictionBA);
						const jurisdictionName = selectedJurisdiction ? selectedJurisdiction.nombre : "";
						const selectedOrganismo = navigationCodes.find((c) => c._id === values.organismoBA);
						const organismoName = selectedOrganismo ? selectedOrganismo.organismo.nombre : "";

						if (!values.description || values.description === "") {
							setFieldValue(
								"description",
								`Expediente importado desde ${jurisdictionName} - ${organismoName} - Poder Judicial de Buenos Aires`,
							);
						}

						setSuccess(true);
						setError("");
					}
				}
			}
		}

		setAutomaticValues();
	}, [
		values.folderJuris,
		values.jurisdictionBA,
		values.organismoBA,
		values.expedientNumber,
		values.expedientYear,
		touched.folderJuris,
		touched.jurisdictionBA,
		touched.organismoBA,
		touched.expedientNumber,
		touched.expedientYear,
		formSubmitAttempted.current,
	]);

	// Validar el año solo cuando cambia y se ha tocado
	useEffect(() => {
		if (values.expedientYear && touched.expedientYear) {
			validateYear(values.expedientYear);
		}
	}, [values.expedientYear, touched.expedientYear]);

	// Validar la jurisdicción solo cuando cambia y se ha tocado
	useEffect(() => {
		if (touched.folderJuris || formSubmitAttempted.current) {
			validateJurisdiction(values.folderJuris);
		}
	}, [values.folderJuris, touched.folderJuris, formSubmitAttempted.current]);

	// Validar el número solo cuando cambia y se ha tocado
	useEffect(() => {
		if (values.expedientNumber && touched.expedientNumber) {
			validateExpedientNumber(values.expedientNumber);
		}
	}, [values.expedientNumber, touched.expedientNumber]);

	// Método para interceptar la validación del formulario al hacer clic en Siguiente
	useEffect(() => {
		// Accedemos al nextButton que debería estar en algún lugar del DOM
		const nextButton =
			document.querySelector('[data-testid="next-button"]') ||
			document.querySelector(".next-button") ||
			document.querySelector('button[type="submit"]');

		if (nextButton) {
			const handleNextClick = (e: Event) => {
				// Marcamos el formulario como intentado enviar
				formSubmitAttempted.current = true;

				// Limpiamos todos los errores antes de validar nuevamente
				setYearError("");
				setNumberError("");
				setJurisdictionError("");
				setOrganismoError("");

				// Validamos según el poder judicial seleccionado
				if (values.judicialPower === "nacional") {
					// Validar campos de PJN
					validateJurisdiction(values.folderJuris);
					validateExpedientNumber(values.expedientNumber);
					validateYear(values.expedientYear);
				} else if (values.judicialPower === "buenosaires") {
					// Validar campos de Buenos Aires
					validateJurisdictionBA(values.jurisdictionBA);
					validateOrganismo(values.organismoBA);
					validateExpedientNumber(values.expedientNumber);
					validateYear(values.expedientYear);
				}

				// Marcamos todos los campos como tocados para mostrar los errores
				const touchedFields =
					values.judicialPower === "buenosaires"
						? {
								...touched,
								jurisdictionBA: true,
								organismoBA: true,
								expedientNumber: true,
								expedientYear: true,
						  }
						: {
								...touched,
								folderJuris: true,
								expedientNumber: true,
								expedientYear: true,
						  };

				setTouched(touchedFields);
			};

			nextButton.addEventListener("click", handleNextClick);

			return () => {
				nextButton.removeEventListener("click", handleNextClick);
			};
		}
	}, [values.folderJuris, values.expedientNumber, values.expedientYear]);

	// Manejar cambio en el campo de año
	const handleYearChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setFieldValue("expedientYear", value);
		// Marcamos el campo como tocado para mostrar el error si existe
		setTouched({ ...touched, expedientYear: true });
	};

	// Manejar cambio en el campo de jurisdicción
	const handleJurisdictionChange = (e: SelectChangeEvent) => {
		const value = e.target.value as string;
		setFieldValue("folderJuris", value);
		setTouched({ ...touched, folderJuris: true });
		validateJurisdiction(value);
	};

	// No validamos los campos al iniciar el componente, solo después de interactuar

	// Manejar cambio en el campo de número de expediente
	const handleNumberChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const value = e.target.value;
		setFieldValue("expedientNumber", value);
		setTouched({ ...touched, expedientNumber: true });
		validateExpedientNumber(value);
	};

	return (
		<DialogContent sx={{ p: 2.5 }}>
			<Grid container spacing={3} justifyContent="center">
				<Grid item xs={12}>
					<Stack direction="row" alignItems="center" spacing={1} sx={{ mb: 2 }}>
						<DocumentUpload size={24} color={theme.palette.primary.main} />
						<Typography variant="h6" color="textPrimary">
							{values.judicialPower === "nacional"
								? "Importar causa desde Poder Judicial de la Nación"
								: values.judicialPower === "buenosaires"
								? "Importar causa desde Poder Judicial de Buenos Aires"
								: "Importar causa desde Poder Judicial"}
						</Typography>
					</Stack>
				</Grid>

				{error && (
					<Grid item xs={12}>
						<Alert severity="error" sx={{ mb: 2 }}>
							{error}
						</Alert>
					</Grid>
				)}

				<Grid item xs={12} md={8}>
					<Alert severity="warning" sx={{ mb: 2 }}>
						El expediente debe ser de acceso público.
					</Alert>

					<Collapse in={success} timeout={500}>
						<Grid item xs={12}>
							<Alert
								severity="success"
								sx={{
									mb: 2,
									animation: success ? "fadeIn 0.5s ease-in-out" : "none",
									"@keyframes fadeIn": {
										"0%": {
											opacity: 0,
											transform: "translateY(-10px)",
										},
										"100%": {
											opacity: 1,
											transform: "translateY(0)",
										},
									},
								}}
							>
								Datos cargados exitosamente. Haga clic en el botón "Siguiente" para guardar el expediente.
							</Alert>
						</Grid>
					</Collapse>

					{loadingCodes ? (
						<Box display="flex" justifyContent="center" alignItems="center" minHeight={200}>
							<CircularProgress />
						</Box>
					) : (
						<Grid container spacing={3}>
							{values.judicialPower === "nacional" ? (
								<Grid item xs={12}>
									<Stack spacing={1.25}>
										<InputLabel htmlFor="folderJuris">Jurisdicción</InputLabel>
										<FormControl
											fullWidth
											style={{ maxHeight: "39.91px" }}
											error={Boolean(jurisdictionError && (touched.folderJuris || formSubmitAttempted.current))}
										>
											<Select
												id="folderJuris"
												name="folderJuris"
												value={values.folderJuris || ""}
												onChange={handleJurisdictionChange}
												displayEmpty
												size="small"
												renderValue={(selected) => {
													if (!selected) {
														return <em>Seleccione una jurisdicción</em>;
													}
													const selectedJurisdiction = jurisdicciones.find((j) => j.value === selected);
													return selectedJurisdiction ? selectedJurisdiction.nombre : "";
												}}
												sx={{
													"& .MuiInputBase-root": { height: 39.91 },
													"& .MuiInputBase-input": { fontSize: 12 },
													"& .MuiSelect-select.MuiSelect-outlined.MuiInputBase-input.MuiOutlinedInput-input.Mui-disabled": {
														color: "text.disabled",
													},
												}}
											>
												<MenuItem value="" disabled>
													<em>Seleccione una jurisdicción</em>
												</MenuItem>
												{jurisdicciones
													.filter((j) => j.value !== "")
													.map((jurisdiccion) => (
														<MenuItem key={jurisdiccion.value} value={jurisdiccion.value}>
															{jurisdiccion.nombre}
														</MenuItem>
													))}
											</Select>
											{jurisdictionError && (touched.folderJuris || formSubmitAttempted.current) && (
												<Typography color="error" variant="caption" sx={{ mt: 0.5 }}>
													{jurisdictionError}
												</Typography>
											)}
										</FormControl>
									</Stack>
								</Grid>
							) : values.judicialPower === "buenosaires" ? (
								<>
									{/* Jurisdicción Buenos Aires */}
									<Grid item xs={12}>
										<Stack spacing={1.25}>
											<InputLabel htmlFor="jurisdictionBA">Jurisdicción</InputLabel>
											<FormControl
												fullWidth
												style={{ maxHeight: "39.91px" }}
												error={Boolean(jurisdictionError && (touched.jurisdictionBA || formSubmitAttempted.current))}
											>
												<Select
													id="jurisdictionBA"
													name="jurisdictionBA"
													value={values.jurisdictionBA || ""}
													onChange={(e) => {
														const value = e.target.value;
														setFieldValue("jurisdictionBA", value);
														setFieldValue("organismoBA", ""); // Reset organismo
														setFieldValue("navigationCode", ""); // Reset navigationCode
														setTouched({ ...touched, jurisdictionBA: true });
														validateJurisdictionBA(value); // Usar la función correcta para Buenos Aires
													}}
													displayEmpty
													size="small"
													disabled={navigationCodes.length === 0}
													renderValue={(selected) => {
														if (!selected) {
															return <em>Seleccione una jurisdicción</em>;
														}
														const selectedJurisdiction = jurisdictionsBA.find((j) => j.codigo === selected);
														return selectedJurisdiction ? selectedJurisdiction.nombre : "";
													}}
													sx={{
														"& .MuiInputBase-root": { height: 39.91 },
														"& .MuiInputBase-input": { fontSize: 12 },
													}}
												>
													<MenuItem value="" disabled>
														<em>Seleccione una jurisdicción</em>
													</MenuItem>
													{jurisdictionsBA.map((jurisdiccion) => (
														<MenuItem key={jurisdiccion.codigo} value={jurisdiccion.codigo}>
															{jurisdiccion.nombre}
														</MenuItem>
													))}
												</Select>
												{jurisdictionError && (touched.jurisdictionBA || formSubmitAttempted.current) && (
													<>
														{console.log(
															"MOSTRANDO ERROR BA:",
															jurisdictionError,
															"touched:",
															touched.jurisdictionBA,
															"attempted:",
															formSubmitAttempted.current,
														)}
														<Typography color="error" variant="caption" sx={{ mt: 0.5 }}>
															{jurisdictionError}
														</Typography>
													</>
												)}
											</FormControl>
										</Stack>
									</Grid>

									{/* Organismo Buenos Aires */}
									<Grid item xs={12}>
										<Stack spacing={1.25}>
											<InputLabel htmlFor="organismoBA">Organismo</InputLabel>
											<FormControl
												fullWidth
												style={{ maxHeight: "39.91px" }}
												error={Boolean(organismoError && (touched.organismoBA || formSubmitAttempted.current))}
											>
												<Select
													id="organismoBA"
													name="organismoBA"
													value={values.organismoBA || ""}
													onChange={(e) => {
														const value = e.target.value;
														setFieldValue("organismoBA", value);

														// Encontrar y guardar el navigationCode
														const selectedCode = navigationCodes.find((c) => c._id === value);
														if (selectedCode) {
															setFieldValue("navigationCode", selectedCode.code);
														}

														setTouched({ ...touched, organismoBA: true });
														validateOrganismo(value);
													}}
													displayEmpty
													size="small"
													disabled={!values.jurisdictionBA}
													renderValue={(selected) => {
														if (!selected) {
															return <em>{values.jurisdictionBA ? "Seleccione un organismo" : "Seleccione primero una jurisdicción"}</em>;
														}
														const selectedOrganismo = navigationCodes.find((c) => c._id === selected);
														return selectedOrganismo ? selectedOrganismo.organismo.nombre : "";
													}}
													sx={{
														"& .MuiInputBase-root": { height: 39.91 },
														"& .MuiInputBase-input": { fontSize: 12 },
													}}
												>
													<MenuItem value="" disabled>
														<em>Seleccione un organismo</em>
													</MenuItem>
													{organismosBA.map((code) => (
														<MenuItem key={code._id} value={code._id}>
															{code.organismo.nombre}
														</MenuItem>
													))}
												</Select>
												{organismoError && (touched.organismoBA || formSubmitAttempted.current) && (
													<Typography color="error" variant="caption" sx={{ mt: 0.5 }}>
														{organismoError}
													</Typography>
												)}
											</FormControl>
										</Stack>
									</Grid>
								</>
							) : null}
							<Grid item xs={12} sm={6}>
								<Stack spacing={1.25}>
									<InputLabel htmlFor="expedientNumber">Número de Expediente</InputLabel>
									<InputField
										fullWidth
										sx={customInputStyles}
										id="expedient-number"
										placeholder="Ej. 123456"
										name="expedientNumber"
										type="number"
										onChange={handleNumberChange}
										error={Boolean(numberError && touched.expedientNumber)}
										helperText={touched.expedientNumber ? numberError : ""}
									/>
								</Stack>
							</Grid>
							<Grid item xs={12} sm={6}>
								<Stack spacing={1.25}>
									<InputLabel htmlFor="expedientYear">Año</InputLabel>
									<InputField
										fullWidth
										sx={customInputStyles}
										id="expedient-year"
										placeholder="Ej. 2023"
										name="expedientYear"
										type="number"
										onChange={handleYearChange}
										error={Boolean(yearError && touched.expedientYear)}
										helperText={touched.expedientYear ? yearError : ""}
									/>
								</Stack>
							</Grid>
						</Grid>
					)}
				</Grid>
			</Grid>
		</DialogContent>
	);
};

export default AutomaticStep;

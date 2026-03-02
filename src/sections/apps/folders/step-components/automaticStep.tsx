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
	Divider,
	ToggleButtonGroup,
	ToggleButton,
	Card,
	CardContent,
	RadioGroup,
	FormControlLabel,
	Radio,
	Button,
} from "@mui/material";
import { DocumentUpload, Link1, DocumentText1, InfoCircle, SearchNormal1, ArrowRight2 } from "iconsax-react";
import { useTheme } from "@mui/material/styles";
import { useFormikContext } from "formik";
import InputField from "components/UI/InputField";
import { useState, useEffect, useRef } from "react";
import mevWorkersService, { NavigationCode } from "api/workersMev";
import ejeWorkersService from "api/workersEje";
import PjnAccountConnect, { PjnAccountConnectRef } from "./PjnAccountConnect";
import ScbaAccountConnect, { ScbaAccountConnectRef } from "./ScbaAccountConnect";

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
	mev?: boolean;
	eje?: boolean;
	initialDateFolder?: string;
	judicialPower?: "nacional" | "buenosaires" | "caba";
	jurisdictionBA?: string;
	organismoBA?: string;
	navigationCode?: string;
	// Campos específicos para EJE (CABA)
	ejeSearchType?: "cuij" | "expediente";
	ejeCuij?: string;
}

// Modos de importación para PJN Nacional y Buenos Aires
type PjnImportMode = "connect" | "single";
type BaImportMode = "connect" | "single";

const AutomaticStep = () => {
	const theme = useTheme();
	const formik = useFormikContext<FormValues>();
	const { setFieldValue, values, setFieldError, touched, setTouched, isSubmitting } = formik;

	const [error, setError] = useState("");
	const [success, setSuccess] = useState(false);
	const [yearError, setYearError] = useState("");
	const [jurisdictionError, setJurisdictionError] = useState("");
	const [numberError, setNumberError] = useState("");
	const [navigationCodes, setNavigationCodes] = useState<NavigationCode[]>([]);
	const [loadingCodes, setLoadingCodes] = useState(false);
	const [organismoError, setOrganismoError] = useState("");

	// Modo de importación PJN: conectar cuenta o importar expediente individual
	const [pjnImportMode, setPjnImportMode] = useState<PjnImportMode>("connect");

	// Modo de importación Buenos Aires: conectar cuenta SCBA o importar expediente individual
	const [baImportMode, setBaImportMode] = useState<BaImportMode>("connect");

	// Estado para errores de EJE (CABA)
	const [cuijError, setCuijError] = useState("");

	// Referencia para detectar el botón de siguiente
	const formSubmitAttempted = useRef<boolean>(false);

	// Referencia al componente PjnAccountConnect para llamar submit desde el botón Siguiente
	const pjnAccountConnectRef = useRef<PjnAccountConnectRef>(null);

	// Referencia al componente ScbaAccountConnect para llamar submit desde el botón Siguiente
	const scbaAccountConnectRef = useRef<ScbaAccountConnectRef>(null);

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

	// Validar CUIJ para EJE (CABA)
	const validateCuij = (cuij: string | undefined) => {
		const validation = ejeWorkersService.validateCuij(cuij || "");
		if (!validation.valid) {
			setCuijError(validation.error || "CUIJ inválido");
			setFieldError("ejeCuij", validation.error || "CUIJ inválido");
			return false;
		}
		setCuijError("");
		setFieldError("ejeCuij", "");
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
			case "10":
				return "Comercial";
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
		} else if (values.judicialPower === "caba") {
			// Para CABA (EJE), validar según el tipo de búsqueda
			let isValid = false;

			if (values.ejeSearchType === "cuij") {
				// Validar CUIJ
				if (touched.ejeCuij || formSubmitAttempted.current) {
					isValid = validateCuij(values.ejeCuij);
				} else if (values.ejeCuij && values.ejeCuij !== "") {
					isValid = true;
					setCuijError("");
					setFieldError("ejeCuij", "");
				}
			} else {
				// Validar número y año
				let numberValid = false;
				let yearValid = false;

				if (touched.expedientNumber || formSubmitAttempted.current) {
					numberValid = validateExpedientNumber(values.expedientNumber);
				} else if (values.expedientNumber && values.expedientNumber !== "") {
					numberValid = true;
					setNumberError("");
					setFieldError("expedientNumber", "");
				}

				if (touched.expedientYear || formSubmitAttempted.current) {
					yearValid = validateYear(values.expedientYear);
				} else if (values.expedientYear && values.expedientYear !== "") {
					yearValid = true;
					setYearError("");
					setFieldError("expedientYear", "");
				}

				isValid = numberValid && yearValid;
			}

			if (isValid) {
				// Establecer valores automáticos para CABA (EJE)
				setFieldValue("source", "auto");
				setFieldValue("eje", true);
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
				const searchInfo = values.ejeSearchType === "cuij"
					? `CUIJ: ${values.ejeCuij}`
					: `Expediente: ${values.expedientNumber}/${values.expedientYear}`;

				if (!values.description || values.description === "") {
					setFieldValue(
						"description",
						`Expediente importado desde EJE - Poder Judicial de la Ciudad de Buenos Aires (${searchInfo})`,
					);
				}

				setSuccess(true);
				setError("");
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
		touched.ejeCuij,
		values.ejeSearchType,
		values.ejeCuij,
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
			const handleNextClick = async (e: Event) => {
				// Si estamos en modo "connect" de PJN, manejar según estado de credenciales
				if (values.judicialPower === "nacional" && pjnImportMode === "connect") {
					const canSubmit = pjnAccountConnectRef.current?.canSubmit();
					const isConnected = pjnAccountConnectRef.current?.isConnected();

					if (canSubmit) {
						// Hay credenciales para enviar: interceptar y llamar al submit del componente
						e.preventDefault();
						e.stopPropagation();
						await pjnAccountConnectRef.current!.submit();
						return;
					}

					if (!isConnected) {
						// No conectado y sin datos para enviar: bloquear avance
						e.preventDefault();
						e.stopPropagation();
						return;
					}

					// isConnected=true y canSubmit=false → credenciales ya vinculadas, dejar avanzar el wizard
					return;
				}

				// Si estamos en modo "connect" de Buenos Aires, llamar al submit del componente SCBA
				if (values.judicialPower === "buenosaires" && baImportMode === "connect") {
					e.preventDefault();
					e.stopPropagation();

					if (scbaAccountConnectRef.current?.canSubmit()) {
						await scbaAccountConnectRef.current.submit();
					}
					return;
				}

				// Marcamos el formulario como intentado enviar
				formSubmitAttempted.current = true;

				// Limpiamos todos los errores antes de validar nuevamente
				setYearError("");
				setNumberError("");
				setJurisdictionError("");
				setOrganismoError("");
				setCuijError("");

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
				} else if (values.judicialPower === "caba") {
					// Validar campos de CABA (EJE)
					if (values.ejeSearchType === "cuij") {
						validateCuij(values.ejeCuij);
					} else {
						validateExpedientNumber(values.expedientNumber);
						validateYear(values.expedientYear);
					}
				}

				// Marcamos todos los campos como tocados para mostrar los errores
				let touchedFields;
				if (values.judicialPower === "buenosaires") {
					touchedFields = {
						...touched,
						jurisdictionBA: true,
						organismoBA: true,
						expedientNumber: true,
						expedientYear: true,
					};
				} else if (values.judicialPower === "caba") {
					touchedFields = values.ejeSearchType === "cuij"
						? {
								...touched,
								ejeCuij: true,
						  }
						: {
								...touched,
								expedientNumber: true,
								expedientYear: true,
						  };
				} else {
					touchedFields = {
						...touched,
						folderJuris: true,
						expedientNumber: true,
						expedientYear: true,
					};
				}

				setTouched(touchedFields);
			};

			nextButton.addEventListener("click", handleNextClick);

			return () => {
				nextButton.removeEventListener("click", handleNextClick);
			};
		}
	}, [values.folderJuris, values.jurisdictionBA, values.organismoBA, values.expedientNumber, values.expedientYear, values.judicialPower, values.ejeSearchType, values.ejeCuij, pjnImportMode, baImportMode]);

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
								: values.judicialPower === "caba"
								? "Importar causa desde Poder Judicial de CABA (EJE)"
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
								<>
									{/* Selector de modo de importación */}
									<Grid item xs={12}>
										<Stack spacing={2}>
											<Typography variant="body2" color="text.secondary">
												Selecciona cómo deseas importar tus causas:
											</Typography>
											<ToggleButtonGroup
												value={pjnImportMode}
												exclusive
												onChange={(_, value) => {
													if (value !== null) {
														setPjnImportMode(value);
														setFieldValue("pjnImportMode", value);
													}
												}}
												fullWidth
												size="small"
											>
												<ToggleButton value="connect" sx={{ py: 1.5 }}>
													<Stack direction="row" alignItems="center" spacing={1}>
														<Link1 size={18} />
														<Typography variant="body2">Conectar mi cuenta</Typography>
													</Stack>
												</ToggleButton>
												<ToggleButton value="single" sx={{ py: 1.5 }}>
													<Stack direction="row" alignItems="center" spacing={1}>
														<DocumentText1 size={18} />
														<Typography variant="body2">Importar expediente</Typography>
													</Stack>
												</ToggleButton>
											</ToggleButtonGroup>
										</Stack>
									</Grid>

									{/* Contenido según modo seleccionado */}
									{pjnImportMode === "connect" ? (
										<Grid item xs={12}>
											<PjnAccountConnect
												ref={pjnAccountConnectRef}
												onConnectionSuccess={() => {
													// Opcional: cerrar modal o mostrar mensaje
												}}
												onSyncComplete={() => {
													// Opcional: recargar lista de carpetas
												}}
											/>
										</Grid>
									) : (
										<Grid item xs={12}>
											<Card variant="outlined" sx={{ overflow: "visible" }}>
												<CardContent sx={{ p: 1.5, "&:last-child": { pb: 1.5 } }}>
													<Stack spacing={1.25}>
														{/* Header */}
														<Stack direction="row" alignItems="center" spacing={1}>
															<DocumentText1 size={20} color={theme.palette.primary.main} />
															<Typography variant="subtitle2" fontWeight={500}>
																Importar expediente individual
															</Typography>
														</Stack>

														{/* Jurisdicción */}
														<FormControl
															fullWidth
															size="small"
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
																	"& .MuiInputBase-input": { fontSize: 12 },
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

														{/* Número y Año en una fila */}
														<Stack direction="row" spacing={1.5}>
															<InputField
																fullWidth
																size="small"
																id="expedient-number"
																label="Nº Expediente"
																placeholder="Ej. 123456"
																name="expedientNumber"
																type="number"
																onChange={handleNumberChange}
																error={Boolean(numberError && touched.expedientNumber)}
																helperText={touched.expedientNumber ? numberError : ""}
															/>
															<InputField
																fullWidth
																size="small"
																id="expedient-year"
																label="Año"
																placeholder="Ej. 2023"
																name="expedientYear"
																type="number"
																onChange={handleYearChange}
																error={Boolean(yearError && touched.expedientYear)}
																helperText={touched.expedientYear ? yearError : ""}
																sx={{ maxWidth: 120 }}
															/>
														</Stack>

														{/* Alerta de acceso público */}
														<Alert
															severity="warning"
															icon={<InfoCircle size={14} />}
															sx={{ py: 0.25, "& .MuiAlert-message": { fontSize: "0.75rem" } }}
														>
															El expediente debe ser de acceso público.
														</Alert>

														<Button
															type="submit"
															variant="contained"
															fullWidth
															size="small"
															disabled={isSubmitting}
															startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <ArrowRight2 size={16} />}
														>
															{isSubmitting ? "Procesando..." : "Siguiente"}
														</Button>
													</Stack>
												</CardContent>
											</Card>
										</Grid>
									)}
								</>
							) : values.judicialPower === "buenosaires" ? (
								<>
									{/* Selector de modo de importación Buenos Aires */}
									<Grid item xs={12}>
										<Stack spacing={2}>
											<Typography variant="body2" color="text.secondary">
												Selecciona cómo deseas importar tus causas:
											</Typography>
											<ToggleButtonGroup
												value={baImportMode}
												exclusive
												onChange={(_, value) => {
													if (value !== null) {
														setBaImportMode(value);
														setFieldValue("baImportMode", value);
													}
												}}
												fullWidth
												size="small"
											>
												<ToggleButton value="connect" sx={{ py: 1.5 }}>
													<Stack direction="row" alignItems="center" spacing={1}>
														<Link1 size={18} />
														<Typography variant="body2">Conectar mi cuenta</Typography>
													</Stack>
												</ToggleButton>
												<ToggleButton value="single" sx={{ py: 1.5 }}>
													<Stack direction="row" alignItems="center" spacing={1}>
														<DocumentText1 size={18} />
														<Typography variant="body2">Importar expediente</Typography>
													</Stack>
												</ToggleButton>
											</ToggleButtonGroup>
										</Stack>
									</Grid>

									{/* Contenido según modo seleccionado */}
									{baImportMode === "connect" ? (
										<Grid item xs={12}>
											<ScbaAccountConnect
												ref={scbaAccountConnectRef}
												onConnectionSuccess={() => {
													// Opcional: cerrar modal o mostrar mensaje
												}}
											/>
										</Grid>
									) : (
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
									)}
								</>
							) : values.judicialPower === "caba" ? (
								<>
									{/* Formulario EJE (CABA) */}
									<Grid item xs={12}>
										<Card variant="outlined" sx={{ overflow: "visible" }}>
											<CardContent sx={{ p: 2, "&:last-child": { pb: 2 } }}>
												<Stack spacing={2}>
													{/* Header */}
													<Stack direction="row" alignItems="center" spacing={1}>
														<SearchNormal1 size={20} color={theme.palette.primary.main} />
														<Typography variant="subtitle2" fontWeight={500}>
															Buscar expediente en EJE
														</Typography>
													</Stack>

													{/* Selector de tipo de búsqueda */}
													<FormControl component="fieldset">
														<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
															Seleccione cómo desea buscar el expediente:
														</Typography>
														<RadioGroup
															row
															value={values.ejeSearchType || "expediente"}
															onChange={(e) => {
																setFieldValue("ejeSearchType", e.target.value);
																// Limpiar errores al cambiar
																setCuijError("");
																setNumberError("");
																setYearError("");
															}}
														>
															<FormControlLabel
																value="expediente"
																control={<Radio size="small" />}
																label={
																	<Typography variant="body2">
																		Por Número y Año
																	</Typography>
																}
															/>
															<FormControlLabel
																value="cuij"
																control={<Radio size="small" />}
																label={
																	<Typography variant="body2">
																		Por CUIJ
																	</Typography>
																}
															/>
														</RadioGroup>
													</FormControl>

													<Divider />

													{/* Campos según tipo de búsqueda */}
													{values.ejeSearchType === "cuij" ? (
														<Stack spacing={1.5}>
															<InputField
																fullWidth
																size="small"
																id="eje-cuij"
																label="CUIJ (Código Único de Identificación Judicial)"
																placeholder="J-01-00053687-9/2020-0"
																name="ejeCuij"
																onChange={(e: React.ChangeEvent<HTMLInputElement>) => {
																	setFieldValue("ejeCuij", e.target.value);
																	setTouched({ ...touched, ejeCuij: true });
																	if (e.target.value) {
																		validateCuij(e.target.value);
																	}
																}}
																error={Boolean(cuijError && touched.ejeCuij)}
																helperText={touched.ejeCuij && cuijError ? cuijError : "Formato: J-XX-XXXXXXXX-X/AAAA-X (ej: J-01-00053687-9/2020-0)"}
															/>
														</Stack>
													) : (
														<Stack direction="row" spacing={1.5}>
															<InputField
																fullWidth
																size="small"
																id="eje-expedient-number"
																label="Nº Expediente"
																placeholder="Ej. 123456"
																name="expedientNumber"
																type="number"
																onChange={handleNumberChange}
																error={Boolean(numberError && touched.expedientNumber)}
																helperText={touched.expedientNumber ? numberError : ""}
															/>
															<InputField
																fullWidth
																size="small"
																id="eje-expedient-year"
																label="Año"
																placeholder="Ej. 2023"
																name="expedientYear"
																type="number"
																onChange={handleYearChange}
																error={Boolean(yearError && touched.expedientYear)}
																helperText={touched.expedientYear ? yearError : ""}
																sx={{ maxWidth: 120 }}
															/>
														</Stack>
													)}

													{/* Alerta informativa */}
													<Alert
														severity="info"
														icon={<InfoCircle size={14} />}
														sx={{ py: 0.25, "& .MuiAlert-message": { fontSize: "0.75rem" } }}
													>
														Los datos del expediente se importarán desde el sistema EJE de la Ciudad de Buenos Aires.
													</Alert>
												</Stack>
											</CardContent>
										</Card>
									</Grid>
								</>
							) : null}

							{/* Campos de número y año - solo para Buenos Aires en modo "single" (Nacional los tiene dentro de la Card) */}
							{values.judicialPower === "buenosaires" && baImportMode === "single" && (
								<>
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
									{/* Alerta de acceso público */}
									<Grid item xs={12}>
										<Alert
											severity="warning"
											icon={<InfoCircle size={14} />}
											sx={{ py: 0.25, "& .MuiAlert-message": { fontSize: "0.75rem" } }}
										>
											El expediente debe ser de acceso público.
										</Alert>
									</Grid>

									<Grid item xs={12}>
										<Button
											type="submit"
											variant="contained"
											fullWidth
											size="small"
											disabled={isSubmitting}
											startIcon={isSubmitting ? <CircularProgress size={16} color="inherit" /> : <ArrowRight2 size={16} />}
										>
											{isSubmitting ? "Procesando..." : "Siguiente"}
										</Button>
									</Grid>
								</>
							)}
						</Grid>
					)}
				</Grid>
			</Grid>
		</DialogContent>
	);
};

export default AutomaticStep;

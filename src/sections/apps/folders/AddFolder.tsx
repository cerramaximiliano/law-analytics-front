import React from "react";
//AddFolder.tsx
import { useEffect, useState } from "react";
import {
	Button,
	DialogActions,
	DialogTitle,
	DialogContent,
	Grid,
	Stack,
	Tooltip,
	Typography,
	Box,
	IconButton,
	Zoom,
	useTheme,
	CircularProgress,
	Backdrop,
	Skeleton,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import { BRAND_BLUE } from "themes/dashboardTokens";
import merge from "lodash/merge";
import * as Yup from "yup";
import { Form, Formik, FormikValues } from "formik";
import { Trash, ArrowRight2, ArrowLeft2, FolderAdd } from "iconsax-react";
import InitialStep from "./step-components/initialStep";
import AutomaticStep from "./step-components/automaticStep";
import FirstStep from "./step-components/firstStep";
import SecondStep from "./step-components/secondStep";
import JudicialPowerSelection from "./step-components/judicialPowerSelection";
import { dispatch } from "store";
import { addFolder, updateFolderById } from "store/reducers/folder";
import { fetchPjnSiteStatus } from "store/reducers/pjnSiteStatus";
import { enqueueSnackbar } from "notistack";
import AlertFolderDelete from "./AlertFolderDelete";
import { PropsAddFolder } from "types/folders";
import ApiService from "store/reducers/ApiService";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import dayjs from "utils/dayjs-config";
import folderData from "data/folder.json";
import { useTeam } from "contexts/TeamContext";

const getInitialValues = (
	folder: FormikValues | null,
	overrides?: { entryMethod?: string; judicialPower?: string; pjnImportMode?: string; baImportMode?: string },
) => {
	const newFolder = {
		folderName: "",
		description: "",
		orderStatus: "",
		status: "",
		materia: null,
		initialDateFolder: "",
		finalDateFolder: "",
		folderJurisItem: "",
		folderJurisLabel: "",
		folderJuris: null,
		folderFuero: null,
		entryMethod: overrides?.entryMethod ?? "manual", // Nuevo campo para seleccionar el método de ingreso
		judicialPower: overrides?.judicialPower ?? "", // Poder judicial seleccionado (nacional, buenosaires o caba)
		expedientNumber: "", // Para ingreso automático
		expedientYear: "", // Para ingreso automático
		pjn: false, // Para indicar si los datos provienen del Poder Judicial de la Nación
		mev: false, // Para indicar si los datos provienen del MEV (Buenos Aires)
		eje: false, // Para indicar si los datos provienen del EJE (CABA)
		ejeSearchType: "expediente", // Tipo de búsqueda para EJE: "cuij" o "expediente"
		ejeCuij: "", // CUIJ para búsqueda en EJE
		pjnImportMode: overrides?.pjnImportMode ?? "connect", // Modo de importación PJN: "connect" o "single"
		baImportMode: overrides?.baImportMode ?? "connect", // Modo de importación BA: "connect" o "single"
		mevUsername: "", // Credencial del portal MEV del usuario (importar expediente individual)
		mevPassword: "", // Contraseña del portal MEV del usuario
		hasGlobalMevCred: false, // true si el usuario ya tiene credencial MEV global vinculada
	};

	if (folder) {
		// Buscar la jurisdicción actualizada en los datos actuales
		let updatedJuris = null;
		if (folder?.folderJuris?.item) {
			// Buscar por item en los datos actuales de jurisdicciones
			updatedJuris = folderData.jurisdicciones.find((juris: any) => juris.item === folder.folderJuris.item);
		}

		return merge({}, newFolder, {
			...folder,
			folderJurisItem: folder?.folderJuris?.item ?? "",
			folderJurisLabel: updatedJuris?.label ?? folder?.folderJuris?.label ?? "",
			// Usar la jurisdicción actualizada si la encontramos, sino usar la original
			folderJuris: updatedJuris || folder?.folderJuris || null,
			entryMethod: "manual", // Si estamos editando, siempre usamos el método manual
			// Formatear las fechas a DD/MM/YYYY ignorando la zona horaria
			initialDateFolder: folder.initialDateFolder ? dayjs(folder.initialDateFolder).format("DD/MM/YYYY") : "",
			finalDateFolder: folder.finalDateFolder ? dayjs(folder.finalDateFolder).format("DD/MM/YYYY") : "",
		});
	}
	return newFolder;
};

function getStepContent(step: number, values: any) {
	// Si estamos editando, saltamos el paso de selección de método
	if (values._id) {
		switch (step) {
			case 0:
				return <FirstStep />;
			case 1:
				return <SecondStep values={values} />;
			default:
				throw new Error("Unknown step");
		}
	}

	// Si estamos creando una nueva carpeta
	switch (step) {
		case 0:
			return <InitialStep />;
		case 1:
			// Si es ingreso automático, mostramos selección de poder judicial
			// Si es ingreso manual, mostramos el primer paso manual
			return values.entryMethod === "automatic" ? <JudicialPowerSelection /> : <FirstStep />;
		case 2:
			// Para ingreso automático, mostramos el formulario de ingreso automático
			// Para ingreso manual, mostramos el segundo paso
			return values.entryMethod === "automatic" ? <AutomaticStep /> : <SecondStep values={values} />;
		case 3:
			// Solo para ingreso manual, el paso 3 es los datos opcionales
			return <SecondStep values={values} />;
		default:
			throw new Error("Unknown step");
	}
}

const AddFolder = ({ folder, onCancel, open, onAddFolder, mode, initialStep, initialFormValues }: PropsAddFolder) => {
	const { isTeamMode, activeTeam, getUserIdForResource, getTeamIdForResource, getRequestHeaders } = useTeam();
	const isCreating = mode === "add";

	// Estado para el modal de límite de recursos
	const [limitErrorOpen, setLimitErrorOpen] = useState(false);
	const [limitErrorInfo, setLimitErrorInfo] = useState<any>(null);
	const [limitErrorMessage, setLimitErrorMessage] = useState("");
	const [showAddFolderModal, setShowAddFolderModal] = useState(false);
	const [isProcessing, setIsProcessing] = useState(false);
	const [isCheckingLimit, setIsCheckingLimit] = useState(false);

	const theme = useTheme();

	// Definición de esquemas de validación para diferentes pasos
	const initialMethodSchema = Yup.object().shape({
		entryMethod: Yup.string().oneOf(["manual", "automatic"], "Seleccione un método de ingreso").required("Seleccione un método de ingreso"),
	});

	const judicialPowerSchema = Yup.object().shape({
		judicialPower: Yup.string()
			.oneOf(["nacional", "buenosaires", "caba"], "Seleccione un poder judicial")
			.required("Seleccione un poder judicial"),
	});

	// Esquema para PJN
	const automaticEntryPJNSchema = Yup.object().shape({
		folderJuris: Yup.string().required("Seleccione una jurisdicción"),
		expedientNumber: Yup.string().required("Ingrese el número de expediente"),
		expedientYear: Yup.string().required("Ingrese el año del expediente"),
	});

	// Esquema para Buenos Aires
	const automaticEntryBASchema = Yup.object().shape({
		jurisdictionBA: Yup.string().required("Seleccione una jurisdicción"),
		organismoBA: Yup.string().required("Seleccione un organismo"),
		expedientNumber: Yup.string().required("Ingrese el número de expediente"),
		expedientYear: Yup.string().required("Ingrese el año del expediente"),
		// Credenciales del portal MEV: obligatorias al importar un expediente
		// individual (el scraping usa la cuenta del usuario, sin fallback al sistema).
		// Requeridas solo al importar individual Y si el usuario NO tiene credencial
		// MEV global vinculada (en ese caso, la global cubre la causa).
		mevUsername: Yup.string().when(["baImportMode", "hasGlobalMevCred"], {
			is: (mode: string, hasGlobal: boolean) => mode === "single" && !hasGlobal,
			then: (schema) => schema.required("Ingrese su usuario del portal MEV"),
			otherwise: (schema) => schema.notRequired(),
		}),
		mevPassword: Yup.string().when(["baImportMode", "hasGlobalMevCred"], {
			is: (mode: string, hasGlobal: boolean) => mode === "single" && !hasGlobal,
			then: (schema) => schema.required("Ingrese su contraseña del portal MEV"),
			otherwise: (schema) => schema.notRequired(),
		}),
	});

	// Esquema para CABA (EJE) - validación dinámica según tipo de búsqueda
	const automaticEntryEjeSchema = Yup.object().shape({
		ejeSearchType: Yup.string().oneOf(["cuij", "expediente"]).required(),
		ejeCuij: Yup.string().when("ejeSearchType", {
			is: "cuij",
			then: (schema) => schema.required("Ingrese el CUIJ del expediente"),
			otherwise: (schema) => schema.notRequired(),
		}),
		expedientNumber: Yup.string().when("ejeSearchType", {
			is: "expediente",
			then: (schema) => schema.required("Ingrese el número de expediente"),
			otherwise: (schema) => schema.notRequired(),
		}),
		expedientYear: Yup.string().when("ejeSearchType", {
			is: "expediente",
			then: (schema) => schema.required("Ingrese el año del expediente"),
			otherwise: (schema) => schema.notRequired(),
		}),
	});

	const manualStepOneSchema = Yup.object().shape({
		folderName: Yup.string().max(255).required("La carátula es requerida"),
		materia: Yup.string().max(255).required("La materia es requerida"),
		orderStatus: Yup.string().required("La parte es requerida"),
		status: Yup.string().required("El estado es requerido"),
		description: Yup.string().max(500),
	});

	const finalStepSchema = Yup.object().shape({
		initialDateFolder: Yup.string().matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
			message: "El formato de fecha debe ser DD/MM/AAAA",
		}),
		finalDateFolder: Yup.string().when("status", {
			is: (status: any) => status === "Cerrada",
			then: () => {
				return Yup.string()
					.required("Con el estado cerrado debe completar la fecha")
					.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
						message: "El formato de fecha debe ser DD/MM/AAAA",
					});
			},
			otherwise: () => Yup.array(),
		}),
	});

	// Esquemas para los pasos dependiendo de si estamos editando o creando

	const [initialValues, setInitialValues] = useState(getInitialValues(folder, !folder ? initialFormValues : undefined));
	const [values, setValues] = useState<any>(initialValues);
	const [isLoadingData, setIsLoadingData] = useState(!isCreating && !folder); // Loading solo cuando editamos y no hay datos
	const stepsEditing = ["Datos requeridos", "Datos opcionales"];
	const stepsCreatingManual = ["Método de ingreso", "Datos requeridos", "Datos opcionales"];
	const stepsCreatingAutomatic = ["Método de ingreso", "Selección poder judicial", "Importar datos", "Completar datos"];

	// Determinamos los pasos según el modo y el método de entrada
	const steps = !isCreating ? stepsEditing : values.entryMethod === "automatic" ? stepsCreatingAutomatic : stepsCreatingManual;
	const [openAlert, setOpenAlert] = useState(false);
	const [activeStep, setActiveStep] = useState(0);
	const isLastStep = activeStep === steps.length - 1;

	// Para solucionar el problema de la referencia circular en la definición de FolderSchema
	const getValidationSchema = (step: number) => {
		if (!isCreating) {
			// Si estamos editando
			return step === 0 ? manualStepOneSchema : finalStepSchema;
		} else {
			// Si estamos creando
			if (values.entryMethod === "automatic") {
				// Flujo de ingreso automático
				switch (step) {
					case 0:
						return initialMethodSchema;
					case 1:
						return judicialPowerSchema;
					case 2:
						// Usar el esquema correcto según el poder judicial
						if (values.judicialPower === "buenosaires") {
							return automaticEntryBASchema;
						} else if (values.judicialPower === "caba") {
							// Para CABA, usar esquema dinámico que valida según ejeSearchType
							return automaticEntryEjeSchema;
						} else {
							return automaticEntryPJNSchema;
						}
					case 3:
						return finalStepSchema;
					default:
						return Yup.object();
				}
			} else {
				// Flujo de ingreso manual
				switch (step) {
					case 0:
						return initialMethodSchema;
					case 1:
						return manualStepOneSchema;
					case 2:
						return finalStepSchema;
					default:
						return Yup.object();
				}
			}
		}
	};

	const currentValidationSchema = getValidationSchema(activeStep);

	const handleAlertClose = () => {
		setOpenAlert(!openAlert);
		onCancel();
	};

	// Escuchar evento de restricción del plan (similar a LinkToJudicialPower)
	useEffect(() => {
		const handlePlanRestriction = (event: Event) => {
			const customEvent = event as CustomEvent;
			// Cerrar el modal inmediatamente
			onCancel();
		};

		// Agregar listener para el evento personalizado
		window.addEventListener("planRestrictionError", handlePlanRestriction);

		// Limpieza al desmontar
		return () => {
			window.removeEventListener("planRestrictionError", handlePlanRestriction);
		};
	}, [onCancel]);

	// Actualizar valores cuando los datos del folder cambien
	useEffect(() => {
		if (!isCreating && folder) {
			const newInitialValues = getInitialValues(folder);
			setInitialValues(newInitialValues);
			setValues(newInitialValues);
			setIsLoadingData(false);
		}
	}, [folder, isCreating]);

	useEffect(() => {
		// Cuando el modal se abre, resetear los estados relacionados con la verificación
		if (open) {
			// Re-hidratar el estado del portal PJN al abrir: el guard de
			// mantenimiento (en AutomaticStep) necesita estado fresco aunque el
			// broadcast one-shot se haya perdido con la sesión ya abierta.
			dispatch(fetchPjnSiteStatus());
			// Si estamos creando, verificar límites
			if (isCreating) {
				// Resetear valores con overrides (entryMethod, judicialPower) para que steps sea correcto
				const freshValues = getInitialValues(null, initialFormValues);
				setInitialValues(freshValues);
				setValues(freshValues);

				// Resetear el estado del modal
				setShowAddFolderModal(false);
				setIsCheckingLimit(true);

				// Verificar el límite de recursos para carpetas (folders)
				const checkLimit = async () => {
					try {
						// Pasar headers del equipo si estamos en modo equipo
						const response = await ApiService.checkResourceLimit("folders", { headers: getRequestHeaders() });
						if (response.success && response.data) {
							if (response.data.hasReachedLimit) {
								// Si ha alcanzado el límite, mostrar el modal de error sin desmontar el componente
								setLimitErrorInfo({
									resourceType: "Carpetas",
									plan: response.data.currentPlan || "free",
									currentCount: `${response.data.currentCount}`,
									limit: response.data.limit,
								});
								setLimitErrorMessage("Has alcanzado el límite de carpetas disponibles en tu plan actual.");
								setIsCheckingLimit(false);
								setLimitErrorOpen(true);
							} else {
								// Si no ha alcanzado el límite, mostrar el modal de nueva carpeta
								setIsCheckingLimit(false);
								setShowAddFolderModal(true);
							}
						} else {
							// Si hay un error en la respuesta, mostrar el modal de nueva carpeta por defecto
							if (!response.success) {
								console.error("Error al verificar el límite de recursos:", response.message);
							}
							setIsCheckingLimit(false);
							setShowAddFolderModal(true);
						}
					} catch (error) {
						console.error("Error al verificar el límite de recursos:", error);
						// En caso de error, permitir crear la carpeta de todos modos
						setIsCheckingLimit(false);
						setShowAddFolderModal(true);
					}
				};
				checkLimit();
			} else {
				// Si estamos editando, mostrar directamente el modal sin verificar límites
				setShowAddFolderModal(true);
			}
		} else {
			// Cuando el modal se cierra, limpiar los estados
			setShowAddFolderModal(false);
			setIsCheckingLimit(false);
			// Resetear el paso activo cuando se cierra el modal
			setActiveStep(0);
			// Restaurar initialValues con overrides para la próxima apertura
			if (isCreating) setInitialValues(getInitialValues(null, initialFormValues));
		}
	}, [open, isCreating, onCancel]);

	// Saltar al paso inicial cuando el modal esté listo y se haya indicado un paso de inicio
	useEffect(() => {
		if (showAddFolderModal && initialStep !== undefined) {
			setActiveStep(initialStep);
		}
	}, [showAddFolderModal, initialStep]);

	useEffect(() => {
		if (folder) {
			setInitialValues(getInitialValues(folder));
		}
	}, [folder]);

	const handleBack = () => {
		setActiveStep((prevStep) => prevStep - 1);
	};

	async function _submitForm(values: any, actions: any, mode: string | undefined) {
		// En modo equipo, usar el userId del owner del grupo
		const userId = getUserIdForResource();
		const groupId = getTeamIdForResource();
		const id = values._id;

		let results;
		let message;

		// Activar el indicador de procesamiento
		setIsProcessing(true);

		try {
			if (mode === "add") {
				// Preparar los datos según el tipo de poder judicial
				// Incluir groupId si estamos en modo equipo
				let folderDataToSend = { ...values, userId, ...(groupId && { groupId }) };

				// Si es Poder Judicial de Buenos Aires (MEV), agregar campos específicos
				if (values.judicialPower === "buenosaires") {
					folderDataToSend = {
						...folderDataToSend,
						mev: true,
						// navigationCode ya viene del formulario
						// Credenciales del usuario para el scraping de esta causa. Solo se
						// mandan si NO tiene credencial global (esa cubre la causa). El backend
						// las encripta.
						...(values.baImportMode === "single" && !values.hasGlobalMevCred && {
							mevCredentials: {
								username: values.mevUsername,
								password: values.mevPassword,
							},
						}),
					};
				} else if (values.judicialPower === "nacional") {
					folderDataToSend = {
						...folderDataToSend,
						pjn: true,
						// folderJuris se usa como pjnCode en el backend
					};
				} else if (values.judicialPower === "caba") {
					// Poder Judicial de CABA (EJE)
					folderDataToSend = {
						...folderDataToSend,
						eje: true,
						ejeSearchType: values.ejeSearchType,
						// Si es búsqueda por CUIJ, incluir el CUIJ
						...(values.ejeSearchType === "cuij" && { ejeCuij: values.ejeCuij }),
						// Si es búsqueda por número/año, incluir esos campos
						...(values.ejeSearchType === "expediente" && {
							expedientNumber: values.expedientNumber,
							expedientYear: values.expedientYear,
						}),
					};
				}

				results = await dispatch(addFolder(folderDataToSend, { headers: getRequestHeaders() }));
				message = "agregar";
			}
			if (mode === "edit") {
				results = await dispatch(updateFolderById(id, values));
				message = "editar";
			}

			if (results && results.success) {
				enqueueSnackbar(`Éxito al ${message} la carpeta`, {
					variant: "success",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});
				setTimeout(() => {
					setIsProcessing(false);
				}, 500);
			} else {
				// Usar el mensaje específico del servidor si está disponible
				const errorMessage = results?.message || `Error al ${message} la carpeta`;
				enqueueSnackbar(errorMessage, {
					variant: "error",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 4000,
				});
				setIsProcessing(false);
			}
		} catch (error) {
			setIsProcessing(false);
			// Si hay un mensaje de error en el objeto error, mostrarlo
			const errorMessage = error instanceof Error && error.message ? error.message : `Error al ${message} la carpeta`;
			enqueueSnackbar(errorMessage, {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
				TransitionComponent: Zoom,
				autoHideDuration: 4000,
			});
		}

		actions.setSubmitting(false);
	}

	async function _handleSubmit(formValues: any, actions: any) {
		// Actualizamos el estado de los valores para las validaciones condicionales
		setValues(formValues);

		// Si estamos en el último paso, enviamos el formulario
		if (isLastStep) {
			await _submitForm(formValues, actions, mode);
			onCancel();
		} else {
			// Si es ingreso automático y acabamos de completar el formulario de importación (paso 2)
			// podemos saltar el paso de "Completar datos" si todos los datos requeridos están completos
			const isAutomaticImportStep = activeStep === 2 && formValues.entryMethod === "automatic";

			if (isAutomaticImportStep && formValues.folderName && formValues.materia && formValues.orderStatus && formValues.status) {
				// Si todos los datos requeridos están completos, enviamos directo
				await _submitForm(formValues, actions, mode);
				onCancel();
			} else {
				// Continuamos al siguiente paso
				setActiveStep(activeStep + 1);
				actions.setTouched({});
				actions.setSubmitting(false);
			}
		}
	}

	// Manejador para cerrar el modal de límite de error
	const handleCloseLimitErrorModal = () => {
		setLimitErrorOpen(false);
		// Si el modal se abrió porque se alcanzó el límite antes de mostrar el formulario,
		// también cerrar el diálogo padre
		if (!showAddFolderModal) {
			onCancel();
		}
	};

	// Este componente tiene dos comportamientos:
	// 1. Cuando se alcanza el límite: Solo muestra el modal LimitErrorModal (independiente)
	// 2. Cuando no se alcanza el límite: Muestra el formulario normal
	return (
		<>
			{/* Modal de límite de recursos - Se muestra de forma independiente */}
			<LimitErrorModal
				open={limitErrorOpen}
				onClose={handleCloseLimitErrorModal}
				message={limitErrorMessage}
				limitInfo={limitErrorInfo}
				upgradeRequired={true}
			/>

			{/* Mostrar indicador de carga mientras se verifican los límites */}
			{isCheckingLimit && (
				<Box
					sx={{
						display: "flex",
						flexDirection: "column",
						alignItems: "center",
						justifyContent: "center",
						minHeight: 400,
						p: 4,
					}}
				>
					<CircularProgress size={48} sx={{ mb: 2 }} />
					<Typography variant="h6" color="text.secondary">
						Verificando disponibilidad...
					</Typography>
				</Box>
			)}

			{/* El contenido del modal de AddFolder solo se muestra cuando corresponde */}
			{!isCheckingLimit && showAddFolderModal && (
				<Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
					<DialogTitle
						sx={{
							bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.08 : 0.04),
							p: { xs: 1.75, sm: 2 },
							borderBottom: `1px solid ${alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.18 : 0.12)}`,
							flexShrink: 0,
						}}
					>
						<Stack direction="row" alignItems="center" spacing={1.25}>
							{/* Ícono en círculo tintado brand */}
							<Box
								sx={{
									width: 36,
									height: 36,
									borderRadius: 1.25,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.18 : 0.1),
									color: BRAND_BLUE,
									flexShrink: 0,
								}}
							>
								<FolderAdd size={20} variant="Bulk" />
							</Box>
							<Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
								<Typography
									sx={{
										fontSize: "1.05rem",
										fontWeight: 600,
										letterSpacing: "-0.015em",
										lineHeight: 1.2,
										color: "text.primary",
									}}
								>
									{isCreating ? "Nueva carpeta" : "Editar carpeta"}
								</Typography>
								{/* Eyebrow del step actual con tabular-nums */}
								<Stack direction="row" alignItems="center" spacing={0.75}>
									<Typography
										sx={{
											fontSize: "0.62rem",
											fontWeight: 600,
											letterSpacing: "0.14em",
											textTransform: "uppercase",
											color: BRAND_BLUE,
											fontVariantNumeric: "tabular-nums",
											lineHeight: 1,
										}}
									>
										Paso {activeStep + 1} / {steps.length}
									</Typography>
									<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", lineHeight: 1 }}>·</Typography>
									<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", lineHeight: 1 }}>
										{steps[activeStep]}
									</Typography>
								</Stack>
							</Stack>
						</Stack>
					</DialogTitle>

					<Formik initialValues={initialValues} validationSchema={currentValidationSchema} onSubmit={_handleSubmit} enableReinitialize>
						{({ isSubmitting, values }) => (
							<Form autoComplete="off" noValidate style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
								<DialogContent sx={{ p: 2, overflow: "auto", flex: 1 }}>
									{isLoadingData ? (
										<Box sx={{ p: 2 }}>
											<Stack spacing={2}>
												<Skeleton variant="rounded" height={40} animation="wave" />
												<Skeleton variant="rounded" height={56} animation="wave" />
												<Skeleton variant="rounded" height={56} animation="wave" />
												<Skeleton variant="rounded" height={56} animation="wave" />
												<Skeleton variant="rounded" height={56} animation="wave" />
												<Skeleton variant="rounded" height={56} animation="wave" />
											</Stack>
										</Box>
									) : (
										<Box>
											{/* Steps Progress — bars con BRAND_BLUE + labels tracked uppercase */}
											<Stack
												direction="row"
												spacing={1.5}
												sx={{
													mb: 2,
													pb: 3.5,
													position: "sticky",
													top: -16,
													zIndex: 1,
													bgcolor: "background.paper",
													pt: 2,
												}}
											>
												{steps.map((label, index) => {
													const isActive = index <= activeStep;
													return (
														<Box key={label} sx={{ position: "relative", width: "100%" }}>
															<Box
																sx={{
																	height: 3,
																	bgcolor: isActive
																		? BRAND_BLUE
																		: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.12 : 0.08),
																	borderRadius: 1,
																	transition: "background-color 0.3s ease",
																}}
															/>
															<Typography
																sx={{
																	position: "absolute",
																	top: 8,
																	fontSize: "0.6rem",
																	fontWeight: 600,
																	letterSpacing: "0.08em",
																	textTransform: "uppercase",
																	color: isActive ? BRAND_BLUE : "text.secondary",
																	fontVariantNumeric: "tabular-nums",
																	transition: "color 0.3s ease",
																}}
															>
																{`0${index + 1}`.slice(-2)} · {label}
															</Typography>
														</Box>
													);
												})}
											</Stack>

											{/* Form Content */}
											<Box sx={{ py: 1 }}>{getStepContent(activeStep, values)}</Box>
										</Box>
									)}
								</DialogContent>

								<DialogActions
									sx={{
										p: { xs: 1.5, sm: 2 },
										bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.04 : 0.02),
										borderTop: `1px solid ${alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.16 : 0.1)}`,
										flexShrink: 0,
									}}
								>
									<Grid container justifyContent="space-between" alignItems="center">
										<Grid item>
											{!isCreating && (
												<Tooltip title="Eliminar carpeta" placement="top" arrow>
													<IconButton
														onClick={() => setOpenAlert(true)}
														size="medium"
														sx={{
															color: "text.secondary",
															transition: "background-color 0.15s ease, color 0.15s ease",
															"&:hover": {
																bgcolor: alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.18 : 0.1),
																color: theme.palette.error.main,
															},
														}}
													>
														<Trash variant="Bulk" size={20} />
													</IconButton>
												</Tooltip>
											)}
										</Grid>
										<Grid item>
											<Stack direction="row" spacing={1.25} alignItems="center">
												{activeStep > 0 && (
													<Button
														onClick={handleBack}
														startIcon={<ArrowLeft2 size={16} />}
														sx={{
															textTransform: "none",
															color: "text.secondary",
															fontWeight: 500,
															"&:hover": {
																bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.1 : 0.06),
																color: BRAND_BLUE,
															},
														}}
													>
														Atrás
													</Button>
												)}
												{/* Cancelar — neutro, no rojo. Cerrar el modal no es destructive. */}
												<Button
													onClick={onCancel}
													sx={{
														minWidth: 90,
														textTransform: "none",
														color: "text.secondary",
														fontWeight: 500,
														"&:hover": {
															bgcolor: alpha(theme.palette.text.primary, theme.palette.mode === "dark" ? 0.08 : 0.05),
															color: "text.primary",
														},
													}}
												>
													Cancelar
												</Button>
												{!(
													activeStep === 2 &&
													values.entryMethod === "automatic" &&
													(values.judicialPower === "nacional" || values.judicialPower === "buenosaires")
												) && (
													<Button
														type="submit"
														variant="contained"
														disabled={isSubmitting || isProcessing}
														endIcon={
															isProcessing ? <CircularProgress size={14} color="inherit" /> : !isLastStep && <ArrowRight2 size={16} />
														}
														sx={{
															minWidth: 100,
															textTransform: "none",
															bgcolor: BRAND_BLUE,
															color: "#fff",
															fontWeight: 600,
															letterSpacing: "-0.005em",
															borderRadius: 1.25,
															boxShadow: "none",
															transition: "background-color 0.15s ease",
															"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
															"&.Mui-disabled": {
																bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.24 : 0.4),
																color: alpha("#fff", 0.9),
															},
														}}
													>
														{isProcessing
															? "Procesando…"
															: folder && isLastStep
															? "Editar"
															: !folder && isLastStep
															? "Crear"
															: "Siguiente"}
													</Button>
												)}
											</Stack>
										</Grid>
									</Grid>
								</DialogActions>
							</Form>
						)}
					</Formik>

					{!isCreating && <AlertFolderDelete title={folder.folderName} open={openAlert} handleClose={handleAlertClose} id={folder._id} />}

					{/* Backdrop brand-aware mientras se procesa */}
					<Backdrop
						open={isProcessing}
						sx={{
							color: "#fff",
							zIndex: (theme) => theme.zIndex.drawer + 1,
							position: "absolute",
							borderRadius: 2,
							bgcolor: alpha(theme.palette.background.paper, theme.palette.mode === "dark" ? 0.88 : 0.85),
							backdropFilter: "blur(4px)",
						}}
					>
						<Stack spacing={2.5} alignItems="center">
							<Box
								sx={{
									width: 56,
									height: 56,
									borderRadius: "50%",
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.16 : 0.1),
									border: `1px solid ${alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.32 : 0.2)}`,
								}}
							>
								<CircularProgress size={28} sx={{ color: BRAND_BLUE }} />
							</Box>
							<Typography
								sx={{
									fontSize: "0.95rem",
									fontWeight: 600,
									letterSpacing: "-0.01em",
									color: "text.primary",
								}}
							>
								{folder ? "Actualizando carpeta…" : "Creando carpeta…"}
							</Typography>
						</Stack>
					</Backdrop>
				</Box>
			)}
		</>
	);
};

export default AddFolder;

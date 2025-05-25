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
} from "@mui/material";
import _ from "lodash";
import * as Yup from "yup";
import { Form, Formik, FormikValues } from "formik";
import { Trash, ArrowRight2, ArrowLeft2, FolderAdd } from "iconsax-react";
import InitialStep from "./step-components/initialStep";
import AutomaticStep from "./step-components/automaticStep";
import FirstStep from "./step-components/firstStep";
import SecondStep from "./step-components/secondStep";
import JudicialPowerSelection from "./step-components/judicialPowerSelection";
import { useSelector, dispatch } from "store";
import { addFolder, updateFolder } from "store/reducers/folders";
import { enqueueSnackbar } from "notistack";
import AlertFolderDelete from "./AlertFolderDelete";
import { PropsAddFolder } from "types/folders";
import ApiService from "store/reducers/ApiService";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";

const getInitialValues = (folder: FormikValues | null) => {
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
		folderFuero: null,
		entryMethod: "manual", // Nuevo campo para seleccionar el método de ingreso
		judicialPower: "", // Poder judicial seleccionado (nacional o buenosaires)
		expedientNumber: "", // Para ingreso automático
		expedientYear: "", // Para ingreso automático
		pjn: false, // Para indicar si los datos provienen del Poder Judicial de la Nación
	};

	if (folder) {
		return _.merge({}, newFolder, {
			...folder,
			folderJurisItem: folder?.folderJuris?.item ?? "",
			folderJurisLabel: folder?.folderJuris?.label ?? "",
			entryMethod: "manual", // Si estamos editando, siempre usamos el método manual
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

	// Si estamos creando una nueva causa
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

const AddFolder = ({ folder, onCancel, open, onAddFolder, mode }: PropsAddFolder) => {
	const auth = useSelector((state) => state.auth);
	const isCreating = mode === "add";

	// Estado para el modal de límite de recursos
	const [limitErrorOpen, setLimitErrorOpen] = useState(false);
	const [limitErrorInfo, setLimitErrorInfo] = useState<any>(null);
	const [limitErrorMessage, setLimitErrorMessage] = useState("");
	const [showAddFolderModal, setShowAddFolderModal] = useState(false);

	const theme = useTheme();

	// Definición de esquemas de validación para diferentes pasos
	const initialMethodSchema = Yup.object().shape({
		entryMethod: Yup.string().oneOf(["manual", "automatic"], "Seleccione un método de ingreso").required("Seleccione un método de ingreso"),
	});

	const judicialPowerSchema = Yup.object().shape({
		judicialPower: Yup.string().oneOf(["nacional", "buenosaires"], "Seleccione un poder judicial").required("Seleccione un poder judicial"),
	});

	const automaticEntrySchema = Yup.object().shape({
		folderJuris: Yup.string().required("Seleccione una jurisdicción"),
		expedientNumber: Yup.string().required("Ingrese el número de expediente"),
		expedientYear: Yup.string().required("Ingrese el año del expediente"),
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
			is: (status: any) => status === "Finalizada",
			then: () => {
				return Yup.string()
					.required("Con el estado finalizado debe completar la fecha")
					.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
						message: "El formato de fecha debe ser DD/MM/AAAA",
					});
			},
			otherwise: () => Yup.array(),
		}),
	});

	// Esquemas para los pasos dependiendo de si estamos editando o creando

	const [initialValues, setInitialValues] = useState(getInitialValues(folder));
	const [values, setValues] = useState<any>(initialValues);
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
						return automaticEntrySchema;
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
			console.log(
				"Restricción de plan detectada, cerrando modal de nueva causa",
				customEvent.detail ? `(Modales activos: ${customEvent.detail.openDialogsCount || 0})` : "",
			);

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

	useEffect(() => {
		// Cuando el modal se abre, resetear los estados relacionados con la verificación
		if (open) {
			// Resetear el paso activo
			const timer = setTimeout(() => {
				setActiveStep(0);
			}, 0);

			// Si estamos creando, verificar límites
			if (isCreating) {
				// Resetear el estado del modal
				setShowAddFolderModal(false);

				// Verificar el límite de recursos para carpetas (folders)
				const checkLimit = async () => {
					try {
						const response = await ApiService.checkResourceLimit("folders");
						if (response.success && response.data) {
							if (response.data.hasReachedLimit) {
								// Si ha alcanzado el límite, mostrar el modal de error y cerrar este modal
								setLimitErrorInfo({
									resourceType: "Carpetas/Causas",
									plan: response.data.currentPlan || "free",
									currentCount: `${response.data.currentCount}`,
									limit: response.data.limit,
								});
								setLimitErrorMessage("Has alcanzado el límite de causas disponibles en tu plan actual.");

								// Cerrar el modal actual y mostrar el LimitErrorModal
								onCancel();

								// Lanzar un pequeño delay para evitar problemas de renderizado
								setTimeout(() => {
									setLimitErrorOpen(true);

									// Disparar evento para coordinación con otros componentes
									window.dispatchEvent(
										new CustomEvent("planRestrictionError", {
											detail: {
												resourceType: "folders",
												openDialogsCount: 1,
											},
										}),
									);
								}, 100);
							} else {
								// Si no ha alcanzado el límite, mostrar el modal de nueva causa
								setShowAddFolderModal(true);
							}
						} else {
							// Si hay un error en la respuesta, mostrar el modal de nueva causa por defecto
							console.error("Error al verificar el límite de recursos:", response.message);
							setShowAddFolderModal(true);
						}
					} catch (error) {
						console.error("Error al verificar el límite de recursos:", error);
						// En caso de error, permitir crear la causa de todos modos
						setShowAddFolderModal(true);
					}
				};
				checkLimit();
			} else {
				// Si estamos editando, mostrar directamente el modal sin verificar límites
				setShowAddFolderModal(true);
			}

			return () => clearTimeout(timer);
		} else {
			// Cuando el modal se cierra, limpiar los estados
			setShowAddFolderModal(false);
		}
	}, [open, isCreating, onCancel]);

	useEffect(() => {
		if (folder) {
			setInitialValues(getInitialValues(folder));
		}
	}, [folder]);

	const handleBack = () => {
		setActiveStep((prevStep) => prevStep - 1);
	};

	async function _submitForm(values: any, actions: any, mode: string | undefined) {
		const userId = auth.user?._id;
		const id = values._id;
		setActiveStep(0);

		let results;
		let message;

		if (mode === "add") {
			results = await dispatch(addFolder({ ...values, userId }));
			message = "agregar";
		}
		if (mode === "edit") {
			results = await dispatch(updateFolder(id, values));
			message = "editar";
		}

		if (results && results.success) {
			enqueueSnackbar(`Éxito al ${message} la causa`, {
				variant: "success",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
				TransitionComponent: Zoom,
				autoHideDuration: 3000,
			});
		} else {
			enqueueSnackbar(`Error al ${message} la causa`, {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
				TransitionComponent: Zoom,
				autoHideDuration: 3000,
			});
		}

		actions.setSubmitting(false);
		setActiveStep(activeStep + 1);
		onAddFolder(values);
	}

	function _handleSubmit(formValues: any, actions: any) {
		// Actualizamos el estado de los valores para las validaciones condicionales
		setValues(formValues);

		// Si estamos en el último paso, enviamos el formulario
		if (isLastStep) {
			_submitForm(formValues, actions, mode);
			onCancel();
		} else {
			// Si es ingreso automático y acabamos de completar el formulario de importación (paso 2)
			// podemos saltar el paso de "Completar datos" si todos los datos requeridos están completos
			const isAutomaticImportStep = activeStep === 2 && formValues.entryMethod === "automatic";

			if (isAutomaticImportStep && formValues.folderName && formValues.materia && formValues.orderStatus && formValues.status) {
				// Si todos los datos requeridos están completos, enviamos directo
				_submitForm(formValues, actions, mode);
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

			{/* El contenido del modal de AddFolder solo se muestra cuando corresponde */}
			{showAddFolderModal && (
				<Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
					<DialogTitle
						sx={{
							bgcolor: theme.palette.primary.lighter,
							p: 3,
							borderBottom: `1px solid ${theme.palette.divider}`,
							flexShrink: 0,
						}}
					>
						<Stack spacing={1}>
							<Stack direction="row" alignItems="center" spacing={1}>
								<FolderAdd size={24} color={theme.palette.primary.main} />
								<Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
									{isCreating ? "Nueva Causa" : "Editar Causa"}
								</Typography>
							</Stack>
							<Typography variant="body2" color="textSecondary">
								{`Paso ${activeStep + 1} de ${steps.length}: ${steps[activeStep]}`}
							</Typography>
						</Stack>
					</DialogTitle>

					<Formik initialValues={initialValues} validationSchema={currentValidationSchema} onSubmit={_handleSubmit} enableReinitialize>
						{({ isSubmitting, values }) => (
							<Form autoComplete="off" noValidate style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
								<DialogContent sx={{ p: 2.5, overflow: "auto", flex: 1 }}>
									<Box sx={{ minHeight: 400 }}>
										{/* Steps Progress */}
										<Stack direction="row" spacing={2} sx={{ mb: 3 }}>
											{steps.map((label, index) => (
												<Box key={label} sx={{ position: "relative", width: "100%" }}>
													<Box
														sx={{
															height: 4,
															bgcolor: index <= activeStep ? "primary.main" : "divider",
															borderRadius: 1,
															transition: "all 0.3s ease",
														}}
													/>
													<Typography
														variant="caption"
														sx={{
															position: "absolute",
															top: 8,
															color: index <= activeStep ? "primary.main" : "text.secondary",
														}}
													>
														{label}
													</Typography>
												</Box>
											))}
										</Stack>

										{/* Form Content */}
										<Box sx={{ py: 2 }}>{getStepContent(activeStep, values)}</Box>
									</Box>
								</DialogContent>

								<DialogActions
									sx={{
										p: 2.5,
										bgcolor: theme.palette.background.default,
										borderTop: `1px solid ${theme.palette.divider}`,
										flexShrink: 0,
									}}
								>
									<Grid container justifyContent="space-between" alignItems="center">
										<Grid item>
											{!isCreating && (
												<Tooltip title="Eliminar Causa" placement="top">
													<IconButton
														onClick={() => setOpenAlert(true)}
														size="large"
														sx={{
															color: "error.main",
															"&:hover": {
																bgcolor: "error.lighter",
															},
														}}
													>
														<Trash variant="Bold" />
													</IconButton>
												</Tooltip>
											)}
										</Grid>
										<Grid item>
											<Stack direction="row" spacing={2} alignItems="center">
												{activeStep > 0 && (
													<Button onClick={handleBack} startIcon={<ArrowLeft2 size={18} />}>
														Atrás
													</Button>
												)}
												<Button color="error" onClick={onCancel} sx={{ minWidth: 100 }}>
													Cancelar
												</Button>
												<Button
													type="submit"
													variant="contained"
													disabled={isSubmitting}
													endIcon={!isLastStep && <ArrowRight2 size={18} />}
													sx={{ minWidth: 100 }}
												>
													{folder && isLastStep && "Editar"}
													{!folder && isLastStep && "Crear"}
													{!isLastStep && "Siguiente"}
												</Button>
											</Stack>
										</Grid>
									</Grid>
								</DialogActions>
							</Form>
						)}
					</Formik>

					{!isCreating && <AlertFolderDelete title={folder.folderName} open={openAlert} handleClose={handleAlertClose} id={folder._id} />}
				</Box>
			)}
		</>
	);
};

export default AddFolder;

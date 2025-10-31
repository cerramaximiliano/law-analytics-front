import React, { useEffect, useState } from "react";
import {
	Box,
	Button,
	DialogActions,
	DialogTitle,
	DialogContent,
	Divider,
	Grid,
	Stack,
	Tooltip,
	Typography,
	IconButton,
	Zoom,
	CircularProgress,
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import merge from "lodash/merge";
import * as Yup from "yup";
import { Formik, Form, FormikValues, FormikProps } from "formik";
import AlertCustomerDelete from "./AlertCustomerDelete";
import { Trash, ArrowRight2, ArrowLeft2, Profile2User } from "iconsax-react";
import ApiService from "store/reducers/ApiService";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import SecondStep from "./step-components/secondStep";
import FirstStep from "./step-components/firstStep";
import ThirdStep from "./step-components/thirdStep";
import { dispatch, useSelector } from "store";
import { addContact, updateContact } from "store/reducers/contacts";
import { enqueueSnackbar } from "notistack";

interface CustomerFormValues {
	name: string;
	lastName: string;
	role: string;
	type: string;
	address: string;
	state: string;
	city: string;
	zipCode: string;
	email: string;
	phone: string;
	nationality: string;
	document: string;
	cuit: string;
	status: string;
	activity: string;
	company: string;
	fiscal: string;
	_id?: string;
}

const getInitialValues = (customer: FormikValues | null) => {
	const newCustomer = {
		name: "",
		lastName: "",
		role: "",
		type: "",
		address: "",
		state: "",
		city: "",
		zipCode: "",
		email: "",
		phone: "",
		nationality: "",
		document: "",
		cuit: "",
		status: "",
		activity: "",
		company: "",
		fiscal: "",
	};
	return customer ? merge({}, newCustomer, customer) : newCustomer;
};

function getStepContent(step: number, values: any) {
	switch (step) {
		case 0:
			return <FirstStep />;
		case 1:
			return <SecondStep />;
		case 2:
			return <ThirdStep />;
		default:
			return false;
	}
}

export interface Props {
	customer?: any;
	onCancel: () => void;
	onAddMember: (member: any) => void;
	open: boolean;
	type?: string;
	mode: "add" | "edit"; // Asegúrate de incluir `mode`
}

const AddCustomer = ({ open, customer, onCancel, onAddMember, mode }: Props) => {
	const theme = useTheme();
	const auth = useSelector((state) => state.auth);
	const isCreating = mode === "add";
	const [initialValues, setInitialValues] = useState(getInitialValues(customer));
	const formikRef = React.useRef<FormikProps<CustomerFormValues>>(null);

	// Estado para el modal de límite de recursos
	const [limitErrorOpen, setLimitErrorOpen] = useState(false);
	const [limitErrorInfo, setLimitErrorInfo] = useState<any>(null);
	const [limitErrorMessage, setLimitErrorMessage] = useState("");
	const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
	const [isCheckingLimit, setIsCheckingLimit] = useState(false);

	const handleCancel = () => {
		// Resetea el formulario a los valores iniciales correspondientes a un nuevo contacto
		if (formikRef.current) {
			formikRef.current.resetForm();
			formikRef.current.setValues(getInitialValues(null));
		}

		// Resetea el paso activo
		setActiveStep(0);

		// Llama a la función onCancel proporcionada por el componente padre
		onCancel();
	};

	const cleanArgentinePhoneNumber = (phone: string) => {
		if (!phone) return phone;

		let cleanNumber = phone.replace(/[^0-9]/g, "");

		if (cleanNumber.startsWith("0")) {
			cleanNumber = cleanNumber.substring(1);
		}

		// Variante para códigos de área de 2 dígitos (ej: 11)
		if (cleanNumber.length >= 4 && cleanNumber.substring(2, 4) === "15") {
			cleanNumber = cleanNumber.substring(0, 2) + cleanNumber.substring(4);
		}
		// Variante para códigos de área de 3 dígitos (ej: 221)
		else if (cleanNumber.length >= 5 && cleanNumber.substring(3, 5) === "15") {
			cleanNumber = cleanNumber.substring(0, 3) + cleanNumber.substring(5);
		}
		// Variante para códigos de área de 4 dígitos (ej: 2202)
		else if (cleanNumber.length >= 6 && cleanNumber.substring(4, 6) === "15") {
			cleanNumber = cleanNumber.substring(0, 4) + cleanNumber.substring(6);
		}

		return cleanNumber;
	};

	const CustomerSchema = [
		Yup.object().shape({
			name: Yup.string().required("El nombre es requerido"),
			lastName: Yup.string().required("El apellido es requerido"),
			role: Yup.string().required("La categoría es requerida"),
			type: Yup.string().required("El tipo es requerido"),
		}),
		Yup.object().shape({
			state: Yup.string().required("La provincia/estado es requerida"),
			city: Yup.string().required("La ciudad es requerida"),
			zipCode: Yup.string(), // Opcional
			email: Yup.string().email("Correo electrónico inválido"), // Ahora es opcional
			phone: Yup.string().test("phone-format", "Complete el código de área sin el 0 y móvil sin el 15", function (value) {
				if (!value) return true; // Skip validation if no value

				const cleanNumber = cleanArgentinePhoneNumber(value);
				const originalDigitsOnly = value.replace(/[^0-9]/g, "");

				return (
					cleanNumber.length === originalDigitsOnly.length ||
					(originalDigitsOnly.startsWith("0") && cleanNumber.length === originalDigitsOnly.length - 1) ||
					(originalDigitsOnly.includes("15") && cleanNumber.length <= originalDigitsOnly.length - 2)
				);
			}),
		}),
	];

	const steps = ["Datos Personales", "Datos de Contacto", "Información Adicional"];
	const [openAlert, setOpenAlert] = useState(false);
	const [activeStep, setActiveStep] = useState(0);
	const isLastStep = activeStep === steps.length - 1;
	const currentValidationSchema = CustomerSchema[activeStep];

	// Actualiza los valores iniciales cuando `customer` cambie
	useEffect(() => {
		if (customer) {
			setInitialValues(getInitialValues(customer));
		}
	}, [customer]);

	// Resetea los pasos cuando se abre el formulario
	// Escuchar evento de restricción del plan
	useEffect(() => {
		const handlePlanRestriction = (event: Event) => {
			//const customEvent = event as CustomEvent;
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

	// Resetea los pasos cuando se abre el formulario y verifica límites
	useEffect(() => {
		if (open) {
			setActiveStep(0);

			// Si estamos creando, verificar límites
			if (isCreating) {
				// Resetear el estado del modal
				setShowAddCustomerModal(false);
				setIsCheckingLimit(true);

				// Configurar valores iniciales para crear
				const emptyValues = getInitialValues(null);
				setInitialValues(emptyValues);
				if (formikRef.current) {
					formikRef.current.resetForm();
					formikRef.current.setValues(emptyValues);
				}

				// Verificar el límite de recursos para contactos
				const checkLimit = async () => {
					try {
						const response = await ApiService.checkResourceLimit("contacts");
						if (response.success && response.data) {
							if (response.data.hasReachedLimit) {
								// Si ha alcanzado el límite, mostrar el modal de error y cerrar este modal
								setLimitErrorInfo({
									resourceType: "Contactos",
									plan: response.data.currentPlan || "free",
									currentCount: `${response.data.currentCount}`,
									limit: response.data.limit,
								});
								setLimitErrorMessage("Has alcanzado el límite de contactos disponibles en tu plan actual.");

								// Primero dejar de mostrar el indicador de carga
								setIsCheckingLimit(false);

								// Lanzar un pequeño delay para evitar problemas de renderizado
								setTimeout(() => {
									// Cerrar el modal actual
									onCancel();

									// Mostrar el modal de límite después de otro pequeño delay
									setTimeout(() => {
										setLimitErrorOpen(true);

										// Disparar evento para coordinación con otros componentes
										window.dispatchEvent(
											new CustomEvent("planRestrictionError", {
												detail: {
													resourceType: "contacts",
													openDialogsCount: 1,
												},
											}),
										);
									}, 100);
								}, 100);
							} else {
								// Si no ha alcanzado el límite, mostrar el modal de nuevo contacto
								setIsCheckingLimit(false);
								setShowAddCustomerModal(true);
							}
						} else {
							// Si hay un error en la respuesta, mostrar el modal de nuevo contacto por defecto
							if (!response.success) {
								console.error("Error al verificar el límite de recursos:", response.message);
							}
							setIsCheckingLimit(false);
							setShowAddCustomerModal(true);
						}
					} catch (error) {
						console.error("Error al verificar el límite de recursos:", error);
						// En caso de error, permitir crear el contacto de todos modos
						setIsCheckingLimit(false);
						setShowAddCustomerModal(true);
					}
				};
				checkLimit();
			} else if (mode === "edit" && customer) {
				// Si es modo editar, no verificar límites
				setShowAddCustomerModal(true);

				// Configurar valores iniciales para edición
				const customerValues = getInitialValues(customer);
				setInitialValues(customerValues);

				// Si la referencia a Formik ya existe, actualiza los valores
				if (formikRef.current) {
					formikRef.current.resetForm();
					formikRef.current.setValues(customerValues);
				}
			}
		} else {
			// Cuando se cierra el modal, limpiar el estado
			setShowAddCustomerModal(false);
			setIsCheckingLimit(false);

			// Opcionalmente limpiar el formulario
			if (formikRef.current) {
				formikRef.current.resetForm();
			}
		}
	}, [open, mode, customer, isCreating, onCancel]);

	const handleAlertClose = () => {
		setOpenAlert(!openAlert);
		onCancel();
	};

	async function _submitForm(values: any, actions: any, mode: string | undefined) {
		try {
			const userId = auth.user?._id;

			// Limpiar el número de teléfono si existe
			const cleanedPhone = values.phone ? cleanArgentinePhoneNumber(values.phone) : "";

			// Preparar los datos asegurando que los campos requeridos estén presentes
			const cleanedValues = {
				...values,
				phone: cleanedPhone,
				// Asegurar que los campos requeridos no estén vacíos
				name: values.name?.trim() || "",
				lastName: values.lastName?.trim() || "",
				role: values.role?.trim() || "",
				type: values.type?.trim() || "",
				state: values.state?.trim() || "",
				city: values.city?.trim() || "",
				// Campos opcionales - solo incluir si tienen valor
				...(values.address?.trim() && { address: values.address.trim() }),
				...(values.zipCode?.trim() && { zipCode: values.zipCode.trim() }),
				...(values.email?.trim() && { email: values.email.trim() }),
				...(values.nationality?.trim() && { nationality: values.nationality.trim() }),
				...(values.document?.trim() && { document: values.document.trim() }),
				...(values.cuit?.trim() && { cuit: values.cuit.trim() }),
				...(values.status?.trim() && { status: values.status.trim() }),
				...(values.activity?.trim() && { activity: values.activity.trim() }),
				...(values.company?.trim() && { company: values.company.trim() }),
				...(values.fiscal?.trim() && { fiscal: values.fiscal.trim() }),
			};

			// Remover campos vacíos para los opcionales
			Object.keys(cleanedValues).forEach((key) => {
				if (cleanedValues[key] === "" && !["name", "lastName", "role", "type", "state", "city"].includes(key)) {
					delete cleanedValues[key];
				}
			});

			let results;
			let message;

			if (mode === "add") {
				const newContactData = { ...cleanedValues, userId };
				delete newContactData._id;

				results = await dispatch(addContact(newContactData));
				message = "agregar";
			} else if (mode === "edit") {
				const id = values._id;
				results = await dispatch(updateContact(id, cleanedValues));
				message = "editar";
			}

			if (results && results.success) {
				// Primero resetea el formulario ANTES de cualquier otra acción
				actions.resetForm();

				// Luego muestra la notificación y establece el estado
				enqueueSnackbar(`Éxito al ${message} el contacto`, {
					variant: "success",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});

				// Ahora notificamos al componente padre
				onAddMember(cleanedValues);

				// Opcional: forzar un reseteo adicional con setTimeout
				setTimeout(() => {
					if (actions && actions.resetForm) {
						actions.resetForm();
					}
				}, 0);

				return true; // Indica éxito para que _handleSubmit pueda actuar en consecuencia
			} else {
				throw new Error(`Error en la respuesta al ${message} el contacto`);
			}
		} catch (error) {
			enqueueSnackbar(`Error al procesar el contacto. Intente nuevamente más tarde.`, {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
				TransitionComponent: Zoom,
				autoHideDuration: 4000,
			});
		} finally {
			actions.setSubmitting(false);
		}
	}

	async function _handleSubmit(values: any, actions: any) {
		if (isLastStep) {
			const success = await _submitForm(values, actions, mode);
			if (success) {
				setTimeout(() => {
					handleCancel();
				}, 100);
			}
		} else {
			setActiveStep(activeStep + 1);
			actions.setTouched({});
			actions.setSubmitting(false);
		}
	}
	const handleBack = () => {
		setActiveStep((prevStep) => prevStep - 1);
	};

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

			{/* El contenido del modal de AddCustomer solo se muestra cuando corresponde */}
			{!isCheckingLimit && showAddCustomerModal && (
				<Box sx={{ display: "flex", flexDirection: "column", height: "100%", overflow: "hidden" }}>
					<DialogTitle
						sx={{
							bgcolor: theme.palette.primary.lighter,
							p: 2,
							borderBottom: `1px solid ${theme.palette.divider}`,
							flexShrink: 0,
						}}
					>
						<Stack spacing={1}>
							<Stack direction="row" alignItems="center" spacing={1}>
								<Profile2User size={24} color={theme.palette.primary.main} />
								<Typography
									variant="h5"
									color="primary"
									sx={{
										color: theme.palette.primary.main,
										fontWeight: 600,
									}}
								>
									{isCreating ? "Agregar Nuevo Contacto" : "Editar Contacto"}
								</Typography>
							</Stack>
							<Typography variant="body2" color="textSecondary">
								{`Paso ${activeStep + 1} de ${steps.length}: ${steps[activeStep]}`}
							</Typography>
						</Stack>
					</DialogTitle>
					<Divider />

					<Formik
						initialValues={initialValues}
						enableReinitialize
						validationSchema={currentValidationSchema}
						onSubmit={_handleSubmit}
						innerRef={formikRef}
					>
						{({ isSubmitting, values }) => (
							<Form autoComplete="off" noValidate style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
								<DialogContent
									sx={{
										p: 2,
										flex: 1,
										overflow: "auto",
									}}
								>
									<Box>
										{/* Progress Steps */}
										<Stack direction="row" spacing={1.5} sx={{ mb: 2 }}>
											{steps.map((label, index) => (
												<Box key={label} sx={{ position: "relative", width: "100%" }}>
													<Box
														sx={{
															height: 3,
															bgcolor: index <= activeStep ? "primary.main" : "divider",
															borderRadius: 1,
															transition: "all 0.3s ease",
														}}
													/>
													<Typography
														variant="caption"
														sx={{
															position: "absolute",
															top: 6,
															fontSize: 11,
															color: index <= activeStep ? "primary.main" : "text.secondary",
														}}
													>
														{label}
													</Typography>
												</Box>
											))}
										</Stack>

										{/* Form Content */}
										<Box sx={{ py: 1 }}>{getStepContent(activeStep, values)}</Box>
									</Box>
								</DialogContent>

								<Divider />

								<DialogActions
									sx={{
										p: 2,
										flexShrink: 0,
										borderTop: `1px solid ${theme.palette.divider}`,
									}}
								>
									<Grid container justifyContent="space-between" alignItems="center">
										<Grid item>
											{!isCreating && (
												<Tooltip title="Eliminar Contacto" placement="top">
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
												<Button color="error" onClick={handleCancel} sx={{ minWidth: 100 }}>
													Cancelar
												</Button>
												<Button
													type="submit"
													variant="contained"
													disabled={isSubmitting}
													endIcon={!isLastStep && <ArrowRight2 size={18} />}
													sx={{ minWidth: 100 }}
												>
													{customer && isLastStep && "Guardar"}
													{!customer && isLastStep && "Crear"}
													{!isLastStep && "Siguiente"}
												</Button>
											</Stack>
										</Grid>
									</Grid>
								</DialogActions>
							</Form>
						)}
					</Formik>

					{!isCreating && (
						<AlertCustomerDelete
							title={`${customer.name} ${customer.lastName}`}
							open={openAlert}
							handleClose={handleAlertClose}
							id={customer._id}
						/>
					)}
				</Box>
			)}
		</>
	);
};

export default AddCustomer;

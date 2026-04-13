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
import TypeStep from "./step-components/typeStep";
import FirstStep from "./step-components/firstStep";
import SecondStep from "./step-components/secondStep";
import ThirdStep from "./step-components/thirdStep";
import { dispatch, useSelector } from "store";
import { addContact, updateContact } from "store/reducers/contacts";
import { enqueueSnackbar } from "notistack";
import { useTeam } from "contexts/TeamContext";

interface CustomerFormValues {
	name: string;
	lastName: string;
	role: string | string[];
	type: string;
	address: string;
	state: string;
	city: string;
	zipCode: string;
	email: string;
	phone: string;
	phoneCodArea: string;
	phoneCelular: string;
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
		representado: false,
		tipoRepresentacion: "",
		representanteLegal: { nombre: "", dni: "" },
		address: "",
		state: "",
		city: "",
		zipCode: "",
		email: "",
		phone: "",
		phoneCodArea: "",
		phoneCelular: "",
		nationality: "",
		document: "",
		cuit: "",
		status: "",
		activity: "",
		company: "",
		fiscal: "",
	};
	if (!customer) return newCustomer;
	const merged = merge({}, newCustomer, customer);
	// If lastName is "-" (old default) and type is not jurídica, show empty in edit mode
	const isJuridica = merged.type?.toLowerCase().includes("jurídica");
	if (!isJuridica && merged.lastName === "-") {
		merged.lastName = "";
	}
	return merged;
};

function getStepContent(step: number, _values: any, isImportedFromPjn: boolean = false) {
	switch (step) {
		case 0:
			return <TypeStep isImportedFromPjn={isImportedFromPjn} />;
		case 1:
			return <FirstStep />;
		case 2:
			return <SecondStep />;
		case 3:
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
	folderId?: string; // ID de la carpeta desde la cual se está creando el contacto
}

const AddCustomer = ({ open, customer, onCancel, onAddMember, mode, folderId }: Props) => {
	const theme = useTheme();
	const auth = useSelector((state) => state.auth);
	const { getUserIdForResource, getTeamIdForResource, getRequestHeaders } = useTeam();
	const isCreating = mode === "add";
	const [initialValues, setInitialValues] = useState(getInitialValues(customer));
	const formikRef = React.useRef<FormikProps<CustomerFormValues>>(null);

	// Detectar si el contacto fue importado desde PJN (intervinientes)
	const isImportedFromPjn = customer?.importSource === "interviniente";

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
		// Step 0 — Tipo y Categoría
		Yup.object().shape({
			type: Yup.string().required("El tipo es requerido"),
			role: Yup.mixed()
				.required("La categoría es requerida")
				.test("is-valid-role", "La categoría es requerida", (value) => {
					if (Array.isArray(value)) return value.length > 0;
					return typeof value === "string" && value.trim().length > 0;
				}),
		}),
		// Step 1 — Datos Personales (condicional según tipo ya elegido)
		Yup.object().shape({
			name: Yup.string().when("type", {
				is: (type: string) => !type?.toLowerCase().includes("jurídica"),
				then: (s) => s.required("El nombre es requerido"),
				otherwise: (s) => s,
			}),
			lastName: Yup.string().when("type", {
				is: (type: string) => !type?.toLowerCase().includes("jurídica"),
				then: (s) => s.required("El apellido es requerido"),
				otherwise: (s) => s,
			}),
			company: Yup.string().when("type", {
				is: (type: string) => type?.toLowerCase().includes("jurídica"),
				then: (s) => s.required("La razón social es requerida"),
				otherwise: (s) => s,
			}),
		}),
		// Step 2 — Datos de Contacto
		Yup.object().shape({
			state: Yup.string().required("La provincia/estado es requerida"),
			city: Yup.string().required("La ciudad es requerida"),
			zipCode: Yup.string(),
			email: Yup.string().email("Correo electrónico inválido"),
			phoneCodArea: Yup.string()
				.matches(/^\d{2,4}$/, "Solo dígitos, sin 0 inicial (ej: 11, 351)")
				.optional(),
			phoneCelular: Yup.string()
				.matches(/^\d{6,8}$/, "Entre 6 y 8 dígitos, sin 15 (ej: 55554444)")
				.optional(),
			phone: Yup.string().test("phone-format", "Complete el código de área sin el 0 y móvil sin el 15", function (value) {
				if (!value) return true;
				const cleanNumber = cleanArgentinePhoneNumber(value);
				const originalDigitsOnly = value.replace(/[^0-9]/g, "");
				return (
					cleanNumber.length === originalDigitsOnly.length ||
					(originalDigitsOnly.startsWith("0") && cleanNumber.length === originalDigitsOnly.length - 1) ||
					(originalDigitsOnly.includes("15") && cleanNumber.length <= originalDigitsOnly.length - 2)
				);
			}),
		}),
		// Step 3 — Información Adicional (todo opcional)
	];

	const steps = ["Tipo y Categoría", "Datos Personales", "Datos de Contacto", "Información Adicional"];
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
						// Pasar headers del equipo si estamos en modo equipo
						const response = await ApiService.checkResourceLimit("contacts");
						if (response.success && response.data) {
							if (response.data.hasReachedLimit) {
								// Si ha alcanzado el límite, mostrar el modal de error sin desmontar el componente
								setLimitErrorInfo({
									resourceType: "Contactos",
									plan: response.data.currentPlan || "free",
									currentCount: `${response.data.currentCount}`,
									limit: response.data.limit,
								});
								setLimitErrorMessage("Has alcanzado el límite de contactos disponibles en tu plan actual.");
								setIsCheckingLimit(false);
								setLimitErrorOpen(true);
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
			const userId = getUserIdForResource();
			const groupId = getTeamIdForResource();

			// Limpiar el número de teléfono si existe
			const cleanedPhone = values.phone ? cleanArgentinePhoneNumber(values.phone) : "";

			// Limpiar campos celular SECLO: código de área sin 0 inicial, número sin 15
			const cleanedCodArea = values.phoneCodArea
				? values.phoneCodArea.replace(/\D/g, "").replace(/^0+/, "")
				: "";
			const cleanedCelular = values.phoneCelular
				? values.phoneCelular.replace(/\D/g, "").replace(/^15/, "")
				: "";

			// Preparar los datos asegurando que los campos requeridos estén presentes
			// Normalizar role: si es array, mantenerlo; si es string, hacer trim
			const normalizedRole = Array.isArray(values.role)
				? values.role
				: (values.role?.trim() || "");

			const isJuridica = values.type?.toLowerCase().includes("jurídica");
		const razonSocial = values.company?.trim() || "";

		const cleanedValues = {
				...values,
				phone: cleanedPhone,
				phoneCodArea: cleanedCodArea,
				phoneCelular: cleanedCelular,
				// Para jurídicas: usar razón social como nombre principal (backward compat)
				name: isJuridica ? razonSocial : (values.name?.trim() || ""),
				lastName: isJuridica ? "-" : (values.lastName?.trim() || ""),
				company: razonSocial || (values.company?.trim() || ""),
				role: normalizedRole,
				type: values.type?.trim() || "",
				representado: values.representado === true,
				tipoRepresentacion: values.representado && values.tipoRepresentacion ? values.tipoRepresentacion : null,
				...(isJuridica && { representanteLegal: { nombre: values.representanteLegal?.nombre?.trim() || "", dni: values.representanteLegal?.dni?.trim() || "" } }),
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
				const newContactData = { ...cleanedValues, userId, ...(groupId && { groupId }) };
				delete newContactData._id;

				// Si se está creando desde una carpeta específica, agregar el folderId al array folderIds
				if (folderId) {
					newContactData.folderIds = [folderId];
				}

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
		// Si el modal se abrió porque se alcanzó el límite antes de mostrar el formulario,
		// también cerrar el diálogo padre
		if (!showAddCustomerModal) {
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
						<Stack spacing={0.5}>
							<Stack direction="row" alignItems="center" spacing={1}>
								<Profile2User size={20} color={theme.palette.primary.main} />
								<Typography
									variant="h6"
									color="primary"
									sx={{
										color: theme.palette.primary.main,
										fontWeight: 600,
									}}
								>
									{isCreating ? "Agregar Nuevo Contacto" : "Editar Contacto"}
								</Typography>
							</Stack>
							<Typography variant="caption" color="textSecondary">
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
						innerRef={formikRef as any}
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
										<Box sx={{ py: 1 }}>{getStepContent(activeStep, values, isImportedFromPjn)}</Box>
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
							title={
								customer.type?.toLowerCase().includes("jurídica")
									? customer.company || customer.name || ""
									: `${customer.name}${customer.lastName && customer.lastName !== "-" ? " " + customer.lastName : ""}`.trim()
							}
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

import React, { useEffect, useState } from "react";
import {
	Box,
	Button,
	CircularProgress,
	DialogActions,
	DialogContent,
	IconButton,
	Stack,
	Tooltip,
	Typography,
	Zoom,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import merge from "lodash/merge";
import * as Yup from "yup";
import { Formik, Form, FormikValues, FormikProps } from "formik";
import AlertCustomerDelete from "./AlertCustomerDelete";
import { ArrowLeft2, ArrowRight2, CloseSquare, Profile2User, Trash } from "iconsax-react";
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
import { BRAND_BLUE } from "themes/dashboardTokens";

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
	mode: "add" | "edit";
	folderId?: string;
}

const AddCustomer = ({ open, customer, onCancel, onAddMember, mode, folderId }: Props) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const errorColor = theme.palette.error.main;
	const auth = useSelector((state) => state.auth);
	const { getUserIdForResource, getTeamIdForResource, getRequestHeaders } = useTeam();
	const isCreating = mode === "add";
	const [initialValues, setInitialValues] = useState(getInitialValues(customer));
	const formikRef = React.useRef<FormikProps<CustomerFormValues>>(null);

	const isImportedFromPjn = customer?.importSource === "interviniente";

	const [limitErrorOpen, setLimitErrorOpen] = useState(false);
	const [limitErrorInfo, setLimitErrorInfo] = useState<any>(null);
	const [limitErrorMessage, setLimitErrorMessage] = useState("");
	const [showAddCustomerModal, setShowAddCustomerModal] = useState(false);
	const [isCheckingLimit, setIsCheckingLimit] = useState(false);

	const handleCancel = () => {
		if (formikRef.current) {
			formikRef.current.resetForm();
			formikRef.current.setValues(getInitialValues(null));
		}
		setActiveStep(0);
		onCancel();
	};

	const cleanArgentinePhoneNumber = (phone: string) => {
		if (!phone) return phone;
		let cleanNumber = phone.replace(/[^0-9]/g, "");
		if (cleanNumber.startsWith("0")) cleanNumber = cleanNumber.substring(1);
		if (cleanNumber.length >= 4 && cleanNumber.substring(2, 4) === "15") {
			cleanNumber = cleanNumber.substring(0, 2) + cleanNumber.substring(4);
		} else if (cleanNumber.length >= 5 && cleanNumber.substring(3, 5) === "15") {
			cleanNumber = cleanNumber.substring(0, 3) + cleanNumber.substring(5);
		} else if (cleanNumber.length >= 6 && cleanNumber.substring(4, 6) === "15") {
			cleanNumber = cleanNumber.substring(0, 4) + cleanNumber.substring(6);
		}
		return cleanNumber;
	};

	const CustomerSchema = [
		Yup.object().shape({
			type: Yup.string().required("El tipo es requerido"),
			role: Yup.mixed()
				.required("La categoría es requerida")
				.test("is-valid-role", "La categoría es requerida", (value) => {
					if (Array.isArray(value)) return value.length > 0;
					return typeof value === "string" && value.trim().length > 0;
				}),
		}),
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
	];

	const steps = ["Tipo y categoría", "Datos personales", "Datos de contacto", "Información adicional"];
	const [openAlert, setOpenAlert] = useState(false);
	const [activeStep, setActiveStep] = useState(0);
	const isLastStep = activeStep === steps.length - 1;
	const currentValidationSchema = CustomerSchema[activeStep];

	useEffect(() => {
		if (customer) setInitialValues(getInitialValues(customer));
	}, [customer]);

	useEffect(() => {
		const handlePlanRestriction = () => onCancel();
		window.addEventListener("planRestrictionError", handlePlanRestriction);
		return () => window.removeEventListener("planRestrictionError", handlePlanRestriction);
	}, [onCancel]);

	// Ref para detectar transición de open: solo queremos disparar el flujo de
	// chequeo de límite al abrir el modal (false → true), no en cada re-render
	// disparado por cambios de identidad de onCancel/handleAdd del parent.
	// Antes, un re-render del parent durante el flujo reseteaba
	// showAddCustomerModal a false y dejaba el modal vacío hasta que llegaba
	// la respuesta de la API (race con renders intermedios).
	const prevOpenRef = React.useRef<boolean>(false);

	useEffect(() => {
		const wasOpen = prevOpenRef.current;
		prevOpenRef.current = open;

		// Solo actuamos en transiciones reales (open cambia de valor).
		if (open === wasOpen) return;

		if (open) {
			setActiveStep(0);

			if (isCreating) {
				setShowAddCustomerModal(false);
				setIsCheckingLimit(true);

				const emptyValues = getInitialValues(null);
				setInitialValues(emptyValues);
				if (formikRef.current) {
					formikRef.current.resetForm();
					formikRef.current.setValues(emptyValues);
				}

				const checkLimit = async () => {
					try {
						const response = await ApiService.checkResourceLimit("contacts");
						if (response.success && response.data) {
							if (response.data.hasReachedLimit) {
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
								setIsCheckingLimit(false);
								setShowAddCustomerModal(true);
							}
						} else {
							if (!response.success) {
								console.error("Error al verificar el límite de recursos:", response.message);
							}
							setIsCheckingLimit(false);
							setShowAddCustomerModal(true);
						}
					} catch (error) {
						console.error("Error al verificar el límite de recursos:", error);
						setIsCheckingLimit(false);
						setShowAddCustomerModal(true);
					}
				};
				checkLimit();
			} else if (mode === "edit" && customer) {
				setShowAddCustomerModal(true);
				const customerValues = getInitialValues(customer);
				setInitialValues(customerValues);
				if (formikRef.current) {
					formikRef.current.resetForm();
					formikRef.current.setValues(customerValues);
				}
			}
		} else {
			setShowAddCustomerModal(false);
			setIsCheckingLimit(false);
			if (formikRef.current) formikRef.current.resetForm();
		}
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [open]);

	const handleAlertClose = () => {
		setOpenAlert(!openAlert);
		onCancel();
	};

	async function _submitForm(values: any, actions: any, mode: string | undefined) {
		try {
			const userId = getUserIdForResource();
			const groupId = getTeamIdForResource();
			const cleanedPhone = values.phone ? cleanArgentinePhoneNumber(values.phone) : "";
			const cleanedCodArea = values.phoneCodArea ? values.phoneCodArea.replace(/\D/g, "").replace(/^0+/, "") : "";
			const cleanedCelular = values.phoneCelular ? values.phoneCelular.replace(/\D/g, "").replace(/^15/, "") : "";
			const normalizedRole = Array.isArray(values.role) ? values.role : values.role?.trim() || "";
			const isJuridica = values.type?.toLowerCase().includes("jurídica");
			const razonSocial = values.company?.trim() || "";

			const cleanedValues = {
				...values,
				phone: cleanedPhone,
				phoneCodArea: cleanedCodArea,
				phoneCelular: cleanedCelular,
				name: isJuridica ? razonSocial : values.name?.trim() || "",
				lastName: isJuridica ? "-" : values.lastName?.trim() || "",
				company: razonSocial || values.company?.trim() || "",
				role: normalizedRole,
				type: values.type?.trim() || "",
				representado: values.representado === true,
				tipoRepresentacion: values.representado && values.tipoRepresentacion ? values.tipoRepresentacion : null,
				...(isJuridica && {
					representanteLegal: {
						nombre: values.representanteLegal?.nombre?.trim() || "",
						dni: values.representanteLegal?.dni?.trim() || "",
					},
				}),
				state: values.state?.trim() || "",
				city: values.city?.trim() || "",
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
				if (folderId) newContactData.folderIds = [folderId];
				results = await dispatch(addContact(newContactData));
				message = "agregar";
			} else if (mode === "edit") {
				const id = values._id;
				results = await dispatch(updateContact(id, cleanedValues));
				message = "editar";
			}

			if (results && results.success) {
				actions.resetForm();
				enqueueSnackbar(`Éxito al ${message} el contacto`, {
					variant: "success",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
					TransitionComponent: Zoom,
					autoHideDuration: 3000,
				});
				onAddMember(cleanedValues);
				setTimeout(() => {
					if (actions && actions.resetForm) actions.resetForm();
				}, 0);
				return true;
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

	const handleBack = () => setActiveStep((prev) => prev - 1);

	const handleCloseLimitErrorModal = () => {
		setLimitErrorOpen(false);
		if (!showAddCustomerModal) onCancel();
	};

	// ── Brand helpers ───────────────────────────────────────────────────────
	const ghostBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: "text.secondary",
		borderRadius: 1.25,
		border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
		px: 2,
		py: 0.625,
		transition: "color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease",
		"&:hover": {
			color: BRAND_BLUE,
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
			borderColor: alpha(BRAND_BLUE, 0.28),
		},
	};
	const brandPrimarySx = {
		minWidth: 110,
		textTransform: "none" as const,
		bgcolor: BRAND_BLUE,
		color: "#fff",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		boxShadow: "none",
		transition: "background-color 0.15s ease",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
		"&.Mui-disabled": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.24 : 0.4), color: alpha("#fff", 0.9) },
	};
	const destructiveIconBtnSx = {
		width: 36,
		height: 36,
		borderRadius: 1,
		color: errorColor,
		transition: "color 0.15s ease, background-color 0.15s ease",
		"&:hover": { color: errorColor, bgcolor: alpha(errorColor, isDark ? 0.14 : 0.08) },
	};
	const closeIconBtnSx = {
		color: "text.secondary",
		borderRadius: 1,
		transition: "color 0.15s ease, background-color 0.15s ease",
		"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08) },
	};

	return (
		<>
			{/* Modal de límite */}
			<LimitErrorModal
				open={limitErrorOpen}
				onClose={handleCloseLimitErrorModal}
				message={limitErrorMessage}
				limitInfo={limitErrorInfo}
				upgradeRequired={true}
			/>

			{/* Verificando disponibilidad */}
			{isCheckingLimit && (
				<Stack
					alignItems="center"
					justifyContent="center"
					spacing={1.5}
					sx={{ minHeight: 400, p: 4 }}
				>
					<CircularProgress size={32} sx={{ color: BRAND_BLUE }} />
					<Typography sx={{ fontSize: "0.85rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
						Verificando disponibilidad…
					</Typography>
				</Stack>
			)}

			{/* Contenido principal */}
			{!isCheckingLimit && showAddCustomerModal && (
				<Box sx={{ display: "flex", flexDirection: "column", flex: 1, minHeight: 0, width: "100%", overflow: "hidden" }}>
					{/* Header brand atmosférico */}
					<Box
						sx={{
							position: "relative",
							overflow: "hidden",
							px: { xs: 2, sm: 2.5 },
							py: 1.75,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
							borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
							flexShrink: 0,
						}}
					>
						<Box
							sx={{
								position: "absolute",
								top: -60,
								right: -40,
								width: 220,
								height: 220,
								borderRadius: "50%",
								background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)} 0%, transparent 70%)`,
								pointerEvents: "none",
							}}
						/>
						<Stack direction="row" alignItems="center" spacing={1.5} sx={{ position: "relative" }}>
							<Box
								sx={{
									width: 40,
									height: 40,
									borderRadius: 1.5,
									display: "flex",
									alignItems: "center",
									justifyContent: "center",
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
									color: BRAND_BLUE,
									flexShrink: 0,
								}}
							>
								<Profile2User size={20} variant="Bulk" />
							</Box>
							<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
								<Stack direction="row" spacing={0.75} alignItems="center">
									<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
									<Typography
										sx={{
											fontSize: "0.6rem",
											fontWeight: 600,
											letterSpacing: "0.08em",
											textTransform: "uppercase",
											color: "text.secondary",
										}}
									>
										{isCreating ? "Nuevo contacto" : "Editar contacto"}
									</Typography>
								</Stack>
								<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
									{isCreating ? "Agregar nuevo contacto" : "Editar contacto"}
								</Typography>
								<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
									Paso {activeStep + 1} de {steps.length} · {steps[activeStep]}
								</Typography>
							</Stack>
							<IconButton onClick={handleCancel} sx={closeIconBtnSx} aria-label="cerrar">
								<CloseSquare size={20} variant="Linear" />
							</IconButton>
						</Stack>
					</Box>

					<Formik
						initialValues={initialValues}
						enableReinitialize
						validationSchema={currentValidationSchema}
						onSubmit={_handleSubmit}
						innerRef={formikRef as any}
					>
						{({ isSubmitting, values }) => (
							<Form autoComplete="off" noValidate style={{ display: "flex", flexDirection: "column", flex: 1, overflow: "hidden" }}>
								<DialogContent sx={{ p: { xs: 2, sm: 2.5 }, flex: 1, overflow: "auto" }}>
									{/* Progress Steps brand */}
									<Stack spacing={0.875} sx={{ mb: 2.5 }}>
										<Stack direction="row" spacing={1}>
											{steps.map((_, index) => {
												const isActive = index <= activeStep;
												return (
													<Box
														key={index}
														sx={{
															flex: 1,
															height: 3,
															borderRadius: 1,
															bgcolor: isActive ? BRAND_BLUE : alpha(theme.palette.text.primary, isDark ? 0.12 : 0.08),
															transition: "background-color 0.3s ease",
														}}
													/>
												);
											})}
										</Stack>
										<Stack direction="row" spacing={1}>
											{steps.map((label, index) => {
												const isActive = index <= activeStep;
												const isCurrent = index === activeStep;
												return (
													<Stack key={label} direction="row" alignItems="center" spacing={0.5} sx={{ flex: 1, minWidth: 0 }}>
														<Typography
															sx={{
																fontSize: "0.58rem",
																fontWeight: 600,
																letterSpacing: "0.08em",
																color: isActive ? BRAND_BLUE : "text.secondary",
																fontVariantNumeric: "tabular-nums",
																opacity: isCurrent ? 1 : 0.7,
																flexShrink: 0,
															}}
														>
															{`0${index + 1}`.slice(-2)}
														</Typography>
														<Typography
															sx={{
																fontSize: "0.68rem",
																fontWeight: isCurrent ? 600 : 500,
																letterSpacing: "0.04em",
																textTransform: "uppercase",
																color: isActive ? BRAND_BLUE : "text.secondary",
																transition: "color 0.3s ease",
																overflow: "hidden",
																textOverflow: "ellipsis",
																whiteSpace: "nowrap",
																display: { xs: "none", sm: "block" },
															}}
														>
															{label}
														</Typography>
													</Stack>
												);
											})}
										</Stack>
									</Stack>

									{/* Form Content */}
									<Box sx={{ width: "100%", display: "block" }}>{getStepContent(activeStep, values, isImportedFromPjn)}</Box>
								</DialogContent>

								<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1) }} />

								<DialogActions sx={{ px: { xs: 2, sm: 2.5 }, py: 1.75, flexShrink: 0 }}>
									<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: "100%" }}>
										<Box>
											{!isCreating && (
												<Tooltip title="Eliminar contacto" placement="top">
													<IconButton onClick={() => setOpenAlert(true)} sx={destructiveIconBtnSx} aria-label="Eliminar contacto">
														<Trash size={18} variant="Bulk" />
													</IconButton>
												</Tooltip>
											)}
										</Box>
										<Stack direction="row" spacing={1.25} alignItems="center">
											{activeStep > 0 && (
												<Button onClick={handleBack} startIcon={<ArrowLeft2 size={15} variant="Linear" />} sx={ghostBtnSx}>
													Atrás
												</Button>
											)}
											<Button onClick={handleCancel} sx={ghostBtnSx}>
												Cancelar
											</Button>
											<Button
												type="submit"
												variant="contained"
												disabled={isSubmitting}
												endIcon={!isLastStep ? <ArrowRight2 size={15} variant="Linear" /> : undefined}
												startIcon={isSubmitting ? <CircularProgress size={14} color="inherit" /> : undefined}
												sx={brandPrimarySx}
											>
												{customer && isLastStep && "Guardar"}
												{!customer && isLastStep && "Crear"}
												{!isLastStep && "Siguiente"}
											</Button>
										</Stack>
									</Stack>
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

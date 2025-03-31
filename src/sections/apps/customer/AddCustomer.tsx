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
} from "@mui/material";
import { useTheme } from "@mui/material/styles";
import _ from "lodash";
import * as Yup from "yup";
import { Formik, Form, FormikValues, FormikProps } from "formik";
import AlertCustomerDelete from "./AlertCustomerDelete";
import { Trash, ArrowRight2, ArrowLeft2, Profile2User } from "iconsax-react";
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
	return customer ? _.merge({}, newCustomer, customer) : newCustomer;
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
			state: Yup.string().required("La provincia es requerida"),
			city: Yup.string().required("La localidad es requerida"),
			zipCode: Yup.string().required("El código postal es requerido"),
			email: Yup.string().email("Correo electrónico inválido").required("El correo electrónico es requerido"),
			phone: Yup.string()
				.required("El teléfono es requerido")
				.test("phone-format", "Complete el código de área sin el 0 y móvil sin el 15", function (value) {
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
	useEffect(() => {
		if (open) {
			setActiveStep(0);

			// Configura los valores iniciales según el modo
			if (mode === "add") {
				// Si es modo agregar, siempre resetea a valores vacíos
				const emptyValues = getInitialValues(null);
				setInitialValues(emptyValues);

				// Si la referencia a Formik ya existe, resetea también los valores del formulario
				if (formikRef.current) {
					formikRef.current.resetForm();
					formikRef.current.setValues(emptyValues);
				}
			} else if (mode === "edit" && customer) {
				// Si es modo editar, usa los valores del cliente proporcionado
				const customerValues = getInitialValues(customer);
				setInitialValues(customerValues);

				// Si la referencia a Formik ya existe, actualiza los valores
				if (formikRef.current) {
					formikRef.current.resetForm();
					formikRef.current.setValues(customerValues);
				}
			}
		} else {
			// Cuando se cierra el modal, podríamos opcionalmente limpiar el formulario
			if (formikRef.current) {
				formikRef.current.resetForm();
			}
		}
	}, [open, mode, customer]);

	const handleAlertClose = () => {
		setOpenAlert(!openAlert);
		onCancel();
	};

	async function _submitForm(values: any, actions: any, mode: string | undefined) {
		try {
			const userId = auth.user?._id;
			setActiveStep(0);

			const cleanedValues = {
				...values,
				phone: cleanArgentinePhoneNumber(values.phone),
			};

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

				// Ahora notificamos al componente padre y reiniciamos el paso
				onAddMember(cleanedValues);
				setActiveStep(0);

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
			console.error("Error en el proceso de envío:", error);
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

	return (
		<>
			<DialogTitle
				sx={{
					bgcolor: theme.palette.primary.lighter,
					p: 3,
					borderBottom: `1px solid ${theme.palette.divider}`,
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
					<Form autoComplete="off" noValidate>
						<DialogContent sx={{ p: 2.5 }}>
							<Box sx={{ minHeight: 400 }}>
								{/* Progress Steps */}
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

						<Divider />

						<DialogActions sx={{ p: 2.5 }}>
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
		</>
	);
};

export default AddCustomer;

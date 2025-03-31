import { useEffect, useState } from "react";
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
import { Formik, Form, FormikValues } from "formik";
import AlertCustomerDelete from "./AlertCustomerDelete";
import { Trash, ArrowRight2, ArrowLeft2, Profile2User } from "iconsax-react";
import SecondStep from "./step-components/secondStep";
import FirstStep from "./step-components/firstStep";
import ThirdStep from "./step-components/thirdStep";
import { dispatch, useSelector } from "store";
import { addContact, updateContact } from "store/reducers/contacts";
import { enqueueSnackbar } from "notistack";

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
			phone: Yup.string().required("El teléfono es requerido"),
		}),
		Yup.object().shape({
			nationality: Yup.string().required("La nacionalidad es requerida"),
			document: Yup.string().required("El documento es requerido"),
			cuit: Yup.string().required("El CUIT es requerido"),
			status: Yup.string().required("El estado civil es requerido"),
			activity: Yup.string().required("La profesión es requerida"),
			company: Yup.string().required("La empresa es requerida"),
			fiscal: Yup.string().required("La condición fiscal es requerida"),
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
		}
	}, [open]);

	const handleAlertClose = () => {
		setOpenAlert(!openAlert);
		onCancel();
	};

	async function _submitForm(values: any, actions: any, mode: string | undefined) {
		const userId = auth.user?._id;
		const id = values._id;

		setActiveStep(0);
		let results;
		let message;
		if (mode === "add") {
			results = await dispatch(addContact({ ...values, userId }));
			message = "agregar";
		}
		if (mode === "edit") {
			results = await dispatch(updateContact(id, values));
			message = "editar";
		}

		if (results && results.success) {
			enqueueSnackbar(`Éxito al ${message} el contacto`, {
				variant: "success",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
				TransitionComponent: Zoom,
				autoHideDuration: 3000,
			});
		} else {
			enqueueSnackbar(`Error al ${message} el contacto`, {
				variant: "error",
				anchorOrigin: { vertical: "bottom", horizontal: "right" },
				TransitionComponent: Zoom,
				autoHideDuration: 3000,
			});
		}
		actions.setSubmitting(false);
		setActiveStep(activeStep + 1);
		onAddMember(values);
	}

	function _handleSubmit(values: any, actions: any) {
		if (isLastStep) {
			_submitForm(values, actions, mode);
			onCancel();
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
			<DialogTitle sx={{
				bgcolor: theme.palette.primary.lighter,
				p: 3,
				borderBottom: `1px solid ${theme.palette.divider}`,
			}}>
				<Stack spacing={1}>
					<Stack direction="row" alignItems="center" spacing={1}>
						<Profile2User size={24} color={theme.palette.primary.main} />
						<Typography variant="h5" color="primary" sx={{
							color: theme.palette.primary.main,
							fontWeight: 600,
						}}>
							{isCreating ? "Agregar Nuevo Contacto" : "Editar Contacto"}
						</Typography>
					</Stack>
					<Typography variant="body2" color="textSecondary">
						{`Paso ${activeStep + 1} de ${steps.length}: ${steps[activeStep]}`}
					</Typography>
				</Stack>
			</DialogTitle>
			<Divider />

			<Formik initialValues={initialValues} enableReinitialize validationSchema={currentValidationSchema} onSubmit={_handleSubmit}>
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

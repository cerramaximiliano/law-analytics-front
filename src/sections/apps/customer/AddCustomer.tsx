import { useEffect, useState } from "react";
import { Button, DialogActions, DialogTitle, Divider, Grid, Stack, Tooltip, Zoom } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import _ from "lodash";
import * as Yup from "yup";
import { Formik, Form, FormikValues } from "formik";
import AlertCustomerDelete from "./AlertCustomerDelete";
import IconButton from "components/@extended/IconButton";
import { Trash } from "iconsax-react";
import SecondStep from "./step-components/secondStep";
import FirstStep from "./step-components/firstStep";
import ThirdStep from "./step-components/thirdStep";
import { dispatch, useSelector } from "store"; // Usa el dispatch directamente del store
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
	const auth = useSelector((state) => state.auth);

	const isCreating = mode === "add";

	// Maneja los valores iniciales como un estado para que se actualicen con el `customer`
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

	return (
		<>
			<LocalizationProvider dateAdapter={AdapterDateFns}>
				<DialogTitle>{isCreating ? "Agregar Nuevo" : "Editar"}</DialogTitle>
				<Divider />

				<Formik initialValues={initialValues} enableReinitialize validationSchema={currentValidationSchema} onSubmit={_handleSubmit}>
					{({ isSubmitting, values }) => (
						<Form autoComplete="off" noValidate>
							{getStepContent(activeStep, values)}
							<Divider />
							<DialogActions sx={{ p: 2.5 }}>
								<Grid container justifyContent="space-between" alignItems="center">
									<Grid item>
										{!isCreating && (
											<Tooltip title="Eliminar" placement="top">
												<IconButton onClick={() => setOpenAlert(true)} size="large" color="error">
													<Trash variant="Bold" />
												</IconButton>
											</Tooltip>
										)}
									</Grid>
									<Grid item>
										<Stack direction="row" spacing={2} alignItems="center">
											<Button color="error" onClick={onCancel}>
												Cancelar
											</Button>
											<Button type="submit" variant="contained" disabled={isSubmitting}>
												{customer && isLastStep && "Editar"}
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
			</LocalizationProvider>
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

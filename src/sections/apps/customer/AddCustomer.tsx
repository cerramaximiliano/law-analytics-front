import { useEffect, useState } from "react";
import { Button, DialogActions, DialogTitle, Divider, Grid, Stack, Tooltip } from "@mui/material";
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
		nacionality: "",
		document: "",
		cuit: "",
		status: "",
		activity: "",
		company: "",
		fiscal: "",
	};
	if (customer) {
		return _.merge({}, newCustomer, customer);
	}
	return newCustomer;
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
			throw new Error("Unknown step");
	}
}

export interface Props {
	customer?: any;
	onCancel: () => void;
	onAddMember: (member: any) => void;
	open: boolean;
}

const AddCustomer = ({ open, customer, onCancel, onAddMember }: Props) => {
	const isCreating = !customer;

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
			nacionality: Yup.string().required("La nacionalidad es requerida"),
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

	const handleAlertClose = () => {
		setOpenAlert(!openAlert);
		onCancel();
	};

	useEffect(() => {
		if (open) {
			setActiveStep(0);
		}
	}, [open]);

	const initialValues = getInitialValues(customer!);
	async function _submitForm(values: any, actions: any) {
		alert(JSON.stringify(values, null, 2));
		actions.setSubmitting(false);
		setActiveStep(activeStep + 1);
		onAddMember(values); // Llamar a la función onAddMember con los valores del nuevo miembro
	}
	function _handleSubmit(values: any, actions: any) {
		if (isLastStep) {
			_submitForm(values, actions);
			onCancel();
			setActiveStep(0);
		} else {
			setActiveStep(activeStep + 1);
			actions.setTouched({});
			actions.setSubmitting(false);
		}
	}

	return (
		<>
			<LocalizationProvider dateAdapter={AdapterDateFns}>
				<DialogTitle>{customer ? "Editar" : "Agregar Nuevo"}</DialogTitle>
				<Divider />

				<Formik initialValues={initialValues} validationSchema={currentValidationSchema} onSubmit={_handleSubmit}>
					{({ isSubmitting, values }) => (
						<Form autoComplete="off" noValidate>
							{getStepContent(activeStep, values)}
							<Divider />
							<DialogActions sx={{ p: 2.5 }}>
								<Grid container justifyContent="space-between" alignItems="center">
									<Grid item>
										{!isCreating && (
											<Tooltip title="Eliminar Causa" placement="top">
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
			{!isCreating && <AlertCustomerDelete title={customer.fatherName} open={openAlert} handleClose={handleAlertClose} />}
		</>
	);
};

export default AddCustomer;

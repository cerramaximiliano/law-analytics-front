import { useEffect, useState } from "react";

// material-ui
import { Button, DialogActions, DialogTitle, Divider, Grid, Stack, Tooltip } from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// third-party
import _ from "lodash";
import * as Yup from "yup";
import { Form, Formik, FormikValues } from "formik";

// project-imports
import AlertCustomerDelete from "./AlertCustomerDelete";
import IconButton from "components/@extended/IconButton";
import { Trash } from "iconsax-react";
import FirstStep from "./step-components/firstStep";
import SecondStep from "./step-components/secondStep";

const getInitialValues = (folder: FormikValues | null) => {
	const newFolder = {
		folderName: "",
		description: "",
		orderStatus: "",
		status: "",
		materia: null,
		initialDateFolder: "",
		finalDateFolder: "",
		folderJuris: null,
		folderFuero: null,
	};
	if (folder) {
		return _.merge({}, newFolder, folder);
	}
	return newFolder;
};

function getStepContent(step: number, values: any) {
	switch (step) {
		case 0:
			return <FirstStep />;
		case 1:
			return <SecondStep values={values} />;
		default:
			throw new Error("Unknown step");
	}
}

export interface Props {
	customer?: any;
	onCancel: () => void;
	open: boolean; // Add this prop to detect modal open state
}

const AddFolder = ({ customer, onCancel, open }: Props) => {
	const isCreating = !customer;

	const CustomerSchema = [
		Yup.object().shape({
			folderName: Yup.string().max(255).required("La carátula es requerida"),
			materia: Yup.string().max(255).required("La materia es requerida"),
			orderStatus: Yup.string().required("La parte es requerida"),
			status: Yup.string().required("El estado es requerido"),
			description: Yup.string().max(500),
		}),
		Yup.object().shape({
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
		}),
	];

	const steps = ["Datos requeridos", "Cálculos opcionales"];
	const [openAlert, setOpenAlert] = useState(false);
	const [activeStep, setActiveStep] = useState(0);
	const currentValidationSchema = CustomerSchema[activeStep];
	const isLastStep = activeStep === steps.length - 1;

	const handleAlertClose = () => {
		setOpenAlert(!openAlert);
		onCancel();
	};

	useEffect(() => {
		if (open) {
			setActiveStep(0); // Reset step to 0 when modal opens
		}
	}, [open]);

	const initialValues = getInitialValues(customer!);

	async function _submitForm(values: any, actions: any) {
		alert(JSON.stringify(values, null, 2));
		actions.setSubmitting(false);
		setActiveStep(activeStep + 1);
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
				<DialogTitle>{customer ? "Editar Causa" : "Nueva Causa"}</DialogTitle>
				<Divider />

				<Formik initialValues={initialValues} validationSchema={currentValidationSchema} onSubmit={_handleSubmit} enableReinitialize>
					{({ isSubmitting, values }) => {
						return (
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
						);
					}}
				</Formik>
			</LocalizationProvider>
			{!isCreating && <AlertCustomerDelete title={customer.fatherName} open={openAlert} handleClose={handleAlertClose} />}
		</>
	);
};

export default AddFolder;

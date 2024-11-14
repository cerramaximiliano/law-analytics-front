import { useEffect, useState } from "react";

// material-ui
import { Button, DialogActions, DialogTitle, Divider, Grid, Stack, Tooltip, Zoom } from "@mui/material";

// third-party
import _ from "lodash";
import * as Yup from "yup";
import { Form, Formik, FormikValues } from "formik";

// project-imports
import IconButton from "components/@extended/IconButton";
import { Trash } from "iconsax-react";
import FirstStep from "./step-components/firstStep";
import SecondStep from "./step-components/secondStep";
import { useSelector, dispatch } from "store";
import { addFolder, updateFolder } from "store/reducers/folders";
import { enqueueSnackbar } from "notistack";
import AlertFolderDelete from "./AlertFolderDelete";

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
	};
	if (folder) {
		return _.merge({}, newFolder, {
			...folder,
			folderJurisItem: folder?.folderJuris?.item ?? "",
			folderJurisLabel: folder?.folderJuris?.label ?? "",
		});
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
	folder?: any;
	onCancel: () => void;
	onAddFolder: (folder: any) => void;
	open: boolean; // Add this prop to detect modal open state
	mode: "add" | "edit";
}

const AddFolder = ({ folder, onCancel, open, onAddFolder, mode }: Props) => {
	const auth = useSelector((state) => state.auth);
	const isCreating = mode === "add";

	const FolderSchema = [
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

	const [initialValues, setInitialValues] = useState(getInitialValues(folder));

	const steps = ["Datos requeridos", "Cálculos opcionales"];
	const [openAlert, setOpenAlert] = useState(false);
	const [activeStep, setActiveStep] = useState(0);
	const isLastStep = activeStep === steps.length - 1;
	const currentValidationSchema = FolderSchema[activeStep];

	const handleAlertClose = () => {
		setOpenAlert(!openAlert);
		onCancel();
	};

	useEffect(() => {
		if (open) {
			const timer = setTimeout(() => {
				setActiveStep(0);
			}, 0);
			return () => clearTimeout(timer);
		}
	}, [open]);

	// Actualiza los valores iniciales cuando `customer` cambie
	useEffect(() => {
		if (folder) {
			setInitialValues(getInitialValues(folder));
		}
	}, [folder]);

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
			<DialogTitle>{isCreating ? "Nueva Causa" : "Editar Causa"}</DialogTitle>
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
												{folder && isLastStep && "Editar"}
												{!folder && isLastStep && "Crear"}
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
			{!isCreating && <AlertFolderDelete title={folder.folderName} open={openAlert} handleClose={handleAlertClose} id={folder._id} />}
		</>
	);
};

export default AddFolder;

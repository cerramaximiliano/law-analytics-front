import { Dialog, DialogTitle, Divider, Button, Grid, Stack, DialogContent, InputLabel, DialogActions } from "@mui/material";
import InputField from "components/UI/InputField";
import DateInputField from "components/UI/DateInputField";
import { Dispatch, SetStateAction } from "react";
import * as Yup from "yup";
import { Form, Formik } from "formik";
import { dispatch, useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { addTask } from "store/reducers/tasks";

type AddressModalType = {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	handlerAddress?: (task: any) => void;
	folderId: string;
};

type TaskFormValues = {
	date: string;
	name: string;
	description: string;
	checked: boolean;
	folderId: string;
	userId?: string;
};

const customInputStyles = {
	"& .MuiInputBase-root": {
		height: 39.91,
	},
	"& .MuiInputBase-input": {
		fontSize: 12,
	},
	"& input::placeholder": {
		color: "#000000",
		opacity: 0.6,
	},
};

const customTextareaStyles = {
	"& .MuiInputBase-input": {
		fontSize: 12,
	},
	"& textarea::placeholder": {
		color: "#000000",
		opacity: 0.6,
	},
};

const ModalTasks = ({ open, setOpen, handlerAddress, folderId }: AddressModalType) => {
	const userId = useSelector((state: any) => state.auth?.user?._id);
	function closeTaskModal() {
		setOpen(false);
	}

	const CustomerSchema = Yup.object().shape({
		name: Yup.string().max(255).required("La tarea es requerida"),
		date: Yup.string()
			.required("La fecha es requerida")
			.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
				message: "El formato de fecha debe ser DD/MM/AAAA",
			}),
		description: Yup.string().max(500),
	});

	const getInitialValues = (folderId: string, userId: string | undefined): TaskFormValues => ({
		date: "",
		name: "",
		description: "",
		checked: false,
		folderId,
		userId,
	});
	const initialValues = getInitialValues(folderId, userId);

	async function _submitForm(values: TaskFormValues, actions: any) {
		try {
			const result = await dispatch(addTask(values));
			if (result.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Tarea creada exitosamente.",
						variant: "alert",
						alert: {
							color: "success",
						},
						close: true,
					}),
				);

				if (handlerAddress) {
					handlerAddress(result.task);
				}
				closeTaskModal();
				actions.resetForm();
				return true;
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: "Error al crear la tarea.",
						variant: "alert",
						alert: {
							color: "error",
						},
						close: true,
					}),
				);
				closeTaskModal();
				actions.resetForm();
				return false;
			}
		} catch (error) {
			console.log(error);
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al crear la tarea.",
					variant: "alert",
					alert: {
						color: "error",
					},
					close: true,
				}),
			);
			closeTaskModal();
			actions.resetForm();
			return false;
		} finally {
			actions.setSubmitting(false);
		}
	}

	async function _handleSubmit(values: TaskFormValues, actions: any) {
		await _submitForm(values, actions);
	}
	return (
		<Formik initialValues={initialValues} validationSchema={CustomerSchema} onSubmit={_handleSubmit} enableReinitialize>
			{({ isSubmitting, resetForm }) => {
				const handleClose = () => {
					closeTaskModal();
					resetForm();
				};

				return (
					<Dialog
						maxWidth="sm"
						open={open}
						onClose={handleClose}
						sx={{ "& .MuiDialog-paper": { p: 0 }, "& .MuiBackdrop-root": { opacity: "0.5 !important" } }}
					>
						<DialogTitle>Agregar Tarea</DialogTitle>
						<Divider />
						<Form autoComplete="off" noValidate>
							<DialogContent sx={{ p: 2.5 }}>
								<Grid container spacing={3} justifyContent="center">
									<Grid item xs={12} md={8}>
										<Grid container spacing={3}>
											<Grid item xs={12}>
												<Stack spacing={1.25}>
													<InputLabel htmlFor="name">Tarea</InputLabel>
													<InputField fullWidth sx={customInputStyles} id="name" placeholder="Ingrese una tarea" name="name" />
												</Stack>
											</Grid>
											<Grid item xs={12}>
												<Stack spacing={1.25}>
													<InputLabel htmlFor="date">Fecha</InputLabel>
													<DateInputField name="date" customInputStyles={customInputStyles} />
												</Stack>
											</Grid>
											<Grid item xs={12}>
												<Stack spacing={1.25}>
													<InputLabel htmlFor="description">Descripción</InputLabel>
													<InputField
														fullWidth
														sx={customTextareaStyles}
														id="description"
														multiline
														rows={2}
														placeholder="Ingrese una descripción"
														name="description"
													/>
												</Stack>
											</Grid>
										</Grid>
									</Grid>
								</Grid>
							</DialogContent>
							<Divider />
							<DialogActions sx={{ p: 2.5 }}>
								<Grid container justifyContent="right" alignItems="right">
									<Grid item>
										<Stack direction="row" spacing={2} alignItems="rigth">
											<Button color="error" onClick={handleClose}>
												Cancelar
											</Button>
											<Button type="submit" variant="contained" disabled={isSubmitting}>
												Guardar
											</Button>
										</Stack>
									</Grid>
								</Grid>
							</DialogActions>
						</Form>
					</Dialog>
				);
			}}
		</Formik>
	);
};

export default ModalTasks;

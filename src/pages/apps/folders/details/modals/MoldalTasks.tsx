import React from "react";
import {
	DialogTitle,
	Divider,
	Button,
	Stack,
	DialogContent,
	DialogActions,
	useTheme,
	Typography,
	InputLabel,
	CircularProgress,
} from "@mui/material";
import ResponsiveDialog from "components/@extended/ResponsiveDialog";
import InputField from "components/UI/InputField";
import DateInputField from "components/UI/DateInputField";
import * as Yup from "yup";
import { Formik, Form } from "formik"; // Importar Form de Formik
import { dispatch, useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { addTask } from "store/reducers/tasks";

// icons
import { TaskSquare } from "iconsax-react";

// project imports
import { PopupTransition } from "components/@extended/Transitions";

// types
import { TaskModalType, TaskFormValues } from "types/task";

const ModalTasks = ({ open, setOpen, handlerAddress, folderId, folderName }: TaskModalType) => {
	const theme = useTheme();
	const userId = useSelector((state: any) => state.auth?.user?._id);

	function closeTaskModal() {
		setOpen(false);
	}

	const CustomerSchema = Yup.object().shape({
		name: Yup.string().max(255).required("La tarea es requerida"),
		dueDate: Yup.string()
			.required("La fecha es requerida")
			.matches(/^(0[1-9]|[1-9]|1\d|2\d|3[01])\/(0[1-9]|1[0-2]|[1-9])\/\d{4}$/, {
				message: "El formato de fecha debe ser DD/MM/AAAA",
			}),
		description: Yup.string().max(500),
	});

	const getInitialValues = (folderId: string, userId: string | undefined): TaskFormValues => ({
		dueDate: "",
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
			{({ isSubmitting, resetForm, handleSubmit }) => {
				const handleClose = () => {
					if (!isSubmitting) {
						closeTaskModal();
						resetForm();
					}
				};

				return (
					<ResponsiveDialog
						open={open}
						onClose={handleClose}
						TransitionComponent={PopupTransition}
						keepMounted
						maxWidth="sm"
						fullWidth
						aria-labelledby="task-modal-title"
						PaperProps={{
							elevation: 5,
							sx: {
								borderRadius: 2,
								overflow: "hidden",
							},
						}}
					>
						<Form>
							<DialogTitle
								id="task-modal-title"
								sx={{
									bgcolor: theme.palette.primary.lighter,
									p: 3,
									borderBottom: `1px solid ${theme.palette.divider}`,
								}}
							>
								<Stack spacing={1}>
									<Stack direction="row" alignItems="center" spacing={1}>
										<TaskSquare size={24} color={theme.palette.primary.main} variant="Bold" />
										<Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
											Nueva Tarea
										</Typography>
									</Stack>
									<Typography variant="body2" color="textSecondary">
										Agrega una nueva tarea a la carpeta "{folderName}"
									</Typography>
								</Stack>
							</DialogTitle>
							<Divider />

							<DialogContent sx={{ p: 3 }}>
								<Stack spacing={2.5}>
									<div>
										<InputLabel htmlFor="name" sx={{ mb: 1 }}>
											Nombre de la tarea *
										</InputLabel>
										<InputField name="name" id="name" autoFocus placeholder="Ingresa el nombre de la tarea" disabled={isSubmitting} />
									</div>

									<div>
										<InputLabel htmlFor="dueDate" sx={{ mb: 1 }}>
											Fecha de vencimiento *
										</InputLabel>
										<DateInputField name="dueDate" id="dueDate" placeholder="DD/MM/AAAA" disabled={isSubmitting} />
									</div>

									<div>
										<InputLabel htmlFor="description" sx={{ mb: 1 }}>
											Descripción (opcional)
										</InputLabel>
										<InputField
											name="description"
											id="description"
											placeholder="Agrega una descripción de la tarea"
											multiline
											rows={4}
											disabled={isSubmitting}
											fullWidth
										/>
									</div>
								</Stack>
							</DialogContent>

							<Divider />
							<DialogActions sx={{ px: 3, py: 2 }}>
								<Button onClick={handleClose} color="error" disabled={isSubmitting}>
									Cancelar
								</Button>
								<Button
									type="submit"
									variant="contained"
									disabled={isSubmitting}
									startIcon={isSubmitting ? <CircularProgress size={20} color="inherit" /> : null}
								>
									{isSubmitting ? "Creando..." : "Crear tarea"}
								</Button>
							</DialogActions>
						</Form>
					</ResponsiveDialog>
				);
			}}
		</Formik>
	);
};

export default ModalTasks;

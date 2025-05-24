import { Dialog, DialogTitle, Divider, Button, Stack, DialogContent, DialogActions, useTheme, Typography, InputLabel } from "@mui/material";
import InputField from "components/UI/InputField";
import DateInputField from "components/UI/DateInputField";
import * as Yup from "yup";
import { Formik, Form } from "formik"; // Importar Form de Formik
import { dispatch, useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { addTask } from "store/reducers/tasks";

// types
import { TaskModalType, TaskFormValues } from "types/task";
import { TaskSquare } from "iconsax-react";

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
			console.log("Enviando formulario con valores:", values);
			const result = await dispatch(addTask(values));
			console.log("Resultado de addTask:", result);

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
			console.log("Error en _submitForm:", error);
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
		console.log("_handleSubmit llamado con valores:", values);
		await _submitForm(values, actions);
	}

	return (
		<Formik initialValues={initialValues} validationSchema={CustomerSchema} onSubmit={_handleSubmit} enableReinitialize>
			{({ isSubmitting, resetForm, handleSubmit }) => {
				const handleClose = () => {
					closeTaskModal();
					resetForm();
				};

				return (
					<Dialog
						maxWidth="sm"
						open={open}
						onClose={handleClose}
						PaperProps={{
							sx: {
								width: "600px",
								maxWidth: "600px",
								p: 0,
								borderRadius: 2,
								boxShadow: `0 2px 10px -2px ${theme.palette.divider}`,
							},
						}}
						sx={{
							"& .MuiBackdrop-root": { opacity: "0.5 !important" },
						}}
					>
						<Form>
							<DialogTitle
								sx={{
									bgcolor: theme.palette.primary.lighter,
									p: 3,
									borderBottom: `1px solid ${theme.palette.divider}`,
								}}
							>
								<Stack direction="row" justifyContent="space-between" alignItems="center">
									<Stack direction="row" alignItems="center" spacing={1}>
										<TaskSquare size={24} color={theme.palette.primary.main} />
										<Typography
											variant="h5"
											sx={{
												color: theme.palette.primary.main,
												fontWeight: 600,
											}}
										>
											Agregar Tarea
										</Typography>
									</Stack>
									<Typography
										color="textSecondary"
										variant="subtitle2"
										sx={{
											maxWidth: "30%",
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										Carpeta: {folderName}
									</Typography>
								</Stack>
							</DialogTitle>

							<Divider />

							<DialogContent
								sx={{
									p: 3,
									display: "flex",
									flexDirection: "column",
									gap: 3,
								}}
							>
								<Stack spacing={1}>
									{" "}
									{/* Contenedor con menor espacio para cada grupo label-input */}
									<InputLabel htmlFor="name">Tarea</InputLabel>
									<InputField
										fullWidth
										id="name"
										placeholder="Ingrese una tarea"
										name="name"
										customInputStyles={{
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
										}}
									/>
								</Stack>

								<Stack spacing={1}>
									<InputLabel htmlFor="dueDate">Fecha de Vencimiento</InputLabel>
									<DateInputField
										name="dueDate"
										customInputStyles={{
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
										}}
									/>
								</Stack>

								<Stack spacing={1}>
									<InputLabel htmlFor="description">Descripción</InputLabel>
									<InputField
										fullWidth
										id="description"
										multiline
										rows={2}
										placeholder="Ingrese una descripción"
										name="description"
										customInputStyles={{
											"& .MuiInputBase-input": {
												fontSize: 12,
											},
											"& textarea::placeholder": {
												color: "#000000",
												opacity: 0.6,
											},
										}}
									/>
								</Stack>
							</DialogContent>

							<Divider />

							<DialogActions
								sx={{
									p: 2.5,
									bgcolor: theme.palette.background.default,
									borderTop: `1px solid ${theme.palette.divider}`,
								}}
							>
								<Button color="error" onClick={handleClose}>
									Cancelar
								</Button>
								<Button type="submit" variant="contained" disabled={isSubmitting}>
									Guardar
								</Button>
							</DialogActions>
						</Form>
					</Dialog>
				);
			}}
		</Formik>
	);
};

export default ModalTasks;

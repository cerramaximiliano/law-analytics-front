import { Dialog, DialogTitle, Divider, Button, Stack, DialogContent, DialogActions, useTheme, Typography } from "@mui/material";
import InputField from "components/UI/InputField";
import DateInputField from "components/UI/DateInputField";
import { Dispatch, SetStateAction } from "react";
import * as Yup from "yup";
import { Formik } from "formik";
import { dispatch, useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { addTask } from "store/reducers/tasks";

type AddressModalType = {
	open: boolean;
	setOpen: Dispatch<SetStateAction<boolean>>;
	handlerAddress?: (task: any) => void;
	folderId: string;
	folderName: string;
};

type TaskFormValues = {
	date: string;
	name: string;
	description: string;
	checked: boolean;
	folderId: string;
	userId?: string;
};

const ModalTasks = ({ open, setOpen, handlerAddress, folderId, folderName }: AddressModalType) => {
	const theme = useTheme();
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
						<DialogTitle
							sx={{
								bgcolor: theme.palette.primary.lighter,
								p: 3,
								borderBottom: `1px solid ${theme.palette.divider}`,
							}}
						>
							<Stack direction="row" justifyContent="space-between" alignItems="center">
								<Typography variant="h5" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
									Agregar Tarea
								</Typography>
								<Typography color="textSecondary" variant="subtitle2">
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
							<InputField
								fullWidth
								label="Tarea"
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
							<DateInputField
								name="date"
								label="Fecha"
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
							<InputField
								fullWidth
								label="Descripción"
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
						</DialogContent>

						<Divider />

						<DialogActions
							sx={{
								p: 2.5,
								bgcolor: theme.palette.background.default,
								borderTop: `1px solid ${theme.palette.divider}`,
							}}
						>
							<Button
								color="inherit"
								onClick={handleClose}
								sx={{
									color: theme.palette.text.secondary,
									"&:hover": {
										bgcolor: theme.palette.action.hover,
									},
								}}
							>
								Cancelar
							</Button>
							<Button
								type="submit"
								variant="contained"
								disabled={isSubmitting}
								sx={{
									minWidth: 120,
									py: 1.25,
									fontWeight: 600,
								}}
							>
								Guardar
							</Button>
						</DialogActions>
					</Dialog>
				);
			}}
		</Formik>
	);
};

export default ModalTasks;

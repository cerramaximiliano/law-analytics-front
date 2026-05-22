import React from "react";
import {
	Box,
	DialogTitle,
	Button,
	Stack,
	DialogContent,
	DialogActions,
	useTheme,
	Typography,
	InputLabel,
	CircularProgress,
	Grid,
} from "@mui/material";
import { alpha } from "@mui/material/styles";
import ResponsiveDialog from "components/@extended/ResponsiveDialog";
import InputField from "components/UI/InputField";
import DateInputField from "components/UI/DateInputField";
import * as Yup from "yup";
import { Formik, Form } from "formik";
import { dispatch, useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { addTask, updateTask } from "store/reducers/tasks";
import { useTeam } from "contexts/TeamContext";
import dayjs from "utils/dayjs-config";

import { TaskSquare } from "iconsax-react";

import { PopupTransition } from "components/@extended/Transitions";
import { BRAND_BLUE } from "themes/dashboardTokens";

import { TaskModalType, TaskFormValues } from "types/task";

const ModalTasks = ({
	open,
	setOpen,
	handlerAddress,
	folderId,
	folderName,
	editMode,
	taskToEdit,
	onClose,
	initialValues: externalInitialValues,
	dialogSx,
}: TaskModalType) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const userId = useSelector((state: any) => state.auth?.user?._id);
	const { getRequestHeaders } = useTeam();

	const isEditMode = editMode && taskToEdit;

	function closeTaskModal() {
		setOpen(false);
		if (onClose) {
			onClose();
		}
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

	const getInitialValues = (folderId: string, userId: string | undefined): TaskFormValues => {
		if (isEditMode && taskToEdit) {
			// Format dueDate to DD/MM/YYYY if it exists
			let formattedDueDate = "";
			if (taskToEdit.dueDate) {
				const parsedDate = dayjs(taskToEdit.dueDate);
				if (parsedDate.isValid()) {
					formattedDueDate = parsedDate.format("DD/MM/YYYY");
				}
			} else if (taskToEdit.date) {
				// Fallback to date field if dueDate is not available
				const parsedDate = dayjs(taskToEdit.date, "DD/MM/YYYY");
				if (parsedDate.isValid()) {
					formattedDueDate = parsedDate.format("DD/MM/YYYY");
				}
			}

			return {
				dueDate: formattedDueDate,
				name: taskToEdit.name || "",
				description: taskToEdit.description || "",
				checked: taskToEdit.checked || false,
				folderId: taskToEdit.folderId || folderId,
				userId: taskToEdit.userId || userId,
			};
		}

		const defaults: TaskFormValues = {
			dueDate: "",
			name: "",
			description: "",
			checked: false,
			folderId,
			userId,
		};

		if (externalInitialValues) {
			return { ...defaults, ...externalInitialValues };
		}

		return defaults;
	};
	const initialValues = getInitialValues(folderId, userId);

	async function _submitForm(values: TaskFormValues, actions: any) {
		try {
			let result;

			if (isEditMode && taskToEdit) {
				// Update existing task
				result = await dispatch(updateTask(taskToEdit._id, values));
			} else {
				// Create new task
				result = await dispatch(addTask(values, { headers: getRequestHeaders() }));
			}

			if (result.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: isEditMode ? "Tarea actualizada exitosamente." : "Tarea creada exitosamente.",
						variant: "alert",
						alert: {
							color: "success",
						},
						close: true,
					}),
				);

				if (handlerAddress) {
					handlerAddress((result as any).task);
				}
				closeTaskModal();
				actions.resetForm();
				return true;
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: isEditMode ? "Error al actualizar la tarea." : "Error al crear la tarea.",
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
					message: isEditMode ? "Error al actualizar la tarea." : "Error al crear la tarea.",
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
		<Formik
			key={isEditMode ? `edit-${taskToEdit?._id}` : "create"}
			initialValues={initialValues}
			validationSchema={CustomerSchema}
			onSubmit={_handleSubmit}
			enableReinitialize
		>
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
						sx={dialogSx}
						PaperProps={{
							elevation: 0,
							sx: {
								borderRadius: 2,
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
								boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
								overflow: "hidden",
							},
						}}
					>
						<Form>
							<DialogTitle
								id="task-modal-title"
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1.25,
									px: 2.5,
									py: 1.75,
									bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
									borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
								}}
							>
								<Box
									sx={{
										width: 32,
										height: 32,
										borderRadius: 1,
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
										border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
										color: BRAND_BLUE,
									}}
								>
									<TaskSquare size={18} variant="Bulk" />
								</Box>
								<Stack spacing={0.125} sx={{ minWidth: 0, flex: 1 }}>
									<Stack direction="row" spacing={0.5} alignItems="center">
										<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
										<Typography
											sx={{
												fontSize: "0.6rem",
												fontWeight: 600,
												letterSpacing: "0.08em",
												textTransform: "uppercase",
												color: "text.secondary",
											}}
										>
											{isEditMode ? "Editar" : "Nueva"}
										</Typography>
									</Stack>
									<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
										{isEditMode ? "Editar tarea" : "Nueva tarea"}
									</Typography>
									<Typography
										sx={{
											fontSize: "0.72rem",
											color: "text.secondary",
											letterSpacing: "-0.005em",
											overflow: "hidden",
											textOverflow: "ellipsis",
											whiteSpace: "nowrap",
										}}
									>
										{isEditMode ? `Editás "${taskToEdit?.name}" de "${folderName}"` : `Agregás una nueva tarea a "${folderName}"`}
									</Typography>
								</Stack>
							</DialogTitle>

							<DialogContent sx={{ p: 2.5 }}>
								<Grid container spacing={2}>
									<Grid item xs={12} sm={6}>
										<Stack spacing={0.75}>
											<InputLabel htmlFor="name" sx={{ fontSize: "0.78rem", fontWeight: 500, color: "text.primary" }}>
												Nombre de la tarea *
											</InputLabel>
											<InputField name="name" id="name" autoFocus placeholder="Ingresá el nombre de la tarea" disabled={isSubmitting} />
										</Stack>
									</Grid>

									<Grid item xs={12} sm={6}>
										<Stack spacing={0.75}>
											<InputLabel htmlFor="dueDate" sx={{ fontSize: "0.78rem", fontWeight: 500, color: "text.primary" }}>
												Fecha de vencimiento *
											</InputLabel>
											<DateInputField name="dueDate" id="dueDate" placeholder="DD/MM/AAAA" disabled={isSubmitting} />
										</Stack>
									</Grid>

									<Grid item xs={12}>
										<Stack spacing={0.75}>
											<InputLabel htmlFor="description" sx={{ fontSize: "0.78rem", fontWeight: 500, color: "text.primary" }}>
												Descripción (opcional)
											</InputLabel>
											<InputField
												name="description"
												id="description"
												placeholder="Agregá una descripción de la tarea"
												multiline
												rows={4}
												disabled={isSubmitting}
												fullWidth
											/>
										</Stack>
									</Grid>
								</Grid>
							</DialogContent>

							<DialogActions sx={{ px: 2.5, py: 1.75, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}` }}>
								<Button
									onClick={handleClose}
									disabled={isSubmitting}
									sx={{
										textTransform: "none",
										fontWeight: 600,
										letterSpacing: "-0.005em",
										color: "text.secondary",
										borderRadius: 1.25,
										px: 2,
										py: 0.875,
										border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
										"&:hover": {
											color: BRAND_BLUE,
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
											borderColor: alpha(BRAND_BLUE, 0.28),
										},
									}}
								>
									Cancelar
								</Button>
								<Button
									type="submit"
									variant="contained"
									disabled={isSubmitting}
									startIcon={isSubmitting ? <CircularProgress size={16} sx={{ color: "#fff" }} /> : null}
									sx={{
										textTransform: "none",
										fontWeight: 600,
										letterSpacing: "-0.005em",
										bgcolor: BRAND_BLUE,
										color: "#fff",
										borderRadius: 1.25,
										px: 2,
										py: 0.875,
										boxShadow: "none",
										"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
									}}
								>
									{isSubmitting ? (isEditMode ? "Guardando…" : "Creando…") : isEditMode ? "Guardar cambios" : "Crear tarea"}
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

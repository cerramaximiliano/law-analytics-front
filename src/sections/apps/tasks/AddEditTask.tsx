// react

// material-ui
import { Button, FormControl, Grid, InputLabel, MenuItem, Select, Stack, TextField } from "@mui/material";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

// third-party
import * as Yup from "yup";
import { useFormik, Form, FormikProvider } from "formik";

// project imports
import { dispatch, useSelector } from "store";
import { addTask, updateTask } from "store/reducers/tasks";

// assets
import { Add } from "iconsax-react";

// types
import { TaskType } from "types/task";

interface Props {
	task?: TaskType;
	onCancel: () => void;
	showSnackbar: (message: string, severity: "success" | "error") => void;
}

const TaskSchema = Yup.object().shape({
	name: Yup.string().required("El nombre es requerido"),
	description: Yup.string(),
	dueDate: Yup.date().required("La fecha de vencimiento es requerida"),
	priority: Yup.string().oneOf(["baja", "media", "alta"]),
	status: Yup.string().oneOf(["pendiente", "en_progreso", "revision", "completada", "cancelada"]),
	folderId: Yup.string(),
});

// ==============================|| ADD / EDIT TASK ||============================== //

const AddEditTask = ({ task, onCancel, showSnackbar }: Props) => {
	const { folders } = useSelector((state) => state.folder);
	const { user } = useSelector((state) => state.auth);

	const isCreating = !task;

	const formik = useFormik({
		initialValues: {
			name: task?.name || "",
			description: task?.description || "",
			dueDate: task?.dueDate ? new Date(task.dueDate) : new Date(),
			priority: task?.priority || "media",
			status: task?.status || "pendiente",
			folderId: task?.folderId || "",
		},
		validationSchema: TaskSchema,
		onSubmit: async (values, { setSubmitting, resetForm }) => {
			try {
				const taskData = {
					...values,
					userId: user?._id,
					checked: false,
				};

				let result;
				if (isCreating) {
					result = await dispatch(addTask(taskData));
				} else {
					result = await dispatch(updateTask(task._id, taskData));
				}

				if (result.success) {
					resetForm();
					onCancel();
					showSnackbar(isCreating ? "Tarea creada exitosamente" : "Tarea actualizada exitosamente", "success");
				} else {
					showSnackbar(result.error || "Error al procesar la tarea", "error");
				}
			} catch (error: any) {
				showSnackbar("Error al procesar la tarea", "error");
			} finally {
				setSubmitting(false);
			}
		},
	});

	const { errors, touched, values, isSubmitting, handleSubmit, getFieldProps, setFieldValue } = formik;

	return (
		<FormikProvider value={formik}>
			<LocalizationProvider dateAdapter={AdapterDateFns}>
				<Form autoComplete="off" noValidate onSubmit={handleSubmit}>
					<Grid container spacing={3}>
						<Grid item xs={12}>
							<Stack spacing={1}>
								<InputLabel htmlFor="task-name">Nombre de la tarea</InputLabel>
								<TextField
									fullWidth
									id="task-name"
									type="text"
									placeholder="Ingrese nombre de la tarea"
									{...getFieldProps("name")}
									error={Boolean(touched.name && errors.name)}
									helperText={touched.name && errors.name}
								/>
							</Stack>
						</Grid>

						<Grid item xs={12}>
							<Stack spacing={1}>
								<InputLabel htmlFor="task-description">Descripción</InputLabel>
								<TextField
									fullWidth
									id="task-description"
									multiline
									rows={3}
									placeholder="Ingrese descripción de la tarea"
									{...getFieldProps("description")}
									error={Boolean(touched.description && errors.description)}
									helperText={touched.description && errors.description}
								/>
							</Stack>
						</Grid>

						<Grid item xs={12} sm={6}>
							<Stack spacing={1}>
								<InputLabel htmlFor="task-dueDate">Fecha de vencimiento</InputLabel>
								<DatePicker
									value={values.dueDate}
									onChange={(date) => setFieldValue("dueDate", date)}
									slotProps={{
										textField: {
											fullWidth: true,
											error: Boolean(touched.dueDate && errors.dueDate),
											helperText: touched.dueDate && (errors.dueDate as string),
										},
									}}
								/>
							</Stack>
						</Grid>

						<Grid item xs={12} sm={6}>
							<Stack spacing={1}>
								<InputLabel htmlFor="task-priority">Prioridad</InputLabel>
								<FormControl fullWidth>
									<Select id="task-priority" {...getFieldProps("priority")} error={Boolean(touched.priority && errors.priority)}>
										<MenuItem value="baja">Baja</MenuItem>
										<MenuItem value="media">Media</MenuItem>
										<MenuItem value="alta">Alta</MenuItem>
									</Select>
								</FormControl>
							</Stack>
						</Grid>

						<Grid item xs={12} sm={6}>
							<Stack spacing={1}>
								<InputLabel htmlFor="task-status">Estado</InputLabel>
								<FormControl fullWidth>
									<Select id="task-status" {...getFieldProps("status")} error={Boolean(touched.status && errors.status)}>
										<MenuItem value="pendiente">Pendiente</MenuItem>
										<MenuItem value="en_progreso">En Progreso</MenuItem>
										<MenuItem value="revision">Revisión</MenuItem>
										<MenuItem value="completada">Completada</MenuItem>
										<MenuItem value="cancelada">Cancelada</MenuItem>
									</Select>
								</FormControl>
							</Stack>
						</Grid>

						<Grid item xs={12} sm={6}>
							<Stack spacing={1}>
								<InputLabel htmlFor="task-folder">Carpeta</InputLabel>
								<FormControl fullWidth>
									<Select id="task-folder" {...getFieldProps("folderId")} error={Boolean(touched.folderId && errors.folderId)}>
										<MenuItem value="">
											<em>Sin carpeta</em>
										</MenuItem>
										{folders?.map((folder: any) => (
											<MenuItem key={folder._id} value={folder._id}>
												{folder.folderNumber} - {folder.folderName}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Stack>
						</Grid>

						<Grid item xs={12}>
							<Stack direction="row" spacing={2} justifyContent="flex-end">
								<Button color="error" onClick={onCancel}>
									Cancelar
								</Button>
								<Button type="submit" variant="contained" disabled={isSubmitting} startIcon={isCreating ? <Add /> : null}>
									{isCreating ? "Crear" : "Actualizar"}
								</Button>
							</Stack>
						</Grid>
					</Grid>
				</Form>
			</LocalizationProvider>
		</FormikProvider>
	);
};

export default AddEditTask;

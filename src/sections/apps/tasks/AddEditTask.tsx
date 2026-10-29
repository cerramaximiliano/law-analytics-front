import React, { useMemo } from "react";
// react

// material-ui
import {
	Autocomplete,
	Avatar,
	Box,
	Button,
	Chip,
	FormControl,
	Grid,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	TextField,
	Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { AdapterDayjs } from "@mui/x-date-pickers/AdapterDayjs";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

// third-party
import * as Yup from "yup";
import { useFormik, Form, FormikProvider } from "formik";
import dayjs from "utils/dayjs-config";

// project imports
import { dispatch, useSelector } from "store";
import { addTask, updateTask } from "store/reducers/tasks";
import { useTeam } from "contexts/TeamContext";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { getTeamAssignees, resolveAssignees, TeamAssignee } from "utils/teamAssignees";

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
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { folders } = useSelector((state) => state.folder);
	const { user } = useSelector((state) => state.auth);
	const { getRequestHeaders, isTeamMode, activeTeam, getUserIdForResource } = useTeam();

	const isCreating = !task;

	// Responsables asignables: owner + miembros activos del equipo activo.
	const assignableMembers = useMemo(() => getTeamAssignees(activeTeam), [activeTeam]);

	const labelSx = {
		fontSize: "0.72rem",
		fontWeight: 600,
		letterSpacing: "0.04em",
		textTransform: "uppercase",
		color: "text.secondary",
	} as const;

	const cancelButtonSx = {
		textTransform: "none" as const,
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
	};

	const submitButtonSx = {
		textTransform: "none" as const,
		bgcolor: BRAND_BLUE,
		color: "#fff",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		px: 2,
		py: 0.875,
		boxShadow: "none",
		minWidth: 120,
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
		"&.Mui-disabled": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.24 : 0.4), color: alpha("#fff", 0.9) },
	};

	// Memoizar valores iniciales para evitar que enableReinitialize resetee el form en cada render
	// Solo se recalculan cuando cambia el task._id (es decir, cuando se edita una tarea diferente)
	const initialValues = useMemo(
		() => ({
			name: task?.name || "",
			description: task?.description || "",
			dueDate: task?.dueDate ? dayjs(task.dueDate) : dayjs(),
			priority: task?.priority || "media",
			status: task?.status || "pendiente",
			folderId: task?.folderId || "",
			assignedTo: (task?.assignedTo || []) as string[],
		}),
		[task?._id], // Solo dependemos del ID, no del objeto completo
	);

	const formik = useFormik({
		initialValues,
		enableReinitialize: true, // Permite reinicializar el form cuando cambia la tarea
		validationSchema: TaskSchema,
		onSubmit: async (values, { setSubmitting, resetForm }) => {
			try {
				const { assignedTo, ...rest } = values;
				const taskData = {
					...rest,
					dueDate: dayjs(values.dueDate).toISOString(),
					// En modo equipo la tarea es del owner (el hub también lo resuelve por X-Group-Id)
					userId: (isTeamMode ? getUserIdForResource() : undefined) || user?._id,
					checked: false,
					// Fuera del modo equipo no se manda el campo (el backend lo deja como está).
					...(isTeamMode ? { assignedTo } : {}),
				};

				let result;
				if (isCreating) {
					result = await dispatch(addTask(taskData, { headers: getRequestHeaders() }));
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

	// Valor del Autocomplete: los ids seleccionados resueltos a miembros (los que ya
	// no están en el equipo se muestran como "Miembro" para que se puedan quitar).
	const selectedAssignees = useMemo(() => resolveAssignees(values.assignedTo, assignableMembers), [values.assignedTo, assignableMembers]);

	return (
		<FormikProvider value={formik}>
			<LocalizationProvider dateAdapter={AdapterDayjs} adapterLocale="es">
				<Form autoComplete="off" noValidate onSubmit={handleSubmit}>
					<Grid container spacing={3}>
						<Grid item xs={12}>
							<Stack spacing={1}>
								<InputLabel htmlFor="task-name" sx={labelSx}>Nombre de la tarea</InputLabel>
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
								<InputLabel htmlFor="task-description" sx={labelSx}>Descripción</InputLabel>
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
								<InputLabel htmlFor="task-dueDate" sx={labelSx}>Fecha de vencimiento</InputLabel>
								<DatePicker
									value={values.dueDate}
									onChange={(date) => setFieldValue("dueDate", date ? dayjs(date) : dayjs())}
									format="DD/MM/YYYY"
									slotProps={{
										textField: {
											fullWidth: true,
											error: Boolean(touched.dueDate && errors.dueDate),
											helperText: touched.dueDate && (errors.dueDate as string),
											placeholder: "DD/MM/AAAA",
										},
									}}
								/>
							</Stack>
						</Grid>

						<Grid item xs={12} sm={6}>
							<Stack spacing={1}>
								<InputLabel htmlFor="task-priority" sx={labelSx}>Prioridad</InputLabel>
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
								<InputLabel htmlFor="task-status" sx={labelSx}>Estado</InputLabel>
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
								<InputLabel htmlFor="task-folder" sx={labelSx}>Carpeta</InputLabel>
								<FormControl fullWidth>
									<Select
										id="task-folder"
										{...getFieldProps("folderId")}
										error={Boolean(touched.folderId && errors.folderId)}
										displayEmpty
										renderValue={(selected) => {
											if (!selected) {
												return <em style={{ color: "#919EAB" }}>Seleccione una carpeta</em>;
											}
											const selectedFolder = folders?.find((f: any) => f._id === selected);
											return selectedFolder ? selectedFolder.folderName : "";
										}}
									>
										<MenuItem value="">
											<em>Sin carpeta asignada</em>
										</MenuItem>
										{folders?.map((folder: any) => (
											<MenuItem key={folder._id} value={folder._id}>
												{folder.folderName}
											</MenuItem>
										))}
									</Select>
								</FormControl>
							</Stack>
						</Grid>

						{isTeamMode && (
							<Grid item xs={12}>
								<Stack spacing={1}>
									<InputLabel htmlFor="task-assignedTo" sx={labelSx}>
										Responsables
									</InputLabel>
									<Autocomplete<TeamAssignee, true>
										id="task-assignedTo"
										multiple
										fullWidth
										options={assignableMembers}
										value={selectedAssignees}
										onChange={(_event, newValue) =>
											setFieldValue(
												"assignedTo",
												newValue.map((a) => a.id),
											)
										}
										isOptionEqualToValue={(option, value) => option.id === value.id}
										getOptionLabel={(option) => option.name}
										filterSelectedOptions
										noOptionsText="No hay miembros para asignar"
										renderOption={(props, option) => (
											<Box component="li" {...props} key={option.id}>
												<Stack direction="row" spacing={1} alignItems="center">
													<Avatar src={option.avatar} sx={{ width: 26, height: 26, fontSize: "0.65rem", fontWeight: 700 }}>
														{option.initials}
													</Avatar>
													<Stack spacing={0}>
														<Typography variant="body2">
															{option.name}
															{option.isOwner ? " · Propietario" : ""}
														</Typography>
														{option.email && option.email !== option.name && (
															<Typography variant="caption" color="text.secondary">
																{option.email}
															</Typography>
														)}
													</Stack>
												</Stack>
											</Box>
										)}
										renderTags={(tagValue, getTagProps) =>
											tagValue.map((option, index) => (
												<Chip
													{...getTagProps({ index })}
													key={option.id}
													size="small"
													label={option.name}
													avatar={
														<Avatar src={option.avatar} sx={{ fontSize: "0.6rem", fontWeight: 700 }}>
															{option.initials}
														</Avatar>
													}
												/>
											))
										}
										renderInput={(params) => (
											<TextField
												{...params}
												placeholder={selectedAssignees.length === 0 ? "Sin responsable (elegí uno o más miembros)" : ""}
											/>
										)}
									/>
								</Stack>
							</Grid>
						)}

						<Grid item xs={12}>
							<Stack direction="row" spacing={1.25} justifyContent="flex-end">
								<Button onClick={onCancel} sx={cancelButtonSx}>
									Cancelar
								</Button>
								<Button
									type="submit"
									variant="contained"
									disabled={isSubmitting}
									startIcon={isCreating ? <Add size={16} variant="Linear" /> : null}
									sx={submitButtonSx}
								>
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

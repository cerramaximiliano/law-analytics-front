import {
	Button,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	FormControl,
	FormControlLabel,
	FormHelperText,
	Grid,
	InputAdornment,
	InputLabel,
	Stack,
	Switch,
	TextField,
	Tooltip,
	Select,
	MenuItem,
	Typography,
	useTheme,
} from "@mui/material";
import { LocalizationProvider, MobileDateTimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import * as Yup from "yup";
import { useFormik, Form, FormikProvider, FormikValues } from "formik";
import IconButton from "components/@extended/IconButton";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { deleteEvent, updateEvent } from "store/reducers/events";
import { Calendar, Trash } from "iconsax-react";
import { DateRange } from "types/calendar";
import { addEvent } from "store/reducers/events";
import { useMemo } from "react";

const getInitialValues = (event: FormikValues | null, range: DateRange | null) => {
	if (event) {
		return {
			title: event.title || "",
			description: event.description || "",
			color: event.color || "#1890ff",
			textColor: event.textColor || "#fff",
			allDay: event.allDay || false,
			start: event.start ? new Date(event.start) : new Date(),
			end: event.end ? new Date(event.end) : new Date(),
			type: event.type || "",
		};
	}

	return {
		title: "",
		description: "",
		color: "#1890ff",
		textColor: "#fff",
		allDay: false,
		start: range ? new Date(range.start) : new Date(),
		end: range ? new Date(range.end) : new Date(),
		type: "",
	};
};

const eventTypes = [
	{ label: "Audiencia", value: "audiencia", color: "#1890ff" },
	{ label: "Vencimiento", value: "vencimiento", color: "#ff4d4f" },
	{ label: "Reunión", value: "reunion", color: "#52c41a" },
	{ label: "Otro", value: "otro", color: "#faad14" },
];

export interface AddEventFormProps {
	event?: FormikValues | null;
	range: DateRange | null;
	onCancel: () => void;
	userId?: string;
	folderId?: string;
	folderName?: string;
}

const AddEventFrom = ({ event, range, onCancel, userId, folderId, folderName }: AddEventFormProps) => {
	const theme = useTheme();
	const isCreating = useMemo(() => event == null || Object.keys(event).length === 0, [event]);

	const EventSchema = Yup.object().shape({
		title: Yup.string().max(255).required("El título es requerido"),
		description: Yup.string().max(5000),
		start: Yup.date().required("La fecha inicial es requerida"),
		end: Yup.date()
			.required("La fecha final es requerida")
			.test("is-after-start", "La fecha final debe ser posterior a la inicial", function (value) {
				const { start } = this.parent;
				if (!start || !value) return true;
				return new Date(value) >= new Date(start);
			}),
		type: Yup.string().required("Debe seleccionar un tipo"),
	});

	const deleteHandler = () => {
		dispatch(deleteEvent(event?.id));
		dispatch(
			openSnackbar({
				open: true,
				message: "Evento eliminado correctamente.",
				variant: "alert",
				alert: {
					color: "success",
				},
				close: false,
			}),
		);
	};

	const initialValues = useMemo(() => getInitialValues(event || null, range), [event, range]);

	const formik = useFormik({
		initialValues: initialValues,
		enableReinitialize: true,
		validationSchema: EventSchema,
		onSubmit: (values, { setSubmitting }) => {
			try {
				const newEvent = {
					userId: userId || undefined,
					folderId: folderId || undefined,
					title: values.title,
					description: values.description,
					color: values.color,
					allDay: values.allDay,
					start: values.start,
					end: values.end,
					type: values.type,
				};

				if (event) {
					dispatch(updateEvent(event._id, newEvent));
					dispatch(
						openSnackbar({
							open: true,
							message: "Evento editado correctamente.",
							variant: "alert",
							alert: {
								color: "success",
							},
							close: true,
						}),
					);
				} else {
					dispatch(addEvent(newEvent));
					dispatch(
						openSnackbar({
							open: true,
							message: "Evento agregado correctamente.",
							variant: "alert",
							alert: {
								color: "success",
							},
							close: true,
						}),
					);
				}

				setSubmitting(false);
			} catch (error) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Ha ocurrido un error. Intente más tarde.",
						variant: "alert",
						alert: {
							color: "error",
						},
						close: true,
					}),
				);
			}
			onCancel();
		},
	});

	const { values, errors, touched, handleSubmit, isSubmitting, getFieldProps, setFieldValue } = formik;

	return (
		<FormikProvider value={formik}>
			<LocalizationProvider dateAdapter={AdapterDateFns}>
				<Form autoComplete="off" noValidate onSubmit={handleSubmit}>
					<DialogTitle
						sx={{
							bgcolor: theme.palette.primary.lighter,
							p: 3,
							borderBottom: `1px solid ${theme.palette.divider}`,
						}}
					>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							{event ? (
								<Typography variant="h5" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
									Editar Evento
								</Typography>
							) : (
								<Typography variant="h5" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
									Agregar Evento
								</Typography>
							)}
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
						<TextField
							fullWidth
							label="Título"
							placeholder="Agregue un título"
							{...getFieldProps("title")}
							error={Boolean(touched.title && errors.title)}
							helperText={touched.title && typeof errors.title === "string" ? errors.title : ""}
							sx={{
								"& .MuiInputBase-root": {
									height: 39.91,
									fontSize: 12,
								},
								"& .MuiInputBase-input::placeholder": {
									color: theme.palette.text.secondary,
									opacity: 0.6,
								},
							}}
						/>
						<TextField
							fullWidth
							label="Descripción"
							multiline
							rows={3}
							placeholder="Agregue una descripción"
							{...getFieldProps("description")}
							error={Boolean(touched.description && errors.description)}
							helperText={touched.description && typeof errors.description === "string" ? errors.description : ""}
							sx={{
								"& .MuiInputBase-input": {
									fontSize: 12,
								},
								"& .MuiInputBase-input::placeholder": {
									color: theme.palette.text.secondary,
									opacity: 0.6,
								},
							}}
						/>

						<Grid container spacing={3} sx={{ marginLeft: 0, marginTop: 0.2 }}>
							<Grid item xs={12} md={5.6} sx={{ display: "flex", alignItems: "center", paddingLeft: 2 }}>
								<FormControlLabel control={<Switch checked={values.allDay} {...getFieldProps("allDay")} />} label="Todo el día" />
							</Grid>
							<Grid item xs={12} md={6} sx={{ display: "flex", alignItems: "center", paddingLeft: 2 }}>
								<Stack spacing={1.25} flex={1}>
									<InputLabel id="demo-simple-select-label">Seleccione un tipo</InputLabel>
									<FormControl fullWidth error={Boolean(touched.type && errors.type)}>
										<Select
											fullWidth
											labelId="demo-simple-select-label"
											id="demo-simple-select"
											{...getFieldProps("type")}
											onChange={(e) => {
												const selectedType = eventTypes.find((type) => type.value === e.target.value);
												setFieldValue("type", selectedType?.value || "");
												setFieldValue("color", selectedType?.color || "#1890ff");
											}}
											sx={{
												"& .MuiInputBase-root": {
													height: 39.91,
													fontSize: 12,
												},
												"& .MuiSelect-select": {
													fontSize: 12,
												},
												"& .MuiInputLabel-root": {
													fontSize: 12,
												},
											}}
										>
											{eventTypes.map((type) => (
												<MenuItem value={type.value} key={type.value}>
													<Grid container alignItems="center" justifyContent="space-between">
														<Typography>{type.label}</Typography>
														<div
															style={{
																width: "12px",
																height: "12px",
																borderRadius: "50%",
																backgroundColor: type.color,
															}}
														></div>
													</Grid>
												</MenuItem>
											))}
										</Select>
										{touched.type && typeof errors.type === "string" && <FormHelperText error>{errors.type}</FormHelperText>}
									</FormControl>
								</Stack>
							</Grid>
						</Grid>

						<Grid item xs={12} md={6}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="cal-start-date">Fecha Inicio</InputLabel>
								<MobileDateTimePicker
									value={values.start}
									format="dd/MM/yyyy hh:mm a"
									onChange={(date) => setFieldValue("start", date)}
									slotProps={{
										textField: {
											InputProps: {
												endAdornment: (
													<InputAdornment position="end" sx={{ cursor: "pointer" }}>
														<Calendar />
													</InputAdornment>
												),
												sx: {
													height: 39.91,
													fontSize: 12,
													"::placeholder": {
														color: theme.palette.text.secondary,
														opacity: 0.6,
													},
												},
											},
										},
									}}
								/>
								{touched.start && typeof errors.start === "string" && <FormHelperText>{errors.start as string}</FormHelperText>}
							</Stack>
						</Grid>
						<Grid item xs={12} md={6}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="cal-end-date">Fecha Fin</InputLabel>
								<MobileDateTimePicker
									value={values.end}
									format="dd/MM/yyyy hh:mm a"
									onChange={(date) => setFieldValue("end", date)}
									slotProps={{
										textField: {
											InputProps: {
												endAdornment: (
													<InputAdornment position="end" sx={{ cursor: "pointer" }}>
														<Calendar />
													</InputAdornment>
												),
												sx: {
													height: 39.91,
													fontSize: 12,
													"::placeholder": {
														color: theme.palette.text.secondary,
														opacity: 0.6,
													},
												},
											},
										},
									}}
								/>
								{touched.end && typeof errors.end === "string" && <FormHelperText error={true}>{errors.end}</FormHelperText>}
							</Stack>
						</Grid>
					</DialogContent>
					<Divider />
					<DialogActions
						sx={{
							p: 2.5,
							bgcolor: theme.palette.background.default,
							borderTop: `1px solid ${theme.palette.divider}`,
						}}
					>
						<Grid container justifyContent="space-between" alignItems="center">
							<Grid item>
								{!isCreating && (
									<Tooltip title="Eliminar Evento" placement="top">
										<IconButton onClick={deleteHandler} size="large" color="error">
											<Trash variant="Bold" />
										</IconButton>
									</Tooltip>
								)}
							</Grid>
							<Grid item>
								<Stack direction="row" spacing={2} alignItems="center">
									<Button
										color="inherit"
										onClick={onCancel}
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
										{event ? "Editar" : "Agregar"}
									</Button>
								</Stack>
							</Grid>
						</Grid>
					</DialogActions>
				</Form>
			</LocalizationProvider>
		</FormikProvider>
	);
};

export default AddEventFrom;

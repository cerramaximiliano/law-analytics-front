// material-ui
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
} from "@mui/material";
import { LocalizationProvider, MobileDateTimePicker } from "@mui/x-date-pickers";

import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";

// third-party
import * as Yup from "yup";
import { useFormik, Form, FormikProvider, FormikValues } from "formik";

// project-imports
import IconButton from "components/@extended/IconButton";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { deleteEvent, updateEvent } from "store/reducers/events";

// assets
import { Calendar, Trash } from "iconsax-react";

// types
import { DateRange } from "types/calendar";
import { addEvent } from "store/reducers/events";
import { useMemo } from "react";

// constant
const getInitialValues = (event: FormikValues | null, range: DateRange | null) => {
	if (event) {
		// Si hay un evento, significa que estamos en modo de edición, así que usamos sus valores
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

	// Si no hay evento, estamos creando uno nuevo, así que devolvemos valores predeterminados
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

// ==============================|| CALENDAR - EVENT ADD / EDIT / DELETE ||============================== //

export interface AddEventFormProps {
	event?: FormikValues | null;
	range: DateRange | null;
	onCancel: () => void;
	userId?: string;
	folderId?: string;
}

const AddEventFrom = ({ event, range, onCancel, userId, folderId }: AddEventFormProps) => {
	const isCreating = useMemo(() => event == null || Object.keys(event).length === 0, [event]);
	console.log(isCreating, event);
	/* 	const backgroundColor = [
		{
			value: theme.palette.primary.main,
			color: "primary.main",
		},
		{
			value: theme.palette.error.main,
			color: "error.main",
		},
		{
			value: theme.palette.success.main,
			color: "success.main",
		},
		{
			value: theme.palette.secondary.main,
			color: "secondary.main",
		},
		{
			value: theme.palette.warning.main,
			color: "warning.main",
		},
		{
			value: theme.palette.mode === ThemeMode.DARK ? theme.palette.primary.darker : theme.palette.primary.lighter,
			color: theme.palette.mode === ThemeMode.DARK ? "primary.darker" : "primary.lighter",
			isLight: true,
		},
		{
			value: theme.palette.mode === ThemeMode.DARK ? theme.palette.error.darker : theme.palette.error.lighter,
			color: theme.palette.mode === ThemeMode.DARK ? "error.darker" : "error.lighter",
			isLight: true,
		},
		{
			value: theme.palette.mode === ThemeMode.DARK ? theme.palette.success.darker : theme.palette.success.lighter,
			color: theme.palette.mode === ThemeMode.DARK ? "success.darker" : "success.lighter",
			isLight: true,
		},
		{
			value: theme.palette.mode === ThemeMode.DARK ? theme.palette.secondary.darker : theme.palette.secondary.lighter,
			color: theme.palette.mode === ThemeMode.DARK ? "secondary.darker" : "secondary.lighter",
			isLight: true,
		},
		{
			value: theme.palette.mode === ThemeMode.DARK ? theme.palette.warning.darker : theme.palette.warning.lighter,
			color: theme.palette.mode === ThemeMode.DARK ? "warning.darker" : "warning.lighter",
			isLight: true,
		},
	];
 */
	/* 	const textColor = [
		{
			value: "#fff",
			color: "white",
			isLight: true,
		},
		{
			value: theme.palette.mode === ThemeMode.DARK ? theme.palette.error.darker : theme.palette.error.lighter,
			color: theme.palette.mode === ThemeMode.DARK ? "error.darker" : "error.lighter",
			isLight: true,
		},
		{
			value: theme.palette.mode === ThemeMode.DARK ? theme.palette.success.darker : theme.palette.success.lighter,
			color: theme.palette.mode === ThemeMode.DARK ? "success.darker" : "success.lighter",
			isLight: true,
		},
		{
			value: theme.palette.mode === ThemeMode.DARK ? theme.palette.secondary.darker : theme.palette.secondary.lighter,
			color: theme.palette.mode === ThemeMode.DARK ? "secondary.darker" : "secondary.lighter",
			isLight: true,
		},
		{
			value: theme.palette.mode === ThemeMode.DARK ? theme.palette.warning.darker : theme.palette.warning.lighter,
			color: theme.palette.mode === ThemeMode.DARK ? "warning.darker" : "warning.lighter",
			isLight: true,
		},
		{
			value: theme.palette.mode === ThemeMode.DARK ? theme.palette.primary.darker : theme.palette.primary.lighter,
			color: theme.palette.mode === ThemeMode.DARK ? "primary.darker" : "primary.lighter",
			isLight: true,
		},
		{
			value: theme.palette.primary.main,
			color: "primary.main",
		},
		{
			value: theme.palette.error.main,
			color: "error.main",
		},
		{
			value: theme.palette.success.main,
			color: "success.main",
		},
		{
			value: theme.palette.secondary.main,
			color: "secondary.main",
		},
		{
			value: theme.palette.warning.main,
			color: "warning.main",
		},
	];
 */
	const EventSchema = Yup.object().shape({
		title: Yup.string().max(255).required("El título es requerido"),
		description: Yup.string().max(5000),
		start: Yup.date().required("La fecha inicial es requerida"),
		end: Yup.date()
			.required("La fecha final es requerida")
			.test("is-after-start", "La fecha final debe ser posterior a la inicial", function (value) {
				const { start } = this.parent;
				if (!start || !value) return true; // Si no hay fechas, no validamos
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
			console.log("submit");
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
					<DialogTitle>{event ? "Editar Evento" : "Agregar Evento"}</DialogTitle>
					<Divider />
					<DialogContent sx={{ p: 2.5 }}>
						<Grid container spacing={3}>
							<Grid item xs={12}>
								<Stack spacing={1.25}>
									<InputLabel htmlFor="cal-title">Título</InputLabel>
									<TextField
										fullWidth
										id="cal-title"
										placeholder="Agregue un título"
										{...getFieldProps("title")}
										error={Boolean(touched.title && errors.title)}
										helperText={touched.title && typeof errors.title === "string" ? errors.title : ""}
									/>
								</Stack>
							</Grid>
							<Grid item xs={12}>
								<Stack spacing={1.25}>
									<InputLabel htmlFor="cal-description">Descripción</InputLabel>
									<TextField
										fullWidth
										id="cal-description"
										multiline
										rows={3}
										placeholder="Agregue una descripción"
										{...getFieldProps("description")}
										error={Boolean(touched.description && errors.description)}
										helperText={touched.description && typeof errors.description === "string" ? errors.description : ""}
									/>
								</Stack>
							</Grid>

							<Grid container spacing={3} sx={{ marginLeft: 0, marginTop: 0.2 }}>
								<Grid item xs={12} md={6} sx={{ paddingLeft: 2 }}>
									<Stack spacing={1.25}>
										<FormControlLabel control={<Switch checked={values.allDay} {...getFieldProps("allDay")} />} label="Todo el día" />
									</Stack>
								</Grid>
								<Grid item xs={12} md={6} sx={{ paddingLeft: 2 }}>
									<Stack spacing={1.25}>
										<InputLabel id="demo-simple-select-label">Seleccione un tipo</InputLabel>
										<FormControl fullWidth error={Boolean(touched.type && errors.type)}>
											<Select fullWidth labelId="demo-simple-select-label" id="demo-simple-select" {...getFieldProps("type")}>
												<MenuItem value={"audiencia"}>Audiencia</MenuItem>
												<MenuItem value={"vencimiento"}>Vencimiento</MenuItem>
												<MenuItem value={"reunion"}>Reunión</MenuItem>
												<MenuItem value={"otro"}>Otro</MenuItem>
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
												},
											},
										}}
									/>
									{touched.end && typeof errors.end === "string" && <FormHelperText error={true}>{errors.end}</FormHelperText>}
								</Stack>
							</Grid>
						</Grid>
					</DialogContent>
					<Divider />
					<DialogActions sx={{ p: 2.5 }}>
						<Grid container justifyContent="space-between" alignItems="center">
							<Grid item>
								{!isCreating && (
									<Tooltip title="Delete Event" placement="top">
										<IconButton onClick={deleteHandler} size="large" color="error">
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

import React from "react";
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
	Checkbox,
} from "@mui/material";
import { LocalizationProvider, MobileDateTimePicker } from "@mui/x-date-pickers";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import * as Yup from "yup";
import { useFormik, Form, FormikProvider, FormikValues } from "formik";
import IconButton from "components/@extended/IconButton";
import { dispatch, useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { deleteEvent, updateEvent } from "store/reducers/events";
import { Calendar, Trash, Google } from "iconsax-react";
import { DateRange } from "types/calendar";
import { addEvent } from "store/reducers/events";
import { useMemo, useState } from "react";
import { createGoogleEvent, updateGoogleEvent } from "store/reducers/googleCalendar";
import googleCalendarService from "services/googleCalendarService";

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
	{ label: "Google Calendar", value: "google", color: "#4285f4" },
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
	const { isConnected: isGoogleConnected } = useSelector((state: any) => state.googleCalendar);
	const [syncWithGoogle, setSyncWithGoogle] = useState(isGoogleConnected);

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
		onSubmit: async (values, { setSubmitting }) => {
			try {
				// Validar que haya un userId
				if (!userId) {
					dispatch(
						openSnackbar({
							open: true,
							message: "Error: No se pudo identificar el usuario. Por favor, recargue la página.",
							variant: "alert",
							alert: {
								color: "error",
							},
							close: true,
						}),
					);
					setSubmitting(false);
					return;
				}

				const newEvent = {
					userId: userId,
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
					const result = (await dispatch(updateEvent(event._id, newEvent))) as any;
					if (result && result.success) {
						// Si está conectado a Google y marcó sync, actualizar también en Google
						if (isGoogleConnected && syncWithGoogle && event.googleCalendarId) {
							await dispatch(updateGoogleEvent(event.googleCalendarId, newEvent));
						}
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
						onCancel();
					} else {
						const errorMessage = result?.error?.response?.data?.message || "Error al editar el evento. Intente más tarde.";
						dispatch(
							openSnackbar({
								open: true,
								message: errorMessage,
								variant: "alert",
								alert: {
									color: "error",
								},
								close: true,
							}),
						);
					}
				} else {
					// Si está conectado a Google y marcó sync, crear primero en Google
					let googleCalendarId = null;
					if (isGoogleConnected && syncWithGoogle) {
						try {
							// Crear primero en Google Calendar
							const tempEvent = { ...newEvent, _id: "temp-" + Date.now() };
							googleCalendarId = await dispatch(createGoogleEvent(tempEvent));
						} catch (error) {
							console.warn("No se pudo crear en Google Calendar, continuando sin sincronización:", error);
							// Continuar sin Google Calendar ID si falla
						}
					}

					// Crear en la base de datos (con o sin googleCalendarId)
					const eventToCreate = googleCalendarId ? { ...newEvent, googleCalendarId } : newEvent;
					const result = (await dispatch(addEvent(eventToCreate))) as any;

					if (result && result.success) {
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
						onCancel();
					} else {
						// Si falló la creación en BD pero se creó en Google, intentar eliminar de Google
						if (googleCalendarId) {
							try {
								await googleCalendarService.deleteEvent(googleCalendarId);
							} catch (error) {
								console.error("Error al revertir evento de Google Calendar:", error);
							}
						}

						const errorMessage = result?.error?.response?.data?.message || "Error al crear el evento. Intente más tarde.";
						dispatch(
							openSnackbar({
								open: true,
								message: errorMessage,
								variant: "alert",
								alert: {
									color: "error",
								},
								close: true,
							}),
						);
					}
				}

				setSubmitting(false);
			} catch (error) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Ha ocurrido un error inesperado. Intente más tarde.",
						variant: "alert",
						alert: {
							color: "error",
						},
						close: true,
					}),
				);
				setSubmitting(false);
			}
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
							<Stack direction="row" alignItems="center" spacing={1}>
								<Calendar size={24} color={theme.palette.primary.main} />
								{event ? (
									<Typography variant="h5" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
										Editar Evento
									</Typography>
								) : (
									<Typography variant="h5" sx={{ color: theme.palette.primary.main, fontWeight: 600 }}>
										Agregar Evento
									</Typography>
								)}
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
							gap: { xs: 1.5, sm: 2, md: 3 },
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

						<Grid container spacing={3}>
							<Grid item xs={12} md={6}>
								<FormControlLabel control={<Switch checked={values.allDay} {...getFieldProps("allDay")} />} label="Todo el día" />
							</Grid>
							{isGoogleConnected && (
								<Grid item xs={12} md={6}>
									<FormControlLabel
										control={
											<Checkbox
												checked={syncWithGoogle}
												onChange={(e) => setSyncWithGoogle(e.target.checked)}
												icon={<Google size={20} />}
												checkedIcon={<Google size={20} variant="Bold" />}
											/>
										}
										label="Sincronizar con Google Calendar"
									/>
								</Grid>
							)}
							<Grid item xs={12} md={6}>
								<Stack spacing={1.25}>
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

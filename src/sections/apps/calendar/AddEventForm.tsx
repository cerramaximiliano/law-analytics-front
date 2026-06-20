import React from "react";
import {
	Box,
	Button,
	CircularProgress,
	DialogActions,
	DialogContent,
	DialogTitle,
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
import { alpha } from "@mui/material/styles";
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
import { useTeam } from "contexts/TeamContext";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

const getInitialValues = (event: FormikValues | null, range: DateRange | null, defaultType?: string) => {
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
		type: defaultType || "",
	};
};

// Lista completa de referencia — se usa para resolver label/color de cualquier
// evento (incluidos los legacy "reunion"/"otro" y los importados "google").
const eventTypes = [
	{ label: "Audiencia", value: "audiencia", color: "#1890ff" },
	{ label: "Vencimiento", value: "vencimiento", color: "#ff4d4f" },
	{ label: "Reunión", value: "reunion", color: "#52c41a" },
	{ label: "Google Calendar", value: "google", color: "#4285f4" },
	{ label: "Otro", value: "otro", color: "#faad14" },
];

// Tipos elegibles cuando el evento se agrega desde un movimiento (un
// vencimiento o una audiencia surgen del movimiento judicial). En el
// calendario general no se aplica esta restricción.
const SELECTABLE_TYPE_VALUES = ["audiencia", "vencimiento"];

export interface AddEventFormProps {
	event?: FormikValues | null;
	range: DateRange | null;
	onCancel: () => void;
	userId?: string;
	folderId?: string;
	folderName?: string;
	// Vincular el evento a un movimiento (vencimientos desde los viewers de movimientos).
	movementRef?: string;
	movementSource?: "pjn" | "mev" | "scba" | "eje" | "manual" | null;
	// Tipo preseleccionado al crear (ej. "vencimiento" desde el viewer).
	defaultType?: string;
}

const AddEventFrom = ({
	event,
	range,
	onCancel,
	userId,
	folderId,
	folderName,
	movementRef,
	movementSource,
	defaultType,
}: AddEventFormProps) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const errorColor = theme.palette.error.main;
	const isCreating = useMemo(() => event == null || Object.keys(event).length === 0, [event]);
	const { isConnected: isGoogleConnected } = useSelector((state: any) => state.googleCalendar);
	const [syncWithGoogle, setSyncWithGoogle] = useState(isGoogleConnected);
	const { getTeamIdForResource, getRequestHeaders } = useTeam();

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

	const initialValues = useMemo(() => getInitialValues(event || null, range, defaultType), [event, range, defaultType]);

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

				const groupId = getTeamIdForResource();
				const newEvent = {
					userId: userId,
					...(groupId && { groupId }),
					folderId: folderId || undefined,
					...(movementRef && { movementRef, ...(movementSource ? { movementSource } : {}) }),
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
					const result = (await dispatch(addEvent(eventToCreate, { headers: getRequestHeaders() }))) as any;

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

	// Opciones del select de Tipo. Solo cuando el evento está vinculado a un
	// movimiento (movementRef presente, ej. el sub-tab "Vencim." del viewer PJN)
	// se limita a Audiencia/Vencimiento; en el calendario general se ofrecen
	// todos los tipos. Si se edita un evento de movimiento con un tipo legacy,
	// se incluye su tipo actual para no romper el Select ni forzarlo a cambiar.
	const typeOptions = useMemo(() => {
		if (!movementRef) return eventTypes;
		const base = eventTypes.filter((t) => SELECTABLE_TYPE_VALUES.includes(t.value));
		if (values.type && !base.some((t) => t.value === values.type)) {
			const legacy = eventTypes.find((t) => t.value === values.type);
			if (legacy) return [...base, legacy];
		}
		return base;
	}, [values.type, movementRef]);

	// Input sx común — brand border + focus brand
	const inputBrandSx = {
		"& .MuiOutlinedInput-root": {
			borderRadius: 1,
			"& fieldset": {
				borderColor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.14),
			},
			"&:hover fieldset": {
				borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
			},
			"&.Mui-focused fieldset": {
				borderColor: BRAND_BLUE,
			},
		},
		"& .MuiInputBase-input": {
			fontSize: "0.85rem",
		},
		"& .MuiInputBase-input::placeholder": {
			color: theme.palette.text.secondary,
			opacity: 0.6,
		},
	};

	// Eyebrow label brand-styled
	const eyebrowLabelSx = {
		fontSize: "0.78rem",
		fontWeight: 500,
		color: "text.primary",
		letterSpacing: "-0.005em",
		mb: 0.5,
	};

	// Accent map por tipo de evento
	const typeAccentMap: Record<string, string> = {
		audiencia: BRAND_BLUE,
		vencimiento: errorColor,
		reunion: LIVE_GREEN,
		google: "#4285f4",
		otro: STALE_AMBER,
	};

	return (
		<FormikProvider value={formik}>
			<LocalizationProvider dateAdapter={AdapterDateFns}>
				<Form autoComplete="off" noValidate onSubmit={handleSubmit}>
					{/* Header brand */}
					<DialogTitle
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
								flexShrink: 0,
							}}
						>
							<Calendar size={18} variant="Bulk" />
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
									{event ? "Editar" : "Nuevo"}
								</Typography>
							</Stack>
							<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
								{event ? "Editar evento" : "Agregar evento"}
							</Typography>
							{folderName && (
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
									{folderName}
								</Typography>
							)}
						</Stack>
					</DialogTitle>

					<DialogContent
						sx={{
							p: 2.5,
							display: "flex",
							flexDirection: "column",
							gap: 2,
						}}
					>
						{/* Título */}
						<Stack spacing={0.5}>
							<InputLabel htmlFor="event-title" sx={eyebrowLabelSx}>
								Título{" "}
								<Box component="span" sx={{ color: errorColor }}>
									*
								</Box>
							</InputLabel>
							<TextField
								id="event-title"
								fullWidth
								placeholder="Agregá un título"
								{...getFieldProps("title")}
								error={Boolean(touched.title && errors.title)}
								helperText={touched.title && typeof errors.title === "string" ? errors.title : ""}
								sx={inputBrandSx}
							/>
						</Stack>

						{/* Descripción */}
						<Stack spacing={0.5}>
							<InputLabel htmlFor="event-description" sx={eyebrowLabelSx}>
								Descripción
							</InputLabel>
							<TextField
								id="event-description"
								fullWidth
								multiline
								rows={3}
								placeholder="Agregá una descripción"
								{...getFieldProps("description")}
								error={Boolean(touched.description && errors.description)}
								helperText={touched.description && typeof errors.description === "string" ? errors.description : ""}
								sx={inputBrandSx}
							/>
						</Stack>

						{/* Toggles: Todo el día + Google sync */}
						<Stack
							direction={{ xs: "column", sm: "row" }}
							spacing={1.25}
							sx={{
								p: 1.25,
								borderRadius: 1.25,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
							}}
						>
							<FormControlLabel
								sx={{ m: 0 }}
								control={
									<Switch
										checked={values.allDay}
										{...getFieldProps("allDay")}
										size="small"
										sx={{
											"& .MuiSwitch-thumb": {
												backgroundColor: values.allDay ? BRAND_BLUE : undefined,
											},
											"& .MuiSwitch-track": {
												backgroundColor: values.allDay ? `${alpha(BRAND_BLUE, 0.5)} !important` : undefined,
											},
										}}
									/>
								}
								label={
									<Typography sx={{ fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em", ml: 0.5 }}>
										Todo el día
									</Typography>
								}
							/>
							{isGoogleConnected && (
								<FormControlLabel
									sx={{ m: 0 }}
									control={
										<Checkbox
											checked={syncWithGoogle}
											onChange={(e) => setSyncWithGoogle(e.target.checked)}
											icon={<Google size={18} />}
											checkedIcon={<Google size={18} variant="Bold" />}
											size="small"
											sx={{
												color: alpha(BRAND_BLUE, 0.5),
												"&.Mui-checked": { color: BRAND_BLUE },
											}}
										/>
									}
									label={
										<Typography sx={{ fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em", ml: 0.5 }}>
											Sincronizar con Google Calendar
										</Typography>
									}
								/>
							)}
						</Stack>

						{/* Grid: tipo + fechas */}
						<Grid container spacing={2}>
							{/* Tipo */}
							<Grid item xs={12} md={6}>
								<Stack spacing={0.5}>
									<InputLabel id="event-type-label" sx={eyebrowLabelSx}>
										Tipo{" "}
										<Box component="span" sx={{ color: errorColor }}>
											*
										</Box>
									</InputLabel>
									<FormControl fullWidth error={Boolean(touched.type && errors.type)}>
										<Select
											fullWidth
											labelId="event-type-label"
											id="event-type"
											displayEmpty
											{...getFieldProps("type")}
											renderValue={(value: any) => {
												if (!value) {
													return <Typography sx={{ fontSize: "0.85rem", color: "text.secondary" }}>Seleccioná un tipo</Typography>;
												}
												const selected = eventTypes.find((t) => t.value === value);
												if (!selected) return value;
												return (
													<Stack direction="row" spacing={0.875} alignItems="center">
														<Box
															sx={{
																width: 8,
																height: 8,
																borderRadius: "50%",
																bgcolor: selected.color,
																flexShrink: 0,
															}}
														/>
														<Typography sx={{ fontSize: "0.85rem", color: "text.primary", letterSpacing: "-0.005em" }}>
															{selected.label}
														</Typography>
													</Stack>
												);
											}}
											onChange={(e) => {
												const selectedType = eventTypes.find((type) => type.value === e.target.value);
												setFieldValue("type", selectedType?.value || "");
												setFieldValue("color", selectedType?.color || "#1890ff");
											}}
											sx={{
												borderRadius: 1,
												"& .MuiOutlinedInput-notchedOutline": {
													borderColor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.14),
												},
												"&:hover .MuiOutlinedInput-notchedOutline": {
													borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
												},
												"&.Mui-focused .MuiOutlinedInput-notchedOutline": {
													borderColor: BRAND_BLUE,
												},
											}}
										>
											{typeOptions.map((type) => {
												const accent = typeAccentMap[type.value] ?? type.color;
												return (
													<MenuItem value={type.value} key={type.value} sx={{ py: 1 }}>
														<Stack direction="row" spacing={1} alignItems="center" sx={{ width: "100%" }}>
															<Box
																sx={{
																	width: 8,
																	height: 8,
																	borderRadius: "50%",
																	bgcolor: accent,
																	flexShrink: 0,
																}}
															/>
															<Typography sx={{ fontSize: "0.85rem", letterSpacing: "-0.005em", flex: 1 }}>{type.label}</Typography>
														</Stack>
													</MenuItem>
												);
											})}
										</Select>
										{touched.type && typeof errors.type === "string" && (
											<FormHelperText error sx={{ ml: 0 }}>
												{errors.type}
											</FormHelperText>
										)}
									</FormControl>
								</Stack>
							</Grid>

							{/* Fecha inicio */}
							<Grid item xs={12} md={6}>
								<Stack spacing={0.5}>
									<InputLabel htmlFor="cal-start-date" sx={eyebrowLabelSx}>
										Fecha de inicio{" "}
										<Box component="span" sx={{ color: errorColor }}>
											*
										</Box>
									</InputLabel>
									<MobileDateTimePicker
										value={values.start}
										format="dd/MM/yyyy hh:mm a"
										onChange={(date) => setFieldValue("start", date)}
										slotProps={{
											textField: {
												fullWidth: true,
												InputProps: {
													endAdornment: (
														<InputAdornment position="end" sx={{ cursor: "pointer" }}>
															<Calendar size={16} variant="Bulk" color={BRAND_BLUE} />
														</InputAdornment>
													),
												},
												sx: inputBrandSx,
											},
										}}
									/>
									{touched.start && typeof errors.start === "string" && (
										<FormHelperText error sx={{ ml: 0 }}>
											{errors.start as string}
										</FormHelperText>
									)}
								</Stack>
							</Grid>

							{/* Fecha fin */}
							<Grid item xs={12} md={6}>
								<Stack spacing={0.5}>
									<InputLabel htmlFor="cal-end-date" sx={eyebrowLabelSx}>
										Fecha de fin{" "}
										<Box component="span" sx={{ color: errorColor }}>
											*
										</Box>
									</InputLabel>
									<MobileDateTimePicker
										value={values.end}
										format="dd/MM/yyyy hh:mm a"
										onChange={(date) => setFieldValue("end", date)}
										slotProps={{
											textField: {
												fullWidth: true,
												InputProps: {
													endAdornment: (
														<InputAdornment position="end" sx={{ cursor: "pointer" }}>
															<Calendar size={16} variant="Bulk" color={BRAND_BLUE} />
														</InputAdornment>
													),
												},
												sx: inputBrandSx,
											},
										}}
									/>
									{touched.end && typeof errors.end === "string" && (
										<FormHelperText error sx={{ ml: 0 }}>
											{errors.end}
										</FormHelperText>
									)}
								</Stack>
							</Grid>
						</Grid>
					</DialogContent>

					{/* Actions footer brand */}
					<DialogActions
						sx={{
							px: 2.5,
							py: 1.75,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02),
							borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
						}}
					>
						<Stack direction="row" justifyContent="space-between" alignItems="center" sx={{ width: "100%" }}>
							<Box>
								{!isCreating && (
									<Tooltip title="Eliminar evento" placement="top">
										<IconButton
											onClick={deleteHandler}
											sx={{
												width: 36,
												height: 36,
												borderRadius: 1,
												color: errorColor,
												transition: "all 180ms ease",
												"&:hover": {
													color: errorColor,
													bgcolor: alpha(errorColor, isDark ? 0.14 : 0.08),
												},
											}}
										>
											<Trash size={18} variant="Bulk" />
										</IconButton>
									</Tooltip>
								)}
							</Box>
							<Stack direction="row" spacing={1.25} alignItems="center">
								<Button
									onClick={onCancel}
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
									startIcon={isSubmitting ? <CircularProgress size={14} sx={{ color: "#fff" }} /> : undefined}
									sx={{
										minWidth: 110,
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
									{isSubmitting ? "Guardando…" : event ? "Guardar cambios" : "Agregar evento"}
								</Button>
							</Stack>
						</Stack>
					</DialogActions>
				</Form>
			</LocalizationProvider>
		</FormikProvider>
	);
};

export default AddEventFrom;

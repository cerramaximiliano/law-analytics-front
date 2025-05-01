import { useState, useEffect } from "react";
import axios from "axios";
import { useSearchParams, useNavigate } from "react-router-dom";
import { DatePicker } from "@mui/x-date-pickers/DatePicker";

// material-ui
import {
	Box,
	Grid,
	Switch,
	FormControlLabel,
	Typography,
	Card,
	CardContent,
	Stack,
	Divider,
	Slider,
	Button,
	Tooltip,
	Alert,
	TextField,
	CircularProgress,
	Snackbar,
	IconButton as MuiIconButton,
	Checkbox,
	Select,
	MenuItem,
	Dialog,
	DialogTitle,
	DialogContent,
	DialogActions,
	InputLabel,
	FormControl,
	FormGroup,
	Chip,
} from "@mui/material";
import { TimePicker } from "@mui/x-date-pickers/TimePicker";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { es } from "date-fns/locale";

// project imports
import MainCard from "components/MainCard";
import IconButton from "components/@extended/IconButton";
import { dispatch, useSelector } from "store";
import { openSnackbar } from "store/reducers/snackbar";

// assets
import { Calendar as CalendarIcon, Clock, InfoCircle, Save2, Link, Add, CloseCircle, Edit2 } from "iconsax-react";

// Tipos para la API de disponibilidad
interface TimeSlot {
	day: number;
	startTime: string;
	endTime: string;
	isActive: boolean;
}

interface ExcludedDate {
	date: Date;
	reason?: string;
}

interface HostNotifications {
	email: boolean;
	browser: boolean;
}

interface RequiredFields {
	name: boolean;
	email: boolean;
	phone: boolean;
	notes: boolean;
	company: boolean;
	address: boolean;
}

interface CustomField {
	name: string;
	required: boolean;
	type: "text" | "number" | "select" | "checkbox";
	options: string[]; // Para tipo 'select'
}

// Definición del tipo de la configuración de disponibilidad
type AvailabilityConfig = {
	_id: string;
	userId: string;
	title: string;
	description: string;
	duration: number;
	color: string;
	timezone: string;
	bufferBefore: number;
	bufferAfter: number;
	maxDaysInAdvance: number; // Máximo días hacia adelante para reservar
	minNoticeHours: number; // Horas mínimas de anticipación
	maxDailyBookings: number | null; // Máximo de reservas por día
	maxWeeklyBookings: number | null; // Máximo de reservas por semana
	isActive: boolean;
	requireApproval: boolean;
	publicUrl: string;
	timeSlots: TimeSlot[];
	excludedDates: ExcludedDate[];
	hostNotifications: HostNotifications;
	requiredFields: RequiredFields;
	customFields: CustomField[];
};

// Días de la semana
const weekdays = [
	{ id: 1, name: "Lunes", shortName: "LUN" },
	{ id: 2, name: "Martes", shortName: "MAR" },
	{ id: 3, name: "Miércoles", shortName: "MIÉ" },
	{ id: 4, name: "Jueves", shortName: "JUE" },
	{ id: 5, name: "Viernes", shortName: "VIE" },
	{ id: 6, name: "Sábado", shortName: "SÁB" },
	{ id: 0, name: "Domingo", shortName: "DOM" },
];

// Tipos de campos personalizados disponibles
const fieldTypes = [
	{ value: "text", label: "Texto" },
	{ value: "number", label: "Número" },
	{ value: "select", label: "Selección" },
	{ value: "checkbox", label: "Casilla de verificación" },
];

// ==============================|| AVAILABILITY SETTINGS ||============================== //

const Availability = () => {
	const { user } = useSelector((state) => state.auth);
	const [searchParams] = useSearchParams();
	const navigate = useNavigate();

	// Estados para manejo de la API
	const [loading, setLoading] = useState(true);
	const [saving, setSaving] = useState(false);
	const [availabilityId, setAvailabilityId] = useState<string | null>(searchParams.get("id"));
	const [publicUrl, setPublicUrl] = useState<string>("");
	const [publicUrlCopied, setPublicUrlCopied] = useState(false);

	// Estado para controlar la disponibilidad de cada día
	const [availableDays, setAvailableDays] = useState<number[]>([1, 2, 3, 4, 5]); // Por defecto L-V

	// Creación de fechas para los selectores de hora
	const morningTime = new Date();
	morningTime.setHours(9, 0, 0, 0);

	const eveningTime = new Date();
	eveningTime.setHours(18, 0, 0, 0);

	const [startTime, setStartTime] = useState<Date | null>(morningTime);
	const [endTime, setEndTime] = useState<Date | null>(eveningTime);
	const [slotDuration, setSlotDuration] = useState<number>(30); // Duración por defecto: 30 minutos
	const [bufferTime, setBufferTime] = useState<number>(10); // Tiempo de descanso: 10 minutos
	const [autoAccept, setAutoAccept] = useState<boolean>(false);
	const [notificationEnabled, setNotificationEnabled] = useState<boolean>(true);

	// Nuevos estados para configuraciones adicionales
	const [maxDaysInAdvance, setMaxDaysInAdvance] = useState<number>(60);
	const [minNoticeHours, setMinNoticeHours] = useState<number>(24);
	const [maxDailyBookings, setMaxDailyBookings] = useState<number | null>(null);
	const [maxWeeklyBookings, setMaxWeeklyBookings] = useState<number | null>(null);
	const [excludedDates, setExcludedDates] = useState<ExcludedDate[]>([]);
	const [customFields, setCustomFields] = useState<CustomField[]>([]);

	// Estado para los campos requeridos
	const [requiredFields, setRequiredFields] = useState<RequiredFields>({
		name: true,
		email: true,
		phone: false,
		notes: false,
		company: false,
		address: false,
	});

	// Estados para diálogos
	const [openExcludedDateDialog, setOpenExcludedDateDialog] = useState(false);
	const [openCustomFieldDialog, setOpenCustomFieldDialog] = useState(false);
	const [newExcludedDate, setNewExcludedDate] = useState<Date | null>(new Date());
	const [excludedDateReason, setExcludedDateReason] = useState("");
	const [newCustomField, setNewCustomField] = useState<CustomField>({
		name: "",
		required: false,
		type: "text",
		options: [],
	});
	const [newFieldOption, setNewFieldOption] = useState("");
	const [editingFieldIndex, setEditingFieldIndex] = useState<number | null>(null);

	// Función para aplicar la configuración a los estados
	const applyConfigData = (config: AvailabilityConfig) => {
		// Guardar la URL pública
		setPublicUrl(config.publicUrl);

		// Extraer días únicos de los timeSlots
		const availableDaysList = config.timeSlots.map((slot: TimeSlot) => slot.day);
		const uniqueDays = [...new Set(availableDaysList)] as number[];
		setAvailableDays(uniqueDays);

		// Tomar el primer horario como referencia para inicio y fin
		if (config.timeSlots && config.timeSlots.length > 0) {
			const firstSlot = config.timeSlots[0];

			// Crear objetos Date para los time pickers
			if (firstSlot.startTime) {
				const startDate = new Date();
				const [startHours, startMinutes] = firstSlot.startTime.split(":").map(Number);
				startDate.setHours(startHours, startMinutes, 0, 0);
				setStartTime(startDate);
			}

			if (firstSlot.endTime) {
				const endDate = new Date();
				const [endHours, endMinutes] = firstSlot.endTime.split(":").map(Number);
				endDate.setHours(endHours, endMinutes, 0, 0);
				setEndTime(endDate);
			}
		}

		// Configuración de duración y buffer
		setSlotDuration(config.duration);
		setBufferTime(config.bufferBefore + config.bufferAfter);

		// Configuración de aprobación automática
		setAutoAccept(!config.requireApproval);

		// Configuración de notificaciones
		setNotificationEnabled(config.hostNotifications?.email || config.hostNotifications?.browser);

		// Nuevas configuraciones adicionales
		setMaxDaysInAdvance(config.maxDaysInAdvance || 60);
		setMinNoticeHours(config.minNoticeHours || 24);
		setMaxDailyBookings(config.maxDailyBookings);
		setMaxWeeklyBookings(config.maxWeeklyBookings);

		// Fechas excluidas
		if (config.excludedDates && config.excludedDates.length > 0) {
			setExcludedDates(config.excludedDates);
		}

		// Campos personalizados
		if (config.customFields && config.customFields.length > 0) {
			setCustomFields(config.customFields);
		}

		// Campos requeridos
		if (config.requiredFields) {
			setRequiredFields(config.requiredFields);
		}
	};

	// Cargar configuración al iniciar
	useEffect(() => {
		if (user && user._id) {
			loadAvailabilitySettings();
		}
	}, [user]);

	// Función para cargar la configuración existente
	const loadAvailabilitySettings = async () => {
		setLoading(true);
		try {
			let response;

			// Si hay un ID específico en la URL, cargar esa configuración
			if (availabilityId) {
				response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/booking/availability/${availabilityId}`);

				// Verificar respuesta exitosa
				if (response.status !== 200) {
					throw new Error("Error al cargar configuración específica");
				}

				// En este caso la respuesta es un objeto, no un array
				const activeConfig = response.data as AvailabilityConfig;

				// Guardar el ID para actualizar en lugar de crear nueva
				setAvailabilityId(activeConfig._id);

				// Aplicar configuración
				applyConfigData(activeConfig);
			} else {
				// Cargar todas las configuraciones disponibles
				response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/booking/availability`);

				// Verificar respuesta exitosa
				if (response.status !== 200) {
					throw new Error("Error al cargar configuración");
				}

				const data = response.data as AvailabilityConfig[];

				// Si hay configuraciones existentes, tomar la primera activa
				const activeConfig = data.find((config: AvailabilityConfig) => config.isActive) || data[0];

				if (activeConfig) {
					// Guardar el ID para actualizar en lugar de crear nueva
					setAvailabilityId(activeConfig._id);

					// Aplicar configuración
					applyConfigData(activeConfig);
				}
			}
		} catch (error) {
			console.error("Error al cargar configuración:", error);
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al cargar configuración existente",
					variant: "alert",
					alert: {
						color: "error",
					},
					close: false,
				}),
			);
		} finally {
			setLoading(false);
		}
	};

	// Manejadores
	const handleDayToggle = (dayId: number) => {
		if (availableDays.includes(dayId)) {
			setAvailableDays(availableDays.filter((id) => id !== dayId));
		} else {
			setAvailableDays([...availableDays, dayId].sort());
		}
	};

	// Función auxiliar para formatear la hora
	const formatTime = (date: Date | null): string => {
		if (!date) return "09:00";
		return `${String(date.getHours()).padStart(2, "0")}:${String(date.getMinutes()).padStart(2, "0")}`;
	};

	// Manejadores para fechas excluidas
	const handleAddExcludedDate = () => {
		if (newExcludedDate) {
			setExcludedDates([...excludedDates, { date: newExcludedDate, reason: excludedDateReason }]);
			setNewExcludedDate(new Date());
			setExcludedDateReason("");
			setOpenExcludedDateDialog(false);
		}
	};

	const handleRemoveExcludedDate = (index: number) => {
		const newDates = [...excludedDates];
		newDates.splice(index, 1);
		setExcludedDates(newDates);
	};

	// Manejadores para campos personalizados
	const handleAddCustomField = () => {
		if (newCustomField.name) {
			if (editingFieldIndex !== null) {
				const updatedFields = [...customFields];
				updatedFields[editingFieldIndex] = newCustomField;
				setCustomFields(updatedFields);
			} else {
				setCustomFields([...customFields, newCustomField]);
			}
			setNewCustomField({
				name: "",
				required: false,
				type: "text",
				options: [],
			});
			setEditingFieldIndex(null);
			setOpenCustomFieldDialog(false);
		}
	};

	const handleRemoveCustomField = (index: number) => {
		const newFields = [...customFields];
		newFields.splice(index, 1);
		setCustomFields(newFields);
	};

	const handleEditCustomField = (index: number) => {
		setNewCustomField({ ...customFields[index] });
		setEditingFieldIndex(index);
		setOpenCustomFieldDialog(true);
	};

	const handleAddFieldOption = () => {
		if (newFieldOption && !newCustomField.options.includes(newFieldOption)) {
			setNewCustomField({
				...newCustomField,
				options: [...newCustomField.options, newFieldOption],
			});
			setNewFieldOption("");
		}
	};

	const handleRemoveFieldOption = (option: string) => {
		setNewCustomField({
			...newCustomField,
			options: newCustomField.options.filter((o) => o !== option),
		});
	};

	// Manejador para campos requeridos
	const handleRequiredFieldChange = (field: keyof RequiredFields) => {
		setRequiredFields({
			...requiredFields,
			[field]: !requiredFields[field],
		});
	};

	// Función para guardar la configuración
	const handleSaveSettings = async () => {
		// Validar que al menos haya un día seleccionado
		if (availableDays.length === 0) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Debes seleccionar al menos un día disponible",
					variant: "alert",
					alert: {
						color: "error",
					},
					close: false,
				}),
			);
			return;
		}

		// Validar que la hora de inicio sea anterior a la de fin
		if (startTime && endTime && startTime >= endTime) {
			dispatch(
				openSnackbar({
					open: true,
					message: "La hora de inicio debe ser anterior a la de finalización",
					variant: "alert",
					alert: {
						color: "error",
					},
					close: false,
				}),
			);
			return;
		}

		setSaving(true);
		try {
			// Generar URL pública si no existe
			const urlToUse = publicUrl || `citas-${Date.now()}`;

			// Generar timeSlots a partir de días disponibles y horarios
			const timeSlots = availableDays.map((day) => ({
				day: day,
				startTime: formatTime(startTime),
				endTime: formatTime(endTime),
				isActive: true,
			}));

			// Obtener el nombre del usuario para incluirlo en el título o descripción
			const userName = user?.name || user?.lastName || user?.email?.split("@")[0] || "Profesional";

			// Construir objeto de configuración
			const availabilityData = {
				title: `Citas con ${userName}`,
				description: `Agenda tu cita con ${userName}. Horario disponible para consultas y reuniones.`,
				duration: slotDuration,
				bufferBefore: Math.floor(bufferTime / 2), // Dividimos el buffer entre antes y después
				bufferAfter: Math.ceil(bufferTime / 2),
				requireApproval: !autoAccept,
				maxDaysInAdvance: maxDaysInAdvance,
				minNoticeHours: minNoticeHours,
				maxDailyBookings: maxDailyBookings,
				maxWeeklyBookings: maxWeeklyBookings,
				hostNotifications: {
					email: notificationEnabled,
					browser: notificationEnabled,
				},
				timeSlots: timeSlots,
				excludedDates: excludedDates,
				customFields: customFields,
				timezone: "America/Mexico_City",
				isActive: true,
				publicUrl: urlToUse,
				requiredFields: requiredFields,
			};

			// Determinar si es una actualización o una creación
			let response;

			if (availabilityId) {
				// Actualizar configuración existente
				response = await axios.put(`${process.env.REACT_APP_BASE_URL}/api/booking/availability/${availabilityId}`, availabilityData);
			} else {
				// Crear nueva configuración
				response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/booking/availability`, availabilityData);
			}

			// Verificar respuesta exitosa
			if (response.status !== 200 && response.status !== 201) {
				throw new Error("Error al guardar configuración");
			}

			const savedData = response.data as AvailabilityConfig;

			// Actualizar el ID y URL si es una creación nueva
			if (!availabilityId) {
				setAvailabilityId(savedData._id);
			}
			setPublicUrl(savedData.publicUrl);

			// Mostrar notificación de éxito
			dispatch(
				openSnackbar({
					open: true,
					message: "Configuración de citas guardada correctamente",
					variant: "alert",
					alert: {
						color: "success",
					},
					close: false,
				}),
			);

			// Después de guardar, redirigir a la página de reservas
			navigate("/apps/calendar/reservations");
		} catch (error) {
			console.error("Error al guardar configuración:", error);
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al guardar configuración",
					variant: "alert",
					alert: {
						color: "error",
					},
					close: false,
				}),
			);
		} finally {
			setSaving(false);
		}
	};

	const handleCopyLink = () => {
		const fullUrl = `${window.location.origin}/booking/${publicUrl}`;
		navigator.clipboard.writeText(fullUrl);
		setPublicUrlCopied(true);
		setTimeout(() => setPublicUrlCopied(false), 3000);
	};

	return (
		<MainCard title="Configuración de Citas">
			{loading ? (
				<Box display="flex" justifyContent="center" alignItems="center" sx={{ py: 8 }}>
					<CircularProgress />
				</Box>
			) : (
				<Grid container spacing={3}>
					{/* Card de horarios y días disponibles */}
					<Grid item xs={12} md={6}>
						<Card>
							<CardContent>
								<Stack spacing={3}>
									<Stack direction="row" justifyContent="space-between" alignItems="center">
										<Typography variant="h5" sx={{ display: "flex", alignItems: "center" }}>
											<CalendarIcon size={22} style={{ marginRight: "8px" }} />
											Días disponibles
										</Typography>
										<Tooltip title="Selecciona los días en los que estarás disponible para citas">
											<IconButton color="primary" size="small">
												<InfoCircle variant="Linear" />
											</IconButton>
										</Tooltip>
									</Stack>

									<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
										{weekdays.map((day) => (
											<Button
												key={day.id}
												variant={availableDays.includes(day.id) ? "contained" : "outlined"}
												onClick={() => handleDayToggle(day.id)}
												sx={{
													minWidth: { xs: "40px", sm: "64px" },
													fontSize: { xs: "0.75rem", sm: "0.875rem" },
													py: 1,
												}}
											>
												{day.shortName}
											</Button>
										))}
									</Box>

									<Divider />

									<Stack direction="row" justifyContent="space-between" alignItems="center">
										<Typography variant="h5" sx={{ display: "flex", alignItems: "center" }}>
											<Clock size={22} style={{ marginRight: "8px" }} />
											Horario de atención
										</Typography>
										<Tooltip title="Define tu horario laboral para citas">
											<IconButton color="primary" size="small">
												<InfoCircle variant="Linear" />
											</IconButton>
										</Tooltip>
									</Stack>

									<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
										<Grid container spacing={2}>
											<Grid item xs={6}>
												<TimePicker
													label="Hora de inicio"
													value={startTime}
													onChange={(newValue) => setStartTime(newValue)}
													ampm={false}
													slotProps={{ textField: { fullWidth: true, size: "small" } }}
												/>
											</Grid>
											<Grid item xs={6}>
												<TimePicker
													label="Hora de finalización"
													value={endTime}
													onChange={(newValue) => setEndTime(newValue)}
													ampm={false}
													slotProps={{ textField: { fullWidth: true, size: "small" } }}
												/>
											</Grid>
										</Grid>
									</LocalizationProvider>

									{availabilityId && (
										<>
											<Divider />
											<Stack spacing={2}>
												<Typography variant="h5" sx={{ display: "flex", alignItems: "center" }}>
													<Link size={22} style={{ marginRight: "8px" }} />
													Enlace para citas
												</Typography>

												<TextField
													fullWidth
													size="small"
													value={`${window.location.origin}/booking/${publicUrl}`}
													InputProps={{
														readOnly: true,
														endAdornment: (
															<Button sx={{ ml: 1 }} onClick={handleCopyLink} startIcon={<Link size={18} />}>
																Copiar
															</Button>
														),
													}}
												/>
												<Typography variant="caption" color="textSecondary">
													Comparte este enlace con tus clientes para que puedan agendar citas contigo.
												</Typography>
											</Stack>
										</>
									)}

									<Divider />

									{/* Sección de Fechas Excluidas */}
									<Stack spacing={2}>
										<Stack direction="row" justifyContent="space-between" alignItems="center">
											<Typography variant="h5" sx={{ display: "flex", alignItems: "center" }}>
												<CalendarIcon size={22} style={{ marginRight: "8px" }} />
												Fechas bloqueadas
											</Typography>
											<Tooltip title="Bloquea fechas específicas en las que no estarás disponible">
												<IconButton color="primary" size="small">
													<InfoCircle variant="Linear" />
												</IconButton>
											</Tooltip>
										</Stack>

										<Button
											variant="outlined"
											startIcon={<Add />}
											onClick={() => setOpenExcludedDateDialog(true)}
											sx={{ alignSelf: "flex-start" }}
										>
											Agregar fecha bloqueada
										</Button>

										{excludedDates.length > 0 ? (
											<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1 }}>
												{excludedDates.map((item, index) => (
													<Chip
														key={index}
														label={`${new Date(item.date).toLocaleDateString()} ${item.reason ? `- ${item.reason}` : ""}`}
														onDelete={() => handleRemoveExcludedDate(index)}
														color="error"
														variant="outlined"
													/>
												))}
											</Box>
										) : (
											<Typography variant="body2" color="textSecondary">
												No hay fechas bloqueadas. Agrega las fechas en las que no estarás disponible para citas.
											</Typography>
										)}
									</Stack>
								</Stack>
							</CardContent>
						</Card>
					</Grid>

					{/* Card de configuración de citas */}
					<Grid item xs={12} md={6}>
						<Card>
							<CardContent>
								<Stack spacing={3}>
									<Stack direction="row" justifyContent="space-between" alignItems="center">
										<Typography variant="h5">Configuración de citas</Typography>
										<Tooltip title="Configura cómo se gestionarán tus citas">
											<IconButton color="primary" size="small">
												<InfoCircle variant="Linear" />
											</IconButton>
										</Tooltip>
									</Stack>

									<Stack spacing={2}>
										<Typography variant="subtitle2">Duración de las citas</Typography>
										<Stack direction="row" spacing={2} alignItems="center">
											<Typography variant="body2" sx={{ minWidth: "30px" }}>
												{slotDuration} min
											</Typography>
											<Slider
												value={slotDuration}
												onChange={(_event, newValue) => setSlotDuration(newValue as number)}
												step={5}
												marks
												min={15}
												max={120}
												valueLabelDisplay="auto"
												aria-labelledby="slot-duration-slider"
											/>
										</Stack>
									</Stack>

									<Stack spacing={2}>
										<Typography variant="subtitle2">Tiempo de descanso entre citas</Typography>
										<Stack direction="row" spacing={2} alignItems="center">
											<Typography variant="body2" sx={{ minWidth: "30px" }}>
												{bufferTime} min
											</Typography>
											<Slider
												value={bufferTime}
												onChange={(_event, newValue) => setBufferTime(newValue as number)}
												step={5}
												min={0}
												max={60}
												valueLabelDisplay="auto"
												aria-labelledby="buffer-time-slider"
											/>
										</Stack>
									</Stack>

									<Divider />

									{/* Configuraciones adicionales */}
									<Stack spacing={2}>
										<Typography variant="subtitle2">Tiempo máximo de anticipación</Typography>
										<Stack direction="row" spacing={2} alignItems="center">
											<Typography variant="body2" sx={{ minWidth: "30px" }}>
												{maxDaysInAdvance} días
											</Typography>
											<Slider
												value={maxDaysInAdvance}
												onChange={(_event, newValue) => setMaxDaysInAdvance(newValue as number)}
												step={5}
												marks
												min={5}
												max={120}
												valueLabelDisplay="auto"
												aria-labelledby="max-days-slider"
											/>
										</Stack>
										<Typography variant="caption" color="textSecondary">
											Máximo número de días en el futuro para los que se pueden agendar citas.
										</Typography>
									</Stack>

									<Stack spacing={2}>
										<Typography variant="subtitle2">Tiempo mínimo de anticipación</Typography>
										<Stack direction="row" spacing={2} alignItems="center">
											<Typography variant="body2" sx={{ minWidth: "30px" }}>
												{minNoticeHours} hrs
											</Typography>
											<Slider
												value={minNoticeHours}
												onChange={(_event, newValue) => setMinNoticeHours(newValue as number)}
												step={1}
												marks
												min={0}
												max={72}
												valueLabelDisplay="auto"
												aria-labelledby="min-hours-slider"
											/>
										</Stack>
										<Typography variant="caption" color="textSecondary">
											Tiempo mínimo de anticipación para agendar una cita.
										</Typography>
									</Stack>

									<Grid container spacing={2}>
										<Grid item xs={6}>
											<TextField
												fullWidth
												type="number"
												label="Máximo de citas por día"
												InputProps={{ inputProps: { min: 0 } }}
												value={maxDailyBookings !== null ? maxDailyBookings : ""}
												onChange={(e) => {
													const val = e.target.value !== "" ? parseInt(e.target.value) : null;
													setMaxDailyBookings(val);
												}}
												size="small"
												placeholder="Sin límite"
												helperText="Deja en blanco para sin límite"
											/>
										</Grid>
										<Grid item xs={6}>
											<TextField
												fullWidth
												type="number"
												label="Máximo de citas por semana"
												InputProps={{ inputProps: { min: 0 } }}
												value={maxWeeklyBookings !== null ? maxWeeklyBookings : ""}
												onChange={(e) => {
													const val = e.target.value !== "" ? parseInt(e.target.value) : null;
													setMaxWeeklyBookings(val);
												}}
												size="small"
												placeholder="Sin límite"
												helperText="Deja en blanco para sin límite"
											/>
										</Grid>
									</Grid>

									<Divider />

									<FormControlLabel
										control={<Switch checked={autoAccept} onChange={(e) => setAutoAccept(e.target.checked)} color="primary" />}
										label="Aceptar citas automáticamente"
									/>

									<FormControlLabel
										control={
											<Switch checked={notificationEnabled} onChange={(e) => setNotificationEnabled(e.target.checked)} color="primary" />
										}
										label="Recibir notificaciones de citas"
									/>

									<Alert severity="info" sx={{ mt: 2 }}>
										Las citas se crearán con un margen de {bufferTime} minutos entre ellas y tendrán una duración de {slotDuration} minutos.
										{!autoAccept && " Las citas requerirán tu aprobación manual."}
									</Alert>
								</Stack>
							</CardContent>
						</Card>
					</Grid>

					{/* Card de Campos Requeridos y Personalizados */}
					<Grid item xs={12}>
						<Card>
							<CardContent>
								<Stack spacing={3}>
									<Stack direction="row" justifyContent="space-between" alignItems="center">
										<Typography variant="h5">Información del cliente</Typography>
										<Tooltip title="Configura qué información necesitas recopilar de tus clientes">
											<IconButton color="primary" size="small">
												<InfoCircle variant="Linear" />
											</IconButton>
										</Tooltip>
									</Stack>

									<Grid container spacing={3}>
										{/* Campos Requeridos */}
										<Grid item xs={12} md={6}>
											<Stack spacing={2}>
												<Typography variant="subtitle2">Campos obligatorios</Typography>
												<FormGroup>
													<FormControlLabel
														control={<Checkbox checked={requiredFields.name} onChange={() => handleRequiredFieldChange("name")} />}
														label="Nombre"
													/>
													<FormControlLabel
														control={<Checkbox checked={requiredFields.email} onChange={() => handleRequiredFieldChange("email")} />}
														label="Correo electrónico"
													/>
													<FormControlLabel
														control={<Checkbox checked={requiredFields.phone} onChange={() => handleRequiredFieldChange("phone")} />}
														label="Teléfono"
													/>
													<FormControlLabel
														control={<Checkbox checked={requiredFields.notes} onChange={() => handleRequiredFieldChange("notes")} />}
														label="Notas"
													/>
													<FormControlLabel
														control={<Checkbox checked={requiredFields.company} onChange={() => handleRequiredFieldChange("company")} />}
														label="Empresa"
													/>
													<FormControlLabel
														control={<Checkbox checked={requiredFields.address} onChange={() => handleRequiredFieldChange("address")} />}
														label="Dirección"
													/>
												</FormGroup>
											</Stack>
										</Grid>

										{/* Campos Personalizados */}
										<Grid item xs={12} md={6}>
											<Stack spacing={2}>
												<Stack direction="row" justifyContent="space-between" alignItems="center">
													<Typography variant="subtitle2">Campos personalizados</Typography>
													<Button
														variant="outlined"
														size="small"
														startIcon={<Add />}
														onClick={() => {
															setNewCustomField({
																name: "",
																required: false,
																type: "text",
																options: [],
															});
															setEditingFieldIndex(null);
															setOpenCustomFieldDialog(true);
														}}
													>
														Agregar campo
													</Button>
												</Stack>

												{customFields.length > 0 ? (
													<Stack spacing={1}>
														{customFields.map((field, index) => (
															<Box key={index} sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
																<Stack direction="row" justifyContent="space-between" alignItems="center">
																	<Stack>
																		<Typography variant="subtitle2">
																			{field.name} {field.required && <sup>*</sup>}
																		</Typography>
																		<Typography variant="caption" color="textSecondary">
																			Tipo: {fieldTypes.find((t) => t.value === field.type)?.label}
																			{field.type === "select" && field.options.length > 0 && ` (Opciones: ${field.options.join(", ")})`}
																		</Typography>
																	</Stack>
																	<Stack direction="row" spacing={1}>
																		<MuiIconButton size="small" onClick={() => handleEditCustomField(index)}>
																			<Edit2 size={18} />
																		</MuiIconButton>
																		<MuiIconButton size="small" color="error" onClick={() => handleRemoveCustomField(index)}>
																			<CloseCircle size={18} />
																		</MuiIconButton>
																	</Stack>
																</Stack>
															</Box>
														))}
													</Stack>
												) : (
													<Typography variant="body2" color="textSecondary">
														No hay campos personalizados. Agrega campos para recopilar información adicional.
													</Typography>
												)}
											</Stack>
										</Grid>
									</Grid>
								</Stack>
							</CardContent>
						</Card>
					</Grid>

					{/* Botones de acción */}
					<Grid item xs={12}>
						<Box display="flex" justifyContent="flex-end" sx={{ mt: 2 }} gap={2}>
							<Button
								variant="contained"
								color="primary"
								startIcon={saving ? <CircularProgress size={20} color="inherit" /> : <Save2 />}
								onClick={handleSaveSettings}
								size="large"
								disabled={loading || saving}
							>
								{availabilityId ? "Actualizar configuración" : "Guardar configuración"}
							</Button>
						</Box>
					</Grid>
				</Grid>
			)}

			{/* Diálogo para agregar fecha excluida */}
			<Dialog open={openExcludedDateDialog} onClose={() => setOpenExcludedDateDialog(false)}>
				<DialogTitle>Agregar fecha bloqueada</DialogTitle>
				<DialogContent>
					<Stack spacing={3} sx={{ mt: 1, minWidth: "300px" }}>
						<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
							<DatePicker
								label="Fecha a bloquear"
								value={newExcludedDate}
								onChange={(newValue) => setNewExcludedDate(newValue)}
								slotProps={{ textField: { fullWidth: true, margin: "normal" } }}
							/>
						</LocalizationProvider>

						<TextField
							label="Motivo (opcional)"
							fullWidth
							value={excludedDateReason}
							onChange={(e) => setExcludedDateReason(e.target.value)}
							placeholder="Ej: Vacaciones, día festivo, etc."
						/>
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenExcludedDateDialog(false)} color="inherit">
						Cancelar
					</Button>
					<Button onClick={handleAddExcludedDate} variant="contained" color="primary">
						Agregar
					</Button>
				</DialogActions>
			</Dialog>

			{/* Diálogo para agregar/editar campo personalizado */}
			<Dialog open={openCustomFieldDialog} onClose={() => setOpenCustomFieldDialog(false)}>
				<DialogTitle>{editingFieldIndex !== null ? "Editar campo personalizado" : "Agregar campo personalizado"}</DialogTitle>
				<DialogContent>
					<Stack spacing={3} sx={{ mt: 1, minWidth: "300px" }}>
						<TextField
							label="Nombre del campo"
							fullWidth
							value={newCustomField.name}
							onChange={(e) => setNewCustomField({ ...newCustomField, name: e.target.value })}
							placeholder="Ej: Número de expediente, Asunto, etc."
						/>

						<FormControl fullWidth>
							<InputLabel>Tipo de campo</InputLabel>
							<Select
								value={newCustomField.type}
								label="Tipo de campo"
								onChange={(e) =>
									setNewCustomField({
										...newCustomField,
										type: e.target.value as "text" | "number" | "select" | "checkbox",
										// Limpiar las opciones si cambia de tipo select a otro
										options: e.target.value !== "select" ? [] : newCustomField.options,
									})
								}
							>
								{fieldTypes.map((type) => (
									<MenuItem key={type.value} value={type.value}>
										{type.label}
									</MenuItem>
								))}
							</Select>
						</FormControl>

						<FormControlLabel
							control={
								<Checkbox
									checked={newCustomField.required}
									onChange={(e) => setNewCustomField({ ...newCustomField, required: e.target.checked })}
								/>
							}
							label="Campo obligatorio"
						/>

						{newCustomField.type === "select" && (
							<>
								<Typography variant="subtitle2">Opciones de selección</Typography>
								<Stack direction="row" spacing={1}>
									<TextField
										label="Nueva opción"
										fullWidth
										value={newFieldOption}
										onChange={(e) => setNewFieldOption(e.target.value)}
										placeholder="Agrega una opción"
										size="small"
									/>
									<Button variant="contained" onClick={handleAddFieldOption} disabled={!newFieldOption}>
										Agregar
									</Button>
								</Stack>

								{newCustomField.options.length > 0 ? (
									<Box sx={{ display: "flex", flexWrap: "wrap", gap: 1, mt: 1 }}>
										{newCustomField.options.map((option, idx) => (
											<Chip key={idx} label={option} onDelete={() => handleRemoveFieldOption(option)} variant="outlined" />
										))}
									</Box>
								) : (
									<Typography variant="caption" color="textSecondary">
										Agrega al menos una opción para el campo de selección.
									</Typography>
								)}
							</>
						)}
					</Stack>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenCustomFieldDialog(false)} color="inherit">
						Cancelar
					</Button>
					<Button
						onClick={handleAddCustomField}
						variant="contained"
						color="primary"
						disabled={!newCustomField.name || (newCustomField.type === "select" && newCustomField.options.length === 0)}
					>
						{editingFieldIndex !== null ? "Actualizar" : "Agregar"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Notificación de enlace copiado */}
			<Snackbar
				open={publicUrlCopied}
				autoHideDuration={3000}
				onClose={() => setPublicUrlCopied(false)}
				message="Enlace copiado al portapapeles"
				anchorOrigin={{ vertical: "bottom", horizontal: "right" }}
			/>
		</MainCard>
	);
};

export default Availability;

import { useState, useEffect, ChangeEvent } from "react";
import { useParams } from "react-router-dom";
import axios from "axios";

// material-ui
import { useTheme } from "@mui/material/styles";
import {
	Box,
	Button,
	Card,
	CardContent,
	CircularProgress,
	Container,
	Divider,
	FormControl,
	Grid,
	Paper,
	Stack,
	Step,
	StepLabel,
	Stepper,
	TextField,
	Typography,
	Alert,
	FormHelperText,
	FormControlLabel,
	Checkbox,
	MenuItem,
	Select,
	SelectChangeEvent,
	InputLabel,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { es } from "date-fns/locale";
import { format } from "date-fns";

// project imports

// assets
import { Clock, TickCircle, InfoCircle, Calendar1 } from "iconsax-react";

// types
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

interface CustomField {
	name: string;
	required: boolean;
	type: 'text' | 'number' | 'select' | 'checkbox';
	options: string[]; // Para tipo 'select'
}

interface RequiredFields {
	name: boolean;
	email: boolean;
	phone: boolean;
	company: boolean;
	address: boolean;
	notes: boolean;
}

interface HostInfo {
	name: string;
	email: string;
	avatar?: string;
	title?: string;
	companyName?: string;
}

interface AvailabilitySettings {
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
	requiredFields: RequiredFields;
	customFields: CustomField[];
	host?: HostInfo;
}

interface AvailableSlot {
	time: string;
	isAvailable: boolean;
}

interface AppointmentData {
	name: string;
	email: string;
	phone: string;
	company: string;
	address: string;
	notes: string;
	date: string | null;
	time: string | null;
	customFields: Record<string, string | boolean>;
}

// Formato de 24 horas
const formatTime = (timeString: string) => {
	const [hours, minutes] = timeString.split(":").map(Number);
	return `${hours.toString().padStart(2, "0")}:${minutes.toString().padStart(2, "0")}`;
};

// ==============================|| BOOKING PAGE ||============================== //

const BookingPage = () => {
	const theme = useTheme();
	const { slug } = useParams<{ slug: string }>();
	const [activeStep, setActiveStep] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [availabilitySettings, setAvailabilitySettings] = useState<AvailabilitySettings | null>(null);

	// Estado para fechas y horas
	const [selectedDate, setSelectedDate] = useState<Date | null>(null);
	const [availableTimes, setAvailableTimes] = useState<AvailableSlot[]>([]);
	const [selectedTime, setSelectedTime] = useState<string | null>(null);

	// Estado para el formulario
	const [formData, setFormData] = useState<AppointmentData>({
		name: "",
		email: "",
		phone: "",
		company: "",
		address: "",
		notes: "",
		date: null,
		time: null,
		customFields: {},
	});

	// Estado para validación
	const [formErrors, setFormErrors] = useState<Record<string, string>>({});
	const [termsAccepted, setTermsAccepted] = useState(false);

	// Estado para resultado
	const [appointmentBooked, setAppointmentBooked] = useState(false);
	const [confirmationCode, setConfirmationCode] = useState("");

	// Cargar configuración de disponibilidad
	useEffect(() => {
		const fetchAvailabilitySettings = async () => {
			setLoading(true);
			setError(null);

			try {
				// Obtener datos de disponibilidad del backend usando el slug
				const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/booking/public/availability/${slug}`);

				if (response.status !== 200) {
					throw new Error("No se pudo encontrar la configuración de disponibilidad");
				}

				const data = response.data;

				// Verificar si la configuración está activa
				if (!data.isActive) {
					throw new Error("Esta agenda no está disponible actualmente");
				}

				setAvailabilitySettings(data);

				// Seleccionar la fecha actual por defecto
				const today = new Date();
				setSelectedDate(today);

				// Calcular slots disponibles para hoy
				calculateAvailableTimesForDate(today, data.timeSlots, data.duration, data.bufferBefore, data.bufferAfter);
			} catch (err) {
				console.error("Error al cargar configuración:", err);
				setError("No se pudo cargar la información de disponibilidad. Por favor, verifica la URL e intenta de nuevo.");
			} finally {
				setLoading(false);
			}
		};

		if (slug) {
			fetchAvailabilitySettings();
		} else {
			setError("URL de reserva no válida");
			setLoading(false);
		}
	}, [slug]);

	// Calcula los horarios disponibles para una fecha específica
	const calculateAvailableTimesForDate = (
		date: Date,
		timeSlots: TimeSlot[],
		duration: number,
		bufferBefore: number,
		bufferAfter: number,
	) => {
		if (!date) return;

		// Verificar si la fecha está excluida
		if (availabilitySettings?.excludedDates) {
			const isExcluded = availabilitySettings.excludedDates.some(excludedDate => {
				const excludedDateTime = new Date(excludedDate.date);
				return excludedDateTime.toDateString() === date.toDateString();
			});

			if (isExcluded) {
				// Fecha bloqueada, no hay horarios disponibles
				setAvailableTimes([]);
				return;
			}
		}

		// Obtener el día de la semana (0 = domingo, 1 = lunes, etc.)
		const dayOfWeek = date.getDay();

		// Buscar el slot correspondiente a este día
		const daySlot = timeSlots.find((slot) => slot.day === dayOfWeek && slot.isActive);

		if (!daySlot) {
			// No hay horarios disponibles para este día
			setAvailableTimes([]);
			return;
		}

		// Generar slots de tiempo disponibles
		const slots: AvailableSlot[] = [];
		const totalDuration = duration + bufferBefore + bufferAfter; // minutos

		// Convertir horas de inicio y fin a minutos
		const [startHour, startMinute] = daySlot.startTime.split(":").map(Number);
		const [endHour, endMinute] = daySlot.endTime.split(":").map(Number);

		const startMinutes = startHour * 60 + startMinute;
		const endMinutes = endHour * 60 + endMinute;

		// Verificar tiempo mínimo de anticipación
		const now = new Date();
		const minNoticeMs = (availabilitySettings?.minNoticeHours || 0) * 60 * 60 * 1000;
		
		// Calcular slots disponibles
		for (let time = startMinutes; time + duration <= endMinutes; time += totalDuration) {
			const hour = Math.floor(time / 60);
			const minute = time % 60;
			const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;
			
			// Crear una fecha para este slot
			const slotDate = new Date(date);
			slotDate.setHours(hour, minute, 0, 0);
			
			// Verificar si el slot cumple con el tiempo mínimo de anticipación
			const isAfterMinNotice = slotDate.getTime() >= (now.getTime() + minNoticeMs);
			
			// Verificar si el slot está disponible (aquí se podría consultar al backend para ver ocupación)
			// Por ahora asumimos disponible si cumple con el tiempo mínimo de anticipación
			const isAvailable = isAfterMinNotice;

			slots.push({
				time: timeString,
				isAvailable,
			});
		}

		setAvailableTimes(slots);
	};

	const handleDateChange = (date: Date | null) => {
		if (!date || !availabilitySettings) return;

		setSelectedDate(date);
		setSelectedTime(null);

		calculateAvailableTimesForDate(
			date,
			availabilitySettings.timeSlots,
			availabilitySettings.duration,
			availabilitySettings.bufferBefore,
			availabilitySettings.bufferAfter,
		);
	};

	const handleTimeSelect = (time: string) => {
		setSelectedTime(time);
	};

	const handleFormChange =
		(field: keyof AppointmentData) => (event: React.ChangeEvent<HTMLInputElement | { name?: string; value: unknown }>) => {
			const value = event.target.value as string;
			setFormData({
				...formData,
				[field]: value,
			});

			// Limpiar error cuando el usuario empieza a escribir
			if (formErrors[field]) {
				setFormErrors({
					...formErrors,
					[field]: "",
				});
			}
		};
		
	// Manejador específico para campos de texto y número
	const handleTextFieldChange = 
		(fieldName: string) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
			const value = event.target.value;
			
			setFormData({
				...formData,
				customFields: {
					...formData.customFields,
					[fieldName]: value
				}
			});
			
			// Limpiar error cuando el usuario cambia el valor
			const errorKey = `custom_${fieldName}`;
			if (formErrors[errorKey]) {
				setFormErrors({
					...formErrors,
					[errorKey]: "",
				});
			}
		};
		
	// Manejador específico para campos select
	const handleSelectFieldChange = 
		(fieldName: string) => (event: SelectChangeEvent<string>) => {
			const value = event.target.value;
			
			setFormData({
				...formData,
				customFields: {
					...formData.customFields,
					[fieldName]: value
				}
			});
			
			// Limpiar error cuando el usuario cambia el valor
			const errorKey = `custom_${fieldName}`;
			if (formErrors[errorKey]) {
				setFormErrors({
					...formErrors,
					[errorKey]: "",
				});
			}
		};
		
	// Manejador específico para campos checkbox
	const handleCheckboxFieldChange = 
		(fieldName: string) => (event: ChangeEvent<HTMLInputElement>) => {
			const value = event.target.checked;
			
			setFormData({
				...formData,
				customFields: {
					...formData.customFields,
					[fieldName]: value
				}
			});
			
			// Limpiar error cuando el usuario cambia el valor
			const errorKey = `custom_${fieldName}`;
			if (formErrors[errorKey]) {
				setFormErrors({
					...formErrors,
					[errorKey]: "",
				});
			}
		};

	const validateForm = () => {
		const errors: Record<string, string> = {};

		// Campos siempre requeridos por el servidor
		if (!formData.name.trim()) {
			errors.name = "El nombre es obligatorio";
		}

		if (!formData.email.trim()) {
			errors.email = "El correo electrónico es obligatorio";
		} else if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(formData.email)) {
			errors.email = "Formato de correo electrónico inválido";
		}

		// Campos opcionales dependiendo de la configuración
		if (availabilitySettings?.requiredFields.phone && !formData.phone.trim()) {
			errors.phone = "El teléfono es obligatorio";
		}

		if (availabilitySettings?.requiredFields.company && !formData.company.trim()) {
			errors.company = "La empresa es obligatoria";
		}
		
		if (availabilitySettings?.requiredFields.address && !formData.address.trim()) {
			errors.address = "La dirección es obligatoria";
		}
		
		// Validar campos personalizados
		if (availabilitySettings?.customFields) {
			availabilitySettings.customFields.forEach(field => {
				if (field.required) {
					const fieldValue = formData.customFields[field.name];
					
					if (field.type === 'checkbox' && fieldValue !== true) {
						errors[`custom_${field.name}`] = `${field.name} es obligatorio`;
					} else if (['text', 'number', 'select'].includes(field.type) && (!fieldValue || fieldValue === '')) {
						errors[`custom_${field.name}`] = `${field.name} es obligatorio`;
					}
				}
			});
		}

		if (!termsAccepted) {
			errors.terms = "Debes aceptar los términos para continuar";
		}

		setFormErrors(errors);
		return Object.keys(errors).length === 0;
	};

	const handleNext = () => {
		if (activeStep === 0) {
			// Verificar que se haya seleccionado fecha y hora
			if (!selectedDate || !selectedTime) {
				setError("Por favor, selecciona una fecha y hora para tu cita");
				return;
			}
			setFormData({
				...formData,
				date: selectedDate.toISOString().split("T")[0],
				time: selectedTime,
			});
			setError(null);
		} else if (activeStep === 1) {
			// Validar el formulario
			if (!validateForm()) {
				return;
			}

			// Simular reserva de cita
			submitAppointment();
			return;
		}

		setActiveStep((prevStep) => prevStep + 1);
	};

	const handleBack = () => {
		setActiveStep((prevStep) => prevStep - 1);
	};

	const submitAppointment = async () => {
		setLoading(true);
		try {
			// Calcular hora de inicio en formato ISO
			if (!selectedDate || !selectedTime) {
				throw new Error("Fecha u hora no seleccionada");
			}

			// Construir fecha y hora de inicio
			const [hours, minutes] = selectedTime.split(":").map(Number);
			const startDate = new Date(selectedDate);
			startDate.setHours(hours, minutes, 0, 0);

			// Preparar datos para enviar según el formato esperado por el servidor
			const appointmentData = {
				availabilityId: availabilitySettings?._id,
				startTime: startDate.toISOString(), // Formato ISO como requiere el servidor
				duration: availabilitySettings?.duration,
				clientName: formData.name,
				clientEmail: formData.email,
				clientPhone: formData.phone,
				clientCompany: formData.company,
				clientAddress: formData.address,
				notes: formData.notes,
				customFields: formData.customFields
			};

			// Enviar solicitud al backend
			const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/booking/public/bookings`, appointmentData);

			if (response.status !== 201) {
				throw new Error("Error al crear la cita");
			}

			// Mostrar confirmación
			setConfirmationCode(response.data.confirmationCode || "ABC123"); // Código de confirmación del backend o uno por defecto
			setAppointmentBooked(true);
			setActiveStep(2); // Ir al paso de confirmación
		} catch (err: any) {
			console.error("Error al reservar cita:", err);

			// Manejar errores específicos del API
			if (err.response && err.response.data && err.response.data.errors) {
				const serverErrors = err.response.data.errors;
				const errorMsgs: Record<string, string> = {};

				// Mapear errores del servidor a campos del formulario
				serverErrors.forEach((error: any) => {
					if (error.path === "startTime") {
						setError("Hora de inicio inválida. Por favor, selecciona otra fecha y hora.");
					} else if (error.path === "clientName") {
						errorMsgs.name = error.msg;
					} else if (error.path === "clientEmail") {
						errorMsgs.email = error.msg;
					} else if (error.path === "clientPhone") {
						errorMsgs.phone = error.msg;
					} else if (error.path === "clientCompany") {
						errorMsgs.company = error.msg;
					} else if (error.path === "clientAddress") {
						errorMsgs.address = error.msg;
					} else if (error.path.startsWith("customFields.")) {
						// Manejar errores en campos personalizados
						const fieldName = error.path.split(".")[1];
						errorMsgs[`custom_${fieldName}`] = error.msg;
					}
				});

				// Actualizar los errores del formulario
				if (Object.keys(errorMsgs).length > 0) {
					setFormErrors({ ...formErrors, ...errorMsgs });
					setError("Por favor, corrige los errores en el formulario.");
				} else {
					setError("No se pudo completar la reserva. Verifica tus datos e intenta de nuevo.");
				}
			} else {
				setError("No se pudo completar la reserva. Por favor, inténtalo de nuevo más tarde.");
			}
		} finally {
			setLoading(false);
		}
	};

	// Renderizar el paso actual
	const getStepContent = (step: number) => {
		switch (step) {
			case 0:
				return (
					<Grid container spacing={3}>
						<Grid item xs={12} md={6}>
							<Card>
								<CardContent>
									<Typography variant="h5" sx={{ mb: 2, display: "flex", alignItems: "center" }}>
										<Calendar1 size={22} style={{ marginRight: "8px", color: theme.palette.primary.dark }} />
										Selecciona una fecha
									</Typography>
									<LocalizationProvider dateAdapter={AdapterDateFns} adapterLocale={es}>
										<DateCalendar
											value={selectedDate}
											onChange={handleDateChange}
											disablePast
											// Limitar fechas futuras según maxDaysInAdvance
											maxDate={(() => {
												const maxDate = new Date();
												maxDate.setDate(maxDate.getDate() + (availabilitySettings?.maxDaysInAdvance || 60));
												return maxDate;
											})()}
											// Deshabilitar fechas que no tienen disponibilidad o están excluidas
											shouldDisableDate={(date) => {
												if (!availabilitySettings?.timeSlots) return true;
												
												// Verificar si la fecha está en el arreglo de fechas excluidas
												if (availabilitySettings.excludedDates?.some(excludedDate => 
													new Date(excludedDate.date).toDateString() === date.toDateString()
												)) {
													return true;
												}
												
												// Verificar disponibilidad para el día de la semana
												const dayOfWeek = date.getDay();
												return !availabilitySettings.timeSlots.some((slot) => slot.day === dayOfWeek && slot.isActive);
											}}
										/>
									</LocalizationProvider>
								</CardContent>
							</Card>
						</Grid>

						<Grid item xs={12} md={6}>
							<Card sx={{ height: "100%" }}>
								<CardContent>
									<Typography variant="h5" sx={{ mb: 2, display: "flex", alignItems: "center" }}>
										<Clock size={22} style={{ marginRight: "8px", color: theme.palette.primary.dark }} />
										Selecciona una hora
									</Typography>

									{selectedDate ? (
										availableTimes.length > 0 ? (
											<Grid container spacing={1}>
												{availableTimes.map((slot, index) => (
													<Grid item xs={6} sm={4} key={index}>
														<Button
															variant={selectedTime === slot.time ? "contained" : "outlined"}
															color="primary"
															fullWidth
															onClick={() => handleTimeSelect(slot.time)}
															disabled={!slot.isAvailable}
															sx={{ mb: 1 }}
														>
															{formatTime(slot.time)}
														</Button>
													</Grid>
												))}
											</Grid>
										) : (
											<Alert severity="info">
												No hay horarios disponibles para la fecha seleccionada. Por favor, selecciona otra fecha.
											</Alert>
										)
									) : (
										<Alert severity="info">Primero selecciona una fecha para ver los horarios disponibles.</Alert>
									)}
								</CardContent>
							</Card>
						</Grid>
					</Grid>
				);

			case 1:
				return (
					<Grid container spacing={3}>
						<Grid item xs={12} md={8}>
							<Card>
								<CardContent>
									<Typography variant="h5" sx={{ mb: 3 }}>
										Información de contacto
									</Typography>

									{error && (
										<Alert severity="error" sx={{ mb: 2 }}>
											{error}
										</Alert>
									)}

									<Grid container spacing={2}>
										<Grid item xs={12}>
											<TextField
												fullWidth
												label="Nombre completo"
												value={formData.name}
												onChange={handleFormChange("name")}
												error={!!formErrors.name}
												helperText={formErrors.name}
												required={availabilitySettings?.requiredFields.name}
											/>
										</Grid>

										<Grid item xs={12} sm={6}>
											<TextField
												fullWidth
												label="Correo electrónico"
												type="email"
												value={formData.email}
												onChange={handleFormChange("email")}
												error={!!formErrors.email}
												helperText={formErrors.email}
												required={availabilitySettings?.requiredFields.email}
											/>
										</Grid>

										<Grid item xs={12} sm={6}>
											<TextField
												fullWidth
												label="Teléfono"
												value={formData.phone}
												onChange={handleFormChange("phone")}
												error={!!formErrors.phone}
												helperText={formErrors.phone}
												required={availabilitySettings?.requiredFields.phone}
											/>
										</Grid>

										{(availabilitySettings?.requiredFields.company || formData.company) && (
											<Grid item xs={12}>
												<TextField
													fullWidth
													label="Empresa/Organización"
													value={formData.company}
													onChange={handleFormChange("company")}
													error={!!formErrors.company}
													helperText={formErrors.company}
													required={availabilitySettings?.requiredFields.company}
												/>
											</Grid>
										)}
										
										{(availabilitySettings?.requiredFields.address || formData.address) && (
											<Grid item xs={12}>
												<TextField
													fullWidth
													label="Dirección"
													value={formData.address}
													onChange={handleFormChange("address")}
													error={!!formErrors.address}
													helperText={formErrors.address}
													required={availabilitySettings?.requiredFields.address}
												/>
											</Grid>
										)}
										
										{/* Campos personalizados */}
										{availabilitySettings?.customFields && availabilitySettings.customFields.length > 0 && (
											<>
												<Grid item xs={12}>
													<Divider sx={{ my: 2 }} />
													<Typography variant="subtitle1" sx={{ mb: 2 }}>
														Información adicional
													</Typography>
												</Grid>
												
												{availabilitySettings.customFields.map((field, index) => {
													const errorKey = `custom_${field.name}`;
													
													if (field.type === 'text') {
														return (
															<Grid item xs={12} key={index}>
																<TextField
																	fullWidth
																	label={field.name}
																	value={formData.customFields[field.name] || ''}
																	onChange={handleTextFieldChange(field.name)}
																	error={!!formErrors[errorKey]}
																	helperText={formErrors[errorKey]}
																	required={field.required}
																/>
															</Grid>
														);
													} else if (field.type === 'number') {
														return (
															<Grid item xs={12} sm={6} key={index}>
																<TextField
																	fullWidth
																	label={field.name}
																	type="number"
																	value={formData.customFields[field.name] || ''}
																	onChange={handleTextFieldChange(field.name)}
																	error={!!formErrors[errorKey]}
																	helperText={formErrors[errorKey]}
																	required={field.required}
																/>
															</Grid>
														);
													} else if (field.type === 'select' && field.options.length > 0) {
														return (
															<Grid item xs={12} sm={6} key={index}>
																<FormControl fullWidth error={!!formErrors[errorKey]} required={field.required}>
																	<InputLabel>{field.name}</InputLabel>
																	<Select<string>
																		value={(formData.customFields[field.name] as string) || ''}
																		label={field.name}
																		onChange={handleSelectFieldChange(field.name)}
																	>
																		{field.options.map((option, idx) => (
																			<MenuItem key={idx} value={option}>
																				{option}
																			</MenuItem>
																		))}
																	</Select>
																	{!!formErrors[errorKey] && (
																		<FormHelperText>{formErrors[errorKey]}</FormHelperText>
																	)}
																</FormControl>
															</Grid>
														);
													} else if (field.type === 'checkbox') {
														return (
															<Grid item xs={12} key={index}>
																<FormControl error={!!formErrors[errorKey]} required={field.required}>
																	<FormControlLabel
																		control={
																			<Checkbox
																				checked={!!formData.customFields[field.name]}
																				onChange={handleCheckboxFieldChange(field.name)}
																			/>
																		}
																		label={field.name}
																	/>
																	{!!formErrors[errorKey] && (
																		<FormHelperText>{formErrors[errorKey]}</FormHelperText>
																	)}
																</FormControl>
															</Grid>
														);
													}
													
													return null;
												})}
											</>
										)}

										<Grid item xs={12}>
											<Divider sx={{ my: 2 }} />
											{availabilitySettings?.requiredFields.notes && (
												<TextField
													fullWidth
													label="Motivo de la cita"
													multiline
													rows={3}
													value={formData.notes}
													onChange={handleFormChange("notes")}
													placeholder="Describe brevemente el motivo de tu consulta"
													required={availabilitySettings?.requiredFields.notes}
													error={!!formErrors.notes}
													helperText={formErrors.notes}
													sx={{ mb: 2 }}
												/>
											)}
											
											<FormControl error={!!formErrors.terms} sx={{ mt: 1 }}>
												<FormControlLabel
													control={<Checkbox checked={termsAccepted} onChange={(e) => setTermsAccepted(e.target.checked)} />}
													label="Acepto los términos y condiciones para la gestión de esta cita"
												/>
												{formErrors.terms && <FormHelperText>{formErrors.terms}</FormHelperText>}
											</FormControl>
										</Grid>
									</Grid>
								</CardContent>
							</Card>
						</Grid>

						<Grid item xs={12} md={4}>
							<Card>
								<CardContent>
									<Typography variant="h5" sx={{ mb: 3 }}>
										Resumen de la cita
									</Typography>

									<Stack spacing={2}>
										{availabilitySettings?.host && (
											<Box sx={{ mb: 2 }}>
												<Typography variant="subtitle2" color="textSecondary">
													Profesional:
												</Typography>
												<Typography variant="body1">{availabilitySettings.host.name}</Typography>
												{availabilitySettings.host.title && (
													<Typography variant="body2" color="textSecondary">
														{availabilitySettings.host.title}
													</Typography>
												)}
											</Box>
										)}

										<Divider />

										<Box>
											<Typography variant="subtitle2" color="textSecondary">
												Fecha:
											</Typography>
											<Typography variant="body1">
												{selectedDate && format(selectedDate, "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
											</Typography>
										</Box>

										<Box>
											<Typography variant="subtitle2" color="textSecondary">
												Hora:
											</Typography>
											<Typography variant="body1">{selectedTime} hrs</Typography>
										</Box>

										<Box>
											<Typography variant="subtitle2" color="textSecondary">
												Duración:
											</Typography>
											<Typography variant="body1">{availabilitySettings?.duration} minutos</Typography>
										</Box>

										<Divider />

										<Box>
											<Typography variant="subtitle2" color="textSecondary">
												Tipo de cita:
											</Typography>
											<Typography variant="body1">{availabilitySettings?.title || "Consulta"}</Typography>
										</Box>

										{availabilitySettings?.requireApproval && (
											<Alert severity="info" sx={{ mt: 2 }}>
												<Typography variant="body2">
													Esta cita requiere confirmación por parte del profesional. Recibirás un correo electrónico cuando sea confirmada.
												</Typography>
											</Alert>
										)}
									</Stack>
								</CardContent>
							</Card>
						</Grid>
					</Grid>
				);

			case 2:
				return (
					<Box sx={{ textAlign: "center", py: 4 }}>
						{appointmentBooked ? (
							<>
								<TickCircle size={80} color={theme.palette.success.main} variant="Bulk" style={{ marginBottom: "24px" }} />

								<Typography variant="h3" gutterBottom>
									¡Cita reservada con éxito!
								</Typography>

								<Typography variant="body1" paragraph>
									Tu cita ha sido programada para el {selectedDate && format(selectedDate, "d 'de' MMMM 'de' yyyy", { locale: es })} a las{" "}
									{selectedTime} hrs.
								</Typography>

								<Box sx={{ maxWidth: "600px", mx: "auto", my: 3, p: 2, bgcolor: theme.palette.grey[100], borderRadius: 1 }}>
									<Typography variant="subtitle1" gutterBottom>
										Código de confirmación:
									</Typography>
									<Typography variant="h4" sx={{ fontFamily: "monospace" }}>
										{confirmationCode}
									</Typography>
								</Box>

								<Typography variant="body2" color="textSecondary" paragraph>
									Hemos enviado un correo electrónico con los detalles de tu cita a {formData.email}.
									{availabilitySettings?.requireApproval
										? " Recibirás una confirmación cuando tu cita sea aprobada."
										: " Por favor, asegúrate de llegar a tiempo a tu cita."}
								</Typography>

								<Button variant="contained" color="primary" href={process.env.REACT_APP_BASE_NAME || "/"} sx={{ mt: 2 }}>
									Volver al inicio
								</Button>
							</>
						) : (
							<Box display="flex" justifyContent="center" alignItems="center" flexDirection="column">
								<CircularProgress sx={{ mb: 2 }} />
								<Typography variant="h5">Procesando tu reserva...</Typography>
							</Box>
						)}
					</Box>
				);
			default:
				return <div>Paso desconocido</div>;
		}
	};

	if (loading && !availabilitySettings) {
		return (
			<Container maxWidth="md" sx={{ py: 8 }}>
				<Box display="flex" justifyContent="center" alignItems="center" sx={{ minHeight: "60vh" }}>
					<CircularProgress />
				</Box>
			</Container>
		);
	}

	if (error) {
		return (
			<Container maxWidth="md" sx={{ py: 8 }}>
				<Card>
					<CardContent sx={{ textAlign: "center", p: 4 }}>
						<InfoCircle size={60} color={theme.palette.error.main} style={{ marginBottom: "16px" }} />
						<Typography variant="h4" gutterBottom>
							No se pudo cargar la agenda
						</Typography>
						<Typography variant="body1" paragraph color="textSecondary">
							{error}
						</Typography>
						<Button variant="contained" color="primary" href={process.env.REACT_APP_BASE_NAME || "/"} sx={{ mt: 2 }}>
							Volver al inicio
						</Button>
					</CardContent>
				</Card>
			</Container>
		);
	}

	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			<Paper elevation={0} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 2 }}>
				<Box sx={{ mb: 4 }}>
					<Typography variant="h3" gutterBottom>
						{availabilitySettings?.title || "Reserva tu cita"}
					</Typography>
					{availabilitySettings?.description && (
						<Typography variant="body1" color="textSecondary">
							{availabilitySettings.description}
						</Typography>
					)}
				</Box>

				<Stepper activeStep={activeStep} sx={{ mb: 4 }} alternativeLabel>
					<Step>
						<StepLabel>Seleccionar fecha y hora</StepLabel>
					</Step>
					<Step>
						<StepLabel>Información personal</StepLabel>
					</Step>
					<Step>
						<StepLabel>Confirmación</StepLabel>
					</Step>
				</Stepper>

				{getStepContent(activeStep)}

				<Box sx={{ display: "flex", justifyContent: "flex-end", mt: 4 }}>
					{activeStep > 0 && activeStep < 2 && (
						<Button onClick={handleBack} sx={{ mr: 1 }}>
							Volver
						</Button>
					)}
					{activeStep < 2 && (
						<Button variant="contained" onClick={handleNext} disabled={loading || (activeStep === 0 && (!selectedDate || !selectedTime))}>
							{activeStep === 1 ? "Reservar cita" : "Continuar"}
						</Button>
					)}
				</Box>
			</Paper>
		</Container>
	);
};

export default BookingPage;
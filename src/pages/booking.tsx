import { useState, useEffect, ChangeEvent, useRef } from "react";
import { useParams, useNavigate } from "react-router-dom";
import axios from "axios";
// Importar el componente SupportModal
import SupportModal from "layout/MainLayout/Drawer/DrawerContent/SupportModal";

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
	Link,
	Avatar,
	Tooltip,
	Pagination,
	InputAdornment,
} from "@mui/material";
import { LocalizationProvider } from "@mui/x-date-pickers/LocalizationProvider";
import { AdapterDateFns } from "@mui/x-date-pickers/AdapterDateFns";
import { DateCalendar } from "@mui/x-date-pickers/DateCalendar";
import { es } from "date-fns/locale";
import { format } from "date-fns";

// project imports

// assets
import { Clock, TickCircle, InfoCircle, Calendar1, SecurityUser, Call, Sms, SearchNormal1, ArrowLeft } from "iconsax-react";
import logo from "assets/images/large_logo_transparent.png";

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
	type: "text" | "number" | "select" | "checkbox";
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

interface Booking {
	_id: string;
	startTime: string;
	endTime: string;
	status: string;
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
	minCancellationHours: number; // Horas mínimas de antelación para cancelar
	maxDailyBookings: number | null; // Máximo de reservas por día
	maxWeeklyBookings: number | null; // Máximo de reservas por semana
	isActive: boolean;
	isPubliclyVisible: boolean; // Determina si la URL es visible en la plataforma
	requireApproval: boolean;
	publicUrl: string;
	timeSlots: TimeSlot[];
	excludedDates: ExcludedDate[];
	requiredFields: RequiredFields;
	customFields: CustomField[];
	host?: HostInfo;
	bookings?: Booking[]; // Array de reservas existentes
}

interface PublicAvailability {
	_id: string;
	userId: string;
	title: string;
	description: string;
	publicUrl: string;
	host: HostInfo;
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
	const navigate = useNavigate();
	const { slug } = useParams<{ slug: string }>();
	const [activeStep, setActiveStep] = useState(0);
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [availabilitySettings, setAvailabilitySettings] = useState<AvailabilitySettings | null>(null);

	// Estados para la lista de disponibilidades públicas
	const [publicAvailabilities, setPublicAvailabilities] = useState<PublicAvailability[]>([]);
	const [customUrlInput, setCustomUrlInput] = useState<string>("");
	const [loadingPublicList, setLoadingPublicList] = useState(false);
	
	// Estados para búsqueda y paginación
	const [searchQuery, setSearchQuery] = useState<string>("");
	const [currentPage, setCurrentPage] = useState<number>(1);
	const itemsPerPage = 6; // 3 por fila, 2 filas

	// Referencia para volver al inicio del formulario
	const formStartRef = useRef<HTMLDivElement>(null);

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

	// Estado para el modal de soporte
	const [supportModalOpen, setSupportModalOpen] = useState(false);

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

				// Encontrar la primera fecha disponible
				findFirstAvailableDate(data);
			} catch (err) {
				console.error("Error al cargar configuración:", err);
				setError("No se pudo cargar la información de disponibilidad. Por favor, verifica la URL e intenta de nuevo.");
			} finally {
				setLoading(false);
			}
		};

		const fetchPublicAvailabilities = async () => {
			setLoadingPublicList(true);
			try {
				const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/booking/public/availability/list`);
				if (response.status === 200) {
					setPublicAvailabilities(response.data);
				}
			} catch (err) {
				console.error("Error al cargar lista de disponibilidades públicas:", err);
			} finally {
				setLoadingPublicList(false);
				setLoading(false);
			}
		};

		if (slug) {
			fetchAvailabilitySettings();
		} else {
			// En lugar de mostrar error, cargar la lista de disponibilidades públicas
			fetchPublicAvailabilities();
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
			const isExcluded = availabilitySettings.excludedDates.some((excludedDate) => {
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

		// Crear un array de slots ocupados para la fecha seleccionada
		const bookedSlots: { start: Date; end: Date }[] = [];

		// Si existen reservas, procesarlas para identificar slots ocupados
		if (availabilitySettings?.bookings && availabilitySettings.bookings.length > 0) {
			availabilitySettings.bookings.forEach((booking) => {
				const bookingStartTime = new Date(booking.startTime);
				const bookingEndTime = new Date(booking.endTime);

				// Comprobar si la reserva es para el día seleccionado
				if (bookingStartTime.toDateString() === date.toDateString()) {
					bookedSlots.push({
						start: bookingStartTime,
						end: bookingEndTime,
					});
				}
			});
		}

		// Calcular slots disponibles
		for (let time = startMinutes; time + duration <= endMinutes; time += totalDuration) {
			const hour = Math.floor(time / 60);
			const minute = time % 60;
			const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

			// Crear una fecha para este slot
			const slotStartDate = new Date(date);
			slotStartDate.setHours(hour, minute, 0, 0);

			// Crear una fecha para el final de este slot
			const slotEndDate = new Date(slotStartDate);
			slotEndDate.setMinutes(slotEndDate.getMinutes() + duration);

			// Verificar si el slot cumple con el tiempo mínimo de anticipación
			const isAfterMinNotice = slotStartDate.getTime() >= now.getTime() + minNoticeMs;

			// Verificar si el slot se solapa con alguna reserva existente
			const isOverlapping = bookedSlots.some((bookedSlot) => {
				// Comprobamos si hay solapamiento entre el slot actual y la reserva
				// Un slot está disponible si termina antes o empieza después de la reserva
				return !(slotEndDate <= bookedSlot.start || slotStartDate >= bookedSlot.end);
			});

			// Un slot está disponible si no se solapa con ninguna reserva y cumple con el tiempo mínimo de anticipación
			const isAvailable = isAfterMinNotice && !isOverlapping;

			slots.push({
				time: timeString,
				isAvailable,
			});
		}

		setAvailableTimes(slots);
	};

	// Función para encontrar la primera fecha disponible y mostrar sus horarios
	const findFirstAvailableDate = (settings: AvailabilitySettings) => {
		// Iniciar desde hoy
		const now = new Date();

		// Calcular la fecha mínima basada en minNoticeHours
		const minNoticeMs = (settings.minNoticeHours || 0) * 60 * 60 * 1000;
		const minDate = new Date(now.getTime() + minNoticeMs);

		// Almacenar los rangos de horarios disponibles para cada día de la semana
		const availableDaysMap = new Map<number, TimeSlot>();

		// Crear un mapa de los días disponibles
		settings.timeSlots.forEach((slot) => {
			if (slot.isActive) {
				availableDaysMap.set(slot.day, slot);
			}
		});

		// Array para guardar información sobre las fechas disponibles
		interface AvailableDateInfo {
			date: Date;
			availableSlots: AvailableSlot[];
		}

		const availableDates: AvailableDateInfo[] = [];

		// Buscar hasta maxDaysInAdvance días en el futuro
		for (let i = 0; i < (settings.maxDaysInAdvance || 60); i++) {
			const checkDate = new Date(now);
			checkDate.setDate(checkDate.getDate() + i);

			// Verificar si la fecha está excluida
			const isExcluded = settings.excludedDates?.some((excludedDate) => {
				const excludedDateTime = new Date(excludedDate.date);
				return excludedDateTime.toDateString() === checkDate.toDateString();
			});

			if (isExcluded) continue;

			// Verificar disponibilidad para el día de la semana
			const dayOfWeek = checkDate.getDay();

			if (!availableDaysMap.has(dayOfWeek)) continue;

			// Obtener el slot para este día
			const daySlot = availableDaysMap.get(dayOfWeek)!;

			// Verificar si hay horarios disponibles teniendo en cuenta minNoticeHours
			const [startHour, startMinute] = daySlot.startTime.split(":").map(Number);
			const [endHour, endMinute] = daySlot.endTime.split(":").map(Number);

			// Crear fecha completa con hora de fin
			const slotEndTime = new Date(checkDate);
			slotEndTime.setHours(endHour, endMinute, 0, 0);

			// Si toda la franja horaria del día está antes del tiempo mínimo de anticipación, continuar
			if (slotEndTime < minDate) continue;

			// Calcular los slots disponibles para esta fecha
			const totalDuration = settings.duration + settings.bufferBefore + settings.bufferAfter; // minutos
			const startMinutes = startHour * 60 + startMinute;
			const endMinutes = endHour * 60 + endMinute;

			// Crear un array de slots ocupados para la fecha seleccionada
			const bookedSlots: { start: Date; end: Date }[] = [];

			// Si existen reservas, procesarlas para identificar slots ocupados
			if (settings.bookings && settings.bookings.length > 0) {
				settings.bookings.forEach((booking) => {
					const bookingStartTime = new Date(booking.startTime);
					const bookingEndTime = new Date(booking.endTime);

					// Comprobar si la reserva es para el día seleccionado
					if (bookingStartTime.toDateString() === checkDate.toDateString()) {
						bookedSlots.push({
							start: bookingStartTime,
							end: bookingEndTime,
						});
					}
				});
			}

			// Generar los slots disponibles para esta fecha
			const availableSlots: AvailableSlot[] = [];

			// Calcular slots y su disponibilidad
			for (let time = startMinutes; time + settings.duration <= endMinutes; time += totalDuration) {
				const hour = Math.floor(time / 60);
				const minute = time % 60;
				const timeString = `${String(hour).padStart(2, "0")}:${String(minute).padStart(2, "0")}`;

				// Crear fecha para este slot
				const slotStartDate = new Date(checkDate);
				slotStartDate.setHours(hour, minute, 0, 0);

				// Crear fecha para el final de este slot
				const slotEndDate = new Date(slotStartDate);
				slotEndDate.setMinutes(slotEndDate.getMinutes() + settings.duration);

				// Verificar si el slot cumple con el tiempo mínimo de anticipación
				const isAfterMinNotice = slotStartDate.getTime() >= now.getTime() + minNoticeMs;

				// Verificar si el slot se solapa con alguna reserva existente
				const isOverlapping = bookedSlots.some((bookedSlot) => {
					return !(slotEndDate <= bookedSlot.start || slotStartDate >= bookedSlot.end);
				});

				// Un slot está disponible si no se solapa con ninguna reserva y cumple con el tiempo mínimo de anticipación
				const isAvailable = isAfterMinNotice && !isOverlapping;

				availableSlots.push({
					time: timeString,
					isAvailable,
				});
			}

			// Verificar si hay al menos un slot disponible
			const hasAvailableSlot = availableSlots.some((slot) => slot.isAvailable);

			if (hasAvailableSlot) {
				// Guardar esta fecha y sus slots disponibles
				availableDates.push({
					date: checkDate,
					availableSlots: availableSlots,
				});
			}
		}

		// Si encontramos fechas disponibles, usar la primera
		if (availableDates.length > 0) {
			const firstAvailableDate = availableDates[0];

			// Establecer la fecha seleccionada
			setSelectedDate(firstAvailableDate.date);

			// Establecer directamente los slots disponibles
			setAvailableTimes(firstAvailableDate.availableSlots);

			return;
		}

		// Si no encontramos ninguna fecha disponible, usar una fecha futura por defecto
		const tomorrow = new Date(now);
		tomorrow.setDate(tomorrow.getDate() + 1);
		setSelectedDate(tomorrow);

		// En este caso, calculamos los slots disponibles
		calculateAvailableTimesForDate(tomorrow, settings.timeSlots, settings.duration, settings.bufferBefore, settings.bufferAfter);
	};

	const handleDateChange = (date: Date | null) => {
		if (!date || !availabilitySettings) return;

		// Limpiar el horario seleccionado
		setSelectedTime(null);

		// Si la fecha seleccionada es la misma (puede ocurrir por un rerender), no hacer nada más
		if (selectedDate && date.toDateString() === selectedDate.toDateString()) {
			return;
		}

		// Actualizar la fecha seleccionada
		setSelectedDate(date);

		// Calcular los horarios disponibles para esta fecha
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
	const handleTextFieldChange = (fieldName: string) => (event: ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const value = event.target.value;

		setFormData({
			...formData,
			customFields: {
				...formData.customFields,
				[fieldName]: value,
			},
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
	const handleSelectFieldChange = (fieldName: string) => (event: SelectChangeEvent<string>) => {
		const value = event.target.value;

		setFormData({
			...formData,
			customFields: {
				...formData.customFields,
				[fieldName]: value,
			},
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
	const handleCheckboxFieldChange = (fieldName: string) => (event: ChangeEvent<HTMLInputElement>) => {
		const value = event.target.checked;

		setFormData({
			...formData,
			customFields: {
				...formData.customFields,
				[fieldName]: value,
			},
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
			availabilitySettings.customFields.forEach((field) => {
				if (field.required) {
					const fieldValue = formData.customFields[field.name];

					if (field.type === "checkbox" && fieldValue !== true) {
						errors[`custom_${field.name}`] = `${field.name} es obligatorio`;
					} else if (["text", "number", "select"].includes(field.type) && (!fieldValue || fieldValue === "")) {
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

	// Función para navegar a una URL de disponibilidad personalizada
	const handleCustomUrlSubmit = () => {
		if (!customUrlInput.trim()) return;

		let url = customUrlInput.trim();

		// Si es una URL completa, extraer el slug
		if (url.includes("/booking/")) {
			const parts = url.split("/booking/");
			url = parts[parts.length - 1];
		}

		// Limpiar cualquier parámetro de consulta o fragmento
		if (url.includes("?")) {
			url = url.split("?")[0];
		}
		if (url.includes("#")) {
			url = url.split("#")[0];
		}

		// Navegar a la URL de disponibilidad
		navigate(`/booking/${url}`);
	};
	
	// Función para manejar la búsqueda
	const handleSearchChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setSearchQuery(event.target.value);
		setCurrentPage(1); // Reset a la primera página cuando se realiza una búsqueda
	};
	
	// Función para manejar cambio de página
	const handlePageChange = (event: React.ChangeEvent<unknown>, value: number) => {
		setCurrentPage(value);
		// Scroll hacia arriba para ver los resultados de la nueva página
		window.scrollTo({ top: 0, behavior: "smooth" });
	};
	
	// Filtrar los profesionales según la búsqueda
	const filteredAvailabilities = publicAvailabilities.filter(availability => {
		const hostName = availability.host?.name?.toLowerCase() || "";
		const title = availability.title.toLowerCase();
		const description = availability.description.toLowerCase();
		const searchLower = searchQuery.toLowerCase();
		
		return hostName.includes(searchLower) || 
			   title.includes(searchLower) || 
			   description.includes(searchLower);
	});
	
	// Calcular resultados para la página actual
	const indexOfLastItem = currentPage * itemsPerPage;
	const indexOfFirstItem = indexOfLastItem - itemsPerPage;
	const currentItems = filteredAvailabilities.slice(indexOfFirstItem, indexOfLastItem);

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
				customFields: formData.customFields,
			};

			// Enviar solicitud al backend
			const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/booking/public/bookings`, appointmentData);

			if (response.status !== 201) {
				throw new Error("Error al crear la cita");
			}
			console.log(response.data.clientToken);
			// Mostrar confirmación con el token del cliente
			setConfirmationCode(response.data.clientToken || "ABC123"); // Usar el clientToken de la respuesta
			setAppointmentBooked(true);
			setActiveStep(2); // Ir al paso de confirmación
		} catch (err: any) {
			console.error("Error al reservar cita:", err);

			// Verificar si es el error específico de horario ya reservado
			if (err.response && err.response.data && err.response.data.error === "Este horario ya ha sido reservado") {
				setError("Este horario ya ha sido reservado. Por favor, selecciona otro horario.");

				// Si tenemos este error, probablemente necesitamos actualizar los slots disponibles
				if (selectedDate && availabilitySettings) {
					// Recalcular los horarios disponibles para reflejar la nueva reserva
					calculateAvailableTimesForDate(
						selectedDate,
						availabilitySettings.timeSlots,
						availabilitySettings.duration,
						availabilitySettings.bufferBefore,
						availabilitySettings.bufferAfter,
					);
				}

				// Volver al paso de selección de fecha y hora
				setActiveStep(0);
				return;
			}

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
			} else if (err.response && err.response.data && err.response.data.error) {
				// Mostrar el mensaje de error genérico proporcionado por la API
				setError(err.response.data.error);
			} else {
				setError("No se pudo completar la reserva. Por favor, inténtalo de nuevo más tarde.");
			}
		} finally {
			setLoading(false);
		}
	};

	// Componente de Footer reutilizable
	const Footer = () => (
		<Box
			sx={{
				mt: 4,
				p: 3,
				borderRadius: 2,
				bgcolor: theme.palette.grey[100],
				textAlign: "center",
			}}
		>
			<Typography variant="body2" color="textSecondary" gutterBottom>
				© {new Date().getFullYear()} Law Analytics - Todos los derechos reservados
			</Typography>
			<Box sx={{ display: "flex", justifyContent: "center", gap: 3, mt: 1, flexWrap: "wrap" }}>
				<Link href={`${process.env.REACT_APP_BASE_URL}/terms`} underline="hover" color="inherit">
					Términos y condiciones
				</Link>
				<Link href={`${process.env.REACT_APP_BASE_URL}/privacy-policy`} underline="hover" color="inherit">
					Política de privacidad
				</Link>
			</Box>
		</Box>
	);

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
												if (
													availabilitySettings.excludedDates?.some(
														(excludedDate) => new Date(excludedDate.date).toDateString() === date.toDateString(),
													)
												) {
													return true;
												}

												// Verificar disponibilidad para el día de la semana
												const dayOfWeek = date.getDay();
												const daySlot = availabilitySettings.timeSlots.find((slot) => slot.day === dayOfWeek && slot.isActive);

												if (!daySlot) return true;

												// Verificar tiempo mínimo de anticipación
												const now = new Date();
												const minNoticeMs = (availabilitySettings.minNoticeHours || 0) * 60 * 60 * 1000;
												const minDate = new Date(now.getTime() + minNoticeMs);

												// Obtener las horas del slot
												const [startHour, startMinute] = daySlot.startTime.split(":").map(Number);
												const [endHour, endMinute] = daySlot.endTime.split(":").map(Number);

												// Crear fecha completa con hora de fin para este día
												const slotEndTime = new Date(date);
												slotEndTime.setHours(endHour, endMinute, 0, 0);

												// Si toda la franja horaria está antes del tiempo mínimo de anticipación, deshabilitar fecha
												if (slotEndTime < minDate) {
													return true;
												}

												// Verificar si hay citas que colisionarían en esta fecha y ocuparían todos los slots
												if (availabilitySettings.bookings && availabilitySettings.bookings.length > 0) {
													// Contar cuántas reservas hay para este día
													const bookingsForThisDay = availabilitySettings.bookings.filter((booking) => {
														const bookingDate = new Date(booking.startTime);
														return bookingDate.toDateString() === date.toDateString();
													});

													// Crear array de slots ocupados para esta fecha
													const bookedSlots: { start: Date; end: Date }[] = bookingsForThisDay.map((booking) => ({
														start: new Date(booking.startTime),
														end: new Date(booking.endTime),
													}));

													// Calcular cuántos slots hay en total para este día
													const startMinutes = startHour * 60 + startMinute;
													const endMinutes = endHour * 60 + endMinute;
													const totalDuration =
														availabilitySettings.duration + availabilitySettings.bufferBefore + availabilitySettings.bufferAfter;

													// Verificar si al menos hay un slot disponible
													let hasAvailableSlot = false;

													for (let time = startMinutes; time + availabilitySettings.duration <= endMinutes; time += totalDuration) {
														const hour = Math.floor(time / 60);
														const minute = time % 60;

														// Crear fecha para este slot
														const slotStartDate = new Date(date);
														slotStartDate.setHours(hour, minute, 0, 0);

														// Crear fecha para el final de este slot
														const slotEndDate = new Date(slotStartDate);
														slotEndDate.setMinutes(slotEndDate.getMinutes() + availabilitySettings.duration);

														// Verificar tiempo mínimo de anticipación
														const isAfterMinNotice = slotStartDate.getTime() >= now.getTime() + minNoticeMs;

														// Verificar si el slot se solapa con alguna reserva existente
														const isOverlapping = bookedSlots.some((bookedSlot) => {
															return !(slotEndDate <= bookedSlot.start || slotStartDate >= bookedSlot.end);
														});

														// Si hay al menos un slot disponible, la fecha está habilitada
														if (isAfterMinNotice && !isOverlapping) {
															hasAvailableSlot = true;
															break;
														}
													}

													// Si no hay slots disponibles, deshabilitar la fecha
													if (!hasAvailableSlot) {
														return true;
													}
												} else {
													// Si no hay reservas, verificar si hay al menos un slot que cumpla con el tiempo mínimo
													const startMinutes = startHour * 60 + startMinute;
													const endMinutes = endHour * 60 + endMinute;
													const totalDuration =
														availabilitySettings.duration + availabilitySettings.bufferBefore + availabilitySettings.bufferAfter;

													// Verificar si al menos hay un slot disponible que cumpla con el tiempo mínimo
													let hasAvailableSlot = false;

													for (let time = startMinutes; time + availabilitySettings.duration <= endMinutes; time += totalDuration) {
														const hour = Math.floor(time / 60);
														const minute = time % 60;

														// Crear fecha para este slot
														const slotStartDate = new Date(date);
														slotStartDate.setHours(hour, minute, 0, 0);

														// Verificar tiempo mínimo de anticipación
														const isAfterMinNotice = slotStartDate.getTime() >= now.getTime() + minNoticeMs;

														// Si hay al menos un slot disponible, la fecha está habilitada
														if (isAfterMinNotice) {
															hasAvailableSlot = true;
															break;
														}
													}

													// Si no hay slots disponibles, deshabilitar la fecha
													if (!hasAvailableSlot) {
														return true;
													}
												}

												return false;
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

													if (field.type === "text") {
														return (
															<Grid item xs={12} key={index}>
																<TextField
																	fullWidth
																	label={field.name}
																	value={formData.customFields[field.name] || ""}
																	onChange={handleTextFieldChange(field.name)}
																	error={!!formErrors[errorKey]}
																	helperText={formErrors[errorKey]}
																	required={field.required}
																/>
															</Grid>
														);
													} else if (field.type === "number") {
														return (
															<Grid item xs={12} sm={6} key={index}>
																<TextField
																	fullWidth
																	label={field.name}
																	type="number"
																	value={formData.customFields[field.name] || ""}
																	onChange={handleTextFieldChange(field.name)}
																	error={!!formErrors[errorKey]}
																	helperText={formErrors[errorKey]}
																	required={field.required}
																/>
															</Grid>
														);
													} else if (field.type === "select" && field.options.length > 0) {
														return (
															<Grid item xs={12} sm={6} key={index}>
																<FormControl fullWidth error={!!formErrors[errorKey]} required={field.required}>
																	<InputLabel>{field.name}</InputLabel>
																	<Select<string>
																		value={(formData.customFields[field.name] as string) || ""}
																		label={field.name}
																		onChange={handleSelectFieldChange(field.name)}
																	>
																		{field.options.map((option, idx) => (
																			<MenuItem key={idx} value={option}>
																				{option}
																			</MenuItem>
																		))}
																	</Select>
																	{!!formErrors[errorKey] && <FormHelperText>{formErrors[errorKey]}</FormHelperText>}
																</FormControl>
															</Grid>
														);
													} else if (field.type === "checkbox") {
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
																	{!!formErrors[errorKey] && <FormHelperText>{formErrors[errorKey]}</FormHelperText>}
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
										Token de acceso a la cita:
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

								<Button
									variant="contained"
									color="primary"
									onClick={() => {
										// Reset form data to initial state
										setFormData({
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
										// Reset step to initial state
										setActiveStep(0);
										// Reset selection
										setSelectedDate(null);
										setSelectedTime(null);
										// Reset errors
										setFormErrors({});
										setError(null);
										setTermsAccepted(false);
										// Scroll to top of form
										formStartRef.current?.scrollIntoView({ behavior: "smooth" });
									}}
									sx={{ mt: 2, mr: 2 }}
								>
									Volver al inicio
								</Button>
								<Button variant="outlined" color="primary" onClick={() => navigate(`/manage-booking/${confirmationCode}`)} sx={{ mt: 2 }}>
									Gestionar esta cita
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
				<Footer />
			</Container>
		);
	}

	// Si hay un error pero tenemos un slug, mostrar el mensaje de error
	if (error && slug) {
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
						<Stack direction={{ xs: "column", sm: "row" }} spacing={2} justifyContent="center">
							<Button variant="contained" color="primary" onClick={() => navigate("/booking")} sx={{ mt: 2 }}>
								Volver al inicio
							</Button>
							<Button variant="outlined" color="primary" onClick={() => navigate("/manage-booking")} sx={{ mt: 2 }}>
								Gestionar reservas
							</Button>
						</Stack>
					</CardContent>
				</Card>
				<Footer />
			</Container>
		);
	}

	// Si no hay slug, mostrar la página de búsqueda de disponibilidades
	if (!slug && !availabilitySettings) {
		return (
			<Container maxWidth="md" sx={{ py: 8 }}>
				{/* Header con el logo */}
				<Box
					sx={{
						display: "flex",
						justifyContent: "space-between",
						alignItems: "center",
						mb: 4,
						flexDirection: { xs: "column", sm: "row" },
						gap: 2,
					}}
					ref={formStartRef}
				>
					<Box sx={{ display: "flex", alignItems: "center" }}>
						<img src={logo} style={{ height: "60px", marginRight: "16px" }} alt="Law Analytics" />
					</Box>
					<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
						<Tooltip title="Gestionar reserva">
							<Button
								size="small"
								startIcon={<SecurityUser size={18} />}
								variant="outlined"
								color="primary"
								sx={{ borderRadius: "20px" }}
								onClick={() => navigate("/manage-booking")}
							>
								Gestionar reserva
							</Button>
						</Tooltip>
						<Tooltip title="Soporte">
							<Button
								size="small"
								startIcon={<Sms size={18} />}
								variant="outlined"
								color="primary"
								sx={{ borderRadius: "20px" }}
								onClick={() => setSupportModalOpen(true)}
							>
								Soporte
							</Button>
						</Tooltip>
					</Box>
				</Box>

				<Card sx={{ mb: 4 }}>
					<CardContent sx={{ p: 4 }}>
						<Typography variant="h4" gutterBottom>
							Reserva tu cita
						</Typography>
						<Typography variant="body1" paragraph>
							Ingresa la URL de reserva que te compartió el profesional o selecciona uno de los profesionales disponibles.
						</Typography>

						<Box sx={{ mt: 3, mb: 4 }}>
							<Typography variant="subtitle1" gutterBottom>
								Ingresar URL de reserva
							</Typography>
							<Stack direction="row" spacing={2}>
								<TextField
									fullWidth
									placeholder="Ingresa la URL o código de reserva (ej: citas-12345)"
									value={customUrlInput}
									onChange={(e) => setCustomUrlInput(e.target.value)}
									sx={{ flexGrow: 1 }}
								/>
								<Button
									variant="contained"
									color="primary"
									onClick={handleCustomUrlSubmit}
									disabled={!customUrlInput.trim()}
									sx={{ textTransform: 'none' }}
								>
									Ir a la agenda
								</Button>
							</Stack>
							<FormHelperText>Puedes ingresar la URL completa o solo el código de la agenda</FormHelperText>
						</Box>

						<Divider sx={{ my: 4 }}>
							<Typography variant="body2" color="textSecondary">
								O selecciona un profesional
							</Typography>
						</Divider>
						
						{/* Barra de búsqueda */}
						<Box sx={{ mb: 4 }}>
							<TextField
								fullWidth
								placeholder="Buscar profesionales por nombre o especialidad..."
								value={searchQuery}
								onChange={handleSearchChange}
								InputProps={{
									startAdornment: (
										<InputAdornment position="start">
											<SearchNormal1 size={20} />
										</InputAdornment>
									),
								}}
								sx={{ mb: 2 }}
							/>
							{filteredAvailabilities.length > 0 && (
								<Typography variant="body2" color="textSecondary">
									{filteredAvailabilities.length === 1 
										? "1 profesional encontrado" 
										: `${filteredAvailabilities.length} profesionales encontrados`}
									{searchQuery && ` para "${searchQuery}"`}
								</Typography>
							)}
						</Box>

						{loadingPublicList ? (
							<Box display="flex" justifyContent="center" p={4}>
								<CircularProgress />
							</Box>
						) : filteredAvailabilities.length > 0 ? (
							<>
								<Grid container spacing={3}>
									{currentItems.map((availability) => (
										<Grid item xs={12} sm={6} md={4} key={availability._id}>
											<Card variant="outlined" sx={{ height: "100%", display: "flex", flexDirection: "column" }}>
												<CardContent sx={{ flexGrow: 1 }}>
													<Box sx={{ display: "flex", alignItems: "center", mb: 2 }}>
														<Avatar sx={{ width: 48, height: 48, mr: 2, bgcolor: theme.palette.primary.main }}>
															<SecurityUser size={24} />
														</Avatar>
														<Box>
															<Typography variant="subtitle1">{availability.host?.name || "Profesional"}</Typography>
															{availability.host?.title && (
																<Typography variant="body2" color="textSecondary">
																	{availability.host?.title}
																</Typography>
															)}
														</Box>
													</Box>
													<Typography variant="h6" gutterBottom>
														{availability.title}
													</Typography>
													<Typography variant="body2" color="textSecondary" sx={{ mb: 2 }}>
														{availability.description}
													</Typography>
												</CardContent>
												<Box sx={{ p: 2, pt: 0 }}>
													<Button
														variant="contained"
														color="primary"
														fullWidth
														onClick={() => navigate(`/booking/${availability.publicUrl}`)}
													>
														Reservar cita
													</Button>
												</Box>
											</Card>
										</Grid>
									))}
								</Grid>
								
								{/* Paginación */}
								{filteredAvailabilities.length > itemsPerPage && (
									<Box sx={{ display: 'flex', justifyContent: 'center', mt: 4 }}>
										<Pagination 
											count={Math.ceil(filteredAvailabilities.length / itemsPerPage)}
											page={currentPage}
											onChange={handlePageChange}
											color="primary"
											showFirstButton 
											showLastButton
										/>
									</Box>
								)}
							</>
						) : (
							<Alert severity="info" sx={{ mt: 2 }}>
								{searchQuery 
									? "No se encontraron profesionales que coincidan con la búsqueda."
									: "No hay profesionales con agendas públicas disponibles en este momento."}
							</Alert>
						)}
					</CardContent>
				</Card>

				<Card>
					<CardContent sx={{ p: 4, textAlign: 'center' }}>
						<Typography variant="h5" gutterBottom align="center">
							¿Sos abogado?
						</Typography>
						<Typography variant="body1" paragraph align="center">
							Si sos abogado o profesional jurídico, puedes crear tu agenda de citas para que tus clientes reserven fácilmente.
						</Typography>
						<Box sx={{ display: 'flex', justifyContent: 'center', mt: 2 }}>
							<Button
								variant="contained"
								color="primary"
								onClick={() => navigate("/apps/calendar/availability")}
								sx={{ textTransform: 'none' }}
							>
								Crear mi Agenda
							</Button>
						</Box>
					</CardContent>
				</Card>

				{/* Footer */}
				<Footer />

				{/* Modal de soporte */}
				<SupportModal open={supportModalOpen} onClose={() => setSupportModalOpen(false)} />
			</Container>
		);
	}

	return (
		<Container maxWidth="lg" sx={{ py: 4 }}>
			{/* Header con el logo */}
			<Box
				sx={{
					display: "flex",
					justifyContent: "space-between",
					alignItems: "center",
					mb: 4,
					flexDirection: { xs: "column", sm: "row" },
					gap: 2,
				}}
				ref={formStartRef}
			>
				<Box sx={{ display: "flex", alignItems: "center" }}>
					<img src={logo} style={{ height: "60px", marginRight: "16px" }} alt="Law Analytics" />
				</Box>
				<Box sx={{ display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
					<Tooltip title="Volver">
						<Button
							size="small"
							startIcon={<ArrowLeft size={18} />}
							variant="contained"
							color="primary"
							sx={{ borderRadius: "20px" }}
							onClick={() => { window.location.href = "/booking"; }}
						>
							Volver atrás
						</Button>
					</Tooltip>
					<Tooltip title="Gestionar reserva">
						<Button
							size="small"
							startIcon={<SecurityUser size={18} />}
							variant="outlined"
							color="primary"
							sx={{ borderRadius: "20px" }}
							onClick={() => navigate("/manage-booking")}
						>
							Gestionar reserva
						</Button>
					</Tooltip>
					<Tooltip title="Contacto">
						<Button size="small" startIcon={<Call size={18} />} variant="outlined" color="primary" sx={{ borderRadius: "20px" }}>
							Contacto
						</Button>
					</Tooltip>
					<Tooltip title="Soporte">
						<Button
							size="small"
							startIcon={<Sms size={18} />}
							variant="outlined"
							color="primary"
							sx={{ borderRadius: "20px" }}
							onClick={() => setSupportModalOpen(true)}
						>
							Soporte
						</Button>
					</Tooltip>
				</Box>
			</Box>

			<Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 2, bgcolor: "background.paper" }}>
				<Box sx={{ mb: 4 }}>
					<Typography variant="h3" gutterBottom>
						{availabilitySettings?.title || "Reserva tu cita"}
					</Typography>
					{availabilitySettings?.description && (
						<Typography variant="body1" color="textSecondary">
							{availabilitySettings.description}
						</Typography>
					)}

					{availabilitySettings?.host && (
						<Box sx={{ display: "flex", alignItems: "center", mt: 2 }}>
							<Avatar sx={{ width: 48, height: 48, mr: 2, bgcolor: theme.palette.primary.main }}>
								<SecurityUser size={24} />
							</Avatar>
							<Box>
								<Typography variant="subtitle1">{availabilitySettings.host.name}</Typography>
								{availabilitySettings.host.title && (
									<Typography variant="body2" color="textSecondary">
										{availabilitySettings.host.title}
									</Typography>
								)}
							</Box>
						</Box>
					)}
				</Box>

				<Stepper
					activeStep={activeStep}
					sx={{
						mb: 4,
						p: 2,
						bgcolor: theme.palette.grey[100],
						borderRadius: 2,
					}}
					alternativeLabel
				>
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

			{/* Footer */}
			<Footer />

			{/* Modal de soporte */}
			<SupportModal open={supportModalOpen} onClose={() => setSupportModalOpen(false)} />
		</Container>
	);
};

export default BookingPage;
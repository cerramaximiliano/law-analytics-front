import React from "react";
import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import axios from "axios";
import { useRequestQueueRefresh } from "hooks/useRequestQueueRefresh";
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Divider,
	FormControl,
	Grid,
	IconButton,
	InputLabel,
	Menu,
	MenuItem,
	Paper,
	Select,
	Stack,
	Tab,
	Tabs,
	TextField,
	Typography,
	useTheme,
	Alert,
	Tooltip,
	Skeleton,
} from "@mui/material";
import ResponsiveDialog from "components/@extended/ResponsiveDialog";
import { Calendar, ClipboardTick, MoreSquare, Trash, User, Edit2, Link21, Clock, InfoCircle, Lock } from "iconsax-react";
import MainCard from "components/MainCard";
import { LoadingButton } from "@mui/lab";
import dayjs from "utils/dayjs-config";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { GuideBooking } from "components/guides";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import useSubscription from "hooks/useSubscription";

// Definición de interfaces para tipar adecuadamente los objetos
interface CustomField {
	name: string;
	value: string | number | boolean;
}

interface TimeSlot {
	day: number;
	startTime: string;
	endTime: string;
	isActive: boolean;
}

interface AvailabilityType {
	_id: string;
	title: string;
	color: string;
	isActive: boolean;
	duration: number;
	timeSlots: TimeSlot[];
	requireApproval: boolean;
	publicUrl: string;
}

interface BookingType {
	_id: string;
	clientName: string;
	clientEmail: string;
	clientPhone?: string;
	clientCompany?: string;
	clientAddress?: string;
	status: "pending" | "confirmed" | "cancelled" | "rejected" | "completed";
	startTime: string;
	endTime: string;
	notes?: string;
	customFields?: CustomField[];
	cancelledBy?: "host" | "client";
	cancellationReason?: string;
	availability?: AvailabilityType;
}

// Nota: El componente EmptyState se ha eliminado pues ya no se utiliza

// Componente para NoResultsState
const NoResultsState: React.FC<{
	title: string;
	description: string;
}> = ({ title, description }) => (
	<Box
		sx={{
			textAlign: "center",
			p: 4,
			display: "flex",
			flexDirection: "column",
			alignItems: "center",
			justifyContent: "center",
			minHeight: "200px",
		}}
	>
		<Typography variant="h5" gutterBottom>
			{title}
		</Typography>
		<Typography variant="body1" color="text.secondary">
			{description}
		</Typography>
	</Box>
);

// Componente para mostrar un resumen de la disponibilidad
const AvailabilityCard: React.FC<{
	availability: AvailabilityType;
	onDelete: (availabilityId: string) => void;
}> = ({ availability, onDelete }) => {
	const theme = useTheme();
	const navigate = useNavigate();
	const [copied, setCopied] = useState(false);

	// Función para formatear los horarios de disponibilidad
	const formatTimeSlots = (timeSlots: any[] | undefined) => {
		if (!timeSlots || !Array.isArray(timeSlots) || timeSlots.length === 0) return "No configurado";

		try {
			// Agrupar slots por día para una mejor visualización
			const dayMap: Record<number, { day: number; startTime: string; endTime: string; isActive: boolean }> = {};

			// Recorrer los slots y agruparlos por día
			timeSlots.forEach((slot) => {
				if (slot && slot.isActive) {
					dayMap[slot.day] = slot;
				}
			});

			// Convertir el mapa a un array
			const activeSlots = Object.values(dayMap).filter((slot) => slot.isActive);

			if (activeSlots.length === 0) return "No hay horarios activos";

			// Si hay más de 3 slots, solo mostramos algunos
			const displaySlots = activeSlots.slice(0, 3);
			const additionalSlots = activeSlots.length > 3 ? ` y ${activeSlots.length - 3} más` : "";

			return (
				displaySlots
					.map((slot) => {
						const dayNames = ["Domingo", "Lunes", "Martes", "Miércoles", "Jueves", "Viernes", "Sábado"];
						const dayName = dayNames[slot.day]; // Usar directamente el número de día (0=domingo, 1=lunes, etc.)

						return `${dayName} ${slot.startTime || "--:--"} - ${slot.endTime || "--:--"}`;
					})
					.join("; ") + additionalSlots
			);
		} catch (error) {
			return "Formato de horario no válido";
		}
	};

	// Manejar la copia del enlace
	const handleCopyLink = () => {
		const url = `${window.location.origin}/booking/${availability.publicUrl}`;
		navigator.clipboard.writeText(url);
		setCopied(true);

		dispatch(
			openSnackbar({
				open: true,
				message: "Enlace copiado al portapapeles",
				variant: "alert",
				alert: {
					color: "success",
				},
				close: false,
			}),
		);

		// Restablecer el estado después de 2 segundos
		setTimeout(() => setCopied(false), 2000);
	};

	return (
		<Card variant="outlined" sx={{ height: "100%", borderLeft: `4px solid ${theme.palette.primary.main}` }}>
			<CardContent>
				<Box sx={{ mb: 2 }}>
					<Typography variant="h6" sx={{ fontWeight: 500 }}>
						{availability.title}
					</Typography>
				</Box>

				<Stack spacing={2}>
					<Box sx={{ display: "flex", alignItems: "flex-start" }}>
						<Clock size={18} style={{ marginRight: 8, marginTop: 4, flexShrink: 0 }} />
						<Box>
							<Typography variant="body2" sx={{ fontWeight: 500 }}>
								Duración:
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{availability.duration} minutos
							</Typography>
						</Box>
					</Box>

					<Box sx={{ display: "flex", alignItems: "flex-start" }}>
						<Calendar size={18} style={{ marginRight: 8, marginTop: 4, flexShrink: 0 }} />
						<Box>
							<Typography variant="body2" sx={{ fontWeight: 500 }}>
								Horarios:
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{formatTimeSlots(availability.timeSlots)}
							</Typography>
						</Box>
					</Box>

					<Box sx={{ display: "flex", alignItems: "flex-start" }}>
						<Link21 size={18} style={{ marginRight: 8, marginTop: 4, flexShrink: 0 }} />
						<Box sx={{ flex: 1 }}>
							<Typography variant="body2" sx={{ fontWeight: 500, mb: 0.5 }}>
								Enlace:
							</Typography>
							<Button size="small" onClick={handleCopyLink} startIcon={<Link21 size={16} />} sx={{ textTransform: "none" }}>
								{copied ? "¡Copiado!" : "Copiar enlace"}
							</Button>
						</Box>
					</Box>
				</Stack>

				<Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
					<Tooltip title="Eliminar Configuración">
						<IconButton
							size="small"
							color="primary"
							onClick={() => navigate(`/apps/calendar/booking-config?id=${availability._id}`)}
							sx={{ textTransform: "none" }}
						>
							<Edit2 variant="Bulk" size={16} />
						</IconButton>
					</Tooltip>
					<Tooltip title="Editar Configuración">
						<IconButton size="small" color="error" onClick={() => onDelete(availability._id)} sx={{ textTransform: "none" }}>
							<Trash variant="Bulk" size={16} />
						</IconButton>
					</Tooltip>
				</Box>

				<Chip
					label={availability.isActive ? "Activa" : "Inactiva"}
					size="small"
					color={availability.isActive ? "success" : "default"}
					sx={{ position: "absolute", top: 12, right: 12 }}
				/>
			</CardContent>
		</Card>
	);
};

// Componente para la tarjeta de reserva
const BookingCard: React.FC<{
	booking: BookingType;
	availability: AvailabilityType;
	onStatusChange: (bookingId: string, newStatus: BookingType["status"]) => void;
	onDelete: (booking: BookingType) => void;
	showAvailabilityInfo?: boolean;
}> = ({ booking, availability, onStatusChange, onDelete, showAvailabilityInfo = false }) => {
	const theme = useTheme();
	const [expanded, setExpanded] = useState(false);
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const open = Boolean(anchorEl);

	// Obtener acceso a las características de suscripción utilizando el hook
	const { hasFeatureLocal } = useSubscription();
	const hasBookingFeature = hasFeatureLocal("booking");

	// Determinar color según estado
	const getStatusChip = (status: BookingType["status"]) => {
		switch (status) {
			case "confirmed":
				return <Chip label="Confirmada" size="small" color="success" />;
			case "pending":
				return <Chip label="Pendiente" size="small" color="warning" />;
			case "cancelled":
				return <Chip label="Cancelada" size="small" color="error" />;
			case "rejected":
				return <Chip label="Rechazada" size="small" color="error" />;
			case "completed":
				return <Chip label="Completada" size="small" color="info" />;
			default:
				return null;
		}
	};

	// Verificar si ya pasó la fecha
	const isPast = booking.startTime ? dayjs().isAfter(dayjs(booking.startTime)) : false;

	// Verificar si es hoy
	const isBookingToday = booking.startTime ? dayjs(booking.startTime).isToday() : false;

	const handleClick = (event: React.MouseEvent<HTMLElement>) => {
		setAnchorEl(event.currentTarget);
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	return (
		<Card
			variant="outlined"
			sx={{
				height: "100%",
				borderLeft: "4px solid",
				borderLeftColor:
					booking.status === "confirmed"
						? "success.main"
						: booking.status === "pending"
						? "warning.main"
						: booking.status === "cancelled" || booking.status === "rejected"
						? "error.main"
						: "grey.500",
			}}
		>
			<CardContent sx={{ pb: 1 }}>
				<Box sx={{ display: "flex", justifyContent: "space-between", mb: 1 }}>
					<Typography variant="h6" sx={{ flexGrow: 1, fontWeight: 500 }}>
						{booking.clientName}
					</Typography>
					<IconButton
						size="small"
						onClick={handleClick}
						aria-controls={open ? "booking-menu" : undefined}
						aria-haspopup="true"
						aria-expanded={open ? "true" : undefined}
						disabled={!hasBookingFeature}
					>
						<MoreSquare size={20} />
					</IconButton>
					<Menu
						id="booking-menu"
						anchorEl={anchorEl}
						open={open}
						onClose={handleClose}
						MenuListProps={{
							"aria-labelledby": "booking-button",
						}}
					>
						{booking.status === "pending" && (
							<MenuItem
								onClick={() => {
									handleClose();
									onStatusChange(booking._id, "confirmed");
								}}
								disabled={!hasBookingFeature}
							>
								<ClipboardTick size={16} style={{ marginRight: 8, color: theme.palette.success.main }} />
								Confirmar
							</MenuItem>
						)}

						{booking.status === "pending" && (
							<MenuItem
								onClick={() => {
									handleClose();
									onStatusChange(booking._id, "rejected");
								}}
								sx={{ color: "error.main" }}
								disabled={!hasBookingFeature}
							>
								<Trash size={16} style={{ marginRight: 8 }} />
								Rechazar
							</MenuItem>
						)}

						{booking.status === "confirmed" && !isPast && (
							<MenuItem
								onClick={() => {
									handleClose();
									onStatusChange(booking._id, "cancelled");
								}}
								sx={{ color: "error.main" }}
								disabled={!hasBookingFeature}
							>
								<Trash size={16} style={{ marginRight: 8 }} />
								Cancelar
							</MenuItem>
						)}

						{booking.status === "confirmed" && isPast && (
							<MenuItem
								onClick={() => {
									handleClose();
									onStatusChange(booking._id, "completed");
								}}
								disabled={!hasBookingFeature}
							>
								<ClipboardTick size={16} style={{ marginRight: 8 }} />
								Marcar como completada
							</MenuItem>
						)}

						<MenuItem
							onClick={() => {
								handleClose();
								onDelete(booking);
							}}
							sx={{ color: "error.main" }}
							disabled={!hasBookingFeature}
						>
							<Trash size={16} style={{ marginRight: 8 }} />
							Eliminar
						</MenuItem>
					</Menu>
				</Box>

				<Stack direction="row" spacing={1} sx={{ mb: 2 }}>
					{getStatusChip(booking.status)}
					{isBookingToday && <Chip label="Hoy" size="small" color="info" />}
				</Stack>

				<Stack spacing={1.5}>
					<Box sx={{ display: "flex" }}>
						<Calendar size={18} style={{ marginRight: 8, flexShrink: 0, marginTop: 2 }} />
						<Box>
							<Typography variant="body2" sx={{ fontWeight: 500 }}>
								{dayjs(booking.startTime).format("dddd, D [de] MMMM [de] YYYY")}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{dayjs(booking.startTime).format("h:mm a")} - {dayjs(booking.endTime).format("h:mm a")}
							</Typography>
						</Box>
					</Box>

					<Box sx={{ display: "flex" }}>
						<User size={18} style={{ marginRight: 8, flexShrink: 0, marginTop: 2 }} />
						<Box>
							<Typography variant="body2" sx={{ fontWeight: 500 }}>
								{booking.clientName}
							</Typography>
							<Typography variant="body2" color="text.secondary">
								{booking.clientEmail}
								{booking.clientPhone && ` • ${booking.clientPhone}`}
							</Typography>
							{booking.clientCompany && (
								<Typography variant="body2" color="text.secondary">
									{booking.clientCompany}
								</Typography>
							)}
						</Box>
					</Box>

					{/* Mostrar información de disponibilidad cuando se ven todas las reservas */}
					{showAvailabilityInfo && availability && (
						<Box sx={{ display: "flex", mt: 1.5 }}>
							<Calendar size={18} style={{ marginRight: 8, flexShrink: 0, marginTop: 2 }} />
							<Box>
								<Typography variant="body2" sx={{ fontWeight: 500 }}>
									Tipo de cita:
								</Typography>
								<Typography variant="body2" color="text.secondary">
									{availability.title || "No especificado"}
								</Typography>
							</Box>
						</Box>
					)}
				</Stack>

				{expanded && (
					<Box sx={{ mt: 2 }}>
						<Divider sx={{ my: 1.5 }} />

						{booking.notes && (
							<Box sx={{ mb: 2 }}>
								<Typography variant="subtitle2">Notas:</Typography>
								<Typography variant="body2">{booking.notes}</Typography>
							</Box>
						)}

						{booking.clientAddress && (
							<Box sx={{ mb: 2 }}>
								<Typography variant="subtitle2">Dirección:</Typography>
								<Typography variant="body2">{booking.clientAddress}</Typography>
							</Box>
						)}

						{booking.customFields && booking.customFields.length > 0 && (
							<Box>
								<Typography variant="subtitle2" sx={{ mb: 1 }}>
									Campos personalizados:
								</Typography>
								{Array.isArray(booking.customFields) &&
									booking.customFields.map((field, index) => (
										<Box key={index} sx={{ mb: 1 }}>
											<Typography variant="caption" sx={{ fontWeight: 500 }}>
												{field.name}:
											</Typography>
											<Typography variant="body2">{field.value.toString()}</Typography>
										</Box>
									))}
							</Box>
						)}

						{booking.cancelledBy && (
							<Box sx={{ mt: 2 }}>
								<Typography variant="subtitle2" color="error">
									Cancelado por: {booking.cancelledBy === "host" ? "Anfitrión" : "Cliente"}
								</Typography>
								{booking.cancellationReason && (
									<Typography variant="body2" color="text.secondary">
										Motivo: {booking.cancellationReason}
									</Typography>
								)}
							</Box>
						)}
					</Box>
				)}
			</CardContent>

			<Box sx={{ p: 2, pt: 0, display: "flex", justifyContent: "space-between" }}>
				<Box display="flex" gap={1}>
					{booking.status === "pending" && (
						<>
							<Button
								size="small"
								variant="outlined"
								color="success"
								startIcon={<ClipboardTick size={16} />}
								onClick={() => onStatusChange(booking._id, "confirmed")}
								sx={{ textTransform: "none" }}
								disabled={!hasBookingFeature}
							>
								Confirmar
							</Button>
							<Button
								size="small"
								variant="outlined"
								color="error"
								startIcon={<Trash size={16} />}
								onClick={() => onStatusChange(booking._id, "rejected")}
								sx={{ textTransform: "none" }}
								disabled={!hasBookingFeature}
							>
								Rechazar
							</Button>
						</>
					)}

					{booking.status === "confirmed" && !isPast && (
						<Button
							size="small"
							variant="outlined"
							color="error"
							startIcon={<Trash size={16} />}
							onClick={() => onStatusChange(booking._id, "cancelled")}
							sx={{ textTransform: "none" }}
							disabled={!hasBookingFeature}
						>
							Cancelar
						</Button>
					)}

					{booking.status === "confirmed" && isPast && (
						<Button
							size="small"
							variant="outlined"
							color="info"
							startIcon={<ClipboardTick size={16} />}
							onClick={() => onStatusChange(booking._id, "completed")}
							sx={{ textTransform: "none" }}
							disabled={!hasBookingFeature}
						>
							Completada
						</Button>
					)}
				</Box>

				<Button size="small" onClick={() => setExpanded(!expanded)} sx={{ textTransform: "none" }}>
					{expanded ? "Ver menos" : "Ver más"}
				</Button>
			</Box>
		</Card>
	);
};

// Nota: AvailabilityManagement (gestión de tipos de cita) ha sido movido a `/apps/calendar/booking-config`
// Ahora solo usamos BookingsManagement para mostrar reservas

// Componente para gestionar las reservas de una disponibilidad específica
const BookingsManagement = () => {
	const navigate = useNavigate();
	const theme = useTheme();
	const [loading, setLoading] = useState(true);
	const [bookings, setBookings] = useState<BookingType[]>([]);
	const [availability, setAvailability] = useState<AvailabilityType | null>(null);
	const [filter, setFilter] = useState("upcoming");
	const [statusFilter, setStatusFilter] = useState("all");
	const [deleteDialog, setDeleteDialog] = useState(false);
	const [selectedBooking, setSelectedBooking] = useState<BookingType | null>(null);
	const [rejectDialog, setRejectDialog] = useState(false);
	const [rejectReason, setRejectReason] = useState("");
	const [cancelDialog, setCancelDialog] = useState(false);
	const [cancelReason, setCancelReason] = useState("");
	const [loadingAction, setLoadingAction] = useState(false);
	const [availabilities, setAvailabilities] = useState<AvailabilityType[]>([]);
	const [deleteAvailabilityDialog, setDeleteAvailabilityDialog] = useState(false);
	const [selectedAvailabilityId, setSelectedAvailabilityId] = useState<string | null>(null);
	const [guideOpen, setGuideOpen] = useState(false);
	const [hasBookingFeature, setHasBookingFeature] = useState(false);
	const [featureInfo, setFeatureInfo] = useState<any>(null);
	const [limitModalOpen, setLimitModalOpen] = useState(false);
	// Estado para controlar si el modal ha sido cerrado una vez
	const [hasModalBeenClosed, setHasModalBeenClosed] = useState(false);

	// Determinar si estamos viendo una disponibilidad específica o todas las reservas
	const urlParts = window.location.pathname.split("/");
	const availabilityId = urlParts[urlParts.length - 1];
	const isSpecificAvailability = availabilityId && availabilityId !== "reservations";

	// Obtener acceso a las características de suscripción utilizando el hook
	const { subscription, hasFeatureLocal } = useSubscription();

	// Función para crear el objeto featureInfo de forma estándar
	const createFeatureInfo = () => ({
		feature: "Gestión de Reservas",
		plan: subscription?.plan || "free",
		availableIn: ["standard", "premium"],
	});

	// Se ejecuta solo al montar el componente
	useEffect(() => {
		// Limpiar el flag del sessionStorage al montar el componente
		// Esto asegura que al navegar fuera y volver, el modal pueda mostrarse nuevamente
		sessionStorage.removeItem("booking_modal_shown");

		// Efecto de limpieza: remover también cuando el componente se desmonte
		return () => {
			sessionStorage.removeItem("booking_modal_shown");
		};
	}, []);

	// Verificar si el usuario tiene acceso a la característica de reservas
	useEffect(() => {
		// Verificar si tiene la característica de booking usando el hook
		const hasBookingAccess = hasFeatureLocal("booking");

		setHasBookingFeature(hasBookingAccess || false);

		// Si no tiene la característica habilitada y el modal no ha sido cerrado manualmente
		if (!hasBookingAccess && !hasModalBeenClosed) {
			setFeatureInfo(createFeatureInfo());

			// Comprobar si ya mostramos el modal en esta visita a la página
			const modalShown = sessionStorage.getItem("booking_modal_shown");

			// Solo mostrar el modal si no se ha mostrado antes
			if (!modalShown) {
				setLimitModalOpen(true);
			}
		}
	}, [subscription, hasModalBeenClosed]);

	// Manejar cierre del modal
	const handleCloseLimitModal = () => {
		// Marcar que el modal fue cerrado explícitamente por el usuario
		setHasModalBeenClosed(true);
		// Marcar que ya se mostró, para evitar mostrarlo nuevamente en esta sesión
		sessionStorage.setItem("booking_modal_shown", "true");
		setLimitModalOpen(false);
	};

	// Función para cargar datos - convertida a callback para reutilizar
	const fetchData = useCallback(async () => {
		try {
			setLoading(true);
			// Si estamos viendo una disponibilidad específica
			if (isSpecificAvailability) {
				// Cargar disponibilidad
				const availabilityResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/booking/availability/${availabilityId}`);

				setAvailability(availabilityResponse.data);

				// Cargar reservas para esta disponibilidad específica
				const bookingsResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/booking/availability/${availabilityId}/bookings`);

				// Asegurar que siempre sea un array
				const bookingsData = Array.isArray(bookingsResponse.data) ? bookingsResponse.data : [];
				setBookings(bookingsData);
			} else {
				// Cargar todas las reservas del usuario
				const bookingsResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/booking/bookings`);

				// Asegurar que siempre sea un array
				const bookingsData = Array.isArray(bookingsResponse.data) ? bookingsResponse.data : [];
				setBookings(bookingsData);

				// Cargar todas las disponibilidades cuando estamos en la vista general
				const availabilitiesResponse = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/booking/availability`);

				// Asegurar que siempre sea un array
				const availabilitiesData = Array.isArray(availabilitiesResponse.data) ? availabilitiesResponse.data : [];
				setAvailabilities(availabilitiesData);
			}
		} catch (error) {
			console.error("Error fetching reservations data:", error);
			// Si hay un error, asegurar que bookings sea un array vacío
			setBookings([]);
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al cargar datos",
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
	}, [availabilityId, isSpecificAvailability]);

	// Cargar datos al montar o cuando cambien las dependencias
	useEffect(() => {
		fetchData();
	}, [fetchData]);

	// Refrescar datos cuando se procesen las peticiones encoladas
	useRequestQueueRefresh(() => {
		fetchData();
	}, [fetchData]);

	// Filtrar reservas - Asegurar que bookings sea un array
	const filteredBookings = (Array.isArray(bookings) ? bookings : [])
		.filter((booking) => {
			const bookingDate = new Date(booking.startTime);
			const now = new Date();

			if (filter === "upcoming") {
				return bookingDate >= now;
			} else if (filter === "past") {
				return bookingDate < now;
			}
			return true;
		})
		.filter((booking) => {
			if (statusFilter === "all") return true;
			return booking.status === statusFilter;
		})
		.sort((a, b) => {
			// Ordenar por fecha (más reciente primero para pasadas, más próxima primero para futuras)
			const dateA = new Date(a.startTime).getTime();
			const dateB = new Date(b.startTime).getTime();

			if (filter === "upcoming") {
				return dateA - dateB; // Más próxima primero
			} else {
				return dateB - dateA; // Más reciente primero
			}
		});

	// Manejar cambio de estado
	const handleStatusChange = async (bookingId: string, newStatus: BookingType["status"]) => {
		// Si el estado es "rejected" y no tenemos razón, mostramos el diálogo
		if (newStatus === "rejected") {
			const bookingToReject = bookings.find((b) => b._id === bookingId);
			if (bookingToReject) {
				setSelectedBooking(bookingToReject);
				setRejectDialog(true);
				return;
			}
		}

		// Si el estado es "cancelled", mostramos el diálogo de cancelación
		if (newStatus === "cancelled") {
			const bookingToCancel = bookings.find((b) => b._id === bookingId);
			if (bookingToCancel) {
				setSelectedBooking(bookingToCancel);
				setCancelDialog(true);
				return;
			}
		}

		setLoadingAction(true);
		try {
			const payload: {
				status: BookingType["status"];
				cancellationReason?: string;
			} = {
				status: newStatus,
			};

			if (newStatus === "rejected" && rejectReason) {
				payload.cancellationReason = rejectReason;
			}

			const response = await axios.patch(`${process.env.REACT_APP_BASE_URL}/api/booking/bookings/${bookingId}/status`, payload);

			const updatedBooking = response.data;

			// Actualizar bookings
			setBookings(Array.isArray(bookings) ? bookings.map((b) => (b._id === bookingId ? updatedBooking : b)) : []);

			dispatch(
				openSnackbar({
					open: true,
					message: `Reserva ${
						newStatus === "confirmed"
							? "confirmada"
							: newStatus === "rejected"
							? "rechazada"
							: newStatus === "cancelled"
							? "cancelada"
							: newStatus === "completed"
							? "completada"
							: "actualizada"
					} correctamente`,
					variant: "alert",
					alert: {
						color: "success",
					},
					close: false,
				}),
			);
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al actualizar estado de la reserva",
					variant: "alert",
					alert: {
						color: "error",
					},
					close: false,
				}),
			);
		} finally {
			setLoadingAction(false);
			setRejectDialog(false);
			setRejectReason("");
			setCancelDialog(false);
			setCancelReason("");
		}
	};

	// Manejar confirmación de rechazo (desde el diálogo)
	const handleRejectConfirm = async () => {
		if (selectedBooking) {
			setLoadingAction(true);
			try {
				const payload = {
					status: "rejected",
					cancellationReason: rejectReason || undefined,
				};

				const response = await axios.patch(`${process.env.REACT_APP_BASE_URL}/api/booking/bookings/${selectedBooking._id}/status`, payload);

				const updatedBooking = response.data;

				// Actualizar bookings
				setBookings(Array.isArray(bookings) ? bookings.map((b) => (b._id === selectedBooking._id ? updatedBooking : b)) : []);

				dispatch(
					openSnackbar({
						open: true,
						message: "Reserva rechazada correctamente",
						variant: "alert",
						alert: {
							color: "success",
						},
						close: false,
					}),
				);
			} catch (error) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Error al rechazar la reserva",
						variant: "alert",
						alert: {
							color: "error",
						},
						close: false,
					}),
				);
			} finally {
				setLoadingAction(false);
				setRejectDialog(false);
				setRejectReason("");
				setSelectedBooking(null);
			}
		}
	};

	// Manejar confirmación de cancelación (desde el diálogo)
	const handleCancelConfirm = async () => {
		if (selectedBooking) {
			setLoadingAction(true);
			try {
				const payload = {
					status: "cancelled",
					cancellationReason: cancelReason || undefined,
					cancelledBy: "host",
				};

				const response = await axios.patch(`${process.env.REACT_APP_BASE_URL}/api/booking/bookings/${selectedBooking._id}/status`, payload);

				const updatedBooking = response.data;

				// Actualizar bookings
				setBookings(Array.isArray(bookings) ? bookings.map((b) => (b._id === selectedBooking._id ? updatedBooking : b)) : []);

				dispatch(
					openSnackbar({
						open: true,
						message: "Reserva cancelada correctamente",
						variant: "alert",
						alert: {
							color: "success",
						},
						close: false,
					}),
				);
			} catch (error) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Error al cancelar la reserva",
						variant: "alert",
						alert: {
							color: "error",
						},
						close: false,
					}),
				);
			} finally {
				setLoadingAction(false);
				setCancelDialog(false);
				setCancelReason("");
				setSelectedBooking(null);
			}
		}
	};

	// Manejar eliminación de reserva
	const handleDeleteClick = (booking: BookingType) => {
		setSelectedBooking(booking);
		setDeleteDialog(true);
	};

	const handleDeleteConfirm = async () => {
		setLoadingAction(true);
		try {
			if (!selectedBooking) return;

			await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/booking/bookings/${selectedBooking._id}`);

			setBookings(bookings.filter((b) => b._id !== selectedBooking._id));

			dispatch(
				openSnackbar({
					open: true,
					message: "Reserva eliminada correctamente",
					variant: "alert",
					alert: {
						color: "success",
					},
					close: false,
				}),
			);
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al eliminar reserva",
					variant: "alert",
					alert: {
						color: "error",
					},
					close: false,
				}),
			);
		} finally {
			setDeleteDialog(false);
			setSelectedBooking(null);
			setLoadingAction(false);
		}
	};

	// Manejar eliminación de disponibilidad
	const handleDeleteAvailabilityClick = (availabilityId: string) => {
		setSelectedAvailabilityId(availabilityId);
		setDeleteAvailabilityDialog(true);
	};

	const handleDeleteAvailabilityConfirm = async () => {
		setLoadingAction(true);
		try {
			if (!selectedAvailabilityId) return;

			await axios.delete(`${process.env.REACT_APP_BASE_URL}/api/booking/availability/${selectedAvailabilityId}`);

			// Actualizar la lista de disponibilidades
			setAvailabilities(Array.isArray(availabilities) ? availabilities.filter((a) => a._id !== selectedAvailabilityId) : []);

			dispatch(
				openSnackbar({
					open: true,
					message: "Disponibilidad eliminada correctamente",
					variant: "alert",
					alert: {
						color: "success",
					},
					close: false,
				}),
			);
		} catch (error) {
			if (axios.isAxiosError(error)) {
				// Intentamos obtener el mensaje de error del servidor, si existe
				const serverErrorMsg = error.response?.data?.error || error.response?.data?.message;

				// Comprobamos si hay reservas asociadas (motivo común para error 400)
				const hasPendingBookings =
					error.response?.data?.hasBookings ||
					String(error.response?.data?.error).includes("reservas") ||
					String(error.response?.data?.message).includes("bookings");

				// Mostrar mensaje específico basado en el código de estado
				let errorMessage = "Error al eliminar la disponibilidad";

				if (error.response) {
					// El servidor respondió con un código de estado fuera del rango 2xx
					if (error.response.status === 400) {
						errorMessage = hasPendingBookings
							? "No se puede eliminar: hay reservas pendientes asociadas a esta disponibilidad"
							: serverErrorMsg || "Error en la solicitud";
					} else if (error.response.status === 401 || error.response.status === 403) {
						errorMessage = "No tienes permisos para realizar esta acción";
					} else if (error.response.status === 404) {
						errorMessage = "La disponibilidad ya no existe o ha sido eliminada";
					} else if (error.response.status === 500) {
						errorMessage = "Error interno del servidor. Inténtalo más tarde";
					}
				} else if (error.request) {
					// La solicitud se realizó pero no se recibió respuesta
					errorMessage = "No se recibió respuesta del servidor. Verifica tu conexión";
				}

				dispatch(
					openSnackbar({
						open: true,
						message: serverErrorMsg || errorMessage,
						variant: "alert",
						alert: {
							color: "error",
						},
						close: false,
					}),
				);
			} else {
				// Para errores no relacionados con Axios
				dispatch(
					openSnackbar({
						open: true,
						message: "Error al eliminar la disponibilidad",
						variant: "alert",
						alert: {
							color: "error",
						},
						close: false,
					}),
				);
			}
		} finally {
			setDeleteAvailabilityDialog(false);
			setSelectedAvailabilityId(null);
			setLoadingAction(false);
		}
	};

	// Mostrar skeleton mientras se carga
	if (loading) {
		return (
			<MainCard
				title={isSpecificAvailability && availability ? `Reservas - ${availability.title}` : "Configuración de Citas"}
				secondary={
					<Stack direction="row" spacing={2} alignItems="center">
						<Skeleton variant="rounded" width={120} height={36} />
						<Skeleton variant="rounded" width={180} height={36} />
					</Stack>
				}
			>
				{/* Skeleton para sección de disponibilidades */}
				{!isSpecificAvailability && (
					<Box sx={{ mb: 4 }}>
						<Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />
						<Grid container spacing={3}>
							{[1, 2, 3].map((item) => (
								<Grid item xs={12} sm={6} md={4} key={item}>
									<Card variant="outlined" sx={{ height: "100%" }}>
										<CardContent>
											<Skeleton variant="text" width="60%" height={28} sx={{ mb: 2 }} />
											<Stack spacing={2}>
												<Box sx={{ display: "flex", alignItems: "flex-start" }}>
													<Skeleton variant="circular" width={18} height={18} sx={{ mr: 1, mt: 0.5 }} />
													<Box sx={{ flex: 1 }}>
														<Skeleton variant="text" width="40%" height={20} />
														<Skeleton variant="text" width="80%" height={20} />
													</Box>
												</Box>
												<Box sx={{ display: "flex", alignItems: "flex-start" }}>
													<Skeleton variant="circular" width={18} height={18} sx={{ mr: 1, mt: 0.5 }} />
													<Box sx={{ flex: 1 }}>
														<Skeleton variant="text" width="40%" height={20} />
														<Skeleton variant="text" width="90%" height={20} />
													</Box>
												</Box>
												<Box sx={{ display: "flex", alignItems: "flex-start" }}>
													<Skeleton variant="circular" width={18} height={18} sx={{ mr: 1, mt: 0.5 }} />
													<Box sx={{ flex: 1 }}>
														<Skeleton variant="text" width="30%" height={20} />
														<Skeleton variant="rounded" width={120} height={32} />
													</Box>
												</Box>
											</Stack>
											<Box sx={{ display: "flex", justifyContent: "flex-end", gap: 1, mt: 2 }}>
												<Skeleton variant="circular" width={32} height={32} />
												<Skeleton variant="circular" width={32} height={32} />
											</Box>
										</CardContent>
									</Card>
								</Grid>
							))}
						</Grid>
					</Box>
				)}

				{/* Skeleton para sección de reservas */}
				<Skeleton variant="text" width="30%" height={32} sx={{ mb: 2 }} />

				{/* Tabs skeleton */}
				<Paper sx={{ mb: 3 }}>
					<Stack direction="row" spacing={2} sx={{ borderBottom: 1, borderColor: "divider", p: 2 }}>
						<Skeleton variant="rounded" width={100} height={32} />
						<Skeleton variant="rounded" width={100} height={32} />
						<Skeleton variant="rounded" width={100} height={32} />
					</Stack>
					<Box sx={{ p: 2, display: "flex", alignItems: "center" }}>
						<Skeleton variant="text" width={120} height={24} sx={{ mr: 2 }} />
						<Skeleton variant="rounded" width={200} height={40} />
					</Box>
				</Paper>

				{/* Cards skeleton */}
				<Grid container spacing={3}>
					{[1, 2, 3, 4, 5, 6].map((item) => (
						<Grid item xs={12} sm={6} md={4} key={item}>
							<Card variant="outlined" sx={{ height: "100%" }}>
								<CardContent>
									<Skeleton variant="text" width="70%" height={28} sx={{ mb: 2 }} />
									<Stack direction="row" spacing={1} sx={{ mb: 2 }}>
										<Skeleton variant="rounded" width={80} height={24} />
										<Skeleton variant="rounded" width={60} height={24} />
									</Stack>
									<Stack spacing={1.5}>
										<Box sx={{ display: "flex" }}>
											<Skeleton variant="circular" width={18} height={18} sx={{ mr: 1, mt: 0.5 }} />
											<Box sx={{ flex: 1 }}>
												<Skeleton variant="text" width="90%" height={20} />
												<Skeleton variant="text" width="60%" height={20} />
											</Box>
										</Box>
										<Box sx={{ display: "flex" }}>
											<Skeleton variant="circular" width={18} height={18} sx={{ mr: 1, mt: 0.5 }} />
											<Box sx={{ flex: 1 }}>
												<Skeleton variant="text" width="70%" height={20} />
												<Skeleton variant="text" width="85%" height={20} />
											</Box>
										</Box>
									</Stack>
								</CardContent>
								<Box sx={{ p: 2, pt: 0, display: "flex", justifyContent: "space-between" }}>
									<Stack direction="row" spacing={1}>
										<Skeleton variant="rounded" width={90} height={32} />
										<Skeleton variant="rounded" width={90} height={32} />
									</Stack>
									<Skeleton variant="rounded" width={80} height={32} />
								</Box>
							</Card>
						</Grid>
					))}
				</Grid>
			</MainCard>
		);
	}

	// Solo mostramos la alerta si estamos intentando ver una disponibilidad específica
	// pero no se encontró
	if (isSpecificAvailability && !availability) {
		return (
			<MainCard title="Gestión de Reservas">
				<Alert severity="error">No se encontró la disponibilidad solicitada</Alert>
				<Button variant="outlined" onClick={() => navigate("/apps/calendar/reservations")} sx={{ mt: 2 }}>
					Volver a Todas las Reservas
				</Button>
			</MainCard>
		);
	}

	return (
		<Box>
			<MainCard
				title={isSpecificAvailability && availability ? `Reservas - ${availability.title}` : "Configuración de Citas"}
				secondary={
					<Stack direction="row" spacing={2} alignItems="center">
						{isSpecificAvailability && (
							<Button variant="outlined" onClick={() => navigate("/apps/calendar/reservations")}>
								Ver todas las reservas
							</Button>
						)}
						{hasBookingFeature ? (
							<Button variant="contained" color="primary" onClick={() => navigate("/apps/calendar/booking-config")}>
								Nueva Disponibilidad
							</Button>
						) : (
							<Button variant="contained" color="primary" startIcon={<Lock size={16} />} onClick={() => navigate("/suscripciones/tables")}>
								Nueva Disponibilidad
							</Button>
						)}
					</Stack>
				}
			>
				{!hasBookingFeature && (
					<Alert
						severity="warning"
						icon={<Lock variant="Bulk" size={24} color={theme.palette.warning.main} />}
						sx={{ mb: 3, mt: 1 }}
						action={
							<Button color="warning" size="small" onClick={() => navigate("/suscripciones/tables")}>
								Actualizar Plan
							</Button>
						}
					>
						La gestión de reservas y creación de disponibilidades está limitada a planes superiores. Actualiza tu plan para acceder a esta
						funcionalidad.
					</Alert>
				)}

				<Box sx={{ display: "flex", justifyContent: "flex-end", mb: 2 }}>
					<Tooltip title="Ver Guía">
						<IconButton
							color="success"
							onClick={() => setGuideOpen(true)}
							size="medium"
							sx={{
								zIndex: 10,
								position: "relative",
								bgcolor: "rgba(255, 255, 255, 0.8)",
								"&:hover": { bgcolor: "rgba(255, 255, 255, 0.9)" },
							}}
						>
							<InfoCircle variant="Bulk" />
						</IconButton>
					</Tooltip>
				</Box>

				{/* Mostrar enlace público solo si estamos viendo una disponibilidad específica */}
				{isSpecificAvailability && availability && (
					<Box sx={{ display: "flex", alignItems: "center", mb: 3 }}>
						<Typography variant="subtitle1" sx={{ mr: 2 }}>
							Enlace Público:
						</Typography>
						<TextField
							size="small"
							value={`${window.location.origin}/booking/${availability.publicUrl}`}
							InputProps={{
								readOnly: true,
								endAdornment: (
									<Button
										onClick={() => {
											navigator.clipboard.writeText(`${window.location.origin}/booking/${availability.publicUrl}`);

											dispatch(
												openSnackbar({
													open: true,
													message: "Enlace copiado al portapapeles",
													variant: "alert",
													alert: {
														color: "success",
													},
													close: false,
												}),
											);
										}}
										sx={{ ml: 1 }}
									>
										Copiar
									</Button>
								),
							}}
							sx={{ flexGrow: 1 }}
						/>
					</Box>
				)}

				{!isSpecificAvailability && (
					<Box sx={{ mb: 4 }}>
						<Typography variant="h5" gutterBottom>
							Mis Disponibilidades
						</Typography>

						{availabilities.length > 0 ? (
							<Grid container spacing={3}>
								{Array.isArray(availabilities)
									? availabilities.map((availability) => (
											<Grid item xs={12} sm={6} md={4} key={availability._id}>
												<AvailabilityCard availability={availability} onDelete={handleDeleteAvailabilityClick} />
											</Grid>
									  ))
									: null}
							</Grid>
						) : (
							<Card sx={{ mb: 3 }}>
								<CardContent>
									<Box sx={{ textAlign: "center", py: 3 }}>
										<Calendar size={32} style={{ opacity: 0.5, marginBottom: 16 }} />
										<Typography variant="h6" gutterBottom>
											No tienes disponibilidades configuradas
										</Typography>
										<Typography variant="body2" color="textSecondary" sx={{ mb: 3, maxWidth: 500, mx: "auto" }}>
											Configura tu disponibilidad para que otros puedan agendar citas contigo. Una vez configurada, podrás compartir un
											enlace para recibir reservas.
										</Typography>
										{hasBookingFeature ? (
											<Button variant="contained" color="primary" onClick={() => navigate("/apps/calendar/booking-config")}>
												Crear Nueva Disponibilidad
											</Button>
										) : (
											<Button
												variant="contained"
												color="primary"
												startIcon={<Lock size={16} />}
												onClick={() => navigate("/suscripciones/tables")}
											>
												Crear Nueva Disponibilidad
											</Button>
										)}
									</Box>
								</CardContent>
							</Card>
						)}
					</Box>
				)}

				<Typography variant="h5" gutterBottom>
					{isSpecificAvailability ? "Reservas" : "Todas las Reservas"}
				</Typography>

				<Paper sx={{ mb: 3 }}>
					<Tabs value={filter} onChange={(e, val) => setFilter(val)} sx={{ borderBottom: 1, borderColor: "divider" }}>
						<Tab value="upcoming" label="Próximas" />
						<Tab value="past" label="Pasadas" />
						<Tab value="all" label="Todas" />
					</Tabs>

					<Box sx={{ p: 2, display: "flex", alignItems: "center" }}>
						<Typography variant="subtitle2" sx={{ mr: 2 }}>
							Filtrar por estado:
						</Typography>
						<FormControl size="small" sx={{ width: 200 }}>
							<InputLabel>Estado</InputLabel>
							<Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} label="Estado">
								<MenuItem value="all">Todos</MenuItem>
								<MenuItem value="pending">Pendientes</MenuItem>
								<MenuItem value="confirmed">Confirmadas</MenuItem>
								<MenuItem value="cancelled">Canceladas</MenuItem>
								<MenuItem value="rejected">Rechazadas</MenuItem>
								<MenuItem value="completed">Completadas</MenuItem>
							</Select>
						</FormControl>
					</Box>
				</Paper>

				{filteredBookings.length === 0 ? (
					<Box sx={{ textAlign: "center", py: 4 }}>
						<NoResultsState
							title="No hay reservas"
							description={
								statusFilter !== "all"
									? "No hay reservas con el filtro aplicado"
									: filter === "upcoming"
									? "No hay reservas próximas"
									: filter === "past"
									? "No hay reservas pasadas"
									: "No hay reservas registradas. Crea una disponibilidad para empezar a recibir citas."
							}
						/>
						{!isSpecificAvailability &&
							(hasBookingFeature ? (
								<Button variant="contained" color="primary" onClick={() => navigate("/apps/calendar/booking-config")} sx={{ mt: 3 }}>
									Crear Nueva Disponibilidad
								</Button>
							) : (
								<Button
									variant="contained"
									color="primary"
									startIcon={<Lock size={16} />}
									onClick={() => navigate("/suscripciones/tables")}
									sx={{ mt: 3 }}
								>
									Crear Nueva Disponibilidad
								</Button>
							))}
					</Box>
				) : (
					<Grid container spacing={3}>
						{Array.isArray(filteredBookings)
							? filteredBookings.map((booking) => {
									// Verificar si ya pasó la fecha
									const isPast = booking.startTime ? dayjs().isAfter(dayjs(booking.startTime)) : false;

									return (
										<Grid item xs={12} sm={6} md={4} key={booking._id}>
											{/* Si tenemos información de disponibilidad, mostramos la tarjeta normal */}
											{booking.availability || availability ? (
												<BookingCard
													booking={booking}
													availability={booking.availability || (availability as AvailabilityType)}
													onStatusChange={handleStatusChange}
													onDelete={handleDeleteClick}
													showAvailabilityInfo={!isSpecificAvailability}
												/>
											) : (
												/* Si no tenemos información de disponibilidad, mostramos una versión simplificada */
												<Card
													variant="outlined"
													sx={{
														height: "100%",
														borderLeft: "4px solid",
														borderLeftColor:
															booking.status === "confirmed"
																? "success.main"
																: booking.status === "pending"
																? "warning.main"
																: booking.status === "cancelled" || booking.status === "rejected"
																? "error.main"
																: "info.main",
													}}
												>
													<CardContent>
														<Typography variant="h6" gutterBottom>
															{booking.clientName}
														</Typography>
														<Typography variant="body2">{dayjs(booking.startTime).format("D/M/YYYY - HH:mm")}</Typography>
														<Typography variant="body2" color="text.secondary" gutterBottom>
															{booking.clientEmail}
														</Typography>
														<Box sx={{ mt: 1 }}>
															{booking.status === "confirmed" && <Chip label="Confirmada" size="small" color="success" />}
															{booking.status === "pending" && <Chip label="Pendiente" size="small" color="warning" />}
															{booking.status === "cancelled" && <Chip label="Cancelada" size="small" color="error" />}
															{booking.status === "rejected" && <Chip label="Rechazada" size="small" color="error" />}
															{booking.status === "completed" && <Chip label="Completada" size="small" color="info" />}
														</Box>
													</CardContent>
													{booking.status === "pending" && (
														<Box sx={{ p: 2, pt: 0, display: "flex", gap: 1 }}>
															<Button
																size="small"
																color="success"
																startIcon={<ClipboardTick size={16} />}
																onClick={() => handleStatusChange(booking._id, "confirmed")}
																sx={{ textTransform: "none" }}
															>
																Confirmar
															</Button>
															<Button
																size="small"
																color="error"
																startIcon={<Trash size={16} />}
																onClick={() => handleStatusChange(booking._id, "rejected")}
																sx={{ textTransform: "none" }}
															>
																Rechazar
															</Button>
														</Box>
													)}
													{booking.status === "confirmed" && !isPast && (
														<Box sx={{ p: 2, pt: 0, display: "flex", gap: 1 }}>
															<Button
																size="small"
																color="error"
																startIcon={<Trash size={16} />}
																onClick={() => handleStatusChange(booking._id, "cancelled")}
																sx={{ textTransform: "none" }}
															>
																Cancelar
															</Button>
														</Box>
													)}
													{booking.status === "confirmed" && isPast && (
														<Box sx={{ p: 2, pt: 0, display: "flex", gap: 1 }}>
															<Button
																size="small"
																color="info"
																startIcon={<ClipboardTick size={16} />}
																onClick={() => handleStatusChange(booking._id, "completed")}
																sx={{ textTransform: "none" }}
															>
																Completada
															</Button>
														</Box>
													)}
												</Card>
											)}
										</Grid>
									);
							  })
							: null}
					</Grid>
				)}
			</MainCard>

			{/* Diálogo de confirmación de eliminación */}
			<ResponsiveDialog
				open={deleteDialog}
				onClose={() => {
					if (!loadingAction) {
						setDeleteDialog(false);
						setSelectedBooking(null);
					}
				}}
				aria-labelledby="delete-dialog-title"
			>
				<DialogTitle id="delete-dialog-title">Eliminar reserva</DialogTitle>
				<DialogContent>
					<DialogContentText>
						¿Estás seguro de que quieres eliminar la reserva de <strong>{selectedBooking?.clientName}</strong>? Esta acción no se puede
						deshacer.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => {
							setDeleteDialog(false);
							setSelectedBooking(null);
						}}
						disabled={loadingAction}
					>
						Cancelar
					</Button>
					<LoadingButton onClick={handleDeleteConfirm} color="error" variant="contained" loading={loadingAction}>
						Eliminar
					</LoadingButton>
				</DialogActions>
			</ResponsiveDialog>

			{/* Diálogo para rechazar reserva */}
			<ResponsiveDialog
				open={rejectDialog}
				onClose={() => {
					if (!loadingAction) {
						setRejectDialog(false);
						setRejectReason("");
						setSelectedBooking(null);
					}
				}}
				aria-labelledby="reject-dialog-title"
			>
				<DialogTitle id="reject-dialog-title">Rechazar reserva</DialogTitle>
				<DialogContent>
					<DialogContentText sx={{ mb: 2 }}>
						Estás rechazando la reserva de <strong>{selectedBooking?.clientName}</strong>. Puedes añadir un motivo opcional:
					</DialogContentText>
					<TextField
						autoFocus
						label="Motivo del rechazo"
						multiline
						rows={3}
						value={rejectReason}
						onChange={(e) => setRejectReason(e.target.value)}
						fullWidth
					/>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => {
							setRejectDialog(false);
							setRejectReason("");
							setSelectedBooking(null);
						}}
						disabled={loadingAction}
					>
						Cancelar
					</Button>
					<LoadingButton onClick={handleRejectConfirm} color="error" variant="contained" loading={loadingAction}>
						Rechazar
					</LoadingButton>
				</DialogActions>
			</ResponsiveDialog>

			{/* Diálogo para cancelar reserva */}
			<ResponsiveDialog
				open={cancelDialog}
				onClose={() => {
					if (!loadingAction) {
						setCancelDialog(false);
						setCancelReason("");
						setSelectedBooking(null);
					}
				}}
				aria-labelledby="cancel-dialog-title"
			>
				<DialogTitle id="cancel-dialog-title">Cancelar reserva</DialogTitle>
				<DialogContent>
					<DialogContentText sx={{ mb: 2 }}>
						Estás cancelando la reserva de <strong>{selectedBooking?.clientName}</strong>. Puedes añadir un motivo opcional:
					</DialogContentText>
					<TextField
						autoFocus
						label="Motivo de la cancelación"
						multiline
						rows={3}
						value={cancelReason}
						onChange={(e) => setCancelReason(e.target.value)}
						fullWidth
					/>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => {
							setCancelDialog(false);
							setCancelReason("");
							setSelectedBooking(null);
						}}
						disabled={loadingAction}
					>
						Volver
					</Button>
					<LoadingButton onClick={handleCancelConfirm} color="error" variant="contained" loading={loadingAction}>
						Cancelar Reserva
					</LoadingButton>
				</DialogActions>
			</ResponsiveDialog>

			{/* Diálogo de confirmación de eliminación de disponibilidad */}
			<ResponsiveDialog
				open={deleteAvailabilityDialog}
				onClose={() => {
					if (!loadingAction) {
						setDeleteAvailabilityDialog(false);
						setSelectedAvailabilityId(null);
					}
				}}
				aria-labelledby="delete-availability-dialog-title"
			>
				<DialogTitle id="delete-availability-dialog-title">Eliminar disponibilidad</DialogTitle>
				<DialogContent>
					<DialogContentText>
						¿Estás seguro de que quieres eliminar esta disponibilidad? Esta acción eliminará todas las configuraciones asociadas y no se
						podrá deshacer.
						<Alert severity="info" sx={{ mt: 2 }}>
							Recuerda que no puedes eliminar la disponibilidad si tienes citas pendientes y/o citas confirmadas futuras.
						</Alert>
						<Alert severity="warning" sx={{ mt: 2 }}>
							Las reservas existentes asociadas a esta disponibilidad se mantendrán, pero ya no podrás recibir nuevas reservas con este
							enlace.
						</Alert>
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button
						onClick={() => {
							setDeleteAvailabilityDialog(false);
							setSelectedAvailabilityId(null);
						}}
						disabled={loadingAction}
					>
						Cancelar
					</Button>
					<LoadingButton onClick={handleDeleteAvailabilityConfirm} color="error" variant="contained" loading={loadingAction}>
						Eliminar
					</LoadingButton>
				</DialogActions>
			</ResponsiveDialog>

			{/* Guía para reservas */}
			<GuideBooking open={guideOpen} onClose={() => setGuideOpen(false)} />

			{/* Modal de error de límite del plan */}
			<LimitErrorModal
				open={limitModalOpen}
				onClose={handleCloseLimitModal}
				message="Para gestionar reservas y crear disponibilidades, necesitas actualizar tu plan."
				featureInfo={featureInfo || createFeatureInfo()}
				upgradeRequired={true}
			/>
		</Box>
	);
};

// Componente principal que combina ambos
const SchedulingManagement: React.FC = () => {
	// Siempre mostrar la vista de reservas para la estructura actual
	return <BookingsManagement />;
};

export default SchedulingManagement;

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
import { alpha } from "@mui/material/styles";
import ResponsiveDialog from "components/@extended/ResponsiveDialog";
import { Calendar, ClipboardTick, MoreSquare, Trash, User, Edit2, Link21, Clock, InfoCircle, Lock, Calendar1, Add, Eye } from "iconsax-react";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";
import MainCard from "components/MainCard";
import { LoadingButton } from "@mui/lab";
import dayjs from "utils/dayjs-config";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";
import { GuideBooking } from "components/guides";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import useSubscription from "hooks/useSubscription";
import { useTeam } from "contexts/TeamContext";
import { useEffectiveUser } from "hooks/useEffectiveUser";

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

// ==============================|| BOOKING STATUS PILL ||============================== //
// Pill brand-aware para los 5 estados de reserva. Replica el patrón
// StatusPill de folders con dot color-coded por intención.

const BookingStatusPill: React.FC<{ status: BookingType["status"] }> = ({ status }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const config = (() => {
		switch (status) {
			case "confirmed":
				return { dot: LIVE_GREEN, label: "Confirmada" };
			case "pending":
				return { dot: STALE_AMBER, label: "Pendiente" };
			case "cancelled":
				return { dot: theme.palette.error.main, label: "Cancelada" };
			case "rejected":
				return { dot: theme.palette.error.main, label: "Rechazada" };
			case "completed":
				return { dot: BRAND_BLUE, label: "Completada" };
			default:
				return { dot: theme.palette.text.secondary, label: status as string };
		}
	})();

	return (
		<Box
			sx={{
				display: "inline-flex",
				alignItems: "center",
				gap: 0.625,
				px: 0.875,
				py: 0.375,
				borderRadius: 0.875,
				bgcolor: alpha(config.dot, isDark ? 0.14 : 0.08),
				border: `1px solid ${alpha(config.dot, isDark ? 0.36 : 0.22)}`,
			}}
		>
			<Box aria-hidden sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: config.dot, flexShrink: 0 }} />
			<Typography
				sx={{
					fontSize: "0.7rem",
					fontWeight: 600,
					letterSpacing: "0.01em",
					color: "text.primary",
					lineHeight: 1,
					whiteSpace: "nowrap",
				}}
			>
				{config.label}
			</Typography>
		</Box>
	);
};

// Helper sx para botones brand sober.
const useBrandStyles = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	return {
		isDark,
		theme,
		brandButtonSx: {
			textTransform: "none" as const,
			bgcolor: BRAND_BLUE,
			color: "#fff",
			fontWeight: 600,
			letterSpacing: "-0.005em",
			borderRadius: 1.25,
			boxShadow: "none",
			transition: "background-color 0.15s ease",
			"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
			"&.Mui-disabled": {
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.24 : 0.4),
				color: alpha("#fff", 0.9),
			},
		},
		ghostButtonSx: {
			textTransform: "none" as const,
			color: "text.secondary",
			fontWeight: 500,
			"&:hover": {
				bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.06),
				color: BRAND_BLUE,
			},
		},
		dangerOutlinedButtonSx: {
			textTransform: "none" as const,
			bgcolor: theme.palette.error.main,
			color: "#fff",
			fontWeight: 600,
			borderRadius: 1.25,
			boxShadow: "none",
			"&:hover": { bgcolor: alpha(theme.palette.error.main, 0.88), boxShadow: "none" },
		},
	};
};

// Empty/no-results state brand-aware: atmósfera radial + ícono en círculo brand.
const NoResultsState: React.FC<{
	title: string;
	description: string;
}> = ({ title, description }) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	return (
		<Box
			sx={{
				position: "relative",
				overflow: "hidden",
				width: "100%",
				py: { xs: 4, sm: 5 },
				px: 2,
			}}
		>
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					inset: 0,
					background: `radial-gradient(circle at 50% 40%, ${alpha(BRAND_BLUE, isDark ? 0.12 : 0.07)} 0%, transparent 60%)`,
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>
			<Stack
				spacing={2}
				alignItems="center"
				sx={{ position: "relative", zIndex: 1, maxWidth: 460, mx: "auto", textAlign: "center" }}
			>
				<Box
					sx={{
						display: "inline-flex",
						alignItems: "center",
						px: 1.25,
						py: 0.4,
						borderRadius: 1,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.2)}`,
					}}
				>
					<Typography
						sx={{
							fontSize: "0.68rem",
							fontWeight: 600,
							letterSpacing: "0.14em",
							textTransform: "uppercase",
							color: BRAND_BLUE,
						}}
					>
						Sin reservas
					</Typography>
				</Box>
				<Box
					sx={{
						width: 72,
						height: 72,
						borderRadius: "50%",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
						color: BRAND_BLUE,
					}}
				>
					<Calendar1 size={36} variant="Bulk" />
				</Box>
				<Stack spacing={0.5} alignItems="center">
					<Typography sx={{ fontSize: "1rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary", textWrap: "balance" }}>
						{title}
					</Typography>
					<Typography sx={{ fontSize: "0.85rem", color: "text.secondary", lineHeight: 1.55, maxWidth: 360, textWrap: "pretty" }}>
						{description}
					</Typography>
				</Stack>
			</Stack>
		</Box>
	);
};

// Componente para mostrar un resumen de la disponibilidad
const AvailabilityCard: React.FC<{
	availability: AvailabilityType;
	onDelete: (availabilityId: string) => void;
	canEdit?: boolean;
	canDelete?: boolean;
}> = ({ availability, onDelete, canEdit = true, canDelete = true }) => {
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

	const isDark = theme.palette.mode === "dark";
	const accent = availability.isActive ? LIVE_GREEN : theme.palette.text.secondary;

	const actionIconSx = {
		color: "text.secondary",
		transition: "background-color 0.15s ease, color 0.15s ease",
		"&:hover:not(.Mui-disabled)": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
			color: BRAND_BLUE,
		},
	} as const;
	const destructiveIconSx = {
		color: "text.secondary",
		transition: "background-color 0.15s ease, color 0.15s ease",
		"&:hover:not(.Mui-disabled)": {
			bgcolor: alpha(theme.palette.error.main, isDark ? 0.18 : 0.1),
			color: theme.palette.error.main,
		},
	} as const;

	return (
		<Box
			sx={{
				position: "relative",
				height: "100%",
				borderRadius: 1.5,
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
				bgcolor: theme.palette.background.paper,
				transition: "border-color 0.15s ease, background-color 0.15s ease",
				p: 2,
				"&:hover": {
					borderColor: alpha(BRAND_BLUE, isDark ? 0.42 : 0.28),
				},
			}}
		>
			{/* Status pill ámbar (activa/inactiva) — top-right */}
			<Box sx={{ position: "absolute", top: 12, right: 12 }}>
				<Box
					sx={{
						display: "inline-flex",
						alignItems: "center",
						gap: 0.5,
						px: 0.75,
						py: 0.25,
						borderRadius: 0.75,
						bgcolor: alpha(accent, isDark ? 0.14 : 0.08),
						border: `1px solid ${alpha(accent, isDark ? 0.32 : 0.2)}`,
					}}
				>
					<Box aria-hidden sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: accent, flexShrink: 0 }} />
					<Typography sx={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.04em", color: "text.primary", lineHeight: 1 }}>
						{availability.isActive ? "Activa" : "Inactiva"}
					</Typography>
				</Box>
			</Box>

			<Stack spacing={1.5}>
				{/* Header: ícono brand + título */}
				<Stack direction="row" alignItems="center" spacing={1} sx={{ pr: 8 }}>
					<Box
						sx={{
							width: 32,
							height: 32,
							borderRadius: 1,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
							color: BRAND_BLUE,
							flexShrink: 0,
						}}
					>
						<Calendar size={16} variant="Bulk" />
					</Box>
					<Typography
						sx={{
							fontSize: "0.95rem",
							fontWeight: 600,
							letterSpacing: "-0.01em",
							color: "text.primary",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						{availability.title}
					</Typography>
				</Stack>

				<Stack spacing={1}>
					{/* Duración */}
					<Stack direction="row" spacing={1.25} alignItems="flex-start">
						<Box sx={{ color: "text.secondary", mt: 0.125, flexShrink: 0 }}>
							<Clock size={14} variant="Bulk" />
						</Box>
						<Box sx={{ minWidth: 0 }}>
							<Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "text.secondary", letterSpacing: "0.04em", textTransform: "uppercase" }}>
								Duración
							</Typography>
							<Typography sx={{ fontSize: "0.85rem", color: "text.primary", fontVariantNumeric: "tabular-nums" }}>
								{availability.duration} min
							</Typography>
						</Box>
					</Stack>

					{/* Horarios */}
					<Stack direction="row" spacing={1.25} alignItems="flex-start">
						<Box sx={{ color: "text.secondary", mt: 0.125, flexShrink: 0 }}>
							<Calendar1 size={14} variant="Bulk" />
						</Box>
						<Box sx={{ minWidth: 0 }}>
							<Typography sx={{ fontSize: "0.7rem", fontWeight: 600, color: "text.secondary", letterSpacing: "0.04em", textTransform: "uppercase" }}>
								Horarios
							</Typography>
							<Typography sx={{ fontSize: "0.82rem", color: "text.primary", lineHeight: 1.45 }}>{formatTimeSlots(availability.timeSlots)}</Typography>
						</Box>
					</Stack>

					{/* Enlace */}
					<Stack direction="row" spacing={1.25} alignItems="center">
						<Box sx={{ color: "text.secondary", flexShrink: 0 }}>
							<Link21 size={14} variant="Bulk" />
						</Box>
						<Button
							size="small"
							onClick={handleCopyLink}
							startIcon={<Link21 size={14} variant="Bulk" />}
							sx={{
								textTransform: "none",
								fontSize: "0.78rem",
								fontWeight: 500,
								color: copied ? LIVE_GREEN : BRAND_BLUE,
								px: 0.75,
								py: 0.25,
								"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.1 : 0.06) },
							}}
						>
							{copied ? "¡Copiado!" : "Copiar enlace público"}
						</Button>
					</Stack>
				</Stack>

				{/* Actions */}
				<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.1), mt: 0.5 }} />
				<Stack direction="row" justifyContent="flex-end" spacing={0.5}>
					<Tooltip title={canEdit ? "Editar configuración" : "No tenés permisos para editar"} arrow placement="top">
						<span>
							<IconButton
								size="small"
								sx={actionIconSx}
								onClick={() => navigate(`/apps/calendar/booking-config?id=${availability._id}`)}
								disabled={!canEdit}
							>
								<Edit2 variant="Bulk" size={16} />
							</IconButton>
						</span>
					</Tooltip>
					<Tooltip title={canDelete ? "Eliminar configuración" : "No tenés permisos para eliminar"} arrow placement="top">
						<span>
							<IconButton size="small" sx={destructiveIconSx} onClick={() => onDelete(availability._id)} disabled={!canDelete}>
								<Trash variant="Bulk" size={16} />
							</IconButton>
						</span>
					</Tooltip>
				</Stack>
			</Stack>
		</Box>
	);
};

// Componente para la tarjeta de reserva
const BookingCard: React.FC<{
	booking: BookingType;
	availability: AvailabilityType;
	onStatusChange: (bookingId: string, newStatus: BookingType["status"]) => void;
	onDelete: (booking: BookingType) => void;
	showAvailabilityInfo?: boolean;
	canUpdate?: boolean;
	canDelete?: boolean;
}> = ({ booking, availability, onStatusChange, onDelete, showAvailabilityInfo = false, canUpdate = true, canDelete = true }) => {
	const theme = useTheme();
	const [expanded, setExpanded] = useState(false);
	const [anchorEl, setAnchorEl] = useState<HTMLElement | null>(null);
	const open = Boolean(anchorEl);

	// Obtener acceso a las características de suscripción utilizando el hook
	const { hasFeatureLocal } = useSubscription();
	const hasBookingFeature = hasFeatureLocal("booking");

	// Combined check: has feature AND has permission
	const canPerformUpdate = hasBookingFeature && canUpdate;
	const canPerformDelete = hasBookingFeature && canDelete;

	// Determinar pill según estado — usa el BookingStatusPill brand-aware.
	const getStatusChip = (status: BookingType["status"]) => <BookingStatusPill status={status} />;

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

	const isDark = theme.palette.mode === "dark";

	// Status accent — usado en el dot del top-right pill y en algún botón contextual.
	const accent = (() => {
		switch (booking.status) {
			case "confirmed":
				return LIVE_GREEN;
			case "pending":
				return STALE_AMBER;
			case "cancelled":
			case "rejected":
				return theme.palette.error.main;
			case "completed":
				return BRAND_BLUE;
			default:
				return theme.palette.text.secondary;
		}
	})();

	const actionIconSx = {
		color: "text.secondary",
		transition: "background-color 0.15s ease, color 0.15s ease",
		"&:hover:not(.Mui-disabled)": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
			color: BRAND_BLUE,
		},
	} as const;
	const destructiveIconSx = {
		color: "text.secondary",
		transition: "background-color 0.15s ease, color 0.15s ease",
		"&:hover:not(.Mui-disabled)": {
			bgcolor: alpha(theme.palette.error.main, isDark ? 0.18 : 0.1),
			color: theme.palette.error.main,
		},
	} as const;
	const successIconSx = {
		color: "text.secondary",
		transition: "background-color 0.15s ease, color 0.15s ease",
		"&:hover:not(.Mui-disabled)": {
			bgcolor: alpha(LIVE_GREEN, isDark ? 0.18 : 0.1),
			color: LIVE_GREEN,
		},
	} as const;

	// Mismo patrón estructural que AvailabilityCard: Box con border brand,
	// status pill top-right, header con ícono en círculo brand + título,
	// info blocks compactos, hairline divider, actions row al pie.
	return (
		<Box
			sx={{
				position: "relative",
				height: "100%",
				borderRadius: 1.5,
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
				bgcolor: theme.palette.background.paper,
				transition: "border-color 0.15s ease",
				p: 1.5,
				"&:hover": { borderColor: alpha(BRAND_BLUE, isDark ? 0.42 : 0.28) },
			}}
		>
			{/* Status pills top-right (status + opcional HOY) */}
			<Stack direction="row" spacing={0.5} sx={{ position: "absolute", top: 12, right: 12 }}>
				{isBookingToday && (
					<Box
						sx={{
							display: "inline-flex",
							alignItems: "center",
							gap: 0.5,
							px: 0.75,
							py: 0.25,
							borderRadius: 0.75,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.2)}`,
						}}
					>
						<Box aria-hidden sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: BRAND_BLUE, flexShrink: 0 }} />
						<Typography sx={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.04em", color: BRAND_BLUE, lineHeight: 1 }}>
							HOY
						</Typography>
					</Box>
				)}
				{getStatusChip(booking.status)}
			</Stack>

			<Stack spacing={1.25}>
				{/* Header: ícono en círculo brand + clientName (pr para no chocar con las pills top-right) */}
				<Stack direction="row" alignItems="center" spacing={1} sx={{ pr: isBookingToday ? 14 : 9 }}>
					<Box
						sx={{
							width: 28,
							height: 28,
							borderRadius: 0.875,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
							color: BRAND_BLUE,
							flexShrink: 0,
						}}
					>
						<User size={14} variant="Bulk" />
					</Box>
					<Typography
						sx={{
							fontSize: "0.88rem",
							fontWeight: 600,
							letterSpacing: "-0.01em",
							color: "text.primary",
							overflow: "hidden",
							textOverflow: "ellipsis",
							whiteSpace: "nowrap",
						}}
					>
						{booking.clientName}
					</Typography>
				</Stack>

				{/* Info blocks — mismo patrón que AvailabilityCard (icono + eyebrow uppercase + value) */}
				<Stack spacing={0.875}>
					{/* Fecha + hora */}
					<Stack direction="row" spacing={1.25} alignItems="flex-start">
						<Box sx={{ color: "text.secondary", flexShrink: 0, mt: 0.125 }}>
							<Calendar1 size={14} variant="Bulk" />
						</Box>
						<Box sx={{ minWidth: 0 }}>
							<Typography
								sx={{
									fontSize: "0.62rem",
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "text.secondary",
									lineHeight: 1.2,
								}}
							>
								Fecha y hora
							</Typography>
							<Typography
								sx={{
									fontSize: "0.78rem",
									fontWeight: 500,
									color: "text.primary",
									textTransform: "capitalize",
									lineHeight: 1.35,
								}}
							>
								{dayjs(booking.startTime).format("D MMM YYYY")}
								<Box component="span" sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums", ml: 0.625 }}>
									· {dayjs(booking.startTime).format("HH:mm")}–{dayjs(booking.endTime).format("HH:mm")}
								</Box>
							</Typography>
						</Box>
					</Stack>

					{/* Contacto */}
					<Stack direction="row" spacing={1.25} alignItems="flex-start">
						<Box sx={{ color: "text.secondary", flexShrink: 0, mt: 0.125 }}>
							<User size={14} variant="Bulk" />
						</Box>
						<Box sx={{ minWidth: 0 }}>
							<Typography
								sx={{
									fontSize: "0.62rem",
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "text.secondary",
									lineHeight: 1.2,
								}}
							>
								Contacto
							</Typography>
							<Typography
								sx={{
									fontSize: "0.78rem",
									color: "text.primary",
									overflow: "hidden",
									textOverflow: "ellipsis",
									whiteSpace: "nowrap",
									lineHeight: 1.35,
								}}
							>
								{booking.clientEmail}
							</Typography>
							{booking.clientPhone && (
								<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
									{booking.clientPhone}
								</Typography>
							)}
						</Box>
					</Stack>

					{/* Tipo de cita */}
					{showAvailabilityInfo && availability && (
						<Stack direction="row" spacing={1.25} alignItems="flex-start">
							<Box sx={{ color: "text.secondary", flexShrink: 0, mt: 0.125 }}>
								<Clock size={14} variant="Bulk" />
							</Box>
							<Box sx={{ minWidth: 0 }}>
								<Typography
									sx={{
										fontSize: "0.62rem",
										fontWeight: 600,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: "text.secondary",
										lineHeight: 1.2,
									}}
								>
									Tipo
								</Typography>
								<Typography
									sx={{
										fontSize: "0.78rem",
										color: "text.primary",
										overflow: "hidden",
										textOverflow: "ellipsis",
										whiteSpace: "nowrap",
										lineHeight: 1.35,
									}}
								>
									{availability.title || "Sin tipo"}
								</Typography>
							</Box>
						</Stack>
					)}
				</Stack>

				{/* Sección expandible — notas / dirección / customFields / cancelación */}
				{expanded && (booking.notes || booking.clientAddress || (booking.customFields && booking.customFields.length > 0) || booking.cancelledBy) && (
					<Stack spacing={1} sx={{ pt: 1, borderTop: `1px dashed ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}` }}>
						{booking.notes && (
							<Box>
								<Typography
									sx={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}
								>
									Notas
								</Typography>
								<Typography sx={{ fontSize: "0.74rem", color: "text.primary", lineHeight: 1.45 }}>{booking.notes}</Typography>
							</Box>
						)}
						{booking.clientAddress && (
							<Box>
								<Typography
									sx={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}
								>
									Dirección
								</Typography>
								<Typography sx={{ fontSize: "0.74rem", color: "text.primary", lineHeight: 1.45 }}>{booking.clientAddress}</Typography>
							</Box>
						)}
						{booking.customFields && booking.customFields.length > 0 && (
							<Stack spacing={0.5}>
								<Typography
									sx={{ fontSize: "0.62rem", fontWeight: 600, letterSpacing: "0.08em", textTransform: "uppercase", color: "text.secondary" }}
								>
									Campos personalizados
								</Typography>
								{booking.customFields.map((field, index) => (
									<Box key={index}>
										<Typography sx={{ fontSize: "0.7rem", color: "text.secondary" }}>{field.name}</Typography>
										<Typography sx={{ fontSize: "0.74rem", color: "text.primary" }}>{field.value.toString()}</Typography>
									</Box>
								))}
							</Stack>
						)}
						{booking.cancelledBy && (
							<Box>
								<Typography
									sx={{
										fontSize: "0.62rem",
										fontWeight: 600,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: theme.palette.error.main,
									}}
								>
									Cancelada por {booking.cancelledBy === "host" ? "el anfitrión" : "el cliente"}
								</Typography>
								{booking.cancellationReason && (
									<Typography sx={{ fontSize: "0.74rem", color: "text.secondary", lineHeight: 1.45 }}>{booking.cancellationReason}</Typography>
								)}
							</Box>
						)}
					</Stack>
				)}

				{/* Hairline divider — alineado con AvailabilityCard */}
				<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.1) }} />

				{/* Actions row — icon buttons monocromos con intent hover (mismo patrón que AvailabilityCard).
				    Tooltips comunican la acción; los iconos quedan compactos. */}
				<Stack direction="row" alignItems="center" justifyContent="space-between">
					<Stack direction="row" spacing={0.25}>
						{/* Expand toggle a la izquierda */}
						<Tooltip title={expanded ? "Ver menos" : "Ver más"} arrow placement="top">
							<IconButton size="small" sx={actionIconSx} onClick={() => setExpanded(!expanded)}>
								{expanded ? <Add size={16} style={{ transform: "rotate(45deg)" }} /> : <Eye size={16} variant="Bulk" />}
							</IconButton>
						</Tooltip>
					</Stack>

					<Stack direction="row" spacing={0.25}>
						{/* Acciones contextuales según estado — icon buttons brand consistentes */}
						{booking.status === "pending" && (
							<>
								<Tooltip title="Confirmar reserva" arrow placement="top">
									<span>
										<IconButton
											size="small"
											sx={successIconSx}
											onClick={() => onStatusChange(booking._id, "confirmed")}
											disabled={!hasBookingFeature}
										>
											<ClipboardTick size={16} variant="Bulk" />
										</IconButton>
									</span>
								</Tooltip>
								<Tooltip title="Rechazar reserva" arrow placement="top">
									<span>
										<IconButton
											size="small"
											sx={destructiveIconSx}
											onClick={() => onStatusChange(booking._id, "rejected")}
											disabled={!hasBookingFeature}
										>
											<Trash size={16} variant="Bulk" />
										</IconButton>
									</span>
								</Tooltip>
							</>
						)}
						{booking.status === "confirmed" && !isPast && (
							<Tooltip title="Cancelar reserva" arrow placement="top">
								<span>
									<IconButton
										size="small"
										sx={destructiveIconSx}
										onClick={() => onStatusChange(booking._id, "cancelled")}
										disabled={!hasBookingFeature}
									>
										<Trash size={16} variant="Bulk" />
									</IconButton>
								</span>
							</Tooltip>
						)}
						{booking.status === "confirmed" && isPast && (
							<Tooltip title="Marcar como completada" arrow placement="top">
								<span>
									<IconButton
										size="small"
										sx={actionIconSx}
										onClick={() => onStatusChange(booking._id, "completed")}
										disabled={!hasBookingFeature}
									>
										<ClipboardTick size={16} variant="Bulk" />
									</IconButton>
								</span>
							</Tooltip>
						)}

						{/* Overflow menu — mismo patrón que folders/contacts */}
						<Tooltip
							title={
								!hasBookingFeature
									? "Función no disponible en tu plan"
									: !canUpdate && !canDelete
									? "No tenés permisos para realizar acciones"
									: "Más acciones"
							}
							arrow
							placement="top"
						>
							<span>
								<IconButton
									size="small"
									onClick={handleClick}
									aria-controls={open ? "booking-menu" : undefined}
									aria-haspopup="true"
									aria-expanded={open ? "true" : undefined}
									disabled={!hasBookingFeature || (!canUpdate && !canDelete)}
									sx={actionIconSx}
								>
									<MoreSquare size={16} variant="Bulk" />
								</IconButton>
							</span>
						</Tooltip>
						<Menu
							id="booking-menu"
							anchorEl={anchorEl}
							open={open}
							onClose={handleClose}
							MenuListProps={{ "aria-labelledby": "booking-button" }}
							slotProps={{ paper: { sx: { minWidth: 200 } } }}
						>
							{booking.status === "confirmed" && isPast && (
								<MenuItem
									onClick={() => {
										handleClose();
										onStatusChange(booking._id, "completed");
									}}
									disabled={!canPerformUpdate}
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
								disabled={!canPerformDelete}
							>
								<Trash size={16} style={{ marginRight: 8 }} />
								Eliminar
							</MenuItem>
						</Menu>
					</Stack>
				</Stack>
			</Stack>
		</Box>
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
	// Tab activa al top: "reservas" (default) o "disponibilidades". Separa los flujos
	// para que no haya scroll forzado cuando hay muchas reservas + muchas disponibilidades.
	const [section, setSection] = useState<"reservas" | "disponibilidades">("reservas");

	// Paginación de bookings — 12 por página (3 filas × 4 cards en desktop lg+).
	// Cards más compactas → caben más sin scroll forzado.
	const [bookingsPage, setBookingsPage] = useState(1);
	const BOOKINGS_PER_PAGE = 12;
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

	// Determinar si estamos viendo una disponibilidad específica o todas las reservas
	const urlParts = window.location.pathname.split("/");
	const availabilityId = urlParts[urlParts.length - 1];
	const isSpecificAvailability = availabilityId && availabilityId !== "reservations";

	// Obtener acceso a las características de suscripción utilizando el hook
	const { subscription, hasFeatureLocal } = useSubscription();

	// Get team context to wait for full initialization before checking features
	// isReady is true when: initialized AND (no teams OR activeTeam selected)
	// Also get permission flags for role-based UI controls
	const { isReady: isTeamReady, canCreate, canUpdate, canDelete, isTeamMode } = useTeam();

	// Get effective user and request headers for team-aware data fetching
	const { requestHeaders, isReady: isEffectiveUserReady } = useEffectiveUser();

	// Combined permission check: has feature AND has role permission (or not in team mode)
	const canCreateAvailability = hasBookingFeature && (!isTeamMode || canCreate);
	const canEditAvailability = hasBookingFeature && (!isTeamMode || canUpdate);
	const canDeleteAvailability = hasBookingFeature && (!isTeamMode || canDelete);

	// Función para crear el objeto featureInfo de forma estándar
	const createFeatureInfo = () => ({
		feature: "Gestión de Reservas",
		plan: subscription?.plan || "free",
		availableIn: ["standard", "premium"],
	});

	// Verificar si el usuario tiene acceso a la característica de reservas
	useEffect(() => {
		// Esperar a que el contexto de equipos esté completamente listo
		// isTeamReady es true cuando: inicializado Y (sin equipos O equipo activo seleccionado)
		// Esto es importante para miembros de equipos que heredan features del owner
		if (!isTeamReady) return;

		// Verificar si tiene la característica de booking usando el hook
		// hasFeatureLocal ya considera si el usuario es miembro de un equipo
		// y hereda features del owner
		const hasBookingAccess = hasFeatureLocal("booking");

		setHasBookingFeature(hasBookingAccess || false);

		if (!hasBookingAccess) {
			setFeatureInfo(createFeatureInfo());
		}
	}, [subscription, isTeamReady]);

	// Manejar cierre del modal
	const handleCloseLimitModal = () => {
		setLimitModalOpen(false);
	};

	// Abrir modal de upgrade solo cuando el usuario intenta crear una nueva disponibilidad
	const handleNewAvailabilityLockedClick = () => {
		setFeatureInfo(createFeatureInfo());
		setLimitModalOpen(true);
	};

	// Función para cargar datos - convertida a callback para reutilizar
	// Includes requestHeaders for team context (X-Group-Id when in team mode)
	const fetchData = useCallback(async () => {
		// Wait for team context to be ready before fetching
		if (!isEffectiveUserReady) return;

		try {
			setLoading(true);
			// Si estamos viendo una disponibilidad específica
			if (isSpecificAvailability) {
				// Cargar disponibilidad - include team headers
				const availabilityResponse = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/booking/availability/${availabilityId}`, {
					headers: requestHeaders,
				});

				setAvailability(availabilityResponse.data);

				// Cargar reservas para esta disponibilidad específica - include team headers
				const bookingsResponse = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/booking/availability/${availabilityId}/bookings`, {
					headers: requestHeaders,
				});

				// Asegurar que siempre sea un array
				const bookingsData = Array.isArray(bookingsResponse.data) ? bookingsResponse.data : [];
				setBookings(bookingsData);
			} else {
				// Cargar todas las reservas del usuario - include team headers
				const bookingsResponse = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/booking/bookings`, { headers: requestHeaders });

				// Asegurar que siempre sea un array
				const bookingsData = Array.isArray(bookingsResponse.data) ? bookingsResponse.data : [];
				setBookings(bookingsData);

				// Cargar todas las disponibilidades cuando estamos en la vista general - include team headers
				const availabilitiesResponse = await axios.get(`${import.meta.env.VITE_BASE_URL}/api/booking/availability`, {
					headers: requestHeaders,
				});

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
	}, [availabilityId, isSpecificAvailability, isEffectiveUserReady, requestHeaders]);

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

	// Paginación: bookings visibles en la página actual + número total de páginas
	const totalBookingsPages = Math.max(1, Math.ceil(filteredBookings.length / BOOKINGS_PER_PAGE));
	const paginatedBookings = filteredBookings.slice((bookingsPage - 1) * BOOKINGS_PER_PAGE, bookingsPage * BOOKINGS_PER_PAGE);

	// Reset a página 1 cuando cambian los filtros o la cantidad total
	useEffect(() => {
		setBookingsPage(1);
	}, [filter, statusFilter, filteredBookings.length]);

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

			const response = await axios.patch(`${import.meta.env.VITE_BASE_URL}/api/booking/bookings/${bookingId}/status`, payload, {
				headers: requestHeaders,
			});

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

				const response = await axios.patch(`${import.meta.env.VITE_BASE_URL}/api/booking/bookings/${selectedBooking._id}/status`, payload, {
					headers: requestHeaders,
				});

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

				const response = await axios.patch(`${import.meta.env.VITE_BASE_URL}/api/booking/bookings/${selectedBooking._id}/status`, payload, {
					headers: requestHeaders,
				});

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

			await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/booking/bookings/${selectedBooking._id}`, { headers: requestHeaders });

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

			await axios.delete(`${import.meta.env.VITE_BASE_URL}/api/booking/availability/${selectedAvailabilityId}`, {
				headers: requestHeaders,
			});

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

	const isDarkMode = theme.palette.mode === "dark";

	// Botón "Nueva disponibilidad" reusable.
	const newAvailabilityButton = canCreateAvailability ? (
		<Button
			variant="contained"
			onClick={() => navigate("/apps/calendar/booking-config")}
			sx={{
				textTransform: "none",
				bgcolor: BRAND_BLUE,
				color: "#fff",
				fontWeight: 600,
				letterSpacing: "-0.005em",
				borderRadius: 1.25,
				boxShadow: "none",
				"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
			}}
		>
			Nueva disponibilidad
		</Button>
	) : (
		<Tooltip
			title={!hasBookingFeature ? "Función disponible en planes superiores" : "No tenés permisos para crear disponibilidades"}
			arrow
			placement="top"
		>
			<span>
				<Button
					variant="contained"
					startIcon={<Lock size={16} />}
					onClick={!hasBookingFeature ? handleNewAvailabilityLockedClick : undefined}
					disabled={hasBookingFeature}
					sx={{
						textTransform: "none",
						bgcolor: BRAND_BLUE,
						color: "#fff",
						fontWeight: 600,
						letterSpacing: "-0.005em",
						borderRadius: 1.25,
						boxShadow: "none",
						"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
						"&.Mui-disabled": {
							bgcolor: alpha(BRAND_BLUE, isDarkMode ? 0.24 : 0.4),
							color: alpha("#fff", 0.9),
						},
					}}
				>
					Nueva disponibilidad
				</Button>
			</span>
		</Tooltip>
	);

	return (
		<Stack spacing={{ xs: 1, sm: 2.5 }}>
			{/* ── HEADER DE SECCIÓN brand-aware ───────────────────────────────── */}
			<Box
				sx={{
					position: "relative",
					overflow: "hidden",
					bgcolor: theme.palette.background.paper,
					border: `1px solid ${alpha(BRAND_BLUE, isDarkMode ? 0.18 : 0.12)}`,
					boxShadow: `0 4px 18px ${alpha(BRAND_BLUE, isDarkMode ? 0.16 : 0.08)}`,
					borderRadius: 1.5,
					px: { xs: 1.5, sm: 2.5 },
					py: { xs: 1.25, sm: 1.75 },
				}}
			>
				<Box
					aria-hidden
					sx={{
						display: { xs: "none", md: "block" },
						position: "absolute",
						top: "-80%",
						right: "-10%",
						width: 280,
						height: 280,
						borderRadius: "50%",
						background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDarkMode ? 0.15 : 0.09)} 0%, transparent 65%)`,
						filter: "blur(50px)",
						pointerEvents: "none",
						zIndex: 0,
					}}
				/>
				<Box
					aria-hidden
					sx={{
						display: { xs: "none", md: "block" },
						position: "absolute",
						inset: 0,
						backgroundImage: `radial-gradient(${alpha(theme.palette.text.primary, isDarkMode ? 0.06 : 0.04)} 1px, transparent 1px)`,
						backgroundSize: "22px 22px",
						maskImage: "radial-gradient(ellipse 50% 100% at 90% 50%, #000 0%, transparent 70%)",
						WebkitMaskImage: "radial-gradient(ellipse 50% 100% at 90% 50%, #000 0%, transparent 70%)",
						pointerEvents: "none",
						zIndex: 0,
					}}
				/>

				<Stack
					direction={{ xs: "column", md: "row" }}
					alignItems={{ xs: "flex-start", md: "center" }}
					justifyContent="space-between"
					spacing={{ xs: 1.5, md: 2 }}
					sx={{ position: "relative", zIndex: 1 }}
				>
					{/* Eyebrow + descripción (oculta en mobile para ahorrar altura) */}
					<Stack
						direction="row"
						alignItems="center"
						spacing={1.5}
						sx={{ flex: { md: 1 }, minWidth: 0, display: { xs: "none", md: "flex" } }}
					>
						<Box
							sx={{
								display: "inline-flex",
								alignItems: "center",
								px: 1.25,
								py: 0.4,
								borderRadius: 1,
								bgcolor: alpha(BRAND_BLUE, isDarkMode ? 0.16 : 0.08),
								border: `1px solid ${alpha(BRAND_BLUE, isDarkMode ? 0.32 : 0.2)}`,
								flexShrink: 0,
							}}
						>
							<Typography
								sx={{
									fontSize: "0.68rem",
									fontWeight: 600,
									letterSpacing: "0.14em",
									textTransform: "uppercase",
									color: BRAND_BLUE,
									fontVariantNumeric: "tabular-nums",
								}}
							>
								{isSpecificAvailability ? "Reservas" : "Configuración de citas"}
							</Typography>
						</Box>
						<Typography sx={{ fontSize: "0.875rem", color: "text.secondary", lineHeight: 1.5, textWrap: "pretty" }}>
							{isSpecificAvailability && availability
								? `Reservas vinculadas a ${availability.title}.`
								: "Gestioná tus disponibilidades y las reservas que recibís a través de tus enlaces públicos."}
						</Typography>
					</Stack>

					{/* Actions: Ver todas + Nueva disponibilidad + Guía */}
					<Stack direction="row" spacing={1} alignItems="center" sx={{ flexShrink: 0 }}>
						{isSpecificAvailability && (
							<Button
								onClick={() => navigate("/apps/calendar/reservations")}
								sx={{
									textTransform: "none",
									color: "text.secondary",
									fontWeight: 500,
									"&:hover": { bgcolor: alpha(BRAND_BLUE, isDarkMode ? 0.1 : 0.06), color: BRAND_BLUE },
								}}
							>
								Ver todas
							</Button>
						)}
						{newAvailabilityButton}
						<Tooltip title="Ver guía" arrow placement="top">
							<IconButton
								onClick={() => setGuideOpen(true)}
								size="small"
								sx={{
									color: "text.secondary",
									transition: "background-color 0.15s ease, color 0.15s ease",
									"&:hover": { bgcolor: alpha(BRAND_BLUE, isDarkMode ? 0.14 : 0.08), color: BRAND_BLUE },
								}}
							>
								<InfoCircle variant="Bulk" size={20} />
							</IconButton>
						</Tooltip>
					</Stack>
				</Stack>
			</Box>

			{/* ── ALERTS (cuando aplican) ─────────────────────────────────────── */}
			{!hasBookingFeature && (
				<Alert
					severity="info"
					sx={{ mb: 0 }}
					action={
						<Button color="info" size="small" onClick={() => navigate("/suscripciones/tables")}>
							Ver planes
						</Button>
					}
				>
					Tu plan no incluye gestión de reservas nuevas. Podés ver las existentes o actualizar tu plan.
				</Alert>
			)}

			{hasBookingFeature && isTeamMode && !canCreate && (
				<Alert severity="info" icon={<InfoCircle variant="Bulk" size={24} color={theme.palette.info.main} />} sx={{ mb: 0 }}>
					Estás viendo las reservas del equipo en modo lectura. Contactá al administrador si necesitás permisos para crear o modificar
					disponibilidades.
				</Alert>
			)}

			{/* ── MAIN CARD: Tabs top-level + contenido ───────────────────────── */}
			<MainCard content={false}>
				{/* Tabs separan los flujos (Reservas / Disponibilidades) — corta el scroll
				    que aparecía cuando ambas secciones estaban apiladas verticalmente. */}
				{!isSpecificAvailability && (
					<Box
						sx={{
							borderBottom: `1px solid ${alpha(BRAND_BLUE, isDarkMode ? 0.18 : 0.12)}`,
							display: "flex",
							alignItems: "center",
							justifyContent: "space-between",
							px: { xs: 2, sm: 3 },
						}}
					>
						<Tabs
							value={section}
							onChange={(_, val) => setSection(val)}
							sx={{
								minHeight: 44,
								"& .MuiTabs-indicator": { height: 2.5, borderRadius: 1, bgcolor: BRAND_BLUE },
								"& .MuiTab-root": {
									textTransform: "none",
									fontWeight: 500,
									fontSize: "0.875rem",
									letterSpacing: "-0.005em",
									minHeight: 44,
									color: "text.secondary",
									transition: "color 0.15s ease",
									"&:hover": { color: BRAND_BLUE },
									"&.Mui-selected": { color: BRAND_BLUE, fontWeight: 600 },
								},
								"& .MuiTab-iconWrapper": { marginRight: 0.75 },
							}}
						>
							<Tab value="reservas" label="Reservas" icon={<Calendar1 size={18} variant="Bulk" />} iconPosition="start" />
							<Tab
								value="disponibilidades"
								label={
									<Stack direction="row" alignItems="center" spacing={0.625}>
										<span>Disponibilidades</span>
										{availabilities.length > 0 && (
											<Box
												sx={{
													display: "inline-flex",
													alignItems: "center",
													justifyContent: "center",
													minWidth: 20,
													height: 18,
													px: 0.5,
													borderRadius: 0.625,
													bgcolor: alpha(BRAND_BLUE, isDarkMode ? 0.18 : 0.1),
													border: `1px solid ${alpha(BRAND_BLUE, isDarkMode ? 0.32 : 0.2)}`,
												}}
											>
												<Typography
													sx={{
														fontSize: "0.65rem",
														fontWeight: 600,
														color: BRAND_BLUE,
														fontVariantNumeric: "tabular-nums",
														lineHeight: 1,
													}}
												>
													{availabilities.length}
												</Typography>
											</Box>
										)}
									</Stack>
								}
								icon={<Clock size={18} variant="Bulk" />}
								iconPosition="start"
							/>
						</Tabs>
					</Box>
				)}

				{/* Mostrar enlace público solo si estamos viendo una disponibilidad específica */}
				{isSpecificAvailability && availability && (
					<Box sx={{ p: { xs: 2, sm: 3 }, pb: 0 }}>
						<Stack direction="row" alignItems="center" spacing={1.5}>
							<Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "text.secondary", letterSpacing: "-0.005em", flexShrink: 0 }}>
								Enlace público:
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
														alert: { color: "success" },
														close: false,
													}),
												);
											}}
											sx={{
												ml: 1,
												textTransform: "none",
												color: BRAND_BLUE,
												fontWeight: 600,
												fontSize: "0.78rem",
												"&:hover": { bgcolor: alpha(BRAND_BLUE, isDarkMode ? 0.12 : 0.06) },
											}}
										>
											Copiar
										</Button>
									),
								}}
								sx={{
									flexGrow: 1,
									"& .MuiOutlinedInput-notchedOutline": {
										borderColor: alpha(BRAND_BLUE, isDarkMode ? 0.26 : 0.16),
									},
									"& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
										borderColor: alpha(BRAND_BLUE, isDarkMode ? 0.46 : 0.32),
									},
									"& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
										borderColor: alpha(BRAND_BLUE, 0.55),
									},
								}}
							/>
						</Stack>
					</Box>
				)}

				{/* ── TAB: DISPONIBILIDADES ──────────────────────────────────────── */}
				{!isSpecificAvailability && section === "disponibilidades" && (
					<Box sx={{ p: { xs: 2, sm: 3 } }}>
						{availabilities.length > 0 ? (
							<Grid container spacing={3}>
								{Array.isArray(availabilities)
									? availabilities.map((availability) => (
											<Grid item xs={12} sm={6} md={4} key={availability._id}>
												<AvailabilityCard
													availability={availability}
													onDelete={handleDeleteAvailabilityClick}
													canEdit={canEditAvailability}
													canDelete={canDeleteAvailability}
												/>
											</Grid>
									  ))
									: null}
							</Grid>
						) : (
							<Box
								sx={{
									position: "relative",
									overflow: "hidden",
									width: "100%",
									py: { xs: 4, sm: 5 },
									px: 2,
								}}
							>
								<Box
									aria-hidden
									sx={{
										position: "absolute",
										inset: 0,
										background: `radial-gradient(circle at 50% 40%, ${alpha(BRAND_BLUE, isDarkMode ? 0.12 : 0.07)} 0%, transparent 60%)`,
										pointerEvents: "none",
										zIndex: 0,
									}}
								/>
								<Stack
									spacing={2}
									alignItems="center"
									sx={{ position: "relative", zIndex: 1, maxWidth: 480, mx: "auto", textAlign: "center" }}
								>
									<Box
										sx={{
											display: "inline-flex",
											alignItems: "center",
											px: 1.25,
											py: 0.4,
											borderRadius: 1,
											bgcolor: alpha(BRAND_BLUE, isDarkMode ? 0.16 : 0.08),
											border: `1px solid ${alpha(BRAND_BLUE, isDarkMode ? 0.32 : 0.2)}`,
										}}
									>
										<Typography
											sx={{
												fontSize: "0.68rem",
												fontWeight: 600,
												letterSpacing: "0.14em",
												textTransform: "uppercase",
												color: BRAND_BLUE,
											}}
										>
											Sin disponibilidades
										</Typography>
									</Box>
									<Box
										sx={{
											width: 80,
											height: 80,
											borderRadius: "50%",
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											bgcolor: alpha(BRAND_BLUE, isDarkMode ? 0.14 : 0.08),
											color: BRAND_BLUE,
										}}
									>
										<Calendar size={40} variant="Bulk" />
									</Box>
									<Stack spacing={0.75} alignItems="center">
										<Typography
											sx={{
												fontSize: "1.125rem",
												fontWeight: 600,
												letterSpacing: "-0.015em",
												color: "text.primary",
												textWrap: "balance",
											}}
										>
											Todavía no hay disponibilidades configuradas
										</Typography>
										<Typography
											sx={{
												fontSize: "0.875rem",
												color: "text.secondary",
												lineHeight: 1.55,
												maxWidth: 420,
												textWrap: "pretty",
											}}
										>
											Configurá tu disponibilidad horaria para que otros agenden citas. Vas a poder compartir el enlace público apenas la creés.
										</Typography>
									</Stack>
									{canCreateAvailability ? (
										<Button
											variant="contained"
											onClick={() => navigate("/apps/calendar/booking-config")}
											sx={{
												mt: 0.5,
												textTransform: "none",
												bgcolor: BRAND_BLUE,
												color: "#fff",
												fontWeight: 600,
												letterSpacing: "-0.005em",
												borderRadius: 1.25,
												px: 2.25,
												boxShadow: `0 4px 12px ${alpha(BRAND_BLUE, 0.22)}`,
												"&:hover": {
													bgcolor: alpha(BRAND_BLUE, 0.88),
													boxShadow: `0 6px 16px ${alpha(BRAND_BLUE, 0.28)}`,
												},
											}}
										>
											Crear nueva disponibilidad
										</Button>
									) : (
										<Tooltip
											title={
												!hasBookingFeature ? "Función disponible en planes superiores" : "No tenés permisos para crear disponibilidades"
											}
											arrow
											placement="top"
										>
											<span>
												<Button
													variant="contained"
													startIcon={<Lock size={16} />}
													onClick={!hasBookingFeature ? handleNewAvailabilityLockedClick : undefined}
													disabled={hasBookingFeature}
													sx={{
														mt: 0.5,
														textTransform: "none",
														bgcolor: BRAND_BLUE,
														color: "#fff",
														fontWeight: 600,
														letterSpacing: "-0.005em",
														borderRadius: 1.25,
														px: 2.25,
														boxShadow: "none",
														"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
														"&.Mui-disabled": {
															bgcolor: alpha(BRAND_BLUE, isDarkMode ? 0.24 : 0.4),
															color: alpha("#fff", 0.9),
														},
													}}
												>
													Crear nueva disponibilidad
												</Button>
											</span>
										</Tooltip>
									)}
								</Stack>
							</Box>
						)}
					</Box>
				)}

				{/* ── TAB: RESERVAS ──────────────────────────────────────────────── */}
				{(isSpecificAvailability || section === "reservas") && (
					<Box sx={{ p: { xs: 2, sm: 3 } }}>

				<Box
					sx={{
						mb: 3,
						borderRadius: 1.5,
						border: `1px solid ${alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.22 : 0.14)}`,
						bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.04 : 0.02),
					}}
				>
					<Tabs
						value={filter}
						onChange={(e, val) => setFilter(val)}
						sx={{
							borderBottom: `1px solid ${alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.18 : 0.12)}`,
							minHeight: 40,
							"& .MuiTabs-indicator": { height: 2.5, borderRadius: 1, bgcolor: BRAND_BLUE },
							"& .MuiTab-root": {
								textTransform: "none",
								fontSize: "0.82rem",
								fontWeight: 500,
								minHeight: 40,
								color: "text.secondary",
								transition: "color 0.15s ease",
								"&:hover": { color: BRAND_BLUE },
								"&.Mui-selected": { color: BRAND_BLUE, fontWeight: 600 },
							},
						}}
					>
						<Tab value="upcoming" label="Próximas" />
						<Tab value="past" label="Pasadas" />
						<Tab value="all" label="Todas" />
					</Tabs>

					<Box sx={{ p: 1.5, display: "flex", alignItems: "center", gap: 1.5 }}>
						<Typography sx={{ fontSize: "0.78rem", fontWeight: 600, color: "text.secondary", letterSpacing: "-0.005em" }}>Estado:</Typography>
						<FormControl
							size="small"
							sx={{
								width: 200,
								"& .MuiOutlinedInput-notchedOutline": {
									borderColor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.26 : 0.16),
									transition: "border-color 0.15s ease",
								},
								"& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
									borderColor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.46 : 0.32),
								},
								"& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
									borderColor: alpha(BRAND_BLUE, 0.55),
									borderWidth: 1,
								},
							}}
						>
							<Select value={statusFilter} onChange={(e) => setStatusFilter(e.target.value)} displayEmpty>
								<MenuItem value="all">Todos</MenuItem>
								<MenuItem value="pending">Pendientes</MenuItem>
								<MenuItem value="confirmed">Confirmadas</MenuItem>
								<MenuItem value="cancelled">Canceladas</MenuItem>
								<MenuItem value="rejected">Rechazadas</MenuItem>
								<MenuItem value="completed">Completadas</MenuItem>
							</Select>
						</FormControl>
					</Box>
				</Box>

				{/* Chips de filtros activos brand-tinted */}
				{(filter !== "all" || statusFilter !== "all") && (
					<Stack direction="row" spacing={1} sx={{ mb: 2, flexWrap: "wrap", gap: 1 }}>
						{filter !== "all" && (
							<Chip
								label={filter === "upcoming" ? "Próximas" : "Pasadas"}
								size="small"
								onDelete={() => setFilter("all")}
								sx={{
									fontSize: "0.72rem",
									height: 24,
									bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.14 : 0.08),
									color: "text.primary",
									border: `1px solid ${alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.32 : 0.2)}`,
									"& .MuiChip-deleteIcon": { color: BRAND_BLUE, "&:hover": { color: alpha(BRAND_BLUE, 0.7) } },
								}}
							/>
						)}
						{statusFilter !== "all" && (
							<Chip
								label={
									statusFilter === "pending"
										? "Pendientes"
										: statusFilter === "confirmed"
										? "Confirmadas"
										: statusFilter === "cancelled"
										? "Canceladas"
										: statusFilter === "rejected"
										? "Rechazadas"
										: "Completadas"
								}
								size="small"
								onDelete={() => setStatusFilter("all")}
								sx={{
									fontSize: "0.72rem",
									height: 24,
									bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.14 : 0.08),
									color: "text.primary",
									border: `1px solid ${alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.32 : 0.2)}`,
									"& .MuiChip-deleteIcon": { color: BRAND_BLUE, "&:hover": { color: alpha(BRAND_BLUE, 0.7) } },
								}}
							/>
						)}
					</Stack>
				)}

				{filteredBookings.length === 0 ? (
					<Box>
						<NoResultsState
							title="No hay reservas"
							description={(() => {
								const tabLabel = filter === "upcoming" ? "próximas" : filter === "past" ? "pasadas" : "";
								const statusLabel =
									statusFilter === "pending"
										? "pendientes"
										: statusFilter === "confirmed"
										? "confirmadas"
										: statusFilter === "cancelled"
										? "canceladas"
										: statusFilter === "rejected"
										? "rechazadas"
										: statusFilter === "completed"
										? "completadas"
										: "";
								if (tabLabel && statusLabel) {
									return `No hay reservas ${tabLabel} ${statusLabel}.`;
								}
								if (statusLabel) {
									return `No hay reservas ${statusLabel}.`;
								}
								if (tabLabel) {
									return `No hay reservas ${tabLabel}.`;
								}
								return "No hay reservas registradas. Creá una disponibilidad para empezar a recibir citas.";
							})()}
						/>
						{!isSpecificAvailability && (
							<Box sx={{ display: "flex", justifyContent: "center", mt: 0.5, mb: 3 }}>
								{canCreateAvailability ? (
									<Button
										variant="contained"
										onClick={() => navigate("/apps/calendar/booking-config")}
										sx={{
											textTransform: "none",
											bgcolor: BRAND_BLUE,
											color: "#fff",
											fontWeight: 600,
											letterSpacing: "-0.005em",
											borderRadius: 1.25,
											px: 2.25,
											boxShadow: `0 4px 12px ${alpha(BRAND_BLUE, 0.22)}`,
											"&:hover": {
												bgcolor: alpha(BRAND_BLUE, 0.88),
												boxShadow: `0 6px 16px ${alpha(BRAND_BLUE, 0.28)}`,
											},
										}}
									>
										Crear nueva disponibilidad
									</Button>
								) : (
									<Tooltip
										title={!hasBookingFeature ? "Función disponible en planes superiores" : "No tenés permisos para crear disponibilidades"}
										arrow
										placement="top"
									>
										<span>
											<Button
												variant="contained"
												startIcon={<Lock size={16} />}
												onClick={!hasBookingFeature ? handleNewAvailabilityLockedClick : undefined}
												disabled={hasBookingFeature}
												sx={{
													textTransform: "none",
													bgcolor: BRAND_BLUE,
													color: "#fff",
													fontWeight: 600,
													letterSpacing: "-0.005em",
													borderRadius: 1.25,
													px: 2.25,
													boxShadow: "none",
													"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
													"&.Mui-disabled": {
														bgcolor: alpha(BRAND_BLUE, isDarkMode ? 0.24 : 0.4),
														color: alpha("#fff", 0.9),
													},
												}}
											>
												Crear nueva disponibilidad
											</Button>
										</span>
									</Tooltip>
								)}
							</Box>
						)}
					</Box>
				) : (
					<Grid container spacing={2}>
						{Array.isArray(filteredBookings)
							? paginatedBookings.map((booking) => {
									// Verificar si ya pasó la fecha
									const isPast = booking.startTime ? dayjs().isAfter(dayjs(booking.startTime)) : false;

									return (
										<Grid item xs={12} sm={6} md={4} lg={3} key={booking._id}>
											{/* Si tenemos información de disponibilidad, mostramos la tarjeta normal */}
											{booking.availability || availability ? (
												<BookingCard
													booking={booking}
													availability={booking.availability || (availability as AvailabilityType)}
													onStatusChange={handleStatusChange}
													onDelete={handleDeleteClick}
													showAvailabilityInfo={!isSpecificAvailability}
													canUpdate={canEditAvailability}
													canDelete={canDeleteAvailability}
												/>
											) : (
												/* Si no tenemos información de disponibilidad, versión simplificada
												   con el MISMO patrón visual que BookingCard / AvailabilityCard. */
												<Box
													sx={{
														position: "relative",
														height: "100%",
														borderRadius: 1.5,
														border: `1px solid ${alpha(BRAND_BLUE, isDarkMode ? 0.22 : 0.14)}`,
														bgcolor: theme.palette.background.paper,
														transition: "border-color 0.15s ease",
														p: 1.5,
														"&:hover": { borderColor: alpha(BRAND_BLUE, isDarkMode ? 0.42 : 0.28) },
													}}
												>
													{/* Status pill top-right (consistente con BookingCard y AvailabilityCard) */}
													<Box sx={{ position: "absolute", top: 12, right: 12 }}>
														<BookingStatusPill status={booking.status} />
													</Box>

													<Stack spacing={1.25}>
														<Stack direction="row" alignItems="center" spacing={1} sx={{ pr: 9 }}>
															<Box
																sx={{
																	width: 28,
																	height: 28,
																	borderRadius: 0.875,
																	display: "flex",
																	alignItems: "center",
																	justifyContent: "center",
																	bgcolor: alpha(BRAND_BLUE, isDarkMode ? 0.18 : 0.1),
																	color: BRAND_BLUE,
																	flexShrink: 0,
																}}
															>
																<User size={14} variant="Bulk" />
															</Box>
															<Typography
																sx={{
																	fontSize: "0.88rem",
																	fontWeight: 600,
																	letterSpacing: "-0.01em",
																	color: "text.primary",
																	overflow: "hidden",
																	textOverflow: "ellipsis",
																	whiteSpace: "nowrap",
																}}
															>
																{booking.clientName}
															</Typography>
														</Stack>

														<Stack spacing={0.875}>
															<Stack direction="row" spacing={1.25} alignItems="flex-start">
																<Box sx={{ color: "text.secondary", flexShrink: 0, mt: 0.125 }}>
																	<Calendar1 size={14} variant="Bulk" />
																</Box>
																<Box sx={{ minWidth: 0 }}>
																	<Typography
																		sx={{
																			fontSize: "0.62rem",
																			fontWeight: 600,
																			letterSpacing: "0.08em",
																			textTransform: "uppercase",
																			color: "text.secondary",
																			lineHeight: 1.2,
																		}}
																	>
																		Fecha y hora
																	</Typography>
																	<Typography sx={{ fontSize: "0.78rem", fontWeight: 500, color: "text.primary", fontVariantNumeric: "tabular-nums" }}>
																		{dayjs(booking.startTime).format("D/M/YYYY · HH:mm")}
																	</Typography>
																</Box>
															</Stack>

															<Stack direction="row" spacing={1.25} alignItems="flex-start">
																<Box sx={{ color: "text.secondary", flexShrink: 0, mt: 0.125 }}>
																	<User size={14} variant="Bulk" />
																</Box>
																<Box sx={{ minWidth: 0 }}>
																	<Typography
																		sx={{
																			fontSize: "0.62rem",
																			fontWeight: 600,
																			letterSpacing: "0.08em",
																			textTransform: "uppercase",
																			color: "text.secondary",
																			lineHeight: 1.2,
																		}}
																	>
																		Contacto
																	</Typography>
																	<Typography
																		sx={{
																			fontSize: "0.78rem",
																			color: "text.primary",
																			overflow: "hidden",
																			textOverflow: "ellipsis",
																			whiteSpace: "nowrap",
																		}}
																	>
																		{booking.clientEmail}
																	</Typography>
																</Box>
															</Stack>
														</Stack>

														{/* Acciones contextuales — icon buttons monocromos con intent hover */}
														{((booking.status === "pending" && canEditAvailability) ||
															(booking.status === "confirmed" && canEditAvailability)) && (
															<>
																<Box sx={{ height: 1, bgcolor: alpha(BRAND_BLUE, isDarkMode ? 0.16 : 0.1) }} />
																<Stack direction="row" justifyContent="flex-end" spacing={0.25}>
																	{booking.status === "pending" && (
																		<>
																			<Tooltip title="Confirmar" arrow placement="top">
																				<IconButton
																					size="small"
																					onClick={() => handleStatusChange(booking._id, "confirmed")}
																					sx={{
																						color: "text.secondary",
																						transition: "background-color 0.15s ease, color 0.15s ease",
																						"&:hover:not(.Mui-disabled)": {
																							bgcolor: alpha(LIVE_GREEN, isDarkMode ? 0.18 : 0.1),
																							color: LIVE_GREEN,
																						},
																					}}
																				>
																					<ClipboardTick size={16} variant="Bulk" />
																				</IconButton>
																			</Tooltip>
																			<Tooltip title="Rechazar" arrow placement="top">
																				<IconButton
																					size="small"
																					onClick={() => handleStatusChange(booking._id, "rejected")}
																					sx={{
																						color: "text.secondary",
																						transition: "background-color 0.15s ease, color 0.15s ease",
																						"&:hover:not(.Mui-disabled)": {
																							bgcolor: alpha(theme.palette.error.main, isDarkMode ? 0.18 : 0.1),
																							color: theme.palette.error.main,
																						},
																					}}
																				>
																					<Trash size={16} variant="Bulk" />
																				</IconButton>
																			</Tooltip>
																		</>
																	)}
																	{booking.status === "confirmed" && !isPast && (
																		<Tooltip title="Cancelar reserva" arrow placement="top">
																			<IconButton
																				size="small"
																				onClick={() => handleStatusChange(booking._id, "cancelled")}
																				sx={{
																					color: "text.secondary",
																					transition: "background-color 0.15s ease, color 0.15s ease",
																					"&:hover:not(.Mui-disabled)": {
																						bgcolor: alpha(theme.palette.error.main, isDarkMode ? 0.18 : 0.1),
																						color: theme.palette.error.main,
																					},
																				}}
																			>
																				<Trash size={16} variant="Bulk" />
																			</IconButton>
																		</Tooltip>
																	)}
																	{booking.status === "confirmed" && isPast && (
																		<Tooltip title="Marcar completada" arrow placement="top">
																			<IconButton
																				size="small"
																				onClick={() => handleStatusChange(booking._id, "completed")}
																				sx={{
																					color: "text.secondary",
																					transition: "background-color 0.15s ease, color 0.15s ease",
																					"&:hover:not(.Mui-disabled)": {
																						bgcolor: alpha(BRAND_BLUE, isDarkMode ? 0.16 : 0.08),
																						color: BRAND_BLUE,
																					},
																				}}
																			>
																				<ClipboardTick size={16} variant="Bulk" />
																			</IconButton>
																		</Tooltip>
																	)}
																</Stack>
															</>
														)}
													</Stack>
												</Box>
											)}
										</Grid>
									);
							  })
							: null}
					</Grid>
				)}

				{/* Paginación brand-aware — solo si hay más de una página */}
				{filteredBookings.length > BOOKINGS_PER_PAGE && (
					<Stack direction="row" alignItems="center" justifyContent="space-between" sx={{ mt: 3, flexWrap: "wrap", gap: 1 }}>
						<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", fontVariantNumeric: "tabular-nums" }}>
							Mostrando <Box component="strong" sx={{ color: "text.primary", fontWeight: 600 }}>{(bookingsPage - 1) * BOOKINGS_PER_PAGE + 1}–{Math.min(bookingsPage * BOOKINGS_PER_PAGE, filteredBookings.length)}</Box> de{" "}
							<Box component="strong" sx={{ color: "text.primary", fontWeight: 600 }}>{filteredBookings.length}</Box> reservas
						</Typography>
						<Stack direction="row" alignItems="center" spacing={0.5}>
							<Button
								size="small"
								onClick={() => setBookingsPage((p) => Math.max(1, p - 1))}
								disabled={bookingsPage === 1}
								sx={{
									textTransform: "none",
									minWidth: 70,
									color: "text.secondary",
									fontWeight: 500,
									"&:hover": { bgcolor: alpha(BRAND_BLUE, isDarkMode ? 0.1 : 0.06), color: BRAND_BLUE },
								}}
							>
								Anterior
							</Button>
							{Array.from({ length: totalBookingsPages }).map((_, idx) => {
								const pageNum = idx + 1;
								const isActive = pageNum === bookingsPage;
								return (
									<Button
										key={pageNum}
										size="small"
										onClick={() => setBookingsPage(pageNum)}
										sx={{
											minWidth: 32,
											height: 32,
											p: 0,
											textTransform: "none",
											fontSize: "0.78rem",
											fontWeight: isActive ? 600 : 500,
											fontVariantNumeric: "tabular-nums",
											borderRadius: 1,
											color: isActive ? "#fff" : "text.secondary",
											bgcolor: isActive ? BRAND_BLUE : "transparent",
											"&:hover": {
												bgcolor: isActive ? alpha(BRAND_BLUE, 0.88) : alpha(BRAND_BLUE, isDarkMode ? 0.1 : 0.06),
												color: isActive ? "#fff" : BRAND_BLUE,
											},
										}}
									>
										{pageNum}
									</Button>
								);
							})}
							<Button
								size="small"
								onClick={() => setBookingsPage((p) => Math.min(totalBookingsPages, p + 1))}
								disabled={bookingsPage === totalBookingsPages}
								sx={{
									textTransform: "none",
									minWidth: 80,
									color: "text.secondary",
									fontWeight: 500,
									"&:hover": { bgcolor: alpha(BRAND_BLUE, isDarkMode ? 0.1 : 0.06), color: BRAND_BLUE },
								}}
							>
								Siguiente
							</Button>
						</Stack>
					</Stack>
				)}
					</Box>
				)}
			</MainCard>

			{/* Helper: estilos de diálogo brand-aware compartidos */}
			{(() => null)()}

			{/* Diálogo de confirmación de eliminación de reserva */}
			<ResponsiveDialog
				open={deleteDialog}
				onClose={() => {
					if (!loadingAction) {
						setDeleteDialog(false);
						setSelectedBooking(null);
					}
				}}
				aria-labelledby="delete-dialog-title"
				PaperProps={{ sx: { p: 0 } }}
			>
				<DialogTitle
					id="delete-dialog-title"
					sx={{
						bgcolor: alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.1 : 0.05),
						p: { xs: 1.75, sm: 2 },
						borderBottom: `1px solid ${alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.22 : 0.16)}`,
					}}
				>
					<Stack direction="row" alignItems="center" spacing={1.25}>
						<Box
							sx={{
								width: 36,
								height: 36,
								borderRadius: 1.25,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.2 : 0.12),
								color: theme.palette.error.main,
								flexShrink: 0,
							}}
						>
							<Trash size={20} variant="Bulk" />
						</Box>
						<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.2, color: "text.primary" }}>
							Eliminar reserva
						</Typography>
					</Stack>
				</DialogTitle>
				<DialogContent sx={{ p: { xs: 2, sm: 2.5 } }}>
					<Typography sx={{ fontSize: "0.875rem", color: "text.secondary", lineHeight: 1.55, textWrap: "pretty" }}>
						¿Seguro que querés eliminar la reserva de <Box component="strong" sx={{ color: "text.primary", fontWeight: 600 }}>{selectedBooking?.clientName}</Box>? Esta acción no se puede deshacer.
					</Typography>
				</DialogContent>
				<DialogActions
					sx={{
						p: { xs: 1.5, sm: 2 },
						bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.04 : 0.02),
						borderTop: `1px solid ${alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.16 : 0.1)}`,
					}}
				>
					<Button
						onClick={() => {
							setDeleteDialog(false);
							setSelectedBooking(null);
						}}
						disabled={loadingAction}
						sx={{
							textTransform: "none",
							color: "text.secondary",
							fontWeight: 500,
							"&:hover": { bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.1 : 0.06), color: BRAND_BLUE },
						}}
					>
						Cancelar
					</Button>
					<LoadingButton
						onClick={handleDeleteConfirm}
						variant="contained"
						loading={loadingAction}
						sx={{
							textTransform: "none",
							bgcolor: theme.palette.error.main,
							color: "#fff",
							fontWeight: 600,
							borderRadius: 1.25,
							boxShadow: "none",
							"&:hover": { bgcolor: alpha(theme.palette.error.main, 0.88), boxShadow: "none" },
						}}
					>
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
				PaperProps={{ sx: { p: 0 } }}
			>
				<DialogTitle
					id="reject-dialog-title"
					sx={{
						bgcolor: alpha(STALE_AMBER, theme.palette.mode === "dark" ? 0.1 : 0.05),
						p: { xs: 1.75, sm: 2 },
						borderBottom: `1px solid ${alpha(STALE_AMBER, theme.palette.mode === "dark" ? 0.32 : 0.22)}`,
					}}
				>
					<Stack direction="row" alignItems="center" spacing={1.25}>
						<Box
							sx={{
								width: 36,
								height: 36,
								borderRadius: 1.25,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(STALE_AMBER, theme.palette.mode === "dark" ? 0.2 : 0.12),
								color: STALE_AMBER,
								flexShrink: 0,
							}}
						>
							<InfoCircle size={20} variant="Bulk" />
						</Box>
						<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.2, color: "text.primary" }}>
							Rechazar reserva
						</Typography>
					</Stack>
				</DialogTitle>
				<DialogContent sx={{ p: { xs: 2, sm: 2.5 } }}>
					<Stack spacing={2}>
						<Typography sx={{ fontSize: "0.875rem", color: "text.secondary", lineHeight: 1.55, textWrap: "pretty" }}>
							Estás rechazando la reserva de <Box component="strong" sx={{ color: "text.primary", fontWeight: 600 }}>{selectedBooking?.clientName}</Box>. Podés agregar un motivo opcional:
						</Typography>
						<TextField
							autoFocus
							label="Motivo del rechazo"
							multiline
							rows={3}
							value={rejectReason}
							onChange={(e) => setRejectReason(e.target.value)}
							fullWidth
							sx={{
								"& .MuiOutlinedInput-notchedOutline": {
									borderColor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.26 : 0.16),
								},
								"& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
									borderColor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.46 : 0.32),
								},
								"& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
									borderColor: alpha(BRAND_BLUE, 0.55),
								},
							}}
						/>
					</Stack>
				</DialogContent>
				<DialogActions
					sx={{
						p: { xs: 1.5, sm: 2 },
						bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.04 : 0.02),
						borderTop: `1px solid ${alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.16 : 0.1)}`,
					}}
				>
					<Button
						onClick={() => {
							setRejectDialog(false);
							setRejectReason("");
							setSelectedBooking(null);
						}}
						disabled={loadingAction}
						sx={{
							textTransform: "none",
							color: "text.secondary",
							fontWeight: 500,
							"&:hover": { bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.1 : 0.06), color: BRAND_BLUE },
						}}
					>
						Cancelar
					</Button>
					<LoadingButton
						onClick={handleRejectConfirm}
						variant="contained"
						loading={loadingAction}
						sx={{
							textTransform: "none",
							bgcolor: theme.palette.error.main,
							color: "#fff",
							fontWeight: 600,
							borderRadius: 1.25,
							boxShadow: "none",
							"&:hover": { bgcolor: alpha(theme.palette.error.main, 0.88), boxShadow: "none" },
						}}
					>
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
				PaperProps={{ sx: { p: 0 } }}
			>
				<DialogTitle
					id="cancel-dialog-title"
					sx={{
						bgcolor: alpha(STALE_AMBER, theme.palette.mode === "dark" ? 0.1 : 0.05),
						p: { xs: 1.75, sm: 2 },
						borderBottom: `1px solid ${alpha(STALE_AMBER, theme.palette.mode === "dark" ? 0.32 : 0.22)}`,
					}}
				>
					<Stack direction="row" alignItems="center" spacing={1.25}>
						<Box
							sx={{
								width: 36,
								height: 36,
								borderRadius: 1.25,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(STALE_AMBER, theme.palette.mode === "dark" ? 0.2 : 0.12),
								color: STALE_AMBER,
								flexShrink: 0,
							}}
						>
							<InfoCircle size={20} variant="Bulk" />
						</Box>
						<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.2, color: "text.primary" }}>
							Cancelar reserva
						</Typography>
					</Stack>
				</DialogTitle>
				<DialogContent sx={{ p: { xs: 2, sm: 2.5 } }}>
					<Stack spacing={2}>
						<Typography sx={{ fontSize: "0.875rem", color: "text.secondary", lineHeight: 1.55, textWrap: "pretty" }}>
							Estás cancelando la reserva de <Box component="strong" sx={{ color: "text.primary", fontWeight: 600 }}>{selectedBooking?.clientName}</Box>. Podés agregar un motivo opcional:
						</Typography>
						<TextField
							autoFocus
							label="Motivo de la cancelación"
							multiline
							rows={3}
							value={cancelReason}
							onChange={(e) => setCancelReason(e.target.value)}
							fullWidth
							sx={{
								"& .MuiOutlinedInput-notchedOutline": {
									borderColor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.26 : 0.16),
								},
								"& .MuiOutlinedInput-root:hover .MuiOutlinedInput-notchedOutline": {
									borderColor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.46 : 0.32),
								},
								"& .MuiOutlinedInput-root.Mui-focused .MuiOutlinedInput-notchedOutline": {
									borderColor: alpha(BRAND_BLUE, 0.55),
								},
							}}
						/>
					</Stack>
				</DialogContent>
				<DialogActions
					sx={{
						p: { xs: 1.5, sm: 2 },
						bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.04 : 0.02),
						borderTop: `1px solid ${alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.16 : 0.1)}`,
					}}
				>
					<Button
						onClick={() => {
							setCancelDialog(false);
							setCancelReason("");
							setSelectedBooking(null);
						}}
						disabled={loadingAction}
						sx={{
							textTransform: "none",
							color: "text.secondary",
							fontWeight: 500,
							"&:hover": { bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.1 : 0.06), color: BRAND_BLUE },
						}}
					>
						Volver
					</Button>
					<LoadingButton
						onClick={handleCancelConfirm}
						variant="contained"
						loading={loadingAction}
						sx={{
							textTransform: "none",
							bgcolor: theme.palette.error.main,
							color: "#fff",
							fontWeight: 600,
							borderRadius: 1.25,
							boxShadow: "none",
							"&:hover": { bgcolor: alpha(theme.palette.error.main, 0.88), boxShadow: "none" },
						}}
					>
						Cancelar reserva
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
				PaperProps={{ sx: { p: 0 } }}
			>
				<DialogTitle
					id="delete-availability-dialog-title"
					sx={{
						bgcolor: alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.1 : 0.05),
						p: { xs: 1.75, sm: 2 },
						borderBottom: `1px solid ${alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.22 : 0.16)}`,
					}}
				>
					<Stack direction="row" alignItems="center" spacing={1.25}>
						<Box
							sx={{
								width: 36,
								height: 36,
								borderRadius: 1.25,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(theme.palette.error.main, theme.palette.mode === "dark" ? 0.2 : 0.12),
								color: theme.palette.error.main,
								flexShrink: 0,
							}}
						>
							<Trash size={20} variant="Bulk" />
						</Box>
						<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", lineHeight: 1.2, color: "text.primary" }}>
							Eliminar disponibilidad
						</Typography>
					</Stack>
				</DialogTitle>
				<DialogContent sx={{ p: { xs: 2, sm: 2.5 } }}>
					<Stack spacing={1.5}>
						<Typography sx={{ fontSize: "0.875rem", color: "text.secondary", lineHeight: 1.55, textWrap: "pretty" }}>
							¿Seguro que querés eliminar esta disponibilidad? La acción elimina todas las configuraciones asociadas y no se puede deshacer.
						</Typography>
						<Box
							sx={{
								display: "flex",
								alignItems: "flex-start",
								gap: 1,
								px: 1.25,
								py: 1,
								borderRadius: 1.25,
								border: `1px solid ${alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.28 : 0.18)}`,
								bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.08 : 0.05),
							}}
						>
							<Box sx={{ color: BRAND_BLUE, display: "flex", mt: 0.125, flexShrink: 0 }}>
								<InfoCircle size={14} variant="Bulk" />
							</Box>
							<Typography sx={{ fontSize: "0.75rem", color: "text.secondary", lineHeight: 1.45, textWrap: "pretty" }}>
								No podés eliminar la disponibilidad si tenés citas pendientes o citas confirmadas futuras.
							</Typography>
						</Box>
						<Box
							sx={{
								display: "flex",
								alignItems: "flex-start",
								gap: 1,
								px: 1.25,
								py: 1,
								borderRadius: 1.25,
								border: `1px solid ${alpha(STALE_AMBER, theme.palette.mode === "dark" ? 0.32 : 0.22)}`,
								bgcolor: alpha(STALE_AMBER, theme.palette.mode === "dark" ? 0.1 : 0.05),
							}}
						>
							<Box sx={{ color: STALE_AMBER, display: "flex", mt: 0.125, flexShrink: 0 }}>
								<InfoCircle size={14} variant="Bulk" />
							</Box>
							<Typography sx={{ fontSize: "0.75rem", color: "text.secondary", lineHeight: 1.45, textWrap: "pretty" }}>
								Las reservas existentes se mantienen, pero el enlace público deja de aceptar nuevas reservas.
							</Typography>
						</Box>
					</Stack>
				</DialogContent>
				<DialogActions
					sx={{
						p: { xs: 1.5, sm: 2 },
						bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.04 : 0.02),
						borderTop: `1px solid ${alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.16 : 0.1)}`,
					}}
				>
					<Button
						onClick={() => {
							setDeleteAvailabilityDialog(false);
							setSelectedAvailabilityId(null);
						}}
						disabled={loadingAction}
						sx={{
							textTransform: "none",
							color: "text.secondary",
							fontWeight: 500,
							"&:hover": { bgcolor: alpha(BRAND_BLUE, theme.palette.mode === "dark" ? 0.1 : 0.06), color: BRAND_BLUE },
						}}
					>
						Cancelar
					</Button>
					<LoadingButton
						onClick={handleDeleteAvailabilityConfirm}
						variant="contained"
						loading={loadingAction}
						sx={{
							textTransform: "none",
							bgcolor: theme.palette.error.main,
							color: "#fff",
							fontWeight: 600,
							borderRadius: 1.25,
							boxShadow: "none",
							"&:hover": { bgcolor: alpha(theme.palette.error.main, 0.88), boxShadow: "none" },
						}}
					>
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
		</Stack>
	);
};

// Componente principal que combina ambos
const SchedulingManagement: React.FC = () => {
	// Siempre mostrar la vista de reservas para la estructura actual
	return <BookingsManagement />;
};

export default SchedulingManagement;

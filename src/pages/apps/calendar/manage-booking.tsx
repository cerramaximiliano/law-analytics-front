import { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
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
	Grid,
	Paper,
	Stack,
	TextField,
	Typography,
	Alert,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
} from "@mui/material";
import { format } from "date-fns";
import { es } from "date-fns/locale";

// assets
import { Calendar1, Clock, CloseCircle, CalendarAdd } from "iconsax-react";
import logo from "assets/images/large_logo_transparent.png";

// interfaces
interface Booking {
	_id: string;
	clientName: string;
	clientEmail: string;
	clientPhone?: string;
	startTime: string;
	endTime: string;
	status: string;
	notes?: string;
	title: string;
	hostName: string;
	location?: string;
	duration: number;
	publicUrl?: string; // URL pública para agendar con el mismo profesional
}

const ManageBookingPage = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { token } = useParams<{ token: string }>();

	const [bookingToken, setBookingToken] = useState(token || "");
	const [loading, setLoading] = useState(false);
	const [loadingCancel, setLoadingCancel] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [success, setSuccess] = useState<string | null>(null);
	const [booking, setBooking] = useState<Booking | null>(null);
	const [openCancelDialog, setOpenCancelDialog] = useState(false);
	const [cancelSuccess, setCancelSuccess] = useState(false);

	// Si hay un token en la URL, buscar la reserva automáticamente
	useEffect(() => {
		if (token) {
			fetchBooking(token);
		}
	}, [token]);

	const fetchBooking = async (tokenToFetch: string) => {
		if (!tokenToFetch.trim()) {
			setError("Por favor, ingresa un token válido");
			return;
		}

		setLoading(true);
		setError(null);
		setSuccess(null);
		setBooking(null);

		try {
			const response = await axios.get(`${process.env.REACT_APP_BASE_URL}/api/booking/public/bookings/${tokenToFetch}`);

			if (response.status === 200) {
				// Guardar todos los datos de la reserva, incluyendo publicUrl si existe
				setBooking(response.data);
				// Verificar que venga publicUrl
				setSuccess("Información de la reserva encontrada");
			} else {
				throw new Error("No se pudo encontrar información sobre la reserva");
			}
		} catch (err: any) {
			if (err.response && err.response.status === 404) {
				setError("No se encontró ninguna reserva con ese token. Por favor, verifica e intenta de nuevo.");
			} else if (err.response && err.response.data && err.response.data.error) {
				setError(err.response.data.error);
			} else {
				setError("Ocurrió un error al buscar tu reserva. Por favor, intenta de nuevo más tarde.");
			}
		} finally {
			setLoading(false);
		}
	};

	const handleSearch = () => {
		fetchBooking(bookingToken);
	};

	const handleCancelBooking = async () => {
		if (!booking || !bookingToken) return;

		setLoadingCancel(true);

		try {
			const response = await axios.post(`${process.env.REACT_APP_BASE_URL}/api/booking/public/bookings/${bookingToken}/cancel`);

			if (response.status === 200) {
				setCancelSuccess(true);
				setOpenCancelDialog(false);
				// Actualizar el estado de la reserva
				setBooking({
					...booking,
					status: "cancelled",
				});
			} else {
				throw new Error("No se pudo cancelar la reserva");
			}
		} catch (err: any) {
			setError("No se pudo cancelar la reserva. Por favor, intenta de nuevo más tarde.");
			setOpenCancelDialog(false);
		} finally {
			setLoadingCancel(false);
		}
	};

	const handleTokenChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		setBookingToken(e.target.value);
		// Limpiar mensajes cuando el usuario empieza a escribir
		if (error) setError(null);
		if (success) setSuccess(null);
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case "confirmed":
				return "Confirmada";
			case "pending":
				return "Pendiente de confirmación";
			case "cancelled":
				return "Cancelada";
			case "completed":
				return "Completada";
			default:
				return status;
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "confirmed":
				return theme.palette.success.main;
			case "pending":
				return theme.palette.warning.main;
			case "cancelled":
				return theme.palette.error.main;
			case "completed":
				return theme.palette.info.main;
			default:
				return theme.palette.grey[500];
		}
	};

	return (
		<Container maxWidth="md" sx={{ py: 4 }}>
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
			>
				<Box sx={{ display: "flex", alignItems: "center", cursor: "pointer" }} onClick={() => navigate("/")}>
					<img src={logo} style={{ height: "60px", marginRight: "16px" }} alt="Law Analytics" />
				</Box>
				{!token && (
					<Button variant="outlined" color="primary" onClick={() => navigate("/booking")}>
						Volver a reservas
					</Button>
				)}
			</Box>

			<Paper elevation={3} sx={{ p: { xs: 3, sm: 5 }, borderRadius: 2, bgcolor: "background.paper" }}>
				<Typography variant="h3" gutterBottom>
					Gestión de reservas
				</Typography>
				<Typography variant="body1" color="textSecondary" paragraph>
					Ingresa el token de tu reserva para ver los detalles o cancelarla.
				</Typography>

				<Box sx={{ mt: 3, mb: 4 }}>
					<Grid container spacing={2}>
						<Grid item xs={12} sm={8}>
							<TextField
								fullWidth
								label="Token de reserva"
								variant="outlined"
								value={bookingToken}
								onChange={handleTokenChange}
								placeholder="Ingresa el token de tu reserva"
							/>
						</Grid>
						<Grid item xs={12} sm={4}>
							<Button
								fullWidth
								variant="contained"
								onClick={handleSearch}
								disabled={loading || !bookingToken.trim()}
								sx={{ height: "100%" }}
							>
								{loading ? <CircularProgress size={24} color="inherit" /> : "Buscar"}
							</Button>
						</Grid>
					</Grid>

					{error && (
						<Alert severity="error" sx={{ mt: 2 }}>
							{error}
						</Alert>
					)}

					{success && !error && (
						<Alert severity="success" sx={{ mt: 2 }}>
							{success}
						</Alert>
					)}

					{error && (
						<Box sx={{ mt: 3, display: "flex", justifyContent: "center", width: "100%" }}>
							<Button variant="outlined" color="primary" startIcon={<CalendarAdd />} onClick={() => navigate("/booking")}>
								¿No tienes una cita? Agenda una nueva
							</Button>
						</Box>
					)}
				</Box>

				{booking && (
					<Card sx={{ mt: 4 }}>
						<CardContent>
							<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 2 }}>
								<Typography variant="h4">Detalles de la reserva</Typography>
								<Box
									sx={{
										px: 2,
										py: 1,
										bgcolor: `${getStatusColor(booking.status)}20`,
										borderRadius: 2,
										color: getStatusColor(booking.status),
										fontWeight: "medium",
									}}
								>
									{getStatusLabel(booking.status)}
								</Box>
							</Box>

							<Divider sx={{ mb: 3 }} />

							<Grid container spacing={3}>
								<Grid item xs={12} md={6}>
									<Stack spacing={3}>
										<Box>
											<Typography variant="subtitle2" color="textSecondary">
												Tipo de cita
											</Typography>
											<Typography variant="body1">{booking.title}</Typography>
										</Box>

										<Box sx={{ display: "flex", alignItems: "flex-start" }}>
											<Calendar1 size={20} style={{ marginRight: 8, marginTop: 4, color: theme.palette.primary.main }} />
											<Box>
												<Typography variant="subtitle2" color="textSecondary">
													Fecha
												</Typography>
												<Typography variant="body1">
													{format(new Date(booking.startTime), "EEEE, d 'de' MMMM 'de' yyyy", { locale: es })}
												</Typography>
											</Box>
										</Box>

										<Box sx={{ display: "flex", alignItems: "flex-start" }}>
											<Clock size={20} style={{ marginRight: 8, marginTop: 4, color: theme.palette.primary.main }} />
											<Box>
												<Typography variant="subtitle2" color="textSecondary">
													Hora
												</Typography>
												<Typography variant="body1">
													{format(new Date(booking.startTime), "HH:mm")} - {format(new Date(booking.endTime), "HH:mm")}
												</Typography>
											</Box>
										</Box>

										<Box>
											<Typography variant="subtitle2" color="textSecondary">
												Duración
											</Typography>
											<Typography variant="body1">{booking.duration} minutos</Typography>
										</Box>
									</Stack>
								</Grid>

								<Grid item xs={12} md={6}>
									<Stack spacing={3}>
										<Box>
											<Typography variant="subtitle2" color="textSecondary">
												Profesional
											</Typography>
											<Typography variant="body1">{booking.hostName}</Typography>
										</Box>

										{booking.location && (
											<Box>
												<Typography variant="subtitle2" color="textSecondary">
													Ubicación
												</Typography>
												<Typography variant="body1">{booking.location}</Typography>
											</Box>
										)}

										<Box>
											<Typography variant="subtitle2" color="textSecondary">
												Cliente
											</Typography>
											<Typography variant="body1">{booking.clientName}</Typography>
										</Box>

										<Box>
											<Typography variant="subtitle2" color="textSecondary">
												Contacto
											</Typography>
											<Typography variant="body1">{booking.clientEmail}</Typography>
											{booking.clientPhone && <Typography variant="body2">{booking.clientPhone}</Typography>}
										</Box>
									</Stack>
								</Grid>

								{booking.notes && (
									<Grid item xs={12}>
										<Box sx={{ mt: 2 }}>
											<Typography variant="subtitle2" color="textSecondary">
												Notas
											</Typography>
											<Typography variant="body1">{booking.notes}</Typography>
										</Box>
									</Grid>
								)}
							</Grid>

							<Box sx={{ mt: 4 }}>
								<Divider sx={{ mb: 3 }} />
								<Stack direction={{ xs: "column", sm: "row" }} spacing={2} sx={{ justifyContent: "center" }}>
									{booking.status !== "cancelled" && booking.status !== "completed" && (
										<Button variant="outlined" color="error" startIcon={<CloseCircle />} onClick={() => setOpenCancelDialog(true)}>
											Cancelar reserva
										</Button>
									)}
									<Button
										variant="outlined"
										color="primary"
										startIcon={<CalendarAdd />}
										onClick={() => {
											// Si tenemos la URL pública de la cita, usarla para agendar una nueva
											if (booking.publicUrl) {
												navigate(`/booking/${booking.publicUrl}`);
											} else {
												navigate("/manage-booking");
											}
										}}
									>
										Agendar nueva cita
									</Button>
								</Stack>
							</Box>

							{cancelSuccess && (
								<Alert severity="success" sx={{ mt: 3 }}>
									La reserva ha sido cancelada exitosamente.
								</Alert>
							)}
						</CardContent>
					</Card>
				)}
			</Paper>

			{/* Footer */}
			<Box
				sx={{
					mt: 4,
					p: 3,
					borderRadius: 2,
					bgcolor: theme.palette.grey[100],
					textAlign: "center",
				}}
			>
				<Typography variant="body2" color="textSecondary">
					© {new Date().getFullYear()} Law Analytics - Todos los derechos reservados
				</Typography>
			</Box>

			{/* Diálogo de confirmación de cancelación */}
			<Dialog open={openCancelDialog} onClose={() => setOpenCancelDialog(false)}>
				<DialogTitle>¿Estás seguro que deseas cancelar esta reserva?</DialogTitle>
				<DialogContent>
					<DialogContentText>
						Esta acción no se puede deshacer. Se notificará la cancelación a todas las partes involucradas.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={() => setOpenCancelDialog(false)}>Volver</Button>
					<Button
						onClick={handleCancelBooking}
						color="error"
						variant="contained"
						disabled={loadingCancel}
						startIcon={loadingCancel ? <CircularProgress size={16} /> : <CloseCircle size={16} />}
					>
						Confirmar cancelación
					</Button>
				</DialogActions>
			</Dialog>
		</Container>
	);
};

export default ManageBookingPage;

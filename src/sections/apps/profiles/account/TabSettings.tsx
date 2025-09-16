import React from "react";
import { useState, useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch } from "store";

// material-ui
import {
	Box,
	Button,
	Chip,
	Divider,
	Grid,
	List,
	ListItem,
	ListItemText,
	Stack,
	Typography,
	CircularProgress,
	Alert,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
	Snackbar,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
} from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import ApiService from "store/reducers/ApiService";
import { Payment } from "store/reducers/ApiService";
import InvoiceView from "./InvoiceView";
import { useNavigate } from "react-router";
import { RootState } from "store";
import { fetchCurrentSubscription, updateSubscription, fetchPaymentHistory, selectPaymentHistory } from "store/reducers/auth";

// ==============================|| ACCOUNT PROFILE - SUBSCRIPTION ||============================== //

// Helper function to get the correct Stripe value based on environment
const getStripeValue = (value: any): string => {
	if (typeof value === 'string') {
		return value;
	}

	if (typeof value === 'object' && value !== null) {
		// Detectar si estamos en desarrollo o producción
		const isDevelopment = import.meta.env.VITE_BASE_URL?.includes('localhost') ||
							  import.meta.env.MODE === 'development';

		if (isDevelopment && value.test) {
			return value.test;
		} else if (!isDevelopment && value.live) {
			return value.live;
		} else if (value.test) {
			// Fallback to test if live is not available
			return value.test;
		} else if (value.live) {
			// Fallback to live if test is not available
			return value.live;
		}
	}

	return "No disponible";
};


const TabSubscription = () => {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();

	// Obtener la suscripción del estado Redux
	const subscription = useSelector((state: RootState) => state.auth.subscription);
	// Obtener el historial de pagos del estado Redux
	const payments = useSelector(selectPaymentHistory) || [];

	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [nextPlan, setNextPlan] = useState<string | null>(null);
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [cancelLoading, setCancelLoading] = useState(false);
	const [reactivateLoading, setReactivateLoading] = useState(false);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	// Estado para las facturas
	const [paymentsLoading, setPaymentsLoading] = useState(false);
	const [showAllPayments, setShowAllPayments] = useState(false);
	const [paymentsError, setPaymentsError] = useState<string | null>(null);

	// Estado para mostrar la factura personalizada
	const [selectedPayment, setSelectedPayment] = useState<Payment | null>(null);
	const [invoiceDialogOpen, setInvoiceDialogOpen] = useState(false);
	// Función para cargar los datos de la suscripción
	const fetchSubscription = async () => {
		try {
			setLoading(true);
			setError(null);

			// Usar la acción de Redux para obtener la suscripción
			const subscriptionData = await dispatch(fetchCurrentSubscription() as any);

			// Si hay un cambio de plan pendiente, guardarlo
			if (subscriptionData && subscriptionData.pendingPlanChange) {
				setNextPlan(getStripeValue(subscriptionData.pendingPlanChange.planId));
			}
		} catch (err: any) {
			// Solo mostrar error si no es 401 (usuario no autenticado)
			if (err.response?.status !== 401) {
				setError("Error al cargar los datos de suscripción");
			}
		} finally {
			setLoading(false);
		}
	};

	// Función para cargar el historial de pagos usando Redux
	const loadPaymentHistory = async () => {
		try {
			setPaymentsLoading(true);
			setPaymentsError(null);

			// Dispatch the Redux action to fetch payment history
			await dispatch(fetchPaymentHistory() as any);
		} catch (err: any) {
			// Error handling is done in the Redux action
			// Just update local error state if needed
			if (err.response?.status !== 401) {
				setPaymentsError(err.message || "Error al cargar el historial de pagos");
			}
		} finally {
			setPaymentsLoading(false);
		}
	};

	useEffect(() => {
		// Si no hay suscripción en el estado, cargarla
		if (!subscription) {
			fetchSubscription();
		} else {
			// Log temporal para ver todas las características
			console.log("=== TODAS LAS CARACTERÍSTICAS DE LA SUSCRIPCIÓN ===");
			console.log("Plan:", subscription.plan);
			console.log("Status:", subscription.status);
			console.log("\n--- LÍMITES (subscription.limits) ---");
			console.log("Folders:", subscription.limits?.folders);
			console.log("Calculators:", subscription.limits?.calculators);
			console.log("Contacts:", subscription.limits?.contacts);
			console.log("Storage:", subscription.limits?.storage);
			console.log("\n--- CARACTERÍSTICAS (subscription.features) ---");
			if (subscription.features) {
				Object.entries(subscription.features).forEach(([key, value]) => {
					console.log(`${key}:`, value);
				});
			}
			console.log("\n--- OBJETO COMPLETO ---");
			console.log(subscription);

			// Si hay un cambio de plan pendiente, guardarlo
			if (subscription.pendingPlanChange) {
				setNextPlan(getStripeValue(subscription.pendingPlanChange.planId));
			}
		}
	}, [subscription]);

	// Cargar historial de pagos cuando se carga la suscripción
	useEffect(() => {
		if (subscription && !payments.length) {
			loadPaymentHistory();
		}
	}, [subscription]);

	const formatDate = (dateString: string | Date) => {
		if (!dateString) return "No disponible";

		const date = typeof dateString === "string" ? new Date(dateString) : dateString;
		return new Intl.DateTimeFormat("es-ES", {
			day: "2-digit",
			month: "long",
			year: "numeric",
		}).format(date);
	};

	const getStatusChip = (status: string) => {
		// Si el plan es gratuito, siempre mostrar como activa independientemente del estado
		if (subscription && subscription.plan === "free") {
			return <Chip label="Activa" color="success" size="small" />;
		}

		// Para otros planes, mostrar el estado normal
		switch (status) {
			case "active":
				return <Chip label="Activa" color="success" size="small" />;
			case "canceled":
				return <Chip label="Cancelada" color="error" size="small" />;
			case "past_due":
				return <Chip label="Pago pendiente" color="warning" size="small" />;
			case "trialing":
				return <Chip label="Período de prueba" color="info" size="small" />;
			case "incomplete":
				return <Chip label="Procesando pago" color="info" size="small" />;
			default:
				return <Chip label={status} color="default" size="small" />;
		}
	};

	const getPlanName = (planId: string) => {
		switch (planId) {
			case "free":
				return "Plan Gratuito";
			case "standard":
				return "Plan Estándar";
			case "premium":
				return "Plan Premium";
			default:
				return planId;
		}
	};

	// Formatear cantidad monetaria
	const formatAmount = (amount: number, currency: string) => {
		const formatter = new Intl.NumberFormat("es-ES", {
			style: "currency",
			currency: currency || "EUR",
			minimumFractionDigits: 2,
		});
		return formatter.format(amount);
	};

	// Obtener estado de factura
	const getPaymentStatusChip = (status: string) => {
		switch (status) {
			case "paid":
				return <Chip label="Pagada" color="success" size="small" />;
			case "open":
				return <Chip label="Pendiente" color="warning" size="small" />;
			case "uncollectible":
				return <Chip label="Incobrable" color="error" size="small" />;
			case "void":
				return <Chip label="Anulada" color="default" size="small" />;
			default:
				return <Chip label={status} color="default" size="small" />;
		}
	};

	// Ver la factura personalizada
	const handleViewInvoice = (payment: Payment) => {
		setSelectedPayment(payment);
		setInvoiceDialogOpen(true);
	};

	// Cerrar el diálogo de factura
	const handleCloseInvoiceDialog = () => {
		setInvoiceDialogOpen(false);
	};

	// Mostrar el diálogo de confirmación de cancelación
	const handleOpenCancelDialog = () => {
		setCancelDialogOpen(true);
	};

	// Cerrar el diálogo de confirmación
	const handleCloseCancelDialog = () => {
		setCancelDialogOpen(false);
	};

	const handleChangePlan = () => {
		// Redirigir a la página de planes
		window.location.href = "/suscripciones/tables";
	};

	// Cancelar la suscripción
	const handleCancelSubscription = async () => {
		try {
			setCancelLoading(true);

			// Llamar al servicio de API para cancelar la suscripción
			const response = await ApiService.cancelSubscription(true);

			if (response.success) {
				// Mostrar mensaje de éxito
				setSuccessMessage("Tu suscripción se cancelará al final del período actual");
				// Actualizar los datos de la suscripción en Redux
				if (response.data && response.data.subscription) {
					dispatch(updateSubscription(response.data.subscription));
				} else {
					// Si no viene la suscripción actualizada, recargarla
					await fetchSubscription();
				}
			} else {
				// Mostrar error
				setError("No se pudo cancelar la suscripción");
				setTimeout(() => setError(null), 5000);
			}
		} catch (err: any) {
			setError(err.message || "Error al cancelar la suscripción");
			setTimeout(() => setError(null), 5000);
		} finally {
			setCancelLoading(false);
			setCancelDialogOpen(false);
		}
	};

	// Reactivar la suscripción cancelada
	const handleReactivateSubscription = async () => {
		try {
			setReactivateLoading(true);
			setError(null);

			// Llamar al servicio de API para cancelar el downgrade programado
			const response = await ApiService.cancelScheduledDowngrade();

			if (response.success) {
				// Mostrar mensaje de éxito
				setSuccessMessage("Tu suscripción ha sido reactivada correctamente");
				// Actualizar los datos de la suscripción en Redux
				if (response.data && response.data.subscription) {
					dispatch(updateSubscription(response.data.subscription));
				} else if (response.subscription) {
					// También verificar directamente en response por si viene en el nivel superior
					dispatch(updateSubscription(response.subscription));
				} else {
					// Si no viene la suscripción actualizada, recargarla
					await fetchSubscription();
				}
			} else {
				// Mostrar error
				setError("No se pudo reactivar la suscripción: " + (response.message || "Error desconocido"));
				setTimeout(() => setError(null), 5000);
			}
		} catch (err: any) {
			setError(err.message || "Error al reactivar la suscripción");
			setTimeout(() => setError(null), 5000);
		} finally {
			setReactivateLoading(false);
		}
	};

	// Cerrar el mensaje de éxito
	const handleCloseSuccessMessage = () => {
		setSuccessMessage(null);
	};

	// Función para calcular días restantes en el período de gracia
	const calculateRemainingDays = (expiryDate: string | Date): number => {
		if (!expiryDate) return 0;

		const expiry = new Date(expiryDate);
		const today = new Date();

		const diffTime = expiry.getTime() - today.getTime();
		const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24));

		return Math.max(0, diffDays); // Garantizar que no sea negativo
	};

	// Función para determinar el estado del período de gracia
	const getGracePeriodStatus = (expiryDate: string | Date): "future" | "today" | "past" => {
		if (!expiryDate) return "past";

		const expiry = new Date(expiryDate);
		const today = new Date();

		// Normalizar las fechas para comparar solo día/mes/año
		expiry.setHours(0, 0, 0, 0);
		today.setHours(0, 0, 0, 0);

		if (expiry.getTime() > today.getTime()) {
			return "future";
		} else if (expiry.getTime() === today.getTime()) {
			return "today";
		} else {
			return "past";
		}
	};

	// Función para obtener el mensaje del período de gracia según el estado
	const getGracePeriodMessage = (expiryDate: string | Date): string => {
		const status = getGracePeriodStatus(expiryDate);
		const formattedDate = formatDate(expiryDate);

		switch (status) {
			case "future":
				return `Después de la cancelación, tendrás hasta el ${formattedDate} para archivar el contenido que exceda los límites del plan gratuito.`;
			case "today":
				return `Hoy es el último día para archivar el contenido que exceda los límites del plan gratuito. El sistema archivará automáticamente el contenido excedente al finalizar el día.`;
			case "past":
				return `El período de gracia finalizó el ${formattedDate}. El contenido que excedía los límites del plan gratuito ha sido archivado automáticamente.`;
			default:
				return `Después de la cancelación, tendrás hasta el ${formattedDate} para archivar el contenido que exceda los límites del plan gratuito.`;
		}
	};

	// Función para obtener toda la información del período de gracia
	const getGracePeriodInfo = () => {
		// Verificar que subscription existe
		if (!subscription) return null;

		// No mostrar información para plan gratuito sin plan previo
		if (
			!subscription ||
			!subscription.downgradeGracePeriod ||
			(subscription.plan === "free" && !subscription.downgradeGracePeriod.previousPlan)
		)
			return null;

		const willDowngradeToFreePlan = subscription.cancelAtPeriodEnd && subscription.plan !== "free";
		const previousPlanName = getPlanName(subscription.downgradeGracePeriod.previousPlan);
		const currentPlanName = getPlanName(subscription.plan);
		const targetPlanName = willDowngradeToFreePlan ? "Plan Gratuito" : currentPlanName;

		const expiryDate = subscription.downgradeGracePeriod.expiresAt;
		const daysRemaining = calculateRemainingDays(expiryDate);
		const isExpiringSoon = daysRemaining <= 3;

		return {
			willDowngradeToFreePlan,
			previousPlanName,
			currentPlanName,
			targetPlanName,
			expiryDate,
			expiryFormatted: formatDate(expiryDate),
			daysRemaining,
			isExpiringSoon,
			cancellationDate: subscription.currentPeriodEnd,
			cancellationFormatted: formatDate(subscription.currentPeriodEnd),
			title: willDowngradeToFreePlan ? "Período de Gracia por Cancelación" : "Período de Gracia por Cambio de Plan",
		};
	};

	if (loading) {
		return (
			<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Alert severity="error" sx={{ mt: 2 }}>
				{error}
			</Alert>
		);
	}

	if (!subscription) {
		return <Alert severity="info">No se encontró información de suscripción. Por favor, contacta con soporte.</Alert>;
	}

	// Determinar si se debe mostrar el botón de cancelación
	const showCancelButton =
		subscription && subscription.plan !== "free" && subscription.status === "active" && !subscription.cancelAtPeriodEnd;

	// Determinar si se debe mostrar el botón de reactivación (cuando hay una cancelación programada)
	const showReactivateButton =
		subscription && subscription.plan !== "free" && subscription.status === "active" && subscription.cancelAtPeriodEnd;

	// Determinar si hay un período de renovación
	const hasRenewalDate = subscription && subscription.currentPeriodEnd && subscription.status === "active";

	return (
		<Grid container spacing={3}>
			<Grid item xs={12}>
				<MainCard
					title="Detalles de suscripción"
					sx={{
						boxShadow: "0 4px 20px 0 rgba(0,0,0,0.05)",
						overflow: "hidden",
						position: "relative",
					}}
				>
					<Grid container spacing={3}>
						<Grid item xs={12} md={6}>
							<Stack spacing={2.5}>
								<Stack direction="row" justifyContent="space-between" alignItems="center">
									<Typography variant="h5" sx={{ fontWeight: 600 }}>
										Plan actual
									</Typography>
									{subscription && getStatusChip(subscription.status)}
								</Stack>

								<Typography variant="h3" color="primary" sx={{ fontWeight: 700 }}>
									{subscription ? getPlanName(subscription.plan) : "No disponible"}
								</Typography>

								{hasRenewalDate && !subscription.cancelAtPeriodEnd && (
									<Box
										sx={{
											display: "flex",
											alignItems: "center",
											py: 1,
											px: 2,
											bgcolor: "primary.lighter",
											borderRadius: 1.5,
										}}
									>
										<Typography variant="body2" color="primary.dark" sx={{ fontWeight: 500 }}>
											Tu suscripción se renovará el {subscription && formatDate(subscription.currentPeriodEnd)}
										</Typography>
									</Box>
								)}

								{subscription && subscription.cancelAtPeriodEnd && (
									<>
										<Box
											sx={{
												display: "flex",
												alignItems: "center",
												py: 1,
												px: 2,
												bgcolor: "warning.lighter",
												borderRadius: 1.5,
											}}
										>
											<Typography variant="body2" color="warning.dark" sx={{ fontWeight: 500 }}>
												{subscription && new Date(subscription.currentPeriodEnd) < new Date()
													? `Tu suscripción terminó el ${formatDate(subscription.currentPeriodEnd)}`
													: `Tu suscripción terminará el ${subscription && formatDate(subscription.currentPeriodEnd)}`}
											</Typography>
										</Box>

										{subscription &&
											subscription.downgradeGracePeriod &&
											(subscription.plan !== "free" || subscription.downgradeGracePeriod.previousPlan) && (
												<Alert
													severity="warning"
													variant="outlined"
													sx={{
														mt: 1,
														borderWidth: 1.5,
														borderRadius: 1.5,
														"& .MuiAlert-icon": { color: "warning.dark" },
													}}
												>
													<Typography variant="body2">{getGracePeriodMessage(subscription.downgradeGracePeriod.expiresAt)}</Typography>
												</Alert>
											)}
									</>
								)}

								{nextPlan && (
									<Alert
										severity="info"
										variant="outlined"
										sx={{
											mt: 1,
											borderWidth: 1.5,
											borderRadius: 1.5,
											"& .MuiAlert-icon": { color: "primary.main" },
										}}
									>
										<Typography variant="body2" sx={{ fontWeight: 500 }}>
											Cambiarás al {getPlanName(nextPlan)} en la próxima renovación.
										</Typography>
									</Alert>
								)}
							</Stack>
						</Grid>

						<Grid item xs={12} md={6}>
							<Stack spacing={2} alignItems={{ xs: "flex-start", md: "flex-end" }} sx={{ height: "100%", justifyContent: "center" }}>
								<Button variant="contained" color="primary" onClick={handleChangePlan}>
									Cambiar plan
								</Button>

								{showCancelButton && (
									<Button variant="outlined" color="error" onClick={handleOpenCancelDialog}>
										Cancelar suscripción
									</Button>
								)}

								{showReactivateButton && (
									<Button
										variant="outlined"
										color="success"
										onClick={handleReactivateSubscription}
										disabled={reactivateLoading}
										startIcon={reactivateLoading ? <CircularProgress size={20} /> : null}
									>
										Reactivar suscripción
									</Button>
								)}
							</Stack>
						</Grid>
					</Grid>

					<Divider sx={{ mt: 4, mb: 3 }} />

					<Grid container spacing={4}>
						<Grid item xs={12} md={6}>
							<Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
								Límites de recursos
							</Typography>

							<List
								sx={{
									bgcolor: "background.neutral",
									borderRadius: 2,
									p: 2,
									"& .MuiListItem-root": {
										borderBottom: "1px solid",
										borderColor: "divider",
										"&:last-child": {
											borderBottom: "none",
										},
									},
								}}
							>
								<ListItem sx={{ px: 1, py: 1 }}>
									<ListItemText
										primary={
											<Typography color="text.secondary" variant="subtitle2">
												Carpetas
											</Typography>
										}
										secondary={
											<Typography variant="body1" fontWeight={600} color="text.primary" sx={{ mt: 0.5 }}>
												{(() => {
													const folders = subscription?.limits?.folders;
													if (folders === undefined) return "No disponible";
													return folders === 999999 ? "Ilimitadas" : folders;
												})()}
											</Typography>
										}
									/>
								</ListItem>
								<ListItem sx={{ px: 1, py: 1 }}>
									<ListItemText
										primary={
											<Typography color="text.secondary" variant="subtitle2">
												Cálculos
											</Typography>
										}
										secondary={
											<Typography variant="body1" fontWeight={600} color="text.primary" sx={{ mt: 0.5 }}>
												{(() => {
													const calculators = subscription?.limits?.calculators;
													if (calculators === undefined) return "No disponible";
													return calculators === 999999 ? "Ilimitados" : calculators;
												})()}
											</Typography>
										}
									/>
								</ListItem>
								<ListItem sx={{ px: 1, py: 1 }}>
									<ListItemText
										primary={
											<Typography color="text.secondary" variant="subtitle2">
												Contactos
											</Typography>
										}
										secondary={
											<Typography variant="body1" fontWeight={600} color="text.primary" sx={{ mt: 0.5 }}>
												{(() => {
													const contacts = subscription?.limits?.contacts;
													if (contacts === undefined) return "No disponible";
													return contacts === 999999 ? "Ilimitados" : contacts;
												})()}
											</Typography>
										}
									/>
								</ListItem>
								<ListItem sx={{ px: 1, py: 1 }}>
									<ListItemText
										primary={
											<Typography color="text.secondary" variant="subtitle2">
												Almacenamiento
											</Typography>
										}
										secondary={
											<Typography variant="body1" fontWeight={600} color="text.primary" sx={{ mt: 0.5 }}>
												{(() => {
													const storage = subscription?.limits?.storage;
													if (storage === undefined) return "No disponible";
													return `${storage} MB`;
												})()}
											</Typography>
										}
									/>
								</ListItem>
							</List>
						</Grid>

						<Grid item xs={12} md={6}>
							<Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 600 }}>
								Características
							</Typography>

							<List
								sx={{
									bgcolor: "background.neutral",
									borderRadius: 2,
									p: 2,
									"& .MuiListItem-root": {
										borderBottom: "1px solid",
										borderColor: "divider",
										"&:last-child": {
											borderBottom: "none",
										},
									},
								}}
							>
								<ListItem sx={{ px: 1, py: 1.25 }}>
									<ListItemText
										primary={
											<Typography color="text.primary" variant="subtitle2">
												Análisis avanzados
											</Typography>
										}
									/>
									{subscription?.features?.advancedAnalytics ? (
										<Chip label="Activo" color="success" size="small" sx={{ fontWeight: 600, borderRadius: 1 }} />
									) : (
										<Chip label="No disponible" color="default" size="small" sx={{ fontWeight: 600, borderRadius: 1 }} />
									)}
								</ListItem>
								<ListItem sx={{ px: 1, py: 1.25 }}>
									<ListItemText
										primary={
											<Typography color="text.primary" variant="subtitle2">
												Exportación de reportes
											</Typography>
										}
									/>
									{subscription?.features?.exportReports ? (
										<Chip label="Activo" color="success" size="small" sx={{ fontWeight: 600, borderRadius: 1 }} />
									) : (
										<Chip label="No disponible" color="default" size="small" sx={{ fontWeight: 600, borderRadius: 1 }} />
									)}
								</ListItem>
								<ListItem sx={{ px: 1, py: 1.25 }}>
									<ListItemText
										primary={
											<Typography color="text.primary" variant="subtitle2">
												Automatización de tareas
											</Typography>
										}
									/>
									{subscription?.features?.taskAutomation ? (
										<Chip label="Activo" color="success" size="small" sx={{ fontWeight: 600, borderRadius: 1 }} />
									) : (
										<Chip label="No disponible" color="default" size="small" sx={{ fontWeight: 600, borderRadius: 1 }} />
									)}
								</ListItem>
								<ListItem sx={{ px: 1, py: 1.25 }}>
									<ListItemText
										primary={
											<Typography color="text.primary" variant="subtitle2">
												Operaciones masivas
											</Typography>
										}
									/>
									{subscription?.features?.bulkOperations ? (
										<Chip label="Activo" color="success" size="small" sx={{ fontWeight: 600, borderRadius: 1 }} />
									) : (
										<Chip label="No disponible" color="default" size="small" sx={{ fontWeight: 600, borderRadius: 1 }} />
									)}
								</ListItem>
								<ListItem sx={{ px: 1, py: 1.25 }}>
									<ListItemText
										primary={
											<Typography color="text.primary" variant="subtitle2">
												Soporte prioritario
											</Typography>
										}
									/>
									{subscription?.features?.prioritySupport ? (
										<Chip label="Activo" color="success" size="small" sx={{ fontWeight: 600, borderRadius: 1 }} />
									) : (
										<Chip label="No disponible" color="default" size="small" sx={{ fontWeight: 600, borderRadius: 1 }} />
									)}
								</ListItem>
								<ListItem sx={{ px: 1, py: 1.25 }}>
									<ListItemText
										primary={
											<Typography color="text.primary" variant="subtitle2">
												Movimientos judiciales
											</Typography>
										}
									/>
									{subscription?.features?.movements ? (
										<Chip label="Activo" color="success" size="small" sx={{ fontWeight: 600, borderRadius: 1 }} />
									) : (
										<Chip label="No disponible" color="default" size="small" sx={{ fontWeight: 600, borderRadius: 1 }} />
									)}
								</ListItem>
								<ListItem sx={{ px: 1, py: 1.25 }}>
									<ListItemText
										primary={
											<Typography color="text.primary" variant="subtitle2">
												Vincular carpetas
											</Typography>
										}
									/>
									{subscription?.features?.vinculateFolders ? (
										<Chip label="Activo" color="success" size="small" sx={{ fontWeight: 600, borderRadius: 1 }} />
									) : (
										<Chip label="No disponible" color="default" size="small" sx={{ fontWeight: 600, borderRadius: 1 }} />
									)}
								</ListItem>
								<ListItem sx={{ px: 1, py: 1.25 }}>
									<ListItemText
										primary={
											<Typography color="text.primary" variant="subtitle2">
												Sistema de reservas
											</Typography>
										}
									/>
									{subscription?.features?.booking ? (
										<Chip label="Activo" color="success" size="small" sx={{ fontWeight: 600, borderRadius: 1 }} />
									) : (
										<Chip label="No disponible" color="default" size="small" sx={{ fontWeight: 600, borderRadius: 1 }} />
									)}
								</ListItem>
							</List>
						</Grid>
					</Grid>

					{/* Información adicional sobre la suscripción */}
					{subscription && subscription.plan !== "free" && (
						<Box
							sx={{
								mt: 4,
								bgcolor: "primary.lighter",
								borderRadius: 2,
								p: 2.5,
							}}
						>
							<Typography variant="h5" gutterBottom sx={{ mb: 2, fontWeight: 600, color: "primary.dark" }}>
								Información de la suscripción
							</Typography>

							<Grid container spacing={3}>
								<Grid item xs={12} sm={6} md={4}>
									<Typography color="primary.dark" variant="subtitle2">
										ID de cliente
									</Typography>
									<Typography variant="body2" sx={{ wordBreak: "break-all", mt: 0.5 }}>
										{subscription ? getStripeValue(subscription.stripeCustomerId) : "No disponible"}
									</Typography>
								</Grid>

								<Grid item xs={12} sm={6} md={4}>
									<Typography color="primary.dark" variant="subtitle2">
										ID de suscripción
									</Typography>
									<Typography variant="body2" sx={{ wordBreak: "break-all", mt: 0.5 }}>
										{subscription ? getStripeValue(subscription.stripeSubscriptionId) : "No disponible"}
									</Typography>
								</Grid>

								<Grid item xs={12} sm={6} md={4}>
									<Typography color="primary.dark" variant="subtitle2">
										Fecha de inicio
									</Typography>
									<Typography variant="body2" sx={{ mt: 0.5 }}>
										{subscription && formatDate(subscription.currentPeriodStart)}
									</Typography>
								</Grid>
							</Grid>
						</Box>
					)}
				</MainCard>
			</Grid>

			{/* Sección de Período de Gracia */}
			{subscription &&
				subscription.downgradeGracePeriod &&
				(subscription.plan !== "free" || subscription.downgradeGracePeriod.previousPlan) && (
					<Grid item xs={12}>
						<MainCard
							title={getGracePeriodInfo()?.title || "Período de Gracia"}
							sx={{
								boxShadow: "0 4px 20px 0 rgba(0,0,0,0.05)",
								overflow: "hidden",
								position: "relative",
							}}
						>
							<Box
								sx={{
									bgcolor: "background.neutral",
									p: 2.5,
									borderRadius: 2,
								}}
							>
								<Grid container spacing={3}>
									<Grid item xs={12}>
										{getGracePeriodStatus(subscription.downgradeGracePeriod.expiresAt) === "past" ? (
											<Alert
												severity="info"
												variant="outlined"
												sx={{
													mb: 3,
													borderRadius: 2,
												}}
											>
												<Stack spacing={1}>
													<Typography variant="subtitle1" fontWeight={600}>
														Período de gracia finalizado
													</Typography>
													<Typography variant="body2">
														El período de gracia finalizó el {formatDate(subscription.downgradeGracePeriod.expiresAt)}. El contenido que
														excedía los límites de tu {getGracePeriodInfo()?.willDowngradeToFreePlan ? "plan gratuito" : "plan actual"} ha
														sido archivado automáticamente.
													</Typography>
												</Stack>
											</Alert>
										) : (
											<Alert
												severity="warning"
												variant="outlined"
												sx={{
													mb: 3,
													borderRadius: 2,
												}}
											>
												<Stack spacing={1}>
													<Typography variant="subtitle1" fontWeight={600}>
														{getGracePeriodInfo()?.willDowngradeToFreePlan
															? `Tu plan ${getGracePeriodInfo()?.previousPlanName} será cambiado al Plan Gratuito el ${
																	getGracePeriodInfo()?.cancellationFormatted
															  }`
															: `Tu plan ha cambiado de ${getGracePeriodInfo()?.previousPlanName} a ${
																	getGracePeriodInfo()?.currentPlanName
															  }`}
													</Typography>
													<Typography variant="body2">Tienes un período de gracia para ajustar tus datos a los nuevos límites.</Typography>
												</Stack>
											</Alert>
										)}
									</Grid>

									<Grid item xs={12}>
										<Grid container spacing={4}>
											<Grid item xs={12} sm={4}>
												<Box
													sx={{
														bgcolor: "background.paper",
														p: 2.5,
														borderRadius: 2,
														boxShadow: "0 2px 12px 0 rgba(0,0,0,0.04)",
														height: "100%",
													}}
												>
													<Stack spacing={1.5} alignItems="center" textAlign="center">
														<Box
															sx={{
																width: 48,
																height: 48,
																borderRadius: "50%",
																bgcolor: "primary.lighter",
																display: "flex",
																alignItems: "center",
																justifyContent: "center",
																mb: 0.5,
															}}
														>
															<Typography variant="h5" color="primary.dark">
																P
															</Typography>
														</Box>
														<Typography color="text.secondary" variant="body2" fontWeight={500}>
															Plan anterior
														</Typography>
														<Typography variant="h5" color="text.primary">
															{getGracePeriodInfo()?.previousPlanName}
														</Typography>
													</Stack>
												</Box>
											</Grid>

											<Grid item xs={12} sm={4}>
												<Box
													sx={{
														bgcolor: "background.paper",
														p: 2.5,
														borderRadius: 2,
														boxShadow: "0 2px 12px 0 rgba(0,0,0,0.04)",
														height: "100%",
													}}
												>
													<Stack spacing={1.5} alignItems="center" textAlign="center">
														<Box
															sx={{
																width: 48,
																height: 48,
																borderRadius: "50%",
																bgcolor: "error.lighter",
																display: "flex",
																alignItems: "center",
																justifyContent: "center",
																mb: 0.5,
															}}
														>
															<Typography variant="h5" color="error.dark">
																F
															</Typography>
														</Box>
														<Typography color="text.secondary" variant="body2" fontWeight={500}>
															Fecha límite
														</Typography>
														<Typography variant="h5" color="text.primary">
															{getGracePeriodInfo()?.expiryFormatted}
														</Typography>
													</Stack>
												</Box>
											</Grid>

											<Grid item xs={12} sm={4}>
												<Box
													sx={{
														bgcolor: "background.paper",
														p: 2.5,
														borderRadius: 2,
														boxShadow: "0 2px 12px 0 rgba(0,0,0,0.04)",
														height: "100%",
													}}
												>
													<Stack spacing={1.5} alignItems="center" textAlign="center">
														<Box
															sx={{
																width: 48,
																height: 48,
																borderRadius: "50%",
																bgcolor: getGracePeriodInfo()?.isExpiringSoon ? "error.lighter" : "warning.lighter",
																display: "flex",
																alignItems: "center",
																justifyContent: "center",
																mb: 0.5,
															}}
														>
															<Typography variant="h5" color={getGracePeriodInfo()?.isExpiringSoon ? "error.dark" : "warning.dark"}>
																D
															</Typography>
														</Box>
														<Typography color="text.secondary" variant="body2" fontWeight={500}>
															Días restantes
														</Typography>
														<Box
															sx={{ display: "flex", alignItems: "center", justifyContent: "center", flexDirection: "column", gap: 0.5 }}
														>
															<Typography variant="h5" color="text.primary">
																{getGracePeriodInfo()?.daysRemaining} días
															</Typography>
															{getGracePeriodInfo()?.isExpiringSoon && <Chip label="¡Expira pronto!" color="error" size="small" />}
														</Box>
													</Stack>
												</Box>
											</Grid>
										</Grid>
									</Grid>

									<Grid item xs={12}>
										<Box
											sx={{
												bgcolor: "background.paper",
												p: 2.5,
												borderRadius: 2,
												boxShadow: "0 2px 12px 0 rgba(0,0,0,0.04)",
												mt: 1,
											}}
										>
											{getGracePeriodStatus(subscription.downgradeGracePeriod.expiresAt) === "past" ? (
												<Typography variant="h6" gutterBottom color="text.primary" fontWeight={600}>
													Archivado automático completado
												</Typography>
											) : (
												<Typography variant="h6" gutterBottom color="text.primary" fontWeight={600}>
													¿Qué ocurre después de esta fecha?
												</Typography>
											)}

											<Typography variant="body1" paragraph sx={{ fontWeight: 500 }}>
												El sistema archivará automáticamente los elementos que excedan los límites de tu{" "}
												{getGracePeriodInfo()?.willDowngradeToFreePlan ? "nuevo plan gratuito" : "plan actual"}.
											</Typography>

											<Typography variant="body2" color="text.secondary" paragraph>
												Para evitar pérdida de acceso a tus datos importantes, te recomendamos revisar y ajustar manualmente tu contenido
												antes del vencimiento del período de gracia.
											</Typography>

											<Box sx={{ mt: 3, display: "flex", gap: 2, flexWrap: "wrap", justifyContent: "center" }}>
												<Button
													variant="contained"
													color="primary"
													onClick={() => navigate("/apps/folders/list")}
													size="large"
													sx={{
														px: 3,
														py: 1,
														fontWeight: 600,
														boxShadow: "0 4px 10px 0 rgba(0,0,0,0.1)",
														minWidth: 200,
													}}
												>
													Gestionar Carpetas
												</Button>
												<Button
													variant="contained"
													color="primary"
													onClick={() => navigate("/apps/calc/labor")}
													size="large"
													sx={{
														px: 3,
														py: 1,
														fontWeight: 600,
														boxShadow: "0 4px 10px 0 rgba(0,0,0,0.1)",
														minWidth: 200,
													}}
												>
													Gestionar Cálculos
												</Button>
												<Button
													variant="contained"
													color="primary"
													onClick={() => navigate("/apps/customer/customer-list")}
													size="large"
													sx={{
														px: 3,
														py: 1,
														fontWeight: 600,
														boxShadow: "0 4px 10px 0 rgba(0,0,0,0.1)",
														minWidth: 200,
													}}
												>
													Gestionar Contactos
												</Button>
											</Box>
										</Box>
									</Grid>
								</Grid>
							</Box>
						</MainCard>
					</Grid>
				)}

			{/* Comparación de límites cuando hay período de gracia */}
			{subscription &&
				subscription.downgradeGracePeriod &&
				(subscription.plan !== "free" || subscription.downgradeGracePeriod.previousPlan) && (
					<Grid item xs={12}>
						<MainCard
							title={
								<Stack direction="row" alignItems="center" spacing={1}>
									<Typography variant="h5" fontWeight={600}>
										Comparación de Límites
									</Typography>
									<Chip label="Importante" size="small" color="primary" sx={{ fontWeight: 600, borderRadius: 1 }} />
								</Stack>
							}
							sx={{
								boxShadow: "0 4px 20px 0 rgba(0,0,0,0.05)",
								overflow: "hidden",
							}}
						>
							<Stack spacing={2}>
								<Typography variant="body1" color="text.secondary" sx={{ mb: 1 }}>
									Revisa los cambios en los límites de tu cuenta para evitar la pérdida de acceso a tus recursos.
								</Typography>

								<TableContainer
									sx={{
										borderRadius: 2,
										boxShadow: "0 2px 12px 0 rgba(0,0,0,0.04)",
										"& .MuiTable-root": {
											borderCollapse: "separate",
											borderSpacing: "0",
										},
										"& .MuiTableHead-root": {
											backgroundColor: "background.neutral",
										},
										"& .MuiTableRow-root:last-child .MuiTableCell-root": {
											borderBottom: "none",
										},
									}}
								>
									<Table>
										<TableHead>
											<TableRow>
												<TableCell
													sx={{
														fontWeight: 600,
														fontSize: "0.875rem",
														py: 2,
														borderTopLeftRadius: 8,
														borderBottom: "2px solid",
														borderColor: "divider",
													}}
												>
													Recurso
												</TableCell>
												<TableCell
													align="center"
													sx={{
														fontWeight: 600,
														fontSize: "0.875rem",
														py: 2,
														borderBottom: "2px solid",
														borderColor: "divider",
													}}
												>
													<Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
														<Typography variant="subtitle2" color="primary.main" sx={{ mb: 0.5 }}>
															{getGracePeriodInfo()?.previousPlanName}
														</Typography>
														<Typography variant="caption" color="text.secondary">
															Plan Anterior
														</Typography>
													</Box>
												</TableCell>
												<TableCell
													align="center"
													sx={{
														fontWeight: 600,
														fontSize: "0.875rem",
														py: 2,
														borderTopRightRadius: 8,
														borderBottom: "2px solid",
														borderColor: "divider",
													}}
												>
													<Box sx={{ display: "flex", flexDirection: "column", alignItems: "center" }}>
														<Typography variant="subtitle2" color="warning.main" sx={{ mb: 0.5 }}>
															{getGracePeriodInfo()?.targetPlanName}
														</Typography>
														<Typography variant="caption" color="text.secondary">
															Nuevo Plan
														</Typography>
													</Box>
												</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											<TableRow hover>
												<TableCell
													sx={{
														fontWeight: 500,
														borderBottom: "1px solid",
														borderColor: "divider",
														py: 2,
													}}
												>
													Carpetas
												</TableCell>
												<TableCell
													align="center"
													sx={{
														fontWeight: 600,
														color: "primary.main",
														borderBottom: "1px solid",
														borderColor: "divider",
														py: 2,
													}}
												>
													{subscription && subscription.downgradeGracePeriod && subscription.downgradeGracePeriod.previousPlan === "premium"
														? "Ilimitadas"
														: subscription &&
														  subscription.downgradeGracePeriod &&
														  subscription.downgradeGracePeriod.previousPlan === "standard"
														? "50"
														: "5"}
												</TableCell>
												<TableCell
													align="center"
													sx={{
														fontWeight: 600,
														color: "text.primary",
														borderBottom: "1px solid",
														borderColor: "divider",
														py: 2,
													}}
												>
													{(() => {
														const maxFolders = getFeatureValue(subscription?.features, 'maxFolders');
														if (maxFolders === undefined) return "No disponible";
														return maxFolders === 999999 ? "Ilimitadas" : maxFolders;
													})()}
												</TableCell>
											</TableRow>
											<TableRow hover>
												<TableCell
													sx={{
														fontWeight: 500,
														borderBottom: "1px solid",
														borderColor: "divider",
														py: 2,
													}}
												>
													Calculadoras
												</TableCell>
												<TableCell
													align="center"
													sx={{
														fontWeight: 600,
														color: "primary.main",
														borderBottom: "1px solid",
														borderColor: "divider",
														py: 2,
													}}
												>
													{subscription && subscription.downgradeGracePeriod && subscription.downgradeGracePeriod.previousPlan === "premium"
														? "Ilimitadas"
														: subscription &&
														  subscription.downgradeGracePeriod &&
														  subscription.downgradeGracePeriod.previousPlan === "standard"
														? "20"
														: "3"}
												</TableCell>
												<TableCell
													align="center"
													sx={{
														fontWeight: 600,
														color: "text.primary",
														borderBottom: "1px solid",
														borderColor: "divider",
														py: 2,
													}}
												>
													{(() => {
														const maxCalculators = getFeatureValue(subscription?.features, 'maxCalculators');
														if (maxCalculators === undefined) return "No disponible";
														return maxCalculators === 999999 ? "Ilimitados" : maxCalculators;
													})()}
												</TableCell>
											</TableRow>
											<TableRow hover>
												<TableCell
													sx={{
														fontWeight: 500,
														borderBottom: "1px solid",
														borderColor: "divider",
														py: 2,
													}}
												>
													Contactos
												</TableCell>
												<TableCell
													align="center"
													sx={{
														fontWeight: 600,
														color: "primary.main",
														borderBottom: "1px solid",
														borderColor: "divider",
														py: 2,
													}}
												>
													{subscription && subscription.downgradeGracePeriod && subscription.downgradeGracePeriod.previousPlan === "premium"
														? "Ilimitados"
														: subscription &&
														  subscription.downgradeGracePeriod &&
														  subscription.downgradeGracePeriod.previousPlan === "standard"
														? "100"
														: "10"}
												</TableCell>
												<TableCell
													align="center"
													sx={{
														fontWeight: 600,
														color: "text.primary",
														borderBottom: "1px solid",
														borderColor: "divider",
														py: 2,
													}}
												>
													{(() => {
														const maxContacts = getFeatureValue(subscription?.features, 'maxContacts');
														if (maxContacts === undefined) return "No disponible";
														return maxContacts === 999999 ? "Ilimitados" : maxContacts;
													})()}
												</TableCell>
											</TableRow>
											<TableRow hover>
												<TableCell
													sx={{
														fontWeight: 500,
														py: 2,
													}}
												>
													Almacenamiento
												</TableCell>
												<TableCell
													align="center"
													sx={{
														fontWeight: 600,
														color: "primary.main",
														py: 2,
													}}
												>
													{subscription && subscription.downgradeGracePeriod && subscription.downgradeGracePeriod.previousPlan === "premium"
														? "10 GB"
														: subscription &&
														  subscription.downgradeGracePeriod &&
														  subscription.downgradeGracePeriod.previousPlan === "standard"
														? "1 GB"
														: "50 MB"}
												</TableCell>
												<TableCell
													align="center"
													sx={{
														fontWeight: 600,
														color: "text.primary",
														py: 2,
													}}
												>
													{(() => {
														const storageLimit = getFeatureValue(subscription?.features, 'storageLimit');
														if (storageLimit === undefined) return "No disponible";
														return storageLimit >= 1024 ? `${storageLimit / 1024} GB` : `${storageLimit} MB`;
													})()}
												</TableCell>
											</TableRow>
										</TableBody>
									</Table>
								</TableContainer>

								<Alert
									severity="info"
									variant="outlined"
									sx={{
										mt: 2,
										borderRadius: 2,
										borderWidth: 1.5,
									}}
								>
									<Typography variant="body2">
										<strong>Recomendación:</strong> Para evitar la pérdida automática de datos, ajusta manualmente tus recursos a los nuevos
										límites antes de que finalice el período de gracia.
									</Typography>
								</Alert>
							</Stack>
						</MainCard>
					</Grid>
				)}

			<Grid item xs={12}>
				<MainCard
					title={
						<Stack direction="row" alignItems="center" spacing={2}>
							<Typography variant="h5" fontWeight={600}>
								Historial de facturación
							</Typography>
							{payments.length > 0 && (
								<Chip
									label={`${payments.length} ${payments.length === 1 ? "factura" : "facturas"}`}
									size="small"
									color="primary"
									variant="outlined"
									sx={{ fontWeight: 500, borderRadius: 1 }}
								/>
							)}
						</Stack>
					}
					sx={{
						boxShadow: "0 4px 20px 0 rgba(0,0,0,0.05)",
						overflow: "hidden",
					}}
				>
					<>
						{paymentsLoading ? (
							<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", py: 5 }}>
								<CircularProgress size={30} thickness={3} />
							</Box>
						) : paymentsError ? (
							<Alert
								severity="error"
								variant="filled"
								sx={{
									mt: 2,
									borderRadius: 2,
									boxShadow: "0 4px 12px 0 rgba(0,0,0,0.06)",
								}}
							>
								<Typography variant="body2">{paymentsError}</Typography>
							</Alert>
						) : payments.length === 0 ? (
							<Box
								sx={{
									display: "flex",
									flexDirection: "column",
									alignItems: "center",
									justifyContent: "center",
									py: 5,
									bgcolor: "background.neutral",
									borderRadius: 2,
								}}
							>
								<Typography variant="body1" color="text.secondary" sx={{ mb: 2 }}>
									No se encontraron facturas para esta cuenta.
								</Typography>
								<Button variant="outlined" color="primary" size="small" sx={{ borderRadius: 2 }} onClick={handleChangePlan}>
									Explorar planes
								</Button>
							</Box>
						) : (
							<>
								<Box sx={{ overflowX: "auto" }}>
									<TableContainer
										sx={{
											borderRadius: 2,
											boxShadow: "0 2px 12px 0 rgba(0,0,0,0.04)",
											"& .MuiTable-root": {
												borderCollapse: "separate",
												borderSpacing: "0",
											},
											"& .MuiTableHead-root": {
												backgroundColor: "background.neutral",
											},
											"& .MuiTableRow-root:last-child .MuiTableCell-root": {
												borderBottom: "none",
											},
										}}
									>
										<Table>
											<TableHead>
												<TableRow>
													<TableCell
														sx={{
															fontWeight: 600,
															fontSize: "0.875rem",
															py: 2,
															borderTopLeftRadius: 8,
															borderBottom: "2px solid",
															borderColor: "divider",
														}}
													>
														Número
													</TableCell>
													<TableCell
														sx={{
															fontWeight: 600,
															fontSize: "0.875rem",
															py: 2,
															borderBottom: "2px solid",
															borderColor: "divider",
														}}
													>
														Fecha
													</TableCell>
													<TableCell
														sx={{
															fontWeight: 600,
															fontSize: "0.875rem",
															py: 2,
															borderBottom: "2px solid",
															borderColor: "divider",
														}}
													>
														Importe
													</TableCell>
													<TableCell
														sx={{
															fontWeight: 600,
															fontSize: "0.875rem",
															py: 2,
															borderBottom: "2px solid",
															borderColor: "divider",
														}}
													>
														Estado
													</TableCell>
													<TableCell
														align="center"
														sx={{
															fontWeight: 600,
															fontSize: "0.875rem",
															py: 2,
															borderTopRightRadius: 8,
															borderBottom: "2px solid",
															borderColor: "divider",
														}}
													>
														Acciones
													</TableCell>
												</TableRow>
											</TableHead>
											<TableBody>
												{payments.slice(0, showAllPayments ? payments.length : 3).map((payment) => (
													<TableRow key={payment.id} hover>
														<TableCell
															sx={{
																borderBottom: "1px solid",
																borderColor: "divider",
																py: 2,
																fontWeight: 500,
															}}
														>
															{payment.receiptNumber}
														</TableCell>
														<TableCell
															sx={{
																borderBottom: "1px solid",
																borderColor: "divider",
																py: 2,
															}}
														>
															{formatDate(payment.createdAt)}
														</TableCell>
														<TableCell
															sx={{
																borderBottom: "1px solid",
																borderColor: "divider",
																py: 2,
																fontWeight: 600,
															}}
														>
															{formatAmount(payment.amount, payment.currency)}
														</TableCell>
														<TableCell
															sx={{
																borderBottom: "1px solid",
																borderColor: "divider",
																py: 2,
															}}
														>
															{getPaymentStatusChip(payment.status)}
														</TableCell>
														<TableCell
															align="center"
															sx={{
																borderBottom: "1px solid",
																borderColor: "divider",
																py: 2,
															}}
														>
															<Button
																size="small"
																variant="contained"
																color="primary"
																onClick={() => handleViewInvoice(payment)}
																title="Ver factura"
																sx={{
																	borderRadius: 1.5,
																	px: 2,
																	py: 0.75,
																	minWidth: 0,
																	boxShadow: "none",
																	fontWeight: 600,
																}}
															>
																Ver
															</Button>
														</TableCell>
													</TableRow>
												))}
											</TableBody>
										</Table>
									</TableContainer>
								</Box>

								{payments.length > 3 && (
									<Box sx={{ mt: 3, display: "flex", justifyContent: "center" }}>
										<Button
											variant="outlined"
											color="primary"
											onClick={() => setShowAllPayments(!showAllPayments)}
											sx={{
												borderRadius: 2,
												px: 3,
												fontWeight: 500,
											}}
										>
											{showAllPayments ? "Ver menos facturas" : "Ver todas las facturas"}
										</Button>
									</Box>
								)}
							</>
						)}
					</>
				</MainCard>
			</Grid>

			<Grid item xs={12}>
				<Box
					sx={{
						bgcolor: "primary.lighter",
						p: 3,
						borderRadius: 3,
						textAlign: "center",
						boxShadow: "0 4px 20px 0 rgba(0,0,0,0.05)",
					}}
				>
					<Typography variant="h5" color="primary.dark" sx={{ mb: 2, fontWeight: 600 }}>
						¿Necesitas más recursos o características para tu negocio?
					</Typography>
					<Typography variant="body1" color="text.secondary" sx={{ mb: 3, maxWidth: 700, mx: "auto" }}>
						Explora nuestros planes y encuentra la opción perfecta para tus necesidades. Todos incluyen soporte técnico y actualizaciones
						regulares.
					</Typography>
					<Button
						variant="contained"
						color="primary"
						onClick={handleChangePlan}
						size="large"
						sx={{
							px: 4,
							py: 1.25,
							borderRadius: 2,
							fontWeight: 600,
							boxShadow: "0 6px 15px 0 rgba(0,0,0,0.15)",
							fontSize: "1rem",
						}}
					>
						Explorar planes
					</Button>
				</Box>
			</Grid>

			{/* Diálogo de confirmación para cancelar suscripción */}
			<Dialog
				open={cancelDialogOpen}
				onClose={handleCloseCancelDialog}
				aria-labelledby="cancel-subscription-dialog-title"
				aria-describedby="cancel-subscription-dialog-description"
				PaperProps={{
					sx: {
						borderRadius: 3,
						boxShadow: "0 10px 40px 0 rgba(0,0,0,0.1)",
						maxWidth: 500,
					},
				}}
			>
				<DialogTitle
					id="cancel-subscription-dialog-title"
					sx={{
						pb: 1,
						pt: 3,
						px: 3,
						fontWeight: 600,
					}}
				>
					Cancelar suscripción
				</DialogTitle>
				<DialogContent sx={{ p: 3 }}>
					<DialogContentText id="cancel-subscription-dialog-description" sx={{ color: "text.primary", mb: 2 }}>
						¿Estás seguro de que deseas cancelar tu suscripción?
					</DialogContentText>

					<Box
						sx={{
							bgcolor: "background.neutral",
							p: 2,
							borderRadius: 2,
							mb: 2,
						}}
					>
						<Typography variant="body2" color="text.secondary" paragraph sx={{ mb: 1 }}>
							Detalles importantes:
						</Typography>
						<Stack spacing={1}>
							<Typography variant="body2" color="text.primary" sx={{ display: "flex", alignItems: "center" }}>
								• Tu servicio seguirá activo hasta el {subscription && formatDate(subscription.currentPeriodEnd)}
							</Typography>
							<Typography variant="body2" color="text.primary" sx={{ display: "flex", alignItems: "center" }}>
								• Después de esta fecha, no se realizarán más cargos automáticos
							</Typography>
							{subscription && subscription.plan !== "free" && (
								<Typography variant="body2" color="text.primary" sx={{ display: "flex", alignItems: "center" }}>
									• Tendrás un período de gracia de 15 días para archivar contenido
								</Typography>
							)}
						</Stack>
					</Box>

					{subscription && subscription.plan !== "free" && (
						<Alert
							severity="info"
							variant="outlined"
							sx={{
								mb: 0,
								borderWidth: 1.5,
								borderRadius: 2,
								"& .MuiAlert-icon": { color: "primary.main" },
							}}
						>
							<Typography variant="body2">
								Después de cancelar, tendrás acceso limitado a tus recursos. Considera archivar o exportar datos importantes antes de que
								finalice tu suscripción.
							</Typography>
						</Alert>
					)}
				</DialogContent>
				<DialogActions sx={{ px: 3, pb: 3 }}>
					<Button onClick={handleCloseCancelDialog} color="primary">
						Mantener suscripción
					</Button>
					<Button
						onClick={handleCancelSubscription}
						color="error"
						variant="contained"
						disabled={cancelLoading}
						startIcon={cancelLoading ? <CircularProgress size={20} /> : null}
					>
						Confirmar cancelación
					</Button>
				</DialogActions>
			</Dialog>

			{/* Diálogo de factura personalizada */}
			<InvoiceView open={invoiceDialogOpen} onClose={handleCloseInvoiceDialog} payment={selectedPayment} />

			{/* Snackbar para mensajes de éxito */}
			<Snackbar
				open={!!successMessage}
				autoHideDuration={6000}
				onClose={handleCloseSuccessMessage}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
				sx={{
					"& .MuiSnackbarContent-root": {
						borderRadius: 2,
						boxShadow: "0 4px 20px 0 rgba(0,0,0,0.1)",
						paddingY: 1.5,
						backgroundColor: "success.main",
					},
				}}
			>
				<Alert
					severity="success"
					variant="filled"
					onClose={handleCloseSuccessMessage}
					sx={{
						borderRadius: 2,
						width: "100%",
						boxShadow: "0 4px 12px 0 rgba(0,0,0,0.06)",
						"& .MuiAlert-message": {
							fontWeight: 500,
						},
					}}
				>
					{successMessage}
				</Alert>
			</Snackbar>
		</Grid>
	);
};

export default TabSubscription;

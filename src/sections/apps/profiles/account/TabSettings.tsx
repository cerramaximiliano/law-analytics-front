import { useState, useEffect } from "react";

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
	TableHead,
	TableRow,
} from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import ApiService, { Payment } from "store/reducers/ApiService";
import InvoiceView from "./InvoiceView";

// ==============================|| ACCOUNT PROFILE - SUBSCRIPTION ||============================== //

const TabSubscription = () => {
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [subscription, setSubscription] = useState<any>(null);
	const [nextPlan, setNextPlan] = useState<string | null>(null);
	const [cancelDialogOpen, setCancelDialogOpen] = useState(false);
	const [cancelLoading, setCancelLoading] = useState(false);
	const [reactivateLoading, setReactivateLoading] = useState(false);
	const [successMessage, setSuccessMessage] = useState<string | null>(null);

	// Estado para las facturas
	const [payments, setPayments] = useState<Payment[]>([]);
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
			const response = await ApiService.getCurrentSubscription();

			// Hacer una aserción de tipo para la respuesta
			const responseData = response as unknown as {
				success: boolean;
				subscription?: any;
			};
			console.log("Datos de suscripción:", responseData);

			if (responseData.success && responseData.subscription) {
				setSubscription(responseData.subscription);

				// Si hay un cambio de plan pendiente, guardarlo
				if (responseData.subscription.pendingPlanChange) {
					setNextPlan(responseData.subscription.pendingPlanChange.planId);
				}
			} else {
				setError("No se pudo obtener la información de suscripción");
			}
		} catch (err) {
			console.error("Error al obtener datos de suscripción:", err);
			setError("Error al cargar los datos de suscripción");
		} finally {
			setLoading(false);
		}
	};

	// Función para cargar el historial de pagos desde la API
	const fetchPaymentHistory = async () => {
		// Verificar que la suscripción existe y no es un plan gratuito
		//if (!subscription || subscription.plan === "free") return;

		try {
			setPaymentsLoading(true);
			setPaymentsError(null);

			const response = await ApiService.getPaymentHistory();

			// Verificar la estructura de la respuesta según el tipo definido en ApiService
			if (response && response.success && response.data && response.data.payments) {
				setPayments(response.data.payments);
			} else if (response && response.success) {
				// Si la API devuelve un formato diferente, hacer un casting seguro
				const responseData = response as unknown as {
					success: boolean;
					paymentHistory?: Payment[];
				};


				if (responseData.paymentHistory && Array.isArray(responseData.paymentHistory)) {
					setPayments(responseData.paymentHistory);
				} else {
					console.error("Formato de respuesta inesperado:", response);
					setPaymentsError("No se pudo obtener el historial de pagos");
				}
			} else {
				console.error("Formato de respuesta inesperado:", response);
				setPaymentsError("No se pudo obtener el historial de pagos");
			}
		} catch (err: any) {
			console.error("Error al obtener historial de pagos:", err);
			setPaymentsError(err.message || "Error al cargar el historial de pagos");
		} finally {
			setPaymentsLoading(false);
		}
	};

	useEffect(() => {
		fetchSubscription();
	}, []);

	// Cargar historial de pagos cuando se carga la suscripción
	useEffect(() => {
		if (subscription) {
			fetchPaymentHistory();
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
				// Actualizar los datos de la suscripción
				await fetchSubscription();
			} else {
				// Mostrar error
				setError("No se pudo cancelar la suscripción");
				setTimeout(() => setError(null), 5000);
			}
		} catch (err: any) {
			console.error("Error al cancelar la suscripción:", err);
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
				// Actualizar los datos de la suscripción
				await fetchSubscription();
			} else {
				// Mostrar error
				setError("No se pudo reactivar la suscripción: " + (response.message || "Error desconocido"));
				setTimeout(() => setError(null), 5000);
			}
		} catch (err: any) {
			console.error("Error al reactivar la suscripción:", err);
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
	const showCancelButton = subscription.plan !== "free" && subscription.status === "active" && !subscription.cancelAtPeriodEnd;

	// Determinar si se debe mostrar el botón de reactivación (cuando hay una cancelación programada)
	const showReactivateButton = subscription.plan !== "free" && subscription.status === "active" && subscription.cancelAtPeriodEnd;

	// Determinar si hay un período de renovación
	const hasRenewalDate = subscription.currentPeriodEnd && subscription.status === "active";

	return (
		<Grid container spacing={3}>
			<Grid item xs={12}>
				<MainCard title="Detalles de suscripción">
					<Grid container spacing={3}>
						<Grid item xs={12} md={6}>
							<Stack spacing={2}>
								<Stack direction="row" justifyContent="space-between" alignItems="center">
									<Typography variant="h5">Plan actual</Typography>
									{getStatusChip(subscription.status)}
								</Stack>

								<Typography variant="h3" color="primary">
									{getPlanName(subscription.plan)}
								</Typography>

								{hasRenewalDate && !subscription.cancelAtPeriodEnd && (
									<Typography variant="body2" color="text.secondary">
										Tu suscripción se renovará el {formatDate(subscription.currentPeriodEnd)}
									</Typography>
								)}

								{subscription.cancelAtPeriodEnd && (
									<Typography variant="body2" color="warning.main">
										Tu suscripción terminará el {formatDate(subscription.currentPeriodEnd)}
									</Typography>
								)}

								{nextPlan && (
									<Alert severity="info" sx={{ mt: 1 }}>
										Cambiarás al {getPlanName(nextPlan)} en la próxima renovación.
									</Alert>
								)}
							</Stack>
						</Grid>

						<Grid item xs={12} md={6}>
							<Stack spacing={2} alignItems={{ xs: "flex-start", md: "flex-end" }}>
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

					<Grid container spacing={3}>
						<Grid item xs={12} md={6}>
							<Typography variant="h5" gutterBottom>
								Límites de recursos
							</Typography>

							<List>
								<ListItem sx={{ px: 0, py: 0.5 }}>
									<ListItemText
										primary={<Typography color="text.secondary">Carpetas</Typography>}
										secondary={<Typography variant="body1">{subscription.limits.maxFolders}</Typography>}
									/>
								</ListItem>
								<ListItem sx={{ px: 0, py: 0.5 }}>
									<ListItemText
										primary={<Typography color="text.secondary">Cálculos</Typography>}
										secondary={<Typography variant="body1">{subscription.limits.maxCalculators}</Typography>}
									/>
								</ListItem>
								<ListItem sx={{ px: 0, py: 0.5 }}>
									<ListItemText
										primary={<Typography color="text.secondary">Contactos</Typography>}
										secondary={<Typography variant="body1">{subscription.limits.maxContacts}</Typography>}
									/>
								</ListItem>
								<ListItem sx={{ px: 0, py: 0.5 }}>
									<ListItemText
										primary={<Typography color="text.secondary">Almacenamiento</Typography>}
										secondary={<Typography variant="body1">{subscription.limits.storageLimit} MB</Typography>}
									/>
								</ListItem>
							</List>
						</Grid>

						<Grid item xs={12} md={6}>
							<Typography variant="h5" gutterBottom>
								Características
							</Typography>

							<List>
								<ListItem sx={{ px: 0, py: 0.5 }}>
									<ListItemText primary={<Typography color="text.secondary">Análisis avanzados</Typography>} />
									{subscription.features.advancedAnalytics ? (
										<Chip label="Activo" color="success" size="small" />
									) : (
										<Chip label="No disponible" color="default" size="small" />
									)}
								</ListItem>
								<ListItem sx={{ px: 0, py: 0.5 }}>
									<ListItemText primary={<Typography color="text.secondary">Exportación de reportes</Typography>} />
									{subscription.features.exportReports ? (
										<Chip label="Activo" color="success" size="small" />
									) : (
										<Chip label="No disponible" color="default" size="small" />
									)}
								</ListItem>
								<ListItem sx={{ px: 0, py: 0.5 }}>
									<ListItemText primary={<Typography color="text.secondary">Automatización de tareas</Typography>} />
									{subscription.features.taskAutomation ? (
										<Chip label="Activo" color="success" size="small" />
									) : (
										<Chip label="No disponible" color="default" size="small" />
									)}
								</ListItem>
								<ListItem sx={{ px: 0, py: 0.5 }}>
									<ListItemText primary={<Typography color="text.secondary">Operaciones masivas</Typography>} />
									{subscription.features.bulkOperations ? (
										<Chip label="Activo" color="success" size="small" />
									) : (
										<Chip label="No disponible" color="default" size="small" />
									)}
								</ListItem>
								<ListItem sx={{ px: 0, py: 0.5 }}>
									<ListItemText primary={<Typography color="text.secondary">Soporte prioritario</Typography>} />
									{subscription.features.prioritySupport ? (
										<Chip label="Activo" color="success" size="small" />
									) : (
										<Chip label="No disponible" color="default" size="small" />
									)}
								</ListItem>
							</List>
						</Grid>
					</Grid>

					{/* Información adicional sobre la suscripción */}
					{subscription.plan !== "free" && (
						<Box sx={{ mt: 3 }}>
							<Divider sx={{ mb: 3 }} />
							<Typography variant="h5" gutterBottom>
								Información de la suscripción
							</Typography>

							<Grid container spacing={2}>
								<Grid item xs={12} sm={6} md={4}>
									<Typography color="text.secondary" variant="body2">
										ID de cliente
									</Typography>
									<Typography variant="body2" sx={{ wordBreak: "break-all" }}>
										{subscription.stripeCustomerId || "No disponible"}
									</Typography>
								</Grid>

								<Grid item xs={12} sm={6} md={4}>
									<Typography color="text.secondary" variant="body2">
										ID de suscripción
									</Typography>
									<Typography variant="body2" sx={{ wordBreak: "break-all" }}>
										{subscription.stripeSubscriptionId || "No disponible"}
									</Typography>
								</Grid>

								<Grid item xs={12} sm={6} md={4}>
									<Typography color="text.secondary" variant="body2">
										Fecha de inicio
									</Typography>
									<Typography variant="body2">{formatDate(subscription.currentPeriodStart)}</Typography>
								</Grid>
							</Grid>
						</Box>
					)}
				</MainCard>
			</Grid>

			<Grid item xs={12}>
				<MainCard title="Historial de facturación">
					<>
						{paymentsLoading ? (
							<Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
								<CircularProgress size={24} />
							</Box>
						) : paymentsError ? (
							<Alert severity="error" sx={{ mt: 2 }}>
								{paymentsError}
							</Alert>
						) : payments.length === 0 ? (
							<Typography variant="body1">No se encontraron facturas para esta cuenta.</Typography>
						) : (
							<>
								<Box sx={{ overflowX: "auto" }}>
									<Table>
										<TableHead>
											<TableRow>
												<TableCell>Número</TableCell>
												<TableCell>Fecha</TableCell>
												<TableCell>Importe</TableCell>
												<TableCell>Estado</TableCell>
												<TableCell align="right">Acciones</TableCell>
											</TableRow>
										</TableHead>
										<TableBody>
											{payments.slice(0, showAllPayments ? payments.length : 3).map((payment) => (
												<TableRow key={payment.id}>
													<TableCell>{payment.receiptNumber}</TableCell>
													<TableCell>{formatDate(payment.createdAt)}</TableCell>
													<TableCell>{formatAmount(payment.amount, payment.currency)}</TableCell>
													<TableCell>{getPaymentStatusChip(payment.status)}</TableCell>
													<TableCell align="right">
														<Button size="small" variant="text" onClick={() => handleViewInvoice(payment)} title="Ver factura">
															Ver
														</Button>
													</TableCell>
												</TableRow>
											))}
										</TableBody>
									</Table>
								</Box>

								{payments.length > 3 && (
									<Box sx={{ mt: 2, display: "flex", justifyContent: "center" }}>
										<Button variant="text" color="primary" onClick={() => setShowAllPayments(!showAllPayments)}>
											{showAllPayments ? "Ver menos" : "Ver todas"}
										</Button>
									</Box>
								)}
							</>
						)}
					</>

				</MainCard>
			</Grid>

			<Grid item xs={12}>
				<Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2}>
					<Button variant="contained" color="primary" onClick={handleChangePlan}>
						Explorar planes
					</Button>
				</Stack>
			</Grid>

			{/* Diálogo de confirmación para cancelar suscripción */}
			<Dialog
				open={cancelDialogOpen}
				onClose={handleCloseCancelDialog}
				aria-labelledby="cancel-subscription-dialog-title"
				aria-describedby="cancel-subscription-dialog-description"
			>
				<DialogTitle id="cancel-subscription-dialog-title">Cancelar suscripción</DialogTitle>
				<DialogContent>
					<DialogContentText id="cancel-subscription-dialog-description">
						¿Estás seguro de que deseas cancelar tu suscripción? Tu servicio seguirá activo hasta el final del período actual (
						{formatDate(subscription?.currentPeriodEnd)}), pero no se renovará automáticamente.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseCancelDialog} color="primary">
						No, mantener suscripción
					</Button>
					<Button
						onClick={handleCancelSubscription}
						color="error"
						disabled={cancelLoading}
						startIcon={cancelLoading ? <CircularProgress size={20} /> : null}
					>
						Sí, cancelar suscripción
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
				message={successMessage}
				anchorOrigin={{ vertical: "bottom", horizontal: "center" }}
			/>
		</Grid>
	);
};

export default TabSubscription;
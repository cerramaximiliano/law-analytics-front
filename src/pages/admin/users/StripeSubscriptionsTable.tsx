import { useEffect } from "react";
import { useDispatch, useSelector } from "react-redux";
import {
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Paper,
	Box,
	Typography,
	Button,
	Chip,
	CircularProgress,
	Alert,
	Stack,
	Card,
	CardContent,
	Grid,
} from "@mui/material";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { fetchStripeCustomers } from "../../../store/reducers/stripe-subscriptions";
import { StripeCustomer } from "../../../types/stripe-subscription";

const StripeSubscriptionsTable = () => {
	const dispatch = useDispatch();
	const { customers, stats, hasMore, nextCursor, loading, error } = useSelector((state: any) => state.stripeSubscriptions);

	useEffect(() => {
		dispatch(fetchStripeCustomers() as any);
	}, [dispatch]);

	const handleLoadMore = () => {
		if (hasMore && nextCursor) {
			dispatch(fetchStripeCustomers(nextCursor) as any);
		}
	};

	const getStatusColor = (status: string) => {
		switch (status) {
			case "active":
				return "success";
			case "canceled":
				return "default";
			case "past_due":
				return "error";
			case "trialing":
				return "info";
			case "unpaid":
				return "warning";
			default:
				return "default";
		}
	};

	const getStatusLabel = (status: string) => {
		switch (status) {
			case "active":
				return "Activo";
			case "canceled":
				return "Cancelado";
			case "past_due":
				return "Pago vencido";
			case "trialing":
				return "Período de prueba";
			case "unpaid":
				return "Impago";
			default:
				return status;
		}
	};

	const formatCurrency = (amount: number, currency: string) => {
		const formatter = new Intl.NumberFormat("es-AR", {
			style: "currency",
			currency: currency.toUpperCase(),
		});
		return formatter.format(amount);
	};

	const formatInterval = (interval: string) => {
		switch (interval) {
			case "month":
				return "Mensual";
			case "year":
				return "Anual";
			case "week":
				return "Semanal";
			case "day":
				return "Diario";
			default:
				return interval;
		}
	};

	if (loading && customers.length === 0) {
		return (
			<Box display="flex" justifyContent="center" alignItems="center" minHeight={400}>
				<CircularProgress />
			</Box>
		);
	}

	if (error) {
		return (
			<Box p={3}>
				<Alert severity="error">{error}</Alert>
			</Box>
		);
	}

	if (!loading && customers.length === 0) {
		return (
			<Box sx={{ py: 8 }}>
				<Stack spacing={3} alignItems="center">
					<Box
						sx={{
							width: 100,
							height: 100,
							borderRadius: "50%",
							backgroundColor: (theme) => (theme.palette.mode === "dark" ? theme.palette.background.paper : theme.palette.grey[100]),
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							mb: 2,
						}}
					>
						<Typography variant="h2" color="text.secondary">
							0
						</Typography>
					</Box>
					<Stack spacing={1} alignItems="center">
						<Typography variant="h5" color="text.primary">
							No hay clientes de Stripe registrados
						</Typography>
						<Typography variant="body1" color="text.secondary" align="center" sx={{ maxWidth: 600 }}>
							Los usuarios se irán integrando en Stripe a medida que vayan creando suscripciones en la aplicación. Una vez que los usuarios
							contraten un plan de pago, aparecerán automáticamente en esta tabla.
						</Typography>
					</Stack>
				</Stack>
			</Box>
		);
	}

	return (
		<Box>
			{/* Mensaje informativo */}
			<Alert severity="info" sx={{ mb: 3 }}>
				<Typography variant="body2">
					<strong>Nota:</strong> Solo se muestran los usuarios que ya están registrados como clientes en Stripe. Los usuarios que aún no
					aparecen en esta lista se agregarán automáticamente cuando adquieran su primera suscripción de Stripe.
				</Typography>
			</Alert>

			{/* Tarjetas de estadísticas */}
			<Grid container spacing={3} mb={3}>
				<Grid item xs={12} sm={6} md={3}>
					<Card>
						<CardContent>
							<Typography color="textSecondary" gutterBottom variant="body2">
								Total Clientes
							</Typography>
							<Typography variant="h4">{stats.totalCustomers}</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<Card>
						<CardContent>
							<Typography color="textSecondary" gutterBottom variant="body2">
								Con Suscripción Activa
							</Typography>
							<Typography variant="h4" color="success.main">
								{stats.customersWithActiveSubscriptions}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<Card>
						<CardContent>
							<Typography color="textSecondary" gutterBottom variant="body2">
								Sin Suscripción
							</Typography>
							<Typography variant="h4" color="text.secondary">
								{stats.customersWithoutSubscriptions}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
				<Grid item xs={12} sm={6} md={3}>
					<Card>
						<CardContent>
							<Typography color="textSecondary" gutterBottom variant="body2">
								Suscripciones Canceladas
							</Typography>
							<Typography variant="h4" color="error.main">
								{stats.customersWithCanceledSubscriptions}
							</Typography>
						</CardContent>
					</Card>
				</Grid>
			</Grid>

			{/* Tabla de suscripciones */}
			<TableContainer component={Paper}>
				<Table>
					<TableHead>
						<TableRow>
							<TableCell>Cliente</TableCell>
							<TableCell>Email</TableCell>
							<TableCell>Suscripción</TableCell>
							<TableCell>Estado</TableCell>
							<TableCell>Entorno</TableCell>
							<TableCell>Usuario ID</TableCell>
							<TableCell>Cliente desde</TableCell>
							<TableCell>Total Suscripciones</TableCell>
						</TableRow>
					</TableHead>
					<TableBody>
						{customers.map((customer: StripeCustomer) => (
							<TableRow key={customer.id}>
								<TableCell>
									<Typography variant="body2" fontWeight="bold">
										{customer.name}
									</Typography>
								</TableCell>
								<TableCell>
									<Typography variant="body2">{customer.email}</Typography>
								</TableCell>
								<TableCell>
									{customer.subscription ? (
										<Stack>
											<Typography variant="body2">
												{formatCurrency(customer.subscription.plan.amount, customer.subscription.plan.currency)}
											</Typography>
											<Typography variant="caption" color="textSecondary">
												{formatInterval(customer.subscription.plan.interval)}
											</Typography>
										</Stack>
									) : (
										<Typography variant="body2" color="textSecondary">
											Sin suscripción
										</Typography>
									)}
								</TableCell>
								<TableCell>
									{customer.subscription ? (
										<Chip
											label={getStatusLabel(customer.subscription.status)}
											color={getStatusColor(customer.subscription.status) as any}
											size="small"
										/>
									) : (
										<Chip label="Sin suscripción" color="default" size="small" />
									)}
								</TableCell>
								<TableCell>
									<Chip
										label={customer.metadata.environment || "production"}
										color={customer.metadata.environment === "production" ? "success" : "warning"}
										size="small"
										variant="outlined"
									/>
								</TableCell>
								<TableCell>
									<Typography variant="caption" sx={{ fontFamily: "monospace" }}>
										{customer.metadata.userId}
									</Typography>
								</TableCell>
								<TableCell>
									<Typography variant="caption">{format(new Date(customer.created), "dd/MM/yyyy", { locale: es })}</Typography>
								</TableCell>
								<TableCell align="center">
									<Typography variant="body2">{customer.totalSubscriptions}</Typography>
								</TableCell>
							</TableRow>
						))}
					</TableBody>
				</Table>
			</TableContainer>

			{/* Botón de cargar más */}
			{hasMore && (
				<Box display="flex" justifyContent="center" mt={3}>
					<Button variant="contained" onClick={handleLoadMore} disabled={loading}>
						{loading ? <CircularProgress size={24} /> : "Cargar más"}
					</Button>
				</Box>
			)}
		</Box>
	);
};

export default StripeSubscriptionsTable;

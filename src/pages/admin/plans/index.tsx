import React from "react";
import { useEffect, useState } from "react";
import {
	Alert,
	Box,
	Button,
	Card,
	CardContent,
	Chip,
	Collapse,
	Divider,
	Grid,
	IconButton,
	Paper,
	Stack,
	Table,
	TableBody,
	TableCell,
	TableContainer,
	TableHead,
	TableRow,
	Tooltip,
	Typography,
	CircularProgress,
} from "@mui/material";
import { Edit, Trash, Eye, Add, Refresh2, Link1, ArrowDown2, ArrowUp2 } from "iconsax-react";
import MainCard from "components/MainCard";
import Loader from "components/Loader";
import { openSnackbar } from "store/reducers/snackbar";
import { dispatch } from "store";
import { formatCurrency } from "utils/formatCurrency";
// import SecondaryAction from "components/SecondaryAction";
import ApiService, { Plan } from "store/reducers/ApiService";
import PlanFormModal from "./PlanFormModal";
import DeletePlanDialog from "./DeletePlanDialog";
import PlanDetailModal from "./PlanDetailModal";

const PlansManagement = () => {
	const [plans, setPlans] = useState<Plan[]>([]);
	const [loading, setLoading] = useState(true);
	const [formOpen, setFormOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [detailModalOpen, setDetailModalOpen] = useState(false);
	const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	const [syncLoading, setSyncLoading] = useState(false);
	const [showDetailedInfo, setShowDetailedInfo] = useState(false);
	// Determinar si se debe mostrar información bancaria internacional

	const fetchPlans = async () => {
		try {
			setLoading(true);
			const response = await ApiService.getAllPlans();
			setPlans(response.data || []);
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al cargar los planes",
					variant: "alert",
					alert: { color: "error" },
					close: false,
				}),
			);
		} finally {
			setLoading(false);
		}
	};

	useEffect(() => {
		fetchPlans();
	}, []);

	const handleEdit = (plan: Plan) => {
		setSelectedPlan(plan);
		setFormOpen(true);
	};

	const handleDelete = (plan: Plan) => {
		setSelectedPlan(plan);
		setDeleteDialogOpen(true);
	};

	const handleView = (plan: Plan) => {
		setSelectedPlan(plan);
		setDetailModalOpen(true);
	};

	const handleDetailClose = () => {
		setDetailModalOpen(false);
		setSelectedPlan(null);
	};

	const handleAddNew = () => {
		setSelectedPlan(null);
		setFormOpen(true);
	};

	const handleFormClose = () => {
		setFormOpen(false);
		setSelectedPlan(null);
	};

	const handleDeleteClose = () => {
		setDeleteDialogOpen(false);
		setSelectedPlan(null);
	};

	const handleSavePlan = async (planData: Partial<Plan>) => {
		try {
			const response = await ApiService.createOrUpdatePlan(planData);
			if (response.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: selectedPlan ? "Plan actualizado correctamente" : "Plan creado correctamente",
						variant: "alert",
						alert: { color: "success" },
						close: false,
					}),
				);
				fetchPlans();
			}
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al guardar el plan",
					variant: "alert",
					alert: { color: "error" },
					close: false,
				}),
			);
			throw error;
		}
	};

	const handleConfirmDelete = async () => {
		if (!selectedPlan) return;

		try {
			setDeleteLoading(true);
			const response = await ApiService.deletePlan(selectedPlan.planId);
			if (response.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Plan eliminado correctamente",
						variant: "alert",
						alert: { color: "success" },
						close: false,
					}),
				);
				fetchPlans();
				handleDeleteClose();
			}
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al eliminar el plan",
					variant: "alert",
					alert: { color: "error" },
					close: false,
				}),
			);
		} finally {
			setDeleteLoading(false);
		}
	};

	const handleSyncWithStripe = async () => {
		try {
			setSyncLoading(true);
			const response = await ApiService.syncPlansWithStripe();

			if (response.success) {
				const syncedCount = response.data?.filter((plan) => plan.synced).length || 0;
				const failedCount = response.data?.filter((plan) => !plan.synced).length || 0;

				let message = response.message || "Sincronización completada";
				if (failedCount > 0) {
					message = `${syncedCount} planes sincronizados exitosamente, ${failedCount} con errores`;
				}

				dispatch(
					openSnackbar({
						open: true,
						message,
						variant: "alert",
						alert: { color: failedCount > 0 ? "warning" : "success" },
						close: false,
					}),
				);

				// Recargar los planes después de la sincronización
				fetchPlans();
			}
		} catch (error: any) {
			let errorMessage = "Error al sincronizar con Stripe";

			if (error.message) {
				errorMessage = error.message;
			}

			dispatch(
				openSnackbar({
					open: true,
					message: errorMessage,
					variant: "alert",
					alert: { color: "error" },
					close: false,
				}),
			);
		} finally {
			setSyncLoading(false);
		}
	};

	if (loading) {
		return <Loader />;
	}

	return (
		<>
			<MainCard
				title="Gestión de Planes y Suscripciones"
				secondary={
					<Stack direction="row" spacing={2}>
						<Button
							variant="outlined"
							color="secondary"
							startIcon={syncLoading ? <CircularProgress size={18} /> : <Refresh2 />}
							onClick={handleSyncWithStripe}
							disabled={syncLoading}
						>
							{syncLoading ? "Sincronizando..." : "Sincronizar con Stripe"}
						</Button>
						<Button variant="contained" color="primary" startIcon={<Add />} onClick={handleAddNew}>
							Agregar Plan
						</Button>
					</Stack>
				}
			>
				{/* Security Notice */}
				<Alert
					severity="info"
					sx={{
						mb: 3,
						"& .MuiAlert-message": {
							width: "100%",
						},
					}}
					action={
						<Button
							variant="outlined"
							size="small"
							startIcon={<Link1 size={16} />}
							onClick={() => window.open("https://dashboard.stripe.com/login", "_blank")}
							sx={{ whiteSpace: "nowrap", alignSelf: "flex-start", mt: 0.5 }}
						>
							Ir a Stripe
						</Button>
					}
				>
					<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
						<Typography variant="subtitle2" fontWeight="bold">
							Nota de Seguridad sobre Precios
						</Typography>
						<IconButton size="small" onClick={() => setShowDetailedInfo(!showDetailedInfo)} sx={{ ml: 1 }}>
							{showDetailedInfo ? <ArrowUp2 size={16} /> : <ArrowDown2 size={16} />}
						</IconButton>
					</Box>
					<Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
						Por razones de seguridad, la modificación de precios debe realizarse desde Stripe Dashboard. Use "Sincronizar con Stripe"
						después de hacer cambios.
					</Typography>

					<Collapse in={showDetailedInfo}>
						<Box sx={{ mt: 2 }}>
							<Divider sx={{ mb: 2 }} />

							<Typography variant="subtitle2" fontWeight="bold" gutterBottom>
								Funcionamiento del Sistema:
							</Typography>

							<Box sx={{ pl: 2 }}>
								<Typography variant="body2" paragraph sx={{ fontSize: "0.875rem" }}>
									<strong>1. Primera instalación:</strong>
									<br />• Ejecutar:{" "}
									<code style={{ backgroundColor: "rgba(0,0,0,0.1)", padding: "2px 4px", borderRadius: "3px", fontSize: "0.8rem" }}>
										node scripts/initializePlanConfigs.js
									</code>
									<br />• Crea productos iniciales en Stripe y MongoDB
								</Typography>

								<Typography variant="body2" paragraph sx={{ fontSize: "0.875rem" }}>
									<strong>2. Operación normal:</strong>
									<br />• Los precios de Stripe se mantienen sin cambios
									<br />• Para sincronizar use el botón "Sincronizar con Stripe"
								</Typography>

								<Typography variant="body2" paragraph sx={{ fontSize: "0.875rem" }}>
									<strong>3. Para cambiar precios:</strong>
									<br />• Modifique en Stripe Dashboard
									<br />• Sincronice con el botón de esta interfaz
								</Typography>
							</Box>

							<Divider sx={{ my: 2 }} />

							<Typography variant="subtitle2" fontWeight="bold" gutterBottom>
								📋 Configuración en Producción:
							</Typography>

							<Box sx={{ pl: 2 }}>
								<Typography variant="body2" sx={{ fontSize: "0.875rem", mb: 1 }}>
									<strong>Variables de entorno:</strong>
								</Typography>
								<Box sx={{ bgcolor: "grey.100", p: 1, borderRadius: 1, mb: 2 }}>
									<code style={{ fontSize: "0.75rem" }}>
										STRIPE_SECRET_KEY=sk_live_xxxxx...
										<br />
										NODE_ENV=production
									</code>
								</Box>

								<Typography variant="body2" sx={{ fontSize: "0.875rem", mb: 1 }}>
									<strong>Crear productos iniciales:</strong>
								</Typography>
								<Box sx={{ bgcolor: "grey.100", p: 1, borderRadius: 1, mb: 2 }}>
									<code style={{ fontSize: "0.75rem" }}>NODE_ENV=production node scripts/initializePlanConfigs.js</code>
								</Box>

								<Typography variant="body2" sx={{ fontSize: "0.875rem" }}>
									<strong>Notas:</strong>
									<br />• ⚠️ NO usar productos de desarrollo en producción
									<br />• ✅ Stripe es la fuente de verdad para precios
									<br />• 📌 El script de inicialización solo se ejecuta una vez
								</Typography>
							</Box>
						</Box>
					</Collapse>
				</Alert>

				<Grid container spacing={3}>
					{/* Summary Cards */}
					<Grid item xs={12} sm={6} md={3}>
						<Card>
							<CardContent>
								<Stack spacing={1}>
									<Typography variant="h3" color="primary">
										{plans.length}
									</Typography>
									<Typography variant="body2" color="textSecondary">
										Total de Planes
									</Typography>
								</Stack>
							</CardContent>
						</Card>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<Card>
							<CardContent>
								<Stack spacing={1}>
									<Typography variant="h3" color="success.main">
										{plans.filter((plan) => plan.isActive).length}
									</Typography>
									<Typography variant="body2" color="textSecondary">
										Planes Activos
									</Typography>
								</Stack>
							</CardContent>
						</Card>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<Card>
							<CardContent>
								<Stack spacing={1}>
									<Typography variant="h3" color="warning.main">
										{plans.find((plan) => plan.isDefault) ? "1" : "0"}
									</Typography>
									<Typography variant="body2" color="textSecondary">
										Plan Default
									</Typography>
								</Stack>
							</CardContent>
						</Card>
					</Grid>
					<Grid item xs={12} sm={6} md={3}>
						<Card>
							<CardContent>
								<Stack spacing={1}>
									<Typography variant="h3" color="info.main">
										{plans.filter((plan) => plan.pricingInfo.basePrice === 0).length}
									</Typography>
									<Typography variant="body2" color="textSecondary">
										Planes Gratuitos
									</Typography>
								</Stack>
							</CardContent>
						</Card>
					</Grid>

					{/* Plans Table */}
					<Grid item xs={12}>
						<TableContainer component={Paper}>
							<Table>
								<TableHead>
									<TableRow>
										<TableCell>Plan ID</TableCell>
										<TableCell>Nombre</TableCell>
										<TableCell>Descripción</TableCell>
										<TableCell align="center">Precio</TableCell>
										<TableCell align="center">Estado</TableCell>
										<TableCell align="center">Default</TableCell>
										<TableCell align="center">Acciones</TableCell>
									</TableRow>
								</TableHead>
								<TableBody>
									{plans.map((plan) => (
										<TableRow key={plan.planId} hover>
											<TableCell>{plan.planId}</TableCell>
											<TableCell>
												<Typography variant="subtitle1" fontWeight={600}>
													{plan.displayName}
												</Typography>
											</TableCell>
											<TableCell>
												<Typography variant="body2" sx={{ maxWidth: 300 }}>
													{plan.description}
												</Typography>
											</TableCell>
											<TableCell align="center">
												<Typography variant="subtitle2">{formatCurrency(plan.pricingInfo.basePrice, plan.pricingInfo.currency)}</Typography>
												<Typography variant="caption" color="textSecondary">
													/{plan.pricingInfo.billingPeriod === "monthly" ? "mes" : "año"}
												</Typography>
											</TableCell>
											<TableCell align="center">
												<Chip label={plan.isActive ? "Activo" : "Inactivo"} color={plan.isActive ? "success" : "error"} size="small" />
											</TableCell>
											<TableCell align="center">{plan.isDefault && <Chip label="Default" color="primary" size="small" />}</TableCell>
											<TableCell align="center">
												<Stack direction="row" spacing={1} justifyContent="center">
													<Tooltip title="Ver detalles">
														<IconButton size="small" color="primary" onClick={() => handleView(plan)}>
															<Eye size={18} />
														</IconButton>
													</Tooltip>
													<Tooltip title="Editar">
														<IconButton size="small" color="secondary" onClick={() => handleEdit(plan)}>
															<Edit size={18} />
														</IconButton>
													</Tooltip>
													<Tooltip title="Eliminar">
														<IconButton size="small" color="error" onClick={() => handleDelete(plan)} disabled={plan.isDefault}>
															<Trash size={18} />
														</IconButton>
													</Tooltip>
												</Stack>
											</TableCell>
										</TableRow>
									))}
								</TableBody>
							</Table>
						</TableContainer>
					</Grid>

					{/* Plan Details Cards */}
					<Grid item xs={12}>
						<Typography variant="h5" sx={{ mb: 2 }}>
							Detalles de Planes
						</Typography>
						<Grid container spacing={3}>
							{plans.map((plan) => (
								<Grid item xs={12} md={6} lg={4} key={plan.planId}>
									<Card
										sx={{
											border: plan.isDefault ? "2px solid" : "1px solid",
											borderColor: plan.isDefault ? "primary.main" : "divider",
										}}
									>
										<CardContent>
											<Stack spacing={2}>
												<Box>
													<Typography variant="h6" gutterBottom>
														{plan.displayName}
													</Typography>
													<Chip label={plan.isActive ? "Activo" : "Inactivo"} color={plan.isActive ? "success" : "error"} size="small" />
													{plan.isDefault && <Chip label="Default" color="primary" size="small" sx={{ ml: 1 }} />}
												</Box>

												<Typography variant="h4" color="primary">
													{formatCurrency(plan.pricingInfo.basePrice, plan.pricingInfo.currency)}
													<Typography variant="body2" component="span" color="textSecondary">
														/{plan.pricingInfo.billingPeriod === "monthly" ? "mes" : "año"}
													</Typography>
												</Typography>

												<Box>
													<Typography variant="subtitle2" gutterBottom>
														Límites de Recursos:
													</Typography>
													{plan.resourceLimits.map((limit, index) => (
														<Typography key={index} variant="body2" color="textSecondary">
															• {limit.description}: {limit.limit}
														</Typography>
													))}
												</Box>

												<Box>
													<Typography variant="subtitle2" gutterBottom>
														Características:
													</Typography>
													{plan.features
														.filter((feature) => feature.enabled)
														.map((feature, index) => (
															<Typography key={index} variant="body2" color="textSecondary">
																• {feature.description}
															</Typography>
														))}
												</Box>

												<Box sx={{ mt: 2 }}>
													<Button variant="outlined" size="small" fullWidth onClick={() => handleEdit(plan)}>
														Editar Plan
													</Button>
												</Box>
											</Stack>
										</CardContent>
									</Card>
								</Grid>
							))}
						</Grid>
					</Grid>
				</Grid>
			</MainCard>

			{/* Plan Form Modal */}
			<PlanFormModal open={formOpen} onClose={handleFormClose} onSave={handleSavePlan} plan={selectedPlan} />

			{/* Delete Confirmation Dialog */}
			<DeletePlanDialog
				open={deleteDialogOpen}
				onClose={handleDeleteClose}
				onConfirm={handleConfirmDelete}
				plan={selectedPlan}
				loading={deleteLoading}
			/>

			{/* Plan Detail Modal */}
			<PlanDetailModal open={detailModalOpen} onClose={handleDetailClose} plan={selectedPlan} />
		</>
	);
};

export default PlansManagement;

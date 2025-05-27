import { useEffect, useState } from "react";
import {
	Box,
	Button,
	Card,
	CardContent,
	Chip,
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
} from "@mui/material";
import { Edit, Trash, Eye, Add } from "iconsax-react";
import MainCard from "components/MainCard";
import Loader from "components/Loader";
import { openSnackbar } from "store/reducers/snackbar";
import { dispatch } from "store";
import { formatCurrency } from "utils/formatCurrency";
// import SecondaryAction from "components/SecondaryAction";
import ApiService, { Plan } from "store/reducers/ApiService";
import PlanFormModal from "./PlanFormModal";
import DeletePlanDialog from "./DeletePlanDialog";
import useBankingDisplay from "hooks/useBankingDisplay";

const PlansManagement = () => {
	const [plans, setPlans] = useState<Plan[]>([]);
	const [loading, setLoading] = useState(true);
	const [formOpen, setFormOpen] = useState(false);
	const [deleteDialogOpen, setDeleteDialogOpen] = useState(false);
	const [selectedPlan, setSelectedPlan] = useState<Plan | null>(null);
	const [deleteLoading, setDeleteLoading] = useState(false);
	// Determinar si se debe mostrar información bancaria internacional
	const showBankingData = useBankingDisplay();

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

	const handleView = (planId: string) => {
		// TODO: Implement view details functionality
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

	if (loading) {
		return <Loader />;
	}

	return (
		<>
			<MainCard
				title="Gestión de Planes y Suscripciones"
				secondary={
					<Button variant="contained" color="primary" startIcon={<Add />} onClick={handleAddNew}>
						Agregar Plan
					</Button>
				}
			>
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
														<IconButton size="small" color="primary" onClick={() => handleView(plan.planId)}>
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

					{/* Información bancaria internacional */}
					{showBankingData && (
						<Grid item xs={12}>
							<Paper sx={{ p: 2, mb: 3, borderLeft: "4px solid", borderColor: "info.main" }}>
								<Typography variant="subtitle1" color="info.main" gutterBottom>
									Información de Pagos Bancarios Internacionales
								</Typography>
								<Typography variant="body2">Banco: XYZ Bank | Cuenta: 123-456-789 | SWIFT: ABCDEFGH</Typography>
								<Typography variant="caption" color="textSecondary">
									Esta información se muestra a los usuarios cuando se suscriben a un plan.
								</Typography>
							</Paper>
						</Grid>
					)}

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
		</>
	);
};

export default PlansManagement;

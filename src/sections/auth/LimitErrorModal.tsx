import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	Box,
	Typography,
	Stack,
	Divider,
	Paper,
	LinearProgress,
	useTheme,
	Grid,
	Chip,
	Switch,
	List,
	ListItem,
	ListItemText,
	CircularProgress,
	Alert
} from "@mui/material";
import { Warning2, Lock, Star1, TrendUp } from "iconsax-react";
// Importar MainCard desde el componente personalizado
import MainCard from "components/MainCard";
// Importar el servicio API para obtener planes dinámicamente
import ApiService, { Plan } from "store/reducers/ApiService";

interface LimitInfo {
	resourceType: string;
	plan: string;
	limit: number;
	used: number;
}

interface FeatureInfo {
	feature: string;
	plan: string;
	availableIn: string[];
}

interface LimitErrorModalProps {
	open: boolean;
	onClose: () => void;
	message: string;
	limitInfo?: LimitInfo;
	featureInfo?: FeatureInfo;
	upgradeRequired?: boolean;
}

export const LimitErrorModal: React.FC<LimitErrorModalProps> = ({
	open,
	onClose,
	message,
	limitInfo,
	featureInfo,
	upgradeRequired = false,
}) => {
	const navigate = useNavigate();
	const theme = useTheme();
	const [timePeriod, setTimePeriod] = useState(true); // true = mensual, false = anual
	const [plans, setPlans] = useState<Plan[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);

	// Cargar planes cuando se abra el modal
	useEffect(() => {
		const fetchPlans = async () => {
			if (!open) return;

			try {
				setLoading(true);
				setError(null);
				const response = await ApiService.getPublicPlans();
				if (response.success && response.data) {
					setPlans(response.data);
				} else {
					setError("No se pudieron cargar los planes");
				}
			} catch (err) {
				console.error("Error al cargar los planes:", err);
				setError("Error al cargar los planes. Por favor, intenta más tarde.");
			} finally {
				setLoading(false);
			}
		};

		fetchPlans();
	}, [open]);

	const handleUpgrade = (planId?: string) => {
		onClose();
		if (planId) {
			navigate(`/plans?plan=${planId}`);
		} else {
			navigate("/plans");
		}
	};

	// Gestor de estado simplificado del modal
	// No intentamos cerrar otros modales desde aquí - eso lo maneja ServerContext
	const modalOpenedRef = React.useRef(false);

	// Registrar la apertura y cierre del modal
	React.useEffect(() => {
		if (open && !modalOpenedRef.current) {
			console.log("LimitErrorModal: Modal de restricción de plan abierto");
			modalOpenedRef.current = true;
		}

		// Limpiar referencia al cerrar
		if (!open) {
			modalOpenedRef.current = false;
		}
	}, [open]);

	const isLimitError = !!limitInfo;
	const isFeatureError = !!featureInfo;

	const getIcon = () => {
		if (upgradeRequired || isFeatureError) {
			return <Lock variant="Bulk" size={64} color={theme.palette.warning.main} />;
		}
		return <Warning2 variant="Bulk" size={64} color={theme.palette.error.main} />;
	};

	const getTitle = () => {
		if (isFeatureError) {
			return "Función no disponible";
		}
		if (isLimitError) {
			return "Límite alcanzado";
		}
		return "Restricción del plan";
	};

	const calculatePercentage = (used: number, limit: number) => {
		return Math.min((used / limit) * 100, 100);
	};

	const getUsageColor = (used: number, limit: number) => {
		const percentage = calculatePercentage(used, limit);
		if (percentage >= 90) return theme.palette.error.main;
		if (percentage >= 70) return theme.palette.warning.main;
		return theme.palette.success.main;
	};

	// Determinar planes recomendados según el error
	const getRecommendedPlans = () => {
		if (plans.length === 0) return [];

		let currentUserPlan = "free";

		if (isLimitError && limitInfo) {
			currentUserPlan = limitInfo.plan.toLowerCase();
		} else if (isFeatureError && featureInfo) {
			currentUserPlan = featureInfo.plan.toLowerCase();
		}

		// Filtrar planes según el plan actual del usuario
		return plans.filter((plan) => plan.planId.toLowerCase() !== currentUserPlan);
	};

	// Función para obtener el color y el estilo según el tipo de plan
	const getPlanStyle = (planId: string) => {
		switch (planId.toLowerCase()) {
			case "free":
				return {
					padding: 3,
					borderRadius: 1,
					bgcolor: theme.palette.info.lighter,
				};
			case "standard":
				return {
					padding: 3,
					borderRadius: 1,
					bgcolor: theme.palette.success.lighter,
				};
			case "premium":
				return {
					padding: 3,
					borderRadius: 1,
					bgcolor: theme.palette.secondary.lighter,
				};
			default:
				return { padding: 3 };
		}
	};

	// Función para obtener el color del botón según el tipo de plan
	const getButtonColor = (planId: string) => {
		switch (planId.toLowerCase()) {
			case "free":
				return "info";
			case "standard":
				return "success";
			case "premium":
				return "secondary";
			default:
				return "secondary";
		}
	};

	// Función para obtener el chip distintivo según el plan
	const getPlanChip = (planId: string, isDefault: boolean) => {
		switch (planId.toLowerCase()) {
			case "standard":
				return <Chip label="Popular" color="success" />;
			case "premium":
				return <Chip label="Recomendado" color="secondary" />;
			case "free":
				if (isDefault) {
					return <Chip label="Básico" color="info" />;
				}
				return null;
			default:
				if (isDefault) {
					return <Chip label="Predeterminado" color="default" />;
				}
				return null;
		}
	};

	// Estilos
	const priceListDisable = {
		opacity: 0.4,
		textDecoration: "line-through",
	};

	const price = {
		fontSize: "40px",
		fontWeight: 700,
		lineHeight: 1,
	};

	const getContentMessage = () => {
		if (isLimitError && limitInfo) {
			const usagePercentage = calculatePercentage(limitInfo.used, limitInfo.limit);
			const usageColor = getUsageColor(limitInfo.used, limitInfo.limit);

			return (
				<Paper
					elevation={0}
					sx={{
						mb: 4,
						p: 3,
						borderRadius: 2,
						bgcolor: theme.palette.mode === "dark" ? "background.paper" : "grey.50",
						border: `1px solid ${theme.palette.divider}`,
					}}
				>
					<Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
						{message}
					</Typography>
					<Stack spacing={2.5}>
						<Box>
							<Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
								<Typography variant="body2" color="text.secondary">
									<strong>Recurso:</strong>
								</Typography>
								<Typography variant="body2">{limitInfo.resourceType}</Typography>
							</Box>
							<Divider />
						</Box>

						<Box>
							<Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
								<Typography variant="body2" color="text.secondary">
									<strong>Plan actual:</strong>
								</Typography>
								<Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
									<Star1 size={16} variant="Bulk" color={theme.palette.primary.main} />
									{limitInfo.plan}
								</Typography>
							</Box>
							<Divider />
						</Box>

						<Box sx={{ mt: 2 }}>
							<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center", mb: 1 }}>
								<Typography variant="body2" color="text.secondary">
									<strong>Uso actual:</strong>
								</Typography>
								<Typography variant="body2" fontWeight="medium" color={usageColor}>
									{limitInfo.used} / {limitInfo.limit} ({Math.round(usagePercentage)}%)
								</Typography>
							</Box>
							<LinearProgress
								variant="determinate"
								value={usagePercentage}
								sx={{
									height: 8,
									borderRadius: 1,
									bgcolor: theme.palette.mode === "dark" ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.06)",
									"& .MuiLinearProgress-bar": {
										backgroundColor: usageColor,
									},
								}}
							/>
						</Box>
					</Stack>
				</Paper>
			);
		}

		if (isFeatureError && featureInfo) {
			return (
				<Paper
					elevation={0}
					sx={{
						mb: 4,
						p: 3,
						borderRadius: 2,
						bgcolor: theme.palette.mode === "dark" ? "background.paper" : "grey.50",
						border: `1px solid ${theme.palette.divider}`,
					}}
				>
					<Typography variant="h6" color="text.primary" sx={{ mb: 2 }}>
						{message}
					</Typography>
					<Stack spacing={2.5}>
						<Box>
							<Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
								<Typography variant="body2" color="text.secondary">
									<strong>Función:</strong>
								</Typography>
								<Typography variant="body2">{featureInfo.feature}</Typography>
							</Box>
							<Divider />
						</Box>

						<Box>
							<Box sx={{ display: "flex", justifyContent: "space-between", mb: 0.5 }}>
								<Typography variant="body2" color="text.secondary">
									<strong>Tu plan:</strong>
								</Typography>
								<Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
									<Star1 size={16} variant="Bulk" color={theme.palette.primary.main} />
									{featureInfo.plan}
								</Typography>
							</Box>
							<Divider />
						</Box>

						{featureInfo.availableIn.length > 0 && (
							<Box>
								<Typography variant="body2" color="text.secondary" sx={{ mb: 1 }}>
									<strong>Planes que incluyen esta función:</strong>
								</Typography>
								<Stack direction="row" spacing={1} flexWrap="wrap" sx={{ gap: 1 }}>
									{featureInfo.availableIn.map((plan, index) => (
										<Box
											key={index}
											sx={{
												display: "inline-flex",
												alignItems: "center",
												px: 1.5,
												py: 0.5,
												border: `1px solid ${theme.palette.primary.light}`,
												borderRadius: 1,
												bgcolor: theme.palette.primary.lighter,
												color: theme.palette.primary.dark,
												fontSize: "0.75rem",
												gap: 0.5,
											}}
										>
											<Star1 size={14} variant="Bulk" />
											{plan}
										</Box>
									))}
								</Stack>
							</Box>
						)}
					</Stack>
				</Paper>
			);
		}

		return (
			<Paper
				elevation={0}
				sx={{
					mb: 4,
					p: 3,
					borderRadius: 2,
					bgcolor: theme.palette.mode === "dark" ? "background.paper" : "grey.50",
					border: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Typography variant="h6" color="text.primary">
					{message || "Esta característica requiere un plan superior."}
				</Typography>
			</Paper>
		);
	};

	// Renderizado de planes
	const renderPlansList = () => {
		if (loading) {
			return (
				<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
					<CircularProgress />
				</Box>
			);
		}

		if (error) {
			return <Alert severity="error">{error}</Alert>;
		}

		if (plans.length === 0) {
			return <Alert severity="info">No hay planes disponibles en este momento.</Alert>;
		}

		const recommendedPlans = getRecommendedPlans();

		return (
			<Grid container spacing={3}>
				<Grid item xs={12}>
					<Stack spacing={2} direction={{ xs: "column", md: "row" }} justifyContent="space-between">
						<Stack spacing={0}></Stack>
						<Stack direction="row" spacing={1.5} alignItems="center">
							<Typography variant="subtitle1" color={timePeriod ? "textSecondary" : "textPrimary"}>
								Cobro Anual
							</Typography>
							<Switch checked={timePeriod} onChange={() => setTimePeriod(!timePeriod)} inputProps={{ "aria-label": "container" }} />
							<Typography variant="subtitle1" color={timePeriod ? "textPrimary" : "textSecondary"}>
								Cobro Mensual
							</Typography>
						</Stack>
					</Stack>
				</Grid>

				<Grid item container spacing={3} xs={12} alignItems="center">
					{recommendedPlans.map((plan) => {
						// Calcular el precio según el periodo seleccionado
						const displayPrice =
							!timePeriod && plan.pricingInfo.billingPeriod === "monthly"
								? Math.round(plan.pricingInfo.basePrice * 12 * 0.75) // Descuento anual del 25%
								: plan.pricingInfo.basePrice;

						return (
							<Grid item xs={12} sm={6} md={4} key={plan.planId}>
								<MainCard>
									<Grid container spacing={3}>
										<Grid item xs={12}>
											<Box sx={getPlanStyle(plan.planId)}>
												<Grid container spacing={3}>
													{/* Mostramos el chip correspondiente */}
													<Grid item xs={12} sx={{ textAlign: "center" }}>
														{getPlanChip(plan.planId, plan.isDefault)}
													</Grid>
													<Grid item xs={12}>
														<Stack spacing={0} textAlign="center">
															<Typography variant="h4">{plan.displayName}</Typography>
															<Typography>{plan.description}</Typography>
														</Stack>
													</Grid>
													<Grid item xs={12}>
														<Stack spacing={0} alignItems="center">
															<Typography variant="h2" sx={price}>
																${displayPrice}
															</Typography>
															<Typography variant="h6" color="textSecondary">
																{timePeriod ? "/mes" : "/año"}
															</Typography>
														</Stack>
													</Grid>
													<Grid item xs={12}>
														<Button
															color={getButtonColor(plan.planId)}
															variant={plan.planId.toLowerCase() === "standard" || plan.planId.toLowerCase() === "premium" ? "contained" : "outlined"}
															fullWidth
															onClick={() => handleUpgrade(plan.planId)}
															startIcon={<TrendUp size={18} />}
														>
															Suscribirme
														</Button>
													</Grid>
												</Grid>
											</Box>
										</Grid>
										<Grid item xs={12}>
											<List
												sx={{
													m: 0,
													p: 0,
													"&> li": {
														px: 0,
														py: 0.625,
													},
												}}
												component="ul"
											>
												{/* Primero mostrar los recursos del plan */}
												{plan.resourceLimits.map((resource, i) => (
													<React.Fragment key={`resource-${i}`}>
														<ListItem>
															<ListItemText primary={resource.description} sx={{ textAlign: "center", fontWeight: "medium" }} />
														</ListItem>
													</React.Fragment>
												))}

												{/* Luego mostrar las características en orden: habilitadas primero, deshabilitadas después */}
												{[...plan.features]
													.sort((a, b) => {
														// Ordenar: enabled (true) primero, luego disabled (false)
														if (a.enabled === b.enabled) return 0;
														return a.enabled ? -1 : 1;
													})
													.map((feature, i) => (
														<React.Fragment key={`feature-${i}`}>
															<ListItem sx={!feature.enabled ? priceListDisable : {}}>
																<ListItemText
																	primary={feature.description}
																	sx={{ textAlign: "center", fontWeight: feature.enabled ? "medium" : "normal" }}
																/>
															</ListItem>
														</React.Fragment>
													))}
											</List>
										</Grid>
									</Grid>
								</MainCard>
							</Grid>
						);
					})}
				</Grid>
			</Grid>
		);
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="lg"
			fullWidth
			PaperProps={{
				sx: {
					borderRadius: 2,
					overflow: "hidden",
				},
			}}
		>
			<Box
				sx={{
					p: 3,
					bgcolor: upgradeRequired || isFeatureError ? "warning.lighter" : "error.lighter",
					display: "flex",
					alignItems: "center",
					gap: 2.5,
				}}
			>
				{getIcon()}
				<Box>
					<Typography variant="h5" sx={{ color: upgradeRequired || isFeatureError ? "warning.darker" : "error.darker" }}>
						{getTitle()}
					</Typography>
					<Typography variant="body2" sx={{ mt: 0.5, color: upgradeRequired || isFeatureError ? "warning.dark" : "error.dark" }}>
						Se requiere actualizar tu plan para continuar
					</Typography>
				</Box>
			</Box>

			<DialogContent sx={{ p: 3 }}>
				{getContentMessage()}
				{renderPlansList()}
			</DialogContent>

			<DialogActions sx={{ p: 3, pt: 1, gap: 1 }}>
				<Button onClick={onClose} variant="outlined" color="inherit" sx={{ borderRadius: 1.5 }}>
					Cerrar
				</Button>
			</DialogActions>
		</Dialog>
	);
};
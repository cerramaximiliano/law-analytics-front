import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
	Button,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Box,
	Typography,
	Stack,
	Divider,
	useTheme,
	Grid,
	Chip,
	List,
	ListItem,
	ListItemText,
	CircularProgress,
	Alert,
	alpha,
} from "@mui/material";
import { Lock, ArrowRight, TickCircle, CloseCircle, Crown } from "iconsax-react";
// Importar MainCard desde el componente personalizado
import MainCard from "components/MainCard";
// Importar el servicio API para obtener planes dinámicamente
import ApiService, { Plan } from "store/reducers/ApiService";
import { getPlanPricing, formatPrice, getBillingPeriodText, cleanPlanDisplayName } from "utils/planPricingUtils";

interface LimitInfo {
	resourceType: string;
	plan: string;
	currentCount: string;
	limit: number;
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
	const [plans, setPlans] = useState<Plan[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null); // Para tracking del plan siendo procesado

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
				setError("Error al cargar los planes. Por favor, intenta más tarde.");
			} finally {
				setLoading(false);
			}
		};

		fetchPlans();
	}, [open]);

	const handleUpgrade = (planId?: string) => {
		setLoadingPlanId(planId || "default"); // Activar loading
		onClose();
		if (planId) {
			navigate(`/suscripciones/tables?plan=${planId}`);
		} else {
			navigate("/suscripciones/tables");
		}
	};

	// Gestor de estado simplificado del modal
	// No intentamos cerrar otros modales desde aquí - eso lo maneja ServerContext
	const modalOpenedRef = React.useRef(false);

	// Registrar la apertura y cierre del modal
	React.useEffect(() => {
		if (open && !modalOpenedRef.current) {
			modalOpenedRef.current = true;
		}

		// Limpiar referencia al cerrar
		if (!open) {
			modalOpenedRef.current = false;
		}
	}, [open]);

	const isLimitError = !!limitInfo;
	const isFeatureError = !!featureInfo;

	const getTitle = () => {
		if (isFeatureError) {
			return "Función no disponible";
		}
		if (isLimitError) {
			return "Límite alcanzado";
		}
		return "Restricción del plan";
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
	const getPlanStyle = (planId: string, isCurrentPlan: boolean) => {
		if (isCurrentPlan) {
			return {
				padding: 3,
				borderRadius: 1,
				bgcolor: theme.palette.primary.lighter,
			};
		}

		switch (planId) {
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
	const getButtonColor = (planId: string, isCurrentPlan: boolean) => {
		if (isCurrentPlan) {
			return "primary";
		}

		switch (planId) {
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
	const getPlanChip = (planId: string, isCurrentPlan: boolean, isDefault: boolean) => {
		if (isCurrentPlan) {
			return <Chip label="Plan Actual" color="primary" />;
		}

		switch (planId) {
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
		fontSize: "28px",
		fontWeight: 700,
		lineHeight: 1,
	};

	const getContentMessage = () => {
		if (isLimitError && limitInfo) {
			return (
				<Box
					sx={{
						mb: 1.5,
						p: 1.5,
						borderRadius: 1,
						maxWidth: "700px",
						mx: "auto",
						bgcolor: theme.palette.background.paper,
					}}
				>
					<Typography variant="body1" color="text.primary" sx={{ mb: 1 }}>
						{message}
					</Typography>
					<Stack spacing={1.5}>
						<Box sx={{ display: "flex", justifyContent: "space-between", alignItems: "center" }}>
							<Typography variant="body2" color="text.secondary">
								{limitInfo.resourceType} - Uso actual:
							</Typography>
							<Typography variant="body2" fontWeight="medium" color="error">
								{limitInfo.currentCount} / {limitInfo.limit}
							</Typography>
						</Box>
					</Stack>
				</Box>
			);
		}

		if (isFeatureError && featureInfo) {
			return (
				<Box
					sx={{
						mb: 1.5,
						p: 1.5,
						borderRadius: 1,
						maxWidth: "700px",
						mx: "auto",
						bgcolor: theme.palette.background.paper,
					}}
				>
					<Typography
						variant="body1"
						color="text.primary"
						sx={{ mb: 1, whiteSpace: "nowrap", overflow: "hidden", textOverflow: "ellipsis" }}
					>
						{message}
					</Typography>
					<Stack spacing={1}>
						<Box sx={{ display: "flex", justifyContent: "space-between" }}>
							<Typography variant="body2" color="text.secondary">
								Función:
							</Typography>
							<Typography variant="body2" fontWeight="medium">
								{featureInfo.feature}
							</Typography>
						</Box>
						<Box sx={{ display: "flex", justifyContent: "space-between" }}>
							<Typography variant="body2" color="text.secondary">
								Tu plan actual:
							</Typography>
							<Typography variant="body2" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
								<Crown size={14} variant="Bulk" color={theme.palette.primary.main} />
								{featureInfo.plan}
							</Typography>
						</Box>

						{featureInfo.availableIn.length > 0 && (
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Typography variant="body2" color="text.secondary">
									Disponible en:
								</Typography>
								<Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
									{featureInfo.availableIn.map((plan, index) => (
										<Chip
											key={index}
											size="small"
											label={plan}
											icon={<Crown size={12} variant="Bulk" />}
											color="primary"
											variant="outlined"
											sx={{ height: 22 }}
										/>
									))}
								</Stack>
							</Box>
						)}
					</Stack>
				</Box>
			);
		}

		return (
			<Alert
				severity="warning"
				icon={<Lock variant="Bulk" size={24} color={theme.palette.warning.main} />}
				sx={{
					mb: 2,
					width: "100%",
					maxWidth: "700px",
					mx: "auto",
				}}
			>
				{message || "Acceso denegado: Esta característica no está disponible en tu plan actual."}
			</Alert>
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

		// Filtrar solo planes activos
		const activePlans = recommendedPlans.filter((plan) => plan.isActive);

		// Si no hay planes activos disponibles
		if (activePlans.length === 0) {
			return <Alert severity="info">No hay planes disponibles para actualizar en este momento.</Alert>;
		}

		return (
			<Grid container spacing={2}>
				<Box sx={{ width: "100%", display: "flex", justifyContent: "center", mt: 0 }}>
					<Grid
						container
						spacing={2}
						justifyContent="center"
						sx={{
							maxWidth: "100%",
							margin: "auto",
						}}
					>
						{activePlans.map((plan) => {
							// Obtener la información de precios según el entorno
							const pricing = getPlanPricing(plan);
							const displayPrice = pricing.basePrice;

							return (
								<Grid item xs={12} sm={6} md={activePlans.length <= 2 ? 5 : 4} key={plan.planId}>
									<MainCard
										elevation={0}
										sx={{
											height: "100%",
											minHeight: "380px",
											overflow: "visible",
											border: `1px solid ${theme.palette.divider}`,
											transition: "all 0.3s ease-in-out",
											"&:hover": {
												transform: "translateY(-5px)",
												boxShadow: theme.shadows[4],
												borderColor: theme.palette.primary.main,
											},
										}}
									>
										<Grid container spacing={1}>
											<Grid item xs={12}>
												<Box
													sx={{
														...getPlanStyle(plan.planId, false),
														pt: 2,
														pb: 2,
													}}
												>
													<Grid container spacing={1}>
														{/* Mostramos el chip correspondiente */}
														<Grid item xs={12} sx={{ textAlign: "center" }}>
															{getPlanChip(plan.planId, false, plan.isDefault)}
														</Grid>
														<Grid item xs={12}>
															<Stack spacing={0} textAlign="center">
																<Typography variant="h4">{cleanPlanDisplayName(plan.displayName)}</Typography>
															</Stack>
														</Grid>
														<Grid item xs={12}>
															<Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "center" }}>
																<Typography variant="h2" sx={price}>
																	${displayPrice}
																</Typography>
																<Typography variant="h6" color="textSecondary" sx={{ ml: 1 }}>
																	{getBillingPeriodText(pricing.billingPeriod)}
																</Typography>
															</Box>
														</Grid>
														<Grid item xs={12}>
															<Button
																color={getButtonColor(plan.planId, false)}
																variant={
																	plan.planId.toLowerCase() === "standard" || plan.planId.toLowerCase() === "premium"
																		? "contained"
																		: "outlined"
																}
																fullWidth
																onClick={() => !loadingPlanId && handleUpgrade(plan.planId)}
																disabled={loadingPlanId !== null}
																endIcon={
																	loadingPlanId === plan.planId ? <CircularProgress size={16} color="inherit" /> : <ArrowRight size={16} />
																}
																size="medium"
																sx={{
																	py: 1,
																	fontWeight: 600,
																	transition: "all 0.3s ease-in-out",
																	"&:hover": {
																		transform: "scale(1.02)",
																	},
																}}
															>
																{loadingPlanId === plan.planId ? "Procesando..." : "Suscribirme Ahora"}
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
															py: 0.4,
														},
														maxHeight: "180px",
														overflowY: "auto",
														"&::-webkit-scrollbar": {
															width: "6px",
														},
														"&::-webkit-scrollbar-track": {
															backgroundColor: alpha(theme.palette.background.paper, 0.1),
														},
														"&::-webkit-scrollbar-thumb": {
															backgroundColor: alpha(theme.palette.primary.main, 0.2),
															borderRadius: "6px",
														},
													}}
													component="ul"
												>
													{/* Primero mostrar los recursos del plan */}
													{plan.resourceLimits.map((resource, i) => {
														// Formatear la descripción del recurso de forma legible
														let formattedDescription;
														switch (resource.name) {
															case "folders":
																formattedDescription = `+${resource.limit} Causas`;
																break;
															case "calculators":
																formattedDescription = `+${resource.limit} Cálculos`;
																break;
															case "contacts":
																formattedDescription = `+${resource.limit} Contactos`;
																break;
															case "storage":
																formattedDescription = `${resource.limit} MB de Almacenamiento`;
																break;
															default:
																// Capitalizar el nombre del recurso
																const displayName = resource.name.charAt(0).toUpperCase() + resource.name.slice(1);
																formattedDescription = `${resource.limit} ${displayName}`;
														}

														return (
															<React.Fragment key={`resource-${i}`}>
																<ListItem>
																	<ListItemText primary={formattedDescription} sx={{ textAlign: "center", fontWeight: "medium" }} />
																</ListItem>
															</React.Fragment>
														);
													})}

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
																	<Box sx={{ display: "flex", alignItems: "center", width: "100%", justifyContent: "center", gap: 1 }}>
																		{feature.enabled ? (
																			<TickCircle size={16} variant="Bold" color={theme.palette.success.main} />
																		) : (
																			<CloseCircle size={16} variant="Bold" color={theme.palette.text.disabled} />
																		)}
																		<ListItemText
																			primary={feature.description}
																			sx={{ textAlign: "center", fontWeight: feature.enabled ? "medium" : "normal" }}
																		/>
																	</Box>
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
				</Box>
			</Grid>
		);
	};

	return (
		<Dialog open={open} onClose={onClose} maxWidth="md" fullWidth sx={{ "& .MuiDialog-paper": { p: 0, bgcolor: "secondary.lighter" } }}>
			<DialogTitle
				sx={{
					bgcolor: theme.palette.primary.lighter,
					p: 3,
					borderBottom: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Stack spacing={1}>
					<Stack direction="row" alignItems="center" spacing={1}>
						<Crown size={24} variant="Bulk" color={theme.palette.primary.main} />
						<Typography variant="h5" color="primary" sx={{ fontWeight: 600 }}>
							{getTitle()}
						</Typography>
					</Stack>
					<Typography variant="body2" color="textSecondary">
						Se requiere actualizar tu plan para continuar
					</Typography>
				</Stack>
			</DialogTitle>
			<Divider />

			<DialogContent sx={{ p: 2.5 }}>
				<Box sx={{ mx: "auto" }}>
					<Box sx={{ maxWidth: "100%", mx: "auto", mb: 1.5 }}>{getContentMessage()}</Box>
					{renderPlansList()}
				</Box>
			</DialogContent>

			<Divider />

			<DialogActions
				sx={{
					p: 2.5,
					bgcolor: theme.palette.background.default,
					borderTop: `1px solid ${theme.palette.divider}`,
				}}
			>
				<Grid container justifyContent="flex-end" alignItems="center">
					<Grid item>
						<Button
							onClick={onClose}
							color="error"
							sx={{
								minWidth: 100,
							}}
						>
							Cerrar
						</Button>
					</Grid>
				</Grid>
			</DialogActions>
		</Dialog>
	);
};

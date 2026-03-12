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
import { Lock, ArrowRight, TickCircle, CloseCircle, Crown, DiscountShape } from "iconsax-react";
// Importar MainCard desde el componente personalizado
import MainCard from "components/MainCard";
// Importar el servicio API para obtener planes dinámicamente
import ApiService, { Plan } from "store/reducers/ApiService";
import { getPlanPricing, formatPrice, getBillingPeriodText, cleanPlanDisplayName } from "utils/planPricingUtils";

// Helper para formatear nombres de planes en español
const formatPlanNameSpanish = (planName: string): string => {
	const planLower = planName.toLowerCase();
	if (planLower === "free" || planLower === "gratuito") return "Gratuito";
	if (planLower === "standard" || planLower === "estándar") return "Estándar";
	if (planLower === "premium") return "Premium";
	return planName;
};

// Helper para transformar mensaje con nombres de planes en español
const formatMessageWithSpanishPlans = (msg: string): string => {
	return msg
		.replace(/\(free\)/gi, "(Gratuito)")
		.replace(/\(standard\)/gi, "(Estándar)")
		.replace(/\(premium\)/gi, "(Premium)")
		.replace(/plan free/gi, "plan Gratuito")
		.replace(/plan standard/gi, "plan Estándar")
		.replace(/plan premium/gi, "plan Premium");
};

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
	// Solo muestra planes de nivel superior al actual
	const getRecommendedPlans = () => {
		if (plans.length === 0) return [];

		let currentUserPlan = "free";

		if (isLimitError && limitInfo) {
			currentUserPlan = limitInfo.plan.toLowerCase();
		} else if (isFeatureError && featureInfo) {
			currentUserPlan = featureInfo.plan.toLowerCase();
		}

		// Normalizar nombre del plan (gratuito = free)
		if (currentUserPlan === "gratuito") {
			currentUserPlan = "free";
		}

		// Orden jerárquico de planes (de menor a mayor)
		const planHierarchy: { [key: string]: number } = {
			free: 0,
			gratuito: 0,
			standard: 1,
			premium: 2,
		};

		const currentPlanLevel = planHierarchy[currentUserPlan] ?? 0;

		// Filtrar solo planes de nivel superior al actual
		return plans.filter((plan) => {
			const planLevel = planHierarchy[plan.planId.toLowerCase()] ?? 0;
			return planLevel > currentPlanLevel;
		});
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
						{formatMessageWithSpanishPlans(message)}
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
						{formatMessageWithSpanishPlans(message)}
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
								{formatPlanNameSpanish(featureInfo.plan)}
							</Typography>
						</Box>

						{featureInfo.availableIn && featureInfo.availableIn.length > 0 && (
							<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
								<Typography variant="body2" color="text.secondary">
									Disponible en:
								</Typography>
								<Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
									{featureInfo.availableIn.map((plan, index) => (
										<Chip
											key={index}
											size="small"
											label={formatPlanNameSpanish(plan)}
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

	// Helper para formatear descripción de recursos
	const formatResourceDescription = (resource: { name: string; limit: number; displayName?: string }) => {
		return `${resource.limit} ${resource.displayName || resource.name}`;
	};

	// Renderizado de un solo plan (formato ancho con grid de features)
	const renderSinglePlan = (plan: Plan) => {
		const pricing = getPlanPricing(plan);
		const displayPrice = pricing.basePrice;
		const hasDiscount = plan.activeDiscounts && plan.activeDiscounts.length > 0;
		const discount = hasDiscount ? plan.activeDiscounts![0] : null;

		// Ordenar features: habilitadas primero (filtrando por visibility)
		const currentEnv = import.meta.env.PROD ? "production" : "development";
		const isVisibleInCurrentEnv = (visibility: string | undefined) => {
			if (!visibility || visibility === "all") return true;
			if (visibility === "none") return false;
			return visibility === currentEnv;
		};
		const sortedFeatures = [...plan.features].filter((f) => isVisibleInCurrentEnv(f.visibility)).sort((a, b) => {
			if (a.enabled === b.enabled) return 0;
			return a.enabled ? -1 : 1;
		});

		return (
			<MainCard
				elevation={0}
				sx={{
					width: "100%",
					maxWidth: "700px",
					mx: "auto",
					overflow: "visible",
					border: `1px solid ${theme.palette.divider}`,
					transition: "all 0.3s ease-in-out",
					"&:hover": {
						boxShadow: theme.shadows[4],
						borderColor: theme.palette.primary.main,
					},
				}}
			>
				{/* Header del plan con precio y botón */}
				<Box
					sx={{
						...getPlanStyle(plan.planId, false),
						pt: 2,
						pb: 2,
					}}
				>
					<Stack spacing={1.5} alignItems="center">
						{getPlanChip(plan.planId, false, plan.isDefault)}
						<Typography variant="h4">{cleanPlanDisplayName(plan.displayName)}</Typography>
						{hasDiscount && discount ? (
							<>
								<Stack direction="row" spacing={1.5} alignItems="baseline" justifyContent="center">
									<Typography
										variant="h4"
										sx={{
											textDecoration: "line-through",
											color: "text.secondary",
											fontWeight: 500,
											opacity: 0.8,
										}}
									>
										${discount.originalPrice}
									</Typography>
									<Typography variant="h2" sx={{ ...price, color: "success.main" }}>
										${discount.finalPrice}
									</Typography>
								</Stack>
								<Typography variant="h6" color="textSecondary">
									{getBillingPeriodText(pricing.billingPeriod)}
								</Typography>
								<Box sx={{ textAlign: "center", mt: 0.5 }}>
									<Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
										<DiscountShape size={14} color="var(--mui-palette-success-main)" />
										<Chip
											label={discount.badge}
											size="small"
											color="success"
											sx={{ fontWeight: 700, fontSize: "0.7rem" }}
										/>
									</Stack>
									<Typography variant="caption" color="success.dark" sx={{ display: "block", mt: 0.5, fontWeight: 600 }}>
										{discount.promotionalMessage}
									</Typography>
									{discount.durationInMonths && (
										<Typography variant="caption" color="success.dark" sx={{ display: "block" }}>
											Válido por {discount.durationInMonths} meses
										</Typography>
									)}
								</Box>
							</>
						) : (
							<Box sx={{ display: "flex", alignItems: "baseline", justifyContent: "center" }}>
								<Typography variant="h2" sx={price}>
									${displayPrice}
								</Typography>
								<Typography variant="h6" color="textSecondary" sx={{ ml: 1 }}>
									{getBillingPeriodText(pricing.billingPeriod)}
								</Typography>
							</Box>
						)}
						<Button
							color={getButtonColor(plan.planId, false)}
							variant="contained"
							onClick={() => !loadingPlanId && handleUpgrade(plan.planId)}
							disabled={loadingPlanId !== null}
							endIcon={loadingPlanId === plan.planId ? <CircularProgress size={16} color="inherit" /> : <ArrowRight size={16} />}
							size="large"
							sx={{
								py: 1.5,
								px: 4,
								fontWeight: 600,
								transition: "all 0.3s ease-in-out",
								"&:hover": {
									transform: "scale(1.02)",
								},
							}}
						>
							{loadingPlanId === plan.planId ? "Procesando..." : "Suscribirme Ahora"}
						</Button>
					</Stack>
				</Box>

				{/* Grid de recursos y features */}
				<Box sx={{ p: 2 }}>
					{/* Recursos en una fila */}
					<Grid container spacing={1} sx={{ mb: 2 }}>
						{plan.resourceLimits.filter((resource) => isVisibleInCurrentEnv(resource.visibility)).map((resource, i) => (
							<Grid item xs={6} sm={3} key={`resource-${i}`}>
								<Box
									sx={{
										textAlign: "center",
										p: 1,
										bgcolor: theme.palette.background.default,
										borderRadius: 1,
									}}
								>
									<Typography variant="body2" fontWeight="medium">
										{formatResourceDescription(resource)}
									</Typography>
								</Box>
							</Grid>
						))}
					</Grid>

					<Divider sx={{ my: 1.5 }} />

					{/* Features en grid de 2 columnas */}
					<Grid container spacing={1}>
						{sortedFeatures.map((feature, i) => (
							<Grid item xs={12} sm={6} key={`feature-${i}`}>
								<Box
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1,
										py: 0.5,
										...(feature.enabled ? {} : priceListDisable),
									}}
								>
									{feature.enabled ? (
										<TickCircle size={16} variant="Bold" color={theme.palette.success.main} />
									) : (
										<CloseCircle size={16} variant="Bold" color={theme.palette.text.disabled} />
									)}
									<Typography variant="body2" sx={{ fontWeight: feature.enabled ? "medium" : "normal" }}>
										{feature.description}
									</Typography>
								</Box>
							</Grid>
						))}
					</Grid>
				</Box>
			</MainCard>
		);
	};

	// Renderizado de múltiples planes (formato compacto con grid de features)
	const renderMultiplePlans = (activePlans: Plan[]) => {
		return (
			<Grid container spacing={2} justifyContent="center">
				{activePlans.map((plan) => {
					const pricing = getPlanPricing(plan);
					const displayPrice = pricing.basePrice;
					const hasDiscount = plan.activeDiscounts && plan.activeDiscounts.length > 0;
					const discount = hasDiscount ? plan.activeDiscounts![0] : null;

					// Ordenar features: habilitadas primero (filtrando por visibility)
					const currentEnv = import.meta.env.PROD ? "production" : "development";
					const isVisibleInCurrentEnv = (visibility: string | undefined) => {
						if (!visibility || visibility === "all") return true;
						if (visibility === "none") return false;
						return visibility === currentEnv;
					};
					const sortedFeatures = [...plan.features].filter((f) => isVisibleInCurrentEnv(f.visibility)).sort((a, b) => {
						if (a.enabled === b.enabled) return 0;
						return a.enabled ? -1 : 1;
					});

					return (
						<Grid item xs={12} sm={6} key={plan.planId}>
							<MainCard
								elevation={0}
								sx={{
									height: "100%",
									overflow: "visible",
									border: `1px solid ${theme.palette.divider}`,
									transition: "all 0.3s ease-in-out",
									"&:hover": {
										transform: "translateY(-3px)",
										boxShadow: theme.shadows[4],
										borderColor: theme.palette.primary.main,
									},
								}}
							>
								{/* Header del plan */}
								<Box
									sx={{
										...getPlanStyle(plan.planId, false),
										pt: 1.5,
										pb: 1.5,
									}}
								>
									<Stack spacing={1} alignItems="center">
										{getPlanChip(plan.planId, false, plan.isDefault)}
										<Typography variant="h5">{cleanPlanDisplayName(plan.displayName)}</Typography>
										{hasDiscount && discount ? (
											<>
												<Stack direction="row" spacing={1} alignItems="baseline">
													<Typography
														variant="h5"
														sx={{
															textDecoration: "line-through",
															color: "text.secondary",
															fontWeight: 500,
															opacity: 0.8,
														}}
													>
														${discount.originalPrice}
													</Typography>
													<Typography variant="h3" sx={{ fontWeight: 700, color: "success.main" }}>
														${discount.finalPrice}
													</Typography>
												</Stack>
												<Typography variant="caption" color="textSecondary">
													{getBillingPeriodText(pricing.billingPeriod)}
												</Typography>
												<Box sx={{ textAlign: "center" }}>
													<Stack direction="row" spacing={0.5} alignItems="center" justifyContent="center">
														<DiscountShape size={12} color="var(--mui-palette-success-main)" />
														<Chip
															label={discount.badge}
															size="small"
															color="success"
															sx={{ fontWeight: 700, fontSize: "0.65rem", height: 20 }}
														/>
													</Stack>
													<Typography variant="caption" color="success.dark" sx={{ display: "block", mt: 0.25, fontWeight: 600, fontSize: "0.65rem" }}>
														{discount.promotionalMessage}
													</Typography>
													{discount.durationInMonths && (
														<Typography variant="caption" color="success.dark" sx={{ display: "block", fontSize: "0.65rem" }}>
															Válido por {discount.durationInMonths} meses
														</Typography>
													)}
												</Box>
											</>
										) : (
											<>
												<Box sx={{ display: "flex", alignItems: "baseline" }}>
													<Typography variant="h3" sx={{ fontWeight: 700 }}>
														${displayPrice}
													</Typography>
													<Typography variant="body2" color="textSecondary" sx={{ ml: 0.5 }}>
														{getBillingPeriodText(pricing.billingPeriod)}
													</Typography>
												</Box>
											</>
										)}
										<Button
											color={getButtonColor(plan.planId, false)}
											variant="contained"
											fullWidth
											onClick={() => !loadingPlanId && handleUpgrade(plan.planId)}
											disabled={loadingPlanId !== null}
											endIcon={loadingPlanId === plan.planId ? <CircularProgress size={14} color="inherit" /> : <ArrowRight size={14} />}
											size="small"
											sx={{
												py: 0.75,
												fontWeight: 600,
											}}
										>
											{loadingPlanId === plan.planId ? "Procesando..." : "Suscribirme"}
										</Button>
									</Stack>
								</Box>

								{/* Contenido: recursos y features en grid */}
								<Box sx={{ p: 1.5 }}>
									{/* Recursos en grid 2x2 */}
									<Grid container spacing={0.5} sx={{ mb: 1 }}>
										{plan.resourceLimits.filter((resource) => isVisibleInCurrentEnv(resource.visibility)).map((resource, i) => (
											<Grid item xs={6} key={`resource-${i}`}>
												<Box
													sx={{
														textAlign: "center",
														py: 0.5,
														px: 0.5,
														bgcolor: theme.palette.background.default,
														borderRadius: 0.5,
													}}
												>
													<Typography variant="caption" fontWeight="medium">
														{formatResourceDescription(resource)}
													</Typography>
												</Box>
											</Grid>
										))}
									</Grid>

									<Divider sx={{ my: 1 }} />

									{/* Features en grid 2 columnas */}
									<Grid container spacing={0.5}>
										{sortedFeatures.map((feature, i) => (
											<Grid item xs={6} key={`feature-${i}`}>
												<Box
													sx={{
														display: "flex",
														alignItems: "center",
														gap: 0.5,
														py: 0.25,
														...(feature.enabled ? {} : priceListDisable),
													}}
												>
													{feature.enabled ? (
														<TickCircle size={12} variant="Bold" color={theme.palette.success.main} />
													) : (
														<CloseCircle size={12} variant="Bold" color={theme.palette.text.disabled} />
													)}
													<Typography
														variant="caption"
														sx={{
															fontWeight: feature.enabled ? 500 : "normal",
															lineHeight: 1.2,
														}}
													>
														{feature.description}
													</Typography>
												</Box>
											</Grid>
										))}
									</Grid>
								</Box>
							</MainCard>
						</Grid>
					);
				})}
			</Grid>
		);
	};

	// Función principal de renderizado de planes
	const renderPlansList = () => {
		if (loading) {
			return (
				<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", height: 350 }}>
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
		const activePlans = recommendedPlans.filter((plan) => plan.isActive);

		const currentEnv = import.meta.env.PROD ? "production" : "development";
		const isVisibleInCurrentEnv = (visibility: string | undefined) => {
			if (!visibility || visibility === "all") return true;
			if (visibility === "none") return false;
			return visibility === currentEnv;
		};

		// Si no hay planes activos disponibles
		if (activePlans.length === 0) {
			return <Alert severity="info">No hay planes disponibles para actualizar en este momento.</Alert>;
		}

		// Si hay un solo plan, usar formato ancho con grid
		if (activePlans.length === 1) {
			return renderSinglePlan(activePlans[0]);
		}

		// Si hay múltiples planes, usar formato de cards
		return renderMultiplePlans(activePlans);
	};

	// Altura fija del contenido para evitar resize durante la carga
	const MODAL_CONTENT_HEIGHT = 480;

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

			<DialogContent sx={{ p: 2.5, minHeight: MODAL_CONTENT_HEIGHT }}>
				<Box sx={{ mx: "auto", height: "100%" }}>
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

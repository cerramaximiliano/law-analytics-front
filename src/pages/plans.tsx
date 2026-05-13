import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Alert, Box, Button, Chip, CircularProgress, Container, Grid, Stack, Typography } from "@mui/material";

// third-party
import { motion } from "framer-motion";

// icons
import { CloseCircle, Lock, TickCircle } from "iconsax-react";

// project-imports
import MainCard from "components/MainCard";
import ApiService, { Plan } from "store/reducers/ApiService";
import CustomBreadcrumbs from "components/guides/CustomBreadcrumbs";
import PageBackground from "components/PageBackground";
import { cleanPlanDisplayName, getCurrentEnvironment, getPlanPricing } from "utils/planPricingUtils";

// ============================== TOKENS ============================== //
// Mantener en sync con sections/landing/Planes.tsx — el lenguaje visual de
// esta página debe ser idéntico al de la sección de planes de la landing.
const BRAND_BLUE = "#3A7BFF";
const BRAND_PURPLE = "#8A5CFF";
const RECOMMENDED_BORDER_GRADIENT = `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_PURPLE}, ${BRAND_BLUE})`;

// ============================== HELPERS ============================== //

const formatPriceShort = (price: number): string => (price % 1 === 0 ? `$${price}` : `$${price.toFixed(2)}`);

const billingSuffixShort = (period: string): string => {
	switch (period) {
		case "monthly":
			return "/mes";
		case "daily":
			return "/día";
		case "weekly":
			return "/semana";
		case "yearly":
		case "annual":
			return "/año";
		default:
			return "";
	}
};

// El plan recomendado es el estándar — mismo criterio que la landing.
const isHighlightedPlan = (planId: string): boolean => planId === "standard";

// Texto del CTA por plan — consistente con la landing.
const ctaLabelFor = (plan: Plan, loadingPlanId: string | null): string => {
	if (!plan.isActive) return "No disponible";
	if (loadingPlanId === plan.planId) return "Procesando...";
	if (plan.planId === "free") return "Empezar gratis";
	return `Probar ${cleanPlanDisplayName(plan.displayName)}`;
};

// ============================== PLANS ============================== //

const Plans = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [plans, setPlans] = useState<Plan[]>([]);
	const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

	const breadcrumbItems = [{ title: "Inicio", to: "/" }, { title: "Planes y Precios" }];

	useEffect(() => {
		const fetchPlans = async () => {
			try {
				setLoading(true);
				const response = await ApiService.getPublicPlans();
				if (response.success && response.data) {
					setPlans(response.data);
				} else {
					setError("No se pudieron cargar los planes");
				}
			} catch {
				setError("Error al cargar los planes. Por favor, intentá más tarde.");
			} finally {
				setLoading(false);
			}
		};
		fetchPlans();
	}, []);

	const currentEnv = getCurrentEnvironment();
	const isVisibleInCurrentEnv = (visibility?: string): boolean => {
		if (!visibility || visibility === "all") return true;
		if (visibility === "none") return false;
		return visibility === currentEnv;
	};

	const sectionLabel = (text: string) => (
		<Typography
			sx={{
				fontSize: "0.7rem",
				fontWeight: 600,
				letterSpacing: "0.12em",
				textTransform: "uppercase",
				color: theme.palette.text.secondary,
				mb: 1.25,
			}}
		>
			{text}
		</Typography>
	);

	return (
		<Box
			component="section"
			sx={{
				pt: { xs: 10, md: 14 },
				pb: { xs: 6, md: 10 },
				position: "relative",
				overflow: "hidden",
			}}
		>
			<PageBackground variant="light" />

			{/* Spotlight atmosférico detrás del plan destacado — mismo lenguaje
			    que la sección Planes de la landing (radial brand-blue blur). */}
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					top: "55%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					width: { xs: 520, md: 880 },
					height: { xs: 520, md: 880 },
					borderRadius: "50%",
					background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)} 0%, ${alpha(
						BRAND_BLUE,
						isDark ? 0.05 : 0.03,
					)} 40%, transparent 70%)`,
					filter: "blur(70px)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>

			<Container sx={{ position: "relative", zIndex: 1 }}>
				<CustomBreadcrumbs items={breadcrumbItems} />

				{/* Hero — typography editorial coherente con landing */}
				<Box sx={{ textAlign: "center", mt: { xs: 2, md: 3 }, mb: { xs: 5, md: 7 } }}>
					<motion.div
						initial={{ opacity: 0, y: 30 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ type: "spring", stiffness: 150, damping: 30 }}
					>
						<Typography
							variant="h1"
							sx={{
								fontSize: { xs: "2rem", sm: "2.5rem", md: "3rem" },
								fontWeight: 600,
								lineHeight: 1.08,
								letterSpacing: "-0.025em",
								textWrap: "balance",
								mb: 2,
								color: isDark ? theme.palette.grey[50] : theme.palette.grey[900],
							}}
						>
							Planes para cada tamaño de estudio
						</Typography>
					</motion.div>
					<motion.div
						initial={{ opacity: 0, y: 20 }}
						animate={{ opacity: 1, y: 0 }}
						transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.1 }}
					>
						<Typography
							sx={{
								maxWidth: 640,
								mx: "auto",
								fontSize: { xs: "1rem", md: "1.125rem" },
								fontWeight: 400,
								lineHeight: 1.5,
								letterSpacing: "-0.005em",
								color: theme.palette.text.secondary,
								textWrap: "pretty",
							}}
						>
							Elegí el plan que mejor se adapte a tu estudio. Cambiá cuando quieras.
						</Typography>
					</motion.div>
				</Box>

				{loading && (
					<Box sx={{ display: "flex", justifyContent: "center", py: 8 }}>
						<CircularProgress sx={{ color: BRAND_BLUE }} />
					</Box>
				)}

				{error && (
					<Box sx={{ display: "flex", justifyContent: "center", py: 4 }}>
						<Alert severity="error" sx={{ borderRadius: 2 }}>
							{error}
						</Alert>
					</Box>
				)}

				{!loading && !error && (
					<Grid container spacing={3} alignItems="stretch" justifyContent="center">
						{plans.map((plan, idx) => {
							const pricing = getPlanPricing(plan);
							const isFree = plan.planId === "free" || pricing.basePrice === 0;
							const highlighted = isHighlightedPlan(plan.planId);
							const promoDiscount =
								!isFree && plan.activeDiscounts && plan.activeDiscounts.length > 0 ? plan.activeDiscounts[0] : undefined;

							const visibleResources = plan.resourceLimits
								.filter((r) => isVisibleInCurrentEnv(r.visibility))
								.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
							const visibleFeatures = plan.features
								.filter((f) => isVisibleInCurrentEnv(f.visibility))
								.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));

							return (
								<Grid item xs={12} sm={6} md={4} key={plan.planId}>
									<motion.div
										initial={{ opacity: 0, y: 24 }}
										whileInView={{ opacity: 1, y: 0 }}
										viewport={{ once: true, margin: "-80px" }}
										transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
										style={{ height: "100%" }}
									>
										<MainCard
											border={!highlighted}
											sx={{
												height: "100%",
												position: "relative",
												overflow: "visible",
												borderRadius: 2,
												...(highlighted && {
													bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
													// Borde gradient azul→púrpura via ::before + mask composite
													"&::before": {
														content: '""',
														position: "absolute",
														inset: 0,
														borderRadius: "inherit",
														padding: "1.5px",
														background: RECOMMENDED_BORDER_GRADIENT,
														WebkitMask:
															"linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
														WebkitMaskComposite: "xor",
														maskComposite: "exclude",
														pointerEvents: "none",
														zIndex: 1,
													},
													boxShadow: `0 14px 36px ${alpha(BRAND_BLUE, 0.14)}, 0 6px 14px ${alpha(BRAND_BLUE, 0.08)}`,
												}),
												transition: "box-shadow 0.3s ease, border-color 0.3s ease",
												"&:hover": {
													boxShadow: {
														md: highlighted
															? `0 22px 48px ${alpha(BRAND_BLUE, 0.22)}, 0 10px 22px ${alpha(BRAND_BLUE, 0.12)}`
															: `0 12px 28px ${alpha(theme.palette.common.black, 0.1)}, 0 4px 10px ${alpha(
																	theme.palette.common.black,
																	0.06,
															  )}`,
													},
													borderColor: { md: highlighted ? undefined : alpha(BRAND_BLUE, 0.25) },
												},
												// Plan no disponible: atenuar visualmente sin tapar info
												...(!plan.isActive && { opacity: 0.55, filter: "saturate(0.6)" }),
											}}
										>
											{highlighted && plan.isActive && (
												<Chip
													label="RECOMENDADO"
													size="small"
													sx={{
														position: "absolute",
														top: -11,
														left: "50%",
														transform: "translateX(-50%)",
														background: RECOMMENDED_BORDER_GRADIENT,
														color: "#fff",
														fontWeight: 600,
														fontSize: "0.65rem",
														letterSpacing: "0.14em",
														height: 22,
														px: 1.25,
														borderRadius: 1,
														boxShadow: `0 6px 14px ${alpha(BRAND_BLUE, 0.32)}`,
														zIndex: 2,
														"& .MuiChip-label": { px: 0.5 },
													}}
												/>
											)}

											{!plan.isActive && (
												<Chip
													label="PRÓXIMAMENTE"
													size="small"
													icon={<Lock size={12} variant="Bold" />}
													sx={{
														position: "absolute",
														top: -11,
														left: "50%",
														transform: "translateX(-50%)",
														bgcolor: theme.palette.warning.main,
														color: theme.palette.warning.contrastText,
														fontWeight: 600,
														fontSize: "0.65rem",
														letterSpacing: "0.12em",
														height: 22,
														px: 1.25,
														borderRadius: 1,
														zIndex: 2,
														"& .MuiChip-label": { px: 0.5 },
														"& .MuiChip-icon": { color: "inherit", ml: 0.25, mr: -0.25 },
													}}
												/>
											)}

											<Box sx={{ display: "flex", flexDirection: "column", height: "100%", gap: 2.5 }}>
												{/* Header: nombre, descripción, precio, badge de descuento */}
												<Box>
													<Typography
														variant="h4"
														sx={{
															fontWeight: 600,
															fontSize: "1.375rem",
															letterSpacing: "-0.015em",
															mb: 0.5,
															color: isDark ? theme.palette.grey[100] : theme.palette.grey[900],
														}}
													>
														{cleanPlanDisplayName(plan.displayName)}
													</Typography>

													{/* Descripción truncada a 2 líneas — reserva altura para alinear
													    precios entre las 3 cards aunque las descripciones varíen. */}
													<Typography
														sx={{
															fontSize: "0.88rem",
															color: theme.palette.text.secondary,
															lineHeight: 1.4,
															mb: 2,
															display: "-webkit-box",
															WebkitLineClamp: 2,
															WebkitBoxOrient: "vertical",
															overflow: "hidden",
															minHeight: "2.5em",
														}}
													>
														{plan.description || " "}
													</Typography>

													<Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, flexWrap: "wrap" }}>
														{promoDiscount && (
															<Typography
																sx={{
																	fontSize: "1.1rem",
																	fontWeight: 500,
																	color: theme.palette.text.secondary,
																	textDecoration: "line-through",
																	opacity: 0.7,
																	fontVariantNumeric: "tabular-nums",
																}}
															>
																{formatPriceShort(promoDiscount.originalPrice)}
															</Typography>
														)}
														<Typography
															variant="h2"
															sx={{
																fontWeight: 600,
																fontSize: { xs: "2.5rem", md: "3rem" },
																lineHeight: 1,
																letterSpacing: "-0.03em",
																fontVariantNumeric: "tabular-nums",
																color: isDark ? theme.palette.grey[50] : theme.palette.grey[900],
															}}
														>
															{promoDiscount
																? formatPriceShort(promoDiscount.finalPrice)
																: formatPriceShort(pricing.basePrice)}
														</Typography>
														{!isFree && (
															<Typography
																sx={{
																	fontSize: "0.95rem",
																	fontWeight: 500,
																	color: theme.palette.text.secondary,
																	fontVariantNumeric: "tabular-nums",
																}}
															>
																{billingSuffixShort(pricing.billingPeriod)}
															</Typography>
														)}
													</Box>

													{/* Caption / badge — para free: "Para siempre". Para descuento:
													    chip + mensaje. Para plan pago sin descuento: invisible pero
													    reservando altura para alinear el divider entre cards. */}
													{promoDiscount ? (
														<Stack
															direction={{ xs: "column", sm: "row" }}
															spacing={1}
															alignItems={{ xs: "flex-start", sm: "center" }}
															sx={{ mt: 0.75 }}
														>
															{promoDiscount.badge && (
																<Chip
																	label={promoDiscount.badge}
																	size="small"
																	color="success"
																	sx={{
																		height: 20,
																		fontSize: "0.7rem",
																		fontWeight: 700,
																		letterSpacing: "0.04em",
																		"& .MuiChip-label": { px: 0.75 },
																	}}
																/>
															)}
															{promoDiscount.promotionalMessage && (
																<Typography
																	sx={{
																		fontSize: "0.78rem",
																		color: theme.palette.text.secondary,
																		fontWeight: 400,
																		letterSpacing: "0.01em",
																	}}
																>
																	{promoDiscount.promotionalMessage}
																</Typography>
															)}
														</Stack>
													) : (
														<Typography
															aria-hidden={!isFree}
															sx={{
																mt: 0.5,
																fontSize: "0.78rem",
																color: theme.palette.text.secondary,
																letterSpacing: "0.02em",
																visibility: isFree ? "visible" : "hidden",
															}}
														>
															{isFree ? "Para siempre" : "—"}
														</Typography>
													)}
												</Box>

												<Box sx={{ height: 1, bgcolor: alpha(theme.palette.divider, 0.5) }} />

												<Stack spacing={2.5} sx={{ flex: 1 }}>
													{visibleResources.length > 0 && (
														<Box>
															{sectionLabel("Recursos")}
															<Stack spacing={1.25}>
																{visibleResources.map((resource, i) => (
																	<Box
																		key={`r-${i}`}
																		sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
																	>
																		<Box sx={{ flexShrink: 0, mt: "2px", lineHeight: 0 }}>
																			<TickCircle
																				size={16}
																				variant="Bulk"
																				color={theme.palette.success.main}
																			/>
																		</Box>
																		<Typography
																			sx={{
																				fontSize: "0.88rem",
																				color: theme.palette.text.primary,
																				lineHeight: 1.5,
																			}}
																		>
																			<Box
																				component="span"
																				sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}
																			>
																				{resource.limit}
																			</Box>{" "}
																			{resource.displayName}
																		</Typography>
																	</Box>
																))}
															</Stack>
														</Box>
													)}

													{visibleFeatures.length > 0 && (
														<Box>
															{sectionLabel("Funcionalidades")}
															<Stack spacing={1.25}>
																{visibleFeatures.map((feature, i) => (
																	<Box
																		key={`f-${i}`}
																		sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}
																	>
																		<Box sx={{ flexShrink: 0, mt: "2px", lineHeight: 0 }}>
																			{feature.enabled ? (
																				<TickCircle
																					size={16}
																					variant="Bulk"
																					color={theme.palette.success.main}
																				/>
																			) : (
																				<CloseCircle
																					size={16}
																					variant="Bulk"
																					color={theme.palette.text.disabled}
																				/>
																			)}
																		</Box>
																		<Typography
																			sx={{
																				fontSize: "0.88rem",
																				color: feature.enabled
																					? theme.palette.text.primary
																					: theme.palette.text.secondary,
																				lineHeight: 1.5,
																			}}
																		>
																			{feature.displayName || feature.description}
																		</Typography>
																	</Box>
																))}
															</Stack>
														</Box>
													)}
												</Stack>

												<Button
													component={RouterLink}
													to="/login"
													variant={highlighted ? "contained" : "outlined"}
													color="primary"
													size="large"
													fullWidth
													disabled={!plan.isActive || loadingPlanId !== null}
													onClick={() => {
														if (plan.isActive) setLoadingPlanId(plan.planId);
													}}
													startIcon={
														loadingPlanId === plan.planId ? (
															<CircularProgress size={14} color="inherit" />
														) : undefined
													}
													sx={{
														mt: 1,
														height: 46,
														fontSize: "0.95rem",
														fontWeight: 600,
														textTransform: "none",
														borderRadius: 2,
														...(highlighted && {
															boxShadow: `0 8px 20px ${alpha(BRAND_BLUE, 0.3)}`,
															"&:hover": {
																boxShadow: `0 12px 26px ${alpha(BRAND_BLUE, 0.4)}`,
																transform: "translateY(-2px)",
															},
														}),
													}}
												>
													{ctaLabelFor(plan, loadingPlanId)}
												</Button>
											</Box>
										</MainCard>
									</motion.div>
								</Grid>
							);
						})}
					</Grid>
				)}
			</Container>
		</Box>
	);
};

export default Plans;

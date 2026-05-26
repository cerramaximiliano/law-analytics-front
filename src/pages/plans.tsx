import { useEffect, useState } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";
import { useDispatch } from "react-redux";

// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Alert, Box, Button, Chip, CircularProgress, Container, Grid, Stack, Typography } from "@mui/material";

// third-party
import { motion } from "framer-motion";

// icons
import { ArrowRight2 } from "iconsax-react";

// project-imports
import PlanCard from "components/cards/PlanCard";
import ApiService, { Plan } from "store/reducers/ApiService";
import CustomBreadcrumbs from "components/guides/CustomBreadcrumbs";
import PageBackground from "components/PageBackground";
import ClaudeAiLogo from "components/icons/ClaudeAiLogo";
import ChatGptLogo from "components/icons/ChatGptLogo";
import { usePublicIntegrations } from "hooks/usePublicIntegrations";
import { usePublicAddons } from "hooks/usePublicAddons";
import useAuth from "hooks/useAuth";
import useSubscription from "hooks/useSubscription";
import { cleanPlanDisplayName, getCurrentEnvironment } from "utils/planPricingUtils";
import { pushGTMEvent } from "utils/gtm";
import { getAiBannerCopy, formatMonthlyPrice, type AiClient } from "utils/mcpBannerCopy";
import { openSnackbar } from "store/reducers/snackbar";

// ============================== TOKENS ============================== //
// Compartidos con PlanCard. Mantener en sync con sections/landing/Planes.tsx.
const BRAND_BLUE = "#3A7BFF";

// ============================== HELPERS ============================== //

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
	const navigate = useNavigate();
	const dispatch = useDispatch();
	const { integrations } = usePublicIntegrations();
	const { addons } = usePublicAddons();
	const { isLoggedIn } = useAuth();
	const { subscription } = useSubscription();

	// Banners MCP visibles si CUALQUIERA de las dos integraciones AI está enabled.
	// Renderizamos UNA card por cliente AI activo (Claude.ai, ChatGPT) en
	// Grid 6/6 — cada card es independiente con su logo + copy específicos.
	const showMcpBanner = integrations.claudeAi.enabled || integrations.chatGpt.enabled;
	// El addon mcp_access es el único hoy; se busca por key + available para
	// que si el backend lo flippea a unavailable mid-session, el banner desaparece.
	const mcpAddon = addons.find((a) => a.key === "mcp_access" && a.available) || null;
	const mcpPriceLabel = mcpAddon ? formatMonthlyPrice(mcpAddon.priceMonthly, mcpAddon.currency) : null;

	// Estado de la subscription del user — null/undefined si anónimo.
	const userPlan = (subscription as any)?.plan as "free" | "standard" | "premium" | undefined;
	const userHasAddon = !!((subscription as any)?.addons || []).find(
		(a: { key?: string; status?: string }) => a?.key === "mcp_access" && a?.status === "active",
	);
	const userPlanIsPaid = userPlan === "standard" || userPlan === "premium";

	const [loading, setLoading] = useState(true);
	const [error, setError] = useState<string | null>(null);
	const [plans, setPlans] = useState<Plan[]>([]);
	const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);
	const [addonBusy, setAddonBusy] = useState(false);

	// CTA contextual del banner MCP:
	// - Anónimo                       → "Iniciar sesión" → /login?source=mcp-banner
	// - Free                          → "Mejorar plan"   → scroll a top de planes
	// - Paid sin addon                → "Agregar"        → POST addAddon
	// - Con addon active              → "Conectar"       → /integraciones/claude-ai
	const handleMcpCtaClick = async () => {
		pushGTMEvent("mcp_plans_cta_click", {
			cta_location: "plans_page",
			user_state: !isLoggedIn ? "anonymous" : userHasAddon ? "has_addon" : userPlanIsPaid ? "paid_no_addon" : "free",
		});

		if (!isLoggedIn) {
			navigate("/login?source=mcp-banner");
			return;
		}
		if (userHasAddon) {
			navigate("/integraciones/claude-ai");
			return;
		}
		if (!userPlanIsPaid) {
			// Free → scroll arriba al grid de planes (sin redirect, ya estás en /plans).
			window.scrollTo({ top: 0, behavior: "smooth" });
			dispatch(
				openSnackbar({
					open: true,
					message: "Necesitás un plan Standard o Premium para agregar el conector MCP.",
					variant: "alert",
					alert: { color: "info" },
					close: true,
				}),
			);
			return;
		}

		// Paid sin addon → checkout real.
		try {
			setAddonBusy(true);
			const res = await ApiService.addAddon("mcp_access");
			if (res.success) {
				const msg = res.alreadyActive
					? "El conector MCP ya estaba activo."
					: "Conector MCP agregado a tu suscripción. Procesando…";
				dispatch(openSnackbar({ open: true, message: msg, variant: "alert", alert: { color: "success" }, close: false }));
				// Redirigir a la página de integración después del éxito.
				setTimeout(() => navigate("/integraciones/claude-ai"), 1500);
			}
		} catch (err) {
			const message = err instanceof Error ? err.message : "Error al agregar el addon";
			dispatch(openSnackbar({ open: true, message, variant: "alert", alert: { color: "error" }, close: true }));
		} finally {
			setAddonBusy(false);
		}
	};

	const mcpCtaLabel = !isLoggedIn
		? "Iniciar sesión para agregar"
		: userHasAddon
			? "Conectar Claude.ai / ChatGPT"
			: !userPlanIsPaid
				? "Mejorar plan para agregar"
				: addonBusy
					? "Procesando…"
					: "Agregar conector MCP";

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

	// `currentEnv` ya no se usa acá — la lógica de visibility vive en PlanCard.
	void getCurrentEnvironment;

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
							const highlighted = isHighlightedPlan(plan.planId);
							return (
								<Grid item xs={12} sm={6} md={4} key={plan.planId}>
									<PlanCard
										plan={plan}
										highlighted={highlighted}
										animationIdx={idx}
										cta={{
											label: ctaLabelFor(plan, loadingPlanId),
											component: RouterLink,
											to: "/login",
											disabled: !plan.isActive || loadingPlanId !== null,
											loading: loadingPlanId === plan.planId,
											onClick: () => {
												if (plan.isActive) setLoadingPlanId(plan.planId);
											},
											variant: highlighted ? "contained" : "outlined",
											color: "primary",
										}}
									/>
								</Grid>
							);
						})}
					</Grid>
				)}

				{/* Cards MCP — addon mcp_access (Phase 9 — billing real).
				    Una card SEPARADA por cliente AI activo (Claude.ai, ChatGPT).
				    Cuando ambos están enabled, se renderean lado a lado en
				    Grid 6/6 con el mismo peso visual. CTA contextual compartido
				    (el addon mcp_access cubre ambos clientes). NO va a /register
				    → no impacta Funnel 1. Tracking: mcp_plans_cta_click con user_state. */}
				{!loading && !error && plans.length > 0 && showMcpBanner && (
					<Box sx={{ mt: 6 }}>
						<Grid container spacing={3} alignItems="stretch">
							{(["claudeAi", "chatGpt"] as AiClient[])
								.filter((c) => integrations[c].enabled)
								.map((client, idx, arr) => {
									const copy = getAiBannerCopy(client);
									const md = arr.length > 1 ? 6 : 12;
									return (
										<Grid item xs={12} md={md} key={client}>
											<Box
												component={motion.div}
												initial={{ opacity: 0, y: 20 }}
												animate={{ opacity: 1, y: 0 }}
												transition={{ duration: 0.4, delay: 0.3 + idx * 0.1 }}
												sx={{
													height: "100%",
													p: { xs: 3, md: 4 },
													borderRadius: 3,
													border: `1px solid ${alpha(BRAND_BLUE, 0.2)}`,
													bgcolor: alpha(BRAND_BLUE, 0.04),
													display: "flex",
													flexDirection: "column",
												}}
											>
												<Stack direction="row" spacing={2} alignItems="center" sx={{ mb: 2 }}>
													{client === "claudeAi" ? <ClaudeAiLogo size={40} /> : <ChatGptLogo size={40} />}
													<Stack direction="row" spacing={1} alignItems="center" sx={{ flexWrap: "wrap" }}>
														<Typography variant="h6" sx={{ fontWeight: 700, lineHeight: 1.2 }}>
															{copy.displayName}
														</Typography>
														<Chip
															label="Add-on"
															size="small"
															sx={{
																fontWeight: 600,
																letterSpacing: 0.5,
																bgcolor: alpha(BRAND_BLUE, 0.12),
																color: BRAND_BLUE,
															}}
														/>
													</Stack>
												</Stack>

												<Typography variant="body2" color="text.secondary" sx={{ mb: 2, flex: 1 }}>
													{copy.description}
													{!userHasAddon && " Aditivo a planes Standard y Premium."}
												</Typography>

												{mcpPriceLabel && !userHasAddon && (
													<Typography variant="body1" sx={{ fontWeight: 700, mb: 2, color: BRAND_BLUE }}>
														{mcpPriceLabel}
													</Typography>
												)}

												<Button
													variant={userHasAddon ? "outlined" : "contained"}
													color="primary"
													onClick={handleMcpCtaClick}
													disabled={addonBusy}
													endIcon={<ArrowRight2 size={16} />}
													fullWidth
												>
													{mcpCtaLabel}
												</Button>
											</Box>
										</Grid>
									);
								})}
						</Grid>
					</Box>
				)}
			</Container>
		</Box>
	);
};


export default Plans;

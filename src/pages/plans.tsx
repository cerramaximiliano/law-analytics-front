import { useEffect, useState } from "react";
import { Link as RouterLink, useLocation } from "react-router-dom";
import { useDispatch } from "react-redux";

// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Box, Container, Grid, Typography } from "@mui/material";

// third-party
import { motion } from "framer-motion";

// project-imports
import PlanCard from "components/cards/PlanCard";
import ApiService, { Plan } from "store/reducers/ApiService";
import { PLANES_RESPALDO } from "data/planesRespaldo";
import CustomBreadcrumbs from "components/guides/CustomBreadcrumbs";
import PageBackground from "components/PageBackground";
import McpAddonCard from "sections/mcp/McpAddonCard";
import { usePublicIntegrations } from "hooks/usePublicIntegrations";
import useMcpAddon from "hooks/useMcpAddon";
import { cleanPlanDisplayName, getCurrentEnvironment } from "utils/planPricingUtils";
import { pushGTMEvent } from "utils/gtm";
import { MCP_ADDON_ANCHOR, MCP_ADDON_NAME, isMcpAddonVisible } from "utils/mcpAddonState";
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

// Los botones van al registro con el plan elegido, igual que el teaser de la
// landing (source=plan_teaser). Iban a /login: quien llegaba desde un precio de
// Google Ads caía en el inicio de sesión y se perdían el origen y el plan.
const registerUrlFor = (planId: string): string => `/register?source=plans_page&plan=${encodeURIComponent(planId)}`;

const trackPlanCTA = (planId: string) => {
	pushGTMEvent("cta_click_plans_page", { source: "plans_page", plan: planId });
};

// ============================== PLANS ============================== //

const Plans = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const dispatch = useDispatch();
	const { hash } = useLocation();
	const { integrations } = usePublicIntegrations();
	const { addon } = useMcpAddon();

	// Tarjeta del add-on "Conectores de IA" (mcp_access, cubre Claude.ai y ChatGPT):
	// visible con la integración abierta al público (también para anónimos), o si el
	// usuario ya lo tiene, tiene acceso beta o es admin (venta cerrada, puede comprar
	// igual) — isMcpAddonVisible, misma regla que Cuenta → Suscripción. Ojo: si /me
	// falla al cargar (hub reiniciando), la SPA queda como anónima y con la venta
	// cerrada la tarjeta no aparece aunque la sesión exista.
	const showMcpAddon = integrations.claudeAi.enabled || integrations.chatGpt.enabled || isMcpAddonVisible(addon);

	// Las tarjetas se dibujan desde el primer momento con el respaldo estático y
	// se actualizan en sitio cuando responde la API (mismo criterio que la sección
	// Planes de la landing). Antes había un indicador de carga que después se
	// reemplazaba por las cuatro tarjetas: todo lo de abajo saltaba (CLS 0,98) y
	// quien llegaba desde un precio del anuncio veía una página sin precios.
	const [plans, setPlans] = useState<Plan[]>(PLANES_RESPALDO);
	const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

	// Plan gratuito → subir al grid de planes (sin redirect, ya estás en /plans).
	const handleMcpUpgrade = () => {
		window.scrollTo({ top: 0, behavior: "smooth" });
		dispatch(
			openSnackbar({
				open: true,
				message: `Elegí un plan Estándar, Pro o Premium para sumar ${MCP_ADDON_NAME}.`,
				variant: "alert",
				alert: { color: "info" },
				close: true,
			}),
		);
	};

	// Deep link /plans#conectores-ia: bajar a la tarjeta del add-on cuando se monta.
	useEffect(() => {
		if (hash !== `#${MCP_ADDON_ANCHOR}` || !showMcpAddon) return;
		const t = setTimeout(() => document.getElementById(MCP_ADDON_ANCHOR)?.scrollIntoView({ behavior: "smooth", block: "start" }), 300);
		return () => clearTimeout(t);
	}, [hash, showMcpAddon]);

	const breadcrumbItems = [{ title: "Inicio", to: "/" }, { title: "Planes y Precios" }];

	useEffect(() => {
		let cancelled = false;
		const fetchPlans = async () => {
			try {
				const response = await ApiService.getPublicPlans();
				if (!cancelled && response.success && response.data?.length) {
					setPlans(response.data);
				}
			} catch {
				// silencioso: quedan los valores del respaldo
			}
		};
		fetchPlans();
		return () => {
			cancelled = true;
		};
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
										to: registerUrlFor(plan.planId),
										disabled: !plan.isActive || loadingPlanId !== null,
										loading: loadingPlanId === plan.planId,
										onClick: () => {
											if (!plan.isActive) return;
											trackPlanCTA(plan.planId);
											setLoadingPlanId(plan.planId);
										},
										variant: highlighted ? "contained" : "outlined",
										color: "primary",
									}}
								/>
							</Grid>
						);
					})}
				</Grid>

				{/* Add-on "Conectores de IA" — una tarjeta para ambos asistentes (el add-on
				    mcp_access cubre Claude.ai y ChatGPT). NO va a /register salvo para anónimos
				    (source=mcp_addon). Tracking: mcp_plans_cta_click con user_state (la-ads). */}
				{showMcpAddon && (
					<Box id={MCP_ADDON_ANCHOR} sx={{ mt: { xs: 5, md: 7 }, scrollMarginTop: 96 }}>
						<McpAddonCard variant="plans" location="plans_page" onUpgradeClick={handleMcpUpgrade} />
					</Box>
				)}
			</Container>
		</Box>
	);
};

export default Plans;

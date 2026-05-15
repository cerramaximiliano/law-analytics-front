import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

// material-ui
import { useTheme, alpha } from "@mui/material/styles";
import { Alert, Box, CircularProgress, Container, Grid, Typography } from "@mui/material";

// third-party
import { motion } from "framer-motion";

// project-imports
import PlanCard from "components/cards/PlanCard";
import ApiService, { Plan } from "store/reducers/ApiService";
import CustomBreadcrumbs from "components/guides/CustomBreadcrumbs";
import PageBackground from "components/PageBackground";
import { cleanPlanDisplayName, getCurrentEnvironment } from "utils/planPricingUtils";

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
			</Container>
		</Box>
	);
};


export default Plans;

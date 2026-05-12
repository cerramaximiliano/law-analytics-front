import { Link as RouterLink } from "react-router-dom";

// material-ui
import { Box, Button, Chip, Container, Grid, Stack, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

// third party
import { motion } from "framer-motion";
import { TickCircle, ArrowRight } from "iconsax-react";

// project-imports
import MainCard from "components/MainCard";
import FadeInWhenVisible from "./Animation";
import { pushGTMEvent } from "utils/gtm";

// ============================== TOKENS ============================== //
const BRAND_BLUE = "#3A7BFF";
const LIVE_GREEN = "#22C55E";

// ============================== TIPOS ============================== //

interface Plan {
	id: "free" | "standard" | "premium";
	name: string;
	price: string;
	priceSuffix: string;
	features: string[];
	cta: string;
	ctaTo: string;
	highlighted: boolean;
	mobileOrder: number; // En xs queremos Standard primero (most relevant), luego Free, Premium.
}

const PLANS: Plan[] = [
	{
		id: "free",
		name: "Gratuito",
		price: "$0",
		priceSuffix: "Para siempre",
		features: ["Calculadoras laborales básicas", "Calendario con vencimientos", "Hasta 5 expedientes", "Soporte por email"],
		cta: "Empezar gratis",
		ctaTo: "/register",
		highlighted: false,
		mobileOrder: 2,
	},
	{
		id: "standard",
		name: "Estándar",
		price: "$19.99",
		priceSuffix: "/mes",
		features: ["Todo lo del plan Gratuito", "Expedientes ilimitados", "Integración PJN + MEV", "Asistente IA para escritos"],
		cta: "Probar Estándar",
		ctaTo: "/register?plan=standard",
		highlighted: true,
		mobileOrder: 1,
	},
	{
		id: "premium",
		name: "Premium",
		price: "$49.99",
		priceSuffix: "/mes",
		features: [
			"Todo lo del plan Estándar",
			"Tracking postal ilimitado",
			"Sistema de citas online",
			"Modo Team multi-usuario",
			"Soporte prioritario",
		],
		cta: "Probar Premium",
		ctaTo: "/register?plan=premium",
		highlighted: false,
		mobileOrder: 3,
	},
];

const trackPlanCTA = (planId: Plan["id"]) => {
	pushGTMEvent("cta_click_plan_teaser", { plan: planId });
};

// ============================== LANDING - PLANES ============================== //

const Planes = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	void LIVE_GREEN;

	return (
		<Box
			component="section"
			sx={{
				position: "relative",
				overflow: "hidden",
				py: { xs: 4, md: 7 },
			}}
		>
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					top: "8%",
					right: "-15%",
					width: { xs: 380, md: 560 },
					height: { xs: 380, md: 560 },
					borderRadius: "50%",
					background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.10)} 0%, transparent 62%)`,
					filter: "blur(70px)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					bottom: "-5%",
					left: "-15%",
					width: { xs: 360, md: 520 },
					height: { xs: 360, md: 520 },
					borderRadius: "50%",
					background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.08 : 0.06)} 0%, transparent 65%)`,
					filter: "blur(80px)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					inset: 0,
					backgroundImage: `radial-gradient(${alpha(theme.palette.text.primary, isDark ? 0.05 : 0.04)} 1px, transparent 1px)`,
					backgroundSize: "26px 26px",
					maskImage: "radial-gradient(ellipse 70% 70% at center, #000 0%, transparent 75%)",
					WebkitMaskImage: "radial-gradient(ellipse 70% 70% at center, #000 0%, transparent 75%)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>

			<Container sx={{ position: "relative", zIndex: 1 }}>
				<Box sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
					<motion.div
						initial={{ opacity: 0, translateY: 50 }}
						whileInView={{ opacity: 1, translateY: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.05 }}
					>
						<Typography variant="h2">Planes para cada tamaño de estudio</Typography>
					</motion.div>
					<motion.div
						initial={{ opacity: 0, translateY: 30 }}
						whileInView={{ opacity: 1, translateY: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.15 }}
					>
						<Typography variant="h5" color="text.secondary" sx={{ maxWidth: 760, mx: "auto", mt: 1.5 }}>
							Empezá gratis. Cambiá de plan en cualquier momento.
						</Typography>
					</motion.div>
				</Box>

				<Grid container spacing={3} alignItems="stretch" justifyContent="center" sx={{ pt: { xs: 2, md: 2 } }}>
					{PLANS.map((plan) => {
						const checkColor = plan.id === "free" ? theme.palette.text.secondary : theme.palette.success.main;
						const isHighlighted = plan.highlighted;

						return (
							<Grid
								item
								xs={12}
								sm={6}
								md={4}
								key={plan.id}
								sx={{
									order: { xs: plan.mobileOrder, md: 0 },
								}}
							>
								<FadeInWhenVisible>
									<MainCard
										sx={{
											height: "100%",
											position: "relative",
											overflow: "visible",
											...(isHighlighted && {
												borderColor: alpha(BRAND_BLUE, 0.35),
												boxShadow: `0 14px 36px ${alpha(BRAND_BLUE, 0.16)}, 0 6px 14px ${alpha(BRAND_BLUE, 0.08)}`,
												transform: { md: "translateY(-8px)" },
											}),
											transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
											"&:hover": {
												transform: { md: isHighlighted ? "translateY(-10px)" : "translateY(-4px)" },
												boxShadow: {
													md: `0 18px 40px ${alpha(BRAND_BLUE, 0.18)}, 0 8px 18px ${alpha(BRAND_BLUE, 0.10)}`,
												},
												borderColor: { md: alpha(BRAND_BLUE, isHighlighted ? 0.5 : 0.25) },
											},
										}}
									>
										{isHighlighted && (
											<Chip
												label="Recomendado"
												size="small"
												sx={{
													position: "absolute",
													top: -12,
													left: "50%",
													transform: "translateX(-50%)",
													bgcolor: BRAND_BLUE,
													color: "#fff",
													fontWeight: 600,
													fontSize: "0.7rem",
													letterSpacing: "0.06em",
													height: 24,
													px: 0.5,
													boxShadow: `0 4px 12px ${alpha(BRAND_BLUE, 0.35)}`,
												}}
											/>
										)}

										<Box sx={{ display: "flex", flexDirection: "column", height: "100%", gap: 2 }}>
											<Box>
												<Typography
													variant="h4"
													sx={{
														fontWeight: 700,
														mb: 1.5,
														color: isDark ? theme.palette.grey[100] : theme.palette.grey[900],
													}}
												>
													{plan.name}
												</Typography>

												<Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, mb: 0.25 }}>
													<Typography
														variant="h2"
														sx={{
															fontWeight: 700,
															lineHeight: 1,
															color: isDark ? theme.palette.grey[50] : theme.palette.grey[900],
														}}
													>
														{plan.price}
													</Typography>
													{plan.id !== "free" && (
														<Typography
															sx={{
																fontSize: "0.95rem",
																fontWeight: 500,
																color: theme.palette.text.secondary,
															}}
														>
															{plan.priceSuffix}
														</Typography>
													)}
												</Box>
												{plan.id === "free" && (
													<Typography
														sx={{
															fontSize: "0.78rem",
															color: theme.palette.text.secondary,
															letterSpacing: "0.02em",
														}}
													>
														{plan.priceSuffix}
													</Typography>
												)}
											</Box>

											<Box sx={{ height: 1, bgcolor: alpha(theme.palette.divider, 0.5) }} />

											<Stack spacing={1.25} sx={{ flex: 1 }}>
												{plan.features.map((feature, idx) => (
													<Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
														<Box sx={{ flexShrink: 0, mt: "2px", lineHeight: 0 }}>
															<TickCircle size={16} variant="Bulk" color={checkColor} />
														</Box>
														<Typography
															sx={{
																fontSize: "0.88rem",
																color: theme.palette.text.primary,
																lineHeight: 1.5,
															}}
														>
															{feature}
														</Typography>
													</Box>
												))}
											</Stack>

											<Button
												component={RouterLink}
												to={plan.ctaTo}
												onClick={() => trackPlanCTA(plan.id)}
												variant={isHighlighted ? "contained" : "outlined"}
												color="primary"
												size="large"
												fullWidth
												sx={{
													mt: 1,
													height: 46,
													fontSize: "0.95rem",
													fontWeight: 600,
													textTransform: "none",
													borderRadius: 2,
													...(isHighlighted && {
														boxShadow: `0 8px 20px ${alpha(BRAND_BLUE, 0.30)}`,
														"&:hover": {
															boxShadow: `0 12px 26px ${alpha(BRAND_BLUE, 0.40)}`,
															transform: "translateY(-2px)",
														},
													}),
												}}
											>
												{plan.cta}
											</Button>
										</Box>
									</MainCard>
								</FadeInWhenVisible>
							</Grid>
						);
					})}
				</Grid>

				<Box sx={{ mt: { xs: 4, md: 5 }, textAlign: "center" }}>
					<Button
						component={RouterLink}
						to="/plans"
						variant="text"
						color="primary"
						endIcon={<ArrowRight size={16} />}
						sx={{
							fontSize: "0.95rem",
							fontWeight: 600,
							textTransform: "none",
							"&:hover": {
								bgcolor: alpha(BRAND_BLUE, 0.06),
							},
						}}
					>
						Ver todos los planes y comparar
					</Button>
				</Box>
			</Container>
		</Box>
	);
};

export default Planes;

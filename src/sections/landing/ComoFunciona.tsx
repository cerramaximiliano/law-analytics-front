// material-ui
import { Box, Container, Grid, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

// third party
import { motion } from "framer-motion";
import { UserAdd, LinkSquare, Verify } from "iconsax-react";

// project-imports
import MainCard from "components/MainCard";
import SectionEyebrow from "./SectionEyebrow";

// ============================== TOKENS ============================== //
const BRAND_BLUE = "#3A7BFF";
const LIVE_GREEN = "#22C55E";

// ============================== TIPOS ============================== //

type ColorKey = "primary" | "secondary" | "error" | "warning" | "info" | "success";

interface Step {
	number: string;
	iconComponent: React.ElementType;
	title: string;
	description: string;
	colorKey: ColorKey;
}

const STEPS: Step[] = [
	{
		number: "01",
		iconComponent: UserAdd,
		title: "Registrate",
		description: "Creá tu cuenta gratis con email o Google. Sin tarjeta, sin compromiso.",
		colorKey: "primary",
	},
	{
		number: "02",
		iconComponent: LinkSquare,
		title: "Conectá tus credenciales PJN/MEV",
		description:
			"Vinculá tus accesos para sincronizar automáticamente, o sumá causas por N° de expediente — la opción más liviana.",
		colorKey: "info",
	},
	{
		number: "03",
		iconComponent: Verify,
		title: "Listo, todo tu estudio en un lugar",
		description: "Causas, movimientos, agenda, cálculos y clientes — centralizados desde el primer día.",
		colorKey: "success",
	},
];

// ============================== LANDING - COMO FUNCIONA ============================== //

const ComoFunciona = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	// Referencia explícita a LIVE_GREEN para mantener tokens compartidos con el resto.
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
			{/* Atmósfera — un único blob arriba al centro, sin dot grid.
			    Variación respecto a Hero/Technologies para romper la repetición. */}
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					top: { xs: "-15%", md: "-25%" },
					left: "50%",
					transform: "translateX(-50%)",
					width: { xs: 600, md: 1100 },
					height: { xs: 400, md: 650 },
					borderRadius: "50%",
					background: `radial-gradient(ellipse at center, ${alpha(BRAND_BLUE, isDark ? 0.12 : 0.08)} 0%, transparent 65%)`,
					filter: "blur(90px)",
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
						<SectionEyebrow number="01" label="Cómo empezar" align="center" mb={2.5} />
						<Typography
							variant="h2"
							sx={{
								fontSize: { xs: "1.875rem", sm: "2.25rem", md: "2.75rem" },
								lineHeight: 1.08,
								letterSpacing: "-0.025em",
								textWrap: "balance",
							}}
						>
							Empezá en 3 pasos
						</Typography>
					</motion.div>
					<motion.div
						initial={{ opacity: 0, translateY: 30 }}
						whileInView={{ opacity: 1, translateY: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.15 }}
					>
						<Typography
							variant="h5"
							color="text.secondary"
							sx={{
								maxWidth: 640,
								mx: "auto",
								mt: 1.5,
								fontSize: { xs: "1rem", md: "1.125rem" },
								fontWeight: 400,
								lineHeight: 1.5,
								letterSpacing: "-0.005em",
								textWrap: "pretty",
							}}
						>
							Sin instalación, sin migraciones complicadas. En menos de 5 minutos tu estudio está conectado.
						</Typography>
					</motion.div>
				</Box>

				<Grid container spacing={3} alignItems="stretch" justifyContent="center">
					{STEPS.map((step, idx) => {
						const Icon = step.iconComponent;
						const color = theme.palette[step.colorKey].main;
						const isLast = idx === STEPS.length - 1;

						return (
							<Grid
								item
								xs={12}
								md={4}
								key={step.number}
								sx={{ position: "relative" }}
							>
								<motion.div
									initial={{ opacity: 0, y: 30 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true, margin: "-80px" }}
									transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
									style={{ height: "100%" }}
								>
									<MainCard
										sx={{
											height: "100%",
											position: "relative",
											transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
											"&:hover": {
												transform: { md: "translateY(-4px)" },
												boxShadow: {
													md: `0 14px 30px ${alpha(BRAND_BLUE, 0.14)}, 0 6px 14px ${alpha(BRAND_BLUE, 0.08)}`,
												},
												borderColor: { md: alpha(color, 0.35) },
											},
										}}
									>
										<Box sx={{ display: "flex", flexDirection: "column", alignItems: "flex-start", gap: 2 }}>
											{/* Header: step badge + icon container */}
											<Box sx={{ display: "flex", alignItems: "center", gap: 1.5, width: "100%" }}>
												<Box
													sx={{
														width: 32,
														height: 32,
														borderRadius: "50%",
														bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.12),
														color: BRAND_BLUE,
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														fontWeight: 700,
														fontSize: "0.78rem",
														letterSpacing: "0.04em",
														fontFeatureSettings: '"tnum"',
														flexShrink: 0,
													}}
												>
													{step.number}
												</Box>
												<Box
													sx={{
														flex: 1,
														height: 1,
														bgcolor: alpha(theme.palette.divider, 0.5),
													}}
												/>
												<Box
													sx={{
														width: 56,
														height: 56,
														borderRadius: 2,
														bgcolor: alpha(color, isDark ? 0.18 : 0.10),
														display: "flex",
														alignItems: "center",
														justifyContent: "center",
														flexShrink: 0,
													}}
												>
													<Icon size={30} variant="Bulk" color={color} />
												</Box>
											</Box>

											<Box>
												<Typography
													variant="h5"
													sx={{
														fontWeight: 600,
														mb: 1,
														color: isDark ? theme.palette.grey[100] : theme.palette.grey[900],
														lineHeight: 1.3,
													}}
												>
													{step.title}
												</Typography>
												<Typography
													sx={{
														color: theme.palette.text.secondary,
														lineHeight: 1.55,
														fontSize: "0.92rem",
													}}
												>
													{step.description}
												</Typography>
											</Box>
										</Box>
									</MainCard>
								</motion.div>

								{/* Flow connector: pista sólida + cometa con estela que viaja izq→der.
								Los dos conectores se desfasan medio ciclo para crear sensación de cascada. */}
								{!isLast && (
									<Box
										aria-hidden
										sx={{
											position: "absolute",
											top: 92,
											right: -28,
											width: 56,
											height: 14,
											display: { xs: "none", md: "block" },
											pointerEvents: "none",
											zIndex: 2,
											"&::before": {
												content: '""',
												position: "absolute",
												left: 0,
												right: 0,
												top: "50%",
												height: 2,
												transform: "translateY(-50%)",
												bgcolor: alpha(BRAND_BLUE, isDark ? 0.30 : 0.22),
												borderRadius: 1,
											},
											"&::after": {
												// Animado vía `transform: translateX` (GPU-accelerated) en lugar de `left`.
												// El track va de -26px (off-screen left) a +56px (off-screen right) =
												// ancho del container 56 + ancho del elemento 26 = 82px de viaje total.
												content: '""',
												position: "absolute",
												top: "50%",
												left: 0,
												width: 26,
												height: 6,
												marginTop: "-3px",
												borderRadius: 4,
												background: `linear-gradient(90deg, transparent, ${BRAND_BLUE})`,
												boxShadow: `0 0 12px ${alpha(BRAND_BLUE, 0.75)}, 0 0 22px ${alpha(BRAND_BLUE, 0.4)}`,
												transform: "translateX(-26px)",
												willChange: "transform",
												animation: "como-funciona-comet 1.8s linear infinite",
												animationDelay: `${idx * 0.9}s`,
											},
											"@keyframes como-funciona-comet": {
												"0%": { transform: "translateX(-26px)", opacity: 0 },
												"12%": { opacity: 1 },
												"88%": { opacity: 1 },
												"100%": { transform: "translateX(56px)", opacity: 0 },
											},
											"@media (prefers-reduced-motion: reduce)": {
												"&::after": { animation: "none", display: "none" },
											},
										}}
									/>
								)}
							</Grid>
						);
					})}
				</Grid>
			</Container>
		</Box>
	);
};

export default ComoFunciona;

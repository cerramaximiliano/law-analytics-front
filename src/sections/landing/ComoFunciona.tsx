// material-ui
import { Box, Container, Grid, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

// third party
import { motion } from "framer-motion";
import { UserAdd, LinkSquare, Verify } from "iconsax-react";

// project-imports
import MainCard from "components/MainCard";

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
			{/* Atmósfera — blobs brand-blue + dot grid (consistente con Hero/Technologies) */}
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
						<Typography variant="h2">Empezá en 3 pasos</Typography>
					</motion.div>
					<motion.div
						initial={{ opacity: 0, translateY: 30 }}
						whileInView={{ opacity: 1, translateY: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.15 }}
					>
						<Typography variant="h5" color="text.secondary" sx={{ maxWidth: 760, mx: "auto", mt: 1.5 }}>
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
												content: '""',
												position: "absolute",
												top: "50%",
												width: 26,
												height: 6,
												marginTop: "-3px",
												borderRadius: 4,
												background: `linear-gradient(90deg, transparent, ${BRAND_BLUE})`,
												boxShadow: `0 0 12px ${alpha(BRAND_BLUE, 0.75)}, 0 0 22px ${alpha(BRAND_BLUE, 0.4)}`,
												left: "-26px",
												animation: "como-funciona-comet 1.8s linear infinite",
												animationDelay: `${idx * 0.9}s`,
											},
											"@keyframes como-funciona-comet": {
												"0%": { left: "-26px", opacity: 0 },
												"12%": { opacity: 1 },
												"88%": { opacity: 1 },
												"100%": { left: "100%", opacity: 0 },
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

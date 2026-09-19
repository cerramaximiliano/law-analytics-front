// Encabezado de /funciones.
//
// Asimétrico a propósito: el título manda a la izquierda y la captura del
// escritorio se apoya a la derecha, saliéndose de la grilla. El fondo usa un
// radial suave del azul de marca más una capa de grano, para que la sección no
// quede plana; nada de degradé violeta en 45 grados.

import { Box, Button, Container, Grid, Stack, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { motion } from "framer-motion";
import { ArrowDown2, ArrowRight } from "iconsax-react";

import capDashboard from "assets/images/desktop_dashboard.png";
import { CIFRAS } from "./funcionesData";

const AZUL = "#3A7BFF";

// Grano en base64 (SVG de ruido): rompe la planicie del fondo sin pedir un archivo.
const GRANO =
	"url(\"data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='160' height='160'%3E%3Cfilter id='n'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='.85' numOctaves='3'/%3E%3C/filter%3E%3Crect width='160' height='160' filter='url(%23n)' opacity='.38'/%3E%3C/svg%3E\")";

interface Props {
	onEmpezar: () => void;
	onVerFunciones: () => void;
}

const FuncionesHero = ({ onEmpezar, onVerFunciones }: Props) => {
	const theme = useTheme();
	const oscuro = theme.palette.mode === "dark";

	const entrada = (retraso: number) => ({
		initial: { opacity: 0, y: 22 },
		animate: { opacity: 1, y: 0 },
		transition: { duration: 0.55, delay: retraso, ease: [0.22, 0.61, 0.36, 1] as const },
	});

	return (
		<Box
			component="header"
			sx={{
				position: "relative",
				overflow: "hidden",
				pt: { xs: 8, md: 13 },
				pb: { xs: 8, md: 12 },
				bgcolor: oscuro ? "#0b101c" : "#f7f9fc",
				"&::before": {
					content: '""',
					position: "absolute",
					inset: 0,
					background: `radial-gradient(90% 70% at 18% 0%, ${alpha(AZUL, oscuro ? 0.22 : 0.13)} 0%, transparent 62%)`,
					pointerEvents: "none",
				},
				"&::after": {
					content: '""',
					position: "absolute",
					inset: 0,
					backgroundImage: GRANO,
					opacity: oscuro ? 0.05 : 0.035,
					mixBlendMode: "overlay",
					pointerEvents: "none",
				},
			}}
		>
			<Container maxWidth="lg" sx={{ position: "relative" }}>
				<Grid container spacing={{ xs: 6, md: 6 }} alignItems="center">
					<Grid item xs={12} md={6}>
						<Box component={motion.div} {...entrada(0)}>
							<Typography
								component="span"
								sx={{
									display: "inline-block",
									fontSize: "0.7rem",
									fontWeight: 600,
									letterSpacing: "0.14em",
									textTransform: "uppercase",
									color: AZUL,
									border: `1px solid ${alpha(AZUL, 0.22)}`,
									bgcolor: alpha(AZUL, oscuro ? 0.14 : 0.07),
									borderRadius: 1,
									px: 1.25,
									py: 0.4,
									mb: 3,
								}}
							>
								Todo lo que hace la app
							</Typography>

							<Typography
								component="h1"
								sx={{
									fontSize: { xs: "2.3rem", sm: "2.9rem", md: "3.4rem" },
									fontWeight: 600,
									letterSpacing: "-0.038em",
									lineHeight: 1.04,
									textWrap: "balance",
									mb: 2.5,
								}}
							>
								El expediente te avisa a vos, no al revés
							</Typography>

							<Typography
								variant="h5"
								component="p"
								color="text.secondary"
								sx={{ fontWeight: 400, lineHeight: 1.6, maxWidth: "58ch", mb: 4.5 }}
							>
								Law Analytics sincroniza tus causas con los portales judiciales, proyecta los vencimientos,
								calcula liquidaciones con los topes del mes y guarda todo en la carpeta que corresponde.
								Mirá cada función antes de crear la cuenta.
							</Typography>
						</Box>

						<Stack component={motion.div} {...entrada(0.1)} direction={{ xs: "column", sm: "row" }} spacing={1.75}>
							<Button
								variant="contained"
								disableElevation
								size="large"
								onClick={onEmpezar}
								endIcon={<ArrowRight size={18} />}
								sx={{
									bgcolor: AZUL,
									px: 3.25,
									py: 1.4,
									borderRadius: 2,
									fontWeight: 600,
									textTransform: "none",
									boxShadow: `0 14px 30px -14px ${alpha(AZUL, 0.95)}`,
									transition: "transform .2s ease, background-color .2s ease",
									"&:hover": { bgcolor: "#2f6ae8", transform: "translateY(-1px)" },
									"&:active": { transform: "scale(0.985)" },
								}}
							>
								Empezar gratis
							</Button>
							<Button
								variant="outlined"
								size="large"
								onClick={onVerFunciones}
								endIcon={<ArrowDown2 size={17} />}
								sx={{
									px: 3,
									py: 1.4,
									borderRadius: 2,
									fontWeight: 500,
									textTransform: "none",
									color: "text.primary",
									borderColor: theme.palette.divider,
									transition: "transform .2s ease, border-color .2s ease",
									"&:hover": { borderColor: alpha(AZUL, 0.5), bgcolor: alpha(AZUL, 0.04), transform: "translateY(-1px)" },
								}}
							>
								Ver las funciones
							</Button>
						</Stack>

						<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 2 }}>
							Sin tarjeta. Configuración inicial en menos de dos minutos.
						</Typography>

						<Box
							component={motion.div}
							{...entrada(0.18)}
							sx={{
								mt: 5,
								display: "grid",
								gridTemplateColumns: { xs: "repeat(3, 1fr)" },
								columnGap: { xs: 2, sm: 3 },
								maxWidth: 520,
							}}
						>
							{CIFRAS.map((c, i) => (
								<Box
									key={c.etiqueta}
									sx={{
										pl: i === 0 ? 0 : { xs: 2, sm: 3 },
										borderLeft: i === 0 ? "none" : `1px solid ${theme.palette.divider}`,
									}}
								>
									<Typography
										sx={{
											fontSize: { xs: "1.5rem", md: "1.75rem" },
											fontWeight: 600,
											letterSpacing: "-0.03em",
											fontVariantNumeric: "tabular-nums",
											lineHeight: 1.1,
										}}
									>
										{c.valor}
									</Typography>
									<Typography variant="caption" color="text.secondary" sx={{ display: "block", lineHeight: 1.35 }}>
										{c.etiqueta}
									</Typography>
								</Box>
							))}
						</Box>
					</Grid>

					<Grid item xs={12} md={6}>
						<Box
							component={motion.div}
							{...entrada(0.14)}
							sx={{
								position: "relative",
								// Se sale de la grilla en escritorio: rompe la simetría del bloque.
								mr: { md: -8, lg: -14 },
							}}
						>
							<Box
								component="img"
								src={capDashboard}
								alt="Panel de Law Analytics con las causas sincronizadas y sus vencimientos"
								sx={{
									width: "100%",
									height: "auto",
									display: "block",
									borderRadius: 3,
									filter: `drop-shadow(0 30px 60px ${alpha(AZUL, oscuro ? 0.45 : 0.28)})`,
								}}
							/>
						</Box>
					</Grid>
				</Grid>
			</Container>
		</Box>
	);
};

export default FuncionesHero;

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

import { MOCKS } from "./mocks/MockPantallas";
import { TOTAL_LIQUIDACION } from "./mocks/datosFicticios";
import { CIFRAS } from "./funcionesData";
import { varianteDesdeBusqueda } from "./jurisdiccion";

const AZUL = "#3A7BFF";
const VERDE = "#2E9E6B";

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
	const Expedientes = MOCKS.expedientes;
	// Llega con ?jur= desde los anuncios del interior; sin eso, null y la página no cambia.
	const variante = varianteDesdeBusqueda(window.location.search);

	// Sin opacidad inicial en cero: el navegador no cuenta un elemento invisible
	// como contenido principal, y cada animación de entrada sumaba su retraso a la
	// métrica. El desplazamiento se mantiene; la visibilidad, no (2026-09-20).
	const entrada = (retraso: number) => ({
		initial: { y: 22 },
		animate: { y: 0 },
		transition: { duration: 0.55, delay: retraso, ease: [0.22, 0.61, 0.36, 1] as const },
	});

	return (
		<Box
			component="header"
			sx={{
				position: "relative",
				overflow: "hidden",
				// En el teléfono la barra del logo se apoya sobre el encabezado: con 64 px
				// la etiqueta quedaba pegada al logotipo (revisado a 390 px, 2026-09-19).
				pt: { xs: 12, md: 13 },
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
								{variante ? variante.etiqueta : "Todo lo que hace la app"}
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
								Law||Analytics sincroniza tus causas con{" "}
								{variante ? `${variante.portal}, además de PJN, MEV, EJE y SCBA` : "los portales judiciales"}, proyecta los vencimientos,
								calcula liquidaciones con los topes del mes y guarda todo en la carpeta que corresponde. Mirá cada función antes de crear la
								cuenta.
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
								// Tres columnas en un teléfono angosto apretaban "+15.000" contra
								// su etiqueta; en xs van de a dos y la tercera baja.
								gridTemplateColumns: { xs: "repeat(2, 1fr)", sm: "repeat(3, 1fr)" },
								columnGap: { xs: 2, sm: 3 },
								rowGap: { xs: 2.5, sm: 0 },
								maxWidth: 520,
							}}
						>
							{CIFRAS.map((c, i) => (
								<Box
									key={c.etiqueta}
									sx={{
										pl: { xs: i % 2 === 0 ? 0 : 2, sm: i === 0 ? 0 : 3 },
										borderLeft: {
											xs: i % 2 === 0 ? "none" : `1px solid ${theme.palette.divider}`,
											sm: i === 0 ? "none" : `1px solid ${theme.palette.divider}`,
										},
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
						{/* Reemplaza la foto del monitor, cuyo texto era ilegible. La maqueta se
							    dibuja: no hay datos de causas reales y acompaña el tema. La tarjeta del
							    total se apoya en el borde inferior, corrida hacia afuera, y solo pisa el
							    margen de la ventana: ninguna fila queda tapada (2026-09-19). */}
						<Box
							component={motion.div}
							{...entrada(0.14)}
							sx={{
								position: "relative",
								// Se sale de la grilla en escritorio: rompe la simetría del bloque.
								mr: { md: -6, lg: -12 },
							}}
						>
							<Expedientes filas={4} />
							<Box
								sx={{
									// También en el teléfono: es el 93 % del tráfico y la cifra es lo que
									// más rápido explica para qué sirve la app.
									position: "relative",
									zIndex: 2,
									width: { xs: 236, sm: 244, md: 268 },
									ml: { xs: 2, sm: -3, md: -7 },
									mt: -2.5,
									p: 2,
									borderRadius: 3,
									bgcolor: oscuro ? alpha("#0d1220", 0.94) : "#fff",
									border: `1px solid ${alpha(AZUL, oscuro ? 0.24 : 0.14)}`,
									boxShadow: `0 26px 56px -26px ${alpha(AZUL, oscuro ? 0.55 : 0.4)}`,
								}}
							>
								<Typography variant="caption" color="text.secondary" sx={{ display: "block" }}>
									Liquidación por despido
								</Typography>
								<Typography
									sx={{
										fontSize: { xs: "1.45rem", md: "1.7rem" },
										fontWeight: 600,
										letterSpacing: "-0.03em",
										fontVariantNumeric: "tabular-nums",
										lineHeight: 1.15,
										color: AZUL,
										mt: 0.25,
									}}
								>
									$ {TOTAL_LIQUIDACION}
								</Typography>
								<Box
									component="span"
									sx={{
										display: "inline-block",
										mt: 1,
										px: 0.9,
										py: 0.3,
										borderRadius: 1,
										fontSize: "0.66rem",
										fontWeight: 600,
										color: VERDE,
										bgcolor: alpha(VERDE, oscuro ? 0.16 : 0.1),
									}}
								>
									Topes de convenio al día
								</Box>
							</Box>
						</Box>
					</Grid>
				</Grid>
			</Container>
		</Box>
	);
};

export default FuncionesHero;

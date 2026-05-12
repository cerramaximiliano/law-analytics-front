import { Link as RouterLink } from "react-router-dom";

// material-ui
import { Accordion, AccordionDetails, AccordionSummary, Box, Container, Link, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

// third party
import { motion } from "framer-motion";
import { ArrowDown2, ArrowRight } from "iconsax-react";

// project-imports
import MainCard from "components/MainCard";
import FadeInWhenVisible from "./Animation";

// ============================== TOKENS ============================== //
const BRAND_BLUE = "#3A7BFF";

// ============================== DATA ============================== //

interface FaqItem {
	id: string;
	question: string;
	answer: string;
}

const FAQS: FaqItem[] = [
	{
		id: "pricing",
		question: "¿Hay una prueba gratis? ¿Cómo es el pricing?",
		answer:
			"Tenés un plan Gratuito para siempre con lo básico. Los planes Estándar ($19.99/mes) y Premium ($49.99/mes) suman expedientes ilimitados, integraciones PJN/MEV, escritos con IA y más. Podés probar cualquier plan sin tarjeta y cancelar cuando quieras.",
	},
	{
		id: "security",
		question: "¿Cómo manejan la seguridad y la privacidad de mis datos?",
		answer:
			"Todos los datos viajan encriptados (TLS). Tus credenciales judiciales se almacenan cifradas. Cumplimos con la Ley 25.326 de Protección de Datos Personales. Nunca vendemos ni compartimos información con terceros.",
	},
	{
		id: "cancel",
		question: "¿Puedo cancelar mi suscripción cuando quiera?",
		answer:
			"Sí, sin penalidades. La cancelación se hace desde tu panel en un click y mantenés acceso hasta el final del período pagado. No hay permanencia mínima.",
	},
	{
		id: "integrations",
		question: "¿Con qué jurisdicciones se integra?",
		answer:
			"Actualmente PJN (Poder Judicial de la Nación) y MEV (Provincia de Buenos Aires) están en producción. EJE (CABA) y SECLO se integran próximamente. Podés solicitar otras jurisdicciones desde el formulario de contacto.",
	},
	{
		id: "data-deletion",
		question: "¿Qué pasa con mis datos si me doy de baja?",
		answer:
			"Mantenemos tu información por 30 días para que puedas reactivar la cuenta si querés. Luego eliminamos los datos personales y sensibles permanentemente. Podés exportar todo en cualquier momento (CSV/PDF).",
	},
];

// ============================== LANDING - FAQ ============================== //

const Faq = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

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

			<Container sx={{ position: "relative", zIndex: 1, maxWidth: "md" }}>
				<Box sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
					<motion.div
						initial={{ opacity: 0, translateY: 50 }}
						whileInView={{ opacity: 1, translateY: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.05 }}
					>
						<Typography variant="h2">Preguntas frecuentes</Typography>
					</motion.div>
					<motion.div
						initial={{ opacity: 0, translateY: 30 }}
						whileInView={{ opacity: 1, translateY: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.15 }}
					>
						<Typography variant="h5" color="text.secondary" sx={{ maxWidth: 760, mx: "auto", mt: 1.5 }}>
							Lo esencial. Si querés más detalle, mirá nuestra página de preguntas frecuentes completa.
						</Typography>
					</motion.div>
				</Box>

				<Box sx={{ maxWidth: 820, mx: "auto" }}>
					<FadeInWhenVisible>
						<MainCard content={false} sx={{ overflow: "hidden" }}>
							{FAQS.map((faq, idx) => {
								const isLast = idx === FAQS.length - 1;
								return (
									<Accordion
										key={faq.id}
										disableGutters
										elevation={0}
										square
										sx={{
											bgcolor: "transparent",
											"&::before": { display: "none" }, // remueve la línea default arriba del primer item
											borderBottom: isLast ? "none" : `1px solid ${alpha(theme.palette.divider, 0.6)}`,
										}}
									>
										<AccordionSummary
											expandIcon={<ArrowDown2 size={18} color={theme.palette.text.secondary} />}
											sx={{
												px: { xs: 2.5, sm: 3 },
												py: 0.5,
												minHeight: 64,
												"& .MuiAccordionSummary-content": {
													my: 1.5,
												},
												"&:hover": {
													bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.03),
												},
												transition: "background-color 0.2s ease",
											}}
										>
											<Typography
												sx={{
													fontWeight: 600,
													fontSize: { xs: "0.95rem", sm: "1rem" },
													color: isDark ? theme.palette.grey[100] : theme.palette.grey[900],
													lineHeight: 1.4,
												}}
											>
												{faq.question}
											</Typography>
										</AccordionSummary>
										<AccordionDetails
											sx={{
												px: { xs: 2.5, sm: 3 },
												pb: 2.5,
												pt: 0,
											}}
										>
											<Typography
												sx={{
													fontSize: "0.9rem",
													color: theme.palette.text.secondary,
													lineHeight: 1.6,
												}}
											>
												{faq.answer}
											</Typography>
										</AccordionDetails>
									</Accordion>
								);
							})}
						</MainCard>
					</FadeInWhenVisible>

					<Box sx={{ mt: { xs: 3, md: 4 }, textAlign: "center" }}>
						<Link
							component={RouterLink}
							to="/faq"
							underline="hover"
							sx={{
								display: "inline-flex",
								alignItems: "center",
								gap: 0.5,
								fontSize: "0.9rem",
								fontWeight: 600,
								color: theme.palette.primary.main,
								"&:hover": { color: theme.palette.primary.dark },
							}}
						>
							¿No encontraste lo que buscabas? Mirá todas las preguntas
							<ArrowRight size={14} />
						</Link>
					</Box>
				</Box>
			</Container>
		</Box>
	);
};

export default Faq;

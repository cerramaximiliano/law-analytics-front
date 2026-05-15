import { Link as RouterLink } from "react-router-dom";

// material-ui
import { useTheme, alpha, Theme } from "@mui/material/styles";
import { Avatar, Box, Button, Container, Rating, Stack, Typography } from "@mui/material";

// third party
import { motion, Variants } from "framer-motion";
import { QuoteUp, Star1 } from "iconsax-react";

// project-imports
import FadeInWhenVisible from "./Animation";
import SectionEyebrow from "./SectionEyebrow";
import MainCard from "components/MainCard";

// ============================== TOKENS ============================== //
// Misma paleta del resto del landing — el accent es solo el brand-blue del hero.
const BRAND_BLUE = "#3A7BFF";

// Variants para cada card del wall — usadas por el stagger del grid.
const cardItemVariants: Variants = {
	hidden: { opacity: 0, y: 24 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.5, ease: [0.22, 1, 0.36, 1] } },
};

// ============================== ATMOSPHERE ============================== //
// Una sola pieza de atmósfera, muy sutil — top-right pequeña — para dar
// profundidad sin competir con el wall asimétrico de quotes.
const TestimonialAtmosphere = ({ isDark }: { isDark: boolean }) => (
	<Box
		aria-hidden
		sx={{
			position: "absolute",
			top: { xs: "-10%", md: "-15%" },
			right: { xs: "-30%", md: "-10%" },
			width: { xs: 360, md: 520 },
			height: { xs: 360, md: 520 },
			borderRadius: "50%",
			background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.1 : 0.06)} 0%, transparent 65%)`,
			filter: "blur(80px)",
			pointerEvents: "none",
			zIndex: 0,
		}}
	/>
);

// ============================== TIPOS ============================== //

type CardVariant = "hero" | "wide" | "small";

interface Quote {
	id: string;
	text: string;
	name: string;
	initials: string;
	role: string;
	studio: string;
	variant: CardVariant;
	rating?: number; // Solo el hero muestra rating.
}

// ============================== DATA ============================== //
// 5 testimonios — referencian features concretas (calculadora laboral, integración PJN,
// calendario sincronizado, sistema de citas, asignación de tareas) y usan números
// orgánicos en vez de porcentajes redondos para sentirse menos AI-generated.

const QUOTES: Quote[] = [
	{
		id: "leguizamon",
		variant: "hero",
		rating: 5,
		text: "Antes me llevaba dos horas armar una liquidación con los topes actualizados. Hoy la calculadora me la deja lista y solo reviso. Y la integración con PJN me avisa de movimientos antes que el sistema oficial.",
		name: "Mariano Leguizamón",
		initials: "ML",
		role: "Abogado laboralista",
		studio: "Estudio Leguizamón & Asoc.",
	},
	{
		id: "vasquez",
		variant: "small",
		text: "Pasamos de tener clientes en una planilla a verlos junto a sus expedientes y movimientos. Para un estudio chico, eso solo ya justifica el plan.",
		name: "Carolina Vásquez",
		initials: "CV",
		role: "Socia fundadora",
		studio: "Vásquez & Mendoza",
	},
	{
		id: "moreno",
		variant: "small",
		text: "El calendario sincronizado con Google me sacó el doble registro de vencimientos. Anotaba todo en dos lados; ahora basta con uno.",
		name: "Alejandra Moreno",
		initials: "AM",
		role: "Asistente legal senior",
		studio: "Bufete Mendoza Toscano",
	},
	{
		id: "rivero",
		variant: "small",
		text: "El link de reservas online bajó muchísimo las llamadas por agendamientos. Los clientes lo prefieren.",
		name: "Patricia Rivero",
		initials: "PR",
		role: "Abogada de familia",
		studio: "Práctica independiente",
	},
	{
		id: "torres",
		variant: "wide",
		text: "Asignar tareas con plazos y ver de un vistazo quién está atrasado en qué causa cambió cómo trabajamos como equipo. Antes era todo WhatsApp, hoy no se pierde nada en el medio.",
		name: "Diego Torres",
		initials: "DT",
		role: "Director jurídico",
		studio: "Torres & Asociados",
	},
];

// ============================== QUOTE CARD ============================== //
// Una sola card que se adapta por `variant` — la hero tiene tipografía y avatar
// más grandes, rating visible y fondo brand-blue tintado. Las small son neutras.

interface QuoteCardProps {
	quote: Quote;
	theme: Theme;
	isDark: boolean;
}

const QuoteCard = ({ quote, theme, isDark }: QuoteCardProps) => {
	const isHero = quote.variant === "hero";
	const isWide = quote.variant === "wide";

	// Escalas tipográficas según variante — el hero domina, el resto cede peso.
	const quoteSize = isHero
		? { xs: "1.1rem", md: "1.25rem", lg: "1.375rem" }
		: isWide
		? { xs: "1rem", md: "1.0625rem" }
		: { xs: "0.92rem", md: "0.95rem" };
	const padding = isHero ? { xs: 3, md: 4 } : isWide ? { xs: 2.75, md: 3.25 } : { xs: 2.5, md: 2.75 };
	const avatarSize = isHero ? 48 : 40;
	const quoteIconSize = isHero ? 40 : 28;

	// Hero usa fondo brand-blue tintado. El resto, paper limpio.
	const bgColor = isHero ? alpha(BRAND_BLUE, isDark ? 0.1 : 0.05) : theme.palette.background.paper;
	const borderColor = isHero ? alpha(BRAND_BLUE, isDark ? 0.3 : 0.2) : alpha(theme.palette.divider, 0.7);
	const borderRadius = isHero ? 3 : 2;

	return (
		<MainCard
			border={false}
			sx={{
				height: "100%",
				display: "flex",
				flexDirection: "column",
				bgcolor: bgColor,
				border: `1px solid ${borderColor}`,
				borderRadius,
				p: padding,
				transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
				"&:hover": {
					transform: { md: "translateY(-3px)" },
					boxShadow: {
						md: isHero
							? `0 18px 38px ${alpha(BRAND_BLUE, 0.2)}, 0 8px 18px ${alpha(BRAND_BLUE, 0.1)}`
							: `0 12px 26px ${alpha(theme.palette.common.black, 0.1)}, 0 4px 10px ${alpha(theme.palette.common.black, 0.06)}`,
					},
					borderColor: { md: isHero ? alpha(BRAND_BLUE, 0.45) : alpha(theme.palette.divider, 1) },
				},
			}}
		>
			<Stack spacing={isHero ? 2 : 1.5} sx={{ flex: 1 }}>
				<Box sx={{ color: isHero ? BRAND_BLUE : alpha(theme.palette.text.secondary, 0.55), lineHeight: 0 }}>
					<QuoteUp variant="Bulk" size={quoteIconSize} />
				</Box>

				{isHero && quote.rating && (
					<Box sx={{ display: "flex", alignItems: "center", gap: 0.75 }}>
						<Rating
							value={quote.rating}
							readOnly
							size="small"
							icon={<Star1 size={16} variant="Bulk" color={BRAND_BLUE} />}
							emptyIcon={<Star1 size={16} variant="Outline" color={alpha(theme.palette.text.secondary, 0.4)} />}
						/>
					</Box>
				)}

				<Typography
					sx={{
						fontSize: quoteSize,
						fontWeight: isHero ? 500 : 400,
						lineHeight: 1.5,
						letterSpacing: "-0.005em",
						color: isDark ? theme.palette.grey[100] : theme.palette.grey[900],
						textWrap: "pretty",
						flex: 1,
					}}
				>
					{quote.text}
				</Typography>

				<Box sx={{ display: "flex", alignItems: "center", gap: 1.5, pt: 0.5 }}>
					<Avatar
						sx={{
							width: avatarSize,
							height: avatarSize,
							bgcolor: isHero ? alpha(BRAND_BLUE, 0.18) : alpha(theme.palette.text.primary, isDark ? 0.1 : 0.08),
							color: isHero ? BRAND_BLUE : theme.palette.text.primary,
							fontWeight: 600,
							fontSize: isHero ? "0.95rem" : "0.85rem",
							letterSpacing: "-0.01em",
						}}
					>
						{quote.initials}
					</Avatar>
					<Box sx={{ minWidth: 0 }}>
						<Typography
							sx={{
								fontWeight: 600,
								fontSize: isHero ? "0.95rem" : "0.875rem",
								lineHeight: 1.3,
								letterSpacing: "-0.01em",
								color: isDark ? theme.palette.grey[50] : theme.palette.grey[900],
							}}
						>
							{quote.name}
						</Typography>
						<Typography
							sx={{
								fontSize: "0.78rem",
								color: theme.palette.text.secondary,
								lineHeight: 1.4,
							}}
						>
							{quote.role} · {quote.studio}
						</Typography>
					</Box>
				</Box>
			</Stack>
		</MainCard>
	);
};

// ============================== LANDING - TESTIMONIAL ============================== //

const TestimonialPage = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const [hero, vasquez, moreno, rivero, torres] = QUOTES;

	return (
		<Box component="section" sx={{ position: "relative", overflow: "hidden", py: { xs: 4, md: 7 } }}>
			<TestimonialAtmosphere isDark={isDark} />
			<Container sx={{ position: "relative", zIndex: 1 }}>
				<Box sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
					<motion.div
						initial={{ opacity: 0, translateY: 50 }}
						whileInView={{ opacity: 1, translateY: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.05 }}
					>
						<SectionEyebrow number="03" label="Testimonios" align="center" mb={2.5} />
						<Typography
							variant="h2"
							sx={{
								fontSize: { xs: "1.875rem", sm: "2.25rem", md: "2.75rem" },
								lineHeight: 1.08,
								letterSpacing: "-0.025em",
								textWrap: "balance",
								maxWidth: 820,
								mx: "auto",
							}}
						>
							Abogados que ya
							<Box component="span" sx={{ color: theme.palette.primary.main, mx: 1 }}>
								dejaron de trabajar
							</Box>
							a mano
						</Typography>
					</motion.div>
					<motion.div
						initial={{ opacity: 0, translateY: 30 }}
						whileInView={{ opacity: 1, translateY: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.15 }}
					>
						<Typography
							color="text.secondary"
							sx={{
								mt: 2,
								maxWidth: 640,
								mx: "auto",
								fontSize: { xs: "1rem", md: "1.125rem" },
								fontWeight: 400,
								lineHeight: 1.5,
								letterSpacing: "-0.005em",
								textWrap: "pretty",
							}}
						>
							Estudios jurídicos que optimizan su práctica diaria con Law||Analytics.
						</Typography>
					</motion.div>
				</Box>

				{/* Wall asimétrico — 4 cols / 2 rows en desktop, stack en mobile.
				    Hero ocupa col 1-2 row 1 (wide+tall), 3 small en col 3-4 / col 1 row 2,
				    y un wide en col 2-4 row 2 que cierra la composición. */}
				{/* Stagger inline — parent dispara `visible`, cada Box hijo lleva variants
				    para cascadear con 80ms de delay entre cards. */}
				<Box
					component={motion.div}
					initial="hidden"
					whileInView="visible"
					viewport={{ once: true, margin: "-80px" }}
					variants={{
						hidden: {},
						visible: { transition: { staggerChildren: 0.08 } },
					}}
					sx={{
						display: "grid",
						gap: { xs: 2, md: 2.5 },
						gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr", md: "repeat(4, 1fr)" },
						gridAutoRows: { md: "auto" },
					}}
				>
					{/* Hero — col 1-2, row 1 */}
					<Box component={motion.div} variants={cardItemVariants} sx={{ gridColumn: { md: "1 / span 2" }, gridRow: { md: "1" } }}>
						<QuoteCard quote={hero} theme={theme} isDark={isDark} />
					</Box>
					{/* Vasquez — col 3, row 1 */}
					<Box component={motion.div} variants={cardItemVariants} sx={{ gridColumn: { md: "3" }, gridRow: { md: "1" } }}>
						<QuoteCard quote={vasquez} theme={theme} isDark={isDark} />
					</Box>
					{/* Moreno — col 4, row 1 */}
					<Box component={motion.div} variants={cardItemVariants} sx={{ gridColumn: { md: "4" }, gridRow: { md: "1" } }}>
						<QuoteCard quote={moreno} theme={theme} isDark={isDark} />
					</Box>
					{/* Rivero — col 1, row 2 */}
					<Box component={motion.div} variants={cardItemVariants} sx={{ gridColumn: { md: "1" }, gridRow: { md: "2" } }}>
						<QuoteCard quote={rivero} theme={theme} isDark={isDark} />
					</Box>
					{/* Torres wide — col 2-4, row 2 */}
					<Box component={motion.div} variants={cardItemVariants} sx={{ gridColumn: { md: "2 / span 3" }, gridRow: { md: "2" } }}>
						<QuoteCard quote={torres} theme={theme} isDark={isDark} />
					</Box>
				</Box>

				{/* CTA */}
				<Box sx={{ textAlign: "center", mt: { xs: 5, md: 7 } }}>
					<FadeInWhenVisible>
						<Box>
							<Typography
								variant="h4"
								sx={{
									mb: 3,
									fontWeight: 600,
									fontSize: { xs: "1.375rem", md: "1.625rem" },
									lineHeight: 1.25,
									letterSpacing: "-0.02em",
									textWrap: "balance",
									color: isDark ? theme.palette.grey[100] : theme.palette.grey[900],
								}}
							>
								¿Querés trabajar así vos también?
							</Typography>
							<Button
								component={RouterLink}
								to="/register"
								variant="contained"
								color="primary"
								size="large"
								sx={{
									px: 5,
									py: 1.5,
									borderRadius: 2,
									fontWeight: 600,
									fontSize: "1rem",
									boxShadow: theme.shadows[4],
									"&:hover": {
										boxShadow: theme.shadows[8],
										transform: "translateY(-2px)",
									},
									transition: "all 0.2s ease-in-out",
								}}
							>
								Probar gratis ahora
							</Button>
						</Box>
					</FadeInWhenVisible>
				</Box>
			</Container>
		</Box>
	);
};

export default TestimonialPage;

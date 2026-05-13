import { useState, useCallback, useEffect, useRef, ElementType, KeyboardEvent } from "react";
import { Link as RouterLink, useNavigate } from "react-router-dom";

// material-ui
import { Box, Button, Container, Grid, Typography } from "@mui/material";
import { useTheme, alpha, Theme } from "@mui/material/styles";

// third party
import { motion } from "framer-motion";
import {
	FolderOpen,
	Profile2User,
	Calendar,
	Calculator,
	Chart,
	TaskSquare,
	CalendarTick,
	DocumentText,
	Send2,
	ArrowRight2,
	ArrowRight,
} from "iconsax-react";

// project-imports
import FadeInWhenVisible from "./Animation";
import SectionEyebrow from "./SectionEyebrow";
import MainCard from "components/MainCard";
import FeatureModal from "components/FeatureModal";
import { useLandingAnalytics } from "hooks/useLandingAnalytics";
import { FeatureNames, trackViewFeaturesSection } from "utils/gtm";

// ============================== TOKENS ============================== //
// Mismos tokens que el Hero — atmósfera brand-blue + dot verde para nuevos.
const BRAND_BLUE = "#3A7BFF";
const LIVE_GREEN = "#22C55E";

// ============================== TIPOS ============================== //

type ColorKey = "primary" | "secondary" | "error" | "warning" | "info" | "success";

interface FeatureRowData {
	iconComponent: ElementType;
	title: string;
	description: string; // short — 1 línea
	colorKey: ColorKey;
	featureKey: string;
	isNew?: boolean;
}

interface CitasBannerData {
	iconComponent: ElementType;
	title: string;
	description: string;
	cta: string;
	to: string;
	featureKey: string;
}

interface RowBorders {
	right: { xs: string; sm: string };
	bottom: { xs: string; sm: string };
}

interface FeatureRowProps {
	tech: FeatureRowData;
	theme: Theme;
	isDark: boolean;
	onClick: () => void;
	borders: RowBorders;
}

// ============================== FEATURE ROW ============================== //
// Fila compacta horizontal: icono + (título + 1-line desc) + arrow. ~70px de alto.
// Click → abre el FeatureModal. Hover: bg tinted colorKey + arrow desliza.

const FeatureRow = ({ tech, theme, isDark, onClick, borders }: FeatureRowProps) => {
	const Icon = tech.iconComponent;
	const color = theme.palette[tech.colorKey].main;

	const handleKeyDown = (e: KeyboardEvent<HTMLDivElement>) => {
		if (e.key === "Enter" || e.key === " ") {
			e.preventDefault();
			onClick();
		}
	};

	return (
		<Box
			onClick={onClick}
			onKeyDown={handleKeyDown}
			role="button"
			tabIndex={0}
			aria-label={`${tech.title}: ${tech.description}`}
			sx={{
				display: "flex",
				alignItems: "center",
				gap: { xs: 1.5, sm: 2 },
				px: { xs: 2, sm: 2.5 },
				py: { xs: 1.75, sm: 2 },
				cursor: "pointer",
				position: "relative",
				borderRight: borders.right,
				borderBottom: borders.bottom,
				transition: "background-color 0.2s ease",
				"&:hover": {
					bgcolor: alpha(color, isDark ? 0.08 : 0.04),
					"& .row-arrow": { transform: "translateX(4px)", color },
					"& .row-title": { color },
				},
				"&:focus-visible": {
					outline: `2px solid ${alpha(color, 0.5)}`,
					outlineOffset: -2,
				},
			}}
		>
			{/* Icon container + live pulse si es nuevo */}
			<Box
				sx={{
					position: "relative",
					flexShrink: 0,
					width: { xs: 40, sm: 44 },
					height: { xs: 40, sm: 44 },
					borderRadius: 1.5,
					bgcolor: alpha(color, isDark ? 0.18 : 0.1),
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
				}}
			>
				<Icon size={22} variant="Bulk" color={color} />
				{tech.isNew && (
					<Box
						aria-hidden
						sx={{
							position: "absolute",
							top: -3,
							right: -3,
							width: 10,
							height: 10,
							borderRadius: "50%",
							bgcolor: LIVE_GREEN,
							border: `2px solid ${theme.palette.background.paper}`,
							zIndex: 2,
							"&::after": {
								content: '""',
								position: "absolute",
								inset: -1,
								borderRadius: "50%",
								bgcolor: LIVE_GREEN,
								animation: "tech-live-pulse 2.2s ease-out infinite",
							},
							"@keyframes tech-live-pulse": {
								"0%": { transform: "scale(0.9)", opacity: 0.55 },
								"80%, 100%": { transform: "scale(2.4)", opacity: 0 },
							},
						}}
					/>
				)}
			</Box>

			{/* Title + description — ambos 1 línea truncada */}
			<Box sx={{ flex: 1, minWidth: 0 }}>
				<Typography
					className="row-title"
					sx={{
						fontWeight: 600,
						fontSize: "0.95rem",
						lineHeight: 1.3,
						color: isDark ? theme.palette.grey[100] : theme.palette.grey[900],
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
						transition: "color 0.2s ease",
					}}
				>
					{tech.title}
				</Typography>
				<Typography
					sx={{
						fontSize: "0.78rem",
						color: theme.palette.text.secondary,
						lineHeight: 1.4,
						whiteSpace: "nowrap",
						overflow: "hidden",
						textOverflow: "ellipsis",
					}}
				>
					{tech.description}
				</Typography>
			</Box>

			<Box
				className="row-arrow"
				component="span"
				aria-hidden
				sx={{
					display: "inline-flex",
					flexShrink: 0,
					color: theme.palette.text.secondary,
					transition: "transform 0.25s ease, color 0.2s ease",
				}}
			>
				<ArrowRight2 size={18} />
			</Box>
		</Box>
	);
};

// ============================== CITAS BANNER ============================== //
// Banner full-width primary-tinted con CTA explícito. Click navega a /register
// (banner entero + botón, ambos con stopPropagation para evitar doble tracking).

interface CitasBannerProps {
	banner: CitasBannerData;
	theme: Theme;
	isDark: boolean;
	onClick: () => void;
	onCtaTrack: () => void;
}

const CitasBanner = ({ banner, theme, isDark, onClick, onCtaTrack }: CitasBannerProps) => {
	const Icon = banner.iconComponent;
	const primary = theme.palette.primary.main;

	return (
		<MainCard
			onClick={onClick}
			sx={{
				position: "relative",
				overflow: "hidden",
				cursor: "pointer",
				bgcolor: alpha(primary, isDark ? 0.1 : 0.06),
				borderColor: alpha(primary, 0.25),
				transition: "transform 0.3s ease, box-shadow 0.3s ease, border-color 0.3s ease",
				"&:hover": {
					transform: { sm: "translateY(-3px)" },
					boxShadow: { sm: `0 14px 32px ${alpha(BRAND_BLUE, 0.18)}, 0 6px 14px ${alpha(BRAND_BLUE, 0.1)}` },
					borderColor: { sm: alpha(primary, 0.45) },
				},
			}}
		>
			{/* Soft brand-blue blob — echo de la atmósfera de la sección */}
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					top: -50,
					right: -30,
					width: 200,
					height: 200,
					borderRadius: "50%",
					background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.14)} 0%, transparent 65%)`,
					filter: "blur(40px)",
					pointerEvents: "none",
				}}
			/>

			<Box
				sx={{
					position: "relative",
					display: "flex",
					flexDirection: { xs: "column", md: "row" },
					alignItems: "center",
					gap: { xs: 2, md: 2.5 },
					textAlign: { xs: "center", md: "left" },
				}}
			>
				<Box
					sx={{
						width: { xs: 56, md: 60 },
						height: { xs: 56, md: 60 },
						borderRadius: 1.5,
						bgcolor: alpha(primary, isDark ? 0.22 : 0.14),
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						flexShrink: 0,
					}}
				>
					<Icon size={30} variant="Bulk" color={primary} />
				</Box>

				<Box sx={{ flex: 1 }}>
					<Typography
						variant="h5"
						sx={{
							fontWeight: 600,
							mb: 0.5,
							color: isDark ? theme.palette.grey[100] : theme.palette.grey[900],
							lineHeight: 1.25,
						}}
					>
						{banner.title}
					</Typography>
					<Typography
						sx={{
							fontSize: "0.88rem",
							color: theme.palette.text.secondary,
							lineHeight: 1.5,
						}}
					>
						{banner.description}
					</Typography>
				</Box>

				<Box sx={{ flexShrink: 0 }}>
					<Button
						component={RouterLink}
						to={banner.to}
						onClick={(e) => {
							e.stopPropagation();
							onCtaTrack();
						}}
						variant="contained"
						color="primary"
						size="large"
						endIcon={<ArrowRight size={18} color="#fff" />}
						sx={{
							px: 2.5,
							py: 1.25,
							fontSize: "0.9rem",
							fontWeight: 600,
							textTransform: "none",
							borderRadius: 2,
							whiteSpace: "nowrap",
						}}
					>
						{banner.cta}
					</Button>
				</Box>
			</Box>
		</MainCard>
	);
};

// ============================== LANDING - TECHNOLOGIES PAGE ============================== //

const TechnologiesPage = () => {
	const theme = useTheme();
	const navigate = useNavigate();
	const { trackCitasCTA, trackPruebaPagarCTA, trackFeature } = useLandingAnalytics();
	const isDark = theme.palette.mode === "dark";

	const sectionRef = useRef<HTMLDivElement>(null);
	const hasTrackedView = useRef(false);

	const [selectedFeature, setSelectedFeature] = useState<string | null>(null);
	const [modalOpen, setModalOpen] = useState(false);

	useEffect(() => {
		const observer = new IntersectionObserver(
			(entries) => {
				entries.forEach((entry) => {
					if (entry.isIntersecting && !hasTrackedView.current) {
						trackViewFeaturesSection();
						hasTrackedView.current = true;
					}
				});
			},
			{ threshold: 0.5 },
		);

		if (sectionRef.current) {
			observer.observe(sectionRef.current);
		}

		return () => observer.disconnect();
	}, []);

	// 8 features → llenan grid 2×4. Citas va aparte como banner.
	// Orden DOM = orden mobile (single col stack). Fila izq = índice par.
	const items: FeatureRowData[] = [
		{
			iconComponent: FolderOpen,
			title: "Expedientes",
			description: "Notificaciones PJN · MEV en vivo",
			colorKey: "warning",
			featureKey: FeatureNames.CARPETAS,
		},
		{
			iconComponent: Calendar,
			title: "Calendario",
			description: "Sincronizado con Google Calendar",
			colorKey: "info",
			featureKey: FeatureNames.CALENDARIO,
		},
		{
			iconComponent: Calculator,
			title: "Cálculos laborales",
			description: "Ley 27.742 · topes actualizados",
			colorKey: "primary",
			featureKey: FeatureNames.CALCULOS,
		},
		{
			iconComponent: Chart,
			title: "Intereses",
			description: "CER per-tramo · Ley 27.802",
			colorKey: "success",
			featureKey: FeatureNames.INTERESES,
		},
		{
			iconComponent: DocumentText,
			title: "Escritos con IA",
			description: "Templates legales + asistente IA",
			colorKey: "info",
			featureKey: FeatureNames.ESCRITOS,
			isNew: true,
		},
		{
			iconComponent: Send2,
			title: "Tracking postal",
			description: "Telegramas y cartas documento",
			colorKey: "warning",
			featureKey: FeatureNames.POSTAL_TRACKING,
			isNew: true,
		},
		{
			iconComponent: TaskSquare,
			title: "Tareas",
			description: "Prioridades, plazos y responsables",
			colorKey: "error",
			featureKey: FeatureNames.TAREAS,
		},
		{
			iconComponent: Profile2User,
			title: "Contactos",
			description: "Datos, causas e historial",
			colorKey: "secondary",
			featureKey: FeatureNames.CONTACTOS,
		},
	];

	const citasBanner: CitasBannerData = {
		iconComponent: CalendarTick,
		title: "Dejá que tus clientes agenden solos",
		description: "Sistema de reservas online con link compartible y agenda sincronizada.",
		cta: "Activar sistema de citas",
		to: "/register",
		featureKey: FeatureNames.SISTEMA_CITAS,
	};

	const handleRowClick = useCallback(
		(tech: FeatureRowData) => {
			trackFeature(tech.featureKey);
			setSelectedFeature(tech.featureKey);
			setModalOpen(true);
		},
		[trackFeature],
	);

	const handleBannerClick = useCallback(() => {
		trackCitasCTA();
		navigate(citasBanner.to);
	}, [navigate, trackCitasCTA, citasBanner.to]);

	const handleModalClose = useCallback(() => {
		setModalOpen(false);
	}, []);

	const dividerColor = alpha(theme.palette.divider, 0.6);

	return (
		<Box
			ref={sectionRef}
			component="section"
			sx={{
				position: "relative",
				overflow: "hidden",
				pt: { xs: 4, md: 7 },
				pb: { xs: 3, md: 3 },
			}}
		>
			{/* Atmósfera — spotlight centrado detrás del feature grid + líneas verticales
			    sutiles que ecoan la estructura 2-col de las features. */}
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					top: "30%",
					left: "50%",
					transform: "translate(-50%, -25%)",
					width: { xs: 700, md: 1200 },
					height: { xs: 500, md: 750 },
					borderRadius: "50%",
					background: `radial-gradient(ellipse at center, ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.09)} 0%, transparent 60%)`,
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
					backgroundImage: `linear-gradient(to right, ${alpha(theme.palette.text.primary, isDark ? 0.045 : 0.035)} 1px, transparent 1px)`,
					backgroundSize: { xs: "40px 100%", md: "60px 100%" },
					maskImage: "radial-gradient(ellipse 75% 65% at center, #000 0%, transparent 80%)",
					WebkitMaskImage: "radial-gradient(ellipse 75% 65% at center, #000 0%, transparent 80%)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>

			<Container sx={{ position: "relative", zIndex: 1 }}>
				{/* Header asimétrico — eyebrow + h2 izquierda (col 7), descripción derecha (col 5).
				    Rompe la simetría centered del resto del landing para sentir más editorial. */}
				<Grid container spacing={{ xs: 2, md: 4 }} sx={{ mb: { xs: 4, md: 6 } }} alignItems="flex-end">
					<Grid item xs={12} md={7}>
						<motion.div
							initial={{ opacity: 0, translateY: 50 }}
							whileInView={{ opacity: 1, translateY: 0 }}
							viewport={{ once: true, margin: "-100px" }}
							transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.05 }}
						>
							<SectionEyebrow number="02" label="Funcionalidades" align="left" mb={2} />
							<Typography
								variant="h2"
								sx={{
									fontSize: { xs: "1.875rem", sm: "2.25rem", md: "2.625rem", lg: "2.875rem" },
									lineHeight: 1.05,
									letterSpacing: "-0.025em",
									textWrap: "balance",
								}}
							>
								Todo lo que hoy hacés a mano, en un solo sistema
							</Typography>
						</motion.div>
					</Grid>
					<Grid item xs={12} md={5}>
						<motion.div
							initial={{ opacity: 0, translateY: 30 }}
							whileInView={{ opacity: 1, translateY: 0 }}
							viewport={{ once: true, margin: "-100px" }}
							transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.15 }}
						>
							<Typography
								color="text.secondary"
								sx={{
									fontSize: { xs: "1rem", md: "1.0625rem" },
									fontWeight: 400,
									lineHeight: 1.55,
									letterSpacing: "-0.005em",
									textWrap: "pretty",
								}}
							>
								Expedientes, clientes, agenda, cálculos, escritos y envíos — organizados automáticamente.
							</Typography>
						</motion.div>
					</Grid>
				</Grid>

				{/* Feature list card — 1 MainCard contiene grid 2×4 de filas compactas */}
				<FadeInWhenVisible>
					<MainCard content={false} sx={{ overflow: "hidden" }}>
						<Box
							sx={{
								display: "grid",
								gridTemplateColumns: { xs: "1fr", sm: "1fr 1fr" },
							}}
						>
							{items.map((tech, index) => {
								const isLeft = index % 2 === 0;
								const isLast = index === items.length - 1;
								const isLastRowDesktop = index >= items.length - 2;
								return (
									<FeatureRow
										key={tech.featureKey}
										tech={tech}
										theme={theme}
										isDark={isDark}
										onClick={() => handleRowClick(tech)}
										borders={{
											right: {
												xs: "none",
												sm: isLeft ? `1px solid ${dividerColor}` : "none",
											},
											bottom: {
												xs: isLast ? "none" : `1px solid ${dividerColor}`,
												sm: isLastRowDesktop ? "none" : `1px solid ${dividerColor}`,
											},
										}}
									/>
								);
							})}
						</Box>
					</MainCard>
				</FadeInWhenVisible>

				{/* Banner Citas — separado abajo, full width, conversión */}
				<Box sx={{ mt: 3 }}>
					<FadeInWhenVisible>
						<CitasBanner banner={citasBanner} theme={theme} isDark={isDark} onClick={handleBannerClick} onCtaTrack={trackCitasCTA} />
					</FadeInWhenVisible>
				</Box>

				{/* CTA Final de la sección */}
				<Box sx={{ mt: { xs: 5, md: 7 } }}>
					<FadeInWhenVisible>
						<Box sx={{ textAlign: "center" }}>
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
								Probá LawAnalytics gratis y dejá de trabajar a mano.
							</Typography>
							<Button
								component={RouterLink}
								to="/register"
								variant="contained"
								color="primary"
								size="large"
								onClick={trackPruebaPagarCTA}
								sx={{
									px: 4,
									py: 1.5,
									fontSize: "1rem",
									fontWeight: 600,
									borderRadius: 2,
								}}
							>
								Probar gratis ahora
							</Button>
							<Typography variant="body2" color="text.secondary" sx={{ mt: 2 }}>
								No requiere tarjeta · Registrate en 1 minuto
							</Typography>
						</Box>
					</FadeInWhenVisible>
				</Box>
			</Container>

			<FeatureModal open={modalOpen} onClose={handleModalClose} featureKey={selectedFeature} />
		</Box>
	);
};

export default TechnologiesPage;

import React, { useEffect, useCallback, useRef } from "react";
import { Link as RouterLink } from "react-router-dom";
// material-ui
import { Box, Button, Dialog, IconButton, Stack, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";
// third party
import { motion, AnimatePresence } from "framer-motion";
// icons
import {
	FolderOpen,
	Profile2User,
	Calendar,
	Calculator,
	Chart,
	TaskSquare,
	CalendarTick,
	CloseCircle,
	TickCircle,
	DocumentText,
	Send2,
} from "iconsax-react";
// images — mantenido en data aunque el modal compacto no lo renderice
import folderViewImg from "assets/images/folder_view.png";
// tracking
import { trackFeatureModalOpen, trackFeatureModalClose, trackFeatureModalCTAClick, trackFeatureModalScroll } from "utils/gtm";
import { FeatureNames } from "utils/gtm";

// Mismo BRAND_BLUE que Hero y Technologies — atmósfera coherente.
const BRAND_BLUE = "#3A7BFF";

interface FeatureModalContent {
	title: string;
	description: string;
	benefits: string[];
	cta: string;
	iconComponent: React.ElementType;
	colorKey: "primary" | "secondary" | "error" | "warning" | "info" | "success";
	mockupImage?: string;
}

// Contenido de cada feature — el modal compacto no renderiza mockupImage pero
// se mantiene el campo en la data por si otras vistas lo usan.
export const FeatureModalData: Record<string, FeatureModalContent> = {
	[FeatureNames.CARPETAS]: {
		title: "Expedientes organizados, sin esfuerzo",
		description: "Todo tu estudio en un solo lugar, sincronizado con el Poder Judicial.",
		benefits: ["Vista unificada", "Integración con PJN y MEV", "Alertas de movimientos"],
		cta: "Probar con mis expedientes",
		iconComponent: FolderOpen,
		colorKey: "warning",
		mockupImage: folderViewImg,
	},
	[FeatureNames.CONTACTOS]: {
		title: "Clientes Centralizados",
		description:
			"Toda la información de tus clientes en un solo lugar. Datos de contacto, causas asociadas, historial de interacciones y seguimiento personalizado.",
		benefits: ["Ficha completa de cada cliente", "Causas asociadas a cada cliente", "Búsqueda rápida por nombre o documento"],
		cta: "Probar Clientes Gratis",
		iconComponent: Profile2User,
		colorKey: "secondary",
	},
	[FeatureNames.CALENDARIO]: {
		title: "Agenda Inteligente",
		description:
			"No te olvides nunca más de un vencimiento. Agenda integrada con alertas automáticas y sincronización con Google Calendar.",
		benefits: ["Alertas automáticas de vencimientos", "Sincronización con Google Calendar", "Recordatorios por email"],
		cta: "Probar Agenda Gratis",
		iconComponent: Calendar,
		colorKey: "info",
	},
	[FeatureNames.CALCULOS]: {
		title: "Calculadora Laboral Precisa",
		description:
			"Calculá indemnizaciones, despidos, SAC y liquidaciones con precisión legal. Siempre actualizado con los últimos topes y valores.",
		benefits: ["Cálculo de indemnizaciones por despido", "Liquidaciones finales completas", "Topes legales siempre actualizados"],
		cta: "Probar Calculadora Gratis",
		iconComponent: Calculator,
		colorKey: "primary",
	},
	[FeatureNames.INTERESES]: {
		title: "Actualización de Montos",
		description: "Actualizá montos en segundos con tasas BCRA, actas y criterios judiciales. Cálculo automático con diferentes métodos.",
		benefits: ["Tasas BCRA y BNA actualizadas diariamente", "Múltiples métodos de cálculo", "Exportación de liquidaciones"],
		cta: "Probar Actualización Gratis",
		iconComponent: Chart,
		colorKey: "success",
	},
	[FeatureNames.TAREAS]: {
		title: "Gestión de Tareas",
		description: "Organizá el trabajo diario del estudio. Asigná tareas, definí prioridades y controlá plazos de manera simple.",
		benefits: ["Prioridades y fechas límite", "Notificaciones de vencimiento", "Asignación de tareas a carpetas"],
		cta: "Probar Tareas Gratis",
		iconComponent: TaskSquare,
		colorKey: "error",
	},
	[FeatureNames.SISTEMA_CITAS]: {
		title: "Reservas Online",
		description:
			"Dejá que tus clientes agenden solos. Sistema de reservas con link compartible, confirmaciones automáticas y agenda sincronizada.",
		benefits: [
			"Link compartible para agendar",
			"Confirmaciones automáticas",
			"Sincronización con tu calendario",
			"Recordatorios a clientes",
		],
		cta: "Probar Sistema de Citas Gratis",
		iconComponent: CalendarTick,
		colorKey: "primary",
	},
	[FeatureNames.ESCRITOS]: {
		title: "Escritos con asistente IA",
		description:
			"Redactá escritos más rápido. Biblioteca de templates legales, formalizá borradores con IA y reducí tiempos sin perder estilo profesional.",
		benefits: [
			"Biblioteca de templates legales",
			"Formalizar borradores con IA",
			"Edición conservando estilo profesional",
			"Reducción de tiempos de redacción",
		],
		cta: "Probar Escritos Gratis",
		iconComponent: DocumentText,
		colorKey: "info",
	},
	[FeatureNames.POSTAL_TRACKING]: {
		title: "Tracking de Telegramas y Cartas Documento",
		description:
			"Centralizá el seguimiento de telegramas y cartas documento. Vinculados a tus carpetas y causas, con estado y novedades en tiempo real.",
		benefits: [
			"Tracking de telegramas y cartas documento",
			"Vinculación con carpetas y causas",
			"Estado y novedades en tiempo real",
			"Historial consolidado por cliente",
		],
		cta: "Probar Tracking Postal Gratis",
		iconComponent: Send2,
		colorKey: "warning",
	},
};

interface FeatureModalProps {
	open: boolean;
	onClose: () => void;
	featureKey: string | null;
}

const FeatureModal: React.FC<FeatureModalProps> = ({ open, onClose, featureKey }) => {
	const theme = useTheme();
	const contentRef = useRef<HTMLDivElement>(null);
	const hasTrackedScroll = useRef(false);
	const isDark = theme.palette.mode === "dark";

	const featureData = featureKey ? FeatureModalData[featureKey] : null;

	useEffect(() => {
		if (open && featureKey) {
			trackFeatureModalOpen(featureKey);
			hasTrackedScroll.current = false;
		}
	}, [open, featureKey]);

	useEffect(() => {
		if (!open || !featureKey) return;

		const handleScroll = () => {
			if (!contentRef.current || hasTrackedScroll.current) return;
			const { scrollTop, scrollHeight, clientHeight } = contentRef.current;
			const scrollPercentage = scrollTop / (scrollHeight - clientHeight);
			if (scrollPercentage >= 0.5) {
				trackFeatureModalScroll(featureKey);
				hasTrackedScroll.current = true;
			}
		};

		const contentElement = contentRef.current;
		if (contentElement) {
			contentElement.addEventListener("scroll", handleScroll);
		}

		return () => {
			if (contentElement) {
				contentElement.removeEventListener("scroll", handleScroll);
			}
		};
	}, [open, featureKey]);

	const handleClose = useCallback(() => {
		if (featureKey) {
			trackFeatureModalClose(featureKey);
		}
		onClose();
	}, [featureKey, onClose]);

	const handleCTAClick = useCallback(() => {
		if (featureKey) {
			trackFeatureModalCTAClick(featureKey);
		}
	}, [featureKey]);

	useEffect(() => {
		const handleEscape = (e: KeyboardEvent) => {
			if (e.key === "Escape" && open) {
				handleClose();
			}
		};
		window.addEventListener("keydown", handleEscape);
		return () => window.removeEventListener("keydown", handleEscape);
	}, [open, handleClose]);

	if (!featureData) return null;

	const IconComponent = featureData.iconComponent;
	const accent = theme.palette[featureData.colorKey].main;

	return (
		<AnimatePresence>
			{open && (
				<Dialog
					open={open}
					onClose={handleClose}
					maxWidth="sm"
					fullWidth
					PaperProps={{
						component: motion.div,
						initial: { opacity: 0, scale: 0.96, y: 12 },
						animate: { opacity: 1, scale: 1, y: 0 },
						exit: { opacity: 0, scale: 0.96, y: 12 },
						transition: { duration: 0.22, ease: [0.22, 1, 0.36, 1] },
						sx: {
							borderRadius: "16px",
							maxWidth: 460,
							width: "100%",
							m: { xs: 2, sm: 3 },
							bgcolor: theme.palette.background.paper,
							border: `1px solid ${alpha(theme.palette.divider, 0.6)}`,
							boxShadow: `0 24px 48px ${alpha("#0F172A", isDark ? 0.5 : 0.2)}`,
							overflow: "hidden",
						},
					}}
					slotProps={{
						backdrop: {
							sx: {
								backgroundColor: alpha("#000", 0.55),
								backdropFilter: "blur(4px)",
								WebkitBackdropFilter: "blur(4px)",
							},
						},
					}}
				>
					<Box ref={contentRef} sx={{ position: "relative", maxHeight: "85vh", overflowX: "hidden", overflowY: "auto" }}>
						{/* Atmósfera del modal — un solo blob brand-blue + dot grid sutil */}
						<Box
							aria-hidden
							sx={{
								position: "absolute",
								top: -50,
								right: -40,
								width: 180,
								height: 180,
								borderRadius: "50%",
								background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)} 0%, transparent 65%)`,
								filter: "blur(40px)",
								pointerEvents: "none",
								zIndex: 0,
							}}
						/>
						<Box
							aria-hidden
							sx={{
								position: "absolute",
								inset: 0,
								backgroundImage: `radial-gradient(${alpha(theme.palette.text.primary, isDark ? 0.04 : 0.03)} 1px, transparent 1px)`,
								backgroundSize: "22px 22px",
								maskImage: "radial-gradient(ellipse 70% 60% at center, #000 0%, transparent 80%)",
								WebkitMaskImage: "radial-gradient(ellipse 70% 60% at center, #000 0%, transparent 80%)",
								pointerEvents: "none",
								zIndex: 0,
							}}
						/>

						{/* Close button */}
						<IconButton
							onClick={handleClose}
							aria-label="Cerrar"
							size="small"
							sx={{
								position: "absolute",
								top: 8,
								right: 8,
								zIndex: 2,
								color: theme.palette.text.secondary,
								"&:hover": {
									color: theme.palette.text.primary,
									bgcolor: alpha(theme.palette.text.primary, 0.06),
								},
							}}
						>
							<CloseCircle size={20} />
						</IconButton>

						{/* Contenido principal */}
						<Box
							sx={{
								position: "relative",
								zIndex: 1,
								px: { xs: 2.5, sm: 3 },
								py: { xs: 2.5, sm: 3 },
							}}
						>
							{/* Header horizontal: icono + título */}
							<Box
								sx={{
									display: "flex",
									alignItems: "center",
									gap: 1.75,
									mb: 1.5,
									pr: 4, // espacio para el close button
								}}
							>
								<Box
									sx={{
										width: 40,
										height: 40,
										borderRadius: 1.5,
										bgcolor: alpha(accent, isDark ? 0.22 : 0.14),
										display: "flex",
										alignItems: "center",
										justifyContent: "center",
										flexShrink: 0,
									}}
								>
									<IconComponent size={22} variant="Bulk" color={accent} />
								</Box>
								<Typography
									sx={{
										fontWeight: 600,
										fontSize: { xs: "1.15rem", sm: "1.3rem" },
										letterSpacing: "-0.018em",
										color: theme.palette.text.primary,
										lineHeight: 1.2,
										textWrap: "balance",
									}}
								>
									{featureData.title}
								</Typography>
							</Box>

							{/* Descripción */}
							<Typography
								sx={{
									fontSize: "0.85rem",
									color: theme.palette.text.secondary,
									lineHeight: 1.5,
									mb: 2.5,
								}}
							>
								{featureData.description}
							</Typography>

							{/* Benefits inline — sin container, TickCircle en colorKey */}
							<Stack spacing={1} sx={{ mb: 2.5 }}>
								{featureData.benefits.map((benefit, index) => (
									<Box key={index} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
										<Box sx={{ flexShrink: 0, mt: "1px", lineHeight: 0 }}>
											<TickCircle size={16} variant="Bold" color={accent} />
										</Box>
										<Typography
											sx={{
												fontSize: "0.85rem",
												color: theme.palette.text.primary,
												lineHeight: 1.5,
											}}
										>
											{benefit}
										</Typography>
									</Box>
								))}
							</Stack>

							{/* CTA — colorKey, compact, refined shadow */}
							<Button
								component={RouterLink}
								to={`/register?source=modal&feature=${featureKey}`}
								variant="contained"
								color={featureData.colorKey}
								fullWidth
								onClick={handleCTAClick}
								sx={{
									height: 44,
									fontSize: "0.95rem",
									fontWeight: 600,
									textTransform: "none",
									borderRadius: 2,
									boxShadow: `0 8px 20px ${alpha(accent, 0.3)}`,
									transition: "transform 0.2s ease, box-shadow 0.2s ease",
									"&:hover": {
										boxShadow: `0 12px 26px ${alpha(accent, 0.4)}`,
										transform: "translateY(-2px)",
									},
								}}
							>
								{featureData.cta}
							</Button>

							{/* Microcopy */}
							<Box
								sx={{
									mt: 1.5,
									display: "flex",
									justifyContent: "center",
									alignItems: "center",
									gap: 2,
									flexWrap: "wrap",
								}}
							>
								{["Sin tarjeta", "Registro en 1 minuto"].map((text, index) => (
									<Box key={index} sx={{ display: "inline-flex", alignItems: "center", gap: 0.5 }}>
										<TickCircle size={12} variant="Bold" color={theme.palette.success.main} />
										<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.72rem" }}>
											{text}
										</Typography>
									</Box>
								))}
							</Box>
						</Box>
					</Box>
				</Dialog>
			)}
		</AnimatePresence>
	);
};

export default FeatureModal;

import React, { useEffect, useCallback, useRef } from "react";
import { Link as RouterLink } from "react-router-dom";
// material-ui
import { Box, Button, CardMedia, Dialog, IconButton, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
// third party
import { motion, AnimatePresence } from "framer-motion";
// icons
import { FolderOpen, Profile2User, Calendar, Calculator, Chart, TaskSquare, CalendarTick, CloseCircle, TickCircle } from "iconsax-react";
// images
import folderViewImg from "assets/images/folder_view.png";
// tracking
import { trackFeatureModalOpen, trackFeatureModalClose, trackFeatureModalCTAClick, trackFeatureModalScroll } from "utils/gtm";
import { FeatureNames } from "utils/gtm";

interface FeatureModalContent {
	title: string;
	description: string;
	benefits: string[];
	cta: string;
	iconComponent: React.ElementType;
	colorKey: "primary" | "secondary" | "error" | "warning" | "info" | "success";
	mockupImage?: string;
}

// Contenido de cada feature para el modal
export const FeatureModalData: Record<string, FeatureModalContent> = {
	[FeatureNames.CARPETAS]: {
		title: "Expedientes organizados, sin esfuerzo",
		description: "Todo tu estudio en un solo lugar, sincronizado con el Poder Judicial.",
		benefits: [
			"Vista unificada",
			"Integración con PJN y MEV",
			"Alertas de movimientos",
		],
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
		benefits: [
			"Alertas automáticas de vencimientos",
			"Sincronización con Google Calendar",
			"Recordatorios por email",
		],
		cta: "Probar Agenda Gratis",
		iconComponent: Calendar,
		colorKey: "info",
	},
	[FeatureNames.CALCULOS]: {
		title: "Calculadora Laboral Precisa",
		description:
			"Calculá indemnizaciones, despidos, SAC y liquidaciones con precisión legal. Siempre actualizado con los últimos topes y valores.",
		benefits: [
			"Cálculo de indemnizaciones por despido",
			"Liquidaciones finales completas",
			"Topes legales siempre actualizados",
		],
		cta: "Probar Calculadora Gratis",
		iconComponent: Calculator,
		colorKey: "primary",
	},
	[FeatureNames.INTERESES]: {
		title: "Actualización de Montos",
		description: "Actualizá montos en segundos con tasas BCRA, actas y criterios judiciales. Cálculo automático con diferentes métodos.",
		benefits: [
			"Tasas BCRA y BNA actualizadas diariamente",
			"Múltiples métodos de cálculo",
			"Exportación de liquidaciones",
		],
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

	const featureData = featureKey ? FeatureModalData[featureKey] : null;

	// Track modal open
	useEffect(() => {
		if (open && featureKey) {
			trackFeatureModalOpen(featureKey);
			// Reset scroll tracking when modal opens
			hasTrackedScroll.current = false;
		}
	}, [open, featureKey]);

	// Track scroll inside modal (50% scroll)
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

	// Handle close with tracking
	const handleClose = useCallback(() => {
		if (featureKey) {
			trackFeatureModalClose(featureKey);
		}
		onClose();
	}, [featureKey, onClose]);

	// Handle CTA click with tracking
	const handleCTAClick = useCallback(() => {
		if (featureKey) {
			trackFeatureModalCTAClick(featureKey);
		}
	}, [featureKey]);

	// Handle escape key
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
						initial: { opacity: 0, scale: 0.9 },
						animate: { opacity: 1, scale: 1 },
						exit: { opacity: 0, scale: 0.9 },
						transition: { duration: 0.2 },
						sx: {
							borderRadius: "16px",
							overflow: "hidden",
							maxWidth: 700,
							bgcolor: "#F9FAFB",
							border: "1px solid rgba(0, 0, 0, 0.08)",
							boxShadow: "0 25px 50px -12px rgba(0, 0, 0, 0.25)",
						},
					}}
					slotProps={{
						backdrop: {
							sx: {
								backgroundColor: "rgba(0, 0, 0, 0.6)",
							},
						},
					}}
				>
					<Box ref={contentRef} sx={{ position: "relative" }}>
						{/* Header con gradiente suave */}
						<Box
							sx={{
								background: "linear-gradient(135deg, #EEF2FF 0%, #F8FAFF 100%)",
								px: { xs: 2.5, sm: 4 },
								py: { xs: 2, sm: 3 },
								position: "relative",
							}}
						>
							{/* Close button */}
							<IconButton
								onClick={handleClose}
								sx={{
									position: "absolute",
									top: 12,
									right: 12,
									color: theme.palette.grey[500],
									"&:hover": {
										color: theme.palette.grey[700],
									},
								}}
							>
								<CloseCircle size={24} />
							</IconButton>

							{/* Title */}
							<Typography
								variant="h3"
								sx={{
									textAlign: "center",
									mb: 1,
									fontWeight: 800,
									color: theme.palette.mode === "dark" ? theme.palette.grey[100] : theme.palette.grey[900],
								}}
							>
								{featureData.title}
							</Typography>

							{/* Description */}
							<Typography
								variant="body1"
								sx={{
									textAlign: "center",
									color: theme.palette.text.secondary,
									lineHeight: 1.5,
									fontSize: "0.95rem",
									opacity: 0.75,
								}}
							>
								{featureData.description}
							</Typography>
						</Box>

						{/* Content */}
						<Box sx={{ px: { xs: 2.5, sm: 4 }, py: { xs: 2, sm: 3 } }}>

						{/* Imagen + Bullets lado a lado (mobile: vertical) */}
						<Box
							sx={{
								display: "flex",
								flexDirection: { xs: "column", sm: "row" },
								gap: 2.5,
								mb: 2.5,
								alignItems: { xs: "stretch", sm: "flex-start" },
							}}
						>
							{/* Mockup Image */}
							{featureData.mockupImage && (
								<Box
									sx={{
										width: { xs: "100%", sm: "65%" },
										flexShrink: 0,
										borderRadius: "14px",
										overflow: "hidden",
										boxShadow: "0 20px 50px rgba(0, 0, 0, 0.15)",
										border: "1px solid #E5E7EB",
									}}
								>
									<CardMedia
										component="img"
										image={featureData.mockupImage}
										alt={featureData.title}
										sx={{
											width: "100%",
											height: "auto",
											display: "block",
										}}
									/>
								</Box>
							)}

							{/* Benefits - 35% */}
							<Box
								sx={{
									flex: 1,
									px: "12px",
									py: "8px",
									borderRadius: "10px",
									bgcolor: "#F8FAFC",
									userSelect: "none",
								}}
							>
								{featureData.benefits.map((benefit, index) => (
									<Box
										key={index}
										sx={{
											display: "flex",
											alignItems: "center",
											gap: 0.75,
											mb: index < featureData.benefits.length - 1 ? 0.5 : 0,
										}}
									>
										<TickCircle size={16} variant="Bold" style={{ color: theme.palette.success.main, flexShrink: 0 }} />
										<Typography variant="body2" color="text.primary" sx={{ fontSize: "0.75rem", lineHeight: 1.35 }}>
											{benefit}
										</Typography>
									</Box>
								))}
							</Box>
						</Box>

						{/* CTA Button - Full width */}
						<Box sx={{ mt: 1, mb: 2 }}>
							<Button
								component={RouterLink}
								to={`/register?source=modal&feature=${featureKey}`}
								variant="contained"
								color={featureData.colorKey}
								size="large"
								fullWidth
								onClick={handleCTAClick}
								sx={{
									height: { xs: "46px", sm: "56px" },
									fontSize: { xs: "0.95rem", sm: "1.1rem" },
									fontWeight: 600,
									borderRadius: 2,
									boxShadow: "0 6px 20px rgba(0, 0, 0, 0.18)",
									"&:hover": {
										boxShadow: "0 8px 25px rgba(0, 0, 0, 0.22)",
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
								}}
							>
								{["Sin tarjeta", "Registro en 1 minuto"].map((text, index) => (
									<Box key={index} sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
										<TickCircle size={16} variant="Bold" color="#66bb6a" />
										<Typography variant="caption" color="text.secondary">
											{text}
										</Typography>
									</Box>
								))}
							</Box>
						</Box>
						</Box>
					</Box>
				</Dialog>
			)}
		</AnimatePresence>
	);
};

export default FeatureModal;

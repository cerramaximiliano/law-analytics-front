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
import folderMovementsImg from "assets/images/folder_movements.png";
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
			"Vista unificada de todas tus causas activas",
			"Movimientos automáticos desde PJN y MEV",
			"Alertas de vencimientos y plazos",
		],
		cta: "Probar con mis expedientes",
		iconComponent: FolderOpen,
		colorKey: "warning",
		mockupImage: folderMovementsImg,
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
							borderRadius: 3,
							overflow: "visible",
							maxWidth: 500,
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
					<Box ref={contentRef} sx={{ position: "relative", overflow: "hidden" }}>
						{/* Header con fondo suave */}
						<Box
							sx={{
								bgcolor: "#F8FAFC",
								px: { xs: 3, sm: 4 },
								py: 3,
								position: "relative",
								borderRadius: "12px 12px 0 0",
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
									fontWeight: 600,
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
								}}
							>
								{featureData.description}
							</Typography>
						</Box>

						{/* Content */}
						<Box sx={{ px: { xs: 3, sm: 4 }, py: 3, borderRadius: "0 0 12px 12px" }}>

						{/* Mockup Image */}
						{featureData.mockupImage && (
							<Box
								sx={{
									mb: 3,
									p: 2,
									borderRadius: 2,
									bgcolor: "#F9FAFB",
									display: "flex",
									justifyContent: "center",
								}}
							>
								<Box
									sx={{
										width: "130%",
										maxWidth: "130%",
										borderRadius: 1.5,
										overflow: "hidden",
										border: "1px solid #E5E7EB",
										boxShadow: "0 2px 8px rgba(0, 0, 0, 0.08)",
									}}
								>
									<CardMedia
										component="img"
										image={featureData.mockupImage}
										alt={featureData.title}
										sx={{
											width: "100%",
											height: "auto",
											maxHeight: 180,
											objectFit: "cover",
											objectPosition: "top",
										}}
									/>
								</Box>
							</Box>
						)}

						{/* Benefits */}
						<Box sx={{ mb: 4 }}>
							{featureData.benefits.map((benefit, index) => (
								<Box
									key={index}
									sx={{
										display: "flex",
										alignItems: "center",
										gap: 1.5,
										mb: 1.5,
									}}
								>
									<TickCircle size={20} variant="Bold" style={{ color: theme.palette.success.main, flexShrink: 0 }} />
									<Typography variant="body2" color="text.primary">
										{benefit}
									</Typography>
								</Box>
							))}
						</Box>

						{/* CTA Button */}
						<Box sx={{ mt: 4, mb: 2, px: 2 }}>
							<Button
								component={RouterLink}
								to={`/register?source=modal&feature=${featureKey}`}
								variant="contained"
								color={featureData.colorKey}
								size="large"
								fullWidth
								onClick={handleCTAClick}
								sx={{
									py: 2,
									fontSize: "1.1rem",
									fontWeight: 600,
									borderRadius: 2,
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
										<TickCircle size={14} variant="Bold" color="#66bb6a" />
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

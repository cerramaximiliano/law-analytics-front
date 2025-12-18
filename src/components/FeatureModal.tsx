import React, { useEffect, useCallback } from "react";
import { Link as RouterLink } from "react-router-dom";
// material-ui
import { Box, Button, Dialog, IconButton, Typography } from "@mui/material";
import { useTheme } from "@mui/material/styles";
// third party
import { motion, AnimatePresence } from "framer-motion";
// icons
import { FolderOpen, Profile2User, Calendar, Calculator, Chart, TaskSquare, CalendarTick, CloseCircle, TickCircle } from "iconsax-react";
// tracking
import { trackFeatureModalOpen, trackFeatureModalClose, trackFeatureModalCTAClick } from "utils/gtm";
import { FeatureNames } from "utils/gtm";

interface FeatureModalContent {
	title: string;
	description: string;
	benefits: string[];
	cta: string;
	iconComponent: React.ElementType;
	colorKey: "primary" | "secondary" | "error" | "warning" | "info" | "success";
}

// Contenido de cada feature para el modal
export const FeatureModalData: Record<string, FeatureModalContent> = {
	[FeatureNames.CARPETAS]: {
		title: "Expedientes Organizados",
		description:
			"Centralizá todas tus causas en un solo lugar. Gestioná movimientos, estados, plazos y documentos sin perder tiempo buscando información.",
		benefits: [
			"Vista unificada de todas tus causas activas",
			"Seguimiento automático de movimientos en PJN y MEV",
			"Alertas de vencimientos y plazos",
			"Historial completo de cada expediente",
		],
		cta: "Probar Expedientes Gratis",
		iconComponent: FolderOpen,
		colorKey: "warning",
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
			"Vista diaria, semanal y mensual",
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
			"SAC proporcional y aguinaldo",
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
			"Historial de cálculos realizados",
		],
		cta: "Probar Actualización Gratis",
		iconComponent: Chart,
		colorKey: "success",
	},
	[FeatureNames.TAREAS]: {
		title: "Gestión de Tareas",
		description: "Organizá el trabajo diario del estudio. Asigná tareas, definí prioridades y controlá plazos de manera simple.",
		benefits: ["Prioridades y fechas límite", "Notificaciones de vencimiento"],
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

	const featureData = featureKey ? FeatureModalData[featureKey] : null;

	// Track modal open
	useEffect(() => {
		if (open && featureKey) {
			trackFeatureModalOpen(featureKey);
		}
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
					<Box sx={{ position: "relative", p: { xs: 3, sm: 4 } }}>
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

						{/* Icon */}
						<Box sx={{ display: "flex", justifyContent: "center", mb: 3 }}>
							<Box
								sx={{
									p: 2,
									borderRadius: "50%",
									bgcolor: theme.palette[featureData.colorKey].main + "15",
								}}
							>
								<IconComponent size={64} variant="Bulk" style={{ color: theme.palette[featureData.colorKey].main }} />
							</Box>
						</Box>

						{/* Title */}
						<Typography
							variant="h3"
							sx={{
								textAlign: "center",
								mb: 2,
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
								mb: 3,
								color: theme.palette.text.secondary,
								lineHeight: 1.6,
							}}
						>
							{featureData.description}
						</Typography>

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
						<Button
							component={RouterLink}
							to="/register"
							variant="contained"
							color={featureData.colorKey}
							size="large"
							fullWidth
							onClick={handleCTAClick}
							sx={{
								py: 1.5,
								fontSize: "1rem",
								fontWeight: 600,
								borderRadius: 2,
								mb: 2,
							}}
						>
							{featureData.cta}
						</Button>

						{/* Microcopy */}
						<Typography
							variant="body2"
							sx={{
								textAlign: "center",
								color: theme.palette.text.secondary,
							}}
						>
							No requiere tarjeta · Registrate en 1 minuto
						</Typography>
					</Box>
				</Dialog>
			)}
		</AnimatePresence>
	);
};

export default FeatureModal;

import React, { ReactNode } from "react";

// material-ui
import { alpha, useTheme } from "@mui/material/styles";
import { Box, Button, Chip, CircularProgress, Stack, Typography } from "@mui/material";

// third-party
import { motion } from "framer-motion";

// icons
import { CloseCircle, Lock, TickCircle } from "iconsax-react";

// project-imports
import MainCard from "components/MainCard";
import { Plan } from "store/reducers/ApiService";
import { cleanPlanDisplayName, getPlanPricing } from "utils/planPricingUtils";
import dayjs from "utils/dayjs-config";

// ============================== TOKENS ============================== //
// Mantener en sync con pages/plans.tsx y sections/landing/Planes.tsx.
const BRAND_BLUE = "#3A7BFF";
const BRAND_PURPLE = "#8A5CFF";
const RECOMMENDED_BORDER_GRADIENT = `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_PURPLE}, ${BRAND_BLUE})`;

// ============================== HELPERS ============================== //

const formatPriceShort = (price: number): string => (price % 1 === 0 ? `$${price}` : `$${price.toFixed(2)}`);

const billingSuffixShort = (period: string): string => {
	switch (period) {
		case "monthly":
			return "/mes";
		case "daily":
			return "/día";
		case "weekly":
			return "/semana";
		case "yearly":
		case "annual":
			return "/año";
		default:
			return "";
	}
};

// ============================== TYPES ============================== //

export interface PlanCardCTAProps {
	label: string;
	onClick?: () => void;
	disabled?: boolean;
	loading?: boolean;
	variant?: "contained" | "outlined" | "text";
	color?: "primary" | "secondary" | "success" | "error" | "warning" | "info";
	startIcon?: ReactNode;
	endIcon?: ReactNode;
	href?: string;
	component?: React.ElementType;
	to?: string;
	dataTestId?: string;
}

export interface PlanCardProps {
	plan: Plan;
	/** Plan destacado visualmente con borde gradient azul→púrpura. */
	highlighted?: boolean;
	/** Indica que es el plan activo del usuario — muestra chip "Plan actual". */
	isCurrent?: boolean;
	/** Mensaje contextual debajo del título (ej. "Cancelado. Activo hasta..."). */
	contextMessage?: { text: string; tone?: "success" | "error" | "warning" | "info" };
	/** Configuración del botón CTA. */
	cta: PlanCardCTAProps;
	/** Si el plan no está activo, muestra overlay "Próximamente". */
	showInactiveOverlay?: boolean;
	/** Index para staggered animation (delay = idx * 0.1). Si undefined, sin animación. */
	animationIdx?: number;
	/** Para mostrar "RECOMENDADO" / "PRÓXIMAMENTE" / chip custom arriba de la card. */
	topChip?: "recommended" | "coming-soon" | "current" | "none";
	/** Variante compacta para usar en modals (sin animación, sin overlay, padding menor,
	 * features ocultas, recursos truncados a maxResourcesCompact). */
	compact?: boolean;
	/** En compact, máximo de recursos a mostrar (default 4). El resto se resume como "+N más". */
	maxResourcesCompact?: number;
	/** Override completo — ocultar bloque de recursos. */
	hideResources?: boolean;
	/** Override completo — ocultar bloque de funcionalidades. Default true en compact. */
	hideFeatures?: boolean;
	/** data-testid aplicado al MainCard root. */
	dataTestId?: string;
}

// ============================== COMPONENT ============================== //

const PlanCard: React.FC<PlanCardProps> = ({
	plan,
	highlighted = false,
	isCurrent = false,
	contextMessage,
	cta,
	showInactiveOverlay = false,
	animationIdx,
	topChip,
	compact = false,
	maxResourcesCompact = 4,
	hideResources = false,
	hideFeatures,
	dataTestId,
}) => {
	// Default de hideFeatures: en compact se ocultan (modal no es lugar para
	// listas largas); en non-compact se muestran.
	const shouldHideFeatures = hideFeatures ?? compact;
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const pricing = getPlanPricing(plan);
	const isFree = plan.planId === "free" || pricing.basePrice === 0;
	const promoDiscount = !isFree && plan.activeDiscounts && plan.activeDiscounts.length > 0 ? plan.activeDiscounts[0] : undefined;

	// Filtrar recursos/features visibles en el entorno actual (production vs dev).
	const currentEnv = import.meta.env.PROD ? "production" : "development";
	const isVisibleInCurrentEnv = (visibility?: string): boolean => {
		if (!visibility || visibility === "all") return true;
		if (visibility === "none") return false;
		return visibility === currentEnv;
	};

	const allVisibleResources = plan.resourceLimits
		.filter((r) => isVisibleInCurrentEnv(r.visibility))
		.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
	const visibleResources = compact ? allVisibleResources.slice(0, maxResourcesCompact) : allVisibleResources;
	const truncatedResourcesCount = compact ? allVisibleResources.length - visibleResources.length : 0;
	const visibleFeatures = plan.features
		.filter((f) => isVisibleInCurrentEnv(f.visibility))
		.sort((a, b) => (a.order ?? 99) - (b.order ?? 99));
	// En compact, cuando las features están ocultas, contamos las habilitadas
	// (las que el usuario gana al upgradear) para sumarlas al resumen "+ N más".
	const enabledFeaturesCount = visibleFeatures.filter((f) => f.enabled).length;
	const hiddenFeaturesCount = shouldHideFeatures ? enabledFeaturesCount : 0;
	// Resumen combinado de elementos ocultos para mostrar al final de Recursos.
	const hiddenSummary: string = (() => {
		const parts: string[] = [];
		if (truncatedResourcesCount > 0) {
			parts.push(`${truncatedResourcesCount} recurso${truncatedResourcesCount === 1 ? "" : "s"}`);
		}
		if (hiddenFeaturesCount > 0) {
			parts.push(`${hiddenFeaturesCount} funcionalidad${hiddenFeaturesCount === 1 ? "" : "es"}`);
		}
		if (parts.length === 0) return "";
		return `+ ${parts.join(" y ")} más en este plan`;
	})();

	const sectionLabel = (text: string) => (
		<Typography
			sx={{
				fontSize: "0.7rem",
				fontWeight: 600,
				letterSpacing: "0.12em",
				textTransform: "uppercase",
				color: theme.palette.text.secondary,
				mb: 1.25,
			}}
		>
			{text}
		</Typography>
	);

	// Top chip — auto-detección si no se pasa explícito.
	const resolvedTopChip =
		topChip !== undefined
			? topChip
			: isCurrent
			? "current"
			: highlighted && plan.isActive
			? "recommended"
			: !plan.isActive
			? "coming-soon"
			: "none";

	// Tone del context message.
	const contextToneColor =
		contextMessage?.tone === "success"
			? theme.palette.success.main
			: contextMessage?.tone === "error"
			? theme.palette.error.main
			: contextMessage?.tone === "warning"
			? theme.palette.warning.main
			: theme.palette.info.main;

	const cardInner = (
		<MainCard
			border={!highlighted}
			{...(dataTestId && { "data-testid": dataTestId })}
			sx={{
				height: "100%",
				position: "relative",
				overflow: showInactiveOverlay ? "hidden" : "visible",
				borderRadius: 2,
				...(highlighted && {
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
					"&::before": {
						content: '""',
						position: "absolute",
						inset: 0,
						borderRadius: "inherit",
						padding: "1.5px",
						background: RECOMMENDED_BORDER_GRADIENT,
						WebkitMask: "linear-gradient(#fff 0 0) content-box, linear-gradient(#fff 0 0)",
						WebkitMaskComposite: "xor",
						maskComposite: "exclude",
						pointerEvents: "none",
						zIndex: 1,
					},
					boxShadow: `0 14px 36px ${alpha(BRAND_BLUE, 0.14)}, 0 6px 14px ${alpha(BRAND_BLUE, 0.08)}`,
				}),
				transition: "box-shadow 0.3s ease, border-color 0.3s ease",
				"&:hover": {
					boxShadow: {
						md: highlighted
							? `0 22px 48px ${alpha(BRAND_BLUE, 0.22)}, 0 10px 22px ${alpha(BRAND_BLUE, 0.12)}`
							: `0 12px 28px ${alpha(theme.palette.common.black, 0.1)}, 0 4px 10px ${alpha(theme.palette.common.black, 0.06)}`,
					},
					borderColor: { md: highlighted ? undefined : alpha(BRAND_BLUE, 0.25) },
				},
				...(!plan.isActive && !showInactiveOverlay && { opacity: 0.55, filter: "saturate(0.6)" }),
			}}
		>
			{/* Top chip — recomendado / próximamente / plan actual */}
			{resolvedTopChip === "recommended" && (
				<Chip
					label="RECOMENDADO"
					size="small"
					sx={{
						position: "absolute",
						top: -11,
						left: "50%",
						transform: "translateX(-50%)",
						background: RECOMMENDED_BORDER_GRADIENT,
						color: "#fff",
						fontWeight: 600,
						fontSize: "0.65rem",
						letterSpacing: "0.14em",
						height: 22,
						px: 1.25,
						borderRadius: 1,
						boxShadow: `0 6px 14px ${alpha(BRAND_BLUE, 0.32)}`,
						zIndex: 2,
						"& .MuiChip-label": { px: 0.5 },
					}}
				/>
			)}

			{resolvedTopChip === "coming-soon" && (
				<Chip
					label="PRÓXIMAMENTE"
					size="small"
					icon={<Lock size={12} variant="Bold" />}
					sx={{
						position: "absolute",
						top: -11,
						left: "50%",
						transform: "translateX(-50%)",
						bgcolor: theme.palette.warning.main,
						color: theme.palette.warning.contrastText,
						fontWeight: 600,
						fontSize: "0.65rem",
						letterSpacing: "0.12em",
						height: 22,
						px: 1.25,
						borderRadius: 1,
						zIndex: 2,
						"& .MuiChip-label": { px: 0.5 },
						"& .MuiChip-icon": { color: "inherit", ml: 0.25, mr: -0.25 },
					}}
				/>
			)}

			{resolvedTopChip === "current" && (
				<Chip
					label="TU PLAN"
					size="small"
					sx={{
						position: "absolute",
						top: -11,
						left: "50%",
						transform: "translateX(-50%)",
						bgcolor: theme.palette.success.main,
						color: "#fff",
						fontWeight: 600,
						fontSize: "0.65rem",
						letterSpacing: "0.14em",
						height: 22,
						px: 1.25,
						borderRadius: 1,
						boxShadow: `0 6px 14px ${alpha(theme.palette.success.main, 0.32)}`,
						zIndex: 2,
						"& .MuiChip-label": { px: 0.5 },
					}}
				/>
			)}

			<Box sx={{ display: "flex", flexDirection: "column", height: "100%", gap: compact ? 1.75 : 2.5 }}>
				{/* Header: nombre, descripción, precio */}
				<Box>
					<Typography
						variant="h4"
						sx={{
							fontWeight: 600,
							fontSize: compact ? "1.2rem" : "1.375rem",
							letterSpacing: "-0.015em",
							mb: 0.5,
							color: isDark ? theme.palette.grey[100] : theme.palette.grey[900],
						}}
					>
						{cleanPlanDisplayName(plan.displayName)}
					</Typography>

					<Typography
						sx={{
							fontSize: "0.88rem",
							color: theme.palette.text.secondary,
							lineHeight: 1.4,
							mb: 2,
							display: "-webkit-box",
							WebkitLineClamp: 2,
							WebkitBoxOrient: "vertical",
							overflow: "hidden",
							minHeight: "2.5em",
						}}
					>
						{plan.description || " "}
					</Typography>

					{contextMessage && (
						<Typography
							variant="caption"
							sx={{
								display: "block",
								mb: 1.25,
								color: contextToneColor,
								fontWeight: 600,
								letterSpacing: "-0.005em",
							}}
						>
							{contextMessage.text}
						</Typography>
					)}

					<Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, flexWrap: "wrap" }}>
						{promoDiscount && (
							<Typography
								sx={{
									fontSize: "1.1rem",
									fontWeight: 500,
									color: theme.palette.text.secondary,
									textDecoration: "line-through",
									opacity: 0.7,
									fontVariantNumeric: "tabular-nums",
								}}
							>
								{formatPriceShort(promoDiscount.originalPrice)}
							</Typography>
						)}
						<Typography
							variant="h2"
							sx={{
								fontWeight: 600,
								fontSize: compact ? { xs: "2.125rem", md: "2.5rem" } : { xs: "2.5rem", md: "3rem" },
								lineHeight: 1,
								letterSpacing: "-0.03em",
								fontVariantNumeric: "tabular-nums",
								color: isDark ? theme.palette.grey[50] : theme.palette.grey[900],
							}}
						>
							{promoDiscount ? formatPriceShort(promoDiscount.finalPrice) : formatPriceShort(pricing.basePrice)}
						</Typography>
						{!isFree && (
							<Typography
								sx={{
									fontSize: "0.95rem",
									fontWeight: 500,
									color: theme.palette.text.secondary,
									fontVariantNumeric: "tabular-nums",
								}}
							>
								{billingSuffixShort(pricing.billingPeriod)}
							</Typography>
						)}
					</Box>

					{/* Badge + duración del descuento + ventana de redención.
					    `durationInMonths` indica cuánto dura el descuento aplicado a la
					    suscripción (ej. "6 meses"). `validUntil` es la fecha límite para
					    sumarse a la promo. Si el backend manda un `promotionalMessage`
					    custom lo respetamos como override de la línea de vencimiento. */}
					{promoDiscount ? (
						<Stack spacing={0.5} sx={{ mt: 0.75 }}>
							<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 1 }}>
								{promoDiscount.badge && (
									<Chip
										label={promoDiscount.badge}
										size="small"
										color="success"
										sx={{
											height: 20,
											fontSize: "0.7rem",
											fontWeight: 700,
											letterSpacing: "0.04em",
											"& .MuiChip-label": { px: 0.75 },
										}}
									/>
								)}
								{promoDiscount.durationInMonths && (
									<Typography
										sx={{
											fontSize: "0.78rem",
											fontWeight: 600,
											color: theme.palette.success.dark,
											letterSpacing: "-0.005em",
										}}
									>
										durante {promoDiscount.durationInMonths} {promoDiscount.durationInMonths === 1 ? "mes" : "meses"}
									</Typography>
								)}
							</Stack>
							{(promoDiscount.promotionalMessage || promoDiscount.validUntil) && (
								<Typography
									sx={{
										fontSize: "0.74rem",
										color: theme.palette.text.secondary,
										fontWeight: 400,
										letterSpacing: "0.01em",
									}}
								>
									{promoDiscount.promotionalMessage ||
										`Promo válida hasta el ${dayjs(promoDiscount.validUntil).format("D [de] MMMM [de] YYYY")}`}
								</Typography>
							)}
						</Stack>
					) : (
						<Typography
							aria-hidden={!isFree}
							sx={{
								mt: 0.5,
								fontSize: "0.78rem",
								color: theme.palette.text.secondary,
								letterSpacing: "0.02em",
								visibility: isFree ? "visible" : "hidden",
							}}
						>
							{isFree ? "Para siempre" : "—"}
						</Typography>
					)}
				</Box>

				{(!hideResources || !shouldHideFeatures) && <Box sx={{ height: 1, bgcolor: alpha(theme.palette.divider, 0.5) }} />}

				<Stack spacing={compact ? 1.75 : 2.5} sx={{ flex: 1 }}>
					{!hideResources && visibleResources.length > 0 && (
						<Box>
							{sectionLabel(compact ? "Incluye" : "Recursos")}
							<Stack spacing={compact ? 1 : 1.25}>
								{visibleResources.map((resource, i) => (
									<Box key={`r-${i}`} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
										<Box sx={{ flexShrink: 0, mt: "2px", lineHeight: 0 }}>
											<TickCircle size={16} variant="Bulk" color={theme.palette.success.main} />
										</Box>
										<Typography sx={{ fontSize: compact ? "0.82rem" : "0.88rem", color: theme.palette.text.primary, lineHeight: 1.5 }}>
											<Box component="span" sx={{ fontWeight: 600, fontVariantNumeric: "tabular-nums" }}>
												{resource.limit}
											</Box>{" "}
											{resource.displayName}
										</Typography>
									</Box>
								))}
								{hiddenSummary && (
									<Typography
										sx={{
											fontSize: "0.78rem",
											color: theme.palette.text.secondary,
											letterSpacing: "-0.005em",
											pl: 3,
											fontStyle: "italic",
										}}
									>
										{hiddenSummary}
									</Typography>
								)}
							</Stack>
						</Box>
					)}

					{!shouldHideFeatures && visibleFeatures.length > 0 && (
						<Box>
							{sectionLabel("Funcionalidades")}
							<Stack spacing={1.25}>
								{visibleFeatures.map((feature, i) => (
									<Box key={`f-${i}`} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
										<Box sx={{ flexShrink: 0, mt: "2px", lineHeight: 0 }}>
											{feature.enabled ? (
												<TickCircle size={16} variant="Bulk" color={theme.palette.success.main} />
											) : (
												<CloseCircle size={16} variant="Bulk" color={theme.palette.text.disabled} />
											)}
										</Box>
										<Typography
											sx={{
												fontSize: "0.88rem",
												color: feature.enabled ? theme.palette.text.primary : theme.palette.text.secondary,
												lineHeight: 1.5,
											}}
										>
											{feature.displayName || feature.description}
										</Typography>
									</Box>
								))}
							</Stack>
						</Box>
					)}
				</Stack>

				{/* CTA — config dinámica por contexto */}
				<Button
					variant={cta.variant ?? (highlighted ? "contained" : "outlined")}
					color={cta.color ?? "primary"}
					size="large"
					fullWidth
					disabled={cta.disabled || cta.loading}
					onClick={cta.onClick}
					component={cta.component as any}
					{...(cta.href && { href: cta.href })}
					{...(cta.to && { to: cta.to })}
					{...(cta.dataTestId && { "data-testid": cta.dataTestId })}
					startIcon={cta.loading ? <CircularProgress size={14} color="inherit" /> : cta.startIcon}
					endIcon={!cta.loading ? cta.endIcon : undefined}
					sx={{
						mt: 1,
						height: 46,
						fontSize: "0.95rem",
						fontWeight: 600,
						textTransform: "none",
						borderRadius: 2,
						...(highlighted &&
							cta.variant !== "outlined" && {
								boxShadow: `0 8px 20px ${alpha(BRAND_BLUE, 0.3)}`,
								"&:hover": {
									boxShadow: `0 12px 26px ${alpha(BRAND_BLUE, 0.4)}`,
									transform: "translateY(-2px)",
								},
							}),
					}}
				>
					{cta.label}
				</Button>
			</Box>

			{/* Overlay para planes no activos (price1.tsx específico) */}
			{showInactiveOverlay && !plan.isActive && (
				<Box
					sx={{
						position: "absolute",
						top: 0,
						left: 0,
						right: 0,
						bottom: 0,
						backgroundColor: isDark ? "rgba(0, 0, 0, 0.85)" : "rgba(255, 255, 255, 0.85)",
						backdropFilter: "blur(5px)",
						WebkitBackdropFilter: "blur(5px)",
						zIndex: 100,
						borderRadius: "inherit",
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
					}}
				>
					<Box
						sx={{
							p: 2,
							textAlign: "center",
							bgcolor: theme.palette.background.paper,
							borderRadius: 1.5,
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
							maxWidth: "80%",
							boxShadow: `0 8px 22px ${alpha(BRAND_BLUE, 0.12)}`,
						}}
					>
						<Lock variant="Bulk" size={28} color={theme.palette.warning.main} style={{ marginBottom: 8 }} />
						<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, color: theme.palette.warning.main, mb: 0.5 }}>
							Próximamente
						</Typography>
						<Typography variant="caption" sx={{ color: theme.palette.text.secondary }}>
							Este plan estará disponible pronto
						</Typography>
					</Box>
				</Box>
			)}
		</MainCard>
	);

	if (animationIdx === undefined) {
		return cardInner;
	}

	return (
		<motion.div
			initial={{ opacity: 0, y: 24 }}
			whileInView={{ opacity: 1, y: 0 }}
			viewport={{ once: true, margin: "-80px" }}
			transition={{ duration: 0.5, delay: animationIdx * 0.1, ease: [0.22, 1, 0.36, 1] }}
			style={{ height: "100%" }}
		>
			{cardInner}
		</motion.div>
	);
};

export default PlanCard;

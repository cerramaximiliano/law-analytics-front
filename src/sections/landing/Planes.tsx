import { useEffect, useState } from "react";
import { Link as RouterLink } from "react-router-dom";

// material-ui
import { Box, Button, Chip, Container, Grid, Link, Stack, Typography } from "@mui/material";
import { useTheme, alpha } from "@mui/material/styles";

// third party
import { motion } from "framer-motion";
import { TickCircle, CloseCircle, ArrowRight } from "iconsax-react";

// project-imports
import MainCard from "components/MainCard";
import SectionEyebrow from "./SectionEyebrow";
import { pushGTMEvent } from "utils/gtm";
import ApiService, { Plan as ApiPlan, PlanFeature } from "store/reducers/ApiService";
import { getCurrentEnvironment, getPlanPricing } from "utils/planPricingUtils";
import dayjs from "utils/dayjs-config";

// ============================== TOKENS ============================== //
const BRAND_BLUE = "#3A7BFF";
const BRAND_PURPLE = "#8A5CFF";
const LIVE_GREEN = "#22C55E";
// Gradient usado en el borde del plan recomendado — mismo eje azul→púrpura→azul
// que el texto "Estudio Jurídico" del hero (única instancia intencional de púrpura).
const RECOMMENDED_BORDER_GRADIENT = `linear-gradient(135deg, ${BRAND_BLUE}, ${BRAND_PURPLE}, ${BRAND_BLUE})`;

// ============================== TIPOS ============================== //

interface PlanRow {
	label: string;
	enabled: boolean;
}

interface PlanDiscount {
	originalPrice: number;
	finalPrice: number;
	badge?: string;
	promotionalMessage?: string;
	durationInMonths?: number;
	validUntil?: string;
}

interface Plan {
	id: "free" | "standard" | "premium";
	name: string;
	price: string;
	priceSuffix: string;
	rows: PlanRow[];
	cta: string;
	ctaTo: string;
	highlighted: boolean;
	mobileOrder: number; // En xs queremos Standard primero (most relevant), luego Free, Premium.
	discount?: PlanDiscount; // Solo se llena cuando hay un activeDiscount aplicable (showOnLanding)
}

/**
 * Schema del teaser — 4 filas con el mismo topic across los 3 planes.
 * Esto mantiene visualmente alineada la comparación (qty progresivas + binarios
 * de diferenciación). El resto de features y límites quedan implícitos detrás
 * del link "Ver comparación completa".
 */
type TeaserRowDef =
	| { kind: "resource"; resourceName: string; format: (limit: number) => string }
	| { kind: "feature"; featureName: string; label: string };

const TEASER_ROWS: TeaserRowDef[] = [
	{ kind: "resource", resourceName: "folders", format: (n) => `${n} causas activas` },
	{ kind: "feature", featureName: "movements", label: "Sincronización con PJN y MEV" },
	{ kind: "resource", resourceName: "aiQueriesPerMonth", format: (n) => `${n} consultas IA/mes` },
	{ kind: "feature", featureName: "booking", label: "Sistema de reservas online" },
];

// Fallback estático para mostrar antes de que cargue el API (o si falla).
// Cada plan tiene 4 rows que matchean el schema TEASER_ROWS — cuando el API
// responde, estos rows se reemplazan con datos reales (mismo topic, mismos labels).
const PLAN_DEFAULTS: Plan[] = [
	{
		id: "free",
		name: "Gratuito",
		price: "$0",
		priceSuffix: "Para siempre",
		rows: [
			{ label: "5 causas activas", enabled: true },
			{ label: "Sincronización con PJN y MEV", enabled: false },
			{ label: "50 consultas IA/mes", enabled: true },
			{ label: "Sistema de reservas online", enabled: false },
		],
		cta: "Empezar gratis",
		ctaTo: "/register",
		highlighted: false,
		mobileOrder: 2,
	},
	{
		id: "standard",
		name: "Estándar",
		price: "$19.99",
		priceSuffix: "/mes",
		rows: [
			{ label: "50 causas activas", enabled: true },
			{ label: "Sincronización con PJN y MEV", enabled: true },
			{ label: "200 consultas IA/mes", enabled: true },
			{ label: "Sistema de reservas online", enabled: true },
		],
		cta: "Probar Estándar",
		ctaTo: "/register?plan=standard",
		highlighted: true,
		mobileOrder: 1,
	},
	{
		id: "premium",
		name: "Premium",
		price: "$49.99",
		priceSuffix: "/mes",
		rows: [
			{ label: "500 causas activas", enabled: true },
			{ label: "Sincronización con PJN y MEV", enabled: true },
			{ label: "1500 consultas IA/mes", enabled: true },
			{ label: "Sistema de reservas online", enabled: true },
		],
		cta: "Probar Premium",
		ctaTo: "/register?plan=premium",
		highlighted: false,
		mobileOrder: 3,
	},
];

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

const formatPriceShort = (price: number): string => (price % 1 === 0 ? `$${price}` : `$${price.toFixed(2)}`);

const trackPlanCTA = (planId: Plan["id"]) => {
	pushGTMEvent("cta_click_plan_teaser", { plan: planId });
};

/**
 * Filtro de visibility consistente con el usado en /plans (price1.tsx):
 * "all" → visible siempre, "none" → oculta, valor === env actual → visible.
 */
const isVisibleInCurrentEnv = (visibility: string | undefined, currentEnv: string): boolean => {
	if (!visibility || visibility === "all") return true;
	if (visibility === "none") return false;
	return visibility === currentEnv;
};

/**
 * Computa las 4 filas del teaser tomando los valores del API plan.
 * Para resources: usa el `limit` numérico. Para features: usa el flag `enabled`.
 * Si una fila no encuentra su resource/feature en el API → devuelve `null` para
 * que el caller pueda hacer fallback al hardcodeo.
 */
const computeRowsFromApiPlan = (apiPlan: ApiPlan, currentEnv: string): PlanRow[] | null => {
	const rows: PlanRow[] = [];

	for (const def of TEASER_ROWS) {
		if (def.kind === "resource") {
			const rl = apiPlan.resourceLimits.find((r) => r.name === def.resourceName);
			if (!rl || !isVisibleInCurrentEnv(rl.visibility, currentEnv)) return null;
			rows.push({
				label: def.format(rl.limit),
				enabled: rl.limit > 0,
			});
		} else {
			const feat = apiPlan.features.find((f: PlanFeature) => f.name === def.featureName);
			if (!feat || !isVisibleInCurrentEnv(feat.visibility, currentEnv)) return null;
			rows.push({
				label: def.label,
				enabled: Boolean(feat.enabled),
			});
		}
	}

	return rows;
};

// ============================== LANDING - PLANES ============================== //

const Planes = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	void LIVE_GREEN;

	const [plans, setPlans] = useState<Plan[]>(PLAN_DEFAULTS);

	useEffect(() => {
		let cancelled = false;
		const currentEnv = getCurrentEnvironment();

		(async () => {
			try {
				const response = await ApiService.getPublicPlans();
				if (cancelled || !response?.success || !response.data) return;

				const merged = PLAN_DEFAULTS.map((def) => {
					const apiPlan = response.data!.find((p) => p.planId === def.id);
					if (!apiPlan) return def;

					const pricing = getPlanPricing(apiPlan);
					const isFree = def.id === "free" || pricing.basePrice === 0;

					// Si el API tiene los 4 topics del schema, usamos sus valores reales.
					// Si falta alguno (ej. resource oculto en el env actual), mantenemos el
					// hardcodeo del fallback para no romper la simetría del teaser.
					const apiRows = computeRowsFromApiPlan(apiPlan, currentEnv);

					// Sólo se muestran descuentos del primer item de activeDiscounts.
					// El backend ya filtra por showOnLanding cuando no hay sesión, así que
					// si llegó algo acá es seguro mostrarlo en la landing pública.
					const firstDiscount = !isFree && apiPlan.activeDiscounts && apiPlan.activeDiscounts.length > 0
						? apiPlan.activeDiscounts[0]
						: undefined;

					return {
						...def,
						price: formatPriceShort(pricing.basePrice),
						priceSuffix: isFree ? "Para siempre" : billingSuffixShort(pricing.billingPeriod),
						rows: apiRows ?? def.rows,
						discount: firstDiscount
							? {
									originalPrice: firstDiscount.originalPrice,
									finalPrice: firstDiscount.finalPrice,
									badge: firstDiscount.badge,
									promotionalMessage: firstDiscount.promotionalMessage,
									durationInMonths: firstDiscount.durationInMonths,
									validUntil: firstDiscount.validUntil,
							  }
							: undefined,
					};
				});
				setPlans(merged);
			} catch {
				// silencioso: mantenemos los valores hardcodeados como fallback
			}
		})();
		return () => {
			cancelled = true;
		};
	}, []);

	return (
		<Box
			id="planes"
			component="section"
			sx={{
				position: "relative",
				overflow: "hidden",
				py: { xs: 4, md: 7 },
				scrollMarginTop: { xs: 72, md: 80 },
			}}
		>
			{/* Atmósfera — spotlight único detrás de la card "Recomendado" (centro).
			    Refuerza la jerarquía visual sin agregar ruido. */}
			<Box
				aria-hidden
				sx={{
					position: "absolute",
					top: "55%",
					left: "50%",
					transform: "translate(-50%, -50%)",
					width: { xs: 520, md: 780 },
					height: { xs: 520, md: 780 },
					borderRadius: "50%",
					background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)} 0%, ${alpha(
						BRAND_BLUE,
						isDark ? 0.06 : 0.04,
					)} 40%, transparent 70%)`,
					filter: "blur(70px)",
					pointerEvents: "none",
					zIndex: 0,
				}}
			/>

			<Container sx={{ position: "relative", zIndex: 1 }}>
				<Box sx={{ textAlign: "center", mb: { xs: 4, md: 6 } }}>
					<motion.div
						initial={{ opacity: 0, translateY: 50 }}
						whileInView={{ opacity: 1, translateY: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.05 }}
					>
						<SectionEyebrow number="04" label="Planes" align="center" mb={2.5} />
						<Typography
							variant="h2"
							sx={{
								fontSize: { xs: "1.875rem", sm: "2.25rem", md: "2.75rem" },
								lineHeight: 1.08,
								letterSpacing: "-0.025em",
								textWrap: "balance",
							}}
						>
							Planes para cada tamaño de estudio
						</Typography>
					</motion.div>
					<motion.div
						initial={{ opacity: 0, translateY: 30 }}
						whileInView={{ opacity: 1, translateY: 0 }}
						viewport={{ once: true, margin: "-100px" }}
						transition={{ type: "spring", stiffness: 150, damping: 30, delay: 0.15 }}
					>
						<Typography
							variant="h5"
							color="text.secondary"
							sx={{
								maxWidth: 640,
								mx: "auto",
								mt: 1.5,
								fontSize: { xs: "1rem", md: "1.125rem" },
								fontWeight: 400,
								lineHeight: 1.5,
								letterSpacing: "-0.005em",
								textWrap: "pretty",
							}}
						>
							Empezá gratis. Cambiá de plan en cualquier momento.
						</Typography>
					</motion.div>
				</Box>

				<Grid container spacing={3} alignItems="stretch" justifyContent="center" sx={{ pt: { xs: 2, md: 2 } }}>
					{plans.map((plan, idx) => {
						const isHighlighted = plan.highlighted;

						return (
							<Grid
								item
								xs={12}
								sm={6}
								md={4}
								key={plan.id}
								sx={{
									order: { xs: plan.mobileOrder, md: 0 },
								}}
							>
								<motion.div
									initial={{ opacity: 0, y: 24 }}
									whileInView={{ opacity: 1, y: 0 }}
									viewport={{ once: true, margin: "-80px" }}
									transition={{ duration: 0.5, delay: idx * 0.1, ease: [0.22, 1, 0.36, 1] }}
									style={{ height: "100%" }}
								>
									<MainCard
										border={!isHighlighted}
										sx={{
											height: "100%",
											position: "relative",
											overflow: "visible",
											// Mismo radio para los 3 — la jerarquía viene por color, no por shape.
											borderRadius: 2,
											...(isHighlighted && {
												// Fondo tintado brand-blue (sutil) en lugar del lift translateY.
												bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
												// Borde gradient azul→púrpura mediante ::before + mask composite.
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
													md: isHighlighted
														? `0 22px 48px ${alpha(BRAND_BLUE, 0.22)}, 0 10px 22px ${alpha(BRAND_BLUE, 0.12)}`
														: `0 12px 28px ${alpha(theme.palette.common.black, 0.1)}, 0 4px 10px ${alpha(
																theme.palette.common.black,
																0.06,
														  )}`,
												},
												borderColor: { md: isHighlighted ? undefined : alpha(BRAND_BLUE, 0.25) },
											},
										}}
									>
										{isHighlighted && (
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
													// borderRadius bajo para sentir menos "pill" y más editorial.
													borderRadius: 1,
													boxShadow: `0 6px 14px ${alpha(BRAND_BLUE, 0.32)}`,
													zIndex: 2,
													"& .MuiChip-label": {
														px: 0.5,
													},
												}}
											/>
										)}

										<Box sx={{ display: "flex", flexDirection: "column", height: "100%", gap: 2 }}>
											<Box>
												<Typography
													variant="h4"
													sx={{
														fontWeight: 600,
														fontSize: "1.375rem",
														letterSpacing: "-0.015em",
														mb: 1.5,
														color: isDark ? theme.palette.grey[100] : theme.palette.grey[900],
													}}
												>
													{plan.name}
												</Typography>

												<Box sx={{ display: "flex", alignItems: "baseline", gap: 0.75, flexWrap: "wrap" }}>
													{plan.discount && (
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
															{formatPriceShort(plan.discount.originalPrice)}
														</Typography>
													)}
													<Typography
														variant="h2"
														sx={{
															fontWeight: 600,
															fontSize: { xs: "2.5rem", md: "3rem" },
															lineHeight: 1,
															letterSpacing: "-0.03em",
															fontVariantNumeric: "tabular-nums",
															color: isDark ? theme.palette.grey[50] : theme.palette.grey[900],
														}}
													>
														{plan.discount ? formatPriceShort(plan.discount.finalPrice) : plan.price}
													</Typography>
													{plan.id !== "free" && (
														<Typography
															sx={{
																fontSize: "0.95rem",
																fontWeight: 500,
																color: theme.palette.text.secondary,
																fontVariantNumeric: "tabular-nums",
															}}
														>
															{plan.priceSuffix}
														</Typography>
													)}
												</Box>
												{/* Caption reservada — para plan free muestra "Para siempre".
												Para planes pagos con descuento, muestra badge + duración + vencimiento.
												Para planes pagos sin descuento, queda invisible pero ocupa la misma
												altura para alinear las feature-lists entre las 3 columnas. */}
												{plan.discount ? (
													<Stack spacing={0.4} sx={{ mt: 0.75 }}>
														<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" sx={{ gap: 0.75 }}>
															{plan.discount.badge && (
																<Chip
																	label={plan.discount.badge}
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
															{plan.discount.durationInMonths && (
																<Typography
																	sx={{
																		fontSize: "0.78rem",
																		fontWeight: 600,
																		color: theme.palette.success.dark,
																		letterSpacing: "-0.005em",
																	}}
																>
																	durante {plan.discount.durationInMonths}{" "}
																	{plan.discount.durationInMonths === 1 ? "mes" : "meses"}
																</Typography>
															)}
														</Stack>
														{plan.discount.validUntil && (
															<Typography
																sx={{
																	fontSize: "0.74rem",
																	color: theme.palette.text.secondary,
																	fontWeight: 400,
																	letterSpacing: "0.01em",
																}}
															>
																Promo válida hasta el {dayjs(plan.discount.validUntil).format("D [de] MMMM")}
															</Typography>
														)}
													</Stack>
												) : (
													<Typography
														aria-hidden={plan.id !== "free"}
														sx={{
															mt: 0.5,
															fontSize: "0.78rem",
															color: theme.palette.text.secondary,
															letterSpacing: "0.02em",
															visibility: plan.id === "free" ? "visible" : "hidden",
														}}
													>
														{plan.id === "free" ? plan.priceSuffix : "—"}
													</Typography>
												)}
											</Box>

											<Box sx={{ height: 1, bgcolor: alpha(theme.palette.divider, 0.5) }} />

											<Stack spacing={1.25} sx={{ flex: 1 }}>
												{plan.rows.map((row, idx) => (
													<Box key={idx} sx={{ display: "flex", alignItems: "flex-start", gap: 1 }}>
														<Box sx={{ flexShrink: 0, mt: "2px", lineHeight: 0 }}>
															{row.enabled ? (
																<TickCircle size={16} variant="Bulk" color={theme.palette.success.main} />
															) : (
																<CloseCircle size={16} variant="Bulk" color={theme.palette.text.disabled} />
															)}
														</Box>
														<Typography
															sx={{
																fontSize: "0.88rem",
																color: row.enabled ? theme.palette.text.primary : theme.palette.text.secondary,
																lineHeight: 1.5,
															}}
														>
															{row.label}
														</Typography>
													</Box>
												))}

												{/* Link siempre presente — apunta a la comparación full en /plans
												donde están todas las features, límites y diferencias detalladas. */}
												<Link
													component={RouterLink}
													to="/plans"
													underline="none"
													sx={{
														display: "inline-flex",
														alignItems: "center",
														alignSelf: "flex-start",
														gap: 0.5,
														mt: 0.25,
														ml: 3, // alinea con el texto de las features (ancho icono + gap).
														fontSize: "0.82rem",
														fontWeight: 500,
														color: theme.palette.primary.main,
														transition: "color 0.2s ease",
														"&:hover": {
															color: theme.palette.primary.dark,
															"& .extra-arrow": { transform: "translateX(3px)" },
														},
													}}
												>
													Ver comparación completa
													<Box className="extra-arrow" component="span" sx={{ display: "inline-flex", transition: "transform 0.2s ease" }}>
														<ArrowRight size={14} />
													</Box>
												</Link>
											</Stack>

											<Button
												component={RouterLink}
												to={plan.ctaTo}
												onClick={() => trackPlanCTA(plan.id)}
												variant={isHighlighted ? "contained" : "outlined"}
												color="primary"
												size="large"
												fullWidth
												sx={{
													mt: 1,
													height: 46,
													fontSize: "0.95rem",
													fontWeight: 600,
													textTransform: "none",
													borderRadius: 2,
													...(isHighlighted && {
														boxShadow: `0 8px 20px ${alpha(BRAND_BLUE, 0.3)}`,
														"&:hover": {
															boxShadow: `0 12px 26px ${alpha(BRAND_BLUE, 0.4)}`,
															transform: "translateY(-2px)",
														},
													}),
												}}
											>
												{plan.cta}
											</Button>
										</Box>
									</MainCard>
								</motion.div>
							</Grid>
						);
					})}
				</Grid>

				<Box sx={{ mt: { xs: 4, md: 5 }, textAlign: "center" }}>
					<Button
						component={RouterLink}
						to="/plans"
						variant="text"
						color="primary"
						endIcon={<ArrowRight size={16} />}
						sx={{
							fontSize: "0.95rem",
							fontWeight: 600,
							textTransform: "none",
							"&:hover": {
								bgcolor: alpha(BRAND_BLUE, 0.06),
							},
						}}
					>
						Ver todos los planes y comparar
					</Button>
				</Box>
			</Container>
		</Box>
	);
};

export default Planes;

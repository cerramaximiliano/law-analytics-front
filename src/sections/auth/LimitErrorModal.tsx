import React, { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";

// material-ui
import {
	Alert,
	Box,
	Button,
	Chip,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	DialogTitle,
	Divider,
	Grid,
	Stack,
	Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// icons
import { ArrowRight, Crown, Lock } from "iconsax-react";

// project-imports
import PlanCard from "components/cards/PlanCard";
import ApiService, { Plan } from "store/reducers/ApiService";

// ============================== TOKENS ============================== //
const BRAND_BLUE = "#3A7BFF";

interface LimitInfo {
	resourceType: string;
	plan: string;
	currentCount: string;
	limit: number;
}

interface FeatureInfo {
	feature: string;
	plan: string;
	availableIn: string[];
}

interface LimitErrorModalProps {
	open: boolean;
	onClose: () => void;
	message: string;
	limitInfo?: LimitInfo;
	featureInfo?: FeatureInfo;
	upgradeRequired?: boolean;
}

// Traduce nombres internos de planes (free/standard/premium) a labels en español
// usados en la UI. Mantiene cualquier valor desconocido tal cual.
const PLAN_LABELS: Record<string, string> = {
	free: "Gratuito",
	standard: "Estándar",
	premium: "Premium",
};

const formatPlanName = (raw: string): string => {
	if (!raw) return raw;
	const key = raw.trim().toLowerCase();
	return PLAN_LABELS[key] ?? raw;
};

export const LimitErrorModal: React.FC<LimitErrorModalProps> = ({ open, onClose, message, limitInfo, featureInfo }) => {
	const navigate = useNavigate();
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const [plans, setPlans] = useState<Plan[]>([]);
	const [loading, setLoading] = useState(false);
	const [error, setError] = useState<string | null>(null);
	const [loadingPlanId, setLoadingPlanId] = useState<string | null>(null);

	// Cargar planes al abrir
	useEffect(() => {
		const fetchPlans = async () => {
			if (!open) return;
			try {
				setLoading(true);
				setError(null);
				const response = await ApiService.getPublicPlans();
				if (response.success && response.data) {
					setPlans(response.data);
				} else {
					setError("No se pudieron cargar los planes");
				}
			} catch {
				setError("Error al cargar los planes. Por favor, intentá más tarde.");
			} finally {
				setLoading(false);
			}
		};
		fetchPlans();
	}, [open]);

	const handleUpgrade = (planId?: string) => {
		setLoadingPlanId(planId || "default");
		onClose();
		if (planId) {
			navigate(`/suscripciones/tables?plan=${planId}`);
		} else {
			navigate("/suscripciones/tables");
		}
	};

	const isLimitError = !!limitInfo;
	const isFeatureError = !!featureInfo;

	const getTitle = () => {
		if (isFeatureError) return "Función no disponible";
		if (isLimitError) return "Límite alcanzado";
		return "Restricción del plan";
	};

	// Planes a sugerir: excluir el plan actual del usuario.
	const getRecommendedPlans = (): Plan[] => {
		if (plans.length === 0) return [];
		let currentUserPlan = "free";
		if (isLimitError && limitInfo) currentUserPlan = limitInfo.plan.toLowerCase();
		else if (isFeatureError && featureInfo) currentUserPlan = featureInfo.plan.toLowerCase();
		return plans.filter((plan) => plan.planId.toLowerCase() !== currentUserPlan && plan.isActive);
	};

	// Bloque informativo arriba — explica el error con detalle del recurso/feature.
	const getContentMessage = () => {
		const baseBoxSx = {
			mb: 2,
			p: 2,
			borderRadius: 1.5,
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
			border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
			maxWidth: "700px",
			mx: "auto",
		};

		if (isLimitError && limitInfo) {
			return (
				<Box sx={baseBoxSx}>
					<Typography sx={{ fontSize: "0.95rem", color: "text.primary", letterSpacing: "-0.005em", mb: 1 }}>{message}</Typography>
					<Stack direction="row" justifyContent="space-between" alignItems="center" spacing={1}>
						<Typography variant="body2" sx={{ color: "text.secondary", letterSpacing: "-0.005em" }}>
							{limitInfo.resourceType} — uso actual
						</Typography>
						<Typography
							sx={{
								fontWeight: 600,
								color: theme.palette.error.main,
								fontVariantNumeric: "tabular-nums",
								letterSpacing: "-0.005em",
							}}
						>
							{limitInfo.currentCount} / {limitInfo.limit}
						</Typography>
					</Stack>
				</Box>
			);
		}

		if (isFeatureError && featureInfo) {
			return (
				<Box sx={baseBoxSx}>
					<Typography sx={{ fontSize: "0.95rem", color: "text.primary", letterSpacing: "-0.005em", mb: 1.25 }}>{message}</Typography>
					<Stack spacing={0.75}>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Typography variant="body2" sx={{ color: "text.secondary", letterSpacing: "-0.005em" }}>
								Función
							</Typography>
							<Typography variant="body2" sx={{ fontWeight: 600, letterSpacing: "-0.005em" }}>
								{featureInfo.feature}
							</Typography>
						</Stack>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Typography variant="body2" sx={{ color: "text.secondary", letterSpacing: "-0.005em" }}>
								Tu plan actual
							</Typography>
							<Stack direction="row" alignItems="center" spacing={0.5}>
								<Crown size={14} variant="Bulk" color={BRAND_BLUE} />
								<Typography variant="body2" sx={{ fontWeight: 600, letterSpacing: "-0.005em" }}>
									{formatPlanName(featureInfo.plan)}
								</Typography>
							</Stack>
						</Stack>
						{featureInfo.availableIn.length > 0 && (
							<Stack direction="row" alignItems="center" spacing={1} flexWrap="wrap">
								<Typography variant="body2" sx={{ color: "text.secondary", letterSpacing: "-0.005em" }}>
									Disponible en:
								</Typography>
								<Stack direction="row" spacing={0.5} flexWrap="wrap" sx={{ gap: 0.5 }}>
									{featureInfo.availableIn.map((plan, index) => (
										<Chip
											key={index}
											size="small"
											label={formatPlanName(plan)}
											icon={<Crown size={12} variant="Bulk" />}
											sx={{
												height: 22,
												bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
												color: BRAND_BLUE,
												border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
												fontWeight: 600,
												letterSpacing: "0.02em",
												"& .MuiChip-icon": { color: BRAND_BLUE },
											}}
										/>
									))}
								</Stack>
							</Stack>
						)}
					</Stack>
				</Box>
			);
		}

		return (
			<Alert
				severity="warning"
				icon={<Lock variant="Bulk" size={24} color={theme.palette.warning.main} />}
				sx={{ mb: 2, width: "100%", maxWidth: "700px", mx: "auto", borderRadius: 1.5 }}
			>
				{message || "Acceso denegado: esta característica no está disponible en tu plan actual."}
			</Alert>
		);
	};

	// Render del listado de planes — todos usan PlanCard, consistente con plans.tsx
	const renderPlansList = () => {
		if (loading) {
			return (
				<Box sx={{ display: "flex", justifyContent: "center", alignItems: "center", minHeight: "200px" }}>
					<CircularProgress sx={{ color: BRAND_BLUE }} />
				</Box>
			);
		}

		if (error) return <Alert severity="error" sx={{ borderRadius: 1.5 }}>{error}</Alert>;
		if (plans.length === 0) return <Alert severity="info" sx={{ borderRadius: 1.5 }}>No hay planes disponibles en este momento.</Alert>;

		const recommendedPlans = getRecommendedPlans();
		if (recommendedPlans.length === 0)
			return <Alert severity="info" sx={{ borderRadius: 1.5 }}>No hay planes disponibles para actualizar en este momento.</Alert>;

		return (
			<Grid container spacing={2.5} alignItems="stretch" justifyContent="center">
				{recommendedPlans.map((plan) => (
					<Grid item xs={12} sm={recommendedPlans.length === 1 ? 8 : 6} md={recommendedPlans.length === 1 ? 7 : 6} key={plan.planId}>
						<PlanCard
							plan={plan}
							highlighted={plan.planId === "standard"}
							compact
							cta={{
								label: loadingPlanId === plan.planId ? "Procesando…" : "Suscribirme",
								onClick: () => !loadingPlanId && handleUpgrade(plan.planId),
								disabled: loadingPlanId !== null,
								loading: loadingPlanId === plan.planId,
								variant: plan.planId === "standard" ? "contained" : "outlined",
								color: "primary",
								endIcon: loadingPlanId !== plan.planId ? <ArrowRight size={16} /> : undefined,
							}}
						/>
					</Grid>
				))}
			</Grid>
		);
	};

	return (
		<Dialog
			open={open}
			onClose={onClose}
			maxWidth="md"
			fullWidth
			sx={{
				"& .MuiDialog-paper": {
					borderRadius: 2,
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.12)}`,
					overflow: "hidden",
				},
			}}
		>
			<DialogTitle
				sx={{
					p: 3,
					borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.025),
				}}
			>
				<Stack spacing={1}>
					<Stack direction="row" alignItems="center" spacing={1.25}>
						<Box
							sx={{
								width: 40,
								height: 40,
								borderRadius: 1.5,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
								color: BRAND_BLUE,
							}}
						>
							<Crown size={22} variant="Bulk" />
						</Box>
						<Typography
							sx={{
								fontWeight: 600,
								fontSize: { xs: "1.15rem", sm: "1.3rem" },
								letterSpacing: "-0.018em",
								color: "text.primary",
								lineHeight: 1.2,
							}}
						>
							{getTitle()}
						</Typography>
					</Stack>
					<Typography sx={{ fontSize: "0.875rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
						Actualizá tu plan para continuar
					</Typography>
				</Stack>
			</DialogTitle>

			<DialogContent sx={{ p: 3 }}>
				{getContentMessage()}
				{renderPlansList()}
			</DialogContent>

			<Divider />

			<DialogActions sx={{ p: 2.5, bgcolor: alpha(BRAND_BLUE, isDark ? 0.04 : 0.02) }}>
				<Button onClick={onClose} sx={{ color: "text.secondary", textTransform: "none", fontWeight: 500 }}>
					Cerrar
				</Button>
			</DialogActions>
		</Dialog>
	);
};

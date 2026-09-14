import React from "react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

// mui
import { Grid, Box, Button, useTheme, Tooltip, Stack, Typography, Skeleton } from "@mui/material";
import { alpha } from "@mui/material/styles";

// icons
import { Lock, Export, Crown, InfoCircle, Clock, Chart2, CloseSquare } from "iconsax-react";

// project imports
import MainCard from "components/MainCard";
import IconButton from "components/@extended/IconButton";
import { AppDispatch, RootState } from "store";
import { getUnifiedStats, setSelectedHistory } from "store/reducers/unifiedStats";
import useAuth from "hooks/useAuth";
import useSubscription from "hooks/useSubscription";
import { useEffectiveUser } from "hooks/useEffectiveUser";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import ExportReportModal from "sections/dashboard/analytics/ExportReportModal";
import AnalyticsHistorySelector from "sections/dashboard/analytics/AnalyticsHistorySelector";
import { GuideAnalytics } from "components/guides";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

// widgets
import AverageResolutionTime from "sections/widget/analytics/AverageResolutionTime";
import TaskCompletionRate from "sections/widget/analytics/TaskCompletionRate";
import TaskDistributionByPriority from "sections/widget/analytics/TaskDistributionByPriority";
import CalculatorTypeBreakdown from "sections/widget/analytics/CalculatorTypeBreakdown";
import DataQuality from "sections/widget/analytics/DataQuality";
import AmountsByFolderStatus from "sections/widget/analytics/AmountsByFolderStatus";
import DailyWeeklyActivity from "sections/widget/analytics/DailyWeeklyActivity";
import RecentActivityFeed from "sections/widget/analytics/RecentActivityFeed";
import TopMatters from "sections/widget/analytics/TopMatters";
import FoldersByMatter from "sections/widget/analytics/FoldersByMatter";
import NotificationStatus from "sections/widget/analytics/NotificationStatus";
import DeadlineProjections from "sections/widget/analytics/DeadlineProjections";
import FolderClosingTrends from "sections/widget/analytics/FolderClosingTrends";
import HistoricalTrends from "sections/widget/analytics/HistoricalTrends";

// ==============================|| DASHBOARD - ANALYTICS ||============================== //

const DashboardAnalytics = () => {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const { user } = useAuth();
	const subscriptionData = useSubscription();
	const subscription = subscriptionData?.subscription;
	const hasFeatureLocal = subscriptionData?.hasFeatureLocal || (() => false);

	// Get effective user for team-aware data fetching
	// effectiveUserId: owner's userId in team mode, personal userId otherwise
	// isReady: true when context is fully initialized
	const { effectiveUserId, isReady: isTeamReady, isViewingTeamData } = useEffectiveUser();

	// Obtener el estado de las estadísticas
	const {
		data: statsData,
		isLoading: statsLoading,
		error: statsError,
		descriptions,
		cacheInfo,
		selectedHistoryId,
		history,
	} = useSelector((state: RootState) => state.unifiedStats);

	// Estados para el control del modal
	const [hasAdvancedAnalytics, setHasAdvancedAnalytics] = useState(false);
	const [hasExportReports, setHasExportReports] = useState(false);
	const [featureInfo, setFeatureInfo] = useState<any>(null);
	const [limitModalOpen, setLimitModalOpen] = useState(false);
	const [hasModalBeenClosed, setHasModalBeenClosed] = useState(false);
	const [exportModalOpen, setExportModalOpen] = useState(false);
	const [guideOpen, setGuideOpen] = useState(false);
	const [isCheckingFeatures, setIsCheckingFeatures] = useState(true);

	// Función para crear el objeto featureInfo
	// Usa el plan efectivo (puede ser del owner si es miembro de equipo)
	const createFeatureInfo = () => ({
		feature: "Analíticas Avanzadas y Exportación de Reportes",
		plan: subscription?.plan || "free",
		availableIn: ["standard", "premium"],
	});

	// Se ejecuta solo al montar el componente
	useEffect(() => {
		// Limpiar el flag del sessionStorage al montar el componente
		sessionStorage.removeItem("analytics_modal_shown");

		// Efecto de limpieza: remover también cuando el componente se desmonte
		return () => {
			sessionStorage.removeItem("analytics_modal_shown");
		};
	}, []);

	// Verificar si el usuario tiene acceso a las características
	useEffect(() => {
		// Esperar a que se cargue la suscripción Y el contexto de equipos esté completamente listo
		// isTeamReady es true cuando: inicializado Y (sin equipos O equipo activo seleccionado)
		// Esto es importante para miembros de equipos que heredan features del owner
		if (!subscription || !isTeamReady) return;

		setIsCheckingFeatures(true);

		// Verificar si tiene las características usando el hook
		// hasFeatureLocal ya considera si el usuario es miembro de un equipo
		// y hereda features del owner
		const hasAdvanced = hasFeatureLocal("advancedAnalytics");
		const hasExport = hasFeatureLocal("exportReports");

		setHasAdvancedAnalytics(hasAdvanced || false);
		setHasExportReports(hasExport || false);

		// Si no tiene ninguna de las características habilitadas y el modal no ha sido cerrado manualmente
		if (!hasAdvanced && !hasExport && !hasModalBeenClosed) {
			setFeatureInfo(createFeatureInfo());

			// Comprobar si ya mostramos el modal en esta visita a la página
			const modalShown = sessionStorage.getItem("analytics_modal_shown");

			// Solo mostrar el modal si no se ha mostrado antes
			if (!modalShown) {
				setLimitModalOpen(true);
			}
		}

		setIsCheckingFeatures(false);
	}, [subscription, isTeamReady, hasModalBeenClosed]);

	// Manejar cierre del modal
	const handleCloseLimitModal = () => {
		// Marcar que el modal fue cerrado explícitamente por el usuario
		setHasModalBeenClosed(true);
		// Marcar que ya se mostró, para evitar mostrarlo nuevamente en esta sesión
		sessionStorage.setItem("analytics_modal_shown", "true");
		setLimitModalOpen(false);
	};

	// Estado para controlar si ya intentamos cargar los datos
	const [hasTriedToLoad, setHasTriedToLoad] = useState(false);

	// Usar effectiveUserId del hook (owner's userId en modo equipo)
	const userId = effectiveUserId;

	useEffect(() => {
		console.log("📊 [Analytics] useEffect triggered:", {
			hasUser: !!user,
			effectiveUserId,
			isTeamReady,
			isViewingTeamData,
			statsLoading,
			hasData: !!statsData,
			hasTriedToLoad,
		});

		// Esperar a que el contexto esté listo antes de cargar
		if (effectiveUserId && isTeamReady && !hasTriedToLoad) {
			console.log("📊 [Analytics] Fetching stats for:", isViewingTeamData ? "team owner" : "personal user", effectiveUserId);
			// Fetch all sections for analytics
			dispatch(getUnifiedStats(effectiveUserId, "all", false));
			setHasTriedToLoad(true);
		} else if (!effectiveUserId) {
			console.log("⚠️ [Analytics] No effective user ID available yet");
		}
	}, [dispatch, effectiveUserId, isTeamReady, hasTriedToLoad, isViewingTeamData]);

	// Configuración de items skeleton: representativos en mobile (4 items), completos en desktop (12)
	// Cada item define su columna para cada breakpoint: xs, md, lg
	const skeletonItems: Array<{ xs: number; md: number; lg: number; chartBar?: boolean }> = [
		{ xs: 6, md: 6, lg: 3 },
		{ xs: 6, md: 6, lg: 3 },
		{ xs: 6, md: 6, lg: 3 },
		{ xs: 6, md: 6, lg: 3 },
		{ xs: 12, md: 6, lg: 3, chartBar: true },
		{ xs: 12, md: 6, lg: 5, chartBar: true },
		{ xs: 12, md: 6, lg: 4 },
		{ xs: 12, md: 12, lg: 8, chartBar: true },
		{ xs: 12, md: 6, lg: 4 },
		{ xs: 12, md: 6, lg: 6, chartBar: true },
		{ xs: 12, md: 6, lg: 6, chartBar: true },
		{ xs: 12, md: 12, lg: 12, chartBar: true },
	];

	// Mostrar skeleton mientras se carga el usuario, los datos, la suscripción, el contexto de equipos o se verifican features
	if (!user || statsLoading || !subscription || !isTeamReady || isCheckingFeatures) {
		return (
			<Box>
				<MainCard title="Panel de Analíticas">
					<Grid container spacing={3}>
						{skeletonItems.map((item, index) => (
							<Grid
								item
								// En mobile mostramos solo los primeros 4 como pares (6+6 = fila completa x2)
								// Los items siguientes se ocultan en xs via display
								xs={item.xs}
								md={item.md}
								lg={item.lg}
								key={index}
								sx={index >= 4 ? { display: { xs: "none", md: "block" } } : undefined}
							>
								<Skeleton
									variant="rectangular"
									sx={{ borderRadius: 1, height: item.chartBar ? { xs: 120, md: 200 } : { xs: 80, md: 140 } }}
								/>
								{item.chartBar && (
									<Stack direction="row" spacing={0.5} sx={{ mt: 1, display: { xs: "none", md: "flex" } }}>
										{[...Array(6)].map((__, i) => (
											<Skeleton key={i} variant="rectangular" width="100%" height={8} sx={{ borderRadius: 0.5 }} />
										))}
									</Stack>
								)}
							</Grid>
						))}
					</Grid>
				</MainCard>
			</Box>
		);
	}

	const cacheAccent = cacheInfo && cacheInfo.hoursAgo > 24 ? STALE_AMBER : LIVE_GREEN;
	const cacheHoursLabel = cacheInfo ? Math.round(cacheInfo.hoursAgo) : 0;

	// Pill brand reutilizable
	const BrandPill = ({
		accent,
		icon,
		label,
		onDelete,
		tooltip,
	}: {
		accent: string;
		icon?: React.ReactNode;
		label: React.ReactNode;
		onDelete?: () => void;
		tooltip?: string;
	}) => {
		const pill = (
			<Box
				sx={{
					display: "inline-flex",
					alignItems: "center",
					gap: 0.625,
					px: 0.875,
					py: 0.375,
					borderRadius: 0.875,
					bgcolor: alpha(accent, isDark ? 0.16 : 0.1),
					border: `1px solid ${alpha(accent, isDark ? 0.32 : 0.22)}`,
				}}
			>
				{icon}
				<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: accent }} />
				<Typography
					sx={{
						fontSize: "0.66rem",
						fontWeight: 600,
						color: accent,
						letterSpacing: "0.04em",
						textTransform: "uppercase",
						lineHeight: 1,
						fontVariantNumeric: "tabular-nums",
					}}
				>
					{label}
				</Typography>
				{onDelete && (
					<IconButton
						onClick={onDelete}
						size="small"
						sx={{
							width: 16,
							height: 16,
							ml: 0.25,
							color: accent,
							"&:hover": { bgcolor: alpha(accent, 0.2) },
						}}
					>
						<CloseSquare size={11} variant="Bulk" />
					</IconButton>
				)}
			</Box>
		);
		return tooltip ? <Tooltip title={tooltip}>{pill}</Tooltip> : pill;
	};

	// Botón icon-ring brand reutilizable
	const brandIconBtnSx = {
		width: 36,
		height: 36,
		borderRadius: 1,
		color: BRAND_BLUE,
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
		bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
		transition: "all 180ms ease",
		"&:hover": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
			borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
		},
	};

	return (
		<Box>
			<MainCard
				sx={{ border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`, boxShadow: "none" }}
				title={
					<Stack direction="row" alignItems="center" spacing={1.25}>
						<Box
							sx={{
								width: 36,
								height: 36,
								borderRadius: 1,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
								color: BRAND_BLUE,
								flexShrink: 0,
							}}
						>
							<Chart2 size={20} variant="Bulk" />
						</Box>
						<Stack spacing={0.125}>
							<Stack direction="row" spacing={0.5} alignItems="center">
								<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
								<Typography
									sx={{
										fontSize: "0.6rem",
										fontWeight: 600,
										letterSpacing: "0.08em",
										textTransform: "uppercase",
										color: "text.secondary",
									}}
								>
									Analíticas
								</Typography>
							</Stack>
							<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap" useFlexGap>
								<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>
									Panel de analíticas
								</Typography>
								{selectedHistoryId && (
									<BrandPill accent={BRAND_BLUE} label="Viendo histórico" onDelete={() => dispatch(setSelectedHistory(null))} />
								)}
							</Stack>
						</Stack>
					</Stack>
				}
				secondary={
					<Stack direction="row" alignItems="center" spacing={1.25} flexWrap="wrap" useFlexGap>
						{cacheInfo && (
							<BrandPill
								accent={cacheAccent}
								icon={<Clock size={11} variant="Bulk" color={cacheAccent} />}
								label={`Hace ${cacheHoursLabel} ${cacheHoursLabel === 1 ? "h" : "h"}`}
								tooltip={`Última actualización: ${new Date(cacheInfo.generatedAt).toLocaleString()} · Próxima: ${new Date(
									cacheInfo.nextUpdate,
								).toLocaleString()}`}
							/>
						)}
						{userId && <AnalyticsHistorySelector userId={userId} />}
						<Box sx={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
							<Button
								startIcon={<Export size={14} variant="Bulk" />}
								onClick={() => (hasExportReports ? setExportModalOpen(true) : setLimitModalOpen(true))}
								sx={{
									textTransform: "none",
									fontWeight: 600,
									letterSpacing: "-0.005em",
									color: BRAND_BLUE,
									borderRadius: 1.25,
									px: 1.5,
									py: 0.625,
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
									bgcolor: "transparent",
									whiteSpace: "nowrap",
									"&:hover": {
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
										borderColor: alpha(BRAND_BLUE, isDark ? 0.36 : 0.26),
									},
								}}
							>
								Exportar reporte
							</Button>
							{!hasExportReports && (
								<Box
									sx={{
										position: "absolute",
										top: -7,
										right: -10,
										px: 0.625,
										py: 0.125,
										borderRadius: 0.625,
										bgcolor: STALE_AMBER,
										color: "#fff",
										fontSize: "0.56rem",
										fontWeight: 700,
										letterSpacing: "0.06em",
										textTransform: "uppercase",
										lineHeight: 1.4,
										boxShadow: `0 2px 6px ${alpha(STALE_AMBER, 0.4)}`,
										pointerEvents: "none",
									}}
								>
									Premium
								</Box>
							)}
						</Box>
						<Tooltip title="Ver guía">
							<IconButton onClick={() => setGuideOpen(true)} sx={brandIconBtnSx}>
								<InfoCircle size={16} variant="Bulk" />
							</IconButton>
						</Tooltip>
					</Stack>
				}
			>
				{/* Alerta de plan limitado — patrón brand atmosférico STALE_AMBER */}
				{(!hasAdvancedAnalytics || !hasExportReports) && (
					<Box
						sx={{
							mb: 3,
							p: 1.75,
							borderRadius: 1.5,
							bgcolor: alpha(STALE_AMBER, isDark ? 0.1 : 0.06),
							border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
							display: "flex",
							alignItems: "center",
							gap: 1.5,
							flexWrap: "wrap",
						}}
					>
						<Box
							sx={{
								width: 32,
								height: 32,
								borderRadius: 1,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(STALE_AMBER, isDark ? 0.2 : 0.12),
								border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.36 : 0.26)}`,
								color: STALE_AMBER,
								flexShrink: 0,
							}}
						>
							<Lock size={16} variant="Bulk" />
						</Box>
						<Typography sx={{ flex: 1, fontSize: "0.85rem", color: "text.primary", letterSpacing: "-0.005em", minWidth: 240 }}>
							{!hasAdvancedAnalytics && !hasExportReports
								? "Las analíticas avanzadas y la exportación de reportes están limitadas a planes superiores."
								: !hasAdvancedAnalytics
								? "Las analíticas avanzadas están limitadas a planes superiores."
								: "La exportación de reportes está limitada a planes superiores."}
						</Typography>
						<Button
							size="small"
							onClick={() => navigate("/suscripciones/tables")}
							sx={{
								textTransform: "none",
								fontWeight: 600,
								letterSpacing: "-0.005em",
								color: STALE_AMBER,
								borderRadius: 1,
								px: 1.25,
								py: 0.5,
								border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.36 : 0.26)}`,
								whiteSpace: "nowrap",
								"&:hover": {
									bgcolor: alpha(STALE_AMBER, isDark ? 0.18 : 0.12),
									borderColor: alpha(STALE_AMBER, isDark ? 0.5 : 0.4),
								},
							}}
						>
							Actualizar plan
						</Button>
					</Box>
				)}

				{/* Contenedor de widgets con degradado de preview para plan free */}
				<Box sx={{ position: "relative" }}>
					{/* Banner sticky — brand atmospheric para plan free */}
					{!hasAdvancedAnalytics && (
						<Box
							sx={{
								position: "sticky",
								top: theme.spacing(2),
								zIndex: 2,
								display: "flex",
								justifyContent: "center",
								mb: 2,
								pointerEvents: "auto",
							}}
						>
							<Box
								sx={{
									position: "relative",
									overflow: "hidden",
									px: { xs: 2, sm: 2.5 },
									py: 1.75,
									textAlign: "center",
									maxWidth: { xs: "100%", sm: 560 },
									width: "100%",
									borderRadius: 2,
									bgcolor: theme.palette.background.paper,
									border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
									boxShadow: `0 12px 32px ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.16)}`,
								}}
							>
								<Box
									sx={{
										position: "absolute",
										top: -60,
										right: -40,
										width: 200,
										height: 200,
										borderRadius: "50%",
										background: `radial-gradient(circle, ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.12)} 0%, transparent 70%)`,
										pointerEvents: "none",
									}}
								/>
								<Stack
									direction={{ xs: "column", sm: "row" }}
									alignItems="center"
									justifyContent="center"
									spacing={1.5}
									sx={{ position: "relative" }}
								>
									<Box
										sx={{
											width: 36,
											height: 36,
											borderRadius: 1,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
											border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
											color: BRAND_BLUE,
											flexShrink: 0,
										}}
									>
										<Crown size={18} variant="Bulk" />
									</Box>
									<Stack spacing={0.125} sx={{ textAlign: { xs: "center", sm: "left" }, flex: 1 }}>
										<Stack direction="row" spacing={0.5} alignItems="center" justifyContent={{ xs: "center", sm: "flex-start" }}>
											<Box sx={{ width: 3, height: 3, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
											<Typography
												sx={{
													fontSize: "0.6rem",
													fontWeight: 600,
													letterSpacing: "0.08em",
													textTransform: "uppercase",
													color: "text.secondary",
												}}
											>
												Vista previa
											</Typography>
										</Stack>
										<Typography sx={{ fontSize: "0.92rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
											Desbloqueá las analíticas completas
										</Typography>
										<Typography sx={{ fontSize: "0.76rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
											Actualizá tu plan para acceder a métricas, exportaciones e históricos.
										</Typography>
									</Stack>
									<Button
										size="small"
										variant="contained"
										startIcon={<Crown size={14} variant="Bulk" />}
										onClick={() => navigate("/suscripciones/tables")}
										sx={{
											textTransform: "none",
											fontWeight: 600,
											letterSpacing: "-0.005em",
											bgcolor: BRAND_BLUE,
											color: "#fff",
											borderRadius: 1.25,
											px: 1.75,
											py: 0.875,
											whiteSpace: "nowrap",
											flexShrink: 0,
											boxShadow: "none",
											"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
										}}
									>
										Ver planes
									</Button>
								</Stack>
							</Box>
						</Box>
					)}

					{/* Grid de widgets — opacity reducida + sin interacción en plan free */}
					<Box sx={!hasAdvancedAnalytics ? { opacity: 0.4, pointerEvents: "none", userSelect: "none" } : undefined}>
						<Grid container spacing={3}>
							{/* Row 1 - Key Metrics */}
							<Grid item xs={12} md={6} lg={3}>
								<AverageResolutionTime />
							</Grid>
							<Grid item xs={12} md={6} lg={3}>
								<DataQuality />
							</Grid>
							<Grid item xs={12} md={6} lg={3}>
								<TaskCompletionRate />
							</Grid>
							<Grid item xs={12} md={6} lg={3}>
								<TaskDistributionByPriority />
							</Grid>

							{/* Row 2 - Calculator and Financial */}
							<Grid item xs={12} md={6} lg={3}>
								<CalculatorTypeBreakdown />
							</Grid>
							<Grid item xs={12} lg={5}>
								<AmountsByFolderStatus />
							</Grid>
							<Grid item xs={12} lg={4}>
								<NotificationStatus />
							</Grid>

							{/* Row 3 - Trends and Activity */}
							<Grid item xs={12} lg={8}>
								<DailyWeeklyActivity />
							</Grid>
							<Grid item xs={12} lg={4}>
								<RecentActivityFeed />
							</Grid>

							{/* Row 4 - Matters and Folders */}
							<Grid item xs={12} lg={6}>
								<TopMatters />
							</Grid>
							<Grid item xs={12} lg={6}>
								<FoldersByMatter />
							</Grid>

							{/* Row 5 - Projections and Trends */}
							<Grid item xs={12} lg={6}>
								<DeadlineProjections />
							</Grid>
							<Grid item xs={12} lg={6}>
								<FolderClosingTrends />
							</Grid>

							{/* Row 6 - Historical Trends */}
							<Grid item xs={12}>
								<HistoricalTrends />
							</Grid>
						</Grid>
					</Box>
				</Box>
			</MainCard>

			{/* Modal de error de límite del plan */}
			<LimitErrorModal
				open={limitModalOpen}
				onClose={handleCloseLimitModal}
				message="Para acceder a las analíticas avanzadas y exportación de reportes, necesitas actualizar tu plan."
				featureInfo={featureInfo || createFeatureInfo()}
				upgradeRequired={true}
			/>

			{/* Modal de exportación de reporte */}
			<ExportReportModal open={exportModalOpen} onClose={() => setExportModalOpen(false)} />

			{/* Modal de guía */}
			<GuideAnalytics open={guideOpen} onClose={() => setGuideOpen(false)} />
		</Box>
	);
};

export default DashboardAnalytics;

import React from "react";
import { useEffect, useState } from "react";
import { useDispatch, useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";

// mui
import { Grid, Box, Alert, Button, useTheme, Tooltip, Paper, Stack, Typography, Skeleton, Chip } from "@mui/material";

// icons
import { Lock, Export, Crown, InfoCircle, Clock } from "iconsax-react";

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

	return (
		<Box>
			<MainCard
				title={
					<Box sx={{ display: "flex", alignItems: "center", gap: 2 }}>
						<Typography variant="h3">Panel de Analíticas</Typography>
						{selectedHistoryId && (
							<Chip
								label="Viendo histórico"
								size="small"
								color="info"
								variant="filled"
								onDelete={() => dispatch(setSelectedHistory(null))}
							/>
						)}
					</Box>
				}
				secondary={
					<Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
						{cacheInfo && (
							<Tooltip
								title={`Última actualización: ${new Date(cacheInfo.generatedAt).toLocaleString()}. Próxima actualización: ${new Date(
									cacheInfo.nextUpdate,
								).toLocaleString()}`}
							>
								<Chip
									icon={<Clock size={14} />}
									label={`Actualizado hace ${Math.round(cacheInfo.hoursAgo)} ${Math.round(cacheInfo.hoursAgo) === 1 ? "hora" : "horas"}`}
									size="small"
									variant="outlined"
									color={cacheInfo.hoursAgo > 24 ? "warning" : "default"}
								/>
							</Tooltip>
						)}
						{userId && <AnalyticsHistorySelector userId={userId} />}
						<Box sx={{ position: "relative", display: "inline-flex", alignItems: "center" }}>
							<Button
								variant="outlined"
								startIcon={<Export size={16} />}
								onClick={() => (hasExportReports ? setExportModalOpen(true) : setLimitModalOpen(true))}
							>
								Exportar Reporte
							</Button>
							{!hasExportReports && (
								<Chip
									label="Premium"
									size="small"
									color="primary"
									sx={{
										position: "absolute",
										top: -8,
										right: -8,
										height: 16,
										fontSize: "0.6rem",
										pointerEvents: "none",
									}}
								/>
							)}
						</Box>
						<Tooltip title="Ver Guía">
							<IconButton color="success" onClick={() => setGuideOpen(true)}>
								<InfoCircle variant="Bulk" />
							</IconButton>
						</Tooltip>
					</Box>
				}
			>
				{(!hasAdvancedAnalytics || !hasExportReports) && (
					<Alert
						severity="warning"
						icon={<Lock variant="Bulk" size={24} color={theme.palette.warning.main} />}
						sx={{ mb: 3 }}
						action={
							<Button color="warning" size="small" onClick={() => navigate("/suscripciones/tables")}>
								Actualizar Plan
							</Button>
						}
					>
						{!hasAdvancedAnalytics && !hasExportReports
							? "Las analíticas avanzadas y la exportación de reportes están limitadas a planes superiores."
							: !hasAdvancedAnalytics
							? "Las analíticas avanzadas están limitadas a planes superiores."
							: "La exportación de reportes está limitada a planes superiores."}
					</Alert>
				)}

				{/* Contenedor de widgets con degradado de preview para plan free */}
				<Box sx={{ position: "relative" }}>
					{/* Banner de upgrade sticky — visible solo en plan free, encima del grid degradado */}
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
							<Paper
								elevation={6}
								sx={{
									px: 3,
									py: 2,
									textAlign: "center",
									maxWidth: { xs: "100%", sm: 520 },
									width: "100%",
									backgroundColor: "background.paper",
									border: `1px solid ${theme.palette.primary.light}`,
								}}
							>
								<Stack direction={{ xs: "column", sm: "row" }} alignItems="center" justifyContent="center" spacing={2}>
									<Stack spacing={0.25} sx={{ textAlign: { xs: "center", sm: "left" } }}>
										<Typography variant="subtitle1" fontWeight={600}>
											Vista previa
										</Typography>
										<Typography variant="body2" color="text.secondary">
											Actualizá tu plan para desbloquear analytics completas
										</Typography>
									</Stack>
									<Button
										variant="contained"
										color="primary"
										size="small"
										startIcon={<Crown size={16} />}
										onClick={() => navigate("/suscripciones/tables")}
										sx={{ whiteSpace: "nowrap", flexShrink: 0 }}
									>
										Ver planes
									</Button>
								</Stack>
							</Paper>
						</Box>
					)}

					{/* Grid de widgets — opacity reducida + sin interacción en plan free */}
					<Box
						sx={
							!hasAdvancedAnalytics
								? { opacity: 0.4, pointerEvents: "none", userSelect: "none" }
								: undefined
						}
					>
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

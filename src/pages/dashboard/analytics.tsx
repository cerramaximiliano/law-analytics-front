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
import { AppDispatch, RootState } from "store";
import { getUnifiedStats } from "store/reducers/unifiedStats";
import useAuth from "hooks/useAuth";
import useSubscription from "hooks/useSubscription";
import { LimitErrorModal } from "sections/auth/LimitErrorModal";
import ExportReportModal from "sections/dashboard/analytics/ExportReportModal";

// widgets
import AverageResolutionTime from "sections/widget/analytics/AverageResolutionTime";
import TaskCompletionRate from "sections/widget/analytics/TaskCompletionRate";
import TaskDistributionByPriority from "sections/widget/analytics/TaskDistributionByPriority";
import CalculatorTypeBreakdown from "sections/widget/analytics/CalculatorTypeBreakdown";
import AmountsByFolderStatus from "sections/widget/analytics/AmountsByFolderStatus";
import DailyWeeklyActivity from "sections/widget/analytics/DailyWeeklyActivity";
import RecentActivityFeed from "sections/widget/analytics/RecentActivityFeed";
import TopMatters from "sections/widget/analytics/TopMatters";
import FoldersByMatter from "sections/widget/analytics/FoldersByMatter";
import NotificationStatus from "sections/widget/analytics/NotificationStatus";
import DeadlineProjections from "sections/widget/analytics/DeadlineProjections";
import FolderClosingTrends from "sections/widget/analytics/FolderClosingTrends";

// ==============================|| DASHBOARD - ANALYTICS ||============================== //

const DashboardAnalytics = () => {
	const dispatch = useDispatch<AppDispatch>();
	const navigate = useNavigate();
	const theme = useTheme();
	const { user } = useAuth();
	const subscriptionData = useSubscription();
	const subscription = subscriptionData?.subscription;
	const hasFeatureLocal = subscriptionData?.hasFeatureLocal || (() => false);

	// Obtener el estado de las estadísticas
	const {
		data: statsData,
		isLoading: statsLoading,
		error: statsError,
		descriptions,
		cacheInfo
	} = useSelector((state: RootState) => state.unifiedStats);

	// Estados para el control del modal
	const [hasAdvancedAnalytics, setHasAdvancedAnalytics] = useState(false);
	const [hasExportReports, setHasExportReports] = useState(false);
	const [featureInfo, setFeatureInfo] = useState<any>(null);
	const [limitModalOpen, setLimitModalOpen] = useState(false);
	const [hasModalBeenClosed, setHasModalBeenClosed] = useState(false);
	const [exportModalOpen, setExportModalOpen] = useState(false);

	// Función para crear el objeto featureInfo
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
		// Verificar si tiene las características usando el hook
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
	}, [subscription, hasModalBeenClosed]);

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

	useEffect(() => {
		console.log("📊 [Analytics] useEffect triggered:", {
			hasUser: !!user,
			userId: user?.id,
			userName: user?.name,
			statsLoading,
			hasData: !!statsData,
			hasTriedToLoad
		});

		if (user?.id && !hasTriedToLoad) {
			console.log("📊 [Analytics] Fetching stats for user:", user.id);
			// Fetch all sections for analytics
			dispatch(getUnifiedStats(user.id, "all", false));
			setHasTriedToLoad(true);
		} else if (!user?.id) {
			console.log("⚠️ [Analytics] No user ID available yet");
		}
	}, [dispatch, user?.id, hasTriedToLoad]);

	// Mostrar skeleton mientras se carga el usuario o los datos
	if (!user || statsLoading) {
		return (
			<Box>
				<MainCard title="Panel de Analíticas">
					<Grid container spacing={3}>
						{[...Array(12)].map((_, index) => (
							<Grid item xs={12} md={6} lg={index < 4 ? 3 : index < 6 ? 8 : 6} key={index}>
								<Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1 }} />
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
				title="Panel de Analíticas"
				secondary={
					<Box sx={{ display: "flex", gap: 2, alignItems: "center" }}>
						{cacheInfo && (
							<Tooltip title={`Última actualización: ${new Date(cacheInfo.generatedAt).toLocaleString()}. Próxima actualización: ${new Date(cacheInfo.nextUpdate).toLocaleString()}`}>
								<Chip
									icon={<Clock size={14} />}
									label={`Actualizado hace ${Math.round(cacheInfo.hoursAgo)} ${Math.round(cacheInfo.hoursAgo) === 1 ? 'hora' : 'horas'}`}
									size="small"
									variant="outlined"
									color={cacheInfo.hoursAgo > 24 ? "warning" : "default"}
								/>
							</Tooltip>
						)}
						{hasExportReports ? (
							<Button variant="outlined" startIcon={<Export size={16} />} onClick={() => setExportModalOpen(true)}>
								Exportar Reporte
							</Button>
						) : (
							<Tooltip title="Función disponible en planes superiores">
								<Button variant="outlined" startIcon={<Lock size={16} />} onClick={() => navigate("/suscripciones/tables")} disabled>
									Exportar Reporte
								</Button>
							</Tooltip>
						)}
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

				{/* Contenedor con overlay cuando no tiene permisos */}
				<Box sx={{ position: "relative" }}>
					<Grid container spacing={3}>
						{/* Row 1 - Key Metrics */}
						<Grid item xs={12} md={6} lg={3}>
							<AverageResolutionTime />
						</Grid>
						<Grid item xs={12} md={6} lg={3}>
							<TaskCompletionRate />
						</Grid>
						<Grid item xs={12} md={6} lg={3}>
							<TaskDistributionByPriority />
						</Grid>
						<Grid item xs={12} md={6} lg={3}>
							<CalculatorTypeBreakdown />
						</Grid>

						{/* Row 2 - Financial and Activity */}
						<Grid item xs={12} lg={8}>
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
					</Grid>

					{/* Overlay de bloqueo cuando no tiene permisos */}
					{!hasAdvancedAnalytics && (
						<Box
							sx={{
								position: "absolute",
								top: 0,
								left: 0,
								right: 0,
								bottom: 0,
								backgroundColor: theme.palette.mode === "dark" ? "rgba(0, 0, 0, 0.7)" : "rgba(255, 255, 255, 0.7)",
								backdropFilter: "blur(3px)",
								zIndex: 1,
								display: "flex",
								alignItems: "flex-start",
								justifyContent: "center",
								borderRadius: 1,
								pt: 8,
							}}
						>
							<Paper
								elevation={3}
								sx={{
									p: 3,
									textAlign: "center",
									maxWidth: 450,
									backgroundColor: "background.paper",
								}}
							>
								<Stack direction="row" alignItems="center" justifyContent="center" spacing={2} sx={{ mb: 2 }}>
									<Lock variant="Bulk" size={48} color={theme.palette.primary.main} />
									<Typography variant="h5">Contenido Bloqueado</Typography>
								</Stack>
								<Typography variant="body2" color="text.secondary" sx={{ mb: 2 }}>
									Las analíticas avanzadas están disponibles en planes Standard y Premium.
								</Typography>
								<Grid container spacing={1} sx={{ mb: 2, textAlign: "left" }}>
									<Grid item xs={6}>
										<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
											<Crown size={14} color={theme.palette.primary.main} />
											<Typography variant="caption">Métricas detalladas</Typography>
										</Box>
									</Grid>
									<Grid item xs={6}>
										<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
											<Crown size={14} color={theme.palette.primary.main} />
											<Typography variant="caption">Análisis de tendencias</Typography>
										</Box>
									</Grid>
									<Grid item xs={6}>
										<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
											<Crown size={14} color={theme.palette.primary.main} />
											<Typography variant="caption">Exportar reportes</Typography>
										</Box>
									</Grid>
									<Grid item xs={6}>
										<Box sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
											<Crown size={14} color={theme.palette.primary.main} />
											<Typography variant="caption">Dashboards personalizados</Typography>
										</Box>
									</Grid>
								</Grid>
								<Button
									variant="contained"
									color="primary"
									size="medium"
									startIcon={<Crown size={18} />}
									onClick={() => navigate("/suscripciones/tables")}
									fullWidth
								>
									Actualizar Plan
								</Button>
							</Paper>
						</Box>
					)}
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
			<ExportReportModal
				open={exportModalOpen}
				onClose={() => setExportModalOpen(false)}
			/>
		</Box>
	);
};

export default DashboardAnalytics;

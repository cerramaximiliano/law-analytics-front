import React from "react";
// material-ui
import { useState, useEffect, useMemo, useCallback, useRef } from "react";
import { useTheme } from "@mui/material/styles";
import { Grid, Stack, Typography, Snackbar, Alert, Skeleton, Fade, CircularProgress, Box } from "@mui/material";

// project-imports
import EcommerceDataCard from "components/cards/statistics/WidgetDataCard";
import BarsDataWidget from "sections/widget/chart/BarsDataWidget";
import ErrorStateCard from "components/ErrorStateCard";
import OnboardingCard from "components/cards/OnboardingCard";
import OnboardingEducationalBlock from "components/cards/OnboardingEducationalBlock";

import RepeatCustomerRate from "sections/widget/chart/FoldersDataRate";
import FinancialWidget from "sections/widget/chart/FinancialWidget";
import ActiveFoldersWidget from "sections/widget/chart/ActiveFoldersWidget";

import ProjectRelease from "sections/widget/chart/ProjectRelease";
import AssignUsers from "sections/widget/chart/TaskWidget";
import StorageWidget from "sections/widget/chart/StorageWidget";

// assets
import { Calendar, CloudChange, FolderAdd, Task, Moneys } from "iconsax-react";
import WelcomeBanner from "sections/dashboard/default/WelcomeBanner";
import { useSelector, dispatch } from "store";
import { getUnifiedStats } from "store/reducers/unifiedStats";
import { fetchUserStats } from "store/reducers/userStats";
import { DashboardStats } from "types/unified-stats";
import ApiService, { OnboardingStatus } from "store/reducers/ApiService";

// hooks
import { useNavigate } from "react-router-dom";

// Limite de sesiones para mostrar onboarding
const MAX_ONBOARDING_SESSIONS = 5;

// Key para sessionStorage (evitar multiples incrementos por sesion)
const ONBOARDING_SESSION_KEY = "onboarding_session_checked";

// ==============================|| DASHBOARD - DEFAULT ||============================== //

const DashboardDefault = () => {
	const theme = useTheme();
	const navigate = useNavigate();

	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string; severity: "error" | "success" }>({
		open: false,
		message: "",
		severity: "error",
	});

	// Estado de onboarding obtenido del backend
	const [onboardingStatus, setOnboardingStatus] = useState<OnboardingStatus | null>(null);
	const [onboardingLoading, setOnboardingLoading] = useState(true);
	const [isDismissing, setIsDismissing] = useState(false);

	// Ref para evitar doble fetch
	const onboardingFetched = useRef(false);

	const user = useSelector((state) => state.auth.user);
	const userId = user?._id;

	// Obtener datos del store unificado
	const { data: unifiedData, isLoading, error, lastUpdated, isInitialized } = useSelector((state) => state.unifiedStats);
	const dashboardData = unifiedData?.dashboard || null;

	// Cargar estado de onboarding del backend (solo 1 vez por sesion del navegador)
	useEffect(() => {
		const fetchOnboarding = async () => {
			if (!userId || onboardingFetched.current) return;

			// Marcar como fetched para evitar dobles llamadas
			onboardingFetched.current = true;

			try {
				setOnboardingLoading(true);

				// Verificar si ya se llamo en esta sesion del navegador
				const sessionChecked = sessionStorage.getItem(`${ONBOARDING_SESSION_KEY}_${userId}`);

				if (sessionChecked) {
					// Ya se llamo en esta sesion, usar datos cacheados
					const cachedData = sessionStorage.getItem(`onboarding_data_${userId}`);
					if (cachedData) {
						setOnboardingStatus(JSON.parse(cachedData));
						setOnboardingLoading(false);
						return;
					}
				}

				// Primera vez en esta sesion, llamar al backend (esto incrementa el contador)
				const response = await ApiService.getOnboardingStatus();
				if (response.success && response.onboarding) {
					setOnboardingStatus(response.onboarding);
					// Guardar en sessionStorage para evitar multiples llamadas
					sessionStorage.setItem(`${ONBOARDING_SESSION_KEY}_${userId}`, "true");
					sessionStorage.setItem(`onboarding_data_${userId}`, JSON.stringify(response.onboarding));
				}
			} catch (err) {
				console.error("Error al obtener estado de onboarding:", err);
			} finally {
				setOnboardingLoading(false);
			}
		};

		fetchOnboarding();
	}, [userId]);

	// Determinar si mostrar onboarding
	const showOnboarding = useMemo(() => {
		// Si el usuario tiene el onboarding completado o descartado, no mostrar
		if (onboardingStatus?.onboardingComplete || onboardingStatus?.dismissed) {
			return false;
		}

		// Si no hay datos del dashboard aun, no podemos determinar
		if (!dashboardData) {
			return false;
		}

		// Limite de sesiones: si ya se mostro mas de MAX_ONBOARDING_SESSIONS veces, no mostrar
		if (onboardingStatus?.onboardingSessionsCount && onboardingStatus.onboardingSessionsCount > MAX_ONBOARDING_SESSIONS) {
			return false;
		}

		// Mostrar onboarding si no tiene carpetas activas
		const totalCarpetas = (dashboardData?.folders?.active || 0) + (dashboardData?.folders?.closed || 0);
		return totalCarpetas === 0;
	}, [onboardingStatus, dashboardData]);

	// Estado combinado de carga (ambos deben estar listos)
	const isFullyLoading = isLoading || onboardingLoading;

	// Nombre del usuario para el banner
	const userName = user?.firstName || user?.name?.split(" ")[0] || "";

	// Funcion para descartar el onboarding
	const handleDismissOnboarding = useCallback(async () => {
		try {
			setIsDismissing(true);
			const response = await ApiService.dismissOnboarding();
			if (response.success && response.onboarding) {
				// Actualizar estado local
				setOnboardingStatus(response.onboarding);
				// Actualizar cache en sessionStorage
				if (userId) {
					sessionStorage.setItem(`onboarding_data_${userId}`, JSON.stringify(response.onboarding));
				}
				setSnackbar({
					open: true,
					message: "No volveras a ver esta guia de inicio",
					severity: "success",
				});
			}
		} catch (err) {
			console.error("Error al descartar onboarding:", err);
			setSnackbar({
				open: true,
				message: "Error al actualizar preferencias",
				severity: "error",
			});
		} finally {
			setIsDismissing(false);
		}
	}, [userId]);

	// Cargar datos del dashboard usando el store unificado
	useEffect(() => {
		if (userId && !isInitialized) {
			dispatch(getUnifiedStats(userId, "dashboard,folders"));
		}
	}, [userId, isInitialized]);

	// Cargar datos de userStats para el widget de almacenamiento
	useEffect(() => {
		if (userId) {
			dispatch(fetchUserStats());
		}
	}, [userId]);

	// Manejar errores
	useEffect(() => {
		if (error) {
			setSnackbar({ open: true, message: error, severity: "error" });
		}
	}, [error]);

	// Funcion para cerrar el snackbar
	const handleCloseSnackbar = () => {
		setSnackbar((prev) => ({ ...prev, open: false }));
	};

	const calculateTrend = (dataKey: keyof DashboardStats["trends"]) => {
		// Verificar si dashboardData existe
		const trendData = dashboardData?.trends?.[dataKey];

		// Check if trendData is an array with at least 2 items
		if (!dashboardData || !dashboardData.trends || !trendData || !Array.isArray(trendData) || trendData.length < 2) {
			return { direction: "up", percentage: 0 };
		}

		const currentMonth = trendData[0].count;
		const previousMonth = trendData[1].count;

		if (previousMonth === 0) return { direction: "up", percentage: 100 };

		// Calcular el porcentaje de cambio como numero
		const changePercentageValue = ((currentMonth - previousMonth) / previousMonth) * 100;
		// Formatear para mostrar
		const changePercentageFormatted = changePercentageValue.toFixed(1);

		// Determinar la direccion usando el valor numerico
		const direction = changePercentageValue >= 0 ? "up" : "down";

		return {
			direction,
			percentage: Math.abs(parseFloat(changePercentageFormatted)),
		};
	};

	// Solo calcular tendencias si hay datos
	const foldersTrend = dashboardData ? calculateTrend("newFolders") : { direction: "up", percentage: 0 };

	// Funcion para reintentar la carga
	const handleRetry = () => {
		if (userId) {
			dispatch(getUnifiedStats(userId, "dashboard", true));
		}
	};

	// Handlers para las acciones de onboarding (con flag para tour/guia posterior)
	const handleCreateFolder = () => navigate("/apps/folders/list?onboarding=true");
	const handleCreateTask = () => navigate("/tareas?onboarding=true");
	const handleViewDeadlines = () => navigate("/apps/calendar?onboarding=true");

	// Renderizar skeleton loader para las tarjetas
	const renderSkeletonCards = () => (
		<>
			{[1, 2, 3, 4].map((item) => (
				<Grid item xs={12} sm={6} lg={3} key={item}>
					<Skeleton variant="rectangular" height={180} sx={{ borderRadius: 1.5 }} />
				</Grid>
			))}
			<Grid item xs={12} md={8} lg={9}>
				<Stack spacing={3}>
					<Skeleton variant="rectangular" height={300} sx={{ borderRadius: 1.5 }} />
				</Stack>
			</Grid>
			<Grid item xs={12} md={4} lg={3}>
				<Stack spacing={3}>
					<Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1.5 }} />
					<Skeleton variant="rectangular" height={200} sx={{ borderRadius: 1.5 }} />
				</Stack>
			</Grid>
		</>
	);

	// Determinar tipo de error para el componente ErrorStateCard
	const getErrorType = () => {
		if (error?.includes("sesion") || error?.includes("autorizado")) return "permission";
		if (error?.includes("conectar") || error?.includes("conexion")) return "connection";
		if (error?.includes("404") || error?.includes("encontrado")) return "notFound";
		return "general";
	};

	// Renderizar contenido de onboarding (cards superiores)
	// Jerarquia: Carpetas = foco principal, Tareas/Vencimientos = secundarios
	const renderOnboardingCards = () => (
		<>
			{/* Card informativa - sin CTA, solo explica */}
			<Grid item xs={12} sm={6} lg={3}>
				<OnboardingCard
					title="Monto Activo"
					description="Visualiza el valor total de tus expedientes activos. Se calcula automaticamente desde tus carpetas."
					icon={<Moneys size={24} />}
					color="warning"
					variant="informative"
					muted
				/>
			</Grid>

			{/* Card PRINCIPAL - El foco del onboarding */}
			<Grid item xs={12} sm={6} lg={3}>
				<OnboardingCard
					title="Carpetas Activas"
					description="Las carpetas representan tus expedientes. Organiza causas, clientes y documentos en un solo lugar."
					actionLabel="Crear mi primera carpeta"
					onAction={handleCreateFolder}
					icon={<FolderAdd size={24} />}
					color="primary"
					variant="primary"
				/>
			</Grid>

			{/* Cards secundarias - menos prominentes */}
			<Grid item xs={12} sm={6} lg={3}>
				<OnboardingCard
					title="Tareas Pendientes"
					description="Gestiona tus tareas para no olvidar plazos importantes. Las tareas se vinculan a tus carpetas."
					actionLabel="Ver tareas"
					onAction={handleCreateTask}
					icon={<Task size={24} />}
					color="success"
					variant="secondary"
					muted
				/>
			</Grid>

			<Grid item xs={12} sm={6} lg={3}>
				<OnboardingCard
					title="Vencimientos"
					description="Configura alertas para vencimientos judiciales. Recibe notificaciones antes de cada fecha limite."
					actionLabel="Ver vencimientos"
					onAction={handleViewDeadlines}
					icon={<CloudChange size={24} />}
					color="error"
					variant="secondary"
					muted
				/>
			</Grid>
		</>
	);

	// Renderizar el dashboard
	return (
		<>
			<Grid container rowSpacing={4.5} columnSpacing={2.75}>
				{/* Banner siempre visible (con skeleton si esta cargando) */}
				<Grid item xs={12}>
					{isFullyLoading ? (
						<Skeleton variant="rectangular" height={180} sx={{ borderRadius: 1.5 }} />
					) : (
						<Fade in={!isFullyLoading} timeout={300}>
							<div>
								<WelcomeBanner
									showOnboarding={showOnboarding}
									userName={userName}
									onDismiss={handleDismissOnboarding}
									sessionCount={onboardingStatus?.onboardingSessionsCount || 0}
									maxSessions={MAX_ONBOARDING_SESSIONS}
								/>
							</div>
						</Fade>
					)}
					{lastUpdated && !isFullyLoading && !error && !showOnboarding && (
						<Typography
							variant="caption"
							sx={{
								display: "flex",
								justifyContent: "flex-end",
								mt: 1,
								color: "text.secondary",
								fontStyle: "italic",
							}}
						>
							Ultima actualizacion:{" "}
							{new Date(lastUpdated).toLocaleString("es-AR", {
								day: "2-digit",
								month: "2-digit",
								year: "numeric",
								hour: "2-digit",
								minute: "2-digit",
							})}
						</Typography>
					)}
				</Grid>

				{/* Overlay de loading cuando se esta descartando */}
				{isDismissing && (
					<Grid item xs={12}>
						<Box
							sx={{
								display: "flex",
								justifyContent: "center",
								alignItems: "center",
								py: 4,
							}}
						>
							<CircularProgress size={32} />
							<Typography variant="body2" color="text.secondary" sx={{ ml: 2 }}>
								Actualizando preferencias...
							</Typography>
						</Box>
					</Grid>
				)}

				{/* Contenido del dashboard - skeleton mientras carga */}
				{isFullyLoading && !isDismissing && renderSkeletonCards()}

				{/* Mostrar error si existe */}
				{error && !isFullyLoading && !isDismissing && (
					<Grid item xs={12}>
						<ErrorStateCard
							type={getErrorType()}
							onRetry={handleRetry}
							title={
								error.includes("sesion")
									? "Sesion expirada"
									: error.includes("permisos")
									? "Acceso restringido"
									: error.includes("conectar")
									? "Sin conexion al servidor"
									: undefined
							}
						/>
					</Grid>
				)}

				{/* Mostrar contenido de onboarding para usuarios nuevos */}
				{!isFullyLoading && !error && dashboardData && showOnboarding && !isDismissing && (
					<Fade in timeout={400}>
						<Grid container item spacing={2.75}>
							{/* Cards superiores con estados educativos */}
							{renderOnboardingCards()}

							{/* Bloque educativo en lugar del grafico */}
							<Grid item xs={12} md={6} lg={6}>
								<OnboardingEducationalBlock />
							</Grid>

							{/* Widgets laterales con estado vacio mejorado */}
							<Grid item xs={12} md={6} lg={3}>
								<Stack spacing={3}>
									<StorageWidget />
									<AssignUsers />
								</Stack>
							</Grid>
							<Grid item xs={12} md={6} lg={3}>
								<ProjectRelease />
							</Grid>
						</Grid>
					</Fade>
				)}

				{/* Mostrar datos normales si estan disponibles y no es onboarding */}
				{!isFullyLoading && !error && dashboardData && !showOnboarding && !isDismissing && (
					<Fade in timeout={400}>
						<Grid container item spacing={2.75}>
							{/* row 1 - Mostrar estadisticas clave del dashboard */}
							<Grid item xs={12} sm={6} lg={3}>
								<FinancialWidget foldersTrend={foldersTrend} />
							</Grid>

							<Grid item xs={12} sm={6} lg={3}>
								<ActiveFoldersWidget />
							</Grid>

							<Grid item xs={12} sm={6} lg={3}>
								<EcommerceDataCard
									title="Tareas Pendientes"
									count={(dashboardData?.tasks?.pending || 0).toString()}
									color="success"
									iconPrimary={<Calendar color={theme.palette.success.darker} />}
									percentage={
										<Typography color="success.darker" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
											<Typography variant="caption">
												{dashboardData?.tasks?.completed || 0} completadas - {dashboardData?.tasks?.overdue || 0} vencidas
											</Typography>
										</Typography>
									}
								>
									<BarsDataWidget
										color={theme.palette.success.darker}
										data={dashboardData?.trends?.tasks?.map((item) => item.count) || undefined}
									/>
								</EcommerceDataCard>
							</Grid>

							<Grid item xs={12} sm={6} lg={3}>
								<EcommerceDataCard
									title="Vencimientos Proximos"
									count={(dashboardData?.deadlines?.nextWeek || 0).toString()}
									color="error"
									iconPrimary={<CloudChange color={theme.palette.error.dark} />}
									percentage={
										<Typography color="error.dark" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
											<Typography variant="caption">En los proximos 7 dias</Typography>
										</Typography>
									}
								>
									<BarsDataWidget
										color={theme.palette.error.dark}
										data={dashboardData?.trends?.deadlines?.map((item) => item.count) || undefined}
									/>
								</EcommerceDataCard>
							</Grid>

							{/* row 2 */}
							<Grid item xs={12} md={6} lg={6}>
								<RepeatCustomerRate />
							</Grid>
							<Grid item xs={12} md={6} lg={3}>
								<Stack spacing={3}>
									<StorageWidget />
									<AssignUsers />
								</Stack>
							</Grid>
							<Grid item xs={12} md={6} lg={3}>
								<ProjectRelease />
							</Grid>
						</Grid>
					</Fade>
				)}
			</Grid>

			{/* Agregar Snackbar para mostrar mensajes */}
			<Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
				<Alert onClose={handleCloseSnackbar} severity={snackbar.severity} sx={{ width: "100%" }}>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</>
	);
};

export default DashboardDefault;

// material-ui
import { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { Grid, Stack, Typography, Snackbar, Alert, Skeleton } from "@mui/material";

// project-imports
import EcommerceDataCard from "components/cards/statistics/WidgetDataCard";
import BarsDataWidget from "sections/widget/chart/BarsDataWidget";
import ErrorStateCard from "components/ErrorStateCard";

import RepeatCustomerRate from "sections/widget/chart/FoldersDataRate";
import FinancialWidget from "sections/widget/chart/FinancialWidget";
import ActiveFoldersWidget from "sections/widget/chart/ActiveFoldersWidget";

import ProjectOverview from "sections/widget/chart/ProjectOverview";
import ProjectRelease from "sections/widget/chart/ProjectRelease";
import AssignUsers from "sections/widget/chart/TaskWidget";

// assets
import { Calendar, CloudChange } from "iconsax-react";
import WelcomeBanner from "sections/dashboard/default/WelcomeBanner";
import { useSelector, dispatch } from "store";
import { getUnifiedStats } from "store/reducers/unifiedStats";
import { DashboardStats } from "types/unified-stats";

// ==============================|| DASHBOARD - DEFAULT ||============================== //

const DashboardDefault = () => {
	const theme = useTheme();

	const [snackbar, setSnackbar] = useState<{ open: boolean; message: string }>({
		open: false,
		message: "",
	});

	const user = useSelector((state) => state.auth.user);
	const userId = user?._id;

	// Obtener datos del store unificado
	const { data: unifiedData, isLoading, error, lastUpdated, isInitialized } = useSelector((state) => state.unifiedStats);
	const dashboardData = unifiedData?.dashboard || null;

	// Cargar datos del dashboard usando el store unificado
	useEffect(() => {
		if (userId && !isInitialized) {
			dispatch(getUnifiedStats(userId, "dashboard,folders"));
		}
	}, [userId, isInitialized]);

	// Manejar errores
	useEffect(() => {
		if (error) {
			setSnackbar({ open: true, message: error });
		}
	}, [error]);

	// Función para cerrar el snackbar
	const handleCloseSnackbar = () => {
		setSnackbar({ open: false, message: "" });
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

		// Calcular el porcentaje de cambio como número
		const changePercentageValue = ((currentMonth - previousMonth) / previousMonth) * 100;
		// Formatear para mostrar
		const changePercentageFormatted = changePercentageValue.toFixed(1);

		// Determinar la dirección usando el valor numérico
		const direction = changePercentageValue >= 0 ? "up" : "down";

		return {
			direction,
			percentage: Math.abs(parseFloat(changePercentageFormatted)),
		};
	};

	// Solo calcular tendencias si hay datos
	const foldersTrend = dashboardData ? calculateTrend("newFolders") : { direction: "up", percentage: 0 };

	//const movementsTrend = dashboardData ? calculateTrend("movements") : { direction: "up", percentage: 0 };

	// Función para reintentar la carga
	const handleRetry = () => {
		if (userId) {
			dispatch(getUnifiedStats(userId, "dashboard", true));
		}
	};

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
		if (error?.includes("sesión") || error?.includes("autorizado")) return "permission";
		if (error?.includes("conectar") || error?.includes("conexión")) return "connection";
		if (error?.includes("404") || error?.includes("encontrado")) return "notFound";
		return "general";
	};

	// Renderizar el dashboard - siempre mostrar el banner
	return (
		<>
			<Grid container rowSpacing={4.5} columnSpacing={2.75}>
				{/* Banner siempre visible */}
				<Grid item xs={12}>
					<WelcomeBanner />
					{lastUpdated && !isLoading && !error && (
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
							Última actualización:{" "}
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

				{/* Contenido del dashboard */}
				{isLoading && renderSkeletonCards()}

				{/* Mostrar error si existe */}
				{error && !isLoading && (
					<Grid item xs={12}>
						<ErrorStateCard
							type={getErrorType()}
							onRetry={handleRetry}
							title={
								error.includes("sesión")
									? "Sesión expirada"
									: error.includes("permisos")
									? "Acceso restringido"
									: error.includes("conectar")
									? "Sin conexión al servidor"
									: undefined
							}
						/>
					</Grid>
				)}

				{/* Mostrar datos si están disponibles */}
				{!isLoading && !error && dashboardData && (
					<>
						{/* row 1 - Mostrar estadísticas clave del dashboard */}
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
											{dashboardData?.tasks?.completed || 0} completadas • {dashboardData?.tasks?.overdue || 0} vencidas
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
								title="Vencimientos Próximos"
								count={(dashboardData?.deadlines?.nextWeek || 0).toString()}
								color="error"
								iconPrimary={<CloudChange color={theme.palette.error.dark} />}
								percentage={
									<Typography color="error.dark" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
										<Typography variant="caption">En los próximos 7 días</Typography>
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
						<Grid item xs={12} md={8} lg={9}>
							<Grid container spacing={3}>
								<Grid item xs={12}>
									<RepeatCustomerRate />
								</Grid>
								<Grid item xs={12}>
									<ProjectOverview />
								</Grid>
							</Grid>
						</Grid>
						<Grid item xs={12} md={4} lg={3}>
							<Stack spacing={3}>
								<ProjectRelease />
								<AssignUsers />
							</Stack>
						</Grid>

						{/* row 3 */}
						{/* 			<Grid item xs={12} md={6}>
					<Transactions />
				</Grid>
				<Grid item xs={12} md={6}>
					<TotalIncome />
				</Grid> */}
					</>
				)}
			</Grid>

			{/* Agregar Snackbar para mostrar mensajes de error */}
			<Snackbar open={snackbar.open} autoHideDuration={6000} onClose={handleCloseSnackbar}>
				<Alert onClose={handleCloseSnackbar} severity="error" sx={{ width: "100%" }}>
					{snackbar.message}
				</Alert>
			</Snackbar>
		</>
	);
};

export default DashboardDefault;

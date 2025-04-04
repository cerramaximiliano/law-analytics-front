// material-ui
import { useState, useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { CircularProgress, Grid, Stack, Typography } from "@mui/material";

// project-imports
import EcommerceDataCard from "components/cards/statistics/WidgetDataCard";
import BarsDataWidget from "sections/widget/chart/BarsDataWidget";

import RepeatCustomerRate from "sections/widget/chart/FoldersDataRate";

import ProjectOverview from "sections/widget/chart/ProjectOverview";
import ProjectRelease from "sections/widget/chart/ProjectRelease";
import AssignUsers from "sections/widget/chart/TaskWidget";

// assets
import { ArrowDown, ArrowUp, Book, Calendar, CloudChange, Wallet3 } from "iconsax-react";
import WelcomeBanner from "sections/dashboard/default/WelcomeBanner";
import { useSelector } from "store";

import StatsService from "store/reducers/ApiService";

interface TrendItem {
	month: string;
	count: number;
}

interface DashboardData {
	financialStats: {
		totalActiveAmount: number;
	};
	folderStats: {
		active: number;
		distribution?: {
			nueva: number;
			enProceso: number;
			pendiente: number;
		};
	};
	taskMetrics: {
		pendingTasks: number;
		completionRate: number;
	};
	upcomingDeadlines: number;
	trends: {
		[key: string]: TrendItem[];
	};
	lastUpdated?: string;
}

// ==============================|| DASHBOARD - DEFAULT ||============================== //

const DashboardDefault = () => {
	const theme = useTheme();

	const [loading, setLoading] = useState<boolean>(true);
	const [dashboardData, setDashboardData] = useState<DashboardData | null>(null);
	const [error, setError] = useState<string | null>(null);

	const user = useSelector((state) => state.auth.user);
	const userId = user?._id;

	// Cargar datos del dashboard
	useEffect(() => {
		const fetchDashboardData = async () => {
			try {
				setLoading(true);
				setError(null);

				// Usar directamente StatsService en lugar de hacer una llamada fetch adicional
				const summaryData = await StatsService.getDashboardSummary(userId);
				console.log("SUMMARY", summaryData);

				// Asignar datos directamente
				setDashboardData(summaryData);
			} catch (err) {
				console.error("Error loading dashboard data:", err);
				setError("No se pudieron cargar los datos del dashboard");
			} finally {
				setLoading(false);
			}
		};

		fetchDashboardData();
	}, [userId]);

	const calculateTrend = (dataKey: string) => {
		// Verificar si dashboardData existe
		if (!dashboardData || !dashboardData.trends || !dashboardData.trends[dataKey] || dashboardData.trends[dataKey].length < 2) {
			return { direction: "up", percentage: 0 };
		}

		const currentMonth = dashboardData.trends[dataKey][0].count;
		const previousMonth = dashboardData.trends[dataKey][1].count;

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

	// Mostrar indicador de carga
	if (loading) {
		return (
			<Grid container justifyContent="center" alignItems="center" sx={{ minHeight: 400 }}>
				<CircularProgress />
			</Grid>
		);
	}

	// Mostrar mensaje de error
	if (error) {
		return (
			<Grid container justifyContent="center" alignItems="center" sx={{ minHeight: 400 }}>
				<Typography color="error" variant="h5">
					{error}
				</Typography>
			</Grid>
		);
	}

	// Si no hay datos, mostrar mensaje
	if (!dashboardData) {
		return (
			<Grid container justifyContent="center" alignItems="center" sx={{ minHeight: 400 }}>
				<Typography variant="h5">No hay datos disponibles</Typography>
			</Grid>
		);
	}

	// Renderizar el dashboard con los datos
	return (
		<Grid container rowSpacing={4.5} columnSpacing={2.75}>
			<Grid item xs={12}>
				<WelcomeBanner />
				{dashboardData.lastUpdated && (
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
						{new Date(dashboardData.lastUpdated).toLocaleString("es-AR", {
							day: "2-digit",
							month: "2-digit",
							year: "numeric",
							hour: "2-digit",
							minute: "2-digit",
						})}
					</Typography>
				)}
			</Grid>

			{/* row 1 - Mostrar estadísticas clave del dashboard */}
			<Grid item xs={12} sm={6} lg={3}>
				<EcommerceDataCard
					title="Monto Activo"
					count={new Intl.NumberFormat("es-AR", {
						style: "currency",
						currency: "ARS",
						maximumFractionDigits: 0,
					}).format(dashboardData.financialStats.totalActiveAmount)}
					iconPrimary={<Wallet3 />}
					percentage={
						<Typography
							color={foldersTrend.direction === "up" ? "primary" : "error.dark"}
							sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
						>
							{foldersTrend.direction === "up" ? (
								<ArrowUp size={16} style={{ transform: "rotate(45deg)" }} />
							) : (
								<ArrowDown size={16} style={{ transform: "rotate(-45deg)" }} />
							)}
							{foldersTrend.percentage}%
						</Typography>
					}
				>
					<BarsDataWidget color={theme.palette.primary.main} data={dashboardData.trends.financialAmounts?.map((item) => item.count)} />
				</EcommerceDataCard>
			</Grid>

			<Grid item xs={12} sm={6} lg={3}>
				<EcommerceDataCard
					title="Carpetas Activas"
					count={dashboardData.folderStats.active.toString()}
					color="warning"
					iconPrimary={<Book color={theme.palette.warning.dark} />}
					percentage={
						<Typography
							color={foldersTrend.direction === "up" ? "warning.dark" : "error.dark"}
							sx={{ display: "flex", alignItems: "center", gap: 0.5 }}
						>
							{foldersTrend.direction === "up" ? (
								<ArrowUp size={16} style={{ transform: "rotate(45deg)" }} />
							) : (
								<ArrowDown size={16} style={{ transform: "rotate(-45deg)" }} />
							)}
							{foldersTrend.percentage}%
						</Typography>
					}
				>
					<BarsDataWidget
						color={theme.palette.warning.dark}
						height={50}
						data={
							dashboardData.folderStats.distribution
								? [
										dashboardData.folderStats.distribution.nueva,
										dashboardData.folderStats.distribution.enProceso,
										dashboardData.folderStats.distribution.pendiente,
								  ]
								: undefined
						}
						labels={["Nueva", "En Proceso", "Pendiente"]}
						noDataMessage="No hay carpetas disponibles"
					/>
				</EcommerceDataCard>
			</Grid>

			<Grid item xs={12} sm={6} lg={3}>
				<EcommerceDataCard
					title="Tareas Pendientes"
					count={dashboardData.taskMetrics.pendingTasks.toString()}
					color="success"
					iconPrimary={<Calendar color={theme.palette.success.darker} />}
					percentage={
						<Typography color="success.darker" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<Typography variant="caption">{dashboardData.taskMetrics.completionRate}% completado</Typography>
						</Typography>
					}
				>
					<BarsDataWidget color={theme.palette.success.darker} data={dashboardData.trends.tasks?.map((item) => item.count) || undefined} />
				</EcommerceDataCard>
			</Grid>

			<Grid item xs={12} sm={6} lg={3}>
				<EcommerceDataCard
					title="Vencimientos Próximos"
					count={dashboardData.upcomingDeadlines.toString()}
					color="error"
					iconPrimary={<CloudChange color={theme.palette.error.dark} />}
					percentage={
						<Typography color="error.dark" sx={{ display: "flex", alignItems: "center", gap: 0.5 }}>
							<Typography variant="caption">En los próximos 7 días</Typography>
						</Typography>
					}
				>
					<BarsDataWidget color={theme.palette.error.dark} data={dashboardData.trends.deadlines?.map((item) => item.count) || undefined} />
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
		</Grid>
	);
};

export default DashboardDefault;

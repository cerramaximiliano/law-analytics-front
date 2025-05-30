import { useEffect } from "react";
import { useTheme } from "@mui/material/styles";
import { Box, CardContent, CircularProgress, Grid, LinearProgress, Stack, Typography, Alert } from "@mui/material";
import MainCard from "components/MainCard";
import { useSelector, dispatch } from "store";
import { getUnifiedStats } from "store/reducers/unifiedStats";
import { Calendar, Timer1 } from "iconsax-react";

const ProjectRelease = () => {
	const theme = useTheme();

	// Obtener userId del usuario actual
	const user = useSelector((state) => state.auth.user);
	const userId = user?._id;

	// Obtener datos del store unificado
	const { data: unifiedData, isLoading, isInitialized } = useSelector((state) => state.unifiedStats);
	const upcomingDeadlines = unifiedData?.folders?.upcomingDeadlines;

	// Mapear los datos al formato esperado
	const deadlinesData = upcomingDeadlines
		? {
				next7Days: upcomingDeadlines["7_days"] || 0,
				next15Days: upcomingDeadlines["15_days"] || 0,
				next30Days: upcomingDeadlines["30_days"] || 0,
		  }
		: null;

	// Cargar datos si no existen
	useEffect(() => {
		if (userId && !isInitialized && !unifiedData?.folders) {
			dispatch(getUnifiedStats(userId, "folders"));
		}
	}, [userId, isInitialized, unifiedData]);

	// Estado de carga
	if (isLoading && !deadlinesData) {
		return (
			<MainCard>
				<CardContent>
					<Stack spacing={2}>
						<Stack spacing={0.75}>
							<Typography variant="h5">Próximos Vencimientos</Typography>
							<Typography variant="caption" color="secondary">
								Cargando información...
							</Typography>
						</Stack>
						<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
							<CircularProgress size={24} />
						</Box>
					</Stack>
				</CardContent>
			</MainCard>
		);
	}

	// Estado sin datos, pero con contexto y estructura
	if (!deadlinesData) {
		return (
			<MainCard>
				<CardContent>
					<Stack spacing={2}>
						<Stack spacing={0.75}>
							<Typography variant="h5">Próximos Vencimientos</Typography>
							<Typography variant="caption" color="secondary">
								No hay vencimientos programados
							</Typography>
						</Stack>

						<Box
							sx={{
								display: "flex",
								flexDirection: "column",
								alignItems: "center",
								justifyContent: "center",
								py: 3,
								gap: 2,
							}}
						>
							<Calendar size={32} variant="Bulk" color={theme.palette.text.secondary} />
							<Typography variant="body2" color="text.secondary" align="center">
								No hay carpetas con fechas de vencimiento en los próximos 30 días.
							</Typography>
							<Alert severity="info" sx={{ width: "100%", mt: 1 }}>
								Las fechas de vencimiento se mostrarán aquí cuando se agreguen a las carpetas.
							</Alert>
						</Box>
					</Stack>
				</CardContent>
			</MainCard>
		);
	}

	// Calcular el total y los porcentajes
	const total = deadlinesData.next30Days || 1; // Prevenir división por cero
	const next7DaysPercentage = Math.round((deadlinesData.next7Days / total) * 100);
	const next15DaysPercentage = Math.round((deadlinesData.next15Days / total) * 100);

	// Estado con datos
	return (
		<MainCard>
			<CardContent>
				<Grid container spacing={3}>
					<Grid item xs={12}>
						<Stack spacing={0.75}>
							<Typography variant="h5">Próximos Vencimientos</Typography>
							<Typography variant="caption" color="secondary">
								En los próximos 30 días
							</Typography>
						</Stack>
					</Grid>
					<Grid item xs={12}>
						<LinearProgress
							variant="determinate"
							value={next7DaysPercentage}
							color="error"
							sx={{
								height: 8,
								borderRadius: 2,
								"& .MuiLinearProgress-bar": {
									borderRadius: 2,
								},
							}}
						/>
					</Grid>
					<Grid item xs={12}>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Stack direction="row" spacing={1} alignItems="center">
								<Timer1 size={16} variant="Bold" color={theme.palette.error.main} />
								<Typography variant="caption" color="error">
									Próximos 7 días
								</Typography>
							</Stack>
							<Typography variant="h6" color="error">
								{deadlinesData.next7Days}
							</Typography>
						</Stack>
					</Grid>
					<Grid item xs={12}>
						<LinearProgress
							variant="determinate"
							value={next15DaysPercentage}
							color="warning"
							sx={{
								height: 8,
								borderRadius: 2,
								"& .MuiLinearProgress-bar": {
									borderRadius: 2,
								},
							}}
						/>
					</Grid>
					<Grid item xs={12}>
						<Stack direction="row" justifyContent="space-between" alignItems="center">
							<Stack direction="row" spacing={1} alignItems="center">
								<Timer1 size={16} variant="Bold" color={theme.palette.warning.dark} />
								<Typography variant="caption" color="warning.dark">
									Próximos 15 días
								</Typography>
							</Stack>
							<Typography variant="h6" color="warning.dark">
								{deadlinesData.next15Days}
							</Typography>
						</Stack>
					</Grid>
					<Grid item xs={12}>
						<Stack direction="row" spacing={1} alignItems="center">
							<Typography variant="caption" color="primary">
								Total próximos 30 días:
							</Typography>
							<Typography variant="h6">{deadlinesData.next30Days}</Typography>
						</Stack>
					</Grid>
				</Grid>
			</CardContent>
		</MainCard>
	);
};

export default ProjectRelease;

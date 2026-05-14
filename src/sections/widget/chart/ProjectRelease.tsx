import React from "react";
import { useEffect } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Box, CircularProgress, LinearProgress, Stack, Typography } from "@mui/material";
import MainCard from "components/MainCard";
import { useNavigate } from "react-router-dom";
import { useSelector, dispatch } from "store";
import { getUnifiedStats } from "store/reducers/unifiedStats";
import { CalendarRemove, Timer1 } from "iconsax-react";
import { BRAND_BLUE } from "themes/dashboardTokens";
import { ThemeMode } from "types/config";

const ProjectRelease = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === ThemeMode.DARK;
	const navigate = useNavigate();

	const user = useSelector((state) => state.auth.user);
	const userId = user?._id;

	// Card clickeable — navega al calendar donde se ven los vencimientos.
	const cardClickableSx = {
		cursor: "pointer",
		transition: "transform 0.2s ease, box-shadow 0.2s ease, border-color 0.2s ease",
		"&:hover": {
			transform: "translateY(-2px)",
			borderColor: alpha(BRAND_BLUE, isDark ? 0.32 : 0.22),
			boxShadow: `0 8px 22px ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
		},
	};
	const handleClickCard = () => navigate("/apps/calendar");

	const { data: unifiedData, isLoading, isInitialized } = useSelector((state) => state.unifiedStats);
	const upcomingDeadlines = unifiedData?.folders?.upcomingDeadlines;

	const deadlinesData = upcomingDeadlines
		? {
				next7Days: upcomingDeadlines.next7Days || 0,
				next15Days: upcomingDeadlines.next15Days || 0,
				next30Days: upcomingDeadlines.next30Days || 0,
		  }
		: null;

	useEffect(() => {
		if (userId && !isInitialized && !unifiedData?.folders) {
			dispatch(getUnifiedStats(userId, "folders"));
		}
	}, [userId, isInitialized, unifiedData]);

	// Header reusable — brand-tinted icon + título + caption.
	const renderHeader = (caption: React.ReactNode) => (
		<Stack direction="row" alignItems="center" spacing={1.5}>
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
				<CalendarRemove size={20} variant="Bulk" />
			</Box>
			<Stack spacing={0.25}>
				<Typography variant="subtitle1" sx={{ letterSpacing: "-0.005em" }}>
					Próximos vencimientos
				</Typography>
				{caption}
			</Stack>
		</Stack>
	);

	// Fila reusable — label + count + progress bar.
	const renderRow = (label: string, count: number, percentage: number, color: string) => (
		<Stack spacing={0.75}>
			<Stack direction="row" justifyContent="space-between" alignItems="center">
				<Stack direction="row" spacing={1} alignItems="center">
					<Timer1 size={14} variant="Bold" color={color} />
					<Typography variant="caption" sx={{ color, fontWeight: 600, letterSpacing: "-0.005em" }}>
						{label}
					</Typography>
				</Stack>
				<Typography
					sx={{
						fontSize: "1.05rem",
						fontWeight: 600,
						color,
						fontVariantNumeric: "tabular-nums",
						letterSpacing: "-0.01em",
					}}
				>
					{count}
				</Typography>
			</Stack>
			<LinearProgress
				variant="determinate"
				value={percentage}
				sx={{
					height: 6,
					borderRadius: 1,
					backgroundColor: alpha(theme.palette.text.primary, isDark ? 0.08 : 0.05),
					"& .MuiLinearProgress-bar": {
						borderRadius: 1,
						bgcolor: color,
					},
				}}
			/>
		</Stack>
	);

	// Loading
	if (isLoading && !deadlinesData) {
		return (
			<MainCard>
				<Stack spacing={2}>
					{renderHeader(
						<Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: "-0.005em" }}>
							Cargando…
						</Typography>,
					)}
					<Box sx={{ display: "flex", justifyContent: "center", py: 2 }}>
						<CircularProgress size={24} />
					</Box>
				</Stack>
			</MainCard>
		);
	}

	// Empty state — también clickeable para incentivar agregar vencimientos.
	if (!deadlinesData) {
		return (
			<MainCard onClick={handleClickCard} sx={cardClickableSx}>
				<Stack spacing={2}>
					{renderHeader(
						<Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: "-0.005em" }}>
							Sin vencimientos programados
						</Typography>,
					)}
					<Box
						sx={{
							display: "flex",
							flexDirection: "column",
							alignItems: "center",
							justifyContent: "center",
							py: 3,
							gap: 1.5,
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}`,
							borderRadius: 1.5,
						}}
					>
						<Typography
							variant="body2"
							sx={{ color: "text.secondary", letterSpacing: "-0.005em", textAlign: "center", textWrap: "balance", maxWidth: 280 }}
						>
							Las fechas de vencimiento se mostrarán acá cuando agregues alguna a tus carpetas.
						</Typography>
					</Box>
				</Stack>
			</MainCard>
		);
	}

	const total = deadlinesData.next30Days || 1;
	const next7DaysPercentage = Math.round((deadlinesData.next7Days / total) * 100);
	const next15DaysPercentage = Math.round((deadlinesData.next15Days / total) * 100);

	return (
		<MainCard onClick={handleClickCard} sx={cardClickableSx}>
			<Stack spacing={2.5}>
				{renderHeader(
					<Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: "-0.005em" }}>
						En los próximos 30 días
					</Typography>,
				)}

				<Stack spacing={2}>
					{renderRow("Próximos 7 días", deadlinesData.next7Days, next7DaysPercentage, theme.palette.error.main)}
					{renderRow("Próximos 15 días", deadlinesData.next15Days, next15DaysPercentage, theme.palette.warning.main)}
				</Stack>

				<Box
					sx={{
						pt: 1.5,
						borderTop: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.08 : 0.05)}`,
					}}
				>
					<Stack direction="row" justifyContent="space-between" alignItems="center">
						<Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: "-0.005em" }}>
							Total 30 días
						</Typography>
						<Typography
							sx={{
								fontSize: "1.05rem",
								fontWeight: 600,
								color: "text.primary",
								fontVariantNumeric: "tabular-nums",
								letterSpacing: "-0.01em",
							}}
						>
							{deadlinesData.next30Days}
						</Typography>
					</Stack>
				</Box>
			</Stack>
		</MainCard>
	);
};

export default ProjectRelease;

import { useState } from "react";
import { alpha, useTheme } from "@mui/material/styles";
import { Box, CircularProgress, Stack, Typography, Button, Divider, List, ListItem, ListItemText, ListItemIcon, Chip } from "@mui/material";
import MainCard from "components/MainCard";
import { useNavigate } from "react-router-dom";
import { ArrowRight, CalendarTick, DocumentText } from "iconsax-react";
import dayjs from "utils/dayjs-config";

import { useUpcomingDeadlines } from "hooks/useUpcomingDeadlines";
import { UpcomingMovementEvent } from "services/upcomingMovementsService";
import { BRAND_BLUE, navActiveBg } from "themes/dashboardTokens";
import { ThemeMode } from "types/config";

const PREVIEW = 5;

// Etiqueta + color por tipo de evento (vencimiento / audiencia).
const typeMeta = (type: string, theme: any): { label: string; color: string } => {
	switch (type) {
		case "vencimiento":
			return { label: "Vencimiento", color: theme.palette.error.main };
		case "audiencia":
			return { label: "Audiencia", color: BRAND_BLUE };
		default:
			return { label: type || "Evento", color: theme.palette.text.secondary };
	}
};

// Fecha relativa en español, corta ("hoy", "mañana", "en 3 días", "en 2 sem.").
const relativeLabel = (start: Date | string): string => {
	const d = dayjs(start).startOf("day");
	const today = dayjs().startOf("day");
	const days = d.diff(today, "day");
	if (days <= 0) return "hoy";
	if (days === 1) return "mañana";
	if (days < 14) return `en ${days} días`;
	const weeks = Math.round(days / 7);
	if (days < 60) return `en ${weeks} sem.`;
	return `en ${Math.round(days / 30)} meses`;
};

// Widget del dashboard: lista de los próximos vencimientos y audiencias
// agendados. Los datos vienen del hook unificado [[useUpcomingDeadlines]], que
// es la fuente de verdad en vivo compartida con la KPI card y la card de
// Vencimientos 7/15/30. Si el evento está vinculado a un movimiento judicial
// (movementRef), la fila hace deep-link al movimiento puntual (?movement= —
// abre la pestaña Actividad del folder y resalta la fila); si no, navega a la
// carpeta.
const UpcomingMovementEventsWidget = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === ThemeMode.DARK;
	const navigate = useNavigate();

	const { events, loading } = useUpcomingDeadlines();
	const [showAll, setShowAll] = useState<boolean>(false);

	const handleOpenMovement = (event: UpcomingMovementEvent) => {
		if (event.folderId && event.movementRef) {
			navigate(`/apps/folders/details/${event.folderId}?movement=${encodeURIComponent(event.movementRef)}`);
		} else if (event.folderId) {
			navigate(`/apps/folders/details/${event.folderId}`);
		}
	};

	const toShow = showAll ? events : events.slice(0, PREVIEW);

	const renderHeader = (subtitle: React.ReactNode) => (
		<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
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
					<CalendarTick size={20} variant="Bulk" />
				</Box>
				<Stack spacing={0.25}>
					<Typography variant="subtitle1" sx={{ letterSpacing: "-0.005em" }}>
						Próximos vencimientos
					</Typography>
					{subtitle}
				</Stack>
			</Stack>
			{events.length > 0 && (
				<Button
					endIcon={<ArrowRight size={14} />}
					onClick={() => navigate("/apps/calendar")}
					sx={{
						color: BRAND_BLUE,
						fontWeight: 600,
						fontSize: "0.8rem",
						textTransform: "none",
						letterSpacing: "-0.005em",
						"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.06) },
					}}
				>
					Calendario
				</Button>
			)}
		</Stack>
	);

	if (loading) {
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

	if (events.length === 0) {
		return (
			<MainCard>
				<Stack spacing={2}>
					{renderHeader(
						<Typography variant="caption" sx={{ color: "text.secondary", letterSpacing: "-0.005em" }}>
							Vencimientos y audiencias
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
						<Box
							sx={{
								width: 44,
								height: 44,
								borderRadius: "50%",
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.14),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.36 : 0.24)}`,
								color: BRAND_BLUE,
							}}
						>
							<CalendarTick size={24} variant="Bulk" />
						</Box>
						<Typography variant="body2" sx={{ color: "text.secondary", letterSpacing: "-0.005em", textAlign: "center", textWrap: "balance" }}>
							No tenés vencimientos ni audiencias próximos agendados.
						</Typography>
					</Box>
				</Stack>
			</MainCard>
		);
	}

	return (
		<MainCard>
			<Stack spacing={2}>
				{renderHeader(
					<Typography variant="caption" sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.005em" }}>
						{events.length} próximo{events.length === 1 ? "" : "s"}
					</Typography>,
				)}

				<Divider />

				<List disablePadding>
					{toShow.map((event) => {
						const meta = typeMeta(event.type, theme);
						return (
							<ListItem
								key={event._id}
								disablePadding
								sx={{
									py: 0.75,
									px: 1,
									mx: -1,
									borderRadius: 1,
									cursor: "pointer",
									transition: "background-color 0.15s ease-in-out",
									"&:hover": { bgcolor: navActiveBg(isDark) },
								}}
								onClick={() => handleOpenMovement(event)}
							>
								<ListItemIcon sx={{ minWidth: "32px" }}>
									<DocumentText size={18} variant="Bulk" color={meta.color} />
								</ListItemIcon>
								<ListItemText
									primary={
										<Stack direction="row" alignItems="center" spacing={0.75} sx={{ minWidth: 0 }}>
											<Typography
												variant="body2"
												color="text.primary"
												sx={{ fontWeight: 500, letterSpacing: "-0.005em", overflow: "hidden", textOverflow: "ellipsis", whiteSpace: "nowrap" }}
											>
												{event.title}
											</Typography>
											<Chip
												label={meta.label}
												size="small"
												sx={{
													height: 18,
													flexShrink: 0,
													bgcolor: alpha(meta.color, 0.12),
													color: meta.color,
													"& .MuiChip-label": { px: 0.75, fontSize: "0.62rem", fontWeight: 700 },
												}}
											/>
										</Stack>
									}
									secondary={
										<Typography variant="caption" sx={{ color: "text.secondary", fontVariantNumeric: "tabular-nums", letterSpacing: "-0.005em" }}>
											{dayjs(event.start).format("DD/MM/YYYY")} · {relativeLabel(event.start)}
											{event.folderName ? ` · ${event.folderName}` : ""}
										</Typography>
									}
								/>
							</ListItem>
						);
					})}
				</List>

				{!showAll && events.length > PREVIEW && (
					<Button
						fullWidth
						variant="text"
						onClick={() => setShowAll(true)}
						sx={{
							color: BRAND_BLUE,
							fontWeight: 600,
							fontSize: "0.85rem",
							textTransform: "none",
							letterSpacing: "-0.005em",
							"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.06) },
						}}
					>
						Ver {events.length - PREVIEW} más
					</Button>
				)}
			</Stack>
		</MainCard>
	);
};

export default UpcomingMovementEventsWidget;

import React, { useEffect, useState } from "react";
import {
	Button,
	Menu,
	MenuItem,
	ListItemText,
	ListItemIcon,
	Divider,
	Typography,
	CircularProgress,
	Box,
	Chip,
	Tooltip,
} from "@mui/material";
import { Clock, Calendar, ArrowDown2, Refresh } from "iconsax-react";
import { useDispatch, useSelector } from "react-redux";
import { AppDispatch, RootState } from "store";
import { getAnalyticsHistory, getHistoricalStats, getUnifiedStats, setSelectedHistory } from "store/reducers/unifiedStats";
import { AnalyticsHistoryItem } from "types/unified-stats";

interface AnalyticsHistorySelectorProps {
	userId: string;
}

const AnalyticsHistorySelector: React.FC<AnalyticsHistorySelectorProps> = ({ userId }) => {
	const dispatch = useDispatch<AppDispatch>();
	const { history, historyLoading, selectedHistoryId, isLoading } = useSelector((state: RootState) => state.unifiedStats);
	const [anchorEl, setAnchorEl] = useState<null | HTMLElement>(null);
	const open = Boolean(anchorEl);

	useEffect(() => {
		console.log("🔍 [HistorySelector] Component mounted/updated:", {
			userId,
			historyLength: history.length,
			historyLoading,
			selectedHistoryId
		});
		if (userId && history.length === 0 && !historyLoading) {
			console.log("📋 [HistorySelector] Fetching history for user:", userId);
			dispatch(getAnalyticsHistory(userId));
		}
	}, [dispatch, userId, history.length, historyLoading]);

	const handleClick = (event: React.MouseEvent<HTMLButtonElement>) => {
		console.log("🖱️ [HistorySelector] Button clicked, opening menu");
		setAnchorEl(event.currentTarget);
		if (history.length === 0 && !historyLoading) {
			console.log("📋 [HistorySelector] Fetching history on click");
			dispatch(getAnalyticsHistory(userId));
		}
	};

	const handleClose = () => {
		setAnchorEl(null);
	};

	const handleSelectHistory = (item: AnalyticsHistoryItem) => {
		if (item.isLatest) {
			// Si es el más reciente, limpiar la selección y cargar los datos actuales
			dispatch(setSelectedHistory(null));
			dispatch(getUnifiedStats(userId, "all", true));
		} else {
			// Si es histórico, usar la función para históricos
			dispatch(getHistoricalStats(userId, item.id));
		}
		handleClose();
	};

	const handleRefreshHistory = () => {
		dispatch(getAnalyticsHistory(userId));
	};

	const formatDate = (dateString: string) => {
		const date = new Date(dateString);
		return date.toLocaleDateString("es-AR", {
			day: "2-digit",
			month: "short",
			year: "numeric",
			hour: "2-digit",
			minute: "2-digit",
		});
	};

	const getAgeLabel = (days: number) => {
		if (days === 0) return "Hoy";
		if (days === 1) return "Ayer";
		if (days < 7) return `Hace ${days} días`;
		if (days < 30) return `Hace ${Math.floor(days / 7)} semanas`;
		if (days < 365) return `Hace ${Math.floor(days / 30)} meses`;
		return `Hace ${Math.floor(days / 365)} años`;
	};

	const selectedItem = history.find((item) => item.id === selectedHistoryId);

	console.log("🎨 [HistorySelector] Rendering component with:", {
		userId,
		historyCount: history.length,
		isLoading,
		selectedHistoryId,
		open
	});

	return (
		<>
			<Button
				variant="outlined"
				color="info"
				startIcon={isLoading ? <CircularProgress size={14} /> : <Clock size={16} />}
				endIcon={<ArrowDown2 size={14} />}
				onClick={handleClick}
				size="small"
				disabled={isLoading}
				sx={{
					borderColor: selectedHistoryId ? "info.main" : "info.light",
					backgroundColor: selectedHistoryId ? "info.lighter" : "transparent",
					"&:hover": {
						borderColor: "info.main",
						backgroundColor: "info.lighter",
					}
				}}
			>
				{isLoading ? "Cargando..." :
				 selectedHistoryId && selectedItem
					? getAgeLabel(selectedItem.ageInDays)
					: "Ver Histórico"}
			</Button>

			<Menu
				anchorEl={anchorEl}
				open={open}
				onClose={handleClose}
				PaperProps={{
					sx: {
						width: 320,
						maxHeight: 400,
					},
				}}
			>
				<Box sx={{ px: 2, py: 1.5 }}>
					<Box sx={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
						<Typography variant="subtitle2" color="text.secondary">
							Histórico de Analíticas
						</Typography>
						<Tooltip title="Actualizar lista">
							<Box
								component="button"
								onClick={handleRefreshHistory}
								sx={{
									border: "none",
									background: "transparent",
									cursor: "pointer",
									p: 0.5,
									display: "flex",
									alignItems: "center",
									color: "text.secondary",
									"&:hover": {
										color: "primary.main",
									},
								}}
							>
								<Refresh size={16} />
							</Box>
						</Tooltip>
					</Box>
				</Box>

				<Divider />

				{historyLoading ? (
					<Box sx={{ display: "flex", justifyContent: "center", py: 3 }}>
						<CircularProgress size={24} />
					</Box>
				) : history.length === 0 ? (
					<Box sx={{ py: 3, px: 2, textAlign: "center" }}>
						<Typography variant="body2" color="text.secondary">
							No hay histórico disponible
						</Typography>
					</Box>
				) : (
					history.map((item, index) => (
						<MenuItem
							key={item.id}
							onClick={() => handleSelectHistory(item)}
							selected={item.id === selectedHistoryId || (!selectedHistoryId && item.isLatest)}
							sx={{
								py: 1.5,
								px: 2,
							}}
						>
							<ListItemIcon>
								<Calendar size={20} color={item.isLatest ? "#52c41a" : "#8c8c8c"} />
							</ListItemIcon>
							<ListItemText
								primary={
									<Box sx={{ display: "flex", alignItems: "center", gap: 1 }}>
										<Typography variant="body2">{formatDate(item.createdAt)}</Typography>
										{item.isLatest && (
											<Chip label="Actual" size="small" color="success" sx={{ height: 20 }} />
										)}
									</Box>
								}
								secondary={
									<Typography variant="caption" color="text.secondary">
										{getAgeLabel(item.ageInDays)} • Actualizado: {formatDate(item.lastUpdated)}
									</Typography>
								}
							/>
						</MenuItem>
					))
				)}

				{history.length > 0 && (
					<>
						<Divider />
						<Box sx={{ p: 1.5 }}>
							<Typography variant="caption" color="text.secondary" sx={{ px: 1 }}>
								Mostrando los últimos {history.length} reportes
							</Typography>
						</Box>
					</>
				)}
			</Menu>
		</>
	);
};

export default AnalyticsHistorySelector;
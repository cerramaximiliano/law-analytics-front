import { useEffect } from "react";
import {
	Box,
	Button,
	Card,
	CardContent,
	Typography,
	Stack,
	Avatar,
	CircularProgress,
	Chip,
	IconButton,
	Tooltip,
	Divider,
} from "@mui/material";
import { Google, Refresh, Link21, Trash, TickCircle } from "iconsax-react";
import { useDispatch, useSelector } from "store";
import {
	initializeGoogleCalendar,
	connectGoogleCalendar,
	disconnectGoogleCalendar,
	syncWithGoogleCalendar,
	fetchGoogleEvents,
} from "store/reducers/googleCalendar";
import { Event } from "types/events";

interface GoogleCalendarSyncProps {
	localEvents: Event[];
	onEventsImported?: (events: any[]) => void;
}

const GoogleCalendarSync = ({ localEvents, onEventsImported }: GoogleCalendarSyncProps) => {
	const dispatch = useDispatch();
	const { isConnected, isLoading, isSyncing, userProfile, lastSyncTime, syncStats } = useSelector((state: any) => state.googleCalendar);

	useEffect(() => {
		// Initialize Google Calendar API on component mount
		dispatch(initializeGoogleCalendar());
	}, [dispatch]);

	const handleConnect = () => {
		dispatch(connectGoogleCalendar());
	};

	const handleDisconnect = () => {
		dispatch(disconnectGoogleCalendar());
	};

	const handleSync = async () => {
		const result = await dispatch(syncWithGoogleCalendar(localEvents));
		if (result && result.imported && result.imported.length > 0 && onEventsImported) {
			onEventsImported(result.imported);
		}
	};

	const handleFetchEvents = async () => {
		const events = await dispatch(fetchGoogleEvents());
		if (events && events.length > 0 && onEventsImported) {
			onEventsImported(events);
		}
	};

	if (isLoading) {
		return (
			<Card>
				<CardContent>
					<Stack direction="row" spacing={2} alignItems="center" justifyContent="center">
						<CircularProgress size={24} />
						<Typography variant="body2">Cargando Google Calendar...</Typography>
					</Stack>
				</CardContent>
			</Card>
		);
	}

	return (
		<Card sx={{ mb: 2 }}>
			<CardContent>
				<Stack spacing={2}>
					<Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
						<Stack direction="row" spacing={2} alignItems="center">
							<Google size={24} variant="Bold" />
							<Typography variant="h6">Google Calendar</Typography>
						</Stack>
						{isConnected && <Chip icon={<TickCircle size={16} />} label="Conectado" color="success" size="small" variant="outlined" />}
					</Stack>

					{!isConnected ? (
						<Stack spacing={2}>
							<Typography variant="body2" color="text.secondary">
								Conecta tu cuenta de Google para sincronizar eventos con Google Calendar
							</Typography>
							<Button variant="contained" startIcon={<Link21 />} onClick={handleConnect} disabled={isLoading} fullWidth>
								Conectar con Google Calendar
							</Button>
						</Stack>
					) : (
						<Stack spacing={2}>
							<Stack direction="row" spacing={2} alignItems="center">
								<Avatar src={userProfile?.imageUrl} sx={{ width: 40, height: 40 }}>
									{userProfile?.name?.charAt(0)}
								</Avatar>
								<Box flex={1}>
									<Typography variant="subtitle2">{userProfile?.name}</Typography>
									<Typography variant="caption" color="text.secondary">
										{userProfile?.email}
									</Typography>
								</Box>
								<Tooltip title="Desconectar">
									<IconButton size="small" onClick={handleDisconnect} color="error">
										<Trash size={20} />
									</IconButton>
								</Tooltip>
							</Stack>

							<Divider />

							<Stack direction="row" spacing={1}>
								<Button
									variant="outlined"
									startIcon={isSyncing ? <CircularProgress size={16} /> : <Refresh />}
									onClick={handleSync}
									disabled={isSyncing}
									fullWidth
								>
									{isSyncing ? "Sincronizando..." : "Sincronizar Eventos"}
								</Button>
								<Button variant="outlined" onClick={handleFetchEvents} disabled={isSyncing}>
									Importar
								</Button>
							</Stack>

							{lastSyncTime && (
								<Box>
									<Typography variant="caption" color="text.secondary">
										Última sincronización: {new Date(lastSyncTime).toLocaleString("es-ES")}
									</Typography>
									{syncStats && (
										<Typography variant="caption" display="block" color="text.secondary">
											{syncStats.created} creados, {syncStats.imported} importados, {syncStats.updated} actualizados
										</Typography>
									)}
								</Box>
							)}
						</Stack>
					)}
				</Stack>
			</CardContent>
		</Card>
	);
};

export default GoogleCalendarSync;

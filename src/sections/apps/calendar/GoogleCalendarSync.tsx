import React from "react";
import { useEffect, useState } from "react";
import { Box, Button, Typography, Stack, Avatar, CircularProgress, IconButton, Tooltip, Dialog, DialogContent } from "@mui/material";
import { Google, Refresh, Link21, CloseCircle } from "iconsax-react";
import { useDispatch, useSelector } from "store";
import {
	initializeGoogleCalendar,
	connectGoogleCalendar,
	disconnectGoogleCalendar,
	syncWithGoogleCalendar,
	fetchGoogleEvents,
} from "store/reducers/googleCalendar";
import { Event } from "types/events";
import { PopupTransition } from "components/@extended/Transitions";
import Avatar2 from "components/@extended/Avatar";

interface GoogleCalendarSyncProps {
	localEvents: Event[];
	onEventsImported?: (events: any[]) => void;
}

const GoogleCalendarSync = ({ localEvents, onEventsImported }: GoogleCalendarSyncProps) => {
	const dispatch = useDispatch();
	const { isConnected, isLoading, isSyncing, userProfile, lastSyncTime, syncStats } = useSelector((state: any) => state.googleCalendar);
	const [openDisconnectDialog, setOpenDisconnectDialog] = useState(false);

	useEffect(() => {
		// Initialize Google Calendar API on component mount
		dispatch(initializeGoogleCalendar());
	}, [dispatch]);

	useEffect(() => {
		// Cuando se conecta pero no hay perfil aún, intentar obtenerlo nuevamente
		if (isConnected && !userProfile && !isLoading) {
			// Pequeño delay para asegurar que Google haya actualizado todo
			const timer = setTimeout(() => {
				dispatch(initializeGoogleCalendar());
			}, 500);
			return () => clearTimeout(timer);
		}
	}, [isConnected, userProfile, isLoading, dispatch]);

	const handleConnect = async () => {
		try {
			const profile = await dispatch(connectGoogleCalendar());
			// Los eventos se importan automáticamente en connectGoogleCalendar
			// Si el perfil se obtuvo exitosamente, la importación ya se realizó
			if (profile) {
				console.log("Conexión exitosa, eventos importados automáticamente");
			}
		} catch (error) {
			// El error ya se maneja en el reducer
			console.error("Error al conectar:", error);
		}
	};

	const handleDisconnect = () => {
		setOpenDisconnectDialog(true);
	};

	const handleConfirmDisconnect = () => {
		dispatch(disconnectGoogleCalendar());
		setOpenDisconnectDialog(false);
	};

	const handleCancelDisconnect = () => {
		setOpenDisconnectDialog(false);
	};

	const handleSync = async () => {
		try {
			const result = await dispatch(syncWithGoogleCalendar(localEvents));
			if (result && result.imported && result.imported.length > 0 && onEventsImported) {
				await onEventsImported(result.imported);
			}
		} catch (error) {
			console.error("Error durante la sincronización:", error);
		}
	};

	const handleFetchEvents = async () => {
		try {
			const events = await dispatch(fetchGoogleEvents());
			if (events && events.length > 0 && onEventsImported) {
				await onEventsImported(events);
			}
		} catch (error) {
			console.error("Error al obtener eventos:", error);
		}
	};

	if (isLoading) {
		return (
			<Box sx={{ mb: 2, p: 1.5, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
				<Stack direction="row" spacing={1} alignItems="center" justifyContent="center">
					<CircularProgress size={20} />
					<Typography variant="caption">Cargando...</Typography>
				</Stack>
			</Box>
		);
	}

	return (
		<>
			<Box
				sx={{
					mb: 2,
					p: 1.5,
					border: "1px solid",
					borderColor: isConnected ? "success.main" : "divider",
					borderRadius: 1,
					bgcolor: isConnected ? "success.lighter" : "background.paper",
				}}
			>
				{!isConnected ? (
					<Stack direction="row" spacing={2} alignItems="center" justifyContent="space-between">
						<Stack direction="row" spacing={1.5} alignItems="center">
							<Google size={20} variant="Bold" color={isConnected ? "#4caf50" : "#666"} />
							<Typography variant="body2">Google Calendar</Typography>
						</Stack>
						<Button variant="contained" startIcon={<Link21 size={16} />} onClick={handleConnect} disabled={isLoading} size="small">
							Conectar
						</Button>
					</Stack>
				) : (
					<Stack spacing={1}>
						<Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
							<Stack direction="row" spacing={1.5} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
								<Avatar src={userProfile?.imageUrl} sx={{ width: 28, height: 28, fontSize: "0.875rem" }}>
									{userProfile?.name?.charAt(0)}
								</Avatar>
								<Box sx={{ minWidth: 0, flex: 1 }}>
									<Typography variant="body2" noWrap>
										{userProfile?.name}
									</Typography>
									<Typography variant="caption" color="text.secondary" noWrap>
										{userProfile?.email}
									</Typography>
								</Box>
							</Stack>

							<Stack direction="row" spacing={0.5}>
								<Tooltip title="Sincronizar eventos">
									<IconButton onClick={handleSync} disabled={isSyncing} size="small" color="primary">
										{isSyncing ? <CircularProgress size={18} /> : <Refresh size={18} />}
									</IconButton>
								</Tooltip>
								<Tooltip title="Importar de Google">
									<IconButton onClick={handleFetchEvents} disabled={isSyncing} size="small" color="primary">
										<Google size={18} />
									</IconButton>
								</Tooltip>
								<Tooltip title="Desvincular">
									<IconButton onClick={handleDisconnect} size="small" sx={{ color: "error.main" }}>
										<CloseCircle size={18} />
									</IconButton>
								</Tooltip>
							</Stack>
						</Stack>

						{lastSyncTime && (
							<Typography variant="caption" color="text.secondary" sx={{ pl: 5 }}>
								Sincronizado: {new Date(lastSyncTime).toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}
								{syncStats && syncStats.imported > 0 && ` • ${syncStats.imported} importados`}
							</Typography>
						)}
					</Stack>
				)}
			</Box>

			{/* Modal de confirmación para desvincular */}
			<Dialog
				open={openDisconnectDialog}
				onClose={handleCancelDisconnect}
				keepMounted
				TransitionComponent={PopupTransition}
				maxWidth="xs"
				aria-labelledby="disconnect-dialog-title"
				aria-describedby="disconnect-dialog-description"
			>
				<DialogContent sx={{ mt: 2, my: 1 }}>
					<Stack alignItems="center" spacing={3.5}>
						<Avatar2 color="error" sx={{ width: 72, height: 72, fontSize: "1.75rem" }}>
							<CloseCircle variant="Bold" />
						</Avatar2>
						<Stack spacing={2}>
							<Typography variant="h4" align="center">
								¿Estás seguro de desvincular Google Calendar?
							</Typography>
							<Typography align="center">
								Al desvincular tu cuenta de Google Calendar,
								<Typography variant="subtitle1" component="span" color="error">
									{" "}
									todos los eventos importados desde Google{" "}
								</Typography>
								serán eliminados del calendario local. Los eventos creados localmente se mantendrán.
							</Typography>
						</Stack>

						<Stack direction="row" spacing={2} sx={{ width: 1 }}>
							<Button fullWidth onClick={handleCancelDisconnect} color="secondary" variant="outlined">
								Cancelar
							</Button>
							<Button fullWidth color="error" variant="contained" onClick={handleConfirmDisconnect} autoFocus>
								Desvincular
							</Button>
						</Stack>
					</Stack>
				</DialogContent>
			</Dialog>
		</>
	);
};

export default GoogleCalendarSync;

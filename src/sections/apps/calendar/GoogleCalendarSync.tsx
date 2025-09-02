import React from "react";
import { useEffect, useState } from "react";
import {
	Box,
	Button,
	Typography,
	Stack,
	Avatar,
	CircularProgress,
	IconButton,
	Tooltip,
	Dialog,
	DialogContent,
	Skeleton,
} from "@mui/material";
import { Google, Refresh, Link21, CloseCircle } from "iconsax-react";
import { useDispatch, useSelector } from "store";
import {
	initializeGoogleCalendar,
	connectGoogleCalendar,
	disconnectGoogleCalendar,
	syncWithGoogleCalendar,
	fetchGoogleEvents,
} from "store/reducers/googleCalendar";
import { openSnackbar } from "store/reducers/snackbar";
import { Event } from "types/events";
import { PopupTransition } from "components/@extended/Transitions";
import Avatar2 from "components/@extended/Avatar";

interface GoogleCalendarSyncProps {
	localEvents: Event[];
	onEventsImported?: (events: any[]) => void;
}

const GoogleCalendarSync = ({ localEvents, onEventsImported }: GoogleCalendarSyncProps) => {
	const dispatch = useDispatch();
	const { isConnected, isLoading, isSyncing, userProfile, lastSyncTime } = useSelector((state: any) => state.googleCalendar);
	const [openDisconnectDialog, setOpenDisconnectDialog] = useState(false);
	const [imageError, setImageError] = useState(false);

	// Calcular si la sincronización está pendiente
	const isSyncPending = (() => {
		if (!isConnected || !lastSyncTime) return false;
		const lastSync = new Date(lastSyncTime);
		const now = new Date();
		const daysDiff = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24));
		return daysDiff >= 15;
	})();

	useEffect(() => {
		// Initialize Google Calendar API on component mount
		dispatch(initializeGoogleCalendar());
	}, [dispatch]);

	// Reset image error when profile changes
	useEffect(() => {
		setImageError(false);
	}, [userProfile?.imageUrl]);

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

	// Sincronización automática cada 15 días
	useEffect(() => {
		// Solo ejecutar si está conectado y no está cargando
		if (!isConnected || isLoading) {
			return;
		}

		// No ejecutar si ya está sincronizando
		if (isSyncing) {
			return;
		}

		const checkAutoSync = async () => {
			// Verificar si han pasado 15 días desde la última sincronización
			if (lastSyncTime) {
				const lastSync = new Date(lastSyncTime);
				const now = new Date();
				const daysDiff = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24));

				// Si han pasado 15 días o más, sincronizar automáticamente
				if (daysDiff >= 15) {
					console.log(`Han pasado ${daysDiff} días desde la última sincronización. Sincronizando automáticamente...`);

					// Mostrar notificación de sincronización automática
					dispatch(
						openSnackbar({
							open: true,
							message: `Sincronizando automáticamente con Google Calendar (${daysDiff} días desde última sincronización)...`,
							variant: "alert",
							alert: {
								color: "info",
							},
							close: false,
						}),
					);

					// Ejecutar sincronización
					handleSync();
				} else {
					console.log(
						`Han pasado ${daysDiff} días desde la última sincronización. Se sincronizará automáticamente en ${15 - daysDiff} días.`,
					);
				}
			} else {
				// Si está conectado pero nunca se ha sincronizado, sincronizar ahora
				console.log("Primera sincronización automática al cargar el calendario");

				dispatch(
					openSnackbar({
						open: true,
						message: "Realizando primera sincronización con Google Calendar...",
						variant: "alert",
						alert: {
							color: "info",
						},
						close: false,
					}),
				);

				handleSync();
			}
		};

		// Ejecutar verificación al montar el componente
		// Agregar un pequeño delay para evitar sincronizaciones múltiples al inicio
		const timer = setTimeout(() => {
			checkAutoSync();
		}, 1000);

		return () => clearTimeout(timer);
	}, [isConnected, lastSyncTime, isLoading, isSyncing]); // Incluimos isSyncing pero con validación previa

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
			<Box sx={{ p: 1, border: "1px solid", borderColor: "divider", borderRadius: 1 }}>
				<Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
					<Stack direction="row" spacing={1} alignItems="center">
						<Skeleton variant="circular" width={20} height={20} />
						<Box>
							<Skeleton variant="text" width={100} height={16} />
							<Skeleton variant="text" width={150} height={14} />
						</Box>
					</Stack>
					<Skeleton variant="rectangular" width={70} height={28} sx={{ borderRadius: 1 }} />
				</Stack>
			</Box>
		);
	}

	return (
		<>
			<Box
				sx={{
					p: 1,
					border: "1px solid",
					borderColor: isConnected ? (isSyncPending ? "warning.main" : "success.main") : "divider",
					borderRadius: 1,
					bgcolor: isConnected ? (isSyncPending ? "warning.lighter" : "success.lighter") : "background.paper",
				}}
			>
				{!isConnected ? (
					<Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
						<Stack direction="row" spacing={1} alignItems="center">
							{userProfile?.email ? (
								// Si hay perfil previo guardado, mostrar avatar
								<Avatar
									src={!imageError && userProfile?.imageUrl ? userProfile.imageUrl : undefined}
									sx={{
										width: 20,
										height: 20,
										fontSize: "0.7rem",
										bgcolor: "primary.lighter",
										color: "primary.main",
									}}
									imgProps={{
										referrerPolicy: "no-referrer",
										onError: () => setImageError(true),
									}}
								>
									{userProfile?.email?.charAt(0)?.toUpperCase()}
								</Avatar>
							) : (
								// Si no hay perfil previo, mostrar icono de Google
								<Google size={18} variant="Bold" color="#666" />
							)}
							<Box>
								<Typography variant="caption" sx={{ lineHeight: 1.2 }}>
									Google Calendar
								</Typography>
								{userProfile?.email && (
									<Typography variant="caption" color="text.secondary" sx={{ display: "block", fontSize: "0.7rem" }}>
										{userProfile.email}
									</Typography>
								)}
							</Box>
						</Stack>
						<Button
							variant="contained"
							startIcon={<Link21 size={14} />}
							onClick={handleConnect}
							disabled={isLoading}
							size="small"
							sx={{ minWidth: "auto", fontSize: "0.75rem", py: 0.5, px: 1 }}
						>
							{userProfile?.email ? "Reconectar" : "Conectar"}
						</Button>
					</Stack>
				) : (
					<Stack direction="row" spacing={1} alignItems="center" justifyContent="space-between">
						<Stack direction="row" spacing={1} alignItems="center" sx={{ flex: 1, minWidth: 0 }}>
							<Avatar
								src={!imageError && userProfile?.imageUrl ? userProfile.imageUrl : undefined}
								sx={{
									width: 24,
									height: 24,
									fontSize: "0.75rem",
									bgcolor: "success.lighter",
									color: "success.darker",
								}}
								imgProps={{
									referrerPolicy: "no-referrer",
									onError: () => setImageError(true),
								}}
							>
								{userProfile?.name?.charAt(0) || userProfile?.email?.charAt(0)?.toUpperCase()}
							</Avatar>
							<Box sx={{ minWidth: 0, flex: 1 }}>
								<Typography variant="caption" noWrap sx={{ display: "block", lineHeight: 1.2 }}>
									{userProfile?.name}
								</Typography>
								<Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: "0.7rem" }}>
									{userProfile?.email}
								</Typography>
								{lastSyncTime && (
									<Typography variant="caption" color="text.secondary" noWrap sx={{ fontSize: "0.65rem", display: "block" }}>
										Última sincronización:{" "}
										{(() => {
											const lastSync = new Date(lastSyncTime);
											const now = new Date();
											const daysDiff = Math.floor((now.getTime() - lastSync.getTime()) / (1000 * 60 * 60 * 24));

											if (daysDiff === 0) {
												return `Hoy ${lastSync.toLocaleTimeString("es-ES", { hour: "2-digit", minute: "2-digit" })}`;
											} else if (daysDiff === 1) {
												return "Ayer";
											} else if (daysDiff < 15) {
												return `Hace ${daysDiff} días`;
											} else {
												return `Hace ${daysDiff} días (sincronización pendiente)`;
											}
										})()}
									</Typography>
								)}
							</Box>
						</Stack>

						<Stack direction="row" spacing={0.5}>
							<Tooltip title="Sincronizar eventos">
								<IconButton onClick={handleSync} disabled={isSyncing} size="small" color="primary">
									{isSyncing ? <CircularProgress size={16} /> : <Refresh size={16} />}
								</IconButton>
							</Tooltip>
							<Tooltip title="Importar de Google">
								<IconButton onClick={handleFetchEvents} disabled={isSyncing} size="small" color="primary">
									<Google size={16} />
								</IconButton>
							</Tooltip>
							<Tooltip title="Desvincular">
								<IconButton onClick={handleDisconnect} size="small" sx={{ color: "error.main" }}>
									<CloseCircle size={16} />
								</IconButton>
							</Tooltip>
						</Stack>
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

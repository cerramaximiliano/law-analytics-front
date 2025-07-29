import { useState, useEffect, SyntheticEvent } from "react";

// material-ui
import {
	Button,
	List,
	ListItem,
	ListItemIcon,
	ListItemText,
	Stack,
	Switch,
	Typography,
	Box,
	CircularProgress,
	Alert,
	Snackbar,
	Accordion,
	AccordionSummary,
	AccordionDetails,
} from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import ApiService, { NotificationPreferences } from "store/reducers/ApiService";

// assets
import { Sms } from "iconsax-react";
// Import ArrowDown2 icon for accordion instead of ExpandMoreIcon
import { ArrowDown2 } from "iconsax-react";
import { openSnackbar } from "store/reducers/snackbar";
import { dispatch } from "store";

// ==============================|| USER PROFILE - SETTINGS ||============================== //
type SeverityType = "success" | "error" | "warning" | "info";

const TabSettings = () => {
	// Estado para la carga de datos
	const [loading, setLoading] = useState<boolean>(true);
	const [saving, setSaving] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	// Estado para notificaciones
	const [notification, setNotification] = useState<{
		open: boolean;
		message: string;
		severity: SeverityType;
	}>({
		open: false,
		message: "",
		severity: "success",
	});

	// Estado para los elementos principales
	const [checked, setChecked] = useState<string[]>([]);

	// Estado para las preferencias de notificaciones del servidor
	const [preferences, setPreferences] = useState<NotificationPreferences>({
		enabled: true,
		channels: {
			email: true,
			browser: true,
			mobile: false,
		},
		user: {
			enabled: true,
			calendar: true,
			expiration: true,
			inactivity: true,
		},
		system: {
			enabled: true,
			alerts: true,
			news: true,
			userActivity: true,
		},
	});

	// Estado para los paneles expandidos
	const [expanded, setExpanded] = useState<string | null>(null);

	// Usar esto para rastrear si los toggles principales están realmente activos
	// en lugar de depender solo de la verificación de los valores individuales
	const [channelsEnabled, setChannelsEnabled] = useState<boolean>(preferences.channels?.email || preferences.channels?.browser || false);
	const [userOptionsEnabled, setUserOptionsEnabled] = useState<boolean>(
		preferences.user.calendar || preferences.user.expiration || preferences.user.inactivity || false,
	);
	const [systemOptionsEnabled, setSystemOptionsEnabled] = useState<boolean>(
		preferences.system.alerts || preferences.system.news || preferences.system.userActivity || false,
	);

	useEffect(() => {
		// Actualizar los estados de habilitación basados en las preferencias actuales

		// Canales
		const isAnyChannelEnabled = preferences.channels?.email || preferences.channels?.browser || false;
		setChannelsEnabled(isAnyChannelEnabled);

		// Usuario
		const isAnyUserOptionEnabled = preferences.user.calendar || preferences.user.expiration || preferences.user.inactivity || false;
		setUserOptionsEnabled(isAnyUserOptionEnabled);

		// Sistema
		const isAnySystemOptionEnabled = preferences.system.alerts || preferences.system.news || preferences.system.userActivity || false;
		setSystemOptionsEnabled(isAnySystemOptionEnabled);

		// Actualizar el array de checked para reflejar los estados
		const newChecked = [...checked];

		// Canales
		if (isAnyChannelEnabled && newChecked.indexOf("chn") === -1) {
			newChecked.push("chn");
		} else if (!isAnyChannelEnabled && newChecked.indexOf("chn") !== -1) {
			const index = newChecked.indexOf("chn");
			if (index !== -1) newChecked.splice(index, 1);
		}

		// Usuario
		if (isAnyUserOptionEnabled && newChecked.indexOf("sen") === -1) {
			newChecked.push("sen");
		} else if (!isAnyUserOptionEnabled && newChecked.indexOf("sen") !== -1) {
			const index = newChecked.indexOf("sen");
			if (index !== -1) newChecked.splice(index, 1);
		}

		// Sistema
		if (isAnySystemOptionEnabled && newChecked.indexOf("usn") === -1) {
			newChecked.push("usn");
		} else if (!isAnySystemOptionEnabled && newChecked.indexOf("usn") !== -1) {
			const index = newChecked.indexOf("usn");
			if (index !== -1) newChecked.splice(index, 1);
		}

		// Solo actualizar si hay cambios para evitar bucles
		if (JSON.stringify(checked) !== JSON.stringify(newChecked)) {
			setChecked(newChecked);
		}
	}, [
		preferences.channels?.email,
		preferences.channels?.browser,
		preferences.user.calendar,
		preferences.user.expiration,
		preferences.user.inactivity,
		preferences.system.alerts,
		preferences.system.news,
		preferences.system.userActivity,
	]);

	const handleAccordionChange = (panel: string) => (event: SyntheticEvent, isExpanded: boolean) => {
		setExpanded(isExpanded ? panel : null);
	};

	// Cargar las preferencias del usuario al montar el componente
	useEffect(() => {
		const fetchPreferences = async () => {
			try {
				setLoading(true);
				const response = await ApiService.getNotificationPreferences();

				if (response.success) {
					// Asegurarse de que response.data es de tipo NotificationPreferences
					if (response.data) {
						setPreferences(response.data);
					}

					// Convertir las preferencias a los estados de UI
					const newChecked: string[] = [];

					// Comprobar las opciones principales
					if (response.data?.enabled) newChecked.push("oc");
					if (response.data?.user.enabled) newChecked.push("sen");
					if (response.data?.system.enabled) newChecked.push("usn");
					if (response.data?.loginAlerts) newChecked.push("lc");

					setChecked(newChecked);
				}
			} catch (error) {
				setError("No se pudieron cargar las preferencias de notificaciones");
			} finally {
				setLoading(false);
			}
		};

		fetchPreferences();
	}, []);

	// Actualizar las preferencias en el servidor
	const savePreferences = async () => {
		try {
			setSaving(true);

			// Convertir los estados de UI a preferencias
			const updatedPreferences: NotificationPreferences = {
				enabled: checked.includes("oc"),
				channels: {
					// Usa los valores exactos del estado actual, sin valores por defecto
					email: preferences.channels?.email ?? false,
					browser: preferences.channels?.browser ?? false,
					mobile: false,
				},
				user: {
					enabled: checked.includes("sen"),
					calendar: preferences.user.calendar,
					expiration: preferences.user.expiration,
					inactivity: preferences.user.inactivity,
				},
				system: {
					enabled: checked.includes("usn"),
					alerts: preferences.system.alerts,
					news: preferences.system.news,
					userActivity: preferences.system.userActivity,
				},
				loginAlerts: checked.includes("lc"),
			};

			const response = await ApiService.updateNotificationPreferences(updatedPreferences);

			if (response.success && response.data) {
				setPreferences(response.data);
				dispatch(
					openSnackbar({
						open: true,
						message: "Preferencias guardadas correctamente",
						variant: "alert",
						alert: {
							color: "success",
						},
						close: false,
					}),
				);
			}
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al guardar preferencias",
					variant: "alert",
					alert: {
						color: "error",
					},
					close: false,
				}),
			);
		} finally {
			setSaving(false);
		}
	};

	const handleToggle = (value: string) => () => {
		const currentIndex = checked.indexOf(value);
		const newChecked = [...checked];

		if (currentIndex === -1) {
			newChecked.push(value);

			// Si se activa un padre, activar sus flags y todas sus opciones
			if (value === "sen") {
				setPreferences((prev) => ({
					...prev,
					user: {
						...prev.user,
						enabled: true,
						// Al activar el switch principal, activamos todas las opciones hijas
						calendar: true,
						expiration: true,
						inactivity: true,
					},
				}));
			} else if (value === "usn") {
				setPreferences((prev) => ({
					...prev,
					system: {
						...prev.system,
						enabled: true,
						// Al activar el switch principal, activamos todas las opciones hijas
						alerts: true,
						news: true,
						userActivity: true,
					},
				}));
			} else if (value === "chn") {
				// Para canales de comunicación
				setPreferences((prev) => ({
					...prev,
					channels: {
						email: true,
						browser: true,
						mobile: prev.channels?.mobile ?? false,
					},
				}));
			}
		} else {
			newChecked.splice(currentIndex, 1);

			// Si se desactiva un padre, desactivar sus flags y todas sus opciones
			if (value === "sen") {
				setPreferences((prev) => ({
					...prev,
					user: {
						...prev.user,
						enabled: false,
						// Al desactivar el switch principal, desactivamos todas las opciones hijas
						calendar: false,
						expiration: false,
						inactivity: false,
					},
				}));
			} else if (value === "usn") {
				setPreferences((prev) => ({
					...prev,
					system: {
						...prev.system,
						enabled: false,
						// Al desactivar el switch principal, desactivamos todas las opciones hijas
						alerts: false,
						news: false,
						userActivity: false,
					},
				}));
			} else if (value === "chn") {
				// Para canales de comunicación
				setPreferences((prev) => ({
					...prev,
					channels: {
						email: false,
						browser: false,
						mobile: prev.channels?.mobile ?? false,
					},
				}));
			}
		}

		setChecked(newChecked);
	};

	const handleUserOptionToggle = (option: keyof NotificationPreferences["user"]) => () => {
		setPreferences((prev) => {
			const newValue = !prev.user[option];
			// Si se activa una opción, asegurarse que el padre también esté activado
			const updatedUser = {
				...prev.user,
				[option]: newValue,
			};

			// Si alguna opción está activa, el switch principal también debe estarlo
			const anyOptionActive = updatedUser.calendar || updatedUser.expiration || updatedUser.inactivity;
			if (anyOptionActive && !updatedUser.enabled) {
				updatedUser.enabled = true;
				// Actualizar el checked para reflejar que el grupo está activo
				if (checked.indexOf("sen") === -1) {
					setChecked((current) => [...current, "sen"]);
				}
			}

			// Si ninguna opción está activa, desactivar el principal también
			if (!anyOptionActive && updatedUser.enabled) {
				updatedUser.enabled = false;
				// Actualizar el checked para reflejar que el grupo está inactivo
				if (checked.indexOf("sen") !== -1) {
					setChecked((current) => current.filter((item) => item !== "sen"));
				}
			}

			return {
				...prev,
				user: updatedUser,
			};
		});
	};

	const handleSystemOptionToggle = (option: keyof NotificationPreferences["system"]) => () => {
		setPreferences((prev) => {
			const newValue = !prev.system[option];
			// Si se activa una opción, asegurarse que el padre también esté activado
			const updatedSystem = {
				...prev.system,
				[option]: newValue,
			};

			// Si alguna opción está activa, el switch principal también debe estarlo
			const anyOptionActive = updatedSystem.alerts || updatedSystem.news || updatedSystem.userActivity;
			if (anyOptionActive && !updatedSystem.enabled) {
				updatedSystem.enabled = true;
				// Actualizar el checked para reflejar que el grupo está activo
				if (checked.indexOf("usn") === -1) {
					setChecked((current) => [...current, "usn"]);
				}
			}

			// Si ninguna opción está activa, desactivar el principal también
			if (!anyOptionActive && updatedSystem.enabled) {
				updatedSystem.enabled = false;
				// Actualizar el checked para reflejar que el grupo está inactivo
				if (checked.indexOf("usn") !== -1) {
					setChecked((current) => current.filter((item) => item !== "usn"));
				}
			}

			return {
				...prev,
				system: updatedSystem,
			};
		});
	};

	// Manejador para cambios en los canales de comunicación
	const handleChannelChange = (channel: "email" | "browser", value: boolean) => {
		setPreferences((prev) => {
			// Crear un objeto channels completo con todos los valores explícitos
			const updatedChannels = {
				email: channel === "email" ? value : prev.channels?.email ?? false,
				browser: channel === "browser" ? value : prev.channels?.browser ?? false,
				mobile: prev.channels?.mobile ?? false,
			};

			return {
				...prev,
				channels: updatedChannels,
			};
		});
	};

	// Cerrar notificación
	const handleCloseNotification = () => {
		setNotification({
			...notification,
			open: false,
		});
	};

	if (loading) {
		return (
			<MainCard title="Configuración">
				<Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
					<CircularProgress />
				</Box>
			</MainCard>
		);
	}

	if (error) {
		return (
			<MainCard title="Configuración">
				<Alert severity="error" sx={{ mt: 2 }}>
					{error}
				</Alert>
			</MainCard>
		);
	}

	return (
		<MainCard title="Configuración">
			{/* Notificaciones */}
			<Snackbar
				open={notification.open}
				autoHideDuration={6000}
				onClose={handleCloseNotification}
				anchorOrigin={{ vertical: "top", horizontal: "right" }}
			>
				<Alert onClose={handleCloseNotification} severity={notification.severity}>
					{notification.message}
				</Alert>
			</Snackbar>

			<Box>
				{/* Canales de comunicación - Accordion */}
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
					<Accordion expanded={expanded === "panel1"} onChange={handleAccordionChange("panel1")} sx={{ width: "100%" }}>
						<AccordionSummary expandIcon={<ArrowDown2 size={16} />} aria-controls="panel1-content" id="panel1-header" sx={{ px: 2, py: 1 }}>
							<Box sx={{ display: "flex", width: "100%", alignItems: "center" }}>
								<ListItemIcon sx={{ color: "primary.main", mr: 2, display: { xs: "none", sm: "block" } }}>
									<Sms style={{ fontSize: "1.5rem" }} />
								</ListItemIcon>
								<ListItemText
									id="switch-list-label-chn"
									primary={<Typography variant="h5">Canales de comunicación</Typography>}
									secondary="Seleccione a través de qué medios desea recibir sus notificaciones"
								/>
								<Switch
									edge="end"
									onChange={handleToggle("chn")}
									checked={checked.indexOf("chn") !== -1 || preferences.channels?.email || preferences.channels?.browser}
									inputProps={{
										"aria-labelledby": "switch-list-label-chn",
									}}
									onClick={(e) => e.stopPropagation()} // Evita que el accordion se expanda/contraiga al hacer clic en el switch
								/>
							</Box>
						</AccordionSummary>
						<AccordionDetails>
							<List component="div" disablePadding>
								<ListItem sx={{ pl: { xs: 0, sm: 7 }, py: 0.5 }}>
									<ListItemText
										id="switch-list-label-email-channel"
										primary={<Typography variant="body2">Correo electrónico</Typography>}
										sx={{ my: 0 }}
									/>
									<Switch
										edge="end"
										size="small"
										onChange={() => handleChannelChange("email", !preferences.channels?.email)}
										checked={preferences.channels?.email}
										disabled={!channelsEnabled}
										inputProps={{
											"aria-labelledby": "switch-list-label-email-channel",
										}}
									/>
								</ListItem>
								<ListItem sx={{ pl: { xs: 0, sm: 7 }, py: 0.5 }}>
									<ListItemText
										id="switch-list-label-browser-channel"
										primary={<Typography variant="body2">Notificaciones en navegador</Typography>}
										sx={{ my: 0 }}
									/>
									<Switch
										edge="end"
										size="small"
										onChange={() => handleChannelChange("browser", !preferences.channels?.browser)}
										checked={preferences.channels?.browser}
										disabled={!channelsEnabled}
										inputProps={{
											"aria-labelledby": "switch-list-label-browser-channel",
										}}
									/>
								</ListItem>
							</List>
						</AccordionDetails>
					</Accordion>
				</Box>

				{/* Notificaciones de usuario - Accordion */}
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
					<Accordion expanded={expanded === "panel2"} onChange={handleAccordionChange("panel2")} sx={{ width: "100%" }}>
						<AccordionSummary expandIcon={<ArrowDown2 size={16} />} aria-controls="panel2-content" id="panel2-header" sx={{ px: 2, py: 1 }}>
							<Box sx={{ display: "flex", width: "100%", alignItems: "center" }}>
								<ListItemIcon sx={{ color: "primary.main", mr: 2, display: { xs: "none", sm: "block" } }}>
									<Sms style={{ fontSize: "1.5rem" }} />
								</ListItemIcon>
								<ListItemText
									id="switch-list-label-sen"
									primary={<Typography variant="h5">Notificaciones de usuario</Typography>}
									secondary="Reciba notificaciones sobre su actividad, vencimientos y calendario"
								/>
								<Switch
									edge="end"
									onChange={handleToggle("sen")}
									checked={userOptionsEnabled}
									inputProps={{
										"aria-labelledby": "switch-list-label-sen",
									}}
									onClick={(e) => e.stopPropagation()} // Evita que el accordion se expanda/contraiga al hacer clic en el switch
								/>
							</Box>
						</AccordionSummary>
						<AccordionDetails>
							<List component="div" disablePadding>
								<ListItem sx={{ pl: { xs: 0, sm: 7 }, py: 0.5 }}>
									<ListItemText
										id="switch-list-label-email-calendar"
										primary={<Typography variant="body2">Notificar eventos del calendario</Typography>}
										sx={{ my: 0 }}
									/>
									<Switch
										edge="end"
										size="small"
										onChange={handleUserOptionToggle("calendar")}
										checked={preferences.user.calendar}
										disabled={!userOptionsEnabled}
										inputProps={{
											"aria-labelledby": "switch-list-label-email-calendar",
										}}
									/>
								</ListItem>
								<ListItem sx={{ pl: { xs: 0, sm: 7 }, py: 0.5 }}>
									<ListItemText
										id="switch-list-label-email-expiration"
										primary={<Typography variant="body2">Notificar vencimientos</Typography>}
										sx={{ my: 0 }}
									/>
									<Switch
										edge="end"
										size="small"
										onChange={handleUserOptionToggle("expiration")}
										checked={preferences.user.expiration}
										disabled={!userOptionsEnabled}
										inputProps={{
											"aria-labelledby": "switch-list-label-email-expiration",
										}}
									/>
								</ListItem>
								<ListItem sx={{ pl: { xs: 0, sm: 7 }, py: 0.5 }}>
									<ListItemText
										id="switch-list-label-email-inactivity"
										primary={<Typography variant="body2">Notificar inactividad de causas</Typography>}
										sx={{ my: 0 }}
									/>
									<Switch
										edge="end"
										size="small"
										onChange={handleUserOptionToggle("inactivity")}
										checked={preferences.user.inactivity}
										disabled={!userOptionsEnabled}
										inputProps={{
											"aria-labelledby": "switch-list-label-email-inactivity",
										}}
									/>
								</ListItem>
							</List>
						</AccordionDetails>
					</Accordion>
				</Box>

				{/* Notificaciones de sistema - Accordion */}
				<Box sx={{ borderBottom: 1, borderColor: "divider" }}>
					<Accordion expanded={expanded === "panel3"} onChange={handleAccordionChange("panel3")} sx={{ width: "100%" }}>
						<AccordionSummary expandIcon={<ArrowDown2 size={16} />} aria-controls="panel3-content" id="panel3-header" sx={{ px: 2, py: 1 }}>
							<Box sx={{ display: "flex", width: "100%", alignItems: "center" }}>
								<ListItemIcon sx={{ color: "primary.main", mr: 2, display: { xs: "none", sm: "block" } }}>
									<Sms style={{ fontSize: "1.5rem" }} />
								</ListItemIcon>
								<ListItemText
									id="switch-list-label-usn"
									primary={<Typography variant="h5">Notificaciones de sistema</Typography>}
									secondary="Reciba notificaciones sobre el sistema y sus actualizaciones"
								/>
								<Switch
									edge="end"
									onChange={handleToggle("usn")}
									checked={systemOptionsEnabled}
									inputProps={{
										"aria-labelledby": "switch-list-label-usn",
									}}
									onClick={(e) => e.stopPropagation()} // Evita que el accordion se expanda/contraiga al hacer clic en el switch
								/>
							</Box>
						</AccordionSummary>
						<AccordionDetails>
							<List component="div" disablePadding>
								<ListItem sx={{ pl: { xs: 0, sm: 7 }, py: 0.5 }}>
									<ListItemText
										id="switch-list-label-system-alerts"
										primary={<Typography variant="body2">Notificar alertas</Typography>}
										sx={{ my: 0 }}
									/>
									<Switch
										edge="end"
										size="small"
										onChange={handleSystemOptionToggle("alerts")}
										checked={preferences.system.alerts}
										disabled={!systemOptionsEnabled}
										inputProps={{
											"aria-labelledby": "switch-list-label-system-alerts",
										}}
									/>
								</ListItem>
								<ListItem sx={{ pl: { xs: 0, sm: 7 }, py: 0.5 }}>
									<ListItemText
										id="switch-list-label-system-news"
										primary={<Typography variant="body2">Notificar novedades</Typography>}
										sx={{ my: 0 }}
									/>
									<Switch
										edge="end"
										size="small"
										onChange={handleSystemOptionToggle("news")}
										checked={preferences.system.news}
										disabled={!systemOptionsEnabled}
										inputProps={{
											"aria-labelledby": "switch-list-label-system-news",
										}}
									/>
								</ListItem>
								<ListItem sx={{ pl: { xs: 0, sm: 7 }, py: 0.5 }}>
									<ListItemText
										id="switch-list-label-system-user-activity"
										primary={<Typography variant="body2">Notificar actividad de usuarios</Typography>}
										sx={{ my: 0 }}
									/>
									<Switch
										edge="end"
										size="small"
										onChange={handleSystemOptionToggle("userActivity")}
										checked={preferences.system.userActivity}
										disabled={!systemOptionsEnabled}
										inputProps={{
											"aria-labelledby": "switch-list-label-system-user-activity",
										}}
									/>
								</ListItem>
							</List>
						</AccordionDetails>
					</Accordion>
				</Box>
			</Box>
			<Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2} sx={{ mt: 2.5 }}>
				<Button color="error">Cancelar</Button>
				<Button variant="contained" onClick={savePreferences} disabled={saving} startIcon={saving ? <CircularProgress size={20} /> : null}>
					{saving ? "Guardando..." : "Guardar"}
				</Button>
			</Stack>
		</MainCard>
	);
};

export default TabSettings;

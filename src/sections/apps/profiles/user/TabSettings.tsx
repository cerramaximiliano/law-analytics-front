import React from "react";
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
	TextField,
	Checkbox,
	FormControlLabel,
	Collapse,
} from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import ApiService, { NotificationPreferences, NotificationSettings, InactivitySettings } from "store/reducers/ApiService";

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

	// Valores por defecto para settings de notificación
	const defaultSettings: NotificationSettings = {
		notifyOnceOnly: true,
		daysInAdvance: 5,
	};

	// Valores por defecto para settings de inactividad
	const defaultInactivitySettings: InactivitySettings = {
		daysInAdvance: 5,
		caducityDays: 180,
		prescriptionDays: 730,
		notifyOnceOnly: true,
	};

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
			calendarSettings: { ...defaultSettings },
			expiration: true,
			expirationSettings: { ...defaultSettings },
			taskExpiration: true,
			taskExpirationSettings: { ...defaultSettings },
			inactivity: true,
			inactivitySettings: { ...defaultInactivitySettings },
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
		preferences.user?.calendar || preferences.user?.expiration || (preferences.user?.taskExpiration ?? false) || preferences.user?.inactivity || false,
	);
	const [systemOptionsEnabled, setSystemOptionsEnabled] = useState<boolean>(
		preferences.system?.alerts || preferences.system?.news || preferences.system?.userActivity || false,
	);

	useEffect(() => {
		// Actualizar los estados de habilitación basados en las preferencias actuales

		// Canales
		const isAnyChannelEnabled = preferences.channels?.email || preferences.channels?.browser || false;
		setChannelsEnabled(isAnyChannelEnabled);

		// Usuario
		const isAnyUserOptionEnabled = preferences.user?.calendar || preferences.user?.expiration || (preferences.user?.taskExpiration ?? false) || preferences.user?.inactivity || false;
		setUserOptionsEnabled(isAnyUserOptionEnabled);

		// Sistema
		const isAnySystemOptionEnabled = preferences.system?.alerts || preferences.system?.news || preferences.system?.userActivity || false;
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
		preferences.user?.calendar,
		preferences.user?.expiration,
		preferences.user?.taskExpiration,
		preferences.user?.inactivity,
		preferences.system?.alerts,
		preferences.system?.news,
		preferences.system?.userActivity,
	]);

	const handleAccordionChange = (panel: string) => (event: SyntheticEvent, isExpanded: boolean) => {
		setExpanded(isExpanded ? panel : null);
	};

	// Función para normalizar settings de notificación
	const normalizeSettings = (settings: any): NotificationSettings => ({
		notifyOnceOnly: settings?.notifyOnceOnly ?? true,
		daysInAdvance: settings?.daysInAdvance ?? 5,
	});

	// Función para normalizar settings de inactividad
	const normalizeInactivitySettings = (settings: any): InactivitySettings => ({
		daysInAdvance: settings?.daysInAdvance ?? 5,
		caducityDays: settings?.caducityDays ?? 180,
		prescriptionDays: settings?.prescriptionDays ?? 730,
		notifyOnceOnly: settings?.notifyOnceOnly ?? true,
	});

	// Función para normalizar las preferencias y asegurar que todos los campos existan
	// El servidor puede devolver datos en dos formatos:
	// 1. Directo: { user: { taskExpiration: false } } (desde GET /preferences)
	// 2. Anidado: { notifications: { user: { taskExpiration: false } } } (desde PUT /preferences que devuelve preferences completas)
	const normalizePreferences = (data: any): NotificationPreferences => {
		// Detectar si los datos vienen anidados en notifications
		const notifications = data?.notifications || data;

		return {
			enabled: notifications?.enabled ?? true,
			channels: {
				email: notifications?.channels?.email ?? true,
				browser: notifications?.channels?.browser ?? true,
				mobile: notifications?.channels?.mobile ?? false,
			},
			user: {
				enabled: notifications?.user?.enabled ?? true,
				calendar: notifications?.user?.calendar ?? true,
				calendarSettings: normalizeSettings(notifications?.user?.calendarSettings),
				expiration: notifications?.user?.expiration ?? true,
				expirationSettings: normalizeSettings(notifications?.user?.expirationSettings),
				taskExpiration: notifications?.user?.taskExpiration ?? true,
				taskExpirationSettings: normalizeSettings(notifications?.user?.taskExpirationSettings),
				inactivity: notifications?.user?.inactivity ?? true,
				inactivitySettings: normalizeInactivitySettings(notifications?.user?.inactivitySettings),
			},
			system: {
				enabled: notifications?.system?.enabled ?? true,
				alerts: notifications?.system?.alerts ?? true,
				news: notifications?.system?.news ?? true,
				userActivity: notifications?.system?.userActivity ?? true,
			},
			otherCommunications: notifications?.otherCommunications,
			loginAlerts: notifications?.loginAlerts,
		};
	};

	// Cargar las preferencias del usuario al montar el componente
	useEffect(() => {
		const fetchPreferences = async () => {
			try {
				setLoading(true);
				const response = await ApiService.getNotificationPreferences();

				if (response.success) {
					// Normalizar los datos del servidor para asegurar que todos los campos existan
					const normalizedData = normalizePreferences(response.data);
					setPreferences(normalizedData);

					// Convertir las preferencias a los estados de UI
					const newChecked: string[] = [];

					// Comprobar las opciones principales
					if (normalizedData.enabled) newChecked.push("oc");
					if (normalizedData.user.enabled) newChecked.push("sen");
					if (normalizedData.system.enabled) newChecked.push("usn");
					if (normalizedData.loginAlerts) newChecked.push("lc");

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
					calendar: preferences.user?.calendar ?? false,
					calendarSettings: preferences.user?.calendarSettings ?? defaultSettings,
					expiration: preferences.user?.expiration ?? false,
					expirationSettings: preferences.user?.expirationSettings ?? defaultSettings,
					taskExpiration: preferences.user?.taskExpiration ?? false,
					taskExpirationSettings: preferences.user?.taskExpirationSettings ?? defaultSettings,
					inactivity: preferences.user?.inactivity ?? false,
					inactivitySettings: preferences.user?.inactivitySettings ?? defaultInactivitySettings,
				},
				system: {
					enabled: checked.includes("usn"),
					alerts: preferences.system?.alerts ?? false,
					news: preferences.system?.news ?? false,
					userActivity: preferences.system?.userActivity ?? false,
				},
				loginAlerts: checked.includes("lc"),
			};

			const response = await ApiService.updateNotificationPreferences(updatedPreferences);

			if (response.success && response.data) {
				// Normalizar los datos de la respuesta para asegurar que todos los campos existan
				setPreferences(normalizePreferences(response.data));
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
						taskExpiration: true,
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
						taskExpiration: false,
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
			const currentUser = prev.user ?? { enabled: false, calendar: false, expiration: false, taskExpiration: false, inactivity: false };
			const newValue = !currentUser[option];
			// Si se activa una opción, asegurarse que el padre también esté activado
			const updatedUser = {
				...currentUser,
				[option]: newValue,
			};

			// Si alguna opción está activa, el switch principal también debe estarlo
			const anyOptionActive = updatedUser.calendar || updatedUser.expiration || (updatedUser.taskExpiration ?? false) || updatedUser.inactivity;
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

	// Handler para cambiar la configuración de días de anticipación
	const handleDaysInAdvanceChange =
		(settingsKey: "calendarSettings" | "expirationSettings" | "taskExpirationSettings") =>
		(event: React.ChangeEvent<HTMLInputElement>) => {
			const value = parseInt(event.target.value, 10);
			if (isNaN(value) || value < 1 || value > 30) return;

			setPreferences((prev) => ({
				...prev,
				user: {
					...prev.user,
					[settingsKey]: {
						...prev.user[settingsKey],
						daysInAdvance: value,
					},
				},
			}));
		};

	// Handler para cambiar la configuración de notificar solo una vez
	const handleNotifyOnceOnlyChange =
		(settingsKey: "calendarSettings" | "expirationSettings" | "taskExpirationSettings") =>
		(event: React.ChangeEvent<HTMLInputElement>) => {
			setPreferences((prev) => ({
				...prev,
				user: {
					...prev.user,
					[settingsKey]: {
						...prev.user[settingsKey],
						notifyOnceOnly: event.target.checked,
					},
				},
			}));
		};

	// Handler para cambiar días de anticipación de inactividad
	const handleInactivityDaysInAdvanceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseInt(event.target.value, 10);
		if (isNaN(value) || value < 1 || value > 30) return;

		setPreferences((prev) => ({
			...prev,
			user: {
				...prev.user,
				inactivitySettings: {
					...prev.user.inactivitySettings!,
					daysInAdvance: value,
				},
			},
		}));
	};

	// Handler para cambiar los días de caducidad (inactividad)
	const handleCaducityDaysChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseInt(event.target.value, 10);
		if (isNaN(value) || value < 1 || value > 365) return;

		setPreferences((prev) => ({
			...prev,
			user: {
				...prev.user,
				inactivitySettings: {
					...prev.user.inactivitySettings!,
					caducityDays: value,
				},
			},
		}));
	};

	// Handler para cambiar los meses de prescripción (se guarda en días en el backend)
	const handlePrescriptionMonthsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const months = parseInt(event.target.value, 10);
		if (isNaN(months) || months < 1 || months > 120) return;

		// Convertir meses a días (aproximado: 30.44 días por mes)
		const days = Math.round(months * 30.44);

		setPreferences((prev) => ({
			...prev,
			user: {
				...prev.user,
				inactivitySettings: {
					...prev.user.inactivitySettings!,
					prescriptionDays: days,
				},
			},
		}));
	};

	// Función auxiliar para convertir días a meses (para mostrar en UI)
	const daysToMonths = (days: number): number => Math.round(days / 30.44);

	// Handler para cambiar notificar solo una vez en inactividad
	const handleInactivityNotifyOnceOnlyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setPreferences((prev) => ({
			...prev,
			user: {
				...prev.user,
				inactivitySettings: {
					...prev.user.inactivitySettings!,
					notifyOnceOnly: event.target.checked,
				},
			},
		}));
	};

	const handleSystemOptionToggle = (option: keyof NotificationPreferences["system"]) => () => {
		setPreferences((prev) => {
			const currentSystem = prev.system ?? { enabled: false, alerts: false, news: false, userActivity: false };
			const newValue = !currentSystem[option];
			// Si se activa una opción, asegurarse que el padre también esté activado
			const updatedSystem = {
				...currentSystem,
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
								{/* Notificar eventos del calendario */}
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
										checked={preferences.user?.calendar ?? false}
										disabled={!userOptionsEnabled}
										inputProps={{
											"aria-labelledby": "switch-list-label-email-calendar",
										}}
									/>
								</ListItem>
								<Collapse in={preferences.user?.calendar ?? false} timeout="auto" unmountOnExit>
									<Box sx={{ pl: { xs: 2, sm: 9 }, pr: 2, py: 1, bgcolor: "action.hover", borderRadius: 1, mx: { xs: 0, sm: 7 }, mb: 1 }}>
										<Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
											<Stack direction="row" spacing={1} alignItems="center">
												<Typography variant="caption" color="text.secondary">
													Días de anticipación:
												</Typography>
												<TextField
													type="number"
													size="small"
													value={preferences.user?.calendarSettings?.daysInAdvance ?? 5}
													onChange={handleDaysInAdvanceChange("calendarSettings")}
													inputProps={{ min: 1, max: 30 }}
													sx={{ width: 70 }}
												/>
												<Typography variant="caption" color="text.secondary">
													antes del vencimiento
												</Typography>
											</Stack>
											<FormControlLabel
												control={
													<Checkbox
														size="small"
														checked={preferences.user?.calendarSettings?.notifyOnceOnly ?? true}
														onChange={handleNotifyOnceOnlyChange("calendarSettings")}
													/>
												}
												label={<Typography variant="caption">Notificar solo una vez</Typography>}
											/>
										</Stack>
									</Box>
								</Collapse>

								{/* Notificar vencimientos de movimientos */}
								<ListItem sx={{ pl: { xs: 0, sm: 7 }, py: 0.5 }}>
									<ListItemText
										id="switch-list-label-email-expiration"
										primary={<Typography variant="body2">Notificar vencimientos de movimientos</Typography>}
										sx={{ my: 0 }}
									/>
									<Switch
										edge="end"
										size="small"
										onChange={handleUserOptionToggle("expiration")}
										checked={preferences.user?.expiration ?? false}
										disabled={!userOptionsEnabled}
										inputProps={{
											"aria-labelledby": "switch-list-label-email-expiration",
										}}
									/>
								</ListItem>
								<Collapse in={preferences.user?.expiration ?? false} timeout="auto" unmountOnExit>
									<Box sx={{ pl: { xs: 2, sm: 9 }, pr: 2, py: 1, bgcolor: "action.hover", borderRadius: 1, mx: { xs: 0, sm: 7 }, mb: 1 }}>
										<Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
											<Stack direction="row" spacing={1} alignItems="center">
												<Typography variant="caption" color="text.secondary">
													Días de anticipación:
												</Typography>
												<TextField
													type="number"
													size="small"
													value={preferences.user?.expirationSettings?.daysInAdvance ?? 5}
													onChange={handleDaysInAdvanceChange("expirationSettings")}
													inputProps={{ min: 1, max: 30 }}
													sx={{ width: 70 }}
												/>
												<Typography variant="caption" color="text.secondary">
													antes del vencimiento
												</Typography>
											</Stack>
											<FormControlLabel
												control={
													<Checkbox
														size="small"
														checked={preferences.user?.expirationSettings?.notifyOnceOnly ?? true}
														onChange={handleNotifyOnceOnlyChange("expirationSettings")}
													/>
												}
												label={<Typography variant="caption">Notificar solo una vez</Typography>}
											/>
										</Stack>
									</Box>
								</Collapse>

								{/* Notificar vencimientos de tareas */}
								<ListItem sx={{ pl: { xs: 0, sm: 7 }, py: 0.5 }}>
									<ListItemText
										id="switch-list-label-email-task-expiration"
										primary={<Typography variant="body2">Notificar vencimientos de tareas</Typography>}
										sx={{ my: 0 }}
									/>
									<Switch
										edge="end"
										size="small"
										onChange={handleUserOptionToggle("taskExpiration")}
										checked={preferences.user?.taskExpiration ?? false}
										disabled={!userOptionsEnabled}
										inputProps={{
											"aria-labelledby": "switch-list-label-email-task-expiration",
										}}
									/>
								</ListItem>
								<Collapse in={preferences.user?.taskExpiration ?? false} timeout="auto" unmountOnExit>
									<Box sx={{ pl: { xs: 2, sm: 9 }, pr: 2, py: 1, bgcolor: "action.hover", borderRadius: 1, mx: { xs: 0, sm: 7 }, mb: 1 }}>
										<Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
											<Stack direction="row" spacing={1} alignItems="center">
												<Typography variant="caption" color="text.secondary">
													Días de anticipación:
												</Typography>
												<TextField
													type="number"
													size="small"
													value={preferences.user?.taskExpirationSettings?.daysInAdvance ?? 5}
													onChange={handleDaysInAdvanceChange("taskExpirationSettings")}
													inputProps={{ min: 1, max: 30 }}
													sx={{ width: 70 }}
												/>
												<Typography variant="caption" color="text.secondary">
													antes del vencimiento
												</Typography>
											</Stack>
											<FormControlLabel
												control={
													<Checkbox
														size="small"
														checked={preferences.user?.taskExpirationSettings?.notifyOnceOnly ?? true}
														onChange={handleNotifyOnceOnlyChange("taskExpirationSettings")}
													/>
												}
												label={<Typography variant="caption">Notificar solo una vez</Typography>}
											/>
										</Stack>
									</Box>
								</Collapse>

								{/* Notificar inactividad de causas */}
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
										checked={preferences.user?.inactivity ?? false}
										disabled={!userOptionsEnabled}
										inputProps={{
											"aria-labelledby": "switch-list-label-email-inactivity",
										}}
									/>
								</ListItem>
								<Collapse in={preferences.user?.inactivity ?? false} timeout="auto" unmountOnExit>
									<Box sx={{ pl: { xs: 2, sm: 9 }, pr: 2, py: 1, bgcolor: "action.hover", borderRadius: 1, mx: { xs: 0, sm: 7 }, mb: 1 }}>
										<Stack spacing={1.5}>
											{/* Días de anticipación y Notificar solo una vez en la misma línea */}
											<Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
												<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
													<Typography variant="caption" color="text.secondary">
														Días de anticipación:
													</Typography>
													<TextField
														type="number"
														size="small"
														value={preferences.user?.inactivitySettings?.daysInAdvance ?? 5}
														onChange={handleInactivityDaysInAdvanceChange}
														inputProps={{ min: 1, max: 30 }}
														sx={{ width: 70 }}
													/>
													<Typography variant="caption" color="text.secondary">
														antes del vencimiento
													</Typography>
												</Stack>
												<FormControlLabel
													control={
														<Checkbox
															size="small"
															checked={preferences.user?.inactivitySettings?.notifyOnceOnly ?? true}
															onChange={handleInactivityNotifyOnceOnlyChange}
														/>
													}
													label={<Typography variant="caption">Notificar solo una vez</Typography>}
												/>
											</Stack>
											{/* Alertas de caducidad y prescripción */}
											<Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
												<Stack direction="row" spacing={1} alignItems="center">
													<Typography variant="caption" color="text.secondary">
														Alerta de caducidad (días):
													</Typography>
													<TextField
														type="number"
														size="small"
														value={preferences.user?.inactivitySettings?.caducityDays ?? 180}
														onChange={handleCaducityDaysChange}
														inputProps={{ min: 1, max: 365 }}
														sx={{ width: 80 }}
													/>
												</Stack>
												<Stack direction="row" spacing={1} alignItems="center">
													<Typography variant="caption" color="text.secondary">
														Alerta de prescripción (meses):
													</Typography>
													<TextField
														type="number"
														size="small"
														value={daysToMonths(preferences.user?.inactivitySettings?.prescriptionDays ?? 730)}
														onChange={handlePrescriptionMonthsChange}
														inputProps={{ min: 1, max: 120 }}
														sx={{ width: 70 }}
													/>
												</Stack>
											</Stack>
										</Stack>
									</Box>
								</Collapse>
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
										checked={preferences.system?.alerts ?? false}
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
										checked={preferences.system?.news ?? false}
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
										checked={preferences.system?.userActivity ?? false}
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

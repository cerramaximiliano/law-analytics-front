import { useState, useEffect } from "react";
import { useSelector } from "store";
import { formatDistance } from "date-fns";
import { es } from "date-fns/locale";

// material-ui
import {
	Box,
	Button,
	Grid,
	InputLabel,
	List,
	ListItem,
	ListItemText,
	Stack,
	Switch,
	TextField,
	Typography,
	Select,
	MenuItem,
	FormControl,
	CircularProgress,
	Alert,
	Snackbar,
	Dialog,
	DialogActions,
	DialogContent,
	DialogContentText,
	DialogTitle,
} from "@mui/material";

// project-imports
import MainCard from "components/MainCard";
import sessionService from "store/reducers/sessionService";
import ApiService, {
	UserPreferences,
	//NotificationPreferences
} from "store/reducers/ApiService";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";

// Tipos para las sesiones
interface SessionData {
	deviceId: string;
	deviceName: string;
	deviceType: string;
	browser: string;
	os: string;
	lastActivity: string;
	location?: string;
	isCurrentSession: boolean;
	ip?: string;
}

// Tipo para extender las preferencias de usuario con email
interface ExtendedUserPreferences extends UserPreferences {
	email?: string;
}

// Zonas horarias comunes
const timeZones = [
	{ value: "Europe/Madrid", label: "(GMT+01:00) Madrid" },
	{ value: "Europe/London", label: "(GMT+00:00) Londres" },
	{ value: "America/New_York", label: "(GMT-05:00) Nueva York" },
	{ value: "America/Los_Angeles", label: "(GMT-08:00) Los Ángeles" },
	{ value: "America/Chicago", label: "(GMT-06:00) Chicago" },
	{ value: "America/Denver", label: "(GMT-07:00) Denver" },
	{ value: "America/Buenos_Aires", label: "(GMT-03:00) Buenos Aires" },
	{ value: "Asia/Tokyo", label: "(GMT+09:00) Tokio" },
	{ value: "Asia/Shanghai", label: "(GMT+08:00) Shanghai" },
	{ value: "Asia/Dubai", label: "(GMT+04:00) Dubai" },
	{ value: "Australia/Sydney", label: "(GMT+10:00) Sídney" },
];

// Formatos de fecha comunes
const dateFormats = [
	{ value: "DD/MM/YYYY", label: "DD/MM/AAAA (31/12/2023)" },
	{ value: "MM/DD/YYYY", label: "MM/DD/AAAA (12/31/2023)" },
	{ value: "YYYY-MM-DD", label: "AAAA-MM-DD (2023-12-31)" },
	{ value: "DD-MM-YYYY", label: "DD-MM-AAAA (31-12-2023)" },
	{ value: "YYYY/MM/DD", label: "AAAA/MM/DD (2023/12/31)" },
	{ value: "DD.MM.YYYY", label: "DD.MM.AAAA (31.12.2023)" },
];

// Opciones para el motivo de desactivación
const deactivationReasons = [
	{ value: "no_longer_needed", label: "Ya no necesito la cuenta" },
	{ value: "too_complex", label: "La aplicación es demasiado compleja de usar" },
	{ value: "found_alternative", label: "Encontré una alternativa mejor" },
	{ value: "privacy_concerns", label: "Preocupaciones de privacidad" },
	{ value: "other", label: "Otro motivo" },
];

const TabAccount = () => {
	const [checked, setChecked] = useState(["sb", "ln", "la"]);
	const auth = useSelector((state) => state.auth);
	const [email, setEmail] = useState(auth.user?.email || "");
	const [originalEmail, setOriginalEmail] = useState(auth.user?.email || "");
	const [emailChanged, setEmailChanged] = useState(false);
	const [emailError, setEmailError] = useState<string | null>(null);

	// Estado para la zona horaria y formato de fecha
	const [timeZone, setTimeZone] = useState("");
	const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
	const [originalTimeZone, setOriginalTimeZone] = useState("");
	const [originalDateFormat, setOriginalDateFormat] = useState("DD/MM/YYYY");

	// Estado para mostrar/ocultar selectores
	const [editingTimeZone, setEditingTimeZone] = useState(false);
	const [editingDateFormat, setEditingDateFormat] = useState(false);

	// Estado para las sesiones activas
	const [sessions, setSessions] = useState<SessionData[]>([]);
	const [loadingSessions, setLoadingSessions] = useState(true);
	const [sessionError, setSessionError] = useState<string | null>(null);

	// Estado para guardar preferencias
	const [savingPreferences, setSavingPreferences] = useState(false);
	const [preferences, setPreferences] = useState<ExtendedUserPreferences | null>(null);

	// Estado para notificaciones
	const [notification, setNotification] = useState({
		open: false,
		message: "",
		severity: "success" as "success" | "error" | "warning" | "info",
	});

	// Estado para el formulario de desactivación de cuenta
	const [showDeactivateForm, setShowDeactivateForm] = useState(false);
	const [deactivateFormData, setDeactivateFormData] = useState({
		password: "",
		reason: "",
		otherReason: "",
	});
	const [deactivateLoading, setDeactivateLoading] = useState(false);
	const [deactivateError, setDeactivateError] = useState<string | null>(null);
	const [showDeactivateConfirmDialog, setShowDeactivateConfirmDialog] = useState(false);

	const [originalChecked, setOriginalChecked] = useState<string[]>([]);

	const loadUserPreferences = async () => {
		try {
			const response = await ApiService.getUserPreferences();

			if (response.success && response.data) {
				console.log("Datos recibidos del servidor:", response.data);

				// Casting seguro a 'any' solo para acceso a propiedades
				const responseData = response.data as any;

				// Crear un objeto UserPreferences válido
				const userPrefs: UserPreferences = {
					// Valores por defecto o valores del servidor
					timeZone: responseData.timeZone || "Europe/Madrid",
					dateFormat: responseData.dateFormat || "DD/MM/YYYY",
					language: responseData.language || "es",
					theme: responseData.theme || "light",
					notifications: {
						// Accedemos de forma segura a las propiedades que necesitamos
						enabled: Boolean(responseData.enabled || (responseData.notifications && responseData.notifications.enabled) || false),

						loginAlerts: Boolean(
							responseData.loginAlerts || (responseData.notifications && responseData.notifications.loginAlerts) || false,
						),

						otherCommunications: Boolean(
							responseData.otherCommunications || (responseData.notifications && responseData.notifications.otherCommunications) || false,
						),

						// Para objetos, verificamos si existen o usamos defaults
						channels: responseData.channels ||
							(responseData.notifications && responseData.notifications.channels) || {
								email: false,
								browser: false,
								mobile: false,
							},

						user: responseData.user ||
							(responseData.notifications && responseData.notifications.user) || {
								enabled: false,
								calendar: false,
								expiration: false,
								inactivity: false,
							},

						system: responseData.system ||
							(responseData.notifications && responseData.notifications.system) || {
								enabled: false,
								alerts: false,
								news: false,
								userActivity: false,
							},
					},
				};

				// Convertir a ExtendedUserPreferences
				const extendedPrefs: ExtendedUserPreferences = {
					...userPrefs,
					email: auth.user?.email || "",
				};
				setPreferences(extendedPrefs);

				// Actualizar estados
				if (userPrefs.timeZone) {
					setTimeZone(userPrefs.timeZone);
					setOriginalTimeZone(userPrefs.timeZone);
				}

				if (userPrefs.dateFormat) {
					setDateFormat(userPrefs.dateFormat);
					setOriginalDateFormat(userPrefs.dateFormat);
				}

				// Configurar switches
				const newChecked = ["sb", "la"]; // Valores base

				// Verificar loginAlerts con acceso seguro
				const loginAlertsValue = Boolean(
					responseData.loginAlerts || (responseData.notifications && responseData.notifications.loginAlerts),
				);

				if (loginAlertsValue !== false) {
					newChecked.push("ln");
				}

				// Logs para depuración
				console.log("¿loginAlerts es true?", loginAlertsValue === true);
				console.log("¿loginAlerts existe directo?", "loginAlerts" in responseData);
				console.log("¿loginAlerts existe en notifications?", responseData.notifications && "loginAlerts" in responseData.notifications);
				console.log("Valor de loginAlerts:", loginAlertsValue);

				setOriginalChecked([...newChecked]);
				setChecked(newChecked);
				console.log("Estado de switches actualizado:", newChecked);
			}
		} catch (error) {
			console.error("Error al cargar preferencias de usuario:", error);
			dispatch(
				openSnackbar({
					open: true,
					message: "No se pudieron cargar las preferencias de usuario",
					variant: "alert",
					alert: {
						color: "error",
					},
					close: false,
				}),
			);
		}
	};

	// Cargar sesiones activas
	const loadSessions = async () => {
		try {
			setLoadingSessions(true);
			setSessionError(null);

			const response = await sessionService.getActiveSessions();
			if (response.success && response.data) {
				// Convertir las fechas a string si es necesario
				const formattedSessions = response.data.map((session) => ({
					...session,
					// Asegurar que lastActivity sea siempre un string
					lastActivity:
						typeof session.lastActivity === "object" && session.lastActivity instanceof Date
							? session.lastActivity.toISOString()
							: String(session.lastActivity),
				}));
				setSessions(formattedSessions);
			} else {
				setSessionError("No se pudieron cargar las sesiones");
			}
		} catch (error) {
			setSessionError(typeof error === "string" ? error : "Error al cargar las sesiones activas");
			console.error("Error al cargar sesiones:", error);
		} finally {
			setLoadingSessions(false);
		}
	};

	// Cerrar una sesión específica
	const handleCloseSession = async (deviceId: string, isCurrentSession: boolean) => {
		try {
			if (isCurrentSession) {
				const confirm = window.confirm(
					"¿Estás seguro de que deseas cerrar tu sesión actual? Serás redirigido a la página de inicio de sesión.",
				);
				if (!confirm) return;
			} else {
				const confirm = window.confirm("¿Estás seguro de que deseas cerrar esta sesión?");
				if (!confirm) return;
			}

			setLoadingSessions(true);
			const response = await sessionService.terminateSession(deviceId);

			if (response.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Sesión cerrada correctamente",
						variant: "alert",
						alert: {
							color: "success",
						},
						close: false,
					}),
				);
				if (response.requireLogin) {
					// Redirigir al login si se cerró la sesión actual
					window.location.href = "/login";
					return;
				}

				// Recargar la lista de sesiones
				loadSessions();
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: response.message || "Error al cerrar la sesión",
						variant: "alert",
						alert: {
							color: "error",
						},
						close: false,
					}),
				);
			}
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al cerrar la sesión",
					variant: "alert",
					alert: {
						color: "error",
					},
					close: false,
				}),
			);
			console.error("Error al cerrar sesión:", error);
		} finally {
			setLoadingSessions(false);
		}
	};

	// Cerrar todas las sesiones excepto la actual
	const handleCloseAllSessions = async () => {
		try {
			const confirm = window.confirm("¿Estás seguro de que deseas cerrar todas las demás sesiones?");
			if (!confirm) return;

			setLoadingSessions(true);
			const response = await sessionService.terminateAllOtherSessions();

			if (response.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Todas las demás sesiones han sido cerradas",
						variant: "alert",
						alert: {
							color: "success",
						},
						close: false,
					}),
				);

				loadSessions();
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: "Error al cerrar las sesiones",
						variant: "alert",
						alert: {
							color: "error",
						},
						close: false,
					}),
				);
			}
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al cerrar las sesiones",
					variant: "alert",
					alert: {
						color: "error",
					},
					close: false,
				}),
			);

			console.error("Error al cerrar todas las sesiones:", error);
		} finally {
			setLoadingSessions(false);
		}
	};

	// Manejar cambios en el formulario de desactivación
	const handleDeactivateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setDeactivateFormData((prev) => ({
			...prev,
			[name]: value,
		}));
	};

	// Validar el formulario de desactivación antes de abrir el diálogo de confirmación
	const validateDeactivateForm = () => {
		if (!deactivateFormData.password) {
			setDeactivateError("Por favor, introduce tu contraseña para confirmar la desactivación");
			return false;
		}
		setDeactivateError(null);
		return true;
	};

	// Abrir el diálogo de confirmación de desactivación
	const handleOpenDeactivateConfirmDialog = () => {
		if (validateDeactivateForm()) {
			setShowDeactivateConfirmDialog(true);
		}
	};

	// Cerrar el diálogo de confirmación de desactivación
	const handleCloseDeactivateConfirmDialog = () => {
		setShowDeactivateConfirmDialog(false);
	};

	// Desactivar la cuenta
	const handleDeactivateAccount = async () => {
		try {
			setDeactivateLoading(true);
			setDeactivateError(null);

			// Preparar el motivo final
			const finalReason =
				deactivateFormData.reason === "other"
					? deactivateFormData.otherReason
					: deactivateFormData.reason
					? deactivationReasons.find((r) => r.value === deactivateFormData.reason)?.label
					: "";

			// Llamar al servicio para desactivar la cuenta
			const response = await sessionService.deactivateAccount({
				password: deactivateFormData.password,
				reason: finalReason,
			});

			setDeactivateLoading(false);

			if (response.success) {
				// Mostrar mensaje de éxito

				dispatch(
					openSnackbar({
						open: true,
						message: "Cuenta desactivada correctamente. Serás redirigido a la página de inicio de sesión.",
						variant: "alert",
						alert: {
							color: "success",
						},
						close: false,
					}),
				);

				// Cerrar el diálogo de confirmación
				setShowDeactivateConfirmDialog(false);

				// Cerrar el formulario de desactivación
				setShowDeactivateForm(false);

				// Redirigir al login después de un breve retraso
				setTimeout(() => {
					window.location.href = "/login";
				}, 2000);
			} else {
				// Cerrar el diálogo de confirmación en caso de error
				setShowDeactivateConfirmDialog(false);

				// Mostrar el error en el formulario principal
				setDeactivateError(response.message || "Error al desactivar la cuenta");
			}
		} catch (error) {
			setDeactivateLoading(false);

			// Cerrar el diálogo de confirmación en caso de error
			setShowDeactivateConfirmDialog(false);

			if (typeof error === "string") {
				setDeactivateError(error);
			} else if (error instanceof Error) {
				setDeactivateError(error.message);
			} else {
				setDeactivateError("Error al desactivar la cuenta");
			}
		}
	};

	// Maneja el cambio de email
	const handleEmailChange = (e: React.ChangeEvent<HTMLInputElement>) => {
		const newEmail = e.target.value;
		setEmail(newEmail);
		setEmailChanged(newEmail !== originalEmail);

		// Validar formato de email
		if (newEmail && !/\S+@\S+\.\S+/.test(newEmail)) {
			setEmailError("Por favor, introduce un correo electrónico válido");
		} else {
			setEmailError(null);
		}
	};

	// Formatear el tiempo "desde" para la última actividad
	const formatLastActivity = (dateString: string): string => {
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) {
				return "Desconocido";
			}
			return formatDistance(date, new Date(), { addSuffix: true, locale: es });
		} catch (err) {
			return "Fecha desconocida";
		}
	};

	// Obtener la zona horaria del navegador al cargar el componente
	useEffect(() => {
		// Obtener la zona horaria del navegador
		const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;

		// Buscar si existe en nuestra lista
		const foundTimeZone = timeZones.find((tz) => tz.value === browserTimeZone);

		if (foundTimeZone) {
			setTimeZone(foundTimeZone.value);
			setOriginalTimeZone(foundTimeZone.value);
		} else {
			// Si no existe en nuestra lista, usar Madrid por defecto
			setTimeZone("Europe/Madrid");
			setOriginalTimeZone("Europe/Madrid");
		}

		// Cargar las sesiones activas
		loadSessions();

		// Cargar preferencias de usuario
		loadUserPreferences();
	}, []);

	// Obtener el label de la zona horaria seleccionada
	const getTimeZoneLabel = () => {
		const found = timeZones.find((tz) => tz.value === timeZone);
		return found ? found.label : "";
	};

	// Obtener el label del formato de fecha seleccionado
	const getDateFormatLabel = () => {
		const found = dateFormats.find((df) => df.value === dateFormat);
		return found ? found.label : "";
	};

	const handleToggle = (value: string) => () => {
		const currentIndex = checked.indexOf(value);
		const newChecked = [...checked];

		if (currentIndex === -1) {
			newChecked.push(value);
		} else {
			newChecked.splice(currentIndex, 1);
		}

		setChecked(newChecked);

		// Log para depuración
		if (value === "ln") {
			console.log("Switch loginAlerts cambiado a:", newChecked.includes("ln"));
		}
	};

	// Funciones para controlar los estados de edición
	const toggleTimeZoneEdit = () => {
		setEditingTimeZone(!editingTimeZone);
	};

	const toggleDateFormatEdit = () => {
		setEditingDateFormat(!editingDateFormat);
	};

	// Función para guardar los cambios
	const saveChanges = async () => {
		try {
			setSavingPreferences(true);

			if (!preferences) return;

			// Verificar cambios
			const hasTimeZoneChanged = timeZone !== originalTimeZone;
			const hasDateFormatChanged = dateFormat !== originalDateFormat;
			const hasEmailChanged = email !== originalEmail;
			const hasLoginNotificationChanged =
				(checked.includes("ln") && !originalChecked.includes("ln")) || (!checked.includes("ln") && originalChecked.includes("ln"));

			if (!hasTimeZoneChanged && !hasDateFormatChanged && !hasEmailChanged && !hasLoginNotificationChanged) {
				dispatch(
					openSnackbar({
						open: true,
						message: "No hay cambios para guardar",
						variant: "alert",
						alert: {
							color: "info",
						},
						close: false,
					}),
				);

				setSavingPreferences(false);
				return;
			}

			// Validar email
			if (hasEmailChanged && emailError) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Por favor, corrige el formato del correo electrónico",
						variant: "alert",
						alert: {
							color: "error",
						},
						close: false,
					}),
				);

				setSavingPreferences(false);
				return;
			}

			// Preparamos datos y hacemos un cast para evitar errores de tipo
			// Este enfoque es seguro porque sabemos que la estructura que espera la API
			// no coincide exactamente con UserPreferences
			const updatedPreferences: Record<string, any> = {};

			if (hasTimeZoneChanged) {
				updatedPreferences.timeZone = timeZone;
			}

			if (hasDateFormatChanged) {
				updatedPreferences.dateFormat = dateFormat;
			}

			if (hasLoginNotificationChanged) {
				// En base a los logs, parece que loginAlerts debe ir en el nivel superior
				updatedPreferences.loginAlerts = checked.includes("ln");
			}

			if (hasEmailChanged) {
				// Manejar email según API
				updatedPreferences.email = email;
			}

			console.log("Enviando datos al servidor:", updatedPreferences);

			// Casting seguro para la llamada API
			const response = await ApiService.updateUserPreferences(updatedPreferences as Partial<UserPreferences>);

			if (response.success && response.data) {
				// Crear objeto actualizado
				// Usamos cast a any para acceso seguro a propiedades
				const responseData = response.data as any;

				// Crear objeto UserPreferences válido de la respuesta
				const updatedUserPrefs: UserPreferences = {
					timeZone: responseData.timeZone || timeZone,
					dateFormat: responseData.dateFormat || dateFormat,
					language: responseData.language || preferences.language,
					theme: responseData.theme || preferences.theme,
					notifications: {
						enabled: Boolean(
							responseData.enabled ||
								(responseData.notifications && responseData.notifications.enabled) ||
								preferences.notifications.enabled,
						),

						loginAlerts: Boolean(
							hasLoginNotificationChanged
								? checked.includes("ln")
								: responseData.loginAlerts ||
										(responseData.notifications && responseData.notifications.loginAlerts) ||
										preferences.notifications.loginAlerts,
						),

						otherCommunications: Boolean(
							responseData.otherCommunications ||
								(responseData.notifications && responseData.notifications.otherCommunications) ||
								preferences.notifications.otherCommunications,
						),

						channels:
							responseData.channels ||
							(responseData.notifications && responseData.notifications.channels) ||
							preferences.notifications.channels,

						user: responseData.user || (responseData.notifications && responseData.notifications.user) || preferences.notifications.user,

						system:
							responseData.system || (responseData.notifications && responseData.notifications.system) || preferences.notifications.system,
					},
				};

				// Convertir a ExtendedUserPreferences
				const extendedData: ExtendedUserPreferences = {
					...updatedUserPrefs,
					email: hasEmailChanged ? email : preferences.email,
				};

				setPreferences(extendedData);
				setOriginalTimeZone(timeZone);
				setOriginalDateFormat(dateFormat);

				if (hasEmailChanged) {
					setOriginalEmail(email);
					setEmailChanged(false);
				}

				// Actualizar estado switches
				setOriginalChecked([...checked]);

				// Ocultar selectores
				setEditingTimeZone(false);
				setEditingDateFormat(false);

				dispatch(
					openSnackbar({
						open: true,
						message: "Cambios guardados correctamente",
						variant: "alert",
						alert: {
							color: "success",
						},
						close: false,
					}),
				);
			} else {
				throw new Error(response.message || "Error al guardar cambios");
			}
		} catch (error) {
			console.error("Error al guardar cambios:", error);
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al guardar cambios",
					variant: "alert",
					alert: {
						color: "error",
					},
					close: false,
				}),
			);
		} finally {
			setSavingPreferences(false);
		}
	};

	// Cerrar notificación
	const handleCloseNotification = () => {
		setNotification({
			...notification,
			open: false,
		});
	};

	// Detectar el tipo de dispositivo y mostrar un ícono descriptivo
	const getDeviceDescription = (session: SessionData): string => {
		const deviceType = session.deviceType.toLowerCase();
		if (deviceType.includes("mobile")) return "Teléfono móvil";
		if (deviceType.includes("tablet")) return "Tablet";
		return "Computadora";
	};

	useEffect(() => {
		// Este efecto solo es para depuración
		console.log("Estado actual de switches:", checked);
		console.log("¿loginAlerts activado?:", checked.includes("ln"));
	}, [checked]);

	return (
		<Grid container spacing={3}>
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

			<Grid item xs={12}>
				<MainCard title="Información de cuenta">
					<Grid container spacing={3}>
						<Grid item xs={12}>
							<Stack spacing={1.25}>
								<InputLabel htmlFor="my-account-email">Correo electrónico</InputLabel>
								<TextField
									fullWidth
									value={email}
									onChange={handleEmailChange}
									id="my-account-email"
									placeholder="Correo electrónico"
									autoFocus
									error={!!emailError}
									helperText={emailError}
								/>
								{emailChanged && (
									<Typography variant="caption" color="primary">
										*Se han realizado cambios. No olvide guardar para aplicarlos.
									</Typography>
								)}
							</Stack>
						</Grid>
					</Grid>
				</MainCard>
			</Grid>
			<Grid item xs={12}>
				<MainCard title="Configuración de seguridad" content={false}>
					<List sx={{ p: 0 }}>
						<ListItem divider>
							<ListItemText id="switch-list-label-sb" primary="Navegación segura" secondary="Usar HTTPS cuando esté disponible" />
							<Switch
								edge="end"
								onChange={handleToggle("sb")}
								checked={checked.indexOf("sb") !== -1}
								inputProps={{
									"aria-labelledby": "switch-list-label-sb",
								}}
							/>
						</ListItem>
						<ListItem divider>
							<ListItemText
								id="switch-list-label-ln"
								primary="Notificaciones de inicio de sesión"
								secondary="Recibir alertas cuando se inicie sesión desde un nuevo dispositivo"
							/>
							<Switch
								edge="end"
								onChange={handleToggle("ln")}
								checked={checked.indexOf("ln") !== -1}
								inputProps={{
									"aria-labelledby": "switch-list-label-ln",
								}}
							/>
						</ListItem>
						<ListItem>
							<ListItemText
								id="switch-list-label-la"
								primary="Verificación en dos pasos"
								secondary="Refuerza la seguridad de tu cuenta con verificación adicional"
							/>
							<Switch
								disabled={true}
								edge="end"
								onChange={handleToggle("la")}
								checked={checked.indexOf("la") !== -1}
								inputProps={{
									"aria-labelledby": "switch-list-label-la",
								}}
							/>
						</ListItem>
					</List>
				</MainCard>
			</Grid>
			<Grid item xs={12}>
				<MainCard title="Sesiones activas" content={false}>
					{loadingSessions ? (
						<Box sx={{ display: "flex", justifyContent: "center", p: 3 }}>
							<CircularProgress />
						</Box>
					) : sessionError ? (
						<Box sx={{ p: 2 }}>
							<Alert severity="error">{sessionError}</Alert>
						</Box>
					) : sessions.length === 0 ? (
						<Box sx={{ p: 2 }}>
							<Alert severity="info">No hay sesiones activas</Alert>
						</Box>
					) : (
						<>
							<List sx={{ p: 0 }}>
								{sessions.map((session) => (
									<ListItem key={session.deviceId} divider>
										<ListItemText
											primary={<Typography variant="h5">{getDeviceDescription(session)}</Typography>}
											secondary={
												<Stack spacing={0.5} mt={0.5}>
													<Typography variant="body2">
														{session.os} • {session.browser}
													</Typography>
													<Typography variant="caption" color="secondary">
														IP: {session.ip || "Desconocida"} •{" "}
														{session.isCurrentSession ? "Sesión actual" : `Última actividad: ${formatLastActivity(session.lastActivity)}`}
													</Typography>
													{session.location && (
														<Typography variant="caption" color="textSecondary">
															Ubicación: {session.location}
														</Typography>
													)}
												</Stack>
											}
										/>
										{session.isCurrentSession ? (
											<Button disabled>Sesión actual</Button>
										) : (
											<Button color="error" onClick={() => handleCloseSession(session.deviceId, session.isCurrentSession)}>
												Cerrar sesión
											</Button>
										)}
									</ListItem>
								))}
							</List>
							{sessions.length > 1 && (
								<Box sx={{ p: 2, display: "flex", justifyContent: "center" }}>
									<Button color="error" variant="contained" onClick={handleCloseAllSessions}>
										Cerrar todas las demás sesiones
									</Button>
								</Box>
							)}
						</>
					)}
				</MainCard>
			</Grid>

			<Grid item xs={12}>
				<MainCard title="Preferencias de cuenta" content={false}>
					<List sx={{ p: 0 }}>
						<ListItem divider>
							{!editingTimeZone ? (
								<>
									<ListItemText primary="Zona horaria" secondary={getTimeZoneLabel()} />
									<Button size="small" onClick={toggleTimeZoneEdit}>
										Cambiar
									</Button>
								</>
							) : (
								<>
									<ListItemText
										primary="Zona horaria"
										secondary={
											<FormControl sx={{ mt: 1, minWidth: 250 }}>
												<Select value={timeZone} onChange={(e) => setTimeZone(e.target.value)} size="small" fullWidth>
													{timeZones.map((option) => (
														<MenuItem key={option.value} value={option.value}>
															{option.label}
														</MenuItem>
													))}
												</Select>
											</FormControl>
										}
									/>
									<Button size="small" onClick={toggleTimeZoneEdit}>
										Aceptar
									</Button>
								</>
							)}
						</ListItem>
						<ListItem>
							{!editingDateFormat ? (
								<>
									<ListItemText primary="Formato de fecha" secondary={getDateFormatLabel()} />
									<Button size="small" onClick={toggleDateFormatEdit}>
										Cambiar
									</Button>
								</>
							) : (
								<>
									<ListItemText
										primary="Formato de fecha"
										secondary={
											<FormControl sx={{ mt: 1, minWidth: 250 }}>
												<Select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} size="small" fullWidth>
													{dateFormats.map((option) => (
														<MenuItem key={option.value} value={option.value}>
															{option.label}
														</MenuItem>
													))}
												</Select>
											</FormControl>
										}
									/>
									<Button size="small" onClick={toggleDateFormatEdit}>
										Aceptar
									</Button>
								</>
							)}
						</ListItem>
					</List>
				</MainCard>
			</Grid>

			<Grid item xs={12}>
				<Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={2}>
					<Button
						color="secondary"
						onClick={() => {
							// Revertir cambios
							setTimeZone(originalTimeZone);
							setDateFormat(originalDateFormat);
							setEmail(originalEmail);
							setEmailChanged(false);
							setEmailError(null);
							setEditingTimeZone(false);
							setEditingDateFormat(false);
						}}
					>
						Cancelar
					</Button>
					<Button
						variant="contained"
						onClick={saveChanges}
						disabled={savingPreferences || (emailChanged && !!emailError)}
						startIcon={savingPreferences ? <CircularProgress size={20} /> : null}
					>
						{savingPreferences ? "Guardando..." : "Guardar"}
					</Button>
				</Stack>
			</Grid>

			<Grid item xs={12}>
				<MainCard title="Desactivar cuenta" sx={{ borderColor: "error.light" }}>
					{!showDeactivateForm ? (
						<Stack spacing={2}>
							<Typography variant="body1">
								Al desactivar tu cuenta, tu perfil y datos serán marcados como inactivos, pero no se eliminarán permanentemente. Podrás
								reactivar tu cuenta en el futuro si lo deseas.
							</Typography>
							<List sx={{ listStyleType: "disc", pl: 4 }}>
								<ListItem sx={{ display: "list-item", p: 0 }}>
									<Typography variant="body2">No podrás acceder a la plataforma hasta que reactives tu cuenta</Typography>
								</ListItem>
								<ListItem sx={{ display: "list-item", p: 0 }}>
									<Typography variant="body2">Tus documentos y archivos se conservan</Typography>
								</ListItem>
								<ListItem sx={{ display: "list-item", p: 0 }}>
									<Typography variant="body2">Tus configuraciones y preferencias se mantienen</Typography>
								</ListItem>
							</List>
							<Box sx={{ display: "flex", justifyContent: "center", mt: 1 }}>
								<Button variant="contained" color="error" onClick={() => setShowDeactivateForm(true)}>
									Desactivar mi cuenta
								</Button>
							</Box>
						</Stack>
					) : (
						<Stack spacing={2}>
							<Typography variant="body1">
								Por favor, confirma que deseas desactivar tu cuenta. Esto cerrará todas tus sesiones activas y no podrás acceder a la
								plataforma hasta que decidas reactivarla.
							</Typography>

							{deactivateError && (
								<Alert severity="error" sx={{ mb: 2 }}>
									{deactivateError}
								</Alert>
							)}

							<FormControl fullWidth margin="normal">
								<Typography variant="subtitle2" gutterBottom>
									Nos gustaría saber por qué te vas. ¿Cuál es el motivo principal?
								</Typography>
								<Select
									value={deactivateFormData.reason}
									onChange={(e) => setDeactivateFormData({ ...deactivateFormData, reason: e.target.value })}
									fullWidth
									size="small"
									displayEmpty
									renderValue={(selected) => {
										if (!selected) {
											return <em>Seleccionar motivo</em>;
										}
										const selectedReason = deactivationReasons.find((r) => r.value === selected);
										return selectedReason ? selectedReason.label : "";
									}}
								>
									{deactivationReasons.map((option) => (
										<MenuItem key={option.value} value={option.value}>
											{option.label}
										</MenuItem>
									))}
								</Select>
							</FormControl>

							{deactivateFormData.reason === "other" && (
								<TextField
									fullWidth
									margin="normal"
									label="Especifica el motivo"
									multiline
									rows={2}
									name="otherReason"
									value={deactivateFormData.otherReason}
									onChange={handleDeactivateFormChange}
								/>
							)}

							<FormControl fullWidth margin="normal">
								<Typography variant="subtitle2" gutterBottom>
									Introduce tu contraseña para confirmar la desactivación
								</Typography>
								<TextField
									type="password"
									label="Contraseña"
									name="password"
									value={deactivateFormData.password}
									onChange={handleDeactivateFormChange}
									fullWidth
									required
									error={!!deactivateError}
								/>
							</FormControl>

							<Box sx={{ mt: 3, display: "flex", justifyContent: "flex-end" }}>
								<Button variant="outlined" onClick={() => setShowDeactivateForm(false)} sx={{ mr: 2 }}>
									Cancelar
								</Button>
								<Button
									variant="contained"
									color="error"
									onClick={handleOpenDeactivateConfirmDialog}
									disabled={deactivateLoading || !deactivateFormData.password}
								>
									Desactivar cuenta
								</Button>
							</Box>
						</Stack>
					)}
				</MainCard>
			</Grid>

			{/* Diálogo de confirmación de desactivación */}
			<Dialog open={showDeactivateConfirmDialog} onClose={handleCloseDeactivateConfirmDialog}>
				<DialogTitle>Confirmar desactivación</DialogTitle>
				<DialogContent>
					<DialogContentText>
						¿Estás completamente seguro de que deseas desactivar tu cuenta? Tu sesión actual se cerrará y tendrás que iniciar sesión de
						nuevo para reactivarla.
					</DialogContentText>
				</DialogContent>
				<DialogActions>
					<Button onClick={handleCloseDeactivateConfirmDialog} disabled={deactivateLoading}>
						Cancelar
					</Button>
					<Button
						onClick={handleDeactivateAccount}
						color="error"
						disabled={deactivateLoading}
						startIcon={deactivateLoading ? <CircularProgress size={20} /> : null}
					>
						{deactivateLoading ? "Procesando..." : "Sí, desactivar mi cuenta"}
					</Button>
				</DialogActions>
			</Dialog>
		</Grid>
	);
};

export default TabAccount;

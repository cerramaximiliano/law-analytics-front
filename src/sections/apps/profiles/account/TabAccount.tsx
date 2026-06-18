import React from "react";
import { useState, useEffect } from "react";
import { useSelector } from "store";
import dayjs from "utils/dayjs-config";
import useBankingDisplay from "hooks/useBankingDisplay";

// material-ui
import {
	Box,
	Button,
	CircularProgress,
	Dialog,
	DialogActions,
	DialogContent,
	FormControl,
	Grid,
	IconButton,
	InputLabel,
	MenuItem,
	Select,
	Stack,
	Switch,
	TextField,
	Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// project-imports
import MainCard from "components/MainCard";
import sessionService from "store/reducers/sessionService";
import ApiService, { UserPreferences } from "store/reducers/ApiService";
import { dispatch } from "store";
import { openSnackbar } from "store/reducers/snackbar";

// icons
import {
	CloseSquare,
	Lock,
	Monitor,
	Mobile,
	DeviceMessage,
	Setting2,
	Calendar1,
	Warning2,
	ShieldCross,
	ProfileCircle,
	GlobalSearch,
} from "iconsax-react";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

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

interface ExtendedUserPreferences extends UserPreferences {
	email?: string;
}

const timeZones = [
	{ value: "America/Argentina/Buenos_Aires", label: "(GMT-03:00) Buenos Aires" },
	{ value: "America/Argentina/Cordoba", label: "(GMT-03:00) Córdoba" },
	{ value: "America/Argentina/Jujuy", label: "(GMT-03:00) Jujuy" },
	{ value: "America/Argentina/Mendoza", label: "(GMT-03:00) Mendoza" },
	{ value: "America/Argentina/San_Luis", label: "(GMT-03:00) San Luis" },
	{ value: "America/Buenos_Aires", label: "(GMT-03:00) Buenos Aires (legacy)" },
	{ value: "America/New_York", label: "(GMT-05:00) Nueva York" },
	{ value: "America/Chicago", label: "(GMT-06:00) Chicago" },
	{ value: "America/Denver", label: "(GMT-07:00) Denver" },
	{ value: "America/Los_Angeles", label: "(GMT-08:00) Los Ángeles" },
	{ value: "Europe/London", label: "(GMT+00:00) Londres" },
	{ value: "Europe/Madrid", label: "(GMT+01:00) Madrid" },
	{ value: "Asia/Dubai", label: "(GMT+04:00) Dubai" },
	{ value: "Asia/Shanghai", label: "(GMT+08:00) Shanghai" },
	{ value: "Asia/Tokyo", label: "(GMT+09:00) Tokio" },
	{ value: "Australia/Sydney", label: "(GMT+10:00) Sídney" },
];

const dateFormats = [
	{ value: "DD/MM/YYYY", label: "DD/MM/AAAA (31/12/2023)" },
	{ value: "MM/DD/YYYY", label: "MM/DD/AAAA (12/31/2023)" },
	{ value: "YYYY-MM-DD", label: "AAAA-MM-DD (2023-12-31)" },
	{ value: "DD-MM-YYYY", label: "DD-MM-AAAA (31-12-2023)" },
	{ value: "YYYY/MM/DD", label: "AAAA/MM/DD (2023/12/31)" },
	{ value: "DD.MM.YYYY", label: "DD.MM.AAAA (31.12.2023)" },
];

const deactivationReasons = [
	{ value: "no_longer_needed", label: "Ya no necesito la cuenta" },
	{ value: "too_complex", label: "La aplicación es demasiado compleja de usar" },
	{ value: "found_alternative", label: "Encontré una alternativa mejor" },
	{ value: "privacy_concerns", label: "Preocupaciones de privacidad" },
	{ value: "other", label: "Otro motivo" },
];

// ── Brand section helpers ─────────────────────────────────────────────────────

const SectionCard = ({
	eyebrow,
	title,
	subtitle,
	icon,
	children,
	tone = "primary",
}: {
	eyebrow: string;
	title: string;
	subtitle?: string;
	icon: React.ReactNode;
	children: React.ReactNode;
	tone?: "primary" | "error";
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const color = tone === "error" ? theme.palette.error.main : BRAND_BLUE;
	return (
		<Box
			sx={{
				borderRadius: 2,
				border: `1px solid ${alpha(color, isDark ? 0.18 : 0.1)}`,
				bgcolor: "background.paper",
				overflow: "hidden",
			}}
		>
			<Box
				sx={{
					px: { xs: 2, sm: 2.5 },
					py: 1.75,
					bgcolor: alpha(color, isDark ? 0.05 : 0.025),
					borderBottom: `1px solid ${alpha(color, isDark ? 0.16 : 0.1)}`,
				}}
			>
				<Stack direction="row" spacing={1.25} alignItems="center">
					<Box
						sx={{
							width: 32,
							height: 32,
							borderRadius: 1,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(color, isDark ? 0.16 : 0.08),
							border: `1px solid ${alpha(color, isDark ? 0.28 : 0.18)}`,
							color,
							flexShrink: 0,
						}}
					>
						{icon}
					</Box>
					<Stack spacing={0.125}>
						<Stack direction="row" spacing={0.625} alignItems="center">
							<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: color }} />
							<Typography
								sx={{
									fontSize: "0.6rem",
									fontWeight: 600,
									letterSpacing: "0.08em",
									textTransform: "uppercase",
									color: "text.secondary",
								}}
							>
								{eyebrow}
							</Typography>
						</Stack>
						<Typography sx={{ fontSize: "0.95rem", fontWeight: 600, letterSpacing: "-0.01em", color: "text.primary" }}>{title}</Typography>
						{subtitle && (
							<Typography sx={{ fontSize: "0.74rem", color: "text.secondary", letterSpacing: "-0.005em" }}>{subtitle}</Typography>
						)}
					</Stack>
				</Stack>
			</Box>
			<Box sx={{ p: { xs: 2, sm: 2.5 } }}>{children}</Box>
		</Box>
	);
};

const DialogBrandHeader = ({
	eyebrow,
	title,
	subtitle,
	icon,
	onClose,
	tone = "primary",
}: {
	eyebrow: string;
	title: string;
	subtitle?: string;
	icon: React.ReactNode;
	onClose: () => void;
	tone?: "primary" | "error";
}) => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const color = tone === "error" ? theme.palette.error.main : BRAND_BLUE;
	return (
		<Box
			sx={{
				position: "relative",
				overflow: "hidden",
				p: { xs: 2.25, sm: 2.5 },
				bgcolor: alpha(color, isDark ? 0.06 : 0.035),
				borderBottom: `1px solid ${alpha(color, isDark ? 0.18 : 0.1)}`,
			}}
		>
			<Box
				sx={{
					position: "absolute",
					top: -60,
					right: -40,
					width: 220,
					height: 220,
					borderRadius: "50%",
					background: `radial-gradient(circle, ${alpha(color, isDark ? 0.22 : 0.12)} 0%, transparent 70%)`,
					pointerEvents: "none",
				}}
			/>
			<Stack direction="row" alignItems="center" spacing={1.5} sx={{ position: "relative" }}>
				<Box
					sx={{
						width: 40,
						height: 40,
						borderRadius: 1.5,
						display: "flex",
						alignItems: "center",
						justifyContent: "center",
						bgcolor: alpha(color, isDark ? 0.18 : 0.1),
						border: `1px solid ${alpha(color, isDark ? 0.28 : 0.18)}`,
						color,
						flexShrink: 0,
					}}
				>
					{icon}
				</Box>
				<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
					<Stack direction="row" spacing={0.75} alignItems="center">
						<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: color }} />
						<Typography
							sx={{
								fontSize: "0.6rem",
								fontWeight: 600,
								letterSpacing: "0.08em",
								textTransform: "uppercase",
								color: "text.secondary",
							}}
						>
							{eyebrow}
						</Typography>
					</Stack>
					<Typography sx={{ fontSize: "1.05rem", fontWeight: 600, letterSpacing: "-0.015em", color: "text.primary" }}>{title}</Typography>
					{subtitle && (
						<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
							{subtitle}
						</Typography>
					)}
				</Stack>
				<IconButton
					onClick={onClose}
					sx={{
						color: "text.secondary",
						borderRadius: 1,
						"&:hover": { color: BRAND_BLUE, bgcolor: alpha(BRAND_BLUE, isDark ? 0.12 : 0.08) },
					}}
					aria-label="cerrar"
				>
					<CloseSquare size={20} variant="Linear" />
				</IconButton>
			</Stack>
		</Box>
	);
};

// ==============================|| TAB ACCOUNT ||============================== //

const TabAccount = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";
	const errorColor = theme.palette.error.main;
	const showBankingData = useBankingDisplay();
	const [checked, setChecked] = useState(["ln", "la"]);
	const auth = useSelector((state) => state.auth);
	const email = auth.user?.email || "";

	const [timeZone, setTimeZone] = useState("");
	const [dateFormat, setDateFormat] = useState("DD/MM/YYYY");
	const [originalTimeZone, setOriginalTimeZone] = useState("");
	const [originalDateFormat, setOriginalDateFormat] = useState("DD/MM/YYYY");

	const [editingTimeZone, setEditingTimeZone] = useState(false);
	const [editingDateFormat, setEditingDateFormat] = useState(false);

	const [sessions, setSessions] = useState<SessionData[]>([]);
	const [loadingSessions, setLoadingSessions] = useState(true);
	const [sessionError, setSessionError] = useState<string | null>(null);

	const [savingPreferences, setSavingPreferences] = useState(false);
	const [preferences, setPreferences] = useState<ExtendedUserPreferences | null>(null);

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

	const [sessionToClose, setSessionToClose] = useState<{ deviceId: string; isCurrentSession: boolean } | null>(null);
	const [showCloseSessionDialog, setShowCloseSessionDialog] = useState(false);
	const [showCloseAllSessionsDialog, setShowCloseAllSessionsDialog] = useState(false);
	const [closingSession, setClosingSession] = useState(false);

	const loadUserPreferences = async () => {
		try {
			const response = await ApiService.getUserPreferences();
			if (response.success && response.data) {
				const responseData = response.data as any;
				const userPrefs: UserPreferences = {
					timeZone: responseData.timeZone || "America/Argentina/Buenos_Aires",
					dateFormat: responseData.dateFormat || "DD/MM/YYYY",
					language: responseData.language || "es",
					theme: responseData.theme || "light",
					notifications: {
						enabled: Boolean(responseData.enabled || (responseData.notifications && responseData.notifications.enabled) || false),
						loginAlerts: Boolean(
							responseData.loginAlerts || (responseData.notifications && responseData.notifications.loginAlerts) || false,
						),
						otherCommunications: Boolean(
							responseData.otherCommunications || (responseData.notifications && responseData.notifications.otherCommunications) || false,
						),
						channels: responseData.channels ||
							(responseData.notifications && responseData.notifications.channels) || { email: false, browser: false, mobile: false },
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
				const extendedPrefs: ExtendedUserPreferences = { ...userPrefs, email: auth.user?.email || "" };
				setPreferences(extendedPrefs);
				if (userPrefs.timeZone) {
					setTimeZone(userPrefs.timeZone);
					setOriginalTimeZone(userPrefs.timeZone);
				}
				if (userPrefs.dateFormat) {
					setDateFormat(userPrefs.dateFormat);
					setOriginalDateFormat(userPrefs.dateFormat);
				}
				const newChecked = ["la"];
				const loginAlertsValue = Boolean(
					responseData.loginAlerts || (responseData.notifications && responseData.notifications.loginAlerts),
				);
				if (loginAlertsValue !== false) newChecked.push("ln");
				setOriginalChecked([...newChecked]);
				setChecked(newChecked);
			}
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "No se pudieron cargar las preferencias de usuario",
					variant: "alert",
					alert: { color: "error" },
					close: false,
				}),
			);
		}
	};

	const loadSessions = async () => {
		try {
			setLoadingSessions(true);
			setSessionError(null);
			const response = await sessionService.getActiveSessions();
			if (response.success && response.data) {
				const formattedSessions = response.data.map((session) => ({
					...session,
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
		} finally {
			setLoadingSessions(false);
		}
	};

	const handleOpenCloseSessionDialog = (deviceId: string, isCurrentSession: boolean) => {
		setSessionToClose({ deviceId, isCurrentSession });
		setShowCloseSessionDialog(true);
	};

	const handleCloseSessionDialog = () => {
		setShowCloseSessionDialog(false);
		setSessionToClose(null);
	};

	const handleCloseSession = async () => {
		if (!sessionToClose) return;
		try {
			setClosingSession(true);
			const response = await sessionService.terminateSession(sessionToClose.deviceId);
			if (response.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Sesión cerrada correctamente",
						variant: "alert",
						alert: { color: "success" },
						close: false,
					}),
				);
				handleCloseSessionDialog();
				if (response.requireLogin) {
					window.location.href = "/login";
					return;
				}
				loadSessions();
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: response.message || "Error al cerrar la sesión",
						variant: "alert",
						alert: { color: "error" },
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
					alert: { color: "error" },
					close: false,
				}),
			);
		} finally {
			setClosingSession(false);
			handleCloseSessionDialog();
		}
	};

	const handleOpenCloseAllSessionsDialog = () => {
		setShowCloseAllSessionsDialog(true);
	};

	const handleCloseAllSessionsDialog = () => {
		setShowCloseAllSessionsDialog(false);
	};

	const handleCloseAllSessions = async () => {
		try {
			setClosingSession(true);
			const response = await sessionService.terminateAllOtherSessions();
			if (response.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Todas las demás sesiones han sido cerradas",
						variant: "alert",
						alert: { color: "success" },
						close: false,
					}),
				);
				handleCloseAllSessionsDialog();
				loadSessions();
			} else {
				dispatch(
					openSnackbar({
						open: true,
						message: "Error al cerrar las sesiones",
						variant: "alert",
						alert: { color: "error" },
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
					alert: { color: "error" },
					close: false,
				}),
			);
		} finally {
			setClosingSession(false);
			handleCloseAllSessionsDialog();
		}
	};

	const handleDeactivateFormChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
		const { name, value } = e.target;
		setDeactivateFormData((prev) => ({ ...prev, [name]: value }));
	};

	const validateDeactivateForm = () => {
		if (!deactivateFormData.password) {
			setDeactivateError("Por favor, introducí tu contraseña para confirmar la desactivación");
			return false;
		}
		setDeactivateError(null);
		return true;
	};

	const handleOpenDeactivateConfirmDialog = () => {
		if (validateDeactivateForm()) setShowDeactivateConfirmDialog(true);
	};

	const handleCloseDeactivateConfirmDialog = () => {
		setShowDeactivateConfirmDialog(false);
	};

	const handleDeactivateAccount = async () => {
		try {
			setDeactivateLoading(true);
			setDeactivateError(null);
			const finalReason =
				deactivateFormData.reason === "other"
					? deactivateFormData.otherReason
					: deactivateFormData.reason
					? deactivationReasons.find((r) => r.value === deactivateFormData.reason)?.label
					: "";
			const response = await sessionService.deactivateAccount({
				password: deactivateFormData.password,
				reason: finalReason,
				reasonCode: deactivateFormData.reason || undefined,
				otherReason: deactivateFormData.reason === "other" ? deactivateFormData.otherReason : undefined,
			});
			setDeactivateLoading(false);
			if (response.success) {
				dispatch(
					openSnackbar({
						open: true,
						message: "Cuenta desactivada correctamente. Serás redirigido a la página de inicio de sesión.",
						variant: "alert",
						alert: { color: "success" },
						close: false,
					}),
				);
				setShowDeactivateConfirmDialog(false);
				setShowDeactivateForm(false);
				setTimeout(() => {
					window.location.href = "/login";
				}, 2000);
			} else {
				setShowDeactivateConfirmDialog(false);
				setDeactivateError(response.message || "Error al desactivar la cuenta");
			}
		} catch (error) {
			setDeactivateLoading(false);
			setShowDeactivateConfirmDialog(false);
			if (typeof error === "string") setDeactivateError(error);
			else if (error instanceof Error) setDeactivateError(error.message);
			else setDeactivateError("Error al desactivar la cuenta");
		}
	};

	const formatLastActivity = (dateString: string): string => {
		try {
			const date = new Date(dateString);
			if (isNaN(date.getTime())) return "Desconocido";
			return dayjs(date).fromNow();
		} catch (err) {
			return "Fecha desconocida";
		}
	};

	useEffect(() => {
		const browserTimeZone = Intl.DateTimeFormat().resolvedOptions().timeZone;
		const foundTimeZone = timeZones.find((tz) => tz.value === browserTimeZone);
		if (foundTimeZone) {
			setTimeZone(foundTimeZone.value);
			setOriginalTimeZone(foundTimeZone.value);
		} else {
			setTimeZone("America/Argentina/Buenos_Aires");
			setOriginalTimeZone("America/Argentina/Buenos_Aires");
		}
		loadSessions();
		loadUserPreferences();
	}, []);

	const getTimeZoneLabel = () => {
		const found = timeZones.find((tz) => tz.value === timeZone);
		return found ? found.label : "";
	};

	const getDateFormatLabel = () => {
		const found = dateFormats.find((df) => df.value === dateFormat);
		return found ? found.label : "";
	};

	const handleToggle = (value: string) => () => {
		const currentIndex = checked.indexOf(value);
		const newChecked = [...checked];
		if (currentIndex === -1) newChecked.push(value);
		else newChecked.splice(currentIndex, 1);
		setChecked(newChecked);
	};

	const toggleTimeZoneEdit = () => setEditingTimeZone(!editingTimeZone);
	const toggleDateFormatEdit = () => setEditingDateFormat(!editingDateFormat);

	const saveChanges = async () => {
		try {
			setSavingPreferences(true);
			if (!preferences) return;
			const hasTimeZoneChanged = timeZone !== originalTimeZone;
			const hasDateFormatChanged = dateFormat !== originalDateFormat;
			const hasLoginNotificationChanged =
				(checked.includes("ln") && !originalChecked.includes("ln")) || (!checked.includes("ln") && originalChecked.includes("ln"));

			if (!hasTimeZoneChanged && !hasDateFormatChanged && !hasLoginNotificationChanged) {
				dispatch(
					openSnackbar({
						open: true,
						message: "No hay cambios para guardar",
						variant: "alert",
						alert: { color: "info" },
						close: false,
					}),
				);
				setSavingPreferences(false);
				return;
			}

			const updatedPreferences: Record<string, any> = {};
			if (hasTimeZoneChanged) updatedPreferences.timeZone = timeZone;
			if (hasDateFormatChanged) updatedPreferences.dateFormat = dateFormat;
			if (hasLoginNotificationChanged) updatedPreferences.loginAlerts = checked.includes("ln");

			const response = await ApiService.updateUserPreferences(updatedPreferences as Partial<UserPreferences>);

			if (response.success && response.data) {
				const responseData = response.data as any;
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
				const extendedData: ExtendedUserPreferences = { ...updatedUserPrefs, email: preferences.email };
				setPreferences(extendedData);
				setOriginalTimeZone(timeZone);
				setOriginalDateFormat(dateFormat);
				setOriginalChecked([...checked]);
				setEditingTimeZone(false);
				setEditingDateFormat(false);
				dispatch(
					openSnackbar({
						open: true,
						message: "Cambios guardados correctamente",
						variant: "alert",
						alert: { color: "success" },
						close: false,
					}),
				);
			} else {
				throw new Error(response.message || "Error al guardar cambios");
			}
		} catch (error) {
			dispatch(
				openSnackbar({
					open: true,
					message: "Error al guardar cambios",
					variant: "alert",
					alert: { color: "error" },
					close: false,
				}),
			);
		} finally {
			setSavingPreferences(false);
		}
	};

	const getDeviceIcon = (session: SessionData) => {
		const deviceType = session.deviceType.toLowerCase();
		if (deviceType.includes("mobile")) return <Mobile size={16} variant="Bulk" />;
		if (deviceType.includes("tablet")) return <DeviceMessage size={16} variant="Bulk" />;
		return <Monitor size={16} variant="Bulk" />;
	};

	const getDeviceDescription = (session: SessionData): string => {
		const deviceType = session.deviceType.toLowerCase();
		if (deviceType.includes("mobile")) return "Teléfono móvil";
		if (deviceType.includes("tablet")) return "Tablet";
		return "Computadora";
	};

	// ── Brand helpers ─────────────────────────────────────────────────────────

	const labelSx = {
		fontSize: "0.72rem",
		fontWeight: 600,
		letterSpacing: "0.04em",
		textTransform: "uppercase" as const,
		color: "text.secondary",
	};
	const inputSx = {
		"& .MuiOutlinedInput-root": {
			borderRadius: 1.25,
			fontSize: "0.875rem",
			"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14) },
			"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
			"&.Mui-focused fieldset": { borderColor: BRAND_BLUE, borderWidth: 1 },
		},
	};
	const selectSx = {
		borderRadius: 1.25,
		fontSize: "0.875rem",
		"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14) },
		"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
		"&.Mui-focused fieldset": { borderColor: BRAND_BLUE },
	};
	const ghostBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: "text.secondary",
		borderRadius: 1.25,
		border: `1px solid ${alpha(theme.palette.text.primary, isDark ? 0.14 : 0.1)}`,
		px: 2,
		py: 0.75,
		transition: "color 0.15s ease, background-color 0.15s ease, border-color 0.15s ease",
		"&:hover": {
			color: BRAND_BLUE,
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
			borderColor: alpha(BRAND_BLUE, 0.28),
		},
	};
	const brandPrimarySx = {
		minWidth: 120,
		textTransform: "none" as const,
		bgcolor: BRAND_BLUE,
		color: "#fff",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		boxShadow: "none",
		transition: "background-color 0.15s ease",
		"&:hover": { bgcolor: alpha(BRAND_BLUE, 0.88), boxShadow: "none" },
		"&.Mui-disabled": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.24 : 0.4), color: alpha("#fff", 0.9) },
	};
	const destructiveBtnSx = {
		minWidth: 130,
		textTransform: "none" as const,
		bgcolor: errorColor,
		color: "#fff",
		fontWeight: 600,
		letterSpacing: "-0.005em",
		borderRadius: 1.25,
		boxShadow: "none",
		transition: "background-color 0.15s ease",
		"&:hover": { bgcolor: alpha(errorColor, 0.88), boxShadow: "none" },
		"&.Mui-disabled": { bgcolor: alpha(errorColor, isDark ? 0.24 : 0.4), color: alpha("#fff", 0.9) },
	};
	const destructiveGhostBtnSx = {
		textTransform: "none" as const,
		fontWeight: 600,
		letterSpacing: "-0.005em",
		color: errorColor,
		borderRadius: 1.25,
		border: `1px solid ${alpha(errorColor, isDark ? 0.32 : 0.22)}`,
		px: 1.75,
		py: 0.5,
		fontSize: "0.78rem",
		"&:hover": {
			bgcolor: alpha(errorColor, isDark ? 0.14 : 0.08),
			borderColor: alpha(errorColor, isDark ? 0.5 : 0.36),
		},
	};
	const dialogPaperSx = {
		borderRadius: 2,
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.22 : 0.14)}`,
		boxShadow: `0 16px 40px ${alpha(BRAND_BLUE, isDark ? 0.32 : 0.18)}`,
		overflow: "hidden",
	};
	const switchSx = {
		"& .MuiSwitch-switchBase.Mui-checked": {
			color: BRAND_BLUE,
			"& .MuiSwitch-thumb": { backgroundColor: BRAND_BLUE, color: BRAND_BLUE },
			"& + .MuiSwitch-track": { backgroundColor: `${BRAND_BLUE} !important`, opacity: 0.5 },
		},
	};

	const rowSx = {
		display: "flex",
		alignItems: "center",
		gap: 1.5,
		py: 1.25,
		"&:not(:last-child)": { borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.08 : 0.05)}` },
	};

	return (
		<Stack spacing={2.5}>
			{/* 1. Información de cuenta */}
			<SectionCard
				eyebrow="Cuenta"
				title="Información de cuenta"
				subtitle="Datos básicos de tu acceso"
				icon={<ProfileCircle size={16} variant="Bulk" />}
			>
				<Stack spacing={0.75}>
					<InputLabel htmlFor="my-account-email" sx={labelSx}>
						Correo electrónico
					</InputLabel>
					<TextField
						fullWidth
						value={email}
						id="my-account-email"
						placeholder="Correo electrónico"
						disabled
						InputProps={{ readOnly: true }}
						sx={inputSx}
					/>
					<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
						El correo no puede modificarse. Contactá a soporte para cambiarlo.
					</Typography>
				</Stack>
			</SectionCard>

			{/* 2. Configuración de seguridad */}
			<SectionCard
				eyebrow="Seguridad"
				title="Configuración de seguridad"
				subtitle="Resguardo de tu acceso y notificaciones"
				icon={<Lock size={16} variant="Bulk" />}
			>
				<Box sx={rowSx}>
					<Box
						sx={{
							width: 30,
							height: 30,
							borderRadius: 1,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(LIVE_GREEN, isDark ? 0.14 : 0.08),
							border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.28 : 0.18)}`,
							color: LIVE_GREEN,
							flexShrink: 0,
						}}
					>
						<GlobalSearch size={14} variant="Bulk" />
					</Box>
					<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
						<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
							Navegación segura
						</Typography>
						<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
							La conexión con Law Analytics siempre usa HTTPS.
						</Typography>
					</Stack>
					<Box
						sx={{
							display: "inline-flex",
							alignItems: "center",
							gap: 0.5,
							px: 0.75,
							py: 0.25,
							borderRadius: 0.75,
							bgcolor: alpha(LIVE_GREEN, isDark ? 0.16 : 0.1),
							border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.32 : 0.22)}`,
						}}
					>
						<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: LIVE_GREEN }} />
						<Typography sx={{ fontSize: "0.66rem", fontWeight: 600, color: LIVE_GREEN, letterSpacing: "0.04em", lineHeight: 1 }}>
							Activo
						</Typography>
					</Box>
				</Box>

				<Box sx={rowSx}>
					<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
						<Typography id="switch-list-label-ln" sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
							Notificaciones de inicio de sesión
						</Typography>
						<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
							Recibir alertas cuando se inicie sesión desde un nuevo dispositivo
						</Typography>
					</Stack>
					<Switch
						edge="end"
						onChange={handleToggle("ln")}
						checked={checked.indexOf("ln") !== -1}
						inputProps={{ "aria-labelledby": "switch-list-label-ln" }}
						sx={switchSx}
					/>
				</Box>

				<Box sx={rowSx}>
					<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
						<Stack direction="row" alignItems="center" spacing={0.75}>
							<Typography
								id="switch-list-label-la"
								sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}
							>
								Verificación en dos pasos
							</Typography>
							<Box
								sx={{
									px: 0.625,
									py: 0.125,
									borderRadius: 0.5,
									bgcolor: alpha(STALE_AMBER, isDark ? 0.16 : 0.1),
									border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
								}}
							>
								<Typography sx={{ fontSize: "0.6rem", fontWeight: 600, color: STALE_AMBER, letterSpacing: "0.04em", lineHeight: 1.4 }}>
									Próximamente
								</Typography>
							</Box>
						</Stack>
						<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
							Reforzá la seguridad de tu cuenta con verificación adicional
						</Typography>
					</Stack>
					<Switch
						disabled
						edge="end"
						onChange={handleToggle("la")}
						checked={checked.indexOf("la") !== -1}
						inputProps={{ "aria-labelledby": "switch-list-label-la" }}
						sx={switchSx}
					/>
				</Box>
			</SectionCard>

			{/* 3. Sesiones activas */}
			<SectionCard
				eyebrow="Dispositivos"
				title="Sesiones activas"
				subtitle="Dispositivos con acceso reciente a tu cuenta"
				icon={<Monitor size={16} variant="Bulk" />}
			>
				{loadingSessions ? (
					<Stack alignItems="center" justifyContent="center" sx={{ py: 3 }} spacing={1.25}>
						<CircularProgress size={28} sx={{ color: BRAND_BLUE }} />
						<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
							Cargando sesiones…
						</Typography>
					</Stack>
				) : sessionError ? (
					<Box
						sx={{
							p: 1.5,
							borderRadius: 1.25,
							bgcolor: alpha(errorColor, isDark ? 0.08 : 0.04),
							border: `1px solid ${alpha(errorColor, isDark ? 0.32 : 0.22)}`,
						}}
					>
						<Stack direction="row" spacing={1} alignItems="center">
							<Warning2 size={16} variant="Bulk" color={errorColor} />
							<Typography sx={{ fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em" }}>{sessionError}</Typography>
						</Stack>
					</Box>
				) : sessions.length === 0 ? (
					<Typography sx={{ fontSize: "0.82rem", color: "text.secondary", textAlign: "center", py: 2 }}>
						No hay sesiones activas
					</Typography>
				) : (
					<Stack spacing={1.25}>
						{sessions.map((session) => (
							<Box
								key={session.deviceId}
								sx={{
									p: 1.5,
									borderRadius: 1.5,
									border: `1px solid ${
										session.isCurrentSession ? alpha(LIVE_GREEN, isDark ? 0.32 : 0.22) : alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)
									}`,
									bgcolor: session.isCurrentSession ? alpha(LIVE_GREEN, isDark ? 0.06 : 0.03) : "background.paper",
								}}
							>
								<Stack direction={{ xs: "column", sm: "row" }} alignItems={{ xs: "flex-start", sm: "center" }} spacing={1.5}>
									<Box
										sx={{
											width: 36,
											height: 36,
											borderRadius: 1,
											display: "flex",
											alignItems: "center",
											justifyContent: "center",
											bgcolor: session.isCurrentSession
												? alpha(LIVE_GREEN, isDark ? 0.16 : 0.08)
												: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
											border: `1px solid ${
												session.isCurrentSession ? alpha(LIVE_GREEN, isDark ? 0.32 : 0.22) : alpha(BRAND_BLUE, isDark ? 0.24 : 0.18)
											}`,
											color: session.isCurrentSession ? LIVE_GREEN : BRAND_BLUE,
											flexShrink: 0,
										}}
									>
										{getDeviceIcon(session)}
									</Box>
									<Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
										<Stack direction="row" spacing={0.875} alignItems="center" flexWrap="wrap" useFlexGap>
											<Typography sx={{ fontSize: "0.9rem", fontWeight: 600, letterSpacing: "-0.005em", color: "text.primary" }}>
												{getDeviceDescription(session)}
											</Typography>
											{session.isCurrentSession && (
												<Box
													sx={{
														display: "inline-flex",
														alignItems: "center",
														gap: 0.5,
														px: 0.625,
														py: 0.125,
														borderRadius: 0.5,
														bgcolor: alpha(LIVE_GREEN, isDark ? 0.16 : 0.1),
														border: `1px solid ${alpha(LIVE_GREEN, isDark ? 0.32 : 0.22)}`,
													}}
												>
													<Box sx={{ width: 5, height: 5, borderRadius: "50%", bgcolor: LIVE_GREEN }} />
													<Typography
														sx={{ fontSize: "0.6rem", fontWeight: 600, color: LIVE_GREEN, letterSpacing: "0.04em", lineHeight: 1.4 }}
													>
														Sesión actual
													</Typography>
												</Box>
											)}
										</Stack>
										<Typography sx={{ fontSize: "0.78rem", color: "text.primary", letterSpacing: "-0.005em" }}>
											{session.os} · {session.browser}
										</Typography>
										<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
											{showBankingData
												? `IP: ${session.ip || "Desconocida"}${
														session.isCurrentSession ? "" : ` · Última actividad: ${formatLastActivity(session.lastActivity)}`
												  }`
												: session.isCurrentSession
												? "Conectado ahora"
												: `Última actividad: ${formatLastActivity(session.lastActivity)}`}
										</Typography>
										{showBankingData && session.location && (
											<Typography sx={{ fontSize: "0.7rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
												Ubicación: {session.location}
											</Typography>
										)}
									</Stack>
									{!session.isCurrentSession && (
										<Button
											size="small"
											onClick={() => handleOpenCloseSessionDialog(session.deviceId, session.isCurrentSession)}
											sx={destructiveGhostBtnSx}
										>
											Cerrar sesión
										</Button>
									)}
								</Stack>
							</Box>
						))}
						{sessions.length > 1 && (
							<Stack direction="row" justifyContent="center" sx={{ pt: 0.5 }}>
								<Button
									variant="contained"
									startIcon={<ShieldCross size={15} variant="Linear" />}
									onClick={handleOpenCloseAllSessionsDialog}
									sx={destructiveBtnSx}
								>
									Cerrar todas las demás
								</Button>
							</Stack>
						)}
					</Stack>
				)}
			</SectionCard>

			{/* 4. Preferencias de cuenta */}
			<SectionCard
				eyebrow="Preferencias"
				title="Preferencias de cuenta"
				subtitle="Zona horaria y formato de fecha"
				icon={<Setting2 size={16} variant="Bulk" />}
			>
				{/* Zona horaria */}
				<Box sx={rowSx}>
					<Box
						sx={{
							width: 30,
							height: 30,
							borderRadius: 1,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
							color: BRAND_BLUE,
							flexShrink: 0,
						}}
					>
						<GlobalSearch size={14} variant="Bulk" />
					</Box>
					<Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
						<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
							Zona horaria
						</Typography>
						{!editingTimeZone ? (
							<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
								{getTimeZoneLabel()}
							</Typography>
						) : (
							<FormControl size="small" sx={{ mt: 0.5, maxWidth: 320 }}>
								<Select value={timeZone} onChange={(e) => setTimeZone(e.target.value)} sx={selectSx}>
									{timeZones.map((option) => (
										<MenuItem key={option.value} value={option.value}>
											{option.label}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						)}
					</Stack>
					<Button size="small" onClick={toggleTimeZoneEdit} sx={ghostBtnSx}>
						{editingTimeZone ? "Aceptar" : "Cambiar"}
					</Button>
				</Box>

				{/* Formato de fecha */}
				<Box sx={rowSx}>
					<Box
						sx={{
							width: 30,
							height: 30,
							borderRadius: 1,
							display: "flex",
							alignItems: "center",
							justifyContent: "center",
							bgcolor: alpha(BRAND_BLUE, isDark ? 0.14 : 0.08),
							border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
							color: BRAND_BLUE,
							flexShrink: 0,
						}}
					>
						<Calendar1 size={14} variant="Bulk" />
					</Box>
					<Stack spacing={0.25} sx={{ flex: 1, minWidth: 0 }}>
						<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
							Formato de fecha
						</Typography>
						{!editingDateFormat ? (
							<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
								{getDateFormatLabel()}
							</Typography>
						) : (
							<FormControl size="small" sx={{ mt: 0.5, maxWidth: 320 }}>
								<Select value={dateFormat} onChange={(e) => setDateFormat(e.target.value)} sx={selectSx}>
									{dateFormats.map((option) => (
										<MenuItem key={option.value} value={option.value}>
											{option.label}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						)}
					</Stack>
					<Button size="small" onClick={toggleDateFormatEdit} sx={ghostBtnSx}>
						{editingDateFormat ? "Aceptar" : "Cambiar"}
					</Button>
				</Box>
			</SectionCard>

			{/* Botones globales */}
			<Stack direction="row" justifyContent="flex-end" spacing={1.25}>
				<Button
					onClick={() => {
						setTimeZone(originalTimeZone);
						setDateFormat(originalDateFormat);
						setEditingTimeZone(false);
						setEditingDateFormat(false);
					}}
					sx={ghostBtnSx}
				>
					Cancelar
				</Button>
				<Button
					variant="contained"
					onClick={saveChanges}
					disabled={savingPreferences}
					startIcon={savingPreferences ? <CircularProgress size={14} color="inherit" /> : null}
					sx={brandPrimarySx}
				>
					{savingPreferences ? "Guardando..." : "Guardar"}
				</Button>
			</Stack>

			{/* 5. Desactivar cuenta */}
			<SectionCard
				eyebrow="Zona de riesgo"
				title="Desactivar cuenta"
				subtitle="Pausá tu cuenta sin perder datos"
				icon={<ShieldCross size={16} variant="Bulk" />}
				tone="error"
			>
				{!showDeactivateForm ? (
					<Stack spacing={2}>
						<Typography sx={{ fontSize: "0.85rem", color: "text.primary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
							Al desactivar tu cuenta, tu perfil y datos serán marcados como inactivos, pero no se eliminarán permanentemente. Podrás
							reactivar tu cuenta en el futuro si lo querés.
						</Typography>
						<Box
							sx={{
								p: 1.5,
								borderRadius: 1.25,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.03),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
							}}
						>
							<Stack spacing={0.625}>
								{[
									"No podrás acceder a la plataforma hasta que la reactives",
									"Tus documentos y archivos se conservan",
									"Tus configuraciones y preferencias se mantienen",
								].map((item) => (
									<Stack key={item} direction="row" spacing={1} alignItems="flex-start">
										<Box sx={{ width: 4, height: 4, mt: "8px", borderRadius: "50%", bgcolor: BRAND_BLUE, flexShrink: 0 }} />
										<Typography sx={{ fontSize: "0.8rem", color: "text.primary", letterSpacing: "-0.005em" }}>{item}</Typography>
									</Stack>
								))}
							</Stack>
						</Box>
						<Stack direction="row" justifyContent="center">
							<Button
								variant="contained"
								startIcon={<ShieldCross size={15} variant="Linear" />}
								onClick={() => setShowDeactivateForm(true)}
								sx={destructiveBtnSx}
							>
								Desactivar mi cuenta
							</Button>
						</Stack>
					</Stack>
				) : (
					<Stack spacing={2}>
						<Typography sx={{ fontSize: "0.85rem", color: "text.primary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
							Confirmá que querés desactivar tu cuenta. Esto cerrará todas tus sesiones activas y no podrás acceder a la plataforma hasta
							que decidas reactivarla.
						</Typography>

						{deactivateError && (
							<Box
								sx={{
									p: 1.5,
									borderRadius: 1.25,
									bgcolor: alpha(errorColor, isDark ? 0.08 : 0.04),
									border: `1px solid ${alpha(errorColor, isDark ? 0.32 : 0.22)}`,
								}}
							>
								<Stack direction="row" spacing={1} alignItems="center">
									<Warning2 size={16} variant="Bulk" color={errorColor} />
									<Typography sx={{ fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em" }}>{deactivateError}</Typography>
								</Stack>
							</Box>
						)}

						<Stack spacing={0.75}>
							<InputLabel sx={labelSx}>Motivo principal</InputLabel>
							<FormControl fullWidth size="small">
								<Select
									value={deactivateFormData.reason}
									onChange={(e) => setDeactivateFormData({ ...deactivateFormData, reason: e.target.value })}
									fullWidth
									displayEmpty
									renderValue={(selected) => {
										if (!selected) return <em style={{ color: theme.palette.text.secondary }}>Seleccioná un motivo</em>;
										const selectedReason = deactivationReasons.find((r) => r.value === selected);
										return selectedReason ? selectedReason.label : "";
									}}
									sx={selectSx}
								>
									{deactivationReasons.map((option) => (
										<MenuItem key={option.value} value={option.value}>
											{option.label}
										</MenuItem>
									))}
								</Select>
							</FormControl>
						</Stack>

						{deactivateFormData.reason === "other" && (
							<Stack spacing={0.75}>
								<InputLabel sx={labelSx}>Especificá el motivo</InputLabel>
								<TextField
									fullWidth
									multiline
									rows={2}
									name="otherReason"
									value={deactivateFormData.otherReason}
									onChange={handleDeactivateFormChange}
									sx={inputSx}
								/>
							</Stack>
						)}

						<Stack spacing={0.75}>
							<InputLabel sx={labelSx}>Contraseña</InputLabel>
							<TextField
								type="password"
								name="password"
								value={deactivateFormData.password}
								onChange={handleDeactivateFormChange}
								fullWidth
								required
								error={!!deactivateError}
								autoComplete="current-password"
								placeholder="Introducí tu contraseña para confirmar"
								sx={inputSx}
							/>
						</Stack>

						<Stack direction="row" justifyContent="flex-end" spacing={1.25} sx={{ pt: 0.5 }}>
							<Button onClick={() => setShowDeactivateForm(false)} sx={ghostBtnSx}>
								Cancelar
							</Button>
							<Button
								variant="contained"
								onClick={handleOpenDeactivateConfirmDialog}
								disabled={deactivateLoading || !deactivateFormData.password}
								sx={destructiveBtnSx}
							>
								Desactivar cuenta
							</Button>
						</Stack>
					</Stack>
				)}
			</SectionCard>

			{/* Diálogo confirmación desactivación */}
			<Dialog open={showDeactivateConfirmDialog} onClose={handleCloseDeactivateConfirmDialog} maxWidth="xs" fullWidth PaperProps={{ sx: dialogPaperSx }}>
				<DialogBrandHeader
					eyebrow="Confirmación final"
					title="¿Desactivar la cuenta?"
					subtitle="Tu sesión actual se cerrará y tendrás que iniciar sesión de nuevo para reactivarla."
					icon={<ShieldCross size={20} variant="Bulk" />}
					onClose={handleCloseDeactivateConfirmDialog}
					tone="error"
				/>
				<DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
					<Typography sx={{ fontSize: "0.85rem", color: "text.primary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
						¿Estás completamente seguro de que querés desactivar tu cuenta?
					</Typography>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}` }}>
					<Button onClick={handleCloseDeactivateConfirmDialog} disabled={deactivateLoading} sx={ghostBtnSx}>
						Cancelar
					</Button>
					<Button
						onClick={handleDeactivateAccount}
						disabled={deactivateLoading}
						startIcon={deactivateLoading ? <CircularProgress size={14} color="inherit" /> : null}
						variant="contained"
						sx={destructiveBtnSx}
					>
						{deactivateLoading ? "Procesando..." : "Sí, desactivar"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Diálogo cerrar sesión */}
			<Dialog open={showCloseSessionDialog} onClose={handleCloseSessionDialog} maxWidth="xs" fullWidth PaperProps={{ sx: dialogPaperSx }}>
				<DialogBrandHeader
					eyebrow="Sesión"
					title="Cerrar sesión"
					subtitle={
						sessionToClose?.isCurrentSession
							? "Vas a cerrar tu sesión actual. Te redirigiremos al login."
							: "Vas a cerrar esta sesión en otro dispositivo."
					}
					icon={<ShieldCross size={20} variant="Bulk" />}
					onClose={handleCloseSessionDialog}
					tone="error"
				/>
				<DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
					<Typography sx={{ fontSize: "0.85rem", color: "text.primary", letterSpacing: "-0.005em" }}>
						¿Confirmás que querés cerrar esta sesión?
					</Typography>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}` }}>
					<Button onClick={handleCloseSessionDialog} disabled={closingSession} sx={ghostBtnSx}>
						Cancelar
					</Button>
					<Button
						onClick={handleCloseSession}
						disabled={closingSession}
						variant="contained"
						startIcon={closingSession ? <CircularProgress size={14} color="inherit" /> : null}
						sx={destructiveBtnSx}
					>
						{closingSession ? "Cerrando..." : "Cerrar sesión"}
					</Button>
				</DialogActions>
			</Dialog>

			{/* Diálogo cerrar todas */}
			<Dialog
				open={showCloseAllSessionsDialog}
				onClose={handleCloseAllSessionsDialog}
				maxWidth="xs"
				fullWidth
				PaperProps={{ sx: dialogPaperSx }}
			>
				<DialogBrandHeader
					eyebrow="Sesiones"
					title="Cerrar otras sesiones"
					subtitle="Vas a cerrar todas las sesiones activas excepto la actual."
					icon={<ShieldCross size={20} variant="Bulk" />}
					onClose={handleCloseAllSessionsDialog}
					tone="error"
				/>
				<DialogContent sx={{ p: { xs: 2.5, sm: 3 } }}>
					<Typography sx={{ fontSize: "0.85rem", color: "text.primary", letterSpacing: "-0.005em" }}>
						¿Confirmás que querés cerrar todas las demás sesiones?
					</Typography>
				</DialogContent>
				<DialogActions sx={{ px: 3, py: 2, borderTop: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}` }}>
					<Button onClick={handleCloseAllSessionsDialog} disabled={closingSession} sx={ghostBtnSx}>
						Cancelar
					</Button>
					<Button
						onClick={handleCloseAllSessions}
						disabled={closingSession}
						variant="contained"
						startIcon={closingSession ? <CircularProgress size={14} color="inherit" /> : null}
						sx={destructiveBtnSx}
					>
						{closingSession ? "Cerrando..." : "Cerrar todas"}
					</Button>
				</DialogActions>
			</Dialog>
		</Stack>
	);
};

export default TabAccount;

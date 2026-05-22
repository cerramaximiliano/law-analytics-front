import React from "react";
import { useState, useEffect, useRef } from "react";

// material-ui
import {
	Accordion,
	AccordionDetails,
	AccordionSummary,
	Box,
	Button,
	Checkbox,
	CircularProgress,
	Collapse,
	FormControlLabel,
	List,
	ListItem,
	Stack,
	Switch,
	TextField,
	Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";

// project-imports
import MainCard from "components/MainCard";
import ApiService, { NotificationPreferences, NotificationSettings, InactivitySettings } from "store/reducers/ApiService";

// assets
import { ArrowDown2, Calendar1, Notification, Sms, Warning2, MessageNotif } from "iconsax-react";
import { openSnackbar } from "store/reducers/snackbar";
import { dispatch } from "store";

// team context
import { useTeam } from "contexts/TeamContext";
import { ROLE_CONFIG } from "types/teams";

import { BRAND_BLUE } from "themes/dashboardTokens";

// ==============================|| USER PROFILE - SETTINGS ||============================== //

const TabSettings = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const { isTeamMode, activeTeam, userRole, isOwner, isAdmin } = useTeam();
	const canEditSettings = !isTeamMode || isOwner || isAdmin;

	const [loading, setLoading] = useState<boolean>(true);
	const [saving, setSaving] = useState<boolean>(false);
	const [error, setError] = useState<string | null>(null);

	const [checked, setChecked] = useState<string[]>([]);

	const savedPreferencesRef = useRef<NotificationPreferences | null>(null);
	const savedCheckedRef = useRef<string[]>([]);

	const defaultSettings: NotificationSettings = { notifyOnceOnly: true, daysInAdvance: 5 };
	const defaultInactivitySettings: InactivitySettings = {
		daysInAdvance: 5,
		caducityDays: 180,
		prescriptionDays: 730,
		notifyOnceOnly: true,
	};

	const [preferences, setPreferences] = useState<NotificationPreferences>({
		enabled: true,
		channels: { email: true, browser: true, mobile: false },
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
		system: { enabled: true, alerts: true, news: true, userActivity: true },
	});

	const [expanded, setExpanded] = useState<string | null>(null);

	const [channelsEnabled, setChannelsEnabled] = useState<boolean>(preferences.channels?.email || preferences.channels?.browser || false);
	const [userOptionsEnabled, setUserOptionsEnabled] = useState<boolean>(
		preferences.user?.calendar ||
			preferences.user?.expiration ||
			(preferences.user?.taskExpiration ?? false) ||
			preferences.user?.inactivity ||
			false,
	);
	const [systemOptionsEnabled, setSystemOptionsEnabled] = useState<boolean>(
		preferences.system?.alerts || preferences.system?.news || preferences.system?.userActivity || false,
	);

	useEffect(() => {
		const isAnyChannelEnabled = preferences.channels?.email || preferences.channels?.browser || false;
		setChannelsEnabled(isAnyChannelEnabled);

		const isAnyUserOptionEnabled =
			preferences.user?.calendar ||
			preferences.user?.expiration ||
			(preferences.user?.taskExpiration ?? false) ||
			preferences.user?.inactivity ||
			false;
		setUserOptionsEnabled(isAnyUserOptionEnabled);

		const isAnySystemOptionEnabled = preferences.system?.alerts || preferences.system?.news || preferences.system?.userActivity || false;
		setSystemOptionsEnabled(isAnySystemOptionEnabled);

		const newChecked = [...checked];
		if (isAnyChannelEnabled && newChecked.indexOf("chn") === -1) {
			newChecked.push("chn");
		} else if (!isAnyChannelEnabled && newChecked.indexOf("chn") !== -1) {
			const index = newChecked.indexOf("chn");
			if (index !== -1) newChecked.splice(index, 1);
		}
		if (isAnyUserOptionEnabled && newChecked.indexOf("sen") === -1) {
			newChecked.push("sen");
		} else if (!isAnyUserOptionEnabled && newChecked.indexOf("sen") !== -1) {
			const index = newChecked.indexOf("sen");
			if (index !== -1) newChecked.splice(index, 1);
		}
		if (isAnySystemOptionEnabled && newChecked.indexOf("usn") === -1) {
			newChecked.push("usn");
		} else if (!isAnySystemOptionEnabled && newChecked.indexOf("usn") !== -1) {
			const index = newChecked.indexOf("usn");
			if (index !== -1) newChecked.splice(index, 1);
		}
		if (JSON.stringify(checked) !== JSON.stringify(newChecked)) setChecked(newChecked);
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

	const handleAccordionChange = (panel: string) => (_event: React.SyntheticEvent, isExpanded: boolean) => {
		setExpanded(isExpanded ? panel : null);
	};

	const normalizeSettings = (settings: any): NotificationSettings => ({
		notifyOnceOnly: settings?.notifyOnceOnly ?? true,
		daysInAdvance: settings?.daysInAdvance ?? 5,
	});

	const normalizeInactivitySettings = (settings: any): InactivitySettings => ({
		daysInAdvance: settings?.daysInAdvance ?? 5,
		caducityDays: settings?.caducityDays ?? 180,
		prescriptionDays: settings?.prescriptionDays ?? 730,
		notifyOnceOnly: settings?.notifyOnceOnly ?? true,
	});

	const normalizePreferences = (data: any): NotificationPreferences => {
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

	useEffect(() => {
		const fetchPreferences = async () => {
			try {
				setLoading(true);
				const response = await ApiService.getNotificationPreferences();
				if (response.success) {
					const normalizedData = normalizePreferences(response.data);
					setPreferences(normalizedData);
					const newChecked: string[] = [];
					if (normalizedData.enabled) newChecked.push("oc");
					if (normalizedData.user.enabled) newChecked.push("sen");
					if (normalizedData.system.enabled) newChecked.push("usn");
					if (normalizedData.loginAlerts) newChecked.push("lc");
					setChecked(newChecked);
					savedPreferencesRef.current = normalizedData;
					savedCheckedRef.current = newChecked;
				}
			} catch (error) {
				setError("No se pudieron cargar las preferencias de notificaciones");
			} finally {
				setLoading(false);
			}
		};
		fetchPreferences();
	}, []);

	const savePreferences = async () => {
		try {
			setSaving(true);
			const updatedPreferences: NotificationPreferences = {
				enabled: checked.includes("oc"),
				channels: {
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
				const savedData = normalizePreferences(response.data);
				setPreferences(savedData);
				savedPreferencesRef.current = savedData;
				savedCheckedRef.current = [...checked];
				dispatch(
					openSnackbar({
						open: true,
						message: "Preferencias guardadas correctamente",
						variant: "alert",
						alert: { color: "success" },
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
					alert: { color: "error" },
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
			if (value === "sen") {
				setPreferences((prev) => ({
					...prev,
					user: { ...prev.user, enabled: true, calendar: true, expiration: true, taskExpiration: true, inactivity: true },
				}));
			} else if (value === "usn") {
				setPreferences((prev) => ({ ...prev, system: { ...prev.system, enabled: true, alerts: true, news: true, userActivity: true } }));
			} else if (value === "chn") {
				setPreferences((prev) => ({
					...prev,
					channels: { email: true, browser: true, mobile: prev.channels?.mobile ?? false },
				}));
			}
		} else {
			newChecked.splice(currentIndex, 1);
			if (value === "sen") {
				setPreferences((prev) => ({
					...prev,
					user: { ...prev.user, enabled: false, calendar: false, expiration: false, taskExpiration: false, inactivity: false },
				}));
			} else if (value === "usn") {
				setPreferences((prev) => ({ ...prev, system: { ...prev.system, enabled: false, alerts: false, news: false, userActivity: false } }));
			} else if (value === "chn") {
				setPreferences((prev) => ({
					...prev,
					channels: { email: false, browser: false, mobile: prev.channels?.mobile ?? false },
				}));
			}
		}
		setChecked(newChecked);
	};

	const handleUserOptionToggle = (option: keyof NotificationPreferences["user"]) => () => {
		setPreferences((prev) => {
			const currentUser = prev.user ?? { enabled: false, calendar: false, expiration: false, taskExpiration: false, inactivity: false };
			const newValue = !currentUser[option];
			const updatedUser = { ...currentUser, [option]: newValue };
			const anyOptionActive =
				updatedUser.calendar || updatedUser.expiration || (updatedUser.taskExpiration ?? false) || updatedUser.inactivity;
			if (anyOptionActive && !updatedUser.enabled) {
				updatedUser.enabled = true;
				if (checked.indexOf("sen") === -1) setChecked((current) => [...current, "sen"]);
			}
			if (!anyOptionActive && updatedUser.enabled) {
				updatedUser.enabled = false;
				if (checked.indexOf("sen") !== -1) setChecked((current) => current.filter((item) => item !== "sen"));
			}
			return { ...prev, user: updatedUser };
		});
	};

	const handleDaysInAdvanceChange =
		(settingsKey: "calendarSettings" | "expirationSettings" | "taskExpirationSettings") => (event: React.ChangeEvent<HTMLInputElement>) => {
			const value = parseInt(event.target.value, 10);
			if (isNaN(value) || value < 1 || value > 30) return;
			setPreferences((prev) => ({
				...prev,
				user: { ...prev.user, [settingsKey]: { ...prev.user[settingsKey], daysInAdvance: value } },
			}));
		};

	const handleNotifyOnceOnlyChange =
		(settingsKey: "calendarSettings" | "expirationSettings" | "taskExpirationSettings") => (event: React.ChangeEvent<HTMLInputElement>) => {
			setPreferences((prev) => ({
				...prev,
				user: { ...prev.user, [settingsKey]: { ...prev.user[settingsKey], notifyOnceOnly: event.target.checked } },
			}));
		};

	const handleInactivityDaysInAdvanceChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseInt(event.target.value, 10);
		if (isNaN(value) || value < 1 || value > 30) return;
		setPreferences((prev) => ({
			...prev,
			user: { ...prev.user, inactivitySettings: { ...prev.user.inactivitySettings!, daysInAdvance: value } },
		}));
	};

	const handleCaducityDaysChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const value = parseInt(event.target.value, 10);
		if (isNaN(value) || value < 1 || value > 365) return;
		setPreferences((prev) => ({
			...prev,
			user: { ...prev.user, inactivitySettings: { ...prev.user.inactivitySettings!, caducityDays: value } },
		}));
	};

	const handlePrescriptionMonthsChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		const months = parseInt(event.target.value, 10);
		if (isNaN(months) || months < 1 || months > 120) return;
		const days = Math.round(months * 30.44);
		setPreferences((prev) => ({
			...prev,
			user: { ...prev.user, inactivitySettings: { ...prev.user.inactivitySettings!, prescriptionDays: days } },
		}));
	};

	const daysToMonths = (days: number): number => Math.round(days / 30.44);

	const handleInactivityNotifyOnceOnlyChange = (event: React.ChangeEvent<HTMLInputElement>) => {
		setPreferences((prev) => ({
			...prev,
			user: { ...prev.user, inactivitySettings: { ...prev.user.inactivitySettings!, notifyOnceOnly: event.target.checked } },
		}));
	};

	const handleSystemOptionToggle = (option: keyof NotificationPreferences["system"]) => () => {
		setPreferences((prev) => {
			const currentSystem = prev.system ?? { enabled: false, alerts: false, news: false, userActivity: false };
			const newValue = !currentSystem[option];
			const updatedSystem = { ...currentSystem, [option]: newValue };
			const anyOptionActive = updatedSystem.alerts || updatedSystem.news || updatedSystem.userActivity;
			if (anyOptionActive && !updatedSystem.enabled) {
				updatedSystem.enabled = true;
				if (checked.indexOf("usn") === -1) setChecked((current) => [...current, "usn"]);
			}
			if (!anyOptionActive && updatedSystem.enabled) {
				updatedSystem.enabled = false;
				if (checked.indexOf("usn") !== -1) setChecked((current) => current.filter((item) => item !== "usn"));
			}
			return { ...prev, system: updatedSystem };
		});
	};

	const handleChannelChange = (channel: "email" | "browser", value: boolean) => {
		setPreferences((prev) => ({
			...prev,
			channels: {
				email: channel === "email" ? value : prev.channels?.email ?? false,
				browser: channel === "browser" ? value : prev.channels?.browser ?? false,
				mobile: prev.channels?.mobile ?? false,
			},
		}));
	};

	// ── Brand helpers ──────────────────────────────────────────────────────────

	const inputSx = {
		"& .MuiOutlinedInput-root": {
			borderRadius: 1,
			fontSize: "0.82rem",
			"& fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.2 : 0.14) },
			"&:hover fieldset": { borderColor: alpha(BRAND_BLUE, isDark ? 0.4 : 0.28) },
			"&.Mui-focused fieldset": { borderColor: BRAND_BLUE, borderWidth: 1 },
		},
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
	const switchSx = {
		"& .MuiSwitch-switchBase.Mui-checked": {
			color: BRAND_BLUE,
			"& .MuiSwitch-thumb": { backgroundColor: BRAND_BLUE, color: BRAND_BLUE },
			"& + .MuiSwitch-track": { backgroundColor: `${BRAND_BLUE} !important`, opacity: 0.5 },
		},
	};
	const checkboxSx = {
		color: alpha(BRAND_BLUE, isDark ? 0.4 : 0.32),
		"&.Mui-checked": { color: BRAND_BLUE },
	};

	// Accordion brand-aware reusable wrapper
	const accordionSx = {
		boxShadow: "none",
		bgcolor: "transparent",
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
		borderRadius: 1.5,
		overflow: "hidden",
		"&:before": { display: "none" },
		"&.Mui-expanded": { margin: 0 },
	};
	const accordionSummarySx = {
		px: 1.75,
		py: 0.5,
		minHeight: 64,
		"&.Mui-expanded": { minHeight: 64, bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035) },
		"& .MuiAccordionSummary-content": { my: 1.25 },
		"& .MuiAccordionSummary-expandIconWrapper": {
			color: "text.secondary",
			transition: "color 0.15s ease, transform 0.2s ease",
			"&.Mui-expanded": { color: BRAND_BLUE },
		},
	};

	// Sub-row helper para opciones dentro del accordion
	const subRowSx = {
		display: "flex",
		alignItems: "center",
		py: 0.625,
		pl: { xs: 1, sm: 5.5 },
		pr: 1,
		"&:not(:last-of-type)": {
			borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.08 : 0.05)}`,
		},
	};

	const settingsBoxSx = {
		mx: { xs: 0, sm: 5 },
		mb: 1,
		px: 1.5,
		py: 1.25,
		borderRadius: 1.25,
		bgcolor: alpha(BRAND_BLUE, isDark ? 0.06 : 0.035),
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.14 : 0.08)}`,
	};

	const SectionHeader = ({
		eyebrow,
		title,
		description,
		icon,
		switchChecked,
		onSwitchChange,
	}: {
		eyebrow: string;
		title: string;
		description: string;
		icon: React.ReactNode;
		switchChecked: boolean;
		onSwitchChange: () => void;
	}) => (
		<Stack direction="row" alignItems="center" spacing={1.5} sx={{ width: "100%" }}>
			<Box
				sx={{
					width: 36,
					height: 36,
					borderRadius: 1.25,
					display: "flex",
					alignItems: "center",
					justifyContent: "center",
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
					border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
					color: BRAND_BLUE,
					flexShrink: 0,
				}}
			>
				{icon}
			</Box>
			<Stack spacing={0.125} sx={{ flex: 1, minWidth: 0 }}>
				<Stack direction="row" spacing={0.625} alignItems="center">
					<Box sx={{ width: 4, height: 4, borderRadius: "50%", bgcolor: BRAND_BLUE }} />
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
				<Typography sx={{ fontSize: "0.74rem", color: "text.secondary", letterSpacing: "-0.005em" }}>{description}</Typography>
			</Stack>
			<Switch
				checked={switchChecked}
				onChange={onSwitchChange}
				disabled={!canEditSettings}
				onClick={(e) => e.stopPropagation()}
				sx={switchSx}
			/>
		</Stack>
	);

	// ── Loading & error ─────────────────────────────────────────────────────

	if (loading) {
		return (
			<MainCard content={false} sx={{ borderRadius: 2, border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`, p: 2.5 }}>
				<Stack alignItems="center" justifyContent="center" sx={{ py: 6 }} spacing={1.25}>
					<CircularProgress size={32} sx={{ color: BRAND_BLUE }} />
					<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
						Cargando preferencias…
					</Typography>
				</Stack>
			</MainCard>
		);
	}

	if (error) {
		const errorColor = theme.palette.error.main;
		return (
			<MainCard content={false} sx={{ borderRadius: 2, border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`, p: 2.5 }}>
				<Box
					sx={{
						p: 2,
						borderRadius: 1.25,
						bgcolor: alpha(errorColor, isDark ? 0.08 : 0.04),
						border: `1px solid ${alpha(errorColor, isDark ? 0.32 : 0.22)}`,
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
								bgcolor: alpha(errorColor, isDark ? 0.16 : 0.08),
								border: `1px solid ${alpha(errorColor, isDark ? 0.32 : 0.2)}`,
								color: errorColor,
								flexShrink: 0,
							}}
						>
							<Warning2 size={16} variant="Bulk" />
						</Box>
						<Typography sx={{ fontSize: "0.85rem", color: "text.primary", letterSpacing: "-0.005em" }}>{error}</Typography>
					</Stack>
				</Box>
			</MainCard>
		);
	}

	return (
		<MainCard content={false} sx={{ borderRadius: 2, border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`, p: 2.5 }}>
			{/* Alerta team-mode brand */}
			{isTeamMode && !canEditSettings && (
				<Box
					sx={{
						mb: 2,
						p: 1.75,
						borderRadius: 1.25,
						bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
						border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
					}}
				>
					<Stack direction="row" spacing={1.25} alignItems="flex-start">
						<Box
							sx={{
								width: 28,
								height: 28,
								borderRadius: 1,
								display: "flex",
								alignItems: "center",
								justifyContent: "center",
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.16 : 0.08),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.28 : 0.18)}`,
								color: BRAND_BLUE,
								flexShrink: 0,
							}}
						>
							<MessageNotif size={14} variant="Bulk" />
						</Box>
						<Typography sx={{ fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
							Estás en modo equipo ({activeTeam?.name}). Solo el propietario o administradores pueden modificar estas configuraciones. Tu rol
							actual:{" "}
							<Box component="span" sx={{ fontWeight: 600, color: BRAND_BLUE }}>
								{userRole ? ROLE_CONFIG[userRole]?.label : "Desconocido"}
							</Box>
						</Typography>
					</Stack>
				</Box>
			)}

			<Stack spacing={1.5}>
				{/* Accordion 1: Canales */}
				<Accordion expanded={expanded === "panel1"} onChange={handleAccordionChange("panel1")} sx={accordionSx}>
					<AccordionSummary expandIcon={<ArrowDown2 size={16} variant="Linear" />} sx={accordionSummarySx}>
						<SectionHeader
							eyebrow="Canales"
							title="Canales de comunicación"
							description="Por dónde querés recibir tus notificaciones"
							icon={<Sms size={18} variant="Bulk" />}
							switchChecked={checked.indexOf("chn") !== -1 || preferences.channels?.email || preferences.channels?.browser || false}
							onSwitchChange={handleToggle("chn")}
						/>
					</AccordionSummary>
					<AccordionDetails sx={{ p: 0 }}>
						<List component="div" disablePadding>
							<ListItem sx={subRowSx}>
								<Typography sx={{ flex: 1, fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em" }}>
									Correo electrónico
								</Typography>
								<Switch
									size="small"
									onChange={() => handleChannelChange("email", !preferences.channels?.email)}
									checked={preferences.channels?.email}
									disabled={!channelsEnabled || !canEditSettings}
									sx={switchSx}
								/>
							</ListItem>
							<ListItem sx={subRowSx}>
								<Typography sx={{ flex: 1, fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em" }}>
									Notificaciones en navegador
								</Typography>
								<Switch
									size="small"
									onChange={() => handleChannelChange("browser", !preferences.channels?.browser)}
									checked={preferences.channels?.browser}
									disabled={!channelsEnabled || !canEditSettings}
									sx={switchSx}
								/>
							</ListItem>
						</List>
					</AccordionDetails>
				</Accordion>

				{/* Accordion 2: Usuario */}
				<Accordion expanded={expanded === "panel2"} onChange={handleAccordionChange("panel2")} sx={accordionSx}>
					<AccordionSummary expandIcon={<ArrowDown2 size={16} variant="Linear" />} sx={accordionSummarySx}>
						<SectionHeader
							eyebrow="Notificaciones de usuario"
							title="Tu actividad"
							description="Recordatorios de calendario, vencimientos y tareas"
							icon={<Calendar1 size={18} variant="Bulk" />}
							switchChecked={userOptionsEnabled}
							onSwitchChange={handleToggle("sen")}
						/>
					</AccordionSummary>
					<AccordionDetails sx={{ p: 0 }}>
						<List component="div" disablePadding>
							{/* Calendario */}
							<ListItem sx={subRowSx}>
								<Typography sx={{ flex: 1, fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em" }}>
									Eventos del calendario
								</Typography>
								<Switch
									size="small"
									onChange={handleUserOptionToggle("calendar")}
									checked={preferences.user?.calendar ?? false}
									disabled={!userOptionsEnabled || !canEditSettings}
									sx={switchSx}
								/>
							</ListItem>
							<Collapse in={preferences.user?.calendar ?? false} timeout="auto" unmountOnExit>
								<Box sx={settingsBoxSx}>
									<Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
										<Stack direction="row" spacing={1} alignItems="center">
											<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
												Días de anticipación:
											</Typography>
											<TextField
												type="number"
												size="small"
												value={preferences.user?.calendarSettings?.daysInAdvance ?? 5}
												onChange={handleDaysInAdvanceChange("calendarSettings")}
												inputProps={{ min: 1, max: 30 }}
												sx={{ width: 70, ...inputSx }}
											/>
											<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
												antes del vencimiento
											</Typography>
										</Stack>
										<FormControlLabel
											control={
												<Checkbox
													size="small"
													checked={preferences.user?.calendarSettings?.notifyOnceOnly ?? true}
													onChange={handleNotifyOnceOnlyChange("calendarSettings")}
													sx={checkboxSx}
												/>
											}
											label={
												<Typography sx={{ fontSize: "0.72rem", color: "text.primary", letterSpacing: "-0.005em" }}>
													Notificar solo una vez
												</Typography>
											}
										/>
									</Stack>
								</Box>
							</Collapse>

							{/* Vencimientos */}
							<ListItem sx={subRowSx}>
								<Typography sx={{ flex: 1, fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em" }}>
									Vencimientos de movimientos
								</Typography>
								<Switch
									size="small"
									onChange={handleUserOptionToggle("expiration")}
									checked={preferences.user?.expiration ?? false}
									disabled={!userOptionsEnabled || !canEditSettings}
									sx={switchSx}
								/>
							</ListItem>
							<Collapse in={preferences.user?.expiration ?? false} timeout="auto" unmountOnExit>
								<Box sx={settingsBoxSx}>
									<Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
										<Stack direction="row" spacing={1} alignItems="center">
											<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
												Días de anticipación:
											</Typography>
											<TextField
												type="number"
												size="small"
												value={preferences.user?.expirationSettings?.daysInAdvance ?? 5}
												onChange={handleDaysInAdvanceChange("expirationSettings")}
												inputProps={{ min: 1, max: 30 }}
												sx={{ width: 70, ...inputSx }}
											/>
											<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
												antes del vencimiento
											</Typography>
										</Stack>
										<FormControlLabel
											control={
												<Checkbox
													size="small"
													checked={preferences.user?.expirationSettings?.notifyOnceOnly ?? true}
													onChange={handleNotifyOnceOnlyChange("expirationSettings")}
													sx={checkboxSx}
												/>
											}
											label={
												<Typography sx={{ fontSize: "0.72rem", color: "text.primary", letterSpacing: "-0.005em" }}>
													Notificar solo una vez
												</Typography>
											}
										/>
									</Stack>
								</Box>
							</Collapse>

							{/* Tareas */}
							<ListItem sx={subRowSx}>
								<Typography sx={{ flex: 1, fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em" }}>
									Vencimientos de tareas
								</Typography>
								<Switch
									size="small"
									onChange={handleUserOptionToggle("taskExpiration")}
									checked={preferences.user?.taskExpiration ?? false}
									disabled={!userOptionsEnabled || !canEditSettings}
									sx={switchSx}
								/>
							</ListItem>
							<Collapse in={preferences.user?.taskExpiration ?? false} timeout="auto" unmountOnExit>
								<Box sx={settingsBoxSx}>
									<Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
										<Stack direction="row" spacing={1} alignItems="center">
											<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
												Días de anticipación:
											</Typography>
											<TextField
												type="number"
												size="small"
												value={preferences.user?.taskExpirationSettings?.daysInAdvance ?? 5}
												onChange={handleDaysInAdvanceChange("taskExpirationSettings")}
												inputProps={{ min: 1, max: 30 }}
												sx={{ width: 70, ...inputSx }}
											/>
											<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
												antes del vencimiento
											</Typography>
										</Stack>
										<FormControlLabel
											control={
												<Checkbox
													size="small"
													checked={preferences.user?.taskExpirationSettings?.notifyOnceOnly ?? true}
													onChange={handleNotifyOnceOnlyChange("taskExpirationSettings")}
													sx={checkboxSx}
												/>
											}
											label={
												<Typography sx={{ fontSize: "0.72rem", color: "text.primary", letterSpacing: "-0.005em" }}>
													Notificar solo una vez
												</Typography>
											}
										/>
									</Stack>
								</Box>
							</Collapse>

							{/* Inactividad */}
							<ListItem sx={subRowSx}>
								<Typography sx={{ flex: 1, fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em" }}>
									Inactividad de causas
								</Typography>
								<Switch
									size="small"
									onChange={handleUserOptionToggle("inactivity")}
									checked={preferences.user?.inactivity ?? false}
									disabled={!userOptionsEnabled || !canEditSettings}
									sx={switchSx}
								/>
							</ListItem>
							<Collapse in={preferences.user?.inactivity ?? false} timeout="auto" unmountOnExit>
								<Box sx={settingsBoxSx}>
									<Stack spacing={1.25}>
										<Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
											<Stack direction="row" spacing={1} alignItems="center" flexWrap="wrap">
												<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
													Días de anticipación:
												</Typography>
												<TextField
													type="number"
													size="small"
													value={preferences.user?.inactivitySettings?.daysInAdvance ?? 5}
													onChange={handleInactivityDaysInAdvanceChange}
													inputProps={{ min: 1, max: 30 }}
													sx={{ width: 70, ...inputSx }}
												/>
												<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
													antes del vencimiento
												</Typography>
											</Stack>
											<FormControlLabel
												control={
													<Checkbox
														size="small"
														checked={preferences.user?.inactivitySettings?.notifyOnceOnly ?? true}
														onChange={handleInactivityNotifyOnceOnlyChange}
														sx={checkboxSx}
													/>
												}
												label={
													<Typography sx={{ fontSize: "0.72rem", color: "text.primary", letterSpacing: "-0.005em" }}>
														Notificar solo una vez
													</Typography>
												}
											/>
										</Stack>
										<Stack direction={{ xs: "column", sm: "row" }} spacing={2} alignItems={{ xs: "flex-start", sm: "center" }}>
											<Stack direction="row" spacing={1} alignItems="center">
												<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
													Alerta de caducidad (días):
												</Typography>
												<TextField
													type="number"
													size="small"
													value={preferences.user?.inactivitySettings?.caducityDays ?? 180}
													onChange={handleCaducityDaysChange}
													inputProps={{ min: 1, max: 365 }}
													sx={{ width: 80, ...inputSx }}
												/>
											</Stack>
											<Stack direction="row" spacing={1} alignItems="center">
												<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
													Alerta de prescripción (meses):
												</Typography>
												<TextField
													type="number"
													size="small"
													value={daysToMonths(preferences.user?.inactivitySettings?.prescriptionDays ?? 730)}
													onChange={handlePrescriptionMonthsChange}
													inputProps={{ min: 1, max: 120 }}
													sx={{ width: 70, ...inputSx }}
												/>
											</Stack>
										</Stack>
									</Stack>
								</Box>
							</Collapse>
						</List>
					</AccordionDetails>
				</Accordion>

				{/* Accordion 3: Sistema */}
				<Accordion expanded={expanded === "panel3"} onChange={handleAccordionChange("panel3")} sx={accordionSx}>
					<AccordionSummary expandIcon={<ArrowDown2 size={16} variant="Linear" />} sx={accordionSummarySx}>
						<SectionHeader
							eyebrow="Notificaciones del sistema"
							title="Sistema"
							description="Alertas, novedades y actividad de usuarios"
							icon={<Notification size={18} variant="Bulk" />}
							switchChecked={systemOptionsEnabled}
							onSwitchChange={handleToggle("usn")}
						/>
					</AccordionSummary>
					<AccordionDetails sx={{ p: 0 }}>
						<List component="div" disablePadding>
							<ListItem sx={subRowSx}>
								<Typography sx={{ flex: 1, fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em" }}>Alertas</Typography>
								<Switch
									size="small"
									onChange={handleSystemOptionToggle("alerts")}
									checked={preferences.system?.alerts ?? false}
									disabled={!systemOptionsEnabled || !canEditSettings}
									sx={switchSx}
								/>
							</ListItem>
							<ListItem sx={subRowSx}>
								<Typography sx={{ flex: 1, fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em" }}>Novedades</Typography>
								<Switch
									size="small"
									onChange={handleSystemOptionToggle("news")}
									checked={preferences.system?.news ?? false}
									disabled={!systemOptionsEnabled || !canEditSettings}
									sx={switchSx}
								/>
							</ListItem>
							<ListItem sx={subRowSx}>
								<Typography sx={{ flex: 1, fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em" }}>
									Actividad de usuarios
								</Typography>
								<Switch
									size="small"
									onChange={handleSystemOptionToggle("userActivity")}
									checked={preferences.system?.userActivity ?? false}
									disabled={!systemOptionsEnabled || !canEditSettings}
									sx={switchSx}
								/>
							</ListItem>
						</List>
					</AccordionDetails>
				</Accordion>
			</Stack>

			{canEditSettings && (
				<Stack direction="row" justifyContent="flex-end" alignItems="center" spacing={1.25} sx={{ mt: 2.5 }}>
					<Button
						onClick={() => {
							if (savedPreferencesRef.current) {
								setPreferences(savedPreferencesRef.current);
								setChecked(savedCheckedRef.current);
							}
						}}
						sx={ghostBtnSx}
					>
						Cancelar
					</Button>
					<Button
						variant="contained"
						onClick={savePreferences}
						disabled={saving}
						startIcon={saving ? <CircularProgress size={14} color="inherit" /> : null}
						sx={brandPrimarySx}
					>
						{saving ? "Guardando..." : "Guardar"}
					</Button>
				</Stack>
			)}
		</MainCard>
	);
};

export default TabSettings;

import { useState, useEffect, useCallback } from "react";
import { useSearchParams } from "react-router-dom";
import {
	Box,
	CircularProgress,
	Divider,
	FormControlLabel,
	Grid,
	Stack,
	Switch,
	ToggleButton,
	ToggleButtonGroup,
	Typography,
} from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { Buildings2, InfoCircle, Link1, People } from "iconsax-react";
import { enqueueSnackbar } from "notistack";

// project-imports
import MainCard from "components/MainCard";
import PjnAccountConnect from "sections/apps/folders/step-components/PjnAccountConnect";
import ScbaAccountConnect from "sections/apps/folders/step-components/ScbaAccountConnect";
import MevAccountConnect from "sections/apps/profiles/account/MevAccountConnect";
import ApiService from "store/reducers/ApiService";
import pjnCredentialsService from "api/pjnCredentials";
import { dispatch } from "store";
import { fetchPjnSiteStatus } from "store/reducers/pjnSiteStatus";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

// ==============================|| ACCOUNT PROFILE - PJN INTEGRATION ||============================== //

const TabPjnIntegration = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const [serviceAvailable, setServiceAvailable] = useState(true);
	const [serviceMessage, setServiceMessage] = useState("");

	type ConnectionStatus = "connected" | "error" | "disconnected" | null;
	const [isConnected, setIsConnected] = useState<ConnectionStatus>(null);
	const [isScbaConnected, setIsScbaConnected] = useState<ConnectionStatus>(null);
	const [isMevConnected, setIsMevConnected] = useState<ConnectionStatus>(null);

	// Vista activa (PJN o SCBA) sincronizada con el query param `view`.
	// Permite que badges externos (FoldersSyncBadges) y links directos abran la
	// integración correcta sin que el user tenga que clickear el toggle. Default
	// 'pjn' si no hay param o el valor no es válido. Diseñado para extender a
	// nuevas integraciones (MEV, EJE, etc.): sumar valor al union + ToggleButton.
	type IntegrationView = "pjn" | "scba" | "mev";
	const parseView = (v: string | null): IntegrationView => (v === "scba" ? "scba" : v === "mev" ? "mev" : "pjn");
	const [searchParams, setSearchParams] = useSearchParams();
	const initialView: IntegrationView = parseView(searchParams.get("view"));
	const [view, setView] = useState<IntegrationView>(initialView);

	// Mantener sincronizado view ← URL: si el user navega con el back/forward
	// del browser, el toggle refleja el cambio.
	useEffect(() => {
		const fromUrl = parseView(searchParams.get("view"));
		if (fromUrl !== view) setView(fromUrl);
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, [searchParams]);

	// Mantener sincronizado URL ← view: si el user toca el toggle, la URL refleja
	// el tab seleccionado (sharing-friendly + reactivo a back/forward).
	const handleViewChange = (next: IntegrationView) => {
		setView(next);
		setSearchParams(prev => {
			const params = new URLSearchParams(prev);
			params.set("view", next);
			return params;
		}, { replace: true });
	};

	const [syncContactsEnabled, setSyncContactsEnabled] = useState(false);
	const [syncContactsLoading, setSyncContactsLoading] = useState(false);
	const [prefsLoaded, setPrefsLoaded] = useState(false);

	// Notificaciones de bandeja (cédulas) — fuente de verdad: la credencial PJN.
	const [bandejaNotifEnabled, setBandejaNotifEnabled] = useState(false);
	const [bandejaNotifLoading, setBandejaNotifLoading] = useState(false);

	const loadPreferences = useCallback(async () => {
		try {
			const [prefRes, credRes] = await Promise.all([
				ApiService.getUserPreferences(),
				pjnCredentialsService.getCredentialsStatus(),
			]);
			if (prefRes.success && prefRes.data) {
				setSyncContactsEnabled(prefRes.data.pjn?.syncContactsFromIntervinientes ?? false);
			}
			if (credRes.success && credRes.data) {
				setBandejaNotifEnabled(credRes.data.bandejaNotificationsEnabled ?? false);
			}
		} finally {
			setPrefsLoaded(true);
		}
	}, []);

	useEffect(() => {
		loadPreferences();
	}, [loadPreferences]);

	// Estado del portal PJN fresco al entrar al tab: el banner/guard de
	// PjnAccountConnect depende de pjnSiteStatus, que puede estar stale si el
	// mantenimiento empezó después del login (broadcast one-shot perdido).
	useEffect(() => {
		dispatch(fetchPjnSiteStatus());
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	const handleToggleSyncContacts = async () => {
		const newValue = !syncContactsEnabled;
		setSyncContactsLoading(true);
		try {
			const response = await ApiService.updateUserPreferences({
				pjn: { syncContactsFromIntervinientes: newValue },
			} as any);
			if (response.success) {
				setSyncContactsEnabled(newValue);
				enqueueSnackbar(newValue ? "Sincronización de intervinientes activada" : "Sincronización de intervinientes desactivada", {
					variant: "success",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
				});
			} else {
				enqueueSnackbar("Error al actualizar la preferencia", { variant: "error" });
			}
		} catch (error) {
			enqueueSnackbar("Error de conexión", { variant: "error" });
		} finally {
			setSyncContactsLoading(false);
		}
	};

	const handleToggleBandejaNotif = async () => {
		const newValue = !bandejaNotifEnabled;
		setBandejaNotifLoading(true);
		try {
			const response = await pjnCredentialsService.toggleBandejaNotifications(newValue);
			if (response.success) {
				setBandejaNotifEnabled(newValue);
				enqueueSnackbar(newValue ? "Notificaciones de cédulas activadas" : "Notificaciones de cédulas desactivadas", {
					variant: "success",
					anchorOrigin: { vertical: "bottom", horizontal: "right" },
				});
			} else {
				enqueueSnackbar(response.error || "Error al actualizar la preferencia", { variant: "error" });
			}
		} catch (error) {
			enqueueSnackbar("Error de conexión", { variant: "error" });
		} finally {
			setBandejaNotifLoading(false);
		}
	};

	const switchSx = {
		"& .MuiSwitch-switchBase.Mui-checked": {
			color: BRAND_BLUE,
			"& .MuiSwitch-thumb": { backgroundColor: BRAND_BLUE, color: BRAND_BLUE },
			"& + .MuiSwitch-track": { backgroundColor: `${BRAND_BLUE} !important`, opacity: 0.5 },
		},
	};

	const toggleButtonSx = {
		py: 0.875,
		px: 1.75,
		textTransform: "none" as const,
		fontWeight: 600,
		fontSize: "0.82rem",
		letterSpacing: "-0.005em",
		border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.24 : 0.16)} !important`,
		color: "text.secondary",
		transition: "background-color 0.15s ease, color 0.15s ease",
		"&.Mui-selected": {
			bgcolor: alpha(BRAND_BLUE, isDark ? 0.18 : 0.1),
			color: BRAND_BLUE,
			borderColor: `${alpha(BRAND_BLUE, isDark ? 0.45 : 0.32)} !important`,
			"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.22 : 0.14) },
		},
		"&:hover": { bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.05) },
	};

	const ViewStatusDot = ({ status }: { status: ConnectionStatus }) => {
		const color =
			status === "connected"
				? LIVE_GREEN
				: status === "error"
				? STALE_AMBER
				: status === "disconnected"
				? theme.palette.text.disabled
				: "transparent";
		return (
			<Box
				sx={{
					width: 6,
					height: 6,
					borderRadius: "50%",
					bgcolor: color,
					border: status === null ? `1px dashed ${alpha(theme.palette.text.disabled, 0.5)}` : "none",
					flexShrink: 0,
				}}
			/>
		);
	};

	const SectionCard = ({
		eyebrow,
		title,
		subtitle,
		icon,
		rightSlot,
		children,
	}: {
		eyebrow: string;
		title: string;
		subtitle?: string;
		icon: React.ReactNode;
		rightSlot?: React.ReactNode;
		children: React.ReactNode;
	}) => (
		<Box
			sx={{
				borderRadius: 2,
				border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.18 : 0.1)}`,
				bgcolor: "background.paper",
				height: "100%",
				overflow: "hidden",
			}}
		>
			<Box
				sx={{
					px: { xs: 2, sm: 2.5 },
					py: 1.75,
					bgcolor: alpha(BRAND_BLUE, isDark ? 0.05 : 0.025),
					borderBottom: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.16 : 0.1)}`,
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
						{subtitle && (
							<Typography sx={{ fontSize: "0.74rem", color: "text.secondary", letterSpacing: "-0.005em" }}>{subtitle}</Typography>
						)}
					</Stack>
					{rightSlot}
				</Stack>
			</Box>
			<Box sx={{ p: { xs: 2, sm: 2.5 } }}>{children}</Box>
		</Box>
	);

	const StatusPill = ({ status }: { status: Exclude<ConnectionStatus, null> }) => {
		const { color, label } =
			status === "connected"
				? { color: LIVE_GREEN, label: "Conectado" }
				: status === "error"
				? { color: STALE_AMBER, label: "Requiere atención" }
				: { color: theme.palette.text.secondary, label: "No conectado" };
		return (
			<Box
				sx={{
					display: "inline-flex",
					alignItems: "center",
					gap: 0.5,
					px: 0.875,
					py: 0.25,
					borderRadius: 0.75,
					bgcolor: alpha(color, isDark ? 0.16 : 0.1),
					border: `1px solid ${alpha(color, isDark ? 0.32 : 0.22)}`,
				}}
			>
				<Box sx={{ width: 6, height: 6, borderRadius: "50%", bgcolor: color }} />
				<Typography sx={{ fontSize: "0.66rem", fontWeight: 600, color, letterSpacing: "0.04em", textTransform: "uppercase", lineHeight: 1 }}>
					{label}
				</Typography>
			</Box>
		);
	};

	return (
		<Stack spacing={2.5}>
			<Box>
				<ToggleButtonGroup
					value={view}
					exclusive
					onChange={(_, value) => {
						if (value !== null) handleViewChange(value);
					}}
					size="small"
					sx={{ display: "flex", flexWrap: "wrap", gap: 1, "& .MuiToggleButtonGroup-grouped": { borderRadius: 1.25 } }}
				>
					<ToggleButton value="pjn" sx={toggleButtonSx}>
						<Stack direction="row" alignItems="center" spacing={1}>
							<Buildings2 size={15} variant="Bulk" />
							<span>Poder Judicial de la Nación</span>
							<ViewStatusDot status={isConnected} />
						</Stack>
					</ToggleButton>
					<ToggleButton value="scba" sx={toggleButtonSx}>
						<Stack direction="row" alignItems="center" spacing={1}>
							<Buildings2 size={15} variant="Bulk" />
							<span>Suprema Corte de Buenos Aires</span>
							<ViewStatusDot status={isScbaConnected} />
						</Stack>
					</ToggleButton>
					<ToggleButton value="mev" sx={toggleButtonSx}>
						<Stack direction="row" alignItems="center" spacing={1}>
							<Buildings2 size={15} variant="Bulk" />
							<span>Mesa de Entradas Virtual (MEV)</span>
							<ViewStatusDot status={isMevConnected} />
						</Stack>
					</ToggleButton>
				</ToggleButtonGroup>
			</Box>

			{view === "pjn" ? (
				<Grid container spacing={2.5}>
					<Grid item xs={12} md={6}>
						<SectionCard
							eyebrow="Integración · Nación"
							title="Cuenta PJN"
							subtitle="Vincula tu cuenta del Poder Judicial de la Nación para sincronizar automáticamente todas tus causas."
							icon={<Link1 size={16} variant="Bulk" />}
							rightSlot={isConnected !== null ? <StatusPill status={isConnected} /> : undefined}
						>
							<PjnAccountConnect
								onServiceAvailableChange={(available, message) => {
									setServiceAvailable(available);
									setServiceMessage(message || "");
								}}
								onConnectionStatusChange={(connected) => setIsConnected(connected)}
							/>
						</SectionCard>
					</Grid>

					<Grid item xs={12} md={6}>
						<SectionCard
							eyebrow="Sincronización · Nación"
							title="Preferencias de sincronización"
							subtitle="Configurá cómo se sincronizan los intervinientes de tus causas del Poder Judicial de la Nación."
							icon={<People size={16} variant="Bulk" />}
						>
					{!serviceAvailable ? (
						<Box
							sx={{
								p: 1.5,
								borderRadius: 1.25,
								bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
								border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
							}}
						>
							<Stack direction="row" spacing={1} alignItems="flex-start">
								<InfoCircle size={16} variant="Bulk" color={BRAND_BLUE} style={{ marginTop: 2, flexShrink: 0 }} />
								<Typography sx={{ fontSize: "0.82rem", color: "text.primary", letterSpacing: "-0.005em" }}>
									{serviceMessage || "La integración con el Poder Judicial de la Nación no está disponible en este momento."}
								</Typography>
							</Stack>
						</Box>
					) : !prefsLoaded ? (
						<Stack alignItems="center" sx={{ py: 4 }} spacing={1}>
							<CircularProgress size={24} sx={{ color: BRAND_BLUE }} />
							<Typography sx={{ fontSize: "0.72rem", color: "text.secondary", letterSpacing: "-0.005em" }}>
								Cargando preferencias…
							</Typography>
						</Stack>
					) : (
						<Stack spacing={1.5}>
							<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
								<FormControlLabel
									control={
										<Switch
											checked={syncContactsEnabled}
											onChange={handleToggleSyncContacts}
											disabled={syncContactsLoading}
											sx={switchSx}
										/>
									}
									label={
										<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
											Sincronizar intervinientes como contactos
										</Typography>
									}
								/>
								{syncContactsLoading && <CircularProgress size={18} sx={{ color: BRAND_BLUE, flexShrink: 0 }} />}
							</Stack>
							<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
								Los intervinientes (partes y letrados) extraídos de tus causas se crearán automáticamente como contactos en las carpetas
								vinculadas.
							</Typography>

							{!syncContactsEnabled && (
								<Box
									sx={{
										p: 1.25,
										borderRadius: 1.25,
										bgcolor: alpha(BRAND_BLUE, isDark ? 0.08 : 0.04),
										border: `1px solid ${alpha(BRAND_BLUE, isDark ? 0.2 : 0.14)}`,
									}}
								>
									<Stack direction="row" spacing={1} alignItems="flex-start">
										<InfoCircle size={14} variant="Bulk" color={BRAND_BLUE} style={{ marginTop: 2, flexShrink: 0 }} />
										<Typography sx={{ fontSize: "0.74rem", color: "text.primary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
											Al activarlo, los actores y demandados de tus causas se crearán como contactos. La app detecta contactos existentes con
											el mismo CUIT para evitar duplicados. Si tenés muchas causas, se pueden crear cientos de contactos nuevos — activá con
											criterio.
										</Typography>
									</Stack>
								</Box>
							)}

							<Box
								sx={{
									p: 1.25,
									borderRadius: 1.25,
									bgcolor: alpha(STALE_AMBER, isDark ? 0.1 : 0.05),
									border: `1px solid ${alpha(STALE_AMBER, isDark ? 0.32 : 0.22)}`,
								}}
							>
								<Stack direction="row" spacing={1} alignItems="flex-start">
									<InfoCircle size={14} variant="Bulk" color={STALE_AMBER} style={{ marginTop: 2, flexShrink: 0 }} />
									<Typography sx={{ fontSize: "0.74rem", color: "text.primary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
										La cantidad de contactos sincronizados está sujeta a los límites de tu plan actual.
									</Typography>
								</Stack>
							</Box>

							<Divider sx={{ my: 0.5 }} />

							<Stack direction="row" alignItems="center" justifyContent="space-between" spacing={1.5}>
								<FormControlLabel
									control={
										<Switch
											checked={bandejaNotifEnabled}
											onChange={handleToggleBandejaNotif}
											disabled={bandejaNotifLoading}
											sx={switchSx}
										/>
									}
									label={
										<Typography sx={{ fontSize: "0.85rem", fontWeight: 600, color: "text.primary", letterSpacing: "-0.005em" }}>
											Notificaciones de cédulas (bandeja)
										</Typography>
									}
								/>
								{bandejaNotifLoading && <CircularProgress size={18} sx={{ color: BRAND_BLUE, flexShrink: 0 }} />}
							</Stack>
							<Typography sx={{ fontSize: "0.78rem", color: "text.secondary", letterSpacing: "-0.005em", textWrap: "pretty" }}>
								Recibí un email cuando lleguen nuevas cédulas electrónicas a tu bandeja del PJN (se incluyen junto a los movimientos
								del día).
							</Typography>
						</Stack>
					)}
				</SectionCard>
			</Grid>
			</Grid>
			) : view === "scba" ? (
				<Grid container spacing={2.5}>
					<Grid item xs={12} md={6}>
						<SectionCard
							eyebrow="Integración · Buenos Aires"
							title="Cuenta SCBA"
							subtitle="Vincula tu domicilio electrónico de la Suprema Corte de Buenos Aires para sincronizar tus causas provinciales."
							icon={<Link1 size={16} variant="Bulk" />}
							rightSlot={isScbaConnected !== null ? <StatusPill status={isScbaConnected} /> : undefined}
						>
							<ScbaAccountConnect onConnectionStatusChange={(connected) => setIsScbaConnected(connected)} />
						</SectionCard>
					</Grid>
				</Grid>
			) : (
				<Grid container spacing={2.5}>
					<Grid item xs={12} md={6}>
						<SectionCard
							eyebrow="Integración · MEV"
							title="Cuenta MEV"
							subtitle="Vinculá tu cuenta del portal MEV (mev.scba.gov.ar). Con una sola credencial cubrimos todas tus causas de Buenos Aires."
							icon={<Link1 size={16} variant="Bulk" />}
							rightSlot={isMevConnected !== null ? <StatusPill status={isMevConnected} /> : undefined}
						>
							<MevAccountConnect onConnectionStatusChange={(connected) => setIsMevConnected(connected)} />
						</SectionCard>
					</Grid>
				</Grid>
			)}
		</Stack>
	);
};

export default TabPjnIntegration;

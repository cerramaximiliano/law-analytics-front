import { useState, useEffect, useCallback } from "react";
import { Box, CircularProgress, FormControlLabel, Grid, Stack, Switch, Typography } from "@mui/material";
import { alpha, useTheme } from "@mui/material/styles";
import { InfoCircle, Link1, People } from "iconsax-react";
import { enqueueSnackbar } from "notistack";

// project-imports
import MainCard from "components/MainCard";
import PjnAccountConnect from "sections/apps/folders/step-components/PjnAccountConnect";
import ApiService from "store/reducers/ApiService";
import { BRAND_BLUE, LIVE_GREEN, STALE_AMBER } from "themes/dashboardTokens";

// ==============================|| ACCOUNT PROFILE - PJN INTEGRATION ||============================== //

const TabPjnIntegration = () => {
	const theme = useTheme();
	const isDark = theme.palette.mode === "dark";

	const [serviceAvailable, setServiceAvailable] = useState(true);
	const [serviceMessage, setServiceMessage] = useState("");

	const [isConnected, setIsConnected] = useState<boolean | null>(null);

	const [syncContactsEnabled, setSyncContactsEnabled] = useState(false);
	const [syncContactsLoading, setSyncContactsLoading] = useState(false);
	const [prefsLoaded, setPrefsLoaded] = useState(false);

	const loadPreferences = useCallback(async () => {
		try {
			const response = await ApiService.getUserPreferences();
			if (response.success && response.data) {
				setSyncContactsEnabled(response.data.pjn?.syncContactsFromIntervinientes ?? false);
			}
		} finally {
			setPrefsLoaded(true);
		}
	}, []);

	useEffect(() => {
		loadPreferences();
	}, [loadPreferences]);

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

	const switchSx = {
		"& .MuiSwitch-switchBase.Mui-checked": {
			color: BRAND_BLUE,
			"& .MuiSwitch-thumb": { backgroundColor: BRAND_BLUE, color: BRAND_BLUE },
			"& + .MuiSwitch-track": { backgroundColor: `${BRAND_BLUE} !important`, opacity: 0.5 },
		},
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

	const StatusPill = ({ connected }: { connected: boolean }) => {
		const color = connected ? LIVE_GREEN : theme.palette.text.secondary;
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
					{connected ? "Conectado" : "No conectado"}
				</Typography>
			</Box>
		);
	};

	return (
		<Grid container spacing={2.5}>
			<Grid item xs={12} md={6}>
				<SectionCard
					eyebrow="Integración"
					title="Cuenta PJN"
					subtitle="Vincula tu cuenta del Poder Judicial de la Nación para sincronizar automáticamente todas tus causas."
					icon={<Link1 size={16} variant="Bulk" />}
					rightSlot={isConnected !== null ? <StatusPill connected={isConnected} /> : undefined}
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
					eyebrow="Sincronización"
					title="Preferencias de sincronización"
					subtitle="Configurá cómo se sincronizan los intervinientes de tus causas."
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
						</Stack>
					)}
				</SectionCard>
			</Grid>
		</Grid>
	);
};

export default TabPjnIntegration;

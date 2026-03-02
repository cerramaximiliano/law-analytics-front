import { useState, useEffect, useCallback } from "react";
import { Alert, CircularProgress, FormControlLabel, Stack, Switch, Typography, Grid } from "@mui/material";
import { InfoCircle, Link1, People } from "iconsax-react";
import { useTheme } from "@mui/material/styles";
import { enqueueSnackbar } from "notistack";

// project-imports
import MainCard from "components/MainCard";
import PjnAccountConnect from "sections/apps/folders/step-components/PjnAccountConnect";
import ApiService from "store/reducers/ApiService";

// ==============================|| ACCOUNT PROFILE - PJN INTEGRATION ||============================== //

const TabPjnIntegration = () => {
	const theme = useTheme();

	// Estado del servicio PJN
	const [serviceAvailable, setServiceAvailable] = useState(true);
	const [serviceMessage, setServiceMessage] = useState("");

	// Sincronización de intervinientes
	const [syncContactsEnabled, setSyncContactsEnabled] = useState(false);
	const [syncContactsLoading, setSyncContactsLoading] = useState(false);
	const [prefsLoaded, setPrefsLoaded] = useState(false);

	// Cargar preferencia al montar
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

	// Toggle sincronización de intervinientes como contactos
	const handleToggleSyncContacts = async () => {
		const newValue = !syncContactsEnabled;
		setSyncContactsLoading(true);
		try {
			const response = await ApiService.updateUserPreferences({
				pjn: { syncContactsFromIntervinientes: newValue },
			} as any);
			if (response.success) {
				setSyncContactsEnabled(newValue);
				enqueueSnackbar(
					newValue
						? "Sincronización de intervinientes activada"
						: "Sincronización de intervinientes desactivada",
					{ variant: "success", anchorOrigin: { vertical: "bottom", horizontal: "right" } }
				);
			} else {
				enqueueSnackbar("Error al actualizar la preferencia", { variant: "error" });
			}
		} catch (error) {
			enqueueSnackbar("Error de conexión", { variant: "error" });
		} finally {
			setSyncContactsLoading(false);
		}
	};

	const serviceUnavailableAlert = !serviceAvailable ? (
		<Alert severity="info" icon={<InfoCircle size={18} />}>
			{serviceMessage || "La integración con el Poder Judicial de la Nación no está disponible en este momento."}
		</Alert>
	) : null;

	return (
		<Grid container spacing={3}>
			<Grid item xs={12} md={6}>
				<MainCard
					title={
						<Stack direction="row" alignItems="center" spacing={1}>
							<Link1 size={22} color={theme.palette.primary.main} />
							<Typography variant="h5">Integración PJN</Typography>
						</Stack>
					}
				>
					<Stack spacing={3}>
						<Typography variant="body2" color="text.secondary">
							Vincula tu cuenta del Poder Judicial de la Nación para sincronizar automáticamente
							todas tus causas y mantenerlas actualizadas.
						</Typography>
						<PjnAccountConnect onServiceAvailableChange={(available, message) => {
							setServiceAvailable(available);
							setServiceMessage(message || "");
						}} />
					</Stack>
				</MainCard>
			</Grid>

			<Grid item xs={12} md={6}>
				<MainCard
					title={
						<Stack direction="row" alignItems="center" spacing={1}>
							<People size={22} color={theme.palette.primary.main} />
							<Typography variant="h5">Preferencias de sincronización</Typography>
						</Stack>
					}
				>
					{serviceUnavailableAlert || (
						!prefsLoaded ? (
							<Stack alignItems="center" sx={{ py: 4 }}>
								<CircularProgress size={24} />
							</Stack>
						) : (
							<Stack spacing={2}>
								<Stack direction="row" alignItems="center" justifyContent="space-between">
									<FormControlLabel
										control={
											<Switch
												checked={syncContactsEnabled}
												onChange={handleToggleSyncContacts}
												disabled={syncContactsLoading}
											/>
										}
										label="Sincronizar intervinientes como contactos"
									/>
									{syncContactsLoading && <CircularProgress size={20} />}
								</Stack>
								<Typography variant="caption" color="text.secondary">
									Los intervinientes (partes y letrados) extraídos de tus causas se crearán automáticamente
									como contactos en las carpetas vinculadas.
								</Typography>
								<Alert severity="info" icon={<InfoCircle size={14} />} sx={{ py: 0.25, "& .MuiAlert-message": { fontSize: "0.75rem" } }}>
									La cantidad de contactos sincronizados está sujeta a los límites de tu plan actual.
								</Alert>
							</Stack>
						)
					)}
				</MainCard>
			</Grid>
		</Grid>
	);
};

export default TabPjnIntegration;

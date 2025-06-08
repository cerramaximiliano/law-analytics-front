import React from "react";
import { Alert, AlertTitle, Button, Box, Typography } from "@mui/material";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Warning2 } from "iconsax-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { RootState } from "store";

const DowngradeGracePeriodAlert: React.FC = () => {
	const navigate = useNavigate();
	const subscription = useSelector((state: RootState) => state.auth.subscription);
	const downgradeGracePeriod = subscription?.downgradeGracePeriod;

	// Only show alert if downgradeGracePeriod exists and has not expired
	if (!downgradeGracePeriod || !downgradeGracePeriod.expiresAt) {
		return null;
	}

	// Check if the grace period has expired
	const expirationDate = new Date(downgradeGracePeriod.expiresAt);
	const now = new Date();
	if (expirationDate < now) {
		return null;
	}

	const { previousPlan, targetPlan, autoArchiveScheduled } = downgradeGracePeriod;

	// Format expiration date
	const formattedExpirationDate = format(expirationDate, "d 'de' MMMM 'de' yyyy", { locale: es });

	// Get plan display names
	const getPlanName = (plan: string) => {
		switch (plan) {
			case "premium":
				return "Premium";
			case "standard":
				return "Estándar";
			case "free":
				return "Gratuito";
			default:
				return plan;
		}
	};

	const handleSettingsClick = () => {
		navigate("/apps/profiles/account/settings");
	};

	return (
		<Alert
			severity="warning"
			icon={<Warning2 size={24} />}
			sx={{
				mb: 3,
				"& .MuiAlert-icon": {
					fontSize: "1.5rem",
				},
			}}
		>
			<AlertTitle sx={{ fontWeight: 600, mb: 1 }}>Período de gracia por cambio de plan</AlertTitle>
			<Box>
				<Typography variant="body2" sx={{ mb: 1 }}>
					Estás en un período de gracia debido al cambio del plan <strong>{getPlanName(previousPlan)}</strong> al plan{" "}
					<strong>{getPlanName(targetPlan)}</strong>. Debes archivar los recursos que excedan los límites del nuevo plan.
				</Typography>
				<Typography variant="body2" sx={{ mb: 1 }}>
					Este período de gracia expira el <strong>{formattedExpirationDate}</strong>.
				</Typography>
				{autoArchiveScheduled && (
					<Typography variant="body2" sx={{ mb: 2, color: "warning.dark" }}>
						<strong>Importante:</strong> Si no archivas los recursos excedentes antes de la fecha de expiración, se archivarán
						automáticamente.
					</Typography>
				)}
				<Typography variant="body2" sx={{ mb: 2 }}>
					Para más información sobre los límites del nuevo plan y cómo gestionar tus recursos, visita la configuración de tu cuenta.
				</Typography>
				<Button size="small" variant="outlined" onClick={handleSettingsClick}>
					Ver configuración de cuenta
				</Button>
			</Box>
		</Alert>
	);
};

export default DowngradeGracePeriodAlert;

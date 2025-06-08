import React, { useState } from "react";
import { Alert, Button, Box, Typography, IconButton, Collapse } from "@mui/material";
import { useSelector } from "react-redux";
import { useNavigate } from "react-router-dom";
import { Warning2, Add } from "iconsax-react";
import { format } from "date-fns";
import { es } from "date-fns/locale";
import { RootState } from "store";

const DowngradeGracePeriodAlert: React.FC = () => {
	const navigate = useNavigate();
	const [isVisible, setIsVisible] = useState(true);
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
		<Collapse in={isVisible} timeout={500}>
			<Alert
				severity="warning"
				icon={<Warning2 size={20} />}
				action={
					<IconButton
						aria-label="close"
						size="small"
						onClick={() => setIsVisible(false)}
						sx={{
							color: 'warning.dark',
							'&:hover': {
								backgroundColor: 'transparent',
								color: 'warning.main',
							},
						}}
					>
						<Add size={20} style={{ transform: 'rotate(45deg)' }} />
					</IconButton>
				}
				sx={{
					mb: 2,
					py: 1,
					"& .MuiAlert-icon": {
						fontSize: "1.25rem",
						alignSelf: "center",
					},
					"& .MuiAlert-message": {
						width: "100%",
					},
				}}
			>
				<Box>
					<Typography variant="body2" component="span">
						<strong>Período de gracia:</strong> Cambio del plan {getPlanName(previousPlan)} al plan {getPlanName(targetPlan)}.
						Debes archivar los recursos que excedan los límites. Expira el <strong>{formattedExpirationDate}</strong>.
						{autoArchiveScheduled && (
							<>
								{" "}
								<strong style={{ color: "black" }}>
									Importante: Si no archivas los recursos excedentes antes de la fecha de expiración, se archivarán automáticamente.
								</strong>
							</>
						)}
						{" "}
						<Button 
							size="small" 
							variant="text" 
							onClick={handleSettingsClick}
							sx={{ 
								ml: 1,
								minWidth: "auto",
								p: 0.5,
								textTransform: "none",
								color: "warning.dark",
								"&:hover": {
									backgroundColor: "warning.lighter",
									color: "warning.darker",
								}
							}}
						>
							Más información
						</Button>
					</Typography>
				</Box>
			</Alert>
		</Collapse>
	);
};

export default DowngradeGracePeriodAlert;

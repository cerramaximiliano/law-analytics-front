import React, { useState } from "react";
import { Alert, AlertTitle, Button, Stack, Typography, IconButton, Collapse } from "@mui/material";
import { InfoCircle, Crown, Add } from "iconsax-react";
import { PjnAccess } from "types/movements";
import { useNavigate } from "react-router-dom";

interface PjnAccessAlertProps {
	pjnAccess?: PjnAccess;
	onUpgrade?: () => void;
}

const PjnAccessAlert: React.FC<PjnAccessAlertProps> = ({ pjnAccess, onUpgrade }) => {
	const navigate = useNavigate();
	const [open, setOpen] = useState(true);

	if (!pjnAccess || pjnAccess.hasAccess) {
		return null;
	}

	const handleUpgrade = () => {
		if (onUpgrade) {
			onUpgrade();
		} else {
			// Navegar a la página de suscripciones en la misma pestaña
			navigate("/suscripciones/tables");
		}
	};

	return (
		<Collapse in={open} timeout={300}>
			<Alert
				severity="warning"
				icon={<Crown size={24} />}
				sx={{
					mb: 2,
					"& .MuiAlert-icon": {
						color: "warning.main",
					},
				}}
				action={
					<Stack direction="row" spacing={1} alignItems="center">
						{pjnAccess.requiresUpgrade && (
							<Button
								color="inherit"
								size="small"
								onClick={handleUpgrade}
								sx={{
									fontWeight: 600,
									textTransform: "none",
									whiteSpace: "nowrap",
								}}
							>
								Mejorar Plan
							</Button>
						)}
						<IconButton
							size="small"
							onClick={() => setOpen(false)}
							sx={{
								color: "inherit",
								transform: "rotate(45deg)",
								transition: "transform 0.2s",
								"&:hover": {
									transform: "rotate(45deg) scale(1.1)",
								},
							}}
						>
							<Add size={20} />
						</IconButton>
					</Stack>
				}
			>
				<AlertTitle sx={{ fontWeight: 600 }}>Acceso Limitado</AlertTitle>
				<Typography variant="body2" sx={{ mb: 1 }}>
					{pjnAccess.message}
				</Typography>
				{pjnAccess.availableMovements && pjnAccess.availableMovements > 0 && (
					<Typography variant="body2" sx={{ mb: 1, fontWeight: 500 }}>
						Hay {pjnAccess.availableMovements} movimiento{pjnAccess.availableMovements > 1 ? "s" : ""} adicional
						{pjnAccess.availableMovements > 1 ? "es" : ""} disponible{pjnAccess.availableMovements > 1 ? "s" : ""} con un plan superior.
					</Typography>
				)}
				{pjnAccess.requiredPlans && pjnAccess.requiredPlans.length > 0 && (
					<Stack direction="row" spacing={1} alignItems="center" sx={{ mt: 1 }}>
						<InfoCircle size={16} />
						<Typography variant="caption" color="text.secondary">
							Disponible en planes: {pjnAccess.requiredPlans.join(", ")}
						</Typography>
					</Stack>
				)}
				{pjnAccess.currentPlan && (
					<Typography variant="caption" color="text.secondary" sx={{ display: "block", mt: 0.5 }}>
						Tu plan actual: {pjnAccess.currentPlan}
					</Typography>
				)}
			</Alert>
		</Collapse>
	);
};

export default PjnAccessAlert;

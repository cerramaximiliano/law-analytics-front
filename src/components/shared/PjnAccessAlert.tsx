import React, { useState } from "react";
import { Alert, AlertTitle, Button, Stack, Typography, IconButton, Collapse } from "@mui/material";
import { Crown, Add } from "iconsax-react";
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
				icon={<Crown size={20} />}
				sx={{
					mb: 2,
					"& .MuiAlert-icon": {
						color: "warning.main",
					},
					"& .MuiAlert-message": {
						width: "100%",
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
				<AlertTitle sx={{ fontWeight: 600, fontSize: "0.95rem" }}>
					{pjnAccess.availableMovements && pjnAccess.availableMovements > 0 
						? `+${pjnAccess.availableMovements} movimientos disponibles`
						: "Acceso Limitado"}
				</AlertTitle>
				<Stack spacing={0.5}>
					<Typography variant="body2" sx={{ fontSize: "0.8125rem" }}>
						{pjnAccess.requiredPlans && pjnAccess.requiredPlans.length > 0 
							? `Disponible con plan ${pjnAccess.requiredPlans.map(plan => 
								plan.charAt(0).toUpperCase() + plan.slice(1)).join(" o ")}`
							: pjnAccess.message}
					</Typography>
					{pjnAccess.currentPlan && (
						<Typography variant="caption" color="text.secondary" sx={{ fontSize: "0.75rem" }}>
							Tu plan actual: {pjnAccess.currentPlan}
						</Typography>
					)}
				</Stack>
			</Alert>
		</Collapse>
	);
};

export default PjnAccessAlert;
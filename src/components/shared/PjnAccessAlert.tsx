import React, { useState } from "react";
import { Box, Button, Typography, IconButton, Collapse } from "@mui/material";
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
			navigate("/suscripciones/tables");
		}
	};

	const label = pjnAccess.availableMovements && pjnAccess.availableMovements > 0
		? `+${pjnAccess.availableMovements} movimientos`
		: "Acceso limitado";

	const planText = pjnAccess.requiredPlans && pjnAccess.requiredPlans.length > 0
		? pjnAccess.requiredPlans.map((p) => (p === "standard" ? "Estándar" : p.charAt(0).toUpperCase() + p.slice(1))).join(" o ")
		: null;

	return (
		<Collapse in={open} timeout={300}>
			<Box
				sx={{
					display: "flex",
					alignItems: "center",
					gap: 1,
					mb: 1,
					px: 1,
					py: 0.5,
					borderRadius: 1,
					bgcolor: "warning.lighter",
					border: "1px solid",
					borderColor: "warning.light",
				}}
			>
				<Crown size={14} color="var(--mui-palette-warning-main, #ed6c02)" />
				<Typography variant="caption" color="text.primary" sx={{ flexGrow: 1 }}>
					{label}{planText ? ` · Plan ${planText}` : ""}
				</Typography>
				{pjnAccess.requiresUpgrade && (
					<Button
						size="small"
						onClick={handleUpgrade}
						sx={{
							py: 0,
							px: 1,
							minWidth: 0,
							fontSize: "0.7rem",
							fontWeight: 600,
							textTransform: "none",
							color: "warning.dark",
							whiteSpace: "nowrap",
						}}
					>
						Mejorar
					</Button>
				)}
				<IconButton
					size="small"
					onClick={() => setOpen(false)}
					sx={{ color: "text.secondary", p: 0.25 }}
				>
					<Add size={14} style={{ transform: "rotate(45deg)" }} />
				</IconButton>
			</Box>
		</Collapse>
	);
};

export default PjnAccessAlert;

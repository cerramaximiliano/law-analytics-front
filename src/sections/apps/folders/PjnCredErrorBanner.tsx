/**
 * Aviso "credencial PJN requiere acción" (lista de carpetas y detalle).
 * En pantallas chicas va una sola línea ("Tu credencial PJN requiere acción." + "Actualizar");
 * el texto completo queda en el tooltip (tap).
 */
import { Alert, Button, Tooltip, Typography, useMediaQuery } from "@mui/material";
import type { Theme } from "@mui/material/styles";
import { Warning2 } from "iconsax-react";
import { useNavigate } from "react-router-dom";
import { PJN_CRED_ERROR_BANNER_COPY, PJN_CRED_ERROR_BANNER_SHORT_COPY } from "utils/pjnBindingState";

export default function PjnCredErrorBanner({ to, sx }: { to: string; sx?: object }) {
	const navigate = useNavigate();
	const compacto = useMediaQuery((theme: Theme) => theme.breakpoints.down("sm"));
	const boton = (
		<Button
			color="warning"
			size="small"
			variant="outlined"
			onClick={() => navigate(to)}
			sx={{ textTransform: "none", whiteSpace: "nowrap", fontWeight: 600 }}
		>
			{compacto ? "Actualizar" : "Actualizar credencial"}
		</Button>
	);
	if (compacto) {
		return (
			<Tooltip title={PJN_CRED_ERROR_BANNER_COPY} enterTouchDelay={0}>
				<Alert
					severity="warning"
					icon={<Warning2 variant="Bold" size={18} />}
					action={boton}
					sx={{ py: 0, alignItems: "center", "& .MuiAlert-action": { pt: 0, mr: 0 }, ...sx }}
				>
					<Typography variant="body2" sx={{ fontWeight: 500 }}>
						{PJN_CRED_ERROR_BANNER_SHORT_COPY}
					</Typography>
				</Alert>
			</Tooltip>
		);
	}
	return (
		<Alert severity="warning" icon={<Warning2 variant="Bold" />} action={boton} sx={{ alignItems: "center", ...sx }}>
			<Typography variant="body2">{PJN_CRED_ERROR_BANNER_COPY}</Typography>
		</Alert>
	);
}

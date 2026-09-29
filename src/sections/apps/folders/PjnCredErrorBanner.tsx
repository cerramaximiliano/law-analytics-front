/**
 * Aviso "credencial PJN requiere acción" (lista de carpetas y detalle).
 * En pantallas chicas el texto largo con el botón al costado ocupaba media pantalla:
 * ahí va la versión corta con el botón debajo, a todo el ancho.
 */
import { Alert, Button, Stack, Typography, useMediaQuery } from "@mui/material";
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
			fullWidth={compacto}
			onClick={() => navigate(to)}
			sx={{ textTransform: "none", whiteSpace: "nowrap", fontWeight: 600 }}
		>
			Actualizar credencial
		</Button>
	);
	if (compacto) {
		return (
			<Alert
				severity="warning"
				icon={<Warning2 variant="Bold" size={18} />}
				sx={{ py: 0.5, "& .MuiAlert-message": { width: "100%" }, ...sx }}
			>
				<Stack spacing={1}>
					<Typography variant="body2">{PJN_CRED_ERROR_BANNER_SHORT_COPY}</Typography>
					{boton}
				</Stack>
			</Alert>
		);
	}
	return (
		<Alert severity="warning" icon={<Warning2 variant="Bold" />} action={boton} sx={{ alignItems: "center", ...sx }}>
			<Typography variant="body2">{PJN_CRED_ERROR_BANNER_COPY}</Typography>
		</Alert>
	);
}

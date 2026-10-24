import { Button } from "@mui/material";
import { closeSnackbar, enqueueSnackbar } from "notistack";

import { trackUpgradeCtaClick } from "utils/gtm";

export const UNARCHIVE_ERROR_PLANS_SOURCE = "archived_unarchive_error";

interface UnarchiveLimitSnackbarOptions {
	active?: number;
	planLimit?: number;
	navigate: (to: string) => void;
}

/**
 * Aviso de desarchivado rechazado por el tope de causas activas del plan, con
 * acción "Ver planes". Usa notistack (el snackbar de redux no admite acciones).
 */
export const showUnarchiveLimitSnackbar = ({ active, planLimit, navigate }: UnarchiveLimitSnackbarOptions) => {
	const hasNumbers = typeof active === "number" && typeof planLimit === "number" && planLimit > 0;
	const message = hasNumbers
		? `Tenés ${active} de ${planLimit} causas activas. Archivá una o pasá a un plan con más causas.`
		: "Llegaste al límite de causas activas de tu plan. Archivá una o pasá a un plan con más causas.";

	enqueueSnackbar(message, {
		variant: "default",
		anchorOrigin: { vertical: "bottom", horizontal: "right" },
		autoHideDuration: 10000,
		action: (key) => (
			<Button
				size="small"
				onClick={() => {
					closeSnackbar(key);
					trackUpgradeCtaClick(UNARCHIVE_ERROR_PLANS_SOURCE);
					navigate(`/suscripciones/tables?source=${UNARCHIVE_ERROR_PLANS_SOURCE}`);
				}}
				sx={{ color: "inherit", textTransform: "none", fontWeight: 600, whiteSpace: "nowrap" }}
			>
				Ver planes
			</Button>
		),
	});
};

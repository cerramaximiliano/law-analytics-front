/**
 * Wrapper de Button que se deshabilita automáticamente cuando el portal
 * del PJN está en mantenimiento. Muestra un tooltip explicando por qué.
 *
 * Si la acción no es PJN, el componente es transparente: simplemente
 * renderiza el Button con sus props originales.
 *
 * Uso:
 *   <PjnGuardedButton onClick={handleSync} variant="contained">
 *     Sincronizar mis causas
 *   </PjnGuardedButton>
 *
 *   // Si querés permitir el botón aunque PJN esté caído (poco común):
 *   <PjnGuardedButton skip onClick={...}>...</PjnGuardedButton>
 */

import { Button, ButtonProps, Tooltip } from "@mui/material";
import { usePjnSiteStatus } from "hooks/usePjnSiteStatus";

interface PjnGuardedButtonProps extends ButtonProps {
	/** Si true, el guard se ignora — el botón funciona aunque PJN esté caído. */
	skip?: boolean;
	/** Texto custom del tooltip cuando está en mantenimiento. */
	maintenanceTooltip?: string;
}

const DEFAULT_TOOLTIP = "Acción no disponible: el portal del PJN está en mantenimiento. Volverá a habilitarse automáticamente.";

const PjnGuardedButton = ({ skip, maintenanceTooltip, disabled, children, ...rest }: PjnGuardedButtonProps) => {
	const { isInMaintenance } = usePjnSiteStatus();

	const blocked = !skip && isInMaintenance;
	const finalDisabled = disabled || blocked;
	const button = (
		<Button {...rest} disabled={finalDisabled}>
			{children}
		</Button>
	);

	if (!blocked) return button;

	// El Tooltip no se muestra sobre elementos disabled — envolver en span.
	return (
		<Tooltip title={maintenanceTooltip || DEFAULT_TOOLTIP} arrow>
			<span>{button}</span>
		</Tooltip>
	);
};

export default PjnGuardedButton;

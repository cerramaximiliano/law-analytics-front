/**
 * Hook de acceso al estado del portal del PJN.
 *
 * Encapsula lectura del slice Redux para que los componentes no tengan
 * que conocer la forma del state. Devuelve el flag más útil (isInMaintenance)
 * además del estado completo por si se necesita formato extendido.
 */

import { useSelector } from "react-redux";
import type { PjnSiteStatusState, PjnSiteStatusValue } from "store/reducers/pjnSiteStatus";

interface RootStateLike {
	pjnSiteStatus: PjnSiteStatusState;
}

export interface UsePjnSiteStatusResult {
	status: PjnSiteStatusValue;
	isInMaintenance: boolean;
	maintenanceSince: string | null;
	message: string | null;
	lastDetectedAt: string | null;
	hydrated: boolean;
}

export function usePjnSiteStatus(): UsePjnSiteStatusResult {
	const state = useSelector((s: RootStateLike) => s.pjnSiteStatus);
	return {
		status: state?.status ?? "unknown",
		isInMaintenance: state?.status === "maintenance",
		maintenanceSince: state?.maintenanceSince ?? null,
		message: state?.message ?? null,
		lastDetectedAt: state?.lastDetectedAt ?? null,
		hydrated: state?.hydrated ?? false,
	};
}

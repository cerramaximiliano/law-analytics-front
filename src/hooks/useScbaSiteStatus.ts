/**
 * Hook de acceso al estado del portal SCBA.
 *
 * Encapsula la lectura del slice Redux. Devuelve el flag más útil (isDown)
 * además de los campos que el banner y los handlers necesitan.
 */

import { useSelector } from "react-redux";
import type { ScbaSiteStatusState, ScbaSiteStatusValue } from "store/reducers/scbaSiteStatus";

interface RootStateLike {
	scbaSiteStatus: ScbaSiteStatusState;
}

export interface UseScbaSiteStatusResult {
	status: ScbaSiteStatusValue;
	isDown: boolean;
	lastTransitionAt: string | null;
	message: string | null;
	hydrated: boolean;
}

export function useScbaSiteStatus(): UseScbaSiteStatusResult {
	const state = useSelector((s: RootStateLike) => s.scbaSiteStatus);
	return {
		status: state?.status ?? "unknown",
		isDown: state?.status === "down",
		lastTransitionAt: state?.lastTransitionAt ?? null,
		message: state?.message ?? null,
		hydrated: state?.hydrated ?? false,
	};
}

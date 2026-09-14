import { useMemo } from "react";
import useAuth from "./useAuth";
import { useTeam } from "../contexts/TeamContext";

/**
 * Hook que retorna el userId efectivo para data fetching.
 *
 * En modo equipo (para miembros no-owners):
 * - effectiveUserId: userId del owner del equipo
 * - Los datos mostrados son los del equipo/owner
 *
 * En modo personal o para owners:
 * - effectiveUserId: userId del usuario actual
 * - Los datos mostrados son los personales
 *
 * @example
 * const { effectiveUserId, isReady } = useEffectiveUser();
 *
 * useEffect(() => {
 *   if (effectiveUserId && isReady) {
 *     dispatch(getUnifiedStats(effectiveUserId, "all", false));
 *   }
 * }, [effectiveUserId, isReady]);
 */
export function useEffectiveUser() {
	const { user } = useAuth();
	const { getUserIdForResource, getRequestHeaders, isTeamMode, activeTeam, isReady, isOwner } = useTeam();

	// userId personal del usuario actual
	const personalUserId = useMemo(() => {
		return user?._id || user?.id || "";
	}, [user]);

	// userId efectivo para fetching de datos
	// En modo equipo (para no-owners), usa el userId del owner
	const effectiveUserId = useMemo(() => {
		if (isTeamMode && activeTeam && !isOwner) {
			return getUserIdForResource();
		}
		return personalUserId;
	}, [isTeamMode, activeTeam, isOwner, getUserIdForResource, personalUserId]);

	// Headers para incluir en requests axios
	// Incluye X-Group-Id cuando está en modo equipo
	const requestHeaders = useMemo(() => {
		return getRequestHeaders();
	}, [getRequestHeaders]);

	return {
		// userId para usar en fetching de datos
		effectiveUserId,

		// userId personal del miembro (siempre el usuario actual)
		personalUserId,

		// Si el usuario está en modo equipo
		isTeamMode,

		// Si el usuario es el owner del equipo activo
		isOwner,

		// ID del equipo activo (si existe)
		teamId: activeTeam?._id,

		// Headers para requests (incluye X-Group-Id en modo equipo)
		requestHeaders,

		// Si el contexto está listo para hacer fetching
		// Esperar hasta que isReady sea true antes de hacer requests
		isReady,

		// Helper: retorna true si deberíamos mostrar datos del equipo
		isViewingTeamData: isTeamMode && !isOwner,
	};
}

export default useEffectiveUser;

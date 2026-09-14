/**
 * usePublicAddons — hook que provee la lista de addons públicos cacheados
 * a nivel ApiService. Mirror de usePublicIntegrations.
 *
 * Performance: si la landing ya cargó getPublicPlans, el cache ya está
 * hidratado. Para vistas standalone (/plans accedida directamente) hace
 * una sola request inicial.
 *
 * Fail-soft: si el endpoint falla, devuelve [] — el componente que consume
 * el hook debe ocultar la sección de addons en ese caso.
 */

import { useEffect, useState } from "react";
import ApiService, { DEFAULT_PUBLIC_ADDONS, type PublicAddon } from "store/reducers/ApiService";

interface UsePublicAddonsResult {
	addons: PublicAddon[];
	loading: boolean;
}

export function usePublicAddons(): UsePublicAddonsResult {
	const cached = ApiService.getCachedPublicAddons();
	const [addons, setAddons] = useState<PublicAddon[]>(cached || DEFAULT_PUBLIC_ADDONS);
	const [loading, setLoading] = useState<boolean>(!cached);

	useEffect(() => {
		if (cached) return;
		let cancelled = false;
		ApiService.fetchPublicAddons()
			.then((result) => {
				if (!cancelled) setAddons(result);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return { addons, loading };
}

/**
 * usePublicIntegrations — hook que provee los flags de integraciones públicas
 * (toggles de disponibilidad UI) cacheados a nivel ApiService.
 *
 * Performance: si la landing ya cargó getPublicPlans (Planes section +
 * DiscountBanner lo hacen), el cache ya está hidratado y el hook no dispara
 * fetch nuevo. Para páginas standalone (/integraciones/claude-ai accedida
 * directamente) hace una sola request inicial.
 *
 * Fail-closed: si el endpoint falla, devuelve DEFAULT_PUBLIC_INTEGRATIONS
 * (todo disabled) — el producto prefiere ocultar features que no podemos
 * confirmar como disponibles vs exponerlas accidentalmente por un fallo
 * transitorio del backend. Coherente con el default del schema en
 * IntegrationsConfig (services.{claudeAi,chatGpt}.enabled = false).
 */

import { useEffect, useState } from "react";
import ApiService, {
	DEFAULT_PUBLIC_INTEGRATIONS,
	type PublicIntegrations,
} from "store/reducers/ApiService";

interface UsePublicIntegrationsResult {
	integrations: PublicIntegrations;
	loading: boolean;
}

export function usePublicIntegrations(): UsePublicIntegrationsResult {
	const cached = ApiService.getCachedPublicIntegrations();
	const [integrations, setIntegrations] = useState<PublicIntegrations>(
		cached || DEFAULT_PUBLIC_INTEGRATIONS,
	);
	const [loading, setLoading] = useState<boolean>(!cached);

	useEffect(() => {
		if (cached) return;
		let cancelled = false;
		ApiService.fetchPublicIntegrations()
			.then((result) => {
				if (!cancelled) setIntegrations(result);
			})
			.finally(() => {
				if (!cancelled) setLoading(false);
			});
		return () => {
			cancelled = true;
		};
		// eslint-disable-next-line react-hooks/exhaustive-deps
	}, []);

	return { integrations, loading };
}

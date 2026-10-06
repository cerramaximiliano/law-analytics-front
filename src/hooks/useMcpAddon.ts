/**
 * useMcpAddon — estado del add-on "Conectores de IA" (mcp_access) para el usuario logueado.
 *
 * 1. Intenta el GET consolidado del hub `GET /api/subscriptions/addons/mcp_access` (contrato en types/mcpAddon.ts).
 * 2. Si no existe todavía (404) o falla, arma el mismo shape con lo que ya hay:
 *    `/api/connected-apps/access` + la suscripción propia del store + los addons públicos
 *    (precio). Así la UI funciona antes y después de que el backend publique el endpoint.
 *
 * El resultado se comparte entre todos los componentes montados (una sola request por
 * página) y `refresh()` lo invalida — usarlo después de dar de alta o de baja el add-on.
 * Sin sesión devuelve `addon: null` sin pedir nada.
 */

import { useCallback, useEffect, useMemo, useState } from "react";
import { useDispatch } from "react-redux";

import useAuth from "hooks/useAuth";
import useSubscription from "hooks/useSubscription";
import { usePublicAddons } from "hooks/usePublicAddons";
import { usePublicIntegrations } from "hooks/usePublicIntegrations";
import type { McpAccess } from "hooks/useMcpAccess";
import ApiService from "store/reducers/ApiService";
import { fetchCurrentSubscription } from "store/reducers/auth";
import axiosInstance from "utils/axios";
import { deriveMcpAddonFallback, normalizeMcpAddonStatus, type SubscriptionLike } from "utils/mcpAddonState";
import type { McpAddonStatus } from "types/mcpAddon";

// `raw` = cuerpo del GET consolidado, ya validado; se normaliza en el render para aplicar
// datos del store (miembro de equipo, precio público).
type Snapshot = { kind: "consolidated"; raw: unknown } | { kind: "fallback"; access: McpAccess | null };

// ── caché compartida a nivel módulo ──
let snapshot: Snapshot | null = null;
let inflight: Promise<Snapshot> | null = null;
// Si el hub respondió 404 una vez, no lo volvemos a pedir en esta sesión de la SPA.
let consolidatedMissing = false;
const listeners = new Set<() => void>();
const notify = () => listeners.forEach((l) => l());

async function loadSnapshot(): Promise<Snapshot> {
	if (!consolidatedMissing) {
		const res = await ApiService.getMcpAddonStatus();
		if (res.ok) {
			if (normalizeMcpAddonStatus(res.data)) return { kind: "consolidated", raw: res.data };
		} else if (res.status === 404) {
			consolidatedMissing = true;
		}
	}
	try {
		const res = await axiosInstance.get<McpAccess>("/api/connected-apps/access");
		return { kind: "fallback", access: res.data };
	} catch {
		return { kind: "fallback", access: null };
	}
}

function fetchShared(force = false): Promise<Snapshot> {
	if (!force && snapshot) return Promise.resolve(snapshot);
	if (!force && inflight) return inflight;
	inflight = loadSnapshot()
		.then((s) => {
			snapshot = s;
			notify();
			return s;
		})
		.finally(() => {
			inflight = null;
		});
	return inflight;
}

/** Olvida el estado cacheado (logout, cambio de cuenta, tests). */
export function resetMcpAddonCache() {
	snapshot = null;
	inflight = null;
	consolidatedMissing = false;
}

export interface UseMcpAddonResult {
	/** null sin sesión o mientras carga la primera vez. */
	addon: McpAddonStatus | null;
	loading: boolean;
	/** "consolidated" si vino del endpoint nuevo, "fallback" si se armó con los viejos. */
	source: Snapshot["kind"] | null;
	/** Vuelve a pedir el estado (y la suscripción del store). */
	refresh: () => Promise<void>;
}

const useMcpAddon = (): UseMcpAddonResult => {
	const dispatch = useDispatch();
	const { isLoggedIn } = useAuth();
	const { personalSubscription, isTeamSubscription } = useSubscription();
	const { addons: publicAddons } = usePublicAddons();
	const { integrations } = usePublicIntegrations();
	const [, setTick] = useState(0);
	const [loading, setLoading] = useState<boolean>(isLoggedIn && !snapshot);

	useEffect(() => {
		const listener = () => setTick((t) => t + 1);
		listeners.add(listener);
		return () => {
			listeners.delete(listener);
		};
	}, []);

	useEffect(() => {
		if (!isLoggedIn) {
			resetMcpAddonCache();
			setLoading(false);
			return;
		}
		let cancelled = false;
		if (!snapshot) setLoading(true);
		fetchShared().finally(() => {
			if (!cancelled) setLoading(false);
		});
		return () => {
			cancelled = true;
		};
	}, [isLoggedIn]);

	const refresh = useCallback(async () => {
		if (!isLoggedIn) return;
		await Promise.all([fetchShared(true), (dispatch as any)(fetchCurrentSubscription(true))]);
	}, [dispatch, isLoggedIn]);

	const publicAddon = publicAddons.find((a) => a.key === "mcp_access") || null;
	const current = isLoggedIn ? snapshot : null;

	const addon = useMemo<McpAddonStatus | null>(() => {
		if (!current) return null;
		if (current.kind === "consolidated") {
			// El precio llega null si el hub no pudo leer Stripe: para mostrarlo usamos el
			// público, pero `purchasable` queda como lo dice el hub (sin precio no vende).
			const data = normalizeMcpAddonStatus(current.raw, { isTeamMember: !!isTeamSubscription });
			if (data && data.price.amount == null && publicAddon?.priceMonthly != null) {
				return { ...data, price: { amount: publicAddon.priceMonthly, currency: publicAddon.currency, interval: publicAddon.interval } };
			}
			return data;
		}
		return deriveMcpAddonFallback({
			publicAddon,
			subscription: (personalSubscription as unknown as SubscriptionLike) || null,
			isTeamMember: !!isTeamSubscription,
			access: current.access,
			publicIntegrationsOpen: integrations.claudeAi.enabled || integrations.chatGpt.enabled,
		});
	}, [current, publicAddon, personalSubscription, isTeamSubscription, integrations.claudeAi.enabled, integrations.chatGpt.enabled]);

	return { addon, loading: isLoggedIn && (loading || !current), source: current?.kind ?? null, refresh };
};

export default useMcpAddon;

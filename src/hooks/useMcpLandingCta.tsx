/**
 * CTA de las landings del conector (`/integraciones/conectores-ai` y `/integraciones/chatgpt`)
 * según el estado del visitante — mismo criterio que la tarjeta del add-on (resolveMcpCta):
 *
 *   anónimo              → "Crear cuenta"            → /register?source=mcp_landing
 *   plan gratuito        → "Mejorar mi plan"         → /plans
 *   pago sin add-on      → "Activar Conectores de IA" → diálogo de alta acá mismo
 *   con acceso           → "Conectar mi asistente"   → Integraciones → Asistentes de IA
 *   suscripción impaga   → "Actualizar el pago"      → portal de Stripe
 *   suscripción cancelándose → "Reactivar mi suscripción" → Cuenta → Suscripción
 *   beta cerrada         → "Solicitar acceso beta"   → modal de soporte (onBetaRequest)
 *
 * Tracking: sigue emitiendo `mcp_landing_cta_click` (la-ads tracking-map) con `cta_location`
 * y `page_variant`; suma `cta_kind` para distinguir el destino.
 */

import { useNavigate } from "react-router-dom";

import useAuth from "hooks/useAuth";
import useMcpAddon from "hooks/useMcpAddon";
import useMcpAddonActions, { MCP_INTEGRATIONS_PATH, MCP_SUBSCRIPTION_PATH } from "hooks/useMcpAddonActions";
import { usePublicAddons } from "hooks/usePublicAddons";
import { pushGTMEvent } from "utils/gtm";
import { MCP_CTA_LABELS, resolveMcpCta, type McpCtaKind } from "utils/mcpAddonState";
import { formatMonthlyPrice } from "utils/mcpBannerCopy";

interface Options {
	pageVariant?: "chatgpt";
	onBetaRequest: () => void;
}

const useMcpLandingCta = ({ pageVariant, onBetaRequest }: Options) => {
	const navigate = useNavigate();
	const { isLoggedIn } = useAuth();
	const { addon, loading } = useMcpAddon();
	const { startPurchase, openBillingPortal, busy, dialogs } = useMcpAddonActions({
		location: pageVariant === "chatgpt" ? "landing_chatgpt" : "landing_conectores",
	});

	const kind: McpCtaKind = resolveMcpCta(addon, isLoggedIn);
	const { addons: publicAddons } = usePublicAddons();
	const publicAddon = publicAddons.find((a) => a.key === "mcp_access") || null;
	const priceLabel =
		addon?.price.amount != null
			? formatMonthlyPrice(addon.price.amount, addon.price.currency)
			: publicAddon
			? formatMonthlyPrice(publicAddon.priceMonthly, publicAddon.currency)
			: null;

	const label = busy
		? "Procesando…"
		: kind === "register"
		? "Crear cuenta"
		: kind === "unavailable" && loading
		? "Cargando…"
		: MCP_CTA_LABELS[kind];

	const onClick = (location: string) => {
		pushGTMEvent("mcp_landing_cta_click", {
			cta_location: location,
			cta_kind: kind,
			...(pageVariant ? { page_variant: pageVariant } : {}),
		});
		switch (kind) {
			case "register":
				navigate(`/register?source=mcp_landing&plan=standard`);
				return;
			case "upgrade":
				navigate("/plans");
				return;
			case "activate":
				startPurchase();
				return;
			case "fix_payment":
				openBillingPortal();
				return;
			case "reactivate":
				navigate(MCP_SUBSCRIPTION_PATH);
				return;
			case "beta_request":
				onBetaRequest();
				return;
			case "team":
				return;
			default:
				navigate(MCP_INTEGRATIONS_PATH);
		}
	};

	/** Texto chico debajo del CTA final. */
	const footnote =
		kind === "connect"
			? "Ya tenés el add-on activo: pegá la URL del conector en tu asistente y autorizá el acceso."
			: kind === "team"
			? "Usás el plan de un equipo: el add-on lo activa el titular de la suscripción."
			: `Requiere un plan Estándar, Pro o Premium de Law||Analytics con el add-on Conectores de IA${priceLabel ? ` (${priceLabel})` : ""}.`;

	return { kind, label, onClick, disabled: busy || kind === "team" || (kind === "unavailable" && loading), footnote, priceLabel, dialogs };
};

export default useMcpLandingCta;

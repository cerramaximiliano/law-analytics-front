/**
 * Copy de /oauth/upgrade-required por `reason`. Las razones salen de
 * la-subscriptions `featureAccessService.Reason` (plan check del consent) y del hub
 * `mcpClientStatusService` (switches de proveedor, C-TOGGLES):
 *
 *   plan check: plan_too_low, no_subscription, addon_missing, addon_past_due (deprecado),
 *               addon_status_invalid, subscription_inactive, account_suspended, user_inactive
 *   switches:   beta_grant_required, maintenance
 */

import { MCP_ADDON_NAME, MCP_ADDON_PLANS_URL, planLabel } from "utils/mcpAddonState";

export type UpgradeAction =
	/** Navegar a una URL. */
	| { kind: "href"; href: string }
	/** Abrir el diálogo de alta del add-on acá mismo (y volver al consent al terminar). */
	| { kind: "activate_addon" }
	/** Portal de facturación de Stripe (cae a Cuenta → Suscripción). */
	| { kind: "billing" };

export interface UpgradeReasonCopy {
	tone: "upgrade" | "addon" | "payment" | "blocked" | "info";
	title: string;
	body: string;
	ctaText: string;
	action: UpgradeAction;
}

export const UPGRADE_PLANS_URL = "/plans";
export const SUBSCRIPTION_URL = "/apps/profiles/account/subscription";
export const BETA_LANDING_URL = "/integraciones/conectores-ai";

const STRIPE_STATUS_LABELS: Record<string, string> = {
	unpaid: "impaga",
	canceled: "cancelada",
	incomplete: "con el primer pago pendiente",
	incomplete_expired: "vencida sin pago",
	paused: "pausada",
};

export function getUpgradeReasonCopy(reason: string, plan: string | null, subscriptionStatus?: string | null): UpgradeReasonCopy {
	const planName = planLabel(plan && plan !== "manual_grant" ? plan : null);

	switch (reason) {
		case "plan_too_low":
		case "no_subscription":
			return {
				tone: "upgrade",
				title: "Necesitás un plan Estándar, Pro o Premium",
				body: `Conectar asistentes de IA (Claude.ai, ChatGPT) está disponible para los planes Estándar, Pro y Premium con el add-on ${MCP_ADDON_NAME}. Tu plan actual: ${planName}.`,
				ctaText: "Ver planes",
				action: { kind: "href", href: UPGRADE_PLANS_URL },
			};
		case "addon_missing":
			return {
				tone: "addon",
				title: `Activá ${MCP_ADDON_NAME} para conectar`,
				body: `Tu plan ${planName} permite sumar el add-on ${MCP_ADDON_NAME}. Activalo y seguimos con la autorización: no hace falta volver a empezar desde el asistente.`,
				ctaText: `Activar ${MCP_ADDON_NAME}`,
				action: { kind: "activate_addon" },
			};
		case "addon_past_due":
		case "addon_status_invalid":
			return {
				tone: "payment",
				title: "Hay un pago pendiente en tu add-on",
				body: `No pudimos cobrar ${MCP_ADDON_NAME}. Actualizá tu medio de pago para reactivar la conexión.`,
				ctaText: "Actualizar el pago",
				action: { kind: "billing" },
			};
		case "subscription_inactive": {
			const st = subscriptionStatus ? STRIPE_STATUS_LABELS[subscriptionStatus] : null;
			return {
				tone: "payment",
				title: "Tu suscripción está inactiva",
				body: `${
					st ? `Tu suscripción figura ${st}. ` : ""
				}Mientras no se regularice el pago, los asistentes de IA no pueden acceder a tu cuenta. Actualizá el pago y volvé a intentar.`,
				ctaText: "Actualizar el pago",
				action: { kind: "billing" },
			};
		}
		case "account_suspended":
			return {
				tone: "blocked",
				title: "Tu cuenta está suspendida por falta de pago",
				body: "Regularizá el pago de tu suscripción para volver a conectar asistentes de IA. Si ya pagaste, puede demorar unos minutos en impactar.",
				ctaText: "Regularizar el pago",
				action: { kind: "href", href: SUBSCRIPTION_URL },
			};
		case "user_inactive":
			return {
				tone: "blocked",
				title: "Tu cuenta está desactivada",
				body: "No podemos autorizar asistentes de IA para una cuenta desactivada. Escribinos a soporte y lo revisamos.",
				ctaText: "Escribir a soporte",
				action: { kind: "href", href: "mailto:soporte@lawanalytics.app" },
			};
		case "beta_grant_required":
			return {
				tone: "info",
				title: "La conexión con asistentes está en beta cerrada",
				body: "Por ahora solo pueden conectar las cuentas invitadas a la beta. Pedí acceso y te avisamos cuando esté habilitado.",
				ctaText: "Solicitar acceso a la beta",
				action: { kind: "href", href: BETA_LANDING_URL },
			};
		case "maintenance":
			return {
				tone: "info",
				title: "Conexión en mantenimiento",
				body: "La conexión con asistentes de IA está pausada por mantenimiento. Volvé a intentar en un rato.",
				ctaText: "Ir a Law||Analytics",
				action: { kind: "href", href: "/" },
			};
		default:
			return {
				tone: "blocked",
				title: "No podemos completar la autorización",
				body: "Tu cuenta no cumple los requisitos para conectar esta aplicación. Si pensás que es un error, escribinos a soporte.",
				ctaText: "Ver el add-on",
				action: { kind: "href", href: MCP_ADDON_PLANS_URL },
			};
	}
}

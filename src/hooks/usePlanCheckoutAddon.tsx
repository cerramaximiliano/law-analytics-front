/**
 * usePlanCheckoutAddon — "Agregar Conectores de IA" al contratar un plan (un solo Stripe
 * Checkout con dos líneas). Para usuarios logueados SIN plan pago, en /suscripciones/tables
 * y en /plans. Con plan pago no se ofrece: el add-on se suma desde su tarjeta y los
 * botones/diálogos de cambio de plan quedan como están.
 *
 *   const addonCheckout = usePlanCheckoutAddon();
 *   <PlanCard beforeCta={addonCheckout.offer && <PlanCheckoutAddonOption ... />} />
 *   onClick: addonCheckout.begin({ planId, planName, planPrice, proceed: (opts) => subscribe(planId, opts) })
 *   {addonCheckout.dialogs}
 *
 * Flujo: checkbox marcado → McpAddonLegalDialog (aceptación obligatoria si hay política
 * activa) → `proceed({ addons: ["mcp_access"], acceptedPolicyVersion })` (POST /checkout) →
 * Stripe. Sin checkbox, `proceed()` va directo, igual que antes.
 * Tracking: mcp_addon_cta_click / mcp_addon_dialog_open / mcp_addon_purchase_error con
 * cta_location "plan_checkout" (el alta se mide en la página de éxito).
 */

import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";

import McpAddonLegalDialog, { type McpAddonDialogError } from "components/legal/McpAddonLegalDialog";
import useAuth from "hooks/useAuth";
import useMcpAddon from "hooks/useMcpAddon";
import ApiService, { LEGAL_ACCEPTANCE_REQUIRED, PRIVACY_CONNECTORS_URL } from "store/reducers/ApiService";
import { openSnackbar } from "store/reducers/snackbar";
import { trackMcpAddonCtaClick, trackMcpAddonDialogOpen, trackMcpAddonPurchaseError } from "utils/gtm";
import { mcpUserState } from "utils/mcpAddonState";
import { MCP_ADDON_KEY } from "types/mcpAddon";
import { formatMonthlyPrice } from "utils/mcpBannerCopy";
import {
	formatPlanAddonTotal,
	isAddonCompatiblePlan,
	PLAN_CHECKOUT_ADDON_CODES,
	PLAN_CHECKOUT_CTA_LOCATION,
	planCheckoutAddonErrorMessage,
	shouldOfferAddonAtPlanCheckout,
} from "utils/planCheckoutAddon";

export interface PlanCheckoutAddonOptions {
	addons: string[];
	acceptedPolicyVersion: string | null;
}

/** Respuesta de POST /checkout tal como la devuelve ApiService.subscribeToPlan (no lanza). */
export type PlanCheckoutResponse = {
	success?: boolean;
	code?: string;
	message?: string;
	privacyVersion?: string;
	privacyUrl?: string;
	reason?: string;
} | void;

export interface BeginCheckoutArgs {
	planId: string;
	/** "Estándar" (sin "Plan"). */
	planName: string;
	planPrice: number | null;
	planCurrency?: string | null;
	/** Llama al checkout del hub. Sin add-on recibe `undefined`. */
	proceed: (addon?: PlanCheckoutAddonOptions) => Promise<PlanCheckoutResponse>;
}

interface DialogState {
	args: BeginCheckoutArgs;
	version: string | null;
	privacyUrl: string;
	error: McpAddonDialogError | null;
}

const usePlanCheckoutAddon = () => {
	const dispatch = useDispatch();
	const { isLoggedIn } = useAuth();
	const { addon, refresh } = useMcpAddon();
	const [selected, setSelectedMap] = useState<Record<string, boolean>>({});
	const [dialog, setDialog] = useState<DialogState | null>(null);
	const [busy, setBusy] = useState(false);

	const offer = shouldOfferAddonAtPlanCheckout(addon, !!isLoggedIn);
	const addonPrice = { amount: addon?.price.amount ?? null, currency: addon?.price.currency || "usd" };

	const snackbar = useCallback(
		(message: string, color: "success" | "error" | "warning" | "info") =>
			dispatch(openSnackbar({ open: true, message, variant: "alert", alert: { color }, close: true })),
		[dispatch],
	);

	const isSelected = useCallback((planId: string) => offer && isAddonCompatiblePlan(planId) && !!selected[planId], [offer, selected]);

	const setSelected = useCallback(
		(planId: string, checked: boolean) => {
			setSelectedMap((prev) => ({ ...prev, [planId]: checked }));
			if (checked) trackMcpAddonCtaClick(PLAN_CHECKOUT_CTA_LOCATION, `plan_${planId}`, mcpUserState(addon, !!isLoggedIn));
		},
		[addon, isLoggedIn],
	);

	const clearSelection = () => setSelectedMap({});

	/** true si el rechazo era propio del add-on y ya se resolvió acá (diálogo o aviso). */
	const handleAddonRejection = async (res: Exclude<PlanCheckoutResponse, void>, current: DialogState, acceptedVersion: string | null) => {
		if (!res.code || !PLAN_CHECKOUT_ADDON_CODES.has(res.code)) return false;
		trackMcpAddonPurchaseError(PLAN_CHECKOUT_CTA_LOCATION, res.code);
		if (res.code === LEGAL_ACCEPTANCE_REQUIRED) {
			const versions = res.privacyVersion
				? { privacy: res.privacyVersion, privacyUrl: res.privacyUrl || PRIVACY_CONNECTORS_URL }
				: await ApiService.getLegalVersions();
			setDialog({
				...current,
				version: versions.privacy,
				privacyUrl: versions.privacyUrl || PRIVACY_CONNECTORS_URL,
				error: {
					severity: "warning",
					message: acceptedVersion
						? "La Política de Privacidad se actualizó. Revisala y volvé a aceptarla para continuar."
						: "Para continuar tenés que aceptar la Política de Privacidad vigente.",
				},
			});
			return true;
		}
		if (res.code === "ADDON_NOT_AVAILABLE" || res.code === "ADDON_USE_ADDON_FLOW") {
			// Ya no corresponde ofrecerlo acá: cerrar, destildar y releer el estado.
			setDialog(null);
			clearSelection();
			snackbar(planCheckoutAddonErrorMessage(res.code, res.reason), "info");
			refresh().catch(() => {});
			return true;
		}
		setDialog({ ...current, error: { severity: "error", message: planCheckoutAddonErrorMessage(res.code) } });
		return true;
	};

	const confirm = async (acceptedVersion: string | null) => {
		if (!dialog) return;
		const current = dialog;
		let redirecting = false;
		setBusy(true);
		try {
			const res = await current.args.proceed({ addons: [MCP_ADDON_KEY], acceptedPolicyVersion: acceptedVersion });
			if (res && res.success === false) {
				if (await handleAddonRejection(res, current, acceptedVersion)) return;
				// Rechazo del checkout en general (descuento, plan…): ya lo avisó el caller.
				trackMcpAddonPurchaseError(PLAN_CHECKOUT_CTA_LOCATION, res.code || "unknown");
				setDialog(null);
				return;
			}
			// Éxito: el caller redirige a Stripe (el diálogo queda "Procesando…" hasta salir).
			// Si no hubo redirección (respuesta sin url), cerrar.
			redirecting = !!res && !!(res as any).url;
			if (!redirecting) setDialog(null);
		} catch (err) {
			trackMcpAddonPurchaseError(PLAN_CHECKOUT_CTA_LOCATION, "network");
			setDialog({
				...current,
				error: { severity: "error", message: err instanceof Error ? err.message : "No pudimos iniciar el pago. Intentá de nuevo." },
			});
		} finally {
			if (!redirecting) setBusy(false);
		}
	};

	/** Click en "Suscribirme": con el add-on tildado abre el diálogo; si no, sigue directo. */
	const begin = useCallback(
		async (args: BeginCheckoutArgs) => {
			if (!isSelected(args.planId)) {
				await args.proceed(undefined);
				return;
			}
			let version: string | null;
			let privacyUrl: string;
			if (addon?.legal) {
				version = addon.legal.acceptanceRequired ? addon.legal.privacyVersion : null;
				privacyUrl = addon.legal.privacyUrl || PRIVACY_CONNECTORS_URL;
			} else {
				const versions = await ApiService.getLegalVersions();
				version = versions.privacy;
				privacyUrl = versions.privacyUrl || PRIVACY_CONNECTORS_URL;
			}
			trackMcpAddonDialogOpen(PLAN_CHECKOUT_CTA_LOCATION, !!version);
			setDialog({ args, version, privacyUrl, error: null });
		},
		[addon, isSelected],
	);

	const totalFor = (planName: string, planPrice: number | null, planCurrency?: string | null) =>
		formatPlanAddonTotal({ planName, planPrice, planCurrency, addonPrice: addonPrice.amount, addonCurrency: addonPrice.currency });

	const dialogs = dialog ? (
		<McpAddonLegalDialog
			open
			policyVersion={dialog.version}
			privacyUrl={dialog.privacyUrl}
			priceLabel={formatMonthlyPrice(addonPrice.amount, addonPrice.currency)}
			busy={busy}
			error={dialog.error}
			planCheckout={{
				planName: dialog.args.planName,
				totalLabel: totalFor(dialog.args.planName, dialog.args.planPrice, dialog.args.planCurrency),
			}}
			onCancel={() => setDialog(null)}
			onConfirm={confirm}
		/>
	) : null;

	return { offer, addonPrice, isSelected, setSelected, begin, totalFor, busy, dialogs };
};

export default usePlanCheckoutAddon;

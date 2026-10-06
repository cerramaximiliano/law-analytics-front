/**
 * useMcpAddonActions — alta y baja del add-on "Conectores de IA" con sus diálogos.
 *
 * Un único flujo para todas las pantallas (/plans, cuenta → suscripción, integraciones →
 * asistentes de IA, landings): confirmación con precio + checkbox de política (P4),
 * checkout, autenticación del banco (SCA), tarjeta rechazada, y baja con confirmación.
 *
 *   const { startPurchase, startCancel, busy, dialogs } = useMcpAddonActions({ location: "plans_page" });
 *   ...
 *   {dialogs}
 */

import { useCallback, useState } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";

import McpAddonLegalDialog, { type McpAddonDialogError } from "components/legal/McpAddonLegalDialog";
import McpAddonCancelDialog from "components/legal/McpAddonCancelDialog";
import useMcpAddon from "hooks/useMcpAddon";
import ApiService, {
	ADDON_REQUIRES_ACTION,
	LEGAL_ACCEPTANCE_REQUIRED,
	PRIVACY_CONNECTORS_URL,
	type AddAddonResult,
} from "store/reducers/ApiService";
import { openSnackbar } from "store/reducers/snackbar";
import {
	trackMcpAddonCancel,
	trackMcpAddonDialogOpen,
	trackMcpAddonPurchase,
	trackMcpAddonPurchaseError,
	type McpAddonCtaLocation,
} from "utils/gtm";
import { MCP_ADDON_NAME, formatAddonDate } from "utils/mcpAddonState";
import { formatMonthlyPrice } from "utils/mcpBannerCopy";
import { confirmAddonPayment } from "utils/stripeConfirm";

export const MCP_INTEGRATIONS_PATH = "/apps/profiles/account/pjn?view=ia";
const SUBSCRIPTION_PATH = "/apps/profiles/account/subscription";

interface Options {
	location: McpAddonCtaLocation;
	/** Después de un alta exitosa. Por defecto: ir a Integraciones → Asistentes de IA. */
	onActivated?: () => void;
}

interface PurchaseDialogState {
	version: string | null;
	privacyUrl: string;
	error: McpAddonDialogError | null;
}

const useMcpAddonActions = ({ location, onActivated }: Options) => {
	const dispatch = useDispatch();
	const navigate = useNavigate();
	const { addon, refresh } = useMcpAddon();
	const [busy, setBusy] = useState(false);
	const [purchaseDialog, setPurchaseDialog] = useState<PurchaseDialogState | null>(null);
	const [cancelDialog, setCancelDialog] = useState<{ error: string | null } | null>(null);

	const priceLabel = addon ? formatMonthlyPrice(addon.price.amount, addon.price.currency) : null;

	const snackbar = useCallback(
		(message: string, color: "success" | "error" | "warning" | "info") =>
			dispatch(openSnackbar({ open: true, message, variant: "alert", alert: { color }, close: color !== "success" })),
		[dispatch],
	);

	const openBillingPortal = useCallback(async () => {
		try {
			const res = await ApiService.createBillingPortalSession(window.location.href);
			if (res?.success && res.url) {
				window.location.href = res.url;
				return;
			}
		} catch {
			// cae a la vista de suscripción
		}
		navigate(SUBSCRIPTION_PATH);
	}, [navigate]);

	const finishActivated = useCallback(
		async (outcome: "active" | "already_active" | "payment_pending") => {
			trackMcpAddonPurchase(location, outcome, addon?.price.amount ?? null, addon?.price.currency || "usd");
			setPurchaseDialog(null);
			await refresh();
			if (outcome === "payment_pending") {
				snackbar(
					`Activamos ${MCP_ADDON_NAME}, pero el cobro quedó pendiente. Actualizá tu medio de pago para no perder el acceso.`,
					"warning",
				);
			} else {
				snackbar(
					outcome === "already_active"
						? `${MCP_ADDON_NAME} ya estaba activo.`
						: `¡Listo! ${MCP_ADDON_NAME} está activo. Ahora conectá tu asistente.`,
					"success",
				);
			}
			if (onActivated) onActivated();
			else navigate(MCP_INTEGRATIONS_PATH);
		},
		[addon, location, navigate, onActivated, refresh, snackbar],
	);

	const setDialogError = (error: McpAddonDialogError) => setPurchaseDialog((d) => (d ? { ...d, error } : d));

	const handleResult = async (res: AddAddonResult, acceptedVersion: string | null) => {
		if (res.success) {
			const st = res.addon?.status;
			await finishActivated(res.alreadyActive ? "already_active" : st === "past_due" || st === "incomplete" ? "payment_pending" : "active");
			return;
		}
		trackMcpAddonPurchaseError(location, res.code || "unknown");
		switch (res.code) {
			case LEGAL_ACCEPTANCE_REQUIRED: {
				// La política vigente cambió (o el front no la conocía): pedir la versión actual antes de cobrar.
				const versions = await ApiService.getLegalVersions();
				setPurchaseDialog({
					version: versions.privacy,
					privacyUrl: versions.privacyUrl || PRIVACY_CONNECTORS_URL,
					error: {
						severity: "warning",
						message: acceptedVersion
							? "La Política de Privacidad se actualizó. Revisala y volvé a aceptarla para continuar."
							: "Para continuar tenés que aceptar la Política de Privacidad vigente.",
					},
				});
				return;
			}
			case ADDON_REQUIRES_ACTION: {
				const outcome = await confirmAddonPayment(res);
				if (outcome.ok === true) {
					await finishActivated("active");
				} else if (outcome.ok === "redirected") {
					setDialogError({
						severity: "info",
						message: "Tu banco pide confirmar el pago. Completalo en la pestaña de Stripe que abrimos y después tocá «Ya pagué».",
						action: {
							label: "Ya pagué",
							onClick: async () => {
								await refresh();
								setPurchaseDialog(null);
							},
						},
					});
				} else {
					setDialogError({
						severity: "error",
						message: outcome.message,
						action: { label: "Actualizar medio de pago", onClick: openBillingPortal },
					});
				}
				return;
			}
			case "CARD_DECLINED":
				setDialogError({
					severity: "error",
					// El mensaje de Stripe viene en inglés: no lo mostramos.
					message: "Tu tarjeta rechazó el cobro. Actualizá el medio de pago y probá de nuevo.",
					action: { label: "Actualizar medio de pago", onClick: openBillingPortal },
				});
				return;
			case "PAID_PLAN_REQUIRED":
			case "NO_PAID_SUBSCRIPTION":
				setDialogError({
					severity: "warning",
					message: "Necesitás un plan Estándar, Pro o Premium activo para agregar el add-on.",
					action: { label: "Ver planes", onClick: () => navigate("/plans") },
				});
				return;
			default:
				setDialogError({ severity: "error", message: res.message || "No pudimos activar el add-on. Intentá de nuevo en unos minutos." });
		}
	};

	const confirmPurchase = async (acceptedVersion: string | null) => {
		setBusy(true);
		try {
			const res = await ApiService.addAddon("mcp_access", acceptedVersion);
			await handleResult(res, acceptedVersion);
		} catch (err) {
			trackMcpAddonPurchaseError(location, "network");
			setDialogError({
				severity: "error",
				message: err instanceof Error ? err.message : "No pudimos activar el add-on. Intentá de nuevo.",
			});
		} finally {
			setBusy(false);
		}
	};

	/** Abre el diálogo de alta (pide antes la versión vigente de la política). */
	const startPurchase = useCallback(async () => {
		setBusy(true);
		const versions = await ApiService.getLegalVersions();
		setBusy(false);
		trackMcpAddonDialogOpen(location, !!versions.privacy);
		setPurchaseDialog({ version: versions.privacy, privacyUrl: versions.privacyUrl || PRIVACY_CONNECTORS_URL, error: null });
	}, [location]);

	const startCancel = useCallback(() => setCancelDialog({ error: null }), []);

	const confirmCancel = async () => {
		setBusy(true);
		try {
			const res = await ApiService.removeAddon("mcp_access");
			if (!res.success) throw new Error(res.message || "No pudimos quitar el add-on.");
			trackMcpAddonCancel(location);
			setCancelDialog(null);
			await refresh();
			const until = formatAddonDate(res.cancelAt || null);
			snackbar(
				until
					? `${MCP_ADDON_NAME} sigue activo hasta el ${until}.`
					: `Quitamos ${MCP_ADDON_NAME}. Tus asistentes ya no pueden consultar tu cuenta.`,
				"info",
			);
		} catch (err) {
			setCancelDialog({ error: err instanceof Error ? err.message : "No pudimos quitar el add-on. Intentá de nuevo." });
		} finally {
			setBusy(false);
		}
	};

	const dialogs = (
		<>
			{purchaseDialog && (
				<McpAddonLegalDialog
					open
					policyVersion={purchaseDialog.version}
					privacyUrl={purchaseDialog.privacyUrl}
					priceLabel={priceLabel}
					currentPlan={addon?.eligibility.currentPlan}
					busy={busy}
					error={purchaseDialog.error}
					onCancel={() => setPurchaseDialog(null)}
					onConfirm={confirmPurchase}
				/>
			)}
			{cancelDialog && (
				<McpAddonCancelDialog
					open
					busy={busy}
					error={cancelDialog.error}
					cancelBehavior={addon?.cancelBehavior || "immediate"}
					periodEndLabel={formatAddonDate(addon?.nextChargeAt || null)}
					keepsBetaAccess={addon?.access.via === "beta_grant"}
					onCancel={() => setCancelDialog(null)}
					onConfirm={confirmCancel}
				/>
			)}
		</>
	);

	return { startPurchase, startCancel, openBillingPortal, busy, dialogs };
};

export default useMcpAddonActions;

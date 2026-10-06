/**
 * useMcpAddonActions — alta y baja del add-on "Conectores de IA" con sus diálogos.
 *
 * Un único flujo para todas las pantallas (/plans, cuenta → suscripción, integraciones →
 * asistentes de IA, landings): confirmación con precio + checkbox de política (P4),
 * checkout (errores 402/409 del hub, sin cargo), re-lectura del GET y baja inmediata con confirmación.
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
import ApiService, { LEGAL_ACCEPTANCE_REQUIRED, PRIVACY_CONNECTORS_URL, type AddAddonResult } from "store/reducers/ApiService";
import { openSnackbar } from "store/reducers/snackbar";
import {
	trackMcpAddonCancel,
	trackMcpAddonDialogOpen,
	trackMcpAddonPurchase,
	trackMcpAddonPurchaseError,
	type McpAddonCtaLocation,
} from "utils/gtm";
import { MCP_ADDON_NAME } from "utils/mcpAddonState";
import { formatMonthlyPrice } from "utils/mcpBannerCopy";

export const MCP_INTEGRATIONS_PATH = "/apps/profiles/account/pjn?view=ia";
export const MCP_SUBSCRIPTION_PATH = "/apps/profiles/account/subscription";
const SUBSCRIPTION_PATH = MCP_SUBSCRIPTION_PATH;

/** Copy de los 402 del checkout (`error_if_incomplete`: nunca hay cargo ni add-on a medias). */
const PAYMENT_FAILED_MESSAGES: Record<string, string> = {
	PAYMENT_REQUIRES_ACTION: "Tu banco pidió verificar el pago y no se pudo completar. No se realizó ningún cargo.",
	CARD_DECLINED: "La tarjeta fue rechazada. No se realizó ningún cargo.",
};

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
				// La política vigente cambió (o el front no la conocía): el 400 trae la versión actual.
				const versions = res.privacyVersion
					? { privacy: res.privacyVersion, privacyUrl: res.privacyUrl || PRIVACY_CONNECTORS_URL }
					: await ApiService.getLegalVersions();
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
			case "PAYMENT_REQUIRES_ACTION":
			case "CARD_DECLINED":
				// El mensaje de Stripe viene en inglés: usamos el nuestro.
				setDialogError({
					severity: "error",
					message: `${PAYMENT_FAILED_MESSAGES[res.code]} Actualizá tu medio de pago en el portal de facturación e intentá de nuevo.`,
					action: { label: "Abrir portal de pago", onClick: openBillingPortal },
				});
				return;
			case "SUBSCRIPTION_NOT_ACTIVE":
				setDialogError({
					severity: "warning",
					message: "Tu suscripción tiene un pago pendiente o no está activa. Regularizá el pago antes de agregar el add-on.",
					action: { label: "Actualizar el pago", onClick: openBillingPortal },
				});
				return;
			case "SUBSCRIPTION_CANCELING":
				setDialogError({
					severity: "warning",
					message: "Tu suscripción está programada para cancelarse. Reactivala antes de agregar el add-on.",
					action: { label: "Reactivar mi suscripción", onClick: () => navigate(SUBSCRIPTION_PATH) },
				});
				return;
			case "ADDON_NOT_AVAILABLE":
				setDialogError({
					severity: "info",
					message:
						res.reason === "maintenance"
							? "La conexión con asistentes de IA está en mantenimiento. Probá de nuevo en un rato."
							: "El add-on todavía no está disponible para contratar.",
				});
				await refresh();
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

	/**
	 * Abre el diálogo de alta. La versión de la política sale de `legal` del GET consolidado;
	 * sin él (fallback) se consulta /api/legal/versions.
	 */
	const startPurchase = useCallback(async () => {
		let version: string | null;
		let privacyUrl: string;
		if (addon?.legal) {
			version = addon.legal.acceptanceRequired ? addon.legal.privacyVersion : null;
			privacyUrl = addon.legal.privacyUrl || PRIVACY_CONNECTORS_URL;
		} else {
			setBusy(true);
			const versions = await ApiService.getLegalVersions();
			setBusy(false);
			version = versions.privacy;
			privacyUrl = versions.privacyUrl || PRIVACY_CONNECTORS_URL;
		}
		trackMcpAddonDialogOpen(location, !!version);
		setPurchaseDialog({ version, privacyUrl, error: null });
	}, [addon, location]);

	const startCancel = useCallback(() => setCancelDialog({ error: null }), []);

	const confirmCancel = async () => {
		setBusy(true);
		try {
			const res = await ApiService.removeAddon("mcp_access");
			if (!res.success) throw new Error(res.message || "No pudimos quitar el add-on.");
			trackMcpAddonCancel(location);
			setCancelDialog(null);
			await refresh();
			snackbar(`Quitamos ${MCP_ADDON_NAME}. Tus asistentes ya no pueden consultar tu cuenta.`, "info");
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
					currentPlan={addon?.plan}
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

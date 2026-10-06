/**
 * /oauth/upgrade-required — pantalla mostrada cuando el plan/addon del user NO
 * habilita MCP. Redirigida automáticamente desde /oauth/consent.
 *
 * Recibe por query string:
 *  - `reason` — razón del plan check (ver utils/mcpUpgradeReasons.ts: plan_too_low,
 *    no_subscription, addon_missing, addon_past_due, addon_status_invalid,
 *    subscription_inactive, account_suspended, user_inactive, beta_grant_required, maintenance)
 *  - `plan` — plan actual del user (free/standard/pro/premium), para mostrar contexto
 *  - `subscription_status` — opcional, status de Stripe con subscription_inactive
 *  - `consent_challenge` — el challenge OAuth pendiente, para rechazarlo si el user
 *    clickea "Cancelar" o retomarlo después de activar el add-on
 *
 * Con `addon_missing` el add-on se activa acá mismo (diálogo con precio + política) y,
 * si hay challenge, se vuelve al consent para terminar la autorización sin reiniciarla
 * desde el asistente. Track `oauth_upgrade_view` con reason como dimensión.
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Alert, Box, Button, Grid, Stack, Typography } from "@mui/material";

import AuthWrapper from "sections/auth/AuthWrapper";
import Logo from "components/logo";
import axiosInstance from "utils/axios";
import { trackOauthConsentReject, trackOauthUpgradeView } from "utils/gtm";
import useMcpAddonActions from "hooks/useMcpAddonActions";
import { getUpgradeReasonCopy, type UpgradeReasonCopy } from "utils/mcpUpgradeReasons";

import { ArrowUp2, Card, Crown, InfoCircle, Lock1 } from "iconsax-react";

interface RejectResponse {
	redirect_to: string;
}

const TONE_ICON: Record<UpgradeReasonCopy["tone"], { icon: (size: number) => JSX.Element }> = {
	upgrade: { icon: (size) => <Crown size={size} color="#ed6c02" variant="Bulk" /> },
	addon: { icon: (size) => <ArrowUp2 size={size} color="#3A7BFF" variant="Bulk" /> },
	payment: { icon: (size) => <Card size={size} color="#d32f2f" variant="Bulk" /> },
	blocked: { icon: (size) => <Lock1 size={size} color="#757575" variant="Bulk" /> },
	info: { icon: (size) => <InfoCircle size={size} color="#3A7BFF" variant="Bulk" /> },
};

const OauthUpgradeRequiredPage = () => {
	const [searchParams] = useSearchParams();
	const reason = searchParams.get("reason") || "unknown";
	const plan = searchParams.get("plan");
	const subscriptionStatus = searchParams.get("subscription_status");
	const challenge = searchParams.get("consent_challenge");

	const [isCancelling, setIsCancelling] = useState(false);
	const [globalError, setGlobalError] = useState<string | null>(null);

	const copy = getUpgradeReasonCopy(reason, plan, subscriptionStatus);

	// Alta del add-on acá mismo; al terminar, retomar el consent pendiente.
	const { startPurchase, openBillingPortal, busy, dialogs } = useMcpAddonActions({
		location: "oauth_upgrade_required",
		onActivated: () => {
			window.location.href = challenge
				? `/oauth/consent?consent_challenge=${encodeURIComponent(challenge)}`
				: "/apps/profiles/account/pjn?view=ia";
		},
	});

	const handleCta = () => {
		if (copy.action.kind === "activate_addon") startPurchase();
		else if (copy.action.kind === "billing") openBillingPortal();
		else window.location.href = copy.action.href;
	};

	useEffect(() => {
		trackOauthUpgradeView(reason, plan || undefined);
	}, [reason, plan]);

	const handleCancel = async () => {
		// Si tenemos el challenge, rejectearlo en Hydra para liberar el slot +
		// que el cliente OAuth reciba el error correcto. Si no, intentar cerrar
		// el popup; si no es popup, redirigir al home.
		if (!challenge) {
			window.close();
			// Si window.close() no tuvo efecto (no es popup), fallback al home.
			// Pequeño delay para no competir con el close.
			setTimeout(() => {
				if (!window.closed) {
					window.location.href = "/";
				}
			}, 100);
			return;
		}

		setIsCancelling(true);
		setGlobalError(null);
		try {
			const res = await axiosInstance.post<RejectResponse>("/api/oauth/consent/reject", {
				consent_challenge: challenge,
				reason: `subscription_required:${reason}`,
			});
			trackOauthConsentReject(undefined, `subscription_required:${reason}`);
			window.location.href = res.data.redirect_to;
		} catch (err: any) {
			const msg = err.response?.data?.error_description || "No se pudo cancelar la solicitud. Cerrá la ventana e intentá de nuevo.";
			setGlobalError(msg);
			setIsCancelling(false);
		}
	};

	return (
		<AuthWrapper>
			<Grid container spacing={3}>
				<Grid item xs={12} sx={{ textAlign: "center" }}>
					<Logo to="/" animation="letters" />
				</Grid>

				<Grid item xs={12}>
					<Box sx={{ textAlign: "center", py: 2 }}>
						<Stack alignItems="center" spacing={2}>
							{TONE_ICON[copy.tone].icon(48)}
							<Typography variant="h4" sx={{ textWrap: "balance" }}>
								{copy.title}
							</Typography>
							<Typography variant="body1" color="text.secondary" sx={{ maxWidth: 480 }}>
								{copy.body}
							</Typography>
						</Stack>
					</Box>
				</Grid>

				{globalError && (
					<Grid item xs={12}>
						<Alert severity="error">{globalError}</Alert>
					</Grid>
				)}

				<Grid item xs={12}>
					<Stack direction={{ xs: "column-reverse", sm: "row" }} spacing={2} justifyContent="center">
						<Button variant="outlined" color="secondary" onClick={handleCancel} disabled={isCancelling} size="large">
							{isCancelling ? "Cancelando..." : "Cancelar"}
						</Button>
						<Button variant="contained" color="primary" size="large" onClick={handleCta} disabled={busy || isCancelling}>
							{busy ? "Procesando…" : copy.ctaText}
						</Button>
					</Stack>
				</Grid>

				<Grid item xs={12}>
					<Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center" }}>
						¿Necesitás ayuda?{" "}
						<a href="mailto:soporte@lawanalytics.app" style={{ color: "inherit" }}>
							Contactá a soporte
						</a>
						.
					</Typography>
				</Grid>
			</Grid>
			{dialogs}
		</AuthWrapper>
	);
};

export default OauthUpgradeRequiredPage;

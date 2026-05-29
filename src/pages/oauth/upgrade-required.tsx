/**
 * /oauth/upgrade-required — pantalla mostrada cuando el plan/addon del user NO
 * habilita MCP. Redirigida automáticamente desde /oauth/consent.
 *
 * Recibe por query string:
 *  - `reason` — uno de: plan_too_low | addon_missing | addon_past_due
 *  - `plan` — plan actual del user (standard/premium/free), para mostrar contexto
 *  - `consent_challenge` — el challenge OAuth pendiente, para poder rejectarlo
 *    si el user clickea "Cancelar"
 *
 * Cada `reason` muestra copy + CTA distintos. Track `oauth_upgrade_view` con
 * reason como dimensión — señal valiosa de upsell potencial.
 */

import { useEffect, useState } from "react";
import { useSearchParams } from "react-router-dom";

import { Alert, Box, Button, Grid, Stack, Typography } from "@mui/material";

import AuthWrapper from "sections/auth/AuthWrapper";
import Logo from "components/logo";
import axiosInstance from "utils/axios";
import { trackOauthConsentReject, trackOauthUpgradeView } from "utils/gtm";

import { ArrowUp2, Card, Crown, Lock1, Refresh2 } from "iconsax-react";

interface RejectResponse {
	redirect_to: string;
}

interface ReasonCopy {
	icon: JSX.Element;
	title: string;
	body: string;
	ctaText: string;
	ctaHref: string;
	ctaIcon: JSX.Element;
}

const PLAN_DISPLAY: Record<string, string> = {
	free: "Gratis",
	standard: "Estándar",
	premium: "Premium",
};

/**
 * URLs CTA por defecto — overridables por env vars si el front se deploya
 * con paths distintos en distintos entornos.
 */
const UPGRADE_URL = import.meta.env.VITE_UPGRADE_URL || "/plans";
const ADDON_SUBSCRIBE_URL = import.meta.env.VITE_MCP_ADDON_SUBSCRIBE_URL || "/settings/billing";

function getCopyForReason(reason: string, plan: string | null): ReasonCopy {
	const planDisplay = plan ? PLAN_DISPLAY[plan] || plan : "Gratis";

	switch (reason) {
		case "plan_too_low":
		case "no_subscription":
			return {
				icon: <Lock1 size={48} color="#ed6c02" variant="Bulk" />,
				title: "MCP requiere un plan superior",
				body: `La integración con asistentes de IA (Claude.ai, ChatGPT, etc.) está disponible para planes Estándar y Premium. Tu plan actual: ${planDisplay}.`,
				ctaText: "Ver planes",
				ctaHref: UPGRADE_URL,
				ctaIcon: <Crown size={18} />,
			};
		case "addon_missing":
			return {
				icon: <ArrowUp2 size={48} color="#1976d2" variant="Bulk" />,
				title: "Activá MCP Access para conectar",
				body: `Tu plan ${planDisplay} permite agregar MCP Access como add-on opcional. Una vez activado, podés conectar Claude.ai, ChatGPT y otras IAs compatibles a tu cuenta.`,
				ctaText: "Activar MCP Access",
				ctaHref: ADDON_SUBSCRIBE_URL,
				ctaIcon: <ArrowUp2 size={18} />,
			};
		case "addon_past_due":
		case "addon_status_invalid":
			return {
				icon: <Lock1 size={48} color="#d32f2f" variant="Bulk" />,
				title: "Pago pendiente en tu add-on",
				body: "El pago de MCP Access falló. Actualizá tu método de pago para reactivar la conexión.",
				ctaText: "Actualizar facturación",
				ctaHref: ADDON_SUBSCRIBE_URL,
				ctaIcon: <Card size={18} />,
			};
		default:
			return {
				icon: <Lock1 size={48} color="#757575" variant="Bulk" />,
				title: "No podemos completar la autorización",
				body: "Tu cuenta no cumple los requisitos para conectar esta aplicación. Contactá a soporte si pensás que es un error.",
				ctaText: "Ver planes",
				ctaHref: UPGRADE_URL,
				ctaIcon: <Refresh2 size={18} />,
			};
	}
}

const OauthUpgradeRequiredPage = () => {
	const [searchParams] = useSearchParams();
	const reason = searchParams.get("reason") || "unknown";
	const plan = searchParams.get("plan");
	const challenge = searchParams.get("consent_challenge");

	const [isCancelling, setIsCancelling] = useState(false);
	const [globalError, setGlobalError] = useState<string | null>(null);

	const copy = getCopyForReason(reason, plan);

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
					<Logo />
				</Grid>

				<Grid item xs={12}>
					<Box sx={{ textAlign: "center", py: 2 }}>
						<Stack alignItems="center" spacing={2}>
							{copy.icon}
							<Typography variant="h4">{copy.title}</Typography>
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
						<Button
							variant="contained"
							color="primary"
							size="large"
							href={copy.ctaHref}
							startIcon={copy.ctaIcon}
						>
							{copy.ctaText}
						</Button>
					</Stack>
				</Grid>

				<Grid item xs={12}>
					<Typography variant="caption" color="text.secondary" sx={{ display: "block", textAlign: "center" }}>
						Necesitás ayuda?{" "}
						<a href="mailto:soporte@lawanalytics.app" style={{ color: "inherit" }}>
							Contactá a soporte
						</a>
						.
					</Typography>
				</Grid>
			</Grid>
		</AuthWrapper>
	);
};

export default OauthUpgradeRequiredPage;
